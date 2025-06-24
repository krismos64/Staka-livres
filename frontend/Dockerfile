FROM node:18-alpine

WORKDIR /app

# Copier le package.json racine et les package.json des workspaces
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

# Installer les dépendances du frontend
WORKDIR /app/frontend
RUN npm ci

# Copier le code source
COPY frontend/ ./
COPY shared/ ../shared/

EXPOSE 3000
CMD ["npm", "run", "dev"]
