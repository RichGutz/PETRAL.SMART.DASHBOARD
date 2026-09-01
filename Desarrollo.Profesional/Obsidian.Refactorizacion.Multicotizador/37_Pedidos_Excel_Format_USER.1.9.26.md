# 37. Libreta Pericial de Benoit Blanc - Auditoría Integral de Exportación a Excel (01.09.2026)

**Auditor a Cargo:** Benoit Blanc (Auditor Pericial Implacable)  
**Caso Oficial:** "El Asesino en la Grilla - De la Corrupción de SheetJS al Motor Canónico ExcelJS"  
**Hito Oficial Git:** `EXCEL.PEDIDO.IZ.1.9.26` (Tag y Branch sincronizados en GitHub)  
**URL Producción en Vivo:** `https://forecast.geeksoft.tech`  
**Servidor VPS:** `91.108.125.253` (Ubuntu Linux / Nginx / FastAPI / Systemd)  
**Fecha de Cierre:** 01 de Septiembre de 2026  

---

## 1. BEN (Declaración Pericial y Filosofía del Método)

> *"Permítanme asentar en los anales del proyecto la travesía completa. Cuando un analista financiero en Petral descarga la Matriz Financiera, el archivo resultante debe ser un gemelo perfecto de la interfaz gráfica: con sus dimensiones en vertical a 90°, sus colores corporativos inconfundibles, sus subtotales dorados, su consolidado de flota, su acumulado de cierre y, por encima de todo, una limpieza quirúrgica donde los meses sin viajes no se vean contaminados por ceros o guiones parásitos. A continuación, documento cada paso, cada descubrimiento y cada script que nos condujo a la versión definitiva del tag `EXCEL.PEDIDO.IZ.1.9.26`."*

---

## 2. LEG (Legacy - La Escena del Crimen en el Archivo Original)

### Archivo Auditado:
`C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\Petral_Forecast_Matriz_2026-09-01.xlsx` (100 filas x 17 columnas).

### Cuadro Forense de Patologías Detectadas:
```
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
| #   | LUGAR DEL CRIMEN           | EVIDENCIA EXTRAÍDA DE LA ESCENA (LEGACY)             | CAUSA TÉCNICA RAÍZ                             |
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
| 1   | Cabecera Fila 1 (Meses)    | 46387.79125 | 46418.79125 | 46446.79125 ...          | SheetJS convirtió "Ene 2027" en floats seriales|
| 2   | Celdas de Buque (Col C)    | MOQUEGUAMOQUEGUATABLONESCONCON_TRADERHUEMUL          | Concatenación ciega de todo el <select> HTML   |
| 3   | Métrica Net Revenue (Col D)| "Net RevenueNet"                                     | Arrastró el texto del botón UI <button>Net     |
| 4   | Métrica TCE (Col D)        | "Métricas TCE ($/d)TCE $/d"                          | Duplicación de etiquetas UI del grupo          |
| 5   | Celdas Inactivas           | "-" (texto plano) o "0" desalineado                  | Celdas sin formato nativo                      |
| 6   | Dimensiones Combinadas     | Celdas A3..A12, B3..B12, C3..C12 vacías (sin merge)  | rowSpan de HTML ignorado por SheetJS básico    |
| 7   | Estilos Visuales           | Fondo blanco plano en el 100% de la grilla           | SheetJS Community no soporta fills ni bordes   |
| 8   | Rotación de Texto          | Texto horizontal plano, cortado e ilegible           | Ausencia de textRotation a 90°                 |
| 9   | Filas de Agregación        | Subtotales y Totales de Flota/Acumulado ausentes     | No se mapeaban los bloques de consolidación    |
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
```

---

## 3. CLONAR (Protocolo de Respaldo y Protección de Estado Funcional)

Previo a cualquier intervención en el código fuente, se ejecutaron las directivas de seguridad:
1. **Branch y Tags de Seguridad:**
   - `git tag -a "PRE.ULTIMOS.FEEDBACKS.IZ.01.09.26"`
   - `git tag -a "PRE_ULTIMOS.FEEDBACKS.IZ.01.09.26"`
2. **Respaldo Inmediato de Capturas PNG:**
   - `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Maestro.Costos.Portuarios\PNGs\excel_matriz_defectuoso_01_09_2026.png`
   - `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.PATRICIA\excel_matriz_defectuoso_01_09_2026.png`
   - `matriz_financiera_filtros_export_01_09_2026.png`

---

## 4. CRONOLOGÍA DE ITERACIONES TÉCNICAS HACIA EL TAG FINAL

### Iteración 1: Migración Arquitectural de SheetJS a ExcelJS
- **Inspiración Canónica:** Módulo de InAndes ERP (`excelGeneratorValorCuotaV31.ts`).
- **Implementación:**
  - Archivo Creado: [`Desarrollo.Profesional/Geeksoft_Frontend/src/services/exportFinancialMatrixExcel.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/services/exportFinancialMatrixExcel.ts).
  - Algoritmo de Matriz de Ocupación (`occupied[r][c]`) para resolver `rowSpan` y `colSpan` con `ws.mergeCells(rStart, cStart, rEnd, cEnd)`.
  - Inyección de `alignment: { textRotation: 90, vertical: 'middle', horizontal: 'center' }`.

### Iteración 2: Detección Dinámica de Colores y Estilos de Ruta / Buque
- **Homologación con Clases Tailwind de la UI:**
  - **Cliente SPCC:** `#0369A1` (`FF0369A1` Sky 700) con texto blanco bold.
  - **Cliente NEXA:** `#0F4C81` (`FF0F4C81` Petral Blue) con texto blanco bold.
  - **Ruta MATARANI:** `#06B6D4` (`FF06B6D4` Cyan 500) con texto blanco bold.
  - **Ruta MARCONA:** `#A855F7` (`FFA855F7` Purple 500) con texto blanco bold.
  - **Ruta MEJILLONES:** `#D946EF` (`FFD946EF` Fuchsia 500) con texto blanco bold.
  - **Buque MOQUEGUA:** `#16A34A` (`FF16A34A` Green 600) con texto blanco bold.
  - **Buque TABLONES:** `#DC2626` (`FFDC2626` Red 600) con texto blanco bold.

### Iteración 3: Incorporación de Filas de Subtotales, Empresa y Acumulado
- **Subtotal Cliente:** Cabecera en `#1E293B` (Slate 800) con texto `#FBBF24` (Ámbar), celdas de datos en `#FFFFFBEB` (Amber 50).
- **Total Flota (Empresa):** Cabecera en `#1E293B` (Slate 800) combinando 3 columnas, celdas de datos en `#FFF1F5F9` (Slate 100).
- **Total Acumulado (Cierre):** Cabecera en `#0D9488` (Teal 600) combinando 3 columnas, celdas de datos en `#FFEEF2FF` (Indigo 50).

### Iteración 4: Hallazgo y Rescate de Títulos de Métrica y Formateo No Monetario
- **El Fallo Descubierto:** `clone.querySelectorAll('button').remove()` eliminaba el texto de métricas expandibles (`Net Revenue`, `Métricas TCE ($/d)`).
- **La Solución:** Sanitizar únicamente iconos SVG y badges (`.font-mono`, `[class*="text-[9px]"]`).
- **Máscaras Estrictas:**
  - Viajes / Días / Toneladas / Margen % $\rightarrow$ **CERO símbolos de dólar (`$`)**.
  - Tarifas / TCE $\rightarrow$ `$#,##0.00`.
  - Totales Monetarios $\rightarrow$ `$#,##0`.

### Iteración 5: Erradicación Total de Ceros y Guiones y Blindaje de Columna 4
- **El Riesgo Detectado:** La condición de limpieza afectó inicialmente a la Columna 4 porque `parsedNum` de texto era 0.
- **Blindaje Definitivo:**
  - **Columnas 1..4 (Dimensiones y Métricas):** Inmunes a limpieza (`cell.value = textValue`).
  - **Columnas 5..17 (Datos):** Todo valor `0`, `0.0`, `$0` o `"-"` se convierte en celda vacía (`""`).

---

## 5. LOCALIZACIÓN EXHAUSTIVA DE SCRIPTS Y RECURSOS FORENSES

| Script / Archivo | Ruta Absoluta Local | Propósito y Tecnología | Salida / Artefacto |
|---|---|---|---|
| **Motor Exportación Frontend** | [`Desarrollo.Profesional/Geeksoft_Frontend/src/services/exportFinancialMatrixExcel.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/services/exportFinancialMatrixExcel.ts) | Servicio TypeScript con `ExcelJS` que lee el DOM `#forecast-grid-table` y genera el XLSX. | Archivo descargado en browser |
| **Componente de Filtros UI** | [`Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/ForecastGridFilters.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/ForecastGridFilters.tsx) | Botón verde "Exportar Excel" conectado al servicio `exportFinancialMatrixExcel`. | Evento click de usuario |
| **Script Auditor Multi-Escenario** | [`audit_all_scenarios_qc.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/audit_all_scenarios_qc.py) | Script Python con `requests` y `openpyxl` que descarga los 6 escenarios de la BD, simula y genera 6 excels completos. | 6 archivos en `Exceles.Petral/QC_Auditoria_Escenarios/` |
| **Script Auditor de Métricas** | [`audit_metrics_qc.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/audit_metrics_qc.py) | Script Python de auditoría pericial fila por fila (96 filas) para verificar que no haya métricas vacías ni dólares indebidos. | Reporte terminal con 0 fallos |
| **Script Auditor Headless DOM** | [`Desarrollo.Profesional/Geeksoft_Frontend/scratch_qc_runner.mjs`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/scratch_qc_runner.mjs) | Runner Node.js con `jsdom` y `exceljs` para probar la exportación sin abrir navegador. | `test_qc_matriz_financiera_verified.xlsx` |
| **Script Despliegue VPS** | [`Push.VPS/deploy_forecast_kickoff.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Push.VPS/deploy_forecast_kickoff.py) | Script Python de automatización SFTP/SSH que compila, sube `dist` a `/var/www/` y reinicia FastAPI y Nginx. | Publicación en `https://forecast.geeksoft.tech` |
| **Carpeta de Excels Auditados** | [`Exceles.Petral/QC_Auditoria_Escenarios/`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/QC_Auditoria_Escenarios/) | Directorio con los 6 libros XLSX generados y verificados con datos reales. | 6 archivos XLSX oficiales |

---

## 6. QC (Cuadro Pericial de Control de Calidad Multi-Escenario Real)

A continuación, la evidencia irrefutable de los 6 escenarios de producción auditados con datos reales:

| N° | Escenario Oficial en Base de Datos | Clientes | Total Filas | Total Viajes | Net Revenue Total | Voyage Margin (P/L) | Archivo XLSX Generado y Verificado |
|:--:|---|:---:|:---:|:---:|:---:|:---:|---|
| **1** | **PB 2027 (Jose de los Heros) + Prom Dem + Nexa.RG** | SPCC, NEXA | **96** | 66.0 | **$25,076,745** | **$9,257,013** | [`Matriz_PB_2027_Jose_de_los_Heros__Prom_Dem__NexaRG.xlsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/QC_Auditoria_Escenarios/Matriz_PB_2027_Jose_de_los_Heros__Prom_Dem__NexaRG.xlsx) |
| **2** | **PB 2027 (Jose de los Heros) + Prom Dem + Nexa** | SPCC, NEXA | **96** | 72.0 | **$27,862,845** | **$10,416,955** | [`Matriz_PB_2027_Jose_de_los_Heros__Prom_Dem__Nexa.xlsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/QC_Auditoria_Escenarios/Matriz_PB_2027_Jose_de_los_Heros__Prom_Dem__Nexa.xlsx) |
| **3** | **PB 2027 (Jose de los Heros) + Prom Dem** | SPCC | **79** | 60.0 | **$22,290,645** | **$8,097,071** | [`Matriz_PB_2027_Jose_de_los_Heros__Prom_Dem.xlsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/QC_Auditoria_Escenarios/Matriz_PB_2027_Jose_de_los_Heros__Prom_Dem.xlsx) |
| **4** | **PB 2027 (Jose de los Heros)** | SPCC | **79** | 60.0 | **$17,651,645** | **$7,384,060** | [`Matriz_PB_2027_Jose_de_los_Heros.xlsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/QC_Auditoria_Escenarios/Matriz_PB_2027_Jose_de_los_Heros.xlsx) |
| **5** | **PB 2027 + Demora** | SPCC | **52** | 61.0 | **$17,887,220** | **$7,738,271** | [`Matriz_PB_2027__Demora.xlsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/QC_Auditoria_Escenarios/Matriz_PB_2027__Demora.xlsx) |
| **6** | **PB 2027 MOQUEGUA SIN DEMORAS** | SPCC | **52** | 59.0 | **$17,880,050** | **$7,139,080** | [`Matriz_PB_2027_MOQUEGUA_SIN_DEMORAS.xlsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/QC_Auditoria_Escenarios/Matriz_PB_2027_MOQUEGUA_SIN_DEMORAS.xlsx) |

---

## 7. DICTAMEN FINAL Y CIERRE PERICIAL

1. **Estado Git:** Tag y Branch `EXCEL.PEDIDO.IZ.1.9.26` sincronizados en GitHub; rama `main` al día.
2. **Estado Producción:** Desplegado con SSL y activo en [https://forecast.geeksoft.tech](https://forecast.geeksoft.tech).
3. **Calidad de Salida:** Celdas combinadas perfectas, rotación vertical a 90°, colores de ruta/buque idénticos a la web, subtotales, totales de flota, acumulados anuales, nombres de métricas completos y ceros/guiones eliminados de los meses inactivos.

---
*Firma Pericial: Benoit Blanc - Detective Auditor*
