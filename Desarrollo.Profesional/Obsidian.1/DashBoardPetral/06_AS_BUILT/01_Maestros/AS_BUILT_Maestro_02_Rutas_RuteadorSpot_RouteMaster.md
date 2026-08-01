# 🗺️ AS-BUILT: Maestro 02 — Rutas y Ruteador Spot (RouteMaster)

> **Rutas UI**: `/routes`, `/spot-routes`, `/quotes`
> **Componente React**: `RoutesMaster.tsx` / `RouteMaster_V2.tsx`
> **Tablas Supabase**: `routes_master`, `routes`
> **Módulo Auth**: `maestro_rutas`

---

## 🧭 Navegación
| [← Maestro Buques](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_01_Buques_VesselsMaster.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Maestro Clientes →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_03_Clientes_ClientsMaster.md) |

---

## 🎯 1. Propósito y Función en el Sistema

El **Maestro de Rutas (`/routes`, `/spot-routes`)** administra la red navegable de circuitos costeros e internacionales de PETRAL. Modela tanto las rutas regulares (ej. circuitos cerrados de Ácido Sulfórico de SPCC `ILO ➔ MATARANI ➔ ILO`) como las rutas spot y cotizaciones compuestas.

---

## 🔑 2. Arquitectura de Llaves Compuestas (`routes_master`)

Toda ruta registrada en el sistema sigue la convención de combinación única:
$$\text{RouteKey} = \text{CLIENTE} . \text{PUERTOS} . \text{BUQUE}$$
*Ejemplo*: `SPCC.ILO.MATARANI.ILO.MOQUEGUA`

```sql
CREATE TABLE routes_master (
    route_id VARCHAR(150) PRIMARY KEY,       -- Llave CLIENTE.PUERTOS.BUQUE
    client_id VARCHAR(50) REFERENCES clients(client_id),
    vessel_id VARCHAR(50) REFERENCES vessels(vessel_id),
    ports_sequence VARCHAR(255) NOT NULL,    -- Ej: "ILO->MATARANI->ILO"
    distance_nm NUMERIC(10,2) NOT NULL,      -- Distancia náutica acumulada
    default_cargo_mt NUMERIC(10,2) DEFAULT 13500,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## ⚙️ 3. Modos Operativos en UI (`RouteMaster_V2`)

El componente `RouteMaster_V2` opera en dos modos parametrizables:
- **`mode="routes"` (`/spot-routes`)**: Vista de rutas regulares operativas de la flota.
- **`mode="quotes"` (`/quotes`)**: Repositorio de cotizaciones enviadas a clientes y simulaciones preliminares.

---

## 📥 Inyección de Dependencias
- [[AS_BUILT_Maestro_01_Buques_VesselsMaster]] — Buque asignado a la ruta.
- [[AS_BUILT_Maestro_03_Clientes_ClientsMaster]] — Cliente corporativo propietario del contrato.
- [[AS_BUILT_Maestro_05_Puertos_PortsMaster]] — Puertos intermedios de carga y descarga.

## 📤 Consumidores en el Sistema
- [[AS_BUILT_Herramienta_01_Multicotizador_Spot]] — Constructor de cotizaciones.
- [[AS_BUILT_Herramienta_06_Mapa_de_Espaguetis]] — Trazo geográfico con `searoute`.
