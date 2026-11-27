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

- **Tashqi savdo import/eksport tahlili (2026-11-19)**, kod o'zgartirilmadi:
  - Import 3 xil va bir-biriga mos emas: API `POST /trade-data/upload` (`trade_data_services.py`, `MONTH` ustuni + `year` parametri), admin `TradeDataExcelResource` (`GOD`='2022.M1', SITC level=4, product level=3, mavjud yil+davlat+mahsulot qatorlarini o'tkazib yuboradi), management command `trade_data` (`GOD`).
  - Eksport: `GET external-trade/trade-flows/export/?file=csv|xlsx` (10 000 qator limit, `X-Rows`/`X-Truncated`), frontend `api/tradeFlows.ts` ishlatadi. CSV/XLSX yaratilishi tekshirildi.
  - Lokal ishga tushirish: Postgres 16 (SQLite migratsiyada yiqiladi), `logs/` papkasi kerak, `.env` da `CLICK_*`, `MERCHANT_*`, `RETURN_URL` majburiy.

- **Tashqi savdo import/eksport tuzatildi (2026-11-27):**
  - `trade_data_services.py` qayta yozildi: kodlar matn sifatida o'qiladi (bosh nollar saqlanadi), CSV qo'llab-quvvatlanadi, yilni almashtirish bitta atomik transaksiyada (hamma qator rad etilsa eski ma'lumot saqlanadi), hisobotda `missing_codes` (qaysi kodlar topilmadi), `mode=replace|fill` (`fill`: bazada bor davr (oy+oqim) o'zgarmaydi, yo'qlari fayldan qo'shiladi).
  - `trade-flows/?compare_year=` : bir xil davr bo'yicha taqqoslash (`compare_value`, `compare_pct`, `compare.comparable`), `limit` 1000 gacha. Eksport: `year2` ustunlari, chegara 1 000 000 qator, XLSX `write_only`.
  - Frontend `TradeFlows.tsx`: taqqoslashda jadval, "Farq" ustuni, ogohlantirish, "Hammasi" tugmasi.

## 5. Qolgan ishlar
- `dwh` bazasiga (host `db`) cloud'dan ulanib bo'lmaydi, haqiqiy ma'lumot hali ko'rilmagan. Dump yoki kompyuter ulanishi kerak; keyin `mode=fill` bilan yuklash.
- Admin importi (`TradeDataExcelResource`) hali eski: kalit faqat (yil, davlat, mahsulot), `GOD` formati. Yagona servisga o'tkazish kerak.
- Import uchun avtomatik test yozilmagan (bosh nol, fill rejimi, atomiklik).
- Taqqoslashda `change_pct` (o'tgan yilga nisbatan) qisqartirilgan davr bilan hisoblanmaydi.
- **Xato:** `process_excel_file` `dtype_dict` ni ishlatmaydi, `pd.read_excel` kodlarni songa aylantiradi (`'010121'` -> `10121`), natijada barcha qatorlar `missing_map` bilan rad etiladi. `dtype=str` kerak.
- **Xato:** yil eski ma'lumotlari pool'dan oldin o'chiriladi va transaksiya yo'q: import yiqilsa, yil bo'sh qoladi. Xato qatorlar (noma'lum davlat) jimgina tashlanadi, fayl bo'yicha hisobot yo'q.
- `services/excel_to_sqlite.py` hech qayerda ishlatilmaydi va modellarga mos emas (`name_uz_lat`, `country_group` FK; modelda `name_uz`, M2M). O'chirish yoki tuzatish kerak.
- Admin: `admin/trade_data.py` ham `TradeData` ni ro'yxatdan o'tkazadi (ishlatilmaydi, `tradedata_admin.py` yuklanadi). Resource'da `print` va `skip_unchanged` ishlatilgan, kalit faqat (yil, davlat, mahsulot), shu sababli oy/yo'nalish/SITC farqli qatorlar yo'qoladi.
- `common.SiteSettings.main_server_client_id/secret` da `max_length` yo'q (SQLite check xatosi).
- Mockup'dagi soxta bloklar (jonli hodisalar lentasi, ko'rsatkichlar tikeri) ataylab olinmadi: ular uchun haqiqiy ma'lumot manbasi kerak.
- Ichki sahifalar (`/spheres`, `/service/:n`, `/check` va b.) yangi qobiq ichida ishlaydi, lekin kartalari hali eski uslubda. Birma-bir yangilash kerak.
- Mobil ko'rinish va tungi rejim brauzerda tekshirilmagan.
- Palitra tanlagich (18 variant) kiritilmagan, faqat "Bayroq ko'ki".
- Eski `HomePageV2`, `PublicLayout` fayllari hali o'chirilmagan.

## 7. Sessiyalar jurnali
- **2026-11-03:** Variant P asosiy UI qilindi (4-bo'limga qarang). Commit qilinmagan, branch `feat/mobil-ilova-demo`.
- **2026-11-19:** Tashqi savdo import/eksport tahlil qilindi, frontend (5173) va backend (8000, Postgres 16) lokal ishga tushirildi (4 va 5-bo'limlarga qarang).
- **2026-11-27:** Import servisi, `trade-flows` taqqoslash va eksport tuzatildi; dwh ulanishi bloklangan (5-bo'lim).
