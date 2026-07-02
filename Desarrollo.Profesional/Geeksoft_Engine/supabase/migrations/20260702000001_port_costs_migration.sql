-- 1. Crear catálogo de conceptos
CREATE TABLE port_cost_concepts (
    concept_id VARCHAR PRIMARY KEY,
    concept_name VARCHAR NOT NULL,
    category VARCHAR NOT NULL CHECK (category IN ('shifting', 'general_port', 'agency')),
    default_calculation_type VARCHAR NOT NULL DEFAULT 'FIXED' CHECK (default_calculation_type IN ('FIXED', 'VARIABLE_TIME', 'VARIABLE_TONS'))
);

-- 2. Insertar conceptos estándar
INSERT INTO port_cost_concepts (concept_id, concept_name, category) VALUES
('towage_1st', '1er Remolcador', 'shifting'),
('towage_2nd', '2do Remolcador', 'shifting'),
('pilotage', 'Practicaje/Acceso', 'shifting'),
('linesmen', 'Linesmen / Amarre y Desamarre', 'shifting'),
('shifting_surcharges', 'Recargos por Maniobra', 'shifting'),
('lighthouse_dues', 'Lighthouse Dues / Faros', 'general_port'),
('dockage', 'Dockage / Muellaje', 'general_port'),
('launch_hire', 'Launch Hire / Lanchas', 'general_port'),
('watchmen', 'Vigilancia Carga Peligrosa', 'general_port'),
('sanitary_inspection', 'Inspección Sanitaria', 'general_port'),
('clearance', 'Clearance / Despacho', 'general_port'),
('coordinator_board', 'Coordinador a Bordo', 'general_port'),
('loading_master', 'Loading Master', 'general_port'),
('agency_fee', 'Agency Fee / Honorarios', 'agency'),
('transportation_communication', 'Transporte y Comunicaciones', 'agency');

-- 3. Crear matriz de costos desglosada
CREATE TABLE port_costs_matrix (
    client_id VARCHAR NOT NULL,
    port_id VARCHAR NOT NULL,
    terminal VARCHAR NOT NULL DEFAULT 'GENERAL',
    operation_type VARCHAR NOT NULL CHECK (operation_type IN ('CARGA', 'DESCARGA')),
    vessel_id VARCHAR NOT NULL,
    concept_id VARCHAR NOT NULL REFERENCES port_cost_concepts(concept_id),
    cost NUMERIC NOT NULL DEFAULT 0,
    rate_usd NUMERIC,
    multiplier_source VARCHAR NOT NULL DEFAULT 'FIXED' CHECK (multiplier_source IN ('FIXED', 'LOA', 'TRB', 'DWT', 'PORT_HOURS', 'CARGO_TONS')),
    min_limit NUMERIC,
    max_limit NUMERIC,
    calculation_formula_template TEXT,
    PRIMARY KEY (client_id, port_id, terminal, operation_type, vessel_id, concept_id)
);

-- 4. Migrar datos históricos de la vieja agency_matrix a la nueva port_costs_matrix
INSERT INTO port_costs_matrix (client_id, port_id, terminal, operation_type, vessel_id, concept_id, cost)
SELECT client_id, port_id, 'GENERAL', operation_type, vessel_id, 'agency_fee', cost
FROM agency_matrix;

-- 5. Dar de baja la tabla antigua
DROP TABLE agency_matrix;

-- 6. SEEDING DE COSTOS DE BUQUE MOQUEGUA (Cliente SPCC)
DELETE FROM port_costs_matrix WHERE vessel_id = 'MOQUEGUA';

INSERT INTO port_costs_matrix (client_id, port_id, terminal, operation_type, vessel_id, concept_id, cost, rate_usd, multiplier_source) VALUES
-- ILO (Carga - SPCC - MOQUEGUA) - Total $20,571
('SPCC', 'ILO', 'GENERAL', 'CARGA', 'MOQUEGUA', 'pilotage', 3000, 1500, 'FIXED'),
('SPCC', 'ILO', 'GENERAL', 'CARGA', 'MOQUEGUA', 'linesmen', 5200, 0.16, 'TRB'),
('SPCC', 'ILO', 'GENERAL', 'CARGA', 'MOQUEGUA', 'towage_1st', 4000, 0.18, 'TRB'),
('SPCC', 'ILO', 'GENERAL', 'CARGA', 'MOQUEGUA', 'shifting_surcharges', 1500, 1500, 'FIXED'),
('SPCC', 'ILO', 'GENERAL', 'CARGA', 'MOQUEGUA', 'lighthouse_dues', 991, 991, 'FIXED'),
('SPCC', 'ILO', 'GENERAL', 'CARGA', 'MOQUEGUA', 'dockage', 830, 0.05, 'TRB'),
('SPCC', 'ILO', 'GENERAL', 'CARGA', 'MOQUEGUA', 'launch_hire', 2580, 90, 'FIXED'),
('SPCC', 'ILO', 'GENERAL', 'CARGA', 'MOQUEGUA', 'coordinator_board', 400, 400, 'FIXED'),
('SPCC', 'ILO', 'GENERAL', 'CARGA', 'MOQUEGUA', 'sanitary_inspection', 520, 520, 'FIXED'),
('SPCC', 'ILO', 'GENERAL', 'CARGA', 'MOQUEGUA', 'clearance', 150, 150, 'FIXED'),
('SPCC', 'ILO', 'GENERAL', 'CARGA', 'MOQUEGUA', 'agency_fee', 1000, 1000, 'FIXED'),
('SPCC', 'ILO', 'GENERAL', 'CARGA', 'MOQUEGUA', 'transportation_communication', 250, 250, 'FIXED'),

-- MATARANI (Descarga - SPCC - MOQUEGUA) - Total $15,541
('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'towage_1st', 3500, 3500, 'FIXED'),
('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'towage_2nd', 3500, 3500, 'FIXED'),
('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'pilotage', 280, 70, 'FIXED'),
('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'shifting_surcharges', 1000, 1000, 'FIXED'),
('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'lighthouse_dues', 891, 891, 'FIXED'),
('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'dockage', 3000, 0.57, 'LOA'),
('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'launch_hire', 550, 550, 'FIXED'),
('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'sanitary_inspection', 670, 670, 'FIXED'),
('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'clearance', 200, 200, 'FIXED'),
('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'coordinator_board', 450, 150, 'FIXED'),
('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'agency_fee', 1100, 1100, 'FIXED'),
('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'transportation_communication', 400, 400, 'FIXED'),

-- MARCONA (Descarga - SPCC - MOQUEGUA) - Total $39,048
('SPCC', 'MARCONA', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'towage_1st', 36000, 18000, 'FIXED'),
('SPCC', 'MARCONA', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'lighthouse_dues', 248, 0.03, 'TRB'),
('SPCC', 'MARCONA', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'coordinator_board', 600, 200, 'FIXED'),
('SPCC', 'MARCONA', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'clearance', 200, 200, 'FIXED'),
('SPCC', 'MARCONA', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'agency_fee', 1400, 1400, 'FIXED'),
('SPCC', 'MARCONA', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'transportation_communication', 400, 400, 'FIXED'),

-- CALLAO (Descarga - SPCC - MOQUEGUA) - Total $15,144
('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'pilotage', 1680, 1680, 'FIXED'),
('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'towage_1st', 3200, 800, 'FIXED'),
('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'lighthouse_dues', 248, 248, 'FIXED'),
('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'dockage', 7146, 1.50, 'FIXED'),
('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'launch_hire', 1020, 80, 'FIXED'),
('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'coordinator_board', 450, 450, 'FIXED'),
('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'agency_fee', 1000, 1000, 'FIXED'),
('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'transportation_communication', 400, 400, 'FIXED'),

-- MEJILLONES - TERMINAL A (Descarga - SPCC - MOQUEGUA) - Total $50,333.5
('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'MOQUEGUA', 'pilotage', 1808.62, 1808.62, 'FIXED'),
('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'MOQUEGUA', 'towage_1st', 11200, 2800, 'FIXED'),
('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'MOQUEGUA', 'shifting_surcharges', 330, 330, 'FIXED'), -- Seguro práctico
('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'MOQUEGUA', 'linesmen', 1742.5, 1742.5, 'FIXED'),
('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'MOQUEGUA', 'lighthouse_dues', 3400, 3400, 'FIXED'),
('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'MOQUEGUA', 'dockage', 22810.03, 3.99, 'LOA'),
('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'MOQUEGUA', 'launch_hire', 1800, 1800, 'FIXED'),
('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'MOQUEGUA', 'clearance', 1140.35, 1140.35, 'FIXED'), -- ISPS Fee
('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'MOQUEGUA', 'sanitary_inspection', 148, 148, 'FIXED'), -- Inmigr + Salud
('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'MOQUEGUA', 'loading_master', 3264, 62, 'FIXED'),
('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'MOQUEGUA', 'agency_fee', 1200, 1200, 'FIXED'),

-- MEJILLONES - INTERACID (Descarga - SPCC - MOQUEGUA) - Total $45,855
('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'MOQUEGUA', 'pilotage', 1571, 1571, 'FIXED'),
('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'MOQUEGUA', 'towage_1st', 11200, 2800, 'FIXED'),
('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'MOQUEGUA', 'shifting_surcharges', 330, 330, 'FIXED'), -- Seguro práctico
('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'MOQUEGUA', 'linesmen', 1107, 1107, 'FIXED'),
('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'MOQUEGUA', 'lighthouse_dues', 3400, 3400, 'FIXED'),
('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'MOQUEGUA', 'dockage', 20000, 640, 'FIXED'),
('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'MOQUEGUA', 'launch_hire', 1800, 1800, 'FIXED'),
('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'MOQUEGUA', 'clearance', 917, 917, 'FIXED'), -- ISPS Fee
('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'MOQUEGUA', 'sanitary_inspection', 148, 148, 'FIXED'), -- Inmigr + Salud
('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'MOQUEGUA', 'loading_master', 2692, 2692, 'FIXED'),
('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'MOQUEGUA', 'agency_fee', 1200, 1200, 'FIXED'),

-- MEJILLONES - TERQUIM (Descarga - SPCC - MOQUEGUA) - Total $49,956.85
('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'MOQUEGUA', 'pilotage', 1991, 1991, 'FIXED'),
('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'MOQUEGUA', 'towage_1st', 8400, 2800, 'FIXED'),
('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'MOQUEGUA', 'shifting_surcharges', 330, 330, 'FIXED'), -- Seguro práctico
('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'MOQUEGUA', 'linesmen', 1602, 1602, 'FIXED'),
('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'MOQUEGUA', 'lighthouse_dues', 2500, 2500, 'FIXED'),
('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'MOQUEGUA', 'launch_hire', 2220, 2220, 'FIXED'),
('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'MOQUEGUA', 'dockage', 23021.85, 5.72, 'LOA'),
('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'MOQUEGUA', 'clearance', 1191, 1191, 'FIXED'), -- ISPS Fee
('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'MOQUEGUA', 'sanitary_inspection', 678, 678, 'FIXED'), -- Inmigr ($28) + Salud ($650)
('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'MOQUEGUA', 'loading_master', 2923, 2923, 'FIXED'),
('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'MOQUEGUA', 'agency_fee', 1200, 1200, 'FIXED'),

-- BARQUITO (Descarga - SPCC - MOQUEGUA) - Total $84,444
('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'pilotage', 1803, 1803, 'FIXED'),
('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'towage_1st', 38460, 38460, 'FIXED'),
('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'shifting_surcharges', 330, 330, 'FIXED'),
('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'linesmen', 2350, 2350, 'FIXED'),
('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'lighthouse_dues', 3500, 3500, 'FIXED'),
('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'dockage', 2000, 71.92, 'PORT_HOURS'),
('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'launch_hire', 7433, 7433, 'FIXED'),
('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'towage_2nd', 18000, 675, 'PORT_HOURS'), -- Standby tug
('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'sanitary_inspection', 158, 158, 'FIXED'), -- Inmigr ($28) + Salud ($130)
('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'loading_master', 2450, 2450, 'FIXED'),
('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'MOQUEGUA', 'agency_fee', 1200, 1200, 'FIXED');
