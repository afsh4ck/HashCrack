#!/bin/sh
set -e

cd /app/backend

echo ""
echo " =========================================="
echo "  HashCrack v1.0 — Docker"
echo " =========================================="
echo ""

# Serve the built frontend as static files via a tiny Python HTTP server
echo "Sirviendo frontend en puerto 3000..."
python -m http.server 3000 --directory /app/frontend/dist &

# Start the backend
echo "Iniciando backend en puerto 8000..."
exec python -m uvicorn main:app --host 0.0.0.0 --port 8000
