import sys
import json
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def main():
    print("=" * 80)
    print(" ⚓ SEMBRANDO MATRIZ DE COSTOS DINÁMICOS DE CALLAO Y PROVEEDORES")
    print("=" * 80)

    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Registrar Proveedores en la tabla suppliers
    suppliers_list = [
        "Trans Total",
        "Petranso",
        "APM Terminals",
        "Hidrografía / MGP",
        "Sanidad Marítima",
        "PSA Marine"
    ]

    supplier_map = {}
    print("\n1. Registrando proveedores en la tabla 'suppliers'...")
    for sname in suppliers_list:
        cur.execute("""
            INSERT INTO suppliers (supplier_name, is_active)
            VALUES (%s, TRUE)
            ON CONFLICT DO NOTHING;
        """, (sname,))
        cur.execute("SELECT supplier_id FROM suppliers WHERE supplier_name = %s;", (sname,))
        row = cur.fetchone()
        if row:
            supplier_map[sname] = row[0]
            print(f"   ✅ Proveedor registrado: {sname} -> {row[0]}")

    # 2. Registrar conceptos en port_cost_concepts
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

    print("\n2. Registrando catálogo en 'port_cost_concepts'...")
    for cid, cname, cat, calctype in concepts:
        cur.execute("""
            INSERT INTO port_cost_concepts (concept_id, concept_name, category, default_calculation_type)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (concept_id) DO NOTHING;
        """, (cid, cname, cat, calctype))
    print("   ✅ Catálogo de conceptos listo.")

    # 3. Limpiar reglas de Callao
    cur.execute("DELETE FROM port_costs_matrix WHERE port_id = 'CALLAO';")
    print("   ✅ Reglas antiguas de Callao limpiadas.")

    # 4. Definición de Conceptos y Proveedores para Callao
    rules_callao = [
        # SHIFTING EXPENSES
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Pilotage_IN", "sub_item_name": "Practicaje Ingreso (Pilotage IN)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 750.0, "rate_usd": 750.0,
            "calculation_formula_template": "MAX(750.00, 0.055 * GRT) + Overtime"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Pilotage_OUT", "sub_item_name": "Practicaje Salida (Pilotage OUT)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 750.0, "rate_usd": 750.0,
            "calculation_formula_template": "MAX(750.00, 0.055 * GRT) + Overtime"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Towage_IN", "sub_item_name": "Remolcaje Ingreso (Petranso - 2 Tugs)",
            "supplier_name": "Petranso",
            "multiplier_source": "FIXED", "cost": 1600.0, "rate_usd": 800.0,
            "calculation_formula_template": "MAX(800.00, 0.065 * GRT) * 2 Remolques"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Towage_OUT", "sub_item_name": "Remolcaje Salida (Petranso - 2 Tugs)",
            "supplier_name": "Petranso",
            "multiplier_source": "FIXED", "cost": 1600.0, "rate_usd": 800.0,
            "calculation_formula_template": "MAX(800.00, 0.065 * GRT) * 2 Remolques"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Access_Berth", "sub_item_name": "Cargo Acceso Atraque / Desatraque",
            "supplier_name": "APM Terminals",
            "multiplier_source": "FIXED", "cost": 280.0, "rate_usd": 70.0,
            "calculation_formula_template": "70.00 USD * 4 eventos"
        },

        # GENERAL PORT EXPENSES
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Lighthouse_Dues", "sub_item_name": "Derechos de Faro y Balisas (Hidrografía)",
            "supplier_name": "Hidrografía / MGP",
            "multiplier_source": "TRB", "cost": 247.77, "rate_usd": 0.03,
            "calculation_formula_template": "0.03/GRT (Nacional) / 0.12/GRT (Extranjero)"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Dockage_APM", "sub_item_name": "Muellaje APM Terminals (Dockage)",
            "supplier_name": "APM Terminals",
            "multiplier_source": "LOA", "cost": 5758.48, "rate_usd": 1.50,
            "calculation_formula_template": "1.50 USD * LOA * Horas Puerto"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Launch_Hire", "sub_item_name": "Lanchas de Amarre/Desamarre (Transtotal)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 340.0, "rate_usd": 85.0,
            "calculation_formula_template": "85.00 USD * 4 Lanchas"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Coordinator", "sub_item_name": "Coordinador a Bordo (2 Turnos)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 450.0, "rate_usd": 225.0,
            "calculation_formula_template": "225.00 USD * 2 Turnos"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Clearance", "sub_item_name": "Clearance In / Out",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 200.0, "rate_usd": 200.0,
            "allow_pass_through": True,
            "calculation_formula_template": "200.00 USD Flat"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Sanitary", "sub_item_name": "Inspección Sanitaria (Sanidad Marítima)",
            "supplier_name": "Sanidad Marítima",
            "multiplier_source": "FIXED", "cost": 520.0, "rate_usd": 520.0,
            "allow_pass_through": True,
            "calculation_formula_template": "520.00 USD Flat (Solo si procede/destino Extranjero)"
        },

        # AGENCY EXPENSES
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Agency_Fee", "sub_item_name": "Honorarios Agenciamiento Transtotal",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 1000.0, "rate_usd": 1000.0,
            "calculation_formula_template": "1,000.00 USD Flat (hasta 5 días) + $150/día extra"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Transportation", "sub_item_name": "Movilidad Autoridades / Personal",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 200.0, "rate_usd": 200.0,
            "calculation_formula_template": "200.00 USD Flat"
        },
        {
            "port_id": "CALLAO", "terminal": "APM", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Comunication", "sub_item_name": "Comunicaciones de Agencia",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 250.0, "rate_usd": 250.0,
            "calculation_formula_template": "250.00 USD Flat"
        }
    ]

    print("\n3. Insertando reglas de Callao con Proveedores asignados...")
    for rule in rules_callao:
        sid = supplier_map.get(rule["supplier_name"])
        cur.execute("""
            INSERT INTO port_costs_matrix (
                port_id, terminal, operation_type, vessel_id, concept_id,
                sub_item_name, supplier_id, multiplier_source, cost, rate_usd,
                calculation_formula_template, allow_pass_through
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, (
            rule["port_id"], rule["terminal"], rule["operation_type"], rule["vessel_id"],
            rule["concept_id"], rule["sub_item_name"], sid, rule["multiplier_source"],
            rule["cost"], rule["rate_usd"], rule["calculation_formula_template"],
            rule.get("allow_pass_through", False)
        ))
        print(f"   ✅ {rule['sub_item_name']} -> Proveedor: {rule['supplier_name']} ({sid})")

    print("\n" + "=" * 80)
    print(" 🎉 CALLAO Y PROVEEDORES SEMBRADOS EXITOSAMENTE")
    print("=" * 80)

if __name__ == "__main__":
    main()
