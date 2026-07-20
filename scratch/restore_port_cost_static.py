import psycopg2

URI = 'postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres'

def restore():
    conn = psycopg2.connect(URI)
    conn.autocommit = True
    cur = conn.cursor()
    
    # 1. Leer data de agency_matrix, ordenado por client_id para dar prioridad a un valor (SPCC) o al ultimo
    cur.execute("SELECT client_id, port_id, operation_type, vessel_id, cost FROM agency_matrix ORDER BY client_id DESC")
    rows = cur.fetchall()
    
    updates = 0
    inserts = 0
    
    # Guardaremos procesados para evitar sobrescribir el mismo (port, op, vessel) con otro cliente
    processed = set()
    
    for c_id, p_id, op_type, v_id, cost in rows:
        key = (p_id, op_type, v_id)
        if key in processed:
            continue
        processed.add(key)
        
        # Revisamos si hay una fila existente para actualizar en port_cost_static
        cur.execute("SELECT count(*) FROM port_cost_static WHERE port_id = %s AND operation_type = %s AND vessel_id = %s", (p_id, op_type, v_id))
        count = cur.fetchone()[0]
        
        if count > 0:
            cur.execute(
                "UPDATE port_cost_static SET cost = %s, updated_by = %s WHERE port_id = %s AND operation_type = %s AND vessel_id = %s", 
                (cost, 'RESTORE_SCRIPT', p_id, op_type, v_id)
            )
            updates += 1
        else:
            cur.execute(
                "INSERT INTO port_cost_static (port_id, operation_type, vessel_id, terminal_id, sub_operation_type, cost, updated_by) VALUES (%s, %s, %s, %s, %s, %s, %s)", 
                (p_id, op_type, v_id, 'GENERAL', 'other', cost, 'RESTORE_SCRIPT')
            )
            inserts += 1
            
    print(f"Terminado! Se actualizaron {updates} filas y se insertaron {inserts} filas en port_cost_static.")
    cur.close()
    conn.close()

if __name__ == '__main__':
    restore()
