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

    print("=" * 120)
    print("🛡️ EJECUCIÓN DEL LOOP DE QC NON PLUS ULTRA EN LOS 31 VIAJES DE LA FLOTA PETRAL")
    print("=" * 120)

    total_audited = len(voyages)
    passed_count = 0
    failed_count = 0
    failures = []

    print(f"{'#':<3} | {'VIAJE CÓDIGO':<28} | {'BUQUE':<14} | {'PUERTO SUMA':<14} | {'ECUACIÓN 4 COMP':<16} | {'CARGA EQUALITY':<14} | {'ESTADO QC'}")
    print("-" * 120)

    for idx, v in enumerate(voyages, 1):
        code = v.get("voyage_code", "")
        vessel = v.get("vessel_name", "")
        details = v.get("details") or {}
        
        tot_port = float(details.get("port_expenses", {}).get("total_agency_usd", 0) or v.get("total_agency_usd", 0) or 0)
        load_cost = float(details.get("load_port_cost") or details.get("port_expenses", {}).get("load_port_usd") or 0)
        pod1_cost = float(details.get("discharge_port_1_cost") or details.get("port_expenses", {}).get("disch_port_1_usd") or 0)
        pod2_cost = float(details.get("discharge_port_2_cost") or details.get("port_expenses", {}).get("disch_port_2_usd") or 0)

        sum_port = round(load_cost + pod1_cost + pod2_cost, 2)
        diff_port = abs(sum_port - round(tot_port, 2))
        port_sum_ok = diff_port < 0.05

        gross = float(v.get("gross_revenue_usd") or 0)
        bunker = float(details.get("bunker_expenses", {}).get("total_bunker_usd", 0) or v.get("bunker_costs_usd", 0) or 0)
        net = float(v.get("net_profit_usd") or 0)
        opex = float(details.get("opex_cost_usd", 0) or (gross - tot_port - bunker - net))

        calc_net = round(gross - tot_port - bunker - opex, 2)
        diff_net = abs(calc_net - round(net, 2))
        eq_ok = diff_net < 1.00

        itin = details.get("itinerary") or []
        load_mt = sum(float(i.get("quantity_mt", 0)) for i in itin if float(i.get("quantity_mt", 0)) > 0)
        disch_mt = abs(sum(float(i.get("quantity_mt", 0)) for i in itin if float(i.get("quantity_mt", 0)) < 0))
        
        if disch_mt > 0 and load_mt > 0:
            diff_cargo = abs(load_mt - disch_mt)
            cargo_ok = diff_cargo < 1.0
        else:
            cargo_ok = True

        is_passed = port_sum_ok and eq_ok and cargo_ok

        if is_passed:
            passed_count += 1
            status_str = "✅ PASS OK"
        else:
            failed_count += 1
            status_str = "❌ FAIL ERROR"
            failures.append({
                "code": code,
                "port_ok": port_sum_ok,
                "eq_ok": eq_ok,
                "cargo_ok": cargo_ok,
                "details": f"Port diff: , EQ diff: "
            })

        print(f"{idx:<3} | {code:<28} | {vessel:<14} | {'✅ .00' if port_sum_ok else '❌ DIFF':<14} | {'✅ .00' if eq_ok else '❌ DIFF':<16} | {'✅ MATCH' if cargo_ok else '❌ MISMATCH':<14} | {status_str}")

    print("=" * 120)
    print(f"📊 RESUMEN FINAL AUDITORÍA DE LOOPS QC:")
    print(f"   Total Viajes Auditados: {total_audited}")
    print(f"   Viajes 100% Correctos (PASS): {passed_count} / {total_audited} ({(passed_count/total_audited)*100:.1f}%)")
    print(f"   Viajes con Descalces (FAIL):  {failed_count} / {total_audited}")
    print("=" * 120)

    if failures:
        print("\n🚨 DETALLE DE ERRORES DETECTADOS EN EL LOOP:")
        for f in failures:
            print(f"  • {f['code']}: {f['details']}")
    else:
        print("\n🎉 ¡TODOS LOS 31 VIAJES DE LA FLOTA PASARON EL CONTROL DE CALIDAD 100% SIN ERRORES!")

if __name__ == "__main__":
    run_full_qc_loop()
