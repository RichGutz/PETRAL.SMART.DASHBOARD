from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
import random
import uuid
from datetime import datetime, timedelta, timezone
from backend.database import get_db_connection
from backend.services.send_demo_email import send_2fa_email
from backend.services.device_vault_service import DeviceVaultService
from backend.services.audit_service import AuditService

router = APIRouter(tags=["auth"])

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



# --- Helpers de Permisos ---
DEFAULT_PERMISSIONS = {
    "multicotizador_spot": "Visor",
    "matriz_financiera": "Visor",
    "maestro_buques": "Visor",
    "maestro_rutas": "Visor",
    "maestro_puertos": "Visor",
    "maestro_contratos": "Visor",
    "maestro_tarifas": "Visor",
    "maestro_costos_agencia": "Visor"
}

ADMIN_PERMISSIONS = {
    "multicotizador_spot": "Editor",
    "matriz_financiera": "Editor",
    "maestro_buques": "Editor",
    "maestro_rutas": "Editor",
    "maestro_puertos": "Editor",
    "maestro_contratos": "Editor",
    "maestro_tarifas": "Editor",
    "maestro_costos_agencia": "Editor"
}

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
                detail=f"El correo '{payload.email}' no se encuentra registrado en DELFOS."
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
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

        # 4. Guardar en tabla user_2fa_tokens
        cur.execute(
            """
            INSERT INTO user_2fa_tokens (user_id, temp_token, otp_code, expires_at)
            VALUES (%s, %s, %s, %s);
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
        if is_used:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este código de verificación ya fue utilizado. Solicite uno nuevo."
            )

        # Validar intentos máximos (3)
        if attempts >= 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ha superado el límite de intentos permitidos (3). Por favor reinicie su inicio de sesión."
            )

        # Validar expiración (5 min)
        now_utc = datetime.now(timezone.utc)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if now_utc > expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de verificación ha expirado (5 minutos de validez). Solicite un nuevo código."
            )

        # Validar código OTP
        if payload.otp_code.strip() != expected_otp:
            # Incrementar intentos
            cur.execute(
                "UPDATE user_2fa_tokens SET attempts = attempts + 1 WHERE id = %s;",
                (token_id,)
            )
            conn.commit()
            remaining = 3 - (attempts + 1)
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
        permissions = {}
        if role == "ADMIN":
            permissions = ADMIN_PERMISSIONS
        else:
            cur.execute(
                """
                SELECT multicotizador_spot, matriz_financiera, maestro_buques, maestro_rutas, 
                       maestro_puertos, maestro_contratos, maestro_tarifas, maestro_costos_agencia
                FROM user_permissions
                WHERE user_id = %s;
                """,
                (user_id,)
            )
            p_row = cur.fetchone()
            if p_row:
                permissions = {
                    "multicotizador_spot": p_row[0],
                    "matriz_financiera": p_row[1],
                    "maestro_buques": p_row[2],
                    "maestro_rutas": p_row[3],
                    "maestro_puertos": p_row[4],
                    "maestro_contratos": p_row[5],
                    "maestro_tarifas": p_row[6],
                    "maestro_costos_agencia": p_row[7]
                }
            else:
                permissions = DEFAULT_PERMISSIONS

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
        new_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

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
        # Traer usuarios y hacer left join con permisos
        cur.execute(
            """
            SELECT u.id, u.email, u.full_name, u.role,
                   p.multicotizador_spot, p.matriz_financiera, p.maestro_buques, p.maestro_rutas,
                   p.maestro_puertos, p.maestro_contratos, p.maestro_tarifas, p.maestro_costos_agencia
            FROM app_users u
            LEFT JOIN user_permissions p ON u.id = p.user_id
            ORDER BY u.created_at DESC;
            """
        )
        rows = cur.fetchall()
        
        users_list = []
        for r in rows:
            user_id = str(r[0])
            email = r[1]
            full_name = r[2]
            role = r[3]
            
            if role == "ADMIN":
                perms = ADMIN_PERMISSIONS
            else:
                perms = {
                    "multicotizador_spot": r[4] or "Visor",
                    "matriz_financiera": r[5] or "Visor",
                    "maestro_buques": r[6] or "Visor",
                    "maestro_rutas": r[7] or "Visor",
                    "maestro_puertos": r[8] or "Visor",
                    "maestro_contratos": r[9] or "Visor",
                    "maestro_tarifas": r[10] or "Visor",
                    "maestro_costos_agencia": r[11] or "Visor"
                }
                
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
        perms = payload.permissions
        if role == "USER":
            cur.execute(
                """
                INSERT INTO user_permissions (
                    user_id, multicotizador_spot, matriz_financiera, maestro_buques, maestro_rutas,
                    maestro_puertos, maestro_contratos, maestro_tarifas, maestro_costos_agencia
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    user_id,
                    perms.get("multicotizador_spot", "Visor"),
                    perms.get("matriz_financiera", "Visor"),
                    perms.get("maestro_buques", "Visor"),
                    perms.get("maestro_rutas", "Visor"),
                    perms.get("maestro_puertos", "Visor"),
                    perms.get("maestro_contratos", "Visor"),
                    perms.get("maestro_tarifas", "Visor"),
                    perms.get("maestro_costos_agencia", "Visor")
                )
            )
            perms_response = perms
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
                perms = payload.permissions
                # Asegurar que exista la fila de permisos en caso de que antes haya sido ADMIN
                cur.execute(
                    """
                    INSERT INTO user_permissions (
                        user_id, multicotizador_spot, matriz_financiera, maestro_buques, maestro_rutas,
                        maestro_puertos, maestro_contratos, maestro_tarifas, maestro_costos_agencia
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (user_id) DO UPDATE SET
                        multicotizador_spot = EXCLUDED.multicotizador_spot,
                        matriz_financiera = EXCLUDED.matriz_financiera,
                        maestro_buques = EXCLUDED.maestro_buques,
                        maestro_rutas = EXCLUDED.maestro_rutas,
                        maestro_puertos = EXCLUDED.maestro_puertos,
                        maestro_contratos = EXCLUDED.maestro_contratos,
                        maestro_tarifas = EXCLUDED.maestro_tarifas,
                        maestro_costos_agencia = EXCLUDED.maestro_costos_agencia;
                    """,
                    (
                        user_id,
                        perms.get("multicotizador_spot", "Visor"),
                        perms.get("matriz_financiera", "Visor"),
                        perms.get("maestro_buques", "Visor"),
                        perms.get("maestro_rutas", "Visor"),
                        perms.get("maestro_puertos", "Visor"),
                        perms.get("maestro_contratos", "Visor"),
                        perms.get("maestro_tarifas", "Visor"),
                        perms.get("maestro_costos_agencia", "Visor")
                    )
                )
                perms_response = perms
            else:
                # Leer permisos existentes
                cur.execute("SELECT multicotizador_spot, matriz_financiera, maestro_buques, maestro_rutas, maestro_puertos, maestro_contratos, maestro_tarifas, maestro_costos_agencia FROM user_permissions WHERE user_id = %s;", (user_id,))
                p_row = cur.fetchone()
                if p_row:
                    perms_response = {
                        "multicotizador_spot": p_row[0],
                        "matriz_financiera": p_row[1],
                        "maestro_buques": p_row[2],
                        "maestro_rutas": p_row[3],
                        "maestro_puertos": p_row[4],
                        "maestro_contratos": p_row[5],
                        "maestro_tarifas": p_row[6],
                        "maestro_costos_agencia": p_row[7]
                    }
                else:
                    perms_response = DEFAULT_PERMISSIONS
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


@router.post("/auth/change-password")
def change_password(payload: ChangePasswordRequest):
    email_clean = payload.email.strip().lower()
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Verificar contraseña actual
        cur.execute(
            """
            SELECT id FROM app_users 
            WHERE LOWER(email) = %s AND password_hash = crypt(%s, password_hash);
            """,
            (email_clean, payload.current_password)
        )
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña actual es incorrecta."
            )
        
        # Actualizar contraseña
        cur.execute(
            """
            UPDATE app_users 
            SET password_hash = crypt(%s, gen_salt('bf'))
            WHERE LOWER(email) = %s;
            """,
            (payload.new_password, email_clean)
        )
        conn.commit()
        return {"message": "Contraseña actualizada exitosamente."}
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



