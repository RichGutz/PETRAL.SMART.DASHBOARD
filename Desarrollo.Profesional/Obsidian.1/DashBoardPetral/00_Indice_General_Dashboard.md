# 🗺️ ÍNDICE GENERAL — DASHBOARD COMMERCIAL FORECAST & COSTOS PORTUARIOS PETRAL

> **Ubicación de la Bóveda**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.1\DashBoardPetral`
> **Estado del Sistema**: **Producción / Despliegue VPS Activo**.

---

## 🚀 1. Despliegue Oficial a Producción (VPS)

> ⚠️ **PROCEDIMIENTO INVARIABLE Y OBLIGATORIO DE DESPLIEGUE A VPS**:
> [Lanzamiento.Local.y.VPS.md](01_Arquitectura_y_Especificaciones/Lanzamiento.Local.y.VPS.md)
> 
> 1. `cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend`
> 2. `npm run build`
> 3. `cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS`
> 4. `python deploy_forecast_kickoff.py`

---

## 📂 2. Estructura de la Bóveda de Desarrollo

```
Obsidian.1/DashBoardPetral/
├── 00_Indice_General_Dashboard.md             <-- Este índice
├── 🏗️ 01_Arquitectura_y_Especificaciones/
├── 🚢 02_Maestros_y_Modulos/
├── 📝 03_Bitacoras_de_Desarrollo/
├── 🧪 04_QC_y_Auditoria/
└── 🗄️ 05_Archivos_Historicos_OLD/
```

---

## 🏗️ 3. Arquitectura y Especificaciones (`01_Arquitectura_y_Especificaciones/`)

- 🚀 [Lanzamiento.Local.y.VPS.md](01_Arquitectura_y_Especificaciones/Lanzamiento.Local.y.VPS.md): **Guía Oficial de Despliegue a Producción (VPS)**.
- 🗺️ [Mapa.Arquitectura.General.md](01_Arquitectura_y_Especificaciones/Mapa.Arquitectura.General.md): Arquitectura completa del Dashboard.
- 🗄️ [Modelo.E-R.md](01_Arquitectura_y_Especificaciones/Modelo.E-R.md): Modelo Entidad-Relación de base de datos.
- 📊 [Especificacion.Commercial.Forecast.md](01_Arquitectura_y_Especificaciones/Especificacion.Commercial.Forecast.md): Motor del Cotizador Comercial.
- 📍 [Especificacion.Ruteador.Spot.md](01_Arquitectura_y_Especificaciones/Especificacion.Ruteador.Spot.md): Ruteador marítimo de viajes spot.
- 🔀 [Especificacion.Mapa.Espaguetis.md](01_Arquitectura_y_Especificaciones/Especificacion.Mapa.Espaguetis.md): Grafo y ruteo dinámico de puertos.
- 📜 [Ledger.Implementacion.DEFINITIVA.md](01_Arquitectura_y_Especificaciones/Ledger.Implementacion.DEFINITIVA.md): Especificación del Voyage Ledger.
- 🗺️ [Plan.Implementacion.Flowchart.General.md](01_Arquitectura_y_Especificaciones/Plan.Implementacion.Flowchart.General.md): **Plan del Flujograma General (Graphviz TB)**.
- 📝 [Bitacora.Diseno.Flowchart.General.md](01_Arquitectura_y_Especificaciones/Bitacora.Diseno.Flowchart.General.md): **Bitácora de Diseño & Lección Visual del Flujograma**.



---

## 🚢 4. Maestros del Sistema (`02_Maestros_y_Modulos/`)

- 🚢 [Maestro.Flota.md](02_Maestros_y_Modulos/Maestro.Flota.md): Buques de la flota (Moquegua, Tablones, Huemul, Concon Trader).
- 📜 [Maestro.Contratos.md](02_Maestros_y_Modulos/Maestro.Contratos.md): Tarifarios y contratos con clientes.
- 🛃 [Maestro.Aduanas.md](02_Maestros_y_Modulos/Maestro.Aduanas.md): Agenciamiento y costos aduaneros.
- ⚓ [Maestro.Puertos.md](02_Maestros_y_Modulos/Maestro.Puertos.md): Puertos de Perú y Chile.
- 🗺️ [Maestro.Rutas.md](02_Maestros_y_Modulos/Maestro.Rutas.md): Matriz de distancias y tiempos de navegación.

---

## 🧪 5. Control de Calidad y Auditoría (`04_QC_y_Auditoria/`)

- 🔍 [Especificacion.Auditoria.Final.md](04_QC_y_Auditoria/Especificacion.Auditoria.Final.md): Especificación del módulo de auditoría.
- ✅ [QC.Auditoria.FINAL.md](04_QC_y_Auditoria/QC.Auditoria.FINAL.md): Protocolos de Quality Control.
- 💰 [QC.Matriz.Financiera.md](04_QC_y_Auditoria/QC.Matriz.Financiera.md): Verificación de la Matriz Financiera.
- 🤖 [Loop.Coder.QC.AntiGravity.md](04_QC_y_Auditoria/Loop.Coder.QC.AntiGravity.md): Protocolo de Pair Programming AntiGravity.
