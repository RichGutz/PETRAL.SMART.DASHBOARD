-- ============================================================
-- MIGRACIÓN: Cambiar contract_id a VARCHAR y claves compuestas (Orden Corregido Tariffs)
-- ============================================================

-- 1. Eliminar la restricción de FK existente que causa el conflicto de tipos
ALTER TABLE contract_tariffs DROP CONSTRAINT IF EXISTS fk_contract_tariffs_contract;
ALTER TABLE contract_tariffs DROP CONSTRAINT IF EXISTS contract_tariffs_contract_id_fkey;
ALTER TABLE contract_tariffs DROP CONSTRAINT IF EXISTS contract_tariffs_contract_fk;

-- 2. Cambiar tipo de datos de contract_id a VARCHAR
ALTER TABLE contracts ALTER COLUMN contract_id TYPE VARCHAR;
ALTER TABLE contract_tariffs ALTER COLUMN contract_id TYPE VARCHAR;

-- 3. Asegurar columnas de ruta en contract_tariffs
ALTER TABLE contract_tariffs ADD COLUMN IF NOT EXISTS origin_port_id VARCHAR;
ALTER TABLE contract_tariffs ADD COLUMN IF NOT EXISTS destination_port_id VARCHAR;

-- 4. Poblar las columnas de ruta en tariffs usando el mapeo UUID previo
UPDATE contract_tariffs ct
SET origin_port_id = c.origin_port_id,
    destination_port_id = c.destination_port_id
FROM contracts c
WHERE ct.contract_id = c.contract_id;

-- 5. Poner restricciones NOT NULL a las nuevas columnas
ALTER TABLE contract_tariffs ALTER COLUMN origin_port_id SET NOT NULL;
ALTER TABLE contract_tariffs ALTER COLUMN destination_port_id SET NOT NULL;

-- 6. Eliminar la Clave Primaria antigua de contract_tariffs
ALTER TABLE contract_tariffs DROP CONSTRAINT IF EXISTS contract_tariffs_pkey;

-- 7. Crear la Clave Primaria compuesta nueva en contract_tariffs (mientras tiene UUIDs)
ALTER TABLE contract_tariffs ADD PRIMARY KEY (contract_id, origin_port_id, destination_port_id, min_tonnage, max_tonnage);

-- 8. Eliminar la Clave Primaria antigua de contracts
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_pkey;

-- 9. Crear la Clave Primaria compuesta nueva en contracts (mientras tiene UUIDs)
ALTER TABLE contracts ADD PRIMARY KEY (contract_id, origin_port_id, destination_port_id);

-- 10. Actualizar el contract_id al valor legible 'SPCC_2025' en ambas tablas
UPDATE contracts SET contract_id = 'SPCC_2025' WHERE is_active = TRUE;
UPDATE contract_tariffs SET contract_id = 'SPCC_2025';

-- 11. Crear la nueva Clave Foránea Compuesta con borrado en cascada
ALTER TABLE contract_tariffs 
  ADD CONSTRAINT contract_tariffs_contract_fk 
  FOREIGN KEY (contract_id, origin_port_id, destination_port_id) 
  REFERENCES contracts(contract_id, origin_port_id, destination_port_id) 
  ON DELETE CASCADE;
