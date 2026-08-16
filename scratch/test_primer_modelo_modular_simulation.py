import sys
import os
import json

# Agregar path de Geeksoft_Engine al path de python
engine_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine"
if engine_dir not in sys.path:
    sys.path.insert(0, engine_dir)

from backend.models.forecast_models import ForecastRequest
from backend.services.forecast_service import run_forecast_simulation

with open(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\scratch\primer_modelo_modular.json", "r", encoding="utf-8") as f:
    sc_data = json.load(f)

req = ForecastRequest(
    start_date=sc_data["start_date"],
    end_date=sc_data["end_date"],
    port_cost_mode="static",
    projection_lines=sc_data["projection_lines"]
)

print(f"Calculando simulacion directamente en proceso para '{sc_data['name']}'...")
res = run_forecast_simulation(req)
agg = res.get("aggregated_data", {})

print("\n--- RESULTADOS DE SIMULACIÓN PARA PRIMER.MODELO.MODULAR ---")
print(f"Clientes en resultado: {list(agg.keys())}")
for client, r_map in agg.items():
    for route, v_map in r_map.items():
        for vessel, m_map in v_map.items():
            print(f"  - Client: {client} | Route: {route} | Vessel: {vessel} | Meses: {len(m_map)}")
            for month, m_val in m_map.items():
                print(f"    * [{month}] Gross=${m_val.get('net_income'):,.2f} | Port=${m_val.get('total_port_costs'):,.2f} | Bunker=${m_val.get('total_bunker_costs'):,.2f} | PnL=${m_val.get('voyage_result'):,.2f}")
