"""
Servicio de Auditoría Forense y Trazabilidad de Eventos
DELFOS SHIPPING SOFTWARE
Permite registrar auditoría a nivel de aplicación (FastAPI) y consultar la bitácora pericial.
"""

from typing import Dict, Any, List, Optional
import json
from datetime import datetime, timezone
import psycopg2
from backend.database import get_db_connection

class AuditService:
    @staticmethod
    def log_event(
        user_email: str,
        action: str,
        entity_name: str,
        entity_id: Optional[str] = None,
        old_data: Optional[Dict[str, Any]] = None,
        new_data: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Registra un evento de auditoría en la tabla audit_logs calculando el delta/diff.
        """
        email_clean = user_email.strip().lower() if user_email else "SYSTEM"
        
        # Calcular delta si hay old_data y new_data
        diff_data = {}
        if old_data and new_data:
            all_keys = set(old_data.keys()).union(set(new_data.keys()))
            for k in all_keys:
                old_val = old_data.get(k)
                new_val = new_data.get(k)
                if old_val != new_val:
                    diff_data[k] = {"old": old_val, "new": new_val}

        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute(
                """
                INSERT INTO audit_logs (
                    table_name, record_id, action, user_email, ip_address, user_agent,
                    old_data, new_data, diff_data, metadata
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, created_at;
                """,
                (
                    entity_name,
                    entity_id or "N/A",
                    action.upper(),
                    email_clean,
                    ip_address,
                    user_agent,
                    json.dumps(old_data) if old_data else None,
                    json.dumps(new_data) if new_data else None,
                    json.dumps(diff_data) if diff_data else None,
                    json.dumps(metadata) if metadata else None
                )
            )
            row = cur.fetchone()
            conn.commit()
            return {
                "audit_id": row[0],
                "created_at": str(row[1]),
                "status": "RECORDED"
            }
        except Exception as e:
            conn.rollback()
            print(f"[AUDIT ERROR] No se pudo registrar log: {e}")
            return {"status": "ERROR", "error": str(e)}
        finally:
            cur.close()
            conn.close()

    @staticmethod
    def get_audit_trail(
        entity_name: Optional[str] = None,
        entity_id: Optional[str] = None,
        user_email: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Consulta la bitácora de auditoría forense con filtros.
        """
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            conditions = []
            params = []
            if entity_name:
                conditions.append("table_name = %s")
                params.append(entity_name)
            if entity_id:
                conditions.append("record_id = %s")
                params.append(entity_id)
            if user_email:
                conditions.append("LOWER(user_email) = %s")
                params.append(user_email.strip().lower())

            where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
            query = f"""
                SELECT id, table_name, record_id, action, user_email, ip_address, 
                       old_data, new_data, diff_data, metadata, created_at
                FROM audit_logs
                {where_clause}
                ORDER BY created_at DESC
                LIMIT %s;
            """
            params.append(limit)
            cur.execute(query, tuple(params))
            rows = cur.fetchall()

            return [
                {
                    "id": r[0],
                    "entity": r[1],
                    "record_id": r[2],
                    "action": r[3],
                    "user": r[4],
                    "ip": r[5],
                    "old_data": r[6],
                    "new_data": r[7],
                    "diff": r[8],
                    "metadata": r[9],
                    "timestamp": str(r[10])
                }
                for r in rows
            ]
        finally:
            cur.close()
            conn.close()
