#!/bin/bash
# Faqat birinchi ishga tushishda (bo'sh volume) bajariladi.
# Qatlamlar: raw -> staging -> core -> mart; meta — yuklash jurnali.
set -euo pipefail

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
     -v loader_pw="$DWH_LOADER_PASSWORD" -v reader_pw="$DWH_READER_PASSWORD" <<'SQL'
CREATE ROLE dwh_loader LOGIN PASSWORD :'loader_pw';
CREATE ROLE dwh_reader LOGIN PASSWORD :'reader_pw';

REVOKE CREATE ON SCHEMA public FROM PUBLIC;

CREATE SCHEMA raw;      -- manbadan qanday kelgan bo'lsa shunday
CREATE SCHEMA staging;  -- tozalangan, turlari to'g'rilangan
CREATE SCHEMA core;     -- birlashtirilgan model (fakt/o'lchov jadvallari)
CREATE SCHEMA mart;     -- hisobot va dashboard uchun tayyor vitrinalar
CREATE SCHEMA meta;     -- yuklash jurnali va xizmat jadvallari

COMMENT ON SCHEMA raw     IS 'Xom ma''lumot: manbadan o''zgarishsiz';
COMMENT ON SCHEMA staging IS 'Tozalangan va turlangan ma''lumot';
COMMENT ON SCHEMA core    IS 'Birlashtirilgan model: fakt va o''lchovlar';
COMMENT ON SCHEMA mart    IS 'Hisobotlar uchun vitrinalar';
COMMENT ON SCHEMA meta    IS 'Yuklash jurnali';

-- loader: raw/staging/core/mart ga yozadi; reader: faqat core/mart ni o'qiydi
GRANT USAGE, CREATE ON SCHEMA raw, staging, core, mart TO dwh_loader;
GRANT USAGE ON SCHEMA meta TO dwh_loader;
GRANT USAGE ON SCHEMA core, mart TO dwh_reader;

-- core/mart da kim jadval yaratsa ham, reader uni o'qiy oladi
ALTER DEFAULT PRIVILEGES FOR ROLE dwh_loader IN SCHEMA core, mart
    GRANT SELECT ON TABLES TO dwh_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA core, mart
    GRANT SELECT ON TABLES TO dwh_reader;

CREATE TABLE meta.load_log (
    id           bigserial PRIMARY KEY,
    source       text        NOT NULL,           -- fayl nomi yoki manba tizim
    target_table text        NOT NULL,           -- masalan raw.aholi_2025
    rows_loaded  bigint,
    status       text        NOT NULL DEFAULT 'running'
                 CHECK (status IN ('running', 'ok', 'error')),
    error        text,
    started_at   timestamptz NOT NULL DEFAULT now(),
    finished_at  timestamptz
);
GRANT SELECT, INSERT, UPDATE ON meta.load_log TO dwh_loader;
GRANT USAGE ON SEQUENCE meta.load_log_id_seq TO dwh_loader;
SQL
