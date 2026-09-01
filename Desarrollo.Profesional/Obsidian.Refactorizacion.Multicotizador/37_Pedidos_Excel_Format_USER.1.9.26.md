# 37. Libreta Pericial de Benoit Blanc - Auditoría de Exportación a Excel (01.09.2026)

**Auditor a Cargo:** Benoit Blanc (Auditor Pericial Implacable)  
**Caso:** "El Asesino en la Grilla - Discrepancia Forense del Excel Descargado"  
**Archivo de la Escena del Crimen:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\Petral_Forecast_Matriz_2026-09-01.xlsx`  
**Escenario de Evaluación:** `PB 2027 (Jose de los Heros) + Prom Dem + Nexa.RG`  
**Fecha de Registro:** 01 de Septiembre de 2026  

---

## 1. BEN (Personificación y Declaración Pericial)

> *"Permítanme observar la escena del crimen con la agudeza que el caso amerita. Cuando un analista financiero presiona el botón 'Exportar Excel', espera que el archivo descargado sea un espejo exacto, noble y pulcro de la obra maestra que contempla en su monitor. Procedo a levantar el acta pericial con el método **BEN / LEG / CLONAR / DIFF / NOTA / QC** para garantizar que no retrocederemos un solo milímetro de lo avanzado."*

---

## 2. LEG (Legacy - La Escena del Crimen en el Archivo Original)

Se inspeccionaron las **100 filas x 17 columnas** del archivo `Petral_Forecast_Matriz_2026-09-01.xlsx`. Los hallazgos forenses son categóricos:

```
+----------------------------------------------------------------------------------------------------------------------------------+
| #   | ELEMENTO / COLUMNA         | EVIDENCIA EXTRAÍDA DE LA ESCENA (LEGACY)             | PATOLOGÍA FORENSE                      |
+-----+----------------------------+------------------------------------------------------+----------------------------------------+
| 1   | Cabecera de Fechas (Row 1) | 46387.79125 | 46418.79125 | 46446.79125 ...          | SheetJS convirtió "Ene 2027" en floats |
| 2   | Columna Buque (Col C)      | MOQUEGUAMOQUEGUATABLONESCONCON_TRADERHUEMUL          | Concatenación ciega de todo el <select>|
| 3   | Métrica Net Revenue (Col D)| "Net RevenueNet"                                     | Arrastró el texto del botón <button>Net|
| 4   | Métrica TCE (Col D)        | "Métricas TCE ($/d)TCE $/d"                          | Duplicación de etiquetas UI del grupo  |
| 5   | Celdas de 0 Viajes         | "-" (texto plano) o "0" desalineado                  | No eran números nativos                |
| 6   | Dimensiones Combinadas     | Celdas A3..A12, B3..B12, C3..C12 vacías (sin merge)  | rowSpan de HTML ignorado en el XLS     |
| 7   | Estilos y Colores          | Fondo blanco plano en el 100% de la grilla           | Cero colores corporativos de la UI     |
| 8   | Rotación de Texto          | Texto horizontal plano, cortado e ilegible           | Ausencia de textRotation a 90°         |
| 9   | Filas de Totales/Subtotales| Omitidas o desalineadas en la exportación plana      | Subtotales y Totales no mapeados       |
+----------------------------------------------------------------------------------------------------------------------------------+
```

---

## 3. CLONAR (Clonación y Respaldo del Estado Funcional)

- **Branch / Tag de Respaldo:** `PRE.ULTIMOS.FEEDBACKS.IZ.01.09.26` y `PRE_ULTIMOS.FEEDBACKS.IZ.01.09.26` fijados en git.
- **Capturas de Pantalla PNG Respaldadas:**
  1. `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Maestro.Costos.Portuarios\PNGs\`
  2. `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.PATRICIA\`

---

## 4. DIFF (Diferencias Críticas y Matriz de Homologación Visual)

```mermaid
flowchart TD
    subgraph UI_En_Vivo["🖥️ Interfaz Web (UI)"]
        U1["Cabecera Slate 800 + Meses 'Ene 2027'"]
        U2["Cliente NEXA / SPCC con fondo Azul y Texto Vertical 90°"]
        U3["Rutas por Color: Matarani=Cyan, Marcona=Purple, Mejillones=Fuchsia"]
        U4["Buques por Color: Moquegua=Verde, Tablones=Rojo, Concon=Slate"]
        U5["Subtotal Cliente: Slate 800 + Texto Ámbar 400 + Datos Amber 50"]
        U6["Total Flota (Empresa): Slate 800 + Datos Slate 100"]
        U7["Total Acumulado Global: Teal 600 + Datos Indigo 50"]
    end

    subgraph Error_Legacy["❌ Archivo Excel Defectuoso (Legacy)"]
        E1["Fechas corruptas: 46387.79125..."]
        E2["Dimensiones sin combinar (celdas vacías)"]
        E3["Buque mutante: 'MOQUEGUAMOQUEGUATABLONES...'"]
        E4["Rutas todas del mismo color o blancas"]
        E5["Subtotales y Totales ausentes o sin estilo"]
    end

    subgraph Motor_ExcelJS["✅ Nuevo Motor ExcelJS (Corregido)"]
        M1["Cabecera 'ENE 2027' en Slate 800 + 'TOTAL ACUM' en Sky 900"]
        M2["ws.mergeCells con textRotation: 90° y fondos ARGB exactos"]
        M3["Rutas con color específico: Matarani=Cyan, Marcona=Purple, Mejillones=Fuchsia"]
        M4["Selectores limpios: select.value = 'MOQUEGUA'"]
        M5["Subtotales Cliente (Slate 800 + Amber 50)"]
        M6["Total Flota Empresa (Slate 800 + Slate 100)"]
        M7["Total Acumulado Cierre (Teal 600 + Indigo 50)"]
    end

    UI_En_Vivo -->|Rompe en| Error_Legacy
    UI_En_Vivo -->|Replica 1:1 en| Motor_ExcelJS
```

### Matriz de Colores y Formatos Homologados:

| Nivel de Fila / Dimensión | Color de Fondo (ARGB) | Color de Fuente | Orientación | Formato de Celdas de Datos |
|---|:---:|:---:|:---:|---|
| **Cabecera THEAD (A1..P1)** | `#1E293B` (`FF1E293B`) | Blanco Bold (`FFFFFFFF`) | Horizontal Centrado | N/A |
| **Cabecera TOTAL ACUM (Q1)** | `#0C4A6E` (`FF0C4A6E`) | Blanco Bold (`FFFFFFFF`) | Horizontal Centrado | N/A |
| **Cliente NEXA** | `#0F4C81` (`FF0F4C81`) | Blanco Bold | **Vertical 90°** | Merge filas del cliente |
| **Cliente SPCC** | `#0369A1` (`FF0369A1`) | Blanco Bold | **Vertical 90°** | Merge filas del cliente |
| **Ruta MATARANI** | `#06B6D4` (`FF06B6D4`) Cyan | Blanco Bold | **Vertical 90°** | Merge filas de la ruta |
| **Ruta MARCONA** | `#A855F7` (`FFA855F7`) Purple | Blanco Bold | **Vertical 90°** | Merge filas de la ruta |
| **Ruta MEJILLONES** | `#D946EF` (`FFD946EF`) Fuchsia| Blanco Bold | **Vertical 90°** | Merge filas de la ruta |
| **Buque MOQUEGUA** | `#16A34A` (`FF16A34A`) Verde | Blanco Bold | **Vertical 90°** | Solo texto del select activo |
| **Buque TABLONES** | `#DC2626` (`FFDC2626`) Rojo | Blanco Bold | **Vertical 90°** | Solo texto del select activo |
| **Subtotal Cliente (Cols 2-3)**| `#1E293B` (`FF1E293B`) Slate| Ámbar Bold (`FFFBBF24`)| Horizontal Centrado | Celdas en `#FFFFFBEB` (Amber 50) |
| **Total Flota Empresa (Cols 1-3)**| `#1E293B` (`FF1E293B`)| Blanco Bold | Horizontal Centrado | Celdas en `#FFF1F5F9` (Slate 100) |
| **Total Acumulado (Cols 1-3)** | `#0D9488` (`FF0D9488`) Teal | Blanco Bold | Horizontal Centrado | Celdas en `#FFEEF2FF` (Indigo 50) |

---

## 5. NOTA (Acciones Periciales y Estado de Corrección)

1. **Reemplazo del Motor**: Se erradicó el clonador plano de SheetJS y se implementó [`exportFinancialMatrixExcel.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/services/exportFinancialMatrixExcel.ts) basado en **ExcelJS**.
2. **Inclusión de Todos los Bloques Agregados**:
   - Subtotales por Cliente con desglose de viajes, días, toneladas, ingresos y P/L.
   - Bloque `TOTAL FLOTA (EMPRESA)` consolidado mes a mes.
   - Bloque `TOTAL ACUMULADO (CIERRE)` con suma progresiva mensual.
3. **Mapeo Dinámico de Colores de Ruta y Buque**:
   - Detección precisa de clases Tailwind (`bg-cyan-500`, `bg-purple-500`, `bg-fuchsia-500`, `bg-petral-teal`) e inyección de sus ARGB correspondientes.

---

---

## 7. Hallazgo Pericial: Extracción de Métricas y Máscaras No Monetarias

### A. Diagnóstico de Celdas de Métrica Vacías:
- **Causa Raíz:** En la interfaz web, las métricas expandibles (`Net Revenue`, `Métricas TCE ($/d)`, etc.) renderizan su texto dentro de un elemento `<button>` con insignias complementarias (ej. `<span className="font-mono">Net</span>`).
- **El Fallo:** La rutina de sanitización ejecutaba `clone.querySelectorAll('button').remove()`, lo que eliminaba el botón entero y dejaba la celda de la métrica en blanco (`""`).
- **Solución Pericial:** Se preserva el contenedor del botón y se eliminan únicamente los elementos SVG y badges parásitos (`.font-mono`, `[class*="text-[9px]"]`).

### B. Reglas Estrictas de Formato Numérico (Monetario vs No Monetario):

| Tipo de Métrica | Métricas Incluidas | Máscara Excel (`numFmt`) | ¿Lleva Símbolo de Dólar ($)? |
|---|---|:---:|:---:|
| **Viajes / Frecuencia** | `Viajes (freq)`, `Viajes`, `Frequency` | `#,##0` / `0.0` | **NO ($ prohibido)** |
| **Días Operativos** | `Días-Buque`, `Demurrage Days`, `Duración Total` | `0.0` | **NO ($ prohibido)** |
| **Tonelaje de Carga** | `Toneladas`, `Base Flete (MT)`, `Carga`, `MT` | `#,##0` | **NO ($ prohibido)** |
| **Porcentajes de Margen** | `Margen %`, `Margen Operativo %`, `Yield %` | `0.0%` | **NO ($ prohibido)** |
| **Tarifas y Fletes Unitarios** | `Tarifa Base (USD/MT)`, `Flete (USD/MT)`, `TCE ($/d)` | `$#,##0.00` | **SÍ (con 2 decimales)** |
| **Totales Monetarios** | `Net Revenue`, `Bunker Costs`, `Port Costs`, `P/L` | `$#,##0` | **SÍ (entero con comas)** |

---

## 8. Refinamiento Final: Erradicación Total de Ceros y Guiones

### A. Diagnóstico y Pedido del Usuario:
- **Observación:** *"Ceros y guiones que desaparezcan y con eso estamos listos."*
- **Problema:** En los meses donde una ruta o buque no opera (ej. meses alternos de frecuencia bimestral), aparecían valores `$0`, `0.0` o `"-"` que ensuciaban visualmente la cuadrícula.
- **Acción Pericial Aplicada:**
  - En `exportFinancialMatrixExcel.ts`: Toda celda con valor `0`, `0.0`, `$0` o `"-"` se transforma en una **celda vacía (`""`)**.
  - Solo los meses con operación activa y cifras reales contienen valores numéricos con sus respectivos formatos (`$#,##0`, `0.0%`, `$#,##0.00`, `#,##0`).
  - Resultado: Hoja de cálculo limpia, ejecutiva y legible a primer golpe de vista.

---

## 9. Blindaje Pericial: Preservación Absoluta de Títulos en Columna Métrica

### A. Diagnóstico de la Desaparición de Títulos:
- **Causa:** Al implementar la regla de ocultar ceros, la condición `if (!isDimensionCol && parsedNum === 0)` evaluó la columna 4 (Métrica) como no numérica (`parsedNum = 0`), borrando erróneamente los títulos de texto de las métricas.
- **Acción Correctiva:**
  - Se blindó la **Columna 4 (`isMetricCol = currentCol === 4`)** y las **Columnas de Dimensión (1..3)** para que **SIEMPRE preserven su texto íntegro**.
  - La regla de blanqueo de ceros y guiones se restringió estrictamente a las **Columnas de Datos (`currentCol >= 5`)**.

---
*Firma Pericial: Benoit Blanc - Detective Auditor*
