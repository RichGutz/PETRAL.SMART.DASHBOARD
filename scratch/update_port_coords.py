import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

updates = [
    ("ILO", -17.64854474450353, -71.35278800595086),
    ("MATARANI", -17.00431838677256, -72.1122118177881),
    ("TALARA", -4.573828809646509, -81.28177195798825),
    ("CALLAO", -12.04544280519783, -77.14522563428966),
    ("MEJILLONES", -23.071678814465244, -70.39676199984582),
    ("BARQUITO", -26.356685634668793, -70.64592177004846),
    ("MARCONA", -15.343752236099458, -75.15243553485892)
]

try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    
    for port_id, lat, lon in updates:
        cur.execute("""
            UPDATE ports 
            SET lat = %s, lon = %s
            WHERE port_id = %s;
        """, (lat, lon, port_id))
        
    print("Coordenadas actualizadas con exito para todos los puertos.")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cur' in locals():
        cur.close()
    if 'conn' in locals():
        conn.close()
