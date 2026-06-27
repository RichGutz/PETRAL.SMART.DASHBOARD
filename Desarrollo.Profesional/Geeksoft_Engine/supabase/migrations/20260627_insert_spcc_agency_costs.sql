-- 1. Añadir columna vessel_id y actualizar la llave primaria
ALTER TABLE agency_matrix DROP CONSTRAINT IF EXISTS agency_matrix_pkey;
ALTER TABLE agency_matrix ADD COLUMN IF NOT EXISTS vessel_id VARCHAR NOT NULL DEFAULT 'DEFAULT';
ALTER TABLE agency_matrix ADD PRIMARY KEY (client_id, port_id, operation_type, vessel_id);

-- 2. Limpiar registros previos (si existieran) para evitar colisiones
DELETE FROM agency_matrix WHERE client_id = 'SPCC';

-- 3. Insertar matriz real cruzada
INSERT INTO agency_matrix (client_id, port_id, operation_type, vessel_id, cost) VALUES
('SPCC', 'ILO', 'CARGA', 'CONCON_TRADER', 23500),
('SPCC', 'ILO', 'CARGA', 'MOQUEGUA', 22000),
('SPCC', 'ILO', 'CARGA', 'TABLONES', 23000),
('SPCC', 'MATARANI', 'DESCARGA', 'CONCON_TRADER', 19000),
('SPCC', 'MATARANI', 'DESCARGA', 'MOQUEGUA', 17000),
('SPCC', 'MATARANI', 'DESCARGA', 'TABLONES', 18000),
('SPCC', 'MARCONA', 'DESCARGA', 'CONCON_TRADER', 61000),
('SPCC', 'MARCONA', 'DESCARGA', 'MOQUEGUA', 40000),
('SPCC', 'MARCONA', 'DESCARGA', 'TABLONES', 44000),
('SPCC', 'MEJILLONES', 'DESCARGA', 'CONCON_TRADER', 60000),
('SPCC', 'MEJILLONES', 'DESCARGA', 'MOQUEGUA', 29000),
('SPCC', 'MEJILLONES', 'DESCARGA', 'TABLONES', 32000);
