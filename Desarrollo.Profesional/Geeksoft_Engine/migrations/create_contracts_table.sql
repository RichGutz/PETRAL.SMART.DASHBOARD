-- ============================================================
-- MIGRACIÓN: Crear tabla maestra `contracts`
-- Fecha: 2026-06-26
-- Motivo: Separar las reglas operativas del contrato (tasas de
--         carga/descarga del cliente, BAF) de los brackets de
--         flete en contract_tariffs (2NF).
-- ============================================================

-- 1. Crear tabla contracts
CREATE TABLE IF NOT EXISTS contracts (
    client_id               VARCHAR         NOT NULL,
    destination_port_id     VARCHAR         NOT NULL,

    -- Tasas operativas contractuales que el CLIENTE impone
    -- 9999 = sin restricción pactada (el barco o el puerto mandan)
    load_rate               FLOAT           DEFAULT 9999,    -- c_load  (MT/hr)
    discharge_rate          FLOAT           DEFAULT 9999,    -- c_disch (MT/hr)

    -- BAF (Bunker Adjustment Factor)
    bunker_baseline_price_ifo  FLOAT        DEFAULT NULL,    -- Precio IFO pactado en firma
    baf_rules               JSONB           DEFAULT NULL,    -- Reglas de ajuste flexible

    PRIMARY KEY (client_id, destination_port_id)
);

-- 2. Poblar con los contratos SPCC conocidos
--    Por ahora no hay restricción contractual de tasas (cliente no impone límite)
--    → load_rate = 9999, discharge_rate = 9999
INSERT INTO contracts (client_id, destination_port_id, load_rate, discharge_rate, bunker_baseline_price_ifo)
VALUES
    ('SPCC', 'MATARANI',   9999, 9999, NULL),
    ('SPCC', 'MARCONA',    9999, 9999, NULL),
    ('SPCC', 'MEJILLONES', 9999, 9999, NULL)
ON CONFLICT (client_id, destination_port_id) DO UPDATE
    SET load_rate                 = EXCLUDED.load_rate,
        discharge_rate            = EXCLUDED.discharge_rate,
        bunker_baseline_price_ifo = EXCLUDED.bunker_baseline_price_ifo;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT * FROM contracts;
