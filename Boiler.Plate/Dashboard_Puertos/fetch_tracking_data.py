import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime, time as pytime

# Cargar variables de entorno desde el directorio raíz
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Credenciales
url = os.environ.get("SUPABASE_URL") or "https://mancsrsbtzgctgorpogs.supabase.co"
key = os.environ.get("SUPABASE_KEY") or "sb_publishable_CT41HFF7NMtQunrSSGsksg_uwxmfteK"

import requests
import time

def get_elevation_batch(locations):
    """Obtiene la elevación para una lista de puntos usando Open-Meteo"""
    if not locations: return []
    
    base_url = "https://api.open-meteo.com/v1/elevation"
    lats = [f"{p['latitude']:.6f}" for p in locations]
    lons = [f"{p['longitude']:.6f}" for p in locations]
    
    batch_size = 50
    all_elevations = []
    
    for i in range(0, len(locations), batch_size):
        batch_lats = lats[i:i+batch_size]
        batch_lons = lons[i:i+batch_size]
        url = f"{base_url}?latitude={','.join(batch_lats)}&longitude={','.join(batch_lons)}"
        
        try:
            print(f"   ...obteniendo lote {i//batch_size + 1}...")
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            data = response.json()
            all_elevations.extend(data.get('elevation', []))
            time.sleep(2) 
        except Exception as e:
            print(f"   ⚠️ Error en API (lote {i}): {e}")
            all_elevations.extend([None] * len(batch_lats))
            
    return all_elevations

def reorder_westbound(records, target_id=472):
    """
    Divide los registros en dos tramos:
    1. Hasta el target_id: Ordenado por Longitud descendente (viaje al Oeste).
    2. Posterior al target_id: Mantiene orden cronológico.
    """
    tramo1 = []
    tramo2 = []
    found_split = False
    
    for r in records:
        if not found_split:
            tramo1.append(r)
            if r.get('id') == target_id:
                found_split = True
        else:
            tramo2.append(r)
            
    if tramo1:
        print(f"🔄 Reordenando Tramo 1 ({len(tramo1)} puntos) por Longitud Oeste...")
        tramo1.sort(key=lambda x: x['longitude'], reverse=True)
        
    return tramo1 + tramo2

def fetch_and_generate_js():
    print("🛰️ Conectando a Supabase (Seguimiento + Ordenación Oeste)...")
    try:
        supabase: Client = create_client(url, key)
        # Por defecto trae hoy, pero la lógica de reordenación está lista por si se consultan datos históricos
        today_9am = datetime.combine(datetime.now().date(), pytime(9, 0)).isoformat()
        
        response = supabase.table("field_tracking_elevation") \
            .select("id, latitude, longitude, created_at, accuracy, elevation") \
            .gte("created_at", today_9am) \
            .order("created_at", desc=False) \
            .execute()
        
        records = response.data
        if not records:
            print(f"❌ No hay puntos nuevos hoy. Generando archivo vacío.")
            with open(os.path.join(os.path.dirname(__file__), "layer_tracking.js"), "w", encoding="utf-8") as f:
                f.write("const TRACKING_POINTS = [];")
            return

        # 1. ORDENACIÓN CUALITATIVA (Tramo 1 Oeste, Resto Tiempo)
        records = reorder_westbound(records, target_id=472)

        # 2. Identificar puntos SIN elevación
        missing_elevation = [r for r in records if r.get('elevation') is None]
        
        if missing_elevation:
            print(f"✅ Total: {len(records)} puntos. 🚀 {len(missing_elevation)} pendientes de elevación.")
            elevations = get_elevation_batch(missing_elevation)
            
            success_count = 0
            for i, r in enumerate(missing_elevation):
                elev = elevations[i]
                if elev is not None:
                    r['elevation'] = elev
                    try:
                        supabase.table("field_tracking_elevation").update({"elevation": elev}).eq("id", r['id']).execute()
                        success_count += 1
                    except Exception as e:
                        print(f"   ⚠️ Error guardando punto {r['id']}: {e}")
            print(f"✨ Proceso de sincronización completado. {success_count} puntos actualizados.")
        
        # 3. Asignar ordinales finales
        for i, r in enumerate(records):
            r['ordinal'] = i + 1
        
        # 4. Generar JS (Manteniendo compatibilidad y añadiendo el segmento separado)
        tramo1 = [r for r in records if r['id'] <= 472]
        tramo2 = [r for r in records if r['id'] > 472]

        js_content = f"// Archivo tracking con ordenación física (Oeste) en Tramo 1\n"
        js_content += f"// Generado: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n\n"
        js_content += f"const TRACKING_POINTS_OESTE = {json.dumps(tramo1, indent=2)};\n\n"
        js_content += f"const TRACKING_POINTS_POST_OESTE = {json.dumps(tramo2, indent=2)};\n\n"
        js_content += f"const TRACKING_POINTS = {json.dumps(records, indent=2)};\n"
        
        output_path = os.path.join(os.path.dirname(__file__), "layer_tracking.js")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(js_content)
            
        print(f"✨ Archivo actualizado con {len(records)} puntos.")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fetch_and_generate_js()
