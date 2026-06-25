-- Migración: Granularidad de Consumo y Características Técnicas (Phase 3)
-- Elimina consumos genéricos de puerto e inyecta parámetros técnicos al maestro de flota

-- 1. Añadir características técnicas a vessels
ALTER TABLE vessels
ADD COLUMN cbm NUMERIC,
ADD COLUMN loa NUMERIC,
ADD COLUMN beam NUMERIC,
ADD COLUMN draft NUMERIC;

-- 2. Eliminar las columnas genéricas antiguas de consumo de puerto
ALTER TABLE vessels
DROP COLUMN consumption_port_ifo,
DROP COLUMN consumption_port_mdo;

-- 3. Añadir las columnas de consumo granular de IFO
ALTER TABLE vessels
ADD COLUMN consumption_idle_ifo NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN consumption_load_ifo NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN consumption_disch_ifo NUMERIC NOT NULL DEFAULT 0;

-- 4. Añadir las columnas de consumo granular de MDO
ALTER TABLE vessels
ADD COLUMN consumption_idle_mdo NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN consumption_load_mdo NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN consumption_disch_mdo NUMERIC NOT NULL DEFAULT 0;

-- 5. Actualizar Barcos Conocidos según el esquema del Excel

-- B/T TABLONES
UPDATE vessels SET 
    cbm = 0, -- Rellenar si se conoce en el futuro
    loa = 0,
    beam = 0,
    draft = 0,
    consumption_idle_ifo = 3.5,
    consumption_load_ifo = 3.5,
    consumption_disch_ifo = 5.0,
    consumption_idle_mdo = 0.0,
    consumption_load_mdo = 0.0,
    consumption_disch_mdo = 0.0
WHERE vessel_name = 'B/T TABLONES';

-- B/T MOQUEGUA
UPDATE vessels SET 
    consumption_idle_ifo = 4.0,
    consumption_load_ifo = 4.0,
    consumption_disch_ifo = 5.5,
    consumption_idle_mdo = 1.0,
    consumption_load_mdo = 1.0,
    consumption_disch_mdo = 1.5
WHERE vessel_name = 'B/T MOQUEGUA';

-- M/N CONCON TRADER
UPDATE vessels SET 
    consumption_idle_ifo = 3.5,
    consumption_load_ifo = 3.5,
    consumption_disch_ifo = 5.0,
    consumption_idle_mdo = 0.0,
    consumption_load_mdo = 0.0,
    consumption_disch_mdo = 0.0
WHERE vessel_name = 'M/N CONCON TRADER';
