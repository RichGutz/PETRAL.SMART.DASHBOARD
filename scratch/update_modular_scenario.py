import requests
import json

load_url = "https://forecast.geeksoft.tech/api/v1/forecast/load/513f2ea9-0aa4-4ee6-b420-22820e477245"
r = requests.get(load_url)
f_data = r.json()

lines = f_data.get("projection_lines", [])

for l in lines:
    client = l.get("client")
    if client == "NEXA":
        l["route_id"] = "SPOT-NEXA.ILO.CALLAO.MEJILLONES.ILO"
        l["origin_port_id"] = "ILO"
        l["destination_port_id"] = "ILO"
    elif client == "SPCC":
        l["route_id"] = "QUOTE:8:ILO.MATARANI.MEJILLONES.ILO"
        l["origin_port_id"] = "ILO"
        l["destination_port_id"] = "ILO"

save_payload = {
    "id": f_data["id"],
    "name": f_data["name"],
    "user_id": f_data.get("user_id", "Rich.Gutz"),
    "start_date": f_data.get("start_date", "2027-01-01"),
    "end_date": f_data.get("end_date", "2027-12-31"),
    "projection_lines": lines
}

save_r = requests.post("https://forecast.geeksoft.tech/api/v1/forecast/save", json=save_payload)
print("Save result:", save_r.status_code)

# Run simulation
sim_r = requests.post("https://forecast.geeksoft.tech/api/v1/forecast/run", json={"start_date": "2027-01-01", "end_date": "2027-12-31", "projection_lines": lines})
ag = sim_r.json().get("aggregated_data", {})
print("\n--- AGGREGATED DATA KEYS AFTER MULTI-LEG ROUTE_ID UPDATE ---")
for client, routes in ag.items():
    print(f"Client: {client}")
    for route_name, vessels in routes.items():
        print(f"   Route key in aggregated_data: '{route_name}'")
        for vessel_name in vessels.keys():
            print(f"      Vessel: '{vessel_name}'")
