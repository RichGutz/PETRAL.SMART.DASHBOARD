## 🗺️ La Arquitectura del Maestro de Costos Aduaneros (Agency Costs)

Para modelar esto de forma limpia en tu Obsidian y en las tablas relacionales de **Supabase**, debemos crear una **tabla de cruce o matriz**. El costo ya no depende solo del puerto, sino de la combinación **Puerto + Cliente + Operación**.

Aquí tienes la nota completita estructurada para tu Obsidian, lista para que tus agentes de **Antigravity IDE** creen la base de datos relacional:

# ⚓ Maestro — Costos de Agencia y Aduanas (Matriz Comercial por Volumen)

Este archivo maestro indexa las tarifas de agenciamiento marítimo, aduanas e impuestos locales (`agency_costs`). A diferencia de un maestro estático, este modelo implementa una **matriz relacional cruzada** basada en el volumen del cliente para garantizar la competitividad en las cotizaciones SPOT y contratos de largo plazo.

## 📊 1. Estructura de la Matriz Relacional (Datos Maestros)

El sistema evaluará el costo de aduana buscando la coincidencia exacta de cuatro llaves: `client_id` + `port_id` + `operation_type` (Carga/Descarga) + `vessel_id`.

### 🏢 Cliente: SPCC (Southern Peru Copper Corporation) — Tarifas Corporativas por Alto Volumen

|**Puerto (port_id)**|**Operación (operation_type)**|**Variable de Costo**|**Tarifa Comercial (USD)**|
|---|---|---|---|
|**ILO**|CARGA|`agency_costs_origin`|$23,000.00|
|**MATARANI**|DESCARGA|`agency_costs_destination`|$18,000.00|
|**SAN JUAN DE MARCONA**|DESCARGA|`agency_costs_destination`|$44,000.00|
|**MEJILLONES**|DESCARGA|`agency_costs_destination`|$32,000.00|

### 🏢 Cliente: NEXA RESOURCES — Tarifas de Volumen Medio (Ejemplo)

|**Puerto (port_id)**|**Operación (operation_type)**|**Variable de Costo**|**Tarifa Comercial (USD)**|
|---|---|---|---|
|**ILO**|CARGA|`agency_costs_origin`|$25,500.00 // (Tarifa estándar sin descuento por volumen)|
|**MATARANI**|DESCARGA|`agency_costs_destination`|$21,000.00|

### 👤 Cliente: DEFAULT / SPOT (Para clientes nuevos sin contrato de volumen)

- Si el cliente no existe en la matriz, el sistema aplicará un _fallback_ a una tarifa plana de lista (penalizada en +15% por falta de volumen recurrente).
    

## 📐 2. Regla de Negocio e Integración al Motor P&L

El agente de desarrollo modificará el método de desempaque de variables en el backend para que los costos de aduana dejen de ser propiedades fijas del puerto y pasen a ser consultas dinámicas (Lookups).

### Lógica de Consulta en el Backend:

Plaintext

```
// En lugar de: ag_orig = puerto_origen.costs
// El sistema ahora ejecuta un query relacional:

ag_orig = DB.query(
    "SELECT cost FROM agency_matrix WHERE client_id = @vessel_trip.client_id AND port_id = @vessel_trip.origin_port_id AND operation_type = 'CARGA' AND vessel_id = @vessel_trip.vessel_id"
)

IF ag_orig IS NULL THEN
    ag_orig = DB.query("SELECT cost FROM agency_matrix WHERE client_id = 'DEFAULT' AND port_id = @vessel_trip.origin_port_id AND operation_type = 'CARGA' AND vessel_id = 'DEFAULT'")
ENDIF
```

## 🔗 Relaciones Lógicas en Obsidian

- Esta nota modifica los inputs de costos del backend: `[[CT-01-Motor-Calculo-PL-Simetrico]]`.
    
- Modifica la estructura de datos que almacenará **Supabase** en el módulo de configuración de contratos.
    

## 💡 Instrucción de Contexto para el Agente (Antigravity IDE):

El agente debe programar el backend para que realice el lookup de costos de aduana cruzando el cliente con el puerto. Debe respetarse la regla de fallback: si la combinación específica (Cliente + Puerto) no arroja resultados en la base de datos, el sistema jalará los costos de la fila `client_id = 'DEFAULT'` para ese puerto, evitando que la simulación se detenga por falta de datos."