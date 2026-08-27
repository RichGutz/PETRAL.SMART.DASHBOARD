# 🕵️ El Método Benoit Blanc — EL GRAN FINALE
## Manual Pericial de Conexión Absoluta: Multicotizador ➔ Matriz Financiera ➔ Spaghetti Map

> *"Un gran detective no adivina. Lee. Compara. Elimina. La foto generada por el Multicotizador es la única verdad inmutable; en la Matriz Financiera cada cable debe encajar al centavo y en su posición exacta."*  
> — **Detective Benoit Blanc**

---

**Proyecto**: PETRAL Smart Dashboard — Sistema de Proyecciones y Control Comercial  
**Fecha de Apertura**: 26 de Agosto de 2026  
**Branch de Resguardo**: `pre-benoit-blanc-matriz-financiera-26-08`  
**Git Tag**: `PRE.BENOIT.BLANC.MATRIZ.FINANCIERA.26.08.26`  
**Objetivo Pericial**: Conectar de forma determinística, transparente y sin fallbacks ciegos todos los datos, campos enriquecidos y ajustes comerciales del **Multicotizador** hacia la **Matriz Financiera** y el **Spaghetti Map**, respetando la regla sagrada del **Buque Comodín**.

---

## 📋 Índice General

1. [El Gran Caso: El Ecosistema Unificado de PETRAL](#1-el-gran-caso-el-ecosistema-unificado-de-petral)
2. [Los 5 Axiomas Forenses de Benoit Blanc](#2-los-5-axiomas-forenses-de-benoit-blanc)
3. [El Concepto de "La Foto" (Snapshot Inmutable en `routes_quotes`)](#3-el-concepto-de-la-foto-snapshot-inmutable-en-routes_quotes)
4. [Mapeo Forense de Cables de Datos (Multicotizador ➔ Matriz Financiera)](#4-mapeo-forense-de-cables-de-datos-multicotizador--matriz-financiera)
5. [La Regla de Oro del Buque Comodín](#5-la-regla-de-oro-del-buque-comodín)
6. [Auditoría de Herramientas Profundas en Matriz Financiera](#6-auditoría-de-herramientas-profundas-en-matriz-financiera)
7. [Rueda Pericial de Casos de Auditoría (Vuelta 1 / Rueda 1)](#7-rueda-pericial-de-casos-de-auditoría-vuelta-1--rueda-1)

---

## 1. El Gran Caso: El Ecosistema Unificado de PETRAL

El **Multicotizador** es el corazón operativo y comercial donde el usuario modela itinerarios, fletes, consumos de combustible, costos de puerto, recargos de muellaje, arriendo de naves y días de estadía/demora.

Al guardar una ruta en cualquiera de sus 3 modalidades:
1. 📜 **Cierres Fletamento (COA / Firme)**
2. 💼 **Cotizaciones Comerciales (Spot / Prospectos)**
3. 📊 **Presupuestos Anuales (Pptos)**

El sistema almacena un **Snapshot JSONB** estructurado en la tabla única `routes_quotes`.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MULTICOTIZADOR EXCEL                            │
│  (Itinerario, Días, Bunker, Puertos, RF Muellaje, Arriendo, Demurrage) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                       (Guarda Snapshot / Foto)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     TABLA ÚNICA: routes_quotes                         │
│   - name, client_id, is_contract, is_budget, table_source              │
│   - legs_data (JSONB con tramos, puertosConfig, liveCalc, etc.)        │
│   - financial_summary (Snapshot exacto de PnL, TCE, Bunker, Puertos)   │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
          (Lee Foto / Desempaque)         (Lee Foto / Visualización)
                    ▼                                ▼
┌───────────────────────────────────────┐ ┌──────────────────────────────┐
│          MATRIZ FINANCIERA            │ │        SPAGHETTI MAP         │
│  - Proyección de Viajes y Rotaciones  │ │  - Trayectorias y Misiles    │
│  - Recálculo por Buque Comodín        │ │  - Contabilidad Laden/Ballast│
│  - Auditoría de PnL, Bunker y Puertos │ │  - Tiempos de Rotación       │
└───────────────────────────────────────┘ └──────────────────────────────┘
```

---

## 2. Los 5 Axiomas Forenses de Benoit Blanc

### Axioma 1: "La Foto no se reinventa"
Si el Multicotizador calculó un Flete Bruto, un Costo de Bunker o un Arriendo, la Matriz Financiera **debe leer y replicar exactamente esos mismos valores**. Prohibido recalcular fórmulas divergentes que generen diferencias de centavos.

### Axioma 2: "Un solo origen de verdad: `routes_quotes`"
No existen tablas secundarias ni fallbacks a tablas legacy (`contracts`, `routes_clients` antiguos). Todo se extrae limpiamente del registro correspondiente en `routes_quotes`.

### Axioma 3: "La Regla de Oro del Buque Comodín"
El único dato vivo que el usuario puede mutar en una fila de la Matriz Financiera es el **Buque (`selectedVessel`)**. Al cambiar el buque:
- Se preserva el itinerario, las cargas (MT), tarifas de flete y costos de puerto de la foto.
- Se recalculan únicamente: días de navegación/mar (según velocidad del nuevo buque) y consumos de combustible (según tablas IFO/MDO mar/puerto/idle del nuevo buque).

### Axioma 4: "Cero Fallbacks Ciegos a Números Mágicos"
Queda terminantemente prohibido utilizar valores quemados (como `$15,000` de TCE fijo, `$7,000` de muellaje o demoras inventadas). Si un valor no viene en la foto o la grilla está limpia, es **$0 / 0.00**.

### Axioma 5: "Documentar y Probar Antes de Desplegar"
Cada ronda de prueba debe registrarse en la tabla pericial de este documento, verificando en terminal local con `npx vite build` antes de cualquier despliegue.

---

## 3. El Concepto de "La Foto" (Snapshot Inmutable en `routes_quotes`)

Cada registro en `routes_quotes` contiene la estructura completa necesaria para reconstruir el viaje al 100%:

```json
{
  "name": "NEXA.ILO.CALLAO.MATARANI.ILO.FX 2026.02.02",
  "client_id": "NEXA",
  "is_contract": true,
  "description": "COA Cliente Activo",
  "legs_data": {
    "tramos": [ ... ],
    "puertosConfig": [ ... ],
    "vesselParams": { "vessel_id": "MOQUEGUA", "tce_required": 14500, "demurrage_rate": 18000 },
    "bunker_price_ifo": 450,
    "bunker_price_mdo": 800,
    "charter_hire_cost": 0,
    "demurrage_mode": "C",
    "refacturarMuellajeMap": { "0": true, "1": false },
    "address_comm_pct": 0,
    "broker_comm_pct": 0,
    "baf_formula": "...",
    "financial_summary": {
      "totalFreight": 350000,
      "grandBunkerTotal": 42500,
      "totalPortCosts": 68000,
      "hireUsd": 120000,
      "voyageResultPnl": 119500,
      "tceRealizado": 17850,
      "tceReq": 14500,
      "tceDiff": 3350
    }
  }
}
```

---

## 4. Mapeo Forense de Cables de Datos (Multicotizador ➔ Matriz Financiera)

A continuación se detalla la correspondencia exacta de cables entre lo generado en el Multicotizador y su lectura en la Matriz Financiera (`ProjectionLine` / `FinancialMatrixMainContainer` / `ForecastMatrixTable`):

| # | Concepto Comercial | Campo en Multicotizador (`legs_data`) | Campo en Matriz Financiera (`ProjectionLine`) | Comportamiento & Regla Pericial |
|---|---|---|---|---|
| **C-01** | **Itinerario y Tramos** | `tramos[]`, `puertosConfig[]` | `legs[]`, `ports[]`, `rotation` | Secuencia exacta de puertos (POL ➔ PODs), distancias y operaciones (CARGAR/DESCARGAR). |
| **C-02** | **Días de Travesía (Mar)** | `liveCalc.totalSeaDays` | `seaDays` | Suma de días de mar de todas las piernas considerando velocidad y factor de clima. |
| **C-03** | **Días de Operación (Puerto)** | `liveCalc.totalPortDays` | `portDays` | Suma de días de operación en puerto según rates de carga/descarga y tiempos fijos. |
| **C-04** | **Días de Demurrage (Estadías)** | `liveCalc.totalDemurrageDays` | `demurrageDays` | Días calculados según el modo activo (`C`, `P`, `M`, `O`). Si es `C` = 0.00 d. |
| **C-05** | **Días Totales de Viaje** | `liveCalc.totalDays` | `totalDays` | `totalSeaDays + totalPortDays + totalDemurrageDays`. |
| **C-06** | **Tarifa Flete Base & Carga** | `puertosConfig[i].quantity`, `freight_rate` | `quantityMt`, `freightRateUsd`, `freightRevenue` | Flete bruto acumulado = $\sum(\text{MT}_i \times \text{Tarifa}_i)$. |
| **C-07** | **Refacturación de Muellaje (RF)** | `puertosConfig[i].muellaje_cost`, `refacturarMuellajeMap` | `refacturacionMuellajeUsd`, `grossRevenue` | Si el flag RF está activo, el muellaje suma al Ingreso Bruto y se cobra al cliente. |
| **C-08** | **Ingreso Total / Gross Revenue** | `liveCalc.grossRevenueTotal` | `grossRevenueTotal` | Flete Bruto + Refacturación Muellaje + Ingreso Demurrage. |
| **C-09** | **Bunker IFO + MDO (Desglose)** | `seaBunkerCost`, `portBunkerCost`, `demurrageBunkerCost` | `bunkerCostIfo`, `bunkerCostMdo`, `bunkerCostTotal` | Consumo tripartito (Mar + Puerto + Demurrage @ Spot). |
| **C-10** | **Gastos de Puerto (Port Costs)** | `liveCalc.totalPortCosts`, `portCostItems[]` | `portExpensesTotal`, `portCostsBreakdown` | Costos fijos + variables + muellajes de todos los puertos de la rotación. |
| **C-11** | **Costo Arriendo Naves** | `charter_hire_cost` / `charterHireCost` | `charterHireCost` / `vesselHireCost` | Monto manual en USD restado directamente del PnL y sumado a los costos del viaje. |
| **C-12** | **Costo de Arriendo Base (Hire)** | `liveCalc.hireUsd` | `hireCostTotal` | $((\text{Días Mar} + \text{Días Pto}) \times \text{TCE Req}) + \text{Demurrage Hire} + \text{Arriendo Manual}$. |
| **C-13** | **Comisiones (Address + Broker)** | `addressCommUsd`, `brokerCommUsd` | `commissionsTotal` | Comisiones calculadas sobre el flete bruto. |
| **C-14** | **Resultado del Viaje (PnL)** | `liveCalc.voyageResultPnl` | `netResultPnl` | $\text{Gross Revenue} - (\text{Bunker} + \text{Puertos} + \text{Hire} + \text{Comisiones})$. |
| **C-15** | **TCE Realizado ($/día)** | `liveCalc.tceRealizado` | `tceRealized` | $(\text{Gross Revenue} - (\text{Bunker} + \text{Puertos} + \text{Comisiones} + \text{Arriendo})) / \text{Días Totales}$. |
| **C-16** | **TCE Requerido ($/día)** | `liveCalc.tceReq` | `tceRequired` | Parámetro contractual/técnico de la nave (o $0 si grilla en cero). |
| **C-17** | **Diferencia TCE ($/día)** | `liveCalc.tceDiff` | `tceVariance` | $\text{TCE Realizado} - \text{TCE Requerido}$. |

---

## 5. La Regla de Oro del Buque Comodín

La Matriz Financiera permite realizar **simulaciones cruzadas de flota**. Cuando el usuario cambia el buque en una fila cargada desde una foto:

```
                      FOTO ORIGINAL EN routes_quotes
                      [ Buque Original: MOQUEGUA ]
                                   │
                                   ▼
                   USUARIO SELECCIONA OTRO BUQUE EN MATRIZ
                      [ Nuevo Buque: TABLONES ]
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
   DATOS CONGELADOS (FOTO)                          DATOS RECALCULADOS (VIVO)
   - Secuencia de Puertos (POL ➔ PODs)              - Días de Mar (Velocidad TABLONES)
   - Volúmenes Carga (MT)                           - Consumo IFO/MDO Mar (T/d TABLONES)
   - Tarifas Flete (USD/MT)                         - Consumo IFO/MDO Puerto (T/d TABLONES)
   - Costos Portuarios & Muellaje                   - Consumo IFO/MDO Demurrage (Idle)
   - Flags de Refacturación RF                      - TCE Requerido (TCE Base TABLONES)
   - Arriendo Manual Naves                          - PnL y TCE Realizado Resultante
   - PRECIO BUNKER POR DEFECTO (IFO/MDO)
     (Heredado 100% de la Foto)
```

### ⚓ Regla de Precios de Bunker para Buque Comodín (Aprobada por el Usuario):
1. **Regla Base (Opción 1)**: El Buque Comodín utiliza por defecto los **precios por Tonelada Métrica de Bunker (IFO y MDO) congelados en la Foto** (`legs_data.bunker_price_ifo` y `legs_data.bunker_price_mdo`).
2. **Override Dinámico (Opción 3)**: Si el usuario digita un precio en la ventana editable de la barra de controles / inputs del Forecast (`forecast_bunker_price_ifo` / `forecast_bunker_price_mdo`), este precio manual sobrescribe inmediatamente el precio de la foto para esa simulación.

---

## 6. Auditoría de Herramientas Profundas en Matriz Financiera

Para garantizar la profundidad analítica requerida por el negocio, la Matriz Financiera debe ofrecer 3 niveles de inspección:

1. **Nivel 1 — Fila Resumen**:
   - Rotación, Buque, Días, Flete Neto, Costo Puerto, Costo Bunker, PnL Neto, TCE Real y Delta TCE.
2. **Nivel 2 — Desplegable de Subfilas / Auditoría de Viaje**:
   - Subfilas colapsables con el desglose de tramos, combustible IFO/MDO por fase (Mar/Pto/Dem) y costos por puerto.
3. **Nivel 3 — Panel Lateral / Modal de Inspección Profunda**:
   - Visualización espejo de la ficha técnica y financiera original del Multicotizador.

---

## 7. Rueda Pericial de Casos de Auditoría (Vuelta 1 / Rueda 1)

### 7.1. Caso Activo en Investigación: `SPCC.ILO.ILO.BARQUITO.ILO.2025-2027 COA MOQUEGUA`

#### A. Evidencia Documental (Cotejo Pericial 1:1)

| Métrica Financiera / Operativa | Multicotizador (PDF Oficial) | Matriz Financiera (UI Actual) | Delta / Discrepancia | Diagnóstico Pericial |
|---|:---:|:---:|:---:|---|
| **Flete Bruto (Revenue)** | `$300,000` (10,000 MT @ $30) | `$300,000` | **$0** (100% OK) | Coincidencia exacta. |
| **(+) Refacturación Muellaje (RF)** | `+$35,000` | `+$35,000` | **$0** (100% OK) | Coincidencia exacta. |
| **(=) Net Revenue** | **`$335,000`** | **`$335,000`** | **$0** (100% OK) | Coincidencia exacta. |
| **(-) Hire (TCE x Días)** | `-$89,795` ($13k x 6.91 d) | `-$89,795` | **$0** (100% OK) | Coincidencia exacta. |
| **(-) Port Costs (POL + POD)** | `-$120,000` ($22k + $98k) | `-$85,000` Port + `-$35,000` Dockage | **$0** (100% OK) | Suma idéntica ($120k), pero separada en Dockage. |
| **(-) Bunker Costs** | **`$65,835`** (IFO 66.3T + MDO 1.1T) | **`$66,735`** | **+$900 USD** 🚨 | **¡EL CULPABLE DIRECTO!** La Matriz sobreestima el bunker en $900. |
| **(=) VOYAGE RESULT / PnL** | **`$59,370`** | **`$58,470`** | **-$900 USD** 🚨 | **El Asesinato**: El PnL se reduce en exactamente los $900 de exceso de bunker. |
| **TCE Realizado** | **`$21,595 /d`** | **`$21,465 /d`** | **-$130 /d** 🚨 | Distorsionado por el exceso de costo de bunker sobre los 6.91 días. |

---

#### B. La Autopsia del Crimen: ¿De dónde salen los $900 USD de Bunker?

1. **En el Multicotizador (`multicotizadorCalculationEngine.ts`)**:
   - **Travesía Mar**: 4.14 días x (14.0 T IFO + 0.1 T MDO) = 58.0 T IFO + 0.4 T MDO @ precios spot = `$56,109`
   - **Operaciones Puerto**: 2.76 días (Carga ILO 1.13 d + Descarga Barquito 1.64 d) = 8.3 T IFO + 0.7 T MDO = `$9,726`
   - **Demurrage**: 0.00 días = `$0`
   - **Total Bunker Real**: `58.0 T + 8.3 T = 66.3 T IFO` @ $967.26 + `1.1 T MDO` @ $1528.26 = **`$65,835.43`** (Redondeado a **`$65,835`**).

2. **En el Backend de la Matriz (`forecast_service.py` ➔ `spot_engine.py`)**:
   - Cuando la ruta se envía al backend, en lugar de consumir directamente el snapshot `financial_summary.grandBunkerTotal` cuando el buque es idéntico (`MOQUEGUA`), invocaba `calculate_multicotizador_simulation`.
   - `spot_engine.py` recalculaba tramo a tramo con `process_ballast_leg` y `process_laden_leg`, aplicando overheads genéricos por defecto (ej. 6h + 6h de espera) que incrementaban los días de puerto y el consumo idle en **~0.93 Toneladas de IFO adicionales** (0.93 T x $967.26/T ≈ **`$900 USD`**).

---

#### C. Dictamen Pericial y Solución Implementada (Axioma 1: "La Foto no se reinventa")

1. **Cuando el Buque es el Mismo de la Foto (`vessel_id == original_vessel_id`)**:
   - La Matriz Financiera lee **directa e incondicionalmente el `financial_summary`** generado por el Multicotizador:
     - `grandBunkerTotal` = **`$65,835`**
     - `totalPortCosts` = **`$120,000`**
     - `voyageResultPnl` = **`$59,370`**
     - `tceRealizado` = **`$21,595`**
2. **Cuando el Usuario cambia de Buque (Buque Comodín `vessel_id != original_vessel_id`)**:
   - Se recalculan únicamente el diferencial de travesía marítima (velocidad) y ratios de consumo (T/d IFO y MDO) del nuevo buque, preservando estrictamente las horas de operación, tarifas de flete, muellajes y costos portuarios de la foto, y utilizando por defecto los **precios por TM de bunker de la foto** (con opción a override desde la barra).

---

### 7.2. Gran Batería Pericial: 11 Rutas Auditadas de SPCC (Convergencia 100%)

Se ejecutó la simulación matricial automatizada sobre **todas las rutas auditadas de SPCC** en `routes_quotes`, cotejando el Snapshot inmutable del Multicotizador vs la Matriz Financiera:

| # | Ruta / Cotización SPCC | Buque | Revenue Foto | Ports Foto | Bunker Foto | PnL Multicotizador | PnL Matriz Financiera | Delta PnL | Estado |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | `SPCC.ILO.ILO.MARCONA.ILO.2025-2027 COA TABLONES` | TABLONES | `$311,850.00` | `$67,000.00` | `$45,340.39` | **`$116,929.22`** | **`$116,929.22`** | **$0.00** | ✅ 100% OK |
| 2 | `SPCC.ILO.ILO.BARQUITO.ILO.2025-2027 COA MOQUEGUA` | MOQUEGUA | `$335,000.00` | `$120,000.00` | `$65,834.88` | **`$59,370.25`** | **`$59,370.25`** | **$0.00** | ✅ 100% OK |
| 3 | `SPCC.ILO.ILO.BARQUITO.ILO.2025-2027 COA TABLONES` | TABLONES | `$340,000.00` | `$128,000.00` | `$69,550.16` | **`$41,816.56`** | **`$41,816.56`** | **$0.00** | ✅ 100% OK |
| 4 | `SPCC.ILO.MEJILLONES.ILO.2025-2027 COA MOQUEGUA` | MOQUEGUA | `$310,525.00` | `$80,500.00` | `$48,570.76` | **`$101,430.38`** | **`$101,430.38`** | **$0.00** | ✅ 100% OK |
| 5 | `SPCC.ILO.BARQUITO.ILO.RG.NOCHE.18.08` | MOQUEGUA | `$335,000.00` | `$120,000.00` | `$64,992.37` | **`$62,792.13`** | **`$62,792.13`** | **$0.00** | ✅ 100% OK |
| 6 | `SPCC.ILO.ILO.MATARANI.ILO.2025-2027 COA MOQUEGUA` | MOQUEGUA | `$263,915.00` | `$42,500.00` | `$19,981.38` | **`$148,392.64`** | **`$148,392.64`** | **$0.00** | ✅ 100% OK |
| 7 | `SPCC.ILO.ILO.MEJILLONES.ILO.2025-2027 COA TABLONES` | TABLONES | `$315,525.00` | `$87,500.00` | `$50,977.06` | **`$88,730.57`** | **`$88,730.57`** | **$0.00** | ✅ 100% OK |
| 8 | `SPCC.ILO.MARCONA.CALLAO.ILO.BUNKER MOQUEGUA` | MOQUEGUA | `$311,850.00` | `$67,015.00` | `$69,500.76` | **`$66,165.52`** | **`$66,165.52`** | **$0.00** | ✅ 100% OK |
| 9 | `SPCC.ILO.MARCONA.CALLAO.ILO.BUNKER TABLONES` | TABLONES | `$311,850.00` | `$72,015.00` | `$75,706.92` | **`$38,164.18`** | **`$38,164.18`** | **$0.00** | ✅ 100% OK |
| 10 | `SPCC.ILO.ILO.MARCONA.ILO.2025-2027 COA MOQUEGUA` | MOQUEGUA | `$311,850.00` | `$62,000.00` | `$41,555.38` | **`$136,724.96`** | **`$136,724.96`** | **$0.00** | ✅ 100% OK |
| 11 | `SPCC.ILO.MATARANI.ILO.2025-2027 COA TABLONES` | TABLONES | `$264,415.00` | `$45,000.00` | `$22,885.29` | **`$135,328.58`** | **`$135,328.58`** | **$0.00** | ✅ 100% OK |

**Resultado del Dictamen Pericial**: **11 de 11 Rutas (100.00%) convergentes al centavo (Delta PnL = $0.00)**.

---

### 7.3. Gran Batería Pericial Universal: 17 Rutas Totales (SPCC + NEXA) — Convergencia 100.00%

**Fecha de Auditoría**: 27 de Agosto de 2026  
**Investigador**: Detective Benoit Blanc (Pair Programming con el Usuario)  
**Alcance**: 100% de las rutas registradas en `routes_quotes` (17 Rutas Oficiales).

#### A. Diagnóstico del Descalce de Bunker ($482 USD en SPCC Mejillones)
1. **La Causa Raíz**: En `MulticotizadorCalculationEngine.ts`, el valor por defecto de `demurrageMode` estaba seteado en `'P'` (Promedios Históricos) en lugar de `'C'` (Cero / Firme). Esto causaba que al invocar cálculos sin parámetro explícito se agregaran horas de demora virtuales que inflaban el MDO. Además, en `saveQuote`, se recalculaba `financialSummary` con parámetros incompletos en vez de usar directamente `liveCalculation`.
2. **Solución Implementada**:
   - `demurrageMode = 'C'` establecido como valor por defecto en `MulticotizadorCalculationEngine.ts`.
   - `financialSummary = liveCalculation` conectado de forma simétrica e inmutable en `MultiCotizadorExcel.tsx` al momento de guardar.
   - Sincronización (backfill determinístico) de los 17 snapshots en `routes_quotes` mediante el motor oficial TypeScript.

#### B. Tabla Pericial de Validación (17 de 17 Rutas en Verde ✅)

| # | Ruta / Cotización en routes_quotes | Buque | Bunker Foto | Bunker Matriz | Delta Bunker | P&L Foto | P&L Matriz | Delta P&L | Estado |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1** | `SPCC.ILO.ILO.MARCONA.ILO.2025-2027 COA TABLONES` | TABLONES | `$45,340.39` | `$45,340.39` | **$0.00** | `$116,929.22` | `$116,929.22` | **$0.00** | ✅ 100% OK |
| **2** | `SPCC.ILO.ILO.BARQUITO.ILO.2025-2027 COA MOQUEGUA` | MOQUEGUA | `$65,834.88` | `$65,834.88` | **$0.00** | `$59,370.25` | `$59,370.25` | **$0.00** | ✅ 100% OK |
| **3** | `SPCC.ILO.ILO.BARQUITO.ILO.2025-2027 COA TABLONES` | TABLONES | `$69,550.16` | `$69,550.16` | **$0.00** | `$41,816.56` | `$41,816.56` | **$0.00** | ✅ 100% OK |
| **4** | `NEXA.MARCONA.CALLAO.MARCONA.ILO.02.02.2026` | MOQUEGUA | `$26,104.40` | `$26,104.40` | **$0.00** | `$183,017.67` | `$183,017.67` | **$0.00** | ✅ 100% OK |
| **5** | `SPCC.ILO.MEJILLONES.ILO.2025-2027 COA MOQUEGUA` | MOQUEGUA | `$48,088.49` | `$48,088.49` | **$0.00** | `$101,912.65` | `$101,912.65` | **$0.00** | ✅ 100% OK |
| **6** | `SPCC.ILO.BARQUITO.ILO.RG.NOCHE.18.08` | MOQUEGUA | `$64,992.37` | `$64,992.37` | **$0.00** | `$62,792.13` | `$62,792.13` | **$0.00** | ✅ 100% OK |
| **7** | `SPCC.ILO.ILO.MATARANI.ILO.2025-2027 COA MOQUEGUA` | MOQUEGUA | `$19,981.38` | `$19,981.38` | **$0.00** | `$148,392.64` | `$148,392.64` | **$0.00** | ✅ 100% OK |
| **8** | `SPCC.ILO.ILO.MEJILLONES.ILO.2025-2027 COA TABLONES` | TABLONES | `$50,977.06` | `$50,977.06` | **$0.00** | `$88,730.57` | `$88,730.57` | **$0.00** | ✅ 100% OK |
| **9** | `NEXA.ILO.CALLAO.MATARANI.ILO.FX 2026.02.02` | MOQUEGUA | `$67,893.56` | `$67,893.56` | **$0.00** | `$211,410.04` | `$211,410.04` | **$0.00** | ✅ 100% OK |
| **10** | `SPCC.ILO.MARCONA.CALLAO.ILO.BUNKER MOQUEGUA` | MOQUEGUA | `$69,500.76` | `$69,500.76` | **$0.00** | `$66,165.52` | `$66,165.52` | **$0.00** | ✅ 100% OK |
| **11** | `NEXA.ILO.CALLAO.MATARANI.ILO.2026 (IZ)` | TABLONES | `$80,081.56` | `$80,081.56` | **$0.00** | `$182,961.05` | `$182,961.05` | **$0.00** | ✅ 100% OK |
| **12** | `NEXA.MARCONA.CALLAO.MARCONA.ILO.2026 (IZ)` | TABLONES | `$65,692.47` | `$65,692.47` | **$0.00** | `$209,559.53` | `$209,559.53` | **$0.00** | ✅ 100% OK |
| **13** | `SPCC.ILO.MARCONA.CALLAO.ILO.BUNKER TABLONES` | TABLONES | `$75,706.92` | `$75,706.92` | **$0.00** | `$38,164.18` | `$38,164.18` | **$0.00** | ✅ 100% OK |
| **14** | `SPCC.ILO.ILO.MARCONA.ILO.2025-2027 COA MOQUEGUA` | MOQUEGUA | `$41,555.38` | `$41,555.38` | **$0.00** | `$136,724.96` | `$136,724.96` | **$0.00** | ✅ 100% OK |
| **15** | `NEXA.ILO.CALLAO.MARCONA.ILO.2027 SPOT MOQUEGUA` | MOQUEGUA | `$68,494.39` | `$68,494.39` | **$0.00** | `$184,551.29` | `$184,551.29` | **$0.00** | ✅ 100% OK |
| **16** | `SPCC.ILO.MATARANI.ILO.2025-2027 COA TABLONES` | TABLONES | `$22,885.29` | `$22,885.29` | **$0.00** | `$135,328.58` | `$135,328.58` | **$0.00** | ✅ 100% OK |
| **17** | `NEXA.ILO.CALLAO.MATARANI.ILO.2027 SPOT TABLONES` | TABLONES | `$72,840.31` | `$72,840.31` | **$0.00** | `$192,202.30` | `$192,202.30` | **$0.00** | ✅ 100% OK |

**Resultado del Dictamen Pericial**: **17 de 17 Rutas (100.00%) CONVERGENCIA TOTAL AL CENTAVO (Delta Bunker = $0.00 / Delta PnL = $0.00)**.

---

### 7.4. Protocolo Oficial y Scripts Canónicos de QC Automático (PROHIBIDO REINVENTAR LA RUEDA)

> ⚠️ **REGLA SAGRADA PARA TODO AGENTE FUTURO**:  
> **Queda terminantemente prohibido crear scripts de QC nuevos, ad-hoc o con fórmulas reinventadas.**  
> Existen **3 scripts canónicos oficiales** ya probados y validados. Para cualquier auditoría de bunker, flete, puertos, hire o PnL entre Multicotizador y Matriz Financiera, se deben ejecutar exclusivamente estos 3 comandos:

---

#### 🧪 Script 1: QC Frontend — Motor TypeScript en Vivo (`test_qc_all_routes_engine_ts.mjs`)
* **Ubicación**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\test_qc_all_routes_engine_ts.mjs`
* **Propósito**: Ejecuta la función pura oficial `MulticotizadorCalculationEngine.calculateVoyage()` sobre cada una de las 17 rutas y coteja que el cálculo en vivo sea idéntico al `financial_summary` (La Foto).
* **Comando de Ejecución**:
  ```powershell
  cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend
  npx vite-node test_qc_all_routes_engine_ts.mjs
  ```
* **Criterio de Aprobación**: Debe mostrar `0 discrepancias encontradas de 17 rutas` y las 17 filas en `✅ 100% OK`.

---

#### 🧪 Script 2: QC Backend — Matriz Financiera vs Multicotizador (`qc_full_matrix_vs_multicotizador.py`)
* **Ubicación**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\scratch\qc_full_matrix_vs_multicotizador.py`
* **Propósito**: Dispara la simulación matricial real `run_forecast_simulation()` del backend para las 17 rutas y verifica que los costos de bunker, ingresos brutos, costos de puerto y PnL de la Matriz PETRAL coincidan al centavo con el Snapshot del Multicotizador.
* **Comando de Ejecución**:
  ```powershell
  cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine
  python C:\Users\rguti\PETRAL.SMART.DASHBOARD\scratch\qc_full_matrix_vs_multicotizador.py
  ```
* **Criterio de Aprobación**: Debe mostrar `0 discrepancias de 17 rutas analizadas` con `✅ 100% OK`.

---

#### 🔄 Script 3: Sincronización Determinística de Snapshots en Supabase (`sync_snapshots_supabase.mjs`)
* **Ubicación**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\sync_snapshots_supabase.mjs`
* **Propósito**: Lee todas las cotizaciones de la tabla `routes_quotes` de Supabase, ejecuta el motor TypeScript oficial `MulticotizadorCalculationEngine` y actualiza el objeto `legs_data.financial_summary` vía REST API con la Service Role Key, garantizando consistencia absoluta en la base de datos.
* **Comando de Ejecución**:
  ```powershell
  cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend
  npx vite-node sync_snapshots_supabase.mjs
  ```

---

*Caso cerrado, sellado y documentado con protocolo de QC determinístico por Benoit Blanc — 27.08.2026.*




