/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";

// Ranglar CSS o'zgaruvchilaridan (src/theme/tokens.css): tungi rejimda (`.dark`) avtomatik almashadi.
const v = (name) => `rgb(var(--mg-${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter Variable", "system-ui", "Segoe UI", "Roboto", "Arial", ...defaultTheme.fontFamily.sans] },
      colors: {
        mg: {
          primary: v("primary"), "primary-dark": v("primary-dark"), accent: v("accent"), success: v("success"),
          bg: v("bg"), surface: v("surface"), info: v("info"), heading: v("heading"), text: v("text"),
          muted: v("muted"), border: v("border"),
        },
      },
      borderRadius: { mg: "12px", "mg-side": "25px" },
      boxShadow: { "mg-card": "0 1px 2px rgba(16,24,40,.06)", "mg-btn": "0 1px 2px rgba(16,24,40,.12)" },
    },
  },
  plugins: [],
};
