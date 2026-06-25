import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Cargar variables de entorno
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Credenciales
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

def export_tramo1_kml():
    """
    Genera un archivo KML puro para el Tramo 1 (Oeste) corregido.
    """
    print("🛰️ Generando KML: Tramo 1 al Oeste (ID <= 472)...")
    try:
        supabase: Client = create_client(url, key)
        
        # 1. Traer puntos del Tramo 1
        response = supabase.table("field_tracking_elevation") \
            .select("id, latitude, longitude, created_at, accuracy, elevation") \
            .lte("id", 472) \
            .execute()
        
        records = response.data
        if not records:
            print("❌ No se encontraron puntos.")
            return

        # 2. Ordenación por Longitud descendente (Oeste)
        records.sort(key=lambda x: x['longitude'], reverse=True)

        kml_content = []
        kml_content.append('<?xml version="1.0" encoding="UTF-8"?>')
        kml_content.append('<kml xmlns="http://www.opengis.net/kml/2.2">')
        kml_content.append('  <Document>')
        kml_content.append('    <name>Tramo_1_Oeste_Corregido</name>')
        kml_content.append('    <description>Viaje corregido por avance físico (Longitud) para eliminar teletransportación.</description>')
        
        # Estilo de línea
        kml_content.append('    <Style id="tramo1Style">')
        kml_content.append('      <LineStyle>')
        kml_content.append('        <color>ff0000ff</color>') # Rojo
        kml_content.append('        <width>4</width>')
        kml_content.append('      </LineStyle>')
        kml_content.append('    </Style>')

        # Marcadores
        kml_content.append('    <Folder>')
        kml_content.append('      <name>Puntos GPS (Ordenados Oeste)</name>')
        
        coords = []
        for i, r in enumerate(records):
            lat, lon, elev = r['latitude'], r['longitude'], r['elevation'] or 0.0
            db_id = r['id']
            coords.append(f"{lon},{lat},{elev}")
            
            kml_content.append('      <Placemark>')
            kml_content.append(f'        <name>Pto {i+1} (ID:{db_id})</name>')
            kml_content.append('        <Point>')
            kml_content.append('          <altitudeMode>absolute</altitudeMode>')
            kml_content.append(f'          <coordinates>{lon},{lat},{elev}</coordinates>')
            kml_content.append('        </Point>')
            kml_content.append('      </Placemark>')
        
        kml_content.append('    </Folder>')

        # Línea de ruta
        kml_content.append('    <Placemark>')
        kml_content.append('      <name>Ruta Tramo 1</name>')
        kml_content.append('      <styleUrl>#tramo1Style</styleUrl>')
        kml_content.append('      <LineString>')
        kml_content.append('        <tessellate>1</tessellate>')
        kml_content.append('        <altitudeMode>absolute</altitudeMode>')
        kml_content.append(f'        <coordinates>{" ".join(coords)}</coordinates>')
        kml_content.append('      </LineString>')
        kml_content.append('    </Placemark>')

        kml_content.append('  </Document>')
        kml_content.append('</kml>')

        output_path = os.path.join(os.path.dirname(__file__), "Tramo1_Oeste_Corregido.kml")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(kml_content))
            
        print(f"✨ KML generado en: {output_path}")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    export_tramo1_kml()
