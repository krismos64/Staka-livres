FROM node:20.19.0-slim

# Installer OpenSSL et curl pour les healthchecks
RUN apt-get update && \
    apt-get install -y curl openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les package.json backend
COPY package*.json ./

# Installer les dépendances
RUN npm install --legacy-peer-deps --omit=optional

# Copier le code source
COPY . ./

# Changer vers le backend directory et générer Prisma Client
WORKDIR /app/backend
RUN npx prisma generate

EXPOSE 3001
WORKDIR /app/backend
CMD ["npm", "run", "dev"]
