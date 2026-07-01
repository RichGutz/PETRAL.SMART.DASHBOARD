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

### 1.4 Resolución del Bug NaN en Auditoría de Tasas del Ledger
- **Problema:** En el módulo Voyage Ledger, la columna **GEEKSOFT (Motor)** mostraba `NaN` en las filas de *Tasa de Carga* y *Tasa de Descarga*, a pesar de que la fórmula matemática se calculaba correctamente en el motor backend.
- **Causa raíz:** El endpoint `/api/v1/forecast/run` (en `forecast_service.py`) no mapeaba ni retornaba los campos `actual_load_rate` ni `actual_discharge_rate` dentro del objeto consolidado `monthly_result` que consume el frontend. Adicionalmente, el frontend tenía valores hardcodeados `500` y `300` en vez de usar los retornos del backend, y los formateadores no tenían validación contra valores nulos.
- **Soluciones:** 
  1. Se modificó `forecast_service.py` para inyectar `actual_load_rate` y `actual_discharge_rate` dentro del payload de `monthly_result`.
  2. Se actualizó `VoyageLedgerTest.tsx` (tanto en la vista web como en el layout de impresión de PDF) reemplazando los hardcodes por `scenarioResult.actual_load_rate` y `scenarioResult.actual_discharge_rate`.
  3. Se robustecieron los formateadores de números (`formatNumber` / `fmtNum`) y monedas (`formatCurrency` / `fmtCur`) agregando una evaluación `isNaN(parseFloat(val))` que sustituye cualquier dato fallido o ausente por un guion (`—`), asegurando estabilidad visual absoluta.

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

### 3.4 Métricas Operativas de Flota (Formateo Condicional)
El motor de renderizado (`ECharts`) detecta qué métrica se está graficando e inyecta formateadores lógicos específicos:
- **Duración Total (Días Ocupados):** Multiplica dinámicamente la duración unitaria del viaje por la frecuencia mensual. Escapa del formateo monetario estándar (`$`) e inyecta el sufijo `d` (ej. "15 d") tanto en el Eje Y como en los tooltips y etiquetas flotantes.
- **Viajes (Frecuencia):** Implementa bloqueo de enteros (`minInterval: 1`) en los ejes para prevenir que ECharts dibuje fracciones irreales (ej. 1.5 viajes).

### 3.5 Filtro de Tipo de Operación (Cabotaje vs. Exportación Chile)
- **Concepto:** Se integró una nueva dimensión de filtro lateral en el panel del gráfico llamada **"Tipo Op."**. 
- **Lógica de Inferencia:** Para simplificar el flujo y no requerir consultas de BD pesadas en tiempo real, el gráfico infiere el tipo de operación basándose en el nombre de la ruta. Si la ruta contiene los destinos `MEJILLONES` o `BARQUITO` se clasifica como `Chile`, de lo contrario, se clasifica como `Cabotaje` (puertos peruanos).
- **Controlador UI:** Permite filtrar toda la gráfica dinámicamente para aislar los ingresos y volúmenes de cabotaje local frente a exportación marítima internacional. Al hacer clic sobre el botón de cabecera "Tipo Op." se reinicia el filtro (vuelve a `ALL`).

---

## 4. 🗺️ Módulo Adicional: Ruteador Spot [En Desarrollo]
Este módulo es un *fork complejo* diseñado para cotizaciones Multileg y se documenta por separado temporalmente hasta su finalización.
👉 Ver documento anclado: [[Especificacion.Ruteador.Spot]]

---

## 5. 🔀 Motor Paralelo NEXA (Spot Multileg en Matriz Financiera)

### 5.1 Concepto
El cliente **NEXA** opera bajo un modelo de rutas complejas (múltiples puertos de carga/descarga), incompatibles con el motor tradicional de `calculate_voyage_pnl`. Se implementó un **motor de cálculo paralelo** que reutiliza íntegramente la lógica del Ruteador Spot (`spot_engine.py → calculate_spot_multileg`) dentro del contexto de la Matriz Financiera, sin alterar el flujo estándar de los demás clientes.

### 5.2 Bifurcación en Backend (`forecast_service.py`)
- Se detecta si una línea de proyección tiene `origin_port_id == "SPOT"` (indicador de que pertenece al motor Nexa).
- En ese caso, se clonan las piernas operativas de la ruta spot y se llama a `calculate_spot_multileg` con un payload estructurado:
  ```python
  payload = {
      "vessel_params": { ... },  # Datos del buque desde tabla vessels
      "legs": { ... }            # Piernas operativas (laden, positioning, etc.)
  }
  ```
- Se inyectan dinámicamente los costos de agencia del tramo `laden` desde `agency_matrix` para origen y destino, resolviendo las fórmulas de Port Costs sin hardcodes.
- Los demás clientes (ILO-MATARANI, ILO-MARCONA, etc.) siguen usando el motor clásico sin cambios.

### 5.3 Fix de Firma — `TypeError` Resuelto
- Se detectó un `TypeError: calculate_spot_multileg() takes 1 positional argument but 2 were given` al ejecutar en producción.
- Se re-estructuró la llamada para pasar un único objeto payload (en lugar de dos argumentos posicionales separados).
- La simulación ejecuta exitosamente retornando `voyage_result`, `gross_revenue`, `port_costs`, `bunker_costs` con matemática completa.

### 5.4 Corrección de Identificador de Ruta (UUID → Nombre Amigable)
- **Problema:** El `SelectItem` de rutas spot en `ForecastBuilder.tsx` usaba `value={`SPOT-${s.spot_id}`}` (UUID técnico de BD). Esto causaba que la clave de agrupación en el backend (`destination_port_id`) no coincidiera con la clave de la grilla frontend, dejando todas las celdas financieras vacías (solo se mostraban toneladas por un fallback).
- **Solución aplicada:** Se cambió el `value` a `SPOT-${s.name}` para que el identificador sea el nombre amigable definido por el usuario al grabar la ruta (ej. `NEXA.ILO.CALLAO.MEJILLONES.ILO`).
- **Archivo modificado:** `ForecastBuilder.tsx` → línea 331.
- **Resultado:** La columna "Ruta" de la tabla muestra el nombre real, y todas las filas (Viajes, Toneladas, Gross Revenue, Port Costs, Bunker Costs, Voyage Result) se poblan correctamente.

### 5.5 Auditoría de Bunker — Cards de Idle por Demoras
- **Problema reportado:** La auditoría de Bunker Costs no contabilizaba el consumo idle durante la demora de entrada (*waiting inbound*) y la demora de salida (*waiting outbound*).
- **Solución:** Se añadieron **2 cards intermedias** en la vista de auditoría de bunker entre las 3 cards originales:
  1. `Idle - Demora Entrada` → consumo MDO en modo espera antes de entrar a puerto.
  2. `Idle - Demora Salida` → consumo MDO en modo espera tras finalizar operaciones.
- Esto garantiza trazabilidad completa del costo de bunker: navegación cargada + demoras + maniobras + navegación en lastre.

### 5.6 Aislamiento de Escenarios por Módulo
- **Problema reportado:** Al cargar un escenario en Matriz Financiera y navegar a Ruteador Spot, el nombre del escenario de Matriz seguía visible en el Ribbon, impidiendo cargar el escenario propio de Spot.
- **Corrección:** Se aisló el estado del escenario activo por módulo (Matriz Financiera vs. Ruteador Spot), de modo que cada módulo gestiona su propio contexto de escenario de forma independiente.

### 5.7 Campo `pais` en `routes` y `routes_spot`
- **Concepto:** Se integró el campo `pais` en el esquema de base de datos para clasificar las rutas por origen/destino geográfico en Perú y Chile.
- **Regla de Negocio:** Todos los puertos y trayectos se asumen de `Peru` por defecto, con excepción de aquellos que involucren a `Mejillones` o `Barquito` como puertos finales, los cuales se marcan como `Chile`.
- **Inferencia Automática:** Al guardar una cotización en el Ruteador Spot, el frontend infiere automáticamente el país en base al puerto de descarga (destino de la pierna *laden*) y lo envía al endpoint `/spot/save` del backend.
- **UI:** El catálogo de rutas spot del modal del Ruteador Spot muestra un *badge* distintivo con bandera (🇵🇪 Peru / 🇨🇱 Chile) al lado del nombre de cada ruta guardada.

---
*Documento vivo mantenido por el equipo Geeksoft - Naviera Petral.*

---

## 6. 🎛️ Módulos del Ribbon — Mapa del Dashboard

El módulo **Commercial Forecast** comparte el Ribbon del dashboard con otros reportes especializados. La navegación lateral agrupa todas las vistas del sistema bajo un menú único:

| # | Módulo | Estado | Descripción |
|---|---|---|---|
| 1 | **Voyage Ledger** | ✅ Productivo | Auditoría detallada de cálculo por viaje (P&L unitario) |
| 2 | **Ruteador Spot** | ✅ Productivo | Cotizador multileg para operaciones spot complejas |
| 3 | **Commercial Forecast** | ✅ Productivo | Matriz Financiera + Análisis Gráfico (este documento) |
| 4 | **Mapa Espaguetis** | 🚧 En especificación | Visualización geoespacial de rutas, fuentes y sumideros |

### Módulo 4: Mapa Espaguetis — Fuentes y Sumideros
El cuarto módulo del Ribbon es una vista geoespacial del Perú que superpone las rutas activas (espaguetis), los pie charts de carga/descarga por puerto y el market share de Petral como fuente o sumidero en cada terminal.

👉 Ver especificación completa: [[Especificacion.Mapa.Espaguetis]]

---
*Documento vivo mantenido por el equipo Geeksoft - Naviera Petral.*
