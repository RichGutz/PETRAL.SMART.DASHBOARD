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
* `dwt` *(NUMERIC)* → Deadweight Tonnage (Tonelaje de peso muerto total).
* `dwcc` *(NUMERIC)* → Deadweight Cargo Capacity (Tonelaje útil real de carga comercial).

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
* `weather_factor` *(NUMERIC)* → Porcentaje de fricción operativa ambiental (pierna única; usar `weather_factor_laden` y `weather_factor_ballast` en el motor para viaje redondo).

> ⚠️ Los límites físicos de terminales **NO** se almacenan aquí para evitar duplicación (3NF). Viven en la tabla `ports`.

---

### 3.1. Tabla: `ports` (Maestro de Puertos — Límites Físicos de Terminales)
*Almacena las capacidades físicas de cada terminal portuario. Al separar estos datos de `routes`, un solo UPDATE en `ports` impacta automáticamente todas las rutas que pasan por ese puerto.*
* `port_id` *(VARCHAR, PK)* → Identificador único del puerto (ej. 'ILO', 'MATARANI').
* `port_name` *(VARCHAR)* → Nombre comercial del terminal.
* `country` *(VARCHAR(2))* → Código de país ISO ('PE', 'CL').
* `max_load_rate` *(FLOAT, DEFAULT 9999)* → Límite físico máximo del terminal de **carga** en MT/hora (`t_load_rate` en la fórmula MIN). 9999 = sin restricción conocida.
* `max_disch_rate` *(FLOAT, DEFAULT 9999)* → Límite físico máximo del terminal de **descarga** en MT/hora (`p_disch_limit` en la fórmula MIN). Ej: MATARANI = 300 MT/hr.
* `overhead_carga_hrs` *(NUMERIC, DEFAULT 6.0)* → Tiempo muerto estándar (conexión de mangueras, papelería aduanera) en puerto de origen.
* `overhead_descarga_hrs` *(NUMERIC, DEFAULT 6.0)* → Tiempo muerto estándar (desconexión, inspecciones) en puerto de destino.

**Relación con el motor:**
```
act_load  = MIN(c_load [contracts], v_intake [vessels], t_load_rate [ports.max_load_rate])
act_disch = MIN(c_disch [contracts], v_pump  [vessels], p_disch_limit [ports.max_disch_rate])
```

---

### 4. Tabla: `agency_matrix` (Matriz Cruzada de Costos Portuarios)
* `client_id` *(VARCHAR, PK)* → ID del cliente contratante o 'DEFAULT' como fallback global de tarifa aduanera.
* `port_id` *(VARCHAR, PK)* → Puerto de la operación.
* `operation_type` *(VARCHAR, PK)* → Naturaleza del evento en muelle (`CHECK (operation_type IN ('CARGA', 'DESCARGA'))`).
* `vessel_id` *(VARCHAR, PK)* → ID del navío que realiza el viaje (ej. 'TABLONES') o 'DEFAULT' para fallback genérico.
* `cost` *(NUMERIC)* → Gasto fijo estipulado de agencia aduanera en dólares.

---

### 5. Tabla: `contracts` (Maestro de Contratos y Reglas Comerciales)
*Cabecera que agrupa las reglas operativas y de recargo por combustible para un par Cliente-Destino.*
* `contract_id` *(UUID, PK)* → Identificador único automático generado por Supabase (`gen_random_uuid()`).
* `client_id` *(VARCHAR)* → ID del cliente comercial (ej. SPCC).
* `destination_port_id` *(VARCHAR)* → Puerto de destino final de la carga.
* `bunker_baseline_price` *(NUMERIC)* → Precio base del combustible pactado en la firma del contrato.
* `baf_rules` *(JSONB)* → Reglas flexibles del Bunker Adjustment Factor (ej. `{"type": "goal_seek_inverse", "trigger_percentage": 0.05}`).
* `load_rate` / `discharge_rate` *(NUMERIC)* → Tasas operativas contractuales de carga y descarga (MT/hora).

### 5.1. Tabla: `contract_tariffs` (Matriz de Brackets de Flete Comercial)
*Tabla hija subordinada al contrato maestro, define los fletes base según el tonelaje transportado.*
* `contract_id` *(UUID, PK, FK references contracts.contract_id)* → Relación al contrato cabecera.
* `min_tonnage` *(NUMERIC, PK)* → Límite inferior del rango de volumen.
* `max_tonnage` *(NUMERIC, PK)* → Límite superior del rango de volumen.
* `freight_rate` *(NUMERIC)* → Tarifa de flete asignada por tonelada métrica (USD/MT).

---

### 6. Tabla: `simulations` (Tabla Transaccional de Consultas)
* `simulation_id` *(UUID, PK)* → Identificador único automático generado por Supabase (`gen_random_uuid()`).
* `vessel_id` *(VARCHAR o UUID, FK references vessels.vessel_id)* → Buque seleccionado para la corrida.
* `origin_port_id` *(VARCHAR, FK references routes.origin_port_id)* → Puerto base de origen.
* `destination_port_id` *(VARCHAR, FK references routes.destination_port_id)* → Puerto de destino.
* `client_id` *(VARCHAR)* → Cliente corporativo evaluado.
* `quantity` *(NUMERIC)* → Volumen de Ácido Sulfúrico inyectado en la simulación (MT).
* `is_round_trip` *(BOOLEAN)* → Flag comercial para el cálculo dinámico de la distancia (Round Trip vs One Way).
* `contract_agreed_load_rate` *(NUMERIC)* → Tasa pactada comercial de carga (MT/Hora).
* `contract_agreed_discharge_rate` *(NUMERIC)* → Tasa pactada comercial de descarga (MT/Hora).
* `created_at` *(TIMESTAMPTZ)* → Registro de auditoría temporal del cálculo (`now()`).

---

## 💡 Instrucción de Contexto para el Agente (Antigravity IDE):
> "El agente utilizará este esquema físico estructurado para cruzar las variables lógicas en Supabase. El backend en FastAPI extraerá algebraicamente los tiempos de carga, descarga y tiempos muertos para multiplicarlos de forma matricial aplicando la sumatoria de consumos por fase (`SUM(t_fase * c_fase)`), barriendo los campos granulares de la tabla `vessels` y extrayendo los costos dinámicos de la tabla `bunker_prices`."