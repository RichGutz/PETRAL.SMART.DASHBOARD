-- ==============================================================================
-- Migration: Create commercial_trash_bin table
-- Purpose: Papelera de reciclaje transversal para Cierres, Cotizaciones, Presupuestos y Matrices
-- Author: Software Factory PETRAL ONE
-- Date: 2026-10-15
-- ==============================================================================

CREATE TABLE IF NOT EXISTS commercial_trash_bin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,       -- 'CIERRE', 'COTIZACION', 'PRESUPUESTO', 'MATRIZ'
    entity_id VARCHAR(255) NOT NULL,        -- Clave de origen (name, contract_id, rule_id, etc.)
    source_table VARCHAR(100) NOT NULL,     -- 'routes_quotes', 'routes_clients', 'contracts', 'contract_tariffs'
    document_name VARCHAR(255) NOT NULL,    -- Nombre visible para el operador
    client_name VARCHAR(100),               -- SPCC, NEXA, etc.
    vessel_id VARCHAR(100),                 -- Buque asignado si aplica
    payload JSONB NOT NULL,                 -- Snapshot completo del registro con piernas (legs_data), tarifas, etc.
    deleted_by VARCHAR(150) NOT NULL,       -- Email del usuario que ejecutó el borrado
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    restored BOOLEAN DEFAULT FALSE,         -- Flag de si ya fue recuperado
    restored_at TIMESTAMP WITH TIME ZONE,
    restored_by VARCHAR(150)
);

-- Índices de alto rendimiento para filtros en la UI
CREATE INDEX IF NOT EXISTS idx_trash_entity_type ON commercial_trash_bin(entity_type);
CREATE INDEX IF NOT EXISTS idx_trash_restored ON commercial_trash_bin(restored);
CREATE INDEX IF NOT EXISTS idx_trash_deleted_at ON commercial_trash_bin(deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_trash_client ON commercial_trash_bin(client_name);
CREATE INDEX IF NOT EXISTS idx_trash_entity_id ON commercial_trash_bin(entity_id);
