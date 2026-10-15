# SIAT hududlar xaritasi — bajarilgan ishlar va keyingi qadamlar

Asos: `SIAT_KARTA_TAHLIL.md` (KR-01 … KR-14). Holat sanasi: 2026-10-15.

## Commitlar

| Commit | Mazmuni |
|---|---|
| `27eedf5` | Backend: `apps/siat` — SIAT ko'rsatkichlari bazaga sinxronlanadi (KR-01..KR-05, KR-10, KR-14) |
| `303452e` | Frontend: hududlar xaritasi SIAT ma'lumoti va SOATO chegaralari bilan (KR-06..KR-13) |
| `41a0ae3` | Buyruqlar panelida `/regions` → "Hududlar xaritasi" |

## Bajarilgan ishlar

### Backend (`backend/apps/siat`)
- **Modellar:** `Territory` (SOATO), `SiatIndicator`, `SiatBreakdown`, `SiatValue`, `SiatSyncLog`. Migratsiyalar `0001_initial`, `0002_group_region_override`.
- **Normallashtirish** (`normalize.py`): davr nomlari (kirillcha "М" → "M"), `2023.1` kabi dublikat ustunlar tashlanadi, soxta nollar → "ma'lumot yo'q", dastlabki yillar aniqlanadi.
- **Tasniflash** (`classify.py`): tuman / viloyat / respublika / faoliyat turi bo'yicha jadvallar.
- **Katalog** (`catalog.py`): 13 asosiy ko'rsatkich, 2 guruh (sanoat va investitsiya — faoliyat turi bo'yicha, viloyatlar kesimida), 4 qo'shimcha manba, 5 hosila ko'rsatkich (aholi zichligi, qishloq aholisi ulushi, aholi o'sishi, jinsiy nisbat, real ish haqi).
- **Klient** (`client.py`): faqat `https://api.siat.stat.uz/media/`, so'rovlar orasida 1,5 s, 429 da Retry-After bilan qayta urinish.
- **Sinxronlash** (`sync.py`): o'zgarmagan jadvallar o'tkazib yuboriladi, guruh va hosila ko'rsatkichlar qayta quriladi, kesh versiyasi yangilanadi, obunachilarga bildirishnoma yuboriladi.
- **Sifat nazorati** (`quality.py`): yo'qolgan hududlar, ±50% sakrashlar, 365 kundan eski ma'lumot — staff'ga ogohlantirish.
- **Celery beat:** `siat-sync` har kuni 03:30 da (`BEAT_SIAT_SYNC_HOUR`, `BEAT_SIAT_SYNC_MINUTE`).
- **Admin:** holat ro'yxati, "Hozir yangilash", JSON faylni qo'lda yuklash, hammasini sinxronlash.
- **API** (`/api/common/map/`): `indicators/`, `values/` (CSV/XLSX eksport bilan), `territory/<soato>/`, `territories/`.
- **Hududiy profil:** aholi, o'rtacha ish haqi, ishsizlik, aholi jon boshiga YaHM va tumanlar jadvali SIAT'dan olinadi ("SIAT" belgisi bilan).
- **Buyruqlar:** `sync_siat` (`--ids`, `--force`, `--catalog`, `--file ID PATH`), `build_map_boundaries` (geoBoundaries asosida).
- **Testlar:** `tests/test_siat.py` — 31 ta test, haqiqiy SIAT fayllari asosida.

### Frontend
- `public/geo/regions.geojson`, `public/geo/districts.geojson` — SOATO kodli chegaralar.
- `components/maps/ChoroplethMap.tsx` — fon xaritasiz Leaflet xoropleti, "ma'lumot yo'q" shtrix bilan.
- `utils/mapScale.ts` — kvantil / chiziqli / divergent / bivariant shkalalar (testlari bor).
- `pages/Regions.tsx` — viloyat → tuman drill-down, yil bo'yicha animatsiya, ikki hududni solishtirish, ikki ko'rsatkichli (bivariant) karta, qidiruv (kirillcha ham), "Mening hududim" (joylashuv), PNG/CSV/XLSX eksport, holat URL'da saqlanadi.
- `MapLegend.tsx`, `TerritoryPanel.tsx` — legenda va hudud kartochkasi (o'rin, o'rtachaga nisbatan, dinamika).

### Tekshiruvlar
- Backend testlari (siat + citizens + analytics): 53 ta OK.
- tsc 0 xato, ESLint 0 xato, Vitest 18 ta OK, `vite build` OK.
- Brauzerda: drill-down, shtrix, bivariant, qidiruv, PNG, profil sahifasi, animatsiya, mobil (390 px) tekshirildi.

## Qilish kerak bo'lgan ishlar

### Production (majburiy)
1. `python manage.py migrate` — `siat` jadvallari yaratiladi.
2. Serverdan `https://api.siat.stat.uz` ga ulanish borligini tekshirish.
3. `python manage.py sync_siat` — birinchi to'liq yuklash (SIAT 429 qaytarsa, keyinroq `--ids` bilan qayta).
4. Celery beat ishlayotganini tekshirish (`siat-sync` 03:30).
5. Ulanish bo'lmasa: admin → SIAT → "Faylni yuklash" orqali JSON'larni qo'lda yuklash.

### Ma'lumot muammolari (admin orqali)
- **Investitsiyalar guruhi:** SIAT'da 2601 va 2603 jadvallarining ikkalasi "Qashqadaryo" deb nomlangan, shu sabab Qashqadaryo kartada yashirilgan. Admin'da "Jadval hududi (qo'lda)" (`group_region_override`) maydoniga to'g'ri viloyatni qo'yish kerak.
- **Buxoro** investitsiya jadvali SIAT'da topilmadi — topilsa katalogga qo'shish.
- **7 ta yangi tumanning chegarasi yo'q** (geoBoundaries'da mavjud emas): Ko'kdala, G'ozg'on, Bandixon, Yangihayot, Tuproqqal'a, Bo'zatov, Taxiatosh. Rasmiy chegara topilsa `build_map_boundaries` + `data/boundary_overrides.json` orqali qo'shish.

### Ochiq qarorlar
- `ISH_REJASI.md` ish papkasida o'chirilgan holatda — o'chirishni tasdiqlash yoki tiklash.
- `SIAT_KARTA_TAHLIL.md` (tahlil fayli) repoga qo'shilmagan — kerak bo'lsa commit qilish.
- GitLab remote — foydalanuvchi beradi (GitLab `main`'ga push production deploy'ni ishga tushiradi).

### Avvaldan ochiq qolganlar
- OS-19, OS-20.
- 38-xizmat nofaol.
- Unumdorlik bo'yicha ishlar.
