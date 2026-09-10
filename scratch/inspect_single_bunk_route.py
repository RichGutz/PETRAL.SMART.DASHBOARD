import requests
import json

BASE_URL = "https://forecast.geeksoft.tech/api/v1"

def inspect_single_route():
    r = requests.get(f"{BASE_URL}/forecast/spot/list")
    spots = r.json()
    for s in spots:
        if "BUNKER TABLONES" in s.get("name", ""):
            print(f"=== DETALLE DE RUTA: {s.get('name')} ===")
            print(f"client_id: {s.get('client_id')}")
            print(f"origin_port_id: {s.get('origin_port_id')}, dest: {s.get('destination_port_id')}")
            legs_data = s.get("legs_data") or {}
            print(f"puertosConfig: {json.dumps(legs_data.get('puertosConfig'), indent=2)}")
            print(f"tramos: {json.dumps(legs_data.get('tramos'), indent=2)}")
            break

if __name__ == "__main__":
    inspect_single_route()
