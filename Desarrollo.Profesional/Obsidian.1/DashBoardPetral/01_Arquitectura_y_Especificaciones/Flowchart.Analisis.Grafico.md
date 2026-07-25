# 📊 Flowchart: Análisis Gráfico (Forecast Comercial)
> **Herramienta**: Forecast Comercial — Análisis Gráfico y Analítica Visual
> **Script**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts\FLOWCHART_ANALISIS_GRAFICO.py`
> **SVG**: `Geeksoft_Frontend/public/FLOWCHART_ANALISIS_GRAFICO.svg`
> **Visor Web**: Herramientas ➔ 🗺️ Flowchart del Sistema ➔ Tab "Análisis Gráfico"

---

## 🎯 Propósito

El **Análisis Gráfico** es la suite de analítica visual interactiva del Forecast Comercial. Estructura el flujo secuencial en vertical (Pasos 1 a 5) para evaluar de un vistazo las tendencias de **P&L (Profit/Loss), Tonelaje (MT), Yield ($/día) y Demurrage**, conectando la Matriz Financiera con los tableros de auditoría.

---

## 🔄 Flujo Estricto de 5 Pasos (Vertical Top-to-Bottom)

### PASO 1 — Origen de Datos (Matriz Financiera)
- Snapshot completo de viajes exportados desde la Matriz Financiera y Forecast Builder.
- Inyección de P&L, Fechas de Zarpe, Tonelaje MT y Tarifas BAF.

### PASO 2 — Controles y Filtros del Operador
- **Toolbar de Selección**: Filtros dinámicos por Cliente (SPCC, NEXA, SPOT, Prospectos).
- **Filtro Operativo**: Cabotaje vs Exportación.
- **Eje Secundario**: Toggle entre Yield ($/día), Demurrage ($) y Gross Revenue ($).

### PASO 3 — Motor de Analítica Visual (Graphic Engine V2)
```
📊 GRAPHIC ANALYSIS ENGINE (V2)
────────────────────────────
• Cálculo de Acumulados Inteligentes
• Escalado Porcentual Ponderado
• Nodos Alternados por Entidad
• Renderizado de Trayectorias Bezier
```

### PASO 4 — Renderizado Visual en Pantalla
| Componente | Tipo de Gráfico / Analítica | Descripción |
|---|---|---|
| 📉 **InteractiveChart** | Dual-Axis Chart | Compara P&L contra líneas de acumulación inteligente y Yield/Demurrage |
| 🗺️ **SpaghettiMap V2** | Mapa de Rutas ECharts | Trayectorias marítimas curvas Bezier con misiles animados en serie y pasteles por puerto |
| 🏆 **KPI Cards** | Tarjetas de Resumen | Totales consolidados de P&L, Tonelaje Acumulado y Yield Promedio |

### PASO 5 — Salidas y Auditoría Detallada
- 🔍 **Ir a Auditoría Ledger**: Análisis individual del cálculo de P&L por viaje.
- ⚖️ **Auditoría Dual P×Q**: Comparación directa de la liquidación contra la factura del armador.

---

## 🔗 Posición en la Cadena (Flujo Vertical)

```
PASO 1: MATRIZ FINANCIERA / FORECAST BUILDER
    │
    ▼ (1. Inyecta Data Comercial)
PASO 2: TOOLBAR DE FILTROS & CONTROLES
    │
    ▼ (2. Inyecta Filtros Activos)
PASO 3: GRAPHIC ANALYSIS ENGINE (V2)
    │
    ▼ (3. Renderiza Gráfico Dual)
PASO 4: INTERACTIVECHART & SPAGHETTI MAP V2
    │
    ▼ (4. Selección para Auditoría)
PASO 5: AUDITORÍA LEDGER / AUDITORÍA DUAL P×Q
```

---

## 📁 Archivos Relacionados
- **Script flowchart**: [FLOWCHART_ANALISIS_GRAFICO.py](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Boiler.Plate/Flow.Charts/FLOWCHART_ANALISIS_GRAFICO.py)
- **Componente SW**: `src/pages/Tools/GraphicAnalysis_V2.tsx`
- **Anterior**: [[Flowchart.Matriz.Financiera]]
- **Siguiente**: [[Flowchart.Mapa.Espaguetis]]

