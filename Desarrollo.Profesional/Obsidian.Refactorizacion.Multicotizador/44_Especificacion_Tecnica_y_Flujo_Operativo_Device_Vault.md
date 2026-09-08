# 🛡️ 44 - Especificación Técnica y Flujo Operativo: Device Vault & 2FA Zero-Trust

> **Documento Maestro de Arquitectura y Operaciones de Seguridad**  
> **Sistema:** DELFOS / PETRAL SMART DASHBOARD  
> **Módulo:** Device Vault (Bóveda de Dispositivos Autorizados) & Autenticación OTP  
> **Rutas:** `/device-vault`, `/login`, `/auth/login-step1`, `/auth/verify-2fa`

---

## 1. 🎯 Propósito y Filosofía de Seguridad

El módulo **Device Vault** implementa una arquitectura de seguridad basada en **Zero-Trust (Confianza Cero)** vinculada al hardware físico del usuario. Su objetivo fundamental es:

1. **Inviolabilidad de Acceso Remoto:** Impedir que cualquier actor no autorizado acceda a los datos financieros y comerciales de PETRAL, incluso si conoce la contraseña o intercepta un código temporal.
2. **Control Estricto de Equipos Corporativos:** Solo computadoras previamente auditadas y autorizadas por el Administrador pueden iniciar una sesión de trabajo.
3. **Auditoría Forense de Dispositivos:** Registro inalterable de huella de hardware, dirección IP, fecha de aprobación y último acceso.

---

## 2. 🧬 Extracción de Huella Digital de Hardware (Device Fingerprint)

El frontend (`src/utils/deviceFingerprint.ts`) extrae silenciosamente una firma determinística basada en 5 capas de hardware y renderizado gráfico:

| Parámetro de Hardware | Origen / API del Navegador | Ejemplo Real Extraído |
|---|---|---|
| **GPU Renderer** | WebGL Extension (`UNMASKED_RENDERER_WEBGL`) | `ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0)` |
| **Cores de CPU** | `navigator.hardwareConcurrency` | `8 núcleos` |
| **Resolución & Profundidad** | `screen.width`, `screen.height`, `screen.colorDepth` | `1920x1080@24` |
| **Plataforma & Arquitectura** | `navigator.userAgentData.platform` / `navigator.userAgent` | `Windows NT 10.0; Win64; x64` |
| **Firma Criptográfica** | Hash doble de 16 caracteres hexadecimales | `DEV-4A19E8-3C2B10` |

---

## 3. 🔄 Matriz de Estados y Casuística de Flujo

```
               [ Intento de Login con Correo ]
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ¿Dispositivo Existe?    ¿Primer Login de Admin?
                    │                   │
         ┌──────────┴──────────┐        └── SÍ ➔ [ APPROVED (Bootstrap) ]
         ▼                     ▼
     [ EXISTE ]          [ NO EXISTE ]
         │                     │
         │                     └── Crea registro ➔ [ PENDING ] ➔ (Bloquea OTP)
         │                                              │
         ▼                                              ▼
   ¿Estado Actual?                              [ Admin aprueba en ]
   ├── PENDING  ➔ Bloquea OTP (Aviso en UI)     [   /device-vault  ]
   ├── REVOKED  ➔ Bloquea OTP (Acceso Denegado)         │
   └── APPROVED ➔ Despacha OTP (5 min) ➔ Acceso OK <────┘
```

### Casos de Negocio:

### Caso A: Primer Dispositivo de Administrador (Bootstrap)
* **Regla:** Si un usuario con rol `ADMIN` ingresa por primera vez y la tabla `user_authorized_devices` no tiene ningún equipo aprobado para su correo, el backend lo auto-aprueba bajo la etiqueta `ADMIN_BOOTSTRAP`.
* **Razón:** Evita el problema del "huevo y la gallina", permitiendo que el Administrador ingrese a configurar la plataforma.

### Caso B: Dispositivo Nuevo de Operador / Visor
* **Regla:** Se registra en la base de datos con estado **`PENDING`**.
* **Comportamiento en UI:** El frontend muestra el mensaje:  
  `"Dispositivo nuevo detectado (DEV-XXXX-XXXX). Pendiente de autorización por el Administrador."`
* **Acción Requerida:** El Administrador debe ingresar a `/device-vault` y pulsar **`✔ Autorizar`**.

### Caso C: Dispositivo Autorizado (`APPROVED`)
* **Regla:** El backend actualiza `last_access_at` y `ip_address`, genera un token temporal de 5 minutos y despacha el código OTP de 6 dígitos por correo.
* **Comportamiento en UI:** Despliega los 6 casilleros interactivos para ingresar el código 2FA.

### Caso D: Dispositivo Revocado (`REVOKED`)
* **Regla:** El Administrador presiona **`⛔ Revocar`** ante pérdida, robo o desvinculación laboral.
* **Comportamiento en UI:** El usuario no puede recibir códigos OTP ni ingresar al sistema desde esa máquina física.

---

## 4. 🗄️ Esquema de Base de Datos (`user_authorized_devices`)

```sql
CREATE TABLE IF NOT EXISTS user_authorized_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL,
    device_fingerprint VARCHAR(100) NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REVOKED')),
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_access_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_user_device UNIQUE (user_email, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_user_authorized_devices_fp 
ON user_authorized_devices(user_email, device_fingerprint);
```

---

## 5. 🛠️ Protocolo de Soporte y Resolución de Incidentes

| Escenario | Causa Técnica | Solución Operativa |
|---|---|---|
| **Usuario dice que no le llega el código OTP** | Su equipo está en estado `PENDING` en Device Vault. | El Admin debe ingresar a `/device-vault`, buscar el correo del usuario y presionar **Autorizar**. |
| **Usuario cambió de laptop o monitor** | El fingerprint cambió (nueva resolución o GPU). | El sistema registra automáticamente el nuevo equipo como `PENDING`; el Admin lo autoriza. |
| **Colaborador desvinculado** | Retiro de accesos inmediatos. | Ingresar a `/device-vault` y presionar **Revocar** sobre todos sus equipos registrados. |
| **Admin bloqueado accidentalmente** | Todos los equipos revocados. | Ejecutar script pericial backend `python Push.VPS/check_audit_db.py` o actualizar directamente en DB. |

---

*Documento sellado y versionado en Git para el repositorio de PETRAL SMART DASHBOARD.*
