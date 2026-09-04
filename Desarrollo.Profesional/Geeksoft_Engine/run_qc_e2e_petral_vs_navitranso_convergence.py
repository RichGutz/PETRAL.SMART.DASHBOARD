"""
========================================================================================
LOOP QC FORENSE: CONVERGENCIA MATRIZ PETRAL ↔ MATRIZ NAVITRANSO (ESPEJO FINANCIERO)
========================================================================================
Auditor: Detective Benoit Blanc
Fecha: 04/09/2026
Objetivo: Auditar la cuadratura matemática 1:1 entre la Matriz Petral (Inmutable)
          y la Matriz Navitranso (Espejo de Agrupación Financiera).
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

def simulate_petral_matrix_totals(agg_data, projection_lines, months):
    """
    Simulación fiel de los cálculos de la Matriz Petral (ForecastGrid.tsx)
    """
    total_trips = 0
    total_freight = 0.0
    total_demurrage = 0.0
    total_muellaje = 0.0
    total_gross_rev = 0.0
    total_commissions = 0.0
    total_net_rev = 0.0
    total_port_costs = 0.0
    total_bunker = 0.0
    total_charter = 0.0
    total_voyage_result = 0.0
    total_tons = 0.0

    for client, r_dict in agg_data.items():
        for route, v_dict in r_dict.items():
            for vessel, m_dict in v_dict.items():
                for m in months:
                    mD = m_dict.get(m, {})
                    # Trips
                    line = next((p for p in projection_lines if p.client_id == client and f"{p.origin_port_id}-{p.destination_port_id}" == route and p.vessel_id == vessel and p.month_index == m), None)
                    freq = line.monthly_frequency if line else mD.get("trips", mD.get("freq", 0))
                    if freq <= 0:
                        continue

                    # Tons
                    unit_tm = float(mD.get("carga_unit", 13500))
                    tons = unit_tm * freq
                    total_tons += tons

                    # Freight Revenue
                    unit_freight_rate = float(mD.get("flete_unit", 0))
                    unit_freight_rev = float(mD.get("freight_revenue_unit", mD.get("gross_income_unit", unit_tm * unit_freight_rate)))
                    freight_rev = unit_freight_rev * freq
                    total_freight += freight_rev

                    # Demurrage
                    d_unit = mD.get("demurrage_revenue_unit", mD.get("demurrage_income_unit"))
                    if d_unit is not None and float(d_unit) > 0:
                        dem_rev = float(d_unit) * freq
                    else:
                        dem_rev = float(mD.get("demurrage_revenue", mD.get("demurrage_income", 0.0)))
                    total_demurrage += dem_rev

                    # Muellaje
                    m_unit = mD.get("dockage_revenue_unit", mD.get("refacturacion_muellaje_unit"))
                    if m_unit is not None and float(m_unit) > 0:
                        muell_rev = float(m_unit) * freq
                    else:
                        muell_rev = float(mD.get("dockage_revenue", mD.get("refacturacion_muellaje", 0.0)))
                    total_muellaje += muell_rev

                    # Gross Revenue
                    gross_rev = freight_rev + muell_rev + dem_rev
                    total_gross_rev += gross_rev

                    # Commissions
                    unit_comm = float(mD.get("total_commissions_unit", 0.0))
                    if unit_comm > 0:
                        comm = unit_comm * freq
                    else:
                        comm = float(mD.get("total_commissions", 0.0))
                    total_commissions += comm

                    # Net Revenue
                    net_rev = gross_rev - comm
                    total_net_rev += net_rev

                    # Port Costs
                    unit_port = float(mD.get("total_port_costs_unit", 0.0))
                    if unit_port > 0:
                        tot_port = unit_port * freq
                    else:
                        tot_port = float(mD.get("total_port_costs", mD.get("port_costs", 0.0)))
                    port_cost_net = max(0.0, tot_port - muell_rev)
                    total_port_costs += (port_cost_net + muell_rev) # Port costs total

                    # Bunker Costs
                    unit_bunker = float(mD.get("total_bunker_costs_unit", 0.0))
                    if unit_bunker > 0:
                        bunk = unit_bunker * freq
                    else:
                        bunk = float(mD.get("total_bunker_costs", mD.get("bunker_costs", 0.0)))
                    total_bunker += bunk

                    # Charter Hire
                    unit_charter = float(mD.get("charter_hire_cost_unit", 0.0))
                    if unit_charter > 0:
                        chart = unit_charter * freq
                    else:
                        chart = float(mD.get("charter_hire_cost", mD.get("charter_hire", 0.0)))
                    total_charter += chart

                    # Voyage Result (P&L)
                    v_res = net_rev - tot_port - bunk - chart
                    total_voyage_result += v_res
                    total_trips += freq

    return {
        "trips": total_trips,
        "tons": total_tons,
        "freight": total_freight,
        "demurrage": total_demurrage,
        "muellaje": total_muellaje,
        "gross_rev": total_gross_rev,
        "commissions": total_commissions,
        "net_rev": total_net_rev,
        "port_costs": total_port_costs,
        "bunker": total_bunker,
        "charter_hire": total_charter,
        "voyage_result": total_voyage_result
    }

def simulate_navitranso_matrix_legacy(agg_data, projection_lines, months):
    """
    Simulación del código LEGACY actual en FinancialMatrixNavitransoGridTable.tsx
    """
    total_hire = 0.0
    total_demRev = 0.0
    total_ingPto = 0.0
    total_ventas = 0.0
    total_bunker = 0.0
    total_gastosPuerto = 0.0
    total_costosDemora = 0.0
    total_comisiones = 0.0
    total_costosDirectos = 0.0
    total_tce = 0.0
    total_arriendo = 0.0
    total_margenBruto = 0.0

    for client, r_dict in agg_data.items():
        for route, v_dict in r_dict.items():
            for vessel, m_dict in v_dict.items():
                for m in months:
                    mD = m_dict.get(m, {})
                    line = next((p for p in projection_lines if p.client_id == client and f"{p.origin_port_id}-{p.destination_port_id}" == route and p.vessel_id == vessel and p.month_index == m), None)
                    freq = line.monthly_frequency if line else mD.get("freq", 1)
                    if freq <= 0:
                        continue

                    # Legacy formulas from FinancialMatrixNavitransoGridTable.tsx:
                    # 1. hire
                    h = float(mD.get("gross_income") or mD.get("hire") or mD.get("freight_revenue") or (float(mD.get("carga_unit", 13500)) * float(mD.get("flete_unit", 30)) * freq))
                    
                    # 2. demRev (LEGACY BUG: mD.demurrage_revenue * freq)
                    d = float(mD.get("demurrage_revenue") or mD.get("demurrage_income") or mD.get("demurrage") or 0.0) * freq
                    
                    # 3. ingPto (LEGACY BUG: refacturacion_muellaje * (total_port_costs_unit ? freq : 1))
                    ing_p = float(mD.get("refacturacion_muellaje") or mD.get("dockage_revenue") or mD.get("port_rebate_income") or (float(mD.get("total_port_costs", 0)) * 0.10)) * (freq if mD.get("total_port_costs_unit") else 1)
                    
                    ventas = h + d + ing_p

                    # 4. combustible (LEGACY BUG: total_bunker_costs * freq if total_bunker_costs_unit)
                    bunk_val = float(mD.get("total_bunker_costs") or mD.get("bunker_costs") or 0.0)
                    comb = -bunk_val * (freq if mD.get("total_bunker_costs_unit") else (1 if (bunk_val > 50000 and freq == 1) else freq))

                    # 5. gastosPuerto
                    port_val = float(mD.get("total_port_costs") or mD.get("port_costs") or 0.0)
                    pto = -port_val * (freq if mD.get("total_port_costs_unit") else (1 if (port_val > 30000 and freq == 1) else freq))

                    # 6. costosDemora
                    c_dem = -float(mD.get("demurrage_hire_cost") or mD.get("costos_demora") or mD.get("demurrage_cost") or 0.0) * freq

                    # 7. comisiones
                    comm = -float(mD.get("commissions_cost") or mD.get("total_commissions") or 0.0) * freq

                    costos_dir = comb + pto + c_dem + comm
                    tce = ventas + costos_dir

                    # 8. arriendo
                    arr = -float(mD.get("charter_hire") or mD.get("charter_hire_cost") or 0.0) * freq
                    mb = tce + arr

                    total_hire += h
                    total_demRev += d
                    total_ingPto += ing_p
                    total_ventas += ventas
                    total_bunker += -comb
                    total_gastosPuerto += -pto
                    total_costosDemora += -c_dem
                    total_comisiones += -comm
                    total_costosDirectos += -costos_dir
                    total_tce += tce
                    total_arriendo += -arr
                    total_margenBruto += mb

    return {
        "hire": total_hire,
        "demRev": total_demRev,
        "ingPto": total_ingPto,
        "ventas": total_ventas,
        "bunker": total_bunker,
        "gastosPuerto": total_gastosPuerto,
        "comisiones": total_comisiones,
        "arriendo": total_arriendo,
        "margenBruto": total_margenBruto
    }

def simulate_navitranso_matrix_corrected(agg_data, projection_lines, months):
    """
    Simulación del cálculo CORREGIDO para FinancialMatrixNavitransoGridTable.tsx
    debe ser idéntico al centavo con Matriz Petral.
    """
    total_hire = 0.0
    total_demRev = 0.0
    total_ingPto = 0.0
    total_ventas = 0.0
    total_bunker = 0.0
    total_gastosPuerto = 0.0
    total_costosDemora = 0.0
    total_comisiones = 0.0
    total_costosDirectos = 0.0
    total_tce = 0.0
    total_arriendo = 0.0
    total_margenBruto = 0.0

    for client, r_dict in agg_data.items():
        for route, v_dict in r_dict.items():
            for vessel, m_dict in v_dict.items():
                for m in months:
                    mD = m_dict.get(m, {})
                    line = next((p for p in projection_lines if p.client_id == client and f"{p.origin_port_id}-{p.destination_port_id}" == route and p.vessel_id == vessel and p.month_index == m), None)
                    freq = line.monthly_frequency if line else mD.get("freq", 1)
                    if freq <= 0:
                        continue

                    # 1. HIRE (Base Flete)
                    u_freight = float(mD.get("freight_revenue_unit", mD.get("gross_income_unit", float(mD.get("carga_unit", 13500)) * float(mD.get("flete_unit", 0)))))
                    h = u_freight * freq if u_freight > 0 else float(mD.get("freight_revenue", mD.get("gross_income", 0.0)))

                    # 2. DEMORAS (Demurrage Revenue)
                    u_dem = mD.get("demurrage_revenue_unit", mD.get("demurrage_income_unit"))
                    if u_dem is not None and float(u_dem) > 0:
                        d = float(u_dem) * freq
                    else:
                        d = float(mD.get("demurrage_revenue", mD.get("demurrage_income", 0.0)))

                    # 3. REFACTURACIÓN MUELLAJE / INGRESOS PUERTO
                    u_muell = mD.get("dockage_revenue_unit", mD.get("refacturacion_muellaje_unit"))
                    if u_muell is not None and float(u_muell) > 0:
                        ing_p = float(u_muell) * freq
                    else:
                        ing_p = float(mD.get("dockage_revenue", mD.get("refacturacion_muellaje", 0.0)))

                    ventas = h + d + ing_p

                    # 4. COMBUSTIBLE
                    u_bunk = mD.get("total_bunker_costs_unit")
                    if u_bunk is not None and float(u_bunk) > 0:
                        comb = float(u_bunk) * freq
                    else:
                        comb = float(mD.get("total_bunker_costs", mD.get("bunker_costs", 0.0)))

                    # 5. GASTOS DE PUERTO
                    u_port = mD.get("total_port_costs_unit")
                    if u_port is not None and float(u_port) > 0:
                        pto = float(u_port) * freq
                    else:
                        pto = float(mD.get("total_port_costs", mD.get("port_costs", 0.0)))

                    # 6. COSTOS DEMORA
                    c_dem = float(mD.get("demurrage_hire_cost_unit", 0.0)) * freq if mD.get("demurrage_hire_cost_unit") else float(mD.get("demurrage_hire_cost", 0.0))

                    # 7. COMISIONES
                    u_comm = mD.get("total_commissions_unit")
                    if u_comm is not None and float(u_comm) > 0:
                        comm = float(u_comm) * freq
                    else:
                        comm = float(mD.get("total_commissions", mD.get("commissions_cost", 0.0)))

                    costos_dir = comb + pto + c_dem + comm
                    tce = ventas - costos_dir

                    # 8. ARRIENDO DE NAVES
                    u_chart = mD.get("charter_hire_cost_unit")
                    if u_chart is not None and float(u_chart) > 0:
                        arr = float(u_chart) * freq
                    else:
                        arr = float(mD.get("charter_hire_cost", mD.get("charter_hire", 0.0)))

                    mb = tce - arr

                    total_hire += h
                    total_demRev += d
                    total_ingPto += ing_p
                    total_ventas += ventas
                    total_bunker += comb
                    total_gastosPuerto += pto
                    total_costosDemora += c_dem
                    total_comisiones += comm
                    total_costosDirectos += costos_dir
                    total_tce += tce
                    total_arriendo += arr
                    total_margenBruto += mb

    return {
        "hire": total_hire,
        "demRev": total_demRev,
        "ingPto": total_ingPto,
        "ventas": total_ventas,
        "bunker": total_bunker,
        "gastosPuerto": total_gastosPuerto,
        "comisiones": total_comisiones,
        "arriendo": total_arriendo,
        "margenBruto": total_margenBruto
    }

def run_petral_vs_navitranso_audit():
    print("=" * 100)
    print("🕵️‍♂️ INICIANDO AUDITORÍA PERICIAL BENOIT BLANC: MATRIZ PETRAL ↔ MATRIZ NAVITRANSO")
    print("=" * 100)

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

        petral = simulate_petral_matrix_totals(agg_data, sc["lines"], months)
        nav_leg = simulate_navitranso_matrix_legacy(agg_data, sc["lines"], months)
        nav_corr = simulate_navitranso_matrix_corrected(agg_data, sc["lines"], months)

        print("\n" + "─" * 90)
        print(f"📦 AUDITANDO ESCENARIO: {sc['name']}")
        print("─" * 90)
        print(f"{'MÉTRICA':<22} | {'MATRIZ PETRAL':<18} | {'NAVITRANSO LEGACY':<18} | {'NAVITRANSO FIX':<18} | {'DIFF (FIX)':<10}")
        print("─" * 90)

        metrics_map = [
            ("Flete / Hire", petral["freight"], nav_leg["hire"], nav_corr["hire"]),
            ("Demoras / Demurrage", petral["demurrage"], nav_leg["demRev"], nav_corr["demRev"]),
            ("Muellaje / Ing. Puerto", petral["muellaje"], nav_leg["ingPto"], nav_corr["ingPto"]),
            ("Ventas / Gross Rev", petral["gross_rev"], nav_leg["ventas"], nav_corr["ventas"]),
            ("Combustible (Bunker)", petral["bunker"], nav_leg["bunker"], nav_corr["bunker"]),
            ("Gastos Puerto", petral["port_costs"], nav_leg["gastosPuerto"], nav_corr["gastosPuerto"]),
            ("Comisiones", petral["commissions"], nav_leg["comisiones"], nav_corr["comisiones"]),
            ("Charter Hire (Arriendo)", petral["charter_hire"], nav_leg["arriendo"], nav_corr["arriendo"]),
            ("Margen / Voyage Result", petral["voyage_result"], nav_leg["margenBruto"], nav_corr["margenBruto"]),
        ]

        all_ok = True
        for name, p_val, nl_val, nc_val in metrics_map:
            diff_fix = abs(p_val - nc_val)
            status = "✅ $0.00" if diff_fix < 0.01 else f"❌ ${diff_fix:,.2f}"
            if diff_fix >= 0.01:
                all_ok = False
            print(f"{name:<22} | ${p_val:>16,.2f} | ${nl_val:>16,.2f} | ${nc_val:>16,.2f} | {status}")

        print("─" * 90)
        if all_ok:
            print(f"🟢 ESTADO ESCENARIO: EXACTO (100% CUADRATURA MATRIZ PETRAL ↔ MATRIZ NAVITRANSO)")
        else:
            print(f"🔴 ESTADO ESCENARIO: DISCREPANCIA DETECTADA")

if __name__ == "__main__":
    run_petral_vs_navitranso_audit()
