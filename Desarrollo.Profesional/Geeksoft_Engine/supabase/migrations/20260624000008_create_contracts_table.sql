-- Migración: Crear tabla cabecera de contratos con reglas BAF en JSONB
-- Ref: Arquitectura Flexible para Maestro Contratos

-- 1. Crear tabla cabecera de contratos
CREATE TABLE contracts (
    contract_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR NOT NULL,
    destination_port_id VARCHAR NOT NULL,
    bunker_baseline_price NUMERIC,
    baf_rules JSONB DEFAULT '{}'::jsonb,
    load_rate NUMERIC,
    discharge_rate NUMERIC,
    UNIQUE(client_id, destination_port_id)
);

-- 2. Insertar los contratos base existentes del Seed Data (Asumiendo 430 USD base y 5% de trigger)
INSERT INTO contracts (client_id, destination_port_id, bunker_baseline_price, baf_rules, load_rate, discharge_rate)
VALUES 
('SPCC', 'MATARANI', 430.0, '{"type": "goal_seek_inverse", "trigger_percentage": 0.05}'::jsonb, 500, 450),
('SPCC', 'MARCONA', 430.0, '{"type": "goal_seek_inverse", "trigger_percentage": 0.05}'::jsonb, 500, 450),
('SPCC', 'MEJILLONES', 430.0, '{"type": "goal_seek_inverse", "trigger_percentage": 0.05}'::jsonb, 500, 450),
('SPCC', 'CALLAO', 430.0, '{"type": "goal_seek_inverse", "trigger_percentage": 0.05}'::jsonb, 500, 450);

-- 3. Vincular contract_tariffs (los brackets) a la nueva tabla contracts
ALTER TABLE contract_tariffs
ADD COLUMN contract_id UUID;

-- 4. Actualizar los contract_id en la tabla hija cruzando por cliente y destino
UPDATE contract_tariffs ct
SET contract_id = c.contract_id
FROM contracts c
WHERE ct.client_id = c.client_id AND ct.destination_port_id = c.destination_port_id;

ALTER TABLE contract_tariffs ALTER COLUMN contract_id SET NOT NULL;

-- 5. Actualizar la Llave Primaria (PK) de contract_tariffs para depender del contract_id
ALTER TABLE contract_tariffs DROP CONSTRAINT contract_tariffs_pkey;
ALTER TABLE contract_tariffs ADD PRIMARY KEY (contract_id, min_tonnage, max_tonnage);

-- 6. Limpiar columnas redundantes en la tabla hija
ALTER TABLE contract_tariffs DROP COLUMN client_id;
ALTER TABLE contract_tariffs DROP COLUMN destination_port_id;
