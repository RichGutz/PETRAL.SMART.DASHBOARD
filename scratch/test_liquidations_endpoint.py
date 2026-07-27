import requests

url = "https://forecast.geeksoft.tech/api/v1/forecast/voyage_liquidations"

try:
    r = requests.get(url)
    print("Status:", r.status_code)
    data = r.json()
    print("Cantidad de liquidaciones devueltas:", len(data) if isinstance(data, list) else data)
    if isinstance(data, list) and len(data) > 0:
        print("Muestra del primer viaje:", data[0].get("voyage_code"), data[0].get("vessel_name"))
        print("Muestra del último viaje:", data[-1].get("voyage_code"), data[-1].get("vessel_name"))
except Exception as e:
    print("Error:", e)
