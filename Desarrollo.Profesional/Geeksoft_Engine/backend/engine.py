from backend.database import get_supabase
import math

def calculate_voyage_pnl(inputs: dict) -> dict:
    # 1. Desempaquetar inputs de UI e inyecciones de Maestros
    Q = float(inputs.get("quantity", 0))
    F = float(inputs.get("freight_rate", 0))
    dist = float(inputs.get("route_distance", 0))
    speed = float(inputs.get("vessel_speed", 11.0))
    w_factor_laden = float(inputs.get("weather_factor_laden", inputs.get("weather_factor", 0.0)))
    w_factor_ballast = float(inputs.get("weather_factor_ballast", inputs.get("weather_factor", 0.0)))
    
    overhead_origin = float(inputs.get("port_overhead_hours_origin", 6))
    overhead_dest = float(inputs.get("port_overhead_hours_dest", 6))   
    pos_carga = float(inputs.get("positioning_carga_hrs", 0.0))
    pos_descarga = float(inputs.get("positioning_descarga_hrs", 0.0))
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
    c_load = float(c_load) if c_load else 0.0
    c_disch = float(c_disch) if c_disch else 0.0

    # 3. Resolución de Cuellos de Botella Técnicos (Lógica de Mínimos Diferentes a Cero)
    def min_non_zero(*args):
        valid_vals = [val for val in args if val > 0]
        return min(valid_vals) if valid_vals else 0.0

    # 3. Resolución de Cuellos de Botella Técnicos (Lógica Simplificada por Contrato)
    actual_load_rate = c_load if c_load > 0 else 9999.0
    actual_discharge_rate = c_disch if c_disch > 0 else 9999.0

    # 4. Cálculos de Tiempos (Itinerario Simulado)
    is_round_trip = inputs.get("is_round_trip", True)
    if is_round_trip:
        sea_days = (dist * (1 + w_factor_laden) + dist * (1 + w_factor_ballast)) / (speed * 24)
    else:
        sea_days = (dist * (1 + w_factor_laden)) / (speed * 24)
    
    hours_at_origin = (Q / actual_load_rate) + overhead_origin + pos_carga
    hours_at_dest = (Q / actual_discharge_rate) + overhead_dest + pos_descarga
    
    # Granularidad Portuaria (Desglose real para el Bunker)
    load_days = (Q / actual_load_rate) / 24
    disch_days = (Q / actual_discharge_rate) / 24
    idle_days = (overhead_origin + overhead_dest + pos_carga + pos_descarga) / 24 # overhead + pos_carga + pos_descarga
    
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

    # --- RASTRO DE AUDITORIA (VOYAGE LEDGER TEST) ---
    def fmt_tbd(val):
        return f"{val:,.0f}" if val > 0 else "TBD"

    # Colores por tabla de origen (deben coincidir con COLOR_SCHEME del frontend)
    def vc(val): return f"<span class='text-blue-600 font-black'>{val}</span>"      # vessels
    def rc(val): return f"<span class='text-purple-600 font-black'>{val}</span>"    # routes
    def oc(val): return f"<span class='text-orange-600 font-black'>{val}</span>"    # ports
    def ec(val): return f"<span class='text-emerald-600 font-black'>{val}</span>"   # contracts
    def ac(val): return f"<span class='text-amber-600 font-black'>{val}</span>"     # bunker_prices
    def rsc(val): return f"<span class='text-rose-600 font-black'>{val}</span>"     # agency_matrix

    audit_trail = {
        "1. Tasa Carga (act_load)": {
            "formula": "c_load",
            "values": f"{ec(fmt_tbd(c_load))}"
        },
        "2. Tasa Descarga (act_disch)": {
            "formula": "c_disch",
            "values": f"{ec(fmt_tbd(c_disch))}"
        },
        "3. Días de Puerto (port_days)": {
            "formula": "((Q/act_load + over_or + pos_or) + (Q/act_disch + over_de + pos_de)) / 24",
            "values": f"(({ec(f'{Q:,.0f}')}/{vc(f'{actual_load_rate:,.0f}')} + {oc(f'{overhead_origin:,.1f}')} + {oc(f'{pos_carga:,.1f}')}) + ({ec(f'{Q:,.0f}')}/{vc(f'{actual_discharge_rate:,.0f}')} + {oc(f'{overhead_dest:,.1f}')} + {oc(f'{pos_descarga:,.1f}')})) / 24"
        },
        "4. Días de Mar (sea_days)": {
            "formula": "(dist * (1+w_laden) + dist * (1+w_ballast)) / (speed * 24)" if is_round_trip else "(dist * (1+w_laden)) / (speed * 24)",
            "values": f"({rc(f'{dist:,.0f}')} * (1+{rc(f'{w_factor_laden:,.2f}')}) + {rc(f'{dist:,.0f}')} * (1+{rc(f'{w_factor_ballast:,.2f}')})) / ({vc(f'{speed:,.1f}')} * 24)" if is_round_trip else f"({rc(f'{dist:,.0f}')} * (1+{rc(f'{w_factor_laden:,.2f}')})) / ({vc(f'{speed:,.1f}')} * 24)"
        },
        "5. Costo Bunker (bunker)": {
            "formula": "(ifo_tons * p_ifo) + (mdo_tons * p_mdo)",
            "values": f"({vc(f'{bunker_ifo_tonnage:,.2f}')} * {ac(f'{p_ifo:,.2f}')}) + ({vc(f'{bunker_mdo_tonnage:,.2f}')} * {ac(f'{p_mdo:,.2f}')})"
        },
        "7. Resultado Viaje (voy_res)": {
            "formula": "(Q * F) - port_costs - bunker",
            "values": f"({ec(f'{Q:,.0f}')} * {ec(f'{F:,.2f}')}) - {rsc(f'{total_port_costs:,.2f}')} - {ac(f'{total_bunker_costs:,.2f}')}"
        },
        "8. Duración Total (tot_dur)": {
            "formula": "sea_days + port_days",
            "values": f"{vc(f'{sea_days:,.4f}')} + {oc(f'{port_days:,.4f}')}"
        },
        "9. TCE Diario (tce_real)": {
            "formula": "voyage_result / total_duration",
            "values": f"{ec(f'{voyage_result:,.2f}')} / {vc(f'{total_duration:,.4f}')}"
        },
        "10. Utilidad Nom. (pl_vs_req)": {
            "formula": "voyage_result - (tce_req * total_duration)",
            "values": f"{ec(f'{voyage_result:,.2f}')} - ({vc(f'{tce_req:,.2f}')} * {vc(f'{total_duration:,.4f}')})"
        }
    }

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
        "pl_vs_required": round(pl_vs_required, 2),
        "audit_trail": audit_trail
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
