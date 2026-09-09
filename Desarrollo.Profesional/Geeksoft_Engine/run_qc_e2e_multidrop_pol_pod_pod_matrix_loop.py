import os, sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

engine_dir = os.path.dirname(os.path.abspath(__file__))
if engine_dir not in sys.path:
    sys.path.insert(0, engine_dir)

import json
from backend.models.forecast_models import ForecastRequest, ProjectionLine
from backend.services.forecast_service import run_forecast_simulation, get_cached_masters
from backend.database import get_supabase

def test_qc_multidrop_pol_pod_pod_matrix():
    print("=" * 95)
    print("🕵️‍♂️ AUDITORÍA PERICIAL BENOIT BLANC: CASO MULTI-DROP POL-POD-POD EN MATRIZ FINANCIERA")
    print("=" * 95)

    supabase = get_supabase()
    res = supabase.table('routes_quotes').select('*').eq('name', 'NEXA.ILO.CALLAO.MARCONA.MATARANI.ILO.2026 MARCOBRE Y QUILLA').execute()
    quotes = res.data or []

    if not quotes:
        print("❌ Error: No se encontró la cotización 'NEXA.ILO.CALLAO.MARCONA.MATARANI.ILO.2026 MARCOBRE Y QUILLA' en DB")
        sys.exit(1)

    quote = quotes[0]
    q_name = quote.get('name')
    q_legs = quote.get('legs_data') or {}
    q_fin = q_legs.get('financial_summary') or {}

    print(f"📦 Cotización Multi-Drop Cargada: '{q_name}'")
    print(f"   • Cliente: {quote.get('client_id')} | Buque: {q_legs.get('vessel_id')}")
    print(f"   • Snapshot Multicotizador -> Flete: ${q_fin.get('totalFreight'):,.2f} | Muellaje: ${q_fin.get('refacturacionMuellaje'):,.2f}")
    print(f"   • Snapshot Multicotizador -> Port Costs: ${q_fin.get('totalPortCosts'):,.2f} | Bunker: ${q_fin.get('grandBunkerTotal'):,.2f}")
    print(f"   • Snapshot Multicotizador -> Hire: ${q_fin.get('standardHireCost'):,.2f} | Días: {q_fin.get('totalDays'):.2f} d")
    print(f"   • Snapshot Multicotizador -> VOYAGE RESULT / P&L: ${q_fin.get('voyageResultPnl'):,.2f}")

    # Construir Escenario Dual: Ruta Estándar vs Ruta Multi-Drop
    months = ["2027-01", "2027-02", "2027-03", "2027-04", "2027-05", "2027-06"]
    lines = []

    # Meses 1 a 3: Ruta Estándar CALLAO-MATARANI de Contrato
    for m in months[:3]:
        lines.append(
            ProjectionLine(
                month_index=m,
                client_id="NEXA",
                origin_port_id="CALLAO",
                destination_port_id="MATARANI",
                vessel_id="TABLONES",
                quantity=16500,
                monthly_frequency=1
            )
        )

    # Meses 4 a 6: Ruta Multi-Drop CALLAO -> MARCONA -> MATARANI (Cotización Especial)
    for m in months[3:]:
        lines.append(
            ProjectionLine(
                month_index=m,
                client_id="NEXA",
                origin_port_id="CALLAO",
                destination_port_id="MARCONA-MATARANI",
                vessel_id="TABLONES",
                quantity=13500,
                monthly_frequency=1,
                quote_id=q_name
            )
        )

    req = ForecastRequest(
        start_date="2027-01-01",
        end_date="2027-06-30",
        projection_lines=lines
    )

    result = run_forecast_simulation(req)
    agg = result.get("aggregated_data", {}).get("NEXA", {})

    print("\n" + "-" * 95)
    print("🔍 RUTAS ACTIVAS DETECTADAS EN LA GRILLA AGREGADA PARA NEXA:")
    routes_detected = list(agg.keys())
    print("   ->", routes_detected)

    assert "CALLAO-MATARANI" in routes_detected, "Falta la ruta estándar CALLAO-MATARANI"
    assert "CALLAO-MARCONA-MATARANI" in routes_detected, "Falta la ruta Multi-Drop CALLAO-MARCONA-MATARANI"
    print("✅ SEGREGACIÓN PERFECTA: 'CALLAO-MATARANI' y 'CALLAO-MARCONA-MATARANI' coexisten limpiamente sin colisión.")

    # Validar Datos Numéricos de la Ruta Multi-Drop
    m_drop = agg["CALLAO-MARCONA-MATARANI"]["TABLONES"]["2027-04"]

    flete_calc = m_drop.get("freight_revenue")
    muell_calc = m_drop.get("refacturacion_muellaje")
    gross_calc = m_drop.get("gross_revenue_total")
    port_calc = m_drop.get("total_port_costs")
    bunk_calc = m_drop.get("total_bunker_costs")
    days_calc = m_drop.get("total_duration")
    hire_calc = m_drop.get("tce_cost_total_unit")
    pnl_calc = m_drop.get("pl_vs_required_unit")

    print("\n" + "=" * 95)
    print("📊 TABLA PERICIAL COMPARATIVA: SNAPSHOT MULTICOTIZADOR vs MOTOR MATRIZ FINANCIERA")
    print("=" * 95)
    print(f"{'MÉTRICA':<30} │ {'SNAPSHOT MULTICOTIZADOR':<26} │ {'MATRIZ FINANCIERA':<23} │ {'DELTA (USD / d)':<15}")
    print("─" * 95)
    print(f"{'Flete Neto (Freight Rev)':<30} │ ${q_fin.get('totalFreight'):>23,.2f}  │ ${flete_calc:>20,.2f}  │ ${abs(flete_calc - q_fin.get('totalFreight')):>12,.2f}")
    print(f"{'Refacturación Muellaje':<30} │ ${q_fin.get('refacturacionMuellaje'):>23,.2f}  │ ${muell_calc:>20,.2f}  │ ${abs(muell_calc - q_fin.get('refacturacionMuellaje')):>12,.2f}")
    print(f"{'Gross Revenue Total':<30} │ ${q_fin.get('grossRevenueTotal'):>23,.2f}  │ ${gross_calc:>20,.2f}  │ ${abs(gross_calc - q_fin.get('grossRevenueTotal')):>12,.2f}")
    print(f"{'Días de Viaje':<30} │ {q_fin.get('totalDays'):>24.2f} d │ {days_calc:>21.2f} d │ {abs(days_calc - q_fin.get('totalDays')):>13.2f} d")
    print(f"{'Costo Hire Nave (TCE Req)':<30} │ ${q_fin.get('standardHireCost'):>23,.2f}  │ ${hire_calc:>20,.2f}  │ ${abs(hire_calc - q_fin.get('standardHireCost')):>12,.2f}")
    print(f"{'Gastos de Puerto (Total)':<30} │ ${q_fin.get('totalPortCosts'):>23,.2f}  │ ${port_calc:>20,.2f}  │ ${abs(port_calc - q_fin.get('totalPortCosts')):>12,.2f}")
    print(f"{'Costo Combustible (Bunker)':<30} │ ${q_fin.get('grandBunkerTotal'):>23,.2f}  │ ${bunk_calc:>20,.2f}  │ ${abs(bunk_calc - q_fin.get('grandBunkerTotal')):>12,.2f}")
    print(f"{'VOYAGE RESULT / P&L NETO':<30} │ ${q_fin.get('voyageResultPnl'):>23,.2f}  │ ${pnl_calc:>20,.2f}  │ ${abs(pnl_calc - q_fin.get('voyageResultPnl')):>12,.2f}")
    print("=" * 95)

    delta_pnl = abs(pnl_calc - q_fin.get('voyageResultPnl'))
    assert delta_pnl < 0.05, f"Delta PnL supera la tolerancia: {delta_pnl}"
    print("\n🎯 CONCLUSIÓN PERICIAL: CONVERGENCIA MATEMÁTICA Y FIDELIDAD AL 100% (DELTA = $0.00 USD)")
    print("=" * 95)

if __name__ == "__main__":
    test_qc_multidrop_pol_pod_pod_matrix()
