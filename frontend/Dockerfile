FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS build
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 