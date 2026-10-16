import { expect, test } from "@playwright/test";

/** SCORING_MODEL.md KR-20 qabul sharti: salohiyat qatlami, kartochka, presetlar, tuman indeksi nomi; KR-21/22. */

test("Jizzax kartochkasida Salohiyat yorlig'i, o'rin va izoh", async ({ page }) => {
  await page.goto("/regions?ind=score&p=2025&t=1708");
  const card = page.getByRole("region", { name: /Jizzax viloyati kartochkasi/ });
  await expect(card).toBeVisible();
  await expect(card.getByRole("tab", { name: "Salohiyat" })).toHaveAttribute("aria-selected", "true");
  await expect(card.getByText(/Salohiyat indeksi, 2025/).first()).toBeVisible();
  await expect(card.getByText(/\d+ dan \d+-o'rin/).first()).toBeVisible();
  await expect(card.getByText(/rasmiy baho emas/).first()).toBeVisible();
  await expect(card.getByText("/100").first()).toBeVisible();
});

test("preset almashganda xarita qayta so'raladi va URL'ga yoziladi", async ({ page }) => {
  await page.goto("/regions?ind=score&p=2025");
  const weights = page.getByRole("region", { name: "Vaznlarni sozlash" });
  await expect(weights).toBeVisible();
  const repaint = page.waitForRequest((r) => r.url().includes("/api/common/map/values/") && r.url().includes("preset=investor"));
  await weights.locator("select").selectOption("investor");
  await repaint;
  await expect(page).toHaveURL(/sp=investor/);
  // Havola orqali qayta ochilganda holat saqlanadi
  await page.reload();
  await expect(weights.locator("select")).toHaveValue("investor");
});

test("tuman darajasida indeks nomi — Mehnat va demografiya indeksi", async ({ page }) => {
  const res = page.waitForResponse((r) => r.url().includes("/api/common/map/values/") && r.url().includes("level=district"));
  await page.goto("/regions?ind=score&p=2025&r=1708");
  const data = await (await res).json();
  expect(data.name).toBe("Mehnat va demografiya indeksi");
  await expect(page.getByText(/Mehnat va demografiya indeksi/).first()).toBeVisible();
});

test("reyting jadvali: prognoz ustunlari va eksport metodologiya versiyasi bilan", async ({ page }) => {
  await page.goto("/regions?ind=score&p=2025");
  await page.getByRole("button", { name: /Reyting jadvali/ }).click();
  const table = page.getByRole("region", { name: "Reyting jadvali" });
  await expect(table.getByText(/metodologiya v/)).toBeVisible();
  await expect(table.getByRole("button", { name: /Kutilayotgan o'zgarish/ })).toBeVisible();
  const download = page.waitForEvent("download");
  await table.getByRole("button", { name: "CSV" }).click();
  const stream = await (await download).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString("utf-8");
  expect(text).toMatch(/Metodologiya v/);
  expect(text).toMatch(/is_forecast/);
});

test("metodologiya 4 tilda", async ({ page }) => {
  await page.goto("/regions?ind=score&p=2025&t=1708");
  await page.getByRole("button", { name: /Metodologiya/ }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Salohiyat indeksi: metodologiya");
  for (const [label, title] of [["Рус", "Индекс потенциала: методология"], ["Eng", "Potential index: methodology"], ["Ўзб", "Салоҳият индекси: методология"]]) {
    await dialog.getByRole("button", { name: label }).click();
    await expect(dialog).toContainText(title);
  }
  // 10.4, KR-28: prognoz aniqligi jadvali (usul oddiy tilda, ichki kodlarsiz)
  await dialog.getByRole("button", { name: "O'zb" }).click();
  await expect(dialog).toContainText("Prognoz aniqligi");
  await expect(dialog.locator("table").last().getByText("O'rtacha xato")).toBeVisible();
  await expect(dialog).not.toContainText(/\bM[0-4]\b/);
});
