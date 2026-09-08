-- ==============================================================================
-- MOTOR DE AUDITORÍA FORENSE Y TRAZABILIDAD TRANSACCIONAL (POSTGRESQL + JSONB)
-- Sistema: DELFOS SHIPPING SOFTWARE / PETRAL SMART DASHBOARD
-- ==============================================================================

-- 1. Tabla Central de Bitácora de Auditoría (Audit Ledger)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(64) NOT NULL,
    record_id VARCHAR(64),
    action VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'EVENT'
    user_email VARCHAR(255) NOT NULL DEFAULT 'SYSTEM',
    ip_address VARCHAR(64),
    user_agent TEXT,
    old_data JSONB,
    new_data JSONB,
    diff_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 2. Función Trigger Genérica en PostgreSQL para Auditoría Automática con Cálculo de DIFF
CREATE OR REPLACE FUNCTION process_audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_user_email VARCHAR(255);
    old_json JSONB := NULL;
    new_json JSONB := NULL;
    diff_json JSONB := '{}'::jsonb;
    key_name TEXT;
BEGIN
    -- Extraer el usuario de la sesión de PostgreSQL si fue inyectado desde Python:
    -- SET LOCAL app.current_user_email = 'izavala@petral.com.pe';
    BEGIN
        current_user_email := current_setting('app.current_user_email', true);
    EXCEPTION WHEN OTHERS THEN
        current_user_email := NULL;
    END;

    IF current_user_email IS NULL OR current_user_email = '' THEN
        current_user_email := 'SYSTEM_DB';
    END IF;

    IF (TG_OP = 'INSERT') THEN
        new_json := to_jsonb(NEW);
        INSERT INTO audit_logs (table_name, record_id, action, user_email, new_data)
        VALUES (TG_TABLE_NAME, COALESCE(NEW.id::text, 'N/A'), 'INSERT', current_user_email, new_json);
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        old_json := to_jsonb(OLD);
        new_json := to_jsonb(NEW);

        -- Calcular delta / diferencias exactas entre viejo y nuevo
        FOR key_name IN SELECT jsonb_object_keys(new_json) LOOP
            IF (old_json -> key_name) IS DISTINCT FROM (new_json -> key_name) THEN
                diff_json := diff_json || jsonb_build_object(
                    key_name, jsonb_build_object('old', old_json -> key_name, 'new', new_json -> key_name)
                );
            END IF;
        END LOOP;

        INSERT INTO audit_logs (table_name, record_id, action, user_email, old_data, new_data, diff_data)
        VALUES (TG_TABLE_NAME, COALESCE(NEW.id::text, 'N/A'), 'UPDATE', current_user_email, old_json, new_json, diff_json);
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        old_json := to_jsonb(OLD);
        INSERT INTO audit_logs (table_name, record_id, action, user_email, old_data)
        VALUES (TG_TABLE_NAME, COALESCE(OLD.id::text, 'N/A'), 'DELETE', current_user_email, old_json);
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Ejemplo de Asociación de Triggers a Tablas Maestras Sensibles
-- DROP TRIGGER IF EXISTS trg_audit_app_users ON app_users;
-- CREATE TRIGGER trg_audit_app_users AFTER INSERT OR UPDATE OR DELETE ON app_users FOR EACH ROW EXECUTE FUNCTION process_audit_log_trigger();
