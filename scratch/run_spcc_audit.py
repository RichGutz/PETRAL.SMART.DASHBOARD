import os
import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase
from backend.models.forecast_models import ForecastRequest, ProjectionLine
from backend.services.forecast_service import run_forecast_simulation
import json

def run_all_spcc_audited_routes():
    sb = get_supabase()
    quotes = sb.table('routes_quotes').select('*').execute().data
    spcc_quotes = [q for q in quotes if 'SPCC' in str(q.get('name', '')).upper() or 'SPCC' in str(q.get('client_id', '')).upper()]
    
    print(f"==========================================================================")
    print(f"   AUDITORIA MATRICIAL BENOIT BLANC: RUTAS AUDITADAS DE SPCC ({len(spcc_quotes)} RUTAS)")
    print(f"==========================================================================\n")
    
    results_summary = []
    
    for idx, q in enumerate(spcc_quotes, 1):
        q_id = q.get('id')
        q_name = q.get('name', 'SIN_NOMBRE')
        legs = q.get('legs_data') or {}
        fin = legs.get('financial_summary') or {}
        
        orig_vessel = legs.get('vessel_id') or legs.get('vesselParams', {}).get('vessel_id') or 'MOQUEGUA'
        tramos = legs.get('tramos') or []
        
        # Determinar origen y destino de la ruta
        laden_tramos = [t for t in tramos if t.get('type', '').upper() == 'LADEN']
        if laden_tramos:
            orig_p = laden_tramos[0].get('origin_port_id', 'ILO')
            dest_p = laden_tramos[-1].get('destination_port_id', 'BARQUITO')
            qty = float(laden_tramos[0].get('quantity', 10000))
        elif tramos:
            orig_p = tramos[0].get('origin_port_id', 'ILO')
            dest_p = tramos[-1].get('destination_port_id', 'BARQUITO')
            qty = 10000.0
        else:
            orig_p = 'ILO'
            dest_p = 'BARQUITO'
            qty = 10000.0

        # Correr simulación para el buque de la foto
        line = ProjectionLine(
            month_index='2026-07',
            client_id='SPCC',
            origin_port_id=orig_p,
            destination_port_id=dest_p,
            vessel_id=orig_vessel,
            quantity=qty,
            monthly_frequency=1,
            quote_id=f"QUOTE:{q_name}"
        )
        
        req = ForecastRequest(
            start_date='2026-07-01',
            end_date='2026-07-31',
            projection_lines=[line]
        )
        
        sim_res = run_forecast_simulation(req)
        agg = sim_res.get('aggregated_data', {}).get('SPCC', {})
        
        sim_data = None
        for r_k in agg:
            if orig_vessel in agg[r_k]:
                sim_data = agg[r_k][orig_vessel].get('2026-07', {})
                break
                
        snapshot_pnl = float(fin.get('voyageResultPnl', 0.0))
        snapshot_bunker = float(fin.get('grandBunkerTotal', 0.0))
        snapshot_revenue = float(fin.get('grossRevenueTotal', 0.0))
        snapshot_ports = float(fin.get('totalPortCosts', 0.0))
        snapshot_tce = float(fin.get('tceRealizado', 0.0))
        
        sim_pnl = float(sim_data.get('voyage_result', 0.0)) if sim_data else 0.0
        sim_bunker = float(sim_data.get('total_bunker_costs', 0.0)) if sim_data else 0.0
        sim_revenue = float(sim_data.get('net_income', 0.0)) if sim_data else 0.0
        sim_ports = float(sim_data.get('total_port_costs', 0.0)) if sim_data else 0.0
        sim_tce = float(sim_data.get('tce_real', 0.0)) if sim_data else 0.0
        
        delta_pnl = abs(sim_pnl - snapshot_pnl)
        is_ok = (delta_pnl < 1.0)
        status_tag = "[ OK 100% ]" if is_ok else f"[ ERROR DELTA: ${delta_pnl:.2f} ]"
        
        print(f"Ruta {idx}: {q_name}")
        print(f"  Buque Foto: {orig_vessel} | Tramo: {orig_p} -> {dest_p} | Carga: {qty:,.0f} MT")
        print(f"  - Snapshot Foto: Rev=${snapshot_revenue:,.2f} | Ports=${snapshot_ports:,.2f} | Bunker=${snapshot_bunker:,.2f} | PnL=${snapshot_pnl:,.2f} | TCE=${snapshot_tce:,.2f}")
        print(f"  - Simulador UI : Rev=${sim_revenue:,.2f} | Ports=${sim_ports:,.2f} | Bunker=${sim_bunker:,.2f} | PnL=${sim_pnl:,.2f} | TCE=${sim_tce:,.2f}")
        print(f"  - ESTADO       : {status_tag}")
        print(f"  ----------------------------------------------------------------------")
        
        results_summary.append({
            "name": q_name,
            "vessel": orig_vessel,
            "snapshot_pnl": snapshot_pnl,
            "sim_pnl": sim_pnl,
            "delta": delta_pnl,
            "status": "PASS" if is_ok else "FAIL"
        })

    print(f"\n==========================================================================")
    print(f"   RESUMEN GENERAL: {sum(1 for r in results_summary if r['status'] == 'PASS')}/{len(results_summary)} RUTAS PASARON LA PRUEBA 1:1")
    print(f"==========================================================================")

if __name__ == '__main__':
    run_all_spcc_audited_routes()
