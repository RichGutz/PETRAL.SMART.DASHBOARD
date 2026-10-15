from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class TrashItem(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    source_table: str
    document_name: str
    client_name: Optional[str] = None
    vessel_id: Optional[str] = None
    payload: Dict[str, Any]
    deleted_by: str
    deleted_at: str
    restored: bool = False
    restored_at: Optional[str] = None
    restored_by: Optional[str] = None

class RestoreRequest(BaseModel):
    restored_by: Optional[str] = "Operador Comercial"

class MoveToTrashRequest(BaseModel):
    entity_type: str
    entity_id: str
    source_table: str
    document_name: str
    client_name: Optional[str] = None
    vessel_id: Optional[str] = None
    payload: Dict[str, Any]
    deleted_by: str
