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
data = r.json()
print("Keys:", list(data.keys()) if isinstance(data, dict) else "Not dict")
if isinstance(data, dict):
    clients = data.get("clients", {})
    print("Clients:", list(clients.keys()))
    spcc = clients.get("SPCC", {})
    print("SPCC routes:", list(spcc.keys()))
    for rk, rv in spcc.items():
        print(f"Route: {rk}, vessels: {list(rv.keys())}")
        for vk, vv in rv.items():
            print(f"  Vessel: {vk}")
            months = vv.get("months", {})
            print(f"  Months (2027-01):", months.get("2027-01"))
            totals = vv.get("totals", {})
            print(f"  Totals:", totals)
