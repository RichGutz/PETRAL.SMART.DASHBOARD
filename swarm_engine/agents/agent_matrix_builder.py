"""
Agente 5: Matrix Scenario Builder Agent
Construye escenarios multianuales masivos de 72 filas en la Matriz Financiera.
"""
from typing import Dict, Any, List

class MatrixScenarioBuilderAgent:
    def __init__(self, twin):
        self.twin = twin
        self.name = "📊 Matrix Scenario Builder"
        self.alias = "matrix_builder"

    def generate_projections(self) -> List[Dict[str, Any]]:
        quotes = self.twin.get_table("routes_quotes")
        projections = []
        months = [f"2026-{m:02d}" for m in range(1, 13)]
        
        # 2 buques x 3 cotizaciones x 12 meses = 72 líneas de proyección
        candidate_quotes = quotes[:6]
        for m in months:
            for q in candidate_quotes:
                vessel = q.get("vessel_id") or "MOQUEGUA"
                projections.append({
                    "month_index": m,
                    "client_id": q.get("client_id") or "SPCC",
                    "origin_port_id": "ILO",
                    "destination_port_id": "MATARANI",
                    "vessel_id": vessel,
                    "quantity": 13500.0,
                    "monthly_frequency": 1,
                    "quote_id": q.get("name")
                })
        return projections
