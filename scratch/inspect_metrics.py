import requests

load_url = "https://forecast.geeksoft.tech/api/v1/forecast/load/513f2ea9-0aa4-4ee6-b420-22820e477245"
f_data = requests.get(load_url).json()
lines = f_data.get("projection_lines", [])

for l in lines:
    if l.get("client") == "NEXA":
        l["route_id"] = "SPOT-NEXA.ILO.CALLAO.MEJILLONES.ILO"
    elif l.get("client") == "SPCC":
        l["route_id"] = "QUOTE:8:ILO.MATARANI.MEJILLONES.ILO"

sim_payload = {
    "start_date": f_data.get("start_date", "2027-01-01"),
    "end_date": f_data.get("end_date", "2027-12-31"),
    "projection_lines": lines
}

r = requests.post("https://forecast.geeksoft.tech/api/v1/forecast/run", json=sim_payload)
ag = r.json().get("aggregated_data", {})

for client, routes in ag.items():
    for route_key, vessels in routes.items():
        for vessel_name, months in vessels.items():
            for m, metrics in list(months.items())[:1]:
                print(f"Client: {client} | Route Key: {route_key} | vessel: {vessel_name}")
                print(f"  route_name: '{metrics.get('route_name')}'")
                print(f"  raw_inputs: {metrics.get('raw_inputs')}")
