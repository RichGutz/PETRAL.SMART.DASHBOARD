import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "Desarrollo.Profesional", "Geeksoft_Engine"))

from backend.spot_engine import calculate_multicotizador_simulation

def test():
    # Precios de bunker reales de la BD
    p_ifo = 895.14
    p_mdo = 1460.30
    
    # Viaje redondo: ILO - MATARANI - ILO
    # Tramo 1 (Laden): ILO -> MATARANI
    # Tramo 2 (Ballast): MATARANI -> ILO
    # Buque: MOQUEGUA (vessel_id: MOQUEGUA)
    
    # Cargar datos del barco y de puertos
    # Para Moquegua, en la BD se asume:
    # Speed: 11.0, TCE required: 0.0, etc.
    # Costo portuario ILO (SPCC): agency_costs_origin = 9999.0
    # Costo portuario MATARANI (SPCC): agency_costs_destination = 9999.0 (aprox, usaremos 9999 para ambos como en Ledger)
    
    payload = {
        "vessel_params": {
            "vessel_speed": 11.0,
            "bunker_price_ifo": p_ifo,
            "bunker_price_mdo": p_mdo,
            "consumption_sea_ifo": 15.0,
            "consumption_idle_ifo": 1.5,
            "consumption_load_ifo": 1.5,
            "consumption_disch_ifo": 3.0,
            "consumption_sea_mdo": 1.0,
            "consumption_idle_mdo": 0.1,
            "consumption_load_mdo": 0.1,
            "consumption_disch_mdo": 0.2
        },
        "tramos": [
            {
                "type": "LADEN",
                "origin_port_id": "ILO",
                "destination_port_id": "MATARANI",
                "route_distance": 78.0, # NM
                "weather_factor": 0.0,
                "quantity": 13500.0,
                "freight_rate": 22.50,
                "contract_agreed_load_rate": 800.0,  # MT/h
                "contract_agreed_discharge_rate": 600.0, # MT/h
                "port_overhead_hours_origin": 6.0,
                "port_overhead_hours_dest": 6.0,
                "positioning_carga_hrs": 1.0,
                "positioning_descarga_hrs": 1.0,
                "agency_costs_origin": 9999.0,
                "agency_costs_destination": 9999.0,
                "port_delay_hours_loading": 0.0,
                "port_delay_hours_discharging": 0.0
            },
            {
                "type": "BALLAST",
                "origin_port_id": "MATARANI",
                "destination_port_id": "ILO",
                "route_distance": 78.0,
                "weather_factor": 0.0,
                "agency_costs_origin": 9999.0,
                "agency_costs_destination": 9999.0
            }
        ]
    }
    
    res = calculate_multicotizador_simulation(payload)
    
    # Recalcular ingresos del tramo en el frontend según flete de descarga
    # Descarga en Matarani (Destino del Tramo 1): flete de 13,500 * 22.50 = 303,750
    # No hay descarga en ILO (Destino del Tramo 2): flete 0
    t1_income = 13500.0 * 22.50
    t2_income = 0.0
    
    total_freight = t1_income + t2_income
    
    print("\n" + "="*50)
    print("TEST DE CONVERGENCIA: ILO-MATARANI-ILO (MOQUEGUA)")
    print("="*50)
    
    # Desglose tramos
    for idx, t in enumerate(res["tramos"]):
        # Calcular P&L ajustado con el flete imputado al tramo
        net_income = t1_income if idx == 0 else t2_income
        pnl = net_income - t["bunker_costs"] - t["port_costs"]
        print(f"\nTRAMO {idx+1} ({t['type']}): {t['origin_port_id']} -> {t['destination_port_id']}")
        print(f"  - Días Mar:     {t['sea_days']:.3f} d")
        print(f"  - Días Puerto:  {t['port_days']:.3f} d")
        print(f"  - Bunker Cost:  ${t['bunker_costs']:,.2f}")
        print(f"  - Port Cost:    ${t['port_costs']:,.2f}  <-- DEBE SER 0 EN T2 BALLAST")
        print(f"  - Flete Imput:  ${net_income:,.2f}")
        print(f"  - P&L Tramo:    ${pnl:,.2f}")

    print("\n" + "-"*50)
    print("CONSOLIDADO TOTAL:")
    print("-"*50)
    total_port_costs = sum(t["port_costs"] for t in res["tramos"])
    total_bunker_costs = sum(t["bunker_costs"] for t in res["tramos"])
    pnl_consolidado = total_freight - total_port_costs - total_bunker_costs
    tce_consolidado = pnl_consolidado / res["consolidated"]["total_days"]
    
    print(f"  - Días Totales: {res['consolidated']['total_days']:.3f} d")
    print(f"  - Bunker Total: ${total_bunker_costs:,.2f}")
    print(f"  - Port Total:   ${total_port_costs:,.2f}  <-- DEBE SER EXACTAMENTE $19,998")
    print(f"  - Flete Total:  ${total_freight:,.2f}")
    print(f"  - Net Utility:  ${pnl_consolidado:,.2f}")
    print(f"  - TCE por día:  ${tce_consolidado:,.2f}/d")
    print("="*50 + "\n")

if __name__ == "__main__":
    test()
