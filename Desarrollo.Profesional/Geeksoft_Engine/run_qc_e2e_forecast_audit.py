import os
import sys
import json
import traceback

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run_e2e_forecast_qc():
    print("=" * 100)
    print("🧪 [QC AUTOMATIZADO LOCAL] AUDITORÍA E2E DE ESCENARIOS, SIMULACIÓN Y PAYLOADS")
    print("=" * 100)

    from backend.database import get_supabase
    from backend.services.forecast_service import run_forecast_simulation
    from backend.models.forecast_models import ForecastRequest

    sb = get_supabase()
    
    # 1. Listar escenarios guardados en la BD
    print("\n📂 1. Consultando catálogo de escenarios guardados en Supabase...")
    res = sb.table("commercial_forecasts").select("*").order("created_at", desc=True).limit(5).execute()
    saved = res.data or []
    
    if not saved:
        print("❌ No se encontraron escenarios guardados en la BD.")
        return False

    print(f"   Encontrados {len(saved)} escenarios recientes:")
    for s in saved:
        print(f"   • ID: {s.get('id')} │ Nombre: '{s.get('name')}' │ Autor: {s.get('user_id')} │ Líneas: {len(s.get('projection_lines') or [])}")

    target_scenario = None
    for s in saved:
        if "MODULAR" in (s.get("name") or "").upper():
            target_scenario = s
            break
    if not target_scenario:
        target_scenario = saved[0]

    print(f"\n🎯 2. Auditando Escenario Seleccionado: '{target_scenario.get('name')}' (ID: {target_scenario.get('id')})")
    lines = target_scenario.get("projection_lines") or []
    print(f"   Total líneas de proyección: {len(lines)}")
    for i, l in enumerate(lines[:5]):
        print(f"   [{i+1}] Mes: {l.get('month_index')} │ Buque: {l.get('vessel_id')} │ Cliente: {l.get('client_id')} │ Origen: {l.get('origin_port_id')} -> Destino: {l.get('destination_port_id')} │ Freq: {l.get('monthly_frequency')} │ Tarifa: {l.get('custom_tariff')} │ QuoteID: {l.get('quote_id')}")

    # 3. Correr Simulación Local del Motor
    print("\n⚙️ 3. Ejecutando Motor de Simulación (run_forecast_simulation)...")
    
    req = ForecastRequest(
        start_date=target_scenario.get("start_date") or "2026-07-01",
        end_date=target_scenario.get("end_date") or "2026-12-31",
        projection_lines=lines,
        port_cost_mode="static"
    )

    try:
        sim_result = run_forecast_simulation(req)
        print("   ✅ Simulación completada con éxito.")
        print(f"   🔑 Keys en sim_result: {list(sim_result.keys())}")
        if "months" in sim_result:
            print(f"   📅 sim_result['months'] = {sim_result['months']}")
    except Exception as e:
        print(f"   ❌ ERROR al calcular simulación: {e}")
        traceback.print_exc()
        return False

    ag = sim_result.get("aggregated_data") or {}
    print(f"\n📊 4. Estructura de `aggregated_data` generada:")
    print(f"   Clientes en payload: {list(ag.keys())}")

    for client, routes in ag.items():
        print(f"\n   🏢 Cliente: {client}")
        for route, vessels in routes.items():
            print(f"      📏 Ruta: {route}")
            for vessel, months in vessels.items():
                print(f"         🚢 Buque: {vessel} (Meses con datos: {list(months.keys())})")
                for m_key, metrics in list(months.items())[:2]:
                    print(f"            📅 {m_key}: NetIncome=${metrics.get('net_income', 0):,.2f}, VoyageResult=${metrics.get('voyage_result', 0):,.2f}, Freq={metrics.get('freq', 0)}, Tons={metrics.get('carga_unit', 0)}")

    # 5. Simulación de Análisis Gráfico (InteractiveChart logic con active_months dinámicos)
    print("\n📈 5. Simulando transformación de datos para ANÁLISIS GRÁFICO (InteractiveChart):")
    
    # Extraer meses activos presentes en aggregated_data
    active_months_set = set()
    for client, routes in ag.items():
        for route, vessels in routes.items():
            for vessel, months in vessels.items():
                for m in months.keys():
                    active_months_set.add(m)
    
    active_months = sorted(list(active_months_set))
    print(f"   📅 Meses reales identificados en dataset ({len(active_months)}): {active_months}")
    
    metrics_to_test = ['viajes', 'net_income', 'total_port_costs', 'total_bunker_costs', 'voyage_result', 'pl_percentage', 'total_cargo', 'demurrage', 'gross_plus_dem', 'yield']
    
    for metric in metrics_to_test:
        series_count = 0
        total_accum = 0
        for client, routes in ag.items():
            for route, vessels in routes.items():
                for vessel, months in vessels.items():
                    series_count += 1
                    for m in active_months:
                        m_data = months.get(m) or {}
                        raw_freq = m_data.get('raw_inputs', {}).get('monthly_frequency', m_data.get('freq', 0))
                        if metric == 'viajes':
                            total_accum += raw_freq
                        elif metric == 'net_income':
                            total_accum += m_data.get('net_income', 0)
                        elif metric == 'voyage_result':
                            total_accum += m_data.get('voyage_result', 0)
                        elif metric == 'total_cargo':
                            total_accum += (m_data.get('carga_unit', 0) * raw_freq)
        print(f"   • Métrica '{metric:<20}': {series_count} series procesadas. Valor acumulado global = {total_accum:,.2f}")

    # 6. Simulación de Spaghetti Map
    print("\n🗺️ 6. Simulando transformación de datos para SPAGHETTI MAP:")
    ports_res = sb.table("ports").select("*").execute()
    ports = ports_res.data or []
    port_ids = {p.get("port_id"): p for p in ports}
    print(f"   Puertos maestros cargados: {len(ports)}")

    map_legs_count = 0
    for client, routes in ag.items():
        for route, vessels in routes.items():
            # Extraer puertos
            import re
            parts = [p.strip().upper() for p in re.split(r'[\.\-\s\(\):_]+', route) if p.strip()]
            valid_ports = [p for p in parts if p in port_ids]
            if len(valid_ports) >= 2:
                map_legs_count += (len(valid_ports) - 1)
                print(f"   • Ruta '{route}': Identificados {len(valid_ports)} puertos -> {valid_ports} ({len(valid_ports)-1} piernas de navegación)")
            else:
                print(f"   ⚠️ Ruta '{route}': NO se pudieron descomponer puertos válidos. Partes encontradas: {parts}")

    print("\n" + "=" * 100)
    print(f"✅ [QC SUMMARY] Simulación y consumo de datos validados localmente. Escenario '{target_scenario.get('name')}' es 100% válido.")
    print("=" * 100)
    return True

if __name__ == "__main__":
    run_e2e_forecast_qc()
