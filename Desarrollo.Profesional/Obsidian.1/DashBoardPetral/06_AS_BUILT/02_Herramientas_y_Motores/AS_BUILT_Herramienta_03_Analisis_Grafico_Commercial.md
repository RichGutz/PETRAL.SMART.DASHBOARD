# 📈 AS-BUILT: Herramienta 03 — Análisis Gráfico Comercial

> **Ruta UI**: `/graphic-analysis`
> **Componente React**: `GraphicAnalysis_V2.tsx`
> **Módulo Auth**: `matriz_financiera`

---

## 🧭 Navegación
| [← Matriz Financiera](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_02_Matriz_Financiera_Dashboard.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Análisis Gráfico Liquidaciones →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_04_Analisis_Grafico_Liquidaciones.md) |

---

## 🎯 1. Propósito y Cuadro de Mando Visual

El **Análisis Gráfico Comercial (`/graphic-analysis`)** visualiza los indicadores clave de rendimiento (KPIs) del programa comercial mediante tableros dinámicos en **Apache ECharts**.

### 📌 Dashboards Incluidos:
1. **Distribución de Costos Operativos**: Gráfico de torta (Donut Chart) desglosando Búnker (IFO/MDO), Costos de Puerto y Comisiones.
2. **Yield Ponderado por Cliente (USD/MT)**: Gráfico de barras de utilidad por tonelada por cada cliente.
3. **EBITDA & Voyage Result Acumulado**: Evolución del margen operativo viaje a viaje.

---

## 📥 Inyección de Dependencias
- [[AS_BUILT_Herramienta_02_Matriz_Financiera_Dashboard]] — Datos consolidados de los 31 viajes.
