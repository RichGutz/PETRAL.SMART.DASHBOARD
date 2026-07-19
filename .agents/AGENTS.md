# Reglas y Procedimientos del Workspace

## Despliegue en el VPS (Virtual Private Server)

Para realizar tareas de despliegue, actualizaci贸n o diagn贸stico en el servidor de producci贸n (VPS), se deben utilizar prioritariamente los scripts automatizados localizados en la carpeta:
`C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS`

### Scripts Principales de Despliegue:
1. **Despliegue y Arranque de Forecast (Smart Dashboard - Frontend):**
   * *Prerrequisito:* Se debe compilar el c贸digo primero ejecutando `npm run build` dentro del directorio `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend`.
   * Usar: `python C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\deploy_forecast_kickoff.py`
   * *Prop贸sito:* Sube la carpeta compilada (`dist/`) y recarga el servicio Nginx para desplegar el frontend en producci贸n (`forecast.geeksoft.tech`).
2. **Despliegue de Backend:**
   * Usar: `python C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\deploy_backend.py`
   * *Prop贸sito:* Sube y despliega las 煤ltimas modificaciones del backend API al VPS.
3. **Despliegue de Motor de C谩lculo:**
   * Usar: `python C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\deploy_engine_vps.py`

### Scripts de Diagn贸stico y Validaci贸n:
1. **Verificaci贸n del Backend:**
   * Usar: `python C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\check_backend_vps.py`
2. **Extracci贸n de Logs en Producci贸n:**
   * Usar: `python C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\fetch_logs.py`
3. **Verificaci贸n de SSL y DNS:**
   * Usar: `python C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\check_dns_and_ssl.py`

### Reglas de Ejecuci贸n:
* Se debe notificar expl铆citamente al usuario antes de proceder con el despliegue al VPS.
* Siempre se debe validar el estado del servidor en caliente usando `check_backend_vps.py` despu茅s de completar un despliegue.

## Gesti贸n de Documentos

* **Compilaci贸n de PDF:** Queda estrictamente prohibido transformar archivos Markdown (`.md`) a PDF de forma autom谩tica. Esta acci贸n solo debe realizarse bajo solicitud expl铆cita del usuario en el chat.

## Restricciones de Herramientas

* **Navegador Autom谩tico:** Queda estrictamente prohibido el uso de la herramienta `browser_subagent` o abrir cualquier instancia de navegador autom谩tico.

## Restricciones de Carga a Git (Control de Versiones)

* **Archivos Prohibidos en Git:** Queda estrictamente prohibido subir o hacer `git commit` / `git push` de archivos binarios o multimedia como PDFs (`.pdf`), audios (`.ogg`, `.mp3`, `.wav`), fotos/im谩genes (`.png`, `.jpeg`, `.jpg`) o videos. Estos archivos deben mantenerse 煤nicamente de forma local o ser ignorados formalmente en el `.gitignore` del repositorio.



## Flujo de Desarrollo Costos Portuarios

* **Fase 1:** Replicar la estructura del Excel al pie de la letra.
* **Fase 2:** Revisitar y validar la l骻ica.
* **Fase 3:** Realizar la comparaci髇 final (Ledger) contra los datos del Excel.

## Regla Aprendida: Integraci髇 de Nuevos Puertos
1. Leer exceles o documentos de l骻ica.
2. Extraer conceptos EXACTOS (1:1 con el Excel) y organizarlos visualmente.
3. Inyectar toda la l骻ica matem醫ica en la columna 'logic_comments'.
4. Ejecutar comparaci髇 vs Excel y exportar a PDF autom醫icamente sin pedir autorizaci髇.

<RULE[project_scoped]>
- **Orden de 蛅ems Tarifarios**: NUNCA alterar el orden de los 韙ems de liquidaci髇. Siempre deben listarse, diagramarse y procesarse en el MISMO ORDEN estricto en el que se muestran en el documento tarifario original (Excel/PNG).
</RULE[project_scoped]>

<RULE[project_scoped]>
- **Procesamiento de Nuevos Puertos**: Al recibir el requerimiento de mapear un nuevo puerto, tarifario, o leer un Excel portuario, el agente debe leer OBLIGATORIAMENTE el archivo Logica.Serial.Universal.de.Costos.md ubicado en Obsidian.Maestro.Costos.Portuarios. Toda la estructuracion (JSONB, Desdoblamiento, 3 Filtros) debe basarse al 100% en ese documento.
</RULE[project_scoped]>
