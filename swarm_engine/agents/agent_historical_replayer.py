"""
Agente 6: Historical Replayer Agent
Extrae los escenarios historicos reales guardados en produccion (PB 2027 y 2028 +10%)
y los re-ejecuta para asegurar cero regresion con la historia contable.
"""
from typing import Dict, Any, List

class HistoricalReplayerAgent:
    def __init__(self, twin):
        self.twin = twin
        self.name = "🕰️ Historical Replayer"
        self.alias = "historical_replayer"

    def get_historical_scenarios(self) -> List[Dict[str, Any]]:
        forecasts = self.twin.get_historical_forecasts()
        scenarios = []
        for f in forecasts:
            lines = f.get("projection_lines") or []
            if isinstance(lines, str):
                import json
                try:
                    lines = json.loads(lines)
                except Exception:
                    lines = []
            scenarios.append({
                "id": f.get("id"),
                "name": f.get("name"),
                "lines_count": len(lines),
                "lines": lines
            })
        return scenarios
