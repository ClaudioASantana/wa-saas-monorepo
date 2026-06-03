FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests for efficient layer caching
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the API
RUN npm run build -w @wa-saas/api

# --- Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Copy root modules and manifests
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy built API
COPY --from=builder /app/apps/api/package*.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy shared package just in case references are preserved
COPY --from=builder /app/packages/shared ./packages/shared

WORKDIR /app/apps/api

EXPOSE 4000
ENV NODE_ENV=production
ENV PORT=4000
ENV TZ=UTC

CMD ["npm", "start"]
