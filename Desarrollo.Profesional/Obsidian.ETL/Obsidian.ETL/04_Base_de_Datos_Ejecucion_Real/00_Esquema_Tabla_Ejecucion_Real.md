# DDL Y ESQUEMA OFICIAL COMPLETO DE LA TABLA `voyage_liquidations` (100% FIEL A PLANTILLAS REALES)

> **NAVIERA PETRAL S.A.**  
> **Módulo:** ETL & Ejecución Real  
> **Tabla Supabase / PostgreSQL:** `voyage_liquidations`  
> **Fuentes de Origen:** Plantillas de Jorge Neyra (`JN` / B/T Tablones) & María Elena Castro (`MEC` / B/T Moquegua)  

---

## 1. DDL SQL DE LA TABLA `voyage_liquidations`

```sql
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
    
    -- Métricas clave para consultas financieras e indicadores de gestión (KPIs)
    cargo_quantity_mt NUMERIC(12, 2) NOT NULL,        -- Toneladas métricas reales cargadas
    freight_rate_usd NUMERIC(10, 2) NOT NULL,         -- Flete unitario pactado (USD/MT)
    gross_revenue_usd NUMERIC(14, 2) NOT NULL,        -- Facturación total por flete (USD)
    tce_usd_day NUMERIC(10, 2) NOT NULL,              -- TCE real diario (USD/día)
    tce_req_usd_day NUMERIC(10, 2) DEFAULT 13000,     -- TCE Requerido meta (USD/día)
    pcm_usd NUMERIC(14, 2) NOT NULL,                  -- Profit Contribution Margin (USD)
    net_profit_usd NUMERIC(14, 2) NOT NULL,           -- Utilidad Neta Real P/L (USD)
    
    -- Objeto Granular JSONB (Contiene 100% de los datos de la plantilla)
    details JSONB NOT NULL,
    
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

## 2. ESTRUCTURA COMPLETA Y GRANULAR DEL CAMPO `details` (JSONB)

```json
{
  "vessel_header": {
    "vessel_name": "MOQUEGUA",
    "prepared_by": "MEC",
    "dwt": 14300,
    "loa": 142.5,
    "beam": 22.0,
    "built_year": 2002,
    "flag": "PERU"
  },
  "income": {
    "charterer": "NEXA",
    "cargo_name": "Ácido Sulfúrico",
    "freight_rate_usd": 24.50,
    "quantity_mt": 13500.25,
    "unit": "MT",
    "gross_revenue_usd": 330756.10,
    "total_freight_income_usd": 330756.10,
    "freight_income_items": [
      { "concept": "Flete Base", "amount_usd": 324517.66 },
      { "concept": "Muellaje Callao (Refacturación Pass-through)", "amount_usd": 6238.44 }
    ],
    "commissions_usd": 0.00,
    "net_freight_usd": 330756.10
  },

  "consumption_and_duration": {
    "daily_rates": {
      "sea_rate": { "ifo_mt_day": 14.0, "mdo_mt_day": 0.0 },
      "idle_rate": { "ifo_mt_day": 2.4, "mdo_mt_day": 0.0 },
      "load_rate": { "ifo_mt_day": 2.4, "mdo_mt_day": 0.5 },
      "disch_rate": { "ifo_mt_day": 3.6, "mdo_mt_day": 0.5 }
    },
    "duration_days": {
      "sea_days": 4.1005,
      "idle_days": 0.5417,
      "load_days": 1.1250,
      "disch_days": 1.6305,
      "total_duration_days": 7.3976
    },
    "kpis": {
      "tce_real_usd_day": 31922.58,
      "tce_req_usd_day": 13000.00,
      "pcm_usd": 971084.85,
      "net_profit_usd": 139982.52
    }
  },
  "voyage_program_itinerary": [
    {
      "port": "ILO",
      "arrival_datetime": "2026-06-01 12:00",
      "departure_datetime": "2026-06-03 13:07",
      "operation": "FONDEO / INICIO",
      "dist_nm": 514,
      "speed_kts": 11.0,
      "sailing_hrs": 48.13,
      "weather_factor": 0.03,
      "port_times_hrs": { "load": 0, "disch": 0, "other": 1.0, "total": 1.0 }
    },
    {
      "port": "CALLAO NEXA",
      "arrival_datetime": "2026-06-04 12:54",
      "departure_datetime": "2026-06-05 21:54",
      "operation": "CARGA",
      "quantity_mt": 13500.25,
      "rate_mth": 500,
      "dist_nm": 254,
      "speed_kts": 11.0,
      "sailing_hrs": 23.78,
      "weather_factor": 0.03,
      "port_times_hrs": { "load": 27.00, "disch": 0, "other": 6.0, "total": 33.00 }
    },
    {
      "port": "SAN JUAN DE MARCONA",
      "arrival_datetime": "2026-06-07 00:24",
      "departure_datetime": "2026-06-08 21:32",
      "operation": "DESCARGA",
      "quantity_mt": -13500.25,
      "rate_mth": -345,
      "dist_nm": 283,
      "speed_kts": 11.0,
      "sailing_hrs": 26.50,
      "weather_factor": 0.03,
      "port_times_hrs": { "load": 0, "disch": 39.13, "other": 6.0, "total": 45.13 }
    }
  ],
  "port_expenses": {
    "pol_cost_usd": 14148.65,
    "pod_cost_usd": 33370.89,
    "total_port_cost_usd": 47519.54,
    "agency_breakdown": [
      { "port": "ILO", "agency_cost_usd": 0.00 },
      { "port": "CALLAO NEXA", "agency_cost_usd": 14148.65 },
      { "port": "SAN JUAN DE MARCONA", "agency_cost_usd": 33370.89 }
    ]
  },
  "bunker_expenses_and_rob": {
    "scales_rob": [
      {
        "port": "ILO INICIO",
        "arrival_rob": { "ifo_mt": 1000.0, "mdo_mt": 100.0 },
        "purchased": { "ifo_mt": 0, "mdo_mt": 0, "ifo_price": 675.55, "mdo_price": 1187.41 },
        "depart_rob": { "ifo_mt": 1000.0, "mdo_mt": 100.0 },
        "consumption": { "port_ifo": 0.10, "port_mdo": 0.0, "sailing_ifo": 0.0, "sailing_mdo": 0.0 },
        "bunker_cost_usd": 67.55
      },
      {
        "port": "CALLAO NEXA",
        "arrival_rob": { "ifo_mt": 958.05, "mdo_mt": 100.0 },
        "depart_rob": { "ifo_mt": 954.75, "mdo_mt": 99.44 },
        "consumption": { "port_ifo": 3.30, "port_mdo": 0.56, "sailing_ifo": 13.87, "sailing_mdo": 0.0 },
        "bunker_cost_usd": 12269.72
      },
      {
        "port": "SAN JUAN DE MARCONA",
        "arrival_rob": { "ifo_mt": 939.29, "mdo_mt": 99.44 },
        "depart_rob": { "ifo_mt": 932.82, "mdo_mt": 98.62 },
        "consumption": { "port_ifo": 6.47, "port_mdo": 0.82, "sailing_ifo": 15.46, "sailing_mdo": 0.0 },
        "bunker_cost_usd": 15781.12
      }
    ],
    "total_bunker_summary": {
      "total_ifo_consumed_mt": 67.28,
      "total_mdo_consumed_mt": 1.38,
      "avg_ifo_price_usd": 675.55,
      "avg_mdo_price_usd": 1187.41,
      "total_bunker_cost_usd": 47084.66,
      "clean_heating_expenses_usd": 0.00
    }
  }
}
```
