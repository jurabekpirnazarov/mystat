/** O'zbek lotin yozuvidan kirill yozuviga transliteratsiya (MG-02: "Ўзбекча" tili uchun). */
const MULTI: [RegExp, string][] = [
  [/o['‘’ʻʼ`]/g, "ў"], [/O['‘’ʻʼ`]/g, "Ў"],
  [/g['‘’ʻʼ`]/g, "ғ"], [/G['‘’ʻʼ`]/g, "Ғ"],
  [/sh/g, "ш"], [/Sh/g, "Ш"], [/SH/g, "Ш"],
  [/ch/g, "ч"], [/Ch/g, "Ч"], [/CH/g, "Ч"],
  [/yo/g, "ё"], [/Yo/g, "Ё"], [/YO/g, "Ё"],
  [/yu/g, "ю"], [/Yu/g, "Ю"], [/YU/g, "Ю"],
  [/ya/g, "я"], [/Ya/g, "Я"], [/YA/g, "Я"],
  [/(^|[^A-Za-z'])e/g, "$1э"], [/(^|[^A-Za-z'])E/g, "$1Э"],
  [/['‘’ʻʼ`]/g, "ъ"],
];
const SINGLE: Record<string, string> = {
  a: "а", b: "б", d: "д", e: "е", f: "ф", g: "г", h: "ҳ", i: "и", j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о",
  p: "п", q: "қ", r: "р", s: "с", t: "т", u: "у", v: "в", x: "х", y: "й", z: "з", c: "с", w: "в",
};

export function toCyrillic(text: string): string {
  let s = text;
  for (const [re, to] of MULTI) s = s.replace(re, to);
  return s.replace(/[A-Za-z]/g, (ch) => {
    const low = SINGLE[ch.toLowerCase()];
    if (!low) return ch;
    return ch === ch.toLowerCase() ? low : low.toUpperCase();
  });
}
