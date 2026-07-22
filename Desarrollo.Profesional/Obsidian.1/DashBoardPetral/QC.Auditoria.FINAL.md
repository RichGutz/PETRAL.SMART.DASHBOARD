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

---

## 🏛️ 4. Reglas de Negocio de Filtrado de Rutas y Clientes (Especificación Oficial)

### 🔹 4.1 Clasificación de Clientes
1. **Clientes Oficiales Corporativos:**
   - **`NEXA`**: Cliente corporativo oficial con sus rutas maestras en la tabla `routes_clients`.
   - **`SPCC`**: Cliente corporativo oficial con sus rutas maestras en la tabla `routes_clients` (`SPCC.ILO.MATARANI`, `SPCC.ILO.MARCONA`, `SPCC.ILO.MEJILLONES`).
2. **Prospectos (`PROSPECTOS`):**
   - Todo cliente, prospecto o cotización spot que **no esté grabado en la matriz oficial de clientes** se agrupa y consolida bajo la categoría **`PROSPECTOS`**.

### 🔹 4.2 Tablas Fuentes en Base de Datos (Supabase)
- **`routes_clients`**: Fuente de verdad para las rutas contractuales y corporativas de `NEXA` y `SPCC`.
- **`routes_prospects`**: Fuente de verdad para prospectos, oportunidades y cotizaciones spot.

### 🔹 4.3 Comportamiento Requerido en la Interfaz (UI — `VoyageLedgerFinal.tsx`)
1. **Filtro Secuencial en Cascada:**
   - **Paso 1 (Cliente):** Selección entre `NEXA`, `SPCC` y `PROSPECTOS`.
   - **Paso 2 (Ruta):** Filtro reactivo en cascada. Al seleccionar **`SPCC`**, el segundo selector despliega **exclusivamente** las rutas registradas para SPCC en `routes_clients`. Al elegir **`PROSPECTOS`**, despliega únicamente las rutas pertenecientes a `routes_prospects`.
   - **Paso 3 (Buque):** Selección del buque de la flota (`MOQUEGUA`, `TABLONES`, `CONCON TRADER`, `HUEMUL`).
   - **Paso 4 (Matriz Portuaria):** Selección de la modalidad de tarifa portuaria (`static` / `matrix`).

---

## 🎴 5. Mapeo Reactivo de Tarjetas (Cards) con Tablas Fuentes (Supabase)

### 🔹 Card 1 — Maestro Flota (Badge: `vessels`)
- **Tabla Fuente en Supabase:** `vessels`
- **Campos Mapeados:**
  - Identificación del barco: `vessel_name`.
  - Velocidad comercial: `vessel_speed` (kn).
  - TCE Requerido: `tce_required` ($/día).
  - Dimensiones y Capacidades: `dwt`, `dwcc`, `length` (L), `beam` (B).
  - Matriz de Consumos de Combustible: Consumos IFO y MDO en navegación (`sea`), en puerto sin operación (`idle`), en maniobras de carga (`load`) y en descarga (`disch`).

### 🔹 Card 2 — Combustible & Costos Portuarios (Badges: `bunker_prices` & `port_cost_static` / `port_costs_matrix`)
- **Tablas Fuentes en Supabase:** `bunker_prices`, `port_cost_static` (Modo Estático), `port_costs_matrix` (Modo Dinámico).
- **Campos Mapeados:**
  - **Sección Combustibles:** `bunker_price_date`, `bunker_price_ifo` ($/MT), `bunker_price_mdo` ($/MT).
  - **Sección Costos Portuarios:** Mapea reactivamente el cliente activo `{selectedClientId}`, junto con la suma de costos de agencia en origen y destino (`port_costs_breakdown.origin` y `port_costs_breakdown.destination`), incluyendo el rubro especial de *Loading Master*.

### 🔹 Card 3 — Reglas Comerciales & Tarifario (Badge: `contracts`)
- **Tablas Fuentes en Supabase:** `contracts` y `contract_tariffs`.
- **Campos Mapeados:**
  - **Parámetros Comerciales:** Cantidad $Q$ (MT), Flete Base $F$ ($/MT), Ritmo de carga (`contract_agreed_load_rate`), Ritmo de descarga (`contract_agreed_discharge_rate`).
  - **Tiempos Operativos & Comisiones:** *Time to Count* origen/destino (`port_overhead_hours_origin`/`dest`), *Maneuver* carga/descarga (`positioning_carga_hrs`/`descarga_hrs`), *Address Commission* (`address_commission`) y *Broker Commission* (`broker_commission`).
  - **Mini-Tabla Tarifario por Bracket:** Se conecta reactivamente a la tabla `contract_tariffs` en Supabase correspondiente al contrato del cliente seleccionado (`selectedClientId`), leyendo dinámicamente los rangos de tonelaje (`min_tonnage`, `max_tonnage`) y sus fletes asociados (`freight_rate`), reemplazando mapas estáticos hardcodeados.

### 🔹 Card 4 — Maestro Rutas (Badge: `routes`)
- **Tablas Fuentes en Supabase:** `routes_clients` (para NEXA y SPCC) y `routes_prospects` (para Prospectos).
- **Campos Mapeados:**
  - **Trayecto General:** `origin_port_id` $\rightarrow$ `destination_port_id`.
  - **Desglose Obligatorio Pierna por Pierna (`LADEN` vs `BALLAST`):**
    - Muestra explícitamente cada pierna del itinerario (`P#1 BALLAST`, `P#2 LADEN`, etc.) indicando su puerto origen, puerto destino y la distancia náutica individual de esa pierna (`distance` en NM).
    - Aplica tanto para rutas simples de ida y vuelta como para rutas complejas multiruta (p.ej. NEXA de 3 piernas).
  - **Distancia Total del Viaje:** `distancia_total` (NM) acumulando la suma exacta de todas las piernas.
  - **Factores de Clima:** `weather_factor_laden` (%) y `weather_factor_ballast` (%).

---

## ⚓ 6. Regla de Asignación Exclusiva de Costos Portuarios (`port_costs`)
1. **Identificación Operativa:**
   - El motor central identifica explícitamente en qué puertos se efectúa operación de **`CARGAR`** o **`DESCARGAR`**.
   - **Únicamente los puertos con operación activa de Carga o Descarga acumulan costos portuarios de agencia.**
2. **Tránstitos y Lastre (`BALLAST`):**
   - Las piernas de lastre o tránsitos simples sin operación portuaria comercial asignan costo portuario nulo (**`$0.00 USD`**).

---

## 💰 7. Regla de Cálculo del Ingreso Bruto de Flete (`Gross Revenue / Net Income`)
1. **Cálculo por Pierna Comercial (`LADEN`):**
   - Cada pierna de carga calcula su ingreso multiplicando el volumen cargado real por la tarifa contractual asignada para ese tramo:
     $$\text{Ingreso}_{\text{pierna}} = Q_{\text{pierna}} \times F_{\text{pierna}}$$
2. **Ingreso Consolidado del Viaje:**
   - El Ingreso Bruto Total del viaje es la sumatoria exacta de los ingresos de todas las piernas con carga comercial:
     $$\text{Ingreso Total} = \sum_{\text{pierna} \in \text{LADEN}} (Q_{\text{pierna}} \times F_{\text{pierna}})$$

---

## ⛽ 8. Especificación del Cálculo de Búnker por Pierna (Fishbowl Auditable)

### 🔹 8.1 Regla para Piernas en Lastre / Vacío (`BALLAST`)
- **Fórmula de Días de Mar (`Sea Days`):**
  $$\text{Sea Days}_{\text{ballast}} = \frac{\text{Distancia} \times (1 + \text{WeatherFactor})}{\text{Velocidad} \times 24}$$
- **Días de Puerto (`Port Days`):** `0.00 Días` (sin operación portuaria ni sobrecostos aplicables).
- **Consumo Búnker:**
  $$\text{IFO}_{\text{ballast}} = \text{Sea Days}_{\text{ballast}} \times \text{ConsumoMarIFO}$$
  $$\text{MDO}_{\text{ballast}} = \text{Sea Days}_{\text{ballast}} \times \text{ConsumoMarMDO}$$

### 🔹 8.2 Regla para Piernas Cargadas (`LADEN`)
- **Fórmula de Días de Mar (`Sea Days`):**
  $$\text{Sea Days}_{\text{laden}} = \frac{\text{Distancia} \times (1 + \text{WeatherFactor})}{\text{Velocidad} \times 24}$$
- **Días de Puerto y Horas Extras Operativas (`Port Days`):**
  - **Operación de Carga/Descarga:** $(\frac{Q}{\text{Ritmo Carga}}) + (\frac{Q}{\text{Ritmo Descarga}})$.
  - **Horas Extras de Puerto (*Turn Time Overheads* & *Positioning Maneuvers*):** Incluye las horas de espera (*Time to Count*) en origen y destino, más las maniobras de atraque (*Positioning Maneuvers*):
    $$\text{Horas Extra} = \text{Overhead}_{\text{origen}} + \text{Overhead}_{\text{destino}} + \text{Maniobra}_{\text{carga}} + \text{Maniobra}_{\text{descarga}}$$
- **Consumo Búnker Consolidado:**
  $$\text{IFO}_{\text{laden}} = (\text{SeaDays} \times \text{ConsumoMar}) + (\text{IdleDays} \times \text{ConsumoIdle}) + (\text{LoadDays} \times \text{ConsumoLoad}) + (\text{DischDays} \times \text{ConsumoDisch})$$

### 🔹 8.3 Desglose Auditable en Interfaz (UI) y PDF (Fishbowl)
- Tanto en la Vista Web de **Auditoría Final** como en la **Acta PDF**, se renderiza el bloque transparente **`🐟 FISHBOWL AUDIT TRAIL — DESGLOSE DE PIERNAS Y FÓRMULAS SUSTITUIDAS`**, desglosando pierna por pierna las millas náuticas, días de mar, horas extras de puerto, consumo de toneladas IFO/MDO y costo en USD con fórmulas numéricas reales sustituidas.

---

## 📄 9. Protocolo de Entrega de Acta PDF Oficial por Ruta

Como parte del **Loop Autónomo de Control de Calidad (QC Loop)**, cada ejecución de auditoría genera de forma automatizada un reporte PDF oficial compilando la ficha de auditoría detallada (Fishbowl) por cada ruta oficial de SPCC y NEXA:

- **Archivo PDF Oficial:** [ACTA_AUDITORIA_FINAL_RUTAS_SPCC_NEXA.pdf](file:///C:/Users/rguti/.gemini/antigravity-ide/brain/2e0de588-072f-4fee-9575-6a37156b7fa3/ACTA_AUDITORIA_FINAL_RUTAS_SPCC_NEXA.pdf)
- **Contenido:**
  1. **Tabla de Resumen Consolidado:** Distancias, Días Totales, Búnker USD, Puerto Carga USD, Puerto Descarga USD, Ingreso Flete USD, PnL Neto USD y TCE Real.
  2. **Ficha Detallada por Ruta (Fishbowl Pierna por Pierna):** Sustitución numérica de días de mar, días de puerto, búnker navegación, búnker puerto, agencias portuarias y flete.






