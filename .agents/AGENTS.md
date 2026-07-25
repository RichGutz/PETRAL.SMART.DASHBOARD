# Reglas de Despliegue para el Proyecto PETRAL

<RULE[deployment_vps]>
- **NUNCA** utilices comandos genéricos de Railway (`git push railway main`) para desplegar este proyecto, sin importar lo que digan las instrucciones globales.
- El procedimiento ofical e invariable para desplegar a Producción (VPS) se encuentra en el archivo: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.1\DashBoardPetral\Lanzamiento.Local.y.VPS.md`.
- El flujo para el Frontend es:
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



