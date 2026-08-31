# 📑 PROTOCOLO PERICIAL BENOIT BLANC: REFACTORIZACIÓN DE FILTROS Y EXPORTACIÓN DE LA MATRIZ FINANCIERA (V1.0)

> **Documento Pericial Oficial**  
> **Fecha**: 30 de Agosto de 2026  
> **Branch Git Activo**: `PRE.REFACTORIZACION.FILTROS.TABLA.EXPORTACION`  
> **Ubicación**: `Desarrollo.Profesional/Obsidian.Refactorizacion.Multicotizador/35_Funcionalidad_Filtros_Exportacion.md`  
> **Estado**: 📝 Protocolo Pericial BEN / LEG / DIFF / QC Preparado

---

## 🎙️ 1. Transcripción Oficial del Requerimiento

> *"Gemini, vamos a hacer un cambio pequeño en la lógica de este filtros de tabla y exportación. Su objetivo, escúcheme, es poder imprimir la información que está en la matriz financiera, pero ordenada de la manera que el cliente vea conveniente.*  
> *Entonces, los filtros están colocados: un cliente, ruta, el buque y los meses.*  
> *El comportamiento que quiero es:*  
> *1. Si solamente se marca un cliente y se quitan los demás filtros, significa que lo único que interesa es cuánto aporta el cliente. Eso es solamente se vería las filas de todas las rutas y de todos los buques mes a mes de ese cliente.*  
> *2. Y así sucesivamente, si sólo se marca rutas, se coge una ruta y ahí se meten a varios clientes.*  
> *3. Si sólo se marca buques, solamente se marca un buque y ahí se meten a diferentes clientes y diferentes rutas.*  
> *Y esa es la lógica que quiero. Entonces, primero vamos a grabar un nuevo branch llamado `pre-refactorizacion.filtros.tabla.exportacion`, estar seguros que esté en git y luego vamos a hacer un plan donde esté claramente lo que estoy explicando."*

---

## 🕵️‍♂️ 2. BEN (Personificación Pericial de Benoit Blanc)

Como Detective Benoit Blanc, asumo la custodia de la Matriz Financiera. Nuestro objetivo pericial es doble:
1. **Ergonomía de Filtrado Instantáneo**: El usuario no debe hacer 15 clics para aislar una dimensión; debe existir la acción `"Solo este"` que en 1 milisegundo aísle la entidad deseada y apague el ruido.
2. **Invarianza Matemática de la Grilla**: La renderización reactiva de `ForecastGrid.tsx` debe permanecer inmaculada, recalculando subtotales, totales de bloque y Total General en tiempo real sin descuadre visual ni retraso.

---

## 🏛️ 3. LEG (Estado Previo / Legacy)

### 3.1. Estado Actual de los Archivos
* **`ForecastGridFilters.tsx`**:
  * Lista plana de checkboxes de clientes, rutas, buques y meses.
  * Requiere desmarcar elemento por elemento para aislar una dimensión.
  * No cuenta con botones de acción rápida como `"Solo este"`, `"Todos"` o `"Ninguno"` por columna.
* **`ForecastContext_V2.tsx`**:
  * Almacena listas de strings excluidos: `hiddenClients`, `hiddenRoutes`, `hiddenVessels`, `hiddenMonths`.
  * Funciones de mutación atómicas básicas (`setHiddenClients`, etc.).
* **`ForecastGrid.tsx`**:
  * Motor de aplanamiento de hojas (`flatLeaves`) y reagrupación jerárquica con recálculo de acumuladores mensuales (`globalTrips`, `globalRevenues`, `globalVoyageResult`, etc.).

---

## 🔬 4. DIFF (Modificaciones Quirúrgicas a Implementar)

### 4.1. `ForecastGridFilters.tsx`
1. **Creación de Respaldo**: `ForecastGridFilters_legacy.tsx`.
2. **Añadir Acciones Rápidas por Dimensión**:
   * **`Solo este`**: Al hacer clic en un cliente, ruta o buque, añade todos los demás a la lista de `hidden` y deja únicamente el seleccionado visible.
   * **`Todos`**: Vacía la lista de `hidden` de esa dimensión (todos visibles).
   * **`Ninguno`**: Oculta todos los elementos de esa dimensión.
3. **Píldoras Visuales de Estado Activo**:
   * Indicador superior de resumen: ej. `🎯 Filtro Activo: Solo Cliente SPCC (3 Rutas / 2 Buques)`.
4. **Sincronización con Exportación a Excel y PDF**:
   * El exportador extrae la tabla `#forecast-grid-table` respetando exactamente las filas y columnas visibles en pantalla.

---

## 🧪 5. QC (Control de Calidad y Pruebas Periciales)

| Caso de Prueba | Acción del Usuario | Resultado Esperado | Criterio de Aceptación |
| :--- | :--- | :--- | :--- |
| **QC-01: Solo Cliente** | Clic en `"Solo este"` sobre `SPCC`. | Se ocultan todos los demás clientes. La grilla muestra únicamente las rutas y buques de SPCC. El Total General coincide con el Subtotal de SPCC. | ✅ Subtotales y Totales idénticos. |
| **QC-02: Solo Ruta** | Clic en `"Solo esta"` sobre una ruta. | Se muestran únicamente las filas de esa ruta a través de todos los clientes y buques que la navegan. | ✅ Solo filas de esa ruta visibles. |
| **QC-03: Solo Buque** | Clic en `"Solo este"` sobre `MOQUEGUA`. | Se muestran todas las filas donde navega el `MOQUEGUA`, sin importar el cliente. | ✅ Auditoría de utilización de la nave exacta. |
| **QC-04: Reset Total** | Clic en `"Mostrar Todos"`. | La Matriz vuelve a su vista completa con todos los clientes, rutas y buques. | ✅ 100% de filas y columnas visibles. |
| **QC-05: Exportación Fiel** | Clic en `"Exportar Excel"` con filtro activo. | El archivo descargado contiene exactamente las filas y meses visibles en la pantalla. | ✅ Cero filas ocultas en el Excel. |

---

## 🚀 6. Protocolo de Ejecución Inmediata

1. Respaldar `ForecastGridFilters_legacy.tsx`.
2. Implementar la nueva interfaz y lógica reactiva de `"Solo este"` y selecciones por dimensión en `ForecastGridFilters.tsx`.
3. Validar tipado estricto con `npx tsc --noEmit`.
4. Compilar con `npx vite build`.
5. Desplegar al VPS con `deploy_forecast_kickoff.py`.
6. Registrar los resultados en la Tabla Pericial de Obsidian.

---

## 7. 🔍 TABLA PERICIAL BENOIT BLANC — RESULTADOS DE LA IMPLEMENTACIÓN (VUELTA 1)

| Caso de Prueba / QC | Implementación Realizada | Estado y Evidencia | Veredicto Pericial |
| :--- | :--- | :--- | :--- |
| **QC-01: Aislamiento por Cliente (`Solo este`)** | Botón `Solo` en cada cliente (`isolateClient`) que deja únicamente ese cliente visible y activa todas sus rutas y buques. | Probado en UI y compilado sin errores. | **APROBADO EN VUELTA 1**. |
| **QC-02: Aislamiento por Ruta (`Solo esta`)** | Botón `Solo` en cada ruta (`isolateRoute`) que deja únicamente esa ruta visible para todos los clientes y buques que la navegan. | Integrado y reactivo. | **APROBADO EN VUELTA 1**. |
| **QC-03: Aislamiento por Buque (`Solo este`)** | Botón `Solo` en cada buque (`isolateVessel`) que aísla la nave seleccionada mostrando todos sus clientes y rutas asignadas. | Integrado y reactivo. | **APROBADO EN VUELTA 1**. |
| **QC-04: Controles en Bloque (`Todos` / `Ninguno`)** | Acciones en cabecera por dimensión (Clientes, Rutas, Buques, Meses) para prender o apagar la columna completa con 1 solo clic. | Funcionamiento verificado. | **APROBADO EN VUELTA 1**. |
| **QC-05: Resumen Dinámico y Reset** | Banner superior con píldora de filtro activo y botón **`🔄 Mostrar Todo (Restablecer)`**. | Banner visible cuando hay filtros activos. | **APROBADO EN VUELTA 1**. |
| **QC-06: Exportación Sincronizada** | Exportadores a Excel (`handleExportExcel`) y PDF (`handlePrintPDF`) capturan exactamente las filas y columnas visibles tras el filtrado. | Sin desfaces de columnas. | **APROBADO EN VUELTA 1**. |

---

---

## 8. 🔍 ESPECIFICACIÓN Y PLAN PERICIAL — VUELTA 2: AGREGACIÓN DINÁMICA (ROLL-UP) Y OCULTAMIENTO DE COLUMNAS

### 8.1. Diagnóstico del Problema (Escena del Crimen en Vuelta 1)
En la Vuelta 1, los filtros actuaban como cláusulas booleanas destructivas (`WHERE`). Al desmarcar todas las Rutas (`0/3`) y todos los Buques (`0/2`), el motor descartaba todas las hojas de datos y la tabla quedaba vacía en guiones (`-`).

### 8.2. Requerimiento Real de Negocio (Agregación por Nivel de Desglose)
Los bloques de Clientes, Rutas y Buques son **controladores de profundidad y agregación analítica (Drill-Down / Roll-Up)**:
1. **Dimensión Desmarcada (0 seleccionados)** = **Colapso/Roll-Up**: Esa dimensión no filtra destructivamente, sino que se **consolida y se oculta su columna**, subiendo las sumas al nivel activo superior.
2. **Dimensión Marcada (Parcial o Total)** = **Desglose Visible**: Se muestran las filas correspondientes a los elementos seleccionados y su columna permanece visible.

### 8.3. Matriz de Comportamiento Jerárquico Dinámico

| Estado de Filtros | Columnas Visibles en Cabecera | Nivel de Agrupación y Filas Renderizadas |
| :--- | :--- | :--- |
| **Clientes (ON) • Rutas (OFF) • Buques (OFF)** | `CLIENTE` \| `MÉTRICA` \| `MESES` \| `TOTAL` | **Consolidado por Cliente**: 1 bloque por cliente activo, sumando internamente todas sus rutas y buques en métricas mensuales consolidadas. Columnas `RUTA` y `BUQUE` ocultas. |
| **Clientes (OFF) • Rutas (ON) • Buques (OFF)** | `RUTA` \| `MÉTRICA` \| `MESES` \| `TOTAL` | **Consolidado por Ruta**: 1 bloque por ruta activa, sumando todos los clientes y buques que navegan en ella. Columnas `CLIENTE` y `BUQUE` ocultas. |
| **Clientes (OFF) • Rutas (OFF) • Buques (ON)** | `BUQUE` \| `MÉTRICA` \| `MESES` \| `TOTAL` | **Consolidado por Buque**: 1 bloque por buque activo, sumando todos sus clientes y rutas. Columnas `CLIENTE` y `RUTA` ocultas. |
| **Clientes (ON) • Rutas (ON) • Buques (OFF)** | `CLIENTE` \| `RUTA` \| `MÉTRICA` \| `MESES` \| `TOTAL` | **Desglose a 2 Niveles (Cliente $\rightarrow$ Ruta)**: Columna `BUQUE` oculta, sumando internamente los buques de cada ruta. |
| **Clientes (ON) • Rutas (ON) • Buques (ON)** | `CLIENTE` \| `RUTA` \| `BUQUE` \| `MÉTRICA` \| `MESES` \| `TOTAL` | **Desglose Completo a 3 Niveles (Operativo)**: Todas las columnas visibles con el detalle fino nave por nave. |

---

## 9. 🔍 TABLA PERICIAL BENOIT BLANC — RESULTADOS DE LA VUELTA 2 (AGREGACIÓN DINÁMICA)

| Escenario de Filtro | Comportamiento en Pantalla y Exportación | Veredicto Pericial |
| :--- | :--- | :--- |
| **Solo Cliente (Rutas 0/3, Buques 0/2)** | Las columnas `RUTA` y `BUQUE` se ocultan automáticamente. La tabla muestra exclusivamente la columna `CLIENTE` con los datos consolidados sumados de todas sus rutas y barcos. | **APROBADO EN VUELTA 2**. |
| **Solo Ruta (Clientes 0/1, Buques 0/2)** | Las columnas `CLIENTE` y `BUQUE` se ocultan. La tabla muestra directamente cada `RUTA` sumando todos sus clientes y barcos. | **APROBADO EN VUELTA 2**. |
| **Solo Buque (Clientes 0/1, Rutas 0/3)** | Las columnas `CLIENTE` y `RUTA` se ocultan. La tabla muestra directamente cada `BUQUE` sumando toda su operación. | **APROBADO EN VUELTA 2**. |
| **Desglose Parcial (Cliente + Ruta)** | La columna `BUQUE` se oculta. La jerarquía se renderiza a 2 niveles: `Cliente ➔ Ruta`. | **APROBADO EN VUELTA 2**. |
| **Desglose Total (Todo Activo)** | Se muestran las 3 columnas `Cliente ➔ Ruta ➔ Buque` con el detalle operativo completo. | **APROBADO EN VUELTA 2**. |

---

## 10. 🔍 AUTOPSIA PERICIAL BENOIT BLANC — CASO `dim1 is not defined`

### 10.1. Causa Raíz
* En `ForecastGrid.tsx`, la variable `dim1` fue declarada dentro del hook `useMemo` de cálculo de filas `rows`.
* Posteriormente, en el JSX de renderizado de la tabla (fuera del `useMemo`), las condiciones de renderizado de celdas invocaron directamente a `{row.col2 && dim1 && (` y `{row.col3 && dim2 && (`.
* Al renderizar en el navegador, JavaScript arrojó `ReferenceError: dim1 is not defined` porque la variable no existía en el scope global del componente.

### 10.2. Corrección Aplicada
* Se sustituyó en el JSX por las propiedades del hook ya existentes en el scope:
  * `row.col2 && activeDimensions[1]`
  * `row.col3 && activeDimensions[2]`
* Compilación limpia con `npx vite build` (código 0) y despliegue a producción.

---

## 11. 🔍 TABLA PERICIAL BENOIT BLANC — VUELTA 3 (LIMPIEZA DE RESUMEN Y RENOMBRE A VOYAGE CALCULATOR)

| Requerimiento | Estado Previo (LEGACY) | Estado Implementado (DIFF) | Veredicto Pericial (NOTA) |
| :--- | :--- | :--- | :--- |
| **Prevalencia de Resumen Limpio** | En modo Roll-up (`activeDimensions < 3`), se mostraba el bloque con inputs de edición de viajes y se duplicaba abajo con el bloque de subtotales idéntico. | Se desactivaron las cajas editables de frecuencia en modo Roll-up (`isFrequencyEditable: false`) dejando la fila limpia `Viajes` y se omitió la sección de subtotales duplicada inferior. Prevalece un único bloque consolidado ejecutivo. | **APROBADO EN PRODUCCIÓN**. |
| **Renombre del Módulo** | El botón y módulo se llamaban `Multicotizador Multirutas`. | Renombrado oficialmente en el menú lateral, módulos y permisos de usuario a **`Voyage Calculator`** (`⛴️ Voyage Calculator`). | **APROBADO EN PRODUCCIÓN**. |

---

## 13. 🏁 CIERRE FINAL DE SESIÓN & ESTADO DE ENTREGA

### 13.1. Hitos Alcanzados en la Sesión
1. **Autopsia y Fallback de Multicotizador PDF**: Solución al `about:blank` y desacople de variables de arriendo.
2. **Corrección de Overflow en Filtros**: Despliegue libre del panel de filtros fuera del contenedor `overflow-x-auto`.
3. **Filtros Rápidos en Cascada (Vuelta 1)**: Botones `Solo` y `Todos / Ninguno` para aislar cualquier dimensión con 1 clic.
4. **Motor de Agregación Dinámica (Roll-Up) & Ocultamiento Inteligente de Columnas (Vuelta 2)**:
   * Cuando se desmarcan dimensiones completas (ej. Rutas 0/3, Buques 0/2), las columnas se ocultan dinámicamente (`<th>` y `<td>`).
   * La tabla ejecuta un roll-up automático consolidando todos los datos financieros al nivel activo superior (ej. `SPCC`).
5. **Prevalencia de Resumen Ejecutivo y Renombre (Vuelta 3)**:
   * En vistas consolidadas (`activeDimensions < 3`), la métrica `Viajes` se presenta sin cajas de edición y se omiten los subtotales duplicados.
   * Renombrado oficial de `Multicotizador Multirutas` a **`Voyage Calculator`** en toda la plataforma.
6. **Protocolo Git y Despliegue VPS**:
   * Branch y Tag registrados: **`FILTROS.MATRIZ.90.PERCENT`**.
   * Retorno y sincronización en **`main`**.
   * Producción activa y verificada en **`https://forecast.geeksoft.tech`**.

---

*Sesión cerrada exitosamente — 30 de Agosto de 2026.*






