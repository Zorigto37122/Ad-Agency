#!/bin/sh
set -e

# Seed the database only on first start (seed_data.py is idempotent)
python seed_data.py

exec uvicorn main:app --host 0.0.0.0 --port 8000
