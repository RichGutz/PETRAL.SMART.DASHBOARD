"""
Agente 4: Bunker Stresstest Agent
Evalua fluctuaciones y sensibilidad de búnker IFO y MDO en las proyecciones.
"""
from typing import Dict, Any, List

class BunkerStresstestAgent:
    def __init__(self, twin):
        self.twin = twin
        self.name = "⛽ Bunker Stresstest"
        self.alias = "bunker_agent"

    def generate_projections(self) -> List[Dict[str, Any]]:
        quotes = self.twin.get_table("routes_quotes")
        projections = []
        for q in quotes[:3]:
            projections.append({
                "month_index": "2026-07",
                "client_id": q.get("client_id") or "SPCC",
                "origin_port_id": "ILO",
                "destination_port_id": "MATARANI",
                "vessel_id": q.get("vessel_id") or "MOQUEGUA",
                "quantity": 13500.0,
                "monthly_frequency": 2,
                "quote_id": q.get("name")
            })
        return projections
