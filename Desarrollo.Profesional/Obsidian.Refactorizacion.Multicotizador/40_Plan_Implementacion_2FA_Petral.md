# 40. Libreta Pericial de Benoit Blanc - Plan Maestro de Implementación de Seguridad Integral: Device Vault & Autenticación 2FA en DELFOS (07.09.2026)

**Auditor a Cargo:** Detective Benoit Blanc (Auditor Pericial Implacable)  
**Caso Oficial:** "La Doble Llave y la Bóveda de Dispositivos - Blindaje Criptográfico de Hardware & MFA para DELFOS SHIPPING SOFTWARE"  
**Fecha de Inicio:** 07 de Septiembre de 2026  
**Safe Point Previo:** `PRE.2FA.AUTH.PETRAL.7.9.26`  
**URL Producción en Vivo:** `https://forecast.geeksoft.tech`  
**Servidor VPS:** `91.108.125.253` (Nginx + FastAPI + Systemd + Certbot SSL)  

---

## 1. 🕵️ BEN (Declaración Pericial y Filosofía del Método)

> *"Damas y caballeros del tribunal técnico: observen con detenimiento. En una plataforma naviera y comercial de alta sensibilidad financiera como **DELFOS SHIPPING SOFTWARE**, donde se orquestan matrices millonarias, cotizaciones Spot y liquidaciones de fletamento, una puerta de entrada protegida por una simple contraseña estática es una invitación abierta al riesgo.  
> Trasladando la arquitectura de seguridad probada en el ecosistema **APEFAC** (`ARQUITECTURA_PRESENTACION_ENCRIPTADA_2FA_DRM.md`), instauramos una defensa en profundidad de dos murallas inexpugnables:  
> 1. **Device Vault (Bóveda de Dispositivos Autorizados)**: Detección determinística de huella de hardware (GPU/WebGL, Cores CPU, Screen, OS). Solo los equipos autorizados por el Administrador por única vez tienen permiso de operar.  
> 2. **Autenticación en Dos Factores (2FA)**: Despacho de tokens transaccionales OTP de 6 dígitos con plantilla HTML de alta fidelidad emitida desde `petra@geeksoft.tech` con marca oficial **DELFOS**."*

---

## 2. 🔎 LEG (Legacy - La Escena del Crimen Previa)

### Archivos Auditados en el Estado Actual:
1. **Frontend UI:** [`Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Auth/Login.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Auth/Login.tsx)
2. **Contexto de Sesión:** [`Desarrollo.Profesional/Geeksoft_Frontend/src/context/AuthContext.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/context/AuthContext.tsx)
3. **Servicio API Frontend:** [`Desarrollo.Profesional/Geeksoft_Frontend/src/services/api.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/services/api.ts)
4. **Router de Autenticación Backend:** [`Desarrollo.Profesional/Geeksoft_Engine/backend/api/routers/auth.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/api/routers/auth.py)

### Cuadro Forense de Patologías y Vulnerabilidades Detectadas (LEGACY):
```
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
| #   | LUGAR DEL CRIMEN           | EVIDENCIA EXTRAÍDA DE LA ESCENA (LEGACY)             | RIESGO & CAUSA TÉCNICA RAÍZ                    |
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
| 1   | Flujo de Login             | Validación de credenciales en un solo paso           | Si se vulnera la contraseña, acceso total      |
| 2   | Control de Equipos         | Cualquier máquina con credenciales puede entrar      | Inexistencia de Device Vault / Whitelist       |
| 3   | Backend FastAPI            | `/auth/login` emite permisos y sesión de inmediato   | No existe estado intermedio 'PENDING_2FA'      |
| 4   | Persistencia Frontend      | `localStorage.setItem('petral_session')` directo     | No hay validación de token de segundo factor   |
| 5   | Esquema de Base de Datos   | Tabla `app_users` sin registro de equipos ni OTP     | Falta de tablas de bóveda y tokens temporales  |
| 6   | Notificación / Despacho    | Inexistencia de motor de despacho transaccional      | No se enviaban códigos de verificación         |
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
```

---

## 3. 🛡️ CLON (Respaldo y Puntos de Seguridad Inmutables)

Previo a cualquier cirugía de código, se establecen los siguientes puntos de salvaguarda inmutables:
1. **Branch y Tag en Git**:
   - `git checkout -b feature/device-vault-2fa-delfos`
   - `git tag -a "PRE.2FA.AUTH.PETRAL.7.9.26" -m "Safe Point: Previo a implementacion Device Vault y 2FA"`
2. **Backups de Archivos Críticos**:
   - `Desarrollo.Profesional/Geeksoft_Engine/backend/api/routers/auth_LEGACY_PRE2FA.py`
   - `Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Auth/Login_LEGACY_PRE2FA.tsx`

---

## 4. 📐 DIFF (Cirugía Quirúrgica y Arquitectura Preparada)

### 4.1. Base de Datos & Migración SQL
📁 **Archivo:** [`Desarrollo.Profesional/Geeksoft_Engine/migrations/create_device_vault_and_2fa_tables.sql`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/migrations/create_device_vault_and_2fa_tables.sql)

```sql
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
```

---

### 4.2. Servicios Backend Preparados
1. **Servicio Device Vault:**  
   📁 [`Desarrollo.Profesional/Geeksoft_Engine/backend/services/device_vault_service.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/services/device_vault_service.py)  
   * `verify_or_register_device(user_email, device_fingerprint, device_name, ip_address)`: Valida si el equipo está `APPROVED`. Si es nuevo, lo registra en `PENDING`.
   * `approve_device(device_id, admin_email)`: Autoriza el equipo de por vida para ese usuario.
   * `revoke_device(device_id, admin_email)`: Revoca el acceso de inmediato.
   * `list_devices(user_email)`: Lista dispositivos para la grilla de administración.

2. **Generador de Plantilla HTML Oficial 2FA:**  
   📁 [`Desarrollo.Profesional/Geeksoft_Engine/backend/services/email_template_2fa.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/services/email_template_2fa.py)  
   * Marca: **DELFOS SHIPPING SOFTWARE**.
   * Logo Oficial: `https://forecast.geeksoft.tech/LOGO.DELFOS.NUEVO.BLANCO.3.horizontal.jpg`.
   * Formato OTP: `5  7  5  0  7  5` con tiempo de validez de 5 minutos y aviso de seguridad.

3. **Módulo de Despacho de Correo Transaccional (Resend API):**  
   📁 [`Desarrollo.Profesional/Geeksoft_Engine/backend/services/send_demo_email.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/services/send_demo_email.py)  
   * Remitente Oficial: `DELFOS Security <petra@geeksoft.tech>`.
   * Validado en vivo con entrega 200 OK a `rich@kaizencapital.pe`.

---

### 4.3. Módulo Frontend Preparado
1. **Generador de Huella Digital de Hardware:**  
   📁 [`Desarrollo.Profesional/Geeksoft_Frontend/src/utils/deviceFingerprint.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/utils/deviceFingerprint.ts)  
   * Extrae señales de GPU (WebGL renderer), CPU cores, resolución de pantalla, User-Agent y plataforma para conformar el identificador `DEV-XXXX-XXXX`.

---

## 5. 🔬 QC (Quality Control & Evidencia en Terminal)

📁 **Script de Auditoría Headless:** [`Desarrollo.Profesional/Geeksoft_Engine/test_qc_device_vault_2fa.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/test_qc_device_vault_2fa.py)

```bash
=================================================================
  QC AUDIT: SIMULACIÓN DE FLUJO COMPLETO DEVICE VAULT & 2FA
=================================================================

[1. Extracción de Huella en Navegador]
  >> Usuario: rich@kaizencapital.pe
  >> Device Fingerprint: DEV-8F4A12B0-C7E901D4
  >> Device Name: PC Windows (Chrome) - 1920x1080

[2. Consulta a Bóveda Device Vault (Intento 1)]
  >> Estado en BD: PENDING
  >> ¿Acceso Permitido?: False
  >> Acción UI: Bloqueo en pantalla + 'Solicitud enviada al Administrador'

[3. Acción de Administrador]
  >> Admin: izavala@petral.com.pe
  >> Operación: approve_device(DEV-8F4A12B0-C7E901D4)
  >> Nuevo Estado en BD: APPROVED ✓

[4. Consulta a Bóveda Device Vault (Intento 2 - Post Aprobación)]
  >> Estado en BD: APPROVED
  >> ¿Acceso Permitido?: True ✓ (Autorizado de por vida)

[5. Validación de Plantilla y Despacho 2FA]
  >> HTML generado: 5263 caracteres
  >> Marca Oficial: DELFOS SHIPPING SOFTWARE ✓
  >> Logo Verificado: LOGO.DELFOS.NUEVO.BLANCO.3.horizontal.jpg ✓
  >> Código OTP formateado: 5  7  5  0  7  5 ✓

=================================================================
  [EXITO] TODOS LOS TESTS DE DEVICE VAULT Y 2FA PASARON (100% OK)
=================================================================
```

---

## 6. 📝 NOTA (Inventario de Rutas y Estado de Módulos)

| Componente | Ruta Exacta de Archivo | Estado |
| :--- | :--- | :---: |
| **Migración SQL** | [`create_device_vault_and_2fa_tables.sql`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/migrations/create_device_vault_and_2fa_tables.sql) | ✅ Listo |
| **Servicio Backend Device Vault** | [`device_vault_service.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/services/device_vault_service.py) | ✅ Listo |
| **Plantilla Correo 2FA DELFOS** | [`email_template_2fa.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/services/email_template_2fa.py) | ✅ Listo |
| **Despacho Transaccional Resend** | [`send_demo_email.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/services/send_demo_email.py) | ✅ Listo |
| **Fingerprint Hardware Frontend** | [`deviceFingerprint.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/utils/deviceFingerprint.ts) | ✅ Listo |
| **Script Auditoría QC Headless** | [`test_qc_device_vault_2fa.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/test_qc_device_vault_2fa.py) | ✅ 100% OK |
| **Despliegue a Producción (VPS)** | Servidor `https://forecast.geeksoft.tech` | 🛑 Congelado |
