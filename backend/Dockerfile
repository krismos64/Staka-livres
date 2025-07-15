FROM --platform=linux/amd64 node:20.19.0-slim

# Install curl for healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les package.json racine + backend + shared
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Installer les dépendances
WORKDIR /app/backend
RUN npm ci --include=dev --ignore-optional --no-audit --legacy-peer-deps

# Copier le code source
COPY backend/ ./
COPY shared/ ../shared/

# Générer Prisma Client
RUN npx prisma generate

EXPOSE 3001
CMD ["npm", "run", "dev"]
