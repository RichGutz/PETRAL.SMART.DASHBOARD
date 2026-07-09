-- Migración: Creación de tablas de usuarios, roles y permisos
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Permisos por Módulo (para usuarios de tipo USER)
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE PRIMARY KEY,
    multicotizador_spot VARCHAR(20) DEFAULT 'Visor' CHECK (multicotizador_spot IN ('Editor', 'Visor', 'Nulo')),
    matriz_financiera VARCHAR(20) DEFAULT 'Visor' CHECK (matriz_financiera IN ('Editor', 'Visor', 'Nulo')),
    maestro_buques VARCHAR(20) DEFAULT 'Visor' CHECK (maestro_buques IN ('Editor', 'Visor', 'Nulo')),
    maestro_rutas VARCHAR(20) DEFAULT 'Visor' CHECK (maestro_rutas IN ('Editor', 'Visor', 'Nulo')),
    maestro_puertos VARCHAR(20) DEFAULT 'Visor' CHECK (maestro_puertos IN ('Editor', 'Visor', 'Nulo')),
    maestro_contratos VARCHAR(20) DEFAULT 'Visor' CHECK (maestro_contratos IN ('Editor', 'Visor', 'Nulo')),
    maestro_tarifas VARCHAR(20) DEFAULT 'Visor' CHECK (maestro_tarifas IN ('Editor', 'Visor', 'Nulo')),
    maestro_costos_agencia VARCHAR(20) DEFAULT 'Visor' CHECK (maestro_costos_agencia IN ('Editor', 'Visor', 'Nulo'))
);

-- 3. Inserción de usuarios semilla con contraseña por defecto 'petral2026' encriptada
INSERT INTO app_users (email, password_hash, full_name, role) VALUES
('izavala@petral.com.pe', crypt('petral2026', gen_salt('bf')), 'Iosef Zavala', 'ADMIN'),
('fharten@petral.com.pe', crypt('petral2026', gen_salt('bf')), 'Fernando Harten', 'USER'),
('jneyra@petral.com.pe', crypt('petral2026', gen_salt('bf')), 'Jorge Neyra', 'USER'),
('mcastro@petral.com.pe', crypt('petral2026', gen_salt('bf')), 'Maria Elena Castro', 'USER'),
('sgalvez@petral.com.pe', crypt('petral2026', gen_salt('bf')), 'Sandra Galvez', 'USER'),
('prueda@petral.com.pe', crypt('petral2026', gen_salt('bf')), 'Patricio Rueda', 'USER')
ON CONFLICT (email) DO NOTHING;

-- 4. Asignación de permisos por defecto para Fernando Harten (Sponsor / Visor)
INSERT INTO user_permissions (user_id, multicotizador_spot, matriz_financiera, maestro_buques, maestro_rutas, maestro_puertos, maestro_contratos, maestro_tarifas, maestro_costos_agencia)
SELECT id, 'Visor', 'Visor', 'Visor', 'Visor', 'Visor', 'Visor', 'Visor', 'Visor' 
FROM app_users 
WHERE email = 'fharten@petral.com.pe'
ON CONFLICT (user_id) DO NOTHING;

-- 5. Asignación de permisos por defecto para usuarios Editores
INSERT INTO user_permissions (user_id, multicotizador_spot, matriz_financiera, maestro_buques, maestro_rutas, maestro_puertos, maestro_contratos, maestro_tarifas, maestro_costos_agencia)
SELECT id, 'Editor', 'Editor', 'Editor', 'Editor', 'Editor', 'Editor', 'Editor', 'Editor' 
FROM app_users 
WHERE email IN ('jneyra@petral.com.pe', 'mcastro@petral.com.pe', 'sgalvez@petral.com.pe', 'prueda@petral.com.pe')
ON CONFLICT (user_id) DO NOTHING;
