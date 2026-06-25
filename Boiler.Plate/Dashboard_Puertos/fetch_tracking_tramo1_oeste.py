import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Cargar variables de entorno (Están en el mismo directorio que el script)
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Credenciales
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

def fetch_tramo1_oeste():
    """
    Extrae y procesa el Tramo 1 (al Oeste) del viaje del 11 de marzo.
    Ordena por longitud descendente para eliminar el efecto de teletransportación.
    """
    print("🛰️ Generando Dataset: Tramo 1 al Oeste (ID <= 472)...")
    if not url or not key:
        print("❌ Error: SUPABASE_URL o SUPABASE_KEY no definidos en .env")
        return

    try:
        supabase: Client = create_client(url, key)
        
        # 1. Traer puntos del 11 de marzo hasta el ID 472
        response = supabase.table("field_tracking_elevation") \
            .select("id, latitude, longitude, created_at, accuracy, elevation") \
            .lte("id", 472) \
            .execute()
        
        records = response.data
        if not records:
            print("❌ No se encontraron puntos para el Tramo 1.")
            return

        print(f"✅ Obtenidos {len(records)} puntos. Aplicando ordenación Oeste...")

        # 2. ORDENACIÓN POR LONGITUD DESCENDENTE (Más Oeste = Menos longitud en Perú -75.0 -> -75.2)
        records.sort(key=lambda x: x['longitude'], reverse=True)

        # 3. Re-asignar ordinales
        for i, r in enumerate(records):
            r['ordinal'] = i + 1
            r['segmento'] = "Oeste (Tramo 1)"
        
        # 4. Generar archivo JS específico
        js_content = f"// Dataset específico: Tramo 1 al Oeste (Hasta punto 472)\n"
        js_content += f"// Generado: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n\n"
        js_content += f"const TRACKING_POINTS_OESTE = {json.dumps(records, indent=2)};\n"
        
        output_path = os.path.join(os.path.dirname(__file__), "layer_tracking_tramo1.js")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(js_content)
            
        print(f"✨ Archivo {output_path} generado con {len(records)} puntos ordenados por avance físico.")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fetch_tramo1_oeste()
