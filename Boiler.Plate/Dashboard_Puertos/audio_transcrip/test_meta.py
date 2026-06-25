import os
import json
import subprocess
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

def get_decimal_from_dms(dms, ref):
    degrees = dms[0]
    minutes = dms[1]
    seconds = dms[2]
    decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
    if ref in ['S', 'W']:
        decimal = -decimal
    return decimal

def get_exif_data(image_path):
    try:
        image = Image.open(image_path)
        exif_data = image._getexif()
        if not exif_data:
            return None
        
        gps_info = {}
        for tag, value in exif_data.items():
            decoded = TAGS.get(tag, tag)
            if decoded == "GPSInfo":
                for t in value:
                    sub_decoded = GPSTAGS.get(t, t)
                    gps_info[sub_decoded] = value[t]
        return gps_info
    except Exception as e:
        print(f"Error reading {image_path}: {e}")
        return None

def get_lat_lon(gps_info):
    if not gps_info:
        return None, None
    
    lat = gps_info.get("GPSLatitude")
    lat_ref = gps_info.get("GPSLatitudeRef")
    lon = gps_info.get("GPSLongitude")
    lon_ref = gps_info.get("GPSLongitudeRef")

    if lat and lat_ref and lon and lon_ref:
        lat_dec = get_decimal_from_dms(lat, lat_ref)
        lon_dec = get_decimal_from_dms(lon, lon_ref)
        return lat_dec, lon_dec
    return None, None

def get_video_meta(video_path):
    try:
        cmd = [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_format", "-show_streams", video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        data = json.loads(result.stdout)
        # Look for location in tags
        tags = data.get("format", {}).get("tags", {})
        location = tags.get("location") or tags.get("com.apple.quicktime.location.ISO6709")
        return location
    except Exception as e:
        print(f"Error reading video {video_path}: {e}")
        return None

# Test with a few samples
samples = [
    r"C:\Users\rguti\FOTOS.VIAJE.SAN.FERNANDO\Fotos - Iosef\CCLD8828.JPG"
]

for s in samples:
    print(f"\nResult for: {s}")
    lower_s = s.lower()
    if lower_s.endswith(('.jpg', '.jpeg', '.png')):
        gps = get_exif_data(s)
        lat, lon = get_lat_lon(gps)
        print(f"Lat: {lat}, Lon: {lon}")
    else:
        loc = get_video_meta(s)
        print(f"Location tag: {loc}")
