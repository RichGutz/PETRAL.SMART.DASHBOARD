# 🗺️ AS-BUILT Flowchart 03 — Mapa de Espaguetis (SpaghettiMap)

> **Herramienta**: Trazo Geográfico & Visualizador de Rutas Marítimas
> **Ruta UI**: `/spaghetti-map`
> **Componentes React**: `SpaghettiMap_V2.tsx`, `SpaghettiMap.tsx`
> **Script Python Diagrama**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts\FLOWCHART_MAPA_ESPAGUETIS.py`
> **Asset SVG Public**: `Geeksoft_Frontend/public/FLOWCHART_MAPA_ESPAGUETIS.svg`

---

## 🧭 Navegación
| [← Flowchart Auditoría Dual](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/04_Flowcharts_y_Diagramas_AS_BUILT/02_AS_BUILT_Flowchart_Auditoria_Dual.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Flowchart Matriz Financiera →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/04_Flowcharts_y_Diagramas_AS_BUILT/04_AS_BUILT_Flowchart_Matriz_Financiera.md) |

---

## 🔄 Flujo Estricto de 5 Pasos

```mermaid
graph TD
    P1["PASO 1: Origen de Rutas & Coordenadas<br/>• Ingesta de la secuencia de puertos de routes_master<br/>• Lookups de latitud/longitud de puertos WCSA"]
    P2["PASO 2: Motor de Navegación Marítima (searoute Engine)<br/>• Cálculo de waypoints marítimos evitando masa continental<br/>• Distancia náutica (NM) y tiempo estimado en mar"]
    P3["PASO 3: Generación de Geometría Bezier<br/>• Suavizado de curvas marinas en ECharts<br/>• Proyección de trayectorias animadas por barco"]
    P4["PASO 4: Renderizado de Capa Visual (SpaghettiMap V2)<br/>• Nodos interactivos por puerto (Callao, Tisur, Ilo)<br/>• Indicadores de volumen MT en tortas por puerto"]
    P5["PASO 5: Integración con Matriz Financiera<br/>• Filtrado interactivo de viajes al hacer click en una ruta"]

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
```

---

## 🔗 Enlaces Relacionados
- [[AS_BUILT_Herramienta_06_Mapa_de_Espaguetis]] — Documentación de la herramienta UI.
- [[AS_BUILT_Maestro_02_Rutas_RuteadorSpot_RouteMaster]] — Secuencia de puertos.
