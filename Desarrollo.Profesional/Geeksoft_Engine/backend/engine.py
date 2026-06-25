from backend.database import get_supabase
import math

def calculate_voyage_pnl(inputs: dict) -> dict:
    # 1. Desempaquetar inputs de UI e inyecciones de Maestros
    Q = float(inputs.get("quantity", 0))
    F = float(inputs.get("freight_rate", 0))
    dist = float(inputs.get("route_distance", 0))
    speed = float(inputs.get("vessel_speed", 0))
    w_factor = float(inputs.get("weather_factor", 0))
    overhead = float(inputs.get("port_overhead_hours", 0))
    
    # Parámetros de Carga (Origen)
    c_load = inputs.get("contract_agreed_load_rate")
    v_intake = float(inputs.get("vessel_max_load_intake_limit", 0))
    t_load_rate = float(inputs.get("max_terminal_load_rate", 0))
    
    # Parámetros de Descarga (Destino)
    c_disch = inputs.get("contract_agreed_discharge_rate")
    v_pump = float(inputs.get("vessel_pump_discharge_rate", 0))
    p_disch_limit = float(inputs.get("port_max_discharge_limit", 0))
    
    # Costos e Insumos
    ag_orig = float(inputs.get("agency_costs_origin", 0))
    ag_dest = float(inputs.get("agency_costs_destination", 0))
    p_ifo = float(inputs.get("bunker_price_ifo", 0))
    tce_req = float(inputs.get("tce_required", 0))
    c_sea = float(inputs.get("bunker_consumption_sea_ifo", 0))
    c_port = float(inputs.get("bunker_consumption_idle_ifo", 0))

    # 2. Control de Fallback para Variables de Cliente No Especificadas
    if c_load is None or c_load == 0 or c_load == "":
        c_load = 99999.0
    else:
        c_load = float(c_load)

    if c_disch is None or c_disch == 0 or c_disch == "":
        c_disch = 99999.0
    else:
        c_disch = float(c_disch)

    # 3. Resolución de Cuellos de Botella Técnicos (Lógica de Mínimos)
    actual_load_rate = min(c_load, v_intake, t_load_rate)
    actual_discharge_rate = min(c_disch, v_pump, p_disch_limit)

    # 4. Cálculos de Tiempos (Itinerario Simulado)
    is_round_trip = inputs.get("is_round_trip", True)
    trip_multiplier = 2 if is_round_trip else 1
    sea_days = ((dist * trip_multiplier) * (1 + w_factor)) / (speed * 24)
    hours_at_origin = (Q / actual_load_rate) + overhead
    hours_at_dest = (Q / actual_discharge_rate) + overhead
    
    # Granularidad Portuaria (Desglose real para el Bunker)
    load_days = (Q / actual_load_rate) / 24
    disch_days = (Q / actual_discharge_rate) / 24
    idle_days = (overhead * 2) / 24 # overhead en origen + destino
    
    port_days = load_days + disch_days + idle_days
    
    total_duration = sea_days + port_days

    # 5. Cálculos Financieros (Unit Economics)
    net_income = Q * F
    total_port_costs = ag_orig + ag_dest
    
    c_sea_ifo = float(inputs.get("bunker_consumption_sea_ifo", 0))
    c_idle_ifo = float(inputs.get("bunker_consumption_idle_ifo", 0))
    c_load_ifo = float(inputs.get("bunker_consumption_load_ifo", 0))
    c_disch_ifo = float(inputs.get("bunker_consumption_disch_ifo", 0))
    p_ifo = float(inputs.get("bunker_price_ifo", 0))
    
    c_sea_mdo = float(inputs.get("bunker_consumption_sea_mdo", 0))
    c_idle_mdo = float(inputs.get("bunker_consumption_idle_mdo", 0))
    c_load_mdo = float(inputs.get("bunker_consumption_load_mdo", 0))
    c_disch_mdo = float(inputs.get("bunker_consumption_disch_mdo", 0))
    p_mdo = float(inputs.get("bunker_price_mdo", 0))
    
    bunker_ifo_tonnage = (sea_days * c_sea_ifo) + (idle_days * c_idle_ifo) + (load_days * c_load_ifo) + (disch_days * c_disch_ifo)
    bunker_mdo_tonnage = (sea_days * c_sea_mdo) + (idle_days * c_idle_mdo) + (load_days * c_load_mdo) + (disch_days * c_disch_mdo)
    
    total_bunker_costs = (bunker_ifo_tonnage * p_ifo) + (bunker_mdo_tonnage * p_mdo)
    voyage_result = net_income - total_port_costs - total_bunker_costs

    # 6. KPIs de Rendimiento Gerencial (Mapeo a Apache ECharts)
    tce_real = voyage_result / total_duration if total_duration > 0 else 0
    pcm_projected = tce_real * 30.42
    pl_vs_required = voyage_result - (tce_req * total_duration)

    return {
        "actual_load_rate": actual_load_rate,
        "actual_discharge_rate": actual_discharge_rate,
        "sea_days": round(sea_days, 6),
        "port_days": round(port_days, 6),
        "total_duration": round(total_duration, 6),
        "net_income": round(net_income, 2),
        "total_port_costs": round(total_port_costs, 2),
        "bunker_ifo_tonnage": round(bunker_ifo_tonnage, 4),
        "bunker_mdo_tonnage": round(bunker_mdo_tonnage, 4),
        "total_bunker_costs": round(total_bunker_costs, 2),
        "voyage_result": round(voyage_result, 2),
        "tce_real": round(tce_real, 2),
        "pcm_projected": round(pcm_projected, 2),
        "pl_vs_required": round(pl_vs_required, 2)
    }

def calculate_baf_adjusted_rate(trip_inputs: dict, contract: dict, actual_bunker_price: float) -> float:
    # 1. Cargar tarifa base y precio base del contrato
    f_base = float(trip_inputs.get("freight_rate", 0))
    p_base_ifo = float(contract.get("bunker_baseline_price_ifo", 0))
    trigger_var = float(contract.get("bunker_trigger_variance", 0.05))
    Q = float(trip_inputs.get("quantity", 0))
    
    if p_base_ifo == 0:
        return f_base

    # 2. Verificar si se dispara la cláusula BAF
    variance = abs(actual_bunker_price - p_base_ifo) / p_base_ifo
    
    if variance < trigger_var:
        # Si no pasa del 5%, se mantiene la tarifa del contrato
        return f_base 
        
    # 3. Simular tiempos de la ruta (sea_days y port_days usando el tablero de 6 variables)
    times_result = calculate_voyage_pnl(trip_inputs)
    sea_days = times_result["sea_days"]
    port_days = times_result["port_days"]
    
    total_bunker_consumption = (sea_days * float(trip_inputs.get("bunker_consumption_sea_ifo", 0))) + \
                               (port_days * float(trip_inputs.get("bunker_consumption_idle_ifo", 0)))
                               
    # 4. Ejecución del Goal Seek: Calcular el sobrecosto absoluto del bunker
    delta_bunker_cost = total_bunker_consumption * (actual_bunker_price - p_base_ifo)
    
    # 5. Trasladar el sobrecosto exactamente a la tarifa por tonelada (Ajuste Target)
    freight_increase = delta_bunker_cost / Q if Q > 0 else 0
    baf_adjusted_freight_rate = f_base + freight_increase
    
    return round(baf_adjusted_freight_rate, 2)
