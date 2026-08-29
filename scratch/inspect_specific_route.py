import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase
import json

sb = get_supabase()

# Search across routes_quotes and routes_clients
print("=== BUSCANDO EN routes_quotes ===")
res_quotes = sb.table("routes_quotes").select("*").ilike("name", "%SPCC.ILO.MARCONA.CALLAO.ILO%").execute()
print(f"Encontrados en routes_quotes: {len(res_quotes.data)}")

for row in res_quotes.data:
    print("\n" + "="*70)
    print("NAME:", row.get("name"))
    print("DESCRIPTION:", row.get("description"))
    print("CLIENT_ID:", row.get("client_id"))
    legs = row.get("legs_data") or {}
    print("LEGS_DATA KEYS:", list(legs.keys()))
    
    # Check puertosConfig
    p_config = legs.get("puertosConfig") or []
    print(f"puertosConfig count: {len(p_config)}")
    for idx, p in enumerate(p_config):
        action = p.get("action")
        dem_days = p.get("demurrage_days")
        tc = p.get("time_to_count")
        pos = p.get("positioning")
        print(f"  Puerto [{idx}] Action={action} | Demurrage Days='{dem_days}' | T.Count={tc} | Pos={pos}")
        
    # Check tramos
    tramos = legs.get("tramos") or []
    print(f"tramos count: {len(tramos)}")
    for idx, t in enumerate(tramos):
        orig = t.get("origin_port_id")
        dest = t.get("destination_port_id")
        t_type = t.get("type")
        q = t.get("quantity")
        f = t.get("freight_rate")
        print(f"  Tramo [{idx}] {orig} -> {dest} ({t_type}) | Q={q} | F={f}")
        
    # Check demurrage_rates
    dem_rates = legs.get("demurrage_rates")
    print("Demurrage Rates Map:", dem_rates)
    
    # Check financial_summary
    fin = legs.get("financial_summary") or {}
    print("Financial Summary Demurrage Rate:", fin.get("demurrageRate"))

print("\n=== BUSCANDO EN routes_clients ===")
res_clients = sb.table("routes_clients").select("*").ilike("name", "%SPCC.ILO.MARCONA.CALLAO.ILO%").execute()
print(f"Encontrados en routes_clients: {len(res_clients.data)}")
for row in res_clients.data:
    print("NAME in routes_clients:", row.get("name"))
    legs = row.get("legs_data") or {}
    p_config = legs.get("puertosConfig") or []
    for idx, p in enumerate(p_config):
        print(f"  Puerto [{idx}] Action={p.get('action')} | Demurrage Days='{p.get('demurrage_days')}'")
