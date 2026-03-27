#!/bin/bash
set -e

echo "==> Waiting for PostgreSQL..."
until python -c "
import socket, sys, os
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    s.connect((os.environ.get('POSTGRES_SERVER', 'db'), int(os.environ.get('POSTGRES_PORT', '5432'))))
    s.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; do
    echo "    PostgreSQL not ready — retrying in 2s..."
    sleep 2
done
echo "==> PostgreSQL is ready."

echo "==> Running Alembic migrations..."
alembic upgrade head

if [ "${SEED_DB}" = "true" ]; then
    echo "==> Seeding database..."
    python seed_data.py
fi

echo "==> Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info
