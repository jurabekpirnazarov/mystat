import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { Company, getCompany, getDoc, getRegions, searchCompanies, useQuery } from '../data';
import { fmt } from '../format';
import { useColors } from '../theme';
import { Badge, Card, Chip, H, Muted, SampleBadge, Screen, ScoreRing, Txt } from '../ui';

const KLASS = ['A', 'B', 'C', 'D', 'E'];
const useKlassColor = () => {
  const c = useColors();
  return (k: string) => (k === 'A' || k === 'B' ? c.success : k === 'C' ? c.primary : k === 'D' ? c.accentStrong : k === 'E' ? c.danger : c.textMuted);
};
const klassTone = (k: string) => (k === 'A' || k === 'B' ? 'success' : k === 'C' ? 'info' : k === 'D' ? 'warning' : k === 'E' ? 'danger' : 'neutral') as any;

export function CompanyList() {
  const c = useColors();
  const db = useSQLiteContext();
  const nav = useNavigation<any>();
  const [q, setQ] = useState('');
  const [klass, setKlass] = useState<string | null>(null);
  const [soato, setSoato] = useState<string | null>(null);
  const [rows, setRows] = useState<Company[]>([]);
  const [more, setMore] = useState(true);
  const busy = useRef(false);
  const kc = useKlassColor();
  const regions = (useQuery(getRegions, []).data ?? []).filter((r) => r.soato !== '1700');

  const load = async (reset: boolean, qq = q) => {
    if (busy.current) return;
    busy.current = true;
    const page = await searchCompanies(db, qq, klass, soato, reset ? 0 : rows.length);
    setRows((p) => (reset ? page : [...p, ...page]));
    setMore(page.length === 50);
    busy.current = false;
  };
  useEffect(() => {
    const t = setTimeout(() => { busy.current = false; load(true).catch(() => { busy.current = false; }); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, klass, soato]);

  return (
    <Screen>
      <View style={{ padding: 12, paddingBottom: 4 }}>
        <TextInput value={q} onChangeText={setQ} placeholder="STIR yoki nom bo'yicha qidirish" placeholderTextColor={c.textMuted}
          accessibilityLabel="Korxona qidirish" autoCorrect={false}
          style={{ minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, color: c.text, paddingHorizontal: 14, fontSize: 15 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <Chip label="Barcha sinf" active={!klass} onPress={() => setKlass(null)} />
          {KLASS.map((k) => <Chip key={k} label={`Sinf ${k}`} active={klass === k} onPress={() => setKlass(klass === k ? null : k)} />)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
          <Chip label="Barcha hudud" active={!soato} onPress={() => setSoato(null)} />
          {regions.map((r) => <Chip key={r.soato} label={r.name_uz} active={soato === r.soato} onPress={() => setSoato(soato === r.soato ? null : r.soato)} />)}
        </ScrollView>
        <View style={{ flexDirection: 'row', marginTop: 6 }}><SampleBadge /><Muted style={{ marginLeft: 8, alignSelf: 'center' }}>3000 ta sintetik korxona</Muted></View>
      </View>
      <FlatList data={rows} keyExtractor={(r) => r.stir} contentContainerStyle={{ padding: 12 }}
        onEndReached={() => more && load(false)} onEndReachedThreshold={0.5}
        ListEmptyComponent={<Muted style={{ textAlign: 'center', marginTop: 32 }}>Hech narsa topilmadi</Muted>}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 8, minHeight: 64 }} onPress={() => nav.navigate('Company', { stir: item.stir })} label={item.name}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Txt style={{ fontWeight: '600' }} numberOfLines={2}>{item.name}</Txt>
                <Muted>STIR {item.stir} · {item.employees} xodim · sinf {item.klass}</Muted>
              </View>
              <ScoreRing value={item.overall} label={item.klass} color={kc(item.klass)} />
            </View>
          </Card>
        )} />
    </Screen>
  );
}

export function CompanyDetail() {
  const c = useColors();
  const kc = useKlassColor();
  const { stir } = useRoute<any>().params;
  const { data } = useQuery(async (db) => ({ co: await getCompany(db, stir), meta: await getDoc(db, 'scoring_meta') }), [stir]);
  if (!data) return <Screen><ActivityIndicator color={c.primary} style={{ marginTop: 40 }} /></Screen>;
  const { co, meta } = data;
  const s = co.score;
  const cov = s.coverage < meta.min_coverage ? "Ma'lumot yetarli emas" : s.coverage < meta.partial_coverage ? "Qisman ma'lumot" : null;
  const klassLabel = meta.classes.find((k: any) => k.klass === s.klass)?.label;
  const Row = ({ k, v }: { k: string; v: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}><Muted>{k}</Muted><Txt style={{ fontVariant: ['tabular-nums'] }}>{v}</Txt></View>
  );
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Txt style={{ fontSize: 20, fontWeight: '700' }}>{co.name}</Txt>
        <Muted>STIR {co.stir} · {co.oked_division_name} · {co.region} · {co.founded}-yildan</Muted>
        <Card style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ScoreRing value={s.overall} label={s.klass} size={84} stroke={9} color={kc(s.klass)} />
            <View style={{ marginLeft: 16, gap: 6 }}>
              <Badge text={`Sinf ${s.klass}${klassLabel ? ' · ' + klassLabel : ''}`} tone={klassTone(s.klass)} />
              <Muted>To'liqlik {fmt(s.coverage * 100, 0)}%</Muted>
              {cov && <Badge text={cov} tone="warning" />}
            </View>
          </View>
          <Muted style={{ marginTop: 8 }}>{meta.disclaimer}</Muted>
        </Card>
        <H>Ustunlar</H>
        <Card>
          {Object.entries(meta.pillars).map(([k, name]) => {
            const v = s.pillars[k];
            return (
              <View key={k} style={{ marginBottom: 8 }} accessible accessibilityLabel={`${name}: ${v == null ? "ma'lumot yo'q" : fmt(v, 0)}`}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt style={{ fontSize: 13 }}>{name as string}</Txt><Txt style={{ fontSize: 13 }}>{v == null ? "ma'lumot yo'q" : fmt(v, 0)}</Txt>
                </View>
                <View style={{ height: 6, backgroundColor: c.border, borderRadius: 3, marginTop: 3 }}>
                  <View style={{ height: 6, width: `${v ?? 0}%`, backgroundColor: c.primary, borderRadius: 3 }} />
                </View>
              </View>
            );
          })}
        </Card>
        {s.flags.length > 0 && (<><H>Bayroqlar</H><Card>{s.flags.map((f) => <Txt key={f} style={{ color: c.warning }}>⚠ {meta.flags[f] ?? f}</Txt>)}</Card></>)}
        <H>Asosiy raqamlar</H>
        <Card>
          <Row k="Xodimlar" v={fmt(co.employees)} />
          <Row k="Tushum, mln so'm" v={fmt(co.revenue_mln, 1)} />
          <Row k="Sof foyda, mln so'm" v={fmt(co.net_profit_mln, 1)} />
          <Row k="O'rtacha ish haqi, ming so'm" v={fmt(co.avg_wage_thousand, 0)} />
          <Row k="Eksport, ming $" v={fmt(co.export_thousand_usd, 1)} />
          <Row k="Ayollar ulushi" v={fmt(co.women_share * 100, 0) + '%'} />
          <Row k="Hisobot intizomi" v={`${co.reports_due} dan ${co.reports_on_time} o'z vaqtida`} />
          <Row k="Mulk shakli" v={co.ownership} />
        </Card>
        <Muted style={{ marginTop: 12 }}>Namuna ma'lumot: [DEMO] korxona, haqiqiy emas.</Muted>
      </ScrollView>
    </Screen>
  );
}
