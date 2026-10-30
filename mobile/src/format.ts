/** "38 214,7" — probel ming ajratgich, o'nlik vergul */
export function fmt(v: number | null | undefined, dec = 0): string {
  if (v == null || Number.isNaN(v)) return '—';
  const [i, d] = Math.abs(v).toFixed(dec).split('.');
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  return (v < 0 ? '−' : '') + int + (d ? ',' + d : '');
}
export function fmtCompact(v: number | null | undefined): string {
  if (v == null) return '—';
  const a = Math.abs(v);
  if (a >= 1e6) return fmt(v / 1e6, 1) + ' mlrd';
  if (a >= 1e3) return fmt(v / 1e3, 1) + ' mln';
  return fmt(v, a < 100 ? 1 : 0);
}
export function fmtChange(c: { value: number; kind: 'percent' | 'pp' } | null): string {
  if (!c) return '';
  const arrow = c.value > 0 ? '▲' : c.value < 0 ? '▼' : '■';
  return `${arrow} ${fmt(Math.abs(c.value), 1)}${c.kind === 'pp' ? ' p.p.' : '%'}`;
}
