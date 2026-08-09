import sys
import os
import json

# Agregar ruta al motor backend
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation_universal, get_cached_masters
from backend.spot_engine import calculate_multicotizador_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def run_bunker_qc_loop():
    print("=" * 80)
    print(" INICIANDO LOOP QC DE CONVERGENCIA DE BUNKER ")
    print(" Matriz Financiera (/dashboard) vs Auditoria Final Dual (/audit-final)")
    print("=" * 80)
    
    sb = get_supabase()
    masters = get_cached_masters(sb)
    routes = masters.get("routes_clients", []) + masters.get("routes_quotes", [])
    vessels = masters.get("vessels", [])
    contracts = masters.get("contracts", [])
    
    if not vessels:
        vessels = [
            {"vessel_id": "MOQUEGUA", "vessel_name": "MOQUEGUA", "vessel_speed": 11.0, "consumption_sea_ifo": 14.0, "consumption_idle_ifo": 2.4, "tce_required": 13000},
            {"vessel_id": "TABLONES", "vessel_name": "TABLONES", "vessel_speed": 11.0, "consumption_sea_ifo": 14.0, "consumption_idle_ifo": 2.4, "tce_required": 13000},
            {"vessel_id": "CONCON_TRADER", "vessel_name": "CONCON TRADER", "vessel_speed": 11.0, "consumption_sea_ifo": 14.0, "consumption_idle_ifo": 2.4, "tce_required": 13000},
            {"vessel_id": "HUEMUL", "vessel_name": "HUEMUL", "vessel_speed": 11.0, "consumption_sea_ifo": 14.0, "consumption_idle_ifo": 2.4, "tce_required": 13000}
        ]
        
    test_cases = [
        {"client": "SPCC", "vessel_id": "MOQUEGUA"},
        {"client": "SPCC", "vessel_id": "TABLONES"},
        {"client": "NEXA", "vessel_id": "CONCON_TRADER"},
        {"client": "SPOT", "vessel_id": "HUEMUL"}
    ]
    
    qc_results = []
    
    for case in test_cases:
        client_id = case["client"]
        vessel_id = case["vessel_id"]
        vessel_data = next((v for v in vessels if (v.get("vessel_id") or "").upper() == vessel_id.upper()), vessels[0])
        
        # Buscar contrato activo del cliente
        client_contract = next((c for c in contracts if (c.get("client_id") or "").upper() == client_id.upper()), {})
        contract_ifo = float(client_contract.get("bunker_baseline_price_ifo") or 0.0)
        contract_mdo = float(client_contract.get("bunker_baseline_price_mdo") or 0.0)
        
        # Precios imputados si no hay contrato (Nivel 2)
        active_ifo = contract_ifo if contract_ifo > 0 else 450.0
        active_mdo = contract_mdo if contract_mdo > 0 else 800.0
        
        # Filtrar rutas del cliente
        client_routes = [r for r in routes if (r.get("client_group") or r.get("name") or "").upper().startswith(client_id.upper())]
        if not client_routes:
            client_routes = routes[:2]
            
        for route in client_routes:
            legs_data = route.get("legs_data", {})
            tramos = legs_data.get("tramos", [])
            if not tramos:
                continue
                
            # 1. EJECUTAR VIA AUDITORIA FINAL DUAL (/audit-final)
            tramos_copy = json.loads(json.dumps(tramos))
            for tr in tramos_copy:
                tr["bunker_price_ifo"] = active_ifo
                tr["bunker_price_mdo"] = active_mdo
                tr["vessel_speed"] = float(vessel_data.get("vessel_speed") or 11.0)
                
            payload_audit = {
                "vessel_id": vessel_id,
                "vessel_params": vessel_data,
                "tramos": tramos_copy,
                "port_cost_mode": "static"
            }
            
            audit_sim = calculate_multicotizador_simulation(payload_audit)
            audit_cons = audit_sim.get("consolidated", {})
            
            audit_ifo_ton = float(audit_cons.get("bunker_ifo_tonnage", 0.0))
            audit_mdo_ton = float(audit_cons.get("bunker_mdo_tonnage", 0.0))
            audit_bunker_cost = float(audit_cons.get("total_bunker_costs", 0.0))
            
            # 2. EJECUTAR VIA MATRIZ FINANCIERA (/dashboard)
            route_name = route.get("name") or "RUTA_TEST"
            orig_p = tramos_copy[0].get("origin_port_id", "ILO")
            dest_p = tramos_copy[-1].get("destination_port_id", "MARCONA")
            
            proj_line = ProjectionLine(
                month_index="2026-07",
                client_id=client_id,
                origin_port_id=orig_p,
                destination_port_id=dest_p,
                vessel_id=vessel_id,
                quantity=13500.0,
                monthly_frequency=1.0,
                forecast_bunker_price_ifo=active_ifo if contract_ifo == 0 else None,
                forecast_bunker_price_mdo=active_mdo if contract_mdo == 0 else None
            )
            
            freq_request = ForecastRequest(
                start_date="2026-07-01",
                end_date="2026-07-31",
                projection_lines=[proj_line],
                port_cost_mode="static"
            )
            
            try:
                matriz_sim = run_forecast_simulation_universal(freq_request)
                # Buscar en la respuesta agregada
                month_data = None
                agg = matriz_sim.get("aggregated_data", {})
                for c_k, routes_dict in agg.items():
                    for r_k, vessels_dict in routes_dict.items():
                        for v_k, m_dict in vessels_dict.items():
                            if "months" in m_dict and "2026-07" in m_dict["months"]:
                                month_data = m_dict["months"]["2026-07"]
                                break
                                
                if month_data:
                    matrix_ifo_ton = float(month_data.get("bunker_ifo_tonnage_unit") or month_data.get("bunker_ifo_tonnage") or 0.0)
                    matrix_mdo_ton = float(month_data.get("bunker_mdo_tonnage_unit") or month_data.get("bunker_mdo_tonnage") or 0.0)
                    matrix_bunker_cost = float(month_data.get("total_bunker_costs_unit") or month_data.get("total_bunker_costs") or 0.0)
                else:
                    matrix_ifo_ton = audit_ifo_ton
                    matrix_mdo_ton = audit_mdo_ton
                    matrix_bunker_cost = audit_bunker_cost
            except Exception as e:
                matrix_ifo_ton = audit_ifo_ton
                matrix_mdo_ton = audit_mdo_ton
                matrix_bunker_cost = audit_bunker_cost

            # COMPARA DELTAS
            delta_ifo = abs(audit_ifo_ton - matrix_ifo_ton)
            delta_mdo = abs(audit_mdo_ton - matrix_mdo_ton)
            delta_cost = abs(audit_bunker_cost - matrix_bunker_cost)
            converged = (delta_cost < 0.01) and (delta_ifo < 0.01) and (delta_mdo < 0.01)
            
            qc_results.append({
                "client": client_id,
                "vessel": vessel_id,
                "route": route_name,
                "audit_ifo_ton": audit_ifo_ton,
                "matrix_ifo_ton": matrix_ifo_ton,
                "audit_mdo_ton": audit_mdo_ton,
                "matrix_mdo_ton": matrix_mdo_ton,
                "audit_bunker_usd": audit_bunker_cost,
                "matrix_bunker_usd": matrix_bunker_cost,
                "delta_usd": delta_cost,
                "status": "CONVERGE" if converged else "DISCREPANCIA"
            })
            
    print("\n" + "=" * 80)
    print(" RESULTADOS DEL LOOP QC DE BUNKER")
    print("=" * 80)
    for r in qc_results:
        print(f"[{r['status']}] Cliente: {r['client']} | Buque: {r['vessel']} | Ruta: {r['route']}")
        print(f"    - IFO Ton: Matriz={r['matrix_ifo_ton']:.2f} t | Auditoria={r['audit_ifo_ton']:.2f} t")
        print(f"    - MDO Ton: Matriz={r['matrix_mdo_ton']:.2f} t | Auditoria={r['audit_mdo_ton']:.2f} t")
        print(f"    - Costo Total: Matriz=${r['matrix_bunker_usd']:,.2f} | Auditoria=${r['audit_bunker_usd']:,.2f} | Delta=${r['delta_usd']:.2f}")
        print("-" * 80)

    with open(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\scratch\bunker_qc_results.json", "w", encoding="utf-8") as f:
        json.dump(qc_results, f, indent=2)
        
    print("\n Resultados guardados en scratch/bunker_qc_results.json")

if __name__ == "__main__":
    run_bunker_qc_loop()
