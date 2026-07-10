# ════════════════════════════════════════════════════════════════
# HuggingFace Space — GrowEasy Backend + Ollama
# ════════════════════════════════════════════════════════════════
# This Dockerfile runs BOTH Ollama and the Express backend
# inside a single container on HuggingFace Spaces (free CPU tier).
#
# Build context: root of the repo (not server/)
# so we can COPY server/ files into the image.
# ════════════════════════════════════════════════════════════════

FROM ubuntu:22.04

# Prevent apt interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production
ENV PORT=3001
ENV OLLAMA_BASE_URL=http://localhost:11434/v1

# ── System packages ──────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ── Install Ollama ───────────────────────────────────────────────
RUN curl -fsSL https://ollama.com/install.sh | sh

# ── Bake llama3.2 model into the image (runs once during build) ──
# This avoids the 2 GB download on every cold start.
RUN ollama serve & \
    sleep 10 && \
    ollama pull llama3.2 && \
    pkill ollama || true

# ── Install Express backend ──────────────────────────────────────
WORKDIR /app

# Copy only what's needed (package files first for layer caching)
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy source code and TypeScript config
COPY server/src ./src

# Create a clean tsconfig without the problematic ../app paths
COPY huggingface/tsconfig.hf.json ./tsconfig.json

# Install tsx to run TypeScript directly
RUN npm install -g tsx

# Create required directories
RUN mkdir -p uploads data

# ── Startup script ───────────────────────────────────────────────
COPY huggingface/start.sh /start.sh
RUN chmod +x /start.sh

# HuggingFace Spaces requires the app on port 7860 by default,
# but we configure app_port=3001 in README.md
EXPOSE 3001

CMD ["/start.sh"]
