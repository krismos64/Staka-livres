FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS development
RUN npm ci
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "run", "dev"]

FROM base AS production
COPY . .
RUN npm run build
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"] 