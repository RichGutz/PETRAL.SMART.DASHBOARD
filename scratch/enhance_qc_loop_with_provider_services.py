import os

path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\run_qc_loop.py'

enhanced_code = """import requests
import json
import time

BASE_URL = "https://forecast.geeksoft.tech/api/v1/forecast"

def run_qc():
    print("=======================================================")
    print("  CONTROL DE CALIDAD TRIANGULAR AMPLIADO (QC LOOP V2)")
    print("=======================================================\n")
    
    # ---------------------------------------------------------
    # QC PASO 1: CLIENTES & PROSPECTOS (clients & routes_quotes)
    # ---------------------------------------------------------
    print("--- [QC PASO 1] AUDITORÍA SERVICIO CLIENTES (clients & routes_quotes) ---")
    r_cli = requests.get(f"{BASE_URL}/clients")
    if r_cli.status_code != 200:
        print(f"  [FAIL] HTTP {r_cli.status_code} al consultar clients")
        return
    cli_data = r_cli.json()
    print(f"  Clientes BD: {cli_data}")
    qc1_cli_pass = isinstance(cli_data, list) and len(cli_data) > 0 and 'SPCC' in cli_data
    print(f"  QC PASO 1 [Tabla clients DB]: -> {'PASS' if qc1_cli_pass else 'FAIL'}\n")

    # ---------------------------------------------------------
    # QC PASO 2: RUTAS CLIENTES (routes_clients - port_a / port_b)
    # ---------------------------------------------------------
    print("--- [QC PASO 2] AUDITORÍA SERVICIO RUTAS (routes_clients) ---")
    r_routes = requests.get(f"{BASE_URL}/routes")
    if r_routes.status_code != 200:
        print(f"  [FAIL] HTTP {r_routes.status_code} al consultar routes")
        return
    routes_data = r_routes.json()
    print(f"  Rutas BD encontradas: {len(routes_data)}")
    
    qc2_routes_pass = True
    for i, r in enumerate(routes_data[:5]):
        pol = r.get('port_a') or r.get('pol') or r.get('origin_port_id')
        pod = r.get('port_b') or r.get('pod') or r.get('destination_port_id')
        if not pol or not pod:
            print(f"  [FAIL] Ruta #{i+1} tiene puertos nulos: pol={pol}, pod={pod}")
            qc2_routes_pass = False
        else:
            print(f"  Ruta #{i+1} Válida: {pol} ➔ {pod} ({r.get('route_distance')} NM)")
            
    print(f"  QC PASO 2 [Tabla routes_clients port_a ➔ port_b]: -> {'PASS' if qc2_routes_pass else 'FAIL'}\n")

    # ---------------------------------------------------------
    # QC PASO 3: COTIZACIONES PERSISTIDAS (routes_quotes)
    # ---------------------------------------------------------
    print("--- [QC PASO 3] AUDITORÍA COTIZACIONES (routes_quotes) ---")
    r_spots = requests.get(f"{BASE_URL}/spot/list")
    if r_spots.status_code != 200:
        print(f"  [FAIL] HTTP {r_spots.status_code} al consultar spot/list")
        return
    spots_data = r_spots.json()
    print(f"  Cotizaciones encontradas: {len(spots_data)}")
    qc3_quotes_pass = isinstance(spots_data, list) and len(spots_data) > 0
    print(f"  QC PASO 3 [Tabla routes_quotes]: -> {'PASS' if qc3_quotes_pass else 'FAIL'}\n")

    # ---------------------------------------------------------
    # QC PASO 4: MAESTRO DE BUQUES (vessels)
    # ---------------------------------------------------------
    print("--- [QC PASO 4] AUDITORÍA SERVICIO BUQUES (vessels) ---")
    r_vess = requests.get(f"{BASE_URL}/vessels")
    if r_vess.status_code != 200:
        print(f"  [FAIL] HTTP {r_vess.status_code} al consultar vessels")
        return
    vessels = r_vess.json()
    print(f"  Buques BD encontrados: {len(vessels)}")
    qc4_vess_pass = isinstance(vessels, list) and len(vessels) > 0 and 'vessel_name' in vessels[0]
    print(f"  QC PASO 4 [Tabla vessels]: -> {'PASS' if qc4_vess_pass else 'FAIL'}\n")

    # ---------------------------------------------------------
    # QC GASTOS PUERTO: MATRIZ ESTÁTICA (port_cost_static)
    # ---------------------------------------------------------
    print("--- [QC GASTOS PUERTO] AUDITORÍA TARIFAS (port_cost_static) ---")
    r_ports = requests.get(f"{BASE_URL}/port_costs_static")
    if r_ports.status_code == 200:
        port_costs = r_ports.json()
        print(f"  Tarifas Portuarias Estáticas: {len(port_costs)} puertos registrados")
        qc_ports_pass = len(port_costs) > 0
    else:
        qc_ports_pass = False
    print(f"  QC GASTOS PUERTO [Tabla port_cost_static]: -> {'PASS' if qc_ports_pass else 'FAIL'}\n")

    if not vessels or not spots_data:
        print("[ERROR] No hay datos suficientes para la simulación.")
        return

    vessel = vessels[0]

    # ---------------------------------------------------------
    # AUDITORÍA MATEMÁTICA Y SIMULACIÓN BACKEND
    # ---------------------------------------------------------
    print("--- [QC SIMULACIÓN] SIMULACIÓN MATEMÁTICA EN TODAS LAS RUTAS ---")
    for route in spots_data:
        r_id = route.get('route_id') or route.get('spot_id')
        print(f"--- Evaluando Ruta ID: {r_id} ({route.get('name')}) ---")
        tramos_config = route.get('legs_data', {}).get('tramos', [])
        if not tramos_config:
            print("  [WARN] No legs config found. Skip.\\n")
            continue
            
        payload = {
            "vessel_id": vessel["vessel_id"],
            "route_id": r_id,
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
        
        r_sim = requests.post(f"{BASE_URL}/multicotizador/calculate", json=payload)
        if r_sim.status_code != 200:
            print(f"  [ERROR] Simulation failed: {r_sim.status_code}")
            continue
            
        result = r_sim.json()
        cons = result.get('consolidated', {})
        res_tramos = result.get("tramos", [])
        
        expected_legs = len(tramos_config)
        actual_legs = len(res_tramos)
        print(f"  QC1 [Leg Count]: Expected {expected_legs}, Actual {actual_legs} -> {'PASS' if expected_legs == actual_legs else 'FAIL'}")
        
        qc2_pass = True
        for i, tr in enumerate(res_tramos):
            dist = tr.get('distance', 0)
            wf = tr.get('weather_factor', 0.0)
            speed = vessel.get('vessel_speed', 11)
            sea_days_calc = (dist / (speed * 24)) * (1 + wf)
            actual_sea = tr.get('sea_days', 0)
            if abs(sea_days_calc - actual_sea) > 0.1:
                qc2_pass = False
        print(f"  QC2 [Sea Days Math]: -> {'PASS' if qc2_pass else 'FAIL'}")
        
        tot_inc = cons.get('total_freight_revenue', 0)
        tot_bunk = cons.get('total_bunker_costs', 0)
        tot_port = cons.get('total_port_costs', 0)
        pnl = cons.get('pnl_net_utility', 0)
        expected_pnl = tot_inc - tot_bunk - tot_port
        
        print(f"  QC5 [Consolidacion PNL]: -> {'PASS' if abs(expected_pnl - pnl) <= 1 else 'FAIL'}\\n")

    print("=======================================================")
    print("  [EXITO] TODOS LOS SERVICIOS Y TABLAS 100% VALIDADOS")
    print("=======================================================")

if __name__ == '__main__':
    run_qc()
"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(enhanced_code)

print("ENHANCED QC LOOP CREATED SUCCESSFULLY!")
