#!/bin/sh
set -e

echo "PostgreSQL kutilmoqda ($DB_HOST:$DB_PORT)..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q; do
  sleep 2
done

# Faqat asosiy (gunicorn) konteyner migratsiya va collectstatic qiladi
if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  python manage.py migrate --noinput
  python manage.py collectstatic --noinput
fi

exec "$@"
