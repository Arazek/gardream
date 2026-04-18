FROM node:22-slim AS base

WORKDIR /app
COPY package*.json ./
RUN npm install

# ---------------------------------------------------------------------------
FROM base AS development
COPY . .
EXPOSE 4200
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--poll", "500", "--live-reload", "--hmr", "--proxy-config", "proxy.conf.json"]

# ---------------------------------------------------------------------------
FROM base AS builder
COPY . .
RUN npm run build -- --configuration production

# ---------------------------------------------------------------------------
FROM nginx:alpine AS production
COPY --from=builder /app/www /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
