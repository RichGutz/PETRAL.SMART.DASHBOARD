# 🚀 AS-BUILT: Despliegue en Producción (VPS, Nginx, Systemd & SSL)

> **Servidor**: VPS Host Linux (`91.108.125.253`)
> **Dominio**: `https://forecast.geeksoft.tech`
> **Protocolo de Deploy**: Invariable vía `deploy_forecast_kickoff.py`
> **Última Modificación**: 2026-07-30

---

## 🧭 Navegación
| [← Modelo E-R](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/00_Fundamentos_y_Arquitectura/02_AS_BUILT_Modelo_Entidad_Relacion_Supabase_PostgreSQL.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Maestro Buques →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_01_Buques_VesselsMaster.md) |

---

## ⚠️ Regla Invariable de Despliegue (REGLA DE ORO)

> [!CAUTION]
> **NUNCA** utilices comandos genéricos como `git push railway main` para desplegar este proyecto.
> El procedimiento oficial e invariable para desplegar a Producción (VPS) es ejecutar el flujo local:
> 1. `cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend`
> 2. `npm run build`
> 3. `cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS`
> 4. `python deploy_forecast_kickoff.py`

---

## 🖥️ 1. Infraestructura y Estructura en VPS Server

### Rutas en Servidor:
- **Frontend Assets**: `/opt/forecast_petral`
- **Backend Service**: `/opt/geeksoft_engine`
- **Virtual Environment Python**: `/opt/geeksoft_engine/venv`

### Servicio Systemd (`/etc/systemd/system/geeksoft-engine.service`):
```ini
[Unit]
Description=Geeksoft Engine FastAPI Backend
After=network.target

[Service]
User=root
WorkingDirectory=/opt/geeksoft_engine
ExecStart=/opt/geeksoft_engine/venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000 --workers 1
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 🌐 2. Configuración Nginx y SSL Certbot

### Nginx Site Configuration (`/etc/nginx/sites-enabled/forecast.geeksoft.tech`):
- Redirección automática HTTP a HTTPS (`301 https://$host$request_uri`).
- Proxy inverso para el backend API:
  - Rutas `/api/v1/*` son enviadas internamente a `http://127.0.0.1:8000/api/v1/*`.
- Archivos estáticos SPA servidos desde `/opt/forecast_petral` con fallback a `index.html`.
- Certificado SSL renovado vía Certbot / Let's Encrypt.

---

## 🛠️ 3. Paquetes del Sistema Críticos en VPS

Para habilitar la generación de PDF sin errores en el servidor backend, el VPS cuenta con las siguientes librerías instaladas:
- `weasyprint` v69.0 en `/opt/geeksoft_engine/venv/bin/pip`.
- `libpango-1.0-0`, `libharfbuzz0b`, `libpangoft2-1.0-0` para renderizado de fuentes PDF.

---

## 🔗 Enlaces Relacionados
- [[01_AS_BUILT_Arquitectura_General_y_Stack_Tecnico]] — Stack tecnológico del proyecto.
- [[AS_BUILT_Herramienta_05_Auditoria_PDF_Liquidaciones_WeasyPrint]] — Arquitectura del servicio de PDF.
