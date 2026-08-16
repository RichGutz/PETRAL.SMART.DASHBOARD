import requests
import json
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "https://forecast.geeksoft.tech/api/v1"

def run_full_qc_loop():
    print("=" * 80)
    print(" === EJECUTANDO LOOP QC TRIANGULAR EXPANDIDO (END-TO-END) ===")
    print("=" * 80)

    # 1. Obtener puertos y rutas spot desde backend
    ports = requests.get(f"{BASE_URL}/forecast/ports").json()
    spots = requests.get(f"{BASE_URL}/forecast/spots").json()
    print(f"[+] Puertos cargados: {len(ports)} | Rutas Spot cargadas: {len(spots)}")

    # 2. Definir 24 líneas de proyección oficiales de 2027 (12 meses para MOQUEGUA, 12 meses para TABLONES)
    projection_lines = []

    months_2027 = [f"2027-{str(m).zfill(2)}" for m in range(1, 13)]

    # Línea A: MOQUEGUA en CALLAO-MEJILLONES (NEXA)
    for m in months_2027:
        projection_lines.append({
            "client_id": "NEXA",
            "origin_port_id": "CALLAO",
            "destination_port_id": "MEJILLONES",
            "vessel_id": "MOQUEGUA",
            "route_id": "CALLAO-MEJILLONES",
            "month_index": m,
            "monthly_frequency": 1,
            "quantity": 15000,
            "custom_tariff": 25.0
        })

    # Línea B: TABLONES en ILO-MATARANI (SPCC)
    for m in months_2027:
        projection_lines.append({
            "client_id": "SPCC",
            "origin_port_id": "ILO",
            "destination_port_id": "MATARANI",
            "vessel_id": "TABLONES",
            "route_id": "ILO-MATARANI",
            "month_index": m,
            "monthly_frequency": 1,
            "quantity": 13500,
            "custom_tariff": 22.0
        })

    # 3. Correr simulación en backend FastAPI (/forecast/run)
    payload = {
        "start_date": "2027-01-01",
        "end_date": "2027-12-31",
        "projection_lines": projection_lines,
        "port_cost_mode": "static"
    }

    print("\n[+] Enviando simulación a /forecast/run...")
    sim_res = requests.post(f"{BASE_URL}/forecast/run", json=payload).json()
    
    agg = sim_res.get("aggregated_data", {})
    summary = sim_res.get("summary", {})
    print(f"[✓] Simulación completada. Clientes en data.aggregated_data: {list(agg.keys())}")

    # 4. Guardar escenario oficial ESCENARIO.QC.TRIANGULAR.2027
    save_payload = {
        "id": "513f2ea9-0aa4-4ee6-b420-22820e477245",
        "name": "ESCENARIO.QC.TRIANGULAR.2027",
        "user_id": "QC_AGENT",
        "start_date": "2027-01-01",
        "end_date": "2027-12-31",
        "projection_lines": projection_lines
    }
    save_res = requests.post(f"{BASE_URL}/forecast/save", json=save_payload).json()
    scenario_id = save_res.get("id")
    print(f"[✓] Escenario oficial guardado en Supabase ID: {scenario_id}")

    # 5. Cargar escenario guardado desde Supabase
    loaded = requests.get(f"{BASE_URL}/forecast/load/{scenario_id}").json()
    print(f"[✓] Escenario cargado de Supabase exitosamente: {loaded.get('name')}")

    # 6. Validar datos en ANGRAF y Spaghetti Map
    # Verificar si aggregated_data es directamente consumible por InteractiveChart y SpaghettiMap
    moquegua_data = agg.get("NEXA", {}).get("CALLAO-MEJILLONES", {}).get("MOQUEGUA", {})
    tablones_data = agg.get("SPCC", {}).get("ILO-MATARANI", {}).get("TABLONES", {})

    print("\n" + "=" * 80)
    print(" === MATRIZ DE AUDITORÍA QC TRIANGULAR (ESPEJO) ===")
    print("=" * 80)
    
    m_ene = moquegua_data.get("2027-01", {})
    t_ene = tablones_data.get("2027-01", {})

    print(f"MOQUEGUA (NEXA CALLAO-MEJILLONES 2027-01):")
    print(f"  • Gross Revenue: ${m_ene.get('gross_revenue', 0):,.2f}")
    print(f"  • Port Costs:    ${m_ene.get('total_port_costs', 0):,.2f}")
    print(f"  • Bunker Costs:  ${m_ene.get('total_bunker_costs', 0):,.2f}")
    print(f"  • Net PnL Target: ${m_ene.get('voyage_result', 0):,.2f}")

    print(f"\nTABLONES (SPCC ILO-MATARANI 2027-01):")
    print(f"  • Gross Revenue: ${t_ene.get('gross_revenue', 0):,.2f}")
    print(f"  • Port Costs:    ${t_ene.get('total_port_costs', 0):,.2f}")
    print(f"  • Bunker Costs:  ${t_ene.get('total_bunker_costs', 0):,.2f}")
    print(f"  • Net PnL Target: ${t_ene.get('voyage_result', 0):,.2f}")

    # Guardar dump JSON
    with open("scratch/dump_escenario_qc_triangular.json", "w") as f:
        json.dump({
            "scenario_id": scenario_id,
            "scenario_name": "ESCENARIO.QC.TRIANGULAR.2027",
            "summary": summary,
            "aggregated_keys": list(agg.keys())
        }, f, indent=2)

if __name__ == "__main__":
    run_full_qc_loop()
