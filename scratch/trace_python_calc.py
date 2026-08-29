import os, sys, json
from dotenv import load_dotenv
engine_dir = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine'
sys.path.insert(0, engine_dir)
load_dotenv(os.path.join(engine_dir, '.env'))

from backend.database import get_supabase
from backend.services.forecast_service import get_cached_masters
from backend.spot_engine import calculate_multicotizador_simulation

with open(r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\scratch\all_quotes.json', 'r', encoding='utf-8') as f:
    quotes = json.load(f)

q = next(x for x in quotes if 'SPCC.ILO.MEJILLONES.ILO.2025-2027 COA MOQUEGUA' in x['name'])
legs = q['legs_data']

payload = {
    "vessel_params": legs.get("vesselParams"),
    "tramos": legs.get("tramos"),
    "port_cost_mode": "static",
    "client_id": "SPCC",
    "vessel_id": "MOQUEGUA"
}

res = calculate_multicotizador_simulation(payload)
c = res.get("consolidated", {})
print("=== CALCULO SPOT_ENGINE PYTHON ===")
print("bunker_ifo_tonnage:", c.get("bunker_ifo_tonnage"))
print("bunker_mdo_tonnage:", c.get("bunker_mdo_tonnage"))
print("total_bunker_costs:", c.get("total_bunker_costs"))
print("total_sea_days:", c.get("total_sea_days"))
print("total_port_days:", c.get("total_port_days"))
print("total_days:", c.get("total_days"))

for leg_k, leg_v in res.get("legs_summary", {}).items():
    print(f"Leg {leg_k}:")
    print("  bunker_ifo:", leg_v.get("bunker_ifo"))
    print("  bunker_mdo:", leg_v.get("bunker_mdo"))
    print("  bunker_costs:", leg_v.get("bunker_costs"))
    print("  audit_trail bunker_costs:", leg_v.get("audit_trail", {}).get("bunker_costs", {}).get("values"))
