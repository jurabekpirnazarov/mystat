# my.stat.uz — Konsalting platformasi: loyiha hujjati

> Bu hujjatda **real ma'lumot, parol, kalit, token, server manzili va admin panelning maxfiy yo'li yo'q**.
> Maxfiy qiymatlar faqat `.env` fayllarida saqlanadi, ular git'ga kirmaydi.
> Ma'lumotlar bazasi dump'i (`db/dump/*.dump`) ham git'ga kirmaydi va tarqatilmaydi.

---

## 1. Loyiha nima qiladi

Statistika qo'mitasining korxona, tashkilot va fuqarolar uchun xizmat portali:

- **Statistik xizmatlar paketlari (tariflar)**: tashkilot paket sotib oladi, paket ichidagi xizmatlardan limit bo'yicha foydalanadi.
- **Shartnomalar**: DOCX shablondan avtomatik yaratiladi va elektron imzolanadi (DIDOX / GoodSign).
- **To'lov**: Click (va Payme).
- **Kitob bozori**: statistik nashrlar (elektron, bosma, disk), buyurtma va pochta orqali yetkazish.
- **Ochiq statistik ma'lumotlar**: tashqi savdo, demografiya, sanoat mahsulotlari, narx indeksi (CPI), korxonalar reyestri (KTUT), hisobot kalendari, statistik klassifikatorlar.
- **Shaxsiy kabinet**: buyurtmalar, shartnomalar, paketlar, bildirishnomalar (in-app va Telegram).

---

## 2. Monorepo tuzilmasi

```
mystat/
├── backend/                   Django 5 + DRF API, admin panel
│   ├── core/                  settings (base / develop / production), urls, wsgi, celery
│   ├── apps/                  Django ilovalari (3-bo'lim)
│   ├── templates/admin/       admin login, 2FA, DIDOX sahifalari
│   ├── static/, media/        statik va yuklangan fayllar
│   ├── requirements/          base / develop / prod
│   ├── Dockerfile, docker-entrypoint.sh
│   └── README.md              backend bo'yicha batafsil hujjat
├── frontend/                  React 18 + Vite + TypeScript
│   ├── src/pages/             sahifalar (4-bo'lim)
│   ├── src/components/        UI komponentlar
│   ├── src/api/               axios klient, endpoint ro'yxati (apiUrls.ts)
│   ├── src/contexts/          Auth, Orders, Theme
│   └── Dockerfile
├── db/
│   ├── dump/                  PostgreSQL dump (git'ga kirmaydi)
│   └── init/01-restore.sh     Docker'da birinchi ishga tushishda dump'ni tiklaydi
├── nginx/default.conf.template  yagona kirish nuqtasi (reverse proxy)
├── docker-compose.yml
├── .gitlab-ci.yml             production deploy
├── .env.example               barcha sozlamalar ro'yxati (qiymatsiz)
├── README.md                  tez ishga tushirish
└── LOYIHA.md                  shu hujjat
```

`_archive/` papkasida eski CI fayllar va ishlatilmaydigan skriptlar turadi. U git'ga kirmaydi.

---

## 3. Backend

### Texnologiyalar

| Qatlam | Texnologiya |
|---|---|
| Framework | Python 3.12, Django 5.0, Django REST Framework 3.15 |
| Ma'lumotlar bazasi | PostgreSQL 14 |
| Autentifikatsiya | JWT (simplejwt + blacklist), OneID (egov.uz SSO), ERI |
| Kesh / navbat | Redis, Celery 5.4 |
| API hujjati | drf-spectacular (Swagger: `/api/docs/`, ReDoc: `/api/redoc/`) |
| Admin | django-jazzmin, ckeditor, import-export, jsonform; TOTP 2FA + reCAPTCHA |
| Ma'lumot qayta ishlash | pandas, pyarrow (parquet), openpyxl |
| Hujjatlar | docxtpl (shartnoma DOCX), num2word-uz |
| Bot | python-telegram-bot |

### Ilovalar (`backend/apps/`)

| App | Vazifasi | Asosiy modellar |
|---|---|---|
| `accounts` | Foydalanuvchilar, rollar, login | `User` (username, PINFL, rol, `individual`/`legal_entity`, auth provider), `Role`, `Permission`, `Accountant`, `Employee` |
| `organizations` | Foydalanuvchiga 1:1 bog'langan korxona | `Organization` (STIR, sektor, filial, tuman) |
| `services` | Xizmatlar va tarif paketlari | `Service`, `ServicePackage` (narx = BHM soni × BHM qiymati), `PackageServiceItem` (limit), `UserServicePackage`, xizmat so'rovlari, reyting |
| `contracts` | Shartnomalar va elektron imzo | `Contract` (raqam, summa, imzo holatlari, DIDOX ma'lumoti) |
| `payment` | To'lovlar | `Order`, `Transaction` (generic), provayder so'rovlari logi; Click Prepare/Complete |
| `book_market` | Kitob bozori | `Book`, `BookOption`, `OrderBook`, `OrderItem`, `PostalLocation` |
| `additional_services` | Statistik ma'lumot xizmatlari | tashqi savdo (`TradeData`, `Product`, `SITC`, `Country`...), demografiya (`DemographicSection` + parquet fayl), sanoat (`IndustrialProduct`, `Skp`), `Ktut`, `ReportList`, `PriceIndex`, klassifikatsiyalar |
| `notifications` | Bildirishnomalar | `Notification` (in-app + Telegram holati) |
| `common` | Umumiy poydevor | `BaseModel` (soft delete), `SiteSettings` (singleton), `Region`/`District`, `Branch`, `Sector`, FAQ, kontent, admin TOTP |
| `chat`, `monitoring` | Faol emas | — |

### API (barchasi `/api/` ostida)

| Prefiks | Nima |
|---|---|
| `accounts/` | ro'yxatdan o'tish, login, JWT yangilash, profil, OneID, parol tiklash |
| `organizations/` | tashkilotlar |
| `services/` | xizmatlar, paketlar, korxona ma'lumoti (tashqi reyestr), klassifikator, reyting |
| `contracts/` | shartnomalar ro'yxati va yaratish |
| `orders/` | buyurtma, Click callback'lari |
| `books/` | kitoblar katalogi, buyurtma, to'lov havolasi, pochta bo'limlari, e-kitob |
| `additional-services/` | tashqi savdo, demografiya, sanoat, CPI, KTUT, hisobotlar |
| `common/` | FAQ, statistika, murojaat, byulletenlar, portal haqida, DIDOX login |
| `notifications/` | bildirishnomalarim |

Endpoint'larning to'liq ro'yxati Swagger'da (`/api/docs/`) va `backend/README.md` da.

**Ruxsatlar:** global default `AllowAny`, ruxsat har bir view'da alohida belgilanadi. Ko'p ma'lumot endpoint'lari login talab qiladi. Pullik xizmatlar esa faol paket va limitni ham tekshiradi.

### Background jarayonlar

- **Celery worker**: `core/celery.py`, vazifalar `@shared_task` (masalan DIDOX hujjatlarini tekshirish).
- **Celery Beat**: hali sozlanmagan, davriy vazifalar jadvali kelishilishi kerak.
- **Telegram bot**: `python manage.py runbot`.
- **Management komandalar**: ma'lumot yuklash (`load_ktut`, `trade_data`, `load_regions`, `book_create`, ...) va `check_didox_documents`, `send_report_notifications`.

---

## 4. Frontend

**Texnologiyalar:** React 18, TypeScript, Vite 5, Tailwind CSS, MUI, React Router 7, axios. Grafiklar uchun Chart.js, Highcharts, Recharts, xarita uchun Leaflet, PDF uchun jsPDF va html2canvas.

**Sahifalar (`src/pages/`):**

| Yo'l | Sahifa |
|---|---|
| `/` | Bosh sahifa |
| `/services`, `/tariff/:id` | Xizmatlar, tarif tafsiloti |
| `/statistics`, `/statistical-data` | Statistika, demografik ma'lumotlar |
| `/ex-trade`, `/foreign-trade` | Tashqi savdo tahlili |
| `/industry` | Sanoat mahsulotlari |
| `/organizations*`, `/orginfo` | Korxonalar reyestri, KTUT, korxona ma'lumoti |
| `/reports`, `/report-calendar`, `/reglaments` | Hisobotlar, kalendar, reglamentlar |
| `/cpi-calculator` | Narx indeksi kalkulyatori |
| `/statistical-classifications` | Klassifikatorlar |
| `/books`, `/book-order`, `/book-order/map` | Kitob do'koni, buyurtma, pochta xaritasi |
| `/about`, `/contact`, `/questions` | Portal haqida, aloqa, FAQ |
| `/login`, `/auth/oneid/callback` | Kirish (yuridik shaxs: login/parol; jismoniy shaxs: OneID) |
| `/cabinet` | Shaxsiy kabinet (himoyalangan) |

**API manzili:** yagona sozlama `VITE_API_URL`. So'rovlar `VITE_API_URL + "api/..."` ga ketadi. Monorepo'da frontend va API bitta domenda bo'lgani uchun qiymat `/`. JWT `localStorage` da saqlanadi, 401 kelsa refresh token bilan avtomatik yangilanadi.

---

## 5. Ma'lumotlar bazasi

PostgreSQL 14, baza nomi `.env` dagi `DB_NAME`. Dump `pg_dump` custom formatida.

**Jadval guruhlari:**

| Guruh | Jadvallar |
|---|---|
| Foydalanuvchilar | `accounts_*`, `auth_*`, `token_blacklist_*`, `organizations_organization` |
| Xizmat va paketlar | `services_*` |
| Shartnoma va to'lov | `contracts_contract`, `payment_*` |
| Kitob bozori | `book_market_*`, `postal_locations` |
| Statistik ma'lumotlar | `additional_services_*` (eng katta hajm: tashqi savdo, KTUT, sanoat) |
| Umumiy | `common_*`, `region`, `district`, `notifications_notification` |
| Django | `django_*` |

**E'tibor bering:**
- **Fayllar bazada saqlanmaydi.** Rasm, PDF, video va demografiya parquet fayli `backend/media/` da turadi. Dump bilan birga kelmaydi, ularni serverdan alohida nusxalash kerak.
- **Begona jadvallar:** bazada Django modellariga tegishli bo'lmagan qo'lda yaratilgan jadvallar bor (`test`, `uz`, `years`, `my_stat_uz_platforma_uchun`). Ularni tozalash masalasini ko'rib chiqish kerak.
- **Dump shaxsiy ma'lumot saqlaydi** (PINFL, telefon, korxona ma'lumotlari). Uni faqat ishonchli muhitda saqlang, git'ga, chatlarga yoki ochiq joylarga qo'ymang.

---

## 6. Arxitektura (bitta domen)

```
                 ┌──────────────── web (nginx :80) ────────────────┐
 brauzer ──────► │ /              → React build (SPA)              │
                 │ /api/          → backend (gunicorn/Django)      │
                 │ /<ADMIN_URL>/  → backend (admin panel)          │
                 │ /static/       → collectstatic                  │
                 │ /media/        → backend/media                  │
                 └─────────────────────────────────────────────────┘
 backend, worker (celery), bot ──► db (postgres:14), redis
```

---

## 7. Ishga tushirish

### A) Docker bilan (tavsiya)

```bash
cp .env.example .env            # qiymatlarni to'ldiring
# dump faylni db/dump/consult.dump ga qo'ying
docker compose up -d --build
docker compose --profile bot up -d   # Telegram bot ham kerak bo'lsa
```

Birinchi ishga tushishda dump avtomatik tiklanadi. Qayta tiklash uchun `pgdata` volume'ni o'chiring (README'da yozilgan).

### B) Docker'siz (lokal ishlab chiqish)

1. **PostgreSQL 14** o'rnating (yoki portativ versiyasini yuklang) va bo'sh baza yarating.
2. Dump'ni tiklang:
   ```bash
   pg_restore --no-owner --no-privileges -d <DB_NAME> db/dump/consult.dump
   ```
3. Backend (Python **3.12**; 3.14 ba'zi paketlar bilan mos emas):
   ```bash
   cd backend
   python -m venv venv && venv\Scripts\activate
   pip install -r requirements/develop.txt
   # backend/.env ni yarating (.env.example asosida), DEBUG=True
   mkdir logs
   python manage.py runserver
   ```
4. Frontend:
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   # frontend/.env.development.local:  VITE_API_URL=/
   npm run dev
   ```
   Vite `/api` va `/media` so'rovlarini `localhost:8000` ga proxy qiladi.

> **Windows / Git Bash:** `VITE_API_URL=/ npm run dev` deb yozmang. Git Bash `/` ni Windows yo'liga aylantirib yuboradi va login "parol noto'g'ri" xatosini beradi. Qiymatni `.env.development.local` faylida bering.

**Lokal test foydalanuvchi yaratish** (faqat lokal bazada):
```bash
python manage.py shell
>>> from apps.accounts.models import User
>>> u = User.objects.create(username="test_user", first_name="Test", user_type="legal_entity")
>>> u.set_password("<o'zingiz tanlagan parol>"); u.save()
```
Login sahifasida **"Yuridik shaxs"** bo'limidan kiriladi. OneID lokalda ishlamaydi: unga egov.uz kalitlari va ro'yxatdan o'tgan domen kerak.

**Lokal media:** `DEBUG=True` va `.env` da `MEDIA_FALLBACK_URL` berilgan bo'lsa, lokalda yo'q rasm va PDF'lar shu manzildan olinadi. Bu faqat dev rejimda ishlaydi.

---

## 8. Sozlamalar (`.env`)

Qiymatlar faqat `.env` da turadi, quyida faqat nomlar. To'liq ro'yxat `.env.example` da.

| Guruh | O'zgaruvchilar |
|---|---|
| Django | `SECRET_KEY`, `DEBUG`, `ADMIN_URL` |
| Baza | `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` |
| Redis / Celery | `USE_REDIS`, `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` |
| Click (**majburiy**) | `CLICK_URL`, `MERCHANT_ID`, `MERCHANT_SERVICE_ID`, `MERCHANT_USER_ID`, `CLICK_SECRET_KEY`, `RETURN_URL` |
| OneID | `ONE_ID_CLIENT_ID`, `ONE_ID_CLIENT_SECRET` |
| DIDOX | `DIDOX_BASE_URL`, `DIDOX_PARTNER_TOKEN`, `DIDOX_USER_PINFL`, `DIDOX_USER_PASSWORD` |
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` |
| Saytlar | `MAIN_URL`, `SITE_URL`, `BACKEND_URL` |
| Tashqi reyestr | `REGISTER_BASE_URL`, `X_DEVICE_ID` |
| Admin 2FA | `RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`, `RECAPTCHA_VERSION`, `ADMIN_2FA_ISSUER` |
| Email | `EMAIL_*`, `DEFAULT_FROM_EMAIL` |
| Faqat lokal | `MEDIA_FALLBACK_URL` |
| Docker | `WEB_PORT`, `DB_PUBLIC_PORT` |

Frontend uchun faqat bitta sozlama bor: `VITE_API_URL`.

---

## 9. Deploy (GitLab CI)

Ildizdagi `.gitlab-ci.yml` serverdagi mavjud usulni saqlaydi: systemd, venv va nginx, Docker'siz.

- `backend/**` o'zgarsa: `pip install` → `migrate` → `collectstatic` → backend, bot va nginx servislari qayta ishga tushiriladi.
- `frontend/**` o'zgarsa: `npm install` → `npm run build` → nginx.

Serverni eski ikki repodan monorepo'ga o'tkazish qadamlari `README.md` ning "Production" bo'limida.

---

## 10. Monorepo'ga o'tishda qilingan o'zgarishlar

- **Papkalar:** `backend-main` → `backend`, `front-oqdev` → `frontend`, dump → `db/dump/`.
- **Docker:** Docker Compose (db, redis, backend, worker, bot, web/nginx) va ikkala qism uchun Dockerfile qo'shildi. Dump avtomatik tiklanadi.
- **Celery:** `core/celery.py` qo'shildi (avval Celery app umuman yo'q edi).
- **Kodlash:** `requirements/base.txt` UTF-16'dan UTF-8 ga o'tkazildi.
- **Frontend:** Vite dev proxy qo'shildi. Shaxsiy kabinetdagi qattiq yozilgan domen olib tashlandi.
- **Xavfsizlik:**
  - profil API javobidan parol hash'i olib tashlandi;
  - e-kitob va byulleten endpoint'lari mehmonga 500 o'rniga 401, paketsiz foydalanuvchiga 403 qaytaradi.
- **Lokal dev:** dev rejimda lokalda yo'q media fayllar `MEDIA_FALLBACK_URL` dan olinadi.
- **CI:** ildizdagi yagona `.gitlab-ci.yml`.

---

## 11. Ma'lum muammolar va qilinadigan ishlar

**Xavfsizlik (ustuvor):**
- [ ] `common/information/` endpoint'larida ruxsat tekshiruvi yo'q. Mehmon ham yozuv qo'shishi, o'zgartirishi va o'chirishi mumkin. Kim yozishi mumkinligini belgilash kerak.
- [ ] `ALLOWED_HOSTS = ['*']` va `CORS_ALLOW_ALL_ORIGINS = True`. Production'da cheklash kerak.
- [ ] `__debug__/` (debug toolbar) URL'i production'da ham ulangan.
- [ ] CKEditor 4 eskirgan va xavfsizlik tuzatishlarisiz qolgan.

**Funksional:**
- [ ] Celery Beat jadvali (DIDOX tekshiruvi va boshqalar) sozlanmagan.
- [ ] Statistik klassifikatsiyalar jadvali bo'sh.
- [ ] `core/asgi.py` noto'g'ri settings modulini ko'rsatadi.
- [ ] URL namespace takrorlanadi (`accounts`).
- [ ] Testlar deyarli yo'q.
- [ ] Begona jadvallarni (5-bo'lim) tozalash kerak.
- [ ] Frontend bundle katta (500 kB dan ortiq). Code-splitting kerak.
