# DDL Y ESQUEMA OFICIAL DE LA TABLA `voyage_liquidations` (JSONB HYBRID)

> **NAVIERA PETRAL S.A.**  
> **Módulo:** ETL & Ejecución Real  
> **Tabla Supabase / PostgreSQL:** `voyage_liquidations`  
> **Patrón:** Esquema Híbrido (Campos Clave SQL + Objeto Granular JSONB)  

---

## 1. CÓDIGO DDL SQL PARA CREACIÓN EN SUPABASE

```sql
-- Creación de la tabla de liquidaciones reales de viajes
CREATE TABLE IF NOT EXISTS voyage_liquidations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voyage_code VARCHAR(50) NOT NULL UNIQUE,          -- Código del viaje (ej. 'v.044', 'V.763')
    vessel_name VARCHAR(50) NOT NULL,                 -- Nave: 'B/T Moquegua' o 'B/T Tablones'
    client_name VARCHAR(100) NOT NULL,                -- Cliente: 'SPCC' o 'NEXA'
    voyage_date DATE NOT NULL,                        -- Fecha de salida / inicio
    pol_port VARCHAR(100) NOT NULL,                   -- Puerto de salida (Origen)
    pod_port VARCHAR(100) NOT NULL,                   -- Puerto de llegada (Destino)
    stops JSONB DEFAULT '[]'::jsonb,                  -- Array de paradas intermedias / múltiples escalas
    operator VARCHAR(20) NOT NULL,                    -- Operador responsable: 'JN' o 'MEC'
    
    -- Métricas clave para consultas financieras rápidas
    cargo_quantity_mt NUMERIC(12, 2) NOT NULL,        -- Toneladas métricas reales cargadas
    freight_rate_usd NUMERIC(10, 2) NOT NULL,         -- Flete unitario pactado (USD/MT)
    gross_revenue_usd NUMERIC(14, 2) NOT NULL,        -- Facturación total por flete (USD)
    tce_usd_day NUMERIC(10, 2) NOT NULL,              -- TCE real diario (USD/día)
    net_profit_usd NUMERIC(14, 2) NOT NULL,           -- Utilidad Neta Real P/L (USD)
    
    -- Objeto Granular JSONB (Contiene todo el cálculo detallado)
    details JSONB NOT NULL,
    
    -- Control de Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de alto rendimiento para búsquedas y comparativas con Forecast
CREATE INDEX IF NOT EXISTS idx_voyage_liq_vessel ON voyage_liquidations(vessel_name);
CREATE INDEX IF NOT EXISTS idx_voyage_liq_client ON voyage_liquidations(client_name);
CREATE INDEX IF NOT EXISTS idx_voyage_liq_date ON voyage_liquidations(voyage_date);
CREATE INDEX IF NOT EXISTS idx_voyage_liq_ports ON voyage_liquidations(pol_port, pod_port);
CREATE INDEX IF NOT EXISTS idx_voyage_liq_details ON voyage_liquidations USING gin (details);
```

---

## 2. ESTRUCTURA INTERNA DEL CAMPO `details` (JSONB)

```json
{
  "header": {
    "prepared_by": "MEC",
    "vessel": "MOQUEGUA",
    "dwt": 14300,
    "built_year": 2002,
    "flag": "PERU"
  },
  "income": {
    "cargo_type": "Ácido Sulfúrico",
    "freight_rate_usd": 24.50,
    "quantity_mt": 13500.25,
    "gross_revenue_usd": 330756.10,
    "demurrage_usd": 0.00,
    "net_freight_usd": 330756.10
  },
  "itinerary": [
    {
      "port": "ILO",
      "arrival_datetime": "2026-06-03 13:07",
      "operation": "INICIO / FONDEO",
      "other_hrs": 1.0
    },
    {
      "port": "CALLAO NEXA",
      "arrival_datetime": "2026-06-04 12:54",
      "operation": "CARGA",
      "quantity_mt": 13500.25,
      "rate_mth": 500,
      "other_hrs": 6.0
    },
    {
      "port": "SAN JUAN DE MARCONA",
      "arrival_datetime": "2026-06-07 00:24",
      "operation": "DESCARGA",
      "quantity_mt": -13500.25,
      "rate_mth": 345,
      "other_hrs": 6.0
    }
  ],
  "port_expenses": {
    "pol_cost_usd": 14148.65,
    "pod_cost_usd": 33370.89,
    "total_port_cost_usd": 47519.54,
    "breakdown": {
      "practicaje_usd": 11200.00,
      "remolcaje_usd": 24500.00,
      "lanchas_usd": 3100.00,
      "muellaje_usd": 8719.54
    }
  },
  "bunker_expenses": {
    "ifo380": {
      "consumed_mt": 142.50,
      "price_usd_mt": 675.55,
      "total_cost_usd": 96245.875
    },
    "mdo": {
      "consumed_mt": 24.80,
      "price_usd_mt": 1187.41,
      "total_cost_usd": 29447.768
    },
    "total_bunker_cost_usd": 125693.643
  }
}
```
