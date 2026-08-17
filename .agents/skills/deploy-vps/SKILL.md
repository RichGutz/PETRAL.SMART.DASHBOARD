---
name: deploy-vps
description: Protocolo ejecutable instantáneo para desplegar PETRAL SMART DASHBOARD al VPS de Producción en Vivo (https://forecast.geeksoft.tech).
---

# Protocolo de Despliegue a Producción (VPS)

Este protocolo define la secuencia exacta de ejecución sin latencia ni investigación previa para subir cualquier cambio a producción en el VPS (`91.108.125.253`).

## ⚡ Secuencia Ejecutable de 3 Pasos

### Paso 1: Fusionar Rama de Trabajo y Subir a GitHub
```powershell
git checkout main
git merge <nombre_de_la_rama_actual>
git push origin main
```

### Paso 2: Compilar el Bundle del Frontend (Vite)
```powershell
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend
npx vite build
```

### Paso 3: Ejecutar el Script Automatizado de Despliegue SSH/SFTP
```powershell
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS
python deploy_forecast_kickoff.py
```

## 🌐 Verificación Final
La aplicación se actualiza en vivo en el dominio oficial HTTPS:
`https://forecast.geeksoft.tech`
