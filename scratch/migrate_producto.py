import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../Desarrollo.Profesional/Geeksoft_Engine/.env'))
password = os.environ.get("SUPABASE_DB_PASSWORD")
db_url = os.environ.get("SUPABASE_DB_URI").replace("[PASSWORD]", password.replace("$", "%24"))

sql = """
ALTER TABLE sources_sinks ADD COLUMN IF NOT EXISTS producto VARCHAR(100) DEFAULT 'Ácido Sulfúrico';

ALTER TABLE sources_sinks DROP CONSTRAINT IF EXISTS sources_sinks_pkey;
ALTER TABLE sources_sinks ADD PRIMARY KEY (port_id, year, empresa, producto);
"""

try:
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute(sql)
    print("Migration successful.")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals() and conn:
        conn.close()
