# Ledger: Implementación DEFINITIVA
## VoyageLedgerFinal.tsx — Contrato de Datos entre Backend y Frontend

> **PROPÓSITO:** Este documento es la única fuente de verdad para cualquier agente o desarrollador que modifique el componente `VoyageLedgerFinal.tsx`. Antes de tocar una sola línea de código, lee esto completo. Sin excepción.

---

## 1. ARQUITECTURA DE DATOS — LO QUE DEVUELVE EL BACKEND

### 1.1 Endpoint
```
POST /forecast/multicotizador
```
Función Python: `calculate_multicotizador_simulation()` en `spot_engine.py`

### 1.2 Estructura EXACTA de la respuesta JSON

```json
{
  "tramos": [ ... ],      // Array de piernas procesadas (ver 1.3)
  "consolidated": { ... } // Totales del viaje (ver 1.4)
}
```

### 1.3 Campos de cada tramo (`runResult.tramos[i]`)

| Campo | Tipo | Descripción |
|---|---|---|
| `origin_port_id` | string | Puerto de origen de la pierna |
| `destination_port_id` | string | Puerto de destino de la pierna |
| `type` | "BALLAST" / "LADEN" | Tipo de pierna |
| `distance` | number | **Distancia en NM de esta pierna** ← NUNCA viene de `legsConfig` |
| `sea_days` | number | Días de navegación de esta pierna |
| `port_days` | number | Días de puerto de esta pierna |
| `net_income` | number | Ingreso bruto (Q × F). Es 0 en piernas BALLAST |
| `bunker_costs` | number | Costo total de combustible de esta pierna |
| `port_costs` | number | Costo de agencia de esta pierna |
| `pnl_tramo` | number | P&L de esta pierna |
| `bunker_ifo` | number | Toneladas IFO consumidas |
| `bunker_mdo` | number | Toneladas MDO consumidas |
| `contract_agreed_load_rate` | number | Ritmo de carga contractual (T/h) |
| `contract_agreed_discharge_rate` | number | Ritmo de descarga contractual (T/h) |
| `agency_costs_origin` | number | Costo agencia en puerto de origen |
| `agency_costs_destination` | number | Costo agencia en puerto de destino |
| `agency_costs_origin_details` | object | `{ breakdown: { [concepto]: valor } }` |
| `agency_costs_destination_details` | object | `{ breakdown: { [concepto]: valor } }` |
| `audit_trail` | object | Fórmulas y reemplazos numéricos (ver 1.5) |

### 1.4 Campos del consolidado (`runResult.consolidated`)

> CRITICO: Los nombres exactos son los siguientes. Usar cualquier otro nombre = valor undefined = cero en pantalla.

| Campo del Backend | Tipo | Lo que representa |
|---|---|---|
| `total_distance` | number | Suma de distancias de todas las piernas |
| `total_sea_days` | number | Suma de días de mar |
| `total_port_days` | number | Suma de días de puerto |
| `total_days` | number | sea_days + port_days = días totales del viaje |
| `total_bunker_costs` | number | Costo total de combustible |
| `total_port_costs` | number | Costo total de agencia portuaria |
| `total_freight_revenue` | number | Ingreso total bruto (Σ Q×F) |
| `pnl_net_utility` | number | **Voyage Result** = freight_revenue - bunker - port_costs |
| `tce_real` | number | **TCE Diario** = pnl_net_utility / total_days |
| `tce_required` | number | TCE requerido por el buque (referencia) |
| `bunker_ifo_tonnage` | number | Total toneladas IFO consumidas |
| `bunker_mdo_tonnage` | number | Total toneladas MDO consumidas |

> NO EXISTEN EN EL BACKEND: `cons.net_utility`, `cons.tce`, `cons.voyage_result`
> Usarlos causara undefined → $0 en pantalla.

### 1.5 Estructura del `audit_trail` por tramo

```
tramos[i].audit_trail = {
  "sea_days":     { "formula": "...", "values": "..." },
  "port_days":    { "formula": "...", "values": "..." },
  "bunker_costs": { "formula": "...", "values": "..." },
  "port_costs":   { "formula": "...", "values": "..." }
}
```

---

## 2. MAPPING FRONTEND → BACKEND (Las 12 Métricas de la Tabla)

> Regla: La columna GEEKSOFT (Motor) SIEMPRE usa el campo exacto del backend. No recalcular en frontend.

| # | Métrica | mockedScenario field | Fuente backend | Tipo |
|---|---|---|---|---|
| 1 | Ritmo Carga (MT/hr) | `actual_load_rate` | avg(tramos[LADEN].contract_agreed_load_rate) | número |
| 2 | Ritmo Desc. (MT/hr) | `actual_discharge_rate` | avg(tramos[LADEN].contract_agreed_discharge_rate) | número |
| 3 | Días de Puerto | `port_days_unit` | `consolidated.total_port_days` | número |
| 4 | Días de Mar | `sea_days_unit` | `consolidated.total_sea_days` | número |
| 5 | Días de Viaje | `total_duration_unit` | `consolidated.total_days` | número |
| 6 | Income | `net_income` | `consolidated.total_freight_revenue` | moneda |
| 7 | Comisiones | `total_commissions` | freight_revenue × (addr% + broker%) / 100 | moneda |
| 8 | Costo Bunker | `total_bunker_costs_unit` | `consolidated.total_bunker_costs` | moneda |
| 9 | Port Costs | `total_port_costs` | `consolidated.total_port_costs` | moneda |
| 10 | Voyage Result | `voyage_result` | `consolidated.pnl_net_utility` ← nombre exacto | moneda |
| 11 | TCE Diario | `tce_real_unit` | `consolidated.tce_real` ← nombre exacto | moneda |
| 12 | P/L vs Req | `pl_vs_required_unit` | pnl_net_utility - (tce_required × total_days) | moneda |

---

## 3. FÓRMULAS MATEMÁTICAS

```
1. Ritmo Carga    = min(contract_load_rate, vessel_intake, terminal_load_rate)
2. Ritmo Desc     = min(contract_disch_rate, vessel_pump_rate, terminal_disch_limit)
3. port_days      = ((Q/act_load + over_or + pos_or + delay_load) + (Q/act_disch + over_de + pos_de + delay_disch)) / 24
4. sea_days       = Σ (dist_i × (1 + w_factor_i)) / (speed × 24)   [suma por pierna]
5. total_days     = sea_days + port_days
6. income         = Σ (Q_i × F_i)   [solo piernas LADEN]
7. commissions    = income × (addr_comm% + broker_comm%) / 100
8. bunker_costs   = (IFO_tons × p_ifo) + (MDO_tons × p_mdo)
   IFO_tons = (sea_d × c_sea) + (idle_d × c_idle) + (load_d × c_load) + (disch_d × c_disch)
9. port_costs     = Σ (agency_origin + agency_dest) [solo puertos con operación real]
10. voyage_result = income - commissions - bunker_costs - port_costs
11. tce_real      = voyage_result / total_days
12. pl_vs_req     = voyage_result - (tce_required × total_days)
```

---

## 4. TARJETAS SUPERIORES (Cards) — Qué campo va en cada una

### Card 1: MAESTRO RUTAS (Azul)
```
Origen → Destino:    tramos[0].origin_port_id → tramos[last].destination_port_id
Pierna N (tipo):     tramos[i].origin_port_id → tramos[i].destination_port_id : tramos[i].distance NM
                     LA DISTANCIA VIENE DE tramos[i].distance NO de legsConfig
Dist. TOTAL VIAJE:   consolidated.total_distance
W Fct (Laden):       tramos[0].weather_factor_laden × 100 %
W Fct (Ballast):     tramos[0].weather_factor_ballast × 100 %
```

### Card 2: MAESTRO FLOTA (Verde)
```
Buque:          vessel.vessel_name
TCE Requerido:  vessel.tce_required
Velocidad:      vessel.vessel_speed Kts
DWT:            vessel.dwt
IFO Mar:        vessel.consumption_sea_ifo T/d
MDO Mar:        vessel.consumption_sea_mdo T/d
IFO Idle:       vessel.consumption_idle_ifo
MDO Idle:       vessel.consumption_idle_mdo
IFO Carga:      vessel.consumption_load_ifo
IFO Desc:       vessel.consumption_disch_ifo
```

### Card 3: CONTRATOS (Morado)
```
Cantidad (Q):    Σ legsConfig.filter(action==='CARGAR').quantity  ← suma del UI
Flete Base (F):  consolidated.total_freight_revenue / total_Q     ← flete ponderado
Ritmo Carga:     avg(tramos[LADEN].contract_agreed_load_rate) T/h
Ritmo Desc:      avg(tramos[LADEN].contract_agreed_discharge_rate) T/h
Address Comm.:   avg(tramos[LADEN].address_commission) %
Broker Comm.:    avg(tramos[LADEN].broker_commission) %
```

### Card 4: COSTOS PORTUARIOS (Naranja)
```
Total Port Costs: consolidated.total_port_costs
↳ [concepto]:    Σ tramos[i].agency_costs_origin_details.breakdown[concepto]
↳ [concepto]:    Σ tramos[i].agency_costs_destination_details.breakdown[concepto]
```

---

## 5. COLUMNAS DE LA TABLA DE AUDITORÍA

| Columna | Fuente | Render |
|---|---|---|
| Métrica | String fijo | Texto |
| Fórmula Algorítmica | `enhanced_audit[key].formula` | Texto con colorizeFormula() |
| Reemplazo Numérico | `enhanced_audit[key].values` | Texto con colorizeFormula() |
| GEEKSOFT (Motor) | `mockedScenario[metrica_field]` | Número formateado ($) |
| PETRAL (Excel) | ninguna | `<div style="border-bottom:1px solid #94a3b8;height:14px;width:80px;margin:0 auto;"></div>` |
| Delta (Δ) | ninguna | misma línea en blanco |

---

## 6. LÓGICA DE CONSTRUCCIÓN DEL enhanced_audit (Consolidado Multiruta)

```typescript
const cons     = runResult.consolidated
const tramos   = runResult.tramos
const ladens   = tramos.filter((t:any) => t.type === 'LADEN')
const t_labels = tramos.map((_:any, i:number) => `T${i+1}`).join(' + ')

// Valores para calculos
const total_duration = cons.total_days || 0
const net_utility    = cons.pnl_net_utility ?? 0   // ← nombre exacto del backend
const tce            = cons.tce_real ?? 0           // ← nombre exacto del backend

// Fórmulas legibles para humanos
const sum_port_days = tramos.map((t:any) => t.port_days.toFixed(2)).join(' + ')
                      + ` = ${cons.total_port_days.toFixed(4)}`
const sum_sea_days  = tramos.map((t:any) => t.sea_days.toFixed(2)).join(' + ')
                      + ` = ${cons.total_sea_days.toFixed(4)}`
const sum_income    = ladens.map((t:any) => `($${t.freight_rate} × ${t.quantity})`).join(' + ')
                      + ` = $${cons.total_freight_revenue.toLocaleString()}`
const sum_bunker    = tramos.map((t:any) => `$${(t.bunker_costs||0).toLocaleString()}`).join(' + ')
                      + ` = $${cons.total_bunker_costs.toLocaleString()}`
const sum_port      = tramos.map((t:any) => `$${(t.port_costs||0).toLocaleString()}`).join(' + ')
                      + ` = $${cons.total_port_costs.toLocaleString()}`
const avg_load      = ladens.map((t:any) => `${t.contract_agreed_load_rate||0}`).join(' | ') + ' T/h'
const avg_disch     = ladens.map((t:any) => `${t.contract_agreed_discharge_rate||0}`).join(' | ') + ' T/h'

const enhanced_audit = {
  '1. Ritmo Carga (act_load)':    { formula: `Promedio piernas laden`, values: avg_load },
  '2. Ritmo Descarga (act_disch)':{ formula: `Promedio piernas laden`, values: avg_disch },
  '3. Días de Puerto (port_days)':{ formula: `Σ port_days (${t_labels})`, values: sum_port_days },
  '4. Días de Mar (sea_days)':    { formula: `Σ sea_days (${t_labels})`,  values: sum_sea_days },
  '5. Días de Viaje (tot_dur)':   { formula: 'sea_days + port_days',
                                    values: `${cons.total_sea_days.toFixed(2)} + ${cons.total_port_days.toFixed(2)} = ${total_duration.toFixed(4)}` },
  '6. Income (income)':           { formula: `Σ Q×F (${t_labels})`, values: sum_income },
  '7. Comisiones (commissions)':  { formula: 'income × (addr% + broker%) / 100',
                                    values: `$${commissions.toFixed(2)} (${total_comm_pct.toFixed(2)}%)` },
  '8. Costo Bunker (bunker)':     { formula: `Σ bunker_costs (${t_labels})`, values: sum_bunker },
  '9. Port Costs (port_costs)':   { formula: `Σ port_costs (${t_labels})`,   values: sum_port },
  '10. Voyage Result (voy_res)':  { formula: 'Income − Commissions − Bunker − Port',
                                    values: `$${net_utility.toLocaleString()}` },
  '11. TCE Diario (tce_real)':    { formula: 'voyage_result / total_days',
                                    values: `$${net_utility.toLocaleString()} / ${total_duration.toFixed(2)} = $${tce.toLocaleString()}` },
  '12. P/L (pl_vs_req)':          { formula: 'voyage_result − (tce_req × tot_dur)',
                                    values: `$${(net_utility - (req * total_duration)).toLocaleString()}` }
}
```

---

## 7. CHECKLIST QC — VERIFICAR ANTES DE DEPLOYAR

Prueba con ruta ILO→MARCONA, Q=13500, F=22.82, buque SIN_NOMBRE/TBN_02, modo Static:

### Card Maestro Rutas
- [ ] Todas las piernas listadas con nombres de puerto reales
- [ ] Cada pierna muestra distancia NM > 0 (nunca 0 NM)
- [ ] Suma de piernas = Dist. TOTAL VIAJE

### Card Contratos
- [ ] Cantidad (Q) = 13,500 MT (no 0)
- [ ] Flete Base (F) = $22.82/MT (no $0)
- [ ] Ritmo Carga = 500 T/h (no TBD, no 0)
- [ ] Ritmo Desc = 345 T/h (no TBD, no 0)

### Tabla Auditoría — Columna GEEKSOFT (Motor)
- [ ] Fila 1 Ritmo Carga: 500
- [ ] Fila 3 Días Puerto: 3.2971
- [ ] Fila 4 Días Mar: 2.1770
- [ ] Fila 5 Días Viaje: 5.4741
- [ ] Fila 6 Income: $308,070.00
- [ ] Fila 7 Comisiones: $0.00
- [ ] Fila 8 Bunker: $40,776.01
- [ ] Fila 9 Port Costs: $67,000.00
- [ ] Fila 10 Voyage Result: $200,293.99
- [ ] Fila 11 TCE Diario: $36,589.08
- [ ] Fila 12 P/L: $118,181.78

### Columnas PETRAL y Delta
- [ ] Ambas muestran líneas en blanco (no strings "Net", "Total", "Sum")

### Regla de Oro
- [ ] Si Income > $0 → Voyage Result NUNCA es $0 (puede ser negativo pero no cero)

---

## 8. ERRORES FRECUENTES — TRAMPAS CONOCIDAS

| Error observado | Causa raíz | Solución |
|---|---|---|
| Distancias `0 NM` en PDF | `legsConfig[i].distance` no existe | Usar `runResult.tramos[i].distance` |
| Voyage Result `$0` | `cons.net_utility` no existe | Usar `cons.pnl_net_utility` |
| TCE `$0` | `cons.tce` no existe | Usar `cons.tce_real` |
| Income `$0` | payload no envía quantity/freight_rate | Verificar que tramos[i] lleva esos campos |
| Columna PETRAL con "Net"/"Total" | METRICS array con strings estáticos | Usar `<div>` línea en blanco para PETRAL |
| Ritmo Carga `0` en consolidado | Se promedia sobre TODOS los tramos | Filtrar solo `type === 'LADEN'` |
| Comisiones siempre `$0` | Hardcodeado en lugar de calcular | Extraer addr/broker_commission de tramos laden |

---

## 9. FLUJO COMPLETO DE DATOS

```
UI → legsConfig[]: { port_id, action, quantity, freight_rate }
                          ↓
handleCalculate() construye payload:
  tramos[i]: { origin_port_id, destination_port_id, type,
               quantity, freight_rate, route_distance,
               weather_factor_laden, weather_factor_ballast,
               contract_agreed_load_rate, contract_agreed_discharge_rate,
               agency_costs_origin, agency_costs_destination,
               port_overhead_hours_origin, port_overhead_hours_dest,
               positioning_carga_hrs, positioning_descarga_hrs }
                          ↓
POST /forecast/multicotizador
                          ↓
Backend: calculate_multicotizador_simulation()
                          ↓
runResult = {
  tramos: [{ distance, sea_days, port_days, net_income,
             bunker_costs, port_costs, bunker_ifo, bunker_mdo,
             origin_port_id, destination_port_id, type,
             contract_agreed_load_rate, contract_agreed_discharge_rate,
             agency_costs_origin_details, agency_costs_destination_details,
             audit_trail }],
  consolidated: {
    total_distance, total_sea_days, total_port_days, total_days,
    total_bunker_costs, total_port_costs, total_freight_revenue,
    pnl_net_utility, tce_real, tce_required,           ← NOMBRES EXACTOS
    bunker_ifo_tonnage, bunker_mdo_tonnage
  }
}
                          ↓
Frontend construye mockedScenario:
  voyage_result  ← consolidated.pnl_net_utility
  tce_real_unit  ← consolidated.tce_real
  total_duration ← consolidated.total_days
  enhanced_audit ← construido con datos reales de tramos + consolidated
                          ↓
renderScenarioContent() → tarjetas + tabla
                          ↓
Botón PDF → genera HTML con los mismos datos de mockedScenario
```

---

## 11. CAPA UI — legsConfig, Payload y Reglas de Negocio

### 11.1 ¿Qué es `legsConfig`?

`legsConfig` es el estado de React que representa la configuración visual de la UI (lo que el usuario llenó en la grilla de puertos). **NO es lo mismo que `tramos`** del backend.

```typescript
// legsConfig[i] — lo que guarda la UI por cada puerto
{
  idx: number,          // índice del puerto en la secuencia
  port_id: string,      // ID del puerto (ej. "ILO", "MARCONA")
  action: "CARGAR" | "DESCARGAR" | "NONE",  // acción del buque en ese puerto
  quantity: number,     // toneladas (solo si action === 'CARGAR' o 'DESCARGAR')
  freight_rate: number  // USD/MT (solo si action === 'CARGAR')
  // NO TIENE CAMPO distance. Las distancias vienen del backend en tramos[i].distance
}
```

> TRAMPA CRITICA: `legsConfig[i].distance` NO EXISTE. Nunca usar `legsConfig[i].distance`.
> Las distancias por pierna vienen de `runResult.tramos[i].distance`.

### 11.2 Construcción del Payload (`handleCalculate`)

La función `handleCalculate()` convierte `legsConfig` en el payload para el backend:

```typescript
// Para cada par de puertos consecutivos (legsConfig[i] → legsConfig[i+1]),
// se crea un tramo que va de legsConfig[i] a legsConfig[i+1].

const payload = {
  vessel_id: selectedVesselId,
  port_cost_mode: "static" | "matrix",
  tramos: tramos.map((tr, i) => ({
    // Campos que vienen de la ruta (route.legs_data.tramos[i])
    origin_port_id: tr.origin_port_id,
    destination_port_id: tr.destination_port_id,
    route_distance: tr.route_distance,             // distancia del maestro de rutas
    weather_factor_laden: tr.weather_factor_laden,
    weather_factor_ballast: tr.weather_factor_ballast,
    agency_costs_origin: tr.agency_costs_origin,
    agency_costs_destination: tr.agency_costs_destination,
    contract_agreed_load_rate: tr.contract_agreed_load_rate,
    contract_agreed_discharge_rate: tr.contract_agreed_discharge_rate,
    port_overhead_hours_origin: null,  // null = el backend toma del contrato
    port_overhead_hours_dest: null,    // null = el backend toma del contrato
    positioning_carga_hrs: null,       // null = el backend toma del contrato
    positioning_descarga_hrs: null,    // null = el backend toma del contrato
    // Campos que vienen de legsConfig (lo que el usuario llenó)
    quantity: legsConfig[i].quantity,        // si el origen es CARGAR
    freight_rate: legsConfig[i].freight_rate, // si el origen es CARGAR
    type: legsConfig[i].action === 'NONE' ? 'BALLAST' : 'LADEN',
    origin_action: legsConfig[i].action,
    destination_action: legsConfig[i+1].action
  }))
}
```

> REGLA CRITICA: Si `port_overhead_hours_origin` y similares se envían como valores explícitos
> (ej. 6.0), el backend los toma como override y NUNCA consulta el contrato de SPCC.
> Siempre enviar `null` para que el backend use los valores del contrato activo.

### 11.3 Reglas de Herencia entre Piernas

1. **Puerto de inicio del tramo i** = Puerto de fin del tramo i-1 (siempre)
2. **Tipo de tramo** se determina por el inventario en bodega:
   - Si inventario al salir del puerto de origen > 0 → `LADEN`
   - Si inventario al salir del puerto de origen = 0 → `BALLAST`
3. **Costos portuarios BALLAST:**
   - Solo el primer tramo BALLAST paga origen + destino
   - Tramos BALLAST siguientes: si el puerto destino ya fue visitado → $0.00 (sin duplicar)

### 11.4 Validaciones de la UI (antes de llamar al backend)

```typescript
// La UI DEBE validar antes de enviar:
const totalCargas = legsConfig.filter(p => p.action === 'CARGAR').reduce((acc, p) => acc + (p.quantity || 0), 0);
const totalDesc   = legsConfig.filter(p => p.action === 'DESCARGAR').reduce((acc, p) => acc + (p.quantity || 0), 0);

// Regla 1: Toneladas de carga = toneladas de descarga
if (totalCargas === 0 || totalCargas !== totalDesc) {
  alert('Toneladas de carga deben ser > 0 y coincidir con las de descarga.');
  return;
}

// Regla 2: Toda pierna de carga tiene tarifa
const missingTariffs = legsConfig.filter(p => p.action === 'CARGAR' && (!p.freight_rate || p.freight_rate <= 0));
if (missingTariffs.length > 0) {
  alert('Debe ingresar tarifa > $0 para todos los puertos de carga.');
  return;
}
```

### 11.5 Cálculo de Cantidad y Flete Ponderado para Cards (Vista Consolidada)

Cuando hay múltiples piernas de carga con distintas tarifas, el **flete ponderado** para mostrar en la card Contratos se calcula así:

```typescript
// Cantidad total = suma de todas las cargas del usuario (desde legsConfig)
const tot_q = legsConfig.filter(p => p.action === 'CARGAR').reduce((acc, p) => acc + (p.quantity || 0), 0);

// Flete promedio ponderado = ingreso total / cantidad total
// (no usar promedio simple de tarifas — usar la ponderación por ingreso)
const avg_f = tot_q > 0 ? (cons.total_freight_revenue / tot_q) : 0;

// Ritmo de carga y descarga: SOLO de piernas LADEN (no BALLAST)
const ladens = runResult.tramos.filter(t => t.type === 'LADEN');
const avg_load_rate = ladens.length > 0
  ? ladens.reduce((a, b) => a + parseFloat(b.contract_agreed_load_rate || '0'), 0) / ladens.length
  : 0;
const avg_disch_rate = ladens.length > 0
  ? ladens.reduce((a, b) => a + parseFloat(b.contract_agreed_discharge_rate || '0'), 0) / ladens.length
  : 0;

// Comisiones: SOLO de piernas LADEN
const avg_addr_comm = ladens.reduce((a, b) => a + (b.address_commission || 0), 0) / (ladens.length || 1);
const avg_brok_comm = ladens.reduce((a, b) => a + (b.broker_commission || 0), 0) / (ladens.length || 1);
const total_commissions = cons.total_freight_revenue * ((avg_addr_comm + avg_brok_comm) / 100);
```

### 11.6 Regla de Oro del Income (QC crítico)

```
SI legsConfig tiene al menos una pierna con:
   action === 'CARGAR' AND quantity > 0 AND freight_rate > 0

ENTONCES:
   consolidated.total_freight_revenue DEBE ser > 0
   consolidated.pnl_net_utility puede ser negativo pero NO puede ser undefined
   Fila 6 de la tabla DEBE mostrar un valor en $ distinto de $0.00
```

Si esto falla, el problema está en el payload enviado al backend (quantity o freight_rate no llegaron al tramo correcto).

---

*Versión 1.1 — 2026-07-21 — Sección 11 añadida: Capa UI*
*Fuentes: multicotizador.md, VoyageLedgerFinal.tsx (handleCalculate), spot_engine.py*
