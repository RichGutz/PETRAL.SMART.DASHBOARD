-- ============================================================
-- MIGRACIÓN: Crear tabla maestra `ports`
-- Fecha: 2026-06-26
-- Motivo: Extraer límites físicos de puertos de la tabla routes
--         para evitar duplicación (violación 3NF).
-- ============================================================

-- 1. Crear tabla ports
CREATE TABLE IF NOT EXISTS ports (
    port_id         VARCHAR PRIMARY KEY,
    port_name       VARCHAR NOT NULL,
    country         VARCHAR(2) NOT NULL,  -- 'PE' o 'CL'
    max_load_rate   FLOAT DEFAULT 9999,   -- Límite físico terminal de CARGA (MT/hr)
    max_disch_rate  FLOAT DEFAULT 9999    -- Límite físico terminal de DESCARGA (MT/hr)
);

-- 2. Insertar puertos conocidos del sistema
INSERT INTO ports (port_id, port_name, country, max_load_rate, max_disch_rate)
VALUES
    ('ILO',        'Puerto de Ilo',        'PE', 500,  9999),  -- Origen: terminal de carga SPCC. Descarga N/A aquí.
    ('MATARANI',   'Puerto de Matarani',   'PE', 9999, 300),   -- Destino: terminal de descarga limitado a 300 MT/hr
    ('MARCONA',    'Puerto de San Juan',   'PE', 9999, 9999),  -- Confirmar con ops
    ('MEJILLONES', 'Puerto Mejillones',    'CL', 9999, 9999),  -- Confirmar con ops
    ('CALLAO',     'Puerto del Callao',    'PE', 9999, 9999)   -- Confirmar con ops
ON CONFLICT (port_id) DO UPDATE
    SET port_name      = EXCLUDED.port_name,
        country        = EXCLUDED.country,
        max_load_rate  = EXCLUDED.max_load_rate,
        max_disch_rate = EXCLUDED.max_disch_rate;
