import os
import json
import subprocess
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import re

LOG_SOURCE = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\audio_transcrip\simulacro_eliminacion.txt"
FINAL_LOG = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\audio_transcrip\log_eliminacion_final.txt"

def get_gps_data(file_path):
    """Re-verificación robusta de GPS"""
    ext = os.path.splitext(file_path)[1].lower()
    if ext in ['.jpg', '.jpeg', '.png']:
        try:
            img = Image.open(file_path)
            exif = img._getexif()
            if not exif: return False
            for tag, value in exif.items():
                if TAGS.get(tag) == "GPSInfo":
                    # Si tiene el tag GPSInfo, revisamos si tiene lat/lon
                    if 2 in value and 4 in value: # 2=Lat, 4=Lon
                        return True
        except: pass
    elif ext in ['.mp4', '.mov']:
        try:
            cmd = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", file_path]
            res = subprocess.run(cmd, capture_output=True, text=True)
            data = json.loads(res.stdout)
            tags = data.get("format", {}).get("tags", {})
            loc = tags.get("location") or tags.get("com.apple.quicktime.location.ISO6709")
            if loc and re.search(r'[+-][0-9.]+', loc):
                return True
        except: pass
    return False

def main():
    if not os.path.exists(LOG_SOURCE):
        print(f"❌ Error: No se encontró el archivo de simulacro {LOG_SOURCE}")
        return

    with open(LOG_SOURCE, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Saltar la cabecera del txt si existe
    files_to_check = [line.strip() for line in lines if os.path.isabs(line.strip())]

    print(f"🚀 Iniciando ELIMINACIÓN con DOBLE VERIFICACIÓN...")
    print(f"📦 Archivos cargados del simulacro: {len(files_to_check)}")

    deleted_count = 0
    saved_count = 0
    errors = 0

    with open(FINAL_LOG, "w", encoding="utf-8") as out:
        out.write("--- LOG DE ELIMINACIÓN FINAL ---\n")
        
        for f_path in files_to_check:
            if not os.path.exists(f_path):
                print(f"❓ No existe: {f_path}")
                continue

            # SEGUNDA PASADA DE VERIFICACIÓN
            has_gps = get_gps_data(f_path)
            
            if has_gps:
                print(f"✅ SALVADO (GPS detectado en 2da pasada): {os.path.basename(f_path)}")
                out.write(f"SALVADO: {f_path}\n")
                saved_count += 1
            else:
                try:
                    os.remove(f_path)
                    print(f"🗑️ ELIMINADO: {os.path.basename(f_path)}")
                    out.write(f"ELIMINADO: {f_path}\n")
                    deleted_count += 1
                except Exception as e:
                    print(f"❌ ERROR al borrar {f_path}: {e}")
                    out.write(f"ERROR: {f_path} ({e})\n")
                    errors += 1

    print("\n--- RESULTADO FINAL ---")
    print(f"🗑️  Archivos ELIMINADOS: {deleted_count}")
    print(f"✅ Archivos SALVADOS (por 2da pasada): {saved_count}")
    print(f"⚠️  Errores: {errors}")
    print(f"📄 Log detallado en: {FINAL_LOG}")

if __name__ == "__main__":
    main()
