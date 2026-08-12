import sys
sys.path.insert(0, r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine')

from backend.models.forecast_models import MultiCotizadorRequest, MultiCotizadorTramo
from backend.api.routers.forecast import calculate_multicotizador

print("=== VERIFICACIÓN MODELO Y BACKEND API (bunker_source) ===")

req = MultiCotizadorRequest(
    client_id="NEXA",
    vessel_id="MOQUEGUA",
    bunker_price_ifo=1100.0,
    bunker_price_mdo=1528.26,
    bunker_source="SOBREESCRITURA",
    tramos=[
        MultiCotizadorTramo(
            origin_port_id="ILO",
            destination_port_id="CALLAO",
            type="BALLAST",
            quantity=0,
            freight_rate=0,
            origin_action="NONE",
            destination_action="CARGAR"
        ),
        MultiCotizadorTramo(
            origin_port_id="CALLAO",
            destination_port_id="MATARANI",
            type="LADEN",
            quantity=13500,
            freight_rate=28.5,
            origin_action="CARGAR",
            destination_action="DESCARGAR"
        ),
        MultiCotizadorTramo(
            origin_port_id="MATARANI",
            destination_port_id="ILO",
            type="BALLAST",
            quantity=0,
            freight_rate=0,
            origin_action="DESCARGAR",
            destination_action="NONE"
        )
    ]
)

print(f"[OK] Modelo MultiCotizadorRequest instanciado con bunker_source: '{req.bunker_source}'")

res = calculate_multicotizador(req)
b_src_res = res.get("consolidated", {}).get("bunker_source")
print(f"[OK] backend/forecast.py calculate_multicotizador ejecutado con éxito")
print(f"[OK] bunker_source retornado en consolidated: '{b_src_res}'")
assert b_src_res == "SOBREESCRITURA", f"Esperado 'SOBREESCRITURA', obtenido: {b_src_res}"
print("=== TODAS LAS PRUEBAS BACKEND APROBADAS [PASS] ===")
