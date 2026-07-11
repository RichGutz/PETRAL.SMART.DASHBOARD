from . import calculator_pe
from . import calculator_cl

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

def calculate_dynamic_port_costs(port_id: str, country: str, v_data: dict, port_hours: float, matrix_rows: list) -> dict:
    """
    Función orquestadora que delega el cálculo al motor del país correspondiente.
    matrix_rows es la lista de diccionarios que vienen de port_costs_matrix filtrados 
    previamente por cliente, terminal y operación.
    """
    country = str(country).upper()
    
    if country in ['CL', 'CHILE']:
        return calculator_cl.run(matrix_rows, v_data, port_hours, evaluate_formula)
    else:
        # Default a Perú (incluyendo Ecuador por ahora)
        return calculator_pe.run(matrix_rows, v_data, port_hours, evaluate_formula)
