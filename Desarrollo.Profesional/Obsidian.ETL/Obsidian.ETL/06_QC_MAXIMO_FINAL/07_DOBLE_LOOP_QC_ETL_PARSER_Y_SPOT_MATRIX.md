# 🔄 DOBLE LOOP DE AUDITORÍA QC: ETL PARSER RE-SCRAPEO Y SIMULACIÓN SPOT MATRIX MODE

> **Estado**: 🛠️ ESPECIFICACIÓN & PROTOCOLO DE RE-PARSEO EN PROCESO  
> **Ubicación del Módulo ETL**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.ETL\Obsidian.ETL`  
> **Carpeta de QC**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.ETL\Obsidian.ETL\06_QC_MAXIMO_FINAL`  
> **Script de QC Autónomo**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\run_qc_loop_non_plus_ultra.py`  

---

## 1. ⚙️ Propósito del Doble Loop de Auditoría

Tras la auditoría detallada de la flota y el análisis visual en el visor **Auditoría PDF Liquidaciones**, se identificó que los datos históricos almacenados en la tabla `voyage_liquidations` de Supabase DB contenían **imprecisiones heredadas por el primer scrapeo del motor ETL** sobre los Exceles de los operadores navieros.

Por ejemplo, en el **Viaje `v.045` (`B/T TABLONES ILO → MATARANI`)**:
- **Celdas Reales en el Excel del Operador**:
  - `Port Costs`: **`$34,674.67 USD`**
  - `Bunker Costs`: **`$30,913.56 USD`**
  - `Gross Revenue`: **`$241,783.00 USD`**
  - `Utilidad Neta Real (P/L)`: **`$90,121.00 USD`**
- **Error del Primer Scrapeo ETL**:
  - Leyó montos provisionales por defecto (`$18,000.00` y `$42,500.00`) en lugar de extraer las celdas finales de la liquidación del barco.

El **Doble Loop de Auditoría** corrige de raíz esta desviación estableciendo dos bucles interconectados.

---

## 2. 🗺️ Matriz Exacta de Celdas y Coordenadas del Excel Maestro (Single Leg & Multileg 2 PODs)

### A. Plantilla Estándar (Single Leg)
| Concepto Financiero / Operativo | Columna Excel | Fila | Tipo de Dato | Coordenada / Ejemplo (`v.045`) |
| :--- | :---: | :---: | :---: | :---: |
| **Income (Gross Revenue)** | `N` | `14` | USD Float | `$241,783.00 USD` |
| **Port Costs (Gastos de Puerto)** | `N` | **`15`** | USD Float | **`$34,674.67 USD`** |
| **Bunker Costs (Costo Búnker)** | `N` | **`16`** | USD Float | **`$30,913.56 USD`** |
| **Other Costs (Otros Gastos)** | `N` | `17` | USD Float | `$0.00 USD` |
| **Voyage Result (US$)** | `N` | `18` | USD Float | `$176,194.00 USD` |
| **Duration (d) - Días Totales** | `Q` | `14` | Float | `5.74 días` |
| **Sea Days (Días de Mar)** | `Q` | `15` | Float | `2.208 días` |
| **Port/Idle Days (Días de Puerto)** | `Q` | `16` | Float | `3.530 días` |
| **TCE Realizado (US$/d)** | `Q` | `17` | USD Float | `$30,705.00 /día` |
| **TCE Req. (TCE Requerido)** | `Q` | **`18`** | USD Float | **`$15,000.00 /día`** |
| **P/L (Utilidad Neta Real US$)** | `Q` | **`20`** | USD Float | **`$90,121.00 USD`** |

---

### B. Plantilla Multileg con 2 Puertos de Descarga (Ejemplo `V.764 MOQUEGUA`: ILO → CALLAO → MARCONA)
| Concepto Financiero / Operativo | Columna | Fila / Celda | Coordenada / Regla del Parser ETL | Ejemplo `V.764` |
| :--- | :---: | :---: | :--- | :---: |
| **Total Freight Income US$** | `H` | `23` | Celda roja de consolidación de múltiples cargas | **`$403,725.00 USD`** |
| **Income (Gross Revenue)** | `N` | `14` | Resumen superior de ingresos | `$409,725.00 USD` |
| **Total Agency US$ (Gastos Puerto)** | `C` | **`48`** | Suma de agenciamientos (Ilo $16,373 + Callao $10,863 + Marcona $33,146) | **`$60,388.00 USD`** |
| **Bunkers US$ (Consumo Búnker)** | `S` | **`48`** | Suma total de consumo búnker multileg | **`$47,294.00 USD`** |
| **Duration (d) Multileg** | `Q` | `14` | Días totales navegados y de estadía | `7.58 días` |
| **TCE Realizado Multileg** | `Q` | `17` | TCE ejecutado de la expedición multileg | **`$39,836.00 /día`** |
| **TCE Req. (TCE Requerido)** | `Q` | **`18`** | Costo base del buque `MOQUEGUA` | **`$13,000.00 /día`** |
| **P/L (Utilidad Neta Real)** | `Q` | **`20`** | Celda amarilla de Utilidad Neta Real acumulada | **`$203,475.00 USD`** |

---

## 3. 🔁 Diagrama de Flujo del Doble Loop

```
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                                    EXCELES MAESTROS                                    │
  │            Liquidaciones Single Leg & Multileg 2 PODs (Exceles.Petral / Flota)         │
  └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                              │
                                              ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │  🔄 LOOP 1: AUDITORÍA & CORRECCIÓN DEL ETL PARSER / SCRAPER (`Obsidian.ETL`)           │
  │  • Extraer celdas C48 (Puerto Multileg), S48 (Búnker Multileg), N15, N16, Q18 y Q20.   │
  │  • Actualizar la base de datos Supabase `voyage_liquidations` con 100% de fidelidad.    │
  └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                              │
                                              ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │  🔄 LOOP 2: SIMULACIÓN & CONVERGENCIA MULTICOTIZADOR SPOT MATRIX MODE                  │
  │  • Ejecutar `spot_engine.py` para los 31 viajes usando el modelo P×Q dinámico.          │
  │  • Desplegar en la herramienta "Auditoría PDF Liquidaciones" la comparativa side-by-side│
  │    con 0% de descuadres contables y total transparencia.                                │
  └───────────────────────────────────────────┴────────────────────────────────────────────┘
```

---

## 4. 🛡️ Protocolo Operativo del Loop 1 (ETL Re-Parser)

1. **Auditoría de Coordenadas de Celdas (`Obsidian.ETL / 03_Motor_ETL_y_Parser`)**:
   - Para **Single Leg**: Leer `N14:N18` y `Q14:Q20` de la hoja `Results`.
   - Para **Multileg (2 PODs)**: Evaluando si la tabla `Voyage Program` tiene > 2 escalas de descarga, extraer las celdas `C48` (`Total Agency US$`), `S48` (`Bunkers US$`), `H23` (`Total Freight Income`) y `Q20` (`P/L`).
2. **Validación de Ecuación Financiera Multileg**:
   $$\text{P/L (Q20)} = \text{Voyage Result (N18)} - (\text{Duration Q14} \times \text{TCE Req Q18})$$
3. **Re-Sincronización de Supabase DB**:
   - Ejecutar la actualización en `voyage_liquidations` sobre la columna `details` y columnas nativas `gross_revenue_usd`, `net_profit_usd`, `tce_req_usd_day`.
   - **Prohibición de Cadenas Hardcoded**: Queda terminantemente prohibido hardcodear rutas estáticas (ej. `ILO -> ILO -> ILO`). La ruta y las escalas se leen 100% dinámicamente desde `details.itinerary`.

---

## 5. 🛡️ Protocolo Operativo del Loop 2 (Spot Matrix & PDF HTA)

1. **Simulación del Motor Spot Matrix Mode**:
   - Ejecutar `run_qc_loop_non_plus_ultra.py` consumiendo los registros saneados de Supabase.
   - Extraer cada escala de la rotación para evaluar el costo $P \times Q$ real de cada tramo (Carga + Descarga 1 + Descarga 2 si aplica).
2. **Renderizado en la Herramienta "Auditoría PDF Liquidaciones"**:
   - Desplegar viaje por viaje las fichas side-by-side en formato sobrio impreso `A4 Landscape` con fuente de **$15\text{px} - 20\text{px}$** y scroll en pantalla.
   - Desglosar explícitamente en ambos lados (Forecast PxQ y Ejecución Real) las filas independientes por cada escala (Carga, Descarga 1, Descarga 2).
3. **Impresión & Acta de Junta Directiva**:
   - Generación de reportes limpios con los logos corporativos de **PETRAL** (izquierda) y **GEEKSOFT** (derecha).

---

## 6. 🚨 Regla de Oro de Extracción Dinámica y Apertura de Gastos Portuarios

1. **Lectura Dinámica de Itinerarios (`details.itinerary`)**:
   - Los puertos de origen, descarga intermedia y retorno a lastre deben construirse dinámicamente concatenando las escalas de `details.itinerary` con el conector `➔` (ej: `ILO ➔ MEJILLONES ➔ ILO`, `ILO ➔ MEJILLONES TPM ➔ MEJILLONES TERQUIM ➔ ILO`, `CALLAO ➔ MATARANI ➔ ILO`).
2. **Desglose Abierto de Gastos de Puerto**:
   - Tanto el modelo predictivo ($P \times Q$) como el reporte de auditoría real deben mostrar las filas desagregadas por cada puerto:
     - `Costo Puerto Carga (POL)`
     - `Costo Puerto Descarga 1 (POD 1)`
     - `Costo Puerto Descarga 2 (POD 2)` (si aplica)
     - `Total Gastos Portuarios`
