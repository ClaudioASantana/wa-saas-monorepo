# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy monorepo root manifests first (for better layer caching)
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/

# Install all dependencies (respects workspaces)
RUN npm install

# Copy the full source
COPY . .

# Build the Nuxt app
RUN npm run build --workspace=apps/web

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only the built output
COPY --from=builder /app/apps/web/.output ./

EXPOSE 3000

CMD ["node", "server/index.mjs"]
