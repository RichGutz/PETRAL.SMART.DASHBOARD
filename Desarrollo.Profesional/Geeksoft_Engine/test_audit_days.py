import os, sys, json
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(CURRENT_DIR)
from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest

sb = get_supabase()
target_names = [
    'PROPUESTA INCREMENTO DE FLETE @ 22-26K DEM',
    'PROPUESTA INCREMENTO DE FLETE @ $20K DEM',
    '2027 PB (Jose de lo Heros + Demoras)'
]

for t_name in target_names:
    res = sb.table('commercial_forecasts').select('*').eq('name', t_name).execute()
    if not res.data:
        continue
    sc = res.data[0]
    raw_lines = sc.get('projection_lines') or []
    all_months = sorted(list(set(l.get('month_index') for l in raw_lines if l.get('month_index'))))
    year = all_months[0].split('-')[0] if all_months else '2027'
    
    req = ForecastRequest(
        start_date=f"{year}-01-01",
        end_date=f"{year}-12-31",
        projection_lines=raw_lines,
        port_cost_mode="DETAILED"
    )
    sim = run_forecast_simulation(req)
    agg = sim.get('aggregated_data', {})
    
    print("\n" + "="*90)
    print(f"ESCENARIO: {t_name} ({year})")
    print("="*90)
    
    total_days_consolidado = 0.0
    total_trips_consolidado = 0
    
    for client, routes in agg.items():
        for r_name, vessels in routes.items():
            print(f"\n[RUTA] {r_name}")
            r_days = 0.0
            r_trips = 0
            for v_name, months in vessels.items():
                v_trips = 0
                v_days = 0.0
                sample_dur_per_trip = 0.0
                for m_k, m_val in months.items():
                    freq = float(m_val.get('freq', 0))
                    dur = float(m_val.get('total_duration', 0))
                    dur_unit = float(m_val.get('total_duration_unit', 0))
                    if freq > 0:
                        v_trips += freq
                        v_days += dur
                        sample_dur_per_trip = dur_unit or (dur / freq)
                if v_trips > 0:
                    print(f"   -> Buque: {v_name:<12s} | {v_trips:2.0f} viajes | Duracion unitaria: {sample_dur_per_trip:.4f} d/vj | Dias en anio: {v_days:.2f} d (Redondeado: {round(v_days)} d)")
                    r_days += v_days
                    r_trips += v_trips
            print(f"   -- Total Ruta {r_name}: {r_trips} viajes | Dias exactos: {r_days:.2f} d | Redondeado en tarjeta: {round(r_days)} d")
            total_days_consolidado += r_days
            total_trips_consolidado += r_trips
            
    print(f"\n>> TOTAL GENERAL: {total_trips_consolidado} viajes")
    print(f">> DIAS OCUPACION TOTAL: {total_days_consolidado:.2f} dias (Redondeado en Tarjeta: {round(total_days_consolidado)} d)")
    print(f">> DIAS DISPONIBLES (720d - {round(total_days_consolidado)}d): {720 - round(total_days_consolidado)} d")
