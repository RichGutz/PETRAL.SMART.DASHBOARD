import requests

url = "https://forecast.geeksoft.tech/api/v1/auth/login"

payload = {
    "email": "izavala@petral.com.pe",
    "password": "petral2026"
}

res = requests.post(url, json=payload)
print("VPS login status:", res.status_code)
print("VPS login response:", res.json())
