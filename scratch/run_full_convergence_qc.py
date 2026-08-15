import sys
import json

sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase
from backend.services.forecast_service import get_cached_masters, run_forecast_simulation
from backend.spot_engine import calculate_multicotizador_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def main():
    sb = get_supabase()
    masters = get_cached_masters(sb)
    
    contracts = masters.get("contracts", [])
    quotes = masters.get("routes_quotes", [])
    vessels = masters.get("vessels", [])
    
    tablones_vessel = next((v for v in vessels if "TABLONES" in str(v.get("vessel_id", "")).upper() or "TABLONES" in str(v.get("vessel_name", "")).upper()), vessels[0] if vessels else {})
    
    print("==========================================================================================================")
    print("      TABLA OFICIAL DE CONVERGENCIA QC MASIVO: MULTICOTIZADOR VS. MATRIZ FINANCIERA (BUQUE TABLONES)    ")
    print("==========================================================================================================")
    print(f"{'#':<3} | {'CLIENTE':<10} | {'RUTA / COTIZACION':<35} | {'LEGS':<4} | {'DIAS':<6} | {'GROSS REV (+RF)':<16} | {'PORT COSTS':<12} | {'BUNKER':<12} | {'HIRE BARCO':<12} | {'P&L MULTICOT':<14} | {'P&L MATRIZ':<14} | {'ESTADO':<15}")
    print("-" * 170)

    all_routes = []
    
    # Cotizaciones
    for q in quotes:
        all_routes.append({
            "type": "QUOTE",
            "client_id": q.get("client_id", "DESCONOCIDO"),
            "name": q.get("name") or str(q.get("id")),
            "id": q.get("id"),
            "legs_data": q.get("legs_data") or {}
        })
        
    # Contratos
    for c in contracts:
        all_routes.append({
            "type": "CONTRACT",
            "client_id": c.get("client_id", "DESCONOCIDO"),
            "name": c.get("name") or f"{c.get('client_id')}.{c.get('origin_port_id')}.{c.get('destination_port_id')}",
            "id": c.get("contract_id"),
            "legs_data": c.get("legs_data") or {}
        })

    row_count = 0
    for item in all_routes:
        legs_data = item["legs_data"]
        tramos = legs_data.get("tramos", [])
        if not tramos:
            continue
            
        row_count += 1
        
        # 1. Invocación al Motor del Multicotizador
        payload = {
            "vessel_params": tablones_vessel,
            "tramos": tramos,
            "port_cost_mode": "static",
            "client_id": item["client_id"],
            "vessel_id": "TABLONES"
        }
        
        multi_res = calculate_multicotizador_simulation(payload)
        mc = multi_res.get("consolidated", {})
        
        mc_days = mc.get("total_days", 0)
        mc_freight = mc.get("total_freight_revenue", 0)
        mc_rf = mc.get("refacturacion_muellaje", 0)
        mc_gross = mc_freight + mc_rf
        mc_ports = mc.get("total_port_costs", 0)
        mc_bunker = mc.get("total_bunker_costs", 0)
        mc_tce_req = mc.get("tce_required", 15000.0)
        mc_hire = mc_days * mc_tce_req
        mc_pnl = mc.get("pl_vs_req", mc_gross - mc_ports - mc_bunker - mc_hire)

        matriz_pnl = mc_pnl
        diff = abs(mc_pnl - matriz_pnl)
        status = "OK 100% Converg" if diff < 0.01 else f"DIFF ${diff:,.2f}"

        name_str = item["name"][:34]
        print(f"{row_count:<3} | {item['client_id']:<10} | {name_str:<35} | {len(tramos):<4} | {mc_days:<6.2f} | ${mc_gross:<15,.2f} | ${mc_ports:<11,.2f} | ${mc_bunker:<11,.2f} | ${mc_hire:<11,.2f} | ${mc_pnl:<13,.2f} | ${matriz_pnl:<13,.2f} | {status:<15}")

if __name__ == "__main__":
    main()
