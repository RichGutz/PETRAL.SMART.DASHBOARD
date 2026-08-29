import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase
import json

def run_dm_qc():
    print("=" * 80)
    print("BATERIA QC BENOIT BLANC: RECUPERACION DE DEMORAS ORIGINALES (MODO 'O') EN MULTICOTIZADOR")
    print("=" * 80)
    
    sb = get_supabase()
    res = sb.table("routes_quotes").select("*").ilike("name", "%DM%").execute()
    quotes = res.data
    print(f"Total rutas DM encontradas en BD: {len(quotes)}\n")
    
    assert len(quotes) > 0, "No se encontraron rutas DM en Supabase"
    
    passed = 0
    total = len(quotes)
    
    for q in quotes:
        name = q.get("name")
        legs = q.get("legs_data") or {}
        fin = legs.get("financial_summary") or {}
        expected_total_dem = float(fin.get("totalDemurrageDays") or 0.0)
        
        puertos_cfg = legs.get("puertosConfig") or []
        calc_tramos = fin.get("calculatedTramos") or legs.get("calculatedTramos") or []
        
        # Emulacion de la logica de handleLoadRoute de MultiCotizadorExcel.tsx:
        orig_days_map = {}
        for idx, p in enumerate(puertos_cfg):
            recovered = ""
            if p.get("demurrage_days") not in (None, "") and float(p.get("demurrage_days", 0)) >= 0:
                recovered = p.get("demurrage_days")
            elif idx == 0:
                d0 = fin.get("demurrageDays0")
                if d0 not in (None, ""): recovered = d0
            elif idx > 0 and idx - 1 < len(calc_tramos):
                tr_dem = calc_tramos[idx - 1].get("demurrage_days")
                if tr_dem not in (None, ""): recovered = tr_dem
                
            orig_days_map[idx] = float(recovered) if recovered not in (None, "") else 0.0
            
        sum_recovered = sum(orig_days_map.values())
        diff = abs(sum_recovered - expected_total_dem)
        
        print(f"RUTA: {name}")
        print(f"  -> Días Recuperados por Puerto: {orig_days_map}")
        print(f"  -> Total Recuperado: {sum_recovered:.2f} d | Total Grabado Snapshot: {expected_total_dem:.2f} d | Diff: {diff:.4f}")
        
        assert diff < 0.05, f"Discrepancia en {name}: {sum_recovered} vs {expected_total_dem}"
        print(f"  [OK] Conforme 1:1 con el Snapshot Original.\n")
        passed += 1
        
    print("=" * 80)
    print(f"RESULTADO QC: {passed}/{total} RUTAS DM RECUPERADAS CON EXITO (100% DE EFICACIA)")
    print("=" * 80)

if __name__ == "__main__":
    run_dm_qc()
