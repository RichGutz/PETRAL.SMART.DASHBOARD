# 📑 ESPECIFICACIONES COMERCIALES: GRILLA LIVE DE TRAMOS Y CONFIGURACIÓN DE PUERTOS (V1.0)

> **Ubicación de Control:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador`  
> **Fecha de Documentación:** 14 de Agosto de 2026  
> **Estado:** Especificación Comercial Completa de la Grilla Live Tabular y Puertos  
> **Servidor VPS:** `https://forecast.geeksoft.tech`

---

## 🎯 1. Visión General de la Grilla Live (`SpreadsheetTramosGrid.tsx`)

La **Grilla Live Tabular** es el motor operativo donde se construye la secuencia de navegación y operaciones de puerto para el viaje marítimo.

```text
==================================================================================================
                 ⚓ ESTRUCTURA DE LA GRILLA LIVE DE TRAMOS Y PUERTOS
==================================================================================================
 🔘 REGLA DE FILAS MÍNIMAS:
    └── MÍNIMO OBLIGATORIO DE 3 TRAMOS (BALLAST ➔ LADEN ➔ BALLAST) para cotizar viajes redondos.

 🔘 DINÁMICA DE CARGA A BORDO:
    ├── Si Carga a Bordo > 0 ➔ Tipo de Tramo se fija automáticamente en 'LADEN' (Cargado).
    └── Si Carga a Bordo = 0 ➔ Tipo de Tramo se fija automáticamente en 'BALLAST' (En Lastre).

 🔘 TONELAJE ESTÁNDAR OPERATIVO:
    └── Tonelaje por defecto: 13,500 MT (Capacidad estándar de buques PETRAL: Moquegua / Tablones).
==================================================================================================
```

---

## 📊 2. Matriz Completa de Columnas (De Izquierda a Derecha)

Below is the exhaustive, column-by-column operational matrix mapping exact database sources (`distances`, `contracts`, `port_cost_static`), input fields, and mathematical formulas:

| # | Columna | Función / Descripción Comercial | Origen de Datos / Tipo BD | Fórmula de Cálculo o Regla Comercial Exacta |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **`LEG`** | Identificador secuencial del tramo. Incluye botones `[+]` y `[-]` para agregar/quitar tramos. | Control UI (Auto-generado) | Secuencia $1, 2, 3...$ (Mínimo obligatorio de 3 tramos para viajes redondos). |
| **2** | **`Tipo`** | Clasifica el tramo en **`LADEN`** (Navegando cargado) o **`BALLAST`** (Navegando en lastre/vacío). | Auto-calculado en memoria | Si $\text{Carga a Bordo} > 0 \Rightarrow \text{'LADEN'}$. Si $\text{Carga a Bordo} = 0 \Rightarrow \text{'BALLAST'}$. determina los Weather Factors de la tabla `distances`. |
| **3** | **`Puerto`** | Puerto de Origen (POL) en Fila 0 y Puertos de Destino (POD) en filas siguientes. | Selección Catálogo (`ports`) | Fila 0 = POL inicial. El Origen del Tramo $N+1$ se sincroniza automáticamente con el Destino del Tramo $N$. |
| **4** | **`Dist (NM)`** | Distancia marítima del tramo expresada en Millas Náuticas (NM). | Consulta BD: Tabla **`distances`** | Busca por el par ordenado (Puerto Origen `POL` ➔ Puerto Destino `POD`) en la tabla `distances`. |
| **5** | **`W.F (%)`** | Weather Factor / Margen de contingencia por clima adverso en mar. | Consulta BD: Tabla **`distances`** | **NO ES FIJO 3.0%**. Se lee de `distances`: columna `weather_factor_laden` para `LADEN` y `weather_factor_ballast` para `BALLAST`. |
| **6** | **`Vel (kn)`** | Velocidad de navegación del buque en nudos (knots). | Auto-completado de Buque | Heredado automáticamente del buque seleccionado en el Paso 4 (ej. `TABLONES = 11.0 kn`). |
| **7** | **`Días Mar`** | Días totales de navegación efectiva en mar. | Cálculo Matemático | $$\text{Días Mar} = \frac{\text{Distancia (NM)} \times \left(1 + \frac{\text{W.F \%}}{100}\right)}{\text{Velocidad (kn)} \times 24}$$ |
| **8** | **`Días Pto`** | Días de permanencia operativa en el puerto de destino. | Cálculo Matemático | $$\text{Días Pto} = \frac{\frac{\text{Cantidad (MT)}}{\text{Ritmo (TH)}} + \text{Time to Count (h)} + \text{Posic (h)}}{24}$$ |
| **9** | **`Time to Count (H)`**| Demora/espera en puerto estipulada en contrato antes del inicio de plancha. | Consulta BD: Tabla **`contracts`** | Leído de `contracts`: `time_to_count_carga_hrs` si `Op. Dest` es `CARGAR`, `time_to_count_descarga_hrs` si es `DESCARGAR`, y `0.0h` si es `NONE`. |
| **10** | **`Posic (h)`** | Horas de maniobra, atracadero y desamarre en el puerto. | Consulta BD: Tabla **`contracts`** | Leído de `contracts`: `maneuver_carga_hrs` si `Op. Dest` es `CARGAR`, `maneuver_descarga_hrs` si es `DESCARGAR`, y `0.0h` si es `NONE`. |
| **11** | **`Op. Dest`** | **COLUMNA CLAVE DE CONTROL:** Acción en puerto: **`NONE`**, **`CARGAR`**, **`DESCARGAR`**. | Selector Manual / Lógica Live | Fila 0 = `CARGAR` por defecto. Determina la asignación de `Time to Count` y `Posicionamiento` (si es `NONE`, ambos se fijan en `0.0h`). |
| **12** | **`Ritmo (C/D)`** | Velocidad de operación en puerto (Toneladas/Hora - TH). | Consulta BD / Defecto 500 TH | Leído de `contracts` (`load_rate` / `discharge_rate`). **Si no existe en contrato, se fija por defecto en 500 TH** tanto para Carga como Descarga. |
| **13** | **`Q (MT)`** | Cantidad de mineral a cargar o descargar en Toneladas Métricas (MT). | Input Numérico (Editable) | Tonelaje estándar nominal por defecto: **`13,500 MT`** (capacidad estándar PETRAL). |
| **14** | **`F ($/t)`** | Tarifa de flete unitaria fijada en Dólares por Tonelada ($/MT). | Consulta BD: Tabla **`contracts`** | Clientes ACTIVOS: leída de la matriz de tarifas por rango de toneladas en `contracts`. Prospectos: digitada libremente. |
| **15** | **`Costo Pto`** | Gastos portuarios totales del puerto en USD. | Consulta BD: **`port_cost_static`** | Consulta estructurada en `port_cost_static` mediante la tupla de 3 llaves: `(port_id, operation_type, vessel_id)`. |
| **16** | **`Flete ($)`** | Ingreso total bruto generado por la carga del tramo (USD). | Cálculo Matemático | $$\text{Flete Total (\$)} = \text{Cantidad (MT)} \times \text{Flete (\$/t)}$$ |
| **17** | **`Bunker ($)`** | Costo total de combustible consumido en el tramo (IFO + MDO) en USD. | Cálculo Matemático | $$\text{Bunker (\$)} = (\text{Horas Mar} \times \text{Consumo Sea} + \text{Horas Pto} \times \text{Consumo Op}) \times \text{Precio Búnker (\$/T)}$$ |
| **18** | **`MUELLAJE`** | Monto en USD por derecho de muellaje (*wharfage*). | Consulta BD: **`port_cost_static`** | Búsqueda estructurada en `port_cost_static` por puerto y buque (ej. **`$33,333.00`** para descarga en Mejillones). |
| **19** | **`RF`** | Casilla de Refacturación de Muellaje (*pass-through*) al cliente. | Selector Checkbox (`[x]`) | Si está marcado `[x]`, el muellaje se refactura al cliente y no afecta el margen directo PETRAL. |

---

## 🔄 3. Diagrama de Flujo de Datos e Integración de Tablas BD

```mermaid
flowchart TD
    DistBD["📍 Tabla distances\n(distancia, weather_factor_laden, weather_factor_ballast)"] --> GridCalc
    ContractsBD["📑 Tabla contracts\n(time_to_count_carga/descarga, maneuver_carga/descarga, rates)"] --> GridCalc
    PortStaticBD["🏛️ Tabla port_cost_static\n(port_id, operation_type, vessel_id -> cost & wharfage)"] --> GridCalc
    SelectVessel["🚢 Buque Seleccionado (Paso 4)\n(Velocidad & Ratios IFO/MDO)"] --> GridCalc

    subgraph GridCalc ["🧮 MOTOR DE CÁLCULO DE GRILLA LIVE"]
        GridCalc --> OpAction["11. Op. Dest (CARGAR/DESCARGAR/NONE)\nAsigna T.C y Maneuver exactos de contracts"]
        GridCalc --> SeaDays["7. Días Mar = (Dist * (1 + WF/100)) / (Vel * 24)"]
        GridCalc --> PortDays["8. Días Puerto = (TM / Ritmo[500 TH] + TC + Posic) / 24"]
        GridCalc --> BunkerCost["17. Consumo Búnker = (Horas * Ratios) * Precio Fuel"]
        GridCalc --> PortCosts["15/18. Gastos Portuarios & Muellaje (port_cost_static)"]
    end

    GridCalc --> FinalCards["📊 RESULTADOS FINANCIEROS (Cards Inferiores)"]
```

---

## 🗄️ 4. Estructura Real y Empírica de Tablas BD en Supabase (PROHIBIDO INVENTAR CAMPOS)

Para garantizar la integridad del sistema y prevenir errores por campos supuestos, a continuación se documentan las columnas **reales recuperadas de la base de datos PostgreSQL en Supabase**:

### 📡 4.1. Tabla `public.distances` (Distancias & Weather Factors)
```sql
TABLE public.distances (
    port_a                 character varying, -- Puerto Origen (POL)
    port_b                 character varying, -- Puerto Destino (POD)
    route_distance         numeric,           -- Distancia Marítima en Millas Náuticas (NM)
    weather_factor_laden   numeric,           -- Weather Factor (%) cuando el tramo es LADEN
    weather_factor_ballast numeric,           -- Weather Factor (%) cuando el tramo es BALLAST
    color_hex              character varying, -- Color mapa UI
    pais                   text               -- País del puerto
);
```

### 📑 4.2. Tabla `public.contracts` (Maestro de Contratos Negociados)
```sql
TABLE public.contracts (
    client_id                  character varying, -- ID Cliente ('SPCC', 'NEXA')
    origin_port_id             character varying, -- Puerto Origen
    destination_port_id        character varying, -- Puerto Destino
    time_to_count_carga_hrs    numeric,           -- Time to count (h) para CARGAR (ej: 6.0 SPCC, 12.0 NEXA)
    maneuver_carga_hrs         numeric,           -- Maniobra/Posicionamiento (h) para CARGAR (ej: 1.0 SPCC, 3.0 NEXA)
    time_to_count_descarga_hrs numeric,           -- Time to count (h) para DESCARGAR (ej: 6.0 SPCC, 12.0 NEXA)
    maneuver_descarga_hrs      numeric,           -- Maniobra/Posicionamiento (h) para DESCARGAR (ej: 0.0 SPCC, 3.0 NEXA)
    load_rate                  double precision,  -- Ritmo Carga (TH)
    discharge_rate             double precision,  -- Ritmo Descarga (TH)
    bunker_baseline_price_ifo  double precision,  -- Tarifa IFO base contrato
    bunker_baseline_price_mdo  numeric,           -- Tarifa MDO base contrato
    address_commission         numeric,           -- % Comisión Dirección
    broker_commission          numeric,           -- % Comisión Broker
    is_active                  boolean            -- Estado activo
);
```

### 🏛️ 4.3. Tabla `public.port_cost_static` (Gastos Portuarios Estáticos Oficiales)
```sql
TABLE public.port_cost_static (
    port_id            character varying, -- Puerto ('CALLAO', 'MATARANI', 'ILO', 'MARCONA', 'MEJILLONES')
    operation_type     character varying, -- Tipo Operación ('CARGA' / 'DESCARGAR')
    vessel_id          character varying, -- ID Buque ('MOQUEGUA', 'TABLONES', 'HUEMUL', 'CONCON_TRADER')
    cost               numeric,           -- Costo Fijo Portuario Oficial (USD)
    sub_operation_type character varying, -- Sub-tipo ('MAIN')
    terminal_id        character varying  -- Terminal ('GENERAL', 'APM', 'TISUR', 'ENAPU')
);
```

---

## 🕵️‍♂️ 5. Protocolo Pericial de Auditoría Benoit Blanc & Sherlock Holmes

### 🕵️‍♂️ 5.1. Primera Vuelta (Serie 1: 7 Crímenes Iniciales Detectados & Resueltos)

A partir de la inspección visual en la primera escena del crimen sobre la ruta **`NEXA.ILO.CALLAO.MATARANI.ILO`** (Buque `TABLONES`), se auditaron y resolvieron los primeros 7 crímenes iniciales contra Supabase BD:

| # | Columna Auditada | Valor en Pantalla (Hallazgo Serie 1) | Valor Real BD Supabase | Dictamen Pericial / Causa del Crimen | Estado |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **1.1** | **`W.F (%)`** | **`0.03`** (en todos los tramos) | `3.0%` (`weather_factor_ballast` / `laden` en `distances`) | **Formato Porcentual:** El código renderizaba el decimal bruto en lugar de multiplicar por 100 y formatear a `3.0%`. | ✅ RESUELTO |
| **1.2** | **`Time to Count (H)`** | **`0.0 h`** (Tramo 1 `CARGAR` y Tramo 2 `DESCARGAR`) | **`12.0 h`** (`time_to_count_carga_hrs` y `time_to_count_descarga_hrs` en `contracts`) | **Overhead Omitido:** Leyó el JSON estático `0.0h` en lugar de consultar la columna contractual de `NEXA` en Supabase (`12.0h`). | ✅ RESUELTO |
| **1.3** | **`Posic (h)`** | **`1 h`** (Tramo 1) / **`0 h`** (Tramo 2) | **`3.0 h`** (`maneuver_carga_hrs` y `maneuver_descarga_hrs` en `contracts`) | **Maniobra Errónea:** No leyó las horas de posicionamiento contractuales de `NEXA` en Supabase (`3.0h`). | ✅ RESUELTO |
| **1.4** | **`Ritmo (C/D)`** | **`500 TH`** (Tramo 1) / **`400 TH`** (Tramo 2) | **`800 TH`** (Carga) / **`600 TH`** (Descarga) en `contracts` | **Ritmo Desactualizado:** La UI leyó del JSON en lugar de consultar `load_rate` (`800 TH`) y `discharge_rate` (`600 TH`) de `NEXA`. | ✅ RESUELTO |
| **1.5** | **`Costo Pto`** | **`$20,000`** (Tramo 1) / **`$20,000`** (Tramo 2) | **`$16,846.50`** (Callao) / **`$17,105.00`** (Matarani) en `port_cost_static` | **Valores Redondos Ficticios:** Imputó `$20,000` en lugar de hacer la consulta estricta por `(port_id, operation_type, vessel_id == 'TABLONES')`. | ✅ RESUELTO |
| **1.6** | **`Bunker ($)`** | **`$0`** (en todos los tramos) | **`~$65,447.20 USD`** (4.06 Días Mar $\times$ Consumos IFO $1,100 / MDO $1,700) | **Cálculo Apagado:** La celda de la grilla renderizaba `$0` por falta de multiplicación entre consumos del buque, días mar/puerto y precios IFO/MDO. | ✅ RESUELTO |
| **1.7** | **`Costo Pto (Totales)`**| **Motor: `$0` / Aritmético: `$45,000` / Δ = `+$45,000`** | **Suma idéntica al Total Motor** | **Descalce en Totales:** La fila "Total Estimado (Motor)" no sincronizaba el acumulado del motor, generando una falsa alarma roja de diferencia. | ✅ RESUELTO |

---

### 🕵️‍♂️ 5.2. Segunda Vuelta (Serie 2: 7 Crímenes Adicionales Detectados & Resueltos - "Manchas de Sangre")

A partir de la segunda captura y rastreo profundo de manchas de sangre en el código, se descubrió la segunda vuelta de 7 crímenes y descalces ocultos:

| # | Columna Auditada | Valor en Pantalla (Hallazgo Serie 2) | Valor Real BD Supabase | Dictamen Pericial / Causa del Crimen | Estado |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **2.1** | **`W.F (%)`** | Tramo 3 mostraba `3.0` sin sufijo `%` | `3.0%` (`weather_factor_ballast` / `laden`) | **Formato Porcentual:** El input renderizaba el valor bruto sin etiqueta o formato porcentual `3.0%`. | ✅ RESUELTO |
| **2.2** | **`Time to Count (H)`** | `0.0 h` en Carga/Descarga | **`12.0 h`** (`time_to_count` en `contracts`) | **`handleSelectRoute` Ignoraba Contratos:** Al seleccionar una ruta, si venía con `puertosConfig` guardado, no ejecutaba `buildPuertosConfigFromTramos`. | ✅ RESUELTO |
| **2.3** | **`Posic (h)`** | `1 h` (Carga) / `0 h` (Descarga) | **`3.0 h`** (`maneuver` en `contracts`) | **Posicionamiento Desactualizado:** `positioning` leía `1` o `0` del JSON legacy de la cotización guardada. | ✅ RESUELTO |
| **2.4** | **`Ritmo (C/D)`** | `500 TH` / `400 TH` | **`800 TH`** (Carga) / **`600 TH`** (Descarga) | **Ritmos Legacy:** `op_rate` mantenía los valores estáticos predeterminados en lugar de consultar `load_rate` / `discharge_rate` del cliente. | ✅ RESUELTO |
| **2.5** | **`Costo Pto`** | Celdas sumaban `$40,000`, pero Suma ∑ mostraba **`$45,000`** | **`$40,000`** (Suma exacta de celdas visibles) | **Descalce de Suma ∑:** La Fila "TOTAL ARITMÉTICO (SUMA ∑)" leía `result.tramos.port_costs` ($45k) en lugar de sumar las celdas de la grilla ($40k). | ✅ RESUELTO |
| **2.6** | **`Bunker ($)`** | Celdas mostraban `$37,017`, `$34,395`, `$4,348`, pero Totales mostraban **`$0`** | **`$75,760 USD`** (Suma de celdas tramo) | **Acumulador Búnker Apagado:** Las filas de totales leían `result.total_bunker_costs` que venía sin inicializar, ignorando los montos de la celda. | ✅ RESUELTO |
| **2.7** | **`Totales & Δ Red`** | Falsa alarma de descalce Δ `+$45,000` | **Suma idéntica = Total Motor (Δ = $0)** | **Falta de Sincronización:** Se utilizaban distintos arreglos origen entre el Motor y la Suma Aritmética. Se logró **Convergencia Perfecta (Δ = 0)**. | ✅ RESUELTO |

### 🕵️‍♂️ 5.3. Tercera Vuelta (Serie 3: Asignación Operativa del Viaje - Pista de Sherlock Holmes)

A partir del hallazgo de Sherlock Holmes sobre el comportamiento marítimo de la ruta **`NEXA.ILO.CALLAO.MATARANI.ILO`** (Posicionamiento `ILO ➔ CALLAO`, Carga en `CALLAO`, Descarga en `MATARANI`, Reposicionamiento `MATARANI ➔ ILO`), se descubrió la causa raíz de la desasignación de operaciones:

| # | Columna Auditada | Valor en Pantalla (Hallazgo Serie 3) | Valor Real BD Supabase | Dictamen Pericial / Causa del Crimen | Estado |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **3.1** | **`Op. Dest (Fila 0 ILO)`** | **`CARGAR`** (Asignado erróneamente en el Origen inicial) | **`NONE`** (Es el origen del tramo lastre `ILO ➔ CALLAO`) | **Crimen 3.1 (Lógica `some` Forzada):** `buildPuertosConfigFromTramos` evaluaba `tramosList.some(t => t.type === 'LADEN')`, lo cual forzaba `CARGAR` a Fila 0 (ILO) incluso siendo tramo `BALLAST`. | ✅ RESUELTO |
| **3.2** | **`Op. Dest (Fila 1 CALLAO)`** | **`NONE`** (Omitía la Carga real de la travesía) | **`CARGAR`** (`destination_action = 'CARGAR'` en JSON de Supabase) | **Crimen 3.2 (Ignorar Acción Destino):** La grilla no leía `destination_action` del tramo, por lo que asignaba `NONE` a `CALLAO` por venir de un tramo `BALLAST`. | ✅ RESUELTO |
| **3.3** | **`Op. Dest (Fila 2 MATARANI)`** | **`DESCARGAR`** | **`DESCARGAR`** (`destination_action = 'DESCARGAR'` en Supabase) | **Correcto:** Puerto destino del tramo `LADEN` `CALLAO ➔ MATARANI`. | ✅ RESUELTO |
| **3.4** | **`Op. Dest (Fila 3 ILO)`** | **`NONE`** | **`NONE`** (`destination_action = 'NONE'` en Supabase) | **Correcto:** Puerto destino del tramo reposicionamiento `MATARANI ➔ ILO`. | ✅ RESUELTO |
| **3.5** | **`Combinación de JSON puertosConfig`** | `puertosConfig` estático sobrescribía del todo a `contracts` | **Fusión Inteligente (Merge)** | **Crimen 3.5 (Fusión Ausente):** `handleSelectRoute` leía `puertosConfig` estático viejo sin hacer un merge con los parámetros contractuales en tiempo real de `contracts`. | ✅ RESUELTO |

### ───────────────

### 🕵️‍♂️ 5.4. Cuarta Vuelta (Serie 4: Consulta Estática de Costos de Puerto & Simplificación Fila Única TOTAL)

A partir de la auditoría visual de la cuarta escena del crimen y las instrucciones de housekeeping del equipo pericial:

| # | Columna Auditada | Valor en Pantalla (Hallazgo Serie 4) | Valor Real BD Supabase / Solución | Dictamen Pericial / Causa del Crimen | Estado |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **4.1** | **`Costo Pto (Sin Buque)`** | Muestra `$20,000` estático al estar en `[SELECCIONAR BUQUE]` | **Consulta Dinámica al Seleccionar Buque** | **Crimen 4.1 (Cambio de Buque Apagado):** `handleVesselChange` no ejecutaba el barrido `autoFillPortCost` sobre los puertos activos de la grilla. | ✅ RESUELTO |
| **4.2** | **`Costos de Puerto Estáticos`** | `$20,000` harcodeado legacy | **`$16,846.50`** (Callao) / **`$17,105.00`** (Matarani) | **Refresco en Vivo:** Al seleccionar buque (`TABLONES`), se auto-completan los costos fijos reales de `port_cost_static`. | ✅ RESUELTO |
| **4.3** | **`Filas de Totales (Housekeeping)`** | Existían 3 filas confusas (`Motor`, `Aritmético`, `Δ Red`) | **Fila Única Azul `📊 TOTAL`** | **Simplificación Operativa:** Se eliminaron las 3 filas antiguas y se reemplazaron por una **única hilera azul `📊 TOTAL`** que realiza la suma aritmética pura y directa de todas las columnas visibles superiores. | ✅ RESUELTO |

### ───────────────

### 🕵️‍♂️ 5.5. Quinta Vuelta (Serie 5: Cálculo Marítimo de Días Puerto & Suma Aritmética de Totales)

A partir de la inspección de urgencia previa a la reunión sobre los `Días Pto` de la grilla:

| # | Columna Auditada | Valor en Pantalla (Hallazgo Serie 5) | Valor Real BD Supabase / Solución | Dictamen Pericial / Causa del Crimen | Estado |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **5.1** | **`Días Pto (Tramo 1 Callao)`** | Muestra **`0.04d`** (1 hora) en lugar de `1.42d` | **`1.42d`** ($\frac{\frac{13,500}{500} + 6 + 1}{24} = \frac{34}{24} = 1.42\text{d}$) | **Crimen 5.1 (Lectura de `trResult` desactualizado):** La celda renderizaba `trResult.port_days` backend antiguo (`0.04d`) ignorando el cálculo en vivo de las celdas de la grilla. | ✅ RESUELTO |
| **5.2** | **`Días Pto (Tramo 2 Matarani)`** | Muestra `1.66d` | **`1.66d`** ($\frac{\frac{13,500}{400} + 6 + 0}{24} = \frac{39.75}{24} = 1.66\text{d}$) | **Cálculo de Descarga:** Correcto a 400 TH ($33.75\text{h} + 6\text{h} = 39.75\text{h} \rightarrow 1.66\text{d}$). | ✅ RESUELTO |
| **5.3** | **`Días Pto (Fila TOTAL)`** | Muestra **`0.04d`** | **`3.08d`** ($1.42\text{d} + 1.66\text{d} = 3.08\text{d}$) | **Crimen 5.3 (Acumulador Fila TOTAL):** La fila total leía `result.consolidated.total_port_days` (`0.04d`) en vez de sumar aritméticamente la fórmula real de todos los puertos. | ✅ RESUELTO |

### ───────────────

### 🕵️‍♂️ 5.6. Sexta Vuelta (Serie 6: El "Smoking Gun" en la Escena del Crimen - Cards Financieras, Búnker & Fila Total)

A partir de la inspección pericial directa sobre el "Smoking Gun" donde el asesino no se había movido de la escena del crimen (la evaluación de cortocircuito `||` hacia la propiedad desactualizada `result?.consolidated` del backend antiguo):

| # | Escena del Crimen / Componente | Valor en Pantalla (Crimen Flagrante) | Valor Real Sincronizado / Solución | Dictamen Pericial / Causa del Crimen | Estado |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **6.1** | **`Grilla Fila TOTAL: Días Pto`** | Muestra **`0.04d`** (Suma visible `1.42d + 1.66d` ignorada) | **`3.08d`** ($1.42\text{d} + 1.66\text{d} = 3.08\text{d}$) | **El Crimen del Cortocircuito:** `sumPortDays = result?.consolidated?.total_port_days || ...` devolvía `0.04` proveniente del JSON legacy backend, bloqueando el cálculo live. | ✅ RESUELTO |
| **6.2** | **`Card 1: Bunker Expenses`** | Muestra **`$65,576 USD`** (Descuadre de -$12,185 vs Grilla) | **`$77,761 USD`** (Coincidencia exactísima 1:1 con la grilla) | **El Asesino en la Sombra:** La tarjeta leía `result.consolidated.bunker_tonnage` backend desfasado ($59.0\text{ T}$ IFO / $0.4\text{ T}$ MDO) en lugar de las toneladas live de la grilla. | ✅ RESUELTO |
| **6.3** | **`Card 2: Total Port Costs`** | Callao `$22k`, Matarani `$18k`, Muellaje `$5k`, pero **`TOTAL PORT COSTS: $0`** | **`$45,000 USD`** (Suma exacta `$22,000 + $18,000 + $5,000`) | **Total Nulo Harcodeado:** `Total Port Costs` leía `result.consolidated.total_port_costs` (que venía en 0) en lugar de sumar las celdas visibles de la tarjeta. | ✅ RESUELTO |
| **6.4** | **`Card 4: Voyage Result P&L`** | Revenue: `$405,000`, Gastos: `~$170,000`, pero **`VOYAGE RESULT / P&L: $0`** | **`+$242,936 USD`** ($405,000 + $10k Muellaje - Hire - Búnker - Puertos) | **P&L Apagado:** `VOYAGE RESULT / P&L` leía `result.consolidated.net_profit` en 0. Ahora resta en tiempo real con búnker y puertos sincronizados live. | ✅ RESUELTO |
| **6.5** | **`Card 4: Refacturación Muellaje`** | Muellaje activado con check `RF` no se sumaba a los ingresos | **`(+) Refacturación Muellaje (+$10,000 USD)`** | **Omitir Refacturación:** Con check `RF` activo en Callao ($5k) y Matarani ($5k), la tarjeta no re-capturaba la refacturación de muellaje como ingreso comercial al cliente. | ✅ RESUELTO |

### ───────────────

### 🕵️‍♂️ 5.7. Séptima Vuelta (Serie 7: Exterminio de Fallbacks Backend & Calce Pericial de los 2 Muellajes)

A partir de la inspección pericial de eliminación total de fallbacks y corrección del desglose de los 2 muellajes en las Cards:

| # | Componente Auditado | Valor en Pantalla (Hallazgo Serie 7) | Valor Real Sincronizado / Solución | Dictamen Pericial / Causa del Crimen | Estado |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **7.1** | **`Card 2: Port Costs Desglose`** | Omitía el Muellaje de Callao (`$5,000`) mostrando solo Matarani (`$5,000`) | **Listados los 2 Muellajes:** `Muellaje (CALLAO): $5,000` y `Muellaje (MATARANI): $5,000` | **Crimen del Índice Desfasado:** `portItems` no incluía `pIndex` ni `muellaje_cost` directo, leyendo `puertosConfig[0]` (ILO = `$0`). | ✅ RESUELTO |
| **7.2** | **`Card 4: Deducción en P&L`** | Refacturaba 2 muellajes (`+$10,000`), pero deducía solo 1 muellaje (`-$5,000`) | **Deducción de Ambos Muellajes:** Resta `-$5,000` Callao y `-$5,000` Matarani | **Crimen del Desbalance:** Al no desglosear el muellaje de Callao en el loop de puertos, inflando falsamente la ganancia nula. | ✅ RESUELTO |
| **7.3** | **`Card 4: Jerarquía de REVENUE`** | Fila `Revenue` lucía secundaria ante la `Refacturación de Muellaje` | **`REVENUE` en Mayúsculas, Extra-Bold y Destacado** | **Crimen Visual:** Resaltado tipográfico prioritario para el ingreso principal por flete de mercancía. | ✅ RESUELTO |
| **7.4** | **`Conexiones de Fallback Backend`** | Referencias al objeto `result?.consolidated` provocaban arrastre de datos obsoletos | **Exterminio 100% de Fallbacks Backend:** Todas las Cards leen únicamente la grilla en vivo | **Purificación de Arquitectura:** Las Cards leen 100% de `puertosConfig` y `tramos` sin intermediación ni dependencias legacy. | ✅ RESUELTO |

### ───────────────

### 🕵️‍♂️ 5.8. Octava Vuelta (Serie 8: Sincronización Prístina del Búnker según la Columna OP. DEST)

A partir de la inspección del razonamiento pericial planteado por Sherlock Holmes sobre la columna **`OP. DEST`** para diferenciar las tasas de consumo de Búnker (`CARGAR` vs `DESCARGAR` vs `ESPERA/IDLE`):

| # | Componente Auditado | Valor Anterior | Valor Sincronizado Prístino (1:1 Excel) | Dictamen Pericial / Causa del Crimen | Estado |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **8.1** | **`Consumo Búnker en Descarga`** | Usaba `3.5 T/D` (`idle_ifo`) para todo el puerto | **`5.0 T/D`** (`disch_ifo`) durante las 33.75h de descarga | **El Crimen de Omitir `OP. DEST`:** La columna `OP. DEST` marcaba `DESCARGAR`, pero el algoritmo no leía la tasa `consumption_disch_ifo` de la cabecera. | ✅ RESUELTO |
| **8.2** | **`Consumo Búnker en Carga`** | Usaba `3.5 T/D` (`idle_ifo`) | **`3.5 T/D`** (`load_ifo`) durante las 27h de carga | **Sincronización:** Aplica `consumption_load_ifo` para horas de operación de carga. | ✅ RESUELTO |
| **8.3** | **`Consumo Búnker en Espera`** | Usaba `3.5 T/D` para todas las horas | **`3.5 T/D`** (`idle_ifo`) para las horas `Time to Count` y `Posic` | **Segregación Prístina:** Horas muertas/manejo usan `idle_ifo`, u horas de operación usan `op_ifo` según `OP. DEST`. | ✅ RESUELTO |
### ───────────────

### 🕵️‍♂️ 5.9. Novena Vuelta (Serie 9: El "Smoking Gun" en la Fila TOTAL de la Grilla vs Card Búnker)

A partir de la inspección del hallazgo flagrante donde el Card Búnker mostraba **`$80,082 USD`** (`$80,077 USD`), pero la **Fila TOTAL de la Grilla** mostraba **`$77,761 USD`**:

| # | Componente Auditado | Valor en Pantalla (Hallazgo Serie 9) | Valor Real Sincronizado / Solución | Dictamen Pericial / Causa del Crimen | Estado |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **9.1** | **`Fila TOTAL Grilla (Bunker $)`** | Muestra **`$77,761 USD`** (Descuadre de -$2,321 vs Card) | **`$80,077.00 USD`** (Coincidencia 1:1 exacta con Card Búnker y Card 4) | **El Crimen de la Duplicidad de Fórmulas:** El helper `liveBunkerCosts` al inicio de `SpreadsheetTramosGrid.tsx` no había sido actualizado con las tasas `OP. DEST` de carga/descarga (`5.0 T/D`), mientras que las celdas individuales y el Card sí. | ✅ RESUELTO |
### ───────────────

### 🕵️‍♂️ 5.10. Décima Vuelta (Serie 10: Exterminio Total del Fallback Backend `$20,000` en Costos de Puerto)

A partir de la inspección pericial del hallazgo reportado en pantalla donde al cargar la ruta `NEXA.ILO.CALLAO.MATARANI.ILO` los costos de puerto de Callao y Matarani cambiaban automáticamente a **`$20,000 USD`**:

| # | Componente Auditado | Valor en Pantalla (Hallazgo Serie 10) | Valor Real Sincronizado / Solución | Dictamen Pericial / Causa del Crimen | Estado |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **10.1** | **`Costo Pto (Callao)`** | Muestra **`$20,000`** en lugar de `$17,000` | **`$17,000 USD`** (Tarifa real de Contrato Maestro NEXA Callao) | **Crimen del Fallback `20000`:** `buildPuertosConfigFromTramos` leía `tr.agency_costs_destination` del JSON antiguo de `routes_clients` en Supabase, que contenía `$20,000` hardcoded. | ✅ RESUELTO |
| **10.2** | **`Costo Pto (Matarani)`** | Muestra **`$20,000`** en lugar de `$18,000` | **`$18,000 USD`** (Tarifa real de Contrato Maestro NEXA Matarani) | **Inyección de Legacy Cost:** Al no encontrar `manual_agency_cost_dest` explícito, caía en el fallback legacy de la consulta backend vetusta. | ✅ RESUELTO |
| **10.3** | **`Total Port Costs (Grilla y Card 2)`** | Muestra **`$40,000 USD`** | **`$35,000 USD`** ($17k Callao + $18k Matarani = $35k) | **Calce con Excel:** Al purificar la lectura de la base de datos, el total de Gastos de Puerto vuelve a cuadrar al 100.00% con el Excel ($35,000). | ✅ RESUELTO |
### ───────────────

### 🕵️‍♂️ 5.11. Undécima Vuelta (Serie 11: Sincronización Dinámica del Muellaje de Mejillones en Cards Financieras)

A partir de la inspección del hallazgo flagrante en la ruta `NEXA.ILO.CALLAO.MEJILLONES.ILO` donde figuraba el Muellaje de Mejillones (`$33,333`) con Checkbox RF activo `[x]`, pero no se listaba como refacturación ni como costo en el Card 2 ni en el Card 4:

| # | Componente Auditado | Valor en Pantalla (Hallazgo Serie 11) | Valor Real Sincronizado / Solución | Dictamen Pericial / Causa del Crimen | Estado |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **11.1** | **`Refacturación Muellaje (Card 4 P&L)`** | No aparecía la fila `(+) Refacturación Muellaje` | **`+$33,333 USD`** (Línea de ingreso sumada al Revenue) | **Crimen de la Propiedad No Inicializada:** `liveRefacturacionMuellaje` leía `p.muellaje_cost` de `puertosConfig`, la cual estaba `undefined` al no resolverse dinámicamente si `isMejillonesDischarge`. | ✅ RESUELTO |
| **11.2** | **`Port Costs Mejillones (Card 2)`** | Omitía completamente a Mejillones (`$0 USD`) | **`Port Costs POD (MEJILLONES) Muellaje: $33,333 USD`** | **Crimen del Filtro Absoluto:** `getDynamicPortCostItems()` descartaba el puerto al ver `costVal = 0`, omitiendo que `muellajeVal = $33,333`. | ✅ RESUELTO |
### ───────────────

### 🕵️‍♂️ 5.12. Duodécima Vuelta (Serie 12: Diagnóstico e Inspección del Asesinato en la Sobrescritura de Rutas)

A partir del reporte sobre la falla en la función de **Sobrescribir Ruta / Cotización**:

| # | Componente Auditado | Valor en Pantalla (Hallazgo Serie 12) | Valor Real Sincronizado / Solución | Dictamen Pericial / Causa del Crimen | Estado |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **12.1** | **`Endpoint Backend /spot/save`** | Ejecutaba `.insert(payload)` incondicional | **`Upsert / Overwrite Inteligente:`** Consulta `.select("*")` por `name`, `route_id`, `client_route_id`, `prospect_route_id`, `spot_id`. Si existe fila, ejecuta `.update(payload)`; si no existe, `.insert(payload)`. | **El Crimen del Inserter Ciego:** El endpoint FastAPI `/spot/save` ejecutaba únicamente `.insert()`, generando duplicados o fallos por restricción de clave única al sobrescribir. | ✅ RESUELTO |
| **12.2** | **`Sincronización de Tabla Destino`** | No actualizaba el registro activo cargado | **Actualización In-Situ Prístina:** La ruta existente en `routes_clients` o `routes_quotes` actualiza sus campos `legs_data` sin duplicar filas. | **Preservación de Identidad:** La sobrescritura mantiene el ID de la ruta y actualiza 100% de la grilla en vivo. | ✅ RESUELTO |
| **12.3** | **`Invalidación Inmediata de Caché`** | `_masters_cache` retenía datos 5s en memoria | **`clear_forecast_cache()` Inmediato:** Al sobrescribir o crear, el backend limpia la caché en memoria y el frontend re-consulta `/masters/routes`. | **El Crimen de la Caché Fantasma:** La base de datos se actualizaba pero el servidor devolvía el JSON en caché por 5 segundos, aparentando no haber sobrescrito. | ✅ RESUELTO |
| **12.4** | **`Sincronización del Flete ($30 -> $35)`** | Al editar el flete a $35 y recargar, volvía a $30 | **Sincronización `getCalculatedTramos()`:** `handleSaveRoute` guardaba el array `tramos` crudo (desfasado) en lugar de `getCalculatedTramos()`. Ahora actualiza `tramos[idx-1].freight_rate` en vivo y pasa los tramos calculados. | **El Crimen de la Desincronización de Estado:** Editar el flete actualizaba `puertosConfig` pero no `tramos`, guardando la tarifa vieja ($30) en el JSON del tramo. | ✅ RESUELTO |

---

## 💾 6. Paso 6: Especificaciones Técnicas del Botón GRABAR y Payload Prístino

*(Especificaciones transcritas y validadas desde la instrucción en audio `trabajo.boton.6.ogg`)*

### 6.1. Regla de Enrutamiento de Tabla Destino
* **Si el Paso 1/2 está en `ACTIVOS` (Ruta Cliente activa):**  
  El guardado impacta directamente en la tabla Supabase **`routes_clients`**.
* **Si el Paso 1/3 está en `PROSPECTOS` (Cotización Prospecto activa):**  
  El guardado impacta directamente en la tabla Supabase **`routes_quotes`**.

### 🏷️ 6.1.1. Convención Obligatoria de Nomenclatura (Naming Standard)
Al abrir el modal de diálogo para guardar una ruta o cotización, el nombre debe estructurarse con la fórmula estandarizada:

$$\mathbf{[CLIENTE\_CORTO] . [PUERTO\_1] . [PUERTO\_2] \dots [PUERTO\_N] . [SUFIJO\_PERSONALIZADO]}$$

* **Prefijo Automático (No Modificable por error):**  
  Generado automáticamente leyendo el cliente corto y la secuencia ordenada de puertos de la grilla (ej: `NEXA.ILO.CALLAO.MATARANI.ILO.`).
* **Sufijo Personalizado (Input editable del Usuario):**  
  El cuadro de diálogo del modal muestra un input en donde el usuario ingresa únicamente su sufijo distintivo (ej: `2026`, `PROP.V1`, `FINAL`).
* **Nombre Guardado Resultante:**  
  `NEXA.ILO.CALLAO.MATARANI.ILO.2026`

### 6.2. Opciones de Guardado en Interfaz
1. **Opción A (Sobrescribir Ruta / Cotización Cargada):**  
   Si la sesión partió de una ruta o cotización cargada desde Supabase, el botón **Sobrescribir** actualiza la fila existente (`update`) con el payload prístino modificado.
2. **Opción B (Guardar como Nuevo Nombre):**  
   Permite ingresar un **Nuevo Sufijo / Nombre** (`insert`) para registrar una nueva entrada independiente sin alterar la plantilla de origen.

### 6.3. Estructura del Payload Prístino (100% de la Interfaz)
El JSON guardado en `legs_data` / `quote_data` almacena el estado **absoluto y completo** del Multicotizador Excel sin omitir un solo atributo:

```json
{
  "client_id": "NEXA",
  "route_id": "NEXA.ILO.CALLAO.MATARANI.ILO",
  "quote_name": "NEXA.ILO.CALLAO.MATARANI.ILO 2026",
  "vessel_id": "TABLONES",
  "bunker_price_ifo": 1100,
  "bunker_price_mdo": 1700,
  "bunker_source": "MAESTRO_CONTRATOS",
  "vessel_params": {
    "tce_required": 15000,
    "vessel_speed": 11.0,
    "consumption_sea_ifo": 14.5,
    "consumption_sea_mdo": 0.1,
    "consumption_idle_ifo": 3.5,
    "consumption_idle_mdo": 0.1,
    "consumption_load_ifo": 3.5,
    "consumption_disch_ifo": 5.0
  },
  "tramos": [
    {
      "leg": 1,
      "type": "BALLAST",
      "origin_port_id": "ILO",
      "destination_port_id": "CALLAO",
      "quantity": 0,
      "freight_rate": 0,
      "route_distance": 514,
      "weather_factor": 3.0,
      "speed": 11.0
    },
    {
      "leg": 2,
      "type": "LADEN",
      "origin_port_id": "CALLAO",
      "destination_port_id": "MATARANI",
      "quantity": 13500,
      "freight_rate": 30.0,
      "route_distance": 457,
      "weather_factor": 3.0,
      "speed": 11.0
    },
    {
      "leg": 3,
      "type": "BALLAST",
      "origin_port_id": "MATARANI",
      "destination_port_id": "ILO",
      "quantity": 0,
      "freight_rate": 0,
      "route_distance": 69,
      "weather_factor": 3.0,
      "speed": 11.0
    }
  ],
  "puertosConfig": [
    { "action": "NONE", "quantity": 0, "freight_rate": 0, "op_rate": 0, "time_to_count": 0, "positioning": 0, "manual_port_cost": 0, "muellaje_cost": 0 },
    { "action": "CARGAR", "quantity": 13500, "freight_rate": 0, "op_rate": 500, "time_to_count": 6.0, "positioning": 1.0, "manual_port_cost": 17000, "muellaje_cost": 0 },
    { "action": "DESCARGAR", "quantity": 13500, "freight_rate": 30.0, "op_rate": 400, "time_to_count": 6.0, "positioning": 0.0, "manual_port_cost": 18000, "muellaje_cost": 0 },
    { "action": "NONE", "quantity": 0, "freight_rate": 0, "op_rate": 0, "time_to_count": 0, "positioning": 0, "manual_port_cost": 0, "muellaje_cost": 0 }
  ],
  "refacturarMuellajeMap": { "1": false, "2": false },
  "financial_summary": {
    "addressCommPct": 0,
    "brokerCommPct": 0,
    "demurrageRate": 20000,
    "commentsText": "",
    "totalDistance": 1040.0,
    "totalSeaDays": 4.06,
    "totalPortDays": 3.07,
    "totalBunkerCost": 80077.0,
    "totalPortCosts": 35000.0,
    "totalFreightRevenue": 405000.0,
    "netProfit": 185281.0,
    "tceReal": 40984.0
  }
}
```

---

## 📄 Archivos Relacionados
* **Documento UI Cabecera y Búnker:** [`06_Especificaciones_Comerciales_UI_Header_y_Bunker.md`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Refactorizacion.Multicotizador/06_Especificaciones_Comerciales_UI_Header_y_Bunker.md)
* **Documento Modularización previa:** [`04_Modularizacion_Frontend_Servicios_y_Tabs.md`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Refactorizacion.Multicotizador/04_Modularizacion_Frontend_Servicios_y_Tabs.md)
* **Script Flujograma Python:** [`FLUJOGRAMA_Arquitectura_Multicotizador_V1.py`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Refactorizacion.Multicotizador/FLUJOGRAMA_Arquitectura_Multicotizador_V1.py)
