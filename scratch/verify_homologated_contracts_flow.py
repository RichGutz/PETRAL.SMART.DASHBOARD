import psycopg2
import json

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def test_homologated_flow():
    print("Iniciando prueba de inserción y lectura homologada en 'contracts'...")
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # 1. Insert test contract route with exact same schema (name, description, legs_data, pais, created_by)
    test_name = "CONTRATO_TEST_MARCONA_2026"
    test_legs_data = {
        "is_multicotizador": True,
        "contract_metadata": {
            "contract_id": "CTR-MARCONA-2026-01",
            "client_id": "MARCONA",
            "valid_from": "2026-01-01",
            "valid_to": "2028-12-31",
            "validity_years": 3,
            "contract_status": "ACTIVE"
        },
        "tramos": [
            {
                "origin_port_id": "PEMAR",
                "destination_port_id": "CLVAP",
                "cargo_qty": 40000,
                "freight_rate": 26.50
            }
        ]
    }
    
    # Clean up test row if exists
    cur.execute("DELETE FROM public.contracts WHERE name = %s;", (test_name,))
    
    # Insert contract using the exact same column structure
    insert_sql = """
        INSERT INTO public.contracts (contract_id, client_id, origin_port_id, destination_port_id, name, description, legs_data, pais, created_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING contract_id, name, created_at;
    """
    cur.execute(insert_sql, (
        "CTR-MARCONA-2026-01",
        "MARCONA",
        "PEMAR",
        "CLVAP",
        test_name,
        "Contrato Homologado de Demostración 3 Años",
        json.dumps(test_legs_data),
        "PE",
        "izavala@petral.com.pe"
    ))
    res = cur.fetchone()
    conn.commit()
    print(f"  -> Contrato insertado con éxito: ID={res[0]} | Name='{res[1]}' | Fecha={res[2]}")
    
    # 2. Polimorphic Query Test across all 3 tables
    print("\n--- Ejecutando consulta polimórfica homogénea en las 3 tablas ---")
    unified_query = """
        SELECT 'routes_clients' AS table_source, name, description, legs_data->>'is_multicotizador' AS is_mc, created_at FROM routes_clients
        UNION ALL
        SELECT 'routes_quotes' AS table_source, name, description, legs_data->>'is_multicotizador' AS is_mc, created_at FROM routes_quotes
        UNION ALL
        SELECT 'contracts' AS table_source, name, description, legs_data->>'is_multicotizador' AS is_mc, created_at FROM contracts
        ORDER BY created_at DESC;
    """
    cur.execute(unified_query)
    rows = cur.fetchall()
    
    print(f"Total registros obtenidos unificadamente de las 3 tablas: {len(rows)}")
    for r in rows[:10]: # Print top 10
        print(f"  Tabla: {r[0]:15} | Nombre: {str(r[1]):35} | MultiCotizador: {r[3]}")
        
    # Clean up test row after verification
    cur.execute("DELETE FROM public.contracts WHERE name = %s;", (test_name,))
    conn.commit()
    print("\nLimpieza realizada. Prueba finalizada limpiamente!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    test_homologated_flow()
