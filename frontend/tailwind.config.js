/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";

// MG-01: my.gov.uz tokenlari (src/theme/tokens.ts bilan bir xil). Ranglar CSS o'zgaruvchilaridan — tungi rejimda almashadi.
const ds = (name) => `rgb(var(--ds-${name}) / <alpha-value>)`;
const v = (name) => `rgb(var(--mg-${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter Variable", "system-ui", "Segoe UI", "Roboto", "Arial", ...defaultTheme.fontFamily.sans],
        // Portal yozuvi "my.stat.uz" (docs/LOGO.md)
        brand: ["Literata", "Georgia", ...defaultTheme.fontFamily.serif],
      },
      colors: {
        mg: {
          primary: v("primary"),
          "primary-dark": v("primary-dark"),
          "primary-light": v("primary-light"),
          accent: v("accent"),
          success: v("success"),
          bg: v("bg"),
          surface: v("surface"),
          info: v("info"),
          heading: v("heading"),
          text: v("text"),
          muted: v("muted"),
          border: v("border"),
          sos: v("sos"),
        },
      },
      borderRadius: {
        mg: "10px",
        "ds-control": "6px",
        "mg-tile": "16px",
        "mg-side": "25px",
      },
      boxShadow: {
        "mg-btn": "0 5px 17px rgba(29,95,191,.35), 0 0 0 4px rgba(29,95,191,.2)",
        "mg-card": "0 1px 2px rgba(16,24,40,.06)",
        "ds-popover": "0 8px 24px rgba(16,24,40,.12)",
      },
      backgroundImage: {
        "mg-hero": "linear-gradient(65.97deg, #0E2647 33.59%, #1D5FBF 122.33%)",
        "mg-btn": "linear-gradient(100deg, #1D5FBF, #174CA8)",
        "mg-personal": "radial-gradient(120% 120% at 92% 50%, rgb(var(--mg-personal-glow)) 0, rgb(var(--mg-surface)) 46%)",
      },
    },
  },
  plugins: [],
};
