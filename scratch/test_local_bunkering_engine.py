import sys
import os

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Agregar ruta al PYTHONPATH
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.models.forecast_models import ForecastRequest, ProjectionLine
from backend.services.forecast_service import run_forecast_simulation_universal, run_forecast_simulation

def test_local_engine():
    print("="*95)
    print("🕵️‍♂️ AUDITORÍA PERICIAL BENOIT BLANC: MOTOR LOCAL BACKEND (CALLAO BUNKERING)")
    print("="*95)

    # Rutas grabadas:
    # SPCC.ILO.MARCONA.CALLAO.ILO.BUNKER TABLONES
    lines = []
    # Mes estándar
    lines.append(ProjectionLine(
        month_index="2026-01",
        client_id="SPCC",
        origin_port_id="ILO",
        destination_port_id="MARCONA",
        vessel_id="TABLONES",
        quantity=13500,
        monthly_frequency=2,
        custom_tariff=23.10
    ))
    # Mes Bunkering
    lines.append(ProjectionLine(
        month_index="2026-06",
        client_id="SPCC",
        origin_port_id="ILO",
        destination_port_id="MARCONA",
        vessel_id="TABLONES",
        quantity=13500,
        monthly_frequency=1,
        custom_tariff=23.10,
        quote_id="SPCC.ILO.MARCONA.CALLAO.ILO.BUNKER TABLONES"
    ))

    req = ForecastRequest(
        start_date="2026-01-01",
        end_date="2026-12-31",
        projection_lines=lines,
        port_cost_mode="DETAILED"
    )

    print("🚀 Ejecutando run_forecast_simulation_universal(req) en local...")
    res_universal = run_forecast_simulation_universal(req)
    agg_uni = res_universal.get("aggregated_data", {}).get("SPCC", {})
    routes_uni = list(agg_uni.keys())
    print(f"\n🔍 Rutas en aggregated_data (Universal): {routes_uni}")

    print("🚀 Ejecutando run_forecast_simulation(req) en local...")
    res_standard = run_forecast_simulation(req)
    agg_std = res_standard.get("aggregated_data", {}).get("SPCC", {})
    routes_std = list(agg_std.keys())
    print(f"🔍 Rutas en aggregated_data (Standard): {routes_std}")

    if "ILO-MARCONA-CALLAO(B)" in routes_uni and "ILO-MARCONA" in routes_uni:
        print("\n✅ ÉXITO TOTAL: Ambas rutas conviven discriminadas y segregadas.")
        
        std_trip = agg_uni["ILO-MARCONA"]["TABLONES"]["2026-01"]
        bunk_trip = agg_uni["ILO-MARCONA-CALLAO(B)"]["TABLONES"]["2026-06"]
        
        print("\n📊 TABLA PERICIAL COMPARATIVA:")
        print(f"{'MÉTRICA':<28} │ {'ESTÁNDAR (ILO-MARCONA)':<24} │ {'CALLAO BUNKERING (B)':<24} │ {'DELTA / IMPACTO':<18}")
        print("─"*95)
        
        std_pnl = std_trip.get("voyage_result_unit", std_trip.get("voyage_result", 0) / 2)
        bunk_pnl = bunk_trip.get("voyage_result_unit", bunk_trip.get("voyage_result", 0))
        
        std_days = std_trip.get("total_duration_unit", std_trip.get("total_duration", 0) / 2)
        bunk_days = bunk_trip.get("total_duration_unit", bunk_trip.get("total_duration", 0))

        std_port = std_trip.get("total_port_costs_unit", std_trip.get("total_port_costs", 0) / 2)
        bunk_port = bunk_trip.get("total_port_costs_unit", bunk_trip.get("total_port_costs", 0))

        std_bunk = std_trip.get("total_bunker_costs_unit", std_trip.get("total_bunker_costs", 0) / 2)
        bunk_bunk = bunk_trip.get("total_bunker_costs_unit", bunk_trip.get("total_bunker_costs", 0))

        print(f"{'Días Totales (Duración)':<28} │ {std_days:>21.2f} d │ {bunk_days:>21.2f} d │ {bunk_days - std_days:>+15.2f} d")
        print(f"{'Gastos de Puerto (USD)':<28} │ ${std_port:>20,.2f} │ ${bunk_port:>20,.2f} │ ${bunk_port - std_port:>+14,.2f}")
        print(f"{'Costo Combustible (USD)':<28} │ ${std_bunk:>20,.2f} │ ${bunk_bunk:>20,.2f} │ ${bunk_bunk - std_bunk:>+14,.2f}")
        print(f"{'Margen / Voyage Result (USD)':<28} │ ${std_pnl:>20,.2f} │ ${bunk_pnl:>20,.2f} │ ${bunk_pnl - std_pnl:>+14,.2f}")
        print("="*95)
    else:
        print("\n❌ Error: Las rutas no se discriminaron correctamente.")

if __name__ == "__main__":
    test_local_engine()
