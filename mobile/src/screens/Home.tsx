import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { changeOf, getDoc, getIndicators, getRanking, getRegions, getSeries, Indicator, Service, useQuery } from '../data';
import { fmt, fmtChange } from '../format';
import { IconChevron } from '../icons';
import { WeatherIcon } from '../icons';
import { useRegion } from '../region';
import { useColors } from '../theme';
import { BarList, Card, Delta, H, Muted, Screen, Sparkline, Txt } from '../ui';

const HOME_KEYS = ['population', 'gdp_growth', 'inflation', 'unemployment'];

export default function Home() {
  const c = useColors();
  const nav = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { soato, setSoato } = useRegion();
  const [pick, setPick] = useState(false);
  const regions = useQuery(getRegions, []).data ?? [];
  const region = regions.find((r) => r.soato === soato);
  const sparkW = (width - 32 - 12) / 2 - 34;

  const cards = useQuery(async (db) => {
    const all = await getIndicators(db);
    const out = [];
    for (const k of HOME_KEYS) {
      const ind = all.find((i) => i.key === k) as Indicator;
      const s = await getSeries(db, ind, soato);
      out.push({ ind, last: s[s.length - 1], change: changeOf(s, ind.change_kind), spark: s.slice(-10).map((p) => p.value) });
    }
    return out;
  }, [soato]);
  const rank = useQuery((db) => getRanking(db, 'population'), []);
  const wx = useQuery(async (db) => {
    const w = await getDoc(db, 'weather');
    return (w.items.find((i: any) => i.soato === soato) ?? w.items.find((i: any) => i.soato === '1700')) as any;
  }, [soato]);
  const popular = useQuery(async (db) => {
    const s = await getDoc(db, 'services');
    return (s.popular_order as number[]).slice(0, 6).map((n) => s.items.find((i: Service) => i.number === n) as Service);
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 }}>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>O'zbekiston raqamlarda</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: c.text, fontSize: 28, fontWeight: '800', flexShrink: 1 }} numberOfLines={1}>{region?.name_uz ?? 'Respublika'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Hududni o'zgartirish" onPress={() => setPick(true)}
              style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 999, backgroundColor: c.primarySoft, justifyContent: 'center', marginLeft: 8 }}>
              <Text style={{ color: c.primary, fontWeight: '700', fontSize: 13 }}>O'zgartirish</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: 10 }}>
          {cards.loading && !cards.data ? <ActivityIndicator color={c.primary} style={{ marginTop: 24 }} /> : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {cards.data?.map(({ ind, last, change, spark }) => (
                <View key={ind.key} style={{ width: '50%', padding: 6 }}>
                  <Card onPress={() => nav.navigate("Ko'rsatkichlar", { screen: 'Indicator', params: { key: ind.key } })}
                    label={`${ind.title.uz}: ${fmt(last.value, 1)} ${ind.unit}`} style={{ padding: 14 }}>
                    <Text numberOfLines={2} style={{ color: c.textMuted, fontSize: 12, minHeight: 32 }}>{ind.title.uz}</Text>
                    <Text style={{ color: c.text, fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'], marginTop: 2 }}>{fmt(last.value, 1)}</Text>
                    <Muted>{ind.unit}{last.preliminary ? ' · dastlabki' : ''}</Muted>
                    <View style={{ marginTop: 8 }}><Delta text={fmtChange(change)} down={!!change && change.value < 0} /></View>
                    <View style={{ marginTop: 8 }}><Sparkline values={spark} w={sparkW} h={32} /></View>
                  </Card>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {wx.data && (
            <Card style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
              <WeatherIcon code={wx.data.current.code} size={44} color={c.textMuted} accent={c.accentStrong} />
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>{fmt(wx.data.current.temp, 0)}° <Text style={{ fontSize: 14, fontWeight: '600', color: c.textMuted }}>{wx.data.city}</Text></Text>
                <Muted>Namlik {wx.data.current.humidity}% · shamol {fmt(wx.data.current.wind_ms, 1)} m/s</Muted>
              </View>
              <View style={{ flexDirection: 'row' }}>
                {wx.data.daily.map((d: any) => (
                  <View key={d.date} style={{ alignItems: 'center', marginLeft: 10 }}>
                    <Muted>{d.date.slice(8)}</Muted>
                    <WeatherIcon code={d.code} size={22} color={c.textMuted} accent={c.accentStrong} />
                    <Muted>{d.t_max}°</Muted>
                  </View>
                ))}
              </View>
            </Card>
          )}

          <H>Hududlar reytingi · aholi</H>
          <Card>
            {rank.data && <BarList highlight={soato} fmtV={(v) => fmt(v, 1)} rows={rank.data.map((r) => ({ id: r.soato, name: r.name_uz, value: r.value }))} />}
            <Muted>ming kishi</Muted>
          </Card>

          <H>Ommabop xizmatlar</H>
          <Card style={{ padding: 4 }}>
            {popular.data?.map((s, i) => (
              <Pressable key={s.number} accessibilityRole="button" accessibilityLabel={s.title}
                onPress={() => nav.navigate('Xizmatlar', { screen: 'Service', params: { number: s.number } })}
                style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}>
                <View style={{ backgroundColor: c.primarySoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 12 }}>
                  <Text style={{ color: c.primary, fontWeight: '700', fontSize: 12 }}>#{s.number}</Text>
                </View>
                <Txt style={{ flex: 1 }} numberOfLines={1}>{s.title}</Txt>
                <IconChevron color={c.textMuted} />
              </Pressable>
            ))}
          </Card>
          <Muted style={{ marginTop: 14, textAlign: 'center' }}>Sintetik namuna ma'lumot · rasmiy statistika emas</Muted>
        </View>
      </ScrollView>

      <Modal visible={pick} animationType="slide" transparent onRequestClose={() => setPick(false)}>
        <Pressable style={{ flex: 1, backgroundColor: '#0008' }} onPress={() => setPick(false)} />
        <View style={{ maxHeight: '65%', backgroundColor: c.surface, padding: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 8 }} />
          <FlatList data={regions} keyExtractor={(r) => r.soato} renderItem={({ item }) => (
            <Pressable accessibilityRole="button" onPress={() => { setSoato(item.soato); setPick(false); }}
              style={{ minHeight: 50, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, backgroundColor: item.soato === soato ? c.primarySoft : 'transparent' }}>
              <Text style={{ color: item.soato === soato ? c.primary : c.text, fontSize: 16, fontWeight: item.soato === soato ? '700' : '400' }}>{item.name_uz}</Text>
            </Pressable>
          )} />
        </View>
      </Modal>
    </Screen>
  );
}
