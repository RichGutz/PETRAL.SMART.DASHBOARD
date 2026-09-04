import os
import sys
import json
import re

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def audit_consolidated_pdf():
    print("=" * 80)
    print("🕵️  PROTOCOLO BENOIT BLANC — AUDITORIA FORENSE DE CUADRE 1:1 CON MATRIZ PETRAL")
    print("=" * 80)

    supabase = get_supabase()
    scenarios_resp = supabase.table("commercial_forecasts").select("id, name, start_date, end_date, projection_lines").execute()
    scenarios = scenarios_resp.data or []
    
    target_sc = None
    for sc in scenarios:
        if "2027" in sc.get("name", ""):
            target_sc = sc
            break
            
    if not target_sc and len(scenarios) > 0:
        target_sc = scenarios[0]
        
    print(f"\n📁 Escenario Auditado: {target_sc['name']} (ID: {target_sc['id']})")
    
    raw_lines = target_sc.get("projection_lines") or []
    proj_lines = [ProjectionLine(**line) for line in raw_lines]
    sim_req = ForecastRequest(
        start_date=target_sc.get("start_date") or "2027-01-01",
        end_date=target_sc.get("end_date") or "2027-12-31",
        projection_lines=proj_lines
    )
    sim_res = run_forecast_simulation(sim_req)
    agg = sim_res.get("aggregated_data", {})
    
    foreign_ports = [
        'BARQUITO', 'MEJILLONES', 'ANTOFAGASTA', 'QUINTERO', 'PATILLOS', 
        'VENTANAS', 'SAN VICENTE', 'ARICA', 'IQUIQUE', 'CORONEL', 
        'COQUIMBO', 'VALPARAISO', 'HUASCO', 'MICHILLA', 'GUAYACAN', 
        'CALETA COLOSO', 'TOCOPILLA', 'PUERTO ANGAMOS', 'LIRQUEN', 'SAN ANTONIO',
        'GUAYAQUIL', 'ESMERALDAS', 'MANTA', 'BUENAVENTURA', 'LAZARO CARDENAS'
    ]
    
    routes_map = {}
    vessel_details_map = {}
    tot_vol = 0
    tot_trips = 0
    cab_trips = 0
    exp_trips = 0
    cab_vol = 0
    exp_vol = 0
    tot_margin = 0
    tot_days = 0
    
    for client, routes in agg.items():
        for r_name, vessels in routes.items():
            for v_name, months in vessels.items():
                clean_vessel = v_name.replace("_", " ").upper()
                v_tm = 0
                v_trips = 0
                v_pnl = 0
                v_days = 0
                last_unit = 13500
                
                for m_k, m_val in months.items():
                    freq = float(m_val.get("freq", 0) or 0)
                    if freq <= 0:
                        continue
                    unit = float(m_val.get("carga_unit", 13500) or 13500)
                    dur = float(m_val.get("total_duration", 0) or 0)
                    tce_req = float(m_val.get("tce_required_unit", 13000) or 13000)
                    tce_cost = tce_req * dur
                    raw_pnl = float(m_val.get("voyage_result", 0) or 0)
                    pnl = raw_pnl - tce_cost
                    
                    v_trips += freq
                    v_tm += (unit * freq)
                    v_pnl += pnl
                    v_days += dur
                    last_unit = unit
                    
                if v_trips <= 0:
                    continue
                    
                r_upper = r_name.upper()
                is_exp = any(p in r_upper for p in foreign_ports) or 'EXP' in r_upper or 'CHILE' in r_upper
                r_key = f"{client.upper()}__{r_upper}"
                v_key = f"{r_key}__{clean_vessel}"
                
                vessel_details_map[v_key] = {
                    "vessel": clean_vessel,
                    "route": r_upper,
                    "annual_tons": v_tm,
                    "annual_trips": v_trips,
                    "pnl_per_trip": v_pnl / v_trips if v_trips > 0 else 0,
                    "total_gross_margin": v_pnl,
                    "days_occupation": v_days
                }
                
                if r_key not in routes_map:
                    routes_map[r_key] = {
                        "client": client.upper(),
                        "route": r_upper,
                        "vessel": clean_vessel,
                        "is_export": is_exp,
                        "annual_tons": v_tm,
                        "full_load": v_tm / v_trips if v_trips > 0 else last_unit,
                        "annual_trips": v_trips,
                        "pnl_per_trip": v_pnl / v_trips if v_trips > 0 else 0,
                        "total_gross_margin": v_pnl,
                        "days_occupation": v_days,
                        "vessels": [clean_vessel]
                    }
                else:
                    routes_map[r_key]["annual_tons"] += v_tm
                    routes_map[r_key]["annual_trips"] += v_trips
                    routes_map[r_key]["total_gross_margin"] += v_pnl
                    routes_map[r_key]["days_occupation"] += v_days
                    if clean_vessel not in routes_map[r_key]["vessels"]:
                        routes_map[r_key]["vessels"].append(clean_vessel)
                        routes_map[r_key]["vessel"] += f", {clean_vessel}"
                    routes_map[r_key]["pnl_per_trip"] = routes_map[r_key]["total_gross_margin"] / routes_map[r_key]["annual_trips"]

    for r_k, r in routes_map.items():
        tot_vol += r["annual_tons"]
        tot_trips += r["annual_trips"]
        tot_margin += r["total_gross_margin"]
        tot_days += r["days_occupation"]
        if r["is_export"]:
            exp_trips += r["annual_trips"]
            exp_vol += r["annual_tons"]
        else:
            cab_trips += r["annual_trips"]
            cab_vol += r["annual_tons"]

    print("\n📊 1. TABLA MACRO (CABOTAJE VS EXPORTACION):")
    print(f"   - Viajes Cabotaje:   {cab_trips:3.0f} vjs | {cab_vol:10,.0f} TM | {(cab_vol/tot_vol*100 if tot_vol>0 else 0):6.2f}%")
    print(f"   - Viajes Exportacion:{exp_trips:3.0f} vjs | {exp_vol:10,.0f} TM | {(exp_vol/tot_vol*100 if tot_vol>0 else 0):6.2f}%")
    print(f"   - TOTAL GENERAL:     {tot_trips:3.0f} vjs | {tot_vol:10,.0f} TM | 100.00%")

    print("\n📊 2. TABLA DETALLADA POR RUTA & BUQUE (ESPEJO 1:1 MATRIZ PETRAL):")
    print("-" * 105)
    print(f"{'RUTA / BUQUE':<30} | {'TM ANUAL':<10} | {'VIAJES':<6} | {'P/L X VJ':<12} | {'TOTAL MARGIN':<14} | {'DIAS':<6}")
    print("-" * 105)
    for r_k, r in routes_map.items():
        print(f"▶ {r['route']:<28} | {r['annual_tons']:10,.0f} | {r['annual_trips']:6.0f} | {r['pnl_per_trip']:12,.0f} | {r['total_gross_margin']:14,.0f} | {r['days_occupation']:6.1f}")
        for v_name in r["vessels"]:
            v_k = f"{r_k}__{v_name}"
            v_data = vessel_details_map.get(v_k)
            if v_data:
                print(f"   ↳ {v_data['vessel']:<25} | {v_data['annual_tons']:10,.0f} | {v_data['annual_trips']:6.0f} | {v_data['pnl_per_trip']:12,.0f} | {v_data['total_gross_margin']:14,.0f} | {v_data['days_occupation']:6.1f}")
    print("-" * 105)
    print(f"{'TOTAL GENERAL':<30} | {tot_vol:10,.0f} | {tot_trips:6.0f} | {'-':<12} | {tot_margin:14,.0f} | {tot_days:6.1f}")
    print("-" * 105)

    # Validar que TABLONES en ILO-MARCONA dé en el orden de 123,127
    tablones_marcona = [v for k, v in vessel_details_map.items() if "MARCONA" in k and "TABLONES" in k]
    if tablones_marcona:
        pnl_val = tablones_marcona[0]["pnl_per_trip"]
        print(f"\n🎯 Verificación de TABLONES ILO-MARCONA: ${pnl_val:,.2f}/vj (Esperado: ~$123,127)")
        assert 120000 <= pnl_val <= 130000, f"Error: TABLONES MARCONA fuera de rango esperado ($123,127): {pnl_val}"

    # Validar MOQUEGUA en ILO-MARCONA dé en el orden de 156,562
    moquegua_marcona = [v for k, v in vessel_details_map.items() if "MARCONA" in k and "MOQUEGUA" in k]
    if moquegua_marcona:
        pnl_val = moquegua_marcona[0]["pnl_per_trip"]
        print(f"🎯 Verificación de MOQUEGUA ILO-MARCONA: ${pnl_val:,.2f}/vj (Esperado: ~$156,562)")
        assert 150000 <= pnl_val <= 165000, f"Error: MOQUEGUA MARCONA fuera de rango esperado ($156,562): {pnl_val}"

    frontend_path = os.path.join(CURRENT_DIR, "..", "Geeksoft_Frontend", "src", "pages", "Masters", "FinancialProjectionsMaster_V2.tsx")
    with open(frontend_path, "r", encoding="utf-8") as f:
        src_code = f.read()

    dollar_matches = re.findall(r'\$\$\{', src_code)
    courier_matches = re.findall(r'Courier New', src_code, re.IGNORECASE)

    print("\n🔍 3. VERIFICACION DE ESTANDAR DE DISENO & EXPORTACION PDF:")
    print(f"   - Ocurrencias de simbolo '$' antes de variables numericas: {len(dollar_matches)}")
    print(f"   - Ocurrencias de fuente monospace 'Courier New':         {len(courier_matches)}")
    
    assert len(dollar_matches) == 0, f"ERROR: Se encontraron {len(dollar_matches)} ocurrencias de prefijo '$' en el componente!"
    assert len(courier_matches) == 0, f"ERROR: Se encontraron {len(courier_matches)} ocurrencias de 'Courier New'!"
    
    print("\n✅ TODAS LAS PRUEBAS PERICIALES DEL CUADRE 1:1 PASARON EXITOSAMENTE.")
    print("=" * 80)

if __name__ == "__main__":
    audit_consolidated_pdf()
