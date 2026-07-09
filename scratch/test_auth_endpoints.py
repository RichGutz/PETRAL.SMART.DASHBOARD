import sys
import os

# Añadir la ruta del backend al path de python
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_login_and_users():
    print("--- 1. Probando Login Exitoso (ADMIN) ---")
    payload = {
        "email": "izavala@petral.com.pe",
        "password": "petral2026"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "ADMIN"
    print("¡Login ADMIN exitoso!")

    print("\n--- 2. Probando Login Fallido ---")
    payload_bad = {
        "email": "izavala@petral.com.pe",
        "password": "wrongpassword"
    }
    response_bad = client.post("/api/v1/auth/login", json=payload_bad)
    print(f"Status Code: {response_bad.status_code}")
    print(f"Response: {response_bad.json()}")
    assert response_bad.status_code == 401
    print("¡Bloqueo de login fallido correcto!")

    print("\n--- 3. Probando Login Exitoso (USER - Fernando Harten) ---")
    payload_user = {
        "email": "fharten@petral.com.pe",
        "password": "petral2026"
    }
    response_user = client.post("/api/v1/auth/login", json=payload_user)
    print(f"Status Code: {response_user.status_code}")
    print(f"Response: {response_user.json()}")
    assert response_user.status_code == 200
    assert response_user.json()["user"]["role"] == "USER"
    assert response_user.json()["permissions"]["multicotizador_spot"] == "Visor"
    print("¡Login USER (Visor) exitoso!")

    print("\n--- 4. Probando Listado de Usuarios ---")
    response_list = client.get("/api/v1/users")
    print(f"Status Code: {response_list.status_code}")
    users = response_list.json()
    print(f"Número de usuarios encontrados: {len(users)}")
    for u in users:
        print(f"- {u['email']} ({u['full_name']}) -> Rol: {u['role']}")
    assert response_list.status_code == 200
    print("¡Recuperación de lista de usuarios y permisos exitosa!")

if __name__ == "__main__":
    try:
        test_login_and_users()
        print("\n=== ¡TODAS LAS PRUEBAS DEL API DE AUTH COMPLETADAS CON ÉXITO! ===")
    except Exception as e:
        print(f"\nOcurrió un fallo en las pruebas: {e}")
