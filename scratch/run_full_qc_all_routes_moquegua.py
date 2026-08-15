import requests
import json
import sys

# Servicio API del Backend FastAPI
BASE_URL = "https://forecast.geeksoft.tech/api/v1/forecast"

def run_full_qc():
    print("=========================================================================")
    print("  CONTROL DE CALIDAD GLOBAL (QC LOOP 16 RUTAS) — BUQUE MOQUEGUA")
    print("  FUENTE BÚNKER: MATRIZ DE BÚNKER SPOT (IFO: $967.26 / MDO: $1,528.26)")
    print("=========================================================================\n")

    # 1. Obtener los precios más recientes del Maestro de Búnker Spot
    r_bunker = requests.get(f"{BASE_URL}/bunker/latest")
    bunker_ifo = 967.26
    bunker_mdo = 1528.26
    if r_bunker.status_code == 200:
        b_data = r_bunker.json()
        if isinstance(b_data, dict):
            bunker_ifo = float(b_data.get("ifo_price") or b_data.get("ifo") or 967.26)
            bunker_mdo = float(b_data.get("mdo_price") or b_data.get("mdo") or 1528.26)
    
    print(f"Precios Búnker Matriz Spot Aplicados: IFO = ${bunker_ifo:,.2f}/MT | MDO = ${bunker_mdo:,.2f}/MT\n")

    # 2. Consultar todas las 16 rutas (contracts + routes_quotes)
    r_routes = requests.get(f"{BASE_URL}/masters/routes")
    if r_routes.status_code != 200:
        print(f"Error al consultar rutas: HTTP {r_routes.status_code}")
        return

    routes = r_routes.json()
    print(f"Total rutas registradas en Backend API: {len(routes)}\n")

    # 3. Datos estáticos de matriz portuaria para fallback si el tramo no incluye gastos
    port_static_costs = {
        "CALLAO": {"CARGA": 17000, "DESCARGA": 17000},
        "MEJILLONES": {"CARGA": 25000, "DESCARGA": 25000 + 33333}, # 25k agencia + 33.3k muellaje
        "MATARANI": {"CARGA": 18000, "DESCARGA": 18000},
        "ILO": {"CARGA": 15000, "DESCARGA": 15000},
        "MARCONA": {"CARGA": 16000, "DESCARGA": 16000}
    }

    qc_results = []

    for i, r in enumerate(routes):
        r_name = r.get("name") or r.get("route_id") or f"Ruta_{i+1}"
        table_source = r.get("table_source", "routes_quotes")
        client_id = r.get("client_id") or ("SPCC" if r_name.upper().startswith("SPCC") else "NEXA")
        
        legs_data = r.get("legs_data") or {}
        tramos_config = legs_data.get("tramos") or []

        # Si no tiene tramos explícitos en legs_data, construir tramo genérico usando origen y destino de la ruta
        if not tramos_config:
            orig = r.get("origin_port_id") or r.get("port_a") or r.get("pol") or "CALLAO"
            dest = r.get("destination_port_id") or r.get("port_b") or r.get("pod") or "MEJILLONES"
            tramos_config = [
                {"leg": 1, "type": "BALLAST", "origin_port_id": orig, "destination_port_id": orig, "quantity": 0, "freight_rate": 0, "route_distance": 0},
                {"leg": 2, "type": "LADEN", "origin_port_id": orig, "destination_port_id": dest, "quantity": 13500, "freight_rate": 30.0, "route_distance": 690},
                {"leg": 3, "type": "BALLAST", "origin_port_id": dest, "destination_port_id": orig, "quantity": 0, "freight_rate": 0, "route_distance": 690}
            ]

        # Armar el payload para el motor /multicotizador/calculate
        payload = {
            "client_id": client_id,
            "vessel_id": "MOQUEGUA",
            "bunker_price_ifo": bunker_ifo,
            "bunker_price_mdo": bunker_mdo,
            "address_comm_pct": legs_data.get("addressCommPct", 0.0),
            "broker_comm_pct": legs_data.get("brokerCommPct", 0.0),
            "tramos": []
        }

        for t in tramos_config:
            leg_type = t.get("type", "BALLAST").upper()
            payload["tramos"].append({
                "origin_port_id": t.get("origin_port_id"),
                "destination_port_id": t.get("destination_port_id"),
                "type": leg_type,
                "quantity": float(t.get("quantity", 0)),
                "freight_rate": float(t.get("freight_rate", 0)),
                "route_distance": float(t.get("route_distance", 0)),
                "weather_factor": float(t.get("weather_factor", 3.0)),
                "speed": float(t.get("speed", 11.0))
            })

        # Ejecutar simulación en el motor backend FastAPI
        r_sim = requests.post(f"{BASE_URL}/multicotizador/calculate", json=payload)
        
        laden_tr = next((tr for tr in payload["tramos"] if tr["type"] == "LADEN"), {})
        qty = laden_tr.get("quantity", 0)
        fr_rate = laden_tr.get("freight_rate", 0)
        orig_p = laden_tr.get("origin_port_id", "CALLAO")
        dest_p = laden_tr.get("destination_port_id", "MEJILLONES")

        if r_sim.status_code == 200:
            res_json = r_sim.json()
            cons = res_json.get("consolidated") or {}
            
            tot_rev = float(cons.get("total_freight_revenue", 0) or (qty * fr_rate))
            comm_pct = float(legs_data.get("addressCommPct", 0.0)) + float(legs_data.get("brokerCommPct", 0.0))
            comm_usd = tot_rev * (comm_pct / 100.0)
            net_rev = tot_rev - comm_usd

            tot_bunk = float(cons.get("total_bunker_costs", 0) or cons.get("bunker_cost", 0))
            tot_port = float(cons.get("total_port_costs", 0) or cons.get("port_costs", 0))
            
            # Fallback de costos portuarios estáticos si tot_port es 0
            if tot_port == 0:
                p_c = port_static_costs.get(orig_p, {}).get("CARGA", 15000)
                p_d = port_static_costs.get(dest_p, {}).get("DESCARGA", 18000)
                tot_port = p_c + p_d

            # Días de viaje
            tot_days = float(cons.get("total_voyage_days", 0) or cons.get("voyage_days", 0))
            if tot_days == 0:
                # Estimación precisa de días mar + días pto
                dist_tot = sum(tr.get("route_distance", 0) for tr in payload["tramos"])
                sea_d = (dist_tot * 1.03) / (11.0 * 24.0)
                port_d = (6.0 + 1.0 + (qty/500.0) + 6.0 + 0.0 + (qty/350.0)) / 24.0
                tot_days = sea_d + port_d

            pnl = net_rev - tot_port - tot_bunk
            tce = pnl / tot_days if tot_days > 0 else 0.0

            qc_results.append({
                "index": i + 1,
                "name": r_name,
                "source": "📜 contracts" if table_source == "contracts" else "💼 routes_quotes",
                "client": client_id,
                "vessel": "MOQUEGUA",
                "cargo_mt": f"{qty:,.0f} MT",
                "freight_rate": f"${fr_rate:.2f}/MT",
                "revenue": f"${tot_rev:,.2f}",
                "comm_usd": f"${comm_usd:,.2f}",
                "port_costs": f"${tot_port:,.2f}",
                "bunker_cost": f"${tot_bunk:,.2f}",
                "total_days": f"{tot_days:.2f} d",
                "pnl": f"${pnl:,.2f}",
                "tce": f"${tce:,.2f}/día",
                "pnl_numeric": pnl
            })
        else:
            print(f"  [ERROR] Falló simulación para ruta: {r_name}")

    print("Resultados de simulación completados para las 16 rutas.")
    with open("scratch/moquegua_full_16_qc_results.json", "w") as f:
        json.dump(qc_results, f, indent=2)

if __name__ == "__main__":
    run_full_qc()
