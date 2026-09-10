import requests
import json

payload = {
    "start_date": "2027-01-01",
    "end_date": "2027-12-31",
    "projection_lines": [
        {
            "month_index": "2027-01",
            "client_id": "SPCC",
            "origin_port_id": "ILO",
            "destination_port_id": "MARCONA",
            "vessel_id": "TABLONES",
            "quantity": 13500,
            "monthly_frequency": 1,
            "quote_id": "SPCC.ILO.MARCONA.CALLAO.ILO.2026 DM MOQUEGUA"
        }
    ],
    "port_cost_mode": "static"
}

r = requests.post("https://forecast.geeksoft.tech/api/v1/forecast/run", json=payload)
print("Status:", r.status_code)
print("Full response JSON:")
print(json.dumps(r.json(), indent=2))
