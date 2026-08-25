import sys
import os

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

note_content = r"""# 10. Corrección de Direccionamiento Residual hacia Hostinger & Independencia de Contabo

---

## 📌 1. Resumen Ejecutivo y Diagnóstico Forense

Durante la auditoría de salud del VPS de Producción de **Hostinger** (`91.108.125.253` / VPS de PETRAL), se detectó que el servicio legacy de **ERP InAndes** (`inandes-api.service`, `run_fastapi.py`) seguía consumiendo **31.1% de memoria RAM (~1.25 GB)** y continuaba recibiendo llamadas activas de generación de PDFs:
- **Última llamada registrada**: `24 de Agosto a las 11:39 AM (16:39 UTC)` desde IP de WIN Empresas (`38.25.30.48`) y Telefónica (`190.234.182.191`).
- **Endpoint llamado**: `POST /api/inversionistas/generate-pdf`.

### Causa Raíz Identificada
A pesar de que el dominio principal `https://inandes.geeksoft.tech/` ya había sido migrado exitosamente a **Contabo** (`169.58.168.107` con Caddy/Coolify), el código fuente de React en producción tenía **URLs absolutas hardcodeadas** apuntando al antiguo subdominio de Hostinger (`https://inandes.react.geeksoft.tech/...`) para la generación de reportes y visores PDF de inversionistas.

---

## 🔍 2. Auditoría de Código: Puntos Afectados en `Inandes.ERP.React`

Se auditaron todos los componentes del frontend y se identificaron 4 puntos críticos con URLs fijas hacia Hostinger:

| Archivo | Línea Original | Código Anterior (❌ Hostinger Fijo) | Código Corregido (✅ Dinámico Contabo) |
| :--- | :--- | :--- | :--- |
| `src/features/fondos/FondosPage.tsx` | L288 | `fetch('https://inandes.react.geeksoft.tech/api/inversionistas/generate-pdf', ...)` | `fetch(`${getApiBaseUrl()}/api/inversionistas/generate-pdf`, ...)` |
| `src/features/inversionistas/InversionistasPage.tsx` | L127 | `fetch('https://inandes.react.geeksoft.tech/api/inversionistas/generate-pdf', ...)` | `fetch(`${getApiBaseUrl()}/api/inversionistas/generate-pdf`, ...)` |
| `src/features/inversionistas/InversionistasPage.tsx` | L2668 | `window.open('https://inandes.react.geeksoft.tech/api/inversionistas/eecc/...', '_blank')` | `window.open(`${getApiBaseUrl()}/api/inversionistas/eecc/...`, '_blank')` |
| `src/features/inversionistas/InversionistasPage.tsx` | L2724 | `window.open('https://inandes.react.geeksoft.tech/api/inversionistas/retenciones/...', '_blank')` | `window.open(`${getApiBaseUrl()}/api/inversionistas/retenciones/...`, '_blank')` |

---

## 🛠️ 3. Modificaciones Aplicadas

Se implementó el uso del helper centralizado `getApiBaseUrl()` de `src/config/apiConfig.ts`:
- **En Entorno de Producción (Contabo)**: Retorna `""` (ruta relativa), permitiendo que todas las peticiones `/api/...` sean resueltas directamente por el Reverse Proxy de Contabo (Caddy) hacia el contenedor de backend correspondiente.
- **En Entorno Local (Desarrollo)**: Retorna `http://localhost:8000` (o el valor definido en `VITE_API_FACTORING_URL`).

### Diff de Cambios:

```diff
// FondosPage.tsx & InversionistasPage.tsx
+ import { getApiBaseUrl } from '../../config/apiConfig';

- const response = await fetch('https://inandes.react.geeksoft.tech/api/inversionistas/generate-pdf', {
+ const API_BASE = getApiBaseUrl();
+ const response = await fetch(`${API_BASE}/api/inversionistas/generate-pdf`, {
```

```diff
// InversionistasPage.tsx (Pestañas de EECC y Retenciones)
- window.open(`https://inandes.react.geeksoft.tech/api/inversionistas/eecc/${fondo}/${fEnd}`, '_blank');
+ const API_BASE = getApiBaseUrl();
+ window.open(`${API_BASE}/api/inversionistas/eecc/${fondo}/${fEnd}`, '_blank');

- window.open(`https://inandes.react.geeksoft.tech/api/inversionistas/retenciones/${fondo}/${fEnd}`, '_blank');
+ const API_BASE = getApiBaseUrl();
+ window.open(`${API_BASE}/api/inversionistas/retenciones/${fondo}/${fEnd}`, '_blank');
```

---

## 🚀 4. Protocolo de Despliegue en Contabo & Desactivación en Hostinger

### Paso 1: Desplegar Frontend Actualizado en Contabo
1. Desde la terminal en `C:\Users\rguti\Inandes.ERP.React`:
   ```bash
   git add .
   git commit -m "fix(api): homologar endpoints pdf inversionistas con getApiBaseUrl para Contabo"
   git push origin main
   ```
2. En Coolify (o Webhook de Contabo), verificar que el nuevo build de Vite se complete.

### Paso 2: Desactivar Definitivamente Servicios Legacy en Hostinger (`91.108.125.253`)
Una vez validado el frontend en Contabo, ejecutar en el VPS Hostinger:
```bash
# 1. Detener y deshabilitar servicios de InAndes
systemctl stop inandes-api inandes-backend erp_inandes
systemctl disable inandes-api inandes-backend erp_inandes

# 2. Terminar procesos residuales
pkill -f "/opt/erp_inandes"
```

### Beneficio Obtenido:
- **Liberación de Memoria en Hostinger**: Se recuperan **~1.4 GB de RAM** (36.5% del servidor).
- **Eliminación de Bucles de CPU**: Se cancela el loop de más de 253,000 reinicios fallidos de `inandes-backend.service`.
- **Independencia Total**: Contabo opera como servidor autosuficiente sin dependencias cruzadas con Hostinger.

---
*Documento generado tras auditoría pericial y refactorización de endpoints API.*
"""

note_path = r"C:\Users\rguti\Inandes.ERP.React\Obsidian\Mudanza.Contabo\Mudanza.Contabo\10. Correccion.Direccionamiento.Hostinger.md"
with open(note_path, 'w', encoding='utf-8') as f:
    f.write(note_content)

print(f" Nota creada exitosamente en: {note_path}")
