# 📑 Maestro — Tarifas de Flete Contractuales (Matriz de Precios por Volumen)

Este archivo maestro indexa las tarifas oficiales de flete marítimo pactadas por contrato con los clientes. El motor de cálculo de **Geeksoft** realiza un lookup dinámico en esta matriz utilizando tres llaves de cruce: `client_id` + `destination_port_id` + `quantity`, inyectando automáticamente el valor correcto de `freight_rate` en la simulación financiera.

## 📅 1. Metadatos del Contrato Base (SPCC)

- **contract_reference:** "Tarifas de flete vigentes.STM.PET.001.2025.xlsx"
    
- **client_id:** "SPCC" (Southern Peru Copper Corporation)
    
- **origin_port_id:** "ILO" // Puerto base de carga unificado para ácido sulfúrico
    

## 📊 2. Matriz de Brackets de Flete (Tarifas en USD/MT)

El sistema evaluará los límites inclusivos utilizando una condición lógica de rangos (`min_tonnage <= quantity AND max_tonnage >= quantity`).

### 📍 Destino: MATARANI (`destination_port_id: "MATARANI"`)

- **Tipo de Operación:** CABOTAJE SUR (PERÚ)
    

|**Rango Mínimo (min_tonnage)**|**Rango Máximo (max_tonnage)**|**Tarifa de Flete (freight_rate)**|**Nota Comercial**|
|---|---|---|---|
|10,000.00 MT|11,500.00 MT|**$20.12 USD**|Lote mínimo contractual|
|11,501.00 MT|13,000.00 MT|**$19.52 USD**|Lote estándar intermedio|
|13,001.00 MT|13,500.00 MT|**$19.01 USD**|**Caso de Prueba Base (Tablones)**|
|13,600.00 MT|14,500.00 MT|**$18.92 USD**|Lote de alta eficiencia económica|

### 📍 Destino: SAN JUAN DE MARCONA (`destination_port_id: "MARCONA"`)

- **Tipo de Operación:** CABOTAJE (PERÚ)
    

|**Rango Mínimo (min_tonnage)**|**Rango Máximo (max_tonnage)**|**Tarifa de Flete (freight_rate)**|**Nota Comercial**|
|---|---|---|---|
|10,000.00 MT|11,500.00 MT|**$25.87 USD**|Tarifa base Marcona|
|11,501.00 MT|13,000.00 MT|**$23.12 USD**|Descuento por volumen medio|
|13,001.00 MT|13,500.00 MT|**$22.82 USD**|Descuento por volumen alto|
|13,600.00 MT|14,500.00 MT|**$21.77 USD**|Máxima optimización de flete|

### 📍 Destino: MEJILLONES (`destination_port_id: "MEJILLONES"`)

- **Tipo de Operación:** EXPORTACIÓN INTERNACIONAL (CHILE)
    

|**Rango Mínimo (min_tonnage)**|**Rango Máximo (max_tonnage)**|**Tarifa de Flete (freight_rate)**|**Nota Comercial**|
|---|---|---|---|
|10,000.00 MT|11,500.00 MT|**$23.23 USD**|Tarifa base tramo internacional|
|11,501.00 MT|13,000.00 MT|**$21.87 USD**|Escala intermedia Chile|
|13,001.00 MT|13,500.00 MT|**$20.87 USD**|Escala óptima de flete exterior|
|13,600.00 MT|14,500.00 MT|**$19.92 USD**|Tarifa preferencial por volumen masivo|

### 📍 Destino: CALLAO (`destination_port_id: "CALLAO"`)

- **Tipo de Operación:** CABOTAJE CENTRO (PERÚ) — LOTES MENORES
    

|**Rango Mínimo (min_tonnage)**|**Rango Máximo (max_tonnage)**|**Tarifa de Flete (freight_rate)**|**Nota Comercial**|
|---|---|---|---|
|3,000.00 MT|5,000.00 MT|**$47.13 USD**|Lote spot restringido por alta tarifa|

## ⚙️ 3. Lógica de Fallback y Control en Base de Datos

Si un usuario intenta cotizar un volumen que no encaja en ningún rango de contrato o selecciona un cliente nuevo, el backend de la API debe ejecutar las siguientes validaciones:

1. **Clientes con Contrato Vigente:** El campo `freight_rate` se bloqueará en el frontend (Read-Only) y se inyectará automáticamente el valor de la matriz. Si el tonelaje ingresado se sale de las escalas configuradas, el sistema arrojará un error de validación: `"Volumen fuera de rango contractual establecido"`.
    
2. **Clientes SPOT / Sin Contrato:** El sistema liberará el campo de entrada en la interfaz gráfica para que el área comercial digite de forma manual la tarifa negociada por tonelada.
    

## 🔗 Relaciones Lógicas en Obsidian

- Esta nota anula la edición manual de precios en el formulario transaccional de `[[Módulo UI - Ingreso Rápido de Viaje]]`.
    
- Provee la variable crítica `freight_rate` al bloque de cálculo de ingresos: `[[Voyage.Calculation.Tablones_3]]`.
    

## 💡 Instrucción de Contexto para el Agente (Antigravity IDE):

> "El agente programará la tabla `contract_tariffs` en Supabase utilizando límites numéricos inclusivos (`BETWEEN`). Cuando el motor procese el test unitario obligatorio de la nota `Voyage.Calculation.Tablones_3` enviando `client_id = 'SPCC'`, `destination_port_id = 'MATARANI'` y `quantity = 13500`, el query SQL debe retornar de forma exacta **19.01** como tarifa de flete, garantizando la convergencia con el estado de resultados financieros."