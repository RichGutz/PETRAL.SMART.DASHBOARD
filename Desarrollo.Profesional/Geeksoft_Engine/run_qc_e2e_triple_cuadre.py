"""
========================================================================================
LOOP QC FORENSE: TRIPLE CUADRE MATEMÁTICO 1:1:1
MATRIZ PETRAL ↔ MATRIZ NAVITRANSO ↔ REPORTE CONSOLIDADO (MEC)
========================================================================================
Auditor: Detective Benoit Blanc
Fecha: 04/09/2026
Objetivo: Demostrar y certificar la cuadratura matemática estricta al centavo ($0.00 de discrepancia)
          entre los 3 vértices para todos los escenarios:
          1. Matriz Petral (ForecastGrid.tsx)
          2. Matriz Navitranso (FinancialMatrixNavitransoGridTable.tsx)
          3. Reporte Consolidado (FinancialProjectionsMaster_V2.tsx)
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

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.append(CURRENT_DIR)

load_dotenv(os.path.join(CURRENT_DIR, '.env'))

from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def calc_petral(agg_data, projection_lines, months):
    total_trips = 0
    total_tm = 0.0
    total_freight = 0.0
    total_demurrage = 0.0
    total_muellaje = 0.0
    total_gross = 0.0
    total_bunker = 0.0
    total_port = 0.0
    total_comm = 0.0
    total_charter = 0.0
    total_pnl = 0.0
    total_days = 0.0

    for client, r_dict in agg_data.items():
        for route, v_dict in r_dict.items():
            for vessel, m_dict in v_dict.items():
                for m in months:
                    mD = m_dict.get(m, {})
                    line = next((p for p in projection_lines if p.client_id == client and f"{p.origin_port_id}-{p.destination_port_id}" == route and p.vessel_id == vessel and p.month_index == m), None)
                    freq = line.monthly_frequency if line else mD.get("trips", mD.get("freq", 0))
                    if freq <= 0: continue

                    unit_tm = float(mD.get("carga_unit", 13500))
                    tons = unit_tm * freq
                    total_tm += tons

                    unit_freight = float(mD.get("freight_revenue_unit", mD.get("gross_income_unit", unit_tm * float(mD.get("flete_unit", 0)))))
                    freight = unit_freight * freq
                    total_freight += freight

                    d_unit = mD.get("demurrage_revenue_unit", mD.get("demurrage_income_unit"))
                    dem = float(d_unit) * freq if (d_unit is not None and float(d_unit) > 0) else float(mD.get("demurrage_revenue", 0.0))
                    total_demurrage += dem

                    m_unit = mD.get("dockage_revenue_unit", mD.get("refacturacion_muellaje_unit"))
                    muell = float(m_unit) * freq if (m_unit is not None and float(m_unit) > 0) else float(mD.get("dockage_revenue", 0.0))
                    total_muellaje += muell

                    gross = freight + muell + dem
                    total_gross += gross

                    comm = float(mD.get("total_commissions_unit", 0.0)) * freq if mD.get("total_commissions_unit") else float(mD.get("total_commissions", 0.0))
                    total_comm += comm

                    port = float(mD.get("total_port_costs_unit", 0.0)) * freq if mD.get("total_port_costs_unit") else float(mD.get("total_port_costs", 0.0))
                    total_port += port

                    bunk = float(mD.get("total_bunker_costs_unit", 0.0)) * freq if mD.get("total_bunker_costs_unit") else float(mD.get("total_bunker_costs", 0.0))
                    total_bunker += bunk

                    chart = float(mD.get("charter_hire_cost_unit", 0.0)) * freq if mD.get("charter_hire_cost_unit") else float(mD.get("charter_hire_cost", 0.0))
                    total_charter += chart

                    pnl = gross - comm - port - bunk - chart
                    total_pnl += pnl

                    dur = float(mD.get("total_duration", 0.0))
                    total_days += dur
                    total_trips += freq

    return {
        "trips": total_trips, "tm": total_tm, "freight": total_freight, "demurrage": total_demurrage,
        "muellaje": total_muellaje, "gross": total_gross, "bunker": total_bunker, "port": total_port,
        "comm": total_comm, "charter": total_charter, "pnl": total_pnl, "days": total_days
    }

def calc_navitranso(agg_data, projection_lines, months):
    total_trips = 0
    total_hire = 0.0
    total_demRev = 0.0
    total_ingPto = 0.0
    total_ventas = 0.0
    total_bunker = 0.0
    total_port = 0.0
    total_comm = 0.0
    total_arriendo = 0.0
    total_margenBruto = 0.0
    total_tm = 0.0

    for client, r_dict in agg_data.items():
        for route, v_dict in r_dict.items():
            for vessel, m_dict in v_dict.items():
                for m in months:
                    mD = m_dict.get(m, {})
                    line = next((p for p in projection_lines if p.client_id == client and f"{p.origin_port_id}-{p.destination_port_id}" == route and p.vessel_id == vessel and p.month_index == m), None)
                    freq = line.monthly_frequency if line else mD.get("freq", 1)
                    if freq <= 0: continue

                    unit_tm = float(mD.get("carga_unit", 13500))
                    total_tm += (unit_tm * freq)

                    u_freight = float(mD.get("freight_revenue_unit", mD.get("gross_income_unit", unit_tm * float(mD.get("flete_unit", 0)))))
                    h = u_freight * freq if u_freight > 0 else float(mD.get("freight_revenue", 0.0))

                    u_dem = mD.get("demurrage_revenue_unit", mD.get("demurrage_income_unit"))
                    d = float(u_dem) * freq if (u_dem is not None and float(u_dem) > 0) else float(mD.get("demurrage_revenue", 0.0))

                    u_muell = mD.get("dockage_revenue_unit", mD.get("refacturacion_muellaje_unit"))
                    ing_p = float(u_muell) * freq if (u_muell is not None and float(u_muell) > 0) else float(mD.get("dockage_revenue", 0.0))

                    ventas = h + d + ing_p

                    u_bunk = mD.get("total_bunker_costs_unit")
                    comb = float(u_bunk) * freq if (u_bunk is not None and float(u_bunk) > 0) else float(mD.get("total_bunker_costs", 0.0))

                    u_port = mD.get("total_port_costs_unit")
                    pto = float(u_port) * freq if (u_port is not None and float(u_port) > 0) else float(mD.get("total_port_costs", 0.0))

                    u_comm = mD.get("total_commissions_unit")
                    comm = float(u_comm) * freq if (u_comm is not None and float(u_comm) > 0) else float(mD.get("total_commissions", 0.0))

                    costos_dir = comb + pto + comm
                    tce = ventas - costos_dir

                    u_chart = mD.get("charter_hire_cost_unit")
                    arr = float(u_chart) * freq if (u_chart is not None and float(u_chart) > 0) else float(mD.get("charter_hire_cost", 0.0))

                    mb = tce - arr

                    total_trips += freq
                    total_hire += h
                    total_demRev += d
                    total_ingPto += ing_p
                    total_ventas += ventas
                    total_bunker += comb
                    total_port += pto
                    total_comm += comm
                    total_arriendo += arr
                    total_margenBruto += mb

    return {
        "trips": total_trips, "tm": total_tm, "hire": total_hire, "demRev": total_demRev,
        "ingPto": total_ingPto, "ventas": total_ventas, "bunker": total_bunker, "port": total_port,
        "comm": total_comm, "arriendo": total_arriendo, "margenBruto": total_margenBruto
    }

def calc_consolidado_mec(agg_data):
    """
    Cálculo canónico del Reporte Consolidado (MEC) a partir de aggregated_data
    """
    routes_map = {}
    for client, routesDict in agg_data.items():
        for rName, vesselsDict in routesDict.items():
            for vName, monthsDict in vesselsDict.items():
                totTrips = sum(float(m.get("freq", 0)) for m in monthsDict.values())
                if totTrips <= 0: continue
                totTm = sum(float(m.get("carga_unit", 13500)) * float(m.get("freq", 0)) for m in monthsDict.values())
                totPnl = sum(float(m.get("voyage_result", 0)) for m in monthsDict.values())
                totDays = sum(float(m.get("total_duration", 0)) for m in monthsDict.values())

                rKey = f"{client}__{rName}"
                if rKey not in routes_map:
                    routes_map[rKey] = {"trips": totTrips, "tm": totTm, "pnl": totPnl, "days": totDays}
                else:
                    routes_map[rKey]["trips"] += totTrips
                    routes_map[rKey]["tm"] += totTm
                    routes_map[rKey]["pnl"] += totPnl
                    routes_map[rKey]["days"] += totDays

    tot_trips = sum(r["trips"] for r in routes_map.values())
    tot_tm = sum(r["tm"] for r in routes_map.values())
    tot_pnl = sum(r["pnl"] for r in routes_map.values())
    tot_days = sum(r["days"] for r in routes_map.values())

    return {
        "trips": tot_trips,
        "tm": tot_tm,
        "pnl": tot_pnl,
        "days": tot_days,
        "routes": routes_map
    }

def run_triple_cuadre_audit():
    print("=" * 110)
    print("🕵️‍♂️ AUDITORÍA FORENSE BENOIT BLANC: TRIPLE CUADRE MATRIZ PETRAL ↔ NAVITRANSO ↔ CONSOLIDADO MEC")
    print("=" * 110)

    scenarios = [
        {
            "id": "SCENARIO_1_SPCC_DEMURRAGE",
            "name": "Año 2028 - SPCC con Demoras (Moquegua)",
            "year": "2028",
            "lines": [
                ProjectionLine(
                    month_index=f"2028-{m:02d}", client_id="SPCC",
                    origin_port_id="ILO", destination_port_id="MATARANI",
                    vessel_id="MOQUEGUA", quantity=13500, monthly_frequency=1,
                    quote_id="SPCC.ILO.MATARANI.ILO.2028 13,500 Moquegua Dem"
                ) for m in [1, 4, 7, 10]
            ] + [
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
                ProjectionLine(
                    month_index=f"2027-{m:02d}", client_id="SPCC",
                    origin_port_id="ILO", destination_port_id="MEJILLONES",
                    vessel_id="MOQUEGUA", quantity=13500, monthly_frequency=2 if m in [1,2,3,4,5,6] else 1
                ) for m in range(1, 13)
            ] + [
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
                ProjectionLine(
                    month_index=f"2027-{m:02d}", client_id="SPCC",
                    origin_port_id="ILO", destination_port_id="MATARANI",
                    vessel_id="MOQUEGUA", quantity=13500, monthly_frequency=1,
                    quote_id="SPCC.ILO.MATARANI.ILO.2028 13,500 Moquegua Dem"
                ) for m in range(1, 13)
            ] + [
                ProjectionLine(
                    month_index=f"2027-{m:02d}", client_id="SPCC",
                    origin_port_id="ILO", destination_port_id="MEJILLONES",
                    vessel_id="TABLONES", quantity=13500, monthly_frequency=1
                ) for m in [2, 4, 6, 8, 10, 12]
            ] + [
                ProjectionLine(
                    month_index=f"2027-{m:02d}", client_id="NEXA",
                    origin_port_id="ILO", destination_port_id="CALLAO",
                    vessel_id="CONCON_TRADER", quantity=19000, monthly_frequency=1
                ) for m in [1, 3, 5, 7, 9, 11]
            ] + [
                ProjectionLine(
                    month_index=f"2027-{m:02d}", client_id="SPCC",
                    origin_port_id="ILO", destination_port_id="MARCONA",
                    vessel_id="HUEMUL", quantity=22062, monthly_frequency=1
                ) for m in [3, 6, 9, 12]
            ]
        }
    ]

    all_scenarios_passed = True
    for sc in scenarios:
        months = [f"{sc['year']}-{m:02d}" for m in range(1, 13)]
        req = ForecastRequest(
            projection_lines=sc["lines"],
            start_date=f"{sc['year']}-01-01",
            end_date=f"{sc['year']}-12-31",
            port_cost_mode="DETAILED"
        )
        sim_res = run_forecast_simulation(req)
        agg_data = sim_res.get("aggregated_data", {})

        p = calc_petral(agg_data, sc["lines"], months)
        n = calc_navitranso(agg_data, sc["lines"], months)
        m = calc_consolidado_mec(agg_data)

        print("\n" + "─" * 110)
        print(f"📦 AUDITANDO ESCENARIO: {sc['name']}")
        print("─" * 110)
        print(f"{'MÉTRICA AUDITADA':<24} | {'1. MATRIZ PETRAL':<18} | {'2. NAVITRANSO':<18} | {'3. CONSOLIDADO MEC':<18} | {'ESTADO':<10}")
        print("─" * 110)

        metrics = [
            ("N° Total Viajes", float(p["trips"]), float(n["trips"]), float(m["trips"])),
            ("Volumen Total TM", p["tm"], n["tm"], m["tm"]),
            ("Ventas / Gross Rev", p["gross"], n["ventas"], None),
            ("Búnker / Combustible", p["bunker"], n["bunker"], None),
            ("Gastos Puerto", p["port"], n["port"], None),
            ("Margen / P&L Total", p["pnl"], n["margenBruto"], m["pnl"]),
            ("Días Ocupación", p["days"], None, m["days"]),
        ]

        sc_ok = True
        for name, p_val, n_val, m_val in metrics:
            p_str = f"{p_val:>16,.2f}" if p_val is not None else " " * 16
            n_str = f"{n_val:>16,.2f}" if n_val is not None else " " * 16
            m_str = f"{m_val:>16,.2f}" if m_val is not None else " " * 16

            diff_pn = abs(p_val - n_val) if (p_val is not None and n_val is not None) else 0.0
            diff_pm = abs(p_val - m_val) if (p_val is not None and m_val is not None) else 0.0
            diff = max(diff_pn, diff_pm)

            status = "✅ $0.00" if diff < 0.01 else f"❌ ${diff:,.2f}"
            if diff >= 0.01:
                sc_ok = False
                all_scenarios_passed = False

            print(f"{name:<24} | ${p_str} | ${n_str} | ${m_str} | {status}")

        # Desglose de rutas en Consolidado MEC
        print("   ↳ Desglose por Rutas en Consolidado MEC:")
        for r_key, r_info in m["routes"].items():
            print(f"      • {r_key:<28}: Viajes = {r_info['trips']:>2.0f} │ PnL/Viaje = ${r_info['pnl']/r_info['trips']:>10,.2f} │ Margen Total = ${r_info['pnl']:>12,.2f} │ Días = {r_info['days']:>6.2f} d")

        print("─" * 110)
        if sc_ok:
            print(f"🟢 ESTADO: EXACTO (100% TRIPLE CUADRE PETRAL ↔ NAVITRANSO ↔ CONSOLIDADO MEC)")
        else:
            print(f"🔴 ESTADO: DISCREPANCIA DETECTADA")

    print("\n" + "=" * 110)
    if all_scenarios_passed:
        print("🏆 CERTIFICACIÓN OFICIAL BENOIT BLANC: TRIPLE CUADRE 100% PERFECTO AL CENTAVO")
    else:
        print("❌ FALLA EN TRIPLE CUADRE")
    print("=" * 110)

if __name__ == "__main__":
    run_triple_cuadre_audit()
