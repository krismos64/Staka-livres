FROM node:18-bullseye

# Installer les dépendances système pour Cypress
RUN apt-get update && apt-get install -y \
    xvfb \
    libgtk2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnotify-dev \
    libnss3-dev \
    libxss1 \
    libasound2 \
    libxtst6 \
    xauth \
    xfonts-base \
    xfonts-75dpi \
    xfonts-100dpi \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier le package.json racine et les package.json des workspaces
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

# Installer les dépendances du frontend
WORKDIR /app/frontend
RUN npm install

# Copier le code source
COPY frontend/ ./
COPY shared/ ../shared/

# Variables d'environnement pour Xvfb
ENV DISPLAY=:99
ENV SCREEN_WIDTH=1280
ENV SCREEN_HEIGHT=720
ENV SCREEN_DEPTH=24

EXPOSE 3000

# Script de démarrage qui lance Xvfb en arrière-plan puis l'application
CMD ["sh", "-c", "Xvfb :99 -screen 0 ${SCREEN_WIDTH}x${SCREEN_HEIGHT}x${SCREEN_DEPTH} -ac & npm run dev"]
