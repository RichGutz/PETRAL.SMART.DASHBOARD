"""
Servicio Backend: Device Vault (Bóveda de Dispositivos Autorizados)
DELFOS SHIPPING SOFTWARE
Manejo de estados: PENDING -> APPROVED -> REJECTED -> REVOKED
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import psycopg2
from backend.database import get_db_connection

class DeviceVaultService:
    @staticmethod
    def verify_or_register_device(
        user_email: str,
        device_fingerprint: str,
        device_name: str,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Verifica el estado del dispositivo. Si no existe, lo registra en estado 'PENDING'.
        Retorna:
        - status: 'APPROVED' (permite login), 'PENDING' (bloquea acceso), 'REJECTED', 'REVOKED'
        """
        email_clean = user_email.strip().lower()
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            cur.execute(
                """
                SELECT id, status, approved_by, approved_at, device_name
                FROM user_authorized_devices
                WHERE LOWER(user_email) = %s AND device_fingerprint = %s;
                """,
                (email_clean, device_fingerprint)
            )
            row = cur.fetchone()
            
            if row:
                device_id, status, approved_by, approved_at, stored_device_name = row
                # Actualizar último acceso e IP
                cur.execute(
                    """
                    UPDATE user_authorized_devices
                    SET last_access_at = CURRENT_TIMESTAMP, ip_address = COALESCE(%s, ip_address)
                    WHERE id = %s;
                    """,
                    (ip_address, device_id)
                )
                conn.commit()
                return {
                    "device_id": str(device_id),
                    "status": status,
                    "is_authorized": (status == "APPROVED"),
                    "device_name": stored_device_name,
                    "approved_by": approved_by,
                    "approved_at": str(approved_at) if approved_at else None
                }
            else:
                # Dispositivo nuevo -> Registrar como PENDING
                cur.execute(
                    """
                    INSERT INTO user_authorized_devices (
                        user_email, device_fingerprint, device_name, ip_address, status
                    ) VALUES (%s, %s, %s, %s, 'PENDING')
                    RETURNING id, status, created_at;
                    """,
                    (email_clean, device_fingerprint, device_name, ip_address)
                )
                new_row = cur.fetchone()
                device_id, status, created_at = new_row
                conn.commit()
                
                return {
                    "device_id": str(device_id),
                    "status": "PENDING",
                    "is_authorized": False,
                    "device_name": device_name,
                    "message": "Dispositivo nuevo registrado. Requiere autorización del Administrador."
                }
        finally:
            cur.close()
            conn.close()

    @staticmethod
    def approve_device(device_id: str, admin_email: str) -> Dict[str, Any]:
        """
        Autoriza un dispositivo para acceso permanente.
        """
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute(
                """
                UPDATE user_authorized_devices
                SET status = 'APPROVED', approved_by = %s, approved_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, user_email, device_name, status, approved_at;
                """,
                (admin_email, device_id)
            )
            row = cur.fetchone()
            if not row:
                raise ValueError("Dispositivo no encontrado.")
            conn.commit()
            return {
                "id": str(row[0]),
                "user_email": row[1],
                "device_name": row[2],
                "status": row[3],
                "approved_at": str(row[4])
            }
        finally:
            cur.close()
            conn.close()

    @staticmethod
    def revoke_device(device_id: str, admin_email: str) -> Dict[str, Any]:
        """
        Revoca el acceso de un dispositivo.
        """
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute(
                """
                UPDATE user_authorized_devices
                SET status = 'REVOKED', approved_by = %s, approved_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, user_email, device_name, status;
                """,
                (admin_email, device_id)
            )
            row = cur.fetchone()
            if not row:
                raise ValueError("Dispositivo no encontrado.")
            conn.commit()
            return {
                "id": str(row[0]),
                "user_email": row[1],
                "device_name": row[2],
                "status": row[3]
            }
        finally:
            cur.close()
            conn.close()

    @staticmethod
    def list_devices(user_email: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Lista todos los dispositivos registrados en la bóveda (para el panel de administración).
        """
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            if user_email:
                cur.execute(
                    """
                    SELECT id, user_email, device_fingerprint, device_name, ip_address, status, approved_by, approved_at, created_at, last_access_at
                    FROM user_authorized_devices
                    WHERE LOWER(user_email) = %s
                    ORDER BY created_at DESC;
                    """,
                    (user_email.strip().lower(),)
                )
            else:
                cur.execute(
                    """
                    SELECT id, user_email, device_fingerprint, device_name, ip_address, status, approved_by, approved_at, created_at, last_access_at
                    FROM user_authorized_devices
                    ORDER BY created_at DESC;
                    """
                )
            rows = cur.fetchall()
            return [
                {
                    "id": str(r[0]),
                    "user_email": r[1],
                    "device_fingerprint": r[2],
                    "device_name": r[3],
                    "ip_address": r[4],
                    "status": r[5],
                    "approved_by": r[6],
                    "approved_at": str(r[7]) if r[7] else None,
                    "created_at": str(r[8]) if r[8] else None,
                    "last_access_at": str(r[9]) if r[9] else None
                }
                for r in rows
            ]
        finally:
            cur.close()
            conn.close()
