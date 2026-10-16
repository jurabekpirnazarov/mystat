import { defineConfig, devices } from "@playwright/test";

/**
 * SCORING_MODEL.md KR-20, KR-27: /regions xaritasi e2e testlari. Haqiqiy backend (lokal baza, SIAT ma'lumoti va
 * `compute_scores` / `train_forecasts` natijasi bilan) va Vite dev server kerak; ishlab turgan bo'lsa qayta ishlatiladi.
 *
 *   npx playwright install chromium   # bir marta
 *   npm run e2e
 *
 * E2E_BACKEND_CMD — backend buyrug'i (standart: ../backend/venv ichidagi python bilan runserver).
 */
const python = process.platform === "win32" ? "venv\\Scripts\\python.exe" : "venv/bin/python";
const PORT = 5179;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", ...devices["Desktop Chrome"] },
  webServer: [
    {
      command: process.env.E2E_BACKEND_CMD || `${python} manage.py runserver 8000 --noreload`,
      cwd: "../backend",
      url: "http://localhost:8000/api/common/map/indicators/",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}/`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
