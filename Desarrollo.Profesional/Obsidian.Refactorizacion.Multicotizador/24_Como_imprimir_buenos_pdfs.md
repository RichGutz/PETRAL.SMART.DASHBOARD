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

## 5. Tabla de Reglas de Oro para Futuras Pantallas de Reporte

| Parámetro | Valor Correcto | Valor Erróneo / Prohibido | Motivo Técnico |
|---|---|---|---|
| **Declaración `@page`** | `size: A4 landscape; margin: 0;` | `size: landscape !important;` | `!important` en descriptores `@page` invalida toda la regla en Blink. |
| **Margen `@page`** | `margin: 0;` | `margin: 5mm;` o por omisión | Si el margen es > 0, Chromium inyecta `about:blank`, fecha y `1/2`. |
| **Alto Contenedor A4** | `height: 200mm; max-height: 200mm;` | `height: 210mm;` o `height: 100vh;` | 200mm deja 10mm de buffer contra saltos de página espurios. |
| **Box Sizing** | `box-sizing: border-box !important;` | `content-box` | Los bordes y paddings se suman al alto y desbordan a página 2. |
| **Saltos de Página** | `page-break-after: avoid; break-after: avoid;` | Por omisión | Obliga al motor de impresión a mantener todo en 1 solo plano. |
| **Color del Fondo** | `-webkit-print-color-adjust: exact !important;` | Por omisión | Si se omite, los navegadores eliminan fondos de colores y bordes claros. |

---
*Documento guardado para trazabilidad permanente en Obsidian del proyecto PETRAL SMART DASHBOARD.*
