# ESQUEMA DE BASE DE DATOS (`voyage_execution_real`)

> **Módulo:** ETL - Persistencia en Supabase / PostgreSQL  
> **Tabla Principal:** `voyage_execution_real`  

---

## 1. DDL DE LA TABLA `voyage_execution_real`

```sql
CREATE TABLE IF NOT EXISTS voyage_execution_real (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nvr_code VARCHAR(50) NOT NULL UNIQUE,          -- Código NVR (ej. NVR-MOQ-2026-01)
    vessel_id VARCHAR(50) NOT NULL,               -- Identificador nave (ej. VESSEL_MOQUEGUA)
    client_id VARCHAR(50) NOT NULL,               -- Identificador cliente (SPCC / NEXA)
    origin_port_id VARCHAR(50) NOT NULL,          -- Puerto origen
    destination_port_id VARCHAR(50) NOT NULL,     -- Puerto destino
    cargo_type VARCHAR(100),                      -- Producto cargado
    cargo_quantity_mt NUMERIC(12, 2) NOT NULL,    -- Toneladas métricas reales
    
    -- Fechas de navegación
    departure_date TIMESTAMP WITH TIME ZONE,
    arrival_date TIMESTAMP WITH TIME ZONE,
    total_days_sea NUMERIC(6, 2),                 -- Días reales de mar
    total_days_port NUMERIC(6, 2),                -- Días reales de puerto
    
    -- Ingresos Reales
    freight_rate_usd NUMERIC(10, 2) NOT NULL,     -- Flete USD/MT real
    gross_freight_revenue NUMERIC(14, 2) NOT NULL, -- Flete total USD
    demurrage_revenue NUMERIC(14, 2) DEFAULT 0,   -- Sobrestadías cobradas
    total_revenue_usd NUMERIC(14, 2) NOT NULL,    -- Ingresos totales real
    
    -- Costos Reales de Búnker
    ifo_consumed_mt NUMERIC(10, 2) DEFAULT 0,
    ifo_price_usd NUMERIC(10, 2) DEFAULT 0,
    mdo_consumed_mt NUMERIC(10, 2) DEFAULT 0,
    mdo_price_usd NUMERIC(10, 2) DEFAULT 0,
    total_bunker_cost_usd NUMERIC(14, 2) NOT NULL,
    
    -- Gastos Portuarios & Otros
    origin_port_cost_usd NUMERIC(14, 2) DEFAULT 0,
    destination_port_cost_usd NUMERIC(14, 2) DEFAULT 0,
    commissions_cost_usd NUMERIC(14, 2) DEFAULT 0,
    other_operating_cost_usd NUMERIC(14, 2) DEFAULT 0,
    total_disbursements_usd NUMERIC(14, 2) NOT NULL,
    
    -- P&L Resultados Reales
    net_profit_usd NUMERIC(14, 2) NOT NULL,       -- Utilidad Neta Real
    real_tce_usd_day NUMERIC(10, 2) NOT NULL,     -- TCE Real USD/día
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
