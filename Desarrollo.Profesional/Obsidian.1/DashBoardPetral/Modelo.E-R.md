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
*Cabecera que agrupa las reglas operativas y de recargo por combustible para un tramo Origen-Destino de un cliente. Soporta versionado histórico: cuando se renueva un contrato, se inserta una nueva fila con `is_active = TRUE` y se desactiva la anterior.*
* `contract_id` *(VARCHAR, PK)* → Identificador legible de contrato (ej. `'SPCC_2025'`). Permite historizar múltiples versiones compartiendo el mismo código mediante clave primaria compuesta con la ruta.
* `client_id` *(VARCHAR)* → ID del cliente comercial (ej. SPCC).
* `origin_port_id` *(VARCHAR, PK, NOT NULL, DEFAULT 'ILO')* → Puerto de origen del viaje. Parte de la clave primaria.
* `destination_port_id` *(VARCHAR, PK)* → Puerto de destino final de la carga. Parte de la clave primaria.
* `is_active` *(BOOLEAN, NOT NULL, DEFAULT TRUE)* → Flag de vigencia. Solo el contrato activo se usa en simulaciones. Al renovar: `UPDATE SET is_active = FALSE` al viejo, `INSERT` el nuevo.
* `valid_from` *(DATE, NOT NULL, DEFAULT '2025-01-01')* → Fecha de inicio de vigencia del contrato.
* `valid_to` *(DATE)* → Fecha de fin de vigencia.
* `bunker_baseline_price_ifo` *(NUMERIC)* → Precio base del combustible pactado en la firma del contrato (referencia para cálculo BAF).
* `baf_rules` *(JSONB)* → Reglas flexibles del Bunker Adjustment Factor (ej. `{"type": "goal_seek_inverse", "trigger_percentage": 0.05}`).
* `load_rate` / `discharge_rate` *(NUMERIC)* → Tasas operativas contractuales de carga y descarga (MT/hora).

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

### 7. Tabla: `simulations` (Tabla Transaccional de Consultas)
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