# 🔍 AS-BUILT Flowchart 02 — Liquidador de Gastos Portuarios (Auditoría Dual P×Q)

> **Herramienta**: Liquidador de Gastos Portuarios (Auditoría Dual P×Q & Split-View PDF)
> **Ruta UI**: `/audit-final`
> **Componentes React**: `AuditFinal_V2.tsx`, `DynamicAuditViewer.tsx`
> **Script Python Diagrama**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts\FLOWCHART_AUDITORIA_DUAL.py`
> **Asset SVG Public**: `Geeksoft_Frontend/public/FLOWCHART_AUDITORIA_DUAL.svg`

---

## 🧭 Navegación
| [← Flowchart Análisis Gráfico](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/04_Flowcharts_y_Diagramas_AS_BUILT/01_AS_BUILT_Flowchart_Analisis_Grafico.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Flowchart Mapa Espaguetis →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/04_Flowcharts_y_Diagramas_AS_BUILT/03_AS_BUILT_Flowchart_Mapa_Espaguetis.md) |

---

## 🎯 1. Propósito y Estructura AS-BUILT

El **Flowchart de Auditoría Dual P×Q** detalla el proceso de conciliación de gastos reales de puerto y búnker frente a las proformas calculadas por el sistema PETRAL y la liquidación oficial de la Experta Sandra.

---

## 🔄 2. Flujo Estricto de 5 Pasos

```mermaid
graph TD
    P1["PASO 1: Documentos & Inputs de Entrada<br/>• Factura PDF Armador / Statement of Facts (SOF)<br/>• Cuenta de Gastos del Agente Portuario<br/>• Proforma Motor PxQ del Sistema"]
    P2["PASO 2: Visor Split-View de Auditoría<br/>• Panel Izquierdo: PDF Factura Armador / Agente<br/>• Panel Derecho: Matriz de recálculo PxQ<br/>• Zoom e interacción en vivo"]
    P3["PASO 3: Motor de Auditoría Dual & Divergencias (Delta PxQ)<br/>• Delta Bunker = P_factura * Q_factura - P_sistema * Q_sistema<br/>• Delta Puertos = Gastos_factura - Gastos_sistema"]
    P4["PASO 4: Resolución y Tolerancia Operativa<br/>• Aprobado: Delta dentro de rango<br/>• Objeción: Delta supera umbral tolerado"]
    P5["PASO 5: Emisión del Acta PDF en Backend (WeasyPrint)<br/>• Renderizado en servidor via POST /api/v1/utils/generate-pdf<br/>• Eliminación de Sharing Violation 32 de Windows"]

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
```

---

## 🔗 Enlaces Relacionados
- [[AS_BUILT_Herramienta_09_Auditoria_Final_Dual]] — Documentación de la herramienta UI.
- [[AS_BUILT_Herramienta_05_Auditoria_PDF_Liquidaciones_WeasyPrint]] — Motor de generación PDF.
