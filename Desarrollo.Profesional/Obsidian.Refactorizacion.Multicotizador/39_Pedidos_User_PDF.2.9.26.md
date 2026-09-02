# 39. Libreta Pericial de Benoit Blanc - Homologación de Matriz Financiera a PDF ("El Reporte Bello") (02.09.2026)

**Auditor a Cargo:** Detective Benoit Blanc (Auditor Pericial Implacable)  
**Caso Oficial:** "El Espejo de Cristal - De la Perfección del Excel a la Fidelidad Vectorial del PDF"  
**Fecha de Inicio:** 02 de Septiembre de 2026  
**Safe Point Previo:** `PRE.PDF.MATRIZ.INANDES.2.9.26` (Branch y Tag sincronizados en GitHub)  
**URL Producción en Vivo:** `https://forecast.geeksoft.tech`  
**Servidor VPS:** `91.108.125.253` (Nginx + FastAPI + Systemd + Certbot SSL)  

---

## 1. 🕵️ BEN (Declaración Pericial y Filosofía del Método)

> *"Permítanme asentar en los anales del proyecto la verdad inmutable del caso. Tras haber alcanzado la perfección matemática y cromática en la exportación a Excel (con sus dimensiones a 90°, colores vivos de buques y rutas, subtotales dorados y formateo estricto de miles), resultaba inaceptable que los dos botones de PDF (**PDF Vertical** y **PDF Horizontal**) siguieran atrapados en una impresión plana, sin identidad corporativa ni tarjetas ejecutivas. Aplicando los aprendizajes del caso InAndes ERP (`Reporte.PDF.BELLO.Con.Desglose`), procedimos a forjar un generador de PDF que sea el espejo gemelo y fiel del libro contable."*

---

## 2. 🔎 LEG (Legacy - La Escena del Crimen Previa)

### Archivo Auditado:
[`Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/ForecastGridFilters.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/ForecastGridFilters.tsx) (Función legacy `handlePrintPDF`).

### Cuadro Forense de Patologías Detectadas:
```
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
| #   | LUGAR DEL CRIMEN           | EVIDENCIA EXTRAÍDA DE LA ESCENA (LEGACY)             | CAUSA TÉCNICA RAÍZ                             |
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
| 1   | Logos Corporativos         | Carga de imágenes con URL relativa en ventana popup  | Rutas relativas rotas o bloqueadas por popup   |
| 2   | Tarjetas Resumen KPI       | Inexistentes en la cabecera                          | El legacy solo clonaba la tabla cruda sin KPIs |
| 3   | Estructura y Anchos        | Anchos con clases CSS flotantes de Tailwind          | Deformación de columnas al imprimir en papel   |
| 4   | Formateo Numérico          | Ceros ($0, 0.0) y guiones parásitos en meses vacíos  | Falta de sanitización y formateo diferenciado  |
| 5   | Colores de Rutas/Buques    | Colores de fondo planos no exportados                | Ausencia de mapeo cromático hex a CSS print    |
| 6   | Mecanismo de Generación    | Solo `window.print()` nativo sin fallback de Weasy   | Dependencia exclusiva del diálogo del browser  |
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
```

---

## 3. 🛡️ CLON (Respaldo y Puntos de Seguridad Inmutables)

Previo a la intervención quirúrgica en el frontend, se establecieron los Safe Points:
1. **Branch y Tag en Git**:
   - `git branch PRE.PDF.MATRIZ.INANDES.2.9.26`
   - `git tag -a "PRE.PDF.MATRIZ.INANDES.2.9.26" -m "Safe Point: Previo a implementacion PDF Matriz estilo InAndes"`
   - Pusheados a `origin/main` y `refs/tags/` en GitHub.
2. **Generación de Activos Base64 Inmutables**:
   - Creado [`Desarrollo.Profesional/Geeksoft_Frontend/src/assets/logosBase64.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/assets/logosBase64.ts) conteniendo `LOGO_PETRAL_BASE64` y `LOGO_GEEKSOFT_BASE64` para garantizar 0% fallos de carga en backend y navegador.

---

## 4. 📐 DIFF (Cirugía Quirúrgica y Diferencias)

### 4.1. Creación del Servicio Maestro: [`exportFinancialMatrixPdf.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/services/exportFinancialMatrixPdf.ts)
* **Arquitectura de Salida (1:1 con el Excel y el estándar InAndes)**:
  1. **Cabecera Institucional Oficial**:
     * Logo Geeksoft (izq.) + Título **NAVIERA PETRAL S.A.** + Logo Petral (der.).
     * Banner de escenario: `ESCENARIO: [NOMBRE] • MONEDA: USD • GENERADO: [FECHA Y HORA]`.
  2. **Cajas KPI Horizontales (`<table class="kpi-cards-table">`)**:
     * `VIAJES TOTALES` | `TONELADAS (MT)` | `NET REVENUE` | `(-) BUNKER COSTS` | `(-) PORT COSTS` | `(-) HIRE / CHARTER` | `VOYAGE RESULT (P/L)`.
  3. **Tabla Contable Matriz 100% Nativa**:
     * Textos de dimensiones a 90° (`.pdf-vertical-text`) con sus colores exactos (SPCC `#0369a1`, NEXA `#0f4c81`, Matarani `#06b6d4`, etc.).
     * Columna 4 de Métricas sanitizada y con anchos rígidos (`110px` landscape / `90px` portrait).
     * Formateo financiero estricto: Días (`0.0`), Viajes (`#,##0`), Toneladas (`#,##0`), Tarifas/TCE (`$#,##0.00`), Monetarios Globales (`$#,##0`).
     * Erradicación total de ceros o guiones en meses inactivos.
     * Subtotales dorados (`#fffbeb`), Totales Flota (`#f1f5f9`), Totales Acumulado (`#eef2ff`).
  4. **Pie de Página Oficial**:
     * `Petral Forecast Engine © 2026 — Documento Oficial de Auditoría Financiera`.

### 4.2. Conexión en UI: [`ForecastGridFilters.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/ForecastGridFilters.tsx)
```diff
- import logoPetral from '../../assets/Logo.Petral.png';
- import logoGeeksoft from '../../assets/Logo.Geeksoft.png';
+ import { exportFinancialMatrixPdf } from '../../services/exportFinancialMatrixPdf';

- const handlePrintPDF = (orientation: 'portrait' | 'landscape') => { ... }
+ const handlePrintPDF = async (orientation: 'portrait' | 'landscape') => {
+     try {
+         const scenarioName = data?.name || data?.scenario_name || 'Escenario Base 2027';
+         await exportFinancialMatrixPdf('forecast-grid-table', orientation, scenarioName);
+     } catch (err: any) {
+         console.error('Error generando PDF de la Matriz Financiera:', err);
+         alert(`Error al generar PDF: ${err?.message || err}`);
+     }
+ };
```

---

## 7. 🕵️‍♂️ RONDA 2: AUTONOMÍA FORENSE Y RESOLUCIÓN DEL SMOKING GUN DE MÉTRICAS

**Fecha:** 02 de Septiembre de 2026 (10:50 AM)  
**Safe Point:** `PRE.PDF.HORIZ.CONSOLE11.2.9.26` (Branch y Tag pusheados a GitHub)  
**Evidencia Física Evaluada:** Documento PDF descargado de 7 páginas (`media_1788363380070.pdf`).

### 7.1. El Hallazgo del "Smoking Gun" en la Autopsia de la Grilla
1. **El Descalce**: En las filas 2 en adelante de cada buque/ruta, las celdas de la Columna Métrica (`Días-Buque`, `Toneladas`, `Net Revenue`, etc.) aparecían rotadas a 90° verticalmente.
2. **Causa Raíz**: Las filas subsecuentes no contienen las etiquetas `<td>` de Cliente, Ruta ni Buque (absorbidas por `rowSpan`). Al evaluar `colIdx < 3` ciegamente, el código catalogaba la celda de Métrica como dimensión y le inyectaba la clase `.pdf-vertical-text`.
3. **Cirugía**: Se implementó el algoritmo de **Matriz de Ocupación (`occupied[r][c]`)** en [`exportFinancialMatrixPdf.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/services/exportFinancialMatrixPdf.ts). Ahora `currentCol === 4` garantiza que la columna de métricas sea **100% HORIZONTAL** (`writing-mode: horizontal-tb; transform: none; font-weight: 700`).

### 7.2. Ajustes de Diseño Aplicados (Consolas 11 & Landscape)
* **Tipografía**: Fuente de consola `'Consolas', 'Courier New', monospace !important`.
* **Escala de Fuente**: Tamaño 11 (`11px` con padding optimizado).
* **Orientación Forzada**: `@page { size: A4 landscape !important; margin: 4mm 6mm !important; }`.
* **Simplificación UI**: Eliminado el botón `PDF Vertical` en [`ForecastGridFilters.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/ForecastGridFilters.tsx). Queda únicamente el botón oficial **PDF Horizontal**.

### 7.3. Loop QC de Análisis Forense de PDF Binario
Se ejecutó el inspector automatizado [`qc_pdf_inspector.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/qc_pdf_inspector.py) con `WeasyPrint` y `PyMuPDF (fitz)`:
* **Archivo Generado**: [`QC_Matriz_Financiera_Landscape_Verified.pdf`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/QC_Auditoria_Escenarios/QC_Matriz_Financiera_Landscape_Verified.pdf) (30.2 KB).
* **Dimensiones**: `841.9pt x 595.3pt` $\rightarrow$ **100% LANDSCAPE (Horizontal)** confirmado.
* **Páginas**: Reducido de 7 páginas dispersas a **2 páginas compactas y ordenadas**.
* **Texto Extraído**: Título `NAVIERA PETRAL S.A.`, `Net Revenue`, `(-) Hire (TCE x días)`, `Bunker Costs` y `VOYAGE RESULT / P&L` verificados en horizontal.

---

## 9. 🕵️‍♂️ RONDA 3: COMPAGINACIÓN ATÓMICA INTELIGENTE, ANCHOS ÓPTIMOS Y CALIBRACIÓN DE LOGOS

**Fecha:** 02 de Septiembre de 2026 (11:15 AM)  
**Safe Point:** `PRE.PDF.PAGINACION.ATOMICA.2.9.26` (Branch y Tag sincronizados en GitHub)  
**Evidencia Física Evaluada:** Captura `celdas_blancas_y_quiebre_bloque_02_09_2026.png` que demostraba quiebres de `rowSpan` con rectángulos blancos y páginas desalineadas.

### 9.1. La Autopsia del Quiebre de Bloques y Celdas en Blanco
1. **El Problema**: El navegador/motor PDF partía arbitrariamente la tabla en medio de un `rowSpan="18"` (Cliente SPCC), dejando un vacío blanco en la página 1 y despojando a la página 2 de sus encabezados (`CLIENTE`, `RUTA`, `BUQUE`, `MÉTRICA`, `Meses`).
2. **La Solución Arquitectónica (Inspirada en InAndes ERP)**:
   * El generador ahora parsea la tabla en **Bloques Atómicos Indivisibles (`TableBlock`)**:
     * **Bloque Buque**: 9 filas indivisibles.
     * **Bloque Subtotal**: 8 filas indivisibles.
     * **Bloque Total Flota / Acumulado**: 9 filas indivisibles.
   * **Paginador Atómico de Bloques**: Con presupuesto máximo de 21 filas por hoja A4 Landscape. Si un bloque de 9 filas excede el espacio de la hoja actual, se genera una **nueva `.report-page` independiente**.
   * **Repetición Obligatoria**: Cada hoja generada incluye su propia cabecera institucional, logos calibrados, banner de escenario `(Parte X de Y)` y `<thead>` completo.

### 9.2. Ajustes Visuales de Alta Precisión
* **Fuente**: Consolas `10px` estricto en datos y métricas (`line-height: 1.15`).
* **Anchos de Meses**: Calibrados a la cifra máxima (`58px` por columna de mes $\times 13 = 754\text{px}$).
* **Ancho Remanente a Métrica**: Columna 4 ampliada a `170px` fijos, permitiendo lectura horizontal sin desbordes.
* **Calibración de Logos**:
  * **Logo Geeksoft**: Duplicado a `height: 48px`.
  * **Logo Petral**: Reducido a la mitad a `height: 18px`.

### 9.3. Loop QC de Análisis Forense de PDF Binario
* **Script Inspector**: [`qc_pdf_inspector.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/qc_pdf_inspector.py) ejecutado con `PyMuPDF (fitz)` y `WeasyPrint`.
* **Resultado**:
  * 4 páginas A4 Landscape (`841.9pt x 595.3pt`) 100% homogéneas.
  * THEAD y cabecera repetidos con éxito en las 4 páginas.
  * 0 celdas en blanco y 0 bloques partidos.
  * Métricas horizontales confirmadas en todas las páginas.

---

## 11. 🕵️‍♂️ RONDA 4: RESOLUCIÓN DEFINITIVA DE SHARING VIOLATION (ERROR 32 DE WINDOWS)

**Fecha:** 02 de Septiembre de 2026 (11:40 AM)  
**Diagnóstico del Problema:** Al exportar el PDF, Windows arrojaba el error `Sharing Violation`.

### 11.1. Autopsia del "Sharing Violation"
```
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
| #   | LUGAR DEL CRIMEN           | EVIDENCIA FORENSE                                    | CAUSA TÉCNICA RAÍZ                             |
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
| 1   | Fallback a window.print()  | Al vencer timeout de 3.5s, disparaba print dialog    | Chrome/Windows bloqueaba archivo temp en %TEMP%|
| 2   | Nombres Estáticos          | El nombre de archivo era estático por día            | Si el PDF estaba abierto en Acrobat, bloqueaba |
| 3   | Timeout en WeasyPrint      | Timeout de 3500ms abortaba la petición al backend    | 4 páginas A4 tardan 4-6s en compilarse         |
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
```

### 11.2. Cirugía Forense Anti-Sharing Violation (Estándar Benoit Blanc)
1. **Timestamp Único en Nombre de Archivo**:
   * Generación con marca temporal a nivel de segundo: `Petral_Matriz_Financiera_landscape_YYYYMMDD_HHMMSS.pdf`.
   * Permite múltiples descargas consecutivas sin colisión de nombres ni bloqueos por archivos abiertos en lectores PDF de Windows.
2. **Eliminación Total de `window.print()`**:
   * Se erradicó el fallback al diálogo de impresión del navegador (`window.print()`).
   * La exportación se canaliza **100% de forma asíncrona** a través del endpoint oficial de backend `POST /api/v1/utils/generate-pdf` (WeasyPrint).
3. **Timeout Extendido a 60 Segundos**:
   * Margen de tiempo holgado para que WeasyPrint compile reportes de múltiples páginas sin abortar prematuramente.
4. **Feedback Visual en UI**:
   * El botón muestra el spinner `<Loader2 className="animate-spin" /> Generando PDF...` y se deshabilita durante la descarga para prevenir doble clic concurrente.

---

## 13. 🕵️‍♂️ RONDA 5: JERARQUÍA VERTICAL (CLI, RUT, BUQ), CERO CENTAVOS Y TEXTO VERTICAL DERECHO

**Fecha:** 02 de Septiembre de 2026 (12:15 PM)  
**Safe Point:** `PRE.PDF.COMBINADO.NO.CABEZA.2.9.26` (Branch y Tag sincronizados en GitHub)  
**Evidencia Física Evaluada:** Captura `texto_de_cabeza_y_combinacion_02_09_2026.png` que mostraba texto vertical invertido a 180° y fragmentación de celdas en las últimas filas de buques.

### 13.1. Autopsia de las 4 Anomalías Reportadas
```
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
| #   | LUGAR DEL CRIMEN           | EVIDENCIA FORENSE                                    | CAUSA TÉCNICA RAÍZ                             |
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
| 1   | Orientación de Texto       | Texto de dimensiones "de cabeza" (glifos invertidos) | `transform: rotate(180deg)` invertía letras    |
| 2   | Agrupación Vertical        | Celdas de empresa y ruta separadas en filas 8 y 9    | Falta de `rowspan` jerárquico por página       |
| 3   | Formato de Centavos        | Cifras con `.00` o `.XX` en tarifas y TCE            | Formateadores con decimales en fletes/TCE      |
| 4   | Peso Tipográfico           | Todo el reporte lucía en negrita pesada              | `font-weight: 800/700` generalizado            |
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
```

### 13.2. Cirugía Forense Aplicada
1. **Encabezados Compactos Oficiales**:
   * Las tres primeras columnas se titulan exactamente: `CLI`, `RUT`, `BUQ`.
2. **Orientación Vertical Natural (Derecha y Upright)**:
   * Reemplazado por: `writing-mode: vertical-rl; text-orientation: mixed;` eliminando todo `transform: rotate(180deg)`. Las letras se leen de arriba a abajo de forma nítida y recta sin estar de cabeza.
3. **Combinación Jerárquica Vertical por Página**:
   * En cada página independiente, se calcula el `rowspan` total de cada Cliente y de cada Ruta.
   * `CLI` se fusiona verticalmente cubriendo todas las rutas y buques de ese cliente en esa página.
   * `RUT` se fusiona verticalmente cubriendo todos los buques de esa ruta en esa página.
   * `BUQ` se fusiona verticalmente cubriendo las 9 filas del buque.
4. **Erradicación Total de Centavos (`$#,##0`)**:
   * Todas las cifras monetarias (Net Revenue, Bunker, Port, Hire, P/L, TCE y Tarifas) se redondean estrictamente a entero con separador de miles: `$Math.round(val).toLocaleString('en-US')`.
5. **Tipografía Consolas 10 Normal**:
   * `font-size: 10px !important; font-weight: normal !important;` en todas las celdas de métricas y datos, otorgando balance visual y legibilidad contable.

### 13.3. Loop QC de Análisis Forense de PDF Binario
* **Script Inspector**: [`qc_pdf_inspector.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/qc_pdf_inspector.py) ejecutado con `PyMuPDF (fitz)` y `WeasyPrint`.
* **Resultado**:
  * 4 páginas A4 Landscape (`841.9pt x 595.3pt`) 100% verificadas.
  * Jerarquía vertical `CLI` $\rightarrow$ `RUT` $\rightarrow$ `BUQ` perfectamente combinada con `rowspan`.
  * Cero centavos en todas las cifras monetarias.
  * Texto vertical con glifos derechos y sin inversión.

---

## 14. 📝 DICTAMEN FINAL Y SELLADO PERICIAL RONDA 5

* **Compilación Frontend**: `npx vite build` completado en **41.40s (exit code 0)** con 1089 módulos.
* **Estado de la Solución**: 100% convergencia con los requerimientos de diseño del usuario.

---
*Firma Pericial: Benoit Blanc - Detective Auditor*
