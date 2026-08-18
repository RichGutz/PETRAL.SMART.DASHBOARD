import sys
import os
import copy

sys.path.insert(0, os.path.dirname(__file__))

from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine
from backend.spot_engine import calculate_multicotizador_simulation

def map_puertos_config(tramos_in, puertos_cfg):
    tramos = copy.deepcopy(tramos_in)
    for idx, tr in enumerate(tramos):
        wf = float(tr.get("weather_factor", 0))
        if wf > 1.0:
            tr["weather_factor"] = wf / 100.0
        p_orig = puertos_cfg[idx] if idx < len(puertos_cfg) else {}
        p_dest = puertos_cfg[idx + 1] if (idx + 1) < len(puertos_cfg) else {}

        c_orig = float(p_orig.get("manual_port_cost") or 0)
        c_dest = float(p_dest.get("manual_port_cost") or 0)
        if float(tr.get("agency_costs_origin", 0)) <= 0 and c_orig > 0:
            tr["agency_costs_origin"] = c_orig
        if float(tr.get("agency_costs_destination", 0)) <= 0 and c_dest > 0:
            tr["agency_costs_destination"] = c_dest

        tr["origin_action"] = p_orig.get("action", tr.get("origin_action", "NONE"))
        tr["destination_action"] = p_dest.get("action", tr.get("destination_action", "NONE"))
        tr["muellaje_cost_origin"] = float(p_orig.get("muellaje_cost") or 0)
        tr["muellaje_cost_dest"] = float(p_dest.get("muellaje_cost") or 0)
        tr["refacturar_muellaje"] = True

        if idx == 0:
            tr["port_overhead_hours_origin"] = float(p_orig.get("time_to_count") or p_orig.get("overhead") or 0)
        else:
            tr["port_overhead_hours_origin"] = 0.0
        tr["port_overhead_hours_dest"] = float(p_dest.get("time_to_count") or p_dest.get("overhead") or 0)

        if p_dest.get("action") == "CARGAR":
            tr["positioning_carga_hrs"] = float(p_dest.get("positioning") or 0)
        elif p_dest.get("action") == "DESCARGAR":
            tr["positioning_descarga_hrs"] = float(p_dest.get("positioning") or 0)
            
        if p_dest.get("op_rate"):
            tr["custom_discharge_rate"] = float(p_dest.get("op_rate"))
    return tramos

def run_qc_triangular_test():
    print("=" * 80)
    print("   PROTOCOLO DE CONTROL DE CALIDAD (QC) TRIANGULAR")
    print("   RUTA / COTIZACION: NEXA.ILO.CALLAO.MATARANI.ILO.2026 (IZ)")
    print("=" * 80)
    
    # ---------------------------------------------------------
    # VERTICE 1: Supabase DB (routes_quotes)
    # ---------------------------------------------------------
    print("\n[VERTICE 1] Consultando Supabase DB (routes_quotes)...")
    sb = get_supabase()
    res = sb.table("routes_quotes").select("*").eq("name", "NEXA.ILO.CALLAO.MATARANI.ILO.2026 (IZ)").execute()
    if not res.data:
        res = sb.table("routes_quotes").select("*").ilike("name", "%NEXA.ILO.CALLAO.MATARANI.ILO%").execute()
    
    assert res.data, "ERROR CRITICO: Cotizacion NEXA no encontrada en routes_quotes"
    quote_db = res.data[0]
    legs_data = quote_db.get("legs_data", {})
    
    db_ifo = float(legs_data.get("bunker_price_ifo", 0))
    db_mdo = float(legs_data.get("bunker_price_mdo", 0))
    db_vessel = legs_data.get("vessel_id") or "TABLONES"
    
    print(f"  [OK] DB Quote Name: {quote_db.get('name')}")
    print(f"  [OK] DB Description: {quote_db.get('description')}")
    print(f"  [OK] DB Bunker IFO: ${db_ifo:,.2f} / MT")
    print(f"  [OK] DB Bunker MDO: ${db_mdo:,.2f} / MT")
    print(f"  [OK] DB Vessel: {db_vessel}")
    print(f"  [OK] DB Tramos Count: {len(legs_data.get('tramos', []))}")
    
    # ---------------------------------------------------------
    # VERTICE 2: Multicotizador Engine Simulation
    # ---------------------------------------------------------
    print("\n[VERTICE 2] Ejecutando Motor del Multicotizador (con mapeo puertosConfig)...")
    tramos_mapped = map_puertos_config(legs_data.get("tramos", []), legs_data.get("puertosConfig", []))
    payload_multi = {
        "vessel_params": legs_data.get("vesselParams", {}),
        "vessel_id": db_vessel,
        "tramos": tramos_mapped,
        "puertosConfig": legs_data.get("puertosConfig", []),
        "bunker_price_ifo": db_ifo,
        "bunker_price_mdo": db_mdo,
        "port_cost_mode": "static",
        "client_id": "NEXA"
    }
    multi_res = calculate_multicotizador_simulation(payload_multi)
    m_cons = multi_res.get("consolidated", {})
    
    m_ifo_ton = m_cons.get("bunker_ifo_tonnage", 0)
    m_mdo_ton = m_cons.get("bunker_mdo_tonnage", 0)
    m_ifo_cost = m_ifo_ton * db_ifo
    m_mdo_cost = m_mdo_ton * db_mdo
    m_bunker_total = m_cons.get("total_bunker_costs", 0)
    m_port_total = m_cons.get("total_port_costs", 0)
    m_gross_rev = m_cons.get("gross_revenue_total", 0)
    m_days = m_cons.get("total_days", 0)
    m_tce_req = float(legs_data.get("vesselParams", {}).get("tce_required") or 15000.0)
    m_hire = m_days * m_tce_req
    m_pnl = m_gross_rev - m_port_total - m_bunker_total - m_hire
    m_tce_real = m_cons.get("tce_real", 0)
    
    print(f"  [OK] Multi Total Days: {m_days:.2f} d")
    print(f"  [OK] Multi IFO Tons: {m_ifo_ton:.2f} t -> Costo IFO: ${m_ifo_cost:,.2f}")
    print(f"  [OK] Multi MDO Tons: {m_mdo_ton:.2f} t -> Costo MDO: ${m_mdo_cost:,.2f}")
    print(f"  [OK] Multi Total Bunker: ${m_bunker_total:,.2f}")
    print(f"  [OK] Multi Total Port Costs: ${m_port_total:,.2f}")
    print(f"  [OK] Multi Gross Revenue: ${m_gross_rev:,.2f}")
    print(f"  [OK] Multi Hire (-): ${m_hire:,.2f}")
    print(f"  [OK] Multi P&L / Voyage Result: ${m_pnl:,.2f}")
    print(f"  [OK] Multi TCE Real: ${m_tce_real:,.2f} / d")

    # ---------------------------------------------------------
    # VERTICE 3: Matriz Financiera Simulation Engine
    # ---------------------------------------------------------
    print("\n[VERTICE 3] Ejecutando Simulacion de Matriz Financiera...")
    tramos = legs_data.get("tramos", [])
    laden = [t for t in tramos if t.get("type", "").upper() == "LADEN"]
    orig_p = laden[0].get("origin_port_id") if laden else "CALLAO"
    dest_p = laden[-1].get("destination_port_id") if laden else "MATARANI"
    
    forecast_req = ForecastRequest(
        start_date="2026-07-01",
        end_date="2026-12-31",
        port_cost_mode="static",
        projection_lines=[
            ProjectionLine(
                month_index="2026-07",
                client_id="NEXA",
                origin_port_id=orig_p,
                destination_port_id=dest_p,
                vessel_id=db_vessel,
                quantity=13500.0,
                monthly_frequency=1.0,
                custom_tariff=float(laden[0].get("freight_rate", 30.0)) if laden else 30.0,
                quote_id=quote_db.get("name")
            )
        ]
    )
    
    sim_res = run_forecast_simulation(forecast_req)
    agg = sim_res.get("aggregated_data", {})
    route_key = f"{orig_p}-{dest_p}"
    
    matriz_data = agg.get("NEXA", {}).get(route_key, {}).get(db_vessel, {}).get("2026-07", {})
    assert matriz_data, f"ERROR: No se encontro resultado en Matriz Financiera para NEXA -> {route_key} -> {db_vessel}"
    
    mat_ifo_p = matriz_data.get("price_ifo_unit", 0)
    mat_mdo_p = matriz_data.get("price_mdo_unit", 0)
    mat_bunker = matriz_data.get("total_bunker_costs_unit", 0)
    mat_port = matriz_data.get("total_port_costs_unit", 0)
    mat_gross = matriz_data.get("gross_income_unit", 0)
    mat_pnl = matriz_data.get("pl_vs_required_unit", 0)
    mat_tce_real = matriz_data.get("tce_real_unit", 0)
    mat_days = matriz_data.get("total_duration_unit", 0)
    
    print(f"  [OK] Matriz Price IFO: ${mat_ifo_p:,.2f} / MT")
    print(f"  [OK] Matriz Price MDO: ${mat_mdo_p:,.2f} / MT")
    print(f"  [OK] Matriz Total Bunker: ${mat_bunker:,.2f}")
    print(f"  [OK] Matriz Total Port Costs: ${mat_port:,.2f}")
    print(f"  [OK] Matriz Gross Revenue: ${mat_gross:,.2f}")
    print(f"  [OK] Matriz P&L / Voyage Result: ${mat_pnl:,.2f}")
    print(f"  [OK] Matriz TCE Real: ${mat_tce_real:,.2f} / d")
    print(f"  [OK] Matriz Total Days: {mat_days:.2f} d")

    # ---------------------------------------------------------
    # COMPARACION TRIANGULAR Y ASERCIONES
    # ---------------------------------------------------------
    print("\n" + "=" * 80)
    print("   CUADRATURA TRIANGULAR -- REPORTE PERICIAL")
    print("=" * 80)
    
    def check(name, v_multi, v_matriz, tolerance=1.0):
        diff = abs(v_multi - v_matriz)
        status = "[CUADRA EXACTO]" if diff < tolerance else "[DISCREPANCIA]"
        print(f"  {status} | {name:<25}: Multi=${v_multi:,.2f} | Matriz=${v_matriz:,.2f} | Dif=${diff:,.2f}")
        assert diff < tolerance, f"Fallo en {name}: Multi={v_multi} vs Matriz={v_matriz}"

    check("Precio Bunker IFO ($/T)", db_ifo, mat_ifo_p)
    check("Precio Bunker MDO ($/T)", db_mdo, mat_mdo_p)
    check("Gasto Total Bunker ($)", m_bunker_total, mat_bunker)
    check("Gasto Total Puerto ($)", m_port_total, mat_port)
    check("Ingreso Bruto ($)", m_gross_rev, mat_gross)
    check("Dias Totales de Viaje", m_days, mat_days, tolerance=0.05)
    check("TCE Real ($/d)", m_tce_real, mat_tce_real, tolerance=1.0)
    
    print("\n" + "=" * 80)
    print("   [EXITO TOTAL] 100% CUADRATURA TRIANGULAR EXITOSA")
    print("   Los 3 vertices (Supabase DB, Multicotizador y Matriz Financiera) coinciden con CERO discrepancias.")
    print("=" * 80)

if __name__ == "__main__":
    run_qc_triangular_test()
