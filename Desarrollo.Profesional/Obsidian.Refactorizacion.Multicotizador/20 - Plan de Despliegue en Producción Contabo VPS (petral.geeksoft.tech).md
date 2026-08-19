---
title: Plan Maestro de Despliegue en Producción Contabo VPS (petral.geeksoft.tech)
date: 2026-08-19
author: Benoit Blanc & Equipo de Arquitectura DevOps Geeksoft
status: Arquitectura y Despliegue Cloud (Producción Definitiva)
tags:
  - petral
  - contabo
  - coolify
  - traefik
  - docker
  - fastapi
  - supabase
  - devops
  - geeksoft
---

# 🚀 Plan Maestro de Despliegue en Producción: `petral.geeksoft.tech` (Contabo VPS)

> [!IMPORTANT]
> **OBJETIVO ESTRATÉGICO:** Migración y consolidación definitiva de la plataforma **PETRAL SMART DASHBOARD** desde el VPS temporal de Hostinger (`91.108.125.253`) hacia el **VPS de Alto Rendimiento Contabo (`169.58.168.107`)** bajo el dominio oficial **`https://petral.geeksoft.tech`**.
> 
> Esta implementación replica fielmente la **arquitectura probada de InAndes ERP** basada en **Coolify v4 + Traefik v3.6 + Docker + Supabase Self-Hosted**, garantizando aislamiento absoluto, cero colisión de puertos y cero tiempo de inactividad (*Zero Downtime*) para los servicios coexistentes.

---

## 1. Matriz de Convivencia y Puertos en Contabo VPS (`169.58.168.107`)

El servidor Contabo opera como un clúster multi-tenant gobernado por **Traefik (Coolify Proxy)** en los puertos públicos `80` y `443`. Cada servicio vive en su propio contenedor aislado dentro de la red Docker interna `coolify`.

| Servicio / Proyecto | Rol / Tecnología | Dominio / URL Pública | Puerto Interno | Estado en Contabo |
| :--- | :--- | :--- | :---: | :---: |
| **Coolify Core** | Panel de Control DevOps | `http://169.58.168.107:8000` | `:8000` / `:8080` | `Activo (Healthy)` |
| **Traefik Proxy** | Ingress SSL & Reverse Proxy | Puertos Públicos `80` / `443` | `:80` / `:443` | `Activo (Healthy)` |
| **Netdata Monitor** | Telemetría y Recursos en Vivo | `http://169.58.168.107:19999` | `:19999` | `Activo (Healthy)` |
| **InAndes Frontend** | React 19 SPA (ERP InAndes) | `https://inandes.geeksoft.tech` | `:3000` | `Activo (Healthy)` |
| **InAndes Backend** | FastAPI Engine (InAndes) | `https://api-factoring.geeksoft.tech` | `:8010` | `Activo (Healthy)` |
| **APEFAC Core** | React SPA (APEFAC Risk) | `https://apefac.geeksoft.tech` | `:80` | `Activo (Healthy)` |
| **Supabase Stack** | DB Postgres 15, Kong, Studio | `https://studio.geeksoft.tech` / Red interna | `:5432` / `:8000` | `Activo (Healthy)` |
| 🆕 **PETRAL Frontend** | Vite + React SPA Dashboard | **`https://petral.geeksoft.tech`** | `:80` (Nginx Alpine) | **A DESPLEGAR** |
| 🆕 **PETRAL Backend** | FastAPI P&L & Forecast Engine | **`https://petral.geeksoft.tech/api/v1`** | `:8100` | **A DESPLEGAR** |
| 🆕 **PETRAL Database** | Schema / Tablas Maestras | Supabase Postgres Contabo | `:5432` (Red `coolify`) | **A MIGRAR** |

---

## 2. Diagrama de Arquitectura de Producción

```mermaid
flowchart TD
    User([👤 Usuario / Directiva PETRAL]) -->|HTTPS: 443| DNS_Cloud[🌐 Cloudflare DNS: petral.geeksoft.tech]
    DNS_Cloud -->|IP: 169.58.168.107| Traefik_Proxy[🛡️ Traefik v3.6 Ingress Proxy + Auto SSL Let's Encrypt]

    subgraph Contabo_VPS ["🖥️ Servidor VPS Contabo (169.58.168.107 - Ubuntu 22.04 LTS / 11GB RAM / 4 vCPU)"]
        subgraph Docker_Network ["🐳 Red Docker Interna: coolify"]
            Traefik_Proxy -->|"Host: petral.geeksoft.tech /"| Petral_FE["💻 petral_dashboard (Nginx Alpine :80)"]
            Traefik_Proxy -->|"Host: petral.geeksoft.tech /api/"| Petral_BE["⚙️ petral_engine (FastAPI Uvicorn :8100)"]
            
            Petral_FE -.->|"Llamadas API Relativas /api/v1"| Petral_BE
            Petral_BE -->|"Pooler SQL :5432 / REST :8000"| Supabase_Contabo[("🗄️ Supabase PostgreSQL Contabo")]
            
            Traefik_Proxy -.->|"Host: inandes.geeksoft.tech"| InAndes_Stack["🏢 InAndes ERP (Aislado)"]
            Traefik_Proxy -.->|"Host: apefac.geeksoft.tech"| APEFAC_Stack["📊 APEFAC Risk (Aislado)"]
        end
    end

    subgraph Supabase_Cloud_Origen ["☁️ Supabase Cloud Origen (hjjxooxcpvlvbaxgifbn)"]
        Dump_Source[("📦 Dump de Datos Maestros PETRAL")]
    end

    Dump_Source -->|"pg_dump -> psql restore"| Supabase_Contabo
```

---

## 3. 🚩 Banderas Rojas & Lecciones Críticas Aprendidas (Experiencia InAndes)

> [!CAUTION]
> ### 🚩 RED FLAG 1: Pantalla en Blanco (*White Screen*) por Variables de Entorno en Build Time
> - **Causa Raíz:** Vite inyecta las variables `import.meta.env.VITE_*` durante el comando de compilación (`vite build`). Si un pipeline o Docker compila sin que las variables estén presentes, `createClient(undefined, undefined)` o llamadas de API fallan con `throw new Error()`, deteniendo de forma irrecuperable el bundle React antes de pintar el DOM.
> - **Regla Obligatoria para PETRAL:** 
>   1. Compilar SIEMPRE el bundle en la máquina local de desarrollo con `npx vite build` (donde las variables están correctamente resueltas) y subir únicamente la carpeta `/dist`.
>   2. En [`api.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/services/api.ts), configurar siempre valores de degradación elegante por defecto: `baseURL: import.meta.env.VITE_API_URL || '/api/v1'`.

> [!WARNING]
> ### 🚩 RED FLAG 2: Error de Parseo JSON de HTML (`SyntaxError: Unexpected token '<'`)
> - **Causa Raíz:** Si `baseURL` queda vacío (`''`), el frontend solicita `/api/v1/...` al servidor web. Si el proxy inverso no intercepta la ruta `/api/`, el servidor SPA devuelve el archivo `index.html` (HTTP 200 OK). Al ejecutar `response.json()`, Axios/Fetch colapsa intentando parsear código HTML (`<!doctype html>`) como JSON.
> - **Regla Obligatoria para PETRAL:** Traefik y Nginx DEBEN tener el enrutador `/api` apuntando con prioridad máxima al contenedor FastAPI (`petral-backend:8100`), garantizando que toda respuesta a `/api/...` provenga del motor Python en JSON.

> [!CAUTION]
> ### 🚩 RED FLAG 3: Error `502 Bad Gateway` por Desfase de Puerto en Traefik
> - **Causa Raíz:** Traefik en Coolify enruta por defecto hacia el puerto `8000`. Si el backend Uvicorn corre en `:8100` y falta la etiqueta de servicio `traefik.http.services.<nombre>.loadbalancer.server.port=8100`, Traefik envía el tráfico a un puerto cerrado generando un error HTTP 502 inmediato.
> - **Regla Obligatoria para PETRAL:** El `docker-compose.yml` debe fijar explícitamente:
>   `traefik.http.services.petral-backend.loadbalancer.server.port=8100`.

> [!IMPORTANT]
> ### 🚩 RED FLAG 4: Prohibición Absoluta de `*.py` en `.gitignore`
> - **Causa Raíz:** La inclusión de reglas globales `*.py` en `.gitignore` provocó en InAndes que Git omitiera routers críticos del backend, ocasionando fallos de compilación e `ImportError` al desplegar en servidor.
> - **Regla Obligatoria para PETRAL:** Verificar que el `.gitignore` solo excluya `__pycache__/`, `.pytest_cache/` y `.venv/`, asegurando que el 100% de los módulos de `Geeksoft_Engine` estén rastreados por Git.

> [!WARNING]
> ### 🚩 RED FLAG 5: Dependencias del Sistema C/C++ para Renderizado de PDF y Postgres
> - **Causa Raíz:** Motores de reporte como `WeasyPrint` y conectores como `psycopg2` fallan en imágenes Docker minimalistas (`python:slim` / `alpine`) si faltan paquetes como `libpango-1.0-0`, `poppler-utils` y `libpq-dev`.
> - **Regla Obligatoria para PETRAL:** El `backend.Dockerfile` debe instalar estas dependencias vía `apt-get` antes de invocar `pip install -r requirements.txt`.

> [!NOTE]
> ### 🚩 RED FLAG 6: Aislamiento Total de Servicios Coexistentes (InAndes & APEFAC)
> - **Causa Raíz:** Editar `/etc/nginx/nginx.conf` en el host o modificar contenedores existentes puede tumbar el ERP de InAndes o APEFAC.
> - **Regla Obligatoria para PETRAL:** PETRAL se despliega como una suite independiente dentro de `/var/www/PETRAL/docker-compose.yml`, conectándose como cliente externo a la red `coolify` sin alterar la configuración de ningún otro proyecto.

---

## 4. Configuración DNS en Cloudflare / Registrador

Crear/actualizar el siguiente registro DNS en la zona **`geeksoft.tech`**:

| Tipo | Nombre (Host) | Destino (IPv4) | TTL | Proxy Status | Propósito |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **A** | `petral` | `169.58.168.107` | Auto / 1 min | DNS Only (o Proxied) | Dominio oficial de producción de PETRAL |

---

## 5. Procedimiento de Ejecución Paso a Paso

### FASE 1: Migración de Base de Datos (Supabase Cloud ➔ Supabase Contabo)

#### 1.1. Extracción del Dump de Producción desde Supabase Cloud
Desde la máquina local o servidor con `pg_dump`:
```powershell
# Extraer esquema y datos de las tablas de PETRAL
pg_dump "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require" `
  --clean `
  --if-exists `
  --quote-all-identifiers `
  --no-owner `
  --no-privileges `
  --file="scratch\supabase_dump_petral.sql"
```

#### 1.2. Transferencia e Importación en el PostgreSQL de Contabo
```bash
# 1. Copiar dump al servidor Contabo vía SCP/SFTP
scp scratch/supabase_dump_petral.sql root@169.58.168.107:/tmp/

# 2. Conectarse a Contabo e identificar el contenedor de base de datos Supabase
ssh root@169.58.168.107
CONTAINER_DB=$(docker ps --filter "name=supabase-db" --format "{{.ID}}")

# 3. Copiar archivo dentro del contenedor e importar
docker cp /tmp/supabase_dump_petral.sql $CONTAINER_DB:/tmp/dump_petral.sql
docker exec -i $CONTAINER_DB psql -U postgres -d postgres -f /tmp/dump_petral.sql

# 4. Verificar existencia de tablas maestras críticas
docker exec -i $CONTAINER_DB psql -U postgres -d postgres -c "
  SELECT table_name, (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count 
  FROM (
    SELECT table_name, query_to_xml(format('select count(*) as cnt from %I', table_name), false, true, '') as xml_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name IN ('ports', 'vessels', 'routes', 'port_cost_static', 'port_costs_matrix', 'bunker_prices', 'contracts')
  ) t;
"
```

---

### FASE 2: Empaquetamiento y Despliegue del Backend FastAPI (`petral-engine`)

#### 2.1. Estructura de Archivos del Backend
Ruta en Contabo: `/var/www/PETRAL/backend`

**`backend.Dockerfile`:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias nativas del sistema para renderizado PDF y PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libffi-dev \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requerimientos e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

ENV PYTHONUNBUFFERED=1
ENV PORT=8100

EXPOSE 8100

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8100"]
```

---

### FASE 3: Compilación y Despliegue del Frontend Vite (`petral-dashboard`)

#### 3.1. Configuración de URLs y Prevención de Pantalla en Blanco
Para evitar el colapso (*White Screen of Death*) diagnosticado en InAndes:
- En [`src/services/api.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/services/api.ts):
  Configurar `baseURL` con degradación elegante relativa:
  ```typescript
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  ```
- Compilación local optimizada en máquina de desarrollo:
  ```powershell
  cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend
  npx vite build
  ```

#### 3.2. Dockerfile del Frontend (Nginx Alpine Ultra-Ligero < 25 MB)
**`frontend.Dockerfile`:**
```dockerfile
FROM nginx:alpine

# Copiar bundle Vite compilado
COPY dist/ /usr/share/nginx/html/

# Configuración Nginx para SPA (soporte de rutas React Router)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
        add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0"; \
    } \
    gzip on; \
    gzip_types text/plain text/css application/javascript application/json image/svg+xml; \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### FASE 4: Orquestación Docker Compose y Enrutamiento Traefik

Ruta en Contabo: `/var/www/PETRAL/docker-compose.yml`

```yaml
version: "3.8"

services:
  # ==========================================
  # 1. FRONTEND: PETRAL SMART DASHBOARD
  # ==========================================
  petral-frontend:
    container_name: petral_frontend
    build:
      context: .
      dockerfile: frontend.Dockerfile
    restart: always
    networks:
      - coolify
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.petral-fe-http.entrypoints=http"
      - "traefik.http.routers.petral-fe-http.rule=Host(`petral.geeksoft.tech`)"
      - "traefik.http.middlewares.petral-redirect.redirectscheme.scheme=https"
      - "traefik.http.routers.petral-fe-http.middlewares=petral-redirect"
      - "traefik.http.routers.petral-fe-https.entrypoints=https"
      - "traefik.http.routers.petral-fe-https.rule=Host(`petral.geeksoft.tech`)"
      - "traefik.http.routers.petral-fe-https.tls=true"
      - "traefik.http.routers.petral-fe-https.tls.certresolver=letsencrypt"
      - "traefik.http.services.petral-frontend.loadbalancer.server.port=80"

  # ==========================================
  # 2. BACKEND: FASTAPI ENGINE
  # ==========================================
  petral-backend:
    container_name: petral_backend
    build:
      context: ./engine
      dockerfile: backend.Dockerfile
    restart: always
    environment:
      - SUPABASE_URL=http://supabase-kong:8000
      - SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc
      - SUPABASE_DB_URI=postgresql://postgres:VivaLaVida2026$@supabase-db:5432/postgres
    networks:
      - coolify
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.petral-be-https.entrypoints=https"
      - "traefik.http.routers.petral-be-https.rule=Host(`petral.geeksoft.tech`) && PathPrefix(`/api`)"
      - "traefik.http.routers.petral-be-https.tls=true"
      - "traefik.http.routers.petral-be-https.tls.certresolver=letsencrypt"
      - "traefik.http.services.petral-backend.loadbalancer.server.port=8100"

networks:
  coolify:
    external: true
```

---

## 6. Script de Despliegue Automatizado: `deploy_petral_contabo.py`

Ruta local: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\deploy_petral_contabo.py`

Este script ejecuta de principio a fin la secuencia de despliegue:
1. Conexión segura SSH a Contabo (`169.58.168.107`) con credenciales de `contabo_credentials.json`.
2. Verificación de salud previa de Contabo (Traefik, InAndes, Docker).
3. Compilación de frontend Vite en local.
4. Subida SFTP de `/dist` y `Geeksoft_Engine` a `/var/www/PETRAL`.
5. Ejecución remota de `docker compose up -d --build`.
6. Test de conectividad HTTP 200 OK y verificación de certificado SSL en `https://petral.geeksoft.tech`.

---

## 7. Protocolo de Verificación E2E y Cierre de Hostinger

Una vez levantado el stack en Contabo:

1. **Auditoría de Frontend:**
   - Abrir `https://petral.geeksoft.tech` y verificar login, navegación por módulos y renderizado de la grilla.
2. **Auditoría de Maestro de Gastos Portuarios:**
   - Abrir `https://petral.geeksoft.tech/port-costs` y certificar la visualización y persistencia de las 3 filas: **CARGA**, **DESCARGA** y **⛽ BUNKERING**.
3. **Auditoría de Multicotizador & Matriz Financiera:**
   - Ejecutar una simulación de viaje y confirmar que el backend responda en menos de 300 ms consultando Supabase.
4. **Redirección de Dominio Legado & Cierre de Hostinger:**
   - En el VPS Hostinger (`91.108.125.253`), configurar redirección 301 de `forecast.geeksoft.tech` ➔ `https://petral.geeksoft.tech`.
   - Proceder a la cancelación del servidor VPS Hostinger para eliminar costos recurrentes.

---

## 8. 📌 Checklist de Tareas Pendientes (TO-DOs)

> [!NOTE]
> Esta fase de migración a Contabo queda **estabilizada y documentada en espera**. Se ejecutará una vez que la estructura de tablas maestras, esquemas y lógica de negocio en Supabase Cloud queden 100% cerrados y homologados con la dirección comercial.

- [ ] **TO-DO 1:** Cerrar y congelar la estructura final de tablas en Supabase Cloud (`hjjxooxcpvlvbaxgifbn`):
  - [ ] Homologación de campos de Bunkering (`operation_type = 'BUNKERING'`).
  - [ ] Consolidación de tablas maestras (`ports`, `vessels`, `routes`, `contracts`, `bunker_prices`).
- [ ] **TO-DO 2:** Extraer `pg_dump` definitivo de Supabase Cloud.
- [ ] **TO-DO 3:** Importar dump en el contenedor PostgreSQL de Contabo (`supabase-db`).
- [ ] **TO-DO 4:** Desplegar `petral_dashboard` y `petral_backend` en `/var/www/PETRAL` vía `docker compose up -d`.
- [ ] **TO-DO 5:** Apuntar DNS `petral.geeksoft.tech` ➔ `169.58.168.107` en Cloudflare.
- [ ] **TO-DO 6:** Verificación final en vivo y apagado del VPS Hostinger.
