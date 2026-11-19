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
- **Arendator.uz (alohida yangi loyiha) — UI dizayn bosqichi:** bozor tahlili qilindi, mobil ilova uchun 6 ekran (bosh sahifa, e'lon + bo'lib to'lash kalkulyatori, ijara, e'lon berish, to'lovlarim, uy-joy) va admin panel maketi chizildi. Maket Claude dizayn kanvasida: https://claude.ai/artifact/JB3XQ9VvBWhegVHrdeePiJ (repoda kod yo'q). Logo: kalit, halqasi bo'laklangan (boshlang'ich to'lov + oylar). Rang: ko'k `#1D4ED8` + sariq `#FFB020`, shrift Onest.
- **Arendator.uz — ishlaydigan birinchi versiya (2026-11-19):** backend (Express + SQLite, sintetik ma'lumot: 82 faol e'lon, 14 sotuvchi, 5 reklama, arizalar, shartnomalar), React mobil ilova, admin panel (`#/admin`: moderatsiya, reklama, arizalar, sotuvchilar, shartnomalar) va Capacitor Android loyihasi yozildi; debug APK yig'ildi. Kod `mystat` da emas: konteynerda `/home/user/arendator` (lokal git, commit `554c1b5`), foydalanuvchiga APK va manba zip yuborilgan. 6 ta test o'tadi, brauzerda asosiy oqimlar tekshirilgan; APK telefonda sinalmagan.

## 5. Qolgan ishlar
- Mockup'dagi soxta bloklar (jonli hodisalar lentasi, ko'rsatkichlar tikeri) ataylab olinmadi: ular uchun haqiqiy ma'lumot manbasi kerak.
- Ichki sahifalar (`/spheres`, `/service/:n`, `/check` va b.) yangi qobiq ichida ishlaydi, lekin kartalari hali eski uslubda. Birma-bir yangilash kerak.
- Mobil ko'rinish va tungi rejim brauzerda tekshirilmagan.
- Palitra tanlagich (18 variant) kiritilmagan, faqat "Bayroq ko'ki".
- Eski `HomePageV2`, `PublicLayout` fayllari hali o'chirilmagan.
- **Arendator.uz:** GitHub'da repo yo'q — foydalanuvchi bo'sh `arendator` reposini ochishi kerak, keyin kod push qilinadi (Claude repo yarata olmaydi). Qolgani: SMS orqali ro'yxatdan o'tish, haqiqiy to'lov tizimi, rasm ombori, reliz imzosi, serverni joylashtirish, bosh sahifa uslubini (A–E variantlar) tanlash. Ochiq savollar: platforma faqat e'lon maydonimi yoki to'lovni ham o'zi yuritadimi; PQ-294 (2027-01-01 dan muddatli to'lov operatorlari tartibi, ko'chmas mulk cheklovi) bo'yicha yurist xulosasi.

## 7. Sessiyalar jurnali
- **2026-11-03:** Variant P asosiy UI qilindi (4-bo'limga qarang). Commit qilinmagan, branch `feat/mobil-ilova-demo`.
- **2026-11-19:** Arendator.uz uchun bozor tahlili va mobil UI + admin panel maketi (4-bo'limga qarang). `mystat` kodida o'zgarish yo'q, oxirgi commit `88fc27e` (PR #1 merge). Branch `claude/inspiring-hopper-o1f8z1`.
- **2026-11-19 (2):** Arendator.uz backend + ilova + admin + APK qurildi (4-bo'lim). Android SDK uchun `arendator` bulut muhiti yaratildi (`dl.google.com` ruxsati). `mystat` ga push 403 beryapti (GitHub ruxsati yo'q), lokal commitlar push qilinmagan.
