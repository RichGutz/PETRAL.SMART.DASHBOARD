# ⚓ AS-BUILT: Maestro 05 — Puertos y Terminales (PortsMaster)

> **Ruta UI**: `/ports`
> **Componente React**: `PortsMaster_V2.tsx`
> **Tabla Supabase**: `ports`
> **Módulo Auth**: `maestro_puertos`

---

## 🧭 Navegación
| [← Maestro Contratos](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_04_Contratos_ContractsMaster.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Costos Portuarios →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_06_Costos_Portuarios_PortCostsMaster.md) |

---

## 🎯 1. Propósito y Función en el Sistema

El **Maestro de Puertos (`/ports`)** almacena los límites operacionales y restricciones de infraestructura de los terminales marítimos (Callao APM, Callao Muelle Norte, Matarani Tisur, SPCC Ilo, Marcona, Arica, Mejillones). Configura los ritmos nominales máximos de bombeo/embarque (MT/h) y las ventanas operativas.

```sql
CREATE TABLE ports (
    port_id VARCHAR(50) PRIMARY KEY,       -- Ej: "CALLAO", "MATARANI", "ILO"
    port_name VARCHAR(150) NOT NULL,
    country VARCHAR(50) DEFAULT 'PE',
    max_draft_m NUMERIC(5,2),              -- Calado máximo permitible (m)
    max_loa_m NUMERIC(6,2),                -- LOA máximo permitible (m)
    max_load_rate_mth NUMERIC(8,2),        -- Ritmo de carga max (MT/h)
    max_discharge_rate_mth NUMERIC(8,2)   -- Ritmo de descarga max (MT/h)
);
```

---

## 📤 Consumidores en el Sistema
- [[AS_BUILT_Maestro_06_Costos_Portuarios_PortCostsMaster]] — Tarifario por puerto.
- [[AS_BUILT_Herramienta_07_Auditoria_Ledger_VoyageLedger]] — Cálculo de horas en muelle según la regla del Triple Mínimo (`MIN`).
