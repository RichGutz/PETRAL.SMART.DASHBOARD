import os
import json
import zipfile
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Cargar variables de entorno desde el directorio raíz
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Credenciales (Usando variables de entorno si existen, o fallback)
url = os.environ.get("SUPABASE_URL") or "https://mancsrsbtzgctgorpogs.supabase.co"
key = os.environ.get("SUPABASE_KEY") or "sb_publishable_CT41HFF7NMtQunrSSGsksg_uwxmfteK"

def reorder_westbound(records, target_id=472):
    """
    Divide los registros en dos tramos:
    1. Hasta el target_id: Ordenado por Longitud descendente (viaje al Oeste).
    2. Posterior al target_id: Mantiene orden cronológico.
    """
    # Identificar el índice del último punto del Tramo 1 (ID 472)
    # Buscamos en los registros originales ordenados por tiempo
    tramo1 = []
    tramo2 = []
    
    found_split = False
    # Los registros ya vienen ordenados por created_at de la consulta base
    for r in records:
        if not found_split:
            tramo1.append(r)
            if r.get('id') == target_id:
                found_split = True
        else:
            tramo2.append(r)
            
    if tramo1:
        print(f"🔄 Reordenando Tramo 1 ({len(tramo1)} puntos) por Longitud Oeste...")
        # Ordenar Tramo 1 por longitud DESC (Más Oeste = Menos longitud)
        tramo1.sort(key=lambda x: x['longitude'], reverse=True)
        
    return tramo1 + tramo2

def export_to_kmz():
    print("🛰️ Conectando a Supabase para exportar a KMZ...")
    try:
        supabase: Client = create_client(url, key)
        
        # Traer TODOS los puntos de la tabla
        response = supabase.table("field_tracking_elevation") \
            .select("id, latitude, longitude, created_at, accuracy, elevation, user_name") \
            .order("created_at", desc=False) \
            .execute()
        
        records = response.data
        if not records:
            print("❌ No hay puntos en field_tracking_elevation.")
            return

        print(f"✅ Total: {len(records)} puntos encontrados. Procesando y filtrando...")
        
        # 1. ORDENACIÓN CUALITATIVA (Tramo 1 Oeste, Resto Tiempo)
        # Aplicamos la lógica de reordenación antes de los filtros para asegurar que el corte es exacto
        records = reorder_westbound(records, target_id=472)

        # 2. Filtrar puntos que están en Lima, valores atípicos, o que no son del usuario RG
        filtered_records = []
        for r in records:
            lat = r.get('latitude', 0)
            user_name = r.get('user_name') or ""
            
            if lat > -13:
                # print(f"🗑️ Descartando punto en Lima: Lat {lat}, Lon {r.get('longitude')}")
                continue
                
            if user_name.strip().upper() != "RG":
                continue
                
            filtered_records.append(r)
        
        records = filtered_records
        print(f"✅ Total tras filtros (Solo usuario RG, Fuera de Lima): {len(records)} puntos. Generando KMZ...")

        kml_content = []
        kml_content.append('<?xml version="1.0" encoding="UTF-8"?>')
        kml_content.append('<kml xmlns="http://www.opengis.net/kml/2.2">')
        kml_content.append('  <Document>')
        kml_content.append('    <name>Registro_Viaje_Campo_Segmentado</name>')
        kml_content.append('    <description>Ruta corregida (Oeste) y puntos de seguimiento</description>')
        
        # Estilos (Red=Oeste, Blue=Resto?) - Por ahora mantenemos el original solicitado
        kml_content.append('    <Style id="routeStyle">')
        kml_content.append('      <LineStyle>')
        kml_content.append('        <color>ff0000ff</color>')
        kml_content.append('        <width>4</width>')
        kml_content.append('      </LineStyle>')
        kml_content.append('    </Style>')
        
        kml_content.append('    <Style id="pointStyle">')
        kml_content.append('      <IconStyle>')
        kml_content.append('        <scale>0.6</scale>')
        kml_content.append('        <Icon>')
        kml_content.append('          <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>')
        kml_content.append('        </Icon>')
        kml_content.append('      </IconStyle>')
        kml_content.append('    </Style>')

        kml_content.append('    <Folder>')
        kml_content.append('      <name>Puntos de Seguimiento</name>')

        coords_str = []
        for i, r in enumerate(records):
            lat = r.get('latitude')
            lon = r.get('longitude')
            elev = r.get('elevation') or 0.0
            created_at = r.get('created_at', '')
            accuracy = r.get('accuracy', 0.0)
            db_id = r.get('id', 'N/A')
            
            timestamp_str = str(created_at)

            # Indicar si es Tramo 1 en la descripción
            es_oeste = " (Tramo 1 - Oeste)" if db_id <= 472 else ""

            description = (
                f"<b>Punto {i+1}</b> (ID Base de Datos: {db_id}){es_oeste}<br/>"
                f"<b>Fecha/Hora:</b> {timestamp_str}<br/>"
                f"<b>Elevación:</b> {elev} m<br/>"
                f"<b>Precisión GPS:</b> {accuracy} m"
            )

            coords_str.append(f"{lon},{lat},{elev}")

            kml_content.append('      <Placemark>')
            kml_content.append(f'        <name>Pto {i+1} (ID: {db_id})</name>')
            kml_content.append(f'        <description><![CDATA[{description}]]></description>')
            kml_content.append('        <styleUrl>#pointStyle</styleUrl>')
            
            if timestamp_str:
                kml_content.append('        <TimeStamp>')
                kml_content.append(f'          <when>{timestamp_str}</when>')
                kml_content.append('        </TimeStamp>')
                
            kml_content.append('        <Point>')
            kml_content.append('          <altitudeMode>absolute</altitudeMode>')
            kml_content.append(f'          <coordinates>{lon},{lat},{elev}</coordinates>')
            kml_content.append('        </Point>')
            kml_content.append('      </Placemark>')

        kml_content.append('    </Folder>')
        
        kml_content.append('    <Placemark>')
        kml_content.append('      <name>Ruta Corregida</name>')
        kml_content.append('      <styleUrl>#routeStyle</styleUrl>')
        kml_content.append('      <LineString>')
        kml_content.append('        <tessellate>1</tessellate>')
        kml_content.append('        <altitudeMode>absolute</altitudeMode>')
        kml_content.append(f'        <coordinates>{" ".join(coords_str)}</coordinates>')
        kml_content.append('      </LineString>')
        kml_content.append('    </Placemark>')
        
        kml_content.append('  </Document>')
        kml_content.append('</kml>')
        
        kml_string = "\n".join(kml_content)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"viaje_campo_corregido_{timestamp}.kmz"
        output_path = os.path.join(os.path.dirname(__file__), filename)
        
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as kmz:
            kmz.writestr("doc.kml", kml_string)
            
        print(f"✨ ¡Archivo KMZ generado exitosamente en: {output_path}!")

    except Exception as e:
        print(f"❌ Error durante la exportación a KMZ: {e}")

if __name__ == "__main__":
    export_to_kmz()
