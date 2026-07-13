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

### 1.4 Resolución del Bug NaN en Auditoría de Tasas del Ledger
- **Problema:** En el módulo Voyage Ledger, la columna **GEEKSOFT (Motor)** mostraba `NaN` en las filas de *Tasa de Carga* y *Tasa de Descarga*, a pesar de que la fórmula matemática se calculaba correctamente en el motor backend.
- **Causa raíz:** El endpoint `/api/v1/forecast/run` (en `forecast_service.py`) no mapeaba ni retornaba los campos `actual_load_rate` ni `actual_discharge_rate` dentro del objeto consolidado `monthly_result` que consume el frontend. Adicionalmente, el frontend tenía valores hardcodeados `500` y `300` en vez de usar los retornos del backend, y los formateadores no tenían validación contra valores nulos.
- **Soluciones:** 
  1. Se modificó `forecast_service.py` para inyectar `actual_load_rate` y `actual_discharge_rate` dentro del payload de `monthly_result`.
  2. Se actualizó `VoyageLedgerTest.tsx` (tanto en la vista web como en el layout de impresión de PDF) reemplazando los hardcodes por `scenarioResult.actual_load_rate` y `scenarioResult.actual_discharge_rate`.
  3. Se robustecieron los formateadores de números (`formatNumber` / `fmtNum`) y monedas (`formatCurrency` / `fmtCur`) agregando una evaluación `isNaN(parseFloat(val))` que sustituye cualquier dato fallido o ausente por un guion (`—`), asegurando estabilidad visual absoluta.

### 1.5 Simplificación Comercial del Motor de Liquidación y Adición de Horas de Posicionamiento y Esperas (Julio 2026)
- **Desvinculación Física Comercial:** Se modificó el motor (`engine.py`) para que la tasa de carga y descarga dependa exclusivamente del contrato comercial pactado (`c_load` y `c_disch`), aislando los cuellos de botella de infraestructura (`v_intake`, `v_pump`, `t_load_rate`, `p_disch_limit`).
- **Limpieza de UI en Auditoría Ledger:** Se removieron de los cards visuales (Maestro Flota y Límites Portuarios) las variables físicas desvinculadas en la interfaz de React e impresión HTML de `VoyageLedgerTest.tsx`.
- **Integración de Posicionamiento y Esperas Contractuales:** Se añadieron los campos `time_to_count_carga_hrs`, `time_to_count_descarga_hrs`, `maneuver_carga_hrs` y `maneuver_descarga_hrs` a la tabla `ports` de Supabase (inicializados con los valores reales del catálogo). Estos se inyectan en los inputs de simulación y se sumaron a la métrica **3. Días de Puerto**, cuya fórmula de laytime real se calcula como:
  `port_days = ((Q / act_load + time_to_count_carga + maneuver_carga) + (Q / act_disch + time_to_count_descarga + maneuver_descarga)) / 24`

### 1.6 Arquitectura de Fallback para Costos Portuarios y Dimensiones del Maestro Flota (Julio 2026)
- **Preservación Física de `agency_matrix`:** Se establece explícitamente la **permanencia de la tabla física `agency_matrix`** en la base de datos de Supabase. Funciona como fallback intermedio fundamental:
  - Cuando se ejecuta una simulación, el motor de forecast (`forecast_service.py`) consulta prioritariamente la tabla de desgloses `port_costs_matrix`.
  - Si no existen tarifas detalladas registradas en `port_costs_matrix` para el buque/puerto/operación, el motor realiza un fallback directo a la tabla `agency_matrix` para obtener el costo consolidado de puerto (como concepto único de `agency_fee`).
  - **REGLA DE CONSERVACIÓN:** Ningún agente AI o desarrollador futuro debe eliminar, alterar o dar de baja la tabla `agency_matrix`, la cual debe convivir indefinidamente con `port_costs_matrix` como safety net.
- **Nuevas Variables en Maestro Flota (`vessels`):** Se añadieron las columnas físicas `length` (Eslora) y `beam` (Manga) a la tabla `vessels` en Supabase para todos los buques de la flota (Moquegua, Tablones, Concon Trader, Huemul).
- **Visualización en dos columnas en el Ledger:** El card de **Maestro Flota** en el componente `VoyageLedgerTest.tsx` (tanto en la visualización interactiva de React como en la vista de impresión/PDF) se actualizó para renderizar en dos columnas paralelas las variables clave: `DWT` y `dwcc` en una fila, y `Length (L)` y `Beam (B)` en la siguiente, consolidando la visualización de los datos físicos básicos del buque.

---

## 2. 📊 Matriz Financiera (ForecastGrid.tsx)
Es el "cerebro### 2.1 Jerarquía y Layout KPIs
Los datos se agrupan en un árbol dinámico: Cliente ↳ Ruta ↳ Buque. 
La tabla presenta un layout financiero estructurado para contemplar deducciones de comisiones comerciales:
1. **Viajes**
2. **Toneladas**
3. **Gross Revenue** (Ingreso bruto por flete, `Q * F`)
4. **Comisiones** (Deducción por Address + Broker Commission)
5. **Net Freight** (Ingreso Neto de Flete, `Gross - Comisiones`)
6. **Port Costs** (Costos portuarios de origen/destino)
7. **Bunker Costs** (Costo total IFO + MDO del viaje)
8. **Voyage Result** (Utilidad Operativa Neta: `Net Freight - Port Costs - Bunker Costs`)

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

### 5.8 Resolución de Carga de Escenarios, Depuración de SPOT y Simplificación de Ribbon (Julio 2026)
- **Problemas reportados:**
  1. El botón de cargar escenario no lograba renderizar los escenarios en la matriz financiera a pesar de recuperarlos de la BD.
  2. Al forzar la simulación al cargar un escenario que contenía rutas SPOT, se producía un error de servidor: `Error al correr simulación: 'actual_load_rate'`.
  3. Existían múltiples prototipos redundantes ("Ruteador Spot" y "Multicotizador") compitiendo con el nuevo "Estimador Excel" en el Ribbon de navegación.
- **Causas Raíz:**
  1. *Race Condition en React (Frontend):* Al seleccionar un escenario en el modal, se disparaban en lote las actualizaciones de estado de React (`setProjectionLines`, `setShowLoadModal`, etc.). La actualización y cierre del modal provocaban una nueva renderización inmediata que cancelaba el `setTimeout` (debounce de 300ms) del `useEffect` de simulación antes de ejecutarse, dejando la matriz en su estado inicial vacío.
  2. *KeyError en Backend (`forecast_service.py`):* La función `calculate_spot_multileg` para rutas SPOT devuelve un diccionario `unit_result` que no calcula ni contiene los campos físicos de tasas de carga/descarga (`actual_load_rate` y `actual_discharge_rate`). Sin embargo, el formateador del payload consolidado intentaba consumirlos mediante accesos directos por llave `unit_result["actual_load_rate"]`, gatillando un crash de tipo `KeyError`.
- **Solución Aplicada:**
  1. *Frontend (`CommercialForecast.tsx`):* Se extrajo el método de simulación a un helper reutilizable `runSimulationWith` y se configuró para ejecutarse de forma explícita e inmediata al final de `handleLoadSelected` con los datos recién leídos del escenario, eludiendo la race condition del `useEffect`. Además, se normalizaron todos los tipos numéricos recuperados de la BD (evitando que vengan como string) y se habilitó un alert visible para mostrar cualquier error del motor backend.
  2. *Backend (`forecast_service.py`):* Se modificaron los accesos a `actual_load_rate` y `actual_discharge_rate` usando `.get()` con fallback seguro en `0.0` para que el cálculo de rutas SPOT no crasheara por variables físicas no aplicables.
  3. *Unificación y Simplificación de Ribbon:* Se removieron las pestañas y componentes visuales de "Ruteador Spot" y "Multicotizador" del menú Ribbon de navegación en `CommercialForecast.tsx`. El **Estimador Excel** (`MultiCotizadorExcel.tsx`) hereda toda la capacidad funcional y actúa como el UI/UX consolidado del sistema para cotizar viajes multileg.
  4. *Compatibilidad de Cálculo en Matriz:* Se modificó `forecast_service.py` para detectar si una ruta guardada por el Estimador Excel (identificable por la presencia de la estructura `"tramos"` en `legs_data`) es cargada en la Matriz Financiera. En tal caso, el motor backend ejecuta dinámicamente la simulación multileg mediante `calculate_multicotizador_simulation` en lugar de `calculate_spot_multileg`, garantizando consistencia absoluta de datos entre el estimador individual y la matriz del forecast.

---
*Documento vivo mantenido por el equipo Geeksoft - Naviera Petral.*

---

## 6. 🎛️ Módulos del Ribbon — Mapa del Dashboard

El módulo **Commercial Forecast** comparte el Ribbon del dashboard con otros reportes especializados. La navegación lateral agrupa todas las vistas del sistema bajo un menú único simplificado:

| # | Módulo | Estado | Descripción |
|---|---|---|---|
| 1 | **Voyage Ledger** | ✅ Productivo | Auditoría detallada de cálculo por viaje (P&L unitario) |
| 2 | **Commercial Forecast** | ✅ Productivo | Matriz Financiera + Análisis Gráfico + Estimador Excel |
| 3 | **Mapa Espaguetis** | ✅ Productivo | Visualización geoespacial de rutas, fuentes y sumideros |

### Módulo 4: Mapa Espaguetis — Fuentes y Sumideros
El cuarto módulo del Ribbon es una vista geoespacial del Perú que superpone las rutas activas (espaguetis), los pie charts de carga/descarga por puerto y el market share de Petral como fuente o sumidero en cada terminal.

👉 Ver especificación completa: [[Especificacion.Mapa.Espaguetis]]

---

### 5.9 Corrección de Integridad en `projection_lines` y Selector de Cliente (2026-07-08)

#### Regla de llave compuesta en `projection_lines`

Se descubrió y corrigió un bug de **duplicidad silenciosa** en el estado React `projectionLines`. Al editar la frecuencia de un viaje, la función `handleFrequencyChange` usaba solo `destination_port_id` para buscar la línea a actualizar (`route_key.split('-')[1]`). Si el `findIndex` devolvía `-1`, se insertaba un nuevo registro en lugar de actualizar el existente.

**Regla definitiva establecida:**
> La llave natural de cada elemento de `projection_lines` son los **5 campos**: `client_id + origin_port_id + destination_port_id + vessel_id + month_index`. Toda función que lea, modifique o deduplique este array **debe** validar los 5 campos.

**Funciones corregidas en `CommercialForecast.tsx`:**
- `handleFrequencyChange` — comparación de 5 campos + deduplicación en caliente.
- `handleTariffChange` — mismo patrón que `handleFrequencyChange`.
- `handleLoadSelected` — deduplicación automática con `Map<string>` al cargar escenarios.

#### Selector de Cliente en `ForecastBuilder_V2`

Se corrigió un bug que impedía que `SPCC` apareciera en el selector "Cliente" de la barra de control de la Matriz Financiera. El `useEffect` de carga solo añadía clientes desde la tabla `spots` con `is_multicotizador === true`, tabla en la que SPCC no tiene registros (sus rutas son hardcodeadas).

**Regla definitiva establecida:**
> Clientes con rutas simples hardcodeadas (actualmente `SPCC`) deben declararse en el array `fixedClients` de `ForecastBuilder_V2.tsx`. Clientes con rutas multicotizador complejas (NEXA y futuros) aparecen dinámicamente desde la tabla `spots`.

---

### 5.10 Correcciones en Exportaciones, P/L Total Acumulado, Formateo y Maestros (Julio 2026)

#### P/L Total Acumulado (Columna TOTAL)
- **Problema:** En el reporte consolidado del P&L (Matriz Financiera), la columna de `TOTAL` sumaba de forma errónea la fila completa para métricas de carácter acumulativo (como saldo final de caja o márgenes acumulados), lo cual distorsionaba el resultado real del ejercicio.
- **Solución:** Se corrigió en `ForecastGrid.tsx` la función que calcula los totales de cada fila. Si la métrica es de tipo acumulado, la columna `TOTAL` toma el valor de la última columna de la serie de tiempo (el último mes de la proyección), mientras que para las métricas de flujo (como ingresos, costos, etc.) se mantiene la suma total de la fila.

#### Formato Numérico con Separador de Miles en Excel
- **Mejora:** Se refinó el exportador general de Excel para forzar el formateo numérico con separador de miles y formato monetario en todas las exportaciones del forecast, eliminando los números crudos planos y mejorando la legibilidad financiera de las planillas descargadas.

#### Descarga Humanizada de PDF y Excel en Maestros
- **Mejora:** Se integraron botones de exportación a PDF y Excel en todas las pantallas maestras del sistema (`Puertos`, `Rutas`, `Contratos`, `Gastos Portuarios`, `Clientes`, `Bunker`, `Embarcaciones`, `Originación/Destino`).
- **Humanización:** Las descargas no imprimen los IDs de base de datos directamente, sino que se mapean dinámicamente a nombres amigables legibles (ej. nombres completos de clientes, puertos de origen/destino reales, nombres de barcos).
- **Estilo de Impresión PDF:** Se estructuró un diseño en formato horizontal/apaisado con tipografía *Outfit*, alternancia de color en filas y el logotipo oficial de Naviera Petral, optimizando las columnas para evitar el desborde y asegurar que se imprima todo en una sola página limpia.

#### Corrección de Factores Climáticos (Maestro de Distancias)
- **Problema:** En la exportación a PDF de la matriz de distancias, los factores climáticos (`W-Laden` y `W-Ballast`) se exportaban en `0.0%` a pesar de que la interfaz de usuario mostraba un factor real como `3.0%`.
- **Causa:** En la base de datos se almacenan como decimal fraccionario (ej. `0.03`), mientras que la función de exportación esperaba una escala `0-100` (como la de los contratos) para formatearla a porcentaje.
- **Solución:** Se actualizó `RoutesMaster_V2.tsx` para multiplicar por `100` los factores climáticos durante la preparación de la exportación en `exportData`, logrando que tanto el PDF como el Excel muestren el porcentaje exacto y coincidan con la UI.

#### Rediseño de Pestañas de Puertos por País (Maestro de Originación / Destino)
- **Mejora:** Se rediseñó el selector horizontal de puertos en el Maestro de Originación / Destino para agrupar los puertos geográficamente por su país (Ecuador, Perú, Chile) en tres filas paralelas una sobre la otra. Cada fila cuenta con su etiqueta distintiva y su bandera correspondiente provista por `flagcdn.com`, optimizando el espacio en pantalla y organizando la planilla de capacidades de forma más intuitiva.

---
*Documento vivo mantenido por el equipo Geeksoft - Naviera Petral.*
