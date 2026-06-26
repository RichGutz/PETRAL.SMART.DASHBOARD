-- ============================================================
-- MIGRACIÓN: Renombrar SAN_JUAN_DE_MARCONA → MARCONA
-- Fecha: 2026-06-26
-- Motivo: MARCONA es el ID oficial del puerto en el sistema.
--         SAN_JUAN_DE_MARCONA era inconsistente y causaba
--         errores silentes en el motor (freight_rate = 0).
-- ============================================================

-- ORDEN SEGURO: actualizar tablas hijas antes que PKs padre

-- 1. Tabla routes (destination_port_id en PK compuesta)
UPDATE routes
SET destination_port_id = 'MARCONA'
WHERE destination_port_id = 'SAN_JUAN_DE_MARCONA';

-- 2. Tabla contracts (destination_port_id en UNIQUE constraint)
UPDATE contracts
SET destination_port_id = 'MARCONA'
WHERE destination_port_id = 'SAN_JUAN_DE_MARCONA';

-- 3. Tabla agency_matrix (port_id en PK compuesta)
UPDATE agency_matrix
SET port_id = 'MARCONA'
WHERE port_id = 'SAN_JUAN_DE_MARCONA';

-- 4. Tabla ports (port_id = PK) — solo si existe el registro
UPDATE ports
SET port_id = 'MARCONA',
    port_name = 'San Juan de Marcona'
WHERE port_id = 'SAN_JUAN_DE_MARCONA';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT 'routes' AS tabla, origin_port_id, destination_port_id FROM routes WHERE destination_port_id = 'MARCONA'
UNION ALL
SELECT 'contracts', client_id, destination_port_id FROM contracts WHERE destination_port_id = 'MARCONA'
UNION ALL
SELECT 'agency_matrix', client_id, port_id FROM agency_matrix WHERE port_id = 'MARCONA';
