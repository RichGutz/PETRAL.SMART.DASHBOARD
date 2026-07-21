import requests
import json
import time

BASE_URL = "https://forecast.geeksoft.tech/api/v1/forecast"

def run_qc():
    print("Iniciando QC Loop en todas las rutas...\n")
    
    # 1. Get all routes
    print("[1] Fetching routes...")
    r = requests.get(f"{BASE_URL}/spot/list")
    if r.status_code != 200:
        print(f"Error fetching spot/list: {r.status_code}")
        return
    routes = r.json()
    print(f"Found {len(routes)} routes.\n")
    
    # 2. Get vessels
    print("[2] Fetching vessels...")
    r = requests.get(f"{BASE_URL}/vessels")
    vessels = r.json()
    print(f"Found {len(vessels)} vessels. Using the first one for simulation.\n")
    if not vessels:
        print("No vessels found")
        return
    vessel = vessels[0]

    for route in routes:
        print(f"--- Evaluando Ruta: {route.get('route_id')} ---")
        tramos_config = route.get('legs_data', {}).get('tramos', [])
        if not tramos_config:
            print("  [WARN] No legs config found. Skip.\n")
            continue
            
        payload = {
            "vessel_id": vessel["vessel_id"],
            "route_id": route["route_id"],
            "tramos": []
        }
        
        for t in tramos_config:
            leg_type = t.get('type', 'BALLAST')
            payload["tramos"].append({
                "origin_port_id": t["origin_port_id"],
                "destination_port_id": t["destination_port_id"],
                "type": leg_type,
                "quantity": 10000 if leg_type == 'LADEN' else 0,
                "freight_rate": 15 if leg_type == 'LADEN' else 0
            })
        
        print(f"  Enviando Payload con {len(payload['tramos'])} paradas...")
        
        r_sim = requests.post(f"{BASE_URL}/multicotizador/calculate", json=payload)
        if r_sim.status_code != 200:
            print(f"  [ERROR] Simulation failed: {r_sim.status_code} - {r_sim.text}")
            continue
            
        result = r_sim.json()
        cons = result.get('consolidated', {})
        
        # Extract the simulated tramos from the response
        res_tramos = result.get("tramos", [])
        
        # QC 1: Leg Count
        expected_legs = len(tramos_config)
        actual_legs = len(res_tramos)
        print(f"  QC1 [Leg Count]: Expected {expected_legs}, Actual {actual_legs} -> {'PASS' if expected_legs == actual_legs else 'FAIL'}")
        
        # QC 2: Sea Days Math (distance / (speed*24) * (1+wf))
        qc2_pass = True
        for i, tr in enumerate(res_tramos):
            dist = tr.get('distance', 0)
            wf = tr.get('weather_factor', 0.0)
            speed = vessel.get('vessel_speed', 11)
            sea_days_calc = (dist / (speed * 24)) * (1 + wf)
            actual_sea = tr.get('sea_days', 0)
            if abs(sea_days_calc - actual_sea) > 0.1:
                print(f"    Pierna {i+1} Sea Days mismatch: calc={sea_days_calc:.2f} (dist={dist}, speed={speed}, wf={wf}), actual={actual_sea:.2f}")
                qc2_pass = False
        print(f"  QC2 [Sea Days Math]: -> {'PASS' if qc2_pass else 'FAIL'}")
        
        # QC 3: Income
        qc3_pass = True
        for i, tr in enumerate(res_tramos):
            if tr.get('type') == 'LADEN':
                q = tr.get('quantity', 0)
                f = tr.get('freight_rate', 0)
                income_calc = q * f
                actual_income = tr.get('net_income', 0)
                if abs(income_calc - actual_income) > 1:
                    print(f"    Pierna {i+1} Income mismatch: calc={income_calc:.2f}, actual={actual_income:.2f}")
                    qc3_pass = False
        print(f"  QC3 [Income Math]: -> {'PASS' if qc3_pass else 'FAIL'}")
        
        # QC 4: PNL
        qc4_pass = True
        for i, tr in enumerate(res_tramos):
            income = tr.get('net_income', 0)
            bunker = tr.get('bunker_costs', 0)
            port = tr.get('port_costs', 0)
            pnl_calc = income - bunker - port
            actual_pnl = tr.get('pnl_tramo', 0)
            if abs(pnl_calc - actual_pnl) > 1:
                print(f"    Pierna {i+1} PNL mismatch: calc={pnl_calc:.2f}, actual={actual_pnl:.2f}")
                qc4_pass = False
        print(f"  QC4 [PNL Math]: -> {'PASS' if qc4_pass else 'FAIL'}\n")
        
        # QC 5: Consolidacion PNL
        tot_inc = cons.get('total_freight_revenue', 0)
        tot_bunk = cons.get('total_bunker_costs', 0)
        tot_port = cons.get('total_port_costs', 0)
        pnl = cons.get('pnl_net_utility', 0)
        
        expected_pnl = tot_inc - tot_bunk - tot_port
        if abs(expected_pnl - pnl) > 1:
            print(f"  QC5 [Consolidacion PNL]: Mismatch exp={expected_pnl:.2f}, act={pnl:.2f} -> FAIL")
        else:
            print(f"  QC5 [Consolidacion PNL]: -> PASS")
            
        print("\n")
        
if __name__ == '__main__':
    run_qc()
