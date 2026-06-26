import requests

url = "http://localhost:8000/api/v1/forecast/run"
payload = {
    "start_date": "2026-07-01",
    "end_date": "2026-07-31",
    "projection_lines": [
        {
            "client_id": "SPCC",
            "origin_port_id": "ILO",
            "destination_port_id": "MATARANI",
            "vessel_id": "TABLONES",
            "month_index": "2026-07",
            "quantity": 13500,
            "monthly_frequency": 1
        }
    ]
}

try:
    res = requests.post(url, json=payload)
    data = res.json()
    run_result = data["aggregated_data"]["SPCC"]["ILO-MATARANI"]["TABLONES"]["2026-07"]
    print("API returned raw inputs:")
    for k, v in run_result["raw_inputs"].items():
        if "bunker" in k:
            print(f"  {k}: {v}")
    print("\nAPI total_bunker_costs_unit:", run_result.get("total_bunker_costs_unit"))
    print("API voyage_result:", run_result.get("voyage_result"))
except Exception as e:
    print("Error calling API:", e)
