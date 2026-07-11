# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install native build tools required by better-sqlite3
# Symlink python3 -> python since node-gyp expects 'python'
RUN apk add --no-cache python3 make g++ && \
    ln -sf /usr/bin/python3 /usr/bin/python

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript to dist/
RUN npx tsc -p tsconfig.json || true

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install native build tools required by better-sqlite3
RUN apk add --no-cache python3 make g++ && \
    ln -sf /usr/bin/python3 /usr/bin/python

# Install dependencies (production only)
COPY package*.json ./
RUN npm install --omit=dev

# Copy TypeScript source (tsx runs .ts directly in production)
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

# Install tsx globally for running TypeScript
RUN npm install -g tsx

# Create uploads and data directories
RUN mkdir -p uploads data

EXPOSE 3001

CMD ["tsx", "src/server.ts"]
