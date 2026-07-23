import psycopg2
import json
import uuid
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

test_id = str(uuid.uuid4())
test_name = f"TEST_COTIZACION_PROSPECTO_{test_id[:8]}"

quote_payload = {
    "is_multicotizador": True,
    "vessel_id": "MOQUEGUA",
    "vesselParams": {
        "vessel_name": "MOQUEGUA",
        "vessel_speed": 11.0,
        "tce_required": 13000.0,
        "grt": 12000,
        "dwt": 18000,
        "dwcc": 17500,
        "consumption_sea_ifo": 14.0,
        "consumption_idle_ifo": 2.4
    },
    "bunker_price_ifo": 895.14,
    "bunker_price_mdo": 1460.30,
    "addressCommPct": 2.5,
    "brokerCommPct": 1.25,
    "tramos": [
        {
            "origin_port_id": "ILO",
            "destination_port_id": "MARCONA",
            "type": "LADEN",
            "quantity": 13500,
            "freight_rate": 25.50,
            "route_distance": 283.0,
            "weather_factor": 0.03,
            "agency_costs_origin": 31327.99,
            "agency_costs_destination": 40000.00
        },
        {
            "origin_port_id": "MARCONA",
            "destination_port_id": "ILO",
            "type": "BALLAST",
            "quantity": 0,
            "freight_rate": 0,
            "route_distance": 283.0,
            "weather_factor": 0.03,
            "agency_costs_origin": 0,
            "agency_costs_destination": 0
        }
    ]
}

try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()

    print("--- STEP 1: INSERTANDO COTIZACIÓN PRUEBA EN routes_quotes ---")
    insert_query = """
        INSERT INTO routes_quotes (spot_id, name, description, legs_data, pais)
        VALUES (%s, %s, %s, %s, %s);
    """
    cur.execute(insert_query, (test_id, test_name, "Cotización de Prueba en routes_quotes (Armazón + Carne)", json.dumps(quote_payload), "Peru"))
    print(f"✅ Inserción Exitosa en 'routes_quotes' con spot_id = {test_id}")

    print("\n--- STEP 2: CONSULTANDO Y RECUPERANDO COTIZACIÓN DESDE routes_quotes ---")
    select_query = "SELECT spot_id, name, description, legs_data, created_at FROM routes_quotes WHERE spot_id = %s;"
    cur.execute(select_query, (test_id,))
    row = cur.fetchone()

    if row:
        print(f"  • spot_id: {row[0]}")
        print(f"  • name: {row[1]}")
        print(f"  • description: {row[2]}")
        print(f"  • created_at: {row[4]}")
        recovered_legs = row[3]
        print(f"\n📦 LEGS_DATA (JSONB) RECUPERADO DE LA CARNE:")
        print(f"  - Buque: {recovered_legs.get('vessel_id')} (TCE Req: ${recovered_legs['vesselParams']['tce_required']})")
        print(f"  - Precios Bunker: IFO=${recovered_legs.get('bunker_price_ifo')} / MDO=${recovered_legs.get('bunker_price_mdo')}")
        print(f"  - Comisiones: Address {recovered_legs.get('addressCommPct')}% / Broker {recovered_legs.get('brokerCommPct')}%")
        print(f"  - Total Tramos Grabados: {len(recovered_legs.get('tramos', []))} piernas")
        for i, tr in enumerate(recovered_legs.get('tramos', [])):
            print(f"    Pierna #{i+1} [{tr['type']}]: {tr['origin_port_id']} -> {tr['destination_port_id']} | Dist: {tr['route_distance']} NM | Flete: ${tr['freight_rate']} | Costo Puerto Destino: ${tr['agency_costs_destination']}")

    print("\n--- STEP 3: LIMPIEZA DE PRUEBA ---")
    cur.execute("DELETE FROM routes_quotes WHERE spot_id = %s;", (test_id,))
    print("✅ Registro de prueba eliminado de 'routes_quotes'.")

    cur.close()
    conn.close()
    print("\n🎉 PRUEBA DE CONVERGENCIA Y PERSISTENCIA EN routes_quotes FINALIZADA CON 100% ÉXITO.")

except Exception as e:
    print(f"❌ Error en la prueba: {e}")
