# Lanzamiento Local y VPS

## 1. Lanzamiento Local (Entorno de Desarrollo)

Para levantar el entorno de desarrollo y probar las funcionalidades (como la auditoría del ledger), necesitas abrir **dos terminales independientes** (PowerShell) para ejecutar el backend y el frontend por separado.

### Terminal 1: Backend (FastAPI / Uvicorn)

El backend debe ejecutarse desde la carpeta raíz del motor (`Geeksoft_Engine`), de lo contrario tendrás problemas de importación (ej. `ModuleNotFoundError: No module named 'backend'`).

```powershell
# 1. Ir a la carpeta raíz del motor
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

## 2. Lanzamiento en VPS (Producción / Railway)

*Nota: Agregar aquí en el futuro los comandos específicos para despliegue en producción, como `git push railway main` u otros relacionados.*
