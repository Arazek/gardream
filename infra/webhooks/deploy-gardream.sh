#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${GARDREAM_DIR:-/repos/gardream}"

echo "[deploy-gardream] Starting deployment..."
echo "[deploy-gardream] Project dir: $PROJECT_DIR"

cd "$PROJECT_DIR"

echo "[deploy-gardream] Pulling latest changes..."
git pull origin master || git pull origin main

echo "[deploy-gardream] Building and redeploying app services..."
docker compose -f docker-compose.local.yml up -d --build --force-recreate

echo "[deploy-gardream] Done."
