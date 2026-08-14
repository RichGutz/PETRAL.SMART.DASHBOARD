# Reglas de Despliegue para el Proyecto PETRAL

<RULE[deployment_vps]>
- **NUNCA** utilices comandos genéricos de Railway (`git push railway main`) para desplegar este proyecto, sin importar lo que digan las instrucciones globales.
- **Lanzamiento Local vs VPS**: Cuando el usuario solicite "lanzar en local", **NUNCA** subir ni desplegar al VPS a menos que el usuario lo pida expresamente.
- Las especificaciones y comandos para lanzamiento local y despliegue a VPS se encuentran en: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.1\DashBoardPetral\01_Arquitectura_y_Especificaciones\Lanzamiento.Local.y.VPS.md`.
- El flujo para el Frontend al desplegar a Producción (VPS) es:
  1. `cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend`
  2. `npm run build`
  3. `cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS`
  4. `python deploy_forecast_kickoff.py`
</RULE[deployment_vps]>

<RULE[markdown_pdf_conversion]>
- **NO** convertir archivos Markdown (.md) a PDF automáticamente. Solo generar o convertir a PDF cuando el usuario lo solicite de manera explícita y directa.
<RULE[no_browser]>
- **NUNCA** abras ni utilices el navegador del usuario (browser_subagent). Toda prueba, auditoría y generación de PDF debe ejecutarse de forma no-interactiva en terminal mediante scripts de Python / Node.
</RULE[no_browser]>

<RULE[png_local_storage]>
- **SIEMPRE** copiar y respaldar de inmediato cada captura de pantalla PNG enviada por el usuario en las rutas locales:
  1. `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Maestro.Costos.Portuarios\PNGs\`
  2. `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.PATRICIA\`
</RULE[png_local_storage]>
<RULE[bunker_mdo_mgo_homologation]>
- En todo el software PETRAL, las siglas **MGO** (Marine Gas Oil / Diesel Marino) que figuran en facturas o cotizaciones equivalen y se registran unificadamente bajo el estándar **MDO**.
</RULE[bunker_mdo_mgo_homologation]>

<RULE[macro_plan_adherence]>
- **Alineación con Plan Macro**: Cuando exista un Plan Macro General (documentado en Obsidian o especificaciones), el agente debe razonar en cada paso para NO perder de vista el objetivo global del plan macro. Todo cambio puntual debe alinearse y contribuir directamente a la visión estratégica general del proyecto.
</RULE[macro_plan_adherence]>

<RULE[benoit_blanc_audit_protocol]>
- **Protocolo Benoit Blanc de Auditoría**: Cada vuelta/ronda de auditoría visual o pericial planteada por el usuario DEBE ser documentada al máximo detalle en una **tabla nueva e independiente** (ej. 5.1 Vuelta 1, 5.2 Vuelta 2, 5.3 Vuelta 3, etc.) dentro del documento Obsidian: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador\07_Especificaciones_Comerciales_Grilla_y_Puertos.md`.
</RULE[benoit_blanc_audit_protocol]>


