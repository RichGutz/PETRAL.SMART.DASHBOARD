"""
Test end-to-end: simula exactamente lo que hace el endpoint /spot/calculate
para verificar que agency_costs lleguen al spot_engine y al resultado final.
"""
import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase
from backend.spot_engine import calculate_spot_multileg

sb = get_supabase()

vessel_id = "MOQUEGUA"

# 1. Fetch Vessel
v_res = sb.table("vessels").select("*").eq("vessel_id", vessel_id).execute()
vessel_params = v_res.data[0]
print(f"Vessel encontrado: {vessel_params.get('vessel_id')}")

# 2. Fetch Agency Matrix
agency_res = sb.table("agency_matrix").select("*").execute()
agency_data = agency_res.data

def get_agency_cost(target_port, target_op, vessel):
    for a in agency_data:
        if a.get("client_id") == "DEFAULT" and a.get("port_id") == target_port and a.get("operation_type") == target_op and a.get("vessel_id", "DEFAULT") == "DEFAULT":
            return float(a.get("cost", 15000))
    return 15000.0

# Simular legs del frontend (CALLAO -> MEJILLONES como laden)
legs = {
    "positioning": {
        "route_distance": 200,
        "weather_factor": 0.05,
        "origin_port_id": "ILO",
        "destination_port_id": "CALLAO",
        "label": "ILO -> CALLAO",
        "quantity": 0,
        "freight_rate": 0
    },
    "laden": {
        "route_distance": 800,
        "weather_factor": 0.08,
        "origin_port_id": "CALLAO",
        "destination_port_id": "MEJILLONES",
        "label": "CALLAO -> MEJILLONES",
        "quantity": 5000,
        "freight_rate": 20
    },
    "return": {
        "route_distance": 500,
        "weather_factor": 0.05,
        "origin_port_id": "MEJILLONES",
        "destination_port_id": "ILO",
        "label": "MEJILLONES -> ILO",
        "quantity": 0,
        "freight_rate": 0
    }
}

# 3. Inject agency costs
if legs.get("laden"):
    laden_leg = legs["laden"]
    orig_port = laden_leg.get("origin_port_id")
    dest_port = laden_leg.get("destination_port_id")
    laden_leg["agency_costs_origin"] = get_agency_cost(orig_port, 'CARGA', vessel_id)
    laden_leg["agency_costs_destination"] = get_agency_cost(dest_port, 'DESCARGA', vessel_id)
    print(f"\nPort Costs inyectados:")
    print(f"  origin ({orig_port}/CARGA): ${laden_leg['agency_costs_origin']:,.0f}")
    print(f"  dest   ({dest_port}/DESCARGA): ${laden_leg['agency_costs_destination']:,.0f}")

# 4. Build payload y calcular
payload = {"vessel_params": vessel_params, "legs": legs}
result = calculate_spot_multileg(payload)

print(f"\n=== RESULTADO FINAL ===")
print(f"total_port_costs : ${result['consolidated']['total_port_costs']:,.2f}")
print(f"total_bunker_costs: ${result['consolidated']['total_bunker_costs']:,.2f}")
print(f"total_freight_rev: ${result['consolidated']['total_freight_revenue']:,.2f}")
print(f"pnl_net_utility  : ${result['consolidated']['pnl_net_utility']:,.2f}")
print(f"tce_real         : ${result['consolidated']['tce_real']:,.2f}/dia")
print(f"\nPort costs audit: {result['legs_summary']['laden']['audit_trail'].get('port_costs')}")
