-- 1. Añadir la columna vessel_id con valor por defecto 'DEFAULT'
ALTER TABLE agency_matrix ADD COLUMN vessel_id VARCHAR NOT NULL DEFAULT 'DEFAULT';

-- 2. Eliminar la llave primaria actual
ALTER TABLE agency_matrix DROP CONSTRAINT agency_matrix_pkey;

-- 3. Crear la nueva llave primaria compuesta
ALTER TABLE agency_matrix ADD PRIMARY KEY (client_id, port_id, operation_type, vessel_id);
