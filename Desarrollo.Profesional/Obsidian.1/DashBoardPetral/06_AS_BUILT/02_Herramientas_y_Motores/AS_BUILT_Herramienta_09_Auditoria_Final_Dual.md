# ⚖️ AS-BUILT: Herramienta 09 — Auditoría Final Dual (AuditFinal)

> **Ruta UI**: `/audit-final`
> **Componentes React**: `AuditFinal_V2.tsx`, `DynamicAuditViewer.tsx`
> **Módulo Auth**: `matriz_financiera`

---

## 🧭 Navegación
| [← Auditoría Engine PL](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_08_Auditoria_Engine_PL.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Visor Flowcharts →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_10_Visor_Flowcharts_Sistema.md) |

---

## 🎯 1. Comparativa Dual: Matriz Financiera vs Experta Sandra (Excel)

El **Módulo de Auditoría Dual (`/audit-final`)** realiza el cruce entre los resultados del **Motor P&L PxQ** y la **Proforma Oficial / Excel de la Experta Sandra**.

### 📌 Función del Componente `DynamicAuditViewer.tsx`:
Renderiza simultáneamente los dos extremos tarifarios para un puerto nominado:
- **Escenario Optimista (Nivel Bajo - Horario Ordinario)**: 100% Office hours sin recargos.
- **Escenario Pesimista (Nivel Alto - Recargo Casino)**: Dominical / Feriado / Nocturno (+25% Overtime).

---

## 📥 Inyección de Dependencias
- [[AS_BUILT_Maestro_06_Costos_Portuarios_PortCostsMaster]] — Sub-operaciones `MAIN`.
- [[AS_BUILT_Maestro_07_Tarifario_Portuario_PortTariffsMaster]] — Regla Casino (+25%).
