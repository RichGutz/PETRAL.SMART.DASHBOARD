-- 1. Tabla: vessels (Maestro Flota)
CREATE TABLE vessels (
    vessel_id VARCHAR PRIMARY KEY,
    vessel_name VARCHAR NOT NULL,
    flag VARCHAR,
    built INTEGER,
    dwt NUMERIC,
    vessel_speed NUMERIC NOT NULL,
    vessel_max_load_intake_limit NUMERIC NOT NULL,
    vessel_pump_discharge_rate NUMERIC NOT NULL,
    consumption_sea_ifo NUMERIC NOT NULL,
    consumption_port_ifo NUMERIC NOT NULL,
    max_capacity_ifo NUMERIC NOT NULL,
    max_capacity_mdo NUMERIC NOT NULL,
    tce_required NUMERIC NOT NULL
);

-- 2. Tabla: routes (Maestro Rutas)
CREATE TABLE routes (
    origin_port_id VARCHAR,
    destination_port_id VARCHAR,
    route_distance NUMERIC NOT NULL,
    weather_factor NUMERIC NOT NULL,
    description VARCHAR,
    PRIMARY KEY (origin_port_id, destination_port_id)
);

-- 3. Tabla: agency_matrix (Matriz Aduanas por Volumen)
CREATE TABLE agency_matrix (
    client_id VARCHAR,
    port_id VARCHAR,
    operation_type VARCHAR, -- 'CARGA' or 'DESCARGA'
    cost NUMERIC NOT NULL,
    PRIMARY KEY (client_id, port_id, operation_type)
);

-- 4. Tabla: contract_tariffs (Matriz Comercial de Fletes)
CREATE TABLE contract_tariffs (
    client_id VARCHAR,
    destination_port_id VARCHAR,
    min_tonnage NUMERIC,
    max_tonnage NUMERIC,
    freight_rate NUMERIC NOT NULL,
    PRIMARY KEY (client_id, destination_port_id, min_tonnage, max_tonnage)
);

-- 5. Tabla Transaccional: vessel_trips (Simulador / Viajes)
CREATE TABLE vessel_trips (
    trip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id VARCHAR NOT NULL,
    origin_port_id VARCHAR NOT NULL,
    destination_port_id VARCHAR NOT NULL,
    client_id VARCHAR NOT NULL,
    quantity NUMERIC NOT NULL,
    contract_agreed_load_rate NUMERIC,
    contract_agreed_discharge_rate NUMERIC,
    bunker_price_ifo_actual NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (vessel_id) REFERENCES vessels(vessel_id),
    FOREIGN KEY (origin_port_id, destination_port_id) REFERENCES routes(origin_port_id, destination_port_id)
);
