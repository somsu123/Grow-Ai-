#!/bin/bash
# ════════════════════════════════════════════════════════════
# GrowEasy HuggingFace Space — Startup Script
# Starts Ollama first, then the Express backend
# ════════════════════════════════════════════════════════════

set -e

echo "========================================"
echo "  GrowEasy Backend + Ollama Starting"
echo "========================================"

# ── Start Ollama in background ────────────────────────────────
echo "[1/3] Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

# ── Wait until Ollama API is ready ───────────────────────────
echo "[2/3] Waiting for Ollama to be ready..."
MAX_WAIT=60
WAITED=0
until curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
    sleep 2
    WAITED=$((WAITED + 2))
    if [ $WAITED -ge $MAX_WAIT ]; then
        echo "ERROR: Ollama did not start in time."
        exit 1
    fi
done
echo "  ✓ Ollama is ready (took ${WAITED}s)"

# Confirm model is available (baked in during build)
echo "  ✓ Available models:"
ollama list

# ── Start Express backend ─────────────────────────────────────
echo "[3/3] Starting Express backend on port ${PORT:-3001}..."
exec tsx /app/src/server.ts
