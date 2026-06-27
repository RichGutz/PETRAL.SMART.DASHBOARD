# 📈 Especificación: Commercial Forecast (Matriz Financiera & Análisis Gráfico)

Este documento detalla la arquitectura, reglas de negocio y funcionalidades implementadas en el módulo **Commercial Forecast** (Frontend React/Tailwind + Backend Python/Supabase) de la plataforma PETRAL.

---

## 1. 🏗️ Arquitectura del Módulo (Sandbox Multi-Escenario)
El módulo ha sido concebido no como un simple reporte, sino como un **"Área de Juegos" (Sandbox) Ejecutiva** que permite simular, proyectar y clonar escenarios navieros a lo largo de un horizonte de meses dinámicos.

### 1.1 Funcionalidad de Guardado (Save As)
- **Guardar como Nuevo (Clonar):** El motor permite "congelar" el estado actual del simulador (líneas de proyección agregadas, tarifas modificadas y frecuencias) y guardarlo en la Base de Datos como un registro nuevo (clon). Esto protege la integridad de escenarios de otros usuarios.
- **Sobrescribir Mi Escenario:** Sólo habilitado lógicamente si el `user_id` del escenario activo coincide con el autor original, permitiendo la actualización de una misma simulación sin ensuciar la base de datos.
- **Catálogo de Escenarios (Load Modal):** El backend devuelve todo el historial de simulaciones de la empresa. El Frontend inyecta un *Badge* inteligente (Ej: `Tuyo`) para destacar los escenarios propios del usuario actual sobre los del resto del equipo (Ej: `@usuario`).

---

## 2. 📊 Matriz Financiera (ForecastGrid.tsx)
Es el "cerebro numérico" interactivo. Transforma una lista plana de viajes simulados en un P&L anidado.

### 2.1 Jerarquía Visual y de Agrupación
Los datos se agrupan estrictamente en un árbol dinámico:
1. **Cliente** (Ej: SPCC, SPOT)
2.  ↳ **Ruta** (Ej: ILO-MATARANI)
3.     ↳ **Buque** (Ej: TABLONES)

### 2.2 Características Clave
- **Ordenamiento Dinámico (Draggable):** Botones direccionales (up/down) permiten reordenar clientes, rutas y buques al vuelo para priorizar la visualización en la presentación.
- **Acumulación de Subtotales y Totales Globales:** Cálculos en tiempo real (`useMemo`) que suman Viajes, Toneladas, Ingresos Brutos, Costos de Puerto, Costos de Bunker y Voyage Result (Margen).
- **Interacciones Contextuales (Click Derecho / Hover):** Menús interactivos permiten eliminar nodos (borrando en cascada) o ajustar frecuencias de viajes mensuales directamente en la matriz sin regresar al builder.

---

## 3. 📉 Análisis Gráfico (InteractiveChart.tsx con ECharts)
Es la capa de visualización ejecutiva del Commercial Forecast, diseñada para ser proyectada en salas de juntas. Sigue fielmente la estética corporativa **Petral Blue (`#0089CF`)**.

### 3.1 Layout y UX Responsiva
- **UI Minimalista:** Panel de control encapsulado a la izquierda con títulos orientados verticalmente (`writingMode: 'vertical-rl'`) para maximizar el área de dibujo.
- **Expansión Líquida (Flex):** Todo el contenedor del gráfico y su padre están programados con una arquitectura `flex flex-col flex-1` en Tailwind, garantizando que el gráfico absorba siempre el 100% del espacio vertical sobrante de la pantalla (ideal para pantallas grandes).
- **Pixel-Perfect Heights:** Cajas de selectores y botones estandarizados a `h-8` (`32px`), con el botón maestro PETRAL abarcando `h-[70px]` para alinear matemáticamente con dos filas de controles adyacentes.

### 3.2 Lógica de Agrupación (Pivot)
El usuario puede pivotar la perspectiva del gráfico con un solo clic:
- **Botón Macro PETRAL:** Consolida la data entera de la empresa en un solo bloque (Total Compañía).
- **Filtros Detallados:** Agrupaciones por Cliente, Ruta o Buque individual.

### 3.3 Ejes Primarios y Secundarios Inteligentes
El motor soporta la graficación dual de métricas del P&L:
- **Gráficos Multi-Forma:** El usuario puede elegir representar los datos en Barras (Agrupadas), Barras Apiladas (Stack) o Líneas Suavizadas.
- **Acumulados Híbridos (El Santo Grial Ejecutivo):** 
  - Al activar **"Acumulado Global"** y **"Mostrar en %"**, el motor ECharts inyecta dinámicamente una nueva serie (Línea Punteada).
  - Esta línea suma la contribución de todas las barras (ej. Voyage Result) mes a mes, forzando matemáticamente que el último mes del horizonte alcance siempre el **100%** de la métrica proyectada.
- **Glitch de Tooltips (Resuelto):** El motor ECharts fue parcheado para que las series globales calculadas al vuelo retengan en su objeto interno de datos (`p.data.rawVal`) los valores numéricos brutos, evitando crashes (excepciones) en la herramienta de *hover*.

---
*Documento vivo mantenido por el equipo Geeksoft - Naviera Petral.*
