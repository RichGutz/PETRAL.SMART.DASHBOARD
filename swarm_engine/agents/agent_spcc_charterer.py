"""
Agente 1: SPCC Charterer Agent
Simula la operativa del fletador de Southern Peru Copper Corp (SPCC).
Modela viajes de concentrado de cobre (13,500 TM) en rutas de la costa sur.
"""
from typing import Dict, Any, List

class SpccChartererAgent:
    def __init__(self, twin):
        self.twin = twin
        self.name = "⚓ SPCC Charterer"
        self.alias = "spcc_agent"

    def generate_projections(self) -> List[Dict[str, Any]]:
        """
        Genera proyecciones mensuales de SPCC usando cotizaciones reales de produccion
        """
        quotes = self.twin.get_table("routes_quotes")
        spcc_quotes = [q for q in quotes if "SPCC" in (q.get("client_id") or q.get("name") or "").upper()]
        
        projections = []
        months = ["2026-03", "2026-04", "2026-05"]
        
        for m in months:
            for q in spcc_quotes[:3]:
                route_name = q.get("name")
                vessel = q.get("vessel_id") or "MOQUEGUA"
                projections.append({
                    "month_index": m,
                    "client_id": "SPCC",
                    "origin_port_id": "ILO",
                    "destination_port_id": "MATARANI",
                    "vessel_id": vessel,
                    "quantity": 13500.0,
                    "monthly_frequency": 1,
                    "quote_id": route_name
                })
        return projections
