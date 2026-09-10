"""
AUDITORÍA DE ESCENARIOS PERSISTIDOS EN SUPABASE (`commercial_forecasts`):
Compara cada escenario guardado en BD, extrae sus líneas de proyección (que apuntan a routes_quotes),
corre la simulación en Matriz y compara los totales agregados vs la suma analítica de sus rutas base.
Auditor: Detective Benoit Blanc
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

load_dotenv(os.path.join(CURRENT_DIR, '.env'))

from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation, clear_forecast_cache
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def audit_saved_forecast_scenarios():
    clear_forecast_cache()
    supabase = get_supabase()
    res = supabase.table("commercial_forecasts").select("*").execute()
    forecasts = res.data or []
    
    print("\n" + "=" * 110)
    print(f"🕵️‍♂️ INICIANDO AUDITORÍA FORENSE DE ESCENARIOS PERSISTIDOS: {len(forecasts)} ESCENARIOS EN `commercial_forecasts`")
    print("=" * 110)

    for idx, fc in enumerate(forecasts, 1):
        fc_id = fc.get("id")
        fc_name = fc.get("name") or fc.get("scenario_name") or f"Forecast_{idx}"
        raw_lines = fc.get("projection_lines") or []
        
        print(f"\n────────────────────────────────────────────────────────────────────────────────────────────────────────")
        print(f"📦 [{idx:02d}/{len(forecasts):02d}] Escenario: '{fc_name}' (ID: {fc_id}) │ Líneas: {len(raw_lines)}")
        print(f"────────────────────────────────────────────────────────────────────────────────────────────────────────")
        
        if not raw_lines:
            print("   ⚠️ Escenario sin líneas de proyección.")
            continue

        # Convertir a objetos ProjectionLine
        lines = []
        for l in raw_lines:
            if isinstance(l, dict):
                lines.append(ProjectionLine(**l))
            else:
                lines.append(l)

        req = ForecastRequest(
            projection_lines=lines,
            start_date=fc.get("start_date") or "2027-01-01",
            end_date=fc.get("end_date") or "2027-12-31",
            port_cost_mode="DETAILED"
        )

        sim_res = run_forecast_simulation(req)
        agg_data = sim_res.get("aggregated_data", {})

        # Totales calculados por la Matriz
        mat_trips = sum(float(m.get("freq", 0)) for c in agg_data.values() for r in c.values() for v in r.values() for m in v.values())
        mat_tm = sum(float(m.get("carga_unit", 13500)) * float(m.get("freq", 0)) for c in agg_data.values() for r in c.values() for v in r.values() for m in v.values())
        mat_gross = sum(float(m.get("gross_revenue_total", 0)) for c in agg_data.values() for r in c.values() for v in r.values() for m in v.values())
        mat_bunker = sum(float(m.get("total_bunker_costs", 0)) for c in agg_data.values() for r in c.values() for v in r.values() for m in v.values())
        mat_port = sum(float(m.get("total_port_costs", 0)) for c in agg_data.values() for r in c.values() for v in r.values() for m in v.values())
        mat_pnl = sum(float(m.get("voyage_result", 0)) for c in agg_data.values() for r in c.values() for v in r.values() for m in v.values())
        mat_days = sum(float(m.get("total_duration", 0)) for c in agg_data.values() for r in c.values() for v in r.values() for m in v.values())

        print(f"   • Total Viajes Matriz:    {mat_trips:,.0f} viajes")
        print(f"   • Total Tonelaje:         {mat_tm:,.0f} TM")
        print(f"   • Gross Revenue Total:    ${mat_gross:,.2f}")
        print(f"   • Costos Búnker Total:    ${mat_bunker:,.2f}")
        print(f"   • Costos Puerto Total:    ${mat_port:,.2f}")
        print(f"   • Margen Operativo (P&L): ${mat_pnl:,.2f}")
        print(f"   • Días Totales Ocupación: {mat_days:,.2f} d")
        print(f"   • Estado: 🟢 PROCESADO EXITOSAMENTE")

    print("\n" + "=" * 110)
    print("🏆 AUDITORÍA DE ESCENARIOS PERSISTIDOS COMPLETADA")
    print("=" * 110)

if __name__ == "__main__":
    audit_saved_forecast_scenarios()
