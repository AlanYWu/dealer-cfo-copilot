#!/usr/bin/env bash
# Bring up the whole stack: Docker → Elasticsearch → backend uvicorn → Next dev.
# Ctrl+C tears down uvicorn cleanly. ES is left running on purpose; stop it
# explicitly with `cd ../backend_rag && docker compose stop`.

set -euo pipefail

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$(cd "$FRONTEND_DIR/../backend_rag" && pwd)"
ES_URL="${ELASTICSEARCH_URL:-http://localhost:9200}"
BACKEND_URL="${RAG_BACKEND_URL:-http://127.0.0.1:8001}"
BACKEND_PORT="${BACKEND_PORT:-8001}"

log() { printf '\033[1;36m[dev-all]\033[0m %s\n' "$*"; }

# 1. Docker Desktop running?
if ! docker info >/dev/null 2>&1; then
  log "Docker Desktop not running — launching"
  open -a Docker
  log "waiting for Docker daemon..."
  until docker info >/dev/null 2>&1; do sleep 2; done
fi

# 2. Elasticsearch up?
if ! curl -fsS "$ES_URL/_cluster/health" >/dev/null 2>&1; then
  log "starting Elasticsearch container"
  (cd "$BACKEND_DIR" && docker compose up -d elasticsearch >/dev/null)
fi
log "waiting for Elasticsearch (green/yellow)..."
until curl -fsS "$ES_URL/_cluster/health" 2>/dev/null \
      | grep -qE '"status":"(green|yellow)"'; do sleep 2; done
log "Elasticsearch ready at $ES_URL"

# 3. uvicorn (in background, killed on exit).
if curl -fsS "$BACKEND_URL/health" >/dev/null 2>&1; then
  log "backend already running at $BACKEND_URL — leaving as-is"
  UVICORN_PID=""
else
  log "starting backend uvicorn on :$BACKEND_PORT"
  (cd "$BACKEND_DIR" && exec .venv/bin/uvicorn app.main:app \
       --port "$BACKEND_PORT" --host 127.0.0.1) &
  UVICORN_PID=$!
fi

cleanup() {
  if [[ -n "$UVICORN_PID" ]]; then
    log "stopping backend (pid $UVICORN_PID)"
    kill "$UVICORN_PID" 2>/dev/null || true
    wait "$UVICORN_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# Wait for backend to answer.
until curl -fsS "$BACKEND_URL/health" >/dev/null 2>&1; do sleep 1; done
log "backend ready at $BACKEND_URL"

# 4. Hand the terminal to Next dev.
export RAG_BACKEND_URL="$BACKEND_URL"
log "starting Next.js dev server (Ctrl+C to stop everything)"
cd "$FRONTEND_DIR"
exec npm run dev
