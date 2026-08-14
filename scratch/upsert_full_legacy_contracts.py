import json
import requests

SUPABASE_URL = "https://hjjxooxcpvlvbaxgifbn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

contracts_data = [
    # 1. NEXA CALLAO-MEJILLONES (2025)
    {
        "name": "NEXA.CALLAO.MEJILLONES.CALLAO.2025.V1",
        "client_id": "NEXA",
        "origin_port_id": "CALLAO",
        "destination_port_id": "MEJILLONES",
        "contract_id": "NEXA_2025",
        "valid_from": "2025-01-01",
        "valid_to": "2025-12-31",
        "description": "Contrato Registrado (contracts) - Cliente NEXA",
        "created_by": "izavala@petral.com.pe",
        "legs_data": {
            "is_multicotizador": True,
            "created_by": "izavala@petral.com.pe",
            "bunker_price_ifo": 967.26,
            "bunker_price_mdo": 1528.26,
            "tramos": [
                { "leg": 1, "type": "BALLAST", "origin_port_id": "CALLAO", "destination_port_id": "CALLAO", "quantity": 0, "freight_rate": 0, "route_distance": 0, "weather_factor": 3.0, "speed": 11.0 },
                { "leg": 2, "type": "LADEN", "origin_port_id": "CALLAO", "destination_port_id": "MEJILLONES", "quantity": 13500, "freight_rate": 30.0, "route_distance": 690, "weather_factor": 3.0, "speed": 11.0 },
                { "leg": 3, "type": "BALLAST", "origin_port_id": "MEJILLONES", "destination_port_id": "CALLAO", "quantity": 0, "freight_rate": 0, "route_distance": 690, "weather_factor": 3.0, "speed": 11.0 }
            ],
            "puertosConfig": [
                { "action": "NONE", "quantity": 0, "freight_rate": 0, "op_rate": 0, "time_to_count": 0, "positioning": 0, "manual_port_cost": 0, "muellaje_cost": 0 },
                { "action": "CARGAR", "quantity": 13500, "freight_rate": 0, "op_rate": 500, "time_to_count": 6.0, "positioning": 1.0, "manual_port_cost": 17000, "muellaje_cost": 0 },
                { "action": "DESCARGAR", "quantity": 13500, "freight_rate": 30.0, "op_rate": 600, "time_to_count": 12.0, "positioning": 3.0, "manual_port_cost": 25000, "muellaje_cost": 33333 },
                { "action": "NONE", "quantity": 0, "freight_rate": 0, "op_rate": 0, "time_to_count": 0, "positioning": 0, "manual_port_cost": 0, "muellaje_cost": 0 }
            ],
            "addressCommPct": 2.5,
            "brokerCommPct": 1.25,
            "baf_formula": "BAF = ($IFO * 38.4 + $MDO * 9.5) / 1000",
            "baf_valid_from": "2025-01-01",
            "baf_valid_to": "2025-12-31",
            "baf_ifo_base": 967.26,
            "baf_mdo_base": 1528.26,
            "demurrage_rate": 25000,
            "contract_metadata": {
                "contract_id": "NEXA_2025",
                "client_id": "NEXA",
                "valid_from": "2025-01-01",
                "valid_to": "2025-12-31",
                "validity_years": 1,
                "contract_status": "ACTIVE",
                "baf_formula": "BAF = ($IFO * 38.4 + $MDO * 9.5) / 1000",
                "baf_valid_from": "2025-01-01",
                "baf_valid_to": "2025-12-31",
                "baf_ifo_base": 967.26,
                "baf_mdo_base": 1528.26,
                "demurrage_rate": 25000
            }
        }
    },

    # 2. SPCC ILO-MATARANI (2025)
    {
        "name": "SPCC.ILO.MATARANI.ILO.2025.V1",
        "client_id": "SPCC",
        "origin_port_id": "ILO",
        "destination_port_id": "MATARANI",
        "contract_id": "SPCC_2025",
        "valid_from": "2025-01-01",
        "valid_to": "2025-12-31",
        "description": "Contrato Registrado (contracts) - Cliente SPCC",
        "created_by": "izavala@petral.com.pe",
        "legs_data": {
            "is_multicotizador": True,
            "created_by": "izavala@petral.com.pe",
            "bunker_price_ifo": 967.26,
            "bunker_price_mdo": 1528.26,
            "tramos": [
                { "leg": 1, "type": "BALLAST", "origin_port_id": "ILO", "destination_port_id": "ILO", "quantity": 0, "freight_rate": 0, "route_distance": 0, "weather_factor": 3.0, "speed": 11.0 },
                { "leg": 2, "type": "LADEN", "origin_port_id": "ILO", "destination_port_id": "MATARANI", "quantity": 13500, "freight_rate": 19.01, "route_distance": 69, "weather_factor": 3.0, "speed": 11.0 },
                { "leg": 3, "type": "BALLAST", "origin_port_id": "MATARANI", "destination_port_id": "ILO", "quantity": 0, "freight_rate": 0, "route_distance": 69, "weather_factor": 3.0, "speed": 11.0 }
            ],
            "puertosConfig": [
                { "action": "NONE", "quantity": 0, "freight_rate": 0, "op_rate": 0, "time_to_count": 0, "positioning": 0, "manual_port_cost": 0, "muellaje_cost": 0 },
                { "action": "CARGAR", "quantity": 13500, "freight_rate": 0, "op_rate": 500, "time_to_count": 6.0, "positioning": 1.0, "manual_port_cost": 15000, "muellaje_cost": 0 },
                { "action": "DESCARGAR", "quantity": 13500, "freight_rate": 19.01, "op_rate": 300, "time_to_count": 6.0, "positioning": 0.0, "manual_port_cost": 18000, "muellaje_cost": 0 },
                { "action": "NONE", "quantity": 0, "freight_rate": 0, "op_rate": 0, "time_to_count": 0, "positioning": 0, "manual_port_cost": 0, "muellaje_cost": 0 }
            ],
            "addressCommPct": 0.0,
            "brokerCommPct": 0.0,
            "baf_valid_from": "2025-01-01",
            "baf_valid_to": "2025-12-31",
            "baf_ifo_base": 967.26,
            "baf_mdo_base": 1528.26,
            "tariff_tiers": [
                { "label": "10k-11.5k MT", "min": 10000, "max": 11500, "rate": 20.12 },
                { "label": "11.5k-13k MT", "min": 11501, "max": 13000, "rate": 19.52 },
                { "label": "13k-13.5k MT", "min": 13001, "max": 13500, "rate": 19.01 },
                { "label": "13.6k-14.5k MT", "min": 13600, "max": 14500, "rate": 18.92 }
            ],
            "contract_metadata": {
                "contract_id": "SPCC_2025",
                "client_id": "SPCC",
                "valid_from": "2025-01-01",
                "valid_to": "2025-12-31",
                "validity_years": 1,
                "contract_status": "ACTIVE",
                "baf_valid_from": "2025-01-01",
                "baf_valid_to": "2025-12-31",
                "baf_ifo_base": 967.26,
                "baf_mdo_base": 1528.26,
                "tariff_tiers": [
                    { "label": "10k-11.5k MT", "min": 10000, "max": 11500, "rate": 20.12 },
                    { "label": "11.5k-13k MT", "min": 11501, "max": 13000, "rate": 19.52 },
                    { "label": "13k-13.5k MT", "min": 13001, "max": 13500, "rate": 19.01 },
                    { "label": "13.6k-14.5k MT", "min": 13600, "max": 14500, "rate": 18.92 }
                ]
            }
        }
    },

    # 3. SPCC ILO-MARCONA (2025)
    {
        "name": "SPCC.ILO.MARCONA.ILO.2025.V1",
        "client_id": "SPCC",
        "origin_port_id": "ILO",
        "destination_port_id": "MARCONA",
        "contract_id": "SPCC_2025",
        "valid_from": "2025-01-01",
        "valid_to": "2025-12-31",
        "description": "Contrato Registrado (contracts) - Cliente SPCC",
        "created_by": "izavala@petral.com.pe",
        "legs_data": {
            "is_multicotizador": True,
            "created_by": "izavala@petral.com.pe",
            "bunker_price_ifo": 967.26,
            "bunker_price_mdo": 1528.26,
            "tramos": [
                { "leg": 1, "type": "BALLAST", "origin_port_id": "ILO", "destination_port_id": "ILO", "quantity": 0, "freight_rate": 0, "route_distance": 0, "weather_factor": 3.0, "speed": 11.0 },
                { "leg": 2, "type": "LADEN", "origin_port_id": "ILO", "destination_port_id": "MARCONA", "quantity": 13500, "freight_rate": 22.82, "route_distance": 220, "weather_factor": 3.0, "speed": 11.0 },
                { "leg": 3, "type": "BALLAST", "origin_port_id": "MARCONA", "destination_port_id": "ILO", "quantity": 0, "freight_rate": 0, "route_distance": 220, "weather_factor": 3.0, "speed": 11.0 }
            ],
            "puertosConfig": [
                { "action": "NONE", "quantity": 0, "freight_rate": 0, "op_rate": 0, "time_to_count": 0, "positioning": 0, "manual_port_cost": 0, "muellaje_cost": 0 },
                { "action": "CARGAR", "quantity": 13500, "freight_rate": 0, "op_rate": 500, "time_to_count": 6.0, "positioning": 1.0, "manual_port_cost": 15000, "muellaje_cost": 0 },
                { "action": "DESCARGAR", "quantity": 13500, "freight_rate": 22.82, "op_rate": 345, "time_to_count": 6.0, "positioning": 0.0, "manual_port_cost": 16000, "muellaje_cost": 0 },
                { "action": "NONE", "quantity": 0, "freight_rate": 0, "op_rate": 0, "time_to_count": 0, "positioning": 0, "manual_port_cost": 0, "muellaje_cost": 0 }
            ],
            "addressCommPct": 0.0,
            "brokerCommPct": 0.0,
            "baf_valid_from": "2025-01-01",
            "baf_valid_to": "2025-12-31",
            "baf_ifo_base": 967.26,
            "baf_mdo_base": 1528.26,
            "tariff_tiers": [
                { "label": "10k-11.5k MT", "min": 10000, "max": 11500, "rate": 25.87 },
                { "label": "11.5k-13k MT", "min": 11501, "max": 13000, "rate": 23.12 },
                { "label": "13k-13.5k MT", "min": 13001, "max": 13500, "rate": 22.82 },
                { "label": "13.6k-14.5k MT", "min": 13600, "max": 14500, "rate": 21.77 }
            ],
            "contract_metadata": {
                "contract_id": "SPCC_2025",
                "client_id": "SPCC",
                "valid_from": "2025-01-01",
                "valid_to": "2025-12-31",
                "validity_years": 1,
                "contract_status": "ACTIVE",
                "baf_valid_from": "2025-01-01",
                "baf_valid_to": "2025-12-31",
                "baf_ifo_base": 967.26,
                "baf_mdo_base": 1528.26,
                "tariff_tiers": [
                    { "label": "10k-11.5k MT", "min": 10000, "max": 11500, "rate": 25.87 },
                    { "label": "11.5k-13k MT", "min": 11501, "max": 13000, "rate": 23.12 },
                    { "label": "13k-13.5k MT", "min": 13001, "max": 13500, "rate": 22.82 },
                    { "label": "13.6k-14.5k MT", "min": 13600, "max": 14500, "rate": 21.77 }
                ]
            }
        }
    },

    # 4. SPCC ILO-MEJILLONES (2025)
    {
        "name": "SPCC.ILO.MEJILLONES.ILO.2025.V1",
        "client_id": "SPCC",
        "origin_port_id": "ILO",
        "destination_port_id": "MEJILLONES",
        "contract_id": "SPCC_2025",
        "valid_from": "2025-01-01",
        "valid_to": "2025-12-31",
        "description": "Contrato Registrado (contracts) - Cliente SPCC",
        "created_by": "izavala@petral.com.pe",
        "legs_data": {
            "is_multicotizador": True,
            "created_by": "izavala@petral.com.pe",
            "bunker_price_ifo": 967.26,
            "bunker_price_mdo": 1528.26,
            "tramos": [
                { "leg": 1, "type": "BALLAST", "origin_port_id": "ILO", "destination_port_id": "ILO", "quantity": 0, "freight_rate": 0, "route_distance": 0, "weather_factor": 3.0, "speed": 11.0 },
                { "leg": 2, "type": "LADEN", "origin_port_id": "ILO", "destination_port_id": "MEJILLONES", "quantity": 13500, "freight_rate": 20.87, "route_distance": 230, "weather_factor": 3.0, "speed": 11.0 },
                { "leg": 3, "type": "BALLAST", "origin_port_id": "MEJILLONES", "destination_port_id": "ILO", "quantity": 0, "freight_rate": 0, "route_distance": 230, "weather_factor": 3.0, "speed": 11.0 }
            ],
            "puertosConfig": [
                { "action": "NONE", "quantity": 0, "freight_rate": 0, "op_rate": 0, "time_to_count": 0, "positioning": 0, "manual_port_cost": 0, "muellaje_cost": 0 },
                { "action": "CARGAR", "quantity": 13500, "freight_rate": 0, "op_rate": 500, "time_to_count": 6.0, "positioning": 1.0, "manual_port_cost": 15000, "muellaje_cost": 0 },
                { "action": "DESCARGAR", "quantity": 13500, "freight_rate": 20.87, "op_rate": 350, "time_to_count": 6.0, "positioning": 0.0, "manual_port_cost": 25000, "muellaje_cost": 33333 },
                { "action": "NONE", "quantity": 0, "freight_rate": 0, "op_rate": 0, "time_to_count": 0, "positioning": 0, "manual_port_cost": 0, "muellaje_cost": 0 }
            ],
            "addressCommPct": 0.0,
            "brokerCommPct": 0.0,
            "baf_valid_from": "2025-01-01",
            "baf_valid_to": "2025-12-31",
            "baf_ifo_base": 967.26,
            "baf_mdo_base": 1528.26,
            "tariff_tiers": [
                { "label": "10k-11.5k MT", "min": 10000, "max": 11500, "rate": 23.23 },
                { "label": "11.5k-13k MT", "min": 11501, "max": 13000, "rate": 21.87 },
                { "label": "13k-13.5k MT", "min": 13001, "max": 13500, "rate": 20.87 },
                { "label": "13.6k-14.5k MT", "min": 13600, "max": 14500, "rate": 20.67 }
            ],
            "contract_metadata": {
                "contract_id": "SPCC_2025",
                "client_id": "SPCC",
                "valid_from": "2025-01-01",
                "valid_to": "2025-12-31",
                "validity_years": 1,
                "contract_status": "ACTIVE",
                "baf_valid_from": "2025-01-01",
                "baf_valid_to": "2025-12-31",
                "baf_ifo_base": 967.26,
                "baf_mdo_base": 1528.26,
                "tariff_tiers": [
                    { "label": "10k-11.5k MT", "min": 10000, "max": 11500, "rate": 23.23 },
                    { "label": "11.5k-13k MT", "min": 11501, "max": 13000, "rate": 21.87 },
                    { "label": "13k-13.5k MT", "min": 13001, "max": 13500, "rate": 20.87 },
                    { "label": "13.6k-14.5k MT", "min": 13600, "max": 14500, "rate": 20.67 }
                ]
            }
        }
    },

    # 5. NEXA CALLAO-MATARANI (2027)
    {
        "name": "NEXA.CALLAO.MATARANI.CALLAO.2027.V1",
        "client_id": "NEXA",
        "origin_port_id": "CALLAO",
        "destination_port_id": "MATARANI",
        "contract_id": "NEXA_2025",
        "valid_from": "2027-01-01",
        "valid_to": "2027-12-12",
        "description": "Contrato Registrado (contracts) - Cliente NEXA",
        "created_by": "izavala@petral.com.pe",
        "legs_data": {
            "is_multicotizador": True,
            "created_by": "izavala@petral.com.pe",
            "bunker_price_ifo": 1100.0,
            "bunker_price_mdo": 1700.0,
            "tramos": [
                { "leg": 1, "type": "BALLAST", "origin_port_id": "CALLAO", "destination_port_id": "CALLAO", "quantity": 0, "freight_rate": 0, "route_distance": 0, "weather_factor": 3.0, "speed": 11.0 },
                { "leg": 2, "type": "LADEN", "origin_port_id": "CALLAO", "destination_port_id": "MATARANI", "quantity": 1100, "freight_rate": 30.0, "route_distance": 457, "weather_factor": 3.0, "speed": 11.0 },
                { "leg": 3, "type": "BALLAST", "origin_port_id": "MATARANI", "destination_port_id": "CALLAO", "quantity": 0, "freight_rate": 0, "route_distance": 457, "weather_factor": 3.0, "speed": 11.0 }
            ],
            "puertosConfig": [
                { "action": "NONE", "quantity": 0, "freight_rate": 0, "op_rate": 0, "time_to_count": 0, "positioning": 0, "manual_port_cost": 0, "muellaje_cost": 0 },
                { "action": "CARGAR", "quantity": 1100, "freight_rate": 0, "op_rate": 500, "time_to_count": 6.0, "positioning": 1.0, "manual_port_cost": 17000, "muellaje_cost": 0 },
                { "action": "DESCARGAR", "quantity": 1100, "freight_rate": 30.0, "op_rate": 400, "time_to_count": 6.0, "positioning": 0.0, "manual_port_cost": 18000, "muellaje_cost": 0 },
                { "action": "NONE", "quantity": 0, "freight_rate": 0, "op_rate": 0, "time_to_count": 0, "positioning": 0, "manual_port_cost": 0, "muellaje_cost": 0 }
            ],
            "addressCommPct": 0.0,
            "brokerCommPct": 0.0,
            "baf_valid_from": "2027-01-01",
            "baf_valid_to": "2027-12-12",
            "baf_ifo_base": 1100.0,
            "baf_mdo_base": 1700.0,
            "demurrage_rates": {
                "HUEMUL": 25000.0,
                "MOQUEGUA": 25000.0,
                "TABLONES": 25000.0,
                "CONCON_TRADER": 25000.0
            },
            "contract_metadata": {
                "contract_id": "NEXA_2025",
                "client_id": "NEXA",
                "valid_from": "2027-01-01",
                "valid_to": "2027-12-12",
                "validity_years": 1,
                "contract_status": "ACTIVE",
                "baf_valid_from": "2027-01-01",
                "baf_valid_to": "2027-12-12",
                "baf_ifo_base": 1100.0,
                "baf_mdo_base": 1700.0,
                "demurrage_rates": {
                    "HUEMUL": 25000.0,
                    "MOQUEGUA": 25000.0,
                    "TABLONES": 25000.0,
                    "CONCON_TRADER": 25000.0
                }
            }
        }
    }
]

def run_direct_upsert():
    print("Conectando directamente a la API REST de Supabase...")
    # 1. Obtener todos los contratos existentes
    res = requests.get(f"{SUPABASE_URL}/rest/v1/contracts?select=*", headers=headers)
    existing_rows = res.json() if res.status_code == 200 else []
    print(f"Filas actuales en tabla 'contracts': {len(existing_rows)}")

    # 2. Insertar / Actualizar las 5 rutas contractuales del multicotizador
    success = 0
    for c in contracts_data:
        client_id = c["client_id"]
        orig = c["origin_port_id"]
        dest = c["destination_port_id"]

        # Verificar si ya existe esa ruta por client_id + origin + dest
        check_res = requests.get(f"{SUPABASE_URL}/rest/v1/contracts?client_id=eq.{client_id}&origin_port_id=eq.{orig}&destination_port_id=eq.{dest}", headers=headers)
        matched = check_res.json() if check_res.status_code == 200 else []

        if matched and len(matched) > 0:
            target_cid = matched[0].get("contract_id") or matched[0].get("name")
            print(f"  Actualizando contrato key {target_cid} ({c['name']})...")
            upd_res = requests.patch(f"{SUPABASE_URL}/rest/v1/contracts?client_id=eq.{client_id}&origin_port_id=eq.{orig}&destination_port_id=eq.{dest}", headers=headers, json=c)
            if upd_res.status_code in (200, 204):
                print(f"    [OK] Actualizado exitosamente: {c['name']}")
                success += 1
            else:
                print(f"    [ERROR] {upd_res.status_code}: {upd_res.text}")
        else:
            print(f"  Insertando nuevo contrato ({c['name']})...")
            ins_res = requests.post(f"{SUPABASE_URL}/rest/v1/contracts", headers=headers, json=c)
            if ins_res.status_code in (200, 201):
                print(f"    [OK] Insertado exitosamente: {c['name']}")
                success += 1
            else:
                print(f"    [ERROR] {ins_res.status_code}: {ins_res.text}")

    print(f"\nFinalizado: {success}/{len(contracts_data)} contratos del Multicotizador guardados en Supabase.")

if __name__ == "__main__":
    run_direct_upsert()
