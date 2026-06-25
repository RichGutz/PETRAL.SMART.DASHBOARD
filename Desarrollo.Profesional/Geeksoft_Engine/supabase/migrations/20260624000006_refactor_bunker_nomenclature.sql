-- 1. Renombrar la tabla de precios
ALTER TABLE IF EXISTS public.ifo_mdo_prices RENAME TO bunker_prices;

-- 2. Actualizar las políticas de la tabla renombrada (PostgreSQL vincula políticas por OID pero es buena práctica recrearlas o asegurar su funcionamiento)
-- Renombrar las columnas de precios
ALTER TABLE IF EXISTS public.bunker_prices RENAME COLUMN ifo_price TO bunker_price_ifo;
ALTER TABLE IF EXISTS public.bunker_prices RENAME COLUMN mdo_price TO bunker_price_mdo;

-- 3. Renombrar las columnas de consumos en la tabla vessels
-- IFO
ALTER TABLE IF EXISTS public.vessels RENAME COLUMN consumption_sea_ifo TO bunker_consumption_sea_ifo;
ALTER TABLE IF EXISTS public.vessels RENAME COLUMN consumption_idle_ifo TO bunker_consumption_idle_ifo;
ALTER TABLE IF EXISTS public.vessels RENAME COLUMN consumption_load_ifo TO bunker_consumption_load_ifo;
ALTER TABLE IF EXISTS public.vessels RENAME COLUMN consumption_disch_ifo TO bunker_consumption_disch_ifo;
ALTER TABLE IF EXISTS public.vessels RENAME COLUMN max_capacity_ifo TO bunker_capacity_ifo;

-- MDO
ALTER TABLE IF EXISTS public.vessels RENAME COLUMN consumption_sea_mdo TO bunker_consumption_sea_mdo;
ALTER TABLE IF EXISTS public.vessels RENAME COLUMN consumption_idle_mdo TO bunker_consumption_idle_mdo;
ALTER TABLE IF EXISTS public.vessels RENAME COLUMN consumption_load_mdo TO bunker_consumption_load_mdo;
ALTER TABLE IF EXISTS public.vessels RENAME COLUMN consumption_disch_mdo TO bunker_consumption_disch_mdo;
ALTER TABLE IF EXISTS public.vessels RENAME COLUMN max_capacity_mdo TO bunker_capacity_mdo;
