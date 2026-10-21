/**
 * MG-00: my.gov.uz dan namuna olish va dizayn tokenlarini o'lchash (docs/MYGOV_DIZAYN.md).
 *
 * Ishga tushirish (repo ildizidan, Node 22.6+ — TypeScript turlarini o'zi olib tashlaydi):
 *   node tools/mygov-reference/capture.ts
 * Proksi kerak bo'lsa HTTPS_PROXY o'zgaruvchisidan olinadi.
 *
 * Natija: docs/mygov-reference/screens/*.jpg (360/768/1280 px, birinchi ekran) va tokens.json.
 * my.gov.uz dan shrift, ikonka yoki rasm fayllari yuklab olinmaydi — faqat skrinshot va hisoblangan uslublar.
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const require = createRequire(resolve(root, "frontend/package.json"));
const { chromium } = require("@playwright/test");

const OUT = resolve(root, "docs/mygov-reference");
const BASE = "https://my.gov.uz";
const PAGES = [
  { key: "home", path: "/uz" },
  { key: "sphere", path: "/uz/spheres/12" },
  { key: "service", path: "/uz/service/411" },
  { key: "search", path: "/uz/search?search=kredit" },
];
const WIDTHS = [360, 768, 1280];

const PROPS = [
  "font-family", "font-size", "font-weight", "line-height", "color", "background-color", "background-image",
  "border", "border-radius", "box-shadow", "padding", "margin", "gap", "max-width", "width", "height",
  "grid-template-columns",
];

/** Element topish: CSS selektor yoki matn bo'yicha (eng ichki mos element, kerak bo'lsa N daraja yuqoriga). */
type Probe = { name: string; css?: string; text?: string; up?: number; page: string };

const PROBES: Probe[] = [
  { name: "body", css: "body", page: "home" },
  { name: "page", css: ".content", page: "home" },
  { name: "container", css: ".constrainedBox", page: "home" },
  { name: "sidebar", css: "aside .sidebarWrap", page: "home" },
  { name: "header", css: "header", page: "home" },
  { name: "header.portalName", text: "YAGONA INTERAKTIV DAVLAT", page: "home" },
  { name: "header.loginButton", text: "Kirish", up: 1, page: "home" },
  { name: "hero", text: "Xush kelibsiz!", up: 1, page: "home" },
  { name: "hero.title", text: "Xush kelibsiz!", page: "home" },
  { name: "hero.search", css: "main input", page: "home" },
  { name: "personal.card", text: "Elektron hujjatlaringiz", up: 2, page: "home" },
  { name: "personal.title", text: "Elektron hujjatlaringiz", page: "home" },
  { name: "personal.link", text: "Batafsil ma'lumot", page: "home" },
  { name: "section.title", text: "Sohalar", page: "home" },
  { name: "sphere.card", text: "Sog'liqni saqlash", up: 1, page: "home" },
  { name: "sphere.cardTitle", text: "Sog'liqni saqlash", page: "home" },
  { name: "sphere.link", text: "Barchasi", page: "home" },
  { name: "situation.card", text: "Oila qurish", up: 1, page: "home" },
  { name: "popular.card", text: "#126", up: 1, page: "home" },
  { name: "popular.number", text: "#126", page: "home" },
  { name: "feedback.question", text: "Sahifadagi kontent sizga ma'qul keldimi?", page: "home" },
  { name: "feedback.button", text: "Ha", up: 0, page: "home" },
  { name: "footer", css: "footer", page: "home" },
  { name: "footer.columnTitle", text: "Foydalanuvchilar uchun", page: "home" },
  { name: "footer.link", text: "Jismoniy shaxs uchun", page: "home" },
  { name: "sphere.sidebar", text: "Sohalar", up: 1, page: "sphere" },
  { name: "sphere.sidebarActive", text: "Biznesni ochish va yuritish", page: "sphere" },
  { name: "sphere.h1", text: "Iqtisodiyot va biznes", page: "sphere" },
  { name: "sphere.serviceCard", text: "#411", up: 1, page: "sphere" },
  { name: "breadcrumb", text: "Bosh sahifa", page: "sphere" },
  { name: "service.hero", text: "Bajarish vaqti", up: 4, page: "service" },
  { name: "service.applyButton", text: "Ariza yuborish", page: "service" },
  { name: "service.favButton", text: "Tanlanganlarga qo", page: "service" },
  { name: "service.infoSection", text: "Xizmat narxi", up: 1, page: "service" },
  { name: "service.ratingTitle", text: "Baho va sharhlar", page: "service" },
  { name: "search.h1", text: "Izlash", page: "search" },
  { name: "search.chip", text: "Ishonchnoma", page: "search" },
];

async function measure(page: any, probes: Probe[]) {
  return page.evaluate(({ probes, props }: { probes: Probe[]; props: string[] }) => {
    const norm = (s: string) => s.replace(/[‘’ʻʼ`]/g, "'").replace(/\s+/g, " ").trim();
    function byText(t: string): Element | null {
      const want = norm(t);
      let best: Element | null = null;
      for (const el of Array.from(document.querySelectorAll("body *"))) {
        const own = norm(Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent ?? "").join(" "));
        if (own && (own === want || own.startsWith(want)) && (el as HTMLElement).offsetParent !== null) { best = el; break; }
      }
      return best;
    }
    const res: Record<string, unknown> = {};
    for (const p of probes) {
      let el: Element | null = p.css ? document.querySelector(p.css) : byText(p.text!);
      for (let i = 0; el && i < (p.up ?? 0); i++) el = el.parentElement;
      if (!el) { res[p.name] = null; continue; }
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const o: Record<string, string | number> = { tag: el.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x) };
      for (const k of props) {
        const v = cs.getPropertyValue(k);
        if (v && v !== "none" && v !== "normal" && v !== "0px" && v !== "rgba(0, 0, 0, 0)" && v !== "auto") o[k] = v;
      }
      res[p.name] = o;
    }
    return res;
  }, { probes, props: PROPS });
}

async function main() {
  mkdirSync(resolve(OUT, "screens"), { recursive: true });
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const browser = await chromium.launch(proxy ? { proxy: { server: proxy } } : {});
  const tokens: Record<string, unknown> = { source: BASE, capturedAt: new Date().toISOString(), widths: {} };
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, locale: "uz-UZ" });
    const page = await ctx.newPage();
    const perWidth: Record<string, unknown> = {};
    for (const pg of PAGES) {
      await page.goto(BASE + pg.path, { waitUntil: "networkidle", timeout: 90_000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: resolve(OUT, "screens", `${pg.key}-${w}.jpg`), type: "jpeg", quality: 60 });
      perWidth[pg.key] = await measure(page, PROBES.filter((p) => p.page === pg.key));
      process.stdout.write(`${pg.key}@${w} `);
    }
    (tokens.widths as Record<number, unknown>)[w] = perWidth;
    await ctx.close();
  }
  await browser.close();
  writeFileSync(resolve(OUT, "tokens.json"), JSON.stringify(tokens, null, 2));
  console.log("\ntokens.json yozildi");
}

main().catch((e) => { console.error(e); process.exit(1); });
