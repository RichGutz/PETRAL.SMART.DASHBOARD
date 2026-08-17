import sys
sys.path.append(r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine')
from backend.database import get_db_connection
from backend.spot_engine import calculate_multicotizador_simulation
import json

conn = get_db_connection()
cur = conn.cursor()

cur.execute("SELECT legs_data FROM contracts WHERE name = 'NEXA.ILO.CALLAO.MATARANI.ILO.2026.08.17.RG';")
row = cur.fetchone()
legs_data = row[0]

vparams = legs_data.get("vesselParams") or {
    "grt": 11365, "dwt": 16533, "dwcc": 13500, "vessel_speed": 11.0, "tce_required": 15000,
    "length": 159, "beam": 23, "draft_m": 8.2,
    "consumption_sea_ifo": 14.5, "consumption_idle_ifo": 1.5, "consumption_load_ifo": 1.5, "consumption_disch_ifo": 5.0,
    "consumption_sea_mdo": 0.1, "consumption_idle_mdo": 0.1, "consumption_load_mdo": 0.1, "consumption_disch_mdo": 0.1
}

tramos = legs_data.get("tramos", [])
puertos_config = legs_data.get("puertosConfig", [])

for tr in tramos:
    wf = float(tr.get("weather_factor", 0))
    if wf > 1.0:
        tr["weather_factor"] = wf / 100.0

for idx, tr in enumerate(tramos):
    p_orig = puertos_config[idx] if idx < len(puertos_config) else {}
    p_dest = puertos_config[idx+1] if (idx+1) < len(puertos_config) else {}
    
    tr["agency_costs_origin"] = float(p_orig.get("manual_port_cost") or 0)
    tr["agency_costs_destination"] = float(p_dest.get("manual_port_cost") or 0)
    
    tr["destination_action"] = p_dest.get("action", "NONE")
    tr["port_overhead_hours_origin"] = float(p_orig.get("time_to_count") or p_orig.get("overhead") or 0)
    tr["port_overhead_hours_dest"] = float(p_dest.get("time_to_count") or p_dest.get("overhead") or 0)
    
    if p_dest.get("action") == "CARGAR":
        tr["positioning_carga_hrs"] = float(p_dest.get("positioning") or 0)
    elif p_dest.get("action") == "DESCARGAR":
        tr["positioning_descarga_hrs"] = float(p_dest.get("positioning") or 0)

payload = {
    "vessel_params": vparams,
    "tramos": tramos,
    "puertosConfig": puertos_config,
    "bunker_price_ifo": legs_data.get("bunker_price_ifo", 1000),
    "bunker_price_mdo": legs_data.get("bunker_price_mdo", 1000),
    "client_id": "NEXA",
    "vessel_id": "TABLONES"
}

res = calculate_multicotizador_simulation(payload)
print("--- FULLY SYNCHRONIZED SIMULATION RESULT ---")
print("bunker_costs:", res["consolidated"].get("total_bunker_costs"))
print("port_costs:", res["consolidated"].get("total_port_costs"))
print("total_days:", res["consolidated"].get("total_days"))
print("gross_revenue_total:", res["consolidated"].get("gross_revenue_total"))
print("pnl_net_utility:", res["consolidated"].get("pnl_net_utility"))
