import pandas as pd
import math
from supabase import create_client

def main():
    url = "https://hjjxooxcpvlvbaxgifbn.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"
    supabase = create_client(url, key)

    excel_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\Maestro_de_Distancias_y_Rutas_2026-07-16.xlsx"
    df = pd.read_excel(excel_path)

    df = df.iloc[:, :5]
    df.columns = ['port_a', 'port_b', 'route_distance', 'weather_factor_laden', 'weather_factor_ballast']

    records = df.to_dict(orient='records')
    print(f"Uploading {len(records)} records...")

    batch_size = 100
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        for rec in batch:
            # Handle NaN
            for k, v in rec.items():
                if isinstance(v, float) and math.isnan(v):
                    rec[k] = None
                    
            # Enforce port_order constraint (port_a < port_b)
            if str(rec['port_a']) > str(rec['port_b']):
                temp = rec['port_a']
                rec['port_a'] = rec['port_b']
                rec['port_b'] = temp
        
        try:
            res = supabase.table('routes').upsert(batch, on_conflict='port_a,port_b').execute()
            print(f"Uploaded batch {i//batch_size + 1}, inserted/updated {len(res.data)} records.")
        except Exception as e:
            print(f"Upsert failed: {e}")

    print("Finished uploading routes.")

if __name__ == '__main__':
    main()
