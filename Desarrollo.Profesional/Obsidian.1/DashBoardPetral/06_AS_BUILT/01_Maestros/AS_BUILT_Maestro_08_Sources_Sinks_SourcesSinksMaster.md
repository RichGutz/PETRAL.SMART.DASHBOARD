# 🏭 AS-BUILT: Maestro 08 — Sources & Sinks (SourcesSinksMaster)

> **Ruta UI**: `/sources-sinks`
> **Componente React**: `SourcesSinksMaster_V2.tsx`
> **Tabla Supabase**: `sources_sinks`
> **Módulo Auth**: `maestro_rutas`

---

## 🧭 Navegación
| [← Tarifario Portuario](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_07_Tarifario_Portuario_PortTariffsMaster.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Precios Búnker →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_09_Precios_Bunker_BunkerMaster.md) |

---

## 🎯 1. Propósito y Función en el Sistema

El **Maestro de Sources & Sinks (`/sources-sinks`)** modela los balances anuales de masa de Ácido Sulfúrico ($H_2SO_4$) entre los nodos de producción (Sources) y los nodos de consumo/recepción (Sinks).

### 📌 Conceptos:
- **Sources (Fuentes / Orígenes)**: Fundiciones y plantas químicas productoras (ej. Fundición SPCC Ilo, Planta San Juan de Marcona).
- **Sinks (Sumideros / Destinos)**: Unidades mineras de lixiviación y clientes industriales (ej. Tisur Matarani para NEXA / Las Bambas / Cerro Verde).

```sql
CREATE TABLE sources_sinks (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    port_id VARCHAR(50) REFERENCES ports(port_id),
    node_type VARCHAR(20) CHECK (node_type IN ('SOURCE', 'SINK')),
    annual_capacity_mt NUMERIC(12,2) NOT NULL,
    fiscal_year INT DEFAULT 2026,
    operator_name VARCHAR(150)
);
```

---

## 📤 Consumidores en el Sistema
- [[AS_BUILT_Herramienta_06_Mapa_de_Espaguetis]] — Visualización de flujos de carga en mapa marítimo.
