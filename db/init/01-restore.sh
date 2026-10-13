#!/bin/bash
# PostgreSQL konteyneri BIRINCHI marta (bo'sh volume bilan) ishga tushganda avtomatik bajariladi.
# /dump/consult.dump (pg_dump custom format) ni $POSTGRES_DB bazasiga tiklaydi.
# Eslatma: bu fayl source qilinishi mumkin, shuning uchun `exit` ishlatilmaydi.

DUMP_FILE=/dump/consult.dump

if [ -f "$DUMP_FILE" ]; then
  echo ">>> $DUMP_FILE dan $POSTGRES_DB bazasiga tiklanmoqda..."
  # --no-owner/--no-privileges: dump'dagi server rollari bu yerda yo'q
  pg_restore \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB" \
    --no-owner \
    --no-privileges \
    --jobs 4 \
    "$DUMP_FILE" \
    || echo ">>> pg_restore ogohlantirishlar bilan tugadi (odatda zararsiz)."
  echo ">>> Tiklash tugadi."
else
  echo ">>> $DUMP_FILE topilmadi — bo'sh baza bilan davom etiladi."
fi
