/**
 * BOSH_SAHIFA_VIDJETLAR 3.3, 4, 6.2: bosh sahifa vidjetlari katalogi, hududlar va sozlamalar sxemasi.
 * Ma'lumot manbalari mavjud: SIAT karta API'si (`/common/map/*`) va `fetchDashboards` — yangi sintetik ma'lumot yo'q.
 */
export const REPUBLIC = "1700";

export interface HomeRegion {
  soato: string;
  uz: string;
  ru: string;
}

/** 14 hudud + Respublika (SOATO). Nomlar `Territory` API'si bilan bir xil kodlarda. */
export const HOME_REGIONS: HomeRegion[] = [
  { soato: REPUBLIC, uz: "Respublika", ru: "Республика" },
  { soato: "1735", uz: "Qoraqalpog'iston Respublikasi", ru: "Республика Каракалпакстан" },
  { soato: "1703", uz: "Andijon viloyati", ru: "Андижанская область" },
  { soato: "1706", uz: "Buxoro viloyati", ru: "Бухарская область" },
  { soato: "1708", uz: "Jizzax viloyati", ru: "Джизакская область" },
  { soato: "1710", uz: "Qashqadaryo viloyati", ru: "Кашкадарьинская область" },
  { soato: "1712", uz: "Navoiy viloyati", ru: "Навоийская область" },
  { soato: "1714", uz: "Namangan viloyati", ru: "Наманганская область" },
  { soato: "1718", uz: "Samarqand viloyati", ru: "Самаркандская область" },
  { soato: "1722", uz: "Surxondaryo viloyati", ru: "Сурхандарьинская область" },
  { soato: "1724", uz: "Sirdaryo viloyati", ru: "Сырдарьинская область" },
  { soato: "1726", uz: "Toshkent shahri", ru: "город Ташкент" },
  { soato: "1727", uz: "Toshkent viloyati", ru: "Ташкентская область" },
  { soato: "1730", uz: "Farg'ona viloyati", ru: "Ферганская область" },
  { soato: "1733", uz: "Xorazm viloyati", ru: "Хорезмская область" },
];

export type HomeCardKey = "population" | "gdp_growth" | "unemployment" | "wage" | "gdp_per_capita" | "grp" | "informal" | "pop_growth";

export interface HomeCardDef {
  key: HomeCardKey;
  /** SIAT ko'rsatkich kaliti (dashboard va hudud kartochkasida bir xil) */
  siat: string;
  uz: string;
  ru: string;
  unit: { uz: string; ru: string };
  /** `pct` — o'tgan yilga %, `pp` — foiz punkti (ko'rsatkichning o'zi foizda) */
  change: "pct" | "pp";
  /** O'sish yaxshimi (rang uchun); null — neytral */
  better: boolean | null;
  /** Hudud kesimi bor (karta ko'rsatkichi bo'la oladi) */
  regional: boolean;
  /** Qiymatni ko'rsatish: manba birligidan o'qiladigan matnga */
  format: (v: number) => string;
}

const nf = (d: number) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: d, minimumFractionDigits: 0 });
const grouped = (v: number) => nf(0).format(Math.round(v));
const dec = (v: number, d = 1) => nf(d).format(v);

export const HOME_CARDS: HomeCardDef[] = [
  {
    key: "population", siat: "246", uz: "Doimiy aholi soni", ru: "Постоянное население", unit: { uz: "yil boshiga, rasmiy", ru: "на начало года" },
    change: "pct", better: null, regional: true,
    format: (v) => (v >= 1000 ? `${dec(v / 1000, 2)} mln` : `${grouped(v)} ming`),
  },
  {
    key: "gdp_growth", siat: "658", uz: "YaIM o'sish sur'ati", ru: "Темп роста ВВП", unit: { uz: "o'tgan yilga nisbatan", ru: "к прошлому году" },
    change: "pp", better: true, regional: true, format: (v) => `${dec(v - 100)} %`,
  },
  {
    key: "unemployment", siat: "1875", uz: "Ishsizlik darajasi", ru: "Уровень безработицы", unit: { uz: "mehnat resurslariga nisbatan", ru: "к рабочей силе" },
    change: "pp", better: false, regional: true, format: (v) => `${dec(v)} %`,
  },
  {
    key: "wage", siat: "500", uz: "O'rtacha oylik ish haqi", ru: "Средняя заработная плата", unit: { uz: "so'm", ru: "сум" },
    change: "pct", better: true, regional: true, format: grouped,
  },
  {
    key: "gdp_per_capita", siat: "660", uz: "Aholi jon boshiga YaIM", ru: "ВВП на душу населения", unit: { uz: "ming so'm, joriy narxlarda", ru: "тыс. сум, в текущих ценах" },
    change: "pct", better: true, regional: true, format: grouped,
  },
  {
    key: "grp", siat: "1299", uz: "Yalpi hududiy mahsulot", ru: "Валовой региональный продукт", unit: { uz: "joriy narxlarda", ru: "в текущих ценах" },
    change: "pct", better: true, regional: true,
    format: (v) => (v >= 1e6 ? `${dec(v / 1e6, 2)} trln so'm` : `${grouped(v)} mlrd so'm`),
  },
  {
    key: "informal", siat: "3846", uz: "Norasmiy iqtisodiyot ulushi", ru: "Доля неформальной экономики", unit: { uz: "YaIMda, %", ru: "в ВВП, %" },
    change: "pp", better: false, regional: true, format: (v) => `${dec(v)} %`,
  },
  {
    key: "pop_growth", siat: "d-pop-growth", uz: "Aholi o'sishi", ru: "Прирост населения", unit: { uz: "yillik, %", ru: "годовой, %" },
    change: "pp", better: null, regional: false, format: (v) => `${dec(v, 2)} %`,
  },
];

export const CARD_BY_KEY = new Map(HOME_CARDS.map((c) => [c.key, c]));

export type WidgetKey = "map" | "weather";

export interface HomeLayout {
  version: 1;
  region: string;
  widgets: { key: WidgetKey; enabled: boolean }[];
  cards: { key: HomeCardKey; enabled: boolean }[];
  map: { indicator: HomeCardKey };
  weather: { forecast: boolean };
}

export const MIN_CARDS = 4;
export const MAX_CARDS = HOME_CARDS.length;
const DEFAULT_ON: HomeCardKey[] = ["population", "gdp_growth", "unemployment", "wage"];

export const DEFAULT_LAYOUT: HomeLayout = {
  version: 1,
  region: REPUBLIC,
  widgets: [{ key: "map", enabled: true }, { key: "weather", enabled: true }],
  cards: [...DEFAULT_ON, ...HOME_CARDS.map((c) => c.key).filter((k) => !DEFAULT_ON.includes(k))].map((key) => ({ key, enabled: DEFAULT_ON.includes(key) })),
  map: { indicator: "population" },
  weather: { forecast: true },
};

const isRegion = (v: unknown): v is string => typeof v === "string" && HOME_REGIONS.some((r) => r.soato === v);

/**
 * Saqlangan/URL'dan kelgan sozlamani tekshiradi: noma'lum kalitlar tashlanadi, yetishmaganlari standartdan to'ldiriladi,
 * kamida 4 ta kartochka yoqilgan bo'ladi. Eski `version` yoki buzilgan qiymat — standart.
 */
export function normalizeLayout(raw: unknown): HomeLayout {
  const d = DEFAULT_LAYOUT;
  const r = raw as Partial<HomeLayout> | null;
  if (!r || typeof r !== "object" || r.version !== 1) return d;

  const widgets = (Array.isArray(r.widgets) ? r.widgets : []).filter((w, i, a) => (w?.key === "map" || w?.key === "weather") && a.findIndex((x) => x?.key === w.key) === i)
    .map((w) => ({ key: w.key, enabled: w.enabled !== false }));
  for (const w of d.widgets) if (!widgets.some((x) => x.key === w.key)) widgets.push({ ...w });

  const cards = (Array.isArray(r.cards) ? r.cards : []).filter((c, i, a) => CARD_BY_KEY.has(c?.key as HomeCardKey) && a.findIndex((x) => x?.key === c.key) === i)
    .map((c) => ({ key: c.key, enabled: !!c.enabled }));
  for (const c of d.cards) if (!cards.some((x) => x.key === c.key)) cards.push({ key: c.key, enabled: false });
  // Kamida MIN_CARDS ta yoqilgan: yetmasa, tartib bo'yicha navbatdagilar yoqiladi
  let on = cards.filter((c) => c.enabled).length;
  for (const c of cards) {
    if (on >= MIN_CARDS) break;
    if (!c.enabled) {
      c.enabled = true;
      on++;
    }
  }

  const mapKey = r.map?.indicator;
  const mapDef = CARD_BY_KEY.get(mapKey as HomeCardKey);
  return {
    version: 1,
    region: isRegion(r.region) ? r.region : d.region,
    widgets,
    cards,
    map: { indicator: mapDef?.regional ? (mapKey as HomeCardKey) : d.map.indicator },
    weather: { forecast: r.weather?.forecast !== false },
  };
}

const STORAGE_KEY = "mystat.home.layout";

export function loadStoredLayout(): HomeLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeLayout(JSON.parse(raw)) : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function storeLayout(layout: HomeLayout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* xotira yopiq — sozlama shu sessiyada qoladi */
  }
}

export const isRegionCode = isRegion;
