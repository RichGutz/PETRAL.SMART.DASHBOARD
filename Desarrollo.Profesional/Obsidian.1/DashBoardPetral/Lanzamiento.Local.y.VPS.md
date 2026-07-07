# Lanzamiento Local y VPS

> [!WARNING]
> **IMPORTANTE (Desarrollo Frontend):** Toda nueva ruta, maestro o lógica visual debe configurarse y enrutarse obligatoriamente en **`src/App_V2.tsx`**. El archivo `src/App.tsx` es la versión legacy (App 1) y **no se está usando en producción ni en desarrollo activo**. Si no logras visualizar un cambio tras compilar, asegúrate de no haber modificado `App.tsx` por error.

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

---

## 3. Conexión SQL (Supabase Postgres) Directa

Cuando necesites ejecutar operaciones estructurales o scripts de migración directamente sobre la base de datos (por ejemplo, hacer un `ALTER TABLE`, `DROP COLUMN`, etc. que no están permitidas vía la API REST de Supabase), puedes conectarte directamente usando la librería `psycopg2` y el connection string.

Aquí tienes la plantilla estándar (snippet) que solemos usar en la carpeta `scratch/` para ejecutar SQL puro en Supabase:

```python
import psycopg2

# Connection string directo al pooler de Supabase
conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

# Conectar a la base de datos
conn = psycopg2.connect(conn_str)
conn.autocommit = True  # Opcional, dependiendo de si harás commit manual
cur = conn.cursor()

# Tu consulta o comando SQL aquí
sql_query = """
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ports';
"""

cur.execute(sql_query)
# Para consultas SELECT:
# print(cur.fetchall())

print("Comando SQL ejecutado con éxito.")

# Limpieza
cur.close()
conn.close()
```
