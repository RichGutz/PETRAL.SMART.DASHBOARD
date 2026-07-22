import os
import sys
import json

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Add parent directory to path to load backend modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run_qc_test_suite():
    print("=" * 80)
    print("[QC LOOP AUTÓNOMO] AUDITORÍA DE RUTAS SPCC Y NEXA (SISTEMA PETRAL)")
    print("=" * 80)
    
    from backend.database import get_supabase
    from backend.spot_engine import calculate_multicotizador_simulation
    
    sb = get_supabase()
    
    routes_res = sb.table("routes_clients").select("*").execute()
    routes = routes_res.data or []
    
    if not routes:
        print("[ERROR CRÍTICO] No se encontraron rutas en routes_clients")
        return False
        
    v_res = sb.table("vessels").select("*").eq("vessel_id", "MOQUEGUA").execute()
    vessel = v_res.data[0] if v_res.data else {
        "vessel_id": "MOQUEGUA",
        "vessel_name": "MOQUEGUA",
        "vessel_speed": 11.0,
        "consumption_sea_ifo": 14.0,
        "consumption_sea_mdo": 0.0,
        "consumption_idle_ifo": 2.4,
        "consumption_idle_mdo": 0.0,
        "consumption_load_ifo": 2.4,
        "consumption_load_mdo": 0.5,
        "consumption_disch_ifo": 3.6,
        "consumption_disch_mdo": 0.5,
        "bunker_price_ifo": 895.14,
        "bunker_price_mdo": 1460.30
    }
    
    print(f"📊 Rutas Oficiales Encontradas: {len(routes)}\n")
    
    all_passed = True

    for r in routes:
        name = (r.get("name") or "").strip()
        tramos = r.get("legs_data", {}).get("tramos", [])
        if not tramos:
            continue
            
        print(f"🚢 AUDITANDO RUTA: {name} ({len(tramos)} Piernas)")
        
        # Preparar tramos con precios e inputs estándar si están vacíos
        for tr in tramos:
            if not tr.get("bunker_price_ifo"): tr["bunker_price_ifo"] = 895.14
            if not tr.get("bunker_price_mdo"): tr["bunker_price_mdo"] = 1460.30
            if not tr.get("vessel_speed"): tr["vessel_speed"] = 11.0
            
            if tr.get("type") == "LADEN" or tr.get("origin_action") == "CARGAR":
                tr["type"] = "LADEN"
                if not tr.get("quantity") or tr.get("quantity") == 0:
                    tr["quantity"] = 13500.0
                if not tr.get("freight_rate") or tr.get("freight_rate") == 0:
                    tr["freight_rate"] = 25.50
                if not tr.get("agency_costs_origin") or tr.get("agency_costs_origin") == 0:
                    tr["agency_costs_origin"] = 31327.99
                if not tr.get("agency_costs_destination") or tr.get("agency_costs_destination") == 0:
                    tr["agency_costs_destination"] = 40000.00
            else:
                tr["type"] = "BALLAST"
                tr["agency_costs_origin"] = 0.0
                tr["agency_costs_destination"] = 0.0

        payload = {
            "vessel_id": "MOQUEGUA",
            "vessel_params": vessel,
            "tramos": tramos,
            "port_cost_mode": "static"
        }

        try:
            res = calculate_multicotizador_simulation(payload)
            cons = res.get("consolidated", {})
            tramos_res = res.get("tramos", [])
            
            tot_dist = cons.get("total_distance", 0)
            bunker_cost = cons.get("total_bunker_costs", 0)
            port_costs = cons.get("total_port_costs", 0)
            net_income = cons.get("total_freight_revenue", 0)
            pnl_net = cons.get("pnl_net_utility", 0)
            tce_real = cons.get("tce_real", 0)
            
            # Auditoría de Criterios de Aceptación (QC Rules)
            issues = []
            
            # Regla 1: Búnker Ridículo
            if tot_dist > 500 and bunker_cost < 20000:
                issues.append(f"Costo de Búnker Ridículamente Bajo (${bunker_cost:,.2f} USD para {tot_dist:,.1f} NM)")
                
            # Regla 2: Sobrecosto Portuario en Lastre
            for idx, tr_res in enumerate(tramos_res):
                if tr_res.get("type") == "BALLAST" and tr_res.get("port_costs", 0) > 0:
                    issues.append(f"Pierna #{idx+1} (BALLAST) cobró costo portuario (${tr_res.get('port_costs'):,.2f} USD)")
                    
            # Regla 3: Ingreso Flete Cero en LADEN
            for idx, tr_res in enumerate(tramos_res):
                if tr_res.get("type") == "LADEN" and tr_res.get("net_income", 0) <= 0:
                    issues.append(f"Pierna #{idx+1} (LADEN) tiene ingreso de flete nulo (${tr_res.get('net_income'):,.2f} USD)")

            passed = len(issues) == 0
            if passed:
                print(f"  ✅ [QC PASSED]")
                print(f"     • Distancia Total: {tot_dist:,.1f} NM")
                print(f"     • Costo Búnker:    ${bunker_cost:,.2f} USD")
                print(f"     • Costos Puerto:   ${port_costs:,.2f} USD")
                print(f"     • Ingreso Flete:   ${net_income:,.2f} USD")
                print(f"     • PnL Neto:        ${pnl_net:,.2f} USD")
                print(f"     • TCE Real:        ${tce_real:,.2f} USD/Día\n")
            else:
                print(f"  ❌ [QC RECHAZADO]")
                for iss in issues:
                    print(f"     - {iss}")
                print("")
                all_passed = False
                
        except Exception as e:
            import traceback
            print(f"  💥 ERROR EN SIMULACIÓN: {str(e)}")
            traceback.print_exc()
            all_passed = False

    print("=" * 80)
    if all_passed:
        print("🎉 [RESULTADO FINAL] TODOS LOS TESTS DEL LOOP QC PASARON CON ÉXITO AL 100%")
    else:
        print("⚠️ [RESULTADO FINAL] ALGUNAS RUTAS REGISTRARON ANOMALÍAS EN QC")
    print("=" * 80)
    return all_passed

if __name__ == "__main__":
    run_qc_test_suite()
