# QC de Auditoría Final (Fishbowl de Cálculos — Motor Spot Engine)

**Objetivo:** Establecer el reporte de auditoría transparente tipo *Fishbowl* que desglose todas las piernas (BALLAST y LADEN) de las rutas del multicotizador, mostrando todas las fórmulas matemáticas con sus valores reales sustituidos y verificando que la suma consolidada coincida al 100% con la Matriz Financiera.

---

## 1. Parámetros de Control (Escenario de Auditoría)
- **Buque:** `MOQUEGUA` (Velocidad: `11.0 nudos`, Consumo Mar IFO: `14.0 t/día`, Consumo Mar MDO: `0.0 t/día`)
- **Precios de Búnker:** IFO = `$895.14 USD/MT`, MDO = `$1,460.30 USD/MT`
- **Factor Clima (Weather Factor):** `3%` (`0.03`)
- **Modo Costos Portuarios:** `static`

---

## 2. Fishbowl de Auditoría — Rutas Complejas (Detalle Pierna por Pierna)

### 🚢 Ruta: `NEXA.ILO.CALLAO.MARCONA.ILO` (Ruta Compleja de 3 Piernas)

#### 🔹 Pierna #1 [BALLAST]: `ILO` ➔ `CALLAO`
- **Tipo:** Posicionamiento en lastre (BALLAST)
- **Distancia Náutica:** `514.0 NM`
- **Días de Mar (`Sea Days`):**
  - **Fórmula:** `(Distancia × (1 + WeatherFactor)) / (Velocidad × 24)`
  - **Sustituido:** `(514 × (1 + 0.03)) / (11.0 × 24) = 2.01 días`
- **Consumo de Búnker IFO:**
  - **Fórmula:** `SeaDays × ConsumoMarIFO`
  - **Sustituido:** `2.01 × 14.0 t/día = 28.08 MT IFO`
- **Costo de Búnker Pierna 1:**
  - **Fórmula:** `(Tons IFO × Precio IFO) + (Tons MDO × Precio MDO)`
  - **Sustituido:** `(28.08 × $895.14) + (0.00 × $1,460.30) = $25,131.33 USD`

#### 🔹 Pierna #2 [LADEN]: `CALLAO` ➔ `MARCONA`
- **Tipo:** Tránsito comercial con carga (LADEN)
- **Carga Transportada:** `13,500 MT` | **Flete Base:** `$25.50 USD/MT` | **Ingreso Bruto:** `$344,250.00 USD`
- **Distancia Náutica:** `254.0 NM`
- **Días de Mar (`Sea Days`):**
  - **Fórmula:** `(Distancia × (1 + WeatherFactor)) / (Velocidad × 24)`
  - **Sustituido:** `(254 × (1 + 0.03)) / (11.0 × 24) = 0.99 días`
- **Días de Puerto (`Port Days`):**
  - **Fórmula:** `((Carga / TasaCarga + OverheadOrigen + PosicionOrigen) + (Carga / TasaDescarga + OverheadDestino + PosicionDestino)) / 24`
  - **Sustituido:** `((13,500 / 500 + 6.0h + 1.0h) + (13,500 / 345 + 6.0h + 0.0h)) / 24 = 3.30 días`
- **Consumo de Búnker IFO:**
  - **Fórmula:** `(SeaDays × ConsumoMar) + (IdleDays × ConsumoIdle) + (LoadDays × ConsumoLoad) + (DischDays × ConsumoDisch)`
  - **Sustituido:** `(0.99 × 14.0) + (0.54 × 2.4) + (1.125 × 2.4) + (1.63 × 3.6) = 23.74 MT IFO`
- **Consumo de Búnker MDO:**
  - **Sustituido:** `(0.99 × 0.0) + (0.54 × 0.0) + (1.125 × 0.5) + (1.63 × 0.5) = 1.38 MT MDO`
- **Costo de Búnker Pierna 2:**
  - **Fórmula:** `(23.74 × $895.14) + (1.38 × $1,460.30) = $23,265.51 USD`
- **Costos Portuarios (Agencia):**
  - **Fórmula:** `AgenciaOrigen + AgenciaDestino`
  - **Sustituido:** `$31,327.99 + $40,000.00 = $71,327.99 USD`

#### 🔹 Pierna #3 [BALLAST]: `MARCONA` ➔ `ILO`
- **Tipo:** Retorno a base en lastre (BALLAST)
- **Distancia Náutica:** `283.0 NM`
- **Días de Mar (`Sea Days`):**
  - **Fórmula:** `(283 × (1 + 0.03)) / (11.0 × 24) = 1.10 días`
- **Consumo de Búnker IFO:** `1.10 × 14.0 t/día = 15.46 MT IFO`
- **Costo de Búnker Pierna 3:** `15.46 × $895.14 = $13,836.90 USD`

---

## 📊 3. Consolidado Global de Auditoría vs Matriz Financiera

| MÉTRICA NÁUTICA / FINANCIERA | CÁLCULO SUMATORIA PIERNAS | VALOR FINAL AUDITADO | COINCIDE CON MATRIZ FINANCIERA |
| :--- | :--- | :--- | :---: |
| **Distancia Náutica Total** | `514.0 + 254.0 + 283.0` | **`1,051.0 NM`** | ✅ OK |
| **Días de Mar Totales (`Sea Days`)** | `2.01 + 0.99 + 1.10` | **`4.10 Días`** | ✅ OK |
| **Días de Puerto Totales (`Port Days`)** | `0.00 + 3.30 + 0.00` | **`3.30 Días`** | ✅ OK |
| **Duración Total del Viaje** | `4.10 + 3.30` | **`7.40 Días`** | ✅ OK |
| **Búnker IFO Consumido** | `28.08 + 23.74 + 15.46` | **`67.28 MT`** | ✅ OK |
| **Búnker MDO Consumido** | `0.00 + 1.38 + 0.00` | **`1.38 MT`** | ✅ OK |
| **Costo Total de Búnker (USD)** | `$25,131.33 + $23,265.51 + $13,836.90` | **`$62,233.73 USD`** | ✅ OK |
| **Costos Portuarios Totales (USD)** | `$31,327.99 + $40,000.00` | **`$71,327.99 USD`** | ✅ OK |
| **Ingreso Bruto de Flete (USD)** | `13,500 MT × $25.50 USD/MT` | **`$344,250.00 USD`** | ✅ OK |
| **PnL Neto del Viaje (USD)** | `$344,250.00 - $71,327.99 - $62,233.73` | **`$210,688.28 USD`** | ✅ OK |
| **TCE Real (USD/Día)** | `$210,688.28 / 7.40 días` | **`$28,480.65 USD/Día`** | ✅ OK |

---

## 🎯 Conclusión del Loop QC
Tanto el motor central `spot_engine.py` como las Vistas en Frontend (Matriz Financiera e Impresión PDF) concuerdan al 100% en todas sus piernas y valores sustituidos.
