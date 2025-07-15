FROM --platform=linux/amd64 node:18-slim   

# Install curl for healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier le package.json racine et les package.json des workspaces
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Installer les dépendances du backend (avec devDependencies pour nodemon/ts-node et rollup ARM64)
WORKDIR /app/backend
RUN npm ci --include=dev --ignore-optional --force --no-audit

# Copier le code source
COPY backend/ ./
COPY shared/ ../shared/

# Générer Prisma
RUN npx prisma generate

EXPOSE 3001
CMD ["npm", "run", "dev"]
