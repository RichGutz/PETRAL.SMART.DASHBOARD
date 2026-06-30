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
- *Puertos*: límites de bombeo, cuellos de botella (overhead_hrs).
- *Tarifas*: freights por bracket y matriz de agenciamiento.
- *Precios*: Mercado de Bunker.

### 1.3 Multi-Selección Dinámica (Meses a modelar)
- **Despliegue Nativo (Popover):** El paso 3 del constructor abandona el clásico selector individual por un `Popover` de Shadcn que se inyecta nativamente en el root, escapando de bloqueos de diseño (overflow).
- **Botones Píldora (UX/UI Trimestral):** Los meses del horizonte se renderizan en una cuadrícula (`grid-cols-3` para agrupar naturalmente en trimestres) usando botones interactivos estilo píldora que se iluminan al activarse.
- **Inyección por Lotes (Batch Injection):** Al añadir un escenario, el motor itera internamente e inyecta en la matriz financiera todos los meses seleccionados de forma instantánea.
- **Candado de Horizonte Bidireccional:** El selector de Inicio y Fin de Forecast incorpora inteligencia lógica. Si el usuario intenta cruzar fechas (Inicio > Fin), el sistema auto-corrige y empuja silenciosamente el rango, blindando la integridad matemática de la matriz.

---

## 2. 📊 Matriz Financiera (ForecastGrid.tsx)
Es el "cerebro numérico" interactivo. Transforma una lista plana de viajes simulados en un P&L anidado.

### 2.1 Jerarquía y Layout 6-KPI
Los datos se agrupan en un árbol dinámico: Cliente ↳ Ruta ↳ Buque. 
La tabla presenta un layout de **6 KPIs** principales fijos a la vista:
1. **Viajes**
2. **Toneladas**
3. **Gross Revenue** (Ingreso bruto por flete)
4. **Port Costs** (Costos de agencia en origen/destino)
5. **Bunker Costs** (Costo total IFO + MDO del viaje)
6. **Voyage Result** (Gross Revenue - Port Costs - Bunker Costs)

*Nota Contable:* El **Demurrage** corre por cuerda separada. No se suma dentro de Voyage Result para mantener pura la contabilidad operativa. Se presenta expandiendo la fila de Gross Revenue.

### 2.2 Características Clave UX
- **Sticky Headers:** Los encabezados de la tabla (Cliente, Ruta, etc.) se mantienen fijos al hacer scroll vertical hacia abajo, ideal para "sábanas" de datos muy largas.
- **Acumulación y Yield Ponderado:** Cálculos en tiempo real (`useMemo`) que suman métricas. El cálculo de Yield (USD/MT) **no suma promedios**, sino que aplica la división matemática global `Sum(Gross+Demurrage) / Sum(Toneladas)`.
- **Despliegues Financieros (Sub-rows):** Al abrir la fila de Gross Revenue, se detallan: Voyage Result, Demurrage, Gross + Demurrage (Total Facturado), Toneladas y el Yield ponderado.
- **Formato Flete (Dos Decimales):** La fila de `"Flete (USD/MT)"` tanto en las celdas mensuales individuales como en los totales de fila se formatea con exactamente dos decimales (`formatYield`) para máxima precisión contable (ej. `$20.67`).
- **Compresión Vertical Extrema (Constructor):** El panel superior de inputs tiene un padding vertical reducido en un 75% (`py-1` en `CardContent` y `pb-0.5` en fila) y alineación `items-center` para optimizar el espacio libre y maximizar la visibilidad de la matriz financiera.

---

## 3. 📉 Análisis Gráfico (InteractiveChart.tsx con ECharts)
Capa de visualización ejecutiva, diseñada para ser proyectada en salas de juntas.

### 3.1 Estilos y Controles PRO
- **Esquema de Colores Dual:** 
  - *Eje Primario*: Tonos corporativos **Petral Blue (`#0089CF`)**.
  - *Eje Secundario*: Temática en **Verde Esmeralda (`emerald-600`)** para alto contraste ejecutivo.
  - **Fuentes Estandarizadas**: Todos los radio buttons y checkboxes utilizan clases uniformes (`text-[11px] font-medium text-slate-700`) para simetría perfecta.
- **Ancho Completo de Gráfico (Ancho Real):** El margen izquierdo de la cuadrícula de ECharts (`grid.left`) se ajustó a `70` con `containLabel: true` para eliminar el espacio muerto lateral y permitir que el gráfico tome el 100% de la anchura disponible.
- **Layout de Ejes en Columnas Paralelas:** Los controles inferiores de cada eje se dividen en dos columnas:
  - *Columna Izquierda*: 4 iconos SVG de tipo de gráfico apilados verticalmente (Barras Stack, Barras Adjuntas, Línea Suave y Línea Recta).
  - *Columna Derecha*: El propio título `"Etiquetas"` actúa como un botón toggle reactivo (cambia entre texto blanco en fondo negro y texto negro en fondo blanco al hacer clic) para controlar la visibilidad del color de fuente, y debajo se apilan verticalmente los tres botones de posición (Ocultar, Encima, Centro).
- **Expansión Líquida (Flex):** Absorbe el 100% del espacio vertical disponible.

### 3.2 Lógica de Graficación Dual y Formas
El usuario tiene máximo control sobre cómo presentar la información:
- **Líneas Híbridas:** Permite intercambiar entre **"Línea Suavizada"** (curvas elegantes) y **"Línea Recta"** (cortes poligonales bruscos, útil para quiebres de tendencia).
- **Métricas Compuestas (Doble Curva):** El eje secundario (y primario) soporta la opción **"Gross & Gross+Dem"**, la cual dibuja matemáticamente **dos curvas independientes** (ej. una azul y una ámbar/naranja) sobre el mismo eje. Es ideal para reuniones de Directorio donde se desea aislar visualmente el impacto del Demurrage sobre el ingreso puro.

### 3.3 Acumulados Inteligentes (El Santo Grial Ejecutivo)
- Al activar **"Acumular Global"** y **"Mostrar en %"**, el motor inyecta dinámicamente una nueva serie (Línea Punteada).
- Esta línea suma la contribución de todas las barras mes a mes, forzando matemáticamente que el último mes del horizonte alcance siempre el **100%**.
- Se soporta también la proyección de métricas duales en modo acumulado.

---
*Documento vivo mantenido por el equipo Geeksoft - Naviera Petral.*
