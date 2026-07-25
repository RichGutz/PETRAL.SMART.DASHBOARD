from . import calculator_pe
from . import calculator_cl
from . import calculator_callao
from . import calculator_marcona
from . import calculator_matarani
from . import calculator_ilo
from . import calculator_mejillones
from . import calculator_mejillones_interacid
from . import calculator_mejillones_terquim
from . import calculator_barquito

def evaluate_formula(template: str, variables: dict) -> float:
    """
    Evalúa una fórmula guardada en calculation_formula_template.
    Si no hay fórmula o está vacía, devuelve 0.
    Usa eval() con un entorno seguro.
    """
    if not template or not str(template).strip():
        return 0.0
    
    # Prepara el entorno seguro para eval
    import math
    safe_env = {
        "math": math,
        "CEIL": math.ceil,
        "FLOOR": math.floor,
        "MAX": max,
        "MIN": min
    }
    
    # Inyectar las variables
    safe_env.update(variables)
    
    try:
        # Reemplazar convenciones típicas si hiciera falta
        formula = template.upper()
        # Evaluate
        result = eval(formula, {"__builtins__": None}, safe_env)
        return float(result)
    except Exception as e:
        print(f"Error evaluando fórmula '{template}' con vars {variables}: {e}")
        return 0.0

def calculate_dynamic_port_costs(port_id: str, country: str, v_data: dict, port_hours: float, matrix_rows: list = None, inputs: dict = None) -> dict:
    """
    Función orquestadora que delega el cálculo al motor del puerto o país correspondiente.
    matrix_rows es la lista de diccionarios que vienen de port_costs_matrix.
    """
    country = str(country).upper()
    port_id_clean = str(port_id).upper()
    
    if "BARQUITO" in port_id_clean or port_id_clean in ["CL-BAR", "TERMINAL_BARQUITO"]:
        return calculator_barquito.run(v_data, port_hours, inputs)
    elif "TERQUIM" in port_id_clean or port_id_clean in ["CL-TRQ", "MEJILLONES_TERQUIM"]:
        return calculator_mejillones_terquim.run(v_data, port_hours, inputs)
    elif "INTERACID" in port_id_clean or port_id_clean in ["CL-INT", "MEJILLONES_INTERACID"]:
        return calculator_mejillones_interacid.run(v_data, port_hours, inputs)
    elif "CALLAO" in port_id_clean or port_id_clean in ["PE-CAL", "CALLAO_APM"]:
        return calculator_callao.run(v_data, port_hours, inputs)
    elif "MARCONA" in port_id_clean or "SAN_JUAN" in port_id_clean or port_id_clean in ["PE-MAR"]:
        return calculator_marcona.run(v_data, port_hours, inputs)
    elif "MATARANI" in port_id_clean or port_id_clean in ["PE-MAT", "TISUR"]:
        return calculator_matarani.run(v_data, port_hours, inputs)
    elif "ILO" in port_id_clean or port_id_clean in ["PE-ILO", "SPCC_ILO", "ENAPU_ILO"]:
        return calculator_ilo.run(v_data, port_hours, inputs)
    elif "MEJILLONES" in port_id_clean or port_id_clean in ["CL-MEJ", "TPM_MEJILLONES"]:
        return calculator_mejillones.run(v_data, port_hours, inputs)
    elif country in ['CL', 'CHILE']:
        return calculator_cl.run(matrix_rows or [], v_data, port_hours, evaluate_formula)
    else:
        # Default a Perú
        return calculator_pe.run(matrix_rows or [], v_data, port_hours, evaluate_formula)

def calculate_proforma_pxq_averaged(port_id: str, country: str, v_data: dict, port_hours: float, matrix_rows: list = None, inputs: dict = None) -> dict:
    """
    Proforma dinámicamente promediada para el Forecast Comercial (sin fecha/hora fija de maniobra).
    Simula 4 escenarios en PDF:
      1. Carga Mínima (Diurno Normal)
      2. Descarga Mínima (Diurno Normal)
      3. Carga Máxima (Nocturno/Feriado Overtime)
      4. Descarga Máxima (Nocturno/Feriado Overtime)
    Retorna el costo proforma promediado asignable a la Matriz Financiera.
    """
    inputs_min = dict(inputs or {})
    inputs_min["is_overtime"] = False
    inputs_min["is_holiday"] = False
    inputs_min["entry_datetime"] = "2026-07-25T10:00:00Z"
    
    inputs_max = dict(inputs or {})
    inputs_max["is_overtime"] = True
    inputs_max["is_holiday"] = True
    inputs_max["entry_datetime"] = "2026-07-26T02:00:00Z"
    
    res_min = calculate_dynamic_port_costs(port_id, country, v_data, port_hours, matrix_rows, inputs_min)
    res_max = calculate_dynamic_port_costs(port_id, country, v_data, port_hours, matrix_rows, inputs_max)
    
    cost_min = float(res_min.get("total_scale_cost_usd", 0.0) or 0.0)
    cost_max = float(res_max.get("total_scale_cost_usd", 0.0) or 0.0)
    cost_avg = round((cost_min + cost_max) / 2.0, 2)
    
    port_label = str(port_id).upper().replace("_", " ")
    
    return {
        "port_id": port_id,
        "cost_min_usd": cost_min,
        "cost_max_usd": cost_max,
        "cost_averaged_usd": cost_avg,
        "pdf_scenarios": [
            {
                "id": "pdf-1-carga-min",
                "title": f"ACTA AUDITORÍA PUERTO DE CARGA — {port_label} [NIVEL BAJO - HORARIO ORDINARIO]",
                "cost_usd": cost_min,
                "level": "NIVEL BAJO",
                "schedule_type": "HORARIO ORDINARIO",
                "audit_trail": res_min.get("audit_trail", [])
            },
            {
                "id": "pdf-2-descarga-min",
                "title": f"ACTA AUDITORÍA PUERTO DE DESCARGA — {port_label} [NIVEL BAJO - HORARIO ORDINARIO]",
                "cost_usd": cost_min,
                "level": "NIVEL BAJO",
                "schedule_type": "HORARIO ORDINARIO",
                "audit_trail": res_min.get("audit_trail", [])
            },
            {
                "id": "pdf-3-carga-max",
                "title": f"ACTA AUDITORÍA PUERTO DE CARGA — {port_label} [NIVEL ALTO - HORARIO RECARGO]",
                "cost_usd": cost_max,
                "level": "NIVEL ALTO",
                "schedule_type": "HORARIO RECARGO",
                "audit_trail": res_max.get("audit_trail", [])
            },
            {
                "id": "pdf-4-descarga-max",
                "title": f"ACTA AUDITORÍA PUERTO DE DESCARGA — {port_label} [NIVEL ALTO - HORARIO RECARGO]",
                "cost_usd": cost_max,
                "level": "NIVEL ALTO",
                "schedule_type": "HORARIO RECARGO",
                "audit_trail": res_max.get("audit_trail", [])
            }
        ]
    }








