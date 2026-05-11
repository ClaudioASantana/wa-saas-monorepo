FROM node:20-alpine

WORKDIR /app

# Copy root package.json and lockfile if available
COPY package*.json ./

# Copy the workspace package.json
COPY apps/whatsapp-engine/package.json ./apps/whatsapp-engine/

# Install dependencies (workspaces might require root package.json)
RUN npm install --workspace=apps/whatsapp-engine

# Copy source code
COPY apps/whatsapp-engine/ ./apps/whatsapp-engine/

WORKDIR /app/apps/whatsapp-engine

CMD ["npm", "run", "dev"]
