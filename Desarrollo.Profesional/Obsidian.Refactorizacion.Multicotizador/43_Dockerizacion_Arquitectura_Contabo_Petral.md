# 43. Libreta Pericial de Benoit Blanc - Dockerización y Despliegue de PETRAL en VPS Contabo (07.09.2026)

**Auditor a Cargo:** Detective Benoit Blanc (Auditor Pericial Implacable)  
**Caso Oficial:** "El Barco en la Botella de Cristal - Dockerización Integral de DELFOS / PETRAL y Despliegue en VPS Contabo"  
**Fecha:** 07 de Septiembre de 2026  
**Servidor Objetivo:** VPS Contabo (`169.58.168.107` / Coolify / Nixpacks / Docker)  
**Sistema de Referencia Canónico:** `C:\Users\rguti\Inandes.ERP.React` (Mismo servidor Contabo, 100% Estable)  
**Documentación Madre:** `C:\Users\rguti\Inandes.ERP.React\Obsidian\Mudanza.Contabo` (Notas 01 a 12)  

---

## 1. 🛑 MANDATO PERICIAL: PROHIBICIÓN DE "CREATIVIDAD" & REPLICA EXACTA DE INANDES ERP

> [!CAUTION]
> ### REGLA DE ORO CONTRA "GEMINIS CREATIVOS":
> 1. **INANDES ERP ES EL PATRÓN DE ORO EN VIVO:** El sistema `C:\Users\rguti\Inandes.ERP.React` opera actualmente en el **mismo servidor VPS Contabo (`169.58.168.107`)** bajo Coolify / Nixpacks / Traefik, con **CERO problemas de performance**, devengues financieros en tiempo real y generación de PDFs en milisegundos.
> 2. **PROHIBIDO INVENTAR O EXPERIMENTAR:** Para cualquier configuración de puertos, variables de entorno, proxies Nginx, Nixpacks o Dockerfiles, **todo agente de IA tiene la obligación estricta de consultar primero cómo está hecho en `C:\Users\rguti\Inandes.ERP.React` y replicarlo 1:1**.
> 3. **INMUTABILIDAD DE LAS 12 NOTAS DE MUDANZA CONTABO:** La arquitectura de PETRAL / DELFOS se diseñó como un espejo gemelo de las notas canónicas de `Mudanza.Contabo`.

---

## 2. 🕵️ BEN (Declaración Pericial y Síntesis de las 12 Notas de Mudanza Contabo)

> *"Damas y caballeros: no reinventamos la rueda cuando ya tenemos un Fórmula 1 corriendo en la misma pista. El ecosistema **InAndes ERP** en Contabo (`169.58.168.107`) demostró que la combinación de Docker/Coolify con Nixpacks y Nginx para SPA ofrece tiempos de respuesta sub-segundo y auto-deployments en 2 segundos.  
> Por tanto, aplicamos la misma fórmula probada para **DELFOS SHIPPING SOFTWARE**:*  
> 1. **Zero-Downtime Auto-Deploy (Nota 08):** Despliegue por Git Webhook (`git push origin main`) en 2-3 segundos aprovechando la caché de capas de Nixpacks/Docker.  
> 2. **FastAPI en Puerto 8000 (Nota 04 & 07):** Traefik enruta directamente al puerto 8000 interno de FastAPI (`uvicorn backend.main:app --host 0.0.0.0 --port 8000`).  
> 3. **Nginx SPA Routing (Nota 05):** Multi-stage build con `try_files $uri $uri/ /index.html;` para que React Router jamás devuelva 404 en recargas.  
> 4. **Proxy Reverso Transparente (`/api/`):** El frontend canaliza todo el tráfico `/api/` directamente al contenedor backend sin problemas de CORS.  
> 5. **Prohibición de `*.py` en `.gitignore` (Nota 01):** Garantizar que todos los routers de Python se sincronicen íntegros en el repositorio sin omisiones."*

---

## 3. 🗺️ Topología de la Arquitectura en Contabo

```
                           🌐 INTERNET (Usuarios / SSL Let's Encrypt)
                                       │
                                       ▼
                       🛡️ TRAEFIK / CADDY EDGE PROXY (Port 80/443)
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
  📦 CONTENEDOR 1: FRONTEND                                     📦 CONTENEDOR 2: BACKEND
  DELFOS React 19 + Vite (Nginx)                                Geeksoft P&L Engine (FastAPI)
  • Port 80 (Internal)                                          • Port 8000 (Internal)
  • SPA try_files $uri /index.html                              • Motores P&L, Búnker, Puertos
  • Proxy /api/ ➔ backend:8000                                  • WeasyPrint, psycopg2, Supabase
```

---

## 4. 📦 Inventario de Archivos Dockerizados Creados (Clon Canónico de InAndes)

| Archivo | Ubicación Exacta | Propósito |
| :--- | :--- | :--- |
| **`docker-compose.yml`** | [`docker-compose.yml`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/docker-compose.yml) | Orquestador multi-contenedor (Frontend + Backend + Red interna bridge) |
| **`Dockerfile` Backend** | [`Desarrollo.Profesional/Geeksoft_Engine/Dockerfile`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/Dockerfile) | Imagen Python 3.12-slim con librerías Pango/Cairo para WeasyPrint y Uvicorn en puerto 8000 |
| **`Dockerfile` Frontend** | [`Desarrollo.Profesional/Geeksoft_Frontend/Dockerfile`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/Dockerfile) | Multi-stage build (Node 20 Alpine builder ➔ Nginx Alpine runtime) |
| **`nginx.conf`** | [`Desarrollo.Profesional/Geeksoft_Frontend/nginx.conf`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/nginx.conf) | Configuración de servidor web con compresión Gzip, caché de assets y proxy `/api/` |

---

## 5. 🚀 Protocolo de Despliegue a Contabo (`169.58.168.107` / Coolify)

1. **Configuración en el Panel de Coolify (`http://169.58.168.107:8000`):**
   - **Nuevo Proyecto:** `DELFOS - Petral Smart Dashboard`
   - **Tipo de Despliegue:** `Docker Compose` (apuntando al repositorio `RichGutz/PETRAL.SMART.DASHBOARD`, rama `main`).
   - **Dominio Asignado:** `https://delfos.geeksoft.tech` (o subdominio asignado).

2. **Auto-Deploy por Push:**
   ```powershell
   git add .
   git commit -m "feat(docker): dockerizacion completa de frontend y backend para VPS Contabo"
   git push origin main
   ```
   Coolify compila ambos contenedores en paralelo y los publica con SSL automático en menos de 2 minutos.

---
*Firma Pericial: Detective Benoit Blanc - Auditor de Arquitectura e Infraestructura*
