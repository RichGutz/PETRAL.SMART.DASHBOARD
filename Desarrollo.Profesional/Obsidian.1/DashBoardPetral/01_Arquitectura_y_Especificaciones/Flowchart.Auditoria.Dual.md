# 🔍 Flowchart: Liquidador de Gastos Portuarios (Auditoría Dual P×Q)
> **Herramienta**: Liquidador de Gastos Portuarios (Auditoría Dual P×Q & Split-View PDF Comparativo)
> **Script**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts\FLOWCHART_AUDITORIA_DUAL.py`
> **SVG**: `Geeksoft_Frontend/public/FLOWCHART_AUDITORIA_DUAL.svg`
> **Visor Web**: Herramientas ➔ 🗺️ Flowchart del Sistema ➔ Tab "Liquidador de Gastos Portuarios"

---

## 🎯 Propósito

El **Liquidador de Gastos Portuarios (Auditoría Dual P×Q)** es el módulo especializado en la liquidación, conciliación y auditoría de cuentas de gastos reales. Permite comparar sistemáticamente las facturas expedidas por el armador y el agente portuario contra la proforma y los cálculos del Motor P×Q del sistema PETRAL, emitiendo actas de conformidad o notas de objeción documentadas.

---

## 🔄 Flujo Estricto de 5 Pasos (Vertical Top-to-Bottom)

### PASO 1 — Documentos & Datos de Entrada a Auditar
- **📄 PDF Armador**: Factura / Statement of Facts (SOF) con desglose de bunkers y tiempos.
- **📄 PDF Agente Portuario**: Cuenta de Gastos por puerto (carga y/o descarga).
- **⚙️ Proforma Motor P×Q**: Matriz de valores calculados dinámicamente por el sistema.

### PASO 2 — Visor Split-View de Auditoría
El visor carga simultáneamente en pantalla:
- **Panel Izquierdo**: PDF Factura Armador / Agente Portuario.
- **Panel Derecho**: Matriz de recálculo del sistema P×Q.
- **Controles**: Zoom sincronizado, navegación por páginas y marcado de ítems.

### PASO 3 — Motor de Auditoría Dual & Divergencias (Δ P×Q)
```
Δ BUNKER  = P_factura × Q_factura  −  P_sistema × Q_sistema
Δ PUERTOS = Gastos_factura − Gastos_sistema
Δ TOTAL   = Δ Bunker + Δ Puertos
```
Cada delta se expresa en **USD absolutos** y en **% sobre la liquidación del sistema**.

### PASO 4 — Resolución y Auditoría de Tolerancia
| Resultado | Criterio de Tolerancia | Acción Operativa |
|---|---|---|
| ✅ **Aprobado** | Δ dentro del rango permitido | Liquidación aprobada y liberada para pago |
| ⚠️ **Objeción** | Δ supera el umbral de tolerancia | Emisión inmediata de objeción / Nota de Crédito |

### PASO 5 — Documentación Oficial & Acta Firmable en PDF
Exportación del **Acta de Auditoría en PDF** firmable, que incluye:
- Titulación explicita indicando el Nivel Calculado (`[NIVEL BAJO - HORARIO ORDINARIO]` o `[NIVEL ALTO - HORARIO RECARGO]`).
- Tabla comparativa línea por línea (Facturado vs Sistema vs Δ).
- Firma de aprobación u objeción comercial.

---

## 🔗 Posición en la Cadena (Flujo Vertical)

```
PASO 1: INPUTS DOCUMENTARIOS (PDF ARMADOR / AGENTE & PROFORMA P×Q)
    │
    ▼ (1. Carga Documentos)
PASO 2: VISOR SPLIT-VIEW DE AUDITORÍA
    │
    ▼ (2. Cotejo Interactivo)
PASO 3: MOTOR DE COMPARACIÓN DUAL (Δ P×Q)
    │
    ▼ (3. Evaluación de Tolerancia)
PASO 4: RESOLUCIÓN Y VERDICTO (APROBADO / OBJETADO)
    │
    ▼ (4. Emisión de Acta Oficial)
PASO 5: ACTA DE AUDITORÍA EN PDF ([NIVEL BAJO] / [NIVEL ALTO])
```

---

## 📁 Archivos Relacionados
- **Script flowchart**: [FLOWCHART_AUDITORIA_DUAL.py](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Boiler.Plate/Flow.Charts/FLOWCHART_AUDITORIA_DUAL.py)
- **Componente SW**: `src/pages/Tools/` (visor PDF Split-View)
- **Motor P×Q**: [[Flowchart.Motor.PxQ]]
- **Anterior**: [[Flowchart.Motor.PxQ]]
- **Inicio cadena**: [[Flowchart.Multicotizador]]
