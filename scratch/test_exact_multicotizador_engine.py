import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase
from backend.services.forecast_service import get_cached_masters

def calculate_multicotizador_exact():
    # Parámetros auditados del Multicotizador (Imagen 1):
    vesselParams = {
        "vessel_speed": 11.0,
        "tce_required": 15000.0,
        "consumption_sea_ifo": 14.5,
        "consumption_sea_mdo": 0.1,
        "consumption_idle_ifo": 3.5,
        "consumption_idle_mdo": 0.1,
        "consumption_load_ifo": 3.5,
        "consumption_load_mdo": 0.1,
        "consumption_disch_ifo": 5.0,
        "consumption_disch_mdo": 0.1
    }
    bunkerPriceIfo = 1100.0
    bunkerPriceMdo = 1700.0
    
    tramos = [
        {"origin_port_id": "ILO", "destination_port_id": "CALLAO", "route_distance": 514, "weather_factor": 3.0, "speed": 11.0, "type": "BALLAST"},
        {"origin_port_id": "CALLAO", "destination_port_id": "MATARANI", "route_distance": 457, "weather_factor": 3.0, "speed": 11.0, "type": "LADEN"},
        {"origin_port_id": "MATARANI", "destination_port_id": "ILO", "route_distance": 69, "weather_factor": 3.0, "speed": 11.0, "type": "BALLAST"}
    ]
    
    puertosConfig = [
        {"action": "NONE", "manual_port_cost": 0, "muellaje_cost": 0, "time_to_count": 0, "positioning": 0, "quantity": 0, "op_rate": 500, "freight_rate": 0},
        {"action": "CARGAR", "manual_port_cost": 17000, "muellaje_cost": 7000, "time_to_count": 6, "positioning": 1, "quantity": 13500, "op_rate": 500, "freight_rate": 0},
        {"action": "DESCARGAR", "manual_port_cost": 18000, "muellaje_cost": 6000, "time_to_count": 6, "positioning": 0, "quantity": 13500, "op_rate": 400, "freight_rate": 30},
        {"action": "NONE", "manual_port_cost": 0, "muellaje_cost": 0, "time_to_count": 0, "positioning": 0, "quantity": 0, "op_rate": 500, "freight_rate": 0}
    ]
    
    refacturarMap = {1: True, 2: True}

    # 1. Tramos mar
    sea_days_total = 0.0
    for t in tramos:
        d = t["route_distance"]
        wf = t["weather_factor"] / 100.0
        s = t["speed"]
        sea_days_total += (d * (1 + wf)) / (s * 24)
        
    # 2. Puertos días
    port_days_total = 0.0
    for p in puertosConfig:
        if p["action"] != "NONE":
            idle_d = (p["time_to_count"] + p["positioning"]) / 24.0
            op_d = (p["quantity"] / p["op_rate"]) / 24.0
            port_days_total += (idle_d + op_d)

    total_days = sea_days_total + port_days_total
    
    # 3. Consumos
    ifo_sea = sea_days_total * vesselParams["consumption_sea_ifo"]
    mdo_sea = sea_days_total * vesselParams["consumption_sea_mdo"]
    
    # Idle & Op days
    p1 = puertosConfig[1] # Cargar Callao
    p2 = puertosConfig[2] # Descargar Matarani
    
    idle_p1 = (p1["time_to_count"] + p1["positioning"]) / 24.0
    op_p1 = (p1["quantity"] / p1["op_rate"]) / 24.0
    
    idle_p2 = (p2["time_to_count"] + p2["positioning"]) / 24.0
    op_p2 = (p2["quantity"] / p2["op_rate"]) / 24.0

    ifo_port = (idle_p1 * 3.5) + (op_p1 * 3.5) + (idle_p2 * 3.5) + (op_p2 * 5.0)
    mdo_port = (idle_p1 * 0.1) + (op_p1 * 0.1) + (idle_p2 * 0.1) + (op_p2 * 0.1)

    ifo_total = ifo_sea + ifo_port
    mdo_total = mdo_sea + mdo_port

    bunker_cost = (ifo_total * bunkerPriceIfo) + (mdo_total * bunkerPriceMdo)
    
    # 4. Port costs
    port_costs = 17000 + 7000 + 18000 + 6000 # 48,000
    refact_muellaje = 7000 + 6000 # 13,000
    freight = 13500 * 30 # 405,000
    gross_revenue = freight + refact_muellaje # 418,000
    
    hire = total_days * vesselParams["tce_required"] # 106,957
    pnl = gross_revenue - port_costs - bunker_cost - hire
    tce_real = (gross_revenue - port_costs - bunker_cost) / total_days

    print("=======================================================")
    print("VERIFICACIÓN MATEMÁTICA CON MOTOR MULTICOTIZADOR EXACTO:")
    print("=======================================================")
    print(f"Días de Mar: {sea_days_total:.2f} d")
    print(f"Días de Puerto: {port_days_total:.2f} d")
    print(f"Días Totales: {total_days:.2f} d")
    print(f"IFO Total: {ifo_total:.1f} T | MDO Total: {mdo_total:.1f} T")
    print(f"Bunker Total Cost: ${bunker_cost:,.2f}")
    print(f"Port Costs Total: ${port_costs:,.2f}")
    print(f"Refacturación Muellaje (RF): +${refact_muellaje:,.2f}")
    print(f"Freight Revenue: ${freight:,.2f}")
    print(f"Gross Revenue Total: ${gross_revenue:,.2f}")
    print(f"Hire Barco: -${hire:,.2f}")
    print(f"P&L NETO FINAL TARGET: ${pnl:,.2f}")
    print(f"TCE REALIZADO TARGET: ${tce_real:,.2f} / día")

if __name__ == "__main__":
    calculate_multicotizador_exact()
