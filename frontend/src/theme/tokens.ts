/**
 * MG-01: dizayn tokenlari — my.gov.uz dan o'lchangan qiymatlar (docs/mygov-reference/tokens.json, README 1-bo'lim).
 * Yagona manba: shu fayl. Tailwind (`tailwind.config.js` → `mg.*`) va CSS o'zgaruvchilar (`index.css` → `--mg-*`)
 * shu qiymatlarni takrorlaydi; grafiklar va inline uslublar shu yerdan oladi.
 */
export const mg = {
  font: "Montserrat, ui-sans-serif, system-ui, sans-serif",
  color: {
    primary: "#0068E0",
    primaryDark: "#0153B2",
    primaryLight: "#1A7BF0",
    accent: "#00DC82",
    success: "#2DB257",
    bg: "#F2F4F7",
    surface: "#FFFFFF",
    info: "#E5EFFC",
    heading: "#1E293B",
    muted: "#354862",
    footerText: "#454545",
    footerTitle: "#151515",
    border: "#E3E8EF",
    sos: "#A855A0",
  },
  radius: { card: 14, tile: 16, sidebar: 25, pill: 9999 },
  gradient: {
    hero: "linear-gradient(65.97deg, #0068E0 33.59%, #00DC82 122.33%)",
    button: "linear-gradient(100deg, #1A7BF0, #0068E0)",
    personal: "radial-gradient(120% 120% at 92% 50%, #F1F7FE 0, #FFFFFF 46%)",
  },
  shadow: {
    button: "0 5px 17px rgba(0,104,224,.43), 0 0 0 4px rgba(0,104,224,.25)",
  },
  size: { sidebar: 85, sidebarOpen: 268, sidebarGap: 22, containerPad: 40 },
} as const;
