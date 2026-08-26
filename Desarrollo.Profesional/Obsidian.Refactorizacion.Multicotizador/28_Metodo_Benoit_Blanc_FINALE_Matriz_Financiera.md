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
```

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

A continuación se habilita la tabla de casos periciales de control de calidad para auditar la conexión punto a punto:

| Caso ID | Origen de Ruta (`routes_quotes`) | Buque Foto | Buque Simulado | Validación Multicotizador vs Matriz | Estado | Dictamen Forense |
|---|---|---|---|---|:---:|---|
| **CASO-01** | `NEXA.ILO.CALLAO.MATARANI.ILO.FX` (COA Cierres) | `MOQUEGUA` | `MOQUEGUA` (Mismo) | Flete, Bunker, Puertos, PnL y TCE 100% idénticos al Multicotizador | ⏳ PENDIENTE | Verificación de convergencia espejo 1:1. |
| **CASO-02** | `NEXA.ILO.CALLAO.MATARANI.ILO.FX` (COA Cierres) | `MOQUEGUA` | `TABLONES` (Comodín) | Recálculo dinámico de días de mar y bunker de TABLONES; fletes y puertos congelados de NEXA | ⏳ PENDIENTE | Verificación de la Regla de Oro del Buque Comodín. |
| **CASO-03** | `SPCC.TABLONES.CALLAO.CORIO` (Spot Cotizaciones) | `TABLONES` | `TABLONES` (Mismo) | PnL con Arriendo de Nave (`charterHireCost > 0`) reflejado en Matriz | ⏳ PENDIENTE | Verificación del cable C-11 (Arriendo Naves). |
| **CASO-04** | `PRESUPUESTO_ANUAL_2026_NEXA` (Pptos) | `MOQUEGUA` | `MOQUEGUA` (Mismo) | Demurrage modo `'C'` reflejando 0.00 d de estadía en Matriz | ⏳ PENDIENTE | Verificación del cable C-04 (Demurrage Cero). |
| **CASO-05** | Grilla Limpia / Sin Ruta | `NINGUNO` | `CUALQUIERA` | TCE Req, Diferencia y PnL en $0 sin números mágicos $15k | ⏳ PENDIENTE | Verificación del Axioma 4 (Cero Fallbacks). |

---

> 📌 **Próximo Paso Pericial**: Con la rúbrica formalizada, se procederá a auditar los componentes React de la Matriz Financiera (`FinancialMatrixMainContainer.tsx`, `ForecastMatrixTable.tsx`, `ForecastMatrixCard.tsx`, `forecastCalculationEngine.ts`) para verificar y soldar cada cable `C-01` a `C-17`.
