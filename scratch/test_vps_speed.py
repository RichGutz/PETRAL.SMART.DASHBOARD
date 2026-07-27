import requests, time

url = "https://forecast.geeksoft.tech/api/v1/forecast/vessels"

for i in range(1, 4):
    t0 = time.time()
    r = requests.get(url)
    t1 = time.time()
    print(f"Petición {i} al VPS: {(t1 - t0)*1000:.2f} ms (Status: {r.status_code}, Elementos: {len(r.json()) if r.status_code==200 else 0})")
