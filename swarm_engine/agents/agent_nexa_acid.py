"""
Agente 2: Nexa & Marcobre Acid Operator Agent
Modela contratos de cabotaje de acido sulfurico con tramos multi-drop y recaladas intermedias.
"""
from typing import Dict, Any, List

class NexaAcidAgent:
    def __init__(self, twin):
        self.twin = twin
        self.name = "🧪 Nexa Acid Operator"
        self.alias = "nexa_agent"

    def generate_projections(self) -> List[Dict[str, Any]]:
        quotes = self.twin.get_table("routes_quotes")
        nexa_quotes = [q for q in quotes if any(c in (q.get("client_id") or q.get("name") or "").upper() for c in ["NEXA", "MARCOBRE", "CAJAMARQUILLA"])]
        
        projections = []
        months = ["2026-03", "2026-04"]
        
        for m in months:
            for q in nexa_quotes[:3]:
                route_name = q.get("name")
                vessel = q.get("vessel_id") or "TABLONES"
                projections.append({
                    "month_index": m,
                    "client_id": q.get("client_id") or "NEXA",
                    "origin_port_id": "CALLAO",
                    "destination_port_id": "MATARANI",
                    "vessel_id": vessel,
                    "quantity": 10000.0,
                    "monthly_frequency": 1,
                    "quote_id": route_name
                })
        return projections
