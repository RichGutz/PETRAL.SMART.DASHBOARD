import os
import psycopg2
from urllib.parse import quote_plus

env_path = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/.env'
password = None
uri = None
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('SUPABASE_DB_PASSWORD='):
            password = line.strip().split('=', 1)[1].strip('"\'')
        elif line.startswith('SUPABASE_DB_URI='):
            uri = line.strip().split('=', 1)[1].strip('"\'')

if uri and password and '[YOUR-PASSWORD]' in uri:
    uri = uri.replace('[YOUR-PASSWORD]', quote_plus(password))

if uri:
    try:
        conn = psycopg2.connect(uri)
        conn.autocommit = True
        cur = conn.cursor()
        
        # 1. Add column if it doesn't exist
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='vessels' and column_name='color_hex';
        """)
        if not cur.fetchone():
            print('Adding color_hex to vessels...')
            cur.execute('ALTER TABLE vessels ADD COLUMN color_hex VARCHAR(7);')
            print('Column added successfully!')
        else:
            print('Column color_hex already exists in vessels.')
            
        # 2. Update colors from Manual.Estilos.md
        colors = {
            'TABLONES': '#DC2626',
            'MOQUEGUA': '#16A34A',
            'CONCON TRADER': '#475569',
            'HUEMUL': '#4F46E5'
        }
        
        for vessel_id, color in colors.items():
            cur.execute("UPDATE vessels SET color_hex = %s WHERE vessel_id = %s", (color, vessel_id))
            print(f"Updated {vessel_id} with color {color}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print('DB Error:', e)
else:
    print('No SUPABASE_DB_URI found')
