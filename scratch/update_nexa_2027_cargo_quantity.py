import psycopg2
import json

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def update_cargo():
    print("Actualizando tonelaje de carga para NEXA.CALLAO.MATARANI.CALLAO.2027.V1 de 1,100 MT a 13,500 MT...")
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # 1. Buscar la ruta en contracts
    cur.execute("SELECT contract_id, legs_data FROM public.contracts WHERE name = 'NEXA.CALLAO.MATARANI.CALLAO.2027.V1';")
    row = cur.fetchone()
    
    if not row:
        print("  [ERROR] No se encontró el contrato NEXA.CALLAO.MATARANI.CALLAO.2027.V1 en la DB.")
        cur.close()
        conn.close()
        return

    contract_id, legs_data = row
    if not isinstance(legs_data, dict):
        legs_data = {}

    tramos = legs_data.get("tramos") or []
    for t in tramos:
        if t.get("type") == "LADEN":
            t["quantity"] = 13500

    legs_data["tramos"] = tramos

    # 2. Actualizar en Supabase DB
    cur.execute("""
        UPDATE public.contracts
        SET legs_data = %s
        WHERE contract_id = %s OR name = 'NEXA.CALLAO.MATARANI.CALLAO.2027.V1';
    """, (psycopg2.extras.Json(legs_data), contract_id))
    
    conn.commit()
    print("  [EXITO] Tonelaje actualizado a 13,500 MT en la base de datos.")
    cur.close()
    conn.close()

if __name__ == "__main__":
    import psycopg2.extras
    update_cargo()
