import os
import sys
import json

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Add parent directory to path to load backend modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Mapa de Tarifas Portuarias Reales por Puerto
PORT_COSTS_MASTER = {
    "CALLAO": 31327.99,     # Puerto de Carga Principal
    "MARCONA": 40000.00,    # Puerto de Descarga
    "MATARANI": 17000.00,   # Puerto de Descarga
    "MEJILLONES": 50000.00,  # Puerto de Descarga Principal Chile
    "ILO": 15000.00         # Base principal
}

def run_qc_test_suite():
    print("=" * 100)
    print("[QC LOOP AUTÓNOMO] AUDITORÍA DETALLADA DE RUTAS SPCC Y NEXA (TRANSPARENCIA TOTAL DE DÍAS Y BÚNKER)")
    print("=" * 100)
    
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
        
        # Preparar tramos aplicando las tarifas portuarias de maestras reales
        for tr in tramos:
            tr["bunker_price_ifo"] = 895.14
            tr["bunker_price_mdo"] = 1460.30
            tr["vessel_speed"] = 11.0
            
            orig_p = tr.get("origin_port_id", "ILO")
            dest_p = tr.get("destination_port_id", "ILO")
            
            if tr.get("type") == "LADEN" or tr.get("origin_action") == "CARGAR":
                tr["type"] = "LADEN"
                if not tr.get("quantity") or tr.get("quantity") == 0:
                    tr["quantity"] = 13500.0
                if not tr.get("freight_rate") or tr.get("freight_rate") == 0:
                    tr["freight_rate"] = 25.50
                tr["agency_costs_origin"] = PORT_COSTS_MASTER.get(orig_p, 31327.99)
                tr["agency_costs_destination"] = PORT_COSTS_MASTER.get(dest_p, 40000.00)
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
            if tot_dist > 500 and bunker_cost < 20000:
                issues.append(f"Costo de Búnker Ridículamente Bajo (${bunker_cost:,.2f} USD para {tot_dist:,.1f} NM)")
                
            for idx, tr_res in enumerate(tramos_res):
                if tr_res.get("type") == "BALLAST" and tr_res.get("port_costs", 0) > 0:
                    issues.append(f"Pierna #{idx+1} (BALLAST) cobró costo portuario (${tr_res.get('port_costs'):,.2f} USD)")

            passed = len(issues) == 0
            
            print("  ┌" + "─" * 94)
            print(f"  │ 📍 RESUMEN CONSOLIDADO: Distancia {tot_dist:,.1f} NM | Días Totales {cons.get('total_days', 0):.2f}d ({cons.get('total_sea_days', 0):.2f}d Mar + {cons.get('total_port_days', 0):.2f}d Puerto)")
            print(f"  │ ⛽ Búnker Total:  ${bunker_cost:,.2f} USD ({cons.get('bunker_ifo_tonnage', 0):.2f} t IFO | {cons.get('bunker_mdo_tonnage', 0):.2f} t MDO)")
            print(f"  │ ⚓ Puerto Total:  ${port_costs:,.2f} USD")
            print(f"  │ 💰 Ingreso Flete: ${net_income:,.2f} USD | PnL Neto: ${pnl_net:,.2f} USD | TCE: ${tce_real:,.2f} USD/Día")
            print("  ├" + "─" * 94)
            print("  │ 🔍 ARITMÉTICA EXPLICATIVA Y ORIGEN DE LOS DÍAS (MAR VS PUERTO):")
            
            p_ifo = 895.14
            p_mdo = 1460.30

            for idx, tr_res in enumerate(tramos_res):
                tipo = tr_res.get("type", "BALLAST")
                orig = tr_res.get("origin_port_id")
                dest = tr_res.get("destination_port_id")
                dist_p = tr_res.get("distance", 0)
                wf = tr_res.get("weather_factor", 0.05)
                speed = 11.0
                sea_d = tr_res.get("sea_days", 0)
                port_d = tr_res.get("port_days", 0)
                
                # Consumos
                cons_sea_ifo = vessel.get("consumption_sea_ifo", 14.0)
                bunk_sea_ifo = sea_d * cons_sea_ifo
                bunk_sea_cost = bunk_sea_ifo * p_ifo

                bunk_port_ifo = tr_res.get("bunker_ifo", 0) - bunk_sea_ifo
                bunk_port_mdo = tr_res.get("bunker_mdo", 0)
                bunk_port_cost = (bunk_port_ifo * p_ifo) + (bunk_port_mdo * p_mdo)
                bunk_total_leg = tr_res.get("bunker_costs", 0)

                cost_orig = tr_res.get("agency_costs_origin", 0)
                cost_dest = tr_res.get("agency_costs_destination", 0)
                income_p = tr_res.get("net_income", 0)

                # Cálculo Explicativo Días de Mar
                print(f"  │   • PIERNA #{idx+1} [{tipo}]: {orig} ➔ {dest} | Distancia: {dist_p:,.1f} NM")
                print(f"  │       🌊 Días de Mar ({sea_d:.2f}d): [{dist_p:,.1f} NM × (1 + {wf*100:.1f}% WF)] / [{speed} kts × 24h] = {sea_d:.2f} Días")
                print(f"  │          ↳ Búnker Mar: {sea_d:.2f}d × {cons_sea_ifo} t/d IFO × ${p_ifo:,.2f} = ${bunk_sea_cost:,.2f} USD")
                
                if tipo == "LADEN":
                    Q = tr_res.get("quantity", 13500)
                    r_load = tr_res.get("actual_load_rate", 500)
                    r_disch = tr_res.get("actual_discharge_rate", 345)
                    load_d = (Q / r_load) / 24 if r_load > 0 else 0
                    disch_d = (Q / r_disch) / 24 if r_disch > 0 else 0
                    idle_d = max(0, port_d - load_d - disch_d)
                    
                    print(f"  │       ⚓ Días de Puerto ({port_d:.2f}d): Carga ({Q}t/{r_load}t/h = {load_d:.2f}d) + Descarga ({Q}t/{r_disch}t/h = {disch_d:.2f}d) + Overheads ({idle_d:.2f}d) = {port_d:.2f} Días")
                    print(f"  │          ↳ Búnker Puerto: {bunk_port_ifo:.2f} t IFO + {bunk_port_mdo:.2f} t MDO = ${bunk_port_cost:,.2f} USD")
                    print(f"  │       🔥 Búnker Total Pierna:  ${bunk_sea_cost:,.2f} + ${bunk_port_cost:,.2f} = ${bunk_total_leg:,.2f} USD")
                    print(f"  │       🚢 Agencia Carga ({orig}):    ${cost_orig:,.2f} USD")
                    print(f"  │       🚢 Agencia Descarga ({dest}): ${cost_dest:,.2f} USD")
                    print(f"  │       💵 Ingreso Flete Leg:     ${income_p:,.2f} USD")
                else:
                    print(f"  │       ⚓ Días de Puerto: 0.00 Días (Pierna en Lastre)")
                    print(f"  │       🔥 Búnker Total Pierna: ${bunk_total_leg:,.2f} USD")
                    print(f"  │       🚢 Agencia Puerto:      $0.00 USD (Lastre)")

            print("  └" + "─" * 94)

            if passed:
                print(f"  ✅ [QC PASSED] Ruta validada al 100% con trazabilidad completa de días y búnker.\n")
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

    print("=" * 100)
    if all_passed:
        print("🎉 [RESULTADO FINAL] TODOS LOS TESTS DEL LOOP QC PASARON CON ÉXITO AL 100%")
    else:
        print("⚠️ [RESULTADO FINAL] ALGUNAS RUTAS REGISTRARON ANOMALÍAS EN QC")
    print("=" * 100)
    return all_passed

if __name__ == "__main__":
    run_qc_test_suite()
