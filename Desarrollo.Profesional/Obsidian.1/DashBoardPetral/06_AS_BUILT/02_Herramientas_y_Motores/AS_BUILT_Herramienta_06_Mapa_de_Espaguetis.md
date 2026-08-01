# 🗺️ AS-BUILT: Herramienta 06 — Mapa de Espaguetis (SpaghettiMap)

> **Ruta UI**: `/spaghetti-map`
> **Componentes React**: `SpaghettiMap_V2.tsx`, `SpaghettiMap.tsx`
> **Librería Marítima**: `searoute` + Leaflet
> **Módulo Auth**: `matriz_financiera`

---

## 🧭 Navegación
| [← Auditoría PDF Liquidaciones](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_05_Auditoria_PDF_Liquidaciones_WeasyPrint.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Auditoría Ledger →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_07_Auditoria_Ledger_VoyageLedger.md) |

---

## 🎯 1. Propósito y Trazo Geográfico Marítimo

El **Mapa de Espaguetis (`/spaghetti-map`)** proyecta visualmente la densidad de tráfico y las líneas de navegación marítima de la flota de PETRAL en la Costa Oeste de Sudamérica (WCSA).

### 📌 Características Técnicas:
- Integración de `searoute` en Python backend / Leaflet en frontend para calcular distancias entre waypoints reales respetando la línea de costa y pasos de navegación (no líneas rectas).
- Renderizado de coordenadas de puertos clave: Callao (-12.05, -77.15), Tisur Matarani (-17.00, -72.10), SPCC Ilo (-17.64, -71.34), San Juan de Marcona (-15.35, -75.16), Mejillones (-23.10, -70.45).

---

## 📥 Inyección de Dependencias
- [[AS_BUILT_Maestro_02_Rutas_RuteadorSpot_RouteMaster]] — Secuencia de puertos.
- [[AS_BUILT_Maestro_08_Sources_Sinks_SourcesSinksMaster]] — Nodos de origen y destino de Ácido Sulfúrico.
