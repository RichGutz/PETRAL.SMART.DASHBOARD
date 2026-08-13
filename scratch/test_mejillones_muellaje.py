import requests
import json

url = "https://forecast.geeksoft.tech/api/v1/forecast/multicotizador/calculate"

payload = {
    "client_id": "SPCC",
    "vessel_id": "MOQUEGUA",
    "bunker_price_ifo": 657.0,
    "bunker_price_mdo": 1528.0,
    "port_cost_mode": "MATRIX",
    "comments": "Prueba de Muellaje Mejillones 33,333 USD",
    "demurrage_rate_pd": 15000,
    "tramos": [
        {
            "origin_port_id": "CALLAO",
            "destination_port_id": "MEJILLONES",
            "type": "LADEN",
            "quantity": 13500,
            "destination_quantity": 13500,
            "freight_rate": 30.0,
            "port_delay_hours_loading": 0,
            "port_delay_hours_discharging": 0,
            "route_distance": 580,
            "weather_factor": 0.05,
            "origin_action": "CARGAR",
            "destination_action": "DESCARGAR",
            "custom_load_rate": 500,
            "custom_discharge_rate": 500,
            "refacturar_muellaje": True,
            "muellaje_cost_dest": 33333.0
        }
    ]
}

print("Enviando petición de prueba con MEJILLONES y Muellaje = $33,333...")
resp = requests.post(url, json=payload)
print(f"HTTP Status: {resp.status_code}")

if resp.status_code == 200:
    data = resp.json()
    consolidated = data.get("consolidated", {})
    tramos = data.get("tramos", [])
    
    print("\n==========================================================================")
    print("   RESULTADOS DE PRUEBA MEJILLONES EN VIVO (API VPS)")
    print("==========================================================================")
    print(f"Flete Total (Gross Revenue)      : ${consolidated.get('total_freight_revenue', 0):,.2f}")
    print(f"Refacturación Muellaje (USD)    : ${consolidated.get('refacturacion_muellaje', 0):,.2f}")
    print(f"Gastos de Puerto (Port Costs)    : ${consolidated.get('total_port_costs', 0):,.2f}")
    print(f"Costo Búnker (Bunker Costs)      : ${consolidated.get('total_bunker_costs', 0):,.2f}")
    print(f"Resultado Neto (PnL Utility)     : ${consolidated.get('pnl_net_utility', 0):,.2f}")
    print(f"TCE Realizado ($/día)           : ${consolidated.get('tce_real', 0):,.2f}/d")
    print("==========================================================================\n")
    
    tr0 = tramos[0] if tramos else {}
    print("Detalle Tramo 1 (Callao -> Mejillones):")
    print(f"  • Origen (Callao)              : Costo ${tr0.get('agency_costs_origin', 0):,.2f}")
    print(f"  • Destino (Mejillones)         : Costo ${tr0.get('agency_costs_destination', 0):,.2f}")
    print(f"  • Detalle Destino Mejillones    : {tr0.get('agency_costs_destination_details')}")
else:
    print(f"Error: {resp.text}")
