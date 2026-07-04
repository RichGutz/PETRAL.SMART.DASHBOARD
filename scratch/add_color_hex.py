import os
import psycopg2

env_path = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/.env'
uri = None
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('SUPABASE_DB_URI='):
            uri = line.strip().split('=', 1)[1].strip('"\'')
            break

if uri:
    try:
        conn = psycopg2.connect(uri)
        conn.autocommit = True
        cur = conn.cursor()
        
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
            
        cur.close()
        conn.close()
    except Exception as e:
        print('DB Error:', e)
else:
    print('No SUPABASE_DB_URI found')
