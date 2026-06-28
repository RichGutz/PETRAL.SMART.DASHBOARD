import os
import psycopg2
from dotenv import load_dotenv

# Load env variables
load_dotenv(r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\.env")

db_uri = os.environ.get("SUPABASE_DB_URI")
db_password = os.environ.get("SUPABASE_DB_PASSWORD")

# Replace password placeholder
if db_uri and db_password and "[PASSWORD]" in db_uri:
    db_uri = db_uri.replace("[PASSWORD]", db_password)

migration_file = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\supabase\migrations\20260627_insert_spcc_agency_costs.sql"

try:
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql = f.read()

    print(f"Connecting to database...")
    conn = psycopg2.connect(db_uri)
    cur = conn.cursor()
    
    print("Executing SQL script...")
    cur.execute(sql)
    
    conn.commit()
    cur.close()
    conn.close()
    print("Migration executed successfully!")
    
except Exception as e:
    print(f"Error executing migration: {e}")
