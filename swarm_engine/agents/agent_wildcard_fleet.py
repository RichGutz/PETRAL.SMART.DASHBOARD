"""
Agente 3: Wildcard Fleet Allocator (El Buque Comodin)
Este agente estresa deliberadamente el Camino B del motor matematico:
Toma cotizaciones de un buque (ej. MOQUEGUA) e intercambia el buque al vuelo
por otro alternativo de la flota (TABLONES, etc.) para detectar de inmediato
incompatibilidades de tipos de datos, divisiones entre cero o descalces de consumos.
"""
from typing import Dict, Any, List

class WildcardFleetAgent:
    def __init__(self, twin):
        self.twin = twin
        self.name = "🃏 Wildcard Allocator"
        self.alias = "wildcard_agent"

    def generate_projections(self) -> List[Dict[str, Any]]:
        quotes = self.twin.get_table("routes_quotes")
        projections = []
        
        # Filtrar cotizaciones de MOQUEGUA y asignarles TABLONES
        moq_quotes = [q for q in quotes if "MOQUEGUA" in (q.get("vessel_id") or q.get("name") or "").upper()]
        for q in moq_quotes[:4]:
            projections.append({
                "month_index": "2026-06",
                "client_id": q.get("client_id") or "SPCC",
                "origin_port_id": "ILO",
                "destination_port_id": "MATARANI",
                "vessel_id": "TABLONES",  # COMODIN: Nave diferente a la de la cotizacion
                "quantity": 13500.0,
                "monthly_frequency": 1,
                "quote_id": q.get("name")
            })

        # Filtrar cotizaciones de TABLONES y asignarles MOQUEGUA
        tab_quotes = [q for q in quotes if "TABLONES" in (q.get("vessel_id") or q.get("name") or "").upper()]
        for q in tab_quotes[:4]:
            projections.append({
                "month_index": "2026-06",
                "client_id": q.get("client_id") or "SPCC",
                "origin_port_id": "ILO",
                "destination_port_id": "MATARANI",
                "vessel_id": "MOQUEGUA",  # COMODIN: Nave diferente a la de la cotizacion
                "quantity": 13500.0,
                "monthly_frequency": 1,
                "quote_id": q.get("name")
            })
            
        return projections
