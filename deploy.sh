#!/usr/bin/env bash
set -euo pipefail

IMAGE="random-picker"
COMPOSE_FILE="docker-compose.yml"

echo "==> Building image..."
docker compose -f "$COMPOSE_FILE" build --no-cache

echo "==> Stopping old container (if running)..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans

echo "==> Starting container..."
docker compose -f "$COMPOSE_FILE" up -d

echo "==> Waiting for health check..."
sleep 5
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "Done. App is running on port 8080."
echo "Apache proxy target: http://$(hostname -I | awk '{print $1}'):8080"
