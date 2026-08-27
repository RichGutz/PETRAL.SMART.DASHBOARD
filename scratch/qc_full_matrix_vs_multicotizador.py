import os
import sys
from dotenv import load_dotenv

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

engine_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine"
sys.path.insert(0, engine_dir)
load_dotenv(os.path.join(engine_dir, ".env"))

from backend.database import get_supabase
from backend.services.forecast_service import get_cached_masters, run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine
from backend.spot_engine import calculate_multicotizador_simulation

def run_qc():
    sb = get_supabase()
    masters = get_cached_masters(sb)
    quotes = masters.get("routes_quotes", [])
    
    print("=" * 140)
    print(f"🕵️ AUDITORIA QC TOTAL: MULTICOTIZADOR VS MATRIZ FINANCIERA ({len(quotes)} RUTAS EN TOTAL)")
    print("=" * 140)
    
    discrepancies = []
    
    for idx, q in enumerate(quotes, 1):
        name = q.get("name") or "SIN_NOMBRE"
        client = q.get("client_id") or "CLIENTE"
        legs_data = q.get("legs_data") or {}
        vparams = legs_data.get("vesselParams") or {}
        vessel_id = vparams.get("vessel_id", "MOQUEGUA")
        fin_summary = legs_data.get("financial_summary") or {}
        
        tramos = legs_data.get("tramos", [])
        if not tramos:
            continue
            
        orig_port = tramos[0].get("origin_port_id", "")
        dest_port = tramos[-1].get("destination_port_id", "")
        quantity = tramos[0].get("quantity", 10000) or 10000
        
        # 1. Simulación directa Multicotizador Engine
        payload = {
            "vessel_params": vparams or masters["vessels"][0],
            "tramos": tramos,
            "port_cost_mode": "static",
            "client_id": client,
            "vessel_id": vessel_id
        }
        spot_res = calculate_multicotizador_simulation(payload)
        consolidated = spot_res.get("consolidated", {})
        
        bunker_engine = consolidated.get("total_bunker_costs", 0.0)
        bunker_foto = fin_summary.get("grandBunkerTotal", None)
        port_engine = consolidated.get("total_port_costs", 0.0)
        port_foto = fin_summary.get("totalPortCosts", None)
        pnl_engine = consolidated.get("pl_vs_req", 0.0)
        pnl_foto = fin_summary.get("voyageResultPnl", None)
        
        # 2. Simulación vía Matriz (run_forecast_simulation)
        req = ForecastRequest(
            start_date="2027-01-01",
            end_date="2027-01-31",
            projection_lines=[
                ProjectionLine(
                    client_id=client,
                    origin_port_id=orig_port,
                    destination_port_id=dest_port,
                    vessel_id=vessel_id,
                    month_index="2027-01",
                    quantity=quantity,
                    monthly_frequency=1,
                    quote_id=name
                )
            ],
            port_cost_mode="static"
        )
        
        try:
            res_sim = run_forecast_simulation(req)
            agg = res_sim.get("aggregated_data", {}).get(client, {})
            
            matriz_bunker = None
            matriz_port = None
            matriz_pnl = None
            matriz_revenue = None
            matriz_hire = None
            
            for r_k, v_map in agg.items():
                for v_k, m_map in v_map.items():
                    m_data = m_map.get("2027-01", {})
                    if m_data:
                        matriz_bunker = m_data.get("total_bunker_costs")
                        matriz_port = m_data.get("total_port_costs")
                        matriz_pnl = m_data.get("pl_vs_required") or m_data.get("voyage_result")
                        matriz_revenue = m_data.get("gross_revenue_total") or m_data.get("net_income")
                        matriz_hire = m_data.get("hire_cost")
                        break
            
            bunker_expected = bunker_foto if bunker_foto is not None else bunker_engine
            delta_bunker = (matriz_bunker - bunker_expected) if (matriz_bunker is not None and bunker_expected is not None) else 0.0
            
            status = "✅ 100% OK" if abs(delta_bunker) < 1.0 else f"🚨 DELTA BUNKER: ${delta_bunker:,.2f}"
            
            if abs(delta_bunker) >= 1.0:
                discrepancies.append({
                    "name": name,
                    "client": client,
                    "vessel": vessel_id,
                    "bunker_foto": bunker_foto,
                    "bunker_engine": bunker_engine,
                    "matriz_bunker": matriz_bunker,
                    "delta": delta_bunker
                })
                
            print(f"[{idx:02d}] {name[:48]:<48} | {vessel_id:<8} | Foto: ${str(round(bunker_foto,2) if bunker_foto else 'N/A'):<10} | Matriz: ${str(round(matriz_bunker,2) if matriz_bunker else 'N/A'):<10} | {status}")
        except Exception as e:
            print(f"[{idx:02d}] {name[:48]:<48} | ERROR: {str(e)[:50]}")

    print("\n" + "=" * 140)
    print(f"🏁 RESULTADO AUDITORIA QC: {len(discrepancies)} discrepancias de {len(quotes)} rutas analizadas.")
    print("=" * 140)
    
    if discrepancies:
        print("\n🚨 DETALLE DE LAS RUTAS CON DISCREPANCIA EN BUNKER:")
        for d in discrepancies:
            print(f"• {d['name']} (Cliente: {d['client']} | Buque: {d['vessel']}):")
            print(f"    - Bunker Foto (Snapshot): ${d['bunker_foto']}")
            print(f"    - Bunker Engine Directo:  ${d['bunker_engine']}")
            print(f"    - Bunker Matriz (Actual): ${d['matriz_bunker']}")
            print(f"    - DIFERENCIA / DESCALCE:  ${d['delta']:,.2f}")

if __name__ == "__main__":
    run_qc()
