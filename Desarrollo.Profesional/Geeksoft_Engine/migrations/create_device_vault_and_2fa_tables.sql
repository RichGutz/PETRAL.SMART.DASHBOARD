-- ==============================================================================
-- MIGRACIÓN SQL: DEVICE VAULT & AUTENTICACIÓN 2FA MULTI-FACTOR
-- Sistema: DELFOS SHIPPING SOFTWARE (PETRAL)
-- ==============================================================================

-- 1. Tabla de Bóveda de Dispositivos Autorizados (Device Vault)
CREATE TABLE IF NOT EXISTS user_authorized_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL,
    device_fingerprint VARCHAR(128) NOT NULL,
    device_name VARCHAR(255),
    ip_address VARCHAR(64),
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'REVOKED'
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_access_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_email, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_user_authorized_devices_fp 
ON user_authorized_devices(user_email, device_fingerprint);

-- 2. Tabla de Códigos Transaccionales 2FA / OTP
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
