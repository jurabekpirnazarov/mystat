/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";

// MG-01: my.gov.uz tokenlari (src/theme/tokens.ts bilan bir xil). Ranglar CSS o'zgaruvchilaridan — tungi rejimda almashadi.
const v = (name) => `rgb(var(--mg-${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", ...defaultTheme.fontFamily.sans],
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
        mg: "14px",
        "mg-tile": "16px",
        "mg-side": "25px",
      },
      boxShadow: {
        "mg-btn": "0 5px 17px rgba(0,104,224,.43), 0 0 0 4px rgba(0,104,224,.25)",
        "mg-card": "0 1px 2px rgba(16,24,40,.04)",
      },
      backgroundImage: {
        "mg-hero": "linear-gradient(65.97deg, #0068E0 33.59%, #00DC82 122.33%)",
        "mg-btn": "linear-gradient(100deg, #1A7BF0, #0068E0)",
        "mg-personal": "radial-gradient(120% 120% at 92% 50%, rgb(var(--mg-personal-glow)) 0, rgb(var(--mg-surface)) 46%)",
      },
    },
  },
  plugins: [],
};
