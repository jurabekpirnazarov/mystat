import { expect, test } from "@playwright/test";

/** MYGOV_DIZAYN.md 2-etap qabul mezonlari: MG-02 (layout), MG-05 (bosh sahifa tartibi), MG-06, MG-07, MG-08, MG-09, MG-14. */

test("MG-02/MG-05: bosh sahifa bloklari my.gov.uz tartibida, birinchi Tab — skip-link", async ({ page }) => {
  const ids = ["hero-title", "pb-first", "home-spheres", "home-situations", "home-features", "home-popular"];
  await page.goto("/");
  for (const id of ids) await expect(page.locator(`#${id}`)).toBeAttached();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Asosiy kontentga o'tish" })).toBeFocused();
  const order = await page.evaluate((list) =>
    list.map((id) => {
      const el = document.getElementById(id);
      return el ? el.getBoundingClientRect().top + window.scrollY : -1;
    }), ids);
  expect(order.every((y) => y >= 0)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
  await expect(page.getByText("Sahifadagi kontent sizga ma'qul keldimi?")).toBeVisible();
  await expect(page.locator("footer")).toContainText("Aloqa va qo'llab-quvvatlash");
});

test("MG-06: soha sahifasi — filtr URL'da, qayta ochilganda tiklanadi; eski /services yo'naltiriladi", async ({ page }) => {
  await page.goto("/services");
  await expect(page).toHaveURL(/\/spheres$/);
  await page.goto("/spheres/1");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Korxonalar va tashkilotlar");
  await page.getByRole("button", { name: "Kengaytirilgan qidiruv" }).click();
  await page.getByRole("button", { name: "Bepul" }).click();
  await expect(page).toHaveURL(/price=free/);
  await page.reload();
  await expect(page.getByRole("button", { name: "Bepul" })).toHaveAttribute("aria-pressed", "true");
  // Bepul filtrida paketli "Korxona to'g'risida ma'lumot" (#101) yo'q
  await expect(page.getByText("#101")).toHaveCount(0);
  await expect(page.getByText("#102")).toBeVisible();
});

test("MG-07: xizmat pasporti — bo'limlar, baholar va asosiy tugma ishchi sahifaga olib boradi", async ({ page }) => {
  await page.goto("/service/302");
  await expect(page.getByRole("heading", { level: 1, name: "Bozor tahlili" })).toBeVisible();
  for (const name of ["Xizmat narxi", "Xizmat foydalanuvchilari", "Bu qanday ishlaydi?", "Umumiy statistika"]) {
    await expect(page.getByRole("button", { name: new RegExp(name.replace("?", "\\?")) })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Baho va sharhlar" })).toBeVisible();
  await page.getByRole("button", { name: "Xizmatdan foydalanish" }).click();
  await expect(page).toHaveURL(/\/market-report$/);
  // Ishchi sahifada pasportga qaytish qatori (MG-07.2)
  await expect(page.getByRole("link", { name: /#302/ })).toBeVisible();
});

test("MG-08: qidiruvda #302 — to'g'ridan-to'g'ri pasport; matn bo'yicha xizmatlar topiladi", async ({ page }) => {
  await page.goto("/search");
  await page.getByRole("searchbox").fill("#302");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/service\/302$/);
  await page.goto("/search?q=inflyatsiya");
  await expect(page.getByRole("heading", { name: /Xizmatlar/ })).toBeVisible();
  await expect(page.getByText("Inflyatsiya kalkulyatori").first()).toBeVisible();
});

test("MG-09: footer havolalari 404 bermaydi", async ({ page }) => {
  await page.goto("/");
  const links = await page.locator("footer a[href^='/']").evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")!))]);
  expect(links.length).toBeGreaterThan(10);
  for (const href of links) {
    await page.goto(href);
    await expect(page.getByText("Sahifa topilmadi")).toHaveCount(0);
  }
});

test("MG-14: 360 px — gorizontal skroll faqat plitkalarda, burger menyu Esc bilan yopiladi", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByRole("button", { name: "Menyuni ochish" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("link", { name: "Sohalar" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("MG-02: /ru prefiksi tilni almashtiradi", async ({ page }) => {
  await page.goto("/ru/spheres");
  await expect(page).toHaveURL(/\/spheres$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Все услуги");
  await page.evaluate(() => localStorage.setItem("lang", "uz"));
});
