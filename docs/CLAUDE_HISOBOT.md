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
- **`seed_demo` toza bazada sinaldi (2026-11-20):** `custom_requests` seeder'i demo foydalanuvchilar bo'lmaganda `ZeroDivisionError` bilan yiqilardi, endi ogohlantirib o'tkazib yuboradi.

## 5. Qolgan ishlar
- `seed_demo`: `citizens` seeder'i viloyatlar bo'sh bo'lsa `IndexError` beradi (`citizens.py:202`), undan keyingi seeder'lar ishlamaydi. Tuzatilmagan.
- Toza bazada viloyat/tuman va `ServicePackage` yo'q: `hududlar_to_db` o'qiydigan `datas/hududlar.json` repoda yo'q, shu sabab demo korxona/shartnoma/buyurtmalar yaratilmaydi.
- Backend SQLite'da `migrate` qilinmaydi (`SiteSettings` da `max_length`siz `CharField`), faqat PostgreSQL.
- Foydalanuvchi `Tov_12_2020 — пересчет.zip` ni tahlil qilishni so'radi; fayl uning kompyuterida, sessiyaga hali berilmagan.
- Mockup'dagi soxta bloklar (jonli hodisalar lentasi, ko'rsatkichlar tikeri) ataylab olinmadi: ular uchun haqiqiy ma'lumot manbasi kerak.
- Ichki sahifalar (`/spheres`, `/service/:n`, `/check` va b.) yangi qobiq ichida ishlaydi, lekin kartalari hali eski uslubda. Birma-bir yangilash kerak.
- Mobil ko'rinish va tungi rejim brauzerda tekshirilmagan.
- Palitra tanlagich (18 variant) kiritilmagan, faqat "Bayroq ko'ki".
- Eski `HomePageV2`, `PublicLayout` fayllari hali o'chirilmagan.

## 7. Sessiyalar jurnali
- **2026-11-03:** Variant P asosiy UI qilindi (4-bo'limga qarang). Commit qilinmagan, branch `feat/mobil-ilova-demo`.
- **2026-11-20:** Variant P commit qilingan va `main` ga birlashtirilgan (`bce4041`, `88fc27e`). "test data" so'rovi bo'yicha `seed_demo` toza PostgreSQL bazada sinaldi, `custom_requests` dagi xato tuzatildi; qolganlari 5-bo'limda. Branch `claude/focused-lovelace-vqrks0`.
