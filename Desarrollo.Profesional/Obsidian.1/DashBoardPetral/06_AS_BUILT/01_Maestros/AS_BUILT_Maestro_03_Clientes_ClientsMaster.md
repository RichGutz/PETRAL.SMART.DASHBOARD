# 🏢 AS-BUILT: Maestro 03 — Clientes (ClientsMaster)

> **Ruta UI**: `/clients`
> **Componente React**: `ClientsMaster.tsx` / `ClientsMaster_V2.tsx`
> **Tabla Supabase**: `clients`
> **Módulo Auth**: `maestro_tarifas`

---

## 🧭 Navegación
| [← Maestro Rutas](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_02_Rutas_RuteadorSpot_RouteMaster.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Maestro Contratos →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_04_Contratos_ContractsMaster.md) |

---

## 🎯 1. Propósito y Función en el Sistema

El **Maestro de Clientes (`/clients`)** gestiona el directorio de clientes corporativos de PETRAL (ej. **SPCC - Southern Perú**, **NEXA Resources**, **Viterra**, **Glencore**). Almacena las condiciones de crédito, RUC/ID fiscal, monedas de facturación y reglas comerciales por defecto.

```sql
CREATE TABLE clients (
    client_id VARCHAR(50) PRIMARY KEY,
    client_name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(50),
    country VARCHAR(50) DEFAULT 'PE',
    payment_terms_days INT DEFAULT 30,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📤 Consumidores en el Sistema
- [[AS_BUILT_Maestro_04_Contratos_ContractsMaster]] — Contratos suscritos por cliente.
- [[AS_BUILT_Herramienta_02_Matriz_Financiera_Dashboard]] — Agrupación de viajes por cliente en la grilla.
