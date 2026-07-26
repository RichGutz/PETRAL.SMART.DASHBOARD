import urllib.request
import json

url_get = "http://localhost:8000/api/v1/forecast/port_costs_static"
url_post = "http://localhost:8000/api/v1/forecast/port_costs_static"

print(f"Testing GET {url_get}...")
try:
    req = urllib.request.Request(url_get)
    with urllib.request.urlopen(req, timeout=5) as response:
        data = json.loads(response.read().decode())
        print(f"GET SUCCESS: Received {len(data)} items from local backend.")
except Exception as e:
    print(f"GET FAILED: {type(e)} {e}")

# Sample POST payload
payload = [
    {
        "client_id": "PETRAL",
        "port_id": "MARCONA",
        "operation_type": "DESCARGA",
        "vessel_id": "MOQUEGUA",
        "sub_operation_type": "MAIN",
        "cost": 12500.0,
        "updated_by": "USUARIO"
    }
]

print(f"\nTesting POST {url_post}...")
try:
    req = urllib.request.Request(
        url_post, 
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=5) as response:
        data = json.loads(response.read().decode())
        print(f"POST SUCCESS: {data}")
except Exception as e:
    if hasattr(e, 'read'):
        err_body = e.read().decode()
        print(f"POST FAILED HTTP Error: {e.code} - Body: {err_body}")
    else:
        print(f"POST FAILED: {type(e)} {e}")
