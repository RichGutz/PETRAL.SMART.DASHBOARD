import psycopg2

def test_upsert():
    conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Intentando realizar un UPSERT de prueba en la tabla 'routes'...")
        # Simular exactamente el formato que envía el frontend y procesa el backend:
        # Nota que getTwinColor devuelve un string largo de rgb(r, g, b)
        port_a = "CALLAO"
        port_b = "TALARA"
        route_distance = 550.25
        weather_factor_laden = 0.03
        weather_factor_ballast = 0.03
        color_hex = "rgb(187, 102, 230)"
        pais = "Peru"
        
        cur.execute(
            """
            INSERT INTO routes (port_a, port_b, route_distance, weather_factor_laden, weather_factor_ballast, color_hex, pais)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (port_a, port_b) 
            DO UPDATE SET 
                route_distance = EXCLUDED.route_distance,
                weather_factor_laden = EXCLUDED.weather_factor_laden,
                weather_factor_ballast = EXCLUDED.weather_factor_ballast,
                color_hex = EXCLUDED.color_hex,
                pais = EXCLUDED.pais;
            """,
            (port_a, port_b, route_distance, weather_factor_laden, weather_factor_ballast, color_hex, pais)
        )
        print("¡Upsert de prueba exitoso! La base de datos aceptó el registro sin errores.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"\n[ERROR DE BASE DE DATOS] {e}")

if __name__ == "__main__":
    test_upsert()
