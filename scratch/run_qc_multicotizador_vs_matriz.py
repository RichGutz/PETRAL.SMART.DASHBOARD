import sys
import json

sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation, get_cached_masters
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def main():
    sb = get_supabase()
    masters = get_cached_masters(sb)
    
    quotes = masters.get("routes_quotes", [])
    audited_quote = next((q for q in quotes if "NEXA.ILO.CALLAO.MATARANI.ILO" in str(q.get("name", ""))), None)
    
    if not audited_quote:
        print("ERROR: Quote not found")
        return

    print("=======================================================")
    print("1. EVALUANDO COTIZACIÓN MULTICOTIZADOR DB:")
    print("=======================================================")
    print("Nombre Quote:", audited_quote.get("name"))
    print("ID Quote:", audited_quote.get("id"))
    print("SpotID Quote:", audited_quote.get("spot_id"))
    
    legs_data = audited_quote.get("legs_data") or {}
    tramos = legs_data.get("tramos", [])
    
    # Invocación directa a calculate_multicotizador_simulation
    payload = {
        "vessel_params": masters["vessels"][0],
        "tramos": tramos,
        "port_cost_mode": "static",
        "client_id": "NEXA",
        "vessel_id": "TABLONES"
    }
    
    from backend.spot_engine import calculate_multicotizador_simulation
    direct_res = calculate_multicotizador_simulation(payload)
    c = direct_res.get("consolidated", {})
    
    print("\n--- RESULTADO DE MULTICOTIZADOR ENGINE DIRECTO ---")
    print("Días Totales:", c.get("total_days"))
    print("Freight Revenue ($405k):", c.get("total_freight_revenue"))
    print("Refacturación Muellaje (+$13k):", c.get("refacturacion_muellaje"))
    print("Gross Total Revenue ($418k):", c.get("total_freight_revenue") + c.get("refacturacion_muellaje"))
    print("Port Costs (-$48k):", c.get("total_port_costs"))
    print("Bunker Costs (-$80,082):", c.get("total_bunker_costs"))
    print("Voyage Result Net (P&L):", c.get("pnl_net_utility"))
    print("Hire Cost (-$106,957):", c.get("total_days") * c.get("tce_required"))
    print("P&L NETO FINAL ($182,961):", c.get("pl_vs_req"))
    print("TCE Realizado ($60,659/d):", c.get("tce_real"))

    # 2. Invocación desde run_forecast_simulation pasando quote_id
    req = ForecastRequest(
        start_date="2026-07-01",
        end_date="2026-07-31",
        projection_lines=[
            ProjectionLine(
                client_id="NEXA",
                origin_port_id="ILO",
                destination_port_id="MATARANI",
                vessel_id="TABLONES",
                month_index="2026-07",
                quantity=13500,
                monthly_frequency=1,
                quote_id=audited_quote.get("name") # pasar el nombre de la quote
            )
        ],
        port_cost_mode="static"
    )

    res = run_forecast_simulation(req)
    print("\n=======================================================")
    print("2. RESULTADO DESDE RUN_FORECAST_SIMULATION (MATRIZ):")
    print("=======================================================")
    agg = res.get("aggregated_data", {}).get("NEXA", {})
    for r_key, vessels in agg.items():
        for v_key, months in vessels.items():
            m = months.get("2026-07", {})
            print("Ruta Matriz:", r_key, "| Buque:", v_key)
            print("  - Gross Revenue Total:", m.get("gross_revenue_total"))
            print("  - Refacturación Muellaje:", m.get("refacturacion_muellaje"))
            print("  - Total Port Costs:", m.get("total_port_costs"))
            print("  - Total Bunker Costs:", m.get("total_bunker_costs"))
            print("  - Hire Cost:", m.get("hire_cost"))
            print("  - P&L Neto Final:", m.get("pl_vs_required"))
            print("  - Voyage Result Gross:", m.get("voyage_result"))
            print("  - TCE Realizado:", m.get("tce_real"))
            print("  - Días Totales:", m.get("total_days"))

if __name__ == "__main__":
    main()
