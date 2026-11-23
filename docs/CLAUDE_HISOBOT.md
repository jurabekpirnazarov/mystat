# CLAUDE hisoboti

> CLAUDE.md shu faylni har sessiya boshida o'qishni talab qiladi. Fayl 2026-11-03 da yangidan yaratildi (oldin repoda yo'q edi).

## 0. Davom etish yo'riqnomasi
1. `git log` va `git status` ni ko'ring, 7-bo'limdagi oxirgi yozuv bilan solishtiring.
2. Frontend: `cd frontend && npx vite --host --port 5173`. Tekshiruv: `npx tsc --noEmit -p tsconfig.app.json`, `npx vitest run`.
3. Eski qobiq va bosh sahifani qaytarish: `VITE_LEGACY_UI=1`.

## 4. Bajarilgan ishlar
- **Variant P ("Shaffof xizmat pasporti") asosiy UI qilindi** (manba: `P — Shaffof xizmat pasporti (O asosida)-html.zip`, repo ildizida, git'ga kirmagan).
  - `frontend/src/theme/passport.css`: brend o'zgaruvchilari (`--btn`, `--p50…--p800`), animatsiyalar. Yuza/matn `--ds-*` dan, tungi rejim ishlaydi.
  - `frontend/src/components/passport/PassportShell.tsx`: bayroq chizig'i, yig'iladigan chap sidebar (`NAV_GROUPS` dan), header (6 bandli menyu, soat, qidiruv Ctrl+K, til, kirish/kabinet), footer. Mobilda `MobileSidebar`.
  - `frontend/src/pages/HomePassport.tsx`: hero + xizmat pasporti slayderi, eng ko'p foydalaniladigan 8 xizmat, barcha xizmatlar (soha tablari), hayotiy vaziyatlar, yordam bloki. Hammasi `serviceCatalog.ts` va `/portal/services/stats/` dan.
  - `MainLayout.tsx` va `HomePage.tsx` endi standart holatda yangi qobiq/sahifani beradi (`/cabinet` o'z qobig'ida qoladi).
  - `index.html`: Onest va IBM Plex Mono shriftlari qo'shildi.
- Tekshiruv: tsc va eslint toza, vitest 55/55, brauzerda `/` va `/spheres` ko'zdan kechirildi.
- **DWH asosi qo'shildi** (`dwh/`, mystat stekidan mustaqil; server `172.30.30.30`, host `qamal`, foydalanuvchi `developer`).
  - `dwh/docker-compose.yml`: PostgreSQL 16, port 5440, sozlamalar `.env` dan (`.env.example` ga qarang).
  - `dwh/init/01_init.sh`: `raw / staging / core / mart / meta` sxemalari, `dwh_loader` va `dwh_reader` rollari, `meta.load_log`.
  - `dwh/loader/`: CSV/TSV/Excel/Parquet/JSON faylni `raw` ga yuklaydigan skript (`docker compose run --rm loader <fayl>`).
  - Tekshiruv: bulut konteynerida baza ko'tarildi, sxema/rol huquqlari va barcha formatlar bo'yicha yuklash sinaldi. Loader Docker obrazi yig'ilmadi (Docker Hub 429), skript konteynersiz sinalgan.

## 5. Qolgan ishlar
- **DWH:** serverda hali ishga tushirilmagan (Claude serverga ulana olmaydi, foydalanuvchi o'zi `git pull` + `docker compose up -d` qiladi). Loader obrazini serverda yig'ib tekshirish kerak. Manbalar ro'yxati va hajmi hali aniqlanmagan; shundan keyin staging/core/mart modellari (dbt) va jadval bo'yicha yuklash (orkestrator) qo'shiladi.
- Mockup'dagi soxta bloklar (jonli hodisalar lentasi, ko'rsatkichlar tikeri) ataylab olinmadi: ular uchun haqiqiy ma'lumot manbasi kerak.
- Ichki sahifalar (`/spheres`, `/service/:n`, `/check` va b.) yangi qobiq ichida ishlaydi, lekin kartalari hali eski uslubda. Birma-bir yangilash kerak.
- Mobil ko'rinish va tungi rejim brauzerda tekshirilmagan.
- Palitra tanlagich (18 variant) kiritilmagan, faqat "Bayroq ko'ki".
- Eski `HomePageV2`, `PublicLayout` fayllari hali o'chirilmagan.

## 7. Sessiyalar jurnali
- **2026-11-03:** Variant P asosiy UI qilindi (4-bo'limga qarang). Commit `bce4041`, PR #1 orqali `main` ga qo'shilgan.
- **2026-11-23:** DWH asosi `dwh/` da yaratildi va lokal sinaldi (4-bo'lim). Branch `claude/wizardly-einstein-zhwkoi`. Keyingi qadam: serverda ishga tushirish va manbalarni aniqlash.
