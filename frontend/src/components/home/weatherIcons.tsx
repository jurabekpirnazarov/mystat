import type { WeatherCode } from "../../api/homeWidgets";

/** O'z SVG belgilar to'plami (8 ta, `currentColor`): boshqa saytdan ko'chirilmagan. Belgi bezak — holat matn bilan ham yoziladi. */
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const CLOUD = "M7 18a4 4 0 1 1 .6-7.95A5.5 5.5 0 0 1 18 11.5a3.25 3.25 0 0 1-.5 6.5Z";

export const WEATHER_LABEL: Record<WeatherCode, { uz: string; ru: string }> = {
  clear: { uz: "Ochiq", ru: "Ясно" },
  partly_cloudy: { uz: "Oz bulutli", ru: "Малооблачно" },
  cloudy: { uz: "Bulutli", ru: "Облачно" },
  fog: { uz: "Tuman", ru: "Туман" },
  rain: { uz: "Yomg'ir", ru: "Дождь" },
  snow: { uz: "Qor", ru: "Снег" },
  thunderstorm: { uz: "Momaqaldiroq", ru: "Гроза" },
  wind: { uz: "Shamol", ru: "Ветер" },
};

export default function WeatherIcon({ code, size = 40 }: { code: WeatherCode; size?: number }) {
  const body = (() => {
    switch (code) {
      case "clear":
        return <><circle cx="12" cy="12" r="4" {...P} /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" {...P} /></>;
      case "partly_cloudy":
        return <><circle cx="8" cy="8" r="3" {...P} /><path d="M8 2v1M2 8h1M3.8 3.8l.7.7M12.2 3.8l-.7.7" {...P} /><path d={CLOUD} transform="translate(2 1.5)" {...P} /></>;
      case "cloudy":
        return <path d={CLOUD} transform="translate(0 -1)" {...P} />;
      case "fog":
        return <><path d={CLOUD} transform="translate(0 -3)" {...P} /><path d="M4 19h16M7 22h10" {...P} /></>;
      case "rain":
        return <><path d={CLOUD} transform="translate(0 -3)" {...P} /><path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" {...P} /></>;
      case "snow":
        return <><path d={CLOUD} transform="translate(0 -3)" {...P} /><path d="M8 19.5h.01M12 21h.01M16 19.5h.01M10 22h.01M14 22h.01" {...P} strokeWidth={2.6} /></>;
      case "thunderstorm":
        return <><path d={CLOUD} transform="translate(0 -3)" {...P} /><path d="m12 15-2 4h3l-1 3" {...P} /></>;
      case "wind":
        return <path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8" {...P} />;
    }
  })();
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">{body}</svg>;
}
