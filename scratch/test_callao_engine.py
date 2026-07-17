import os
import psycopg2
from pprint import pprint

URI = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def main():
    conn = psycopg2.connect(URI)
    cur = conn.cursor()
    
    cur.execute("SELECT vessel_id, grt, dwt, length, beam FROM vessels")
    vessels = cur.fetchall()
    vessels_db = {v[0]: {"vessel_id": v[0], "grt": float(v[1] or 0), "dwt": float(v[2] or 0), "length": float(v[3] or 0), "beam": float(v[4] or 0)} for v in vessels}
    
    cur.execute("SELECT * FROM port_costs_matrix")
    cols = [desc[0] for desc in cur.description]
    matrix_data = [dict(zip(cols, row)) for row in cur.fetchall()]
    conn.close()
    
    import sys
    sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
    from backend.port_engines.core import calculate_dynamic_port_costs
    
    PORT_ID = "CALLAO"
    TERMINAL = "APM"
    OP_TYPE = "DESCARGA"
    COUNTRY = "PE"
    
    # Filtro de candidatos
    candidatos = [c for c in matrix_data if c['port_id'] == PORT_ID and c['terminal'] == TERMINAL and c['operation_type'] == OP_TYPE]

    print(f"=== VERIFICACIÓN MOTOR VS EXCEL: CALLAO (APM) ===")
    print(f"Reglas cargadas: {len(candidatos)}\n")
    
    tests = [
        {"v_id": "MOQUEGUA", "port_hours": 32.0, "excel_total": 16329.61},
        {"v_id": "TABLONES", "port_hours": 34.0, "excel_total": 17463.55},
        {"v_id": "HUEMUL", "port_hours": 34.0, "excel_total": 17927.02},
        {"v_id": "CONCON_TRADER", "port_hours": 34.0, "excel_total": 16847.98},
    ]
    
    for t in tests:
        v_id = t["v_id"]
        if v_id not in vessels_db:
            print(f"Vessel {v_id} no encontrado en BD.")
            continue
            
        v_data = vessels_db[v_id]
        
        # calculate_dynamic_port_costs recibe: port_id, country, vessel_data, port_hours, port_costs_data
        res = calculate_dynamic_port_costs(PORT_ID, COUNTRY, v_data, t["port_hours"], candidatos)
        
        motor_total = res["total_cost"]
        excel_total = t["excel_total"]
        diff = motor_total - excel_total
        
        status = "✅ OK" if abs(diff) < 0.1 else f"❌ DIFF: ${diff:,.2f}"
        print(f"[{v_id}] Excel: ${excel_total:,.2f} | Motor: ${motor_total:,.2f} => {status}")
        
        if abs(diff) >= 0.1:
            print("   --- Desglose del Motor ---")
            for k, v in res['breakdown'].items():
                print(f"   {k}: ${v:,.2f}")

if __name__ == "__main__":
    main()
