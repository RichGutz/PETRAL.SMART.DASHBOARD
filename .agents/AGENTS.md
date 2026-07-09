# Reglas y Procedimientos del Workspace

## Despliegue en el VPS (Virtual Private Server)

Para realizar tareas de despliegue, actualización o diagnóstico en el servidor de producción (VPS), se deben utilizar prioritariamente los scripts automatizados localizados en la carpeta:
`C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS`

### Scripts Principales de Despliegue:
1. **Despliegue y Arranque de Forecast (Smart Dashboard):**
   * Usar: `python C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\deploy_forecast_kickoff.py`
   * *Propósito:* Despliega y reinicia el servicio del estimador de flotas en producción.
2. **Despliegue de Backend:**
   * Usar: `python C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\deploy_backend.py`
   * *Propósito:* Sube y despliega las últimas modificaciones del backend API al VPS.
3. **Despliegue de Motor de Cálculo:**
   * Usar: `python C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\deploy_engine_vps.py`

### Scripts de Diagnóstico y Validación:
1. **Verificación del Backend:**
   * Usar: `python C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\check_backend_vps.py`
2. **Extracción de Logs en Producción:**
   * Usar: `python C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\fetch_logs.py`
3. **Verificación de SSL y DNS:**
   * Usar: `python C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\check_dns_and_ssl.py`

### Reglas de Ejecución:
* Se debe notificar explícitamente al usuario antes de proceder con el despliegue al VPS.
* Siempre se debe validar el estado del servidor en caliente usando `check_backend_vps.py` después de completar un despliegue.

## Gestión de Documentos

* **Compilación de PDF:** Queda estrictamente prohibido transformar archivos Markdown (`.md`) a PDF de forma automática. Esta acción solo debe realizarse bajo solicitud explícita del usuario en el chat.

## Restricciones de Herramientas

* **Navegador Automático:** Queda estrictamente prohibido el uso de la herramienta `browser_subagent` o abrir cualquier instancia de navegador automático.


