from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
import random
import uuid
import time
import threading
from datetime import datetime, timedelta, timezone
from backend.database import get_db_connection
from backend.services.send_demo_email import send_2fa_email
from backend.services.device_vault_service import DeviceVaultService
from backend.services.audit_service import AuditService

router = APIRouter(tags=["auth"])

# --- Rate Limiting In-Memory Cache para Brute-Force Protection ---
FAILED_LOGIN_LIMIT = 5
FAILED_LOGIN_WINDOW_SECONDS = 300  # 5 minutos
_failed_logins_lock = threading.Lock()
_failed_logins_cache: Dict[str, List[float]] = {}

# --- Modelos de Pydantic ---
class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None
    device_fingerprint: Optional[str] = None
    device_name: Optional[str] = None

class LoginStep1Response(BaseModel):
    status: str # "REQUIRES_2FA"
    temp_token: str
    masked_destination: str
    user_name: str

class Verify2FARequest(BaseModel):
    temp_token: str
    otp_code: str

class Resend2FARequest(BaseModel):
    temp_token: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str

class LoginResponse(BaseModel):
    user: UserResponse
    permissions: Dict[str, str]

class UserWithPermissionsResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    permissions: Dict[str, str]

class UserCreateRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    permissions: Dict[str, str]

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    permissions: Optional[Dict[str, str]] = None

class ChangePasswordRequest(BaseModel):
    email: str
    current_password: str
    new_password: str

class AdminResetPasswordRequest(BaseModel):
    new_password: str
    admin_email: Optional[str] = None



# --- Helpers de Permisos ---
ALL_MODULE_KEYS = [
    # Herramientas
    "multicotizador_spot",
    "matriz_financiera",
    "analisis_grafico",
    "spaghetti_map",
    "analisis_liquidaciones",
    # Maestros Físicos
    "maestro_buques",
    "maestro_puertos",
    "maestro_rutas",
    # Maestros Comerciales
    "maestro_tarifas",
    "maestro_contratos",
    "maestro_cotizaciones",
    "maestro_presupuestos",
    "maestro_matrices",
    # Maestros de Costos
    "maestro_tarifas_portuarias",
    "maestro_costos_agencia",
    "maestro_demoras",
    # Mercado & Originación
    "maestro_bunker",
    "maestro_originacion"
]

DEFAULT_PERMISSIONS = {k: "Visor" for k in ALL_MODULE_KEYS}
ADMIN_PERMISSIONS = {k: "Editor" for k in ALL_MODULE_KEYS}

def fetch_user_permissions(cur, user_id: str, role: str) -> dict:
    if role == "ADMIN":
        return dict(ADMIN_PERMISSIONS)
    cur.execute("SELECT * FROM user_permissions WHERE user_id = %s;", (user_id,))
    row = cur.fetchone()
    if not row:
        return dict(DEFAULT_PERMISSIONS)
    if isinstance(row, dict):
        row_dict = row
    else:
        col_names = [d[0] for d in cur.description]
        row_dict = dict(zip(col_names, row))
    return {k: row_dict.get(k) or "Visor" for k in ALL_MODULE_KEYS}

def upsert_user_permissions(cur, user_id: str, perms: dict):
    cols = ["user_id"] + ALL_MODULE_KEYS
    vals = [user_id] + [perms.get(k, "Visor") for k in ALL_MODULE_KEYS]
    placeholders = ", ".join(["%s"] * len(cols))
    set_clauses = ", ".join([f'"{k}" = EXCLUDED."{k}"' for k in ALL_MODULE_KEYS])
    cols_str = ", ".join([f'"{c}"' for c in cols])
    sql = f"""
        INSERT INTO user_permissions ({cols_str})
        VALUES ({placeholders})
        ON CONFLICT (user_id) DO UPDATE SET {set_clauses};
    """
    cur.execute(sql, tuple(vals))

def mask_email(email: str) -> str:
    parts = email.split("@")
    if len(parts) != 2:
        return email
    user, domain = parts
    if len(user) <= 2:
        masked_user = user[0] + "*"
    else:
        masked_user = user[0] + "*" * (len(user) - 2) + user[-1]
    return f"{masked_user}@{domain}"


# --- Endpoints de Autenticación 2FA & Device Vault ---

@router.post("/auth/login", response_model=LoginStep1Response)
def login_step_one(payload: LoginRequest):
    """
    Paso 1 del Login Passwordless: Valida que el email exista, genera OTP de 6 dígitos,
    lo despacha vía correo y retorna un temp_token para completar la verificación.
    """
    email_clean = payload.email.strip().lower()
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # 1. Validar existencia del usuario registrado en el sistema
        cur.execute(
            """
            SELECT id, email, full_name, role 
            FROM app_users 
            WHERE LOWER(email) = %s;
            """,
            (email_clean,)
        )
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"El correo '{payload.email}' no se encuentra registrado en PETRAL ONE."
            )
            
        user_id, email, full_name, role = row

        # 2. Validar Bóveda de Dispositivos (Device Vault)
        device_fp = payload.device_fingerprint or "DEV-UNKNOWN"
        device_nm = payload.device_name or "Dispositivo Web Desconocido"
        
        device_check = DeviceVaultService.verify_or_register_device(
            user_email=email,
            device_fingerprint=device_fp,
            device_name=device_nm,
            user_role=role
        )

        if not device_check.get("is_authorized", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Dispositivo no autorizado. Su equipo ({device_nm}) ha sido registrado como PENDIENTE en el Device Vault y requiere aprobación del Administrador para ingresar."
            )

        # 3. Generar código OTP de 6 dígitos y token temporal
        otp_code = f"{random.randint(100000, 999999)}"
        temp_token = str(uuid.uuid4())
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        # 4. Guardar en tabla user_2fa_tokens con attempts=0 e is_used=FALSE explícitos
        cur.execute(
            """
            INSERT INTO user_2fa_tokens (user_id, temp_token, otp_code, attempts, is_used, expires_at)
            VALUES (%s, %s, %s, 0, FALSE, %s);
            """,
            (user_id, temp_token, otp_code, expires_at)
        )
        conn.commit()

        # 5. Despachar correo transaccional desde petral@geeksoft.tech con plantilla oficial DELFOS
        try:
            send_2fa_email(to_email=email, user_name=full_name, otp_code=otp_code)
        except Exception as e:
            print(f"[AUTH 2FA WARN] Error enviando correo: {e}")

        return {
            "status": "REQUIRES_2FA",
            "temp_token": temp_token,
            "masked_destination": mask_email(email),
            "user_name": full_name
        }
    finally:
        cur.close()
        conn.close()


@router.post("/auth/login-password", response_model=LoginResponse)
def login_with_password(payload: LoginRequest, request: Request):
    """
    Inicio de sesión directo con correo y contraseña (Vía 1 de Opción 3).
    Verifica credenciales mediante pgcrypto crypt, valida Device Vault, aplica Rate Limiting
    y emite sesión completa.
    """
    email_clean = payload.email.strip().lower()
    password = (payload.password or "").strip()
    
    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe ingresar su contraseña para acceder."
        )
    
    # 1. Control de Fuerza Bruta (Rate Limiting: 5 intentos / 5 minutos por IP y Cuenta)
    forwarded = request.headers.get("x-forwarded-for")
    client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    rate_key = f"{client_ip}:{email_clean}"
    now = time.time()

    with _failed_logins_lock:
        history = [t for t in _failed_logins_cache.get(rate_key, []) if now - t < FAILED_LOGIN_WINDOW_SECONDS]
        _failed_logins_cache[rate_key] = history
        if len(history) >= FAILED_LOGIN_LIMIT:
            remaining_wait = int(FAILED_LOGIN_WINDOW_SECONDS - (now - history[0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Demasiados intentos fallidos ({len(history)}/{FAILED_LOGIN_LIMIT}). Acceso bloqueado temporalmente por 5 minutos por seguridad. Reintente en {max(1, remaining_wait)}s o ingrese con 2FA."
            )
    
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT id, email, full_name, role, password_hash,
                   (crypt(%s, password_hash) = password_hash) AS is_valid_pwd
            FROM app_users
            WHERE LOWER(email) = %s;
            """,
            (password, email_clean)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"El correo '{payload.email}' no se encuentra registrado en PETRAL ONE."
            )
        
        user_id, email, full_name, role, password_hash, is_valid_pwd = row
        
        if not is_valid_pwd:
            with _failed_logins_lock:
                history = _failed_logins_cache.get(rate_key, [])
                history.append(now)
                _failed_logins_cache[rate_key] = history
                attempts_left = max(0, FAILED_LOGIN_LIMIT - len(history))
            
            try:
                AuditService.log_event(
                    user_email=email_clean,
                    action="LOGIN_PASSWORD_FAILED",
                    entity_name="Intento Fallido de Contraseña",
                    entity_id=f"FAIL-{email_clean}",
                    metadata={"ip": client_ip, "failed_attempts": len(history), "attempts_left": attempts_left}
                )
            except Exception:
                pass
            
            error_msg = f"Contraseña incorrecta. Le quedan {attempts_left} intento(s) antes del bloqueo temporal." if attempts_left > 0 else "Contraseña incorrecta. Límite de 5 intentos alcanzado; acceso bloqueado temporalmente por 5 minutos."
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_msg
            )
        
        # Limpiar historial de intentos fallidos al ingresar exitosamente
        with _failed_logins_lock:
            _failed_logins_cache.pop(rate_key, None)
        
        # Validar Bóveda de Dispositivos (Device Vault)
        device_fp = payload.device_fingerprint or "DEV-UNKNOWN"
        device_nm = payload.device_name or "Dispositivo Web Desconocido"
        
        device_check = DeviceVaultService.verify_or_register_device(
            user_email=email,
            device_fingerprint=device_fp,
            device_name=device_nm,
            user_role=role
        )

        if not device_check.get("is_authorized", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Dispositivo no autorizado. Su equipo ({device_nm}) ha sido registrado como PENDIENTE en el Device Vault y requiere aprobación del Administrador para ingresar."
            )
        
        # Cargar permisos
        permissions = fetch_user_permissions(cur, user_id, role)
        
        try:
            AuditService.log_event(
                user_email=email,
                action="LOGIN_PASSWORD",
                entity_name="Autenticación con Contraseña",
                entity_id=f"PWD-{email}",
                metadata={"user_name": full_name, "role": role, "device": device_nm}
            )
        except Exception as ae:
            print(f"[AUDIT LOG WARN] {ae}")
        
        return {
            "user": {
                "id": str(user_id),
                "email": email,
                "full_name": full_name,
                "role": role
            },
            "permissions": permissions
        }
    finally:
        cur.close()
        conn.close()


@router.post("/auth/change-password")
def change_password(payload: ChangePasswordRequest):
    """
    Permite a un usuario cambiar su propia contraseña validando su contraseña actual.
    """
    email_clean = payload.email.strip().lower()
    current_pwd = payload.current_password.strip()
    new_pwd = payload.new_password.strip()
    
    if len(new_pwd) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 4 caracteres."
        )
    
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT id, full_name, role, password_hash,
                   (crypt(%s, password_hash) = password_hash) AS is_valid_pwd
            FROM app_users
            WHERE LOWER(email) = %s;
            """,
            (current_pwd, email_clean)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado."
            )
        
        user_id, full_name, role, password_hash, is_valid_pwd = row
        if not is_valid_pwd:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña actual ingresada es incorrecta."
            )
        
        cur.execute(
            """
            UPDATE app_users
            SET password_hash = crypt(%s, gen_salt('bf'))
            WHERE id = %s;
            """,
            (new_pwd, user_id)
        )
        conn.commit()
        
        try:
            AuditService.log_event(
                user_email=email_clean,
                action="CHANGE_PASSWORD",
                entity_name="Cambio de Contraseña Autoservicio",
                entity_id=f"PWD-CHANGE-{email_clean}",
                metadata={"user_name": full_name, "role": role}
            )
        except Exception as ae:
            print(f"[AUDIT LOG WARN] {ae}")
        
        return {"message": "Contraseña actualizada exitosamente."}
    finally:
        cur.close()
        conn.close()


@router.post("/auth/verify-2fa", response_model=LoginResponse)
def verify_two_factor(payload: Verify2FARequest):
    """
    Paso 2 del Login: Valida el código OTP de 6 dígitos ingresado por el usuario.
    Si es correcto y no ha expirado, emite la sesión definitiva con usuario y permisos.
    """
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # 1. Buscar token temporal
        cur.execute(
            """
            SELECT t.id, t.user_id, t.otp_code, t.attempts, t.is_used, t.expires_at,
                   u.email, u.full_name, u.role
            FROM user_2fa_tokens t
            JOIN app_users u ON t.user_id = u.id
            WHERE t.temp_token = %s;
            """,
            (payload.temp_token,)
        )
        row = cur.fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sesión de verificación inválida o no encontrada. Por favor inicie sesión nuevamente."
            )

        token_id, user_id, expected_otp, attempts, is_used, expires_at, email, full_name, role = row

        # Validar si ya fue usado
        is_used_bool = str(is_used).lower() in ("true", "1", "t") if is_used is not None else False
        if is_used_bool:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este código de verificación ya fue utilizado. Solicite uno nuevo."
            )

        # Validar intentos máximos (3)
        attempts_count = int(attempts or 0)
        if attempts_count >= 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ha superado el límite de intentos permitidos (3). Por favor reinicie su inicio de sesión."
            )

        # Validar expiración (5 min) de forma robusta para str o datetime
        now_utc = datetime.now(timezone.utc)
        if isinstance(expires_at, str):
            try:
                clean_exp = expires_at.replace("Z", "+00:00")
                expires_at_dt = datetime.fromisoformat(clean_exp)
            except Exception:
                try:
                    expires_at_dt = datetime.strptime(expires_at[:19], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
                except Exception:
                    expires_at_dt = now_utc + timedelta(minutes=5)
        elif isinstance(expires_at, datetime):
            expires_at_dt = expires_at
        else:
            expires_at_dt = now_utc + timedelta(minutes=5)

        if expires_at_dt.tzinfo is None:
            expires_at_dt = expires_at_dt.replace(tzinfo=timezone.utc)

        if now_utc > expires_at_dt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de verificación ha expirado (5 minutos de validez). Solicite un nuevo código."
            )

        # Validar código OTP
        if str(payload.otp_code).strip() != str(expected_otp).strip():
            # Incrementar intentos
            new_attempts = attempts_count + 1
            cur.execute(
                "UPDATE user_2fa_tokens SET attempts = %s WHERE id = %s;",
                (new_attempts, token_id)
            )
            conn.commit()
            remaining = max(0, 3 - new_attempts)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Código de verificación incorrecto. Le quedan {remaining} intento(s)."
            )

        # Marcar token como utilizado
        cur.execute(
            "UPDATE user_2fa_tokens SET is_used = TRUE WHERE id = %s;",
            (token_id,)
        )
        conn.commit()


        # Cargar permisos
        permissions = fetch_user_permissions(cur, user_id, role)

        try:
            AuditService.log_event(
                user_email=email,
                action="LOGIN",
                entity_name="Autenticación 2FA",
                entity_id=f"2FA-{email}",
                metadata={"user_name": full_name, "role": role}
            )
        except Exception as ae:
            print(f"[AUDIT LOG WARN] {ae}")

        return {
            "user": {
                "id": str(user_id),
                "email": email,
                "full_name": full_name,
                "role": role
            },
            "permissions": permissions
        }
    finally:
        cur.close()
        conn.close()


@router.post("/auth/resend-2fa")
def resend_two_factor(payload: Resend2FARequest):
    """
    Reenvía un nuevo código OTP al correo del usuario.
    """
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT t.user_id, u.email, u.full_name
            FROM user_2fa_tokens t
            JOIN app_users u ON t.user_id = u.id
            WHERE t.temp_token = %s;
            """,
            (payload.temp_token,)
        )
        row = cur.fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sesión no válida para reenvío."
            )

        user_id, email, full_name = row
        new_otp = f"{random.randint(100000, 999999)}"
        new_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        # Actualizar con nuevo OTP
        cur.execute(
            """
            UPDATE user_2fa_tokens
            SET otp_code = %s, attempts = 0, is_used = FALSE, expires_at = %s
            WHERE temp_token = %s;
            """,
            (new_otp, new_expires_at, payload.temp_token)
        )
        conn.commit()

        # Despachar nuevo correo
        send_2fa_email(to_email=email, user_name=full_name, otp_code=new_otp)

        return {"message": "Nuevo código de verificación enviado exitosamente."}
    finally:
        cur.close()
        conn.close()


@router.get("/users", response_model=List[UserWithPermissionsResponse])
def get_users():
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT id, email, full_name, role FROM app_users ORDER BY created_at DESC;")
        rows = cur.fetchall()
        
        users_list = []
        for r in rows:
            user_id = str(r[0])
            email = r[1]
            full_name = r[2]
            role = r[3]
            perms = fetch_user_permissions(cur, user_id, role)
            users_list.append({
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "role": role,
                "permissions": perms
            })
            
        return users_list
    finally:
        cur.close()
        conn.close()


@router.post("/users", response_model=UserWithPermissionsResponse)
def create_user(payload: UserCreateRequest):
    email_clean = payload.email.strip().lower()
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Verificar duplicados
        cur.execute("SELECT id FROM app_users WHERE LOWER(email) = %s;", (email_clean,))
        if cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está registrado."
            )
            
        # Crear usuario
        cur.execute(
            """
            INSERT INTO app_users (email, password_hash, full_name, role)
            VALUES (%s, crypt(%s, gen_salt('bf')), %s, %s)
            RETURNING id, email, full_name, role;
            """,
            (email_clean, payload.password, payload.full_name, payload.role)
        )
        user_row = cur.fetchone()
        user_id, email, full_name, role = user_row
        
        # Si no es ADMIN, insertar permisos específicos
        perms = payload.permissions or {}
        if role == "USER":
            upsert_user_permissions(cur, str(user_id), perms)
            perms_response = {k: perms.get(k, "Visor") for k in ALL_MODULE_KEYS}
        else:
            perms_response = ADMIN_PERMISSIONS
            
        conn.commit()
        return {
            "id": str(user_id),
            "email": email,
            "full_name": full_name,
            "role": role,
            "permissions": perms_response
        }
    except Exception as e:
        conn.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en el servidor: {e}"
        )
    finally:
        cur.close()
        conn.close()


@router.put("/users/{user_id}", response_model=UserWithPermissionsResponse)
def update_user(user_id: str, payload: UserUpdateRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Verificar existencia
        cur.execute("SELECT email, role FROM app_users WHERE id = %s;", (user_id,))
        exists = cur.fetchone()
        if not exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado."
            )
            
        old_email, old_role = exists
        
        # 1. Actualizar datos de usuario
        query_parts = []
        params = []
        
        if payload.full_name is not None:
            query_parts.append("full_name = %s")
            params.append(payload.full_name)
            
        if payload.email is not None:
            email_clean = payload.email.strip().lower()
            if email_clean != old_email:
                # Verificar que no esté en uso por otro
                cur.execute("SELECT id FROM app_users WHERE LOWER(email) = %s AND id != %s;", (email_clean, user_id))
                if cur.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="El nuevo correo electrónico ya está registrado."
                    )
            query_parts.append("email = %s")
            params.append(email_clean)
            
        if payload.role is not None:
            query_parts.append("role = %s")
            params.append(payload.role)
            
        if payload.password is not None and payload.password.strip() != "":
            query_parts.append("password_hash = crypt(%s, gen_salt('bf'))")
            params.append(payload.password)
            
        if query_parts:
            params.append(user_id)
            cur.execute(
                f"UPDATE app_users SET {', '.join(query_parts)} WHERE id = %s RETURNING email, full_name, role;",
                tuple(params)
            )
            updated_user = cur.fetchone()
            email, full_name, role = updated_user
        else:
            email, full_name, role = old_email, "Sin Cambios", old_role
            cur.execute("SELECT full_name FROM app_users WHERE id = %s;", (user_id,))
            full_name = cur.fetchone()[0]

        # 2. Actualizar permisos si el rol final es USER
        if role == "USER":
            if payload.permissions is not None:
                upsert_user_permissions(cur, user_id, payload.permissions)
                perms_response = {k: payload.permissions.get(k, "Visor") for k in ALL_MODULE_KEYS}
            else:
                perms_response = fetch_user_permissions(cur, user_id, role)
        else:
            # Si ahora es ADMIN, eliminamos sus permisos explícitos de la tabla (no son necesarios)
            cur.execute("DELETE FROM user_permissions WHERE user_id = %s;", (user_id,))
            perms_response = ADMIN_PERMISSIONS
            
        conn.commit()
        return {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "role": role,
            "permissions": perms_response
        }
    except Exception as e:
        conn.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar usuario: {e}"
        )
    finally:
        cur.close()
        conn.close()


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT id FROM app_users WHERE id = %s;", (user_id,))
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado."
            )
            
        cur.execute("DELETE FROM app_users WHERE id = %s;", (user_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar usuario: {e}"
        )
    finally:
        cur.close()
        conn.close()


@router.post("/users/{user_id}/reset-password")
def admin_reset_password(user_id: str, payload: AdminResetPasswordRequest):
    """
    Permite al Administrador resetear o asignar una nueva contraseña a cualquier usuario.
    """
    new_pwd = payload.new_password.strip()
    if len(new_pwd) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 4 caracteres."
        )
    
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT email, full_name, role FROM app_users WHERE id = %s;", (user_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado."
            )
        
        email, full_name, role = row
        
        cur.execute(
            """
            UPDATE app_users
            SET password_hash = crypt(%s, gen_salt('bf'))
            WHERE id = %s;
            """,
            (new_pwd, user_id)
        )
        conn.commit()
        
        try:
            AuditService.log_event(
                user_email=payload.admin_email or "admin",
                action="ADMIN_RESET_PASSWORD",
                entity_name=f"Reset de Contraseña a {email}",
                entity_id=f"ADMIN-RESET-{email}",
                metadata={"target_user": email, "target_name": full_name}
            )
        except Exception as ae:
            print(f"[AUDIT LOG WARN] {ae}")
        
        return {"message": f"Contraseña actualizada exitosamente para {full_name} ({email})."}
    except Exception as e:
        conn.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al resetear contraseña: {e}"
        )
    finally:
        cur.close()
        conn.close()



# --- Endpoints de Administración de Bóveda de Dispositivos (Device Vault) ---

class DeviceActionRequest(BaseModel):
    admin_email: str

@router.get("/auth/devices")
def list_devices_endpoint(email: Optional[str] = None):
    """
    Lista los dispositivos registrados en el Device Vault (para uso del panel de Administración).
    """
    try:
        return DeviceVaultService.list_devices(user_email=email)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar dispositivos: {e}"
        )

@router.post("/auth/devices/{device_id}/approve")
def approve_device_endpoint(device_id: str, payload: DeviceActionRequest):
    """
    Aprueba un dispositivo para acceso permanente.
    """
    try:
        res = DeviceVaultService.approve_device(device_id=device_id, admin_email=payload.admin_email)
        try:
            AuditService.log_event(
                user_email=payload.admin_email,
                action="UPDATE",
                entity_name="Bóveda de Dispositivos (Device Vault)",
                entity_id=device_id,
                metadata={"accion": "APROBAR_DISPOSITIVO", "status": "APPROVED"}
            )
        except Exception as ae:
            print(f"[AUDIT LOG WARN] {ae}")
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al aprobar dispositivo: {e}"
        )

@router.post("/auth/devices/{device_id}/revoke")
def revoke_device_endpoint(device_id: str, payload: DeviceActionRequest):
    """
    Revoca el acceso de un dispositivo.
    """
    try:
        res = DeviceVaultService.revoke_device(device_id=device_id, admin_email=payload.admin_email)
        try:
            AuditService.log_event(
                user_email=payload.admin_email,
                action="UPDATE",
                entity_name="Bóveda de Dispositivos (Device Vault)",
                entity_id=device_id,
                metadata={"accion": "REVOCAR_DISPOSITIVO", "status": "REVOKED"}
            )
        except Exception as ae:
            print(f"[AUDIT LOG WARN] {ae}")
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al revocar dispositivo: {e}"
        )


# --- Endpoints del Libro de Auditoría Forense (Audit Logs) ---

@router.get("/auth/audit/logs")
def list_audit_logs_endpoint(
    entity_name: Optional[str] = None,
    user_email: Optional[str] = None,
    limit: int = 100
):
    """
    Retorna la bitácora real de auditoría forense desde la base de datos PostgreSQL.
    """
    try:
        return AuditService.get_audit_trail(entity_name=entity_name, user_email=user_email, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener logs de auditoría: {e}"
        )

@router.post("/auth/audit/logs")
def create_audit_log_endpoint(payload: Dict[str, Any], request: Request):
    """
    Registra un evento de auditoría en tiempo real.
    """
    try:
        ip = request.client.host if request.client else None
        ua = request.headers.get("user-agent")
        return AuditService.log_event(
            user_email=payload.get("user_email", "SYSTEM"),
            action=payload.get("action", "EVENT"),
            entity_name=payload.get("table_name") or payload.get("entity_name", "General"),
            entity_id=payload.get("record_id") or payload.get("entity_id"),
            old_data=payload.get("old_data"),
            new_data=payload.get("new_data"),
            metadata=payload.get("metadata"),
            ip_address=ip,
            user_agent=ua
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar log: {e}"
        )



