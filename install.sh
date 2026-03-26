#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Instalando HashCrack..."

# Backend
echo "[1/3] Instalando dependencias Python..."
cd "$ROOT/backend"
python3 -m pip install -r requirements.txt

# Frontend
echo "[2/3] Instalando dependencias Node.js..."
cd "$ROOT/frontend"
npm install

# Dirs
echo "[3/3] Creando directorios..."
mkdir -p "$ROOT/data/wordlists" "$ROOT/data/results" "$ROOT/data/tmp"

echo ""
echo "Instalacion completada. Ejecuta ./start.sh para iniciar."
