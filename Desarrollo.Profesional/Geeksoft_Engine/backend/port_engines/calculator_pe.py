def run(matrix_rows: list, v_data: dict, port_hours: float, evaluate_formula_fn) -> dict:
    """
    Motor de Cálculo para Puertos de Perú.
    Recorre las reglas de la matriz de costos y genera el desglose dinámico y auditoría.
    """
    breakdown = {}
    audit_trail = {}
    
    # Preparar el contexto de variables para las fórmulas
    grt = float(v_data.get("grt", 0))
    dwt = float(v_data.get("dwt", 0))
    trb = grt  # TRB es a menudo equivalente a GRT en estos Exceles
    loa = float(v_data.get("length", 0))
    
    variables = {
        "GRT": grt,
        "TRB": trb,
        "DWT": dwt,
        "LOA": loa,
        "PORT_HOURS": port_hours
    }
    
    parameters = v_data.get('parameters', {})
    
    # Inyectar variables operativas del vessel_terminal_operations
    for k, v in v_data.items():
        if isinstance(v, (int, float, str)):
            variables[k.upper()] = v

    
    for row in matrix_rows:
        rule_id = row.get("rule_id", "")
        concept = row.get("concept_id")
        rate_val = row.get("rate_usd")
        rate = float(rate_val) if rate_val is not None else 0.0
        mult_source = row.get("multiplier_source", "FIXED")
        formula = row.get("calculation_formula_template", None)
        sub_name = row.get("sub_item_name", concept)
        allow_pass_through = row.get("allow_pass_through", False)
        
        # Check if parameter has a user input for this concept
        param_qty = parameters.get(concept, 0.0)
        variables["QTY"] = param_qty
        variables["TUGBOATS"] = v_data.get("tugboats_count", 0)
        
        # Actualizar RATE_USD dinámico por cada concepto
        variables["RATE_USD"] = rate
        
        calculated_cost = 0.0
        audit_str = ""
        
        if allow_pass_through:
            calculated_cost = param_qty
            audit_str = f"Pass-Through Ingresado = ${calculated_cost:,.2f}"
        elif formula and str(formula).strip():
            # Si hay una fórmula explícita
            calculated_cost = evaluate_formula_fn(formula, variables)
            audit_str = f"Fórmula '{formula}' aplicada = ${calculated_cost:,.2f}"
        else:
            if mult_source == "FIXED":
                calculated_cost = rate
                audit_str = f"Tarifa Fija (Flat) = ${calculated_cost:,.2f}"
            elif mult_source in ["TRB", "GRT", "PER_GRT"]:
                calculated_cost = rate * trb
                audit_str = f"${rate:,.2f} x {trb:,.0f} (GRT) = ${calculated_cost:,.2f}"
            elif mult_source == "DWT":
                calculated_cost = rate * dwt
                audit_str = f"${rate:,.2f} x {dwt:,.0f} (DWT) = ${calculated_cost:,.2f}"
            elif mult_source in ["LOA", "PER_LOA"]:
                calculated_cost = rate * loa
                audit_str = f"${rate:,.2f} x {loa:,.2f} (LOA) = ${calculated_cost:,.2f}"
            elif mult_source == "PER_LOA_HOUR":
                calculated_cost = rate * loa * port_hours
                audit_str = f"${rate:,.2f} x {loa:,.2f} (LOA) x {port_hours:,.2f} (Hrs) = ${calculated_cost:,.2f}"
            elif mult_source in ["PORT_HOURS", "PER_HOUR"]:
                calculated_cost = rate * port_hours
                audit_str = f"${rate:,.2f} x {port_hours:,.2f} (Hrs) = ${calculated_cost:,.2f}"
            elif mult_source in ["PER_MANEUVER", "PER_UNIT", "PER_CALL", "PER_HOUR_STATIC"]:
                calculated_cost = rate * param_qty
                audit_str = f"${rate:,.2f} x {param_qty} (Cant. Ingresada) = ${calculated_cost:,.2f}"
            else:
                calculated_cost = rate
                audit_str = f"Valor Directo = ${calculated_cost:,.2f}"
                
        breakdown[concept] = breakdown.get(concept, 0.0) + calculated_cost
        if concept not in audit_trail:
            audit_trail[concept] = []
        audit_trail[concept].append({
            "name": sub_name,
            "formula_desc": audit_str,
            "cost": calculated_cost
        })
        
    total_cost = sum(breakdown.values())
    
    return {
        "total_cost": round(total_cost, 2),
        "breakdown": {k: round(v, 2) for k, v in breakdown.items()},
        "audit_trail": audit_trail
    }
