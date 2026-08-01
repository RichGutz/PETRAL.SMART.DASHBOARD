# ⚙️ AS-BUILT: Herramienta 08 — Auditoría Engine P&L (AuditEngine)

> **Ruta UI**: `/audit-engine`
> **Componente React**: `AuditEngine_V2.tsx`
> **Script Python Backend**: `backend/engine.py` / `backend/engine_universal.py`
> **Módulo Auth**: `matriz_financiera`

---

## 🧭 Navegación
| [← Auditoría Ledger](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_07_Auditoria_Ledger_VoyageLedger.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Auditoría Final Dual →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_09_Auditoria_Final_Dual.md) |

---

## 🎯 1. Validador Algorítmico de Ecuaciones Navales

El **Engine P&L Auditor (`/audit-engine`)** audita los cálculos finos de consumo de combustible y tiempos navales:

$$\text{Gasto IFO (USD)} = \text{Días en Mar} \times \text{Consumo IFO (MT/día)} \times \text{Precio IFO (USD/MT)}$$
$$\text{Gasto MDO (USD)} = \text{Días en Puerto} \times \text{Consumo MDO Work (MT/día)} \times \text{Precio MDO (USD/MT)}$$

---

## 📥 Inyección de Dependencias
- [[AS_BUILT_Maestro_01_Buques_VesselsMaster]] — Consumos IFO/MDO.
- [[AS_BUILT_Maestro_09_Precios_Bunker_BunkerMaster]] — Regla de homologación MDO/MGO.
