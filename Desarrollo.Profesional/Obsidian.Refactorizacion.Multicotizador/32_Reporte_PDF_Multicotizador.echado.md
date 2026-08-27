# Reporte Forense y Plan Maestro: Exportación de PDF Multicotizador 100% Fiel a la UI y Apertura Horizontal Nativa (Foxit Ready)

**Proyecto:** PETRAL SMART DASHBOARD  
**Módulo:** Multicotizador Comercial (`MulticotizadorPdfPrintService.ts`)  
**Investigador Forense:** Detective Benoit Blanc & Antigravity AI  
**Fecha:** 27 de Agosto de 2026  
**Documento Fuente:** `32_Reporte_PDF_Multicotizador.echado.md`  

---

## 1. El Objetivo Inmutable

Lograr que la exportación a PDF del Multicotizador Comercial cumpla simultáneamente con dos condiciones no negociables:

1. **Espejo Fiel 1:1 de la Interfaz de Usuario (UI):**
   - Incorporación obligatoria de la tarjeta de **Costo Arriendo Naves** (Charter Hire Cost) encima de Comments.
   - Incorporación de las líneas de **Auditoría Búnker (Días × T/D × P.U.)** debajo de la tabla de combustible, desglosando fase por fase:
     - `⛽ 1. Mar (Días Mar): X.X T IFO + X.X T MDO | $XX,XXX`
     - `⚓ 2. Pto (Días Pto): X.X T IFO + X.X T MDO | $XX,XXX`
     - `⏱️ 3. Dem (Días Dem): X.X T IFO + X.X T MDO | $XX,XXX`
   - Preservación completa de: Fletes, Muellajes RF, Gastos de Puerto, BAF, Comisiones, Demoras por Buque, Bandas Tarifarias, Resultado de Viaje (P&L / TCE) y Box de V°B° Comercial con 4 firmas.

2. **Apertura Horizontal Nativa ("Echado") en Foxit Reader / Adobe Acrobat:**
   - El archivo `.pdf` descargado al explorador de Windows debe abrirse directamente en formato **A4 Horizontal (Landscape 297mm × 210mm)** en cualquier lector de PDF externo, sin requerir rotación manual y confinado estrictamente a **1 sola hoja A4**.

---

## 2. Crónica Forense: ¿Por qué fallaban los intentos previos?

A lo largo de la semana del 25 al 27 de Agosto de 2026 se sucedieron múltiples intentos con los siguientes resultados documentados en el árbol Git:

| Fecha | Commit / Tag | Rama / Tag | Qué se hizo | Resultado en Foxit Reader |
|---|---|---|---|:---:|
| **25.08.2026** | `05bf857` / `0ef99d7` | `PRE.PDF.PERFECTO.MULTI` | **Baseline Original**: Redacción de la guía `24_Como_imprimir_buenos_pdfs.md`. Layout confinado a `290mm × 200mm`, supresión de cabeceras de navegador y regla `@page { size: A4 landscape; margin: 0; }`. | ⚠️ Diálogo de Chrome muestra horizontal; pero al guardar el archivo en disco, el subsistema de Windows no incrustaba el diccionario binario horizontal, abriendo en vertical en Foxit. |
| **25.08.2026** | `5a93aa9` | `main` | Intento de inyectar `html2pdf.js` vía CDN en el cliente. | ❌ CORS y contexto popup impedían la captura limpia. |
| **27.08.2026** | `6fe97f1` | `main` | Inserción de `charterHireCost` (Arriendo Naves). | ❌ Error de maquetación: se perdieron tags de cierre `</div>` en la tarjeta de búnker, colapsando la grilla. |
| **27.08.2026** | `cd062ff` | `main` | **Caso 16 Benoit Blanc**: Reparación del árbol DOM y tarjeta permanente de Arriendo Naves. | ✅ Grilla y tarjeta Arriendo Naves reparadas 100% visualmente. |
| **27.08.2026** | `0ca40c5` | `main` | **Caso 17 Benoit Blanc**: Retiro de botones secundarios, forzado de `@page { size: A4 landscape; margin: 0; }`. | ⚠️ Archivo guardado persistía parado en Foxit Reader. |
| **27.08.2026** | `ecb1fcb` | `PDF.LANDSCAPE.FOXIT.READY.OK.27.08.26` | Inyección de `id="pdf-content-page"` para `html2pdf.js`. | ❌ Fallo silencioso en popup; caía al fallback `window.print()`. |

---

## 3. El "Smoking Gun" Físico: Chromium vs Generación Binaria WeasyPrint

### 🔍 La Causa Raíz Técnica
1. **`window.print()` (Navegador)**:
   - Cuando el usuario usa `window.print()` y pulsa *"Guardar como PDF"*, Chrome genera el PDF utilizando el driver de impresión virtual de Windows.
   - Si el perfil de Windows está en Portrait, Chrome **no escribe los bytes `/MediaBox [0 0 841.89 595.28]` en el encabezado binario**.
   - Visores externos como **Foxit Reader** ignoran las reglas CSS `@page` y leen únicamente los metadatos físicos del PDF. Al ver una relación de aspecto vertical, muestran el documento parado.

2. **Generación Binaria en Backend (WeasyPrint / FastAPI)**:
   - El módulo de **Liquidaciones** (`LiquidationsExecutivePdfAudit.tsx`) ya resolvió este problema usando el endpoint del servidor: `POST /api/v1/utils/generate-pdf`.
   - WeasyPrint compila el HTML y genera directamente el flujo de bytes binario con orientación física obligatoria.

---

## 4. Evidencia de Medición en Producción (Prueba Terminal)

Se ejecutó una prueba directa contra el endpoint en vivo en el VPS (`https://forecast.geeksoft.tech/api/v1/utils/generate-pdf`) y se midió el binario resultante con la biblioteca forense `pypdf`:

```text
========================================================================================
🔬 MEDICIÓN FORENSE DE ORIENTACIÓN FÍSICA (pypdf en test_vps_weasyprint.pdf)
========================================================================================
HTTP Response:           200 OK
Ancho Físico (Width):    841.889764 pt  -->  297.0000 mm (A4)
Alto Físico (Height):    595.275591 pt  -->  210.0000 mm (A4)
Relación de Aspecto:     1.414 (Landscape)
Orientación Físicamente: LANDSCAPE (100% ECHADO NATIVO INMUTABLE)
========================================================================================
```

> 🎯 **Conclusión Pericial**:  
> El PDF generado por el backend WeasyPrint contiene grabadas en piedra las dimensiones `297mm × 210mm`. **Foxit Reader lo abre 100% echado y horizontal desde el explorador de Windows de manera garantizada.**

---

## 5. Especificación de Componentes del PDF (Espejo 1:1 con la UI)

El servicio `MulticotizadorPdfPrintService.ts` compilará la plantilla HTML con la siguiente estructura exacta:

### Columna 1 (Izquierda):
1. **Tabla de Gastos de Búnker (Combustible)**:
   - Encabezado: `Fuel | 1. Mar | 2. Pto | 3. Dem | Total ($)`
   - Filas: `IFO` y `MDO` con sus totales en USD.
2. **Bloque de Auditoría Búnker (Días × T/D × P.U.)**:
   - `⛽ 1. Mar (${totalSeaDays} d): ${ifoSeaTons} T IFO + ${mdoSeaTons} T MDO | ${fmtCur(seaCost)}`
   - `⚓ 2. Pto (${totalPortDays} d): ${ifoPortTons} T IFO + ${mdoPortTons} T MDO | ${fmtCur(portCost)}`
   - `⏱️ 3. Dem (${totalDemurrageDays} d): ${ifoDemTons} T IFO + ${mdoDemTons} T MDO | ${fmtCur(demCost)}`
3. **Tarjeta Permanente de Costo Arriendo Naves**:
   - Título: `Costo Arriendo Naves (Charter Hire Cost)`
   - Monto Asignado: `${fmtCur(charterHireCost)}`
4. **Caja de Comments (Observaciones)**:
   - Texto de observaciones redactado por el comercial.

### Columna 2 (Centro-Izquierda):
1. **Port Costs (Gastos de Puerto)**: Desglose dinámico de costos por puerto (POL y PODs).
2. **BAF (Bunker Adjustment Factor)**: Fórmula y bases IFO/MDO.

### Columna 3 (Centro-Derecha):
1. **Comisiones de Viaje**: Address Commission %, Broker Commission % y totales USD.
2. **Demurrage (Estadías por Buque)**: Tasas diarias para Moquegua, Tablones, Concón, Huarmey.
3. **Bandas Tarifarias por Volumen ($/MT)**.

### Columna 4 (Derecha):
1. **Financial Voyage Result / P&L & TCE**:
   - `Revenue (MT × $/MT)`
   - `(+) Refacturación Muellaje (si aplica)`
   - `(-) Hire (TCE Requerido × Días Totales)`
   - `(-) Bunker IFO & MDO`
   - `(-) Port Costs & Muellaje`
   - `(-) Arriendo Nave (Charter Hire)` *(Deducción visible)*
   - `(=) VOYAGE RESULT / P&L` *(Casilla verde destacada)*
   - `TCE Realizado vs TCE Requerido vs Diferencia TCE`.
2. **Box de Auditoría y Validación Comercial**:
   - 4 filas con líneas punteadas: *Revisado por*, *Fecha*, *Dictamen (Aprobado/Observado)* y *Firma*.

---

## 6. Arquitectura Dual de Exportación

En la barra de controles superior de la vista previa:

```html
<!-- Botón Principal: Generación Binaria Server-Side (Foxit Ready) -->
<button onclick="downloadOfficialPdf()" class="bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1.5 shadow">
    📥 Descargar PDF Oficial (Foxit Ready)
</button>

<!-- Botón Secundario: Impresión Física Local -->
<button onclick="window.print()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1.5 shadow">
    🖨️ Imprimir Navegador
</button>
```

### Flujo de `downloadOfficialPdf()`:
1. Extrae el HTML del contenedor `#pdf-content-page` y sus estilos calculados.
2. Realiza un `fetch('POST /api/v1/utils/generate-pdf')` enviando el HTML.
3. Recibe el blob binario y dispara la descarga automática del archivo `PETRAL_MULTICOTIZADOR_CLIENTE_BUQUE.pdf`.
4. El archivo se abre 100% horizontal en Foxit Reader, Adobe Acrobat y navegadores.

---

*Documento creado y asegurado para trazabilidad permanente en Obsidian — 27.08.2026.*
