# Lanzamiento Local y VPS

## 1. Lanzamiento Local (Entorno de Desarrollo)

Para levantar el entorno de desarrollo y probar las funcionalidades (como la auditoría del ledger), necesitas abrir **dos terminales independientes** (PowerShell) para ejecutar el backend y el frontend por separado.

### Terminal 1: Backend (FastAPI / Uvicorn)

El backend debe ejecutarse desde la carpeta raíz del motor (`Geeksoft_Engine`), de lo contrario tendrás problemas de importación (ej. `ModuleNotFoundError: No module named 'backend'`).

```powershell
# 1. Ir a la carpeta raíz del motor (¡NO a la carpeta backend!)
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine

# 2. Levantar el servidor indicando la ruta del módulo principal
uvicorn backend.main:app --reload
```
*(El servidor backend estará disponible en `http://localhost:8000`)*

### Terminal 2: Frontend (React / Vite)

```powershell
# 1. Ir al directorio del frontend
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend

# 2. Levantar el servidor de desarrollo de Vite
npm run dev
```
*(El frontend estará disponible en `http://localhost:5173`)*

---

## 2. Lanzamiento en VPS (Producción)

El despliegue a producción (`forecast.geeksoft.tech`) se gestiona a través de dos scripts de Python que se encuentran en la carpeta `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS`.
Estos scripts automatizan la conexión SSH, transferencia de archivos y configuración (systemd/Nginx) en el servidor VPS.

### Desplegar el Backend (Geeksoft_Engine)

Para subir cambios del backend al servidor de producción:

```powershell
# 1. Ir a la carpeta de despliegue
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS

# 2. Ejecutar script
python deploy_engine_vps.py
```
*Este script subirá la carpeta, instalará dependencias en un entorno virtual y reiniciará el servicio `geeksoft-engine` que corre en el puerto 8000 en el VPS.*

### Desplegar el Frontend (Geeksoft_Frontend)

Para subir cambios visuales o del frontend:

```powershell
# 1. Compilar el proyecto React/Vite (en la carpeta del frontend)
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend
npm run build

# 2. Ir a la carpeta de despliegue
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS

# 3. Ejecutar script
python deploy_forecast_kickoff.py
```
*Este script subirá la carpeta `dist`, configurará el reverse proxy (`/api`) en Nginx hacia el backend local y recargará el servicio Nginx.*
