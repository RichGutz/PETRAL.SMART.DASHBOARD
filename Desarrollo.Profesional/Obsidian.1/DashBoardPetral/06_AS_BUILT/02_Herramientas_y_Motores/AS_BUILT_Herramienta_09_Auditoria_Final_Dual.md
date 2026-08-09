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

## ⛽ 2. Controles de Bunker e Imputación Directa
La barra superior de controles incluye las ventanas editables de entrada de precios de combustible:
- **`Bunker IFO ($/MT)`**
- **`Bunker MDO ($/MT)`**

### 📌 Jerarquía de Resolución de Precios de Bunker en `/audit-final`:
1. **1.º Prioridad (Contrato)**: Vinculación dinámica al contrato maestro del cliente seleccionado (`ForecastService.getContractsMaster()`). Para **SPCC**, se cargan automáticamente las tarifas del contrato (**$450.00 IFO / $800.00 MDO**).
2. **2.º Prioridad (Usuario)**: Precios imputados por el usuario en las ventanas editables de la barra superior.
3. **Sin Valor**: Si no hay contrato ni valor imputado, se evalúa estrictamente en `$0.00`.

---

## 🔄 3. Convergencia y Auditoría de Paridad (Loop QC)
- La Auditoría Final Dual se verifica en caliente con el motor de la Matriz Financiera mediante `test_pnl_qc_loop.py`.
- Coincidencia exacta (Delta = **$0.00**) en Ingresos por Flete, Gastos de Puerto, Costos de Bunker, PnL Neto y TCE Real $/día.

---

## 📥 Inyección de Dependencias
- [[AS_BUILT_Maestro_06_Costos_Portuarios_PortCostsMaster]] — Sub-operaciones `MAIN`.
- [[AS_BUILT_Maestro_07_Tarifario_Portuario_PortTariffsMaster]] — Regla Casino (+25%).
- [[AS_BUILT_Maestro_09_Precios_Bunker_BunkerMaster]] — Precios base de bunker.
