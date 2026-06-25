import os
import json
import subprocess
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import hashlib
import re

SOURCE_DIR = r"C:\Users\rguti\FOTOS.VIAJE.SAN.FERNANDO"
OUTPUT_DIR = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\media_thumbnails"
JS_OUTPUT = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\layer_media_data.js"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def get_decimal_from_dms(dms, ref):
    degrees = float(dms[0])
    minutes = float(dms[1])
    seconds = float(dms[2])
    decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
    if ref in ['S', 'W']:
        decimal = -decimal
    return decimal

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
            lat_ref = gps_info.get("GPSLatitudeRef")
            lon = gps_info.get("GPSLongitude")
            lon_ref = gps_info.get("GPSLongitudeRef")
            
            if lat and lat_ref and lon and lon_ref:
                return get_decimal_from_dms(lat, lat_ref), get_decimal_from_dms(lon, lon_ref)
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
                    return float(match.group(1)), float(match.group(2))
        except: pass
    return None

def create_thumbnail(file_path, out_name):
    ext = os.path.splitext(file_path)[1].lower()
    out_path = os.path.join(OUTPUT_DIR, out_name + ".jpg")
    if ext in ['.jpg', '.jpeg', '.png']:
        try:
            img = Image.open(file_path)
            # Fix orientation based on EXIF
            try:
                exif = img._getexif()
                if exif:
                    for tag, value in exif.items():
                        if TAGS.get(tag) == 'Orientation':
                            if value == 3: img = img.rotate(180, expand=True)
                            elif value == 6: img = img.rotate(270, expand=True)
                            elif value == 8: img = img.rotate(90, expand=True)
            except: pass
            img.thumbnail((400, 400))
            img.save(out_path, "JPEG", quality=85)
            return True
        except: pass
    elif ext in ['.mp4', '.mov']:
        try:
            cmd = ["ffmpeg", "-y", "-i", file_path, "-ss", "00:00:01", "-vframes", "1", "-vf", "scale=w=400:h=-1", out_path]
            subprocess.run(cmd, capture_output=True)
            return True
        except: pass
    return False

def main():
    media_list = []
    print(f"🚀 Iniciando escaneo de {SOURCE_DIR}...")
    
    total_files = 0
    georef_files = 0
    
    for root, dirs, files in os.walk(SOURCE_DIR):
        for f in files:
            total_files += 1
            f_path = os.path.join(root, f)
            gps = get_gps_data(f_path)
            if gps:
                lat, lon = gps
                file_hash = hashlib.md5(f_path.encode()).hexdigest()[:10]
                out_name = f"thumb_{file_hash}"
                if create_thumbnail(f_path, out_name):
                    media_list.append({
                        "filename": f,
                        "lat": lat,
                        "lon": lon,
                        "thumb": out_name + ".jpg",
                        "type": "video" if f.lower().endswith(('.mp4', '.mov')) else "image",
                        "date": "" # Could add date extraction later
                    })
                    georef_files += 1
                    print(f"✅ [{georef_files}] Georef: {f}")
                else:
                    print(f"⚠️ Error creando thumb para {f}")

    js_content = f"// Datos de medios georeferenciados\n"
    js_content += f"const LAYER_MEDIA_DATA = {json.dumps(media_list, indent=4)};"
    
    with open(JS_OUTPUT, "w", encoding="utf-8") as out:
        out.write(js_content)
    
    print(f"\n✨ Proceso finalizado.")
    print(f"📁 Total archivos escaneados: {total_files}")
    print(f"📍 Archivos georeferenciados (y con thumb): {georef_files}")
    print(f"💾 Metadata guardada en: {JS_OUTPUT}")

if __name__ == "__main__":
    main()
