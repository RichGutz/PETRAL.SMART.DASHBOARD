import requests
import json

BASE_URL = "https://forecast.geeksoft.tech/api/v1/forecast"

def run_qc_moquegua():
    print("=========================================================================")
    print("  LOOP DE CONTROL DE CALIDAD (QC) — EVALUACIÓN FINANCIERA BUQUE MOQUEGUA")
    print("=========================================================================\n")

    # 1. Obtener las rutas de contratos desde la API
    resp = requests.get(f"{BASE_URL}/masters/routes")
    if resp.status_code != 200:
        print(f"Error al obtener rutas: HTTP {resp.status_code}")
        return

    all_routes = resp.json()
    contract_routes = [r for r in all_routes if r.get("is_contract") or r.get("table_source") == "contracts"]

    print(f"Rutas de contratos encontradas en Supabase DB: {len(contract_routes)}\n")

    results = []

    for route in contract_routes:
        r_name = route.get("name")
        client_id = route.get("client_id")
        legs_data = route.get("legs_data") or {}
        tramos_config = legs_data.get("tramos") or []

        if not tramos_config:
            continue

        # Preparar payload para /multicotizador/calculate con buque MOQUEGUA
        payload = {
            "client_id": client_id,
            "vessel_id": "MOQUEGUA",
            "bunker_price_ifo": legs_data.get("baf_ifo_base") or legs_data.get("bunker_price_ifo") or 967.26,
            "bunker_price_mdo": legs_data.get("baf_mdo_base") or legs_data.get("bunker_price_mdo") or 1528.26,
            "address_comm_pct": legs_data.get("addressCommPct", 0.0),
            "broker_comm_pct": legs_data.get("brokerCommPct", 0.0),
            "tramos": []
        }

        # Armar tramos
        for t in tramos_config:
            payload["tramos"].append({
                "origin_port_id": t.get("origin_port_id"),
                "destination_port_id": t.get("destination_port_id"),
                "type": t.get("type", "BALLAST"),
                "quantity": float(t.get("quantity", 0)),
                "freight_rate": float(t.get("freight_rate", 0)),
                "route_distance": float(t.get("route_distance", 0)),
                "weather_factor": float(t.get("weather_factor", 3.0)),
                "speed": float(t.get("speed", 11.0))
            })

        # Evaluar en el motor backend FastAPI
        r_calc = requests.post(f"{BASE_URL}/multicotizador/calculate", json=payload)
        
        if r_calc.status_code == 200:
            res_data = r_calc.json()
            cons = res_data.get("consolidated") or {}
            
            # Si el endpoint devuelve consolidado
            tot_revenue = float(cons.get("total_freight_revenue", 0) or cons.get("freight_revenue", 0))
            tot_port = float(cons.get("total_port_costs", 0) or cons.get("port_costs", 0))
            tot_bunker = float(cons.get("total_bunker_costs", 0) or cons.get("bunker_cost", 0))
            pnl = float(cons.get("pnl_net_utility", 0) or cons.get("net_profit", 0))
            tce = float(cons.get("tce_usd_day", 0) or cons.get("tce", 0))
            total_days = float(cons.get("total_voyage_days", 0) or cons.get("voyage_days", 0))
            
            # Buscar el tramo de carga
            laden_tr = next((tr for tr in tramos_config if tr.get("type") == "LADEN"), {})
            qty = laden_tr.get("quantity", 0)
            fr_rate = laden_tr.get("freight_rate", 0)
            
            # Si tot_revenue es 0 pero hay qty y fr_rate, calcular ingreso manual
            if tot_revenue == 0 and qty > 0 and fr_rate > 0:
                tot_revenue = qty * fr_rate

            results.append({
                "name": r_name,
                "client": client_id,
                "vessel": "MOQUEGUA",
                "quantity": qty,
                "freight_rate": fr_rate,
                "revenue": tot_revenue,
                "port_costs": tot_port,
                "bunker_cost": tot_bunker,
                "total_days": total_days,
                "pnl": pnl if pnl != 0 else (tot_revenue - tot_port - tot_bunker),
                "tce": tce if tce != 0 else ((tot_revenue - tot_port - tot_bunker) / total_days if total_days > 0 else 0)
            })
        else:
            print(f"Error calculando ruta {r_name}: HTTP {r_calc.status_code}")

    print("Resultados de simulación completados.")
    with open("scratch/moquegua_qc_results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    run_qc_moquegua()
