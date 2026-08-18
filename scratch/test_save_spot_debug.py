import sys
import os
import json

# Agregar el directorio raíz del proyecto al sys.path
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase
from backend.api.routers.forecast import SpotSaveRequest, save_spot_voyage

try:
    sb = get_supabase()
    print("Supabase connection established.")
    
    # Crear un request de prueba idéntico al payload enviado desde el frontend
    req = SpotSaveRequest(
        name="NEXA.ILO.CALLAO.MATARANI.ILO.2026.18.06.RG.HOY",
        description="Cotización Spot",
        pais="PE",
        is_prospect=False,
        is_contract=False,
        client_id="NEXA",
        created_by="izavala@petral.com.pe",
        legs_data={
            "is_multicotizador": True,
            "vessel_id": "SANTA SOFIA",
            "bunker_price_ifo": 645.5,
            "bunker_price_mdo": 850.75,
            "tramos": [],
            "puertosConfig": [],
            "vesselParams": {}
        }
    )
    
    print("Attempting to call save_spot_voyage...")
    res = save_spot_voyage(req)
    print("Result:", res)
except Exception as e:
    import traceback
    print("EXCEPTION CAUGHT:")
    print(str(e))
    traceback.print_exc()
