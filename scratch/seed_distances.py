import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv

file_path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\Tabla distancias.xlsx'

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
conn.autocommit = True
cur = conn.cursor()

df = pd.read_excel(file_path)

# Ensure 'routes' is clean or just insert/update
inserted_count = 0
updated_count = 0

for idx, row in df.iterrows():
    if idx < 2:
        continue # skip headers
    
    port_a_raw = row.iloc[1]
    port_b_raw = row.iloc[2]
    dist_raw = row.iloc[3]
    
    if pd.isna(port_a_raw) or pd.isna(port_b_raw) or pd.isna(dist_raw):
        continue
        
    port_a = str(port_a_raw).strip().upper()
    port_b = str(port_b_raw).strip().upper()
    
    # Enforce alphabetical order for port_order constraint
    if port_a > port_b:
        port_a, port_b = port_b, port_a
        
    try:
        dist = float(dist_raw)
    except:
        continue

    # Check if exists (A->B)
    cur.execute("SELECT 1 FROM routes WHERE port_a = %s AND port_b = %s", (port_a, port_b))
    if cur.fetchone():
        cur.execute("UPDATE routes SET route_distance = %s WHERE port_a = %s AND port_b = %s", (dist, port_a, port_b))
        updated_count += 1
    else:
        cur.execute("INSERT INTO routes (port_a, port_b, route_distance, weather_factor_laden, weather_factor_ballast) VALUES (%s, %s, %s, 0, 0)", (port_a, port_b, dist))
        inserted_count += 1

print(f"Distances seeded! Inserted new base routes: {inserted_count}, Updated existing: {updated_count}")
