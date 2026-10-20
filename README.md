# my.stat.uz — Konsalting platformasi (monorepo)

Backend (Django), frontend (React) va ma'lumotlar bazasi (PostgreSQL dump) bitta repoda,
`docker compose` bilan bitta buyruqda ko'tariladi.

To'liq loyiha hujjati: [docs/LOYIHA.md](docs/LOYIHA.md). Vazifalar holati (bajarilgan va qolgan ishlar): [docs/README.md](docs/README.md).

```
mystat/
├── backend/               Django 5 + DRF API (batafsil: backend/README.md)
├── frontend/              React 18 + Vite + TypeScript
├── db/
│   ├── dump/consult.dump  PostgreSQL 14 dump (custom format, git'ga kirmaydi)
│   └── init/01-restore.sh Birinchi ishga tushishda dump'ni avtomatik tiklaydi
├── nginx/                 Yagona kirish nuqtasi (reverse proxy)
├── docker-compose.yml
└── .env.example
```

## Arxitektura

```
                 ┌──────────────── web (nginx :80) ────────────────┐
 brauzer ──────► │ /            → React build (SPA)                │
                 │ /api/        → backend:8000 (gunicorn/Django)   │
                 │ /markaz/     → backend:8000 (admin, ADMIN_URL)  │
                 │ /static/     → collectstatic volume             │
                 │ /media/      → backend/media                    │
                 └─────────────────────────────────────────────────┘
 backend, worker (celery), bot (ixtiyoriy) ──► db (postgres:14), redis
```

Frontend va API bitta domenda ishlaydi, shuning uchun frontend `VITE_API_URL=/` bilan build qilinadi
va CORS kerak bo'lmaydi.

## Ishga tushirish

Talab: [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
cp .env.example .env          # SECRET_KEY, DB_PASSWORD, Click kalitlarini to'ldiring
docker compose up -d --build
docker compose logs -f db     # birinchi safar dump tiklanishini kuzating
```

- Sayt: <http://localhost>
- API docs: <http://localhost/api/docs/>
- Admin: <http://localhost/markaz/>

Telegram botni ham ko'tarish uchun: `docker compose --profile bot up -d`.

### Ma'lumotlar bazasi

- `db` konteyneri **birinchi marta** (bo'sh `pgdata` volume bilan) ishga tushganda
  `db/dump/consult.dump` avtomatik tiklanadi. Keyingi ishga tushirishlarda dump'ga tegilmaydi.
- Yangi dump bilan qayta tiklash:
  ```bash
  docker compose down
  docker volume rm mystat_pgdata
  # db/dump/consult.dump ni yangisi bilan almashtiring
  docker compose up -d
  ```
- Hostdan ulanish (DBeaver, pgAdmin): `localhost:5433` (`DB_PUBLIC_PORT`), `.env` dagi login/parol.
- Backend har ishga tushganda `migrate` va `collectstatic` bajaradi.

## Docker'siz lokal ishlab chiqish

```bash
# Backend (Python 3.11–3.12, PostgreSQL)
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements/develop.txt
python manage.py runserver

# Frontend (boshqa terminalda)
cd frontend
npm install --legacy-peer-deps
echo VITE_API_URL=/ > .env      # /api va /media Vite proxy orqali :8000 ga ketadi
npm run dev
```

Dump'ni lokal Postgres'ga tiklash:
`pg_restore --no-owner --no-privileges -d consult db/dump/consult.dump`

## Demo (sintetik) ma'lumot

Bo'sh jadvallar va kabinet bo'limlarini to'la holatda ko'rish uchun, **faqat `DEBUG=True` da**:

```bash
cd backend
python manage.py seed_demo                 # hamma bo'limlar (qayta ishga tushirish xavfsiz)
python manage.py seed_demo --only notifications,classifications
python manage.py seed_demo --dry-run       # yozmasdan ko'rsatadi
python manage.py seed_demo --flush         # faqat sintetik yozuvlarni o'chiradi
python manage.py seed_demo --demographics  # sintetik demografiya parquet (asosiy fayl yo'q bo'lsa)
```

- Real yozuvlar o'zgartirilmaydi va o'chirilmaydi. Har bir sintetik yozuv `common.SyntheticRecord` reyestriga tushadi,
  `--flush` faqat ularni o'chiradi. Kaskad real yozuvga tegsa, komanda to'xtaydi va hech narsa o'chirmaydi.
- Demo akkauntlar: `demo_yuridik_1..5`, `demo_jismoniy_1..3`, `demo_tadqiqotchi`, `demo_konsultant_1..5`,
  `demo_bugalter`, `demo_employee` (`@demo.invalid`).
  Parol `backend/.env` dagi `DEMO_USER_PASSWORD` dan olinadi (har ishga tushirishda shu parolga tenglashtiriladi).
  Berilmagan bo'lsa, yangi akkauntlarga tasodifiy parol qo'yiladi va konsolga bir marta chiqadi.
- Sintetik matnlar `[DEMO]` bilan boshlanadi; API `is_synthetic` / `data_source` maydonini qaytaradi, UI'da "Namuna"
  belgisi yoki banneri chiqadi, PDF/PNG eksportlarda "NAMUNA" suv belgisi.
- Seeder'lar (`--only` uchun nomlar): `demo_users`, `classifications`, `service_requests`, `activity_plans`, `notifications`,
  `misc`, `enterprise_indicators`, `region_indicators`, `report_guides`, `custom_requests`, `citizens`,
  `api_subscriptions` (demo API kalitlari faqat yaratilganda konsolga bir marta chiqadi), `consultations`.

## Testlar

```bash
cd backend && python manage.py test        # Django test runner
cd frontend && npm test                     # vitest (sof funksiyalar: autofill, inflyatsiya, maosh persentili)
```

## Celery

- `worker` konteyneri `celery -A core worker` ni, `beat` konteyneri `celery -A core beat` ni ishga tushiradi (`core/celery.py`).
- Jadval `core/settings/base.py` dagi `CELERY_BEAT_SCHEDULE` da:
  - DIDOX hujjatlari holatini tekshirish — har `BEAT_DIDOX_CHECK_MINUTES` daqiqada (default 15);
  - hisobot muddati eslatmalari (Telegram) — har kuni `BEAT_REPORT_NOTIFY_HOUR:MINUTE` da (default 09:00, Asia/Tashkent);
  - ko'rsatkich yangilanishlari obunachilarga — har soat; oylik dayjest — har oyning 1-kuni 10:00;
  - konsultatsiya eslatmalari (24 soat va 1 soat oldin) — har 15 daqiqa.
- Lokal (`docker`siz, Redis o'chiq) rejimda beat ishga tushirilmaydi; vazifalarni qo'lda: `python manage.py check_didox_documents`,
  `python manage.py send_report_notifications --dry-run`.
- **Production (systemd):** hozirgi serverda faqat `apiconsult` va `consultbot` unitlari bor. Celery worker va beat uchun
  alohida unit qo'shish kerak (`celery -A core worker`, `celery -A core beat`), aks holda jadval ishlamaydi.

## PWA

`frontend/public/sw.js` faqat production build'da ro'yxatdan o'tadi. Nginx'da `sw.js` uchun keshni o'chiring,
aks holda yangi versiya foydalanuvchilarga kech yetadi. Docker'dagi `nginx/default.conf.template` da bu bor;
serverdagi (systemd) nginx'ga qo'lda qo'shing:

```nginx
location = /sw.js { add_header Cache-Control "no-cache"; }
```

## Production (GitLab CI)

Ildizdagi `.gitlab-ci.yml` hozirgi server modelini saqlaydi (systemd + venv + nginx, Docker'siz),
lekin endi bitta repodan: `backend/**` o'zgarsa backend, `frontend/**` o'zgarsa frontend deploy bo'ladi.
Eski CI fayllar `_archive/` da.

Serverda bir martalik o'tish:

1. GitLab'da `consalt/mystat` repo yarating va shu monorepo'ni push qiling.
2. Serverda: `git clone https://tester.stat.uz/consalt/mystat.git /var/www/mystat`
3. Eski joylardan ko'chiring:
   - `/var/www/backend/{.env,venv,media}` → `/var/www/mystat/backend/`
   - `/var/www/front/.env` → `/var/www/mystat/frontend/`
4. systemd: `apiconsult` va `consultbot` unitlarida `WorkingDirectory` va venv yo'lini
   `/var/www/mystat/backend` ga o'zgartiring → `sudo systemctl daemon-reload`
5. nginx: frontend `root` → `/var/www/mystat/frontend/dist`, `static`/`media` alias'lari →
   `/var/www/mystat/backend/{staticfiles,media}` → `sudo nginx -t && sudo systemctl reload nginx`
6. `venv` virtualenv ko'chirilganda buziladi — `python3 -m venv venv` bilan qayta yarating
   va `pip install -r requirements/prod.txt` qiling.

7. Bir martalik: `python manage.py setup_service_limits` — benchmark, bozor tahlili, hamkor eksporti
   va konsultatsiya uchun tariflarga default limit (keyin admin'da o'zgartiriladi; qayta ishga tushirish
   admin limitlarini buzmaydi).
8. `python manage.py check --deploy` — `common.W001`/`W002` email yoki Telegram sozlanmaganini, `W003`/`W004`
   ochiq `ALLOWED_HOSTS` (`*`) va hamma uchun ochiq CORS'ni bildiradi. `.env` da `ALLOWED_HOSTS=my.stat.uz,...` va
   `CORS_ALLOWED_ORIGINS=https://my.stat.uz` ni bering (standart qiymat hozirgi serverni buzmaslik uchun ochiq qoldirilgan).
9. Shartnoma matni `backend/datas/contractContentTemplate.json` dan olinadi (repoda yo'q, serverda qoladi);
   fayl bo'lmasa `backend/contractTemplate.docx` bo'limlari ishlatiladi.

Repo nomi yoki yo'li boshqacha bo'lsa, `.gitlab-ci.yml` dagi `PROJECT_PATH` / `REPO_URL` ni o'zgartiring.
