FROM node:18-alpine

WORKDIR /app

# Copier le package.json racine et les package.json des workspaces
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Installer les dépendances du backend (avec devDependencies pour nodemon/ts-node)
WORKDIR /app/backend
RUN npm ci

# Copier le code source
COPY backend/ ./
COPY shared/ ../shared/

# Générer Prisma
RUN npx prisma generate

EXPOSE 3001
CMD ["npm", "run", "dev"]
