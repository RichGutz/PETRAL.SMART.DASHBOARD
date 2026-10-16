-- ==============================================================================
-- Migration: Create bunker_bunkering_events and bunker_invoices tables
-- Purpose: Maestro de Búnker con Soporte Multifactura, Bootstrapping y Promedio Ponderado
-- Author: Software Factory PETRAL ONE
-- Date: 2026-10-16
-- ==============================================================================

-- 1. TABLA PADRE: bunker_bunkering_events (Eventos de Tanqueo e Hitos de Ponderación)
CREATE TABLE IF NOT EXISTS bunker_bunkering_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_date DATE NOT NULL,
    vessel_id VARCHAR(50) NOT NULL REFERENCES vessels(vessel_id),
    port_id VARCHAR(50) DEFAULT 'CALLAO',
    voyage_number VARCHAR(50),
    is_bootstrap BOOLEAN DEFAULT FALSE, -- TRUE si es el saldo inicial histórico
    
    -- Parámetros IFO
    rob_ifo_mt NUMERIC(12, 4) DEFAULT 0,
    price_prev_ifo_usd NUMERIC(12, 4) DEFAULT 0,
    purchased_ifo_mt NUMERIC(12, 4) DEFAULT 0,
    purchased_ifo_total_usd NUMERIC(12, 2) DEFAULT 0,
    weighted_avg_ifo_usd NUMERIC(12, 4) NOT NULL,
    
    -- Parámetros MDO (MGO Homologado)
    rob_mdo_mt NUMERIC(12, 4) DEFAULT 0,
    price_prev_mdo_usd NUMERIC(12, 4) DEFAULT 0,
    purchased_mdo_mt NUMERIC(12, 4) DEFAULT 0,
    purchased_mdo_total_usd NUMERIC(12, 2) DEFAULT 0,
    weighted_avg_mdo_usd NUMERIC(12, 4) NOT NULL,
    
    -- Parámetros BAF SPCC Contractual
    spcc_baf_factor NUMERIC(8, 6),
    spcc_initial_fuel_value NUMERIC(10, 4) DEFAULT 4.1700,
    spcc_new_baf NUMERIC(10, 4),
    spcc_baf_variation NUMERIC(10, 4),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(150)
);

CREATE INDEX IF NOT EXISTS idx_bunker_events_vessel ON bunker_bunkering_events(vessel_id);
CREATE INDEX IF NOT EXISTS idx_bunker_events_date ON bunker_bunkering_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_bunker_events_bootstrap ON bunker_bunkering_events(is_bootstrap);

-- 2. TABLA HIJA: bunker_invoices (Facturas de Compra Sustentatorias)
CREATE TABLE IF NOT EXISTS bunker_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES bunker_bunkering_events(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    supplier VARCHAR(150) NOT NULL,
    supplier_ruc VARCHAR(20),
    issue_date DATE NOT NULL,
    vessel_id VARCHAR(50) NOT NULL REFERENCES vessels(vessel_id),
    fuel_type VARCHAR(20) NOT NULL, -- 'IFO' o 'MDO'
    quantity_mt NUMERIC(12, 4) NOT NULL,
    unit_price_usd NUMERIC(12, 4) NOT NULL,
    total_amount_usd NUMERIC(12, 2) NOT NULL,
    pdf_filename VARCHAR(255),
    pdf_storage_path TEXT,
    pdf_raw_base64 TEXT,
    parsed_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(150)
);

CREATE INDEX IF NOT EXISTS idx_bunker_invoices_event ON bunker_invoices(event_id);
CREATE INDEX IF NOT EXISTS idx_bunker_invoices_vessel ON bunker_invoices(vessel_id);
CREATE INDEX IF NOT EXISTS idx_bunker_invoices_date ON bunker_invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_bunker_invoices_num ON bunker_invoices(invoice_number);
