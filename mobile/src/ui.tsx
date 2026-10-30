import React from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { radius, space, useColors } from './theme';
import { Tone } from './domain';

export function Screen({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return <View style={{ flex: 1, backgroundColor: c.bg }}>{children}</View>;
}

export function Card({ children, style, onPress, label }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void; label?: string }) {
  const c = useColors();
  const base: ViewStyle = { backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: space(4), shadowColor: '#0B1B3A', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 };
  if (onPress)
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.8 : 1 }, style]}>
        {children}
      </Pressable>
    );
  return <View style={[base, style]}>{children}</View>;
}

export function H({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return <Text accessibilityRole="header" style={{ color: c.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: space(6), marginBottom: space(2), marginLeft: 2 }}>{children}</Text>;
}
export function Txt({ children, style, numberOfLines }: { children: React.ReactNode; style?: object; numberOfLines?: number }) {
  const c = useColors();
  return <Text numberOfLines={numberOfLines} style={[{ color: c.text, fontSize: 14, lineHeight: 20 }, style]}>{children}</Text>;
}
export function Muted({ children, style }: { children: React.ReactNode; style?: object }) {
  const c = useColors();
  return <Text style={[{ color: c.textMuted, fontSize: 12, lineHeight: 17 }, style]}>{children}</Text>;
}

export function Badge({ text, tone = 'neutral', icon }: { text: string; tone?: Tone; icon?: string }) {
  const c = useColors();
  const map = {
    neutral: [c.border, c.textMuted], warning: [c.warningBg, c.warning], danger: [c.dangerBg, c.danger],
    info: [c.infoBg, c.info], success: [c.successBg, c.success],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: '600' }}>{icon ? icon + ' ' : ''}{text}</Text>
    </View>
  );
}
export const SampleBadge = () => <Badge text="Namuna" tone="warning" />;

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button" accessibilityState={{ selected: !!active }} onPress={onPress}
      style={{ minHeight: 40, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.pill, marginRight: 8,
        backgroundColor: active ? c.primary : c.surface, borderWidth: 1, borderColor: active ? c.primary : c.border }}>
      <Text style={{ color: active ? '#fff' : c.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function Sparkline({ values, w = 90, h = 28 }: { values: number[]; w?: number; h?: number }) {
  const c = useColors();
  if (values.length < 2) return null;
  const mn = Math.min(...values), mx = Math.max(...values), span = mx - mn || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 6) + 3, h - 4 - ((v - mn) / span) * (h - 8)]);
  const last = pts[pts.length - 1];
  return (
    <Svg width={w} height={h} accessible={false}>
      <Polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={c.primary} strokeWidth={2} />
      <Circle cx={last[0]} cy={last[1]} r={3} fill={c.accentStrong} />
    </Svg>
  );
}

export function LineChart({ data, width, height = 180, fmtV }: { data: { label: string; value: number }[]; width: number; height?: number; fmtV: (v: number) => string }) {
  const c = useColors();
  if (data.length < 2) return null;
  const pad = { l: 8, r: 8, t: 20, b: 22 };
  const vs = data.map((d) => d.value), mn = Math.min(...vs), mx = Math.max(...vs), span = mx - mn || 1;
  const x = (i: number) => pad.l + (i / (data.length - 1)) * (width - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - mn) / span) * (height - pad.t - pad.b);
  const last = data.length - 1;
  return (
    <Svg width={width} height={height} accessible={false}>
      {[0, 0.5, 1].map((t) => (
        <Line key={t} x1={pad.l} x2={width - pad.r} y1={pad.t + t * (height - pad.t - pad.b)} y2={pad.t + t * (height - pad.t - pad.b)} stroke={c.border} strokeWidth={1} />
      ))}
      <Polyline points={data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ')} fill="none" stroke={c.primary} strokeWidth={2.5} />
      {data.map((d, i) => (i % 2 === 0 || i === last) ? (
        <SvgText key={d.label} x={x(i)} y={height - 6} fontSize={10} fill={c.textMuted} textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'}>{d.label}</SvgText>
      ) : null)}
      <Circle cx={x(last)} cy={y(data[last].value)} r={5} fill={c.accentStrong} />
      <SvgText x={x(last)} y={y(data[last].value) - 9} fontSize={11} fontWeight="bold" fill={c.text} textAnchor="end">{fmtV(data[last].value)}</SvgText>
    </Svg>
  );
}

export function BarList({ rows, fmtV, highlight }: { rows: { id: string; name: string; value: number }[]; fmtV: (v: number) => string; highlight?: string }) {
  const c = useColors();
  const mx = Math.max(...rows.map((r) => r.value), 1);
  return (
    <View>
      {rows.map((r) => (
        <View key={r.id} style={{ marginBottom: 8 }} accessible accessibilityLabel={`${r.name}: ${fmtV(r.value)}`}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: r.id === highlight ? '700' : '400', flexShrink: 1 }} numberOfLines={1}>{r.name}</Text>
            <Text style={{ color: c.text, fontSize: 13, fontVariant: ['tabular-nums'] }}>{fmtV(r.value)}</Text>
          </View>
          <View style={{ height: 6, backgroundColor: c.border, borderRadius: 3, marginTop: 3 }}>
            <View style={{ height: 6, width: `${(r.value / mx) * 100}%`, borderRadius: 3, backgroundColor: r.id === highlight ? c.accentStrong : c.primary }} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function Delta({ text, down }: { text: string; down?: boolean }) {
  const c = useColors();
  if (!text) return null;
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: down ? c.dangerBg : c.successBg, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ color: down ? c.danger : c.success, fontSize: 11, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

export function ScoreRing({ value, label, size = 48, stroke = 5, color }: { value: number | null; label?: string; size?: number; stroke?: number; color: string }) {
  const c = useColors();
  const r = (size - stroke) / 2, len = 2 * Math.PI * r, frac = Math.max(0, Math.min(1, (value ?? 0) / 100));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessible accessibilityLabel={`Ball ${value == null ? "yo'q" : Math.round(value)}${label ? ', sinf ' + label : ''}`}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.border} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${len * frac} ${len}`} rotation={-90} originX={size / 2} originY={size / 2} />
      </Svg>
      <Text style={{ color: c.text, fontSize: size * 0.32, fontWeight: '800' }}>{value == null ? '—' : Math.round(value)}</Text>
    </View>
  );
}
