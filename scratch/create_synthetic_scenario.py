import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def create_synthetic_scenario():
    print("=" * 115)
    print("   🚀 CREANDO ESCENARIO SINTETICO DE PRUEBA: 'SINTETICO' (60 VIAJES, 2 BUQUES)")
    print("=" * 115)

    months = [f"2027-{m:02d}" for m in range(1, 13)]
    
    # Distribución mensual de 60 viajes entre MOQUEGUA y TABLONES
    # MOQUEGUA (30 viajes totales: 8 Matarani, 10 Marcona, 12 Mejillones)
    # TABLONES (30 viajes totales: 6 Matarani, 10 Marcona, 14 Barquito)

    moquegua_matarani_freq = [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0] # 8 v
    moquegua_marcona_freq  = [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1] # 10 v
    moquegua_mejill_freq   = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] # 12 v

    tablones_matarani_freq = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] # 6 v
    tablones_marcona_freq  = [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1] # 10 v
    tablones_barquito_freq = [1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1] # 14 v

    projection_lines = []

    # 1. Rutas MOQUEGUA (Full Load 13,500 MT)
    for idx, m in enumerate(months):
        projection_lines.append({
            "month_index": m,
            "client_id": "SPCC",
            "origin_port_id": "ILO",
            "destination_port_id": "MATARANI",
            "vessel_id": "MOQUEGUA",
            "quantity": 13500,
            "monthly_frequency": moquegua_matarani_freq[idx],
            "custom_tariff": 19.29,
            "quote_id": "SPCC.ILO.ILO.MATARANI.ILO.2025-2027 COA MOQUEGUA"
        })
        projection_lines.append({
            "month_index": m,
            "client_id": "SPCC",
            "origin_port_id": "ILO",
            "destination_port_id": "MARCONA",
            "vessel_id": "MOQUEGUA",
            "quantity": 13500,
            "monthly_frequency": moquegua_marcona_freq[idx],
            "custom_tariff": 23.10,
            "quote_id": "SPCC.ILO.ILO.MARCONA.ILO.2025-2027 COA MOQUEGUA"
        })
        projection_lines.append({
            "month_index": m,
            "client_id": "SPCC",
            "origin_port_id": "ILO",
            "destination_port_id": "MEJILLONES",
            "vessel_id": "MOQUEGUA",
            "quantity": 13500,
            "monthly_frequency": moquegua_mejill_freq[idx],
            "custom_tariff": 21.15,
            "quote_id": "SPCC.ILO.MEJILLONES.ILO.2025-2027 COA MOQUEGUA"
        })

    # 2. Rutas TABLONES (Full Load 3,000 MT)
    for idx, m in enumerate(months):
        projection_lines.append({
            "month_index": m,
            "client_id": "SPCC",
            "origin_port_id": "ILO",
            "destination_port_id": "MATARANI",
            "vessel_id": "TABLONES",
            "quantity": 3000,
            "monthly_frequency": tablones_matarani_freq[idx],
            "custom_tariff": 19.29,
            "quote_id": "SPCC.ILO.MATARANI.ILO.DM 2026 TABLONES"
        })
        projection_lines.append({
            "month_index": m,
            "client_id": "SPCC",
            "origin_port_id": "ILO",
            "destination_port_id": "MARCONA",
            "vessel_id": "TABLONES",
            "quantity": 3000,
            "monthly_frequency": tablones_marcona_freq[idx],
            "custom_tariff": 23.10,
            "quote_id": "SPCC.ILO.ILO.MARCONA.ILO.2025-2027 COA TABLONES"
        })
        projection_lines.append({
            "month_index": m,
            "client_id": "SPCC",
            "origin_port_id": "ILO",
            "destination_port_id": "BARQUITO",
            "vessel_id": "TABLONES",
            "quantity": 3000,
            "monthly_frequency": tablones_barquito_freq[idx],
            "custom_tariff": 26.50,
            "quote_id": "SPCC.ILO.ILO.BARQUITO.ILO.2025-2027 COA TABLONES"
        })

    tot_freq = sum(l["monthly_frequency"] for l in projection_lines)
    tot_vol = sum(l["quantity"] * l["monthly_frequency"] for l in projection_lines)

    print(f"Líneas de proyección generadas: {len(projection_lines)}")
    print(f"Total Viajes Verificados: {tot_freq} viajes (Meta = 60)")
    print(f"Total Volumen Proyectado: {tot_vol:,.0f} MT")

    # Guardar en Backend / Supabase
    save_payload = json.dumps({
        "name": "SINTETICO",
        "user_id": "izavala@petral.com.pe",
        "start_date": "2027-01",
        "end_date": "2027-12",
        "projection_lines": projection_lines
    }).encode("utf-8")

    url_save = "https://forecast.geeksoft.tech/api/v1/forecast/save"
    req = urllib.request.Request(url_save, data=save_payload, headers={"Content-Type": "application/json"})

    with urllib.request.urlopen(req, timeout=15) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print("\n✅ Escenario guardado con éxito:", res)

    return res

if __name__ == "__main__":
    create_synthetic_scenario()
