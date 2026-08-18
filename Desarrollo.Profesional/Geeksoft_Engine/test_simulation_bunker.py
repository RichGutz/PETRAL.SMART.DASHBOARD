import urllib.request
import json

payload = {
    "start_date": "2026-07-01",
    "end_date": "2026-12-31",
    "port_cost_mode": "static",
    "projection_lines": [
        {
            "month_index": 0,
            "client_id": "NEXA",
            "origin_port_id": "CALLAO",
            "destination_port_id": "MARCONA",
            "vessel_id": "TABLONES",
            "quantity": 13500,
            "monthly_frequency": 1,
            "custom_tariff": 34.74,
            "quote_id": "NEXA.ILO.CALLAO.MARCONA.ILO.2026 (IZ)"
        }
    ]
}

url = "https://forecast.geeksoft.tech/api/v1/forecast/run"
req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print("=== SIMULATION RESULT ===")
        agg = res.get("aggregated_data", {})
        for c, routes in agg.items():
            print(f"Client: {c}")
            for r, vessels in routes.items():
                print(f"  Route: {r}")
                for v, months in vessels.items():
                    print(f"    Vessel: {v}")
                    for m, metrics in months.items():
                        print(f"      Month: {m}")
                        print(f"        bunker_costs: {metrics.get('bunker_costs')}")
                        print(f"        bunker_price_ifo: {metrics.get('bunker_price_ifo')}")
                        print(f"        bunker_price_mdo: {metrics.get('bunker_price_mdo')}")
                        print(f"        bunker_ifo_tonnage: {metrics.get('bunker_ifo_tonnage')}")
                        print(f"        bunker_mdo_tonnage: {metrics.get('bunker_mdo_tonnage')}")
                        print(f"        audit_trail: {metrics.get('audit_trail')}")
except Exception as e:
    print(f"Error: {e}")
