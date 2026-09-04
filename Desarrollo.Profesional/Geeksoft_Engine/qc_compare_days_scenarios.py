import os
import sys
import json
from dotenv import load_dotenv

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.append(CURRENT_DIR)

load_dotenv(os.path.join(CURRENT_DIR, '.env'))

from backend.services.forecast_service import run_forecast_simulation, get_supabase
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def analyze_scenarios():
    supabase = get_supabase()
    res = supabase.table('commercial_forecasts').select('*').execute()
    
    target_names = [
        'PROPUESTA INCREMENTO DE FLETE @ 22-26K DEM',
        'PROPUESTA INCREMENTO DE FLETE @ $20K DEM',
        '2027 PB (Jose de lo Heros + Demoras)'
    ]
    
    for t_name in target_names:
        sc = next((s for s in res.data if s.get('name') == t_name), None)
        if not sc:
            sc = next((s for s in res.data if t_name.lower() in (s.get('name') or '').lower()), None)
            
        if not sc:
            print(f"No se encontró: {t_name}")
            continue
            
        name = sc.get('name')
        sc_id = sc.get('id')
        raw_lines = sc.get('projection_lines', [])
        
        all_months = sorted(list(set(l.get('month_index') for l in raw_lines if l.get('month_index'))))
        year = all_months[0].split('-')[0] if all_months else '2027'
        start_date = f"{year}-01-01"
        end_date = f"{year}-12-31"
        
        print("\n" + "="*110)
        print(f"🕵️ AUDITORÍA DE DÍAS: {name} (Año {year})")
        print(f"Horizonte: {start_date} a {end_date} │ Líneas en DB: {len(raw_lines)}")
        print("="*110)
        
        cleaned_lines = []
        for line in raw_lines:
            l_copy = {k: v for k, v in line.items() if not k.startswith('metadata_')}
            l_copy['quantity'] = float(l_copy.get('quantity') or 0)
            l_copy['monthly_frequency'] = int(l_copy.get('monthly_frequency') or 0)
            if l_copy.get('custom_tariff') is not None:
                l_copy['custom_tariff'] = float(l_copy['custom_tariff'])
            cleaned_lines.append(ProjectionLine(**l_copy))
            
        req = ForecastRequest(
            start_date=start_date,
            end_date=end_date,
            projection_lines=cleaned_lines,
            port_cost_mode="DETAILED"
        )
        
        sim = run_forecast_simulation(req)
        agg = sim.get('aggregated_data', {}) if isinstance(sim, dict) else (sim.aggregated_data if hasattr(sim, 'aggregated_data') else {})
        if hasattr(agg, 'dict'):
            agg = agg.dict()
        elif hasattr(agg, 'model_dump'):
            agg = agg.model_dump()
            
        total_days_all = 0.0
        total_trips_all = 0
        route_stats = {}
        
        for client, r_data in agg.items():
            for route, v_data in r_data.items():
                if route not in route_stats:
                    route_stats[route] = {
                        'trips': 0,
                        'total_days': 0.0,
                        'vessels': {}
                    }
                for vessel, m_data in v_data.items():
                    v_trips = 0
                    v_days = 0.0
                    v_dur = 0.0
                    for m_str, m_vals in m_data.items():
                        if hasattr(m_vals, 'dict'):
                            m_vals = m_vals.dict()
                        elif hasattr(m_vals, 'model_dump'):
                            m_vals = m_vals.model_dump()
                        freq = int(m_vals.get('frequency', 0))
                        dur = float(m_vals.get('total_duration', 0.0))
                        if freq > 0:
                            v_trips += freq
                            v_days += dur * freq
                            v_dur = dur
                    
                    if v_trips > 0:
                        route_stats[route]['vessels'][vessel] = {
                            'trips': v_trips,
                            'duration': v_dur,
                            'days': v_days
                        }
                        route_stats[route]['trips'] += v_trips
                        route_stats[route]['total_days'] += v_days
                        total_days_all += v_days
                        total_trips_all += v_trips
                    
        print(f"\n--- COMPARATIVA POR RUTA (MATRIZ PETRAL vs TARJETA MAESTRO DE MATRICES) ---")
        print(f"{'RUTA':<18} │ {'VIAJES':<6} │ {'DÍAS EXACTOS (PETRAL)':<23} │ {'REDONDEADO':<11} │ {'DURACIÓN X VJ'}")
        print("─"*110)
        for r_name, r_info in route_stats.items():
            dur_txt = ", ".join([f"{v}: {info['duration']:.4f}d ({info['trips']}vj = {info['days']:.2f}d)" for v, info in r_info['vessels'].items()])
            print(f"{r_name:<18} │ {r_info['trips']:<6} │ {r_info['total_days']:<23.2f} │ {round(r_info['total_days']):<11} │ {dur_txt}")
            
        print("─"*110)
        print(f"TOTAL FLOTA (60 VJ)│ {total_trips_all:<6} │ {total_days_all:<23.2f} │ {round(total_days_all):<11} │ Base Flota 2 Buques")
        print(f"\n>> DÍAS OCUPACIÓN TOTAL: {total_days_all:.2f} días (Redondeado: {round(total_days_all)} d)")
        print(f">> DÍAS DISPONIBLES (720d año comercial 360d x 2 buques - {round(total_days_all)}d): {720 - round(total_days_all)} d")
        print(f">> DÍAS DISPONIBLES (730d año calendario 365d x 2 buques - {round(total_days_all)}d): {730 - round(total_days_all)} d")

if __name__ == '__main__':
    analyze_scenarios()
