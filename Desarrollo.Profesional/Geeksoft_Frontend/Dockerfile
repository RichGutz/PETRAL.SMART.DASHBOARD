# ==============================================================================
# DOCKERFILE - FRONTEND REACT 19 + VITE (DELFOS / PETRAL)
# Multi-stage build optimizado para Coolify & Contabo
# ==============================================================================

# Stage 1: Build de la aplicación con Node.js
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el código fuente y compilar bundle de producción
COPY . .
RUN npm run build

# Stage 2: Servidor Nginx ultra-ligero para producción
FROM nginx:alpine

# Copiar configuración optimizada de Nginx con SPA router y proxy /api/
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el bundle estático generado
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto HTTP estándar
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
