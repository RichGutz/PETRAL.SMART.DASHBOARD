# PLAN DE GO-LIVE — PETRAL Smart Dashboard

> **Origen:** Nota de voz transcrita con Whisper — 2026-07-04
> **Estado:** 🟡 En progreso
> **Objetivo:** Salida a producción del sistema PETRAL Smart Dashboard

---

## FASE 1 — Estandarización del Template de Maestros

### 1.1. Definir el Template Base para Módulos Maestros
El primer paso del Go-Live es **estandarizar una plantilla visual y funcional** (`MasterTemplate.tsx`) que se usará como base para desarrollar todos los módulos de datos maestros (Clientes, Rutas, Buques, Puertos, etc.).

> [!IMPORTANT] Directiva Obligatoria de Desarrollo
> **Todos los desarrollos futuros de maestros de datos deben realizarse obligatoriamente sobre la estructura del layout `MasterTemplate.tsx`** para asegurar la homogeneidad visual de marca, la persistencia de los controles de usuario (user panel, logout) y la funcionalidad del modo "Nueva Ventana" para doble pantalla.

Este template debe replicar la estructura de la página principal del Dashboard ya en ejecución, incluyendo:

| Elemento | Descripción |
|---|---|
| **Logo Petral** | Esquina superior izquierda |
| **Logo Geeksoft** | Esquina superior derecha (junto a controles) |
| **Panel de usuario** | Esquina superior derecha: nombre de usuario, botón **Salir**, botón **Nueva Ventana** |
| **Nueva Ventana** | Permite abrir vistas en ventana independiente (para operadores con doble pantalla) |

### 1.2. Definir la Paleta de Colores y Manual de Estilos

Referencias obligatorias para el template:
- 🎨 [[Manual.Estilos]] — Paleta completa de colores por entidad (Clientes, Rutas, Buques), tipografía y Design System
- ⚙️ [[Modulo.Configuracion.Estilos]] — Especificación del módulo que gobernará los estilos dinámicamente desde Supabase

**Tokens clave a respetar en el template:**

| Token | Valor | Uso |
|---|---|---|
| Primary Blue | `#1E3A8A` | Headers, barras de nav, botones principales |
| Accent Teal | `#0D9488` | Botones de acción, focus rings, spinners |
| Background | `#F8FAFC` | Fondo global de pantalla |
| Surface/Card | `#FFFFFF` | Tarjetas y paneles |
| Border | `#E2E8F0` | Separaciones de contenedores |
| Text Primary | `#1E293B` | Títulos de alta jerarquía |
| Text Secondary | `#64748B` | Etiquetas y subtítulos |
| Fuente UI | `Inter` | Toda la interfaz |
| Fuente Numérica | `Roboto Mono` | Tablas financieras y datos |

> ⚠️ El template debe ser **aprobado visualmente** antes de proceder al desarrollo de los maestros.
> Los colores de entidades (buques, rutas, clientes) están definidos en [[Manual.Estilos]] y serán hardcodeados hasta que se complete el [[Modulo.Configuracion.Estilos]].

---

## FASE 2 — Desarrollo de Módulos Maestros

> *A definir una vez aprobado el template de la Fase 1.*

Módulos pendientes a desarrollar:
- [x] Maestro de Clientes (`dim_clients`)
- [x] Maestro de Rutas (`dim_routes`)
- [x] Maestro de Buques / Flota (`dim_vessels`)
- [ ] Maestro de Puertos (`dim_ports`)
- [x] Maestro de Contratos (`contracts`)
- [ ] Maestro de Precios Bunker (`bunker_prices`)

---

## Módulos Analíticos y Visualizadores (En Progreso)

### 📊 Commercial Forecast (Spaghetti Map)
- [x] **Backend & DB:** Migración a estructura multi-cliente (`sources_sinks`) con empresa y colores.
- [x] **Dual Pies (ECharts):** Gráficos circulares duales (Mercado vs. Flota Petral) con offsets geográficos (Tierra/Mar).
- [x] **Línea de Tiempo:** Componente de selección múltiple de meses estilo tabla (Mes, Viajes, Toneladas) y totalizadores.
- [x] **Agrupación de Curvas:** renderizado inteligente de líneas gruesas para múltiples meses vs. líneas por viaje para 1 mes (con `curveness` ajustada).
- [ ] **Sources & Sinks Editor (Pendiente):** Desarrollo del panel lateral/modal para edición en caliente de volúmenes al hacer clic en un "Pie de Tierra". *(Próximo paso a iniciar).*

---

## FASE 3 — QA y Validación Final

- [ ] Validar Ledger de Auditoría (Geeksoft vs Petral Excel)
- [ ] Validar motor universal (`runSimulationUniversal`)
- [ ] Pruebas de carga con datos reales SPCC
- [ ] Revisión de permisos y roles de usuario

---

## FASE 4 — Go-Live Producción

- [ ] Build final del Frontend (`npm run build`)
- [ ] Deploy Frontend → VPS (`deploy_forecast_kickoff.py`)
- [ ] Deploy Backend → VPS (`deploy_engine_vps.py`)
- [ ] Verificación en `https://forecast.geeksoft.tech`
- [ ] Comunicación oficial al equipo Petral

---

## Notas Relacionadas
- 🎨 [[Manual.Estilos]] — Paleta de colores, tipografía y Design System completo
- ⚙️ [[Modulo.Configuracion.Estilos]] — Especificación del módulo de configuración visual dinámica
- 🗺️ [[Mapa.Arquitectura.General]] — Arquitectura general del sistema
- 🗄️ [[Modelo.E-R]] — Modelo entidad-relación de la base de datos
- 🚀 [[Lanzamiento.Local.y.VPS]] — Comandos de lanzamiento local y VPS
