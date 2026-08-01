# 📄 AS-BUILT: Maestro 04 — Contratos y BAF (ContractsMaster)

> **Ruta UI**: `/contracts`
> **Componente React**: `ContractsMaster.tsx` / `ContractsMaster_V2.tsx`
> **Tablas Supabase**: `contracts`, `contract_tariffs`
> **Módulo Auth**: `maestro_contratos`

---

## 🧭 Navegación
| [← Maestro Clientes](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_03_Clientes_ClientsMaster.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Maestro Puertos →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_05_Puertos_PortsMaster.md) |

---

## 🎯 1. Propósito y Función en el Sistema

El **Maestro de Contratos (`/contracts`)** almacena las condiciones comerciales de los acuerdos COA (Contract of Affreightment) suscritos con los clientes. Define la estructura de comisiones comerciales (**Address Commission** y **Brokerage Fee**) y los parámetros de indexación tarifaria por búnker (**BAF - Bunker Adjustment Factor**).

---

## ⚙️ 2. Motor BAF y Ecuación Polinómica de Indexación

El motor BAF calcula el ajuste tarifario por tonelada ($\Delta \text{USD/MT}$) cuando el precio del mercado internacional de combustible se desvía del precio base pactado en el contrato:

$$\Delta \text{BAF} = \left( \frac{\text{Precio Actual Bunker} - \text{Precio Base Contractual}}{\text{Factor Eficiencia Navegación}} \right)$$

```sql
CREATE TABLE contracts (
    contract_id VARCHAR(50) PRIMARY KEY,
    client_id VARCHAR(50) REFERENCES clients(client_id),
    contract_name VARCHAR(150) NOT NULL,
    address_commission_pct NUMERIC(5,2) DEFAULT 0.0,  -- Ej. 3.75%
    broker_commission_pct NUMERIC(5,2) DEFAULT 1.25,   -- Ej. 1.25%
    base_bunker_price_ifo NUMERIC(10,2) NOT NULL,      -- Ej. $450.00/MT
    baf_trigger_delta NUMERIC(10,2) DEFAULT 10.00,     -- Umbral de disparo
    start_date DATE,
    end_date DATE
);
```

---

## 📤 Consumidores en el Sistema
- [[AS_BUILT_Herramienta_02_Matriz_Financiera_Dashboard]] — Deducción de comisiones comerciales (`Address` + `Broker`) en Net Freight.
- [[AS_BUILT_Herramienta_07_Auditoria_Ledger_VoyageLedger]] — Recálculo de flete ajustado por BAF.
