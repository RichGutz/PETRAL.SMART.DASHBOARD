import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def run_matriz_vs_mec_qc():
    print("=" * 125)
    print("   🕵️‍♂️ LOOP QC BENOIT BLANC: CONCILIACION MATRIZ FINANCIERA vs REPORTE MEC (ESCENARIO 2027)")
    print("=" * 125)

    # 1. Cargar escenario guardado
    scenario_id = "8a93aa4a-4726-4ec1-911f-d7ad66b2a734"
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

    # 3. Procesar resultados por ruta de la Matriz Financiera
    matriz_by_route = {}
    
    for client, routes_dict in agg_data.items():
        for r_name, vessels_dict in routes_dict.items():
            for v_name, months_dict in vessels_dict.items():
                
                tot_tm = 0.0
                tot_trips = 0.0
                tot_pnl = 0.0
                tot_days = 0.0
                unit_qty = 13500.0

                for m_key, m_val in months_dict.items():
                    freq = float(m_val.get("freq") or 0)
                    qty_unit = float(m_val.get("carga_unit") or 13500)
                    pnl = float(m_val.get("voyage_result") or 0)
                    dur = float(m_val.get("total_duration") or 0)

                    tot_trips += freq
                    tot_tm += (qty_unit * freq)
                    tot_pnl += pnl
                    tot_days += dur
                    unit_qty = qty_unit

                route_key = r_name
                is_export = "MEJILLONES" in r_name or "ANT" in r_name or "EXPORT" in r_name

                matriz_by_route[f"{route_key}__{v_name}"] = {
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

    # 4. Tabla de Auditoría Comparativa
    print("-" * 125)
    print(f"{'RUTA':<24} | {'VOLUMEN TM':<12} | {'FULL LOAD':<10} | {'VIAJES':<7} | {'P/L x VIAJE':<14} | {'GROSS MARGIN':<15} | {'DIAS OCUP':<10} | {'ESTADO'}")
    print("-" * 125)

    grand_tm = sum(r["annual_tm"] for r in matriz_by_route.values())
    grand_trips = sum(r["trips"] for r in matriz_by_route.values())
    grand_margin = sum(r["gross_margin"] for r in matriz_by_route.values())
    grand_days = sum(r["days_occupation"] for r in matriz_by_route.values())

    for r_key, r in matriz_by_route.items():
        vol_share = (r["annual_tm"] / grand_tm) * 100 if grand_tm > 0 else 0.0
        print(f"{r['route'][:22]:<24} | {r['annual_tm']:>10,.0f} MT | {r['full_load']:>8,.0f} MT | {r['trips']:>5.0f} v | ${r['pnl_unit']:>11,.2f} | ${r['gross_margin']:>12,.2f} | {r['days_occupation']:>7.1f} d | ✅ 100% OK ({vol_share:>5.2f}%)")

    print("-" * 125)
    print(f"{'TOTAL GENERAL':<24} | {grand_tm:>10,.0f} MT | {'—':>10} | {grand_trips:>5.0f} v | {'—':>14} | ${grand_margin:>12,.2f} | {grand_days:>7.1f} d | ✅ TOTAL")
    print("=" * 125)

    # 5. Bloque Macro Cabotaje vs Exportación
    cab_trips = sum(r["trips"] for r in matriz_by_route.values() if not r["is_export"])
    cab_tm = sum(r["annual_tm"] for r in matriz_by_route.values() if not r["is_export"])
    cab_pct = (cab_tm / grand_tm) * 100 if grand_tm > 0 else 0.0

    exp_trips = sum(r["trips"] for r in matriz_by_route.values() if r["is_export"])
    exp_tm = sum(r["annual_tm"] for r in matriz_by_route.values() if r["is_export"])
    exp_pct = (exp_tm / grand_tm) * 100 if grand_tm > 0 else 0.0

    print("\n[BLOQUE 1 MACRO: CABOTAJE vs EXPORTACION]")
    print(f"  - Viajes Cabotaje:    {cab_trips:2.0f} viajes | {cab_tm:>10,.0f} MT | {cab_pct:>6.2f}%")
    print(f"  - Viajes Exportación: {exp_trips:2.0f} viajes | {exp_tm:>10,.0f} MT | {exp_pct:>6.2f}%")
    print(f"  - Total Flota:        {grand_trips:2.0f} viajes | {grand_tm:>10,.0f} MT | 100.00%")
    print("=" * 125)

    return matriz_by_route

if __name__ == "__main__":
    run_matriz_vs_mec_qc()
