import os
import json
import sys

sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

sb = get_supabase()

print("=== 1. CLIENTS TABLE (is_prospect column check) ===")
try:
    res_c = sb.table("clients").select("*").execute()
    print("Clients count:", len(res_c.data or []))
    for c in res_c.data or []:
        print(f"  Client: {c.get('client_id')} | Name: {c.get('client_name')} | is_prospect: {c.get('is_prospect')}")
except Exception as e:
    print("Error querying clients:", e)

print("\n=== 2. ROUTES_QUOTES TABLE ===")
try:
    res_q = sb.table("routes_quotes").select("*").execute()
    print("Routes_quotes count:", len(res_q.data or []))
    for q in res_q.data or []:
        print(f"  Quote ID: {q.get('route_id') or q.get('spot_id')} | Name: {q.get('name')} | Client: {q.get('client_id')} | is_prospect: {q.get('is_prospect')}")
except Exception as e:
    print("Error querying routes_quotes:", e)

print("\n=== 3. CONTRACTS TABLE (Bunker Baseline & Time to Count) ===")
try:
    res_con = sb.table("contracts").select("*").execute()
    print("Contracts count:", len(res_con.data or []))
    for con in res_con.data or []:
        print(f"  Contract: {con.get('contract_id')} | Client: {con.get('client_id')} | Orig: {con.get('origin_port_id')} -> Dest: {con.get('destination_port_id')}")
        print(f"    IFO Baseline: {con.get('bunker_baseline_price_ifo')} | MDO Baseline: {con.get('bunker_baseline_price_mdo')}")
        print(f"    TimeToCount Carga: {con.get('time_to_count_carga_hrs')}h | TimeToCount Descarga: {con.get('time_to_count_descarga_hrs')}h")
except Exception as e:
    print("Error querying contracts:", e)

print("\n=== 4. BUNKER_PRICES TABLE ===")
try:
    res_b = sb.table("bunker_prices").select("*").execute()
    print("Bunker prices:", json.dumps(res_b.data, indent=2, default=str))
except Exception as e:
    print("Error querying bunker_prices:", e)

print("\n=== 5. PORT_COST_STATIC MUELLAJE CHECK (MEJILLONES, ILO, CALLAO, MATARANI) ===")
try:
    res_p = sb.table("port_cost_static").select("port_id, vessel_id, concept, total_cost, muellaje_cost").in_("port_id", ["MEJILLONES", "ILO", "CALLAO", "MATARANI"]).execute()
    print(f"Port cost static records found: {len(res_p.data or [])}")
    for item in (res_p.data or [])[:10]:
        print(f"  Port: {item.get('port_id')} | Vessel: {item.get('vessel_id')} | Concept: {item.get('concept')} | TotalCost: {item.get('total_cost')} | MuellajeCost: {item.get('muellaje_cost')}")
except Exception as e:
    print("Error querying port_cost_static:", e)
