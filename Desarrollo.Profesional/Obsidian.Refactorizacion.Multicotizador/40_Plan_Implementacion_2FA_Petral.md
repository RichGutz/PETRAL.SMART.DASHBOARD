# 40. Libreta Pericial de Benoit Blanc - Plan Maestro de Implementación de Autenticación 2FA en PETRAL (07.09.2026)

**Auditor a Cargo:** Detective Benoit Blanc (Auditor Pericial Implacable)  
**Caso Oficial:** "La Doble Llave de Oro - Blindaje Criptográfico y Acceso Multifactor (2FA/OTP) para Naviera Petral"  
**Fecha de Inicio:** 07 de Septiembre de 2026  
**Safe Point Previo:** `PRE.2FA.AUTH.PETRAL.7.9.26`  
**URL Producción en Vivo:** `https://forecast.geeksoft.tech`  
**Servidor VPS:** `91.108.125.253` (Nginx + FastAPI + Systemd + Certbot SSL)  

---

## 1. 🕵️ BEN (Declaración Pericial y Filosofía del Método)

> *"Damas y caballeros del tribunal técnico: observen con detenimiento. En una plataforma naviera de alta sensibilidad financiera como PETRAL SMART DASHBOARD, donde se orquestan matrices millonarias, cotizaciones Spot y liquidaciones de fletamento, una puerta de entrada protegida por una simple contraseña estática es una invitación abierta al riesgo.  
> Inspirados en las mejores prácticas corporativas y los estándares de seguridad implementados en el ecosistema APEFAC, iniciamos este peritaje para instaurar la **Autenticación en Dos Factores (2FA)**. No toleraremos cabos sueltos: cada token OTP de 6 dígitos, cada expiración temporal y cada transición visual en el login se ejecutará con precisión milimétrica, sin alterar el funcionamiento operativo del sistema."*

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
| 2   | Backend FastAPI            | `/auth/login` emite permisos y sesión de inmediato   | No existe estado intermedio 'PENDING_2FA'      |
| 3   | Persistencia Frontend      | `localStorage.setItem('petral_session')` directo     | No hay validación de token de segundo factor   |
| 4   | Esquema de Base de Datos   | Tabla `app_users` sin registro OTP ni secreto 2FA    | Falta de tabla para control de códigos y ttl   |
| 5   | Notificación / Despacho    | Inexistencia de motor de despacho (Email/WhatsApp)   | No se enviaban códigos de verificación         |
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
```

---

## 3. 🛡️ CLON (Respaldo y Puntos de Seguridad Inmutables)

Previo a cualquier cirugía de código, se establecen los siguientes puntos de salvaguarda inmutables:
1. **Branch y Tag en Git**:
   - `git checkout -b feature/2fa-auth-petral`
   - `git tag -a "PRE.2FA.AUTH.PETRAL.7.9.26" -m "Safe Point: Previo a implementacion 2FA en PETRAL"`
2. **Backups de Archivos Críticos**:
   - `Desarrollo.Profesional/Geeksoft_Engine/backend/api/routers/auth_LEGACY_PRE2FA.py`
   - `Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Auth/Login_LEGACY_PRE2FA.tsx`

---

## 4. 📐 DIFF (Cirugía Quirúrgica y Plan de Implementación)

### 4.1. Base de Datos & Backend (FastAPI + PostgreSQL)

1. **Tabla de Control 2FA (`user_2fa_tokens`)**:
   ```sql
   CREATE TABLE IF NOT EXISTS user_2fa_tokens (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
       token_temp VARCHAR(64) NOT NULL UNIQUE,
       otp_code VARCHAR(6) NOT NULL,
       attempts INT DEFAULT 0,
       is_used BOOLEAN DEFAULT FALSE,
       expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );
   CREATE INDEX IF NOT EXISTS idx_user_2fa_tokens_temp ON user_2fa_tokens(token_temp);
   ```

2. **Endpoints en [`auth.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/api/routers/auth.py)**:
   - `POST /auth/login`:
     - Valida `email` y `password` contra `app_users`.
     - Si es correcto, genera un `temp_token` (UUID) y un `otp_code` de 6 dígitos numéricos (ej. `382914`).
     - Despacha el código mediante el canal corporativo (Email SMTP / WhatsApp).
     - Retorna:
       ```json
       {
         "status": "REQUIRES_2FA",
         "temp_token": "a1b2c3d4-...",
         "masked_destination": "i***a@petral.com.pe"
       }
       ```
   - `POST /auth/verify-2fa`:
     - Recibe `{ "temp_token": "...", "otp_code": "382914" }`.
     - Verifica validez, intentos (< 3) y expiración (5 min).
     - Si es válido, marca `is_used = true` y retorna la sesión completa (`user` + `permissions`).
   - `POST /auth/resend-2fa`:
     - Genera un nuevo OTP respetando un tiempo de enfriamiento (cooldown) de 60 segundos.

---

### 4.2. Frontend & Experiencia Visual (React + TypeScript + Tailwind)

1. **Evolución del [`Login.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Auth/Login.tsx)**:
   - **Paso 1 (Credenciales)**: Entrada limpia con correo y contraseña.
   - **Paso 2 (Verificación OTP)**: Transición animada (Glassmorphism) con 6 inputs individuales interconectados (auto-focus al escribir/borrar), timer de 5 minutos, botón "Reenviar código" con cooldown visual y botón de "Regresar al Login".

2. **Adaptación de [`AuthContext.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/context/AuthContext.tsx) y [`api.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/services/api.ts)**:
   - Funciones `loginStepOne(email, password)` y `verify2FACode(tempToken, otpCode)`.
   - Protección contra inyección de sesión hasta que el código 2FA sea validado exitosamente por el servidor.

---

## 5. 🔬 QC (Quality Control & Protocolo de Verificación)

```
+-----+----------------------------------+------------------------------------------------+----------------------------------------+
| #   | ESCENARIO DE PRUEBA              | COMPORTAMIENTO ESPERADO                        | CRITERIO DE APROBACIÓN                 |
+-----+----------------------------------+------------------------------------------------+----------------------------------------+
| 1   | Credenciales Inválidas           | Rechazo en Paso 1 con mensaje claro de error   | No se emite código OTP                 |
| 2   | Credenciales Correctas           | Despacho instantáneo de OTP a destino          | Transición suave a vista de 6 dígitos  |
| 3   | Código OTP Válido                | Verificación aprobada y carga de permisos      | Redirección al `/dashboard`            |
| 4   | Código OTP Incorrecto            | Incremento de contador de intentos             | Mensaje de advertencia de error        |
| 5   | Expiración de Tiempo (5 min)     | Código marcado como expirado                   | Obliga a reenviar código               |
| 6   | Límite de 3 Intentos Fallidos    | Bloqueo del temp_token actual                  | Requiere reiniciar el login            |
| 7   | Reenvío con Cooldown (60s)       | Deshabilita botón de reenvío durante 60 seg     | Evita spam de envíos                   |
+-----+----------------------------------+------------------------------------------------+----------------------------------------+
```

---

## 6. 📝 NOTA (Registro Pericial de Ejecución Paso a Paso)

| Paso | Tarea Técnica | Estado | Auditor Responsable |
| :--- | :--- | :---: | :--- |
| **Paso 1** | Creación de tabla `user_2fa_tokens` y modelos Pydantic en backend | ⏳ Pendiente | Detective Benoit Blanc |
| **Paso 2** | Endpoints `/auth/login` (Step 1), `/auth/verify-2fa` y `/auth/resend-2fa` | ⏳ Pendiente | Detective Benoit Blanc |
| **Paso 3** | Integración del canal de despacho (Email Corporativo / Notificación) | ⏳ Pendiente | Detective Benoit Blanc |
| **Paso 4** | Desarrollo del componente visual 2FA interactivo en `Login.tsx` | ⏳ Pendiente | Detective Benoit Blanc |
| **Paso 5** | Conexión de `AuthContext.tsx` y `api.ts` con manejo de estados intermedios | ⏳ Pendiente | Detective Benoit Blanc |
| **Paso 6** | Auditoría QC con script terminal automatizado y pruebas e2e | ⏳ Pendiente | Detective Benoit Blanc |
| **Paso 7** | Despliegue seguro a VPS de Producción (`https://forecast.geeksoft.tech`) | ⏳ Pendiente | Detective Benoit Blanc |
