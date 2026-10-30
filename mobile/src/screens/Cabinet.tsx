import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { getDoc, getReports, useQuery } from '../data';
import { computeStatus, daysLeft, ReportStatus, STATUS_LABEL, todayStr } from '../domain';
import { fmt } from '../format';
import { useColors } from '../theme';
import { Badge, Card, Chip, H, Muted, Screen, Txt } from '../ui';

export default function Cabinet() {
  const c = useColors();
  const user = useQuery((db) => getDoc(db, 'demo_user'), []).data;
  const forms = useQuery(async (db) => (await getDoc(db, 'report_forms')).items as { code: string; name: string }[], []).data ?? [];
  const notes = useQuery(async (db) => (await getDoc(db, 'notifications')).items as { id: number; title: string; body: string; created_at: string }[], []).data ?? [];
  const [idx, setIdx] = useState(0);
  const [filter, setFilter] = useState<ReportStatus | null>(null);
  const stir = user?.organizations[idx]?.stir;
  const rep = useQuery((db) => (stir ? getReports(db, stir) : Promise.resolve([])), [stir]);

  if (!user) return <Screen><ActivityIndicator color={c.primary} style={{ marginTop: 40 }} /></Screen>;
  const today = todayStr();
  const rows = (rep.data ?? []).map((r) => ({ ...r, st: computeStatus(r, today), left: daysLeft(r.deadline, today) }));
  const cnt = (s: ReportStatus) => rows.filter((r) => r.st === s).length;
  const shown = rows.filter((r) => !filter || r.st === filter)
    .sort((a, b) => (a.st === 'submitted' ? 1 : 0) - (b.st === 'submitted' ? 1 : 0) || a.deadline.localeCompare(b.deadline))
    .slice(0, 60);

  const Kpi = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
    <View style={{ width: '50%', padding: 4 }}>
      <Card><Muted>{label}</Muted><Txt style={{ fontSize: 22, fontWeight: '700', color: tone ?? c.text }}>{value}</Txt></Card>
    </View>
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Badge text="Demo rejim: namuna ma'lumot, haqiqiy kirish yo'q" tone="warning" />
        <Txt style={{ fontSize: 20, fontWeight: '700', marginTop: 10 }}>{user.full_name}</Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {user.organizations.map((o: any, i: number) => (
            <Chip key={o.stir} label={o.name.replace('[DEMO] ', '')} active={i === idx} onPress={() => { setIdx(i); setFilter(null); }} />
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginTop: 8 }}>
          <Kpi label="Muddati yaqin" value={String(cnt('due_soon'))} tone={cnt('due_soon') ? c.warning : undefined} />
          <Kpi label="Muddati o'tgan" value={String(cnt('overdue'))} tone={cnt('overdue') ? c.danger : undefined} />
          <Kpi label="Paket limiti" value={`${user.active_package.orginfo_left}`} />
          <Kpi label="Hamyon (so'm)" value={fmt(user.statcoin_balance)} />
        </View>

        <H>Hisobotlarim</H>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <Chip label="Hammasi" active={!filter} onPress={() => setFilter(null)} />
          {(Object.keys(STATUS_LABEL) as ReportStatus[]).map((s) => <Chip key={s} label={STATUS_LABEL[s].label} active={filter === s} onPress={() => setFilter(filter === s ? null : s)} />)}
        </ScrollView>
        {shown.map((r) => {
          const st = STATUS_LABEL[r.st];
          return (
            <Card key={r.form_code + r.period} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Txt style={{ fontWeight: '700' }}>{r.form_code} · {r.period}</Txt>
                <Badge text={st.label} tone={st.tone} icon={st.icon} />
              </View>
              <Muted>{forms.find((f) => f.code === r.form_code)?.name}</Muted>
              <Muted style={{ marginTop: 4 }}>
                Muddat: {r.deadline}
                {r.st === 'submitted' ? ` · topshirilgan ${r.submitted_at ?? ''}` : r.left >= 0 ? ` · ${r.left} kun qoldi` : ` · ${-r.left} kun o'tdi`}
              </Muted>
            </Card>
          );
        })}
        {shown.length === 0 && <Muted>Mos hisobot yo'q</Muted>}

        <H>Xabarnomalar</H>
        {notes.map((n) => (
          <Card key={n.id} style={{ marginBottom: 8 }}>
            <Txt style={{ fontWeight: '600' }}>{n.title}</Txt><Muted>{n.body}</Muted>
          </Card>
        ))}
        <Muted style={{ marginTop: 12 }}>Hisobot topshirish ilovada yo'q: my.stat.uz saytida. Bu yerda faqat muddat va holat.</Muted>
      </ScrollView>
    </Screen>
  );
}
