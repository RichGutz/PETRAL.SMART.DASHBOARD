import os
import psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv
import pandas as pd

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
cur = conn.cursor(cursor_factory=DictCursor)

ports_to_check = [('CALLAO', 'DPW'), ('BARQUITO', 'BARQUITO')]

for port, terminal in ports_to_check:
    print(f"--- {port} / {terminal} ---")
    cur.execute("""
        SELECT sub_item_name, rate_usd, calculation_formula_template, logic_comments
        FROM port_costs_matrix
        WHERE port_id = %s AND terminal = %s AND operation_type = 'CARGA'
        ORDER BY sub_item_name
    """, (port, terminal))
    
    rows = cur.fetchall()
    df = pd.DataFrame(rows, columns=['Item', 'Tarifa (USD)', 'Fórmula', 'Observaciones'])
    print(df.to_string(index=False))
    print("\n")

cur.close()
conn.close()
