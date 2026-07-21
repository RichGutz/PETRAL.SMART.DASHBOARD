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
            "freight_rate": 20
        }
    ]
}

try:
    res = requests.post('http://localhost:8000/api/v1/forecast/multicotizador/calculate', json=payload)
    print("Status:", res.status_code)
    print(json.dumps(res.json(), indent=2))
except Exception as e:
    print("Error:", e)
