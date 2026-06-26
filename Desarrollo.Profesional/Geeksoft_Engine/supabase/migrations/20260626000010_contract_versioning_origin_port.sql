-- ============================================================
-- Migracion: Versionado de Contratos con origin_port_id + contract_id FK
-- Fecha: 2026-06-26
-- ============================================================

-- PASO 1: Anadir origin_port_id a la tabla contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS origin_port_id VARCHAR NOT NULL DEFAULT 'ILO';

-- PASO 2: Anadir campos de versionado historico
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS valid_from DATE NOT NULL DEFAULT '2025-01-01';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS valid_to DATE;

-- PASO 3: Backfill — todos los contratos SPCC existentes salen de ILO
UPDATE contracts SET origin_port_id = 'ILO' WHERE client_id = 'SPCC';

-- PASO 4: Eliminar constraint unique antigua (solo cliente+destino)
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_client_id_destination_port_id_key;

-- PASO 5: Nuevo indice unico: solo 1 contrato activo por ruta
CREATE UNIQUE INDEX IF NOT EXISTS contracts_active_route_unique
    ON contracts (client_id, origin_port_id, destination_port_id)
    WHERE is_active = TRUE;

-- PASO 6: Anadir contract_id a contract_tariffs si aun no existe
ALTER TABLE contract_tariffs ADD COLUMN IF NOT EXISTS contract_id UUID;

-- PASO 7: Backfill contract_id en tariffs cruzando por cliente y destino
UPDATE contract_tariffs ct
SET contract_id = c.contract_id
FROM contracts c
WHERE ct.client_id = c.client_id
  AND ct.destination_port_id = c.destination_port_id
  AND ct.contract_id IS NULL;

-- PASO 8: Hacer contract_id NOT NULL
ALTER TABLE contract_tariffs ALTER COLUMN contract_id SET NOT NULL;

-- PASO 9: Redefinir PK de contract_tariffs usando contract_id
ALTER TABLE contract_tariffs DROP CONSTRAINT IF EXISTS contract_tariffs_pkey;
ALTER TABLE contract_tariffs ADD PRIMARY KEY (contract_id, min_tonnage, max_tonnage);

-- PASO 10: FK explicita a contracts con ON DELETE CASCADE
ALTER TABLE contract_tariffs DROP CONSTRAINT IF EXISTS fk_contract_tariffs_contract;
ALTER TABLE contract_tariffs
    ADD CONSTRAINT fk_contract_tariffs_contract
    FOREIGN KEY (contract_id) REFERENCES contracts(contract_id)
    ON DELETE CASCADE;

-- PASO 11: Limpiar columnas legacy de contract_tariffs
ALTER TABLE contract_tariffs DROP COLUMN IF EXISTS client_id;
ALTER TABLE contract_tariffs DROP COLUMN IF EXISTS destination_port_id;

-- PASO 12: Renombrar bunker_baseline_price a bunker_baseline_price_ifo
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='contracts' AND column_name='bunker_baseline_price') THEN
        ALTER TABLE contracts RENAME COLUMN bunker_baseline_price TO bunker_baseline_price_ifo;
    END IF;
END $$;

-- ============================================================
-- VERIFICACION POST-MIGRACION
-- SELECT c.contract_id, c.client_id, c.origin_port_id, c.destination_port_id,
--        c.is_active, c.valid_from, ct.min_tonnage, ct.max_tonnage, ct.freight_rate
-- FROM contracts c
-- JOIN contract_tariffs ct ON ct.contract_id = c.contract_id
-- ORDER BY c.destination_port_id, ct.min_tonnage;
-- ============================================================
