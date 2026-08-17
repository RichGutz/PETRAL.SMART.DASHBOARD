def calculate_spot_multileg(payload: dict) -> dict:
    """
    Calculates the P&L for a Spot Multileg voyage containing up to 3 buckets:
    1. positioning (Ballast)
    2. laden (Laden)
    3. return (Ballast)
    """
    vessel = payload.get("vessel_params", {})
    legs = payload.get("legs", {})
    
    speed = float(vessel.get("vessel_speed", 11.0))
    tce_req = float(vessel.get("tce_required", 0))
    
    p_ifo = float(vessel.get("bunker_price_ifo", 0))
    p_mdo = float(vessel.get("bunker_price_mdo", 0))
    
    c_sea_ifo = float(vessel.get("consumption_sea_ifo") or 0)
    c_idle_ifo = float(vessel.get("consumption_idle_ifo") or 0)
    c_load_ifo = float(vessel.get("consumption_load_ifo") or 0)
    c_disch_ifo = float(vessel.get("consumption_disch_ifo") or 0)
    
    c_sea_mdo = float(vessel.get("consumption_sea_mdo") if vessel.get("consumption_sea_mdo") is not None else 0)
    c_idle_mdo = float(vessel.get("consumption_idle_mdo") if vessel.get("consumption_idle_mdo") is not None else 0)
    c_load_mdo = float(vessel.get("consumption_load_mdo") if vessel.get("consumption_load_mdo") is not None else 0)
    c_disch_mdo = float(vessel.get("consumption_disch_mdo") if vessel.get("consumption_disch_mdo") is not None else 0)
    
    # Cero fallbacks por defecto: si no vienen definidos, se mantiene 0.0
    p_ifo = float(vessel.get("bunker_price_ifo") or 0.0)
    p_mdo = float(vessel.get("bunker_price_mdo") or 0.0)

    # --- FORMATTING HELPERS ---
    def fmt(val): return f"{val:,.0f}" if val > 0 else "0"
    def fmt_dec(val): return f"{val:,.2f}" if val > 0 else "0"
    def vc(val): return f"<span class='text-blue-600 font-black'>{val}</span>"      # vessels
    def rc(val): return f"<span class='text-purple-600 font-black'>{val}</span>"    # routes
    def oc(val): return f"<span class='text-orange-600 font-black'>{val}</span>"    # inputs
    def ec(val): return f"<span class='text-emerald-600 font-black'>{val}</span>"   # results

    def process_ballast_leg(leg_inputs: dict):
        if not leg_inputs:
            return {"sea_days": 0, "port_days": 0, "bunker_ifo": 0, "bunker_mdo": 0, "distance": 0, "bunker_costs": 0, "audit_trail": {}}
        
        dist = float(leg_inputs.get("route_distance", 0))
        w_factor = float(leg_inputs.get("weather_factor", 0))
        
        overhead_orig = float(leg_inputs.get("port_overhead_hours_origin") or 0)
        overhead_dest = float(leg_inputs.get("port_overhead_hours_dest") or 0)
        pos_carga = float(leg_inputs.get("positioning_carga_hrs") or 0)
        pos_descarga = float(leg_inputs.get("positioning_descarga_hrs") or 0)
        
        sea_days = (dist * (1 + w_factor)) / (speed * 24) if speed > 0 else 0
        port_days = (overhead_orig + overhead_dest + pos_carga + pos_descarga) / 24
        
        ifo_tons = (sea_days * c_sea_ifo) + (port_days * c_idle_ifo)
        mdo_tons = (sea_days * c_sea_mdo) + (port_days * c_idle_mdo)
        bunker_costs = (ifo_tons * p_ifo) + (mdo_tons * p_mdo)
        
        audit_trail = {
            "sea_days": {
                "formula": "(dist * (1+w_factor)) / (speed * 24)",
                "values": f"({rc(fmt(dist))} * (1+{rc(fmt_dec(w_factor))})) / ({vc(fmt_dec(speed))} * 24) = {vc(fmt_dec(sea_days))}"
            },
            "port_days": {
                "formula": "(time_to_count + posic) / 24",
                "values": f"{vc(fmt_dec(port_days))}"
            },
            "bunker_costs": {
                "formula": "Tons IFO = (sea_days * cons_sea) + (port_days * cons_idle)<br/>Tons MDO = (sea_days * cons_sea) + (port_days * cons_idle)<br/>Cost = (Tons IFO * p_IFO) + (Tons MDO * p_MDO)",
                "values": f"IFO: {vc(fmt_dec(ifo_tons))} t<br/>"
                          f"MDO: {vc(fmt_dec(mdo_tons))} t<br/>"
                          f"Costo: ({vc(fmt_dec(ifo_tons))} * {fmt_dec(p_ifo)}) + ({vc(fmt_dec(mdo_tons))} * {fmt_dec(p_mdo)}) = {ec(fmt_dec(bunker_costs))}"
            },
            "port_costs": {
                "formula": "N/A (Ballast)",
                "values": "0"
            }
        }
        
        return {
            "sea_days": sea_days,
            "port_days": port_days,
            "bunker_ifo": ifo_tons,
            "bunker_mdo": mdo_tons,
            "distance": dist,
            "bunker_costs": bunker_costs,
            "audit_trail": audit_trail
        }

    def process_laden_leg(leg_inputs: dict):
        if not leg_inputs:
            return {"sea_days": 0, "port_days": 0, "bunker_ifo": 0, "bunker_mdo": 0, "distance": 0, "net_income": 0, "port_costs": 0, "bunker_costs": 0, "audit_trail": {}}
            
        dist = float(leg_inputs.get("route_distance", 0))
        w_factor = float(leg_inputs.get("weather_factor", 0))
        Q = float(leg_inputs.get("quantity", 0))
        F = float(leg_inputs.get("freight_rate", 0))
        
        overhead_orig = float(leg_inputs.get("port_overhead_hours_origin") or 0)
        overhead_dest = float(leg_inputs.get("port_overhead_hours_dest") or 0)
        
        delay_loading = float(leg_inputs.get("port_delay_hours_loading") or 0)
        delay_discharging = float(leg_inputs.get("port_delay_hours_discharging") or 0)
        
        c_load = float(leg_inputs.get("contract_agreed_load_rate") or 0)
        v_intake = float(vessel.get("vessel_max_load_intake_limit", 0))
        t_load_rate = float(leg_inputs.get("max_terminal_load_rate", 0))
        
        valid_load_rates = [x for x in (c_load, v_intake, t_load_rate) if x > 0]
        actual_load_rate = min(valid_load_rates) if valid_load_rates else 0
        
        c_disch = float(leg_inputs.get("contract_agreed_discharge_rate") or 0)
        v_pump = float(vessel.get("vessel_pump_discharge_rate", 0))
        t_disch_limit = float(leg_inputs.get("port_max_discharge_limit", 0))
        
        valid_disch_rates = [x for x in (c_disch, v_pump, t_disch_limit) if x > 0]
        actual_discharge_rate = min(valid_disch_rates) if valid_disch_rates else 0
        
        sea_days = (dist * (1 + w_factor)) / (speed * 24) if speed > 0 else 0
        
        # Sumar demoras adicionales a los overheads normales de la ruta (origen y destino)
        total_overhead_origin = overhead_orig + delay_loading
        total_overhead_dest = overhead_dest + delay_discharging
        
        idle_days_normal = (overhead_orig + overhead_dest) / 24
        idle_days = idle_days_normal + (delay_loading / 24) + (delay_discharging / 24)
        
        load_days = (Q / actual_load_rate) / 24 if actual_load_rate > 0 else 0
        disch_days = (Q / actual_discharge_rate) / 24 if actual_discharge_rate > 0 else 0
        port_days = load_days + disch_days + idle_days
        
        # Calcular consumos de bunker de demoras por separado
        delay_loading_ifo = (delay_loading / 24) * c_idle_ifo
        delay_loading_mdo = (delay_loading / 24) * c_idle_mdo
        delay_loading_cost = (delay_loading_ifo * p_ifo) + (delay_loading_mdo * p_mdo)

        delay_disch_ifo = (delay_discharging / 24) * c_idle_ifo
        delay_disch_mdo = (delay_discharging / 24) * c_idle_mdo
        delay_disch_cost = (delay_disch_ifo * p_ifo) + (delay_disch_mdo * p_mdo)

        # Consumo de tránsito/operaciones normales (sin las demoras)
        ifo_tons_normal = (sea_days * c_sea_ifo) + (idle_days_normal * c_idle_ifo) + (load_days * c_load_ifo) + (disch_days * c_disch_ifo)
        mdo_tons_normal = (sea_days * c_sea_mdo) + (idle_days_normal * c_idle_mdo) + (load_days * c_load_mdo) + (disch_days * c_disch_mdo)
        bunker_costs_normal = (ifo_tons_normal * p_ifo) + (mdo_tons_normal * p_mdo)

        # Consumo consolidado final para el PnL global
        ifo_tons = ifo_tons_normal + delay_loading_ifo + delay_disch_ifo
        mdo_tons = mdo_tons_normal + delay_loading_mdo + delay_disch_mdo
        bunker_costs = bunker_costs_normal + delay_loading_cost + delay_disch_cost
        
        net_income = Q * F
        port_costs = float(leg_inputs.get("agency_costs_origin", 0)) + float(leg_inputs.get("agency_costs_destination", 0))
        
        delay_loading_audit = {
            "formula": "Tons IFO = (delay_load / 24) * cons_idle<br/>"
                       "Tons MDO = (delay_load / 24) * cons_idle<br/>"
                       "Costo Demora = (Tons IFO * price_IFO) + (Tons MDO * price_MDO)",
            "values": f"IFO: ({delay_loading}/24) * {c_idle_ifo} = {vc(fmt_dec(delay_loading_ifo))} t<br/>"
                      f"MDO: ({delay_loading}/24) * {c_idle_mdo} = {vc(fmt_dec(delay_loading_mdo))} t<br/>"
                      f"Costo: ({vc(fmt_dec(delay_loading_ifo))} * {fmt_dec(p_ifo)}) + ({vc(fmt_dec(delay_loading_mdo))} * {fmt_dec(p_mdo)}) = {ec(fmt_dec(delay_loading_cost))}"
        }

        delay_disch_audit = {
            "formula": "Tons IFO = (delay_disch / 24) * cons_idle<br/>"
                       "Tons MDO = (delay_disch / 24) * cons_idle<br/>"
                       "Costo Demora = (Tons IFO * price_IFO) + (Tons MDO * price_MDO)",
            "values": f"IFO: ({delay_discharging}/24) * {c_idle_ifo} = {vc(fmt_dec(delay_disch_ifo))} t<br/>"
                      f"MDO: ({delay_discharging}/24) * {c_idle_mdo} = {vc(fmt_dec(delay_disch_mdo))} t<br/>"
                      f"Costo: ({vc(fmt_dec(delay_disch_ifo))} * {fmt_dec(p_ifo)}) + ({vc(fmt_dec(delay_disch_mdo))} * {fmt_dec(p_mdo)}) = {ec(fmt_dec(delay_disch_cost))}"
        }

        audit_trail = {
            "sea_days": {
                "formula": "(dist * (1+w_factor)) / (speed * 24)",
                "values": f"({rc(fmt(dist))} * (1+{rc(fmt_dec(w_factor))})) / ({vc(fmt_dec(speed))} * 24) = {vc(fmt_dec(sea_days))}"
            },
            "port_days": {
                "formula": "((Q/act_load + (over_or + delay_load)) + (Q/act_disch + (over_de + delay_disch))) / 24",
                "values": f"(({oc(fmt(Q))}/{vc(fmt(actual_load_rate))} + ({oc(fmt_dec(overhead_orig))} + {oc(fmt_dec(delay_loading))})) + ({oc(fmt(Q))}/{vc(fmt(actual_discharge_rate))} + ({oc(fmt_dec(overhead_dest))} + {oc(fmt_dec(delay_discharging))}))) / 24 = {vc(fmt_dec(port_days))}"
            },
            "bunker_costs": {
                "formula": "Tons IFO = (sea_d * cons_sea) + (idle_d_norm * cons_idle) + (load_d * cons_load) + (disch_d * cons_disch)<br/>"
                           "Tons MDO = (sea_d * cons_sea) + (idle_d_norm * cons_idle) + (load_d * cons_load) + (disch_d * cons_disch)<br/>"
                           "Costo Tránsito = (Tons IFO * price_IFO) + (Tons MDO * price_MDO)",
                "values": f"IFO: ({vc(fmt_dec(sea_days))} * {c_sea_ifo}) + ({vc(fmt_dec(idle_days_normal))} * {c_idle_ifo}) + ({vc(fmt_dec(load_days))} * {c_load_ifo}) + ({vc(fmt_dec(disch_days))} * {c_disch_ifo}) = {vc(fmt_dec(ifo_tons_normal))} t<br/>"
                          f"MDO: ({vc(fmt_dec(sea_days))} * {c_sea_mdo}) + ({vc(fmt_dec(idle_days_normal))} * {c_idle_mdo}) + ({vc(fmt_dec(load_days))} * {c_load_mdo}) + ({vc(fmt_dec(disch_days))} * {c_disch_mdo}) = {vc(fmt_dec(mdo_tons_normal))} t<br/>"
                          f"Costo: ({vc(fmt_dec(ifo_tons_normal))} * {fmt_dec(p_ifo)}) + ({vc(fmt_dec(mdo_tons_normal))} * {fmt_dec(p_mdo)}) = {ec(fmt_dec(bunker_costs_normal))}"
            },
            "port_costs": {
                "formula": "agency_origin + agency_dest",
                "values": f"{oc(fmt_dec(leg_inputs.get('agency_costs_origin', 0)))} + {oc(fmt_dec(leg_inputs.get('agency_costs_destination', 0)))} = {ec(fmt_dec(port_costs))}"
            }
        }
        
        return {
            "sea_days": sea_days,
            "port_days": port_days,
            "bunker_ifo": ifo_tons,
            "bunker_mdo": mdo_tons,
            "distance": dist,
            "net_income": net_income,
            "port_costs": port_costs,
            "bunker_costs": bunker_costs,
            "delay_loading_audit": delay_loading_audit,
            "delay_disch_audit": delay_disch_audit,
            "audit_trail": audit_trail
        }

    # Procesar Piernas
    res_pos = process_ballast_leg(legs.get("positioning"))
    res_laden = process_laden_leg(legs.get("laden"))
    res_ret = process_ballast_leg(legs.get("return"))
    
    # Consolidar Todo
    tot_sea_days = res_pos["sea_days"] + res_laden["sea_days"] + res_ret["sea_days"]
    tot_port_days = res_laden["port_days"] # Solo Laden tiene port_days
    tot_days = tot_sea_days + tot_port_days
    
    tot_ifo_tons = res_pos["bunker_ifo"] + res_laden["bunker_ifo"] + res_ret["bunker_ifo"]
    tot_mdo_tons = res_pos["bunker_mdo"] + res_laden["bunker_mdo"] + res_ret["bunker_mdo"]
    
    tot_bunker_costs = res_pos["bunker_costs"] + res_laden["bunker_costs"] + res_ret["bunker_costs"]
    tot_port_costs = res_laden["port_costs"]
    tot_cargo_costs = 0
    tot_freight_revenue = res_laden["net_income"]
    tot_demurrage_revenue = 0
    
    pnl_net_utility = tot_freight_revenue - tot_port_costs - tot_bunker_costs
    tce_real = pnl_net_utility / tot_days if tot_days > 0 else 0
    
    return {
        "legs_summary": {
            "positioning": res_pos,
            "laden": res_laden,
            "return": res_ret
        },
        "consolidated": {
            "total_distance": res_pos["distance"] + res_laden["distance"] + res_ret["distance"],
            "total_sea_days": round(tot_sea_days, 6),
            "total_port_days": round(tot_port_days, 6),
            "total_days": round(tot_days, 6),
            "bunker_ifo_tonnage": round(tot_ifo_tons, 4),
            "bunker_mdo_tonnage": round(tot_mdo_tons, 4),
            "total_bunker_costs": round(tot_bunker_costs, 2),
            "total_port_costs": round(tot_port_costs, 2),
            "total_cargo_costs": round(tot_cargo_costs, 2),
            "total_freight_revenue": round(tot_freight_revenue, 2),
            "total_demurrage_revenue": round(tot_demurrage_revenue, 2),
            "pnl_net_utility": round(pnl_net_utility, 2),
            "tce_real": round(tce_real, 2),
            "tce_required": round(tce_req, 2)
        }
    }


def calculate_multicotizador_simulation(payload: dict) -> dict:
    """
    Calculates P&L for an arbitrary list of consecutive voyage legs (tramos)
    using the same recycled math equations from calculate_spot_multileg.
    """
    vessel = payload.get("vessel_params", {})
    tramos = payload.get("tramos", [])
    port_cost_mode = payload.get("port_cost_mode", "static")
    client_id = payload.get("client_id", "PETRAL")
    
    vessel_id_val = payload.get("vessel_id") or vessel.get("vessel_id") or vessel.get("id")
    if vessel_id_val and (not vessel or not vessel.get("consumption_sea_ifo")):
        try:
            from backend.database import get_supabase
            from backend.services.forecast_service import get_cached_masters
            sb = get_supabase()
            masters = get_cached_masters(sb)
            v_list = masters.get("vessels", [])
            found_v = next((v for v in v_list if (v.get("vessel_id") or "").upper() == str(vessel_id_val).upper() or (v.get("vessel_name") or "").upper() == str(vessel_id_val).upper()), {})
            if found_v:
                vessel = {**found_v, **vessel}
        except Exception:
            pass
    
    speed = float(vessel.get("vessel_speed") or vessel.get("speed") or 11.0)
    tce_req = float(vessel.get("tce_required") or 0)
    
    p_ifo = float(payload.get("bunker_price_ifo") or vessel.get("bunker_price_ifo") or vessel.get("p_ifo") or 0.0)
    p_mdo = float(payload.get("bunker_price_mdo") or vessel.get("bunker_price_mdo") or vessel.get("p_mdo") or 0.0)
    
    c_sea_ifo = float(vessel.get("consumption_sea_ifo") or vessel.get("bunker_consumption_sea_ifo") or 14.0)
    c_idle_ifo = float(vessel.get("consumption_idle_ifo") or vessel.get("bunker_consumption_idle_ifo") or vessel.get("consumption_port_ifo") or 2.4)
    c_load_ifo = float(vessel.get("consumption_load_ifo") or vessel.get("bunker_consumption_load_ifo") or vessel.get("consumption_port_ifo") or 2.4)
    c_disch_ifo = float(vessel.get("consumption_disch_ifo") or vessel.get("bunker_consumption_disch_ifo") or vessel.get("consumption_port_ifo") or 3.6)
    
    c_sea_mdo = float(vessel.get("consumption_sea_mdo") if vessel.get("consumption_sea_mdo") is not None else (vessel.get("bunker_consumption_sea_mdo") if vessel.get("bunker_consumption_sea_mdo") is not None else 0.0))
    c_idle_mdo = float(vessel.get("consumption_idle_mdo") if vessel.get("consumption_idle_mdo") is not None else (vessel.get("bunker_consumption_idle_mdo") if vessel.get("bunker_consumption_idle_mdo") is not None else 0.0))
    c_load_mdo = float(vessel.get("consumption_load_mdo") if vessel.get("consumption_load_mdo") is not None else (vessel.get("bunker_consumption_load_mdo") if vessel.get("bunker_consumption_load_mdo") is not None else 0.0))
    c_disch_mdo = float(vessel.get("consumption_disch_mdo") if vessel.get("consumption_disch_mdo") is not None else (vessel.get("bunker_consumption_disch_mdo") if vessel.get("bunker_consumption_disch_mdo") is not None else 0.0))

    # --- FORMATTING HELPERS ---
    def fmt(val): return f"{val:,.0f}" if val > 0 else "0"
    def fmt_dec(val): return f"{val:,.2f}" if val > 0 else "0"
    def vc(val): return f"<span class='text-blue-600 font-black'>{val}</span>"      # vessels
    def rc(val): return f"<span class='text-purple-600 font-black'>{val}</span>"    # routes
    def oc(val): return f"<span class='text-orange-600 font-black'>{val}</span>"    # inputs
    def ec(val): return f"<span class='text-emerald-600 font-black'>{val}</span>"   # results

    def process_ballast_leg(leg_inputs: dict):
        if not leg_inputs:
            return {"sea_days": 0, "port_days": 0, "bunker_ifo": 0, "bunker_mdo": 0, "distance": 0, "bunker_costs": 0, "audit_trail": {}}
        
        dist = float(leg_inputs.get("route_distance", 0))
        w_factor = float(leg_inputs.get("weather_factor", 0))
        if w_factor > 1.0:
            w_factor = w_factor / 100.0
        
        delay_load = float(leg_inputs.get("port_delay_hours_loading") or 0)
        delay_disch = float(leg_inputs.get("port_delay_hours_discharging") or 0)
        
        overhead_dest = float(leg_inputs.get("port_overhead_hours_dest") or 0)
        pos_carga = float(leg_inputs.get("positioning_carga_hrs") or 0)
        pos_descarga = float(leg_inputs.get("positioning_descarga_hrs") or 0)
        
        dest_action = leg_inputs.get("destination_action", "NONE")
        load_days = 0.0
        disch_days = 0.0

        if dest_action == "CARGAR" or pos_carga > 0:
            Q_load = float(leg_inputs.get("destination_quantity") or leg_inputs.get("quantity") or leg_inputs.get("desc_tons") or 0)
            if Q_load == 0:
                Q_load = float(vessel.get("dwcc") or vessel.get("dwt") or 13500)
            c_load = float(leg_inputs.get("custom_load_rate") or leg_inputs.get("contract_agreed_load_rate") or vessel.get("act_load") or 500.0)
            if c_load > 0:
                load_days = (Q_load / c_load) / 24.0
        
        sea_days = (dist * (1 + w_factor)) / (speed * 24) if speed > 0 else 0
        idle_days = (overhead_dest + pos_carga + pos_descarga + delay_load + delay_disch) / 24.0
        port_days = idle_days + load_days + disch_days
        
        ifo_tons = (sea_days * c_sea_ifo) + (idle_days * c_idle_ifo) + (load_days * c_load_ifo) + (disch_days * c_disch_ifo)
        mdo_tons = (sea_days * c_sea_mdo) + (idle_days * c_idle_mdo) + (load_days * c_load_mdo) + (disch_days * c_disch_mdo)
        bunker_costs = (ifo_tons * p_ifo) + (mdo_tons * p_mdo)
        
        audit_trail = {
            "sea_days": {
                "formula": "(dist * (1+w_factor)) / (speed * 24)",
                "values": f"({rc(fmt(dist))} * (1+{rc(fmt_dec(w_factor))})) / ({vc(fmt_dec(speed))} * 24) = {vc(fmt_dec(sea_days))}"
            },
            "port_days": {
                "formula": "((Q/act_load + over_de + pos_carga + delay_load)) / 24" if load_days > 0 else "(overhead + posic) / 24",
                "values": f"{vc(fmt_dec(port_days))}"
            },
            "bunker_costs": {
                "formula": "Tons IFO = (sea_days * cons_sea) + (port_days * cons_idle)<br/>Tons MDO = (sea_days * cons_sea) + (port_days * cons_idle)<br/>Cost = (Tons IFO * p_IFO) + (Tons MDO * p_MDO)",
                "values": f"IFO: {vc(fmt_dec(ifo_tons))} t<br/>"
                          f"MDO: {vc(fmt_dec(mdo_tons))} t<br/>"
                          f"Costo: ({vc(fmt_dec(ifo_tons))} * {fmt_dec(p_ifo)}) + ({vc(fmt_dec(mdo_tons))} * {fmt_dec(p_mdo)}) = {ec(fmt_dec(bunker_costs))}"
            },
            "port_costs": {
                "formula": "N/A (Ballast)",
                "values": "0"
            }
        }
        
        return {
            "sea_days": sea_days,
            "port_days": port_days,
            "bunker_ifo": ifo_tons,
            "bunker_mdo": mdo_tons,
            "distance": dist,
            "bunker_costs": bunker_costs,
            "audit_trail": audit_trail
        }

    def process_laden_leg(leg_inputs: dict):
        if not leg_inputs:
            return {"sea_days": 0, "port_days": 0, "bunker_ifo": 0, "bunker_mdo": 0, "distance": 0, "net_income": 0, "port_costs": 0, "bunker_costs": 0, "audit_trail": {}}
            
        dist = float(leg_inputs.get("route_distance", 0))
        w_factor = float(leg_inputs.get("weather_factor", 0))
        if w_factor > 1.0:
            w_factor = w_factor / 100.0
        Q = float(leg_inputs.get("quantity", 0))
        F = float(leg_inputs.get("freight_rate", 0))
        
        dest_action = leg_inputs.get("destination_action", "NONE")

        overhead_dest = leg_inputs.get("port_overhead_hours_dest")
        overhead_dest = float(overhead_dest) if (overhead_dest is not None and dest_action != "NONE") else 0.0
        
        pos_descarga = leg_inputs.get("positioning_descarga_hrs")
        pos_descarga = float(pos_descarga) if (pos_descarga is not None and dest_action == "DESCARGAR") else 0.0
        
        delay_loading = float(leg_inputs.get("port_delay_hours_loading") or 0)
        delay_discharging = float(leg_inputs.get("port_delay_hours_discharging") or 0)
        
        custom_d_rate = float(leg_inputs.get("custom_discharge_rate") or 0)

        c_disch = float(leg_inputs.get("contract_agreed_discharge_rate") or 0)
        v_pump = float(vessel.get("vessel_pump_discharge_rate", 0))
        t_disch_limit = float(leg_inputs.get("port_max_discharge_limit", 0))
        v_act_disch = float(vessel.get("act_disch") or vessel.get("vessel_pump_discharge_rate") or 0)
        
        if custom_d_rate > 0:
            actual_discharge_rate = custom_d_rate
        else:
            valid_disch_rates = [x for x in (c_disch, v_pump, t_disch_limit, v_act_disch) if x > 0]
            actual_discharge_rate = min(valid_disch_rates) if valid_disch_rates else 0.0
        
        sea_days = (dist * (1 + w_factor)) / (speed * 24) if speed > 0 else 0
        
        total_overhead_dest = overhead_dest + delay_discharging + pos_descarga
        idle_days_normal = (overhead_dest + pos_descarga) / 24.0
        idle_days = idle_days_normal + (delay_discharging / 24.0)
        
        load_days = 0.0
        disch_days = (Q / actual_discharge_rate) / 24.0 if (actual_discharge_rate > 0 and dest_action == "DESCARGAR") else 0.0
        port_days = disch_days + idle_days
        
        # Calcular consumos de bunker de demoras por separado
        delay_loading_ifo = (delay_loading / 24) * c_idle_ifo
        delay_loading_mdo = (delay_loading / 24) * c_idle_mdo
        delay_loading_cost = (delay_loading_ifo * p_ifo) + (delay_loading_mdo * p_mdo)

        delay_disch_ifo = (delay_discharging / 24) * c_idle_ifo
        delay_disch_mdo = (delay_discharging / 24) * c_idle_mdo
        delay_disch_cost = (delay_disch_ifo * p_ifo) + (delay_disch_mdo * p_mdo)

        # Consumo de tránsito/operaciones normales (usando la navegación real de esta pierna)
        tot_sea_d = sea_days
        ifo_tons_normal = (tot_sea_d * c_sea_ifo) + (idle_days_normal * c_idle_ifo) + (load_days * c_load_ifo) + (disch_days * c_disch_ifo)
        mdo_tons_normal = (tot_sea_d * c_sea_mdo) + (idle_days_normal * c_idle_mdo) + (load_days * c_load_mdo) + (disch_days * c_disch_mdo)
        bunker_costs_normal = (ifo_tons_normal * p_ifo) + (mdo_tons_normal * p_mdo)

        # Consumo consolidado final para el PnL global
        ifo_tons = ifo_tons_normal + delay_loading_ifo + delay_disch_ifo
        mdo_tons = mdo_tons_normal + delay_loading_mdo + delay_disch_mdo
        bunker_costs = bunker_costs_normal + delay_loading_cost + delay_disch_cost
        
        net_income = Q * F
        
        # Resolución Dinámica Dual (STATIC vs MATRIX) para costos de puerto del tramo cargado
        cost_orig = leg_inputs.get("agency_costs_origin")
        cost_dest = leg_inputs.get("agency_costs_destination")

        if cost_orig is None or float(cost_orig) == 0.0:
            port_matrix_data, agency_data, ports_map = [], [], {}
            try:
                from backend.services.forecast_service import get_cached_masters
                from backend.database import get_supabase
                sb = get_supabase()
                masters = get_cached_masters(sb)
                port_matrix_data = masters.get("port_costs_matrix", [])
                agency_data = masters.get("port_cost_static", masters.get("agency_matrix", []))
                ports_map = masters.get("ports", {})
            except Exception:
                pass

            try:
                from backend.services.forecast_service import calculate_detailed_port_costs
                orig_id = leg_inputs.get("origin_port_id") or ""
                v_id = vessel_id_val or "MOQUEGUA"
                res_orig = calculate_detailed_port_costs(
                    client_id, orig_id, "CARGA", v_id,
                    port_matrix_data, agency_data,
                    port_cost_mode, vessel, Q, {}, ports_map
                )
                cost_orig = res_orig["total_cost"]
            except Exception:
                cost_orig = float(cost_orig or 0)

        if cost_dest is None or float(cost_dest) == 0.0:
            port_matrix_data, agency_data, ports_map = [], [], {}
            try:
                from backend.services.forecast_service import get_cached_masters
                from backend.database import get_supabase
                sb = get_supabase()
                masters = get_cached_masters(sb)
                port_matrix_data = masters.get("port_costs_matrix", [])
                agency_data = masters.get("port_cost_static", masters.get("agency_matrix", []))
                ports_map = masters.get("ports", {})
            except Exception:
                pass

            try:
                from backend.services.forecast_service import calculate_detailed_port_costs
                dest_id = leg_inputs.get("destination_port_id") or ""
                v_id = vessel_id_val or "MOQUEGUA"
                res_dest = calculate_detailed_port_costs(
                    client_id, dest_id, "DESCARGA", v_id,
                    port_matrix_data, agency_data,
                    port_cost_mode, vessel, Q, {}, ports_map
                )
                cost_dest = res_dest["total_cost"]
            except Exception:
                cost_dest = float(cost_dest or 0)

        port_costs = float(cost_orig) + float(cost_dest)
        
        delay_loading_audit = {
            "formula": "Tons IFO = (delay_load / 24) * cons_idle<br/>"
                       "Tons MDO = (delay_load / 24) * cons_idle<br/>"
                       "Costo Demora = (Tons IFO * price_IFO) + (Tons MDO * price_MDO)",
            "values": f"IFO: ({delay_loading}/24) * {c_idle_ifo} = {vc(fmt_dec(delay_loading_ifo))} t<br/>"
                      f"MDO: ({delay_loading}/24) * {c_idle_mdo} = {vc(fmt_dec(delay_loading_mdo))} t<br/>"
                      f"Costo: ({vc(fmt_dec(delay_loading_ifo))} * {fmt_dec(p_ifo)}) + ({vc(fmt_dec(delay_loading_mdo))} * {fmt_dec(p_mdo)}) = {ec(fmt_dec(delay_loading_cost))}"
        }

        delay_disch_audit = {
            "formula": "Tons IFO = (delay_disch / 24) * cons_idle<br/>"
                       "Tons MDO = (delay_disch / 24) * cons_idle<br/>"
                       "Costo Demora = (Tons IFO * price_IFO) + (Tons MDO * price_MDO)",
            "values": f"IFO: ({delay_discharging}/24) * {c_idle_ifo} = {vc(fmt_dec(delay_disch_ifo))} t<br/>"
                      f"MDO: ({delay_discharging}/24) * {c_idle_mdo} = {vc(fmt_dec(delay_disch_mdo))} t<br/>"
                      f"Costo: ({vc(fmt_dec(delay_disch_ifo))} * {fmt_dec(p_ifo)}) + ({vc(fmt_dec(delay_disch_mdo))} * {fmt_dec(p_mdo)}) = {ec(fmt_dec(delay_disch_cost))}"
        }

        tot_sea_d = sea_days
        ifo_tons_total = (tot_sea_d * c_sea_ifo) + (idle_days_normal * c_idle_ifo) + (load_days * c_load_ifo) + (disch_days * c_disch_ifo)
        mdo_tons_total = (tot_sea_d * c_sea_mdo) + (idle_days_normal * c_idle_mdo) + (load_days * c_load_mdo) + (disch_days * c_disch_mdo)
        bunker_costs_total = (ifo_tons_total * p_ifo) + (mdo_tons_total * p_mdo)

        audit_trail = {
            "sea_days": {
                "formula": "(dist * (1+w_factor)) / (speed * 24)",
                "values": f"({rc(fmt(dist))} * (1+{rc(fmt_dec(w_factor))})) / ({vc(fmt_dec(speed))} * 24) = {vc(fmt_dec(sea_days))}"
            },
            "port_days": {
                "formula": "(Q/act_disch + over_de + pos_de + delay_disch) / 24",
                "values": f"({oc(fmt(Q))}/{vc(fmt(actual_discharge_rate))} + {oc(fmt_dec(overhead_dest))} + {oc(fmt_dec(pos_descarga))} + {oc(fmt_dec(delay_discharging))}) / 24 = {vc(fmt_dec(port_days))}"
            },
            "bunker_costs": {
                "formula": "Tons IFO = (sea_d * cons_sea) + (idle_d_norm * cons_idle) + (load_d * cons_load) + (disch_d * cons_disch)<br/>"
                           "Tons MDO = (sea_d * cons_sea) + (idle_d_norm * cons_idle) + (load_d * cons_load) + (disch_d * cons_disch)<br/>"
                           "Costo Tránsito = (Tons IFO * price_IFO) + (Tons MDO * price_MDO)",
                "values": f"IFO: ({vc(fmt_dec(tot_sea_d))} * {c_sea_ifo}) + ({vc(fmt_dec(idle_days_normal))} * {c_idle_ifo}) + ({vc(fmt_dec(load_days))} * {c_load_ifo}) + ({vc(fmt_dec(disch_days))} * {c_disch_ifo}) = {vc(fmt_dec(ifo_tons_total))} t<br/>"
                          f"MDO: ({vc(fmt_dec(tot_sea_d))} * {c_sea_mdo}) + ({vc(fmt_dec(idle_days_normal))} * {c_idle_mdo}) + ({vc(fmt_dec(load_days))} * {c_load_mdo}) + ({vc(fmt_dec(disch_days))} * {c_disch_mdo}) = {vc(fmt_dec(mdo_tons_total))} t<br/>"
                          f"Costo: ({vc(fmt_dec(ifo_tons_total))} * {fmt_dec(p_ifo)}) + ({vc(fmt_dec(mdo_tons_total))} * {fmt_dec(p_mdo)}) = {ec(fmt_dec(bunker_costs_total))}"
            },
            "port_costs": {
                "formula": "Sum(port_cost_i) = agency_origin + agency_dest",
                "values": f"{oc(fmt_dec(leg_inputs.get('agency_costs_origin', 0)))} + {oc(fmt_dec(leg_inputs.get('agency_costs_destination', 0)))} = {ec(fmt_dec(port_costs))}"
            }
        }
        
        return {
            "sea_days": tot_sea_d,
            "port_days": port_days,
            "bunker_ifo": ifo_tons_total,
            "bunker_mdo": mdo_tons_total,
            "distance": dist,
            "bunker_costs": bunker_costs_total,
            "net_income": net_income,
            "port_costs": port_costs,
            "bunker_costs": bunker_costs,
            "delay_loading_audit": delay_loading_audit,
            "delay_disch_audit": delay_disch_audit,
            "audit_trail": audit_trail
        }

    # Procesar todos los tramos secuenciales
    processed_tramos = []
    visited_ports = set()
    if tramos:
        first_orig = tramos[0].get("origin_port_id")
        if first_orig:
            visited_ports.add(first_orig)

    for idx, tr in enumerate(tramos):
        tipo = tr.get("type", "BALLAST").upper()
        orig = tr.get("origin_port_id")
        dest = tr.get("destination_port_id")
        
        c_orig = float(tr.get("agency_costs_origin", 0))
        c_dest = float(tr.get("agency_costs_destination", 0))

        if tipo == "BALLAST":
            res = process_ballast_leg(tr)
            res["net_income"] = 0.0
            res["agency_costs_origin"] = c_orig
            res["agency_costs_destination"] = c_dest
            res["port_costs"] = c_orig + c_dest
            res["agency_costs_origin_details"] = tr.get("agency_costs_origin_details", {"total_cost": c_orig, "breakdown": {}, "method": "STATIC"})
            res["agency_costs_destination_details"] = tr.get("agency_costs_destination_details", {"total_cost": c_dest, "breakdown": {}, "method": "STATIC"})
            res["pnl_tramo"] = -res["bunker_costs"] - res["port_costs"]
            res["type"] = "BALLAST"
        else:
            res = process_laden_leg(tr)
            # En tramos LADEN, si el leg calculó gastos dinámicos, usarlos; de lo contrario respetar overrides
            calc_port_cost = float(res.get("port_costs", 0))
            if calc_port_cost > 0 and (c_orig == 0 and c_dest == 0):
                pass
            else:
                res["agency_costs_origin"] = c_orig
                res["agency_costs_destination"] = c_dest
                res["port_costs"] = c_orig + c_dest
            res["net_income"] = float(tr.get("quantity", 0)) * float(tr.get("freight_rate", 0))
            res["pnl_tramo"] = res["net_income"] - res["bunker_costs"] - res["port_costs"]
            res["type"] = "LADEN"
            
        res["origin_port_id"] = orig
        res["destination_port_id"] = dest
        res["positioning_carga_hrs"] = tr.get("positioning_carga_hrs")
        res["positioning_descarga_hrs"] = tr.get("positioning_descarga_hrs")
        res["port_overhead_hours_origin"] = tr.get("port_overhead_hours_origin")
        res["port_overhead_hours_dest"] = tr.get("port_overhead_hours_dest")
        res["contract_agreed_load_rate"] = tr.get("contract_agreed_load_rate")
        res["contract_agreed_discharge_rate"] = tr.get("contract_agreed_discharge_rate")
        res["agency_costs_origin_details"] = tr.get("agency_costs_origin_details")
        res["agency_costs_destination_details"] = tr.get("agency_costs_destination_details")
        [res.setdefault(k, v) for k, v in tr.items()]

        orig_det = tr.get("agency_costs_origin_details") or {}
        dest_det = tr.get("agency_costs_destination_details") or {}
        orig_bk = orig_det.get("breakdown") if isinstance(orig_det, dict) else {}
        dest_bk = dest_det.get("breakdown") if isinstance(dest_det, dict) else {}

        m_orig = float(tr.get("muellaje_cost_origin") or (orig_bk.get("muellaje") if isinstance(orig_bk, dict) else 0) or 0)
        m_dest = float(tr.get("muellaje_cost_dest") or (dest_bk.get("muellaje") if isinstance(dest_bk, dict) else 0) or 0)
        res["muellaje_cost_origin"] = m_orig
        res["muellaje_cost_dest"] = m_dest

        processed_tramos.append(res)
        if orig: visited_ports.add(orig)
        if dest: visited_ports.add(dest)
        
    tot_sea_days = sum(t["sea_days"] for t in processed_tramos)
    puertos_cfg = payload.get("puertosConfig") or []
    if puertos_cfg:
        tot_port_days = 0.0
        for p in puertos_cfg:
            action = p.get("action", "NONE")
            if action != "NONE":
                tc = float(p.get("time_to_count") if p.get("time_to_count") not in (None, "") else (p.get("overhead") if p.get("overhead") not in (None, "") else 6.0))
                pos = float(p.get("positioning") or 0.0)
                q = float(p.get("quantity") or 13500)
                r = float(p.get("op_rate") or 500)
                if r <= 0: r = 500.0
                idle_d = (tc + pos) / 24.0
                op_d = (q / r) / 24.0
                tot_port_days += (idle_d + op_d)
    else:
        tot_port_days = sum(t["port_days"] for t in processed_tramos)
    tot_days = tot_sea_days + tot_port_days
    
    tot_ifo_tons = sum(t["bunker_ifo"] for t in processed_tramos)
    tot_mdo_tons = sum(t["bunker_mdo"] for t in processed_tramos)
    tot_bunker_costs = sum(t["bunker_costs"] for t in processed_tramos)
    visited_port_costs = []
    for idx_p, tr_p in enumerate(tramos):
        if idx_p == 0:
            visited_port_costs.append(float(tr_p.get("agency_costs_origin", 0)))
        visited_port_costs.append(float(tr_p.get("agency_costs_destination", 0)))
    tot_port_costs = sum(visited_port_costs)
    tot_freight_revenue = sum(t["net_income"] for t in processed_tramos)
    
    addr_comm_pct = float(payload.get("address_commission_pct") or vessel.get("address_commission_pct") or 0.0)
    bkr_comm_pct = float(payload.get("broker_commission_pct") or vessel.get("broker_commission_pct") or 0.0)
    tot_comm_usd = tot_freight_revenue * ((addr_comm_pct + bkr_comm_pct) / 100)
    
    comments = payload.get("comments") or ""
    demurrage_rate_pd = float(payload.get("demurrage_rate_pd") or 0.0)
    demurrage_days = float(payload.get("demurrage_days") or 0.0)
    demurrage_total = float(payload.get("demurrage_total") or (demurrage_rate_pd * demurrage_days))

    # Refacturación de Muellaje acumulada (1 sola vez por recalada de puerto)
    tot_refacturacion_muellaje = 0.0
    for idx_m, tr_m in enumerate(processed_tramos):
        # Puerto Origen (solo en la recalada 0)
        if idx_m == 0:
            if tr_m.get("refacturar_muellaje", True) and tr_m.get("origin_action", "NONE") != "NONE":
                tot_refacturacion_muellaje += float(tr_m.get("muellaje_cost_origin", 0))
        # Puerto Destino (en cada tramo idx_m)
        if tr_m.get("refacturar_muellaje", True) and tr_m.get("destination_action", "NONE") != "NONE":
            tot_refacturacion_muellaje += float(tr_m.get("muellaje_cost_dest", 0))

    gross_revenue_total = tot_freight_revenue + tot_refacturacion_muellaje
    pnl_net_utility = gross_revenue_total - tot_port_costs - tot_bunker_costs - tot_comm_usd
    tce_real = pnl_net_utility / tot_days if tot_days > 0 else 0
    # P/L correcto: voyage_result - (total_days * tce_req)
    pl_vs_req = pnl_net_utility - (tot_days * tce_req)
    
    return {
        "tramos": processed_tramos,
        "consolidated": {
            "total_distance": sum(t["distance"] for t in processed_tramos),
            "total_sea_days": round(tot_sea_days, 6),
            "total_port_days": round(tot_port_days, 6),
            "total_days": round(tot_days, 6),
            "bunker_ifo_tonnage": round(tot_ifo_tons, 4),
            "bunker_mdo_tonnage": round(tot_mdo_tons, 4),
            "total_bunker_costs": round(tot_bunker_costs, 2),
            "total_port_costs": round(tot_port_costs, 2),
            "total_freight_revenue": round(tot_freight_revenue, 2),
            "total_refacturacion_muellaje": round(tot_refacturacion_muellaje, 2),
            "gross_revenue_total": round(gross_revenue_total, 2),
            "address_commission_pct": addr_comm_pct,
            "broker_commission_pct": bkr_comm_pct,
            "total_commissions": round(tot_comm_usd, 2),
            "pnl_net_utility": round(pnl_net_utility, 2),
            "tce_real": round(tce_real, 2),
            "tce_required": round(tce_req, 2),
            "pl_vs_req": round(pl_vs_req, 2),
            "comments": comments,
            "demurrage_rate_pd": demurrage_rate_pd,
            "demurrage_days": demurrage_days,
            "demurrage_total": round(demurrage_total, 2),
            "refacturacion_muellaje": round(tot_refacturacion_muellaje, 2)
        }
    }
