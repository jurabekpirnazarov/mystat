import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

/**
 * KORXONA_SCORING.md KR-34..KR-38 qabul shartlari. Bazada `seed_demo --only enterprise_scoring` natijasi bo'lishi kerak
 * (demo muhit, DEBUG=True). Kabinet uchun demo korxona `demo_yuridik_1` (parol — backend/.env DEMO_USER_PASSWORD).
 */

const API = "http://localhost:8000/api";

function demoPassword() {
  const env = readFileSync(resolve(process.cwd(), "../backend/.env"), "utf-8");
  return /^DEMO_USER_PASSWORD=(.*)$/m.exec(env)?.[1].trim() ?? "";
}

async function loginDemo(page: Page, username = "demo_yuridik_1") {
  const res = await page.request.post(`${API}/accounts/login/`, { data: { username, password: demoPassword() } });
  expect(res.ok()).toBeTruthy();
  const tokens = (await res.json()).data.tokens;
  await page.addInitScript((t) => {
    localStorage.setItem("access_token", t.access);
    localStorage.setItem("refresh_token", t.refresh);
    localStorage.setItem("user", JSON.stringify({ name: "Demo", email: "demo@example.com", type: "legal", date: "2026-10-16" }));
  }, tokens);
}

test("KR-34: badge va kartochka holatlari, 375px da kartochka buzilmaydi", async ({ page }) => {
  await page.goto("/company-score/components");
  const states = page.getByRole("region", { name: "Badge holatlari" });
  for (const label of ["A ·", "B ·", "C ·", "D ·", "E ·", "Ma'lumot yetarli emas"]) {
    await expect(states.getByRole("img", { name: new RegExp(label) }).first()).toBeAttached();
  }
  await expect(states.getByRole("img", { name: /namuna/ })).toBeAttached();
  const card = page.getByRole("region", { name: "Korxona bali" }).first();
  // KR-39: mehmonga kartochka qulflangan — umumiy ball va profilga havola
  await expect(card.getByRole("link", { name: /Profilni ochish/ })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 800 });
  await expect(card).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("KR-35: hamkorlar — badge ustuni, A–B filtri, ball bo'yicha saralash", async ({ page }) => {
  await page.goto("/partners?ordering=-score");
  const table = page.locator("table").first();
  await expect(table.locator("th", { hasText: "Ball" })).toBeVisible();
  await expect(table.getByRole("link", { name: /Korxona bali/ }).first()).toBeVisible();
  const scores = await table.getByRole("link", { name: /Korxona bali/ }).evaluateAll((els) =>
    els.map((e) => Number(/ball (\d+(?:\.\d+)?)/.exec(e.getAttribute("aria-label") ?? "")?.[1] ?? NaN)).filter((n) => !Number.isNaN(n)));
  expect(scores.length).toBeGreaterThan(3);
  expect(scores).toEqual([...scores].sort((a, b) => b - a));
  // Checkbox holati URL'dan (klass=A,B) — bosib, URL va holat yangilanishini kutamiz
  const filtered = page.waitForResponse((r) => r.url().includes("/partners/search/") && r.url().includes("klass="));
  await page.getByLabel("Faqat A–B sinf").click();
  await expect(page).toHaveURL(/klass=A%2CB|klass=A,B/);
  await expect(page.getByLabel("Faqat A–B sinf")).toBeChecked();
  await filtered;
  const labels = await table.getByRole("link", { name: /Korxona bali/ }).evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? ""));
  expect(labels.length).toBeGreaterThan(0);
  expect(labels.every((l) => /bali: [AB] ·/.test(l))).toBeTruthy();
});

test("KR-35: hamkorlarda ball qidiruv javobining o'zida — alohida so'rovlar yo'q (N+1 yo'q)", async ({ page }) => {
  const batches: string[] = [];
  page.on("request", (r) => { if (/\/analytics\/company-scores\/\?/.test(r.url())) batches.push(r.url()); });
  await page.goto("/partners");
  await expect(page.locator("table").first().getByRole("link", { name: /Korxona bali/ }).first()).toBeVisible();
  // Hamkorlar ballni qidiruv javobining o'zidan oladi — alohida batch so'rov ham shart emas
  expect(batches.length).toBeLessThanOrEqual(1);
});

test("KR-36: demo kabinet — pasportda ball, tavsiyalar va dinamika (Namuna)", async ({ page }) => {
  await loginDemo(page);
  await page.goto("/cabinet/organization");
  const card = page.getByRole("region", { name: "Korxona bali" });
  await expect(card).toBeVisible();
  await expect(card.getByText("Namuna", { exact: true }).first()).toBeVisible();
  await expect(card.getByRole("figure", { name: "Yillar bo'yicha ball" })).toBeVisible();
  await card.getByText("Ustunlar va ko'rsatkichlar").click();
  await expect(card.getByText(/Qiymat ustiga olib boring/)).toBeVisible();
});

test("KR-36: begona korxona — tavsiya va xom qiymatlar yo'q", async ({ page }) => {
  const list = await (await page.request.get(`${API}/additional-services/partners/search/?ordering=-score`)).json();
  const stir = list.results.find((r: { score: unknown }) => r.score).stir as string;
  await page.goto("/organizations-ktut");
  await page.locator("#stir").fill(stir);
  await page.locator("#captcha").fill("x");
  await page.getByRole("button", { name: /Qidirish|Izlash|Tekshirish|Yuborish/ }).first().click();
  const card = page.getByRole("region", { name: "Korxona bali" });
  await expect(card).toBeVisible();
  await expect(card.getByRole("region", { name: "Tavsiyalar" })).toHaveCount(0);
  const detail = await (await page.request.get(`${API}/analytics/company-scores/${stir}/`)).text();
  for (const raw of ['"value"', '"median"', "revenue", "net_profit", "avg_wage", "tax_debt_amount"]) expect(detail).not.toContain(raw);
});

test("KR-37: xarita qatlami va hudud kartochkasida 'Korxonalar sifati'", async ({ page }) => {
  await page.goto("/regions?ind=company-score&t=1708");
  await expect(page.locator("path.leaflet-interactive").first()).toBeAttached();
  await page.goto("/regions?ind=score&p=2025&t=1708");
  const block = page.getByRole("region", { name: "Korxonalar sifati" });
  await expect(block).toBeVisible();
  await expect(block).toContainText(/O'rtacha ball|Ma'lumot yetarli emas/);
});

test("KR-38: metodologiya sahifasi", async ({ page }) => {
  await page.goto("/methodology/company-score");
  await expect(page.getByRole("heading", { name: "Korxona bali: qanday hisoblanadi" })).toBeVisible();
  await expect(page.getByText("rasmiy baho emas").first()).toBeVisible();
  await expect(page.locator("table").first()).toContainText("Tushum o'sishi");
});

// --- KORXONA_SCORING.md KR-45, KR-46: korxona profili va unga havolalar -------------------------------------------

async function scoredStir(page: Page, skip: string[] = []) {
  const list = await (await page.request.get(`${API}/additional-services/partners/search/?ordering=-score`)).json();
  return list.results.find((r: { stir: string; score: { overall: number | null } | null }) =>
    r.score?.overall != null && !skip.includes(r.stir)).stir as string;
}

test("KR-45: mehmon — bepul qism ochiq, pullik bo'limlar qulflangan va API'da yo'q", async ({ page }) => {
  const stir = await scoredStir(page);
  await page.goto(`/company/${stir}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("tabpanel", { name: "Umumiy ma'lumot" })).toContainText("Rekvizitlar");
  await page.getByRole("tab", { name: /Ball nimaga asoslangan/ }).click();
  await expect(page.getByRole("tabpanel", { name: "Ball nimaga asoslangan" }).getByRole("link", { name: "Kirish" })).toBeVisible();
  const body = await (await page.request.get(`${API}/analytics/company-profile/${stir}/`)).json();
  for (const key of ["pillars", "contribution", "indicators", "flags"]) expect(body.basis[key]).toBeUndefined();
});

test("KR-45: StatCoin bilan ochish — balans 1 ga kamayadi, qayta kirish bepul, hissalar yig'indisi = ball", async ({ page }) => {
  await loginDemo(page, "demo_yuridik_3");       // korporativ demo hamyon (500 StatCoin)
  await page.goto("/cabinet/credits");
  const token = await page.evaluate(() => localStorage.getItem("access_token"));
  const headers = { Authorization: `Bearer ${token}` };
  // Hali ochilmagan korxonani tanlaymiz (30 kunlik ochiq muddat testlar orasida saqlanadi)
  const credits = await (await page.request.get(`${API}/credits/me/`, { headers })).json();
  const stir = await scoredStir(page, credits.unlocks.map((u: { stir: string }) => u.stir));
  await page.goto(`/company/${stir}?tab=basis`);
  const panel = page.getByRole("tabpanel", { name: "Ball nimaga asoslangan" });
  await panel.getByRole("button", { name: /Ochish · 1 StatCoin/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Ochish/ }).click();
  await expect(panel.getByRole("figure", { name: "Ball tarkibi" })).toBeVisible();
  await expect(page.getByRole("link", { name: /StatCoin balansi/ })).toHaveText(String(credits.balance - 1));
  const body = await (await page.request.get(`${API}/analytics/company-profile/${stir}/`, { headers })).json();
  const c = body.basis.contribution;
  const sum = c.base + c.pillars.reduce((a: number, r: { contribution: number }) => a + r.contribution, 0) + (c.cap ?? 0);
  expect(Math.abs(sum - body.general.score.overall)).toBeLessThanOrEqual(0.1);
  await page.reload();
  await expect(panel.getByRole("figure", { name: "Ball tarkibi" })).toBeVisible();
  const after = await (await page.request.get(`${API}/credits/me/`, { headers })).json();
  expect(after.balance).toBe(credits.balance - 1);
});

test("KR-45: 375px — bo'limlar ketma-ket, gorizontal siljish yo'q", async ({ page }) => {
  const stir = await scoredStir(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`/company/${stir}`);
  await expect(page.getByRole("tabpanel", { name: "Ball nimaga asoslangan" })).toBeVisible();
  await expect(page.getByRole("tabpanel", { name: "Chuqur tahlil" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("KR-46: hamkorlar — nom profilga olib boradi, bali yo'q qator bo'sh emas", async ({ page }) => {
  await page.goto("/partners");
  const table = page.locator("table").first();
  const rows = table.locator("tbody tr");
  await expect(rows.first()).toBeVisible();
  const empty = await rows.evaluateAll((trs) => trs.filter((tr) => !(tr.children[1]?.textContent ?? "").trim()).length);
  expect(empty).toBe(0);
  await rows.first().locator("td").first().getByRole("link").click();
  await expect(page).toHaveURL(/\/company\/\d+/);
  await expect(page.getByRole("tab", { name: /Umumiy ma'lumot/ })).toBeVisible();
});
