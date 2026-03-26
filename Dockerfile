# ── Stage 1: Build frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────────────
FROM python:3.12-slim
LABEL maintainer="HashCrack" \
      description="Local hash cracking tool"

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl && \
    rm -rf /var/lib/apt/lists/*

# Python deps
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Backend source
COPY backend/ /app/backend/

# Frontend build (served by FastAPI static files)
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Data directories
RUN mkdir -p /app/data/wordlists /app/data/results /app/data/tmp

# Install a lightweight static file server for the frontend
RUN pip install --no-cache-dir aiofiles

EXPOSE 8000 3000

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
