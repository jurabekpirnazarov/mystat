import React from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { changeOf, getIndicators, getRanking, getSeries, Indicator, useQuery } from '../data';
import { fmt, fmtChange } from '../format';
import { useRegion } from '../region';
import { useColors } from '../theme';
import { BarList, Card, H, Muted, SampleBadge, Screen, Sparkline, Txt } from '../ui';

export function IndicatorList() {
  const c = useColors();
  const nav = useNavigation<any>();
  const { soato } = useRegion();
  const { data, loading } = useQuery(async (db) => {
    const all = await getIndicators(db);
    return Promise.all(all.map(async (ind) => {
      const s = await getSeries(db, ind, soato);
      return { ind, last: s[s.length - 1], change: changeOf(s, ind.change_kind), spark: s.map((p) => p.value) };
    }));
  }, [soato]);
  if (loading && !data) return <Screen><ActivityIndicator color={c.primary} style={{ marginTop: 40 }} /></Screen>;
  return (
    <Screen>
      <FlatList contentContainerStyle={{ padding: 16 }} data={data} keyExtractor={(i) => i.ind.key}
        ListHeaderComponent={<View style={{ marginBottom: 8 }}><SampleBadge /></View>}
        renderItem={({ item: { ind, last, change, spark } }) => (
          <Card style={{ marginBottom: 10 }} onPress={() => nav.navigate('Indicator', { key: ind.key })}
            label={`${ind.title.uz}: ${fmt(last.value, 1)} ${ind.unit}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontWeight: '600' }}>{ind.title.uz}</Txt>
                <Text style={{ color: c.text, fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{fmt(last.value, 1)} <Text style={{ fontSize: 12, color: c.textMuted, fontWeight: '400' }}>{ind.unit}</Text></Text>
                <Text style={{ color: change && change.value < 0 ? c.danger : c.success, fontSize: 12 }}>{fmtChange(change)}</Text>
              </View>
              <Sparkline values={spark} />
            </View>
          </Card>
        )} />
    </Screen>
  );
}

export function IndicatorDetail() {
  const c = useColors();
  const { key } = useRoute<any>().params;
  const { soato } = useRegion();
  const { width } = useWindowDimensions();
  const { data } = useQuery(async (db) => {
    const ind = (await getIndicators(db)).find((i) => i.key === key) as Indicator;
    return { ind, series: await getSeries(db, ind, soato), rank: ind.scope === 'region' ? await getRanking(db, key) : [] };
  }, [key, soato]);
  if (!data) return <Screen><ActivityIndicator color={c.primary} style={{ marginTop: 40 }} /></Screen>;
  const { ind, series, rank } = data;
  const last = series[series.length - 1];
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Txt style={{ fontSize: 22, fontWeight: '700' }}>{ind.title.uz}</Txt>
        <Muted>{ind.scope === 'country' ? 'Respublika bo\'yicha' : 'Tanlangan hudud'} · {last.period}{last.preliminary ? ' (dastlabki)' : ''}</Muted>
        <Text style={{ color: c.text, fontSize: 32, fontWeight: '700', marginVertical: 8, fontVariant: ['tabular-nums'] }}>{fmt(last.value, 1)} <Text style={{ fontSize: 14, color: c.textMuted }}>{ind.unit}</Text></Text>
        <Card>
          <LineChartBox series={series} width={width - 32 - 32} />
        </Card>
        <H>Yillar bo'yicha</H>
        <Card>
          {[...series].reverse().map((p) => (
            <View key={p.period} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Txt>{p.period}{p.preliminary ? ' · dastlabki' : ''}</Txt>
              <Txt style={{ fontVariant: ['tabular-nums'] }}>{fmt(p.value, 1)}</Txt>
            </View>
          ))}
        </Card>
        {rank.length > 0 && (<>
          <H>Hududlar reytingi</H>
          <Card><BarList highlight={soato} fmtV={(v) => fmt(v, 1)} rows={rank.map((r) => ({ id: r.soato, name: r.name_uz, value: r.value }))} /></Card>
        </>)}
        <Muted style={{ marginTop: 12 }}>Manba: SIAT {ind.siat_id} · sintetik namuna ma'lumot</Muted>
      </ScrollView>
    </Screen>
  );
}

import { LineChart } from '../ui';
function LineChartBox({ series, width }: { series: { period: string; value: number }[]; width: number }) {
  return <LineChart width={width} data={series.map((p) => ({ label: p.period, value: p.value }))} fmtV={(v) => fmt(v, 1)} />;
}
