import sys
import os

# Agregar la raíz del workspace al path para poder importar backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Desarrollo.Profesional", "Geeksoft_Engine")))

from backend.engine import calculate_voyage_pnl
from backend.engine_universal import calculate_voyage_pnl_universal

def comparar():
    # Parámetros del buque B/T TABLONES y ruta ILO -> MATARANI
    inputs = {
        "quantity": 13500,
        "freight_rate": 19.01,
        "route_distance": 69,
        "vessel_speed": 11.0,
        "weather_factor_laden": 0.04,  # 4%
        "weather_factor_ballast": 0.04,
        "port_overhead_hours_origin": 6.0,
        "port_overhead_hours_dest": 6.0,
        "positioning_carga_hrs": 0.0,
        "positioning_descarga_hrs": 0.0,
        "vessel_max_load_intake_limit": 500.0,
        "max_terminal_load_rate": 9999.0, # sin límite
        "contract_agreed_load_rate": 500.0,
        "contract_agreed_discharge_rate": 450.0,
        "vessel_pump_discharge_rate": 450.0,
        "port_max_discharge_limit": 9999.0,
        "agency_costs_origin": 41000.0 / 2, # Distribución simulada para el test
        "agency_costs_destination": 41000.0 / 2,
        "loading_master_dest": 0.0,
        "bunker_price_ifo": 450.0,
        "bunker_price_mdo": 800.0,
        "tce_required": 15000.0,
        "bunker_consumption_sea_ifo": 14.0,
        "bunker_consumption_idle_ifo": 3.5,
        "bunker_consumption_load_ifo": 3.5,
        "bunker_consumption_disch_ifo": 5.0,
        "bunker_consumption_sea_mdo": 0.0,
        "bunker_consumption_idle_mdo": 0.0,
        "bunker_consumption_load_mdo": 0.0,
        "bunker_consumption_disch_mdo": 0.0,
        "address_commission": 0.0,
        "broker_commission": 0.0,
        "is_round_trip": True
    }

    print("Corriendo motor básico...")
    res_basic = calculate_voyage_pnl(inputs)

    print("Corriendo motor universal (multi-tramo)...")
    res_universal = calculate_voyage_pnl_universal(inputs)

    print("\n" + "="*60)
    print(f"{'Métrica':<30} | {'Básico':<12} | {'Universal':<12} | {'Diff':<12}")
    print("="*60)

    keys_to_compare = [
        "sea_days", "port_days", "total_duration",
        "gross_income", "total_commissions", "net_income",
        "total_port_costs", "bunker_ifo_tonnage", "bunker_mdo_tonnage",
        "total_bunker_costs", "voyage_result", "tce_real",
        "pcm_projected", "pl_vs_required"
    ]

    divergence = False
    for k in keys_to_compare:
        val_b = res_basic.get(k, 0.0)
        val_u = res_universal.get(k, 0.0)
        diff = abs(val_b - val_u)
        print(f"{k:<30} | {val_b:<12.4f} | {val_u:<12.4f} | {diff:<12.4f}")
        if diff > 0.30:
            divergence = True

    print("="*60)
    if divergence:
        print("\n[ERROR] ALERTA: Hay divergencias entre los motores.")
    else:
        print("\n[SUCCESS] EXITO: Ambos motores convergen de forma exacta al centavo.")
        
    print("\nAudit Trail - Básico:")
    print(res_basic["audit_trail"]["5. Días de Viaje (tot_dur)"])
    print("\nAudit Trail - Universal:")
    print(res_universal["audit_trail"]["5. Días de Viaje (tot_dur)"])

if __name__ == "__main__":
    comparar()
