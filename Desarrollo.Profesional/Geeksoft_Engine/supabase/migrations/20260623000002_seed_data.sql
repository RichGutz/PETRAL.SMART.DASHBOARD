-- Seed Data para vessels
INSERT INTO vessels (vessel_id, vessel_name, flag, built, dwt, vessel_speed, vessel_max_load_intake_limit, vessel_pump_discharge_rate, consumption_sea_ifo, consumption_port_ifo, max_capacity_ifo, max_capacity_mdo, tce_required) VALUES
('TABLONES', 'TABLONES', 'PERUANA', 2003, 16500, 11.0, 500.0, 450.0, 14.5, 3.5, 500.0, 0.0, 15000.0),
('MOQUEGUA', 'MOQUEGUA', 'PERUANA', NULL, NULL, 12.0, 500.0, 400.0, 15.0, 4.0, 400.0, 80.0, 13000.0),
('CONCON_TRADER', 'CONCON TRADER', 'PANAMA', 2018, 19823, 11.0, 600.0, 500.0, 14.0, 3.5, 500.0, 0.0, 20000.0);

-- Seed Data para routes
INSERT INTO routes (origin_port_id, destination_port_id, route_distance, weather_factor, description) VALUES
('ILO', 'MATARANI', 69.0, 0.03, 'Tramo corto de cabotaje sur (Perú)'),
('ILO', 'MARCONA', 283.0, 0.03, 'Tramo intermedio de cabotaje (Perú)'),
('ILO', 'MEJILLONES', 335.0, 0.03, 'Tramo internacional de exportación (Chile)'),
('ILO', 'CALLAO', 430.0, 0.04, 'Tramo largo cabotaje centro');

-- Seed Data para agency_matrix
INSERT INTO agency_matrix (client_id, port_id, operation_type, cost) VALUES
('SPCC', 'ILO', 'CARGA', 23000.00),
('SPCC', 'MATARANI', 'DESCARGA', 18000.00),
('SPCC', 'MARCONA', 'DESCARGA', 44000.00),
('SPCC', 'MEJILLONES', 'DESCARGA', 32000.00),
('DEFAULT', 'ILO', 'CARGA', 25500.00),
('DEFAULT', 'MATARANI', 'DESCARGA', 21000.00);

-- Seed Data para contract_tariffs (SPCC)
INSERT INTO contract_tariffs (client_id, destination_port_id, min_tonnage, max_tonnage, freight_rate) VALUES
('SPCC', 'MATARANI', 10000.00, 11500.00, 20.12),
('SPCC', 'MATARANI', 11501.00, 13000.00, 19.52),
('SPCC', 'MATARANI', 13001.00, 13500.00, 19.01),
('SPCC', 'MATARANI', 13600.00, 14500.00, 18.92),
('SPCC', 'MARCONA', 10000.00, 11500.00, 25.87),
('SPCC', 'MARCONA', 11501.00, 13000.00, 23.12),
('SPCC', 'MARCONA', 13001.00, 13500.00, 22.82),
('SPCC', 'MARCONA', 13600.00, 14500.00, 21.77),
('SPCC', 'MEJILLONES', 10000.00, 11500.00, 23.23),
('SPCC', 'MEJILLONES', 11501.00, 13000.00, 21.87),
('SPCC', 'MEJILLONES', 13001.00, 13500.00, 20.87),
('SPCC', 'MEJILLONES', 13600.00, 14500.00, 19.92),
('SPCC', 'CALLAO', 3000.00, 5000.00, 47.13);
