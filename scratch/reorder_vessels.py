import psycopg2

def reorder():
    conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cur = conn.cursor()
        
        # Asignar orden correcto usando CONCON_TRADER
        order_map = {
            "MOQUEGUA": 1,
            "TABLONES": 2,
            "CONCON_TRADER": 3,
            "HUEMUL": 4
        }
        
        print("Aplicando ordenamiento correcto...")
        for v_id, order in order_map.items():
            cur.execute(
                "UPDATE vessels SET display_order = %s WHERE UPPER(vessel_id) = %s;",
                (order, v_id)
            )
            print(f"  >> {v_id} -> Orden {order} ({cur.rowcount} fila afectada)")
            
        cur.close()
        conn.close()
        print("\n¡Reordenamiento completado exitosamente!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reorder()
