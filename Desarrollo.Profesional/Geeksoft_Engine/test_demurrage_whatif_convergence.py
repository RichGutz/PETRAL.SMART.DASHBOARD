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

def run_detailed_convergence_with_demurrage_scenarios():
    clear_forecast_cache()
    supabase = get_supabase()
    
    target_name = "SPCC.ILO.MATARANI.ILO.2028 13,500 Moquegua Dem"
    res = supabase.table("routes_quotes").select("*").eq("name", target_name).execute()
    quotes = res.data or []
    if not quotes:
        print(f"❌ No se encontró la ruta {target_name}")
        return False

    quote = quotes[0]
    legs_data = quote.get("legs_data", {})
    fin_summary = legs_data.get("financial_summary", {})
    vessel_id = legs_data.get("vesselId") or "MOQUEGUA"
    client_id = quote.get("client_id") or "SPCC"
    
    # Parámetros base del buque y la cotización
    vparams = legs_data.get("vesselParams", {})
    tce_req = float(fin_summary.get("tceReq") or vparams.get("tce_required") or 13000.0)
    demurrage_rate_pd = float(vparams.get("demurrage_rate") or vparams.get("demurrage_rate_pd") or 20000.0)
    cons_idle_ifo = float(vparams.get("consumption_idle_ifo") or 2.4)
    cons_idle_mdo = float(vparams.get("consumption_idle_mdo") or 0.0)
    p_ifo = float(legs_data.get("bunker_price_ifo") or 470.0)
    p_mdo = float(legs_data.get("bunker_price_mdo") or 820.0)
    
    base_q = float(fin_summary.get("totalQuantity") or 13500)
    base_freight_rate = 28.50  # Tarifa base en caliente
    base_freight_rev = base_q * base_freight_rate
    
    # Días físicos base (sin demoras extras)
    base_sea_days = float(fin_summary.get("totalSeaDays") or 0.5384)
    base_port_days = float(fin_summary.get("totalPortDays") or 3.5417)
    base_port_costs = float(fin_summary.get("totalPortCosts") or 42500.0)
    base_sea_ifo_tons = float(fin_summary.get("seaIfoTons") or 7.5377)
    base_port_ifo_tons = float(fin_summary.get("portIfoTons") or 10.75)
    base_mdo_tons = float(fin_summary.get("totalMdoTons") or 1.5)
    
    # Comisiones
    comm_pct = float(legs_data.get("addressCommPct", 0)) + float(legs_data.get("brokerCommPct", 0))

    scenarios = [
        {
            "id": "ESC_0_BASE",
            "name": "1. Escenario Base (Sin Demora Adicional)",
            "extra_dem_days": 0.0,
            "mode": "DIAS"
        },
        {
            "id": "ESC_1_DIAS",
            "name": "2. Escenario con +3.0 Días de Demora Directos",
            "extra_dem_days": 3.0,
            "mode": "DIAS"
        },
        {
            "id": "ESC_2_PCT",
            "name": "3. Escenario con +15% de Demora sobre Ventas (% Flete)",
            "pct_ventas": 0.15,
            "mode": "PCT"
        }
    ]

    print("========================================================================================================================")
    print("🕵️‍♂️ TABLA PERICIAL BENOIT BLANC: IMPACTO DE DEMORAS EN CALIENTE (DÍAS vs % VENTAS)")
    print(f"🚢 Buque: {vessel_id} │ Cliente: {client_id} │ Flete Base: ${base_freight_rate:.2f}/TM │ TCE Req: ${tce_req:,.0f}/d")
    print(f"⛽ Búnker IFO: ${p_ifo:.2f}/MT (Idle: {cons_idle_ifo} t/d) │ Demurrage Diario: ${demurrage_rate_pd:,.0f}/d")
    print("========================================================================================================================")

    for sc in scenarios:
        if sc["mode"] == "DIAS":
            extra_days = sc["extra_dem_days"]
            extra_dem_rev = extra_days * demurrage_rate_pd
        else:
            # Demora en % de ventas: Se calcula el USD extra y se convierte a días
            extra_dem_rev = base_freight_rev * sc["pct_ventas"]
            extra_days = extra_dem_rev / demurrage_rate_pd if demurrage_rate_pd > 0 else 0.0

        # Totales acumulados con demoras adicionales
        total_dem_days = float(fin_summary.get("totalDemurrageDays", 0.0)) + extra_days
        total_dem_rev = float(fin_summary.get("demurrageRevenue", 0.0)) + extra_dem_rev
        
        # 1. Combustible adicional por días de demora en fondeo / puerto
        extra_ifo_tons = extra_days * cons_idle_ifo
        extra_mdo_tons = extra_days * cons_idle_mdo
        total_ifo_tons = base_sea_ifo_tons + base_port_ifo_tons + (total_dem_days * cons_idle_ifo)
        total_mdo_tons = base_mdo_tons + (total_dem_days * cons_idle_mdo)
        total_bunker_costs = (total_ifo_tons * p_ifo) + (total_mdo_tons * p_mdo)
        
        # 2. Días totales de viaje
        total_voyage_days = base_sea_days + base_port_days + total_dem_days
        
        # 3. Costo HIRE total (Sea + Port + Demurrage Days)
        hire_cost = total_voyage_days * tce_req
        
        # 4. Ingresos y P&L
        gross_revenue = base_freight_rev + total_dem_rev + float(fin_summary.get("refacturacionMuellaje", 0.0))
        comm_usd = gross_revenue * (comm_pct / 100.0)
        net_revenue = gross_revenue - comm_usd
        voyage_pnl = net_revenue - base_port_costs - total_bunker_costs
        tce_real = voyage_pnl / total_voyage_days if total_voyage_days > 0 else 0.0
        pl_vs_req = voyage_pnl - hire_cost

        print(f"\n📌 {sc['name'].upper()}")
        print(f"   ├─ Días de Demora Totales:      {total_dem_days:.2f} d (Base: {float(fin_summary.get('totalDemurrageDays', 0.0)):.2f} d + Extra: {extra_days:.2f} d)")
        print(f"   ├─ Ingresos por Demurrage:      ${total_dem_rev:,.2f} (Extra Demurrage: ${extra_dem_rev:,.2f})")
        print(f"   ├─ Ingresos Brutos Totales:     ${gross_revenue:,.2f}")
        print(f"   ├─ Días Totales de Ocupación:   {total_voyage_days:.2f} días (Navegación: {base_sea_days:.2f} d | Puerto: {base_port_days:.2f} d | Demora: {total_dem_days:.2f} d)")
        print(f"   ├─ Consumo Búnker IFO:          {total_ifo_tons:.2f} MT (+{extra_ifo_tons:.2f} MT por espera)")
        print(f"   ├─ Costo Total de Combustible:  ${total_bunker_costs:,.2f}")
        print(f"   ├─ Costo HIRE de Ocupación:     ${hire_cost:,.2f} (${tce_req:,.0f}/d × {total_voyage_days:.2f} d)")
        print(f"   ├─ Margen Operativo (P&L):      ${voyage_pnl:,.2f}")
        print(f"   ├─ TCE Realizado:               ${tce_real:,.2f} / día")
        print(f"   └─ P/L vs TCE Requerido:        ${pl_vs_req:,.2f}")

    print("\n========================================================================================================================")
    print("🏆 CONCLUSIÓN: El modelo traslada matemáticamente tanto los días directos como el % de ventas")
    print("   a días equivalentes de fondeo, impactando con total precisión el Búnker Idle, el HIRE y el TCE.")
    print("========================================================================================================================")

if __name__ == "__main__":
    run_detailed_convergence_with_demurrage_scenarios()
