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

- **2026-11-03 (davomi):** 50 ta xizmat avtomatik tekshirildi (Playwright, mehmon va kirgan). Yuklanmaydigan 7 tasi olib tashlandi: 107, 108, 202, 402, 1002, 1003 (+201 Hisobot kalendari foydalanuvchi talabi bilan). Katalog 43 ta xizmat.
- Bosh sahifadagi "Eng ko'p foydalaniladigan xizmatlar" kartalari kattalashtirildi (muddat, narx/kirish, baho, foydalanish soni).
- Qidiruv: ma'lumot (ko'rsatkich) bo'yicha izlash, tarif/kirish belgisi, mehmon uchun rol bo'yicha kirish, AI tavsiyasi (vLLM/Gemma, `docs/AI_QIDIRUV.md`).

- **Tashqi savdo:** `/trade-flows` yangi KPI, savdo maslahatchisi (AI yoki qoidalar) va Word (.docx) hisobot (`advisor.py`).
- **AI agent (pullik ma'lumot):** `apps/credits/agent.py`: so'rovni tushunadi, to'plamlarni topadi, narxlaydi; qabul qilsa hamyondan yechiladi, rad etsa taklif o'chadi; sotib olingan ma'lumot (davr bilan) qayta to'lovsiz ochiladi; tarix va yuklash. Arxitektura va xarajatlar: `docs/AI_AGENT_ARXITEKTURA.md`. Migratsiya `credits.0007_data_agent`.
- **Chatbot** bosh sahifa hero'sida (`HeroChat`, `/api/common/chat/`).
- **Deploy:** eski UI qolishi sabablari va to'g'ri joylash: `docs/SERVERGA_JOYLASH.md`. index.html `no-cache`, footerda `build <commit>`, `python-docx` requirements'ga qo'shildi.

## 5. Qolgan ishlar
- Agent narx jadvalini egasi tasdiqlashi; bojxona ma'lumotini sotish huquqiy shartlari.
- Serverda `LLM_*` ni sozlab Gemma bilan jonli tekshirish (chatbot, tavsiya, agent nomzod tavsiyasi).
- Serverda `LLM_*` sozlash va AI tavsiyasini jonli tekshirish (lokalda LLM yo'q, AI o'chiq).
- Mockup'dagi soxta bloklar (jonli hodisalar lentasi, ko'rsatkichlar tikeri) ataylab olinmadi: ular uchun haqiqiy ma'lumot manbasi kerak.
- Ichki sahifalar (`/spheres`, `/service/:n`, `/check` va b.) yangi qobiq ichida ishlaydi, lekin kartalari hali eski uslubda. Birma-bir yangilash kerak.
- Mobil ko'rinish va tungi rejim brauzerda tekshirilmagan.
- Palitra tanlagich (18 variant) kiritilmagan, faqat "Bayroq ko'ki".
- Eski `HomePageV2`, `PublicLayout` fayllari hali o'chirilmagan.

## 7. Sessiyalar jurnali
- **2026-11-03:** Variant P asosiy UI qilindi (4-bo'limga qarang). Commit qilinmagan, branch `feat/mobil-ilova-demo`.
- **2026-11-04:** AI agent: sotib olishdan oldin yashirin namuna (`agent.sample`: ustunlar, qamrov, "•••" qatorlar; haqiqiy nom va qiymat yo'q), sotib olgandan keyin `/credits/agent/purchases/<id>/preview/` (jadval sahifalab, yillar diagrammasi). Frontend: `DataPreview.tsx`. `docker-compose.yml` backend'ga `host.docker.internal`. Serverda (172.30.30.30:8085) hali eski image: qayta build kerak (`docs/SERVERGA_JOYLASH.md`).
- **2026-11-04 (2):** UN Comtrade+ importi: `ComtradeFlow`/`ComtradeSyncLog` (migratsiya 0071), `sync_comtrade` buyrug'i, `comtrade_sync_task` + beat (kalit bo'lsa), `/external-trade/comtrade/overview/`. Batafsil: `docs/COMTRADE.md`. Kalit (`COMTRADE_API_KEY`) hali yo'q: faqat ochiq API bilan shakar (HS 1701) 2019-2024 yuklandi.
- **2026-11-04 (3):** Comtrade ma'lumoti "Tashqi savdo oqimlari" sahifasiga qo'shildi (`ComtradePanel`: mahsulot/yil tanlash, eksport/import, hamkorlar diagrammasi, bojxona bilan farq). Comtrade savdo kodlari (251 Fransiya, 842 AQSh va b.) ISO ga o'giriladi (`ISO_ALIAS`).
- **2026-11-04 (4):** `/ex-trade` parametrli tahlilga 4-qadam "Natijani sozlash" qo'shildi (`ResultOptions.tsx`): nom bo'yicha qidiruv, davlatlarni chiqarib tashlash, qiymat oralig'i (oxirgi davr bo'yicha, ming $), saralash, top-N, "Ulush, %" va "O'sish, %" ustunlari. Backend `trade-data/` serializer'iga ixtiyoriy maydonlar (`exclude_countries`, `search`, `min_value`, `max_value`, `sort_by`, `top_n`, `show_share`, `show_growth`) va `newviews._shape_rows`; jami qator to'liq qoladi, yangi parametrlarsiz javob o'zgarmaydi. Testlar: `tests_trade_filters.py` (9 ta).
