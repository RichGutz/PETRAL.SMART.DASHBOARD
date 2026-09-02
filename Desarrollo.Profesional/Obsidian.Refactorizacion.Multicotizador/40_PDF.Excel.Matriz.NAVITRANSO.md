# 40. 📋 ESPECIFICACIÓN TÉCNICA: EXPORTACIÓN PDF & EXCEL INDEPENDIENTES PARA MATRIZ NAVITRANSO

**Fecha:** 02 de Septiembre de 2026  
**Módulo:** Matriz Financiera — Formato NAVITRANSO  
**Objetivo Estratégico:** Desarrollar servicios de exportación a PDF y Excel 100% aislados e independientes para el formato NAVITRANSO, garantizando cero riesgo de regresión sobre la Matriz PETRAL.

---

## 1. 🏛️ Arquitectura de Servicios Desacoplados

```
                                [ ForecastGridFilters ]
                                           │
                     ┌─────────────────────┴─────────────────────┐
                     ▼                                           ▼
           formato == 'PETRAL'                        formato == 'NAVITRANSO'
       ┌───────────────────────────┐               ┌─────────────────────────────────┐
       │ exportFinancialMatrixPdf  │               │ exportFinancialNavitransoPdf    │
       │ exportFinancialMatrixExcel│               │ exportFinancialNavitransoExcel  │
       └───────────────────────────┘               └─────────────────────────────────┘
             (Matriz PETRAL)                             (Matriz NAVITRANSO)
```

---

## 2. 📊 Estructura de Datos y Bloques NAVITRANSO

La Matriz NAVITRANSO organiza la cuenta de resultados de cada nodo y del total en **4 Bloques Contables**:

### Bloque 1: INGRESOS DE OPERACIÓN
* `INGRESOS DE OPERACIÓN` (Subtotal Bloque)
* `↳ Flete Marítimo` (Editable / Dinámico)
* `↳ Demoras` (Nativo o % / Días)
* `↳ Refacturación de Muellaje`

### Bloque 2: COSTOS DIRECTOS DE VIAJE
* `COSTOS DIRECTOS DE VIAJE` (Subtotal Bloque)
* `↳ COMBUSTIBLES` (Desglose IFO / MDO)
* `↳ GASTOS DE PUERTO` (Agenciamiento POL + POD)
* `↳ COSTOS DE DEMORA`
* `↳ COMISIONES VARIAS`
* `↳ OTROS COSTOS DIRECTOS` (Opcional según `hideNaRows`)

### Bloque 3: TIME CHARTER EQUIVALENT (TCE)
* `TIME CHARTER EQUIVALENT` (Subtotal Bloque)
* `↳ COSTO DE ARRIENDO NAVES` (Charter Hire)

### Bloque 4: MARGEN BRUTO / RESULTADO FINAL
* `MARGEN BRUTO` (Total Final del Viaje / Periodo)

---

## 3. 📑 Especificación del Exportador a Excel (`exportFinancialMatrixNavitransoExcel.ts`)

1. **Vistas y Zoom**:
   * `zoomScale: 65` y `zoomScaleNormal: 65` para visión panorámica inmediata.
   * `state: 'frozen'`, `ySplit: 1` para fijar cabeceras de meses.
2. **Jerarquía Visual y Colores**:
   * Cabeceras de Bloques Contables con estilos de subtotal destacados (`bg-slate-200`, `font-bold`).
   * Filas de resultado final (`MARGEN BRUTO`) con formato de total contable (`bg-indigo-50`, bordes dobles).
3. **Calibración de Anchos de Columna**:
   * Columnas 1 a 3 (Dimensiones de agrupación dinámica): `6.5`.
   * Columna 4 (Nombres de Métricas NAVITRANSO): `36.0`.
   * Columnas 5 a N (Meses y Totales): auto-fit dinámico al número formateado con padding `2.5`.

---

## 4. 📄 Especificación del Exportador a PDF (`exportFinancialMatrixNavitransoPdf.ts`)

1. **Formato de Salida**: A4 Landscape con tipografía compacta de alta densidad.
2. **Paginación Atómica**: Agrupación por nodo (Cliente / Ruta / Buque) evitando cortes a mitad de bloque.
3. **Micro-anchos Calibrados**:
   * Dimensiones: `24px` cada una con texto vertical SVG rotado a `-90°`.
   * Métrica: `135px`.
   * Meses: `56px` a `58px` cada uno.
   * Total Acum: `66px`.

---

## 5. 🛡️ Protocolo de Implementación y QC
* **Safe Point Branch:** `feature/navitranso-pdf-excel-services`
* **Safe Point Tag:** `PRE.NAVITRANSO.SERVICES.2.9.26`
* **Validaciones QC:** Generación local headless con JSDOM + OpenPyXL / Puppeteer antes de desplegar al VPS.

---
*Autor: Benoit Blanc Senior / Petral Engineering Team*
