# Backend — Konsalting Platformasi API (my.stat.uz)

Statistika qo'mitasining konsalting platformasi uchun **Django 5 + Django REST Framework** backendi.
Platforma korxona va tashkilotlarga statistik xizmatlar (servis paketlari), shartnoma (DIDOX/GoodSign
orqali elektron imzolash), to'lov (Click), kitob bozori, tashqi savdo/demografiya/sanoat mahsulotlari
kabi statistik ma'lumot xizmatlarini API shaklida taqdim etadi.

---

## Mundarija

1. [Texnologiyalar](#texnologiyalar)
2. [Loyiha tuzilishi](#loyiha-tuzilishi)
3. [Ilovalar (apps) va ma'lumot modeli](#ilovalar-apps-va-malumot-modeli)
4. [API endpointlar](#api-endpointlar)
5. [Tez boshlash (local o'rnatish)](#tez-boshlash-local-ornatish)
6. [Muhit o'zgaruvchilari (.env)](#muhit-ozgaruvchilari-env)
7. [Sozlamalar modullari](#sozlamalar-modullari)
8. [Admin panel: maxfiy URL + 2FA + reCAPTCHA](#admin-panel-maxfiy-url--2fa--recaptcha)
9. [Autentifikatsiya (JWT, OneID, ERI)](#autentifikatsiya-jwt-oneid-eri)
10. [Tashqi integratsiyalar](#tashqi-integratsiyalar)
11. [Management komandalar](#management-komandalar)
12. [Celery va Telegram bot](#celery-va-telegram-bot)
13. [Ma'lumot yuklash (data seeding)](#malumot-yuklash-data-seeding)
14. [Deploy (GitLab CI/CD)](#deploy-gitlab-cicd)
15. [Loyihadagi kelishuvlar (conventions)](#loyihadagi-kelishuvlar-conventions)
16. [Ma'lum muammolar va eslatmalar](#malum-muammolar-va-eslatmalar)

---

## Texnologiyalar

| Qatlam | Texnologiya |
|---|---|
| Til / Framework | Python, **Django 5.0**, **DRF 3.15** |
| Ma'lumotlar bazasi | PostgreSQL (`psycopg2-binary`), default fallback — SQLite |
| Autentifikatsiya | `djangorestframework-simplejwt` (+ token blacklist), OneID (SSO egov.uz) |
| Kesh / Broker | Redis (`django-redis`), Celery 5.4 |
| API hujjatlari | `drf-spectacular` (asosiy), `drf-yasg` (eski, o'chirilgan holda turadi) |
| Admin UI | `django-jazzmin`, `django-ckeditor`, `django-import-export`, `django-jsonform` |
| Analitika/ETL | `pandas`, `pyarrow` (parquet), `openpyxl` |
| Hujjat generatsiya | `docxtpl`, `num2word-uz` |
| 2FA | `pyotp` + `qrcode` (Google Authenticator TOTP) |
| To'lov | Click (o'zimizda yozilgan provider), `payme-pkg` |
| Bildirishnoma | `python-telegram-bot` 22.x |
| Dev tools | `django-debug-toolbar`, `django-query-counter`, `pre-commit` |

---

## Loyiha tuzilishi

```
backend/
├── core/                        # Loyiha yadrosi
│   ├── settings/
│   │   ├── base.py              # Barcha asosiy sozlamalar
│   │   ├── develop.py           # DEBUG=True, CELERY_TASK_ALWAYS_EAGER
│   │   └── production.py        # DEBUG=False, proxy/SSL header
│   ├── urls.py                  # Root URLconf (admin + /api/* + docs)
│   ├── jazzmin_conf.py          # Admin panel ko'rinishi
│   ├── schema.py, generator.py  # drf-yasg swagger (ixtiyoriy)
│   ├── wsgi.py                  # core.settings.production
│   └── asgi.py
├── apps/
│   ├── accounts/                # User, Role, Permission, Accountant, Employee
│   ├── common/                  # BaseModel, Region/District, SiteSettings, admin 2FA, Telegram bot
│   ├── organizations/           # Organization (korxona ma'lumotlari)
│   ├── services/                # Servis, ServisPaket, so'rov/javob, reyting
│   ├── contracts/               # Shartnoma + DIDOX imzolash
│   ├── payment/                 # Order, Transaction, Click provider
│   ├── book_market/             # Kitoblar, buyurtma, pochta lokatsiyasi
│   ├── additional_services/     # Tashqi savdo, demografiya, sanoat mahsulotlari, narx indeksi, KTUT
│   ├── notifications/           # Notification (Telegram + in-app)
│   ├── monitoring/             # (bo'sh — kelajakdagi monitoring moduli)
│   └── chat/                    # Channels-ga asoslangan chat (hozircha faol emas)
├── requirements/
│   ├── base.txt                 # Asosiy paketlar
│   ├── develop.txt              # base + pre-commit
│   └── prod.txt                 # base + gunicorn
├── templates/admin/             # Admin uchun custom sahifalar (login, 2FA, DIDOX, import)
├── static/, media/              # Statik va yuklangan fayllar
├── datas/                       # Seed uchun JSON/Excel fayllar
├── manage.py                    # DJANGO_SETTINGS_MODULE=core.settings.develop
├── .env.example
├── .gitlab-ci.yml               # Production deploy pipeline
└── DIDOX_NOTIFICATION_README.md # DIDOX bildirishnoma tizimi bo'yicha alohida qo'llanma
```

---

## Ilovalar (apps) va ma'lumot modeli

### `apps.common` — umumiy poydevor

Barcha ilovalar shu app'ga tayanadi.

- **`BaseModel`** (abstract) — `created_at`, `updated_at`, `is_active`. **`delete()` soft delete** qiladi
  (`is_active=False`), haqiqiy o'chirish uchun `hard_delete()` ishlatiladi.
- **`SingletonModel`** / **`SiteSettings`** — sayt bo'yicha yakka sozlamalar: DIDOX tokenlari va URL'lari,
  soliq rekvizitlari (`tax_spic`, `tax_nds`, `tax_tin`...), **`bhm_value`** (BHM qiymati — paket narxlari
  shundan hisoblanadi), registr server client id/secret, `last_didox_update`.
  Kodda `SiteSettings.load()` orqali olinadi.
- **`Region` / `District`** — viloyat va tuman (SOATO kodlari, `is_stat` — statistika boshqarmasi uchun).
- **`Branch`** — hududiy filial (INN 9 xonali, viloyatga 1:1, buxgalteri bor).
- **`Sector`** — iqtisodiyot tarmoqlari klassifikatori (ierarxik, `parent`), paket narxlari sektorga bog'lanadi.
- **`ConsultingPlan`** — tuman + yil kesimida konsalting reja summasi.
- **`File`** — generic (ContentType) fayl biriktirish.
- **`QuestionAnswer`**, **`Contact`**, **`InformationModel`**, **`Byulleten`**, **`AboutPortal`** — kontent modellari.
- **`AdminTOTPDevice`** — admin panel uchun Google Authenticator qurilmasi (secret, `is_verified`).

### `apps.accounts` — foydalanuvchilar

- **`User`** (`AUTH_USER_MODEL = accounts.User`) — `USERNAME_FIELD = username`.
  Muhim maydonlar: `pinfl`, `role` (`user/admin/bugalter/monitoring/employee/manager`),
  `user_type` (`individual` / `legal_entity`), `auth_provider` (`oneid` / `email` / `eri`),
  `location` (District), `telegram_chat_id`, `avatar`, `is_verify`.
  `user.tokens` property JWT access/refresh juftligini qaytaradi.
- **`Role` / `Permission` / `RolePermission`** — Django permission'laridan alohida, o'z ichki rol tizimi.
- **`Accountant`** — buxgalter profili (bir nechta filial + asosiy filial + viloyat).
- **`Employee`** — xodim profili (filial + tumanlar + asosiy tuman).
- **`Subscribe`** — email obunachilar.

### `apps.organizations`

- **`Organization`** — foydalanuvchiga 1:1 bog'langan korxona: `name`, `tin` (unique), `ktyadr_code`,
  `sector`, `branch`, `district`, `organization_type`.

### `apps.services` — xizmatlar va paketlar

- **`ServiceCategory`**, **`Service`** (3 tilda nom/tavsif: `_uz`, `_ru`, `_cry`; `is_free`, `duration`,
  `is_popular`, `oferta`, `reglament`), **`ServiceItem`**.
- **`ServicePackage`** — `base_bhm_count` va `duration_days`; **`price` property** = `base_bhm_count × SiteSettings.bhm_value`.
- **`ServicePackagePrice`** — sektor kesimida BHM miqdori (differensial narx).
- **`PackageService` / `PackageServiceItem`** — paket ichidagi xizmat va uning **`limit`**i.
- **`UserServicePackage` / `UserServicePackageItemUse`** — foydalanuvchi paketidan foydalanish hisobi
  (`request_data`/`response_data` JSON, `is_success`).
- **`ServiceRequests` / `ServiceDeliverables` / `ServiceRequestResponse`** — xizmat so'rovi, unga
  biriktirilgan xodim, mijoz va admin tomonidan yuklangan fayl/matn, status (`created/pending/completed/cancelled`).
- **`ServiceRating`** — 1..5 reyting, `(service, user)` unique.
- **`ActivityPlans`** — tuman/yil/oy kesimida xizmat rejasi.

### `apps.contracts` — shartnomalar

- **`Contract`** — `contract_number` (unique), `user`, `package`, `total_amount`, status,
  `signed_by_client` / `signed_by_admin` + imzo sanalari, `didx_contract_id` + `didox_contract_data` (JSON),
  generatsiya qilingan `file`, `created_by` / `attached_user`, `branch`.
  **`payed_amount` property** — `payment.Transaction` generic relation orqali `PAID` tranzaksiyalar yig'indisi.
- **`ContractStats`** — proxy model (admin'da hududlar kesimida statistika uchun).
- Shartnoma DOCX `contractTemplate.docx` + `docxtpl` yordamida generatsiya qilinadi.

### `apps.payment` — to'lovlar

- **`Order`** — foydalanuvchi + servis + provider (`click` / `payme`), `get_payment_url()` Click uchun
  to'lov havolasini yasaydi (`transaction_param = service:<id>`).
- **`Transaction`** — generic `payable` (Contract, OrderBook va h.k.), status
  (`waiting/paid/failed/canceled`), `(transaction_id, content_type, object_id)` unique.
- **`PaymentMerchantRequestLog`** — provayderdan kelgan barcha so'rovlar logi (header/body/response).
- Click integratsiyasi: `api_endpoints/click/` — `Prepare` va `Complete` (imzo tekshiruvi `auth.py`da).

### `apps.book_market` — kitob bozori

- **`Book`** (3 tilda nom, PDF `file`, `base_file` mundarija, `year`), **`BookOption`**
  (`electron` / `print` / `disk` + narx, `(book, book_type)` unique).
- **`OrderBook`** — savat/buyurtma: `total_amount`, `status`, `postal_status`
  (`processing/sent/delivered`), `postal_tracking_number`, `get_payment_url(provider)`, `recalc_total()`.
- **`OrderItem`** — `price_snapshot` (buyurtma paytidagi narx qotib qoladi) × `quantity`.
- **`PostalLocation`** — pochta bo'limlari (lat/lng, unique `index`).

### `apps.additional_services` — statistik ma'lumot xizmatlari

Eng katta app. Modul-modul bo'lib ajratilgan (`models/`, `admin/`, `resources/`, `api_endpoints/`):

1. **Tashqi savdo** (`ex_trade.py`) — `CountryGroup`, `Country`, `Unit`, `Region` (SOATO), `SITC`
   (5 darajali ierarxiya), `Year`, `Product` (2/4/6 xonali HS kod ierarxiyasi), **`TradeData`**
   (export/import, yil, kumulyativ oy `M1..M12`, `value`, `quantity`). Excel'dan import
   `django-import-export` resurslari orqali.
2. **Demografiya** (`demographic_model.py`) — **`DemographicSection`**: bitta Excel sheet = bitta bo'lim.
   Excel yuklanganda `filter_schema` (JSON) avtomatik yaratiladi va admin'da tahrirlanadi, ma'lumotning
   o'zi esa `media/demographics/data.parquet` faylida (`section` ustuni bo'yicha ajratilgan) saqlanadi.
   Filtrlash/guruhlash/eksport `pandas` bilan bajariladi.
3. **Sanoat mahsulotlari** (`industrial_product.py`) — `IndustrialProductCategory` (ierarxik), `Skp`
   (SKP klassifikatori), `IndustrialProduct` (INN, OKPO, SOATO, manzil, telefon).
4. **KTUT / hisobotlar** (`ktut_reportlist_model.py`) — `Ktut` (INN bo'yicha korxona), `ReportList`
   (hisobot shakli, `deadline`, `report_type`), `KtutReportList` (korxona ↔ hisobot).
5. **Narx indeksi** (`priceindex_model.py`) — `PriceIndex`.
6. **Statistik klassifikatsiyalar** (`staticclassification_model.py`) — `StatisticClassification` +
   kategoriya, tasdiqlovchi hujjat, fayl.

### `apps.notifications`

- **`Notification`** — `recipient`, `title`, `message`, `notification_type` (`info`, `contract_created`,
  `contract_signed`, `document_pending`, `document_rejected`, `payment_received`...), `is_read`,
  Telegram holati (`telegram_status`, `telegram_message_id`, `error_message`, `sent_at`),
  `extra_data` JSON va generic `content_object`.

### `apps.chat` (faol emas)

Django Channels asosidagi WebSocket chat (`consumers.py`, `handlers.py`, `routing.py`, `ClientSession`,
`Chat`, `Message`, `Ban`). **`INSTALLED_APPS`ga qo'shilmagan va `channels` requirements'da yo'q** —
ishlatish uchun avval `channels` o'rnatib, app'ni ro'yxatga qo'shish va ASGI'ni sozlash kerak.

---

## API endpointlar

Barcha API `/api/` prefiksi ostida. Hujjatlar:

| URL | Tavsif |
|---|---|
| `/api/schema/` | OpenAPI 3 sxemasi (drf-spectacular) |
| `/api/docs/` | Swagger UI |
| `/api/redoc/` | ReDoc |
| `/__debug__/` | Django Debug Toolbar |

### `/api/accounts/` — autentifikatsiya va profil

| Method | Path | Tavsif |
|---|---|---|
| POST | `register/` | Ro'yxatdan o'tish |
| POST | `login/` | Login (JWT qaytadi) |
| POST | `logout/` | Refresh tokenni blacklist qilish |
| PUT | `update-password/` | Parolni almashtirish |
| POST | `request-reset-email/` | Parol tiklash emailini yuborish |
| GET | `password-reset/<uidb64>/<token>/` | Reset tokenni tekshirish |
| PATCH | `password-reset-complete/` | Yangi parolni saqlash |
| POST | `Token`, `TokenRefresh`, `TokenVerify` | JWT generatsiya/yangilash/tekshirish |
| GET/PATCH | `me/` | Joriy foydalanuvchi profili |
| GET | `me/package-items/` | Foydalanuvchi paket elementlari (guruhlangan) |
| POST | `2fa/send/`, `2fa/check/` | API uchun 2FA kod yuborish/tekshirish |
| GET/PATCH | `update/email/<email>/` | Foydalanuvchini email bo'yicha tahrirlash |
| POST | `subscribe/` | Email obuna |
| GET | `profile/` | To'liq profil (tashkilot bilan) |
| GET | `month-user-stat` | Yil/oy kesimida foydalanuvchi statistikasi |
| GET | `oneid/`, `login/oneid/`, `login/oneid/access_token/<token>/` | OneID SSO flow |
| — | `social_auth/` | Social auth endpointlari |

### `/api/organizations/`

| Method | Path | Tavsif |
|---|---|---|
| GET | `organizations/` | Tashkilotlar ro'yxati |

### `/api/services/`

| Method | Path | Tavsif |
|---|---|---|
| GET | `category/` | Servis kategoriyalari |
| GET/POST | `service/` | Servislar ro'yxati / yaratish |
| GET | `<int:pk>/` | Servis detali |
| GET | `item/` | Servis elementlari |
| GET | `package/` | Servis paketlari (narxi BHM'dan hisoblanadi) |
| GET | `register-organization-detail/<stir_number>/` | Tashqi registr serveridan STIR bo'yicha korxona ma'lumoti |
| GET | `classify-item/` | Klassifikator elementlari |
| POST | `rating-create` | Servisga reyting qo'yish |
| GET | `service-request/`, `service-request/<pk>/` | Xizmat so'rovlari |
| GET/POST | `service-response/<pk>/` | So'rovga javob (fayl/matn almashinuvi) |

### `/api/contracts/`

| Method | Path | Tavsif |
|---|---|---|
| GET | `` | Shartnomalar ro'yxati (filtrlar bilan) |
| POST | `create/` | Shartnoma yaratish (DOCX generatsiya + DIDOX'ga yuborish) |

### `/api/common/`

| Method | Path | Tavsif |
|---|---|---|
| POST | `didox/password/` | GoodSign/DIDOX parol bilan autentifikatsiya |
| POST | `didox/company-login/` | Kompaniya sifatida DIDOX'ga kirish |
| GET | `question-answer/` | FAQ |
| GET | `branches/` | Filiallar |
| GET | `site-stat/`, `platform-stat/` | Sayt va platforma statistikasi |
| POST | `contact-create/` | Murojaat yuborish |
| GET/POST | `information/`, `information/<pk>/` | Hududiy ma'lumot fayllari |
| GET | `byulleten/`, `byulleten/download/<id>` | Byulletenlar va yuklab olish |
| GET | `my/byulletens/` | Yuklab olingan byulletenlarim |
| GET | `about-portal/` | Portal haqida (video/PDF) |

### `/api/orders/` — to'lovlar

| Method | Path | Tavsif |
|---|---|---|
| POST | `OrderCreate/` | Buyurtma yaratish |
| GET | `OrderList/` | Buyurtmalarim |
| GET | `GetLastTransactionStatus/<order_id>` | Oxirgi tranzaksiya holati |
| POST | `ClickPrepare/` | Click **Prepare** callback |
| POST | `ClickComplete/` | Click **Complete** callback |

### `/api/books/` — kitob bozori

| Method | Path | Tavsif |
|---|---|---|
| GET | `books-list/`, `book/<id>/`, `years/`, `e-books/` | Kitoblar katalogi |
| POST | `order/create/` | Buyurtma yaratish |
| GET | `orders/`, `order/<id>/` | Buyurtmalar |
| POST | `orders/payment-link/` | To'lov havolasini olish |
| GET | `postal-location/` | Pochta bo'limlari |
| POST | `attach-postal/` | Buyurtmaga pochta manzilini biriktirish |
| GET | `e-book/download/<book_id>`, `my-downloaded-books/` | Elektron kitob yuklab olish |

### `/api/additional-services/`

| Method | Path | Tavsif |
|---|---|---|
| GET | `external-trade/country-groups/`, `countries/`, `units/`, `regions/`, `sitc/`, `years/`, `products/` | Tashqi savdo klassifikatorlari (ViewSet) |
| GET/POST | `external-trade/trade-data/` | Savdo ma'lumotlari (filtrlangan) |
| GET | `demographics/schema/` | Barcha nashr qilingan demografik bo'limlar + filter sxemasi |
| POST | `demographics/<slug>/data/` | Filtrlangan ma'lumot (`filters`, `group_by`, `limit`) |
| GET | `demographics/<slug>/options/` | Filter qiymatlari bo'yicha qidiruv |
| POST | `demographics/<slug>/export/` | Excel eksport |
| GET | `submitted-report` | Topshirilgan hisobotlar |
| GET | `price-index`, `priceindex-year-month` | Narx indeksi |
| GET | `statistic-classification` | Statistik klassifikatsiyalar |
| GET | `reportlist/`, `reportlist/<stir_number>` | Hisobot ro'yxati (umumiy / korxona bo'yicha) |
| GET | `ktut/<stir_number>` | KTUT ma'lumoti |
| GET | `industrial-product-categories/`, `industrial-products/<category_id>/` | Sanoat mahsulotlari |
| POST | `trade-data/upload` | Savdo ma'lumotlarini yuklash |

### `/api/notifications/`

| Method | Path | Tavsif |
|---|---|---|
| GET | `me` | Bildirishnomalarim |
| GET/PATCH | `me/<pk>` | Bitta bildirishnoma (o'qilgan deb belgilash) |

### DRF global sozlamalari

- Autentifikatsiya: **faqat JWT** (`Authorization: Bearer <access>`).
- Default permission: **`AllowAny`** — ruxsatlar view darajasida belgilanadi.
- Pagination: `apps.common.pagination.CustomLimitOffsetPagination`, `PAGE_SIZE=20`.
- Filtrlash: `DjangoFilterBackend` + `SearchFilter` + `OrderingFilter`.
- Throttling klasslari yoqilgan, lekin `DEFAULT_THROTTLE_RATES` kommentda — amalda limit qo'yilmagan.
- JWT: access **300 daqiqa**, refresh **7 kun**, `ROTATE_REFRESH_TOKENS=True`, rotatsiyadan keyin blacklist.

---

## Tez boshlash (local o'rnatish)

Talablar: **Python 3.11+**, **PostgreSQL**, **Redis** (ixtiyoriy — kesh/Celery uchun).

```bash
# 1. Repo
git clone https://tester.stat.uz/consalt/backend.git
cd backend

# 2. Virtual muhit
python -m venv venv
# Linux/macOS
source venv/bin/activate
# Windows (PowerShell)
venv\Scripts\Activate.ps1

# 3. Paketlar
pip install --upgrade pip
pip install -r requirements/develop.txt    # dev
# yoki: pip install -r requirements/prod.txt

# 4. Sozlamalar
cp .env.example .env      # keyin .env ni to'ldiring

# 5. Kerakli kataloglar (LOGGING fayl handlerlari uchun majburiy)
mkdir -p logs

# 6. Migratsiyalar va admin
python manage.py migrate
python manage.py createsuperuser

# 7. Ishga tushirish
python manage.py runserver
```

Ochiladi:

- API docs — <http://127.0.0.1:8000/api/docs/>
- Admin — <http://127.0.0.1:8000/markaz/> (yoki `.env`dagi `ADMIN_URL`)

> **Diqqat:** `logs/` katalogi bo'lmasa Django `LOGGING` konfiguratsiyasi sababli ishga tushmaydi
> (`logs/django.log` va `logs/error.log` fayl handlerlari).

---

## Muhit o'zgaruvchilari (.env)

`python-decouple` orqali o'qiladi. `.env.example` nusxa olib to'ldiriladi.

### Majburiy (default'i yo'q — bo'lmasa loyiha ko'tarilmaydi)

`PROVIDERS` sozlamasi Click kalitlarini `default` ko'rsatmasdan o'qiydi:

```env
CLICK_URL=https://my.click.uz/services/pay
MERCHANT_ID=...
MERCHANT_SERVICE_ID=...
MERCHANT_USER_ID=...
CLICK_SECRET_KEY=...
RETURN_URL=https://my.stat.uz/payment/result
```

### Django

```env
SECRET_KEY=...
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1        # (izoh: base.py da hozir ALLOWED_HOSTS=['*'] qattiq yozilgan)
```

### Ma'lumotlar bazasi

```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=localhost
DB_PORT=5432
```

### Email / Redis / Celery

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...
DEFAULT_FROM_EMAIL=noreply@my.stat.uz

USE_REDIS=True
REDIS_URL=redis://127.0.0.1:6379/1
CELERY_BROKER_URL=redis://localhost:6379
CELERY_RESULT_BACKEND=redis://localhost:6379
```

### Admin panel xavfsizligi

```env
ADMIN_URL=markaz/                  # admin panel prefiksi (maxfiy URL)
RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET_KEY=...
RECAPTCHA_VERSION=v2               # v2 yoki v3
RECAPTCHA_SCORE_THRESHOLD=0.5      # faqat v3 uchun
ADMIN_2FA_ISSUER=my.stat.uz Admin  # Authenticator ilovasida ko'rinadigan nom
```

### Integratsiyalar (`.env.example`da yo'q, lekin `base.py` o'qiydi)

```env
# DIDOX / GoodSign (e-imzo)
DIDOX_BASE_URL=https://api.didox.com
DIDOX_PARTNER_TOKEN=...
DIDOX_USER_PINFL=...
DIDOX_USER_PASSWORD=...

# Telegram bildirishnoma boti
TELEGRAM_BOT_TOKEN=...
TELEGRAM_BOT_USERNAME=...

# OneID (sso.egov.uz)
ONE_ID_CLIENT_ID=...
ONE_ID_CLIENT_SECRET=...

# URL'lar (OneID redirect va callback'lar uchun)
MAIN_URL=https://my.stat.uz
SITE_URL=https://my.stat.uz
BACKEND_URL=localhost:8000

# Korxona registri (STIR bo'yicha ma'lumot olish)
REGISTER_BASE_URL=...
X_DEVICE_ID=...

# Boshqa
PAGINATION_PAGE_SIZE=20
MAX_UPLOAD_SIZE=5242880
TESTING=False
```

---

## Sozlamalar modullari

| Fayl | Qachon ishlaydi | Nima farq qiladi |
|---|---|---|
| `core/settings/base.py` | Har doim (import qilinadi) | Barcha asosiy konfiguratsiya |
| `core/settings/develop.py` | `manage.py` default | `DEBUG=True`, `CELERY_TASK_ALWAYS_EAGER=True` (Celery sinxron) |
| `core/settings/production.py` | `core/wsgi.py` default | `DEBUG=False`, `SECURE_PROXY_SSL_HEADER`, `USE_X_FORWARDED_HOST` |

Ya'ni **`manage.py` develop, gunicorn/WSGI esa production** sozlamalarida ishlaydi. Boshqasini
tanlash uchun:

```bash
python manage.py runserver --settings=core.settings.production
# yoki
export DJANGO_SETTINGS_MODULE=core.settings.production
```

`DEBUG=True` bo'lganda qo'shimcha ravishda `debug_toolbar` va `query_counter` middleware'lari,
hamda `MEDIA_URL`/`STATIC_URL` static serving yoqiladi.

Boshqa muhim sozlamalar:

- Vaqt zonasi `Asia/Tashkent`, `LANGUAGE_CODE='ru-Ru'`, tillar: `uz`, `ru`, `uz-Cyrl`.
- Fayl yuklash limiti **500 MB** (`DATA_UPLOAD_MAX_MEMORY_SIZE`, `FILE_UPLOAD_MAX_MEMORY_SIZE`),
  `DATA_UPLOAD_MAX_NUMBER_FIELDS=20000` (katta Excel importlari uchun).
- Kesh: `USE_REDIS=True` bo'lsa Redis, aks holda `LocMemCache`.
- Logging: `logs/django.log` (INFO) va `logs/error.log` (ERROR); `apps.payment` uchun alohida logger.

---

## Admin panel: maxfiy URL + 2FA + reCAPTCHA

Admin panel standart `/admin/` emas, **`.env`dagi `ADMIN_URL`** ostida (default `markaz/`).

Login zanjiri (`apps/common/admin_auth/`):

1. **`<ADMIN_URL>login/`** — username + parol + **Google reCAPTCHA** (v2 yoki v3) tekshiriladi.
   Muvaffaqiyatli bo'lsa foydalanuvchi sessiyada "pending" holatga yoziladi (hali `login()` qilinmaydi).
2. **`<ADMIN_URL>2fa/setup/`** — agar `AdminTOTPDevice` hali yo'q/tasdiqlanmagan bo'lsa, `pyotp` secret
   yaratiladi va `qrcode` bilan QR ko'rsatiladi (Google Authenticator'ga skan qilinadi). Birinchi kod
   to'g'ri kiritilganda `is_verified=True`.
3. **`<ADMIN_URL>2fa/verify/`** — TOTP kod tekshiriladi, faqat shundan keyin Django `auth_login()` chaqiriladi.

`LOGIN_URL` avtomatik `/<ADMIN_URL>login/` ga sozlanadi. Shablonlar: `templates/admin/login.html`,
`2fa_setup.html`, `2fa_verify.html`.

Admin UI `django-jazzmin` bilan sozlangan (`core/jazzmin_conf.py`). Admin ichida qo'shimcha custom
sahifalar mavjud: DIDOX tekshiruvi, shartnoma yaratish, demografiya bulk upload/configure, SITC import.

---

## Autentifikatsiya (JWT, OneID, ERI)

- **JWT** — `POST /api/accounts/login/` yoki `/api/accounts/Token`. So'rovlarda:
  `Authorization: Bearer <access_token>`.
  Refresh: `/api/accounts/TokenRefresh`. Logout refresh tokenni blacklist qiladi.
- **OneID (sso.egov.uz)** — `GET /api/accounts/oneid/` foydalanuvchini `sso.egov.uz`ga yo'naltiradi,
  callback `/api/accounts/login/oneid/` orqali qaytadi, keyin frontend'ga
  `{SITE_URL}/auth/oneid/callback/?access_token=...&refresh_token=...` shaklida redirect qiladi.
  Bunday userlarda `auth_provider='oneid'`.
- **ERI / e-imzo** — DIDOX/GoodSign orqali (`/api/common/didox/password/`,
  `/api/common/didox/company-login/`), `auth_provider='eri'`.

---

## Tashqi integratsiyalar

| Integratsiya | Nima uchun | Kod |
|---|---|---|
| **DIDOX / GoodSign** | Shartnomalarni elektron imzolash, imzo kutayotgan hujjatlarni kuzatish | `apps/contracts/utils.py`, `apps/common/views.py`, `SiteSettings.didox_*` |
| **Click** | To'lov (Prepare/Complete callback, imzo tekshiruvi) | `apps/payment/api_endpoints/click/` |
| **Payme** | `payme-pkg` o'rnatilgan; `Provider.PAYME` mavjud, lekin invoice flow hali yozilmagan | `apps/payment/models.py` |
| **OneID** | Davlat SSO orqali login | `apps/accounts/api_endpoints/one_id/` |
| **Korxona registri** | STIR bo'yicha korxona rekvizitlarini olish (`REGISTER_BASE_URL`, `X_DEVICE_ID`) | `apps/services/api/services.py` |
| **Telegram** | Bildirishnomalar va bot (chat_id biriktirish) | `apps/common/telegram_bot.py`, `apps/notifications/` |

DIDOX bildirishnoma tizimi bo'yicha batafsil qo'llanma: [`DIDOX_NOTIFICATION_README.md`](./DIDOX_NOTIFICATION_README.md).

---

## Management komandalar

```bash
# Hududlar / lokatsiyalar
python manage.py hududlar_to_db                 # datas/hududlar.json → Region + District
python manage.py load_regions                   # regions.json → additional_services.Region
python manage.py location_create                # datas/locations.json → PostalLocation

# Foydalanuvchilar
python manage.py import_users                   # bir nechta Excel fayldan userlar

# Kitoblar
python manage.py book_create                    # books_dump.json → Book (yil bo'yicha)
python manage.py book_dump                      # Book → JSON eksport

# Tashqi savdo / KTUT / sanoat
python manage.py trade_data                     # datas/trade_data.xlsx → TradeData
python manage.py load_ktut                      # Excel → Ktut (multiprocessing)
python manage.py load_ktut_report_list          # Excel → KtutReportList (multiprocessing)
python manage.py industrial_product_database /path/dump.sql   # SQL dump'dan yuklash

# Demografiya
python manage.py create_demographics_service    # Demografiya uchun Service yozuvini yaratish/yangilash

# Bildirishnomalar
python manage.py check_didox_documents [--force] # DIDOX'da imzo kutayotgan hujjat egalariga Telegram xabar
python manage.py check_didox_notifications
python manage.py send_report_notifications      # Hisobot muddati <10 kun qolganlarga Telegram xabar

# Telegram bot
python manage.py runbot [--token <token>]       # Botni polling rejimida ishga tushirish
```

---

## Celery va Telegram bot

**Celery** (broker/result backend — Redis):

```bash
celery -A core worker -l info
celery -A core beat -l info      # davriy tasklar uchun
```

> `develop.py`da `CELERY_TASK_ALWAYS_EAGER=True` — lokal muhitda tasklar worker'siz, sinxron bajariladi.

Mavjud tasklar (`apps/contracts/tasks.py`):

- `check_didox_documents_task(force=False)` — DIDOX tekshiruvi (xatolikda 60s dan keyin 3 martagacha retry).
- `periodic_didox_check()` — Celery Beat uchun o'ram.

Beat jadvalini yoqish uchun `settings`ga qo'shiladi:

```python
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'check-didox-documents': {
        'task': 'apps.contracts.tasks.periodic_didox_check',
        'schedule': crontab(minute=0, hour='*/2'),
    },
}
```

**Telegram bot** — `python manage.py runbot`. Production'da alohida `consultbot` systemd servisi
sifatida ishlaydi. Foydalanuvchi `User.telegram_chat_id` orqali bog'lanadi; yuborilgan har bir xabar
`Notification` modelida holati bilan qayd etiladi.

---

## Ma'lumot yuklash (data seeding)

Repozitoriyadagi seed fayllar:

| Fayl | Nima |
|---|---|
| `datas/hududlar.json` | Viloyat va tumanlar (SOATO) |
| `regions.json` | Tashqi savdo uchun hududlar |
| `datas/locations.json` | Pochta bo'limlari |
| `books_dump.json` | Kitoblar dumpi |
| `datas/trade_data.xlsx` | Tashqi savdo ma'lumotlari |
| `datas/ktut_report_list.xlsx`, `datas/reports_list.xlsx` | Hisobot ro'yxatlari |
| `datas/contractContentTemplate.json` | Shartnoma matn shabloni |
| `contractTemplate.docx` | DOCX shartnoma shabloni (`docxtpl`) |
| `datas/Hudud_kontaktlari/` | Hududiy kontaktlar |
| `data-preview SANOAT/` | Sanoat bo'limi uchun 3 tilda preview ma'lumotlari |

Tavsiya etilgan tartib: `hududlar_to_db` → `load_regions` → `location_create` → `book_create` →
qolgan import komandalar.

Katta klassifikatorlar (SITC, Product, TradeData, PriceIndex) admin'da `django-import-export`
resurslari orqali Excel'dan ham yuklanadi (`apps/additional_services/resources/`).

---

## Deploy (GitLab CI/CD)

`.gitlab-ci.yml` — `main` branchga push bo'lganda **production** muhitida bajariladi
(shell runner, server ustida):

```
/var/www/backend  →  git fetch/reset --hard origin/main  →  git clean -fd
                  →  source venv/bin/activate
                  →  pip install -r requirements/base.txt
                  →  python manage.py migrate --noinput
                  →  python manage.py collectstatic --noinput --clear
                  →  systemctl restart apiconsult nginx consultbot
```

Systemd servislari:

| Servis | Vazifa |
|---|---|
| `apiconsult` | Gunicorn (WSGI → `core.settings.production`) |
| `nginx` | Reverse proxy, static/media |
| `consultbot` | Telegram bot (`manage.py runbot`) |

> Deploy `git reset --hard` va `git clean -fd` qiladi — serverdagi commit qilinmagan o'zgarishlar
> yo'qoladi (`media/` `.gitignore`da bo'lgani uchun saqlanadi).

---

## Loyihadagi kelishuvlar (conventions)

- **Endpoint-per-katalog:** har bir API endpoint alohida papkada (`api_endpoints/<Nomi>/views.py`,
  `serializers.py`, `filters.py`, `tests.py`). Yangi endpoint qo'shganda shu tuzilishga rioya qiling.
  Ba'zi app'larda `api/` (services, contracts, book_market, organizations), ba'zilarida
  `api_endpoints/` (accounts, payment, additional_services) deb nomlangan.
- **Ko'p tillilik:** modellarda `_uz` / `_ru` / `_cry` (kirill) suffiksli ustunlar. `django-parler`
  o'rnatilgan va `PARLER_LANGUAGES` sozlangan, lekin modellar hozircha qo'l bilan yozilgan
  suffiksli maydonlardan foydalanadi.
- **Soft delete:** `BaseModel.delete()` yozuvni o'chirmaydi, `is_active=False` qiladi. Filtrlashda
  `is_active=True` ni yodda tuting.
- **Pul birligi:** narxlar **BHM** (`SiteSettings.bhm_value`) orqali hisoblanadi — kodga qattiq
  narx yozilmaydi.
- **`verbose_name`** va admin matnlari o'zbek tilida, `gettext_lazy` ichida.
- Migratsiyalar har bir app ichida (`apps/<app>/migrations/`).

---

## Ma'lum muammolar va eslatmalar

Kod bilan ishlashda e'tiborga olish kerak bo'lgan joylar:

1. **`ALLOWED_HOSTS = ['*']`** — `base.py`da `.env`dan o'qish kommentga olingan va `['*']` qattiq
   yozilgan. Production uchun cheklash tavsiya etiladi.
2. **`debug_toolbar` URL'lari har doim ulanadi** — `core/urls.py` oxirida `__debug__/` `DEBUG`
   tekshiruvidan tashqarida qo'shilgan. Production'da bu prefiksni yopish kerak.
3. **`CORS_ALLOW_ALL_ORIGINS = True`** ikkala muhitda ham yoqilgan.
4. **`User.image_url`** `settings.LOCAL_BASE_URL` / `settings.PROD_BASE_URL` ga murojaat qiladi, lekin
   bu sozlamalar `base.py`da aniqlanmagan — property chaqirilsa `AttributeError` beradi.
5. **`core/asgi.py`** `DJANGO_SETTINGS_MODULE='core.settings'` deb qo'yadi (paket, modul emas) —
   ASGI orqali ishga tushirishdan oldin `core.settings.production`ga o'zgartirish kerak.
6. **`apps.chat`** `INSTALLED_APPS`da yo'q va `channels` requirements'da yo'q — kod bor, lekin faol emas.
7. **`apps.monitoring`** hozircha bo'sh (modellar yo'q).
8. **`ap.py`, `save_to_db.py`, `a.txt`, `soato-filter.html`** — yordamchi/skretch skriptlar va dump
   edi; monorepo'ga o'tishda `../_archive/backend/` ga ko'chirildi (git'ga kirmaydi).
9. **`logs/` katalogi** repoda yo'q, lekin `LOGGING` unga fayl yozadi — yangi muhitda qo'lda yaratiladi.
10. **Testlar** — `tests.py` fayllari mavjud, lekin asosan bo'sh. `python manage.py test` ishga tushadi,
    ammo qamrov yo'q.
11. **URL nom nomuvofiqliklari** — `core/urls.py`da notifications `namespace='accounts'` bilan ulangan
    (app_name esa `notifications`), `apps/common/urls.py`da `byulleten-download` nomi ikki marta
    ishlatilgan (`byulleten/download/<id>` va `my/byulletens/`). `reverse()` ishlatganda e'tiborli bo'ling.

---

## Foydali komandalar

```bash
python manage.py makemigrations && python manage.py migrate
python manage.py collectstatic --noinput
python manage.py shell
python manage.py spectacular --file schema.yml      # OpenAPI sxemani fayl sifatida olish
python manage.py createsuperuser
```
