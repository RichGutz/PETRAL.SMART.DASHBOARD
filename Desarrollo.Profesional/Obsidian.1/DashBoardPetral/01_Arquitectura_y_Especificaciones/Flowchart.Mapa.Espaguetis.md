# 🗺️ Flowchart: Spaghetti Map V2 (Mapa Espagueti & Visualización Geoespacial)
> **Herramienta**: Forecast Comercial — Spaghetti Map V2 (GeoJSON & ECharts Engine)
> **Script**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts\FLOWCHART_SPAGHETTI_MAP.py`
> **SVG**: `Geeksoft_Frontend/public/FLOWCHART_SPAGHETTI_MAP.svg`
> **Visor Web**: Herramientas ➔ 🗺️ Flowchart del Sistema ➔ Tab "Spaghetti Map V2"

---

## 🎯 Propósito

El **Spaghetti Map V2** es el módulo visual de analítica geoespacial del sistema PETRAL. Proyecta sobre un **mapa interactivo del Perú, Chile y Ecuador** la red completa de rutas marítimas (aristas curvas Bezier con misiles animados en serie) y la distribución de carga por puerto (pasteles duales Fuentes/Sumideros).

---

## 🔄 Flujo Estricto de 5 Pasos (Vertical Top-to-Bottom)

### PASO 1 — Origen de Datos Náuticos (Routes & GeoJSON)
- Coordenadas geográficas de los puertos de carga/descarga (`latitud`, `longitud`).
- Carga de mapa GeoJSON (`peru_chile_ecuador.json`).
- Snapshot de viajes mensuales exportados desde la Matriz Financiera.

### PASO 2 — Clasificación de Nodos: Fuentes vs Sumideros
- **Fuentes (Carga)**: Puertos donde Petral embarca mineral/ácido (ej. ILO, Callao).
- **Sumideros (Descarga)**: Puertos donde Petral descarga producto (ej. Matarani, Marcona, Mejillones).
- **Pasteles Duales por Nodo**: Renderizado de proporciones Carga vs Descarga (`coordinateSystem: geo`).

### PASO 3 — Motor Geoespacial ECharts & Bezier Curves
```
🗺️ ECHARTS SPAGHETTI ENGINE (V2)
────────────────────────────
• Polyline ECharts Lines para animaciones continuas
• Trayectorias Curvas Bezier (Curvature 0.3 a 0.75)
• Efecto Misil Animado en Serie por tramo marítimo
• Capa de fricción náutica & distinción LADEN vs BALLAST
```

### PASO 4 — Visualización Geoespacial en Pantalla
| Componente | Tipo de Visualización | Descripción |
|---|---|---|
| 🗺️ **Mapa Base GeoJSON** | ECharts `geo` dark mode | Mapa del Perú, Chile y Ecuador con roaming, pan y zoom interactivo |
| 🚀 **Misiles Animados** | ECharts `lines` polyline | Animación en serie del trayecto de los buques a lo largo de las rutas |
| 🥧 **Pasteles por Puerto** | ECharts `pie` en coordenadas | Split porcentual de toneladas cargadas vs descargadas por puerto |
| ⏱️ **Línea de Tiempo (Timeline)** | Slider mensual de meses | Control dinámico para navegar el horizonte comercial mes a mes |

### PASO 5 — Acciones y Conexión Comercial
- 🎛️ **Filtrar por Cliente**: Aislar la red logística de SPCC, NEXA, Minsur o SPOT.
- 🔍 **Tooltip Náutico**: Muestra Origen ➔ Destino, Toneladas (MT), Distancia (NM) y Buque.
- 📦 **Navegación a Auditoría**: Salida directa a la Matriz Financiera o Voyage Ledger.

---

## 🔗 Posición en la Cadena (Flujo Vertical)

```
PASO 1: MAESTRO DE DISTANCIAS & GEOJSON
    │
    ▼ (1. Inyecta Coordenadas & Mapa)
PASO 2: CLASIFICACIÓN DE NODOS (FUENTES / SUMIDEROS)
    │
    ▼ (2. Calcula Balance por Puerto)
PASO 3: ECHARTS SPAGHETTI ENGINE (V2)
    │
    ▼ (3. Renderiza Misiles & Curvas Bezier)
PASO 4: INTERFAZ SPAGHETTI MAP V2 & TIMELINE
    │
    ▼ (4. Navegación a Matriz)
PASO 5: MATRIZ FINANCIERA / VOYAGE LEDGER
```

---

## 📁 Archivos Relacionados
- **Script flowchart**: [FLOWCHART_SPAGHETTI_MAP.py](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Boiler.Plate/Flow.Charts/FLOWCHART_SPAGHETTI_MAP.py)
- **Componente SW**: `src/components/CommercialForecast/SpaghettiMap_V2.tsx`
- **GeoJSON**: `public/peru_chile_ecuador.json`
- **Anterior**: [[Flowchart.Analisis.Grafico]]
- **Siguiente**: [[Flowchart.Auditoria.Dual]]
