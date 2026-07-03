import sys
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.api.routers.forecast import get_latest_bunker_prices

def test():
    print("Iniciando prueba de lectura de bunker prices (Offline)...")
    res = get_latest_bunker_prices()
    print("=== PRECIOS DE BUNKER DESDE ENDPOINT ===")
    print(res)

if __name__ == "__main__":
    test()
