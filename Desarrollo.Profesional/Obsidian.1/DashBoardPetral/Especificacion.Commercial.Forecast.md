````
# ðŸ“ˆ EspecificaciÃ³n Funcional: MÃ³dulo de ProyecciÃ³n Comercial (Commercial Forecast)

Este documento define la arquitectura lÃ³gica, el flujo de datos y la interfaz del planificador financiero (Proformador Avanzado) de **Geeksoft**. Su objetivo es consolidar las ventas y mÃ¡rgenes brutos proyectados (`voyage_result` y `pl_vs_required`) a lo largo de un horizonte de tiempo dinÃ¡mico, eliminando el uso de plantillas dispersas en Excel.

---

## ðŸ› ï¸� 1. Flujo LÃ³gico y Matriz Temporal de Entrada

La interfaz de usuario presentarÃ¡ una cuadrÃ­cula interactiva multipaso configurada dinÃ¡micamente bajo los siguientes parÃ¡metros de control:

### Paso 1: ConfiguraciÃ³n de la Escala Temporal
El usuario selecciona mediante componentes de fecha en el Frontend:
* `start_date` (Mes/AÃ±o de inicio, ej: `01/2026`)
* `end_date` (Mes/AÃ±o de tÃ©rmino, ej: `12/2026`)

El sistema autogenerarÃ¡ una fila transaccional por cada mes comprendido en el rango (escala indexada temporalmente).

### Paso 2: ConfiguraciÃ³n de LÃ­neas de ProyecciÃ³n (Por Fila Mensual)
Para cada celda temporal, el comercial seleccionarÃ¡ las variables operativas mediante menÃºs desplegables conectados a los maestros de Supabase:
1. **Cliente (`client_id`)**: Jala automÃ¡ticamente las tarifas contractuales vigentes.
2. **Destino (`destination_port_id`)**: Fija la ruta oficial (`routes`) inyectando la distancia nÃ¡utica y el factor climÃ¡tico de forma pasiva.
3. **Volumen del Viaje (`quantity`)**: El usuario ingresa las toneladas (MT). El sistema hace un lookup automÃ¡tico al contrato padre (`contracts`) para extraer las tasas operativas (`load_rate`/`discharge_rate`) y las reglas BAF en `JSONB`, y luego inyecta el flete base de la matriz hija (`contract_tariffs`).
4. **Precio Proyectado de Bunker (Opcional)**: Siendo un entorno de simulaciÃ³n (Pre-fixture), el comercial puede testear volatilidades ingresando un precio proyectado. El motor aplicarÃ¡ la compensaciÃ³n BAF si el contrato lo requiere.
5. **Buque Asignado (`vessel_id`)**: Extrae el perfil estructural (`cbm`, `loa`) y la matriz de consumo granular.
6. **Frecuencia (`monthly_frequency`)**: CuÃ¡ntas veces se repite el viaje en el mes.

---

## ðŸ“� 2. Estructura de Datos (Esquema JSON del Payload)

Para procesar la corrida masiva, el Frontend transmitirÃ¡ un array estructurado hacia el endpoint del backend en FastAPI (`/api/v1/forecast/calculate`):

```json
{
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "projection_lines": [
    {
      "month_index": "2026-01",
      "client_id": "SPCC",
      "origin_port_id": "ILO",
      "destination_port_id": "MATARANI",
      "vessel_id": "MOQUEGUA",
      "quantity": 13500,
      "monthly_frequency": 2,
      "forecast_bunker_price_ifo": 895.14,
      "forecast_bunker_price_mdo": 1460.30
    },
    {
      "month_index": "2026-02",
      "client_id": "SPCC",
      "origin_port_id": "ILO",
      "destination_port_id": "MARCONA",
      "vessel_id": "TABLONES",
      "quantity": 13500,
      "monthly_frequency": 1,
      "forecast_bunker_price_ifo": null,
      "forecast_bunker_price_mdo": null
    }
  ]
}
````

## âš™ï¸� 3. Motor de AgregaciÃ³n del Backend (Algoritmo de ConsolidaciÃ³n)

Al recibir el Payload, el backend en FastAPI ejecutarÃ¡ un bucle iterativo que reutiliza las ecuaciones fÃ­sicas del motor unitario (`calculate_voyage_pl_granular`), aplicando las siguientes operaciones de consolidaciÃ³n:

1. **ResoluciÃ³n Individual:** Por cada lÃ­nea, ejecuta la simulaciÃ³n fÃ­sica del viaje (regla del triple mÃ­nimo, consumo granular `SUM(t_fase * c_fase)`). Si se enviÃ³ un `forecast_bunker_price_ifo`, procesa la lÃ³gica JSONB del contrato para ajustar el flete protegiendo el margen.
    
2. **AgregaciÃ³n Mensual por Frecuencia:** Multiplica los outputs del P&L unitario por la variable `monthly_frequency`:
    
    - $\text{Ventas Mensuales} = (\text{quantity} \times \text{freight\_rate}) \times \text{monthly\_frequency}$
        
    - $\text{Costo Combustible Mensual} = \text{total\_bunker\_costs\_unitario} \times \text{monthly\_frequency}$
        
    - $\text{Margen Bruto Mensual (Voyage Result)} = \text{voyage\_result\_unitario} \times \text{monthly\_frequency}$
        
    - $\text{P/L Neto Corporativo Mensual} = \text{pl\_vs\_required\_unitario} \times \text{monthly\_frequency}$
        
3. **Consolidación Anualizada (Estructura de Respuesta):** Retorna el P&L agregado mes a mes y computa la sumatoria total del periodo para el cierre del Dashboard.
    

## 🌐 4. Especificación de la Interfaz Web (UI/UX Interactivo en React)

El diseño del componente visual transformará la configuración estática en un **Motor de Inteligencia de Negocios Interactivo** con un flujo en dos grandes bloques:

### A. La Barra Constructora (Forecast Builder Bar)
- **Selectores en Cascada:** Arriba de la matriz, existirá una barra de herramientas elegante. El usuario primero define el "Horizonte" (Mes Inicio / Mes Fin).
- **Proceso de Población Lógica:** Mediante menús desplegables (Selects), el usuario ensamblará las proyecciones paso a paso:
  1. Selecciona el **Cliente** (extraído de contratos).
  2. Selecciona la **Ruta**.
  3. Asigna el **Buque**.
  4. Define los **Viajes** (Frecuencia).
- **Acción Trigger:** Al dar clic en "Añadir al Forecast", este "ladrillo" lógico se envía al motor de backend, y el resultado numérico se inyecta dinámicamente como una nueva fila en la Matriz.

### B. Matriz Financiera Viva (Custom React Table 1:1 con Mockup)
- **Construcción Nativa Customizada:** En lugar de librerías de tablas planas, se desarrolló un componente React estrictamente apegado al diseño HTML/CSS original (`commercial_forecast_H2_2026.html`).
- **Agrupación Visual Jerárquica (`rowspan`):** La tabla fusionará automáticamente las celdas de jerarquía (Cliente > Ruta > Buque) usando la propiedad `rowspan` calculada dinámicamente en React, creando un "mosaico" limpio y ordenado.
- **Identidad Visual Premium:** Renderizado de texto vertical (`writing-mode: vertical-rl`) usando los colores dinámicos exactos del mockup (Ej: Azul Marino para SPCC, Teal para Marcona, Celeste para Moquegua) permitiendo reconocimiento visual instantáneo.
- **Formateo y Estilos:** Cifras en fuente tabular (`tabular-nums`), filas de "Voyage Result" destacadas, y un estilo general alineado al CSS corporativo provisto.
- **Despliegue Interactivo de Ledger Unitario (Expandible):** La primera fila de cada bloque (`Viajes (freq)`) es expandible. Al hacer clic, inyecta dinámicamente 16 filas adicionales que desglosan la radiografía exacta del viaje (Operativo, Tiempos/Costos y Financiero), incluyendo costos granulares de Bunker (IFO y MDO separados).
- **Subtotales de Cliente:** Al final del bloque de cada Cliente se inserta automáticamente un "TOTAL CLIENTE" consolidando los Gross Revenues, Port Costs, Bunker Costs y Voyage Results acumulados.

### C. Gráfico Cruzado Dinámico (`Apache ECharts`)
- **Interactividad Bidireccional (Cross-Filtering):** Debajo del Grid, un lienzo de ECharts muestra líneas de tendencia temporal. Si el Director Comercial ajusta el "Precio de Búnker Estimado" o el "Flete", el framework reactivo despacha un recálculo masivo al Backend y **toda la tabla pivot y el gráfico Apache ECharts se recalculan y animan en tiempo real**.

### E. Exportación Ejecutiva
- Generación de reportes PDF "pixel-perfect" idénticos al prototipo visual estático.
- Exportación nativa a Excel (XLSX) preservando el formato jerárquico.
    

## 🔒 5. Directrices de Control para el Agente (Injunción de Desarrollo)

> "El agente de Antigravity IDE debe garantizar que este módulo consuma el mismo archivo central de cálculo lógico (`engine.py`). Está estrictamente prohibido duplicar o simplificar las ecuaciones en el backend para la proforma masiva. Cada mes proyectado debe evaluarse con el rigor microscópico del búnker dual y los constraints de puerto establecidos en [[Voyage.Calculation.Tablones]]."

## 🚀 6. Hoja de Ruta de Implementación (Vertical Slicing)

Para materializar este módulo de manera ágil e independiente del resto del ERP, aplicaremos una estrategia de **Vertical Slicing** (desarrollo End-to-End de una sola funcionalidad), estructurada en 3 pasos:

### Paso 1: El Puente en el Backend (FastAPI + Supabase)
2. HarÃ¡ un fetch a **Supabase** para extraer la "verdad absoluta": consumos reales de los buques, distancias oficiales de las rutas y condiciones comerciales (fletes/BAF) vigentes en los contratos.
3. ProcesarÃ¡ estos datos pasÃ¡ndolos por el motor centralizado (`engine.py`).
4. EstructurarÃ¡ y devolverÃ¡ la agregaciÃ³n jerÃ¡rquica (Cliente -> Ruta -> Buque -> Mes) en un JSON optimizado para React.

### Paso 2: El Componente Visual en React (Frontend)
Desarrollo de la pantalla "Commercial Forecast" dentro de `Geeksoft_Frontend`.
1. **Grid Financiero:** IntegraciÃ³n de `ag-grid-react` (o equivalente) para consumir el JSON del backend, replicando la estructura de agrupaciÃ³n, colores dinÃ¡micos (Azul/Teal) y los rowspans.
2. **Dashboard Visual:** IntegraciÃ³n de `echarts-for-react` para renderizar el grÃ¡fico cruzado de margen operativo vs ingresos.

### Paso 3: Interactividad y Simulador "What-If"
1. InyecciÃ³n de controles en la UI (ej. "Input Global: Precio Bunker Estimado").
2. ConexiÃ³n de estos controles con el Backend: Al modificar un input, el Frontend lanza un nuevo request al Endpoint del Paso 1.
3. El motor recalcula instantÃ¡neamente (aplicando protecciones BAF si existen) y la interfaz se anima reflejando el nuevo escenario de rentabilidad, demostrando el verdadero poder del planificador financiero.
 
 V e r   p l a n   d e   d e s a r r o l l o   t é c n i c o   d e l   b a c k e n d   e n :   [ [ P l a n . I m p l e m e n t a c i o n . P a s o 1 ] ]  
 
 V e r   p l a n   d e   d e s a r r o l l o   t é c n i c o   d e l   f r o n t e n d   e n :   [ [ P l a n . I m p l e m e n t a c i o n . P a s o 2 ] ]  
 