#!/bin/sh
set -e

# If tables already exist but alembic_version has no record, stamp instead of
# running migrations (avoids "relation already exists" on re-deploys with existing volume)
TABLES_EXIST=$(psql "$DATABASE_URL" -tAc \
  "SELECT COUNT(*) FROM information_schema.tables \
   WHERE table_schema='public' AND table_name='users'" 2>/dev/null || echo "0")

STAMPED=$(psql "$DATABASE_URL" -tAc \
  "SELECT COUNT(*) FROM alembic_version" 2>/dev/null || echo "0")

if [ "$TABLES_EXIST" = "1" ] && [ "$STAMPED" = "0" ]; then
    echo "Tables exist but migration not stamped — stamping alembic to head."
    alembic stamp head
else
    alembic upgrade head
fi

python seed_data.py

exec uvicorn main:app --host 0.0.0.0 --port 8000
