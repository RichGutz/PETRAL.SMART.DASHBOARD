import psycopg2
import json
import os
from decimal import Decimal
from datetime import date, datetime

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

class PostgresEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        return super(PostgresEncoder, self).default(obj)

def create_contracts_backup():
    backup_dir = "C:/Users/rguti/PETRAL.SMART.DASHBOARD/scratch/backup_contracts_14_08_2026"
    os.makedirs(backup_dir, exist_ok=True)
    
    print("Connecting to PostgreSQL/Supabase...")
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # 1. Local JSON Backup
    tables = ["contracts", "contract_tariffs"]
    for table in tables:
        print(f"Backing up '{table}' to local JSON...")
        cur.execute(f"SELECT * FROM public.{table} LIMIT 0;")
        colnames = [desc[0] for desc in cur.description]
        
        cur.execute(f"SELECT * FROM public.{table};")
        rows = cur.fetchall()
        
        data = [dict(zip(colnames, row)) for row in rows]
        
        file_path = os.path.join(backup_dir, f"{table}.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, cls=PostgresEncoder, indent=2, ensure_ascii=False)
        print(f"  -> Saved {len(data)} records to '{file_path}'")
        
    # 2. Database table backup: contracts_backup and contract_tariffs_backup
    print("Creating DB backup table 'contracts_backup'...")
    cur.execute("DROP TABLE IF EXISTS public.contracts_backup;")
    cur.execute("CREATE TABLE public.contracts_backup AS SELECT * FROM public.contracts;")
    print("  -> Table 'contracts_backup' created successfully.")

    cur.execute("SELECT count(*) FROM public.contracts_backup;")
    count_contracts_backup = cur.fetchone()[0]
    print(f"  -> Total rows in contracts_backup: {count_contracts_backup}")

    cur.execute("DROP TABLE IF EXISTS public.contract_tariffs_backup;")
    cur.execute("CREATE TABLE public.contract_tariffs_backup AS SELECT * FROM public.contract_tariffs;")
    print("  -> Table 'contract_tariffs_backup' created successfully.")

    cur.execute("SELECT count(*) FROM public.contract_tariffs_backup;")
    count_tariffs_backup = cur.fetchone()[0]
    print(f"  -> Total rows in contract_tariffs_backup: {count_tariffs_backup}")
    
    conn.commit()
    cur.close()
    conn.close()
    print("Backup process (Local JSON + DB contracts_backup table) finished cleanly!")

if __name__ == "__main__":
    create_contracts_backup()
