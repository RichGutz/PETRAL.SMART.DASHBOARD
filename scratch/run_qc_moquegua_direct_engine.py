import json
import requests
import sys

# Agregar Geeksoft_Engine al path de python para importar el motor directamente
sys.path.append("C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine")

from backend.database import get_supabase
from backend.spot_engine import calculate_multicotizador_simulation
from backend.services.forecast_service import calculate_detailed_port_costs

sb = get_supabase()

# 1. Obtener los 5 contratos de Supabase
res_c = sb.table("contracts").select("*").execute()
contracts = res_c.data

# 2. Obtener datos de MOQUEGUA
res_v = sb.table("vessels").select("*").eq("vessel_id", "MOQUEGUA").execute()
vessel = res_v.data[0]

# 3. Obtener port costs matrix, agency matrix, distances, ports
pc_matrix = sb.table("port_costs_matrix").select("*").execute().data
ag_matrix = sb.table("port_cost_static").select("*").execute().data
distances = sb.table("distances").select("*").execute().data
ports = {p["port_id"]: p for p in sb.table("ports").select("*").execute().data}

results = []

print("=========================================================================")
print("  EVALUACIÓN DIRECTA DEL MOTOR MULTICOTIZADOR — BUQUE MOQUEGUA")
print("=========================================================================\n")

for c in contracts:
    c_name = c.get("name")
    client_id = c.get("client_id")
    ld = c.get("legs_data") or {}
    tramos = ld.get("tramos") or []

    if not tramos:
        continue

    # Prepara vesel params con bunker baseline
    v_params = dict(vessel)
    v_params["bunker_price_ifo"] = float(ld.get("baf_ifo_base") or ld.get("bunker_price_ifo") or 967.26)
    v_params["bunker_price_mdo"] = float(ld.get("baf_mdo_base") or ld.get("bunker_price_mdo") or 1528.26)

    # Calcular tramos enriquecidos
    processed_tramos = []
    tot_port_costs = 0.0

    for tr in tramos:
        tr_dict = dict(tr)
        orig = tr.get("origin_port_id")
        dest = tr.get("destination_port_id")
        t_type = tr.get("type", "BALLAST")
        qty = float(tr.get("quantity", 0))

        # Distancia
        match_dist = next((d for d in distances if (d.get("port_a") == orig and d.get("port_b") == dest) or (d.get("port_a") == dest and d.get("port_b") == orig)), None)
        if match_dist:
            tr_dict["route_distance"] = float(match_dist.get("route_distance", tr.get("route_distance", 0)))
            tr_dict["weather_factor"] = float(match_dist.get("weather_factor_laden" if t_type == "LADEN" else "weather_factor_ballast", 3.0))

        # Puertos Config
        po_c = 6.0 if t_type == "LADEN" else 0.0
        po_d = 12.0 if t_type == "LADEN" else 0.0
        tr_dict["port_overhead_hours_origin"] = po_c
        tr_dict["port_overhead_hours_dest"] = po_d

        # Costos portuarios
        c_cost = calculate_detailed_port_costs(client_id, orig, 'CARGA', 'MOQUEGUA', pc_matrix, ag_matrix, 'AUTOMATIC', vparams=v_params, quantity=qty, contract=c, ports_db=ports)
        d_cost = calculate_detailed_port_costs(client_id, dest, 'DESCARGAR', 'MOQUEGUA', pc_matrix, ag_matrix, 'AUTOMATIC', vparams=v_params, quantity=qty, contract=c, ports_db=ports)

        p_orig = float(c_cost.get("total", 0.0))
        p_dest = float(d_cost.get("total", 0.0))

        tr_dict["port_cost_origin"] = p_orig
        tr_dict["port_cost_dest"] = p_dest
        tot_port_costs += (p_orig + p_dest)

        processed_tramos.append(tr_dict)

    # Correr simulación matemática oficial
    sim_payload = {
        "vessel_params": v_params,
        "tramos": processed_tramos,
        "address_commission_pct": float(ld.get("addressCommPct", 0.0)),
        "broker_commission_pct": float(ld.get("brokerCommPct", 0.0))
    }
    sim_res = calculate_multicotizador_simulation(sim_payload)
    cons = sim_res.get("consolidated") or {}

    laden_tr = next((tr for tr in tramos if tr.get("type") == "LADEN"), {})
    qty = laden_tr.get("quantity", 0)
    fr_rate = laden_tr.get("freight_rate", 0)
    tot_rev = cons.get("total_freight_revenue", 0) or (qty * fr_rate)
    tot_bunk = cons.get("total_bunker_costs", 0)
    tot_days = cons.get("total_voyage_days", 0)
    pnl = cons.get("pnl_net_utility", 0)
    tce = cons.get("tce_usd_day", 0)

    results.append({
        "name": c_name,
        "client": client_id,
        "vessel": "MOQUEGUA",
        "quantity": qty,
        "freight_rate": fr_rate,
        "revenue": tot_rev,
        "port_costs": tot_port_costs,
        "bunker_cost": tot_bunk,
        "total_days": tot_days,
        "pnl": pnl,
        "tce": tce
    })

print(json.dumps(results, indent=2))
with open("scratch/moquegua_qc_results_direct.json", "w") as f:
    json.dump(results, f, indent=2)
