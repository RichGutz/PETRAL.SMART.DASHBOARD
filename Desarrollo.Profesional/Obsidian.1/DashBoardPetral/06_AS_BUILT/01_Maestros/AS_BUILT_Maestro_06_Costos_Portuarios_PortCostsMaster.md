# 💰 AS-BUILT: Maestro 06 — Costos Portuarios y Agencia (PortCostsMaster)

> **Ruta UI**: `/port-costs`
> **Componentes React**: `PortCostsMaster_V2.tsx`, `DynamicAuditViewer.tsx`
> **Tablas Supabase**: `port_costs_matrix`, `port_cost_static`
> **Módulo Auth**: `maestro_costos_agencia`

---

## 🧭 Navegación
| [← Maestro Puertos](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_05_Puertos_PortsMaster.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Tarifario Portuario →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_07_Tarifario_Portuario_PortTariffsMaster.md) |

---

## 🎯 1. Propósito y Modo de Operación (`STATIC` vs `MATRIX`)

El **Maestro de Costos Portuarios (`/port-costs`)** gestiona las tarifas fijas y variables cobradas por agencias marítimas (Trans Total, Agunsa) y operadores de terminal (APM Terminals Callao, Tisur Matarani, SPCC Ilo, Directemar Chile).

Admite dos modos de costo en la simulación:
- **`STATIC`**: Fijo consolidado de puerto (lookup a `port_cost_static`).
- **`MATRIX`**: Evaluación algorítmica PxQ dinámica de cada rubro en `port_costs_matrix`.

---

## 📊 2. Sub-operaciones Manejadas en Matriz

Las estimaciones de puerto se dividen en 3 tipos de sub-operaciones:
1. **`MAIN`**: Operación normal de carga o descarga.
2. **`STANDBY`**: Permanencia en fondeadero o espera de amarradero.
3. **`RECANALIZACION`**: Cambio de amarradero o maniobra adicional.

```sql
CREATE TABLE port_costs_matrix (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    port_id VARCHAR(50) REFERENCES ports(port_id),
    vessel_id VARCHAR(50) REFERENCES vessels(vessel_id),
    sub_op VARCHAR(50) DEFAULT 'MAIN',
    agency_fee NUMERIC(10,2),
    shifting_expenses NUMERIC(10,2),
    total_usd NUMERIC(10,2) NOT NULL
);
```

---

## 📥 Inyección de Dependencias
- [[AS_BUILT_Maestro_01_Buques_VesselsMaster]] — Características del barco (LOA/GRT).
- [[AS_BUILT_Maestro_05_Puertos_PortsMaster]] — Puerto y terminal evaluado.

## 📤 Consumidores en el Sistema
- [[AS_BUILT_Maestro_07_Tarifario_Portuario_PortTariffsMaster]] — Desglose de conceptos PxQ.
- [[AS_BUILT_Herramienta_09_Auditoria_Final_Dual]] — Componente `DynamicAuditViewer.tsx`.
