import requests
import json

BASE_URL = "https://forecast.geeksoft.tech/api/v1"

def inspect_bunkering_routes():
    print("[+] Obteniendo rutas desde /forecast/spot/list ...")
    r = requests.get(f"{BASE_URL}/forecast/spot/list")
    if r.status_code != 200:
        print(f"Error {r.status_code}: {r.text}")
        return
    
    spots = r.json()
    print(f"[+] Total de rutas/cotizaciones cargadas: {len(spots)}")
    
    bunkering_routes = []
    for s in spots:
        name = s.get("name", "")
        legs_data = s.get("legs_data") or {}
        puertos_cfg = legs_data.get("puertosConfig", [])
        tramos = legs_data.get("tramos", [])
        
        has_bunkering_action = any(p.get("action") == "BUNKERING" or p.get("operation") == "BUNKERING" for p in puertos_cfg)
        has_callao_bunk = any((p.get("port_id") == "CALLAO" or p.get("port") == "CALLAO") and (p.get("action") == "BUNKERING" or p.get("operation") == "BUNKERING") for p in puertos_cfg)
        
        # Check tramos
        tramos_bunk = any("BUNKER" in str(t).upper() or t.get("destination_action") == "BUNKERING" for t in tramos)
        
        if has_bunkering_action or has_callao_bunk or tramos_bunk or "BUNKER" in name.upper() or "CALLAO" in name.upper():
            bunkering_routes.append({
                "id": s.get("spot_id") or s.get("id"),
                "name": name,
                "client_id": s.get("client_id"),
                "has_callao_bunk": has_callao_bunk,
                "has_bunkering_action": has_bunkering_action,
                "puertosConfig": [{"port": p.get("port_id") or p.get("port"), "action": p.get("action")} for p in puertos_cfg],
                "tramos_count": len(tramos)
            })
            
    print(f"\n[+] Rutas identificadas con Bunkering / Callao ({len(bunkering_routes)}):")
    for br in bunkering_routes:
        print(f" - ID: {br['id']} | Cliente: {br['client_id']} | Nombre: '{br['name']}'")
        print(f"   Puertos: {br['puertosConfig']}")

if __name__ == "__main__":
    inspect_bunkering_routes()
