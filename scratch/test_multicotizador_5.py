import requests
import json

payload = {
    "vessel_id": "MOQUEGUA",
    "port_cost_mode": "static",
    "tramos": [
        {
            "origin_port_id": "ILO",
            "destination_port_id": "MARCONA",
            "quantity": 13500,
            "freight_rate": 20,
            "type": "LADEN",
            "origin_action": "CARGAR",
            "destination_action": "DESCARGAR"
        }
    ]
}

try:
    res = requests.post('http://localhost:8000/api/v1/forecast/multicotizador/calculate', json=payload)
    print("Status:", res.status_code)
    data = res.json()
    print("Port costs tramo 0:", data['tramos'][0]['port_costs'])
    print("Port costs formula:", data['tramos'][0]['audit_trail']['port_costs'])
except Exception as e:
    print("Error:", e)
