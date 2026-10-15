import logging
from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, List, Dict, Any
from backend.models.trash_models import TrashItem, RestoreRequest
from backend.services.trash_service import TrashService

router = APIRouter(tags=["commercial-trash"])
logger = logging.getLogger("trash_router")

@router.get("", response_model=List[TrashItem])
def get_trash_items(
    entity_type: Optional[str] = Query(None, description="Filtro por tipo: CIERRE, COTIZACION, PRESUPUESTO, MATRIZ o ALL"),
    client_name: Optional[str] = Query(None, description="Filtro por cliente: SPCC, NEXA, etc."),
    include_restored: bool = Query(False, description="Incluir elementos ya restaurados"),
    search: Optional[str] = Query(None, description="Búsqueda por texto libre")
):
    try:
        items = TrashService.list_trash(
            entity_type=entity_type,
            client_name=client_name,
            include_restored=include_restored,
            search=search
        )
        return items
    except Exception as e:
        logger.error(f"Error listando papelera: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al consultar la papelera de reciclaje: {str(e)}"
        )

@router.get("/count")
def get_trash_count():
    try:
        count = TrashService.get_trash_count()
        return {"count": count}
    except Exception as e:
        logger.error(f"Error contando papelera: {e}")
        return {"count": 0}

@router.post("/{trash_id}/restore")
def restore_trash_item(trash_id: str, payload: Optional[RestoreRequest] = None):
    try:
        restored_by = payload.restored_by if payload and payload.restored_by else "Operador Comercial"
        res = TrashService.restore_item(trash_id, restored_by=restored_by)
        return res
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error(f"Error restaurando elemento {trash_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al restaurar documento: {str(e)}"
        )

@router.delete("/{trash_id}/purge")
def purge_trash_item(trash_id: str):
    try:
        success = TrashService.purge_item(trash_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Elemento {trash_id} no encontrado para purgar."
            )
        return {"status": "success", "message": f"Elemento {trash_id} purgado definitivamente."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error purgando elemento {trash_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al purgar documento: {str(e)}"
        )
