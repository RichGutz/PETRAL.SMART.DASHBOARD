import json
import urllib.request

peru_url = "https://raw.githubusercontent.com/juaneladio/peru-geojson/master/peru_departamental_simple.geojson"
chile_url = "https://raw.githubusercontent.com/caracena/chile-geojson/master/regiones.json"

print("Downloading Peru regions...")
req1 = urllib.request.urlopen(peru_url)
peru = json.loads(req1.read())

print("Downloading Chile regions...")
req2 = urllib.request.urlopen(chile_url)
chile = json.loads(req2.read())

merged = {
    "type": "FeatureCollection",
    "features": peru.get("features", []) + chile.get("features", [])
}

output_path = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\public\peru_chile.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(merged, f)

print(f"Merged GeoJSON saved to {output_path}")
