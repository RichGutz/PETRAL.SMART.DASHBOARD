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
| 🔴 Rojo | `agency_matrix` | Costos portuarios (llave: Cliente+Puerto+Op+Barco) |
| 🟢 Verde | `contracts` | Reglas comerciales y fletes |

## 🧮 4. Estructura de la Matriz

| Métrica | Fórmula Algorítmica | Tablas |
|---|---|---|
| **1. Tasa Carga** | `MIN(c_load, v_intake, t_load_rate)` | `contracts · vessels · ports` |
| **2. Tasa Descarga** | `MIN(c_disch, v_pump, p_disch_limit)` | `contracts · vessels · ports` |
| **3. Días de Puerto** | `((Q/act_load + over_or) + (Q/act_disch + over_de)) / 24` | Calculado |
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
| **1** | 🔵 Maestro Flota | Barco · v_intake · v_pump · speed · tce_req · IFO/MDO × {Mar, Idle, Carga, Desc} en **MT/d** |
| **2 (top)** | 🟡 Combustible | Fecha Cotización · p_ifo · p_mdo |
| **2 (bot)** | 🔴 Costos Portuarios | Llaves: Cliente+Puerto+Op+Barco · Agencia Origen · Agencia Destino |
| **3 (top)** | 🟣 Maestro Rutas | Origen→Destino · dist · w_laden / w_ballast |
| **3 (bot)** | 🟢 Reglas Comerciales | Q · F · c_load · c_disch |
| **4** | 🟠 Límites Portuarios | t_load_rate · p_disch_limit · over_or · over_de |

## 🔧 6. Arquitectura Backend

- `backend/engine.py` → calcula P&L + emite `audit_trail` (fórmula + valores numéricos)
- `backend/services/forecast_service.py` → pre-carga 6 tablas maestras + pasa `raw_inputs` al frontend
- `VoyageLedgerTest.tsx` → selector barco/ruta · panel 4 cols · tabla de auditoría con Δ

## ⚠️ 7. TODOs Pendientes

- [ ] Valores MDO de los 3 barcos — confirmar consumos reales con operaciones
- [ ] Migrar benchmarks PETRAL de hardcode a tabla `audit_benchmarks` en Supabase

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
