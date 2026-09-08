"""
Script de Aplicación de Migraciones SQL
DELFOS SHIPPING SOFTWARE
Aplica tablas user_authorized_devices, user_2fa_tokens y audit_logs
"""
import sys
from pathlib import Path

# Configurar encoding UTF-8 para consola Windows
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Añadir raíz a sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.database import get_db_connection

def apply_all_migrations():
    print("Conectando a la Base de Datos para aplicar migraciones...")
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # 1. Migración Device Vault y 2FA Tokens
        print("\n[1. Aplicando migración Device Vault y 2FA Tokens]")
        cur.execute("""
        CREATE TABLE IF NOT EXISTS user_authorized_devices (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_email VARCHAR(255) NOT NULL,
            device_fingerprint VARCHAR(128) NOT NULL,
            device_name VARCHAR(255),
            ip_address VARCHAR(64),
            status VARCHAR(20) DEFAULT 'PENDING',
            approved_by VARCHAR(255),
            approved_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_access_at TIMESTAMP WITH TIME ZONE,
            UNIQUE(user_email, device_fingerprint)
        );

        CREATE INDEX IF NOT EXISTS idx_user_authorized_devices_fp 
        ON user_authorized_devices(user_email, device_fingerprint);

        CREATE TABLE IF NOT EXISTS user_2fa_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
            temp_token VARCHAR(64) NOT NULL UNIQUE,
            otp_code VARCHAR(6) NOT NULL,
            attempts INT DEFAULT 0,
            is_used BOOLEAN DEFAULT FALSE,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_user_2fa_tokens_temp 
        ON user_2fa_tokens(temp_token);
        """)
        conn.commit()
        print("  >> Tablas 'user_authorized_devices' y 'user_2fa_tokens' creadas/verificadas con éxito ✓")

        # 2. Migración Motor de Auditoría
        print("\n[2. Aplicando migración Motor de Auditoría (Audit Logs)]")
        cur.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id BIGSERIAL PRIMARY KEY,
            table_name VARCHAR(64) NOT NULL,
            record_id VARCHAR(64),
            action VARCHAR(10) NOT NULL,
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
        """)
        conn.commit()
        print("  >> Tabla 'audit_logs' creada/verificada con éxito ✓")

        print("\n" + "=" * 55)
        print("  [OK] TODAS LAS MIGRACIONES FUERON APLICADAS EXITOSAMENTE")
        print("=" * 55)

    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Fallo aplicando migraciones: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    apply_all_migrations()
