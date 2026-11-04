# AI agent: arxitektura, narx siyosati va xarajatlar

> Sana: 2026-11-03. Kod: `backend/apps/credits/agent.py`, `agent_api.py`, `backend/apps/common/llm.py`,
> `backend/apps/additional_services/api_endpoints/ExternalTradeAPI/advisor.py`, `frontend/src/components/search/DataAgentPanel.tsx`.

## 1. Asosiy qoida: kim nima qiladi

| Ishtirokchi | Nima qiladi | Nima QILMAYDI |
|---|---|---|
| **AI agent** (qoidalar + ixtiyoriy Gemma) | so'rovni tushunadi ("shakar eksport" → HS 1701, oqim, yillar), bazadan to'plamlarni topadi, savol beradi | pul yechmaydi, narx belgilamaydi |
| **Narx siyosati** (kodda, `agent.py`) | har to'plam narxi, to'plam chegirmasi, yaxlitlash | LLM'ga bog'liq emas |
| **Foydalanuvchi** | "Qabul qilaman" yoki "Rad etaman" | |
| **Hamyon xizmati** (`credits.service.spend`) | bitta tranzaksiyada yechadi, FIFO, balans manfiy bo'lmaydi | |

Pul faqat foydalanuvchi qabul qilgandagina yechiladi. LLM o'chiq bo'lsa ham agent qoidalar bilan ishlaydi.

## 2. Umumiy arxitektura

```
Brauzer (Qidiruv /search?q=…)
  │  TRADE_INTENT mos kelsa (eksport/import/HS kod)
  ▼
POST /api/credits/agent/quote/ ──► agent.parse_query ──► find_products (HS4 sarlavhalari, bazadan)
                                         │                    │  bir nechta nomzod bo'lsa → savol qaytadi
                                         │                    └─ (LLM yoqiq bo'lsa nomzoddan "tavsiya" belgilaydi)
                                         ▼
                                   build_items: 4 ta to'plam (yillar, davlatlar, viloyatlar, HS6)
                                   qator soni TradeData'dan; narx = siyosat
                                         ▼
                                   DataOffer (30 daqiqa) saqlanadi  ──► javob: to'plamlar, narx, balans, chegirma
  │
  ├─ Rad etaman  → POST /agent/decline/  → DataOffer o'chadi, pul yechilmaydi
  └─ Qabul       → POST /agent/accept/   → (tranzaksiya) narx offer'dan olinadi → spend() → DataPurchase yoziladi
                                              ▼
                     GET /agent/history/            tarix (hamyon bo'yicha)
                     GET /agent/purchases/<id>/download/?file=xlsx|csv   sotib olingan to'plam, qayta to'lovsiz
```

Mehmon (kirmagan) foydalanuvchi ham to'plamlar va narxni ko'radi, taklif saqlanmaydi: "Sotib olish uchun kirish" tugmasi
`/login?next=…` ga olib boradi (rol tanlash ekrani), kirgach qidiruvga qaytadi.

## 3. Narx siyosati (so'm)

Standart qiymatlar `agent.POLICY`; admin'da `CreditPrice` jadvalidagi kodlar bilan almashtiriladi (kodga tegmasdan).

| To'plam | Boshlang'ich | Har 100 qator | CreditPrice kodlari |
|---|---|---|---|
| Yillar bo'yicha dinamika | 5 500 | 0 | `agent_yearly_base`, `agent_yearly_per100` |
| Davlatlar kesimi | 16 500 | 3 300 | `agent_countries_*` |
| Viloyatlar kesimi | 11 000 | 5 500 | `agent_regions_*` |
| HS6 mahsulotlar kesimi | 22 000 | 3 300 | `agent_products_*` |

- Narx = boshlang'ich + qator/100 × tarif; **500 so'mgacha yuqoriga yaxlitlanadi**; bitta to'plam uchun yuqori chegara 165 000 (`agent_item_max`).
- To'plam chegirmasi: 2 ta pullik to'plamga 5%, 3 va undan ko'pga 10% (`agent_bundle2_pct`, `agent_bundle3_pct`).
- Qator soni bazadagi haqiqiy hisob, shuning uchun mahsulot kattalashsa narx ham oshadi. Misol: shakar (HS 1701) eksporti uchun 4 to'plam ≈ 58 000 so'm, 10% chegirma bilan ≈ 52 000.
- Ko'rsatilgan narxlar mavjud tarif jadvaliga mos qilib tanlangan (profil ochish 16 500, bozor tahlili 49 500, konsultatsiya 82 500). Yakuniy qiymatlarni egasi tasdiqlashi kerak.

## 4. Tarix va qayta ochish

- `DataPurchase` har hamyon (korxona yoki shaxsiy) uchun yoziladi: to'plam turi, mahsulot, oqimlar, **yil va davr (oxirgi oy)**, narx, so'rov matni.
- `fingerprint` = sha256(to'plam turi + HS + oqimlar + yil→davr). `(hamyon, fingerprint)` bazada **unique**: bir xil ma'lumot va davr ikki marta sotilmaydi.
- Qayta so'rovda sotib olingan to'plam "sotib olingan, qayta to'lov yo'q" deb chiqadi, narxi 0, yuklab olinadi.
- Fayl saqlangan davr bo'yicha qayta yaratiladi (nusxa saqlanmaydi): davr qulflangani uchun mazmun o'zgarmaydi. Yangi oy ma'lumoti kelsa, fingerprint o'zgaradi va u yangi mahsulot bo'ladi.
- Xodimlar bitta korxona hamyonini ishlatsa, tarix ham umumiy.

### Namuna va ko'rish
- **Sotib olishdan oldin** har to'plamda `sample` bor: ustunlar, qamrov ("6 yil · eksport · 12 ta davlat") va 3 ta yashirilgan qator. Faqat yil, davr, oqim ochiq; davlat/viloyat/mahsulot nomi va qiymatlar serverda "•••" ga almashtiriladi, shuning uchun brauzerda ochib bo'lmaydi.
- **Sotib olgandan keyin** `GET /api/credits/agent/purchases/<id>/preview/?offset=&limit=` (limit ≤ 100): jadval sahifalab va yillar bo'yicha diagramma. To'liq fayl XLSX/CSV bilan yuklanadi. Jadval manbasi bitta: `agent.dataset()` (namuna, ko'rish va yuklash uchun).

## 5. Xavfsizlik va to'g'rilik

- **Narxga mijoz ta'sir qilmaydi:** qabul paytida narx `DataOffer` ichida saqlangan qiymatdan olinadi.
- **Bir tranzaksiya:** `select_for_update` + `spend` + `DataPurchase` yaratish bitta `atomic` blokda; xatoda hech narsa yechilmaydi. Takroriy bosish ikkinchi marta yechmaydi (taklif `accepted` bo'ladi, fingerprint unique).
- Taklif 30 daqiqa amal qiladi, undan keyin `410 expired`; rad etilsa darhol o'chadi.
- Mablag' yetmasa `402 insufficient` (kerakli va mavjud summa bilan), taklif saqlanadi, pul yechilmaydi.
- Foydalanuvchi matni LLM'ga faqat kalit so'z ajratish va nomzoddan tanlash uchun beriladi; javobdagi kod nomzodlar ro'yxati bilan tekshiriladi.
- Tezlik cheklovi: so'rov (taklif) mehmonga 20/daq, kirganga 60/daq.
- Sinovlar: `apps/credits/tests_agent.py` (narx, chegirma, qabul, yetarli emas, muddati o'tgan, boshqa foydalanuvchi, rad etish, takroriy to'lov yo'qligi, tarix).

## 6. Xarajatlar

Lokal Gemma (vLLM) ishlatilgani uchun har so'rov uchun token haqi yo'q; xarajat server resursi (GPU vaqti, elektr).

**So'rov hajmi** (o'lchangan va baholangan, 1 token ≈ 3 belgi deb):

| Ish | Kirish | Chiqish | Qachon chaqiriladi |
|---|---|---|---|
| Xizmat tavsiyasi (qidiruv) | ≈ 3 500 token (43 xizmat katalogi) | ≈ 150 | har qidiruvda 3+ belgi |
| Savdo maslahatchisi | ≈ 800 token (raqamlar JSON) | ≤ 1 000 | "Tahlil qilish" bosilganda; natija 30 daqiqa keshlanadi |
| Agent: kalit so'z / nomzod tanlash | ≈ 150 | ≈ 30 | faqat qoidalar topolmasa yoki nomzod ko'p bo'lsa |
| Narxlash, qator sanash, fayl | LLM yo'q | | faqat baza so'rovi |

**Bitta so'rov narxi** = (kirish + chiqish token) / (server tezligi, token/soniya) × (GPU soatlik narxi / 3600).
Server tezligi va GPU narxini siz bilasiz, shuning uchun jadvalni shu formula bilan to'ldiring:

| Ish | Token | GPU soniya = token / T | Narx = soniya × (GPU so'm/soat ÷ 3600) |
|---|---|---|---|
| Xizmat tavsiyasi | ≈ 3 650 | 3 650 / T | … |
| Savdo tahlili | ≈ 1 800 | 1 800 / T | … |
| Agent yordamchi chaqiruvi | ≈ 180 | 180 / T | … |

Bu raqamlarni o'zim to'ldira olmayman: vLLM tezligi (T) va GPU narxi menga ma'lum emas. Tezlikni o'lchash uchun serverda
bitta so'rov yuborib `usage.completion_tokens` va vaqtni solishtiring.

**Qo'shimcha xarajatlar:** PostgreSQL so'rovlari (har to'plam uchun bitta `COUNT DISTINCT`, millisekundlar), Redis keshi, kuniga bir marta
muddati o'tgan takliflarni tozalash. Hamyon to'ldirishdagi to'lov komissiyasi (Click va boshqalar) alohida, agent ularga qo'shmaydi.

**Daromad bilan solishtirish:** bitta to'plam 5 500 dan 165 000 so'mgacha. Bitta AI chaqiruvi odatda minimal narxning kichik qismi,
shuning uchun asosiy xavf LLM emas, **ma'lumot manbasi huquqi** (bojxona ma'lumotini sotish shartlari) va to'lov komissiyasi.
Agar AI xarajati yuqori chiqsa: tavsiya natijasini keshlash (hozir tahlil keshlanadi, qidiruv tavsiyasi hali yo'q) va mehmonlar uchun AI'ni o'chirish eng arzon yechim.

## 7. Server sozlamasi

```
LLM_BASE_URL=http://127.0.0.1:8002/v1      # Docker ichida: host.docker.internal yoki host IP
LLM_API_KEY=<~/.vllm_api_key>
LLM_MODEL=google/gemma-4-26B-A4B-it
LLM_TIMEOUT=25
```
LLM_BASE_URL bo'sh bo'lsa AI o'chiq: tavsiya va savdo tahlili qoidalar bilan ishlaydi, agent to'plamlarni baribir topadi va narxlaydi.
Migratsiya: `python manage.py migrate credits` (0007_data_agent: `DataOffer`, `DataPurchase`).

## 8. Ochiq masalalar
- Narx jadvalini egasi tasdiqlashi kerak (3-bo'lim); admin'dan o'zgartiriladi.
- Bojxona ma'lumotini qayta sotishning huquqiy shartlari (manba: Milliy statistika qo'mitasi, bojxona).
- Tuman kesimi bazada yo'q, shuning uchun sotilmaydi (faqat viloyat).
- Ma'lumot sifati: 2022 faqat yanvar, 2023 to'liq emas ko'rinadi. Bunday yillar fayl izohida ogohlantirilmaydi, tahlilda ogohlantiriladi. Sotishdan oldin shuni foydalanuvchiga ko'rsatish kerak.
- Hozir so'rovlar faqat tashqi savdo uchun; boshqa ma'lumot turlari (narxlar, demografiya) `POLICY` ga o'xshash tarzda qo'shiladi.
