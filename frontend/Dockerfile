# =============================================================================
# ETAPA 1: Compilación del Frontend React + TypeScript (Builder Stage)
# =============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# 1. Copiamos package.json y package-lock.json para cachear node_modules
COPY package*.json ./
RUN npm ci

# 2. Copiamos el código fuente y generamos el bundle estático de producción (dist/)
COPY . .
RUN npm run build

# =============================================================================
# ETAPA 2: Servidor Web y Reverse Proxy de Producción (Nginx Alpine)
# =============================================================================
FROM nginx:1.27-alpine

# Copiamos nuestra configuración personalizada con Reverse Proxy hacia /api/
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos únicamente los archivos estáticos compilados desde la Etapa 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
