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

def audit_single_route_convergence():
    clear_forecast_cache()
    supabase = get_supabase()
    res = supabase.table("routes_quotes").select("*").execute()
    quotes = res.data or []
    
    print(f"📦 Total de rutas grabadas en BD: {len(quotes)}")
    
    # Seleccionamos la ruta emblemática con Demurrage
    target_name = "SPCC.ILO.MATARANI.ILO.2028 13,500 Moquegua Dem"
    quote = next((q for q in quotes if q.get("name") == target_name), None)
    if not quote:
        quote = next((q for q in quotes if "Dem" in q.get("name", "")), quotes[0] if quotes else None)
        
    if not quote:
        print("❌ No se encontraron rutas grabadas en la BD.")
        return False

    q_name = quote.get("name")
    legs_data = quote.get("legs_data", {})
    fin_summary = legs_data.get("financial_summary", {})
    vessel_id = legs_data.get("vesselId") or "MOQUEGUA"
    client_id = quote.get("client_id") or "SPCC"
    
    print(f"\n====================================================================================================")
    print(f"🕵️‍♂️ AUDITORÍA BENOIT BLANC: CONVERGENCIA MATRIZ ↔ MULTICOTIZADOR (RUTA: {q_name})")
    print(f"====================================================================================================")

    # 1. Parámetros de prueba con Overrides en Caliente (What-If)
    custom_tariff = 28.50  # Tarifa alterada (sobrescribe flete original)
    custom_ifo = 550.0      # Búnker alterado (sobrescribe IFO original)
    test_month = "2028-01"
    
    print(f"\n🔧 APLICANDO OVERRIDES EN CALIENTE (WHAT-IF ANALYSIS):")
    print(f"   • Tarifa Base Sobreescrita (custom_tariff): ${custom_tariff:.2f} / TM")
    print(f"   • Precio Búnker IFO Sobreescrito: ${custom_ifo:.2f} / MT")
    print(f"   • Buque Asignado: {vessel_id}")
    print(f"   • Cliente: {client_id}")

    # 2. EJECUCIÓN EN MATRIZ FINANCIERA (Engine de Forecast)
    line = ProjectionLine(
        month_index=test_month,
        client_id=client_id,
        origin_port_id=legs_data.get("puertosConfig", [{}])[0].get("port_id", "ILO"),
        destination_port_id=legs_data.get("puertosConfig", [{}])[-1].get("port_id", "MATARANI"),
        vessel_id=vessel_id,
        quantity=float(fin_summary.get("totalQuantity") or 13500),
        monthly_frequency=1,
        custom_tariff=custom_tariff,
        forecast_bunker_price_ifo=custom_ifo,
        quote_id=q_name
    )
    
    forecast_req = ForecastRequest(
        start_date="2028-01-01",
        end_date="2028-01-31",
        projection_lines=[line],
        port_cost_mode="static"
    )
    
    forecast_res = run_forecast_simulation(forecast_req)
    agg_data = forecast_res.get("aggregated_data", {})
    
    # Extraer métricas de la Matriz para el mes de prueba
    matrix_month_data = None
    for c_k, r_map in agg_data.items():
        for r_k, v_map in r_map.items():
            for v_k, m_map in v_map.items():
                if test_month in m_map:
                    matrix_month_data = m_map[test_month]
                    break
                    
    if not matrix_month_data:
        print("❌ Error: No se generaron datos en la Matriz Financiera para el mes de prueba.")
        return False

    # 3. EJECUCIÓN ESPEJO EN MULTICOTIZADOR (Recreando el cálculo con los nuevos inputs)
    q_val = float(fin_summary.get("totalQuantity") or 13500)
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
    
    # Búnker con el nuevo precio IFO sobreescrito
    ifo_tons = float(fin_summary.get("totalIfoTons") or fin_summary.get("grandIfoTons", 0.0))
    mdo_tons = float(fin_summary.get("totalMdoTons") or fin_summary.get("grandMdoTons", 0.0))
    mdo_price = float(legs_data.get("bunkerPriceMdo") or legs_data.get("bunker_price_mdo") or 820.0)
    spot_bunker_costs = (ifo_tons * custom_ifo) + (mdo_tons * mdo_price)
    
    spot_days = float(fin_summary.get("totalDays", 0.0))
    spot_sea_days = float(fin_summary.get("totalSeaDays", 0.0))
    spot_port_days = float(fin_summary.get("totalPortDays", 0.0))
    spot_pnl = spot_net_rev - spot_port_costs - spot_bunker_costs
    spot_tce = spot_pnl / spot_days if spot_days > 0 else 0.0

    # 4. CUADRATURA PERICIAL MÉTRICA POR MÉTRICA
    m_gross_rev = float(matrix_month_data.get("gross_revenue_total", matrix_month_data.get("gross_revenue", 0.0)))
    m_freight_rev = float(matrix_month_data.get("freight_revenue", 0.0))
    m_demurrage_rev = float(matrix_month_data.get("demurrage_revenue", 0.0))
    m_dem_days = float(matrix_month_data.get("demurrage_days", 0.0))
    m_comm = float(matrix_month_data.get("total_commissions", 0.0))
    m_net_rev = float(matrix_month_data.get("net_income", 0.0))
    m_bunker_costs = float(matrix_month_data.get("total_bunker_costs", 0.0))
    m_port_costs = float(matrix_month_data.get("total_port_costs", 0.0))
    m_days = float(matrix_month_data.get("total_duration", 0.0))
    m_sea_days = float(matrix_month_data.get("sea_days", 0.0))
    m_port_days = float(matrix_month_data.get("port_days", 0.0))
    m_pnl = float(matrix_month_data.get("voyage_result", 0.0))
    m_tce = float(matrix_month_data.get("tce_real", matrix_month_data.get("time_charter_equivalent", 0.0)))

    metrics_audit = [
        ("Ingresos por Flete Base (Freight Revenue)", m_freight_rev, spot_freight_rev, "$"),
        ("Ingresos por Demurrage (Demurrage Revenue)", m_demurrage_rev, spot_demurrage_rev, "$"),
        ("Ingresos Brutos Totales (Gross Revenue)", m_gross_rev, spot_gross_rev, "$"),
        ("Comisiones Comerciales (Commissions)", m_comm, spot_comm_usd, "$"),
        ("Ingreso Neto Comercial (Net Revenue)", m_net_rev, spot_net_rev, "$"),
        ("Costos Portuarios (Port Costs)", m_port_costs, spot_port_costs, "$"),
        ("Costos de Búnker (Total Fuel Costs)", m_bunker_costs, spot_bunker_costs, "$"),
        ("Días de Navegación en Mar (Sea Days)", m_sea_days, spot_sea_days, "d"),
        ("Días de Operación en Puerto (Port Days)", m_port_days, spot_port_days, "d"),
        ("Días de Demora (Demurrage Days)", m_dem_days, spot_demurrage_days, "d"),
        ("Días Totales de Ocupación (Total Days)", m_days, spot_days, "d"),
        ("Margen Operativo (Voyage Result / P&L)", m_pnl, spot_pnl, "$"),
        ("TCE Realizado ($/día)", m_tce, spot_tce, "$/d"),
    ]

    print("\n📊 RESULTADOS DE LA AUDITORÍA TRIANGULAR (MATRIZ vs MULTICOTIZADOR):")
    print("------------------------------------------------------------------------------------------------------------------------")
    print(f"{'MÉTRICA':<45} │ {'MATRIZ':<18} │ {'MULTICOTIZADOR':<18} │ {'DIFERENCIA':<10} │ {'ESTADO'}")
    print("------------------------------------------------------------------------------------------------------------------------")
    
    all_exact = True
    for name, m_val, s_val, unit in metrics_audit:
        diff = abs(m_val - s_val)
        passed = diff < 0.01
        if not passed:
            all_exact = False
        status = "✅ EXACTO" if passed else "❌ DISCREPANCIA"
        
        m_str = f"{m_val:,.2f} {unit}" if unit != "d" else f"{m_val:.2f} d"
        s_str = f"{s_val:,.2f} {unit}" if unit != "d" else f"{s_val:.2f} d"
        d_str = f"{diff:,.4f}"
        print(f"{name:<45} │ {m_str:<18} │ {s_str:<18} │ {d_str:<10} │ {status}")

    print("------------------------------------------------------------------------------------------------------------------------")
    if all_exact:
        print(f"🏆 DICTAMEN PERICIAL: CONVERGENCIA 100% PERFECTA ($0.00 DE DISCREPANCIA EN TODAS LAS MÉTRICAS)")
    else:
        print(f"⚠️ DICTAMEN PERICIAL: SE DETECTARON DISCREPANCIAS QUE REQUIEREN AJUSTE QUIRÚRGICO.")

    return all_exact

if __name__ == "__main__":
    success = audit_single_route_convergence()
    sys.exit(0 if success else 1)
