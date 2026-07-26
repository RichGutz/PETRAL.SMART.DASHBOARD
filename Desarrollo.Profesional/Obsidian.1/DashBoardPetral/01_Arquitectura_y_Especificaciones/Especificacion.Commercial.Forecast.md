# 📈 Especificación: Commercial Forecast (Matriz Financiera & Análisis Gráfico)

Este documento detalla la arquitectura, reglas de negocio y funcionalidades implementadas en el módulo **Commercial Forecast** (Frontend React/Tailwind + Backend Python/Supabase) de la plataforma PETRAL.

---

## 1. 🏗️ Arquitectura del Módulo (Sandbox Multi-Escenario)
El módulo ha sido concebido no como un simple reporte, sino como un **"Área de Juegos" (Sandbox) Ejecutiva** que permite simular, proyectar y clonar escenarios navieros a lo largo de un horizonte de meses dinámicos.

### 1.1 Funcionalidad de Guardado (Save As)
- **Guardar como Nuevo (Clonar):** El motor permite "congelar" el estado actual del simulador y guardarlo en la Base de Datos como un registro nuevo (clon).
- **Sobrescribir Mi Escenario:** Sólo habilitado lógicamente si el `user_id` del escenario activo coincide con el autor original.
- **Catálogo de Escenarios (Load Modal):** El Frontend inyecta un *Badge* inteligente (Ej: `Tuyo`) para destacar los escenarios propios del usuario actual.
- **Ahorro de Espacio (Botones Apilados):** Los botones **Guardar** y **Cargar** se apilan verticalmente en una sola columna compacta a la derecha del constructor (`h-6` cada botón con `text-[10px]`), alineándose perfectamente con la fila de los títulos de las cajas para ganar espacio horizontal.

### 1.2 Auditoría de Inputs (100% Data-Driven)
Tras una auditoría profunda del motor backend (`forecast_service.py` y `engine.py`), se certifica que **todos los inputs primarios son dinámicos e inyectados desde Supabase**, sin hardcodes. Dimensiones gobernadas por base de datos:
- *Rutas*: distancias, factores de clima.
- *Buques*: velocidad, consumos IFO/MDO, intake, TCE.
- *Puertos*: límites de bombeo, demoras administrativas (time_to_count_hrs) y maniobras de posicionamiento (maneuver_hrs).
- *Tarifas*: freights por bracket y matriz de agenciamiento.
- *Precios*: Mercado de Bunker.

### 1.3 Multi-Selección Dinámica (Meses a modelar)
- **Despliegue Nativo (Popover):** El paso 3 del constructor abandona el clásico selector individual por un `Popover` de Shadcn que se inyecta nativamente en el root, escapando de bloqueos de diseño (overflow).
- **Botones Píldora (UX/UI Trimestral):** Los meses del horizonte se renderizan en una cuadrícula (`grid-cols-3` para agrupar naturalmente en trimestres) usando botones interactivos estilo píldora que se iluminan al activarse.
- **Inyección por Lotes (Batch Injection):** Al añadir un escenario, el motor itera internamente e inyecta en la matriz financiera todos los meses seleccionados de forma instantánea.
- **Candado de Horizonte Bidireccional:** El selector de Inicio y Fin de Forecast incorpora inteligencia lógica. Si el usuario intenta cruzar fechas (Inicio > Fin), el sistema auto-corrige y empuja silenciosamente el rango, blindando la integridad matemática de la matriz.

### 1.4 Modos de Resolución de Costos Portuarios: `STATIC` vs `MATRIX` (Julio 2026)
La Matriz Financiera ofrece dos modos de cómputo de costos portuarios seleccionables por el usuario (`portCostMode`):
1. **Modo `STATIC` (Matriz Estática)**:
   - Consulta estrictamente la tabla `port_cost_static` en Supabase DB por la clave `(port_id, vessel_id, operation_type)`.
   - **Regla Estricta de Cero Fallbacks**: Si la combinación no posee una tarifa estática en la base de datos, el motor **retorna `$0.00 USD` de forma transparente**, eliminando cualquier fallback a naves de reserva o valores por defecto. Un valor de `$0.00` señala de inmediato al usuario la tarifa pendiente por registrar en el maestro.
2. **Modo `MATRIX` (Modelo Matriz Compleja / Dinámico P×Q)**:
   - Invoca el motor evaluador dinámico P×Q del Modelo Matriz Compleja de Costos Portuarios.
   - Ejecuta la simulación para el **Escenario Alto** y el **Escenario Bajo** del puerto, buque y volumen especificados.
   - Asigna como costo portuario oficial del viaje el **Promedio Matemático**:
     $$\text{Port Cost (Matrix)} = \text{round}\left( \frac{\text{Costo Escenario Alto} + \text{Costo Escenario Bajo}}{2}, 2 \right)$$

---

## 2. 📊 Matriz Financiera (ForecastGrid.tsx)

### 2.1 Jerarquía y Layout KPIs
Los datos se agrupan en un árbol dinámico: Cliente ↳ Ruta ↳ Buque. 
La tabla presenta un layout financiero estructurado para contemplar deducciones de comisiones comerciales:
1. **Viajes**
2. **Toneladas**
3. **Gross Revenue** (Ingreso bruto por flete, `Q * F`)
4. **Comisiones** (Deducción por Address + Broker Commission)
5. **Net Freight** (Ingreso Neto de Flete, `Gross - Comisiones`)
6. **Port Costs** (Costos portuarios de origen/destino según modo `STATIC` o `MATRIX`)
7. **Bunker Costs** (Costo total IFO + MDO del viaje)
8. **Voyage Result** (Utilidad Operativa Neta: `Net Freight - Port Costs - Bunker Costs`)

*Nota Contable:* El **Demurrage** corre por cuerda separada. No se suma dentro de Voyage Result para mantener pura la contabilidad operativa. Se presenta expandiendo la fila de Gross Revenue.

### 2.2 Características Clave UX
- **Sticky Headers:** Los encabezados de la tabla se mantienen fijos al hacer scroll vertical.
- **Acumulación y Yield Ponderado:** Cálculos en tiempo real (`useMemo`). El cálculo de Yield (USD/MT) aplica la división matemática global `Sum(Gross+Demurrage) / Sum(Toneladas)`.
- **Despliegues Financieros (Sub-rows):** Al abrir la fila de Gross Revenue, se detallan: Voyage Result, Demurrage, Gross + Demurrage (Total Facturado), Toneladas y el Yield ponderado.

---

## 3. 📉 Análisis Gráfico de Liquidaciones (LiquidationsInteractiveChart.tsx con ECharts)
Capa de visualización ejecutiva para la auditoría de los 31 viajes de la flota (16 de B/T Moquegua y 15 de B/T Tablones).

### 3.1 Sincronización Celda por Celda de los 31 Viajes Auditados
- **Integridad Celda por Celda**: Sincronización completa con Supabase DB (`voyage_liquidations`) de los 31 viajes oficiales de la planilla maestra de liquidaciones:
  - **B/T Moquegua (16 Viajes, V.761 a V.777)**: `$4,861,972.24 Gross Rev` | `+$1,963,547.00 Net Profit`.
  - **B/T Tablones (15 Viajes, v.038 a v.052)**: `$4,224,409.00 Gross Rev` | `+$1,378,990.00 Net Profit`.
  - **UTILIDAD NETA TOTAL COMBINADA DE LA FLOTA**: **`+$3,342,537.00 USD`** (Margen promedio de `40.38%`).

### 3.2 Mapeo Cronológico por Código de Viaje (ENE 26 a JUN 26)
- **Desacoplamiento de Fechas Genéricas**: Para evitar que fechas por defecto encimen viajes en un solo mes, la función `getVoyageMonthKey` clasifica los 31 viajes cronológicamente por su código auditado:
  - **ENE 26**: `v.038`, `v.039`, `v.040` | `V.761`, `V.762`
  - **FEB 26**: `v.041`, `v.042`, `v.043` | `V.763`, `V.764`, `V.765`
  - **MAR 26**: `v.044`, `v.045` | `V.766`, `V.767`, `V.768`
  - **ABR 26**: `v.046`, `v.047` | `V.769`, `V.770`, `V.771`
  - **MAY 26**: `v.048`, `v.049`, `v.050` | `V.772`, `V.773`, `V.774`
  - **JUN 26**: `v.051`, `v.052` | `V.775`, `V.777`

### 3.3 Margen de Rentabilidad Neta % en Eje Secundario
- Al seleccionar la métrica en modo porcentaje sobre el eje secundario, se calcula exactamente el Margen de Rentabilidad Neta Real:
  $$\text{Margen \%} = \left( \frac{\text{Net Profit Real}}{\text{Gross Revenue Total}} \right) \times 100$$

### 3.4 Comportamiento "Join The Dots" (Líneas Multibuque Continuas)
- **Valores Nulos en Puntos Vacíos (`null`)**: Cuando interactúan viajes de varios barcos intercalados, el barco que no operó en un viaje registra `null` en su serie (en lugar de `0`).
- **`connectNulls: true`**: Las líneas de ECharts conectan directamente los datos reales consecutivos de cada barco, evitando caídas en picada al piso (`0%`) y manteniendo curvas elegantes.

### 3.5 Maquetación Controlada e Inamovible (Fixed Sidebar & Floating Popovers)
- **Sidebar Bloqueado a 240px (`w-[240px] max-w-[240px] shrink-0`)**: Los botones recortan nombres de ruta extensos mediante elipsis (`truncate`) y tooltip `title` para que el sidebar no se desplace ni deforme el gráfico.
- **Desplegables Emergentes Holgados (`w-[320px] max-h-[360px] z-[9999] shadow-2xl`)**: Las listas emergentes de los filtros flotan sobre la interfaz con 320px de ancho y nivel de capa `z-[9999]`, garantizando la lectura completa de rutas largas (ej: `ILO ➔ MEJILLONES ➔ TERQUIM`).

---

## 4. 🔀 Motor Paralelo NEXA (Spot Multileg en Matriz Financiera)

### 4.1 Concepto
El cliente **NEXA** opera bajo un modelo de rutas complejas (múltiples puertos de carga/descarga), incompatibles con el motor tradicional de `calculate_voyage_pnl`. Se implementó un **motor de cálculo paralelo** que reutiliza la lógica del Ruteador Spot (`spot_engine.py → calculate_spot_multileg`) dentro del contexto de la Matriz Financiera.

---

## 5. 🎛️ Módulos del Ribbon — Mapa del Dashboard

| # | Módulo | Estado | Descripción |
|---|---|---|---|
| 1 | **Voyage Ledger** | ✅ Productivo | Auditoría detallada de cálculo por viaje (P&L unitario) |
| 2 | **Commercial Forecast** | ✅ Productivo | Matriz Financiera + Análisis Gráfico de Liquidaciones |
| 3 | **Mapa Espaguetis** | ✅ Productivo | Visualización geoespacial de rutas, fuentes y sumideros |

---
*Documento vivo mantenido por el equipo Geeksoft - Naviera Petral.*
