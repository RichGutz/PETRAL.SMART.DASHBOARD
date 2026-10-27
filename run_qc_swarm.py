"""
QC SWARM RUNNER - PETRAL ONE DIGITAL TWIN
Ejecuta concurrentemente el enjambre de 6 agentes de negocio + 1 agente QC Sentinel
alimentados 100% offline desde las tablas clonadas de produccion.
"""
import os
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

# Configurar paths para importar Geeksoft_Engine backend
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ENGINE_ROOT = os.path.join(CURRENT_DIR, "Desarrollo.Profesional", "Geeksoft_Engine")
if not os.path.exists(ENGINE_ROOT):
    ROOT_MAIN = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
    ENGINE_ROOT = os.path.join(ROOT_MAIN, "Desarrollo.Profesional", "Geeksoft_Engine")

sys.path.insert(0, ENGINE_ROOT)
sys.path.insert(0, os.path.join(ENGINE_ROOT, "backend"))
sys.path.insert(0, os.path.join(CURRENT_DIR, "swarm_engine"))

from local_twin_adapter import LocalDigitalTwin
from agents.agent_spcc_charterer import SpccChartererAgent
from agents.agent_nexa_acid import NexaAcidAgent
from agents.agent_wildcard_fleet import WildcardFleetAgent
from agents.agent_bunker_stresstest import BunkerStresstestAgent
from agents.agent_matrix_builder import MatrixScenarioBuilderAgent
from agents.agent_historical_replayer import HistoricalReplayerAgent
from agents.agent_financial_projections_summary import FinancialProjectionsSummaryAgent
from agents.agent_qc_sentinel import QcSentinelAgent

# Importar motor de forecast de produccion
import backend.services.forecast_service as fs
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def main():
    print("=" * 75)
    print("🛸 GEEKSOFT | QC SWARM MULTI-AGENTE AUTÓNOMO EN LOCAL (DIGITAL TWIN)")
    print("   Entorno: 100% Offline | Maestros Canónicos Inmutables | Rúbrica ABIDE")
    print("=" * 75)

    start_time = time.time()

    # 1. Cargar Gemelo Digital Local
    print("\n[1/4] Inicializando Gemelo Digital Local...")
    twin = LocalDigitalTwin()
    vessels = twin.get_table("vessels")
    quotes = twin.get_table("routes_quotes")
    forecasts = twin.get_table("commercial_forecasts")
    print(f"  >> Tablas cargadas en RAM:")
    print(f"     • Buques de la flota      : {len(vessels)}")
    print(f"     • Cotizaciones comerciales: {len(quotes)}")
    print(f"     • Escenarios históricos   : {len(forecasts)}")

    # 2. Interceptar motor matemático para usar datos locales (Zero Cloud Dependency)
    cached_data = twin.get_cached_masters()
    fs.get_supabase = lambda: None
    fs.get_cached_masters = lambda sb=None: cached_data

    # 3. Instanciar los 7 Agentes
    print("\n[2/4] Desplegando Enjambre de Agentes...")
    agent_spcc = SpccChartererAgent(twin)
    agent_nexa = NexaAcidAgent(twin)
    agent_wildcard = WildcardFleetAgent(twin)
    agent_bunker = BunkerStresstestAgent(twin)
    agent_matrix = MatrixScenarioBuilderAgent(twin)
    agent_historical = HistoricalReplayerAgent(twin)
    agent_summary = FinancialProjectionsSummaryAgent(twin)
    sentinel = QcSentinelAgent()

    agents_list = [agent_spcc, agent_nexa, agent_wildcard, agent_bunker, agent_matrix]
    for a in agents_list:
        print(f"  • {a.name} activo.")
    print(f"  • {agent_historical.name} activo.")
    print(f"  • {agent_summary.name} activo.")
    print(f"  • {sentinel.name} en guardia supervisora.")

    # 4. Ejecución del Enjambre de Negocio
    print("\n[3/4] Ejecutando Simulaciones y Estresando el Sistema...")

    # A. Corridas de Agentes 1 a 5
    for a in agents_list:
        projs = a.generate_projections()
        lines = [ProjectionLine(**p) for p in projs]
        req = ForecastRequest(
            start_date="2026-01-01",
            end_date="2026-12-31",
            port_cost_mode="static",
            projection_lines=lines
        )
        try:
            t0 = time.time()
            res = fs.run_forecast_simulation(req)
            elapsed = time.time() - t0
            ok = sentinel.audit_simulation_result(a.name, projs, res)
            status_emoji = "✅" if ok else "❌"
            print(f"  {status_emoji} [{a.name:24}]: {len(projs):2d} lineas simuladas en {elapsed*1000:.1f}ms")
        except Exception as e:
            import traceback
            print(f"  ❌ [{a.name:24}]: Excepción colapsó el motor: {e}")
            traceback.print_exc()
            sentinel.violations.append({"agent": a.name, "rule": "CRITICAL_CRASH", "detail": str(e)})

    # B. Validación de Carga de Catálogo y Replay de Escenarios Históricos (Agente 6)
    try:
        validated_catalog = agent_historical.audit_catalog_loading()
        print(f"  ✅ [{agent_historical.name}]: Catálogo de {len(validated_catalog)} escenarios validado para carga (0 errores Pydantic).")
    except Exception as cat_e:
        print(f"  ❌ [{agent_historical.name}]: Error al validar catálogo de forecasts: {cat_e}")
        sentinel.violations.append({"agent": agent_historical.name, "rule": "CATALOG_VALIDATION_ERROR", "detail": str(cat_e)})

    hist_scenarios = agent_historical.get_historical_scenarios()
    for s in hist_scenarios:
        s_name = s.get("name")
        raw_lines = s.get("lines", [])
        if not raw_lines:
            continue
        valid_lines = []
        for l in raw_lines:
            try:
                valid_lines.append(ProjectionLine(**l))
            except Exception:
                pass
        
        req = ForecastRequest(
            start_date="2026-01-01",
            end_date="2028-12-31",
            port_cost_mode="static",
            projection_lines=valid_lines
        )
        try:
            t0 = time.time()
            res = fs.run_forecast_simulation(req)
            elapsed = time.time() - t0
            ok = sentinel.audit_simulation_result(f"Replay: {s_name}", raw_lines, res)
            status_emoji = "✅" if ok else "❌"
            print(f"  {status_emoji} [{agent_historical.name}]: Replay '{s_name}' ({len(valid_lines)} líneas) en {elapsed*1000:.1f}ms")
        except Exception as e:
            print(f"  ❌ [{agent_historical.name}]: Falló replay de '{s_name}': {e}")
            sentinel.violations.append({"agent": agent_historical.name, "rule": "HISTORICAL_REGRESSION", "detail": str(e)})

    # C. Auditoría de Consistencia Resumida: Matriz Financiera vs Proyecciones Financieras (Agente 8)
    try:
        summary_results = agent_summary.audit_projections_vs_financial_matrix()
        for res in summary_results:
            s_name = res["forecast_name"]
            if res["is_consistent"]:
                print(f"  ✅ [{agent_summary.name}]: '{s_name}' Resumen MEC 1:1 ({res['matrix_volume_mt']:,.0f} MT, {res['matrix_trips']} viajes, {res['mec_total_days']} días)")
            else:
                err_msg = f"Discrepancia detectada en '{s_name}': VolDiff={res['volume_diff']}, TripsDiff={res['trips_diff']}"
                print(f"  ❌ [{agent_summary.name}]: {err_msg}")
                sentinel.violations.append({"agent": agent_summary.name, "rule": "SUMMARY_DISCREPANCY", "detail": err_msg})
    except Exception as sum_e:
        print(f"  ❌ [{agent_summary.name}]: Falló auditoría de resumen: {sum_e}")
        sentinel.violations.append({"agent": agent_summary.name, "rule": "SUMMARY_AUDIT_ERROR", "detail": str(sum_e)})

    # 5. Dictamen Pericial del Agente 7 (QC Sentinel Benoit Blanc)
    total_time = time.time() - start_time
    summary = sentinel.get_summary()

    print("\n" + "=" * 75)
    print("🔬 DICTAMEN PERICIAL FORENSE DE CALIDAD (AGENTE 7: BENOIT BLANC)")
    print("=" * 75)
    print(f"  • Total viajes/celdas auditadas : {summary['total_checked']}")
    print(f"  • Celdas matemáticamente válidas: {summary['passed_count']}")
    print(f"  • Violaciones a invariantes     : {summary['violations_count']}")
    print(f"  • Tiempo total de ejecución     : {total_time:.2f} segundos")
    print(f"  • Veredicto de Pre-Producción   : {summary['status']}")

    if summary['violations_count'] > 0:
        print("\n🚨 DETALLE DE ANOMALÍAS DETECTADAS:")
        for v in summary['violations']:
            print(f"   • [{v['agent']}] {v['rule']}: {v['detail']}")
        print("\n❌ SEMÁFORO ROJO: Despliegue a producción BLOQUEADO hasta corregir.")
        sys.exit(1)
    else:
        print("\n🛡️ SEMÁFORO VERDE: 100% de invariantes matemáticos y tipos certificados.")
        print("   El sistema en local es totalmente estable. Listo para deploy seguro a Contabo VPS.")
        sys.exit(0)

if __name__ == "__main__":
    main()
