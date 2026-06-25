import os
import json
from supabase import create_client, Client

# Credenciales desde CLAVES_PRIVADAS.txt
url = "https://mancsrsbtzgctgorpogs.supabase.co"
key = "sb_publishable_CT41HFF7NMtQunrSSGsksg_uwxmfteK"

def check_gps_records():
    print("🛰️ Conectando a Supabase para verificar registros de GPS...")
    try:
        supabase: Client = create_client(url, key)
        
        # Consultar los últimos 5 registros de la tabla field_tracking
        response = supabase.table("field_tracking").select("*").order("created_at", desc=True).limit(5).execute()
        
        records = response.data
        
        if not records:
            print("❌ No se encontraron registros en 'field_tracking'.")
            print("Asegúrate de haber activado GPS ON y luego 🔴 REC ON en tu celular.")
        else:
            print(f"✅ Se encontraron {len(records)} registros recientes:")
            for r in records:
                print(f"   - [{r['created_at']}] Usuario: {r['user_name']} | Lat: {r['latitude']}, Lng: {r['longitude']} (Precisión: {r['accuracy']}m)")
                
    except Exception as e:
        print(f"❌ Error al consultar Supabase: {e}")

if __name__ == "__main__":
    check_gps_records()
