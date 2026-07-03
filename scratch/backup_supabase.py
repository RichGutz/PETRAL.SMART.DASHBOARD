import psycopg2
import json
import os
from decimal import Decimal
from datetime import date, datetime

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

# Serializador personalizado para tipos de datos PostgreSQL que no son nativos en JSON (Decimal, Date)
class PostgresEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        return super(PostgresEncoder, self).default(obj)

def run_backup():
    tables = [
        "vessels",
        "ports",
        "routes",
        "routes_spot",
        "bunker_prices",
        "contracts",
        "contract_tariffs",
        "port_costs_matrix",
        "agency_matrix"
    ]
    
    backup_dir = "scratch/backup_03_07_2026"
    os.makedirs(backup_dir, exist_ok=True)
    
    print(f"Iniciando respaldo de Supabase en la carpeta: '{backup_dir}'...")
    
    try:
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        
        for table in tables:
            print(f"  Respaldando tabla '{table}'...")
            
            # Obtener nombres de columnas
            cur.execute(f"SELECT * FROM public.{table} LIMIT 0;")
            colnames = [desc[0] for desc in cur.description]
            
            # Obtener todos los registros
            cur.execute(f"SELECT * FROM public.{table};")
            rows = cur.fetchall()
            
            # Formatear como lista de diccionarios
            data = []
            for row in rows:
                data.append(dict(zip(colnames, row)))
                
            # Guardar en archivo JSON
            file_path = os.path.join(backup_dir, f"{table}.json")
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, cls=PostgresEncoder, indent=2, ensure_ascii=False)
                
            print(f"    -> Guardados {len(data)} registros en '{file_path}'")
            
        cur.close()
        conn.close()
        print("¡Respaldo completado con éxito!")
        
    except Exception as e:
        print(f"❌ Error durante el respaldo: {e}")

if __name__ == "__main__":
    run_backup()
