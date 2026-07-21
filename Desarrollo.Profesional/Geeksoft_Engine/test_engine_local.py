import sys
from backend.spot_engine import calculate_multicotizador_simulation

# Test payload matching TABLONES ILO-MARCONA
payload = {
    "vessel_params": {
        "vessel_id": "TABLONES",
        "vessel_name": "TABLONES",
        "dwt": 16533,
        "dwcc": 13500,
        "length": 159,
        "beam": 23,
        "vessel_speed": 11.0,
        "tce_required": 15000.0,
        "consumption_sea_ifo": 14.5,
        "consumption_sea_mdo": 0.0,
        "consumption_idle_ifo": 3.5,
        "consumption_idle_mdo": 0.0,
        "consumption_load_ifo": 3.5,
        "consumption_load_mdo": 0.0,
        "consumption_disch_ifo": 5.0,
        "consumption_disch_mdo": 0.0,
        "bunker_price_ifo": 895.14,
        "bunker_price_mdo": 1460.30
    },
    "tramos": [
        {
            "type": "LADEN",
            "origin_port_id": "ILO",
            "destination_port_id": "MARCONA",
            "route_distance": 279.0,
            "weather_factor": 0.03,
            "weather_factor_laden": 0.03,
            "weather_factor_ballast": 0.03,
            "quantity": 13500.0,
            "freight_rate": 22.82,
            "origin_action": "CARGAR",
            "destination_action": "DESCARGAR",
            "contract_agreed_load_rate": 500.0,
            "contract_agreed_discharge_rate": 345.0,
            "port_overhead_hours_origin": 6.0,
            "port_overhead_hours_dest": 6.0,
            "positioning_carga_hrs": 1.0,
            "positioning_descarga_hrs": 0.0,
            "agency_costs_origin": 23000.0,
            "agency_costs_destination": 44000.0
        }
    ]
}

res = calculate_multicotizador_simulation(payload)
print("=== RESULTADO DEL MOTOR ===")
print("Consolidated:", res["consolidated"])
tr = res["tramos"][0]
print("Tramo 1 Net Income:", tr.get("net_income"))
print("Tramo 1 Bunker Costs:", tr.get("bunker_costs"))
print("Tramo 1 Port Costs:", tr.get("port_costs"))
print("Tramo 1 PnL Tramo:", tr.get("pnl_tramo"))
print("\nAUDIT TRAIL:")
for k, v in tr.get("audit_trail", {}).items():
    print(f"[{k}] => formula: {v.get('formula')} | values: {v.get('values')}")
