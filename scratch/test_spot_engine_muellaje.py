from backend.spot_engine import calculate_multicotizador_simulation

payload = {
    "vessel_id": "TABLONES",
    "bunker_price_ifo": 967.26,
    "bunker_price_mdo": 1528.26,
    "port_cost_mode": "STATIC",
    "tramos": [
        {
            "type": "BALLAST",
            "origin_port_id": "ILO",
            "destination_port_id": "MEJILLONES",
            "agency_costs_origin": 23000,
            "agency_costs_destination": 67833,
            "agency_costs_origin_details": {
                "total_cost": 23000,
                "breakdown": {"loading_master": 0, "muellaje": 0, "other": 0, "MAIN": 23000}
            },
            "agency_costs_destination_details": {
                "total_cost": 67833,
                "breakdown": {"MAIN": 32000, "loading_master": 2500, "muellaje": 33333, "other": 0}
            },
            "refacturar_muellaje": True
        }
    ]
}

res = calculate_multicotizador_simulation(payload)
tr0 = res["tramos"][0]
consolidated = res["consolidated"]

print("==========================================================================")
print("TEST SPOT ENGINE MUELLAJE EXTRACTION RESULT")
print("==========================================================================")
print(f"muellaje_cost_origin: ${tr0.get('muellaje_cost_origin'):,.2f}")
print(f"muellaje_cost_dest  : ${tr0.get('muellaje_cost_dest'):,.2f}")
print(f"refacturacion_muellaje total: ${consolidated.get('refacturacion_muellaje'):,.2f}")
print("==========================================================================")

assert tr0.get('muellaje_cost_dest') == 33333.0, f"Error: {tr0.get('muellaje_cost_dest')}"
assert consolidated.get('refacturacion_muellaje') == 33333.0, f"Error: {consolidated.get('refacturacion_muellaje')}"
print("ALL ASSERTS PASSED CLEANLY WITH CODE 0!")
