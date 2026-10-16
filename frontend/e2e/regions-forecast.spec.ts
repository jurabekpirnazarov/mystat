import { expect, test, type Page } from "@playwright/test";

/** SCORING_MODEL.md KR-27 qabul sharti: prognoz banneri, uzuq konturli hududlar, o'sish rejimi, fan chart, ssenariy. */

const DASHED = 'path.leaflet-interactive[stroke-dasharray="3 3"]';
const mapBox = (page: Page) => page.locator(".leaflet-container").first();

test("prognoz yili: banner, uzuq konturli hududlar va kartochkada lenta", async ({ page }) => {
  await page.goto("/regions?ind=500&p=2028&t=1708");
  await expect(page.getByRole("status").filter({ hasText: "Prognoz, 2028" })).toBeVisible();
  await expect(page.locator(DASHED).first()).toBeAttached();
  const card = page.getByRole("region", { name: /Jizzax viloyati kartochkasi/ });
  await expect(card.getByText(/kutilayotgan o'sish/)).toBeVisible();
  await expect(card.locator(".recharts-legend-wrapper").first()).toContainText("80% oraliq");
  await expect(card.locator(".recharts-legend-wrapper").first()).toContainText("Prognoz");
  // 10.8.3: usul nomi va o'tgan yillardagi o'rtacha xato
  await expect(card.getByText(/Usul: .*o'rtacha xatosi \d/).first()).toBeVisible();
});

test("prognoz va haqiqiy yil vizual jihatdan farq qiladi (skrinshot)", async ({ page }, info) => {
  await page.goto("/regions?ind=500&p=2025");
  await expect(page.locator("path.leaflet-interactive").first()).toBeAttached();
  await page.waitForLoadState("networkidle");
  expect(await page.locator(DASHED).count()).toBe(0);
  const actual = await mapBox(page).screenshot();

  await page.goto("/regions?ind=500&p=2028");
  await expect(page.locator(DASHED).first()).toBeAttached();
  await page.waitForLoadState("networkidle");
  const forecast = await mapBox(page).screenshot();

  await info.attach("haqiqiy-2025.png", { body: actual, contentType: "image/png" });
  await info.attach("prognoz-2028.png", { body: forecast, contentType: "image/png" });
  expect(actual.equals(forecast)).toBe(false);
  expect(await page.locator(DASHED).count()).toBeGreaterThan(5);
});

test("o'sish rejimi va ssenariy tanlovi URL bilan ishlaydi", async ({ page }) => {
  await page.goto("/regions?ind=500&p=2028");
  const banner = page.getByRole("status").filter({ hasText: "Prognoz, 2028" });
  await expect(banner).toBeVisible();
  const growth = page.waitForResponse((r) => r.url().includes("/api/common/map/values/") && r.url().includes("view=growth"));
  await banner.getByRole("button", { name: "Yillik o'sish" }).click();
  expect((await (await growth).json()).unit).toMatch(/\/yil/);
  await expect(page).toHaveURL(/v=g/);
  const opt = page.waitForResponse((r) => r.url().includes("/api/common/map/values/") && r.url().includes("scenario=opt"));
  await banner.getByRole("button", { name: "Ijobiy" }).click();
  expect((await (await opt).json()).scenario).toBe("optimistic");
  await expect(page).toHaveURL(/sc=opt/);
});
