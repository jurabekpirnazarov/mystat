/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";

// lex.uz dan o'lchangan qiymatlar: asosiy ko'k rgb(12,87,166), matn rgb(33,37,41), Montserrat, tugma radiusi 4px.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Montserrat Variable", "Montserrat", "system-ui", "Segoe UI", ...defaultTheme.fontFamily.sans] },
      colors: {
        lx: {
          blue: "#0C57A6",
          "blue-dark": "#0A4688",
          "blue-soft": "#E8F0F9",
          link: "#007BFF",
          ink: "#212529",
          muted: "#5B6672",
          line: "#D9DEE4",
          pill: "#EEF0F2",
        },
      },
      borderRadius: { lx: "4px" },
    },
  },
  plugins: [],
};
