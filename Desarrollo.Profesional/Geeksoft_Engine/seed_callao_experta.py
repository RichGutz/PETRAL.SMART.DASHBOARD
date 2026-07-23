import sys
import json
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def main():
    print("=" * 80)
    print(" ⚓ SEMBRANDO MATRIZ DE COSTOS DINÁMICOS DE CALLAO (REGLAS EXPERTA 2026)")
    print("=" * 80)

    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Asegurar catálogo en port_cost_concepts
    concepts = [
        ("Pilotage_IN", "Practicaje Ingreso", "shifting", "FIXED"),
        ("Pilotage_OUT", "Practicaje Salida", "shifting", "FIXED"),
        ("Towage_IN", "Remolcaje Ingreso", "shifting", "FIXED"),
        ("Towage_OUT", "Remolcaje Salida", "shifting", "FIXED"),
        ("Access_Berth", "Cargo Acceso Atraque/Desatraque", "shifting", "FIXED"),
        ("Lighthouse_Dues", "Derechos de Faro y Balisas", "general_port", "VARIABLE_TIME"),
        ("Dockage_APM", "Muellaje APM Terminals", "general_port", "VARIABLE_TIME"),
        ("Launch_Hire", "Lanchas Operativas", "general_port", "FIXED"),
        ("Coordinator", "Coordinador a Bordo", "general_port", "FIXED"),
        ("Clearance", "Clearance In/Out", "general_port", "FIXED"),
        ("Sanitary", "Inspección Sanitaria", "general_port", "FIXED"),
        ("Agency_Fee", "Honorarios de Agenciamiento", "agency", "FIXED"),
        ("Transportation", "Movilidad de Agencia", "agency", "FIXED"),
        ("Comunication", "Comunicaciones de Agencia", "agency", "FIXED"),
    ]

    print("\n1. Verificando/Registrando catálogo en 'port_cost_concepts'...")
    for cid, cname, cat, calctype in concepts:
        cur.execute("""
            INSERT INTO port_cost_concepts (concept_id, concept_name, category, default_calculation_type)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (concept_id) DO NOTHING;
        """, (cid, cname, cat, calctype))
    print("   ✅ Catálogo de conceptos listo.")

    # 2. Eliminar reglas antiguas de Callao para evitar duplicados
    cur.execute("DELETE FROM port_costs_matrix WHERE port_id = 'CALLAO';")
    print("   ✅ Reglas antiguas de Callao limpiadas.")

    # 3. Definición de Conceptos y Reglas de la Experta para Callao
    rules_callao = [
        # SHIFTING EXPENSES
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Pilotage_IN", "sub_item_name": "Practicaje Ingreso (Pilotage IN)",
            "multiplier_source": "FIXED", "cost": 750.0, "rate_usd": 750.0,
            "calculation_formula_template": "MAX(750.00, 0.055 * GRT) + Overtime"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Pilotage_OUT", "sub_item_name": "Practicaje Salida (Pilotage OUT)",
            "multiplier_source": "FIXED", "cost": 750.0, "rate_usd": 750.0,
            "calculation_formula_template": "MAX(750.00, 0.055 * GRT) + Overtime"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Towage_IN", "sub_item_name": "Remolcaje Ingreso (Petranso - 2 Tugs)",
            "multiplier_source": "FIXED", "cost": 1600.0, "rate_usd": 800.0,
            "calculation_formula_template": "MAX(800.00, 0.065 * GRT) * 2 Remolques"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Towage_OUT", "sub_item_name": "Remolcaje Salida (Petranso - 2 Tugs)",
            "multiplier_source": "FIXED", "cost": 1600.0, "rate_usd": 800.0,
            "calculation_formula_template": "MAX(800.00, 0.065 * GRT) * 2 Remolques"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Access_Berth", "sub_item_name": "Cargo Acceso Atraque / Desatraque",
            "multiplier_source": "FIXED", "cost": 280.0, "rate_usd": 70.0,
            "calculation_formula_template": "70.00 USD * 4 eventos"
        },

        # GENERAL PORT EXPENSES
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Lighthouse_Dues", "sub_item_name": "Derechos de Faro y Balisas (Hidrografía)",
            "multiplier_source": "TRB", "cost": 247.77, "rate_usd": 0.03,
            "calculation_formula_template": "0.03/GRT (Nacional) / 0.12/GRT (Extranjero)"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Dockage_APM", "sub_item_name": "Muellaje APM Terminals (Dockage)",
            "multiplier_source": "LOA", "cost": 5758.48, "rate_usd": 1.50,
            "calculation_formula_template": "1.50 USD * LOA * Horas Puerto"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Launch_Hire", "sub_item_name": "Lanchas de Amarre/Desamarre (Transtotal)",
            "multiplier_source": "FIXED", "cost": 340.0, "rate_usd": 85.0,
            "calculation_formula_template": "85.00 USD * 4 Lanchas"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Coordinator", "sub_item_name": "Coordinador a Bordo (2 Turnos)",
            "multiplier_source": "FIXED", "cost": 450.0, "rate_usd": 225.0,
            "calculation_formula_template": "225.00 USD * 2 Turnos"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGAR", "vessel_id": "DEFAULT",
            "concept_id": "Clearance", "sub_item_name": "Clearance In / Out",
            "multiplier_source": "FIXED", "cost": 200.0, "rate_usd": 200.0,
            "calculation_formula_template": "200.00 USD Flat"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Sanitary", "sub_item_name": "Inspección Sanitaria (Sanidad Marítima)",
            "multiplier_source": "FIXED", "cost": 520.0, "rate_usd": 520.0,
            "calculation_formula_template": "520.00 USD Flat"
        },

        # AGENCY EXPENSES
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Agency_Fee", "sub_item_name": "Honorarios Agenciamiento Transtotal",
            "multiplier_source": "FIXED", "cost": 1000.0, "rate_usd": 1000.0,
            "calculation_formula_template": "1,000.00 USD Flat (hasta 5 días)"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Transportation", "sub_item_name": "Movilidad Autoridades / Personal",
            "multiplier_source": "FIXED", "cost": 200.0, "rate_usd": 200.0,
            "calculation_formula_template": "200.00 USD Flat"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Comunication", "sub_item_name": "Comunicaciones de Agencia",
            "multiplier_source": "FIXED", "cost": 250.0, "rate_usd": 250.0,
            "calculation_formula_template": "250.00 USD Flat"
        }
    ]

    for rule in rules_callao:
        cur.execute("""
            INSERT INTO port_costs_matrix (
                port_id, terminal, operation_type, vessel_id, concept_id,
                sub_item_name, multiplier_source, cost, rate_usd, calculation_formula_template
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, (
            rule["port_id"], rule["terminal"], rule["operation_type"], rule["vessel_id"],
            rule["concept_id"], rule["sub_item_name"], rule["multiplier_source"],
            rule["cost"], rule["rate_usd"], rule["calculation_formula_template"]
        ))
        print(f"   ✅ Regla sembrada: {rule['concept_id']} -> {rule['sub_item_name']}")

    print("\n" + "=" * 80)
    print(" 🎉 CALLAO SEMBRADO EXITOSAMENTE CON 100% FIDELIDAD A LA EXPERTA")
    print("=" * 80)

if __name__ == "__main__":
    main()
