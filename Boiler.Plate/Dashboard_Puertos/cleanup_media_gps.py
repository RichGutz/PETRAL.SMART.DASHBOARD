import os
import json
import subprocess
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import re

SOURCE_DIR = r"C:\Users\rguti\FOTOS.VIAJE.SAN.FERNANDO"

def get_gps_data(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    if ext in ['.jpg', '.jpeg', '.png']:
        try:
            img = Image.open(file_path)
            exif = img._getexif()
            if not exif: return None
            gps_info = {}
            for tag, value in exif.items():
                decoded = TAGS.get(tag, tag)
                if decoded == "GPSInfo":
                    for t in value:
                        sub_decoded = GPSTAGS.get(t, t)
                        gps_info[sub_decoded] = value[t]
            
            lat = gps_info.get("GPSLatitude")
            lon = gps_info.get("GPSLongitude")
            
            if lat and lon:
                return True
        except: pass
    elif ext in ['.mp4', '.mov']:
        try:
            cmd = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", file_path]
            res = subprocess.run(cmd, capture_output=True, text=True)
            data = json.loads(res.stdout)
            tags = data.get("format", {}).get("tags", {})
            loc = tags.get("location") or tags.get("com.apple.quicktime.location.ISO6709")
            if loc:
                match = re.search(r'([+-][0-9.]+)([+-][0-9.]+)', loc)
                if match:
                    return True
        except: pass
    return False

def main():
    print(f"🔍 SIMULACRO DE LIMPIEZA en {SOURCE_DIR}...")
    
    to_keep = []
    to_delete = []
    
    for root, dirs, files in os.walk(SOURCE_DIR):
        for f in files:
            f_path = os.path.join(root, f)
            # Solo procesar imagenes y videos
            ext = os.path.splitext(f)[1].lower()
            if ext not in ['.jpg', '.jpeg', '.png', '.mp4', '.mov', '.heic']:
                continue 

            if get_gps_data(f_path):
                to_keep.append(f_path)
            else:
                to_delete.append(f_path)

    print("\n--- RESUMEN DEL SIMULACRO ---")
    print(f"✅ Archivos a CONSERVAR (Georeferenciados): {len(to_keep)}")
    print(f"❌ Archivos a ELIMINAR (Sin GPS): {len(to_delete)}")
    
    if len(to_delete) > 0:
        print("\nPrimeros 20 archivos que se eliminarían:")
        for path in to_delete[:20]:
            print(f"  - {os.path.relpath(path, SOURCE_DIR)}")
        
        if len(to_delete) > 20:
            print(f"  ... y otros {len(to_delete) - 20} archivos más.")
            
    # Guardar lista completa en un log para revision del usuario
    log_path = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\audio_transcrip\simulacro_eliminacion.txt"
    with open(log_path, "w", encoding="utf-8") as log:
        log.write("--- ARCHIVOS A ELIMINAR ---\n")
        for path in to_delete:
            log.write(path + "\n")

    print(f"\n📂 Lista completa guardada en: {log_path}")
    print("⚠️  NO se ha borrado ningún archivo todavía.")

if __name__ == "__main__":
    main()
