# 📊 AS-BUILT Flowchart 04 — Matriz Financiera (Commercial Forecast)

> **Herramienta**: Tablero P&L Comercial y Grilla de 31 Viajes
> **Ruta UI**: `/dashboard`
> **Componentes React**: `FinancialMatrix_V2.tsx`, `CommercialForecast.tsx`
> **Script Python Diagrama**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts\FLOWCHART_MATRIZ_FINANCIERA.py`
> **Asset SVG Public**: `Geeksoft_Frontend/public/FLOWCHART_MATRIZ_FINANCIERA.svg`

---

## 🧭 Navegación
| [← Flowchart Mapa Espaguetis](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/04_Flowcharts_y_Diagramas_AS_BUILT/03_AS_BUILT_Flowchart_Mapa_Espaguetis.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Flowchart Motor BAF →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/04_Flowcharts_y_Diagramas_AS_BUILT/05_AS_BUILT_Flowchart_Motor_BAF.md) |

---

## 🔄 Flujo Estricto de 5 Pasos

```mermaid
graph TD
    P1["PASO 1: Ingesta de Datos y Tablas Maestras<br/>• Lookups automáticos a vessels, contracts, routes_master<br/>• Carga de precios bunker_prices"]
    P2["PASO 2: Renderizado de la Grilla Interactiva<br/>• Árbol dinámico: Cliente -> Ruta -> Buque<br/>• 31 filas de viajes con Sticky Headers"]
    P3["PASO 3: Edición en Caliente & Recálculos (useMemo)<br/>• Edición de Fletes USD/MT y Toneladas MT<br/>• Actualización inmediata de Net Freight y Voyage Result"]
    P4["PASO 4: Invocación del Backend FastAPI (spot_engine.py)<br/>• Recálculo de Días de permanencia, Consumos IFO/MDO<br/>• Modos de Costos Portuarios: STATIC vs MATRIX"]
    P5["PASO 5: Exportación y Reportes<br/>• Grabado de escenarios en commercial_forecasts<br/>• Salto a Análisis Gráfico y Exportación PDF"]

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
```

---

## 🔗 Enlaces Relacionados
- [[AS_BUILT_Herramienta_02_Matriz_Financiera_Dashboard]] — Documentación de la herramienta UI.
- [[AS_BUILT_Herramienta_07_Auditoria_Ledger_VoyageLedger]] — Engine P&L.
