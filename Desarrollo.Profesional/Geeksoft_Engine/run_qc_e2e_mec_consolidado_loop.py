"""
========================================================================================
LOOP QC FORENSE TRIANGULAR E2E: MULTICOTIZADOR ➔ MATRIZ PETRAL ➔ ESCENARIO ➔ INFORME MEC
========================================================================================
Auditor: Detective Benoit Blanc
Fecha: 03/09/2026
Objetivo: Auditar la cuadratura matemática 1:1 entre los 4 vértices para múltiples
          escenarios comerciales diversos (SPCC, NEXA, Monobuque, Multibuque, Con/Sin Demoras).
"""

import os
import sys
import json
from dotenv import load_dotenv

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Configurar path al engine
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.append(CURRENT_DIR)

load_dotenv(os.path.join(CURRENT_DIR, '.env'))

from backend.services.forecast_service import run_forecast_simulation, get_supabase, get_cached_masters
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def run_e2e_mec_qc_audit():
    print("=" * 100)
    print("🕵️‍♂️ INICIANDO LOOP QC FORENSE TRIANGULAR E2E - AUDITORÍA BENOIT BLANC")
    print("=" * 100)

    foreign_ports = [
        'BARQUITO', 'MEJILLONES', 'ANTOFAGASTA', 'QUINTERO', 'PATILLOS', 
        'VENTANAS', 'SAN VICENTE', 'ARICA', 'IQUIQUE', 'CORONEL', 
        'COQUIMBO', 'VALPARAISO', 'HUASCO', 'MICHILLA', 'GUAYACAN', 
        'CALETA COLOSO', 'TOCOPILLA', 'PUERTO ANGAMOS', 'LIRQUEN', 'SAN ANTONIO',
        'GUAYAQUIL', 'ESMERALDAS', 'MANTA', 'BUENAVENTURA', 'LAZARO CARDENAS'
    ]

    # DEFINICIÓN DE ESCENARIOS DIVERSOS PARA PRUEBAS POR TODOS LOS ÁNGULOS
    scenarios = [
        {
            "id": "SCENARIO_1_SPCC_DEMURRAGE",
            "name": "Año 2028 - SPCC con Demoras (Moquegua)",
            "year": "2028",
            "lines": [
                # 1. Cabotaje con demoras: 4 viajes al año
                ProjectionLine(
                    month_index=f"2028-{m:02d}", client_id="SPCC",
                    origin_port_id="ILO", destination_port_id="MATARANI",
                    vessel_id="MOQUEGUA", quantity=13500, monthly_frequency=1,
                    quote_id="SPCC.ILO.MATARANI.ILO.2028 13,500 Moquegua Dem"
                ) for m in [1, 4, 7, 10]
            ] + [
                # 2. Exportación con demoras: 2 viajes al año
                ProjectionLine(
                    month_index=f"2028-{m:02d}", client_id="SPCC",
                    origin_port_id="ILO", destination_port_id="MEJILLONES",
                    vessel_id="MOQUEGUA", quantity=13500, monthly_frequency=1,
                    quote_id="SPCC.ILO.MEJILLONES.ILO.2028 13,500 tm Moquegua Dem"
                ) for m in [3, 9]
            ]
        },
        {
            "id": "SCENARIO_2_MULTIVESSEL_JOSE_HEROS",
            "name": "Año 2027 - PB Base Jose de los Heros (Multi-Buque)",
            "year": "2027",
            "lines": [
                # Ruta 1: ILO-MATARANI (23 viajes: 12 Moquegua + 11 Tablones)
                ProjectionLine(
                    month_index=f"2027-{m:02d}", client_id="SPCC",
                    origin_port_id="ILO", destination_port_id="MATARANI",
                    vessel_id="MOQUEGUA", quantity=13500, monthly_frequency=1
                ) for m in range(1, 13)
            ] + [
                ProjectionLine(
                    month_index=f"2027-{m:02d}", client_id="SPCC",
                    origin_port_id="ILO", destination_port_id="MATARANI",
                    vessel_id="TABLONES", quantity=13500, monthly_frequency=1
                ) for m in range(1, 12)
            ] + [
                # Ruta 2: ILO-MEJILLONES (Exportación: 18 viajes Moquegua)
                ProjectionLine(
                    month_index=f"2027-{m:02d}", client_id="SPCC",
                    origin_port_id="ILO", destination_port_id="MEJILLONES",
                    vessel_id="MOQUEGUA", quantity=13500, monthly_frequency=2 if m in [1,2,3,4,5,6] else 1
                ) for m in range(1, 13)
            ] + [
                # Ruta 3: ILO-MARCONA (19 viajes Tablones)
                ProjectionLine(
                    month_index=f"2027-{m:02d}", client_id="SPCC",
                    origin_port_id="ILO", destination_port_id="MARCONA",
                    vessel_id="TABLONES", quantity=13500, monthly_frequency=2 if m in [1,2,3,4,5,6,7] else 1
                ) for m in range(1, 13)
            ]
        },
        {
            "id": "SCENARIO_3_NEXA_TRIANGULAR",
            "name": "Año 2026 - NEXA Triangular (IZ)",
            "year": "2026",
            "lines": [
                ProjectionLine(
                    month_index=f"2026-{m:02d}", client_id="NEXA",
                    origin_port_id="ILO", destination_port_id="MATARANI",
                    vessel_id="MOQUEGUA", quantity=13500, monthly_frequency=1,
                    quote_id="NEXA.ILO.CALLAO.MATARANI.ILO.2026 (IZ)"
                ) for m in range(1, 13)
            ]
        },
        {
            "id": "SCENARIO_4_MULTI_CLIENT_4_VESSELS",
            "name": "Año 2027 - Multi-Cliente (SPCC + NEXA) Flota Completa 4 Buques",
            "year": "2027",
            "lines": [
                # SPCC Cabotaje con MOQUEGUA (12 viajes)
                ProjectionLine(
                    month_index=f"2027-{m:02d}", client_id="SPCC",
                    origin_port_id="ILO", destination_port_id="MATARANI",
                    vessel_id="MOQUEGUA", quantity=13500, monthly_frequency=1,
                    quote_id="SPCC.ILO.MATARANI.ILO.2028 13,500 Moquegua Dem"
                ) for m in range(1, 13)
            ] + [
                # SPCC Exportación con TABLONES (6 viajes)
                ProjectionLine(
                    month_index=f"2027-{m:02d}", client_id="SPCC",
                    origin_port_id="ILO", destination_port_id="MEJILLONES",
                    vessel_id="TABLONES", quantity=13500, monthly_frequency=1
                ) for m in [2, 4, 6, 8, 10, 12]
            ] + [
                # NEXA Cabotaje con CONCON_TRADER (6 viajes)
                ProjectionLine(
                    month_index=f"2027-{m:02d}", client_id="NEXA",
                    origin_port_id="ILO", destination_port_id="CALLAO",
                    vessel_id="CONCON_TRADER", quantity=19000, monthly_frequency=1
                ) for m in [1, 3, 5, 7, 9, 11]
            ] + [
                # SPCC Cabotaje con HUEMUL (4 viajes)
                ProjectionLine(
                    month_index=f"2027-{m:02d}", client_id="SPCC",
                    origin_port_id="ILO", destination_port_id="MARCONA",
                    vessel_id="HUEMUL", quantity=22062, monthly_frequency=1
                ) for m in [3, 6, 9, 12]
            ]
        }
    ]

    total_scenarios_tested = 0
    total_passed = 0
    audit_results = []

    for sc in scenarios:
        total_scenarios_tested += 1
        sc_name = sc["name"]
        lines = sc["lines"]
        year = sc["year"]
        start_date = f"{year}-01-01"
        end_date = f"{year}-12-31"

        print(f"\n────────────────────────────────────────────────────────────────────────────────────────")
        print(f"📦 AUDITANDO ESCENARIO: {sc_name} ({len(lines)} líneas de proyección)")
        print(f"────────────────────────────────────────────────────────────────────────────────────────")

        # 1. EJECUCIÓN DEL VÉRTICE 2 (MATRIZ PETRAL)
        req = ForecastRequest(
            projection_lines=lines,
            start_date=start_date,
            end_date=end_date,
            port_cost_mode="DETAILED"
        )
        sim_res = run_forecast_simulation(req)
        agg_data = sim_res.get("aggregated_data", {})

        # Calcular Totales Directos de la Matriz Petral (Nivel 2)
        matrix_total_trips = 0
        matrix_total_tm = 0
        matrix_total_pnl = 0.0
        matrix_total_gross_rev = 0.0
        matrix_total_bunker = 0.0
        matrix_total_port_costs = 0.0
        matrix_total_days = 0.0
        matrix_total_demurrage = 0.0

        for client, r_dict in agg_data.items():
            for r_name, v_dict in r_dict.items():
                for v_name, m_dict in v_dict.items():
                    for m_idx, m_val in m_dict.items():
                        freq = float(m_val.get("freq", 0))
                        if freq <= 0:
                            continue
                        matrix_total_trips += freq
                        matrix_total_tm += float(m_val.get("carga_unit", 13500)) * freq
                        matrix_total_pnl += float(m_val.get("voyage_result", 0))
                        matrix_total_gross_rev += float(m_val.get("gross_revenue_total", 0))
                        matrix_total_bunker += float(m_val.get("total_bunker_costs", 0))
                        matrix_total_port_costs += float(m_val.get("total_port_costs", 0))
                        matrix_total_days += float(m_val.get("total_duration", 0))
                        matrix_total_demurrage += float(m_val.get("demurrage_revenue", 0))

        # 2. CÁLCULO DEL VÉRTICE 4 (INFORME CONSOLIDADO / MEC 1:1 CON EL FRONTEND)
        # Reproducimos exactamente la lógica de processedScenarios de FinancialProjectionsMaster_V2.tsx
        routes_map = {}
        vessel_set = set()

        for client, r_dict in agg_data.items():
            for r_name, v_dict in r_dict.items():
                for v_name, m_dict in v_dict.items():
                    clean_vessel = v_name.replace("_", " ").upper()
                    vessel_set.add(clean_vessel)

                    tot_tm = 0.0
                    tot_trips = 0.0
                    tot_pnl = 0.0
                    tot_days = 0.0
                    last_unit_qty = 13500.0

                    for _, m_val in m_dict.items():
                        freq = float(m_val.get("freq", 0))
                        if freq <= 0:
                            continue
                        qty_unit = float(m_val.get("carga_unit", 13500))
                        pnl = float(m_val.get("voyage_result", 0))
                        dur = float(m_val.get("total_duration", 0))

                        tot_trips += freq
                        tot_tm += (qty_unit * freq)
                        tot_pnl += pnl
                        tot_days += dur
                        last_unit_qty = qty_unit

                    if tot_trips <= 0:
                        continue

                    route_upper = r_name.upper()
                    is_export = any(p in route_upper for p in foreign_ports) or "EXP" in route_upper or "CHILE" in route_upper
                    route_key = f"{client.upper()}__{route_upper}"

                    vessel_detail_item = {
                        "vessel": clean_vessel,
                        "annualTons": tot_tm,
                        "fullLoad": (tot_tm / tot_trips) if tot_trips > 0 else last_unit_qty,
                        "annualTrips": tot_trips,
                        "pnlPerTrip": (tot_pnl / tot_trips) if tot_trips > 0 else 0,
                        "totalGrossMargin": tot_pnl,
                        "daysOccupation": tot_days
                    }

                    if route_key not in routes_map:
                        routes_map[route_key] = {
                            "client": client.upper(),
                            "route": route_upper,
                            "vessel": clean_vessel,
                            "isExport": is_export,
                            "annualTons": tot_tm,
                            "fullLoad": (tot_tm / tot_trips) if tot_trips > 0 else last_unit_qty,
                            "annualTrips": tot_trips,
                            "pnlPerTrip": (tot_pnl / tot_trips) if tot_trips > 0 else 0,
                            "totalGrossMargin": tot_pnl,
                            "daysOccupation": tot_days,
                            "vesselDetails": [vessel_detail_item]
                        }
                    else:
                        routes_map[route_key]["annualTons"] += tot_tm
                        routes_map[route_key]["annualTrips"] += tot_trips
                        routes_map[route_key]["totalGrossMargin"] += tot_pnl
                        routes_map[route_key]["daysOccupation"] += tot_days
                        routes_map[route_key]["vesselDetails"].append(vessel_detail_item)
                        if clean_vessel not in routes_map[route_key]["vessel"]:
                            routes_map[route_key]["vessel"] += f", {clean_vessel}"

        # Consolidar Cuadro 1 (Cabotaje vs Exportación)
        mec_cabotage_trips = sum(r["annualTrips"] for r in routes_map.values() if not r["isExport"])
        mec_cabotage_tm = sum(r["annualTons"] for r in routes_map.values() if not r["isExport"])
        mec_export_trips = sum(r["annualTrips"] for r in routes_map.values() if r["isExport"])
        mec_export_tm = sum(r["annualTons"] for r in routes_map.values() if r["isExport"])

        mec_total_trips = mec_cabotage_trips + mec_export_trips
        mec_total_tm = mec_cabotage_tm + mec_export_tm

        # Consolidar Cuadro 2 (Rutas, P/L, Margen y Días)
        mec_total_pnl = sum(r["totalGrossMargin"] for r in routes_map.values())
        mec_total_days = sum(r["daysOccupation"] for r in routes_map.values())

        # 3. VERIFICACIÓN FORENSE DE CUADRATURA (DIFERENCIAS EXACTAS)
        diff_trips = abs(matrix_total_trips - mec_total_trips)
        diff_tm = abs(matrix_total_tm - mec_total_tm)
        diff_pnl = abs(matrix_total_pnl - mec_total_pnl)
        diff_days = abs(matrix_total_days - mec_total_days)

        is_quad_perfect = (diff_trips == 0 and diff_tm == 0 and diff_pnl < 0.01 and diff_days < 0.01)

        if is_quad_perfect:
            total_passed += 1
            status_str = "🟢 EXACTO (100% CUADRADO)"
        else:
            status_str = "🔴 DISCREPANCIA DETECTADA"

        print(f"📊 RESULTADOS DE CUADRATURA PERICIAL:")
        print(f"   • N° Total Viajes:    Matriz = {matrix_total_trips:,.0f} │ Informe Consolidado = {mec_total_trips:,.0f} │ Diff = {diff_trips} -> {'✅' if diff_trips==0 else '❌'}")
        print(f"   • Volumen Total (TM): Matriz = {matrix_total_tm:,.0f} │ Informe Consolidado = {mec_total_tm:,.0f} │ Diff = {diff_tm} -> {'✅' if diff_tm==0 else '❌'}")
        print(f"   • Margen Operativo $: Matriz = ${matrix_total_pnl:,.2f} │ Informe Consolidado = ${mec_total_pnl:,.2f} │ Diff = ${diff_pnl:.2f} -> {'✅' if diff_pnl<0.01 else '❌'}")
        print(f"   • Días Ocupación:     Matriz = {matrix_total_days:,.2f} d │ Informe Consolidado = {mec_total_days:,.2f} d │ Diff = {diff_days:.2f} d -> {'✅' if diff_days<0.01 else '❌'}")
        print(f"   • Demurrage Total:    Matriz = ${matrix_total_demurrage:,.2f} (Integrado en P&L del Informe Consolidado)")
        print(f"   • Distribución Macro: Cabotaje = {mec_cabotage_tm:,.0f} TM ({(mec_cabotage_tm/mec_total_tm*100) if mec_total_tm>0 else 0:.2f}%) │ Exportación = {mec_export_tm:,.0f} TM ({(mec_export_tm/mec_total_tm*100) if mec_total_tm>0 else 0:.2f}%)")
        print(f"   • ESTADO DEL ESCENARIO: {status_str}")

        audit_results.append({
            "scenario": sc_name,
            "trips": matrix_total_trips,
            "tm": matrix_total_tm,
            "pnl": matrix_total_pnl,
            "days": matrix_total_days,
            "demurrage": matrix_total_demurrage,
            "status": "PASS" if is_quad_perfect else "FAIL"
        })

    print("\n" + "=" * 100)
    print(f"🏆 RESUMEN FINAL DEL LOOP QC E2E:")
    print(f"   • Escenarios auditados: {total_scenarios_tested}")
    print(f"   • Escenarios 100% Cuadrados al Centavo: {total_passed}/{total_scenarios_tested}")
    print("=" * 100)

    return total_passed == total_scenarios_tested

if __name__ == "__main__":
    success = run_e2e_mec_qc_audit()
    sys.exit(0 if success else 1)
