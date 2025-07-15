# syntax=docker/dockerfile:1.6
ARG NODE_VERSION=20.19.0

# ---- deps ----
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app

# Enable corepack and install pnpm
RUN corepack enable

# Copy package files (depuis le contexte racine)
COPY frontend/package.json frontend/yarn.lock* frontend/package-lock.json* frontend/pnpm-lock.yaml* ./

# Install dependencies - use yarn if yarn.lock exists, npm otherwise
RUN if [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile --production; \
    elif [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile; \
    else \
      npm install --omit=dev --legacy-peer-deps; \
    fi

# ---- builder ----
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app

# Enable corepack
RUN corepack enable

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code frontend
COPY frontend/ ./

# Copy shared types (accessible depuis le contexte racine)
COPY shared/ /shared

# Install all dependencies (including dev dependencies)
RUN if [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile; \
    else \
      npm install --legacy-peer-deps; \
    fi

# Build the application
RUN if [ -f yarn.lock ]; then \
      yarn build; \
    elif [ -f pnpm-lock.yaml ]; then \
      pnpm run build; \
    else \
      npm run build; \
    fi

# ---- runtime ----
FROM --platform=$TARGETPLATFORM nginx:1.25-alpine AS runtime

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Set permissions for static files
RUN chown -R nginx:nginx /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
