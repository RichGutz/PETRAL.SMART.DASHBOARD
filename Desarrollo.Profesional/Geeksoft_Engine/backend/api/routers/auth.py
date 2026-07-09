from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, List
from backend.database import get_db_connection

router = APIRouter(tags=["auth"])

# --- Modelos de Pydantic ---
class LoginRequest(BaseModel):
    email: str
    password: str

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


# --- Endpoints ---

@router.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    email_clean = payload.email.strip().lower()
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Validar credenciales usando la función crypt de PostgreSQL
        cur.execute(
            """
            SELECT id, email, full_name, role 
            FROM app_users 
            WHERE LOWER(email) = %s AND password_hash = crypt(%s, password_hash);
            """,
            (email_clean, payload.password)
        )
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Correo electrónico o contraseña incorrectos."
            )
            
        user_id, email, full_name, role = row
        
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

