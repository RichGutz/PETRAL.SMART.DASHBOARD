import os
import sys
import json
import psycopg2
from dotenv import load_dotenv

engine_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine"
if engine_dir not in sys.path:
    sys.path.insert(0, engine_dir)

from backend.models.forecast_models import ForecastRequest
from backend.services.forecast_service import run_forecast_simulation

env_path = os.path.join(engine_dir, ".env")
load_dotenv(env_path)

db_password = os.getenv("SUPABASE_DB_PASSWORD")
host = "aws-1-us-east-2.pooler.supabase.com"
port = 6543
dbname = "postgres"
user = "postgres.hjjxooxcpvlvbaxgifbn"

print("======================================================================")
print(" INICIANDO PROTOCOLO DE AUDITORIA Y CONTROL DE CALIDAD TRIANGULAR")
print("======================================================================")

# 1. Definir Líneas de Proyección para Escenario QC 2027 con MOQUEGUA y TABLONES
projection_lines = []

# Meses 2027-01 a 2027-12
months_2027 = [f"2027-{str(m).zfill(2)}" for m in range(1, 13)]

for m in months_2027:
    # Línea 1: NEXA con MOQUEGUA (Callao-Mejillones)
    projection_lines.append({
        "month_index": m,
        "client_id": "NEXA",
        "origin_port_id": "CALLAO",
        "destination_port_id": "MEJILLONES",
        "vessel_id": "MOQUEGUA",
        "quantity": 15000,
        "monthly_frequency": 1,
        "custom_tariff": 25.0,
        "quote_id": "NEXA.ILO.CALLAO.MEJILLONES.ILO"
    })
    # Línea 2: SPCC con TABLONES (Ilo-Matarani-Ilo)
    projection_lines.append({
        "month_index": m,
        "client_id": "SPCC",
        "origin_port_id": "ILO",
        "destination_port_id": "MATARANI",
        "vessel_id": "TABLONES",
        "quantity": 13500,
        "monthly_frequency": 1,
        "custom_tariff": 25.5,
        "quote_id": "SPCC.ILO.MATARANI.ILO"
    })

print(f"\n1. Lineas de Proyeccion Construidas ({len(projection_lines)} lineas total en 2027).")

# 2. Ejecutar Simulación Física-Comercial en Backend
req = ForecastRequest(
    start_date="2027-01-01",
    end_date="2027-12-31",
    port_cost_mode="static",
    projection_lines=projection_lines
)

print("2. Calculando Simulacion en Backend Engine...")
res = run_forecast_simulation(req)
agg = res.get("aggregated_data", {})

print("\n--- MATRIZ DE RESULTADOS TRIANGULAR (UI <-> ENGINE) ---")
for client, r_map in agg.items():
    for route, v_map in r_map.items():
        for vessel, m_map in v_map.items():
            first_m = list(m_map.keys())[0]
            val = m_map[first_m]
            print(f"  * Cliente: {client:<5} | Ruta: {route:<18} | Buque: {vessel:<8} | Gross: ${val['net_income']:>10,.2f} | Port: ${val['total_port_costs']:>9,.2f} | Bunker: ${val['total_bunker_costs']:>9,.2f} | PnL: ${val['voyage_result']:>10,.2f}")

# 3. Guardar Escenario Oficial en Supabase
conn = psycopg2.connect(
    host=host,
    port=port,
    dbname=dbname,
    user=user,
    password=db_password
)
cur = conn.cursor()

scenario_name = "ESCENARIO.QC.TRIANGULAR.2027"
scenario_user = "Rich.Gutz"
start_date = "2027-01-01"
end_date = "2027-12-31"

cur.execute("SELECT id FROM commercial_forecasts WHERE name = %s;", (scenario_name,))
row = cur.fetchone()

if row:
    sc_id = row[0]
    cur.execute("""
        UPDATE commercial_forecasts 
        SET projection_lines = %s, start_date = %s, end_date = %s, updated_at = NOW()
        WHERE id = %s;
    """, (json.dumps(projection_lines), start_date, end_date, sc_id))
    print(f"\n3. Escenario existente '{scenario_name}' actualizado exitosamente en Supabase (ID: {sc_id}).")
else:
    cur.execute("""
        INSERT INTO commercial_forecasts (name, user_id, start_date, end_date, projection_lines)
        VALUES (%s, %s, %s, %s, %s) RETURNING id;
    """, (scenario_name, scenario_user, start_date, end_date, json.dumps(projection_lines)))
    sc_id = cur.fetchone()[0]
    print(f"\n3. Nuevo escenario '{scenario_name}' registrado exitosamente en Supabase (ID: {sc_id}).")

conn.commit()
cur.close()
conn.close()

# 4. Crear Dump de Verificación
dump_payload = {
    "scenario_id": sc_id,
    "scenario_name": scenario_name,
    "user_id": scenario_user,
    "start_date": start_date,
    "end_date": end_date,
    "total_projection_lines": len(projection_lines),
    "simulation_summary": agg,
    "projection_lines": projection_lines
}

dump_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\scratch\dump_escenario_qc_triangular.json"
with open(dump_path, "w", encoding="utf-8") as f:
    json.dump(dump_payload, f, indent=2)

print(f"\n4. Dump de verificacion guardado en: {dump_path}")
print("======================================================================")
print(" PROTOCOLO TRIANGULAR COMPLETADO EXITOSAMENTE")
print("======================================================================")
