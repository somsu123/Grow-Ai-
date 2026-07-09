# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build 2>/dev/null || true

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output (tsx runs ts directly, so copy src too)
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

# Install tsx for running TypeScript in production
RUN npm install -g tsx

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3001

CMD ["tsx", "src/server.ts"]
