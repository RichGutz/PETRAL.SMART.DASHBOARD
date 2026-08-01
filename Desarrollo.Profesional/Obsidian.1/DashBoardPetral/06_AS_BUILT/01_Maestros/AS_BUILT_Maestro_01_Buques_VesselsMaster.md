# 🚢 AS-BUILT: Maestro 01 — Buques (VesselsMaster)

> **Ruta UI**: `/vessels`
> **Componente React**: `VesselsMaster.tsx` / `VesselsMaster_V2.tsx`
> **Tabla Supabase**: `vessels`
> **Módulo Auth**: `maestro_buques`

---

## 🧭 Navegación
| [← Despliegue VPS](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/00_Fundamentos_y_Arquitectura/03_AS_BUILT_Despliegue_VPS_Nginx_Systemd_SSL.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Maestro Rutas →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_02_Rutas_RuteadorSpot_RouteMaster.md) |

---

## 🎯 1. Propósito y Función en el Sistema

El **Maestro de Buques (`/vessels`)** administra la flota propia y arrendada de naves quimiqueras/tanqueras de PETRAL (como **BT MOQUEGUA**, **BT TABLONES**, **BT HUEMUL**, **CONCON TRADER**). Almacena las especificaciones físicas hidráulicas (LOA, GRT, DWT) y las matrices granulares de consumo de combustible marino IFO 180 VLSFO y MDO Diesel.

---

## 📊 2. Esquema de Base de Datos (`vessels`)

```sql
CREATE TABLE vessels (
    vessel_id VARCHAR(50) PRIMARY KEY,
    vessel_name VARCHAR(100) NOT NULL,
    loa NUMERIC(10,2) NOT NULL,              -- Length Overall (m)
    grt NUMERIC(10,2) NOT NULL,              -- Gross Register Tonnage (TRB)
    dwt NUMERIC(10,2) NOT NULL,              -- Deadweight Tonnage (TPM)
    speed_laden_kts NUMERIC(5,2) DEFAULT 12.5,
    speed_ballast_kts NUMERIC(5,2) DEFAULT 13.0,
    ifo_laden_mt_day NUMERIC(6,2) DEFAULT 14.5,
    ifo_ballast_mt_day NUMERIC(6,2) DEFAULT 13.5,
    mdo_port_idle_mt_day NUMERIC(6,2) DEFAULT 1.2,
    mdo_port_work_mt_day NUMERIC(6,2) DEFAULT 2.5
);
```

---

## ⚙️ 3. Reglas de Negocio e Integración

1. **Inyección en el Motor P&L (`spot_engine.py`)**:
   Cuando el usuario cambia el buque en la Matriz Financiera o en el Multicotizador (ej. de `MOQUEGUA` a `TABLONES`), el backend reemplaza inmediatamente las velocidades y consumos del viaje recalculando días en mar, días en puerto y costo total de combustible.
2. **Cálculo de Tarifas Portuarias (Muellaje & Remolcaje)**:
   - **Muellaje**: Ecuación dependiente del LOA: $P_{\text{muellaje}} \times \text{LOA} \times \text{Horas}$.
   - **Remolcaje / Faro**: Depende del tonelaje de registro bruto (GRT): $P_{\text{faro}} \times \text{GRT}$.

---

## 📤 Consumidores en el Sistema
- [[AS_BUILT_Herramienta_01_Multicotizador_Spot]] — Selección de buque nominado.
- [[AS_BUILT_Herramienta_02_Matriz_Financiera_Dashboard]] — Grilla comercial de viajes.
- [[AS_BUILT_Herramienta_07_Auditoria_Ledger_VoyageLedger]] — Recálculo de Ledger de viajes.
