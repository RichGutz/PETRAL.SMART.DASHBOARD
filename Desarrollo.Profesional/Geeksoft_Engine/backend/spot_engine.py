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
    
    c_sea_mdo = float(vessel.get("consumption_sea_mdo") or 0)
    c_idle_mdo = float(vessel.get("consumption_idle_mdo") or 0)
    c_load_mdo = float(vessel.get("consumption_load_mdo") or 0)
    c_disch_mdo = float(vessel.get("consumption_disch_mdo") or 0)
    
    # Defaults de precio si no vienen (evitar que sea 0)
    p_ifo = float(vessel.get("bunker_price_ifo") or 600)
    p_mdo = float(vessel.get("bunker_price_mdo") or 900)

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
        
        sea_days = (dist * (1 + w_factor)) / (speed * 24) if speed > 0 else 0
        port_days = 0
        
        ifo_tons = sea_days * c_sea_ifo
        mdo_tons = sea_days * c_sea_mdo
        bunker_costs = (ifo_tons * p_ifo) + (mdo_tons * p_mdo)
        
        audit_trail = {
            "sea_days": {
                "formula": "(dist * (1+w_factor)) / (speed * 24)",
                "values": f"({rc(fmt(dist))} * (1+{rc(fmt_dec(w_factor))})) / ({vc(fmt_dec(speed))} * 24) = {vc(fmt_dec(sea_days))}"
            },
            "port_days": {
                "formula": "N/A (Ballast)",
                "values": "0"
            },
            "bunker_costs": {
                "formula": "Tons IFO = sea_days * cons_sea<br/>Tons MDO = sea_days * cons_sea<br/>Cost = (Tons IFO * p_IFO) + (Tons MDO * p_MDO)",
                "values": f"IFO: {vc(fmt_dec(sea_days))} * {c_sea_ifo} = {vc(fmt_dec(ifo_tons))} t<br/>"
                          f"MDO: {vc(fmt_dec(sea_days))} * {c_sea_mdo} = {vc(fmt_dec(mdo_tons))} t<br/>"
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
        
        overhead_orig = float(leg_inputs.get("port_overhead_hours_origin", 6))
        overhead_dest = float(leg_inputs.get("port_overhead_hours_dest", 6))
        
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
