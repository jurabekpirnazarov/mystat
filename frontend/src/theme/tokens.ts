/**
 * MG-01: dizayn tokenlari — my.gov.uz dan o'lchangan qiymatlar (docs/mygov-reference/tokens.json, README 1-bo'lim).
 * Yagona manba: shu fayl. Tailwind (`tailwind.config.js` → `mg.*`) va CSS o'zgaruvchilar (`index.css` → `--mg-*`)
 * shu qiymatlarni takrorlaydi; grafiklar va inline uslublar shu yerdan oladi.
 */
export const mg = {
  font: '"Inter Variable", system-ui, "Segoe UI", Roboto, Arial, sans-serif',
  color: {
    primary: "#155EEF",
    primaryDark: "#0F4BC8",
    primaryLight: "#155EEF",
    accent: "#F0A14A",
    success: "#0B7A63",
    bg: "#F5F7FB",
    surface: "#FFFFFF",
    info: "#EBF2FE",
    heading: "#172B4D",
    muted: "#667085",
    footerText: "#454545",
    footerTitle: "#151515",
    border: "#E4E7EC",
    sos: "#A855A0",
  },
  /** TRADEINT_DIZAYN TI-02: oqim ranglari barcha tashqi savdo grafiklarida bir xil (eksport ko'k, import amber, aylanma neytral) */
  flow: { export: "#2563EB", import: "#D97706", total: "#667085" },
  radius: { card: 10, tile: 16, sidebar: 25, pill: 9999 },
  gradient: {
    hero: "#102A43",
    button: "#155EEF",
    personal: "radial-gradient(120% 120% at 92% 50%, #EBF2FE 0, #FFFFFF 46%)",
  },
  shadow: {
    button: "0 5px 17px rgba(29,95,191,.35), 0 0 0 4px rgba(29,95,191,.2)",
  },
  size: { sidebar: 85, sidebarOpen: 268, sidebarGap: 22, containerPad: 40 },
} as const;

/** H1: yagona `--ds-*` tokenlari (kunduzgi qiymatlar; tungi rejim `theme/tokens.css` da). Grafiklar shu yerdan oladi. */
export const ds = {
  ink: "#0B1D2F",
  brand: "#102A43",
  onBrandMuted: "#C9D6EA",
  primary: "#155EEF",
  primaryHover: "#0F4BC8",
  primarySoft: "#EBF2FE",
  accent: "#F0A14A",
  accentStrong: "#D97706",
  bg: "#F5F7FB",
  surface: "#FFFFFF",
  border: "#E4E7EC",
  text: "#172B4D",
  textMuted: "#667085",
  success: "#0B7A63",
  warning: "#8A5300",
  danger: "#C0343F",
  info: "#0A5FB4",
  series: { export: "#2563EB", import: "#D97706", total: "#667085", highlight: "#D97706" },
} as const;

/** Ma'lumot vizualizatsiyasi palitrasi (kategoriyali seriyalar uchun). Yagona manba: `--ds-viz-*` bilan bir xil. */
export const vizPalette = ["#2563EB", "#06B6D4", "#0D9488", "#8B5CF6", "#F59E0B", "#E05D6F"] as const;
