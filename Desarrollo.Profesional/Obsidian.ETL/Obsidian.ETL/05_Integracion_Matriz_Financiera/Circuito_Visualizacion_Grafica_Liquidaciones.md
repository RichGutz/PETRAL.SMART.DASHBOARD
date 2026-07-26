# Circuito de Visualización Gráfica Interactiva de Liquidaciones Reales

> **Proyecto**: PETRAL SMART DASHBOARD  
> **Módulo**: Commercial Forecast - Herramienta de Análisis Gráfico  
> **Componente**: `LiquidationsInteractiveChart.tsx`  
> **Estado**: Operativo v1.0  
> **Fecha de Actualización**: 2026-07-26  

---

## 1. Arquitectura de Visualización

La Herramienta de Análisis Gráfico de Liquidaciones Reales proporciona un lienzo de visualización de doble eje interactivo impulsado por ECharts.

Permite analizar comparativamente y en tiempo real las utilidades, eficiencias operativas (TCE), costos portuarios, costos de búnker y volúmenes de carga transportados por la flota PETRAL.

---

## 2. Estándar Visual y Sistema de Código de Colores

### 2.1 Código Cromático Dedicado por Mes
Para lograr una distinción ejecutiva inmediata sin saturar la vista con líneas o divisiones excesivas, cada uno de los 6 meses de la línea de tiempo posee un **color exclusivo y armónico**:

| Mes | Clave | Código Hex | Tono Visual |
| :--- | :--- | :--- | :--- |
| **Enero 2026** | `2026-01` | `#2563EB` | Azul Cobalto |
| **Febrero 2026** | `2026-02` | `#7C3AED` | Púrpura Imperial |
| **Marzo 2026** | `2026-03` | `#06B6D4` | Cian Turquesa |
| **Abril 2026** | `2026-04` | `#059669` | Verde Esmeralda |
| **Mayo 2026** | `2026-05` | `#D97706` | Ámbar Cálido |
| **Junio 2026** | `2026-06` | `#DB2777` | Magenta Rosé |

### 2.2 Aplicación de Coherencia Cromática
- **Etiquetas Verticals del Eje X (Nivel 1)**: Cada código de viaje (`V.038`, `V.039`, `V.761`...) adopta automáticamente el **color exclusivo de su mes**.
- **Tipografía y Espaciado**: Utiliza la tipografía `Inter` (11px, bold) con un espaciado entre letras (`V . 0 4 5`) para garantizar máxima legibilidad en ángulo vertical de 90°.
- **Rótulos del Eje X (Nivel 2 - Pie)**: Los nombres de los meses (`ENE 26`, `FEB 26`...) se presentan centrados al pie con su color correspondiente.

---

## 3. Lógica de Ordenación Cronológica

Los datos extraídos se ordenan mediante la función `sortedFilteredData`:

1. **Primer Nivel de Ordenación**: Mes cronológico (`2026-01` $\rightarrow$ `2026-06`).
2. **Segundo Nivel de Ordenación**: Código numérico del viaje (`V.038` a `V.052` y `V.761` a `V.777`).

Esto garantiza que la serie temporal sea continua, sin rupturas ni duplicidades de meses a lo largo del lienzo.

---

## 4. Controles del Sidebar de Análisis (Ancho Fijo 240px)

El panel lateral permite personalizar la vista sin descuadrar la interfaz:

1. **Filtros Dinámicos**:
   - Selector por **PETRAL (Flota Completa)**, **Cliente (SPCC, NEXA, etc.)**, **Ruta Real Navegada**, o **Buque (Tablones / Moquegua)**.
2. **Eje Primario (Azul)**:
   - Selección de Métrica: Profit Real ($USD), Gross Revenue, Toneladas, Costos Portuarios, Búnker, Yield o Duración.
   - Selector de Tipo de Gráfico: Barras Stack, Barras Adjuntas (Group), Línea Suavizada o Línea Recta.
   - Posicionamiento y color de etiquetas numéricas.
3. **Eje Secundario (Verde)**:
   - Selección de Métrica Secundaria (ej. TCE Real $/día).
   - Acumulación por serie o despliegue en porcentaje (Share %).
