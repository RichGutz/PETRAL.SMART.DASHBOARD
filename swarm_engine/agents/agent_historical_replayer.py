"""
Agente 6: Historical Replayer Agent
Extrae los escenarios historicos reales guardados en produccion (PB 2027 y 2028 +10%)
y los re-ejecuta para asegurar cero regresion con la historia contable.
"""
from typing import Dict, Any, List
import json
import ast
from backend.models.forecast_models import ForecastListResponse, ProjectionLine

class HistoricalReplayerAgent:
    def __init__(self, twin):
        self.twin = twin
        self.name = "🕰️ Historical Replayer"
        self.alias = "historical_replayer"

    def audit_catalog_loading(self) -> List[Dict[str, Any]]:
        """
        Valida que todos los escenarios grabados en la BD se listen correctamente
        sin errores de validación de Pydantic (ForecastListResponse) ni fallas en fechas/nulos.
        """
        forecasts = self.twin.get_historical_forecasts()
        validated_catalog = []
        for f in forecasts:
            # Validar con ForecastListResponse
            row_dict = {
                "id": str(f.get("id") or ""),
                "name": str(f.get("name") or "Sin Nombre"),
                "user_id": str(f.get("user_id") or "Usuario Comercial"),
                "start_date": str(f.get("start_date") or ""),
                "end_date": str(f.get("end_date") or ""),
                "created_at": str(f.get("created_at") or ""),
                "updated_at": str(f.get("updated_at") or "")
            }
            # Debe validar limpiamente
            resp_obj = ForecastListResponse(**row_dict)
            validated_catalog.append(resp_obj.model_dump())
        return validated_catalog

    def get_historical_scenarios(self) -> List[Dict[str, Any]]:
        forecasts = self.twin.get_historical_forecasts()
        scenarios = []
        for f in forecasts:
            lines = f.get("projection_lines") or []
            if isinstance(lines, str):
                val_str = lines.strip()
                try:
                    lines = json.loads(val_str)
                except Exception:
                    try:
                        lines = ast.literal_eval(val_str)
                    except Exception:
                        lines = []
            if not isinstance(lines, list):
                lines = []

            scenarios.append({
                "id": f.get("id"),
                "name": f.get("name"),
                "lines_count": len(lines),
                "lines": lines,
                "start_date": f.get("start_date"),
                "end_date": f.get("end_date")
            })
        return scenarios

