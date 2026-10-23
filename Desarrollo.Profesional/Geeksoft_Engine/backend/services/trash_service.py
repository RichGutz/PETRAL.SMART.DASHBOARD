import json
import logging
from typing import List, Optional, Dict, Any
from backend.database import get_db_connection, get_supabase
from backend.services.forecast_service import clear_forecast_cache

logger = logging.getLogger("trash_service")

class TrashService:

    @staticmethod
    def move_to_trash(
        entity_type: str,
        entity_id: str,
        source_table: str,
        document_name: str,
        client_name: Optional[str],
        vessel_id: Optional[str],
        payload: Dict[str, Any],
        deleted_by: str
    ) -> str:
        """
        Registra un documento en la papelera de reciclaje comercial antes de removerlo de la vista activa.
        """
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO commercial_trash_bin (
                        entity_type, entity_id, source_table, document_name,
                        client_name, vessel_id, payload, deleted_by, deleted_at, restored
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), FALSE)
                    RETURNING id;
                    """,
                    (
                        entity_type,
                        entity_id,
                        source_table,
                        document_name,
                        client_name,
                        vessel_id,
                        json.dumps(payload, default=str),
                        deleted_by or "Sistema / Usuario"
                    )
                )
                row = cur.fetchone()
                trash_id = str(row[0]) if row else ""
            conn.commit()
            return trash_id
        except Exception as e:
            conn.rollback()
            logger.error(f"Error al mover elemento a papelera: {e}")
            raise e
        finally:
            conn.close()

    @staticmethod
    def list_trash(
        entity_type: Optional[str] = None,
        client_name: Optional[str] = None,
        include_restored: bool = False,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Lista los elementos presentes en la papelera de reciclaje con filtros por tipo, cliente y búsqueda textual.
        """
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                query = """
                    SELECT id, entity_type, entity_id, source_table, document_name,
                           client_name, vessel_id, payload, deleted_by,
                           to_char(deleted_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as deleted_at,
                           restored,
                           to_char(restored_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as restored_at,
                           restored_by
                    FROM commercial_trash_bin
                    WHERE 1=1
                """
                params = []

                if not include_restored:
                    query += " AND restored = FALSE"

                if entity_type and entity_type.upper() != "ALL":
                    query += " AND entity_type = %s"
                    params.append(entity_type.upper())

                if client_name and client_name.strip():
                    query += " AND LOWER(client_name) = LOWER(%s)"
                    params.append(client_name.strip())

                if search and search.strip():
                    query += " AND (document_name ILIKE %s OR entity_id ILIKE %s OR vessel_id ILIKE %s)"
                    term = f"%{search.strip()}%"
                    params.extend([term, term, term])

                query += " ORDER BY deleted_at DESC LIMIT 200;"
                cur.execute(query, params)
                cols = [d[0] for d in cur.description]
                rows = cur.fetchall()

                results = []
                for r in rows:
                    item = dict(zip(cols, r))
                    item["id"] = str(item["id"])
                    if isinstance(item.get("payload"), str):
                        try:
                            item["payload"] = json.loads(item["payload"])
                        except Exception:
                            pass
                    results.append(item)
                return results
        finally:
            conn.close()

    @staticmethod
    def get_trash_count() -> int:
        """
        Retorna la cantidad de elementos activos (no restaurados) en la papelera para badges numéricos.
        """
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM commercial_trash_bin WHERE restored = FALSE;")
                row = cur.fetchone()
                return int(row[0]) if row else 0
        finally:
            conn.close()

    @staticmethod
    def restore_item(trash_id: str, restored_by: str = "Usuario") -> Dict[str, Any]:
        """
        Restaura un documento de la papelera a su tabla de origen original (routes_quotes, contracts, etc.).
        """
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, entity_type, entity_id, source_table, document_name, payload, restored
                    FROM commercial_trash_bin
                    WHERE id = %s;
                    """,
                    (trash_id,)
                )
                row = cur.fetchone()
                if not row:
                    raise ValueError(f"Elemento con ID {trash_id} no encontrado en la papelera.")

                trash_pk, entity_type, entity_id, source_table, document_name, payload, already_restored = row
                if isinstance(payload, str):
                    payload = json.loads(payload)

            # Reinsertar en la tabla de origen usando el cliente canónico con upsert
            sb = get_supabase()
            logger.info(f"Restaurando {entity_type} '{document_name}' en tabla '{source_table}'...")
            sb.table(source_table).upsert(payload).execute()

            # Marcar como restaurado en commercial_trash_bin
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE commercial_trash_bin
                    SET restored = TRUE, restored_at = NOW(), restored_by = %s
                    WHERE id = %s;
                    """,
                    (restored_by, trash_id)
                )
            conn.commit()

            # Invalidar la caché del forecast engine para que los maestros muestren el registro de inmediato
            clear_forecast_cache()

            return {
                "status": "success",
                "message": f"Documento '{document_name}' restaurado exitosamente en '{source_table}'.",
                "entity_id": entity_id,
                "source_table": source_table
            }
        except Exception as e:
            conn.rollback()
            logger.error(f"Error al restaurar elemento {trash_id}: {e}")
            raise e
        finally:
            conn.close()

    @staticmethod
    def purge_item(trash_id: str) -> bool:
        """
        Elimina definitivamente un elemento de la papelera de reciclaje (Purge físico irreversible).
        """
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM commercial_trash_bin WHERE id = %s RETURNING id;", (trash_id,))
                deleted = cur.fetchone() is not None
            conn.commit()
            return deleted
        except Exception as e:
            conn.rollback()
            logger.error(f"Error al purgar elemento {trash_id}: {e}")
            raise e
        finally:
            conn.close()
