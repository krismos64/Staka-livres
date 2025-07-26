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

# Générer Prisma Client
RUN npx prisma generate

EXPOSE 3001
CMD ["npm", "run", "dev"]
