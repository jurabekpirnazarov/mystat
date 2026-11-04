# Serverga joylash: yangi UI (Variant P) ishlashi uchun

> Sana: 2026-11-03. Tekshirilgan: GitHub `main` (88fc27e) ni toza build qilib ochdim, yangi UI chiqadi ("Kerakli raqamni yozing…", `.pp` qobig'i).
> Demak kod to'g'ri; "eski UI" holati deployment bilan bog'liq.

## 1. Nega eski UI qolib ketadi: sabablar (ehtimollik bo'yicha)

1. **Docker image qayta build qilinmagan (eng ehtimoliy).** Frontend `web` image ichiga `npm run build` bilan *qotib* qoladi.
   `git pull` faqat fayllarni yangilaydi. `docker compose up -d` esa mavjud image'ni ishga tushiradi va qayta build qilmaydi.
   Boshqa port yoki boshqa papkada ham xuddi shu eski image (yoki eski kesh) ishlatilsa, natija bir xil bo'ladi.
2. **Noto'g'ri branch.** Yangi UI `feat/mobil-ilova-demo` va `main` (PR #1 dan keyin) da bor, lekin oxirgi o'zgarishlar
   (ichki sahifalar ranglari, KPI, qidiruv, AI agent, savdo maslahatchisi, chatbot) faqat shu push bilan chiqadi. Serverda `git branch --show-current` ni tekshiring.
3. **Brauzer keshi.** `index.html` oldin `Cache-Control` siz berilardi: brauzer eski `index.html` ni (eski `/assets/*.js` nomlari bilan) ushlab turardi.
   Tuzatildi: `nginx/default.conf.template` da `location /` endi `no-cache`. `/assets/*` nomida hash bor, shuning uchun 1 yil keshlanaveradi (to'g'ri).
   Service worker (`/sw.js`) ham eski qobiqni ushlashi mumkin: bir marta Unregister qiling (4-bo'lim).
4. **Build argumentlari.** `VITE_LEGACY_UI=1` bo'lsa eski UI qaytadi. Server `.env` yoki build argumentida bu bo'lmasligi kerak
   (hozirgi `docker-compose.yml` va `Dockerfile` da yo'q).

## 2. Serverda to'g'ri joylash (Docker)

```bash
cd <loyiha papkasi>
git fetch --all
git checkout feat/mobil-ilova-demo        # yoki PR ni main'ga qo'shgan bo'lsangiz: git checkout main
git pull

# 1) Backend (yangi: credits migratsiyasi 0007, AI sozlamalari .env da)
docker compose build backend
docker compose up -d backend worker beat
# migratsiya backend ishga tushganda avtomatik (docker-entrypoint.sh, RUN_MIGRATIONS=1). Yangi: python-docx (Word hisobot) image bilan keladi

# 2) Frontend: albatta qayta build (kesh siz) va qayta yaratish
export GIT_SHA=$(git rev-parse --short HEAD)
docker compose build --no-cache web
docker compose up -d --force-recreate web
```

Boshqa portda: `WEB_PORT=8080 docker compose up -d --force-recreate web` (80 band bo'lsa).
Bir papkadan ikkinchi nusxa ishga tushirilsa, uning o'z image'i bor: o'sha papkada ham `build --no-cache web` qiling.

## 3. Tekshirish (30 soniya)

```bash
# Image ichida yangi UI bormi? (natija fayl nomini chiqarishi kerak, bo'sh bo'lsa image eski)
docker compose exec web sh -c "grep -l 'Kerakli raqamni yozing' /usr/share/nginx/html/assets/*.js"
# Image qachon yaratilgan?
docker image inspect mystat-web --format '{{.Created}}'
# index.html keshlanmaydimi? (Cache-Control: no-cache chiqishi kerak)
curl -sI http://SERVER/ | grep -i cache-control
```
Sahifaning eng pastida endi **"build <commit>"** yozuvi turadi (footer). U `git rev-parse --short HEAD` bilan bir xil bo'lishi kerak:
shu yozuvdan serverda qaysi versiya ishlayotganini darhol bilasiz. "build unknown" chiqsa `GIT_SHA` berilmagan (UI baribir yangi).

## 4. Brauzerda eski qobiqni tozalash

DevTools (F12) → Application → Service Workers → **Unregister**, keyin Storage → **Clear site data**, Ctrl+F5.
Yoki Inkognito oynada oching.

## 5. AI (Gemma) va yangi funksiyalar uchun server `.env`

```
LLM_BASE_URL=http://host.docker.internal:8002/v1     # vLLM 127.0.0.1:8002 da bo'lsa va backend Docker ichida
LLM_API_KEY=<~/.vllm_api_key>
LLM_MODEL=google/gemma-4-26B-A4B-it
```
Compose'da backend uchun `extra_hosts: ["host.docker.internal:host-gateway"]` kerak bo'lishi mumkin (Linux). vLLM faqat `127.0.0.1` da
tinglasa konteynerdan ko'rinmaydi: uni `--host 0.0.0.0` bilan ishga tushiring va portni tashqaridan yoping.
Bo'sh qoldirsangiz: chatbot FAQ bilan, tahlil qoidalar bilan ishlaydi, AI o'chiq turadi.

## 6. Lokalda (Docker siz) ishga tushirish

```bash
# Baza (portativ Postgres, 5433) — bir marta ishga tushiring
C:\Users\j.pirnazarov\tools\pgsql\bin\pg_ctl.exe -D C:\Users\j.pirnazarov\tools\pgdata-mystat -l C:\Users\j.pirnazarov\tools\pg-mystat.log -o "-p 5433" start

# Backend
cd backend && venv\Scripts\python.exe manage.py migrate && venv\Scripts\python.exe manage.py runserver 8000

# Frontend
cd frontend && npm ci --legacy-peer-deps && npm run dev          # http://localhost:5173
```
Eski UI kerak bo'lsa: `VITE_LEGACY_UI=1 npm run dev`.
