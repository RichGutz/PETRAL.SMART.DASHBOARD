import json
import urllib.request

peru_url = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries/PER.geo.json"
chile_url = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries/CHL.geo.json"

print("Downloading Peru...")
req1 = urllib.request.urlopen(peru_url)
peru = json.loads(req1.read())

print("Downloading Chile...")
req2 = urllib.request.urlopen(chile_url)
chile = json.loads(req2.read())

# Merge features
merged = {
    "type": "FeatureCollection",
    "features": peru.get("features", [peru]) + chile.get("features", [chile])
}

with open(r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\public\peru_chile.json", "w", encoding="utf-8") as f:
    json.dump(merged, f)

print("Merged GeoJSON saved as peru_chile.json")
