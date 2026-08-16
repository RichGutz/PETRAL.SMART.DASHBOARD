import requests

url = "https://forecast.geeksoft.tech/api/v1/forecast/load/513f2ea9-0aa4-4ee6-b420-22820e477245"
data = requests.get(url).json()

print(f"Escenario: {data.get('scenario_name')}")
lines = data.get('projection_lines', [])

for idx, l in enumerate(lines, 1):
    print(f"Línea {idx}:")
    print(f"  Cliente: {l.get('client')}")
    print(f"  Barco: {l.get('vessel')}")
    print(f"  route_id: '{l.get('route_id')}'")
    print(f"  Origen: {l.get('origin_port_id')} | Destino: {l.get('destination_port_id')}")
    print(f"  Frecuencia mensual: {l.get('monthly_frequency')} viajes/mes")
    print(f"  Carga: {l.get('quantity')} MT")
