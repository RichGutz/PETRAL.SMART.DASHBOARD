import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase
import json

sb = get_supabase()
res = sb.table("routes_quotes").select("*").ilike("name", "%DM%").execute()
print(f"Total rutas con DM encontradas: {len(res.data)}")

for row in res.data:
    name = row.get("name")
    legs = row.get("legs_data") or {}
    fin = legs.get("financial_summary") or {}
    calc_tramos = fin.get("calculatedTramos") or legs.get("calculatedTramos") or []
    puertos_cfg = legs.get("puertosConfig") or []
    
    print("\n-------------------------------------------------------------")
    print(f"RUTA: {name}")
    print(f"  financial_summary.totalDemurrageDays: {fin.get('totalDemurrageDays')}")
    print(f"  financial_summary.demurrageRevenue: {fin.get('demurrageRevenue')}")
    
    for idx, p in enumerate(puertos_cfg):
        p_dem = p.get("demurrage_days")
        tr_dem = calc_tramos[idx-1].get("demurrage_days") if (idx > 0 and idx - 1 < len(calc_tramos)) else None
        print(f"  Puerto [{idx}] {p.get('action')}: puertosConfig.demurrage_days='{p_dem}' | calc_tramos.demurrage_days='{tr_dem}'")
