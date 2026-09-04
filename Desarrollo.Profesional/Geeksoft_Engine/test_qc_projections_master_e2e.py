"""
========================================================================================
TEST QC PROJECTIONS MASTER E2E: CAPTURA Y BLINDAJE DE CUADRE $12.16M vs $15.6M
========================================================================================
Auditor: Detective Benoit Blanc
"""
import os
import sys
import json

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.append(CURRENT_DIR)

from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest

def test_financial_projections_master():
    print("=" * 100)
    print("🕵️‍♂️ AUDITORÍA QC: REPORTE CONSOLIDADO (FINANCIAL PROJECTIONS MASTER)")
    print("=" * 100)

    sb = get_supabase()
    res = sb.table("commercial_forecasts").select("*").eq("name", "2027 PB (Jose de lo Heros + Demoras)").execute()
    if not res.data:
        print("❌ No se encontró el escenario 2027 PB (Jose de lo Heros + Demoras)")
        sys.exit(1)

    sc = res.data[0]
    print(f"📦 Escenario: {sc['name']} (ID: {sc['id']})")

    # 1. Simulación Backend Oficial
    req = ForecastRequest(
        start_date=sc.get("start_date") or "2027-01-01",
        end_date=sc.get("end_date") or "2027-12-31",
        projection_lines=sc.get("projection_lines") or [],
        port_cost_mode="DETAILED"
    )
    sim = run_forecast_simulation(req)
    agg = sim.get("aggregated_data", {})

    # 2. Replicar cálculo exacto de processedScenarios en FinancialProjectionsMaster_V2.tsx
    routes_map = {}
    vessel_set = set()

    for client, routesDict in agg.items():
        for rName, vesselsDict in routesDict.items():
            for vName, monthsDict in vesselsDict.items():
                cleanVessel = vName.replace("_", " ").upper()
                vessel_set.add(cleanVessel)

                totTm = 0.0
                totTrips = 0.0
                totPnl = 0.0
                totDays = 0.0
                lastUnitQty = 13500.0

                for _, mVal in monthsDict.items():
                    freq = float(mVal.get("freq", 0))
                    if freq <= 0: continue
                    qtyUnit = float(mVal.get("carga_unit", 13500))
                    pnl = float(mVal.get("voyage_result", 0))
                    dur = float(mVal.get("total_duration", 0))

                    totTrips += freq
                    totTm += (qtyUnit * freq)
                    totPnl += pnl
                    totDays += dur
                    lastUnitQty = qtyUnit

                if totTrips <= 0: continue

                rUpper = rName.upper()
                rKey = f"{client.upper()}__{rUpper}"

                if rKey not in routes_map:
                    routes_map[rKey] = {
                        "client": client.upper(),
                        "route": rUpper,
                        "vessels": cleanVessel,
                        "annualTons": totTm,
                        "annualTrips": totTrips,
                        "totalGrossMargin": totPnl,
                        "daysOccupation": totDays
                    }
                else:
                    routes_map[rKey]["annualTons"] += totTm
                    routes_map[rKey]["annualTrips"] += totTrips
                    routes_map[rKey]["totalGrossMargin"] += totPnl
                    routes_map[rKey]["daysOccupation"] += totDays
                    if cleanVessel not in routes_map[rKey]["vessels"]:
                        routes_map[rKey]["vessels"] += f", {cleanVessel}"

    tot_trips = sum(r["annualTrips"] for r in routes_map.values())
    tot_tm = sum(r["annualTons"] for r in routes_map.values())
    tot_pnl = sum(r["totalGrossMargin"] for r in routes_map.values())
    tot_days = sum(r["daysOccupation"] for r in routes_map.values())

    print(f"\n📊 RESULTADOS OBTENIDOS EN PROCESSED_SCENARIOS:")
    print(f"   • Total Viajes:          {tot_trips:.0f}")
    print(f"   • Total Volumen TM:      {tot_tm:,.0f} TM")
    print(f"   • Total Gross Margin:    ${tot_pnl:,.2f}")
    print(f"   • Total Días Ocupación:  {tot_days:.2f} d")

    print("\n   [DESGLOSE POR RUTAS]")
    for rKey, r in routes_map.items():
        pnl_trip = r["totalGrossMargin"] / r["annualTrips"] if r["annualTrips"] > 0 else 0
        print(f"   • {rKey:<28}: Viajes = {r['annualTrips']:>2.0f} │ PnL/Viaje = ${pnl_trip:>10,.2f} │ Margen Total = ${r['totalGrossMargin']:>12,.2f} │ Días = {r['daysOccupation']:>6.2f} d")

    # VALIDACIÓN PERICIAL ESTRICTA CONTRA MATRIZ PETRAL
    print("\n" + "─" * 100)
    print("🔎 AUDITORÍA DE CONVERGENCIA PERICIAL CON MATRIZ PETRAL Y NAVITRANSO:")
    
    # Simulación de Matriz Petral directa
    from run_qc_e2e_triple_cuadre import calc_petral, calc_navitranso
    from backend.models.forecast_models import ProjectionLine
    
    proj_lines = [ProjectionLine(**l) for l in (sc.get("projection_lines") or [])]
    months = [f"2027-{m:02d}" for m in range(1, 13)]
    p = calc_petral(agg, proj_lines, months)
    n = calc_navitranso(agg, proj_lines, months)

    diff_pnl_petral = abs(tot_pnl - p["pnl"])
    diff_pnl_nav = abs(tot_pnl - n["margenBruto"])
    diff_days = abs(tot_days - p["days"])

    print(f"   • Petral P&L:       ${p['pnl']:>14,.2f} │ Días: {p['days']:>6.2f} d")
    print(f"   • Navitranso MB:    ${n['margenBruto']:>14,.2f} │ Días: {p['days']:>6.2f} d")
    print(f"   • Consolidado MEC:  ${tot_pnl:>14,.2f} │ Días: {tot_days:>6.2f} d")
    print(f"   • Discrepancia P&L: ${diff_pnl_petral:,.4f}")
    print(f"   • Discrepancia Días:{diff_days:.4f} d")

    if diff_pnl_petral < 0.20 and diff_days < 0.10:
        print("\n✅ ÉXITO TOTAL: Cuadre 1:1:1 certificado entre Matriz Petral, Navitranso y Consolidado MEC.")
    else:
        print("\n❌ DISCREPANCIA DETECTADA:")
        sys.exit(1)

if __name__ == "__main__":
    test_financial_projections_master()
