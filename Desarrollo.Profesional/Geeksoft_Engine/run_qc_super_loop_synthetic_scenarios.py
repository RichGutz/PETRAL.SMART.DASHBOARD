"""
SUPER LOOP QC MÁXIMO DE ESCENARIOS SINTÉTICOS: RUTAS INDIVIDUALES EN BD vs JSON MATRIZ FINANCIERA
Auditor: Detective Benoit Blanc
Fecha: 09/09/2026
"""
import os
import sys
import json
from dotenv import load_dotenv

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.append(CURRENT_DIR)

# Load environment
load_dotenv(os.path.join(CURRENT_DIR, '.env'))

from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation, clear_forecast_cache
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def run_synthetic_scenarios_super_loop():
    clear_forecast_cache()
    supabase = get_supabase()
    res = supabase.table("routes_quotes").select("*").execute()
    quotes = res.data or []
    
    print("\n" + "=" * 110)
    print(f"🕵️‍♂️ INICIANDO SUPER LOOP QC FORENSE DE ESCENARIOS SINTÉTICOS: {len(quotes)} RUTAS EN BD vs JSON MATRIZ")
    print("=" * 110)

    test_month = "2027-01"
    exact_count = 0
    minor_delta_count = 0
    failed_count = 0
    skipped_count = 0

    discrepancies_report = []

    for idx, quote in enumerate(quotes, 1):
        q_name = quote.get("name") or f"Quote_{idx}"
        q_id = quote.get("id")
        legs_data = quote.get("legs_data") or {}
        fin_summary = legs_data.get("financial_summary") or quote.get("financial_summary") or {}
        
        # Validación de integridad mínima
        if not legs_data.get("tramos") and not fin_summary:
            print(f"[{idx:02d}/{len(quotes):02d}] ⏭️ OMITIDO: '{q_name}' (Sin snapshot ni tramos grabados)")
            skipped_count += 1
            continue

        # Extracción de parámetros individuales de la ruta
        vessel_id = legs_data.get("vesselId") or legs_data.get("vessel_id") or "MOQUEGUA"
        client_id = quote.get("client_id") or legs_data.get("client_id") or "SPCC"
        if not client_id and "NEXA" in q_name.upper(): client_id = "NEXA"
        elif not client_id: client_id = "SPCC"

        # Puertos
        puertos_cfg = legs_data.get("puertosConfig") or []
        if puertos_cfg:
            orig_p = puertos_cfg[0].get("port_id") or "ILO"
            dest_p = puertos_cfg[-1].get("port_id") or "MATARANI"
        else:
            orig_p = "ILO"
            dest_p = "MATARANI"

        q_val = float(fin_summary.get("totalQuantity") or legs_data.get("cargoQuantity") or 13500)
        
        # 1. GENERACIÓN DEL ESCENARIO SINTÉTICO EN LA MATRIZ (Snapshot Fiel 1:1)
        line = ProjectionLine(
            month_index=test_month,
            client_id=client_id,
            origin_port_id=orig_p,
            destination_port_id=dest_p,
            vessel_id=vessel_id,
            quantity=q_val,
            monthly_frequency=1,
            quote_id=q_name  # Inyección por nombre unívoco de cotización
        )

        forecast_req = ForecastRequest(
            start_date="2027-01-01",
            end_date="2027-01-31",
            projection_lines=[line],
            port_cost_mode="DETAILED"
        )

        forecast_res = run_forecast_simulation(forecast_req)
        agg_data = forecast_res.get("aggregated_data", {})

        # Extracción del nodo de simulación JSON generado por la Matriz
        m_data = None
        for c_k, r_map in agg_data.items():
            for r_k, v_map in r_map.items():
                for v_k, m_map in v_map.items():
                    if test_month in m_map:
                        m_data = m_map[test_month]
                        break

        if not m_data:
            print(f"[{idx:02d}/{len(quotes):02d}] ❌ ERROR: '{q_name}' no generó datos en el JSON de la Matriz.")
            failed_count += 1
            discrepancies_report.append({
                "index": idx,
                "quote_name": q_name,
                "error": "No data generated in aggregated_data"
            })
            continue

        # 2. MÉTRICAS INDIVIDUALES ESPERADAS (SNAPSHOT DEL MULTICOTIZADOR)
        exp_freight = float(fin_summary.get("totalFreight") or 0.0)
        exp_demurrage = float(fin_summary.get("demurrageRevenue") or 0.0)
        exp_dockage = float(fin_summary.get("refacturacionMuellaje") or 0.0)
        exp_gross = float(fin_summary.get("totalGrossRevenue") or (exp_freight + exp_demurrage + exp_dockage))
        exp_comm = float(fin_summary.get("totalCommissions") or 0.0)
        exp_net = float(fin_summary.get("netFreightRevenue") or (exp_gross - exp_comm))
        exp_bunker = float(fin_summary.get("grandBunkerTotal") or 0.0)
        exp_port = float(fin_summary.get("totalPortCosts") or 0.0)
        exp_days = float(fin_summary.get("totalDays") or 0.0)
        exp_pnl = float(fin_summary.get("voyageResult") or (exp_net - exp_port - exp_bunker))
        exp_tce = float(fin_summary.get("tceDaily") or (exp_pnl / exp_days if exp_days > 0 else 0.0))

        # 3. MÉTRICAS EXTRAÍDAS DEL JSON DE LA MATRIZ
        m_freight = float(m_data.get("freight_revenue") or (m_data.get("carga_unit", q_val) * m_data.get("flete_unit", 0)))
        m_demurrage = float(m_data.get("demurrage_revenue") or 0.0)
        m_dockage = float(m_data.get("dockage_revenue") or m_data.get("refacturacion_muellaje") or 0.0)
        m_gross = float(m_data.get("gross_revenue_total") or m_data.get("gross_revenue") or 0.0)
        m_comm = float(m_data.get("total_commissions") or m_data.get("commissions_cost") or 0.0)
        m_net = float(m_data.get("net_income") or (m_gross - m_comm))
        m_bunker = float(m_data.get("total_bunker_costs") or m_data.get("bunker_costs") or 0.0)
        m_port = float(m_data.get("total_port_costs") or m_data.get("port_costs") or 0.0)
        m_days = float(m_data.get("total_duration") or 0.0)
        m_pnl = float(m_data.get("voyage_result") or 0.0)
        m_tce = float(m_data.get("tce_real") or 0.0)

        # 4. CÁLCULO DE DELTAS PERICIALES
        d_gross = abs(m_gross - exp_gross)
        d_net = abs(m_net - exp_net)
        d_bunker = abs(m_bunker - exp_bunker)
        d_port = abs(m_port - exp_port)
        d_days = abs(m_days - exp_days)
        d_pnl = abs(m_pnl - exp_pnl)

        # Cuadratura estricta ($0.00 / <0.01)
        if d_pnl < 0.01 and d_gross < 0.01 and d_net < 0.01 and d_bunker < 0.01 and d_port < 0.01 and d_days < 0.01:
            exact_count += 1
            status_tag = "🟢 EXACTO ($0.00)"
            print(f"[{idx:02d}/{len(quotes):02d}] {status_tag} │ {q_name[:48]:<48} │ Buque: {vessel_id:<10} │ PnL: ${m_pnl:,.2f}")
        elif d_pnl < 1.0:
            minor_delta_count += 1
            status_tag = f"🟡 DELTA MENOR (ΔPnL=${d_pnl:.2f})"
            print(f"[{idx:02d}/{len(quotes):02d}] {status_tag} │ {q_name[:48]:<48} │ Buque: {vessel_id:<10} │ PnL: ${m_pnl:,.2f}")
        else:
            failed_count += 1
            status_tag = f"🔴 DISCREPANCIA (ΔPnL=${d_pnl:,.2f})"
            print(f"[{idx:02d}/{len(quotes):02d}] {status_tag} │ {q_name[:48]:<48} │ Buque: {vessel_id:<10} │ PnL Matriz: ${m_pnl:,.2f} vs Exp: ${exp_pnl:,.2f}")
            discrepancies_report.append({
                "index": idx,
                "quote_name": q_name,
                "vessel_id": vessel_id,
                "d_pnl": d_pnl,
                "exp_pnl": exp_pnl,
                "m_pnl": m_pnl,
                "d_gross": d_gross,
                "d_bunker": d_bunker,
                "d_port": d_port,
                "d_days": d_days
            })

    print("\n" + "=" * 110)
    print("🏆 RESUMEN EJECUTIVO DEL SUPER LOOP DE ESCENARIOS SINTÉTICOS:")
    total_eval = exact_count + minor_delta_count + failed_count
    print(f"   • Total Cotizaciones en BD:     {len(quotes)}")
    print(f"   • Evaluadas en Matriz:          {total_eval}")
    print(f"   • Omitidas (Sin snapshot):       {skipped_count}")
    print(f"   • 100% Exactas ($0.00 Delta):    {exact_count} ({((exact_count/total_eval)*100 if total_eval else 0):.1f}%)")
    print(f"   • Delta Menor (< $1.00):         {minor_delta_count}")
    print(f"   • Discrepancias / Errores:      {failed_count}")
    print("=" * 110)

    if discrepancies_report:
        print("\n🔍 DETALLE PERICIAL DE DISCREPANCIAS ENCONTRADAS:")
        for d in discrepancies_report:
            if "error" in d:
                print(f"   ❌ [{d['index']:02d}] {d['quote_name']}: {d['error']}")
            else:
                print(f"   🚩 [{d['index']:02d}] {d['quote_name']} ({d['vessel_id']}):")
                print(f"      - P&L Exp: ${d['exp_pnl']:,.2f} │ P&L Matriz: ${d['m_pnl']:,.2f} │ Delta P&L: ${d['d_pnl']:,.2f}")
                print(f"      - Delta Gross: ${d['d_gross']:,.2f} │ Delta Bunker: ${d['d_bunker']:,.2f} │ Delta Port: ${d['d_port']:,.2f} │ Delta Días: {d['d_days']:.2f}d")
        print("=" * 110)

    return failed_count == 0

if __name__ == "__main__":
    success = run_synthetic_scenarios_super_loop()
    sys.exit(0 if success else 1)
