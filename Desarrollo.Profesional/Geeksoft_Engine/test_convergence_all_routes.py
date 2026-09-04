import sys
import os
import json

# Configure stdout for UTF-8 in Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure python path includes backend
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation, clear_forecast_cache
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def audit_all_routes_convergence():
    clear_forecast_cache()
    supabase = get_supabase()
    res = supabase.table("routes_quotes").select("*").execute()
    quotes = res.data or []
    
    print(f"\n====================================================================================================")
    print(f"🕵️‍♂️ INICIANDO AUDITORÍA FORENSE UNIVERSAL BENOIT BLANC: {len(quotes)} RUTAS EN BD")
    print(f"====================================================================================================")

    test_month = "2027-05"
    passed_count = 0
    failed_count = 0
    results_summary = []

    for idx, quote in enumerate(quotes, 1):
        q_name = quote.get("name", f"Quote_{idx}")
        legs_data = quote.get("legs_data", {})
        fin_summary = legs_data.get("financial_summary", {})
        
        # Si no tiene tramos o snapshot válido, saltar o registrar
        if not legs_data.get("tramos") and not fin_summary:
            print(f"[{idx:02d}/{len(quotes):02d}] ⏭️ Omitiendo '{q_name}' (Sin tramos ni financial_summary)")
            continue

        vessel_id = legs_data.get("vesselId") or legs_data.get("vessel_id") or "MOQUEGUA"
        client_id = quote.get("client_id") or "SPCC"
        
        # Override de prueba: +$5.00 sobre el flete base o $30.00
        orig_freight = float(fin_summary.get("totalFreight", 0)) / (float(fin_summary.get("totalQuantity") or 13500)) if (fin_summary and float(fin_summary.get("totalFreight", 0)) > 0) else 25.0
        custom_tariff = round(orig_freight + 5.0, 2)
        custom_ifo = 520.0
        custom_mdo = 850.0

        q_val = float(fin_summary.get("totalQuantity") or 13500)

        # 1. Matriz Financiera
        line = ProjectionLine(
            month_index=test_month,
            client_id=client_id,
            origin_port_id=legs_data.get("puertosConfig", [{}])[0].get("port_id", "ILO") if legs_data.get("puertosConfig") else "ILO",
            destination_port_id=legs_data.get("puertosConfig", [{}])[-1].get("port_id", "MATARANI") if legs_data.get("puertosConfig") else "MATARANI",
            vessel_id=vessel_id,
            quantity=q_val,
            monthly_frequency=1,
            custom_tariff=custom_tariff,
            forecast_bunker_price_ifo=custom_ifo,
            forecast_bunker_price_mdo=custom_mdo,
            quote_id=q_name
        )

        forecast_req = ForecastRequest(
            start_date="2027-05-01",
            end_date="2027-05-31",
            projection_lines=[line],
            port_cost_mode="static"
        )

        forecast_res = run_forecast_simulation(forecast_req)
        agg_data = forecast_res.get("aggregated_data", {})

        m_data = None
        for c_k, r_map in agg_data.items():
            for r_k, v_map in r_map.items():
                for v_k, m_map in v_map.items():
                    if test_month in m_map:
                        m_data = m_map[test_month]
                        break

        if not m_data:
            print(f"[{idx:02d}/{len(quotes):02d}] ❌ FALLÓ '{q_name}': No generó datos en Matriz.")
            failed_count += 1
            continue

        # 2. Multicotizador Espejo
        spot_freight_rev = q_val * custom_tariff
        spot_demurrage_rev = float(fin_summary.get("demurrageRevenue", 0.0))
        spot_demurrage_days = float(fin_summary.get("totalDemurrageDays", 0.0))
        spot_refact_muell = float(fin_summary.get("refacturacionMuellaje", 0.0))
        spot_gross_rev = spot_freight_rev + spot_demurrage_rev + spot_refact_muell

        addr_comm = float(legs_data.get("addressCommPct", 0))
        brok_comm = float(legs_data.get("brokerCommPct", 0))
        tot_comm_pct = addr_comm + brok_comm
        spot_comm_usd = spot_gross_rev * (tot_comm_pct / 100.0)
        spot_net_rev = spot_gross_rev - spot_comm_usd

        spot_port_costs = float(fin_summary.get("totalPortCosts", 0.0))

        ifo_tons = float(fin_summary.get("totalIfoTons") or fin_summary.get("grandIfoTons", 0.0))
        mdo_tons = float(fin_summary.get("totalMdoTons") or fin_summary.get("grandMdoTons", 0.0))
        spot_bunker_costs = (ifo_tons * custom_ifo) + (mdo_tons * custom_mdo)

        spot_days = float(fin_summary.get("totalDays", 0.0))
        spot_pnl = spot_net_rev - spot_port_costs - spot_bunker_costs
        spot_tce = spot_pnl / spot_days if spot_days > 0 else 0.0

        # 3. Comparación
        m_gross = float(m_data.get("gross_revenue_total", 0.0))
        m_net = float(m_data.get("net_income", 0.0))
        m_port = float(m_data.get("total_port_costs", 0.0))
        m_bunker = float(m_data.get("total_bunker_costs", 0.0))
        m_days = float(m_data.get("total_duration", 0.0))
        m_pnl = float(m_data.get("voyage_result", 0.0))
        m_tce = float(m_data.get("tce_real", 0.0))

        diff_gross = abs(m_gross - spot_gross_rev)
        diff_net = abs(m_net - spot_net_rev)
        diff_port = abs(m_port - spot_port_costs)
        diff_bunker = abs(m_bunker - spot_bunker_costs)
        diff_days = abs(m_days - spot_days)
        diff_pnl = abs(m_pnl - spot_pnl)
        diff_tce = abs(m_tce - spot_tce)

        is_ok = (diff_gross < 0.01 and diff_net < 0.01 and diff_port < 0.01 and diff_bunker < 0.01 and diff_days < 0.01 and diff_pnl < 0.01 and diff_tce < 0.05)

        if is_ok:
            passed_count += 1
            status_str = "🟢 EXACTO ($0.00)"
        else:
            failed_count += 1
            status_str = f"🔴 DIFF: PnL=${diff_pnl:,.2f} | Bunk=${diff_bunker:,.2f}"

        results_summary.append((idx, q_name, vessel_id, custom_tariff, m_pnl, spot_pnl, is_ok))
        print(f"[{idx:02d}/{len(quotes):02d}] {status_str} │ Ruta: {q_name[:45]:<45} │ Buque: {vessel_id:<12} │ PnL: ${m_pnl:,.2f}")

    print(f"\n====================================================================================================")
    print(f"🏆 RESUMEN UNIVERSAL DE CONVERGENCIA:")
    print(f"   • Total de Rutas Auditadas: {passed_count + failed_count}")
    print(f"   • Rutas 100% Convergentes:  {passed_count} / {passed_count + failed_count} ({((passed_count / (passed_count + failed_count))*100):.1f}%)")
    print(f"   • Rutas con Discrepancias:  {failed_count}")
    print(f"====================================================================================================")

    return failed_count == 0

if __name__ == "__main__":
    success = audit_all_routes_convergence()
    sys.exit(0 if success else 1)
