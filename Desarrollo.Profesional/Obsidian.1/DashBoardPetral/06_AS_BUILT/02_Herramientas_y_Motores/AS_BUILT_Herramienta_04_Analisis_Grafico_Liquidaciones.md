# 📊 AS-BUILT: Herramienta 04 — Análisis Gráfico de Liquidaciones

> **Ruta UI**: `/liquidations-graphic-analysis`
> **Componente React**: `LiquidationsGraphicAnalysis_V2.tsx`
> **Módulo Auth**: `matriz_financiera`

---

## 🧭 Navegación
| [← Análisis Gráfico Comercial](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_03_Analisis_Grafico_Commercial.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Auditoría PDF Liquidaciones →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_05_Auditoria_PDF_Liquidaciones_WeasyPrint.md) |

---

## 🎯 1. Propósito y Comparativa de Desviaciones (Variance Analysis)

El **Análisis Gráfico de Liquidaciones (`/liquidations-graphic-analysis`)** permite al equipo de operaciones y finanzas comparar gráficamente las diferencias entre el **Forecast Proyectado** y la **Ejecución Real de Liquidaciones**.

### 📌 Métricas Evaluadas:
- Delta de Días de Permanencia en Puerto ($\Delta \text{Días}$).
- Delta de Gasto de Búnker Real vs Estimado ($\Delta \text{USD Búnker}$).
- Desviaciones en Tarifas Portuarias y Demurrage.

---

## 📥 Inyección de Dependencias
- [[AS_BUILT_Herramienta_02_Matriz_Financiera_Dashboard]] — Datos proyectados.
- [[AS_BUILT_Herramienta_09_Auditoria_Final_Dual]] — Datos liquidados por la Experta Sandra.
