# my.stat.uz — Konsalting platformasi (monorepo)

Backend (Django), frontend (React) va ma'lumotlar bazasi (PostgreSQL dump) bitta repoda,
`docker compose` bilan bitta buyruqda ko'tariladi.

To'liq loyiha hujjati: [LOYIHA.md](LOYIHA.md).

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

## Celery

`worker` konteyneri `celery -A core worker` ni ishga tushiradi (`core/celery.py`).
Celery Beat (davriy vazifalar, masalan `contracts.tasks.periodic_didox_check`) hozircha sozlanmagan —
jadval kelishilgach `CELERY_BEAT_SCHEDULE` va `beat` servisi qo'shiladi.

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

Repo nomi yoki yo'li boshqacha bo'lsa, `.gitlab-ci.yml` dagi `PROJECT_PATH` / `REPO_URL` ni o'zgartiring.
