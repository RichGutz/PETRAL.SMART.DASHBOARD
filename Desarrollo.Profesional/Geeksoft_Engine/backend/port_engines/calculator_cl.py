def run(matrix_rows: list, v_data: dict, port_hours: float, evaluate_formula_fn) -> dict:
    """
    Motor de Cálculo para Puertos de Chile.
    Recorre las reglas de la matriz de costos y genera el desglose dinámico.
    """
    breakdown = {}
    
    # Preparar el contexto de variables para las fórmulas
    grt = float(v_data.get("grt", 0))
    dwt = float(v_data.get("dwt", 0))
    trb = grt  # TRB es equivalente a GRT
    loa = float(v_data.get("length", 0))
    
    variables = {
        "GRT": grt,
        "TRB": trb,
        "DWT": dwt,
        "LOA": loa,
        "PORT_HOURS": port_hours
    }
    
    for row in matrix_rows:
        concept = row.get("concept_id")
        rate_val = row.get("rate_usd")
        rate = float(rate_val) if rate_val is not None else 0.0
        mult_source = row.get("multiplier_source", "FIXED")
        formula = row.get("calculation_formula_template", None)
        
        variables["RATE_USD"] = rate
        
        calculated_cost = 0.0
        
        if formula and str(formula).strip():
            # Si hay una fórmula explícita
            calculated_cost = evaluate_formula_fn(formula, variables)
        else:
            # Cálculos por defecto si no hay template pero sí multiplier_source
            if mult_source == "FIXED":
                calculated_cost = rate
            elif mult_source == "TRB" or mult_source == "GRT":
                calculated_cost = rate * trb
            elif mult_source == "DWT":
                calculated_cost = rate * dwt
            elif mult_source == "LOA":
                calculated_cost = rate * loa
            elif mult_source == "PORT_HOURS":
                calculated_cost = rate * port_hours
            else:
                calculated_cost = rate
                
        breakdown[concept] = calculated_cost
        
    total_cost = sum(breakdown.values())
    
    return {
        "total_cost": round(total_cost, 2),
        "breakdown": {k: round(v, 2) for k, v in breakdown.items()}
    }
