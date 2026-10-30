import { useEffect, useState } from 'react';
import { SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';

export type Region = { soato: string; name_uz: string; center: string };
export type Indicator = {
  key: string; title: { uz: string }; unit: string; siat_id: number; scope: 'region' | 'country';
  change_kind: 'percent' | 'pp'; topic: string; default: boolean;
};
export type Point = { period: string; value: number; preliminary: number };
export type Company = {
  stir: string; name: string; oked_section: string; soato: string; employees: number; overall: number | null; klass: string;
};
export type CompanyFull = Company & {
  oked_section_name: string; oked_division_name: string; region: string; ownership: string; founded: number;
  revenue_mln: number; net_profit_mln: number; avg_wage_thousand: number; export_thousand_usd: number;
  import_thousand_usd: number; women_share: number; reports_due: number; reports_on_time: number; tax_debt: boolean;
  score: { overall: number | null; klass: string; coverage: number; pillars: Record<string, number | null>; flags: string[] };
};
export type Service = { number: number; sphere_id: number; title: string; web_route: string; prod: string; mobile: string; popular: boolean };
export type ReportRow = { stir: string; form_code: string; period: string; deadline: string; status: string; submitted_at: string | null };

export const ROOT = '1700';

export async function getDoc<T = any>(db: SQLiteDatabase, name: string): Promise<T> {
  const r = await db.getFirstAsync<{ json: string }>('SELECT json FROM doc WHERE name = ?', name);
  return JSON.parse(r!.json);
}
export const getMeta = async (db: SQLiteDatabase) =>
  Object.fromEntries((await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM meta')).map((r) => [r.key, r.value]));
export const getRegions = (db: SQLiteDatabase) =>
  db.getAllAsync<Region>('SELECT soato, name_uz, center FROM region ORDER BY (soato = ?) DESC, name_uz', ROOT);
export async function getIndicators(db: SQLiteDatabase): Promise<Indicator[]> {
  return (await db.getAllAsync<{ json: string }>('SELECT json FROM indicator')).map((r) => JSON.parse(r.json));
}
export const getSeries = (db: SQLiteDatabase, ind: Indicator, soato: string) =>
  db.getAllAsync<Point>(
    'SELECT period, value, preliminary FROM indicator_value WHERE indicator = ? AND soato = ? ORDER BY period',
    ind.key, ind.scope === 'country' ? ROOT : soato,
  );
export const getRanking = (db: SQLiteDatabase, key: string) =>
  db.getAllAsync<{ soato: string; name_uz: string; value: number }>(
    `SELECT v.soato, r.name_uz, v.value FROM indicator_value v JOIN region r ON r.soato = v.soato
     WHERE v.indicator = ? AND v.soato <> ? AND v.period = (SELECT MAX(period) FROM indicator_value WHERE indicator = ?)
     ORDER BY v.value DESC`, key, ROOT, key);

export function changeOf(series: Point[], kind: 'percent' | 'pp') {
  if (series.length < 2) return null;
  const a = series[series.length - 1].value, b = series[series.length - 2].value;
  return { value: kind === 'pp' ? a - b : b ? ((a - b) / b) * 100 : 0, kind };
}

export async function searchCompanies(db: SQLiteDatabase, q: string, klass: string | null, soato: string | null, offset: number) {
  const where: string[] = [], args: (string | number)[] = [];
  const t = q.trim();
  if (/^\d+$/.test(t)) { where.push('stir LIKE ?'); args.push(t + '%'); }
  else if (t) {
    where.push('rowid IN (SELECT rowid FROM company_fts WHERE company_fts MATCH ?)');
    args.push(t.split(/\s+/).map((w) => '"' + w.replace(/"/g, '') + '"*').join(' '));
  }
  if (klass) { where.push('klass = ?'); args.push(klass); }
  if (soato) { where.push('soato = ?'); args.push(soato); }
  return db.getAllAsync<Company>(
    `SELECT stir, name, oked_section, soato, employees, overall, klass FROM company
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY overall DESC, stir LIMIT 50 OFFSET ?`, ...args, offset);
}
export async function getCompany(db: SQLiteDatabase, stir: string): Promise<CompanyFull> {
  const r = await db.getFirstAsync<{ json: string }>('SELECT json FROM company WHERE stir = ?', stir);
  return JSON.parse(r!.json);
}
export const getReports = (db: SQLiteDatabase, stir: string) =>
  db.getAllAsync<ReportRow>('SELECT * FROM report_obligation WHERE stir = ? ORDER BY deadline', stir);

/** Ekranlar SQL ni bilmaydi, faqat shu hook orqali o'qiydi. */
export function useQuery<T>(fn: (db: SQLiteDatabase) => Promise<T>, deps: unknown[]): { data?: T; loading: boolean } {
  const db = useSQLiteContext();
  const [state, set] = useState<{ data?: T; loading: boolean }>({ loading: true });
  useEffect(() => {
    let off = false;
    set((s) => ({ ...s, loading: true }));
    fn(db).then((data) => { if (!off) set({ data, loading: false }); }).catch(() => { if (!off) set({ loading: false }); });
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
