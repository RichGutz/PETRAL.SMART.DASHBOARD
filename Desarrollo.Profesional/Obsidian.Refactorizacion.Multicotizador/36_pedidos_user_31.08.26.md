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

