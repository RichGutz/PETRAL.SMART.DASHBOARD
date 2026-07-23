import sys
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def main():
    print("=" * 80)
    print(" ⚓ SEMBRANDO VALORES OFICIALES EN port_cost_static (MODELO ESTÁTICO)")
    print("=" * 80)

    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Limpiar registros antiguos en port_cost_static
    cur.execute("DELETE FROM port_cost_static;")
    print("   ✅ Tabla port_cost_static limpiada.")

    # 2. Datos Oficiales de la Experta por Puerto, Operación y Buque
    static_records = [
        # --- CALLAO (APM) ---
        {"port_id": "CALLAO", "operation_type": "DESCARGA", "vessel_id": "MOQUEGUA", "cost": 14938.34, "sub_operation_type": "MAIN"},
        {"port_id": "CALLAO", "operation_type": "DESCARGA", "vessel_id": "TABLONES", "cost": 16846.50, "sub_operation_type": "MAIN"},
        {"port_id": "CALLAO", "operation_type": "DESCARGA", "vessel_id": "HUEMUL", "cost": 18859.60, "sub_operation_type": "MAIN"},
        {"port_id": "CALLAO", "operation_type": "DESCARGA", "vessel_id": "CONCON_TRADER", "cost": 17049.30, "sub_operation_type": "MAIN"},

        # --- MATARANI (Tisur) ---
        {"port_id": "MATARANI", "operation_type": "CARGA", "vessel_id": "MOQUEGUA", "cost": 15364.50, "sub_operation_type": "MAIN"},
        {"port_id": "MATARANI", "operation_type": "CARGA", "vessel_id": "TABLONES", "cost": 17105.00, "sub_operation_type": "MAIN"},
        {"port_id": "MATARANI", "operation_type": "CARGA", "vessel_id": "HUEMUL", "cost": 19200.00, "sub_operation_type": "MAIN"},
        {"port_id": "MATARANI", "operation_type": "CARGA", "vessel_id": "CONCON_TRADER", "cost": 17350.00, "sub_operation_type": "MAIN"},

        # --- SAN JUAN DE MARCONA (SPCC) ---
        {"port_id": "MARCONA", "operation_type": "CARGA", "vessel_id": "MOQUEGUA", "cost": 36000.00, "sub_operation_type": "MAIN"},
        {"port_id": "MARCONA", "operation_type": "CARGA", "vessel_id": "TABLONES", "cost": 36000.00, "sub_operation_type": "MAIN"},
        {"port_id": "MARCONA", "operation_type": "CARGA", "vessel_id": "HUEMUL", "cost": 36000.00, "sub_operation_type": "MAIN"},
        {"port_id": "MARCONA", "operation_type": "CARGA", "vessel_id": "CONCON_TRADER", "cost": 36000.00, "sub_operation_type": "MAIN"},

        # --- ILO (Enapu / SPCC) ---
        {"port_id": "ILO", "operation_type": "CARGA", "vessel_id": "MOQUEGUA", "cost": 21797.39, "sub_operation_type": "MAIN"},
        {"port_id": "ILO", "operation_type": "CARGA", "vessel_id": "TABLONES", "cost": 24011.59, "sub_operation_type": "MAIN"},
        {"port_id": "ILO", "operation_type": "CARGA", "vessel_id": "HUEMUL", "cost": 26542.60, "sub_operation_type": "MAIN"},
        {"port_id": "ILO", "operation_type": "CARGA", "vessel_id": "CONCON_TRADER", "cost": 24493.30, "sub_operation_type": "MAIN"},
    ]

    print("\n2. Insertando liquidaciones oficiales de la experta...")
    for rec in static_records:
        cur.execute("""
            INSERT INTO port_cost_static (
                port_id, operation_type, vessel_id, cost, sub_operation_type, terminal_id, updated_by
            ) VALUES (%s, %s, %s, %s, %s, 'GENERAL', 'EXPERTA_2026')
            ON CONFLICT DO NOTHING;
        """, (
            rec["port_id"], rec["operation_type"], rec["vessel_id"],
            rec["cost"], rec["sub_operation_type"]
        ))
        print(f"   ✅ {rec['port_id']} [{rec['operation_type']}] - {rec['vessel_id']} = ${rec['cost']:,.2f} USD")

    print("\n" + "=" * 80)
    print(" 🎉 port_cost_static SEMBRADO CON ÉXITO Y 100% ALINEADO A LA EXPERTA")
    print("=" * 80)

if __name__ == "__main__":
    main()
