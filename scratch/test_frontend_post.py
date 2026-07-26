import requests
import json

url = "http://localhost:8000/api/v1/forecast/port_costs_static"

sample_frontend_payload = [
    {
        "client_id": "PETRAL",
        "port_id": "MARCONA",
        "operation_type": "DESCARGA",
        "vessel_id": "MOQUEGUA",
        "sub_operation_type": "MAIN",
        "cost": 12500.0,
        "updated_by": "USUARIO"
    },
    {
        "client_id": "PETRAL",
        "port_id": "MARCONA",
        "operation_type": "CARGA",
        "vessel_id": "MOQUEGUA",
        "sub_operation_type": "MAIN",
        "cost": 0.0,
        "updated_by": "USUARIO"
    }
]

print("Sending POST request to local Uvicorn backend...")
try:
    resp = requests.post(url, json=sample_frontend_payload, timeout=5)
    print("STATUS CODE:", resp.status_code)
    print("RESPONSE BODY:", resp.text)
except Exception as e:
    print("HTTP REQUEST EXCEPTION:", type(e), e)
