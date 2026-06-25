#!/usr/bin/env python3
"""
extract_video_frames.py
========================
Extrae fotogramas de cada video .MOV y los agrega como fotos en layer_media_data.js.

Lectura de GPS: usa ffprobe para obtener la coordenada del video.
Extracción de fotogramas: usa ffmpeg para sacar N frames por video.
Resultado: los fotogramas se tratan como fotos normales en el dashboard.
"""

import subprocess
import json
import os
import re
import hashlib
import shutil

# ========================== CONFIGURACIÓN ==========================
VIDEO_SOURCE_DIR = r"C:\Users\rguti\FOTOS.VIAJE.SAN.FERNANDO\Fotos - Iosef"
THUMB_OUTPUT_DIR = r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\media_thumbnails"
FULL_OUTPUT_DIR  = r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\media_fullsize"
JS_DATA_FILE     = r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\layer_media_data.js"

FRAMES_PER_VIDEO = 3      # Cuántos fotogramas extraer por video
THUMB_WIDTH = 120         # Ancho del thumbnail en píxeles
# ==================================================================

os.makedirs(THUMB_OUTPUT_DIR, exist_ok=True)
os.makedirs(FULL_OUTPUT_DIR, exist_ok=True)


def get_video_gps_and_duration(video_path):
    """Usa ffprobe para extraer GPS y duración del video."""
    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_format", "-show_streams",
        video_path
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        data = json.loads(result.stdout)

        # Extraer duración
        duration = float(data.get("format", {}).get("duration", 0))

        # Buscar GPS en tags del formato
        tags = data.get("format", {}).get("tags", {})
        
        # iPhone guarda GPS en com.apple.quicktime.location.ISO6709
        # Formato: +LAT+LON/  ej: +14.9930-74.9981/
        location_str = tags.get("com.apple.quicktime.location.ISO6709", "") or \
                       tags.get("location", "") or \
                       tags.get("location-eng", "")
        
        lat, lon = None, None
        if location_str:
            # Regex para formato ISO6709: +/-DD.DDDD+/-DDD.DDDD
            match = re.search(r'([+-]\d+\.\d+)([+-]\d+\.\d+)', location_str)
            if match:
                lat = float(match.group(1))
                lon = float(match.group(2))

        return lat, lon, duration

    except Exception as e:
        print(f"  ⚠️ ffprobe error: {e}")
        return None, None, 0


def extract_frames(video_path, output_dir, n_frames, duration):
    """Extrae N fotogramas del video y los guarda como JPG."""
    base = os.path.splitext(os.path.basename(video_path))[0]
    frames = []

    if duration <= 0 or n_frames <= 0:
        return frames

    # Calculamos los tiempos de extracción (evitamos el primer y último segundo)
    margin = min(1.0, duration * 0.1)
    usable = duration - 2 * margin
    if usable <= 0:
        usable = duration
        margin = 0

    for i in range(n_frames):
        if n_frames == 1:
            t = margin + usable / 2
        else:
            t = margin + (i / (n_frames - 1)) * usable

        # Nombre único para cada fotograma
        frame_name = f"{base}_f{i+1:02d}.jpg"
        frame_path = os.path.join(output_dir, frame_name)

        cmd = [
            "ffmpeg", "-y",
            "-ss", str(t),
            "-i", video_path,
            "-vframes", "1",
            "-q:v", "3",       # Calidad alta
            frame_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0 and os.path.exists(frame_path):
            frames.append((frame_name, frame_path, t))

    return frames


def make_thumbnail(full_path, thumb_dir, thumb_name):
    """Redimensiona la imagen a thumbnail usando ffmpeg."""
    thumb_path = os.path.join(thumb_dir, thumb_name)
    cmd = [
        "ffmpeg", "-y",
        "-i", full_path,
        "-vf", f"scale={THUMB_WIDTH}:-1",
        thumb_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    return result.returncode == 0


def short_hash(text):
    return hashlib.md5(text.encode()).hexdigest()[:10]


def load_existing_data(js_file):
    """Carga los datos actuales de layer_media_data.js."""
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.search(r'const LAYER_MEDIA_DATA = (\[.*?\]);', content, re.DOTALL)
    if not match:
        return [], content
    data = json.loads(match.group(1))
    return data, content


def save_data(js_file, content, old_json_str, new_data):
    """Guarda los datos actualizados en layer_media_data.js."""
    new_json_str = json.dumps(new_data, indent=4, ensure_ascii=False)
    # Find the array in the original content
    match = re.search(r'const LAYER_MEDIA_DATA = (\[.*?\]);', content, re.DOTALL)
    if match:
        new_content = content[:match.start(1)] + new_json_str + content[match.end(1):]
    else:
        new_content = content
    with open(js_file, 'w', encoding='utf-8') as f:
        f.write(new_content)


def main():
    print("🎬 Extractor de Fotogramas de Video")
    print("=" * 50)

    # Cargar datos existentes
    existing_data, content = load_existing_data(JS_DATA_FILE)
    existing_filenames = {item['filename'] for item in existing_data}
    print(f"📄 Datos existentes: {len(existing_data)} elementos")

    # Encontrar todos los videos
    videos = [f for f in os.listdir(VIDEO_SOURCE_DIR) if f.upper().endswith('.MOV')]
    print(f"🎥 Videos encontrados: {len(videos)}")
    print()

    new_entries = []
    skipped = 0
    errors = 0

    for video_file in sorted(videos):
        video_path = os.path.join(VIDEO_SOURCE_DIR, video_file)
        base_name = os.path.splitext(video_file)[0]

        print(f"📹 Procesando: {video_file}")

        # Extraer GPS y duración
        lat, lon, duration = get_video_gps_and_duration(video_path)

        if lat is None or lon is None:
            print(f"  ⚠️  Sin GPS – saltando")
            skipped += 1
            continue

        print(f"  📍 GPS: {lat:.4f}, {lon:.4f} | Duración: {duration:.1f}s")

        # Extraer fotogramas en carpeta temporal
        frames = extract_frames(video_path, FULL_OUTPUT_DIR, FRAMES_PER_VIDEO, duration)

        if not frames:
            print(f"  ❌ No se pudieron extraer fotogramas")
            errors += 1
            continue

        for frame_name, frame_path, timestamp in frames:
            # Verificar si ya existe
            if frame_name in existing_filenames:
                print(f"  ⏭️  {frame_name} ya existe, saltando")
                continue

            # Crear thumbnail
            thumb_name = f"thumb_{short_hash(frame_name)}.jpg"
            ok = make_thumbnail(frame_path, THUMB_OUTPUT_DIR, thumb_name)

            if ok:
                entry = {
                    "filename": frame_name,
                    "lat": round(lat, 6),
                    "lon": round(lon, 6),
                    "thumb": thumb_name,
                    "type": "image",
                    "date": "",
                    "source_video": video_file,
                    "timestamp_sec": round(timestamp, 1)
                }
                new_entries.append(entry)
                print(f"  ✅ {frame_name} → {thumb_name}")
            else:
                print(f"  ❌ Error creando thumbnail para {frame_name}")
                errors += 1

    print()
    print("=" * 50)
    print(f"✅ Nuevos fotogramas: {len(new_entries)}")
    print(f"⚠️  Sin GPS (saltados): {skipped}")
    print(f"❌ Errores: {errors}")

    if new_entries:
        combined = existing_data + new_entries
        save_data(JS_DATA_FILE, content, None, combined)
        print(f"💾 layer_media_data.js actualizado con {len(combined)} elementos en total.")
    else:
        print("ℹ️  No se agregaron nuevas entradas.")


if __name__ == "__main__":
    main()
