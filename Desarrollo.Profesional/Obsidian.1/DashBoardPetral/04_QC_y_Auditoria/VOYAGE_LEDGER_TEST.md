# 🧪 VOYAGE_LEDGER_TEST — Matriz de Auditoría (Implementada ✅)

## 📌 1. Objetivo del Proyecto
Herramienta de diagnóstico en formato de **Tabla interactiva** en el frontend (React, puerto 5173) que audita las matemáticas internas del motor **Geeksoft** comparándolas contra los Exceles corporativos de Petral.

**Estado actual:** ✅ IMPLEMENTADA Y EN PRODUCCIÓN (branch `main`)

## 🎯 2. Alcance
- **Cliente:** `SPCC`
- **Rutas:** ILO-MATARANI · ILO-MARCONA · ILO-MEJILLONES
- **Buques:** MOQUEGUA · TABLONES · CONCON_TRADER (19,000 MT)

## 🎨 3. Esquema de Color por Tabla (COLOR_SCHEME)

Cada tabla de origen tiene un color fijo que se aplica en los cards superiores Y en la columna "Tabla Origen" de la tabla de auditoría:

| Color | Tabla | Función |
|---|---|---|
| 🔵 Azul | `vessels` | Maestro Flota y consumos granulares |
| 🟡 Amarillo | `bunker_prices` | Precios de combustible con fecha cotización |
| 🟣 Púrpura | `routes` | Distancias y weather factors |
| 🟠 Naranja | `ports` | Límites físicos de terminales |
| 🔴 Rojo | `agency_matrix` | Costos portuarios planos (Mantenida viva físicamente como fallback secundario obligatorio) |
| 🟢 Verde | `contracts` | Reglas comerciales y fletes |

## 🧮 4. Estructura de la Matriz

| Métrica | Fórmula Algorítmica | Tablas |
|---|---|---|
| **1. Tasa Carga** | `c_load` | `contracts` |
| **2. Tasa Descarga** | `c_disch` | `contracts` |
| **3. Días de Puerto** | `((Q/act_load + over_or + pos_or) + (Q/act_disch + over_de + pos_de)) / 24` | Calculado |
| **4. Días de Mar** | `(dist*(1+w_laden) + dist*(1+w_ballast)) / (speed*24)` | `routes · vessels` |
| **5. Costo Bunker** | `(ifo_tons * p_ifo) + (mdo_tons * p_mdo)` | `vessels · bunker_prices` |
| **6. Resultado Viaje** | `(Q * F) - port_costs - bunker` | `contract_tariffs · agency_matrix` |
| **7. Duración Total** | `sea_days + port_days` | Motor |
| **8. TCE Diario** | `voyage_result / total_duration` | Motor |
| **9. Utilidad Nom.** | `voyage_result - (tce_req * total_duration)` | `vessels` |

## 🏗️ 5. Panel de Variables — Dashboard 4 Columnas

Layout `flex` de 4 columnas; cols 2 y 3 tienen cards apilados con `gap-1` (pegaditos):

| Col | Card | Variables clave |
|---|---|---|
| **1** | 👤 Maestro Flota | Barco • speed • tce_req • DWT • dwcc • length • beam • IFO/MDO •- {Mar, Idle, Carga, Desc} en **MT/d** |
| **2 (top)** | 🟡 Combustible | Fecha Cotización · p_ifo · p_mdo |
| **2 (bot)** | 🔴 Costos Portuarios | Llaves: Cliente+Puerto+Op+Barco · Port Cost Origen · Port Cost Destino |
| **3 (top)** | 🟣 Maestro Rutas | Origen→Destino · dist · w_laden / w_ballast |
| **3 (bot)** | 🟢 Reglas Comerciales | Q · F · c_load · c_disch |
| **4** | 🟠 Límites Portuarios | over_or · over_de · pos_carga · pos_descarga |

## 🔧 6. Arquitectura Backend

- `backend/engine.py` → calcula P&L + emite `audit_trail` (fórmula + valores numéricos)
- `backend/services/forecast_service.py` → pre-carga 6 tablas maestras + pasa `raw_inputs` al frontend
- `VoyageLedgerTest.tsx` → selector barco/ruta · panel 4 cols · tabla de auditoría con Δ

## ⚠️ 7. TODOs Pendientes

- [ ] Valores MDO de los 3 barcos — confirmar consumos reales con operaciones
- [ ] Migrar benchmarks PETRAL de hardcode a tabla `audit_benchmarks` en Supabase
- [ ] Crear scraper `scrape_voyages.py` para leer Exceles de Voyage Calculations
- [ ] Agregar columna `additional_expenses` a `audit_benchmarks` en Supabase
- [ ] Nueva fila "Gastos Adicionales (Excel)" en tabla de auditoría

## ✅ 8. Completados en Paso 6

- [x] Exponer `bunker_price_date` en `raw_inputs` desde el backend
- [x] Overhead (6H/puerto) migrado a `ports` como `overhead_carga_hrs`, `overhead_descarga_hrs`
- [x] `vessel_id` agregado a `agency_matrix` como 4to campo de llave compuesta
- [x] Columna `date` agregada a `bunker_prices` — actualizada a `2026-06-26`
- [x] Unidades `MT/d` en todos los consumos granulares del card Maestro Flota
- [x] Nombre del barco activo visible en card Maestro Flota
- [x] Layout refactorizado a 4 columnas flex con stacking en cols 2 y 3
- [x] Nombres técnicos entre paréntesis en todos los campos de todos los cards

## ✅ 9. Completados en Paso 7 (Refinamiento UX & Calidad de Datos)

- [x] **Separadores de miles** aplicados a todos los números en "Reemplazo Numérico" (`:,.2f` en `engine.py`)
- [x] **Lógica TBD:** `min_non_zero()` en `engine.py` — el cero significa "dato no disponible", no bloquea el cálculo
- [x] **Limpieza DB:** `contracts.load_rate` y `contracts.discharge_rate` — `9999 → 0` (UPDATE en Supabase)
- [x] **Frontend TBD:** Card "Reglas Comerciales" muestra `TBD` en vez de `0 T/h` para tasas no pactadas
- [x] **Fallbacks `9999→0`** en `forecast_service.py` para límites de terminales portuarios
- [x] **Índices de auditoría** corregidos: `7` al `10` (tras inserción de "Gastos Adicionales" como fila 6)
- [x] **Header eliminado:** Título `🧪 Voyage Ledger Test` retirado para comprimir verticamente
- [x] **Selector de ruta** reubicado a Col 4 (encima del card Límites Portuarios)
- [x] **Unidad `v_intake`** corregida: `T` → `T/h` en card Maestro Flota
- [x] **Fecha bunker** corregida: `datetime.date` → `str(date)` en `forecast_service.py`, ahora llega al frontend como `"2026-06-26"`

## ✅ 10. Completados en Paso 8 (Bug Crítico: Flete $0)

- [x] **Bug `freight_rate = 0`:** `forecast_service.py` usaba columnas eliminadas por migración. Corregido a lookup por `contract_id`
- [x] **`PORT_ALIASES`:** Mapa `"MARCONA" → "SAN_JUAN_DE_MARCONA"` aplicado a rutas, contratos, tarifas, puertos y agencias
- [x] **Consistencia de IDs:** Todos los lookups a BD usan `resolved_dest` en lugar del ID crudo del frontend
- [x] **Fallback legacy:** Si `contract` es `None`, se intenta búsqueda directa por `client_id + destination_port_id` para retrocompatibilidad

## ✅ 11. Completados en Paso 9 (Simplificación Comercial y Posicionamiento)

- [x] **Simplificación de Tasas:** Modificada la lógica para calcular las tasas a partir de la tasa del contrato (`c_load`/`c_disch`), aislando los límites de buque y terminal.
- [x] **Limpieza Visual de UI:** Eliminadas las variables de capacidad física `v_intake`, `v_pump`, `t_load_rate` y `p_disch_limit` del frontend.
- [x] **Renombramiento de Costos:** Se cambiaron las etiquetas "Agencia Origen / Destino" por "Port Cost Origen / Destino".
- [x] **Inyección de Posicionamiento:** Creadas las columnas `positioning_carga_hrs` y `positioning_descarga_hrs` en la tabla `ports` (inicializadas a `1` en Supabase).
- [x] **Nueva Fórmula de Días de Puerto:** Tiempos de posicionamiento integrados en la métrica 3 (`port_days`), rastro de auditoría de backend, y ReportLab tests del PDF Ledger.
- [x] **Fix de Contenido en Impresión:** Sincronizados los 6 cards del HTML de impresión con las variables reales y corregidos los caracteres corruptos de codificación.

## ✅ 12. Completados en Paso 10 (Restauración de agency_matrix y Dimensiones de Flota)

- [x] **Restauración y Conservación de `agency_matrix`:** Re-creada la tabla física `agency_matrix` en Supabase y poblada con sus 38 registros históricos consolidados. El motor (`forecast_service.py`) se configuró para consultarla como fallback secundario si no existen tarifas detalladas en `port_costs_matrix`. **Se prohíbe eliminar esta tabla en el futuro.**
- [x] **Dimensiones Físicas del Buque:** Agregadas las columnas `length` y `beam` a la tabla `vessels` en Supabase y actualizados los valores para toda la flota.
- [x] **Card Maestro Flota de 2 Columnas:** Actualizado el card en React e impresión HTML de `VoyageLedgerTest.tsx` para renderizar `DWT`, `dwcc`, `length` y `beam` en un grid compacto de 2 columnas paralelas.
- [x] **Despliegue a Producción:** Compilados y desplegados los cambios a producción de forma exitosa en el VPS (`forecast.geeksoft.tech`).

## ✅ 13. Completados en Paso 11 (Mejoras 1 & 2 — Sostenibilidad y Renombramiento)

- [x] **Migración Física:** Duplicamos la tabla `agency_matrix` a la nueva tabla física `port_cost_static` para independizar los costos del forecast. El backend (`forecast_service.py`) y endpoints de carga se cambiaron para leer de esta nueva fuente primaria.
- [x] **Disolución de Límites Portuarios:** Desapareció el concepto de "Límites Portuarios". Las variables de horas administrativas y de maniobra se mudaron conceptualmente a "Reglas Comerciales".
- [x] **Nuevas Columnas de Puertos:** Se agregaron y poblaron las nuevas columnas en `ports`:
  * `time_to_count_carga_hrs` / `time_to_count_descarga_hrs` (antiguos overheads)
  * `maneuver_carga_hrs` / `maneuver_descarga_hrs` (antiguos posicionamientos)
- [x] **Actualización Multimódulo:** Se renombraron y probaron estas propiedades en `engine.py`, `forecast_service.py`, `spot_engine.py` (backend), así como en `VoyageLedgerTest.tsx` y `MultiCotizadorExcel.tsx` (frontend).

## ✅ 14. Completados en Paso 12 (Mejora 3 & 3.1 — Comisiones y Convergencia Exceliana)

- [x] **Comisiones de Viaje:** Añadimos `address_commission` (%) y `broker_commission` (%) en la base de datos de Reglas Comerciales, backend (`engine.py`, `spot_engine.py`), y visualizaciones en la grilla y el estimador Excel.
- [x] **Botón Export PDF en Excel:** Se creó un generador de reportes landscape en `MultiCotizadorExcel.tsx` para realizar auditorías visuales cruzadas de forma inmediata.
- [x] **Convergencia del Estimador:** Corregimos el descalce de 0.04 días. Las celdas de posicionamiento, overhead y ritmos de operación en el frontend ahora resuelven dinámicamente sus valores por defecto de la base de datos si quedan vacíos en la grilla (p. ej., `1.0` hora para ILO), logrando concordar con el Ledger tramo por tramo.

