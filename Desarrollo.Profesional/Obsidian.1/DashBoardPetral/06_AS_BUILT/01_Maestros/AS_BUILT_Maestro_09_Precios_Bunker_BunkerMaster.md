# ⛽ AS-BUILT: Maestro 09 — Precios de Búnker (BunkerMaster)

> **Ruta UI**: `/bunker-prices`
> **Componente React**: `BunkerMaster.tsx`
> **Tabla Supabase**: `bunker_prices`
> **Módulo Auth**: `maestro_bunker`

---

## 🧭 Navegación
| [← Sources & Sinks](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_08_Sources_Sinks_SourcesSinksMaster.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Multicotizador Spot →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_01_Multicotizador_Spot.md) |

---

## 🎯 1. Propósito y Homologación MDO / MGO

El **Maestro de Precios de Búnker (`/bunker-prices`)** gestiona el historial de cotizaciones de combustibles marinos: **IFO 180 VLSFO** (propulsión principal en mar) y **MDO Diesel** (generadores en muelle y maniobras).

> [!IMPORTANT]
> **REGLA CORPORATIVA PETRAL DE HOMOLOGACIÓN:**
> En todo el software PETRAL (interfaces, tablas Supabase, motores de cálculo en Python y reportes PDF), las siglas **MGO** (Marine Gas Oil / Diesel Marino) que figuran en facturas o cotizaciones equivalen y se registran unificadamente bajo el estándar **MDO**.

```sql
CREATE TABLE bunker_prices (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    price_date DATE NOT NULL,
    port_location VARCHAR(100) DEFAULT 'CALLAO / BALBOA',
    price_ifo180_usd NUMERIC(10,2) NOT NULL, -- Ej. $485.00 USD/MT
    price_mdo_usd NUMERIC(10,2) NOT NULL,    -- Ej. $780.00 USD/MT (Homologado MGO)
    is_active BOOLEAN DEFAULT TRUE
);
```

---

## 📤 Consumidores en el Sistema
- [[AS_BUILT_Herramienta_02_Matriz_Financiera_Dashboard]] — Inyección dinámica de precios de combustible.
- [[AS_BUILT_Herramienta_08_Auditoria_Engine_PL]] — Cálculo del gasto total de búnker por viaje.
