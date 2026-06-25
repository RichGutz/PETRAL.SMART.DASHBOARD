-- 1. Crear tabla de precios de combustible (Series de Tiempo)
CREATE TABLE IF NOT EXISTS public.ifo_mdo_prices (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    ifo_price NUMERIC NOT NULL,
    mdo_price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.ifo_mdo_prices ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura/escritura pública temporal para el prototipo
CREATE POLICY "Enable read access for all users" ON public.ifo_mdo_prices FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.ifo_mdo_prices FOR INSERT WITH CHECK (true);

-- Sembrar la cotización oficial histórica requerida para la conciliación
INSERT INTO public.ifo_mdo_prices (date, ifo_price, mdo_price) 
VALUES ('2023-01-01', 895.14, 1460.30);


-- 2. Alterar tabla vessels para agregar consumos Dual-Fuel
ALTER TABLE public.vessels 
ADD COLUMN IF NOT EXISTS consumption_sea_mdo NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS consumption_port_mdo NUMERIC DEFAULT 0.0;

-- 3. Inyectar datos específicos de MDO (Solo Moquegua consume en este escenario)
-- Por defecto todos quedan en 0.0 por el ALTER TABLE, así que solo actualizamos al Moquegua
UPDATE public.vessels 
SET consumption_sea_mdo = 0.0, 
    consumption_port_mdo = 1.0 
WHERE name = 'B/T MOQUEGUA';
