# 36. Registro Pericial de Pedidos de Usuario - Matriz Financiera (31.08.2026)

**Documento:** Requerimientos de Despliegue y Totalización de Parciales de Net Revenue  
**Fecha de Registro:** 31 de Agosto de 2026  
**Módulo Afectado:** Matriz Financiera (`FinancialMatrix.jsx` / Grilla Multicotizador)  
**URL Producción:** `https://forecast.geeksoft.tech/dashboard`  

---

## 1. Contexto y Diagnóstico Visual de las Capturas

A partir de la auditoría visual de las 3 capturas de pantalla de la Matriz Financiera en producción, se identifican las siguientes discrepancias en el comportamiento del acordeón y la agregación de métricas de **Net Revenue**:

```
+---------------------------------------------------------------------------------------------------+
| NIVEL DE FILA              | ESTADO ACTUAL (LEGACY)                  | COMPORTAMIENTO REQUERIDO   |
+----------------------------+-----------------------------------------+----------------------------+
| 1. Nivel Buque / Ruta      | Tiene desplegable pero requiere         | Desplegable 100% operativo |
|    (Individual)            | totalizar y cuadrar parciales           | y suma exacta de parciales |
+----------------------------+-----------------------------------------+----------------------------+
| 2. Nivel Subtotal Cliente  | Fila plana sin icono '>' / 'v'.         | Desplegable con suma de    |
|    (SUBTOTAL / TOTAL CL.)  | No desglosa parciales de cliente        | parciales de sus buques    |
+----------------------------+-----------------------------------------+----------------------------+
| 3. Nivel Total Flota       | Fila plana estática sin desplegable.    | Desplegable con suma total |
|    (TOTAL FLOTA)           | No totaliza componentes globales        | de flota por cada parcial  |
+----------------------------+-----------------------------------------+----------------------------+
| 4. Nivel Total Acumulado   | Fila plana estática sin desplegable.    | Desplegable con suma       |
|    (TOTAL ACUMULADO)       | No desglosa acumulados parciales        | acumulada mes a mes        |
+----------------------------+-----------------------------------------+----------------------------+
```

---

## 2. Detalle de Requerimientos por Imagen

### ?? Imagen 1: Nivel Detalle por Buque / Ruta Individual
- **Observación del Usuario:** *"Que se abra el desplegable y que totalice parciales."*
- **Detalle Técnico:**
  - En la fila individual del buque (ej. `CALLAO-MARCONA -> MOQUEGUA`), la métrica `Net Revenue [Net]` posee el indicador desplegable (`v`).
  - Al abrirse, despliega las sub-métricas:
    - `(+) Freight Revenue`
    - `(+) Demurrage`
    - `(+) Dockage Revenue`
    - `(+) Gross Revenue`
    - `(-) Comisiones`
  - **Requerimiento:** Asegurar que el desplegable abra/cierre fluidamente y que la suma horizontal de cada parcial totalice con precisión en la columna **`TOTAL ACUM`**, verificando la consistencia matemática:
    $$\text{Gross Revenue} = \text{Freight Revenue} + \text{Demurrage} + \text{Dockage Revenue}$$
    $$\text{Net Revenue} = \text{Gross Revenue} - \text{Comisiones}$$

---

### ?? Imagen 2: Nivel Subtotal por Cliente (`SUBTOTAL / TOTAL CLIENT`)
- **Observación del Usuario:** *"El net revenue totalizado no se despliega ni totaliza."*
- **Detalle Técnico:**
  - En la sección inferior del cliente (ej. `NEXA`), la fila agregada `Net Revenue` se muestra actualmente como un texto plano estático sin control de apertura (`>` / `v`).
  - **Requerimiento:**
    1. Habilitar el control desplegable (`>` / `v`) idéntico al nivel individual.
    2. Al desplegar `Net Revenue` en el subtotal del cliente, deben aparecer las filas hijas agregadas:
       - `(+) Freight Revenue` (Suma de los fletes de todos los buques del cliente en el mes)
       - `(+) Demurrage` (Suma de demoras de todos los buques del cliente en el mes)
       - `(+) Dockage Revenue` (Suma de ingresos por muellaje del cliente en el mes)
       - `(+) Gross Revenue` (Suma de ingresos brutos del cliente en el mes)
       - `(-) Comisiones` (Suma de comisiones del cliente en el mes)
    3. Cada una de estas sub-métricas debe calcular su respectivo valor en la columna final **`TOTAL ACUM`**.

---

### ?? Imagen 3: Niveles Globales (`TOTAL FLOTA` y `TOTAL ACUMULADO`)
- **Observación del Usuario:** *"Misma historia para total flota y total acumulado... no despliega ni totaliza."*
- **Detalle Técnico:**
  
#### A. En el bloque `TOTAL FLOTA`:
- La fila `Net Revenue` consolida la flota completa mes a mes pero carece de acordeón desplegable.
- **Requerimiento:**
  1. Incorporar control desplegable interactivo (`>` / `v`).
  2. Desplegar los 5 componentes parciales consolidados para toda la flota:
     - `(+) Freight Revenue`
     - `(+) Demurrage`
     - `(+) Dockage Revenue`
     - `(+) Gross Revenue`
     - `(-) Comisiones`
  3. Totalizar horizontalmente en la columna **`TOTAL ACUM`**.

#### B. En el bloque `TOTAL ACUMULADO`:
- La fila `Net Revenue` muestra la suma progresiva acumulada mensual ($Mes_n = \sum_{i=1}^n Mes_i$).
- **Requerimiento:**
  1. Incorporar control desplegable interactivo (`>` / `v`).
  2. Desplegar la evolución acumulada mes a mes de cada sub-métrica parcial:
     - Acumulado progresivo de `Freight Revenue`
     - Acumulado progresivo de `Demurrage`
     - Acumulado progresivo de `Dockage Revenue`
     - Acumulado progresivo de `Gross Revenue`
     - Acumulado progresivo de `Comisiones`
  3. Totalizar en la columna final **`TOTAL ACUM`** reflejando el valor de cierre anual.

---

## 3. Respaldo de Capturas de Pantalla (Evidencia Local)

Conforme a las reglas del proyecto, las 3 capturas enviadas han sido respaldadas en alta resolución en:
1. `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Maestro.Costos.Portuarios\PNGs\`
2. `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.PATRICIA\`

---

## 4. Resolución Forense Implementada y QC en Producción

### Acciones Aplicadas en [`ForecastGrid.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/ForecastGrid.tsx):
1. **Acordeones y Sub-filas Integradas en Todos los Niveles:**
   - **Subtotal Cliente (`SUBTOTAL / TOTAL CLIENT`):** Se añadió el control interactivo (`>` / `v`) a `Net Revenue` (`subtotal-gross-${level1Name}`) y se implementó la inyección de los 5 parciales consolidados (`Freight`, `Demurrage`, `Dockage`, `Gross` y `Comisiones`) ajustando dinámicamente el `rowSpan` del cliente.
   - **Total Flota (`TOTAL FLOTA`):** Se integró el control desplegable (`global-total-gross`) y sus 5 sub-filas de desglose global con ajuste dinámico de `rowSpan`.
   - **Total Acumulado (`TOTAL ACUMULADO`):** Se integró el control desplegable (`global-acum-gross`) y la progresión acumulada mes a mes de cada parcial.
2. **Totalización de Parciales en `TOTAL ACUM`:**
   - Se removió la condición que forzaba `-` en las sub-filas hijas y se implementó la suma horizontal de visible months (`visibleTotal`) formateada como moneda para todas las métricas de ingreso y costo.
3. **Compilación y Build:**
   - `npx vite build` completado con éxito (0 errores).
4. **Despliegue Directo al VPS (`91.108.125.253`):**
   - Ejecutado mediante `Push.VPS/deploy_forecast_kickoff.py`.
   - Producción en vivo verificada en: **`https://forecast.geeksoft.tech`**.

---

## 5. Plan Macro de Cierre: Convergencia de Matriz Financiera con Análisis Gráfico y Spaghetti Map

**Origen del Requerimiento:** Audio [`conexion.final.matriz.an.graf.spa.ogg`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/audio_transcrip/conexion.final.matriz.an.graf.spa.ogg)  
**Procesado con:** Whisper Model (Base) en [`transcribe_whisper.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/audio_transcrip/transcribe_whisper.py)  

### 5.1. Transcripción Literal del Audio

> *"Gemini, nos toca el gran final del proyecto. El user ya probó Voyage Calculator, que genera todas las rutas. Luego la consolidación de las rutas se da en matriz financiera, que ya está produciendo los resultados adecuados, matriz financiera graba escenarios y esos escenarios se replican en análisis gráfico y en spaghetti map. Dado que Voyage está ok y matriz está ok, tenemos que coger la data mostrada como escenario cargado en matriz financiera y replicarla exactamente en análisis gráfico y spaghetti map. Entonces solamente es un ejercicio de en el caso de análisis gráfico, fijarse en las categorías de los indicadores que están en el eje primario y en el eje secundario y que sigan la lógica que ya estaba allí, no hay que inventar una lógica, la lógica ya estaba allí, ok, entonces utilizamos el método de siempre, que es el método clonar el legacy etc., y hallar las diferencias control de calidad, ese es el método que vamos a hacer."*

---

### 5.2. Diagnóstico de la Cadena de Valor del Sistema PETRAL

```
+---------------------------------------------------------------------------------------------------+
| 1. VOYAGE CALCULATOR        -> Generación de rutas individuales, fletes base y costos (100% OK)   |
| 2. MATRIZ FINANCIERA        -> Consolidación multi-ruta, multi-buque y guardado de Escenarios     |
|                                (100% OK y Desplegado en VPS)                                      |
| 3. ANÁLISIS GRÁFICO (ECharts)-> Consumir el escenario cargado en Matriz Financiera respetando      |
|                                Eje Primario (Montos/TM) y Eje Secundario (TCE/Días/%)             |
| 4. SPAGHETTI MAP            -> Visualización geoespacial sincronizada con el escenario de Matriz  |
+---------------------------------------------------------------------------------------------------+
```

---

### 5.3. Plan de Acción Metodológico (Método BEN / LEG / DIFF / QC / VPS)

#### Paso 1: LEG (Captura del Estado Legacy)
- Inspeccionar [`src/pages/Tools/GraphicAnalysis_V2.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Tools/GraphicAnalysis_V2.tsx) y [`src/pages/Tools/SpaghettiMap_V2.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Tools/SpaghettiMap_V2.tsx).
- Registrar cómo consumen actualmente el contexto `useForecastContext_V2` o los servicios de escenarios guardados.

#### Paso 2: DIFF (Alineación de Datos y Parámetros)
1. **Análisis Gráfico (Apache ECharts):**
   - Asegurar que la fuente de datos provenga idénticamente de `aggregated_data` y las proyecciones del escenario activo de la Matriz Financiera.
   - Respetar la parametrización de ejes ya existente:
     - **Eje Primario (Izquierdo):** Ingresos Netos (USD), Costos Operativos (USD), Toneladas Transportadas (MT).
     - **Eje Secundario (Derecho):** TCE Realizado ($/d), Días-Buque, Margen / P&L (%).
   - CERO reinvención de lógica: apego estricto a las series e indicadores ya definidos en el legacy.
2. **Spaghetti Map (Mapbox / GeoJSON):**
   - Conectar las líneas de ruta, puertos de origen/destino y frecuencias mensuales directamente con las rutas del escenario cargado en la Matriz.

#### Paso 3: QC (Control de Calidad en Terminal)
- Ejecutar `npx vite build` para validar que no existan errores de tipos, dependencias o sintaxis.
- Verificar consistencia numérica entre los totales de la Matriz Financiera y los valores renderizados en las series de gráficos.

#### Paso 4: VPS (Despliegue a Producción)
- Merge a `main` y Git Push.
- Despliegue automatizado SFTP/SSH con `Push.VPS/deploy_forecast_kickoff.py` (Cero Railway).
- Validación final en vivo en `https://forecast.geeksoft.tech`.

---

## 6. Tabla Pericial de Indicadores: Análisis Gráfico (Legacy vs Nueva Matriz Financiera)

A continuación se detalla la matriz de contraste pericial entre los indicadores que existían previamente en `InteractiveChart.tsx` (Legacy) y los **nuevos campos y métricas auditales** generados por la nueva versión de la **Matriz Financiera**, especificando su asignación de eje y la acción técnica requerida para la integración:

```
+---------------------------------------------------------------------------------------------------------------------------------------+
| CATEGORÍA / INDICADOR           | EJE SUGERIDO | UNIDAD  | ESTADO EN LEGACY (Gráfico Antiguo) | ESTADO ACTUAL (Nueva Matriz) | ACCIÓN DE CONEXIÓN REQUERIDA             |
+---------------------------------+--------------+---------+------------------------------------+------------------------------+------------------------------------------+
| 1. INGRESOS Y REVENUE           |              |         |                                    |                              |                                          |
| • Net Revenue                   | Primario     | USD     | No existía (Confundido c/ Flete)   | Métrica Oficial (Gross-Com)  | [CONECTAR NUEVO] net_revenue             |
| • Freight Revenue (Flete Puro)  | Primario     | USD     | Llamado 'net_income' (Ambiguo)     | Flete Base Puro (P x Q x F)  | [HOMOLOGAR] freight_revenue              |
| • Demurrage Revenue             | Primario     | USD     | Calculado solo con % global        | Nativo + % + Días x Tarifa   | [HOMOLOGAR] demurrageArr sincronizado    |
| • Dockage Revenue (Refacturado) | Primario     | USD     | No existía                         | Refacturación de Muellaje    | [CONECTAR NUEVO] refacturacionMuellaje   |
| • Gross Revenue                 | Primario     | USD     | Nombrado 'gross_plus_dem'          | Flete + Demurrage + Dockage  | [HOMOLOGAR] grossRevenues consolidado    |
| • Comisiones (Address + Broker) | Primario     | USD     | No existía                         | Total Comisiones en USD      | [CONECTAR NUEVO] commissions             |
+---------------------------------+--------------+---------+------------------------------------+------------------------------+------------------------------------------+
| 2. COSTOS OPERATIVOS            |              |         |                                    |                              |                                          |
| • Hire (TCE x días)             | Primario     | USD     | No existía en el selector          | Costo Hire (TCE_req x Días)  | [CONECTAR NUEVO] tceCostTotal / hire     |
| • Bunker Costs Total            | Primario     | USD     | Soportado ('total_bunker_costs')   | Soportado con delta demora   | [MANTENER / HOMOLOGAR] total_bunker_costs|
|   - Bunker IFO Cost             | Primario     | USD     | No disponible en selector          | Disponible en hoja mensual   | [OPCIONAL] bunker_ifo_cost               |
|   - Bunker MDO Cost             | Primario     | USD     | No disponible en selector          | Disponible en hoja mensual   | [OPCIONAL] bunker_mdo_cost               |
| • Port Costs Netos (Sin Dockage)| Primario     | USD     | Incluía muellaje ('total_port')    | Neto sin muellaje            | [HOMOLOGAR] portCosts (deducido dockage) |
| • Dockage Cost (Muellaje)       | Primario     | USD     | No desglosado                      | Gasto de muellaje            | [CONECTAR NUEVO] dockageCosts            |
| • Arriendo de Naves             | Primario     | USD     | No existía                         | Gasto Charter Hire           | [CONECTAR NUEVO] charterHireCosts        |
+---------------------------------+--------------+---------+------------------------------------+------------------------------+------------------------------------------+
| 3. RESULTADOS ECONÓMICOS        |              |         |                                    |                              |                                          |
| • Voyage Result (P&L Operativo) | Primario     | USD     | Soportado ('voyage_result')        | Net Rev - Port - Bunk - Arr  | [HOMOLOGAR FÓRMULA] voyageResult         |
| • P/L Neto vs Requerido         | Primario     | USD     | Soportado ('pl_vs_required')       | Voyage Result - Hire TCE     | [HOMOLOGAR FÓRMULA] plVsRequired         |
| • Margen P/L (%)                | Secundario   | %       | Soportado ('pl_percentage')        | Ratio P/L sobre Ingreso      | [MANTENER / HOMOLOGAR] pl_percentage     |
+---------------------------------+--------------+---------+------------------------------------+------------------------------+------------------------------------------+
| 4. MÉTRICAS DE EFICIENCIA (TCE) |              |         |                                    |                              |                                          |
| • TCE Realizado                 | Secundario   | USD/día | No existía                         | Voyage Result / Días Totales | [CONECTAR NUEVO] tceReal ($/d)           |
| • TCE Requerido                 | Secundario   | USD/día | No existía                         | Tarifa Requerida de Nave     | [CONECTAR NUEVO] tceReq ($/d)            |
| • Diferencial TCE (+/-)         | Secundario   | USD/día | No existía                         | TCE Real - TCE Requerido     | [CONECTAR NUEVO] tceDiff ($/d)           |
+---------------------------------+--------------+---------+------------------------------------+------------------------------+------------------------------------------+
| 5. OPERATIVAS Y RENDIMIENTO     |              |         |                                    |                              |                                          |
| • Viajes (Frecuencia Mensual)   | Secundario   | viajes  | Soportado ('viajes')               | Frecuencia mensual           | [MANTENER] trips                         |
| • Toneladas Transportadas       | Primario     | MT      | Soportado ('total_cargo')          | Carga Q x Frecuencia         | [MANTENER] tonsTotal                     |
| • Días-Buque / Duración Total   | Secundario   | días    | Soportado ('total_duration')       | Días dinámicos c/ demora     | [HOMOLOGAR] nodeShipDays                 |
| • Yield Flete                   | Secundario   | USD/MT  | Soportado ('yield_flete')          | Flete / Toneladas            | [MANTENER] yield_flete                   |
| • Yield Total                   | Secundario   | USD/MT  | Soportado ('yield')                | Gross / Toneladas            | [MANTENER] yield                         |
+---------------------------------+--------------+---------+------------------------------------+------------------------------+------------------------------------------+
```

---

## 7. Plan de Implementación de Nuevos Selectores en `InteractiveChart.tsx`

1. **Ampliación de `metricOptions`:**
   - Incorporar los nuevos indicadores en el dropdown interactivo con iconos y descripciones contextuales:
     - 💎 **`net_revenue`**: *"Net Revenue (Gross - Comisiones)"* [USD]
     - 🚢 **`freight_revenue`**: *"Freight Revenue (Flete Base)"* [USD]
     - ⚓ **`dockage_revenue`**: *"Dockage Revenue (Refacturación Muellaje)"* [USD]
     - 💼 **`commissions`**: *"Comisiones Totales (Address + Broker)"* [USD]
     - ⏱️ **`tce_cost_hire`**: *"Costo Hire (TCE x Días)"* [USD]
     - 🏗️ **`dockage_cost`**: *"Costo de Muellaje (Puerto)"* [USD]
     - 🛳️ **`charter_hire`**: *"Arriendo de Naves (Charter Hire)"* [USD]
     - 🧭 **`tce_real`**: *"TCE Realizado ($/d)"* [USD/día]
     - 🎯 **`tce_required`**: *"TCE Requerido ($/d)"* [USD/día]
     - 📊 **`tce_diff`**: *"Diferencial TCE (+/- $/d)"* [USD/día]
2. **Homologación del Motor de Cálculo:**
   - Utilizar las mismas fórmulas matemáticas de agregación mensual y acumulada que ya operan en `ForecastGrid.tsx` para garantizar **coherencia del 100% al centavo** entre la tabla numérica y las curvas de ECharts.

---

## 8. Resolución y Despliegue en Vivo al VPS de Producción

1. **Integración en [`InteractiveChart.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/InteractiveChart.tsx):**
   - Implementado el catálogo completo de 22 métricas auditales agrupadas por categorías visuales (*Revenue, Costos, Resultados, TCE, Operativas*).
   - Motor de cálculo y ratios sincronizados al 100% con `ForecastGrid.tsx`.
   - Propagación de propiedades dinámicas de días de demora y líneas de proyección desde [`GraphicAnalysis_V2.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Tools/GraphicAnalysis_V2.tsx).
2. **Control de Calidad (QC):**
   - `npx vite build` completado con éxito (0 errores).
3. **Versionado Git & Tagging:**
   - Sobreescrito y actualizado tag y branch **`PRE.GRAND.FINALE.31.08.26`** en GitHub (`origin`).
   - Sincronizado en rama `main`.
4. **Despliegue a Producción (VPS):**
   - Servidor: `91.108.125.253` vía `Push.VPS/deploy_forecast_kickoff.py`.
   - Producción en vivo: **`https://forecast.geeksoft.tech`**.

---

## 9. Integración del Modal de Guardado y Sobreescritura de Escenarios (`ToolsLayout_V2.tsx` & `ForecastContext_V2.tsx`)

### 9.1 Diagnóstico y Requerimiento
- Replicar en la barra de herramientas superior de la **Matriz Financiera / Tools Layout** el modal interactivo con selectores de **Nuevo Escenario (NEW)** vs **Sobrescribir (OVERWRITE)** del Multicotizador.
- Garantizar que cualquier edición en inputs de celdas (frecuencias, tarifas, demoras % o días) se consolide de forma inmediata antes de empaquetar el payload hacia la base de datos.
- Permitir tanto la sobreescritura del escenario actualmente cargado como la selección de cualquier otro escenario existente del catálogo de BD, permitiendo también modificar o conservar el nombre del escenario.

### 9.2 Implementación Forense
1. **En [`ForecastContext_V2.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/context/ForecastContext_V2.tsx):**
   - Incorporados estados `saveMode` (`'NEW' | 'OVERWRITE'`) y `targetOverwriteId`.
   - Función `handleOpenSaveModal()`:
     - Ejecuta `document.activeElement?.blur()` para forzar el commit de cualquier input en foco.
     - Consulta la lista actualizada de escenarios de la BD (`listForecasts()`).
     - Si hay un escenario activo (`currentForecastId`), preselecciona `OVERWRITE` apuntando a dicho ID y asegurando su nombre; si no, configura `NEW`.
     - Abre el modal (`setShowSaveModal(true)`).
   - Función `handleSaveForecast()`:
     - Ejecuta `document.activeElement?.blur()`.
     - Empaqueta el 100% de los metadatos en vivo (`metadata_demurrage_pct`, `metadata_show_demurrage`, `metadata_excluded_demurrages`, `metadata_custom_demurrages`, `metadata_demurrage_days`, `metadata_show_demurrage_days`, `metadata_custom_demurrage_days`).
     - Envía `id: targetId` (si es `OVERWRITE`) o `id: null` (si es `NEW`).
     - Actualiza `currentForecastId`, `sessionStorage` y `localStorage` tras guardar.
2. **En [`ToolsLayout_V2.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/layouts/ToolsLayout_V2.tsx):**
   - El botón **Guardar** ejecuta `context.handleOpenSaveModal()`.
   - Implementado el modal estilizado de 2 columnas con tarjetas interactivas (**Nuevo Escenario** y **Sobrescribir**), selector `<select>` de escenarios en BD, inputs editables de nombre y autor, y botón dinámico con spinner.

### 9.3 Control de Calidad y Despliegue
- **Compilación:** `npx vite build` exitoso (0 errores).
- **Git & Tagging:** Tag y rama `PRE.GRAND.FINALE.31.08.26.2` sobreescritos en GitHub (`origin`).
- **VPS Deploy:** `https://forecast.geeksoft.tech` en vivo y verificado.

---

## 10. Ajuste Visual de Layout en Bloques 8 y 9 del Constructor (`ForecastBuilder_V2.tsx`)

### 10.1 Requerimiento Visual
- Convertir la disposición horizontal de los bloques **8 (Demurrage %)** y **9 (Demurrage Días)** a la estructura vertical de **2 filas** de los botones de la primera fila (ej. Inicio, Fin, Meses a Modelar):
  - **Fila Superior:** Label en negrita (`DEMURRAGE (%)` y `DEMURRAGE (DÍAS)`).
  - **Fila Inferior:** Controles de input + botón `Mostrar`.
  - **Badge:** Contenedor `w-8 h-8 rounded-lg` idéntico a los pasos de la fila 1.

### 10.2 Control de Calidad y Despliegue
- **Captura respaldada:** Copiada a `Obsidian.Maestro.Costos.Portuarios/PNGs` y `Exceles.Petral/PORT.COSTS.PATRICIA`.
- **Compilación Frontend:** `npx vite build` completado en **8.49s (0 errores)**.
- **Git & Tagging:** Publicada rama y tag `PRE.GRAND.FINALE.31.08.26.2` en GitHub.
- **Despliegue al VPS:** Desplegado con éxito a `https://forecast.geeksoft.tech`.

---

## 11. Traslado del Paso 7 y Rediseño de Doble Fila para Vista y Formato (`ForecastBuilder_V2.tsx`)

### 11.1 Requerimientos Visuales Implementados
1. **Paso 7 (VIAJES):**
   - Trasladado desde el final de la fila 1 al inicio de la **fila 2**, precediendo a los pasos 8 y 9.
2. **Control VISTA (USD / %):**
   - Convertido a tarjeta vertical de **2 filas**:
     - Fila superior: `VISTA` en mayúsculas negrita.
     - Fila inferior: Conmutadores `USD` y `%`.
3. **Control FORMATO (PETRAL / NAVITRANSO):**
   - Convertido a tarjeta vertical de **2 filas**:
     - Fila superior: `FORMATO` en mayúsculas negrita.
     - Fila inferior: Conmutadores `PETRAL` y `NAVITRANSO`.

### 11.2 Control de Calidad y Despliegue
- **Compilación Frontend:** `npx vite build` completado en **7.94s (0 errores)**.
- **Git & Tagging:** Rama y tag `PRE.GRAND.FINALE.31.08.26.2` sincronizados en GitHub.
- **Despliegue al VPS:** `https://forecast.geeksoft.tech` publicado con éxito.

---

## 12. Badges 10 y 11, Escenario en Doble Fila y Matriz 2x2 de Acciones (`ForecastBuilder_V2.tsx`)

### 12.1 Requerimientos Implementados
1. **Paso 10 (VISTA):**
   - Incorporado badge numerado `[10]` (`w-8 h-8 rounded-lg bg-sky-100 text-sky-700`).
   - Mantiene diseño vertical de doble fila (Label `VISTA` arriba, botones `USD` y `%` abajo).
2. **Paso 11 (FORMATO):**
   - Incorporado badge numerado `[11]` (`w-8 h-8 rounded-lg bg-sky-100 text-sky-700`).
   - Mantiene diseño vertical de doble fila (Label `FORMATO` arriba, botones `PETRAL` y `NAVITRANSO` abajo).
3. **Indicador de ESCENARIO:**
   - Rediseñado en tarjeta de **2 filas**: Label `ESCENARIO` en fila superior y valor `📁 {forecastName}` en fila inferior.
4. **Matriz de Acciones 2x2 en el Extremo Derecho:**
   - Compactada en una tarjeta de acciones con grid 2x2:
     - Fila superior: `[➕ Añadir]` y `[🗑️ Limpiar]`.
     - Fila inferior: `[💾 Guardar]` y `[📂 Cargar]`.

### 12.2 Control de Calidad y Despliegue
- **Compilación Frontend:** `npx vite build` completado en **8.28s (0 errores)**.
- **Git & Tagging:** Tag y rama `PRE.GRAND.FINALE.31.08.26.2` sincronizados en GitHub.
- **Despliegue al VPS:** Desplegado con éxito a `https://forecast.geeksoft.tech`.

---

## 13. Corrección y Blindaje de Filtros de Tabla y Exportación (`ForecastGridFilters.tsx`)

### 13.1 Diagnóstico Forense
- Al abrir el desplegable de **Filtros de Tabla y Exportación**, `quarters` y `activeFilterSummary` intentaban iterar `months.forEach` y `months.filter` cuando `dynamicMonths` aún no contenía datos o era `undefined`, bloqueando el renderizado del componente.

### 13.2 Blindaje Implementado
- Definidas variables seguras con arrays vacíos por defecto: `safeMonths`, `safeHiddenClients`, `safeHiddenRoutes`, `safeHiddenVessels`, `safeHiddenMonths`.
- Protección en `quarters` asegurando validación de strings antes del `split('-')`.
- Conteo y resúmenes protegidos contra `undefined`.

### 13.3 Control de Calidad y Despliegue
- **Compilación Frontend:** `npx vite build` completado en **8.33s (0 errores)**.
- **Git & Tagging:** Tag y rama `PRE.GRAND.FINALE.31.08.26.2` sincronizados en GitHub.
- **Despliegue al VPS:** Desplegado con éxito a `https://forecast.geeksoft.tech`.

---

## 14. Corrección de Reactividad e Interactividad en Filtros (`ForecastContext_V2.tsx`)

### 14.1 Diagnóstico Forense
- Los estados `hiddenClients`, `hiddenRoutes`, `hiddenVessels`, `hiddenMonths` y sus respectivos setters (`setHiddenClients`, `setHiddenRoutes`, etc.) estaban declarados en `ForecastContext_V2.tsx` pero habían sido omitidos del objeto exportado en el `<ForecastContext.Provider value={{ ... }}>`.
- Al renderizar `ForecastGridFilters.tsx`, el hook `useForecastContext_V2()` devolvía callbacks vacíos `(() => {})` por fallback, impidiendo que los clicks en los checkboxes, "Todos", "Ninguno" y "Solo" mutaran el estado global de la grilla.

### 14.2 Corrección Aplicada
- Exportados formalmente en el `value` de `ForecastContext.Provider`:
  - `hiddenClients`, `setHiddenClients`
  - `hiddenRoutes`, `setHiddenRoutes`
  - `hiddenVessels`, `setHiddenVessels`
  - `hiddenMonths`, `setHiddenMonths`
- Estandarizadas las llamadas a `safeHiddenClients`, `safeHiddenRoutes`, `safeHiddenVessels` en `ForecastGridFilters.tsx`.

### 14.3 Control de Calidad y Despliegue
- **Compilación Frontend:** `npx vite build` completado en **8.87s (0 errores)**.
- **Git & Tagging:** Tag y rama `PRE.GRAND.FINALE.31.08.26.2` sincronizados en GitHub.
- **Despliegue al VPS:** Desplegado con éxito a `https://forecast.geeksoft.tech`.

---

## 15. Hito de Respaldo y Versionamiento — Branch & Tag Web

- **Nuevo Tag:** `PRE.GRAND.FINALE.31.08.26.3`
- **Nueva Rama:** `PRE.GRAND.FINALE.31.08.26.3`
- **Commit Base:** `9d8e3ff` (Reactividad total de Filtros de Tabla y Exportación, Badges 10 y 11, Escenario y Matriz de Acciones 2x2).
- **Repositorio Remoto:** GitHub (`origin`) sincronizado y actualizado.
- **Estado de Producción:** VPS `https://forecast.geeksoft.tech` 100% operativo.

---

## 16. Dictamen Pericial V3: Sustento de Modificación de Alcance & Auditoría Forense (469.50 hrs)

### 16.1 Hitos y Ajustes Estratégicos Incorporados
1. **Calibración Contractual Oficial:**
   - Establecida la base contractual de **Desarrollo de Software** según [`COTIZACION_MODULAR_PETRAL_V10.RG.pdf`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Proposal/COTIZACION_MODULAR_PETRAL_V10.RG.pdf) en **110.00 hrs @ $60/hr = $6,600.00 USD** (Presupuesto One-Timers total: 150 hrs = $9,100.00 USD).
   - Horas reales auditadas devengadas al 31/08/2026: **469.50 hrs** en 107 jornadas y 3,414 eventos inmutables.
   - Sobreesfuerzo neto de desarrollo: **+359.50 hrs (+326.8%)** equivalentes a **+$21,569.77 USD** devengados.
2. **Reingeniería de Contenidos por Slide (9 Diapositivas):**
   - **Slide 2 (Realidad Operativa):** Fragmentación operadores vs. liquidaciones (omisión de muellaje, demurrage, arriendo de naves y demoras por puerto); 3 ciclos de ETL completos; inviabilidad del modelo comercial previo.
   - **Slide 3 (Pipeline 4 Pasos):** Voyage Calculator (muellaje + demoras estadísticas en tiempo real), Matriz Financiera (reporteador multidimensional sin trabajo manual), AN GRAF (descubrimiento de patrones ocultos) y Spaghetti Map (visión geoespacial de rutas).
   - **Slide 4 (Organigrama Digital):** Eliminado `MGO = MDO`; incorporada la delimitación estricta de responsabilidades y segregación de roles por usuario.
   - **Slide 5 (Visión Liquidaciones):** De agregación pasiva de facturas a auditoría forense centavo a centavo mediante captura de inputs de maniobras operativas.
   - **Slide 6 (Metodología de Auditoría):** Explicación del modelo de pair programming continuo, triple registro inmutable y clustering de sesiones con corte a 2.5h y warmup de 30 min.
   - **Slide 7 (Auditoría Forense de Horas):** Comparativa visual 110h vs 469.50h.
   - **Slide 8 (Liquidación Económica):** Opciones comerciales A y B.
   - **Slide 9 (Roadmap VPS):** Cierre y pase a producción.
3. **Mecanismo de Actualización en Tiempo Real:**
   - Script dinámico `scratch/generar_sustento_slide_by_slide_v3.py` autoejecutable en 5 segundos.
   - HTMLs sincronizados: [`Informe_Sustento_Modificacion_Alcance_Petral_V3.html`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Refactorizacion.Multicotizador/Informe_Sustento_Modificacion_Alcance_Petral_V3.html) y [`presentation.html`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/presentation.html).

### 16.2 Versionado Git & Tagging
- **Nuevo Tag:** `PRE.GRAND.FINALE.31.08.26.4`
- **Nueva Rama:** `PRE.GRAND.FINALE.31.08.26.4`
- **Repositorio Remoto:** Sincronizado en GitHub (`origin`).


