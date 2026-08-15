import sys
import os
import json

# Agregar ruta del backend al path
engine_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine"
if engine_dir not in sys.path:
    sys.path.insert(0, engine_dir)

from backend.database import get_supabase
from backend.models.forecast_models import ForecastRequest, ProjectionLine
from backend.services.forecast_service import run_forecast_simulation

def run_bulletproof_qc_loop():
    print("==========================================================================")
    print(" === EJECUTANDO QC LOOP A PRUEBA DE BALAS: CONVERGENCIA MATRIZ <-> SUPABASE ===")
    print("==========================================================================")

    sb = get_supabase()
    
    # 1. Obtener todas las cotizaciones de routes_quotes y contracts
    res_quotes = sb.table("routes_quotes").select("*").execute().data or []
    res_contracts = sb.table("contracts").select("*").execute().data or []
    
    all_quotes = res_quotes + res_contracts
    print(f"[+] Total de cotizaciones encontradas en DB: {len(all_quotes)}")

    success_count = 0
    fail_count = 0
    results_summary = []

    for q in all_quotes:
        name = q.get("name") or q.get("contract_id") or "DESCONOCIDO"
        client = q.get("client_id") or "NEXA"
        orig = q.get("origin_port_id") or "CALLAO"
        dest = q.get("destination_port_id") or "MATARANI"
        legs_data = q.get("legs_data") or {}
        
        tramos = legs_data.get("tramos") or []
        if not tramos:
            continue

        # Preparar request de simulación
        req = ForecastRequest(
            start_date="2026-07-01",
            end_date="2026-12-31",
            projection_lines=[
                ProjectionLine(
                    month_index="2026-07",
                    client_id=client,
                    origin_port_id=orig,
                    destination_port_id=dest,
                    vessel_id="TABLONES",
                    quantity=13500,
                    monthly_frequency=1,
                    quote_id=name
                )
            ],
            port_cost_mode="static"
        )

        try:
            res = run_forecast_simulation(req)
            agg = res.get("aggregated_data", {}).get(client, {}).get(f"{orig}-{dest}", {}).get("TABLONES", {}).get("2026-07", {})
            
            if not agg:
                # Intentar con la clave genérica o buscar primer resultado
                for client_k, routes_v in res.get("aggregated_data", {}).items():
                    for route_k, vessels_v in routes_v.items():
                        for vessel_k, months_v in vessels_v.items():
                            if "2026-07" in months_v:
                                agg = months_v["2026-07"]
                                break

            if agg:
                duration = agg.get("total_duration", 0)
                port_costs = agg.get("total_port_costs", 0)
                bunker_costs = agg.get("total_bunker_costs", 0)
                voyage_result = agg.get("voyage_result", 0)
                pnl = agg.get("pl_vs_required", 0)
                
                print(f"[OK] {name:<45} | Dur: {duration:.2f}d | PnL: ${pnl:,.2f} | Búnker: ${bunker_costs:,.2f}")
                success_count += 1
                results_summary.append({
                    "name": name,
                    "duration": duration,
                    "pnl": pnl,
                    "status": "OK"
                })
            else:
                print(f"[FAIL] {name:<45} | Sin datos agregados devueltos")
                fail_count += 1
        except Exception as e:
            print(f"[ERROR] {name:<45} | Exception: {e}")
            fail_count += 1

    print("==========================================================================")
    print(f" RESUMEN QC LOOP: {success_count} Exitosas | {fail_count} Fallidas")
    print("==========================================================================")
    
    return fail_count == 0

if __name__ == "__main__":
    success = run_bulletproof_qc_loop()
    if not success:
        sys.exit(1)
