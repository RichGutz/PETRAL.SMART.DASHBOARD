# ⚓ AS-BUILT: Herramienta 07 — Auditoría Ledger (VoyageLedger Engine)

> **Ruta UI**: `/audit-ledger`
> **Componente React**: `AuditLedger_V2.tsx` / `VoyageLedgerFinal.tsx`
> **Script Python Backend**: `backend/spot_engine.py`
> **Módulo Auth**: `matriz_financiera`

---

## 🧭 Navegación
| [← Mapa de Espaguetis](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_06_Mapa_de_Espaguetis.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Auditoría Engine PL →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_08_Auditoria_Engine_PL.md) |

---

## 🎯 1. Regla del Triple Mínimo (`MIN`) y Convergencia de Benchmark

El **Voyage Ledger Engine (`/audit-ledger`)** es el motor algorítmico central de cálculo P&L. Evalúa las restricciones hidráulicas y logísticas de la navegación aplicando la regla estricta del **Triple Mínimo (`MIN`)** para determinar el tiempo real de carga y descarga:

$$\text{Ritmo Efectivo (MT/h)} = \min\Big(\text{Ritmo Terminal}, \text{Ritmo Bombeo Buque}, \text{Ritmo Contrato}\Big)$$

---

## 🔬 Benchmark de Validación y Criterio de QC

> [!IMPORTANT]
> **Injunción de Validación:**
> Al simular **13,500 MT a Matarani (Laden)** con el buque **BT MOQUEGUA**, el motor DEBE CONVERGER exactamente en los siguientes valores:
> - **Permanencia Total**: `4.0801 días` (Mar: 0.5384 d, Puerto: 3.5417 d).
> - **Costos de Puerto**: `$39,000.00 USD`.
> - **Costo de Búnker**: `$18,560.53 USD`.
> - **Net Voyage Result**: `$195,033.00 USD`.
> - **TCE (Time Charter Equivalent)**: `$47,801.35 USD/día`.

---

## 📥 Inyección de Dependencias
- [[AS_BUILT_Maestro_01_Buques_VesselsMaster]] — Consumos del buque.
- [[AS_BUILT_Maestro_05_Puertos_PortsMaster]] — Ritmos terminales.
