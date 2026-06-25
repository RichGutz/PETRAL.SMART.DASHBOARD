-- Migración: Añadir IMO y Ownership Type, y actualizar specs reales de la etapa MOCK
-- Ref: Etapa 2 Mockups

-- 1. Añadir columnas a vessels
ALTER TABLE vessels
ADD COLUMN imo_number VARCHAR,
ADD COLUMN ownership_type VARCHAR CHECK (ownership_type IN ('Propio', 'Charteado'));

-- 2. Actualizar B/T TABLONES
UPDATE vessels SET 
    imo_number = '9043093',
    dwt = 16533,
    loa = 158.11,
    ownership_type = 'Propio'
WHERE vessel_id = 'TABLONES';

-- 3. Actualizar B/T MOQUEGUA
UPDATE vessels SET 
    imo_number = '9262869',
    dwt = 14298,
    loa = 134.00,
    ownership_type = 'Propio'
WHERE vessel_id = 'MOQUEGUA';

-- 4. Actualizar M/N CONCON TRADER
UPDATE vessels SET 
    imo_number = '9800037',
    dwt = 19823,
    loa = 146.00,
    ownership_type = 'Charteado'
WHERE vessel_id = 'CONCON_TRADER';

-- 5. Insertar HUEMUL (Charteado)
INSERT INTO vessels (
    vessel_id, 
    vessel_name, 
    flag, 
    built, 
    dwt, 
    loa,
    imo_number,
    ownership_type,
    vessel_speed, 
    vessel_max_load_intake_limit, 
    vessel_pump_discharge_rate, 
    consumption_sea_ifo, 
    max_capacity_ifo, 
    max_capacity_mdo, 
    tce_required,
    consumption_idle_ifo,
    consumption_load_ifo,
    consumption_disch_ifo,
    consumption_idle_mdo,
    consumption_load_mdo,
    consumption_disch_mdo
) VALUES (
    'HUEMUL', 
    'B/T HUEMUL', 
    'CHILE', 
    2008, 
    22062, 
    161.00,
    '9371775',
    'Charteado',
    12.0, -- default
    600.0, -- default
    500.0, -- default
    15.0, -- default
    500.0, -- default
    100.0, -- default
    20000.0, -- default tce_required
    3.5, 3.5, 5.0, 0.0, 0.0, 0.0 -- default bunker consumptions
) ON CONFLICT (vessel_id) DO UPDATE SET 
    imo_number = EXCLUDED.imo_number,
    dwt = EXCLUDED.dwt,
    loa = EXCLUDED.loa,
    ownership_type = EXCLUDED.ownership_type;
