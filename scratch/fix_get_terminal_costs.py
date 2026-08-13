path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\backend\services\forecast_service.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target_old = """    # 3. Si es Mejillones, resolver las tres terminales
    if is_mejillones:"""

target_new = """    def get_terminal_costs_from_matrix(term_id: str):
        costs = [
            c for c in port_costs_data
            if c.get("client_id") == client_id 
            and c.get("port_id") == port_id 
            and c.get("terminal") == term_id
            and c.get("operation_type") == operation_type 
            and c.get("vessel_id") == vessel_id
        ]
        if not costs:
            costs = [
                c for c in port_costs_data
                if c.get("client_id") == client_id 
                and c.get("port_id") == port_id 
                and c.get("terminal") == term_id
                and c.get("operation_type") == operation_type 
                and c.get("vessel_id", "DEFAULT") == "DEFAULT"
            ]
        return costs

    def get_flat_cost_from_agency_matrix():
        target_v_clean = normalize_v_key(vessel_id)
        target_port_clean = (port_id or "").strip().upper()
        target_op_clean = (operation_type or "").strip().upper()

        matching = [
            a for a in agency_matrix_data
            if (a.get("port_id") or "").strip().upper() == target_port_clean
            and (a.get("operation_type") or "").strip().upper() == target_op_clean
            and normalize_v_key(a.get("vessel_id")) == target_v_clean
        ]
        if matching:
            breakdown = {}
            for r in matching:
                sub_type = r.get("sub_operation_type") or "MAIN"
                breakdown[sub_type] = float(r.get("cost", 0.0))
            return sum(breakdown.values()), breakdown
        return None

    # 3. Si es Mejillones, resolver las tres terminales
    if is_mejillones:"""

content = content.replace(target_old, target_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("FIXED GET_TERMINAL_COSTS_FROM_MATRIX IN FORECAST_SERVICE.PY SUCCESSFULLY!")
