#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo ""
echo " =========================================="
echo "  HashCrack v1.0 - Local Hash Cracker"
echo " =========================================="
echo ""

# Start backend
echo "Iniciando backend (puerto 8000)..."
cd "$BACKEND"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

sleep 2

# Start frontend
echo "Iniciando frontend (puerto 3000)..."
cd "$FRONTEND"
npm run dev &
FRONTEND_PID=$!

sleep 3

echo ""
echo " Backend:  http://localhost:8000"
echo " Frontend: http://localhost:3000"
echo " API Docs: http://localhost:8000/docs"
echo ""
echo " Presiona Ctrl+C para detener."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

# Open browser
if command -v xdg-open &>/dev/null; then
    xdg-open http://localhost:3000
elif command -v open &>/dev/null; then
    open http://localhost:3000
fi

wait
