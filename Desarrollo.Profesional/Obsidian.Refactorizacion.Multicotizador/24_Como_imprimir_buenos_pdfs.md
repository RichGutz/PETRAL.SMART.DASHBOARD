# Guía Maestra de Ingeniería: Cómo Imprimir PDFs Perfectos en Web (A4 Landscape, 1 Sola Cara, Cero Encabezados y Nativamente Horizontales)

**Proyecto:** PETRAL SMART DASHBOARD  
**Módulo:** Multicotizador Comercial (`MulticotizadorPdfPrintService.ts`)  
**Autor:** Antigravity AI & Ingeniería Geeksoft  
**Fecha:** 25 de Agosto de 2026  
**Estado:** Estándar de Producción Oficial Invariable  

---

## 1. El Objetivo de Excelencia Visual
Lograr una exportación a PDF desde navegador web que cumpla estrictamente con 5 condiciones ejecutivas:
1. **1 Sola Cara Estricta (Single-Page Fit):** Cero desbordes hacia una segunda hoja en blanco (`1/2`).
2. **Cero Encabezados y Pies del Navegador:** Supresión total de la URL (`about:blank`), fecha del sistema y numeración de página nativa de Chrome/Edge.
3. **Orientación Horizontal Nativa (Landscape):** El archivo PDF binario debe generarse con `/MediaBox [0 0 841.89 595.28]` para que visores externos (**Foxit Reader, Adobe Acrobat**) lo abran directamente "echado" (horizontal) sin requerir rotación manual.
4. **Fidelidad Financiera y Tipográfica al 100%:** Tipografía moderna ejecutiva (`Geist` / `Geist Mono`), contraste blanco corporativo y tablas densas compactas.
5. **Caja de Auditoría Formal:** Formato apilado en filas con líneas punteadas para V°B° comercial (*Revisado por*, *Fecha*, *Dictamen*, *Firma*).

---

## 2. Diagnóstico Forense: ¿Por qué los Navegadores fallan al generar PDFs?

Durante la iteración se identificaron 3 causas raíces que arruinan la exportación estándar en navegadores Chromium:

### Causa 1: El Error de Sintaxis Invisible de `@page` con `!important`
* **El Problema:** En la especificación oficial *CSS Paged Media Module Level 3*, los descriptores dentro de `@page` (`size`, `margin`, `marks`) **son descriptores de página, no propiedades CSS comunes**.
* **El Fallo:** Si se coloca `!important` dentro de `@page` (ejemplo: `@page { size: landscape !important; margin: 0mm !important; }`), el parser de Blink/Chromium **descarta silenciosamente toda la regla por error de sintaxis**.
* **La Consecuencia:** Al descartar la regla `@page`, Chromium retrocede a su configuración predeterminada: **A4 Vertical (Portrait / parado)** con 10mm de margen. Foxit Reader leía un PDF parado.

### Causa 2: Inyección Asíncrona de Tailwind CDN y Preflight
* **El Problema:** Al cargar `<script src="https://cdn.tailwindcss.com"></script>`, Tailwind inyecta estilos globales preflight en el `<head>` que pueden sobreescribir las reglas `@media print` si el bloque `<style>` está ubicado antes del script.
* **La Solución:** Colocar el bloque `<style>` de impresión **estrictamente después** del CDN de Tailwind con propiedades computadas finales.

### Causa 3: Desborde Milimétrico y la 2da Página en Blanco
* **El Problema:** Una hoja A4 horizontal mide exactamente **297mm × 210mm**. Si el contenedor tiene `height: 204mm` pero el `<body>` tiene padding de Tailwind (`p-2` = 8px arriba y abajo = ~4.2mm) más bordes, el alto total supera los `210mm`, disparando una 2da página vacía.
* **La Solución:** Fijar el alto total del contenedor en **`200mm`** (margen de seguridad de 10mm) con `box-sizing: border-box !important; overflow: hidden !important;`.

---

## 3. La Receta Maestra CSS Definitiva

Este es el bloque de estilos estándar que debe implementarse en cualquier servicio de exportación HTML-to-PDF:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>PETRAL_MULTICOTIZADOR_REPORTE</title>
    
    <!-- 1. Tailwind CSS (o Framework de estilos) -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- 2. ESTILOS DE IMPRESIÓN FORZADOS (POST-TAILWIND) -->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700;800&family=Geist:wght@400;500;600;700;800;900&display=swap');
        
        * {
            box-sizing: border-box !important;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .font-mono {
            font-family: 'Geist Mono', monospace;
        }

        /* DIRECTIVA ESTÁNDAR VÁLIDA PARA FORZAR HORIZONTAL Y SUPRIMIR HEADERS/FOOTERS */
        @page {
            size: A4 landscape;
            margin: 0;
        }

        @media print {
            @page {
                size: A4 landscape;
                margin: 0;
            }
            html, body {
                width: 297mm !important;
                height: 210mm !important;
                max-width: 297mm !important;
                max-height: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background-color: #ffffff !important;
                overflow: hidden !important;
            }
            .no-print {
                display: none !important;
            }
            .a4-landscape-page {
                width: 290mm !important;
                height: 200mm !important;
                max-height: 200mm !important;
                padding: 2mm 3mm !important;
                margin: 0 auto !important;
                overflow: hidden !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
                break-after: avoid !important;
                break-inside: avoid !important;
            }
        }

        .a4-landscape-page {
            width: 290mm;
            height: 200mm;
            max-height: 200mm;
            margin: 0 auto;
            background: #ffffff;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
        }

        .dense-table th, .dense-table td {
            padding: 1.2px 2.5px;
            font-size: 8px;
            line-height: 1.1;
        }

        .border-box {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
        }
    </style>
</head>
<body class="p-1">

    <!-- BARRA DE ACCIÓN (SOLO PANTALLA, OCULTA AL IMPRIMIR) -->
    <div class="no-print mb-2 max-w-[290mm] mx-auto flex items-center justify-between bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg">
        <div class="flex items-center gap-2">
            <span class="text-base font-bold">📄 Vista Previa de Exportación PDF (A4 Horizontal)</span>
            <span class="bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-mono">1 HOJA OFICIAL</span>
        </div>
        <div class="flex items-center gap-3">
            <button onclick="window.print()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1.5 shadow transition-colors cursor-pointer">
                🖨️ Imprimir / Guardar como PDF
            </button>
            <button onclick="window.close()" class="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-1.5 rounded transition-colors cursor-pointer">
                Cerrar
            </button>
        </div>
    </div>

    <!-- DOCUMENTO A4 LANDSCAPE CONFINADO -->
    <div class="a4-landscape-page">
        <!-- Contenido ejecutivo de la cotización -->
    </div>

</body>
</html>
```

---

## 4. Estructura del Box de Auditoría y Validación Comercial

Para garantizar un formato de aprobación impecable y compacto que no consuma altura vertical innecesaria, se diseñó la estructura de filas apiladas:

```html
<!-- FORMATO DE AUDITORÍA Y VALIDACIÓN COMERCIAL -->
<div class="mt-1 pt-0.5 border-t border-dashed border-slate-300">
    <div class="flex items-center justify-between mb-0.5">
        <span class="text-[7.5px] font-extrabold uppercase text-slate-800 tracking-wider">
            ✍️ REGISTRO DE AUDITORÍA Y VALIDACIÓN MATEMÁTICA (V°B° COMERCIAL)
        </span>
        <span class="text-[7px] font-bold text-slate-500 uppercase">
            NAVIERA PETRAL S.A.
        </span>
    </div>
    
    <div class="flex flex-col gap-0.5 text-[7.5px] bg-slate-50/80 p-1 rounded border border-slate-200 font-sans">
        <!-- Fila 1: Revisado por -->
        <div class="flex items-baseline justify-between gap-1">
            <span class="font-bold text-slate-700 whitespace-nowrap">Revisado por:</span>
            <div class="flex-1 border-b border-slate-400 border-dotted h-2"></div>
        </div>

        <!-- Fila 2: Fecha -->
        <div class="flex items-baseline justify-between gap-1">
            <span class="font-bold text-slate-700 whitespace-nowrap">Fecha:</span>
            <div class="flex-1 border-b border-slate-400 border-dotted h-2"></div>
        </div>

        <!-- Fila 3: Dictamen -->
        <div class="flex items-center justify-between">
            <span class="font-bold text-slate-700">Dictamen:</span>
            <div class="flex items-center gap-3 font-bold text-[7px]">
                <span class="text-emerald-700 flex items-center gap-1">
                    <span class="inline-block w-2 h-2 border border-emerald-600 rounded-sm bg-white"></span> APROBADO
                </span>
                <span class="text-amber-700 flex items-center gap-1">
                    <span class="inline-block w-2 h-2 border border-amber-600 rounded-sm bg-white"></span> OBSERVADO
                </span>
            </div>
        </div>

        <!-- Fila 4: Firma -->
        <div class="flex items-baseline justify-between gap-1">
            <span class="font-bold text-slate-700 whitespace-nowrap">Firma:</span>
            <div class="flex-1 border-b border-slate-400 border-dotted h-2"></div>
        </div>
    </div>
</div>
```

---

## 6. Crónica Forense de Commits y Branch Tags (Auditoría 25–27 de Agosto de 2026)

Para evitar que futuros agentes pierdan el contexto histórico o inventen soluciones ya descartadas, se documenta la cronología pericial completa de los commits, tags y ramas involucradas en la exportación de PDFs:

### 📋 Tabla Maestra de Commits y Tags

| Fecha | Commit / Tag | Rama / Tag | Descripción y Cirugía Aplicada | Comportamiento en Foxit Reader |
|---|---|---|---|:---:|
| **25.08.2026** | `05bf857` / `0ef99d7` | `PRE.PDF.PERFECTO.MULTI` | **Baseline Estable Original**: Redacción de la guía `24_Como_imprimir_buenos_pdfs.md`. Layout confinado a `290mm × 200mm`, supresión de headers y `@page { size: A4 landscape; margin: 0; }`. | ⚠️ Diálogo de Chrome se ve echado; al guardar en disco, Foxit puede abrirlo parado según el driver de Windows. |
| **25.08.2026** | `5a93aa9` | `main` | Intento de exportación binaria en cliente usando librería `html2pdf.js` vía CDN. | ❌ CORS / popup bloqueaba la captura silenciosamente. |
| **27.08.2026** | `6fe97f1` | `main` | Inserción del nuevo campo comercial `charterHireCost` (Costo Arriendo Naves) en el Multicotizador y en la plantilla del PDF. | ❌ Error involuntario en el DOM: se removieron etiquetas `</div>` en la tarjeta de búnker, rompiendo la grilla. |
| **27.08.2026** | `cd062ff` | `main` | **Caso 16 Benoit Blanc**: Reparación del árbol DOM, cierre de etiquetas huérfanas y tarjeta permanente de Arriendo Naves arriba de Comments. | ✅ Grilla y tarjeta Arriendo Naves reparadas 100% visualmente. |
| **27.08.2026** | `0ca40c5` | `main` | **Caso 17 Benoit Blanc**: Retiro de botones redundantes, restauración del descriptor canónico `@page { size: A4 landscape; margin: 0; }` sin `!important`. | ⚠️ Chrome print preview OK, pero archivo guardado en disco persiste parado en Foxit Reader. |
| **27.08.2026** | `db7bffb` | `main` | Reincorporación de CDN de `html2pdf.js` en `<head>` y botón azul `📥 Descargar PDF Directo (Foxit Ready)`. | ❌ Fallo silencioso de html2pdf en ventana popup. |
| **27.08.2026** | `ecb1fcb` | `PDF.LANDSCAPE.FOXIT.READY.OK.27.08.26` | Inyección de `id="pdf-content-page"` en el contenedor A4. | ❌ Foxit sigue abriendo en portrait porque `html2pdf.js` no logra instanciar el canvas en el popup y cae a `window.print()`. |
| **27.08.2026** | `7313c93` | `main` | **Caso 18 Benoit Blanc**: Suspensión formal del caso en `17_El_Metodo_Benoit_Blanc_Detective_de_Bugs_React.md` para iniciar investigación forense profunda. | 🔴 Documentado para resolución definitiva. |

---

## 7. El "Smoking Gun" Físico: Chromium Print Dialog vs Generación Binaria WeasyPrint

### 🕵️‍♂️ ¿Por qué `window.print()` falla al abrir el archivo en Foxit Reader?
1. **La Trampa de los Drivers de Impresión del Sistema Operativo**:
   Cuando un usuario ejecuta `window.print()` y selecciona *"Guardar como PDF"*, el motor de renderizado de Chrome delega la generación del archivo al subsistema de impresión del OS. Si el driver predeterminado del sistema tiene asignado *Portrait* por defecto, Chrome puede omitir la rotación física en el diccionario del PDF.
2. **La Ausencia del Descriptor Físico `/MediaBox`**:
   Un visor nativo como **Foxit Reader** o **Adobe Acrobat** no lee reglas CSS (`@page`); lee **únicamente los bytes del encabezado PDF**. Si el PDF no contiene explícitamente:
   $$\text{MediaBox} = [0 \quad 0 \quad 841.89 \quad 595.28] \quad (\text{Ancho } 297\text{mm} \times \text{Alto } 210\text{mm})$$
   Foxit interpretará la página como vertical ($595.28 \times 841.89\text{ pt}$) y la mostrará parada.

---

### 🧪 La Prueba Pericial del Endpoint Backend WeasyPrint

En el módulo de **Liquidaciones** (`LiquidationsExecutivePdfAudit.tsx`), el equipo resolvió este mismo desafío implementando un endpoint backend en FastAPI:
* **Archivo Backend**: `backend/api/routers/utils.py`
* **Endpoint**: `POST /api/v1/utils/generate-pdf`
* **Motor**: **WeasyPrint** (Librería estándar de Python para renderizado W3C a PDF binario).

#### Evidencia de Medición en Terminal con `pypdf`:
Se envió una solicitud de prueba con el layout A4 Landscape al servidor de producción (`https://forecast.geeksoft.tech/api/v1/utils/generate-pdf`) y se analizaron los bytes generados:

```text
========================================================================================
🔍 ANÁLISIS FORENSE DE MEDIDAS FÍSICAS (pypdf en test_vps_weasyprint.pdf)
========================================================================================
STATUS HTTP:             200 OK (5,815 bytes)
Ancho Físico (Width):    841.889764 pt  -->  297.0000 mm (A4)
Alto Físico (Height):    595.275591 pt  -->  210.0000 mm (A4)
Relación de Aspecto:     Width > Height (1.414)
Orientación Binaria:     LANDSCAPE (100% ECHADO NATIVO INMUTABLE)
========================================================================================
```

> 🎯 **Conclusión Pericial**:  
> Cuando el PDF es generado por **WeasyPrint en el backend**, el binario lleva impreso el `MediaBox` horizontal exacto. **Foxit Reader lo abre 100% echado y horizontal desde el explorador de Windows, sin depender del navegador ni de la configuración de la PC del usuario.**

---

## 8. Arquitectura Definitiva del Exportador Multicotizador (Foxit Ready)

Para blindar la exportación del Multicotizador uniendo la verdad comercial con la orientación física perfecta:

```
                  PANTALLA MULTICOTIZADOR (Paso 3)
                  [ Botón: 📄 Exportar PDF ]
                               │
                               ▼
            VENTANA MODAL / SERVICIO EXPORTADOR
       (MulticotizadorPdfPrintService.buildHtmlDocument)
                               │
        ┌──────────────────────┴──────────────────────┐
        ▼                                             ▼
  [ 📥 Descargar PDF Oficial ]                  [ 🖨️ Imprimir Navegador ]
     (Foxit Ready - WeasyPrint)                     (window.print())
        │                                             │
        ▼                                             ▼
  POST /api/v1/utils/generate-pdf               Diálogo nativo de Chrome
  - Retorna Blob binario 297x210 mm             Para envío directo a
  - MediaBox [0 0 841.89 595.28]                impresoras de papel.
  - Foxit lo abre 100% ECHADO.
```

### 🧩 Elementos Comerciales Integrados en la Plantilla:
1. **Costo Arriendo Naves (Charter Hire)**: Tarjeta permanente en Columna 1 arriba de *Comments* con desglose numérico `${this.fmtCur(charterHireCost)}`.
2. **Deducción Financiera**: Fila `(-) Arriendo Nave (Charter)` visible y deducida en la casilla verde de *Voyage Result / P&L*.
3. **Box de Auditoría y V°B° Comercial**: 4 filas estandarizadas (*Revisado por*, *Fecha*, *Dictamen*, *Firma*).
4. **Grilla de Tramos e Itinerario**: 19 columnas ejecutivas con badges de estado y muellaje `RF`.

---

*Documento actualizado y sellado para trazabilidad permanente en Obsidian del proyecto PETRAL SMART DASHBOARD — 27 de Agosto de 2026.*

