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
