# DWH — ma'lumotlar ombori

PostgreSQL 16 asosidagi, mystat stekidan mustaqil ombor. Server: `172.30.30.30` (`qamal`).

## Qatlamlar

| Sxema     | Vazifasi                                              |
|-----------|-------------------------------------------------------|
| `raw`     | Manbadan qanday kelgan bo'lsa shunday (hamma ustun matn) |
| `staging` | Tozalangan, turlari to'g'rilangan                     |
| `core`    | Birlashtirilgan model: fakt va o'lchov jadvallari     |
| `mart`    | Hisobot va dashboardlar uchun tayyor vitrinalar       |
| `meta`    | Yuklash jurnali (`meta.load_log`)                     |

## Foydalanuvchilar

| Rol          | Huquq                                         | Kim ishlatadi            |
|--------------|-----------------------------------------------|--------------------------|
| `dwh_admin`  | To'liq (superuser)                            | Faqat ma'mur             |
| `dwh_loader` | `raw`/`staging`/`core`/`mart` ga yozadi       | Yuklagich, ETL           |
| `dwh_reader` | Faqat `core` va `mart` ni o'qiydi             | BI, tahlilchilar         |

## Serverda ishga tushirish

```bash
cd mystat/dwh
cp .env.example .env
# .env ichida uchta parolni to'ldiring: openssl rand -hex 24
docker compose up -d
docker compose ps
```

Sxemalar va rollar faqat birinchi ishga tushishda (bo'sh volume) yaratiladi.
Xotira sozlamalarini (`DWH_SHARED_BUFFERS` va b.) serverning RAM hajmiga qarab `.env` da o'zgartiring.

Ulanish: `psql -h 172.30.30.30 -p 5440 -U dwh_reader dwh`

## Fayl yuklash

Faylni `dwh/data/` ga qo'ying (CSV, TSV, Excel, Parquet, JSON), so'ng:

```bash
docker compose run --rm loader aholi_2025.xlsx
docker compose run --rm loader savdo.csv --table savdo --mode append
```

- Jadval `raw.<fayl_nomi>` bo'lib yaratiladi; ko'p varaqli Excel'da har varaq alohida: `raw.<fayl>__<varaq>`.
- Ustun nomlari snake_case ga keltiriladi, `_source_file` va `_loaded_at` qo'shiladi.
- Standart rejim `replace` (jadval qayta yaratiladi), `--mode append` ustiga qo'shadi.
- Har yuklash `meta.load_log` ga yoziladi. Xato bo'lsa, eski jadval o'zgarmaydi.

## Zaxira nusxa

```bash
docker compose exec -T db pg_dump -U dwh_admin -Fc dwh > dwh_$(date +%F).dump
```
