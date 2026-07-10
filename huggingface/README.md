---
title: GrowEasy CSV Importer Backend
emoji: 🌱
colorFrom: green
colorTo: blue
sdk: docker
app_port: 3001
pinned: false
---

# GrowEasy AI CSV Importer — Backend API

This Space runs:
- **Ollama** (local LLM runtime) with `llama3.2` model baked in
- **Express.js** backend API on port 3001

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/upload` | POST | Upload a CSV file |
| `/api/extract` | POST | Extract CRM data with AI |
| `/api/extract/stream` | POST | Extract with SSE streaming |
| `/api/history` | GET | List import sessions |

## Environment Variables

Set these in the Space Settings → Variables tab:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `OLLAMA_BASE_URL` | `http://localhost:11434/v1` |
| `AI_MODEL` | `llama3.2` |
| `AI_MAX_TOKENS` | `8000` |
| `AI_BATCH_SIZE` | `3` |
| `AI_MAX_RETRIES` | `3` |
| `MAX_FILE_SIZE_MB` | `10` |
| `UPLOAD_DIR` | `uploads` |
