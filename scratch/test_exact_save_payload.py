import sys
import os

sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase
from backend.api.routers.forecast import SpotSaveRequest, save_spot_voyage

sb = get_supabase()

# Test 1: Real payload from Multicotizador (with validFrom and validTo empty vs valid dates)
name = "NEXA.ILO.CALLAO.MATARANI.ILO.2026.18.06.RG.HOY"

test_payload = SpotSaveRequest(
    name=name,
    description="Cotización Spot",
    pais="PE",
    is_prospect=False,
    is_contract=False,
    client_id="NEXA",
    created_by="izavala@petral.com.pe",
    legs_data={
        "is_multicotizador": True,
        "created_by": "izavala@petral.com.pe",
        "vessel_id": "SANTA SOFIA",
        "bunker_price_ifo": 645.5,
        "bunker_price_mdo": 850.75,
        "tramos": [
            {"type": "BALLAST", "origin_port_id": "ILO", "destination_port_id": "CALLAO", "route_distance": 450, "speed": 11},
            {"type": "LADEN", "origin_port_id": "CALLAO", "destination_port_id": "MATARANI", "route_distance": 520, "speed": 11}
        ],
        "puertosConfig": [
            {"action": "CARGAR", "quantity": 10000, "freight_rate": 30.5},
            {"action": "DESCARGAR", "quantity": 10000, "freight_rate": 30.5}
        ],
        "vesselParams": {"dwt": 38000, "grt": 24000},
        "contract_metadata": {
            "client_id": "NEXA",
            "valid_from": "2026-08-18",
            "valid_to": "2027-08-18",
            "validity_years": 1
        }
    }
)

try:
    print("Testing save_spot_voyage with realistic payload...")
    res = save_spot_voyage(test_payload)
    print("SUCCESS:", res)
except Exception as e:
    import traceback
    print("ERROR CAUGHT:")
    print(str(e))
    traceback.print_exc()
