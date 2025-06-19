FROM node:20

# Dossier de travail dans le conteneur
WORKDIR /app

# Copie des fichiers package.json + lock avant le reste
COPY package*.json ./

# Installation des dépendances
RUN npm install -g typescript ts-node nodemon prisma && \
    npm install

# Copie du reste du projet
COPY . .

# Exposition du port
EXPOSE 3000

# Commande par défaut (overridden par docker-compose)
CMD ["npm", "run", "dev"]