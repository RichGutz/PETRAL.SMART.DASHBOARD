"""
Test rápido: verificar si Pydantic copia el dict (referencia rota)
y si la inyección de agency_costs realmente llega al payload.
"""
import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.models.forecast_models import SpotCalculationRequest
import json

# Simular el payload que manda el frontend
raw_payload = {
    "vessel_id": "MOQUEGUA",
    "legs": {
        "positioning": {
            "route_distance": 200,
            "weather_factor": 0.05,
            "label": "ILO -> CALLAO",
            "origin_port_id": "ILO",
            "destination_port_id": "CALLAO",
            "quantity": 0,
            "freight_rate": 0
        },
        "laden": {
            "route_distance": 800,
            "weather_factor": 0.08,
            "label": "CALLAO -> MEJILLONES",
            "origin_port_id": "CALLAO",
            "destination_port_id": "MEJILLONES",
            "quantity": 5000,
            "freight_rate": 20
        },
        "return": {
            "route_distance": 500,
            "weather_factor": 0.05,
            "label": "MEJILLONES -> ILO",
            "origin_port_id": "MEJILLONES",
            "destination_port_id": "ILO",
            "quantity": 0,
            "freight_rate": 0
        }
    }
}

# Parsear con Pydantic
request = SpotCalculationRequest(**raw_payload)

print("ANTES de inyectar:")
print(f"laden ref id: {id(request.legs['laden'])}")
print(f"laden content: {request.legs['laden']}")

# Simular la inyeccion del router
if request.legs.get("laden"):
    laden_leg = request.legs["laden"]
    print(f"\nladen_leg ref id: {id(laden_leg)}")
    laden_leg["agency_costs_origin"] = 99999
    laden_leg["agency_costs_destination"] = 88888

print("\nDESPUES de inyectar (via laden_leg variable):")
print(f"laden_leg: {laden_leg}")

print("\nDESPUES de inyectar (via request.legs['laden']):")
print(f"request.legs['laden']: {request.legs['laden']}")

print("\n¿Son la misma referencia?", laden_leg is request.legs["laden"])

# Ahora probar el payload construido
payload = {
    "vessel_params": {"vessel_speed": 11},
    "legs": request.legs
}
print("\nPAYLOAD final legs.laden:")
print(payload["legs"]["laden"])
print("agency_costs_origin en payload:", payload["legs"]["laden"].get("agency_costs_origin"))
