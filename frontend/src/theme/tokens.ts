/**
 * MG-01: dizayn tokenlari — my.gov.uz dan o'lchangan qiymatlar (docs/mygov-reference/tokens.json, README 1-bo'lim).
 * Yagona manba: shu fayl. Tailwind (`tailwind.config.js` → `mg.*`) va CSS o'zgaruvchilar (`index.css` → `--mg-*`)
 * shu qiymatlarni takrorlaydi; grafiklar va inline uslublar shu yerdan oladi.
 */
export const mg = {
  font: '"Inter Variable", system-ui, "Segoe UI", Roboto, Arial, sans-serif',
  color: {
    primary: "#1D5FBF",
    primaryDark: "#174CA8",
    primaryLight: "#1D5FBF",
    accent: "#F0A14A",
    success: "#18794A",
    bg: "#F4F6FA",
    surface: "#FFFFFF",
    info: "#EEF4FE",
    heading: "#18212F",
    muted: "#4A5668",
    footerText: "#454545",
    footerTitle: "#151515",
    border: "#DDE3EB",
    sos: "#A855A0",
  },
  /** TRADEINT_DIZAYN TI-02: oqim ranglari barcha tashqi savdo grafiklarida bir xil (eksport ko'k, import amber, aylanma neytral) */
  flow: { export: "#1D5FBF", import: "#C07A2A", total: "#6B7A90" },
  radius: { card: 10, tile: 16, sidebar: 25, pill: 9999 },
  gradient: {
    hero: "linear-gradient(65.97deg, #0E2647 33.59%, #1D5FBF 122.33%)",
    button: "linear-gradient(100deg, #1D5FBF, #174CA8)",
    personal: "radial-gradient(120% 120% at 92% 50%, #EEF4FE 0, #FFFFFF 46%)",
  },
  shadow: {
    button: "0 5px 17px rgba(29,95,191,.35), 0 0 0 4px rgba(29,95,191,.2)",
  },
  size: { sidebar: 85, sidebarOpen: 268, sidebarGap: 22, containerPad: 40 },
} as const;

/** H1: yagona `--ds-*` tokenlari (kunduzgi qiymatlar; tungi rejim `theme/tokens.css` da). Grafiklar shu yerdan oladi. */
export const ds = {
  ink: "#08172C",
  brand: "#0E2647",
  onBrandMuted: "#C9D6EA",
  primary: "#1D5FBF",
  primaryHover: "#174CA8",
  primarySoft: "#EEF4FE",
  accent: "#F0A14A",
  accentStrong: "#C07A2A",
  bg: "#F4F6FA",
  surface: "#FFFFFF",
  border: "#DDE3EB",
  text: "#18212F",
  textMuted: "#4A5668",
  success: "#18794A",
  warning: "#8A5300",
  danger: "#C62828",
  info: "#0A5FB4",
  series: { export: "#1D5FBF", import: "#C07A2A", total: "#6B7A90", highlight: "#C07A2A" },
} as const;
