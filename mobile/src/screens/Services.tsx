import React, { useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getDoc, Service, useQuery } from '../data';
import { useColors } from '../theme';
import { Badge, Card, H, Muted, Screen, Txt } from '../ui';
import { IconChevron } from '../icons';

const WEB = 'https://my.stat.uz';
const useCatalog = () =>
  useQuery(async (db) => {
    const s = await getDoc(db, 'services');
    const items = (s.items as Service[]).filter((i) => i.prod !== 'hidden');
    return { spheres: s.spheres as { id: number; title: string }[], items, popular: (s.popular_order as number[]).map((n) => items.find((i) => i.number === n)).filter(Boolean) as Service[] };
  }, []);

function Row({ s }: { s: Service }) {
  const c = useColors();
  const nav = useNavigation<any>();
  return (
    <Card style={{ marginBottom: 8, minHeight: 56, justifyContent: 'center' }} onPress={() => nav.navigate('Service', { number: s.number })} label={s.title}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ backgroundColor: c.primarySoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 12 }}>
          <Txt style={{ color: c.primary, fontWeight: '700', fontSize: 12 }}>#{s.number}</Txt>
        </View>
        <Txt style={{ flex: 1 }} numberOfLines={2}>{s.title}</Txt>
        <IconChevron color={c.textMuted} />
      </View>
    </Card>
  );
}

export function ServiceHome() {
  const c = useColors();
  const nav = useNavigation<any>();
  const [q, setQ] = useState('');
  const { data } = useCatalog();
  if (!data) return <Screen><ActivityIndicator color={c.primary} style={{ marginTop: 40 }} /></Screen>;
  const t = q.trim().replace('#', '').toLowerCase();
  const found = t ? data.items.filter((i) => String(i.number) === t || i.title.toLowerCase().includes(t)) : null;
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <TextInput value={q} onChangeText={setQ} placeholder="Xizmat nomi yoki raqami (#302)" placeholderTextColor={c.textMuted} accessibilityLabel="Xizmat qidirish"
          style={{ minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, color: c.text, paddingHorizontal: 14, fontSize: 15 }} />
        {found ? (<>
          <H>Natija: {found.length}</H>
          {found.map((s) => <Row key={s.number} s={s} />)}
        </>) : (<>
          <H>Ommabop</H>
          {data.popular.map((s) => <Row key={s.number} s={s} />)}
          <H>Sohalar</H>
          {data.spheres.map((sp) => (
            <Card key={sp.id} style={{ marginBottom: 8, minHeight: 56, justifyContent: 'center' }} onPress={() => nav.navigate('Sphere', { id: sp.id })} label={sp.title}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Txt style={{ fontWeight: '600' }}>{sp.title}</Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}><Muted>{data.items.filter((i) => i.sphere_id === sp.id).length} ta  </Muted><IconChevron color={c.textMuted} /></View>
              </View>
            </Card>
          ))}
        </>)}
      </ScrollView>
    </Screen>
  );
}

export function SphereScreen() {
  const { id } = useRoute<any>().params;
  const { data } = useCatalog();
  const c = useColors();
  if (!data) return <Screen><ActivityIndicator color={c.primary} style={{ marginTop: 40 }} /></Screen>;
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Txt style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>{data.spheres.find((s) => s.id === id)?.title}</Txt>
        {data.items.filter((i) => i.sphere_id === id).map((s) => <Row key={s.number} s={s} />)}
      </ScrollView>
    </Screen>
  );
}

/** mobile=offline xizmat → ilova ichidagi tab; qolganlari veb saytda */
const IN_APP: Record<number, [string, object | undefined]> = {
  101: ['Korxonalar', undefined], 401: ['Korxonalar', undefined],
  201: ['Kabinet', undefined], 601: ['Ko\'rsatkichlar', undefined], 602: ['Ko\'rsatkichlar', undefined],
};

export function ServiceDetail() {
  const c = useColors();
  const nav = useNavigation<any>();
  const { number } = useRoute<any>().params;
  const { data } = useCatalog();
  if (!data) return <Screen><ActivityIndicator color={c.primary} style={{ marginTop: 40 }} /></Screen>;
  const s = data.items.find((i) => i.number === number);
  if (!s) return <Screen><Muted style={{ margin: 16 }}>Xizmat topilmadi</Muted></Screen>;
  const inApp = s.mobile === 'offline' ? IN_APP[s.number] : undefined;
  const Btn = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Card onPress={onPress} label={label} style={{ backgroundColor: c.primary, borderColor: c.primary, minHeight: 48, justifyContent: 'center', marginTop: 16 }}>
      <Txt style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>{label}</Txt>
    </Card>
  );
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Muted>Xizmat #{s.number} · {data.spheres.find((x) => x.id === s.sphere_id)?.title}</Muted>
        <Txt style={{ fontSize: 22, fontWeight: '700', marginVertical: 6 }}>{s.title}</Txt>
        <Badge text={inApp ? 'Ilovada mavjud' : 'Veb saytda'} tone={inApp ? 'success' : 'info'} />
        <Muted style={{ marginTop: 12 }}>
          {inApp ? "Bu xizmatning namuna ko'rinishi ilovaning ichida bor." : "Bu xizmat my.stat.uz veb saytida. Ochish uchun internet kerak."}
        </Muted>
        {inApp ? <Btn label="Ochish" onPress={() => nav.getParent()?.navigate(inApp[0])} />
          : <Btn label="Veb saytda ochish" onPress={() => Linking.openURL(WEB + s.web_route).catch(() => {})} />}
      </ScrollView>
    </Screen>
  );
}
