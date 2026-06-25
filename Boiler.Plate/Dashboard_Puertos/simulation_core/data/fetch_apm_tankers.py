import os
from dotenv import load_dotenv
from supabase import create_client, Client
import sys

sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\.env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def fetch_apm_tankers():
    try:
        # Filtro: Callao + Buque tanque + Terminal APM
        response = supabase.table("port_arrivals")\
            .select("ship_name, arrival_eta, agency, terminal")\
            .eq("port_name", "Callao")\
            .ilike("ship_type", "%Buque tanque%")\
            .ilike("terminal", "%APM%")\
            .order("arrival_eta", desc=True)\
            .execute()
        
        data = response.data
        
        if data:
            print(f"\n--- BUQUES TANQUE EN APM TERMINALS (CALLAO) ---")
            print(f"{'FECHA ETA':<15} | {'BUQUE':<25} | {'AGENCIA'}")
            print("-" * 75)
            
            unique_ships = set()
            for r in data:
                eta = r['arrival_eta'][:10] if r['arrival_eta'] else 'N/A'
                print(f"{eta:<15} | {r['ship_name']:<25} | {r['agency']}")
                unique_ships.add(r['ship_name'])
            
            print(f"\nTotal arribos: {len(data)}")
            print(f"Total buques únicos: {len(unique_ships)}")
            print("\nBUQUES ÚNICOS:")
            for s in sorted(list(unique_ships)): print(f" - {s}")
        else:
            print("\nNo se encontraron buques tanque en APM Terminals.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fetch_apm_tankers()
