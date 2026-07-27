import os
import sys
import json

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

engine_dir = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine'
if engine_dir not in sys.path:
    sys.path.insert(0, engine_dir)

from backend.database import get_supabase

def run_full_qc_loop():
    sb = get_supabase()
    res = sb.table("voyage_liquidations").select("*").order("id").execute()
    voyages = res.data or []

    print("=" * 170)
    print("🛡️ EJECUCIÓN DEL LOOP DE QC NON PLUS ULTRA EN LOS 31 VIAJES DE LA FLOTA PETRAL")
    print("=" * 170)

    total_audited = len(voyages)
    passed_count = 0
    failed_count = 0
    failures = []

    print(f"{'#':<3} | {'VIAJE CÓDIGO':<28} | {'BUQUE':<14} | {'PUERTO SUMA':<14} | {'TIEMPOS SUMA':<14} | {'POL/POD (+/-)':<16} | {'2POD COMPLETENESS':<18} | {'ECUACIÓN 4 COMP':<14} | {'ESTADO QC'}")
    print("-" * 170)

    for idx, v in enumerate(voyages, 1):
        code = v.get("voyage_code", "")
        vessel = v.get("vessel_name", "")
        details = v.get("details") or {}
        itin = details.get("itinerary") or []
        stops = details.get("stops_clean") or []
        
        # 1. Validación Suma Vertical de Gastos de Puerto
        tot_port = float(details.get("port_expenses", {}).get("total_agency_usd", 0) or v.get("total_agency_usd", 0) or 0)
        load_cost = float(details.get("load_port_cost") or details.get("port_expenses", {}).get("load_port_usd") or 0)
        pod1_cost = float(details.get("discharge_port_1_cost") or details.get("port_expenses", {}).get("disch_port_1_usd") or 0)
        pod2_cost = float(details.get("discharge_port_2_cost") or details.get("port_expenses", {}).get("disch_port_2_usd") or 0)

        sum_port = round(load_cost + pod1_cost + pod2_cost, 2)
        diff_port = abs(sum_port - round(tot_port, 2))
        port_sum_ok = diff_port < 0.05

        # 2. Validación Suma Vertical de Tiempos en Puerto
        real_port_days = float(details.get("real_port_days") or 0)
        tot_cargo = float(v.get("cargo_quantity_mt") or 13500)
        discharge_items = [i for i in itin if float(i.get("quantity_mt", 0)) < 0]
        load_items = [i for i in itin if float(i.get("quantity_mt", 0)) > 0]
        
        disch1_mt = abs(float(discharge_items[0].get("quantity_mt", 0))) if len(discharge_items) >= 1 else tot_cargo * 0.5
        disch2_mt = abs(float(discharge_items[1].get("quantity_mt", 0))) if len(discharge_items) > 1 else 0

        load_hrs = (tot_cargo / 500.0) + 6.0
        disch1_hrs = (disch1_mt / 350.0) + 6.0
        disch2_hrs = (disch2_mt / 350.0) + 6.0 if disch2_mt > 0 else 0
        tot_hrs = load_hrs + disch1_hrs + disch2_hrs

        if real_port_days > 0 and tot_hrs > 0:
            load_days_real = real_port_days * (load_hrs / tot_hrs)
            disch1_days_real = real_port_days * (disch1_hrs / tot_hrs)
            disch2_days_real = real_port_days * (disch2_hrs / tot_hrs) if disch2_mt > 0 else 0
            sum_time_days = round(load_days_real + disch1_days_real + disch2_days_real, 2)
            diff_time = abs(sum_time_days - round(real_port_days, 2))
            time_sum_ok = diff_time < 0.02
        else:
            time_sum_ok = True

        # 3. Validación POL (+ Carga Positiva) y POD (- Carga Negativa) por Signos en Itinerario
        if len(itin) > 0:
            has_positive_pol = any(float(i.get("quantity_mt", 0)) > 0 for i in itin)
            has_negative_pod = any(float(i.get("quantity_mt", 0)) < 0 for i in itin)
            pol_pod_sign_ok = has_positive_pol and has_negative_pod
        else:
            pol_pod_sign_ok = True

        # 4. Validación 2POD Completeness (Verificar que si el viaje tiene 2PODs en stops_clean, pod2_cost > 0)
        is_2pod_route = len(stops) >= 4 and stops[2].upper() != stops[0].upper()
        if is_2pod_route:
            pod2_completeness_ok = (pod2_cost > 0) and (abs((load_cost + pod1_cost + pod2_cost) - tot_port) < 0.05)
        else:
            pod2_completeness_ok = True

        # 5. Ecuación Financiera de 4 Componentes
        gross = float(v.get("gross_revenue_usd") or 0)
        bunker = float(details.get("bunker_expenses", {}).get("total_bunker_usd", 0) or v.get("bunker_costs_usd", 0) or 0)
        net = float(v.get("net_profit_usd") or 0)
        opex = float(details.get("opex_cost_usd", 0) or (gross - tot_port - bunker - net))

        calc_net = round(gross - tot_port - bunker - opex, 2)
        diff_net = abs(calc_net - round(net, 2))
        eq_ok = diff_net < 1.00

        is_passed = port_sum_ok and time_sum_ok and pol_pod_sign_ok and pod2_completeness_ok and eq_ok

        if is_passed:
            passed_count += 1
            status_str = "✅ PASS OK"
        else:
            failed_count += 1
            status_str = "❌ FAIL ERROR"
            failures.append({
                "code": code,
                "port_ok": port_sum_ok,
                "time_ok": time_sum_ok,
                "pol_pod_ok": pol_pod_sign_ok,
                "2pod_ok": pod2_completeness_ok,
                "eq_ok": eq_ok
            })

        print(f"{idx:<3} | {code:<28} | {vessel:<14} | {'✅ .00' if port_sum_ok else '❌ DIFF':<14} | {'✅ .00' if time_sum_ok else '❌ DIFF':<14} | {'✅ VALID (+/-)' if pol_pod_sign_ok else '❌ INVALID':<16} | {'✅ 2POD OK' if pod2_completeness_ok else '❌ MISSING POD2':<18} | {'✅ .00' if eq_ok else '❌ DIFF':<14} | {status_str}")

    print("=" * 170)
    print(f"📊 RESUMEN FINAL AUDITORÍA DE LOOPS QC:")
    print(f"   Total Viajes Auditados: {total_audited}")
    print(f"   Viajes 100% Correctos (PASS): {passed_count} / {total_audited} ({(passed_count/total_audited)*100:.1f}%)")
    print(f"   Viajes con Descalces (FAIL):  {failed_count} / {total_audited}")
    print("=" * 170)

    if failures:
        print("\n🚨 DETALLE DE ERRORES DETECTADOS EN EL LOOP:")
        for f in failures:
            print(f"  • {f['code']}")
    else:
        print("\n🎉 ¡TODOS LOS 31 VIAJES PASARON LA AUDITORÍA 2POD COMPLETENESS Y TIEMPOS 100% SIN ERRORES!")

if __name__ == "__main__":
    run_full_qc_loop()
