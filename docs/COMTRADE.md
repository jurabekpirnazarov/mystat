# UN Comtrade+ : O'zbekiston ma'lumotini bazaga yuklash

> Sana: 2026-11-04. Kod: `backend/apps/additional_services/services/comtrade.py`, `models/comtrade.py`,
> `management/commands/sync_comtrade.py`, `ExternalTradeAPI/comtrade_api.py`, `tests_comtrade.py`.

## 1. Manba haqida (tekshirilgan)
- comtradeplus.un.org: BMT'ning rasmiy tashqi savdo bazasi (HS6, hamkor davlat, yillik va oylik). Sayt brauzerda dinamik yuklanadi, shuning uchun API orqali olinadi.
- **Ochiq `preview` API kalitsiz ishlaydi** (sinab ko'rildi), lekin so'rovga 500 qatorgacha va faqat aniq HS kodi bilan.
- **To'liq API** (`/data/v1/get`) bepul kalit bilan: comtradeplus.un.org > Sign in > APIs > Subscribe. Bepul darajada so'rovga 100 000 qator, kuniga taxminan 500 so'rov (raqamlarni kalit olgach saytda tasdiqlang).
- Kalitni akkauntga kirib o'zingiz olasiz va `.env` ga yozasiz (men akkaunt ochmayman).

## 2. Moslash: O'zbekiston miqyosi
| Comtrade | Bizning bazada |
|---|---|
| `reporterCode=860` | O'zbekiston hisobot beruvchi sifatida (`ComtradeFlow.reporter_code`) |
| `partnerCode` (ISO raqamli) | `Country.ctrana` bilan avtomatik bog'lanadi (`partner` FK); 0 = Dunyo jami |
| `cmdCode` (HS6) | `Product.code` bilan bog'lanadi (`product` FK); HS4 va `TOTAL` ham saqlanadi |
| `flowCode` X / M | Eksport / Import |
| `primaryValue` (USD), `netWgt`, `qty` | `value_usd`, `net_weight_kg`, `qty` |
- Faqat jami qatorlar olinadi (transport 0, ikkinchi hamkor 0, bojxona C00): aks holda bir yozuv bir necha marta sanaladi.
- `TradeData` (bojxona, viloyat kesimida, ming $) bilan **aralashtirilmaydi**: alohida jadval `comtrade_flows`. Yozuvlar `UNIQUE` kalit bilan upsert qilinadi, qayta yuklash dublikat yaratmaydi.
- Ko'zgu ma'lumot (hamkorlar O'zbekiston haqida bergan) hali yo'q: faqat O'zbekiston hisoboti.

## 3. Ishga tushirish
```bash
python manage.py migrate additional_services                    # 0071_comtrade
# Kalitsiz (ochiq API): aniq HS kodlar, har biri alohida so'rov
python manage.py sync_comtrade --hs 1701,170199 --years 2019-2024
# Kalit bilan: butun HS6 x hamkor, standart oxirgi 4 yil
python manage.py sync_comtrade --years 2022-2024
python manage.py sync_comtrade --freq M --years 2024 --months 1-6   # oylik
```
Har urinish `comtrade_sync_log` ga yoziladi (so'rovlar, qatorlar, xatolar): kvotani kuzatish va "partial" holatlarni ko'rish uchun.

## 4. Avtomatik yangilash (pipeline)
- Celery task: `apps.additional_services.tasks.comtrade_sync_task` (qo'lda: `.delay()`).
- Beat: har dushanba 03:00, faqat `COMTRADE_API_KEY` bor (yoki `COMTRADE_SYNC_ENABLED=True`) bo'lsa. Vaqtni `core/settings/base.py` da o'zgartiring.
- 429 (kvota) bo'lsa kutib qayta urinadi; 401/403 bo'lsa to'xtaydi va xatoni logga yozadi.

## 5. O'qish API
`GET /api/additional-services/external-trade/comtrade/overview/?year=2024&hs=1701`: yil bo'yicha jami eksport/import (USD), eng katta 10 hamkor,
bojxona ma'lumoti bilan farq (`compare`), oxirgi yuklash holati. `hs` berilmasa `TOTAL` yozuvdan olinadi.

## 6. Birinchi natija (shakar, HS 1701, ochiq API bilan yuklandi)
| Yil | Import: Comtrade | Import: bazadagi bojxona | Izoh |
|---|---|---|---|
| 2020 | 240,0 mln $ | 191,8 mln $ | +25% |
| 2023 | 471,9 mln $ | 2,7 mln $ | bojxona ma'lumoti to'liq emas (avval aniqlangan) |
| 2024 | 541,0 mln $ | 245,9 mln $ | farqni tekshirish kerak |

Xulosa: Comtrade bojxona bazasidagi to'liq bo'lmagan yillarni tekshirish va to'ldirish uchun foydali. Farq sabablari (CIF/FOB, davr, bojxona rejimlari) alohida tahlil qilinishi kerak, o'zim sabab deb taxmin qilmayman.

## 7. Ochiq masalalar
- Kalit olinmaguncha butun HS6 yuklab bo'lmaydi (faqat aniq kodlar). Kalit kelgach `sync_comtrade --years 2019-2024` ni sinash kerak: men uni kalitsiz tekshira olmadim.
- UN Comtrade foydalanish shartlari (manbani ko'rsatish, qayta tarqatish): sotiladigan ma'lumotga qo'shishdan oldin tekshiring.
- Hozircha frontendda ko'rsatilmaydi; "Tashqi savdo oqimlari" ga "Comtrade bilan solishtirish" bloki qo'shish mumkin.
