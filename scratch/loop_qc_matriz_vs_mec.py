import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def run_matriz_vs_mec_qc(scenario_id="5a31cc8f-fca5-4b7c-af5b-3a422dec96f8"):
    print("=" * 135)
    print("   🕵️‍♂️ LOOP QC BENOIT BLANC: CONCILIACION MATRIZ FINANCIERA vs REPORTE MEC (ESCENARIO SINTETICO - 60 VIAJES)")
    print("=" * 135)

    # 1. Cargar escenario guardado
    url_load = f"https://forecast.geeksoft.tech/api/v1/forecast/load/{scenario_id}"
    req_load = urllib.request.Request(url_load, headers={"Content-Type": "application/json"})
    
    with urllib.request.urlopen(req_load, timeout=15) as resp:
        scenario_data = json.loads(resp.read().decode("utf-8"))

    name = scenario_data.get("name", "Escenario")
    lines = scenario_data.get("projection_lines", [])
    s_date = scenario_data.get("start_date", "2027-01")
    e_date = scenario_data.get("end_date", "2027-12")
    if len(s_date) == 7: s_date += "-01"
    if len(e_date) == 7: e_date += "-28"
    print(f"\n[1] Escenario Cargado: '{name}' | Periodo: {s_date} ➔ {e_date} | Total Líneas Mensuales: {len(lines)}")

    # 2. Obtener simulación de la Matriz Financiera desde backend
    url_sim = "https://forecast.geeksoft.tech/api/v1/forecast/run_universal"
    sim_payload = json.dumps({
        "start_date": s_date,
        "end_date": e_date,
        "projection_lines": lines
    }).encode("utf-8")
    req_sim = urllib.request.Request(url_sim, data=sim_payload, headers={"Content-Type": "application/json"})

    with urllib.request.urlopen(req_sim, timeout=20) as resp:
        sim_response = json.loads(resp.read().decode("utf-8"))

    agg_data = sim_response.get("aggregated_data", {})
    print(f"[2] Simulación de Matriz Financiera procesada: {len(agg_data)} clientes simulados.\n")

    # 3. Procesar resultados por ruta y buque
    matriz_by_route_vessel = {}
    
    for client, routes_dict in agg_data.items():
        for r_name, vessels_dict in routes_dict.items():
            for v_name, months_dict in vessels_dict.items():
                tot_tm = 0.0
                tot_trips = 0.0
                tot_pnl = 0.0
                tot_days = 0.0
                unit_qty = 0.0

                for m_key, m_val in months_dict.items():
                    freq = float(m_val.get("freq") or 0)
                    qty_unit = float(m_val.get("carga_unit") or 0)
                    pnl = float(m_val.get("voyage_result") or 0)
                    dur = float(m_val.get("total_duration") or 0)

                    tot_trips += freq
                    tot_tm += (qty_unit * freq)
                    tot_pnl += pnl
                    tot_days += dur
                    if qty_unit > 0: unit_qty = qty_unit

                route_key = r_name
                is_export = "MEJILLONES" in r_name or "BARQUITO" in r_name or "ANT" in r_name or "EXPORT" in r_name

                matriz_by_route_vessel[f"{route_key}__{v_name}"] = {
                    "client": client,
                    "route": route_key,
                    "vessel": v_name,
                    "is_export": is_export,
                    "annual_tm": tot_tm,
                    "full_load": unit_qty,
                    "trips": tot_trips,
                    "pnl_unit": (tot_pnl / tot_trips) if tot_trips > 0 else 0.0,
                    "gross_margin": tot_pnl,
                    "days_occupation": tot_days
                }

    # 4. Agrupar por Ruta para el Formato MEC Ponderado (Multi-Buque / Multi-Tonelaje)
    mec_routes_grouped = {}
    for item in matriz_by_route_vessel.values():
        r_name = item["route"]
        if r_name not in mec_routes_grouped:
            mec_routes_grouped[r_name] = {
                "route": r_name,
                "is_export": item["is_export"],
                "annual_tm": 0.0,
                "trips": 0.0,
                "gross_margin": 0.0,
                "days_occupation": 0.0,
                "vessels": []
            }
        mec_routes_grouped[r_name]["annual_tm"] += item["annual_tm"]
        mec_routes_grouped[r_name]["trips"] += item["trips"]
        mec_routes_grouped[r_name]["gross_margin"] += item["gross_margin"]
        mec_routes_grouped[r_name]["days_occupation"] += item["days_occupation"]
        if item["vessel"] not in mec_routes_grouped[r_name]["vessels"]:
            mec_routes_grouped[r_name]["vessels"].append(item["vessel"])

    # Calcular P/L x Viaje Ponderado y Full Load Ponderado
    for r in mec_routes_grouped.values():
        r["pnl_weighted"] = (r["gross_margin"] / r["trips"]) if r["trips"] > 0 else 0.0
        r["full_load_weighted"] = (r["annual_tm"] / r["trips"]) if r["trips"] > 0 else 0.0

    grand_tm = sum(r["annual_tm"] for r in mec_routes_grouped.values())
    grand_trips = sum(r["trips"] for r in mec_routes_grouped.values())
    grand_margin = sum(r["gross_margin"] for r in mec_routes_grouped.values())
    grand_days = sum(r["days_occupation"] for r in mec_routes_grouped.values())

    # 5. Tabla de Auditoría Comparativa MEC
    print("-" * 135)
    print(f"{'RUTA':<18} | {'TM ANUAL':<12} | {'FULL LOAD (POND)':<18} | {'VIAJES':<7} | {'P/L x VIAJE':<14} | {'GROSS MARGIN':<15} | {'% VOL':<8} | {'DIAS OCUP'}")
    print("-" * 135)

    for r_name, r in mec_routes_grouped.items():
        vol_share = (r["annual_tm"] / grand_tm) * 100 if grand_tm > 0 else 0.0
        print(f"{r_name:<18} | {r['annual_tm']:>10,.0f} MT | {r['full_load_weighted']:>14,.0f} MT | {r['trips']:>5.0f} v | ${r['pnl_weighted']:>11,.2f} | ${r['gross_margin']:>12,.2f} | {vol_share:>6.2f}% | {r['days_occupation']:>7.1f} d")

    print("-" * 135)
    print(f"{'TOTAL GENERAL':<18} | {grand_tm:>10,.0f} MT | {'—':>18} | {grand_trips:>5.0f} v | {'—':>14} | ${grand_margin:>12,.2f} | 100.00% | {grand_days:>7.1f} d")
    print("=" * 135)

    # 6. Bloque Macro Cabotaje vs Exportación
    cab_trips = sum(r["trips"] for r in mec_routes_grouped.values() if not r["is_export"])
    cab_tm = sum(r["annual_tm"] for r in mec_routes_grouped.values() if not r["is_export"])
    cab_pct = (cab_tm / grand_tm) * 100 if grand_tm > 0 else 0.0

    exp_trips = sum(r["trips"] for r in mec_routes_grouped.values() if r["is_export"])
    exp_tm = sum(r["annual_tm"] for r in mec_routes_grouped.values() if r["is_export"])
    exp_pct = (exp_tm / grand_tm) * 100 if grand_tm > 0 else 0.0

    print("\n[BLOQUE 1 MACRO: CABOTAJE vs EXPORTACION]")
    print(f"  - Viajes Cabotaje:    {cab_trips:2.0f} viajes | {cab_tm:>10,.0f} MT | {cab_pct:>6.2f}%")
    print(f"  - Viajes Exportación: {exp_trips:2.0f} viajes | {exp_tm:>10,.0f} MT | {exp_pct:>6.2f}%")
    print(f"  - Total Flota:        {grand_trips:2.0f} viajes | {grand_tm:>10,.0f} MT | 100.00%")
    print("=" * 135)

    return mec_routes_grouped

if __name__ == "__main__":
    sid = sys.argv[1] if len(sys.argv) > 1 else "5a31cc8f-fca5-4b7c-af5b-3a422dec96f8"
    run_matriz_vs_mec_qc(sid)
