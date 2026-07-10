# 📊 Modelo Entidad - Relación (DB Schema — Supabase)

Este documento define la estructura relacional definitiva del motor de **Geeksoft**. Las relaciones garantizan que los cuellos de botella operativos, las dimensiones estructurales de la flota, las tarifas contractuales y la matriz de consumo granular se extraigan de forma automática eliminando el ingreso manual en la UI.

---

## 📐 1. Especificación Detallada de Tablas y Constraints

### 1. Tabla: `vessels` (Maestro de Flota y Especificaciones Técnicas)
*Almacena la identidad, parámetros operativos estáticos, dimensiones físicas y el perfil de consumo microscópico por fase de cada buque.*
* `vessel_id` *(VARCHAR o UUID, PK)* → Identificador único de la nave (ej. 'TABLONES', 'MOQUEGUA').
* `vessel_name` *(VARCHAR)* → Nombre comercial de la nave (ej. "B/T TABLONES").
* `flag` *(VARCHAR)* → Bandera / Nacionalidad de registro (ej. "PERUANA").
* `built` *(INTEGER)* → Año de construcción del astillero.
* `grt` *(NUMERIC)* → Gross Register Tonnage (Tonelaje de registro bruto del buque).
* `dwt` *(NUMERIC)* → Deadweight Tonnage (Tonelaje de peso muerto total).
* `dwcc` *(NUMERIC)* → Deadweight Cargo Capacity (Tonelaje útil real de carga comercial).
* `color_hex` *(VARCHAR(7))* → Código de color de UI para el Dashboard (ej. "#DC2626").

**Características Navales (Estructurales)**
* `cbm` *(NUMERIC)* → Cubic Meters (Capacidad volumétrica total de los tanques de carga).
* `loa` *(NUMERIC)* → Length Overall (Eslora total del buque medida en metros).
* `beam` *(NUMERIC)* → Manga máxima (Ancho del buque medido en metros).
* `draft` *(NUMERIC)* → Calado operativo máximo (Profundidad sumergida en metros).

**Límites Operativos e Hidráulicos**
* `vessel_speed` *(NUMERIC)* → Velocidad promedio real de navegación en mar abierto (Nudos).
* `vessel_max_load_intake_limit` *(NUMERIC)* → Máxima tasa de admisión física en los manifolds de carga (MT/Hora).
* `vessel_pump_discharge_rate` *(NUMERIC)* → Potencia y caudal máximo de las bombas centrífugas de a bordo para descarga (MT/Hora).

**Consumo Granular de Búnker (Fases Operativas Segregadas)**
* `max_capacity_ifo` *(NUMERIC)* → Capacidad máxima del tanque de Fuel Oil pesado (MT).
* `max_capacity_mdo` *(NUMERIC)* → Capacidad máxima del tanque de Diésel marítimo destilado (MT).
* `consumption_sea_ifo` / `consumption_sea_mdo` *(NUMERIC)* → Consumo diario navegando en mar abierto (MT/Día).
* `consumption_idle_ifo` / `consumption_idle_mdo` *(NUMERIC)* → Consumo diario en fondeadero, esperas o tiempos muertos (MT/Día).
* `consumption_load_ifo` / `consumption_load_mdo` *(NUMERIC)* → Consumo diario demandado durante la operación activa de carga (MT/Día).
* `consumption_disch_ifo` / `consumption_disch_mdo` *(NUMERIC)* → Consumo diario exigido a los motores/bombas durante la descarga a presión (MT/Día).

**KPIs Financieros de Control**
* `tce_required` *(NUMERIC)* → Rendimiento diario mínimo exigido por la gerencia para esa nave específica (USD/Día) para lograr el Break-Even corporativo.

---

### 2. Tabla: `bunker_prices` (Maestro de Inventario de Precios)
* `fuel_type` *(VARCHAR, PK)* → Tipo de bunker restringido por dominio (`CHECK (fuel_type IN ('IFO', 'MDO'))`).
* `market_price_usd` *(NUMERIC)* → Costo de inventario por tonelada métrica en dólares.
* `date` *(DATE, NOT NULL, DEFAULT CURRENT_DATE)* → Fecha de vigencia de la cotización de mercado. Permite auditar con qué precio histórico se corrió cada simulación.

---

### 3. Tabla: `routes` (Maestro de Tramos Marítimos)
* `origin_port_id` *(VARCHAR, PK, FK → ports.port_id)* → Puerto base de carga (ej. 'ILO').
* `destination_port_id` *(VARCHAR, PK, FK → ports.port_id)* → Puerto de destino (ej. 'MATARANI', 'MARCONA', 'MEJILLONES').
* `route_distance` *(NUMERIC)* → Distancia oficial medida en millas náuticas (NM).
* `weather_factor_laden` *(NUMERIC)* → Porcentaje de fricción operativa ambiental (pierna única; usar `weather_factor_laden` y `weather_factor_ballast` en el motor para viaje redondo).
* `color_hex` *(VARCHAR(7))* → Código de color de UI para el Dashboard (ej. "#06B6D4").
* `pais` *(TEXT, DEFAULT 'Peru')* → País del puerto de destino. **Regla de negocio:** `Mejillones` y `Barquito` = `'Chile'`; todos los demás puertos = `'Peru'`. Usado para clasificar operaciones como **Cabotaje** (Perú) vs. **exportación** (Chile) en el Análisis Gráfico.

> ⚠️ Los límites físicos de terminales **NO** se almacenan aquí para evitar duplicación (3NF). Viven en la tabla `ports`.

---

### 3.1. Tabla: `routes_spot` (Rutas Spot Multileg — Catálogo de Cotizaciones Complejas)
*Almacena rutas de múltiples piernas (posicionamiento + laden + retorno) diseñadas para clientes como NEXA con operaciones de exportación multiescala. Cada registro representa una ruta guardada desde el Ruteador Spot.*
* `spot_id` *(UUID, PK, DEFAULT gen_random_uuid())* → Identificador técnico único autogenerado.
* `name` *(VARCHAR, NOT NULL)* → Nombre amigable asignado por el usuario al grabar la ruta (ej. `'NEXA.ILO.CALLAO.MEJILLONES.ILO'`). **Es la clave funcional usada en la Matriz Financiera** — se prefija con `SPOT-` para identificar el motor paralelo.
* `description` *(VARCHAR)* → Autor o descripción libre de la ruta.
* `legs_data` *(JSONB, NOT NULL)* → Estructura completa de la ruta:
  ```json
  {
    "vessel_id": "TABLONES",
    "legs": {
      "positioning": { "origin_port_id": "...", "destination_port_id": "...", ... },
      "laden":       { "origin_port_id": "ILO", "destination_port_id": "MEJILLONES", "quantity": 12000, ... },
      "return":      { "origin_port_id": "MEJILLONES", "destination_port_id": "ILO", ... }
    }
  }
  ```
* `pais` *(TEXT, DEFAULT 'Peru')* → País de destino de la operación de exportación. **Regla de negocio:** se infiere automáticamente del `destination_port_id` de la **pierna laden** al guardar la ruta. Si el puerto destino laden es `MEJILLONES` o `BARQUITO` → `'Chile'`; caso contrario → `'Peru'`. Permite clasificar operaciones en el filtro **Tipo Op.** del Análisis Gráfico (Cabotaje = Perú / Chile).
* `created_at` *(TIMESTAMPTZ, DEFAULT now())* → Timestamp de creación del registro.

> 🔀 **Motor Paralelo:** Las líneas de proyección en `commercial_forecasts` que usan `origin_port_id = 'SPOT'` hacen join lógico contra esta tabla por el campo `name` (prefijado como `SPOT-{name}`) para ejecutar `calculate_spot_multileg` en lugar del motor estándar `calculate_voyage_pnl`.

---

### 3.2. Tabla: `ports` (Maestro de Puertos — Reglas y Límites Operativos del Terminal)
*Almacena las capacidades físicas y las demoras operativas estándar asociadas a cada puerto terminal.*
* `port_id` *(VARCHAR, PK)* → Identificador único del puerto (ej. 'ILO', 'MATARANI').
* `port_name` *(VARCHAR)* → Nombre comercial del terminal.
* `country` *(VARCHAR(2))* → Código de país ISO ('PE', 'CL').
* `max_load_rate` *(FLOAT, DEFAULT 9999)* → Límite físico máximo del terminal de **carga** en MT/hora (`t_load_rate` en la fórmula MIN). 9999 = sin restricción conocida.
* `max_disch_rate` *(FLOAT, DEFAULT 9999)* → Límite físico máximo del terminal de **descarga** en MT/hora (`p_disch_limit` en la fórmula MIN). Ej: MATARANI = 300 MT/hr.
* `lat` *(NUMERIC)* → Latitud geográfica para la representación geoespacial en el **Mapa Espaguetis** (ej: `-17.6394`).
* `lon` *(NUMERIC)* → Longitud geográfica para la representación geoespacial en el **Mapa Espaguetis** (ej: `-71.3375`).

**Relación con el motor:**
```
act_load  = MIN(c_load [contracts], v_intake [vessels], t_load_rate [ports.max_load_rate])
act_disch = MIN(c_disch [contracts], v_pump  [vessels], p_disch_limit [ports.max_disch_rate])
```

---

### 3.3. Tabla: `clients` (Maestro de Clientes Corporativos)
*Catálogo de clientes comerciales. Permite mantener identidad visual global.*
* `client_id` *(VARCHAR, PK)* → Identificador único comercial (ej. 'SPCC', 'SPOT').
* `client_name` *(VARCHAR)* → Razón social del cliente.
* `color_hex` *(VARCHAR(7))* → Código de color de UI para el Dashboard (ej. "#0369A1").
* `is_active` *(BOOLEAN, DEFAULT true)* → Define si el cliente es activo.
* `is_prospect` *(BOOLEAN, DEFAULT false)* → Define si el cliente es prospecto (mutuamente excluyente con `is_active`).

---

### 4. Tabla: `port_costs_matrix` (Matriz Desglosada de Costos Portuarios)
> 💡 **Ver Documento Vinculado:** [[port_costs]]
*Almacena la matriz de costos detallados y desglosados (remolcadores, pilotaje, lanchas, honorarios, etc.) por cliente, puerto, terminal y tipo de operación para cada buque específico.*
* `client_id` *(VARCHAR, PK)* ── ID del cliente comercial (ej. `'SPCC'`) o `'DEFAULT'` como fallback global.
* `port_id` *(VARCHAR, PK)* ── ID del puerto de la operación (ej. `'ILO'`, `'MATARANI'`).
* `terminal` *(VARCHAR, PK, DEFAULT 'GENERAL')* ── Terminal específico dentro del puerto (ej. `'TERMINAL_A'`, `'INTERACID'`, `'TERQUIM'`).
* `operation_type` *(VARCHAR, PK)* ── Tipo de operación: `CARGA` (Origen) o `DESCARGA` (Destino) (`CHECK (operation_type IN ('CARGA', 'DESCARGA'))`).
* `vessel_id` *(VARCHAR, PK)* ── ID del buque (ej. `'TABLONES'`, `'MOQUEGUA'`) o `'DEFAULT'` para fallback general.
* `concept_id` *(VARCHAR, PK, FK ── port_cost_concepts.concept_id)* ── Concepto de costo específico (ej. `'towage_1st'`, `'pilotage'`, `'lighthouse_dues'`, `'agency_fee'`, etc.).
* `cost` *(NUMERIC, DEFAULT 0)* ── Costo total calculado o tarifa base fija (USD).
* `rate_usd` *(NUMERIC)* ── Tarifa unitaria base en dólares.
* `multiplier_source` *(VARCHAR, DEFAULT 'FIXED')* ── Variable multiplicadora para cálculo de tarifa variable: `FIXED`, `LOA`, `TRB`, `DWT`, `PORT_HOURS`, `CARGO_TONS` (`CHECK (multiplier_source IN ('FIXED', 'LOA', 'TRB', 'DWT', 'PORT_HOURS', 'CARGO_TONS'))`).
* `min_limit` / `max_limit` *(NUMERIC)* ── Límites mínimos y máximos de cobro de tarifa.
* `calculation_formula_template` *(TEXT)* ── Plantilla o fórmula de cálculo dinámico para el motor.
* `origin_country` *(VARCHAR(2), DEFAULT NULL)* ── **[Agregado 2026-07-09]** Código ISO del país de procedencia del buque (`PE`, `CL`, `EC`). `NULL` = el concepto aplica independientemente del país de origen. Usada para discriminar la tarifa de **Lighthouse Dues**: mismo país (cabotaje) → `$0.03/GRT`; distinto país (exportación) → `$0.12/GRT`.


**Clave Primaria Compuesta:** `(client_id, port_id, terminal, operation_type, vessel_id, concept_id)`

#### 4.1. Tabla: `port_cost_concepts` (Catálogo de Conceptos de Costos Portuarios)
*Catálogo maestro que clasifica y define el tipo de cálculo de cada rubro portuario.*
* `concept_id` *(VARCHAR, PK)* ── Código único de concepto (ej. `'towage_1st'`, `'agency_fee'`).
* `concept_name` *(VARCHAR)* ── Nombre descriptivo comercial del concepto.
* `category` *(VARCHAR)* ── Categoría del costo: `shifting`, `general_port` o `agency` (`CHECK (category IN ('shifting', 'general_port', 'agency'))`).
* `default_calculation_type` *(VARCHAR, DEFAULT 'FIXED')* ── Tipo de cálculo base: `FIXED`, `VARIABLE_TIME`, `VARIABLE_TONS` (`CHECK (default_calculation_type IN ('FIXED', 'VARIABLE_TIME', 'VARIABLE_TONS'))`).

#### 4.2. Tabla: `port_cost_static` (Tarifas Planas de Costos Portuarios por Defecto — Duplicación Física)
*Almacena tarifas históricas consolidadas por puerto, cliente, operación y buque. Es la fuente de verdad primaria para las simulaciones de Forecast clásico y el Estimador Excel.*
* `client_id` *(VARCHAR, PK)* ── ID del cliente (ej. `'SPCC'`, `'NEXA'`) o `'DEFAULT'`.
* `port_id` *(VARCHAR, PK)* ── ID del puerto de la operación (ej. `'ILO'`).
* `operation_type` *(VARCHAR, PK)* ── Tipo de operación: `CARGA` (Origen) o `DESCARGA` (Destino).
* `vessel_id` *(VARCHAR, PK)* ── ID del buque (ej. `'MOQUEGUA'`, `'TABLONES'`) o `'DEFAULT'`.
* `cost` *(NUMERIC, DEFAULT 0)* ── Costo portuario consolidado aplicable (USD).

> ⚠️ **Arquitectura Fallback (Transición Gradual):**
> La tabla `agency_matrix` fue duplicada físicamente en la nueva tabla `port_cost_static` para el uso exclusivo de Forecast. La tabla `agency_matrix` se mantiene viva únicamente como respaldo histórico. 
> Al realizar una simulación, el motor de forecast busca de forma prioritaria en `port_costs_matrix` (costos desglosados); si no existen registros, realiza un **fallback automático** a la tabla plana `port_cost_static`.

---

### 5. Tabla: `contracts` (Maestro de Contratos y Reglas Comerciales)
*Cabecera que agrupa las reglas operativas, comisiones y recargo por combustible para un tramo Origen-Destino de un cliente. Soporta versionado histórico.*
* `contract_id` *(VARCHAR, PK)* → Identificador legible de contrato (ej. `'SPCC_2025'`). Permite historizar múltiples versiones compartiendo el mismo código mediante clave primaria compuesta con la ruta.
* `client_id` *(VARCHAR)* → ID del cliente comercial (ej. SPCC).
* `origin_port_id` *(VARCHAR, PK, NOT NULL, DEFAULT 'ILO')* → Puerto de origen del viaje. Parte de la clave primaria.
* `destination_port_id` *(VARCHAR, PK)* → Puerto de destino final de la carga. Parte de la clave primaria.
* `is_active` *(BOOLEAN, NOT NULL, DEFAULT TRUE)* → Flag de vigencia. Solo el contrato activo se usa en simulaciones.
* `valid_from` *(DATE, NOT NULL, DEFAULT '2025-01-01')* → Fecha de inicio de vigencia del contrato.
* `valid_to` *(DATE)* → Fecha de fin de vigencia.
* `bunker_baseline_price_ifo` *(NUMERIC)* → Precio base del combustible pactado en la firma del contrato (referencia para cálculo BAF).
* `baf_rules` *(JSONB)* → Reglas flexibles del Bunker Adjustment Factor.
* `load_rate` / `discharge_rate` *(NUMERIC)* → Tasas operativas contractuales de carga y descarga (MT/hora).
* `time_to_count_carga_hrs` *(NUMERIC, DEFAULT 6.0)* → Tiempo muerto estándar pactado (conexión de mangueras, papelería aduanera) en puerto de origen (Time to Count) antes de iniciar carga.
* `time_to_count_descarga_hrs` *(NUMERIC, DEFAULT 6.0)* → Tiempo muerto estándar pactado en puerto de destino antes de iniciar descarga.
* `maneuver_carga_hrs` *(NUMERIC, DEFAULT 0)* → Horas adicionales requeridas para la maniobra de posicionamiento del buque antes de la carga.
* `maneuver_descarga_hrs` *(NUMERIC, DEFAULT 0)* → Horas adicionales requeridas para la maniobra de posicionamiento del buque antes de la descarga.
* `address_commission` *(NUMERIC, DEFAULT 0.00)* → Comisión de dirección comercial deducible directa del flete bruto (%).
* `broker_commission` *(NUMERIC, DEFAULT 0.00)* → Comisión de corretaje pagada a brokers intermediarios deducible del flete (%).

**Clave Primaria Compuesta:** `(contract_id, origin_port_id, destination_port_id)`
— Permite que un contrato macro legible (ej. `'SPCC_2025'`) tenga múltiples rutas asociadas como filas únicas.

**Índice único activo:** `(client_id, origin_port_id, destination_port_id) WHERE is_active = TRUE`
— Garantiza que solo exista un contrato activo por ruta en cada momento.

**Flujo de renovación:**
```sql
-- 1. Desactivar contrato vigente
UPDATE contracts SET is_active = FALSE, valid_to = CURRENT_DATE
WHERE client_id = 'SPCC' AND origin_port_id = 'ILO' AND destination_port_id = 'MATARANI' AND is_active = TRUE;

-- 2. Insertar nueva versión con nuevas tarifas
INSERT INTO contracts (client_id, origin_port_id, destination_port_id, is_active, valid_from, load_rate, discharge_rate)
VALUES ('SPCC', 'ILO', 'MATARANI', TRUE, CURRENT_DATE, 500, 450);

-- 3. Insertar brackets de tarifa al nuevo contract_id
INSERT INTO contract_tariffs (contract_id, min_tonnage, max_tonnage, freight_rate)
VALUES ('{nuevo_uuid}', 13001, 13500, 21.50);
```

### 5.1. Tabla: `contract_tariffs` (Matriz de Brackets de Flete Comercial)
*Tabla hija subordinada al contrato maestro, define los fletes base según el tonelaje transportado. Al usar una FK compuesta, expone explícitamente el origen y destino directamente en la tarifa.*
* `contract_id` *(VARCHAR, PK, FK → contracts.contract_id)* → ID legible del contrato padre.
* `origin_port_id` *(VARCHAR, PK, FK → contracts.origin_port_id)* → Puerto de origen, heredado y visible directamente en la tarifa.
* `destination_port_id` *(VARCHAR, PK, FK → contracts.destination_port_id)* → Puerto de destino, heredado y visible directamente en la tarifa.
* `min_tonnage` *(NUMERIC, PK)* → Límite inferior del rango de volumen.
* `max_tonnage` *(NUMERIC, PK)* → Límite superior del rango de volumen.
* `freight_rate` *(NUMERIC)* → Tarifa de flete asignada por tonelada métrica (USD/MT).

**Clave Primaria Compuesta:** `(contract_id, origin_port_id, destination_port_id, min_tonnage, max_tonnage)`

**Clave Foránea Compuesta:** `(contract_id, origin_port_id, destination_port_id) REFERENCES contracts(contract_id, origin_port_id, destination_port_id) ON DELETE CASCADE`

> ⚠️ **Migración crítica (20260626000011):** Se migró `contract_id` a tipo `VARCHAR` para usar nombres comerciales legibles (ej: `'SPCC_2025'`). Se redefinió la relación como una FK compuesta que incluye `origin_port_id` y `destination_port_id`, haciendo visible el puerto de origen y destino directamente en las tarifas y permitiendo que un mismo ID de contrato abarque múltiples tramos de ruta con integridad referencial garantizada.

#### 💡 Análisis de Diseño E-R y Bitácora de Migración (¿Por qué fallaron los primeros intentos SQL?)

##### A. Lógica y Ventajas de la Relación E-R Compuesta
1. **Identificadores Legibles de Contratos**: En lugar de UUIDs autogenerados crípticos, el contrato del cliente se identifica como un código comercial comprensible (ej. `'SPCC_2025'`).
2. **Un Contrato Macro, Múltiples Tramos**: Un solo acuerdo comercial (ej. `'SPCC_2025'`) puede gobernar diferentes rutas (orígenes/destinos). Al conformar la clave primaria de `contracts` como compuesta `(contract_id, origin_port_id, destination_port_id)`, el sistema permite registrar condiciones operativas y recargos distintos por ruta sin colisionar y sin requerir de IDs de contrato duplicados.
3. **Visibilidad Directa de Ruta en Tarifas**: La tabla `contract_tariffs` hereda la clave compuesta completa. Al tener explícitamente `origin_port_id` y `destination_port_id` en las filas de tarifas, cualquier persona o proceso de auditoría puede ver de forma directa de qué ruta se trata sin necesidad de realizar obligatoriamente un `JOIN` con la tabla padre `contracts`.

##### B. Lección Técnica: ¿Por qué fallaron las ejecuciones de SQL iniciales?
Las migraciones DDL secuenciales en bases de datos relacionales con datos preexistentes son delicadas. Tuvimos que corregir el script debido a dos errores de colisión de restricciones:

* **Error 1: Violación de Restricción Única en `contracts_pkey`**:
  * *Qué causó el fallo*: Intentamos actualizar todos los contratos activos a `'SPCC_2025'` antes de haber eliminado la clave primaria antigua (que sólo era `contract_id`).
  * *Explicación*: Como la base de datos tenía tres filas (MATARANI, MARCONA y MEJILLONES) y la clave primaria exigía unicidad para `contract_id`, actualizar la segunda fila a `'SPCC_2025'` provocó un error de duplicados.
  * *Solución*: Se eliminó la clave primaria antigua y se creó la clave compuesta `(contract_id, origin_port_id, destination_port_id)` *mientras las filas aún tenían UUIDs únicos*, y recién después se corrió el UPDATE masivo.

* **Error 2: Violación de Restricción Única en `contract_tariffs_pkey`**:
  * *Qué causó el fallo*: Una vez resuelto el problema de la cabecera, al ejecutar `UPDATE contract_tariffs SET contract_id = 'SPCC_2025'` chocaron los brackets.
  * *Explicación*: La clave primaria de tarifas era `(contract_id, min_tonnage, max_tonnage)`. Dado que los brackets de tonelaje se repiten en diferentes rutas (ej: de `10000.00` a `11500.00` existe para MATARANI y para MARCONA), al cambiar los diferentes UUIDs al valor común `'SPCC_2025'`, Postgres detectó duplicados.
  * *Solución*: Aplicar el mismo patrón: eliminar la clave primaria antigua de `contract_tariffs` y redefinirla a compuesta incluyendo los puertos *antes* de sobrescribir el `contract_id` de las tarifas a `'SPCC_2025'`.

* **Conclusión**: El orden lógico correcto en migraciones de datos preexistentes que cambian de clave única simple a clave compuesta común es desconectar las FKs, redefinir las PKs como compuestas mientras la columna clave es única (UUIDs), ejecutar las actualizaciones a la clave común comercial, y finalmente reconstruir las FKs compuestas.


---

### 6. Tabla: `audit_benchmarks` (Valores Reales del Excel — Benchmarks de Auditoría)
*Almacena los valores operativos reales extraídos de los Exceles corporativos de Voyage Calculations para comparación contra el motor Geeksoft.*
* `scenario_key` *(VARCHAR, PK)* → Identificador del escenario (ej. `'TABLONES-ILO-MATARANI'`).
* `act_load` *(NUMERIC)* → Tasa de carga real ejecutada (MT/hr).
* `act_disch` *(NUMERIC)* → Tasa de descarga real ejecutada (MT/hr).
* `port_days` *(NUMERIC)* → Días de puerto reales.
* `sea_days` *(NUMERIC)* → Días de mar reales.
* `bunker_costs` *(NUMERIC)* → Costo total de bunker real (USD).
* `voyage_result` *(NUMERIC)* → Resultado de viaje real del Excel (USD).
* `total_duration` *(NUMERIC)* → Duración total real del viaje (días).
* `tce_real` *(NUMERIC)* → TCE diario real calculado en el Excel (USD/día).
* `pl_vs_req` *(NUMERIC)* → Utilidad nominal real vs. TCE requerido (USD).
* `additional_expenses` *(NUMERIC, DEFAULT 0)* → Gastos adicionales imprevistos del Excel (ej. Loading Master, amarras extra). **⚠️ Pendiente de agregar vía ALTER TABLE.**

> 📌 **Estado:** Los valores actuales están hardcodeados en el frontend (`VoyageLedgerTest.tsx`). El plan es poblar esta tabla desde el scraper `scrape_voyages.py` y eliminar el hardcode.

---

### 7. Tabla: `commercial_forecasts` (Tabla Transaccional de Escenarios Guardados)
*Almacena los escenarios y corridas completas de forecast guardadas por los usuarios desde la interfaz.*
* `id` *(UUID, PK)* ── Identificador técnico único autogenerado (`uuid_generate_v4()`).
* `name` *(TEXT)* ── Nombre amigable del forecast asignado por el usuario.
* `user_id` *(TEXT)* ── Identificador de usuario propietario.
* `start_date` *(TEXT)* ── Fecha de inicio de la simulación ('YYYY-MM-DD').
* `end_date` *(TEXT)* ── Fecha de fin de la simulación ('YYYY-MM-DD').
* `projection_lines` *(JSONB)* ── Listado de líneas simuladas con sus volúmenes y frecuencias.
* `created_at` / `updated_at` *(TIMESTAMPTZ)* ── Fechas de registro de auditoría (`now()`).

---

### 8. Tabla: `vessel_trips` (Tabla Transaccional de Viajes Ejecutados/Planificados)
*Registro físico de los viajes concretos realizados o proyectados por la flota para lookups operativos directos.*
* `trip_id` *(UUID, PK)* ── Identificador único autogenerado (`gen_random_uuid()`).
* `vessel_id` *(VARCHAR, FK → vessels.vessel_id)* ── Buque asignado al viaje.
* `origin_port_id` *(VARCHAR, FK → routes.origin_port_id)* ── Puerto de carga.
* `destination_port_id` *(VARCHAR, FK → routes.destination_port_id)* ── Puerto de descarga.
* `client_id` *(VARCHAR)* ── Cliente corporativo que contrata el viaje.
* `quantity` *(NUMERIC)* ── Volumen neto de carga transportada (MT).
* `contract_agreed_load_rate` *(NUMERIC)* ── Ritmo de carga contractual aplicado.
* `contract_agreed_discharge_rate` *(NUMERIC)* ── Ritmo de descarga contractual aplicado.
* `bunker_price_ifo_actual` *(NUMERIC)* ── Tarifa de bunker pactada o tomada para la corrida.
* `created_at` *(TIMESTAMPTZ)* ── Fecha de registro del viaje (`now()`).

**Claves Foráneas Compuestas:**
- `(origin_port_id, destination_port_id)` referencias a `routes(origin_port_id, destination_port_id)`.

---

### 9. Tabla: `sources_sinks` (Maestro de Capacidades Anuales por Puerto)
*Almacena la capacidad de volumen anual de carga/descarga de cada terminal para modelos de optimización y balances.*
* `port_id` *(VARCHAR, PK, FK → ports.port_id)* ── Puerto evaluado.
* `year` *(INTEGER, PK)* ── Año fiscal de vigencia.
* `capacity_mt` *(NUMERIC)* ── Capacidad anual de volumen de ácido (MT).
* `type` *(VARCHAR)* ── Clasificación del terminal: `'SOURCE'` (Origen/Producción) o `'SINK'` (Destino/Consumo).

---

### 10. Tabla: `agency_matrix` (Histórico de Costos de Agencia)
*Matriz histórica de costos base de agencia y servicios portuarios para lookups de respaldo.*
* `client_id` *(VARCHAR, PK)* ── Cliente comercial.
* `port_id` *(VARCHAR, PK)* ── Puerto de escala.
* `operation_type` *(VARCHAR, PK)* ── Tipo de maniobra (`CARGA` / `DESCARGA`).
* `vessel_id` *(VARCHAR, PK, DEFAULT 'DEFAULT')* ── Buque asignado o fallback general.
* `cost` *(NUMERIC)* ── Costo total consolidado de agencia (USD).
* `loading_master_cost` *(NUMERIC, DEFAULT 0.0)* ── Costo específico de servicio de Loading Master (USD).

---

## 💡 Instrucción de Contexto para el Agente (Antigravity IDE):
> "El agente utilizará este esquema físico estructurado para cruzar las variables lógicas en Supabase. El backend en FastAPI extraerá algebraicamente los tiempos de carga, descarga y tiempos muertos para multiplicarlos de forma matricial aplicando la sumatoria de consumos por fase (`SUM(t_fase * c_fase)`), barriendo los campos granulares de la tabla `vessels` y extrayendo los costos dinámicos de la tabla `bunker_prices`."

---

## 📋 Changelog del Esquema y del Modelo de Datos

### 🗓️ 2026-07-08 — Corrección de Integridad en `commercial_forecasts.projection_lines`

**Tabla afectada:** `commercial_forecasts` (campo `projection_lines` tipo JSONB)

#### Regla de integridad de llave compuesta en `projection_lines`

Cada elemento del array `projection_lines` representa una línea de simulación. Se descubrió un **bug de duplicidad silenciosa** en el frontend que producía dos registros para el mismo mes/ruta/buque/cliente cuando el usuario editaba la frecuencia de un viaje. La causa fue que el código de React solo comparaba `destination_port_id` (ignorando `origin_port_id`) al buscar la línea a actualizar.

**Regla de negocio crítica derivada:**
> La llave natural de cada elemento de `projection_lines` es la combinación de **5 campos**: `client_id + origin_port_id + destination_port_id + vessel_id + month_index`. Deben ser únicos en el array. Cualquier lógica frontend o backend que lea, actualice o deduplique este array debe validar los 5 campos.

**Estructura canónica de un elemento de `projection_lines`:**
```json
{
  "client_id": "SPCC",
  "origin_port_id": "ILO",
  "destination_port_id": "MARCONA",
  "vessel_id": "MOQUEGUA",
  "month_index": "2027-01",
  "quantity": 13500,
  "monthly_frequency": 2,
  "custom_tariff": null,
  "forecast_bunker_price_ifo": null,
  "forecast_bunker_price_mdo": null
}
```

**Corrección aplicada en el frontend (`CommercialForecast.tsx`):**
- `handleFrequencyChange` y `handleTariffChange` ahora comparan los 5 campos al hacer `findIndex`.
- `handleLoadSelected` aplica deduplicación automática con `Map<string, any>` usando la llave compuesta `client-origin-dest-vessel-month` al cargar escenarios desde Supabase.

> ⚠️ **Nota de Deuda Técnica:** Los escenarios grabados con anterioridad a esta corrección podrían contener registros duplicados en el campo JSONB `projection_lines`. La deduplicación en `handleLoadSelected` los cura en memoria al cargar, pero no los reescribe en la BD. Si se desea una limpieza permanente, se debe ejecutar un script de migración sobre la tabla `commercial_forecasts` que aplique la misma lógica de deduplicación sobre el campo JSONB directamente en Supabase.

---

### 🗓️ 2026-07-08 — Actualización de `vessels` (Asset Visual)

**Tabla afectada:** `vessels` (campo visual en frontend, no en BD)

- La fotografía del buque **MOQUEGUA** fue actualizada en el Maestro de Buques (`VesselsMaster_V2.tsx`). El archivo en el servidor es `public/moquegua_1.jpg`. El campo `vessel_id = 'MOQUEGUA'` no cambia; el mapeo es hardcodeado en el frontend.

---

### 🗓️ 2026-07-08 — Clarificación de Clientes del `ForecastBuilder_V2`

**Tabla afectada:** `routes_spot` (tabla `spots` en Supabase)

Se documentó la siguiente **regla de clasificación de clientes** en el selector de la Matriz Financiera:

| Tipo de cliente | Origen de rutas | Aparición en selector |
|---|---|---|
| `SPCC` | Rutas simples hardcodeadas en frontend (`ILO-MATARANI`, `ILO-MARCONA`, `ILO-MEJILLONES`) | **Fijo garantizado** |
| `NEXA` y futuros | Rutas multicotizador con `legs_data.is_multicotizador = true` en tabla `spots` | **Dinámico** desde BD |

> Al agregar un nuevo cliente al sistema con rutas multicotizador complejas, simplemente se graban sus rutas en la tabla `spots` con la bandera `is_multicotizador: true` y aparecerá automáticamente en el selector. Si el cliente tiene rutas simples (sin multicotizador), debe agregarse explícitamente al array `fixedClients` en `ForecastBuilder_V2.tsx`.

---

### 🗓️ 2026-07-09 — Inclusión de Estados de Clientes Activos y Prospectos

**Tabla afectada:** `clients` (Nuevas columnas booleanas `is_active` e `is_prospect`)

Se agregaron a la tabla `clients` de Supabase las columnas `is_active` (`BOOLEAN`, por defecto `true`) e `is_prospect` (`BOOLEAN`, por defecto `false`).

**Regla crítica de negocio en BD:**
> Un cliente corporativo registrado en el maestro solo puede poseer un estado activo o prospecto de manera mutuamente excluyente. No es posible que un cliente sea catalogado en ambos estados simultáneamente.

**Impacto en la API (FastAPI backend):**
- El esquema de datos de Pydantic (`ClientMaster` en `forecast_models.py`) se actualizó para incorporar los atributos booleanos.
- La transacción del endpoint `POST /masters/clients` (en `forecast.py`) ahora mapea de forma nativa e inyecta estos campos en el `UPSERT` sobre Supabase.
- El script de despliegue del VPS (`deploy_backend.py`) se modificó para transferir `forecast_models.py` en cada despliegue, solucionando caídas por discrepancia en el esquema de clases en producción.