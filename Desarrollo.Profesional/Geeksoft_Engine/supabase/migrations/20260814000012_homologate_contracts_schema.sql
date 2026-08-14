-- Migration: Homologate contracts table schema with routes_clients and routes_quotes
-- Date: 2026-08-14
-- Purpose: Allow contracts table to share the exact same top-level schema (name, description, legs_data, pais, created_at, created_by)
--          as routes_clients and routes_quotes, embedding all rich contract legs, port costs, validity, and metadata into legs_data JSONB.

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS legs_data JSONB;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS pais VARCHAR(10) DEFAULT 'PE';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT 'izavala@petral.com.pe';
