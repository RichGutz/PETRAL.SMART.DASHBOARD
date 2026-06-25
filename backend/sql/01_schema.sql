-- Esquema SQL Inicial: Petral Smart Dashboard (Estado 1 / Estado 2)

-- ==============================================================================
-- TABLA 1: VIAJES FACTURACIÓN
-- ==============================================================================
-- Guarda el nivel de detalle granular que hoy ingresan en el excel de "Facturación"
CREATE TABLE IF NOT EXISTS viajes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nave VARCHAR(50) NOT NULL, -- Ej: 'Moquegua', 'Tablones'
    numero_viaje INT,
    fecha_bl DATE,
    puerto_origen VARCHAR(100),
    puerto_destino VARCHAR(100),
    toneladas NUMERIC(15, 2),
    tarifa_flete NUMERIC(10, 2),
    flete_total NUMERIC(15, 2),
    horas_descarga NUMERIC(10, 2),
    ingreso_demora NUMERIC(15, 2) DEFAULT 0,
    ingreso_adicional NUMERIC(15, 2) DEFAULT 0, -- Reintegros, etc.
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_by VARCHAR(100) -- Autor (Ej: mcastro, jneyra, ETL_Migracion)
);

-- ==============================================================================
-- TABLA 2: CONTROL PRESUPUESTAL Y COSTOS
-- ==============================================================================
-- Guarda el nivel de detalle que hoy viene en "Resultado Naviera Petral" y "Margen de Operacion"
-- Diseñado como un esquema contable flexible
CREATE TABLE IF NOT EXISTS control_presupuestal (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nave VARCHAR(50) NOT NULL, -- Ej: 'Moquegua', 'Tablones', 'Consolidado'
    anio INT NOT NULL,
    mes INT NOT NULL,
    categoria VARCHAR(100) NOT NULL, -- Ej: 'COSTOS DIRECTOS', 'GASTOS DE PERSONAL'
    cuenta_contable VARCHAR(100) NOT NULL, -- Ej: 'COMBUSTIBLE', 'GASTOS DE PUERTO', 'SUELDOS'
    monto_real NUMERIC(15, 2) DEFAULT 0,
    monto_presupuestado NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_by VARCHAR(100) -- Autor (Ej: sgalvez, navitranso, ETL_Migracion)
);

-- ==============================================================================
-- ÍNDICES PARA REPORTERÍA (ESTADO 2 - STREAMLIT DASHBOARDS)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_viajes_nave_fecha ON viajes(nave, fecha_bl);
CREATE INDEX IF NOT EXISTS idx_control_presupuestal_nave_fecha ON control_presupuestal(nave, anio, mes);
