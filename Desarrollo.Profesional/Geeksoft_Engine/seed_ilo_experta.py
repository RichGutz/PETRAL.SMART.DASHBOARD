import sys
import json
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def main():
    print("=" * 80)
    print(" ⚓ SEMBRANDO MATRIZ DE COSTOS DINÁMICOS DE ILO (SPCC / ENAPU 2026)")
    print("=" * 80)

    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Registrar Proveedores
    suppliers_list = [
        "Trans Total",
        "Port Operations",
        "PSA Marine",
        "Petranso",
        "SPCC / Enapu",
        "Hidrografía / MGP",
        "Sanidad Marítima"
    ]

    supplier_map = {}
    print("\n1. Registrando proveedores en 'suppliers'...")
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
            print(f"   ✅ Proveedor: {sname} -> {row[0]}")

    # 2. Registrar conceptos en port_cost_concepts si no existen
    concepts = [
        ("Pilotage_Ilo", "Practicaje (Port Operations)", "shifting", "FIXED"),
        ("Linesmen_Ilo", "Linesmen / Amarre y Desamarre", "shifting", "FIXED"),
        ("Dockage_SPCC", "Dockage / Muellaje SPCC", "shifting", "VARIABLE_TIME"),
        ("Towage_PSA_Ilo", "Remolcaje PSA Marine", "shifting", "FIXED"),
        ("Towage_Pos_PSA", "Remolcaje Posicionamiento PSA", "shifting", "FIXED"),
        ("Towage_Petranso_Ilo", "Remolcaje PETRANSO", "shifting", "FIXED"),
        ("Towage_Pos_Petranso", "Remolcaje Posicionamiento PETRANSO", "shifting", "FIXED"),
        ("Terminal_Fee", "Port Toll / Land Transport", "shifting", "FIXED"),
        ("Overtime_Towage_PSA", "Recargos Overtime Remolcaje PSA", "shifting", "FIXED"),
        ("Overtime_Towage_Petranso", "Recargos Overtime Remolcaje Petranso", "shifting", "FIXED"),
        ("Lighthouse_Dues", "Derechos de Faro y Balisas", "general_port", "VARIABLE_TIME"),
        ("Coordinator_Ilo", "Coordinator on Board", "general_port", "FIXED"),
        ("Sanitary_Ilo", "Inspección Sanitaria", "general_port", "FIXED"),
        ("Launch_Authorities_Ilo", "Lancha Autoridades / Práctico", "general_port", "FIXED"),
        ("Launch_Coordinator", "Lancha Coordinador", "general_port", "FIXED"),
        ("Launch_Mooring_Ilo", "Lancha Amarre / Desamarre", "general_port", "FIXED"),
        ("Launch_Pos_Ilo", "Lancha Posicionamiento", "general_port", "FIXED"),
        ("Clearance", "Clearance In/Out", "general_port", "FIXED"),
        ("Agency_Fee_Ilo", "Honorarios de Agenciamiento", "agency", "FIXED"),
        ("Transportation", "Movilidad de Agencia", "agency", "FIXED"),
        ("Comunication_Ilo", "Comunicaciones de Agencia", "agency", "FIXED"),
    ]

    print("\n2. Registrando catálogo en 'port_cost_concepts'...")
    for cid, cname, cat, calctype in concepts:
        cur.execute("""
            INSERT INTO port_cost_concepts (concept_id, concept_name, category, default_calculation_type)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (concept_id) DO NOTHING;
        """, (cid, cname, cat, calctype))
    print("   ✅ Catálogo de conceptos listo.")

    # 3. Asegurar Puerto y Terminal Ilo en la BD
    cur.execute("""
        INSERT INTO ports (port_id, port_name, country, lat, lon)
        VALUES ('ILO', 'Puerto de Ilo', 'PE', -17.643, -71.341)
        ON CONFLICT (port_id) DO NOTHING;
    """)
    cur.execute("""
        INSERT INTO terminals (terminal_id, port_id, terminal_name)
        VALUES ('ENAPU', 'ILO', 'Terminal Muelle Enapu Ilo')
        ON CONFLICT (terminal_id, port_id) DO NOTHING;
    """)
    cur.execute("""
        INSERT INTO terminals (terminal_id, port_id, terminal_name)
        VALUES ('SPCC', 'ILO', 'Terminal Muelle SPCC Ilo')
        ON CONFLICT (terminal_id, port_id) DO NOTHING;
    """)
    cur.execute("""
        INSERT INTO terminals (terminal_id, port_id, terminal_name)
        VALUES ('GENERAL', 'ILO', 'General sin nombre')
        ON CONFLICT (terminal_id, port_id) DO NOTHING;
    """)

    # 4. Limpiar reglas antiguas de Ilo
    cur.execute("DELETE FROM port_costs_matrix WHERE port_id = 'ILO';")
    print("   ✅ Reglas antiguas de Ilo limpiadas.")

    # 5. Definición Oficial de Tarifas de Ilo
    rules_ilo = [
        # A) SHIFTING EXPENSES
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Pilotage_Ilo", "sub_item_name": "Practicaje (Port Operations)",
            "supplier_name": "Port Operations",
            "multiplier_source": "FIXED", "cost": 3000.0, "rate_usd": 1500.0,
            "calculation_formula_template": "1,500.00 USD * 2 Maniobras"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Linesmen_Ilo", "sub_item_name": "Linesmen / Amarre y Desamarre",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 680.0, "rate_usd": 170.0,
            "calculation_formula_template": "170.00 USD * 4 Eventos"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Dockage_SPCC", "sub_item_name": "Dockage / Muellaje SPCC",
            "supplier_name": "SPCC / Enapu",
            "multiplier_source": "TRB", "cost": 825.90, "rate_usd": 0.05,
            "calculation_formula_template": "$300 Amarre + 0.05 USD * GRT * Días Muelle"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Towage_PSA_Ilo", "sub_item_name": "Remolcaje PSA Marine ($0.16*GRT)",
            "supplier_name": "PSA Marine",
            "multiplier_source": "TRB", "cost": 3600.0, "rate_usd": 0.16,
            "calculation_formula_template": "MAX(1,800.00, 0.16 * GRT) * 2 Remolques"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Towage_Pos_PSA", "sub_item_name": "Remolcaje Posicionamiento PSA Marine",
            "supplier_name": "PSA Marine",
            "multiplier_source": "FIXED", "cost": 1400.0, "rate_usd": 700.0,
            "calculation_formula_template": "700.00 USD * 2 Eventos"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Towage_Petranso_Ilo", "sub_item_name": "Remolcaje PETRANSO ($0.18*GRT con 10% Desc.)",
            "supplier_name": "Petranso",
            "multiplier_source": "TRB", "cost": 2973.24, "rate_usd": 0.18,
            "calculation_formula_template": "0.18 USD * GRT * 2 Remolques (-10% Desc. Comercial)"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Towage_Pos_Petranso", "sub_item_name": "Remolcaje Posicionamiento PETRANSO",
            "supplier_name": "Petranso",
            "multiplier_source": "FIXED", "cost": 1260.0, "rate_usd": 630.0,
            "calculation_formula_template": "630.00 USD * 2 Eventos (con 10% Desc.)"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Terminal_Fee", "sub_item_name": "Port Toll / Land Transport ($75*mnvr)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 150.0, "rate_usd": 75.0,
            "calculation_formula_template": "75.00 USD * 2 Maniobras"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Overtime_Towage_PSA", "sub_item_name": "Recargos Overtime Remolcaje PSA Marine",
            "supplier_name": "PSA Marine",
            "multiplier_source": "FIXED", "cost": 900.0, "rate_usd": 900.0,
            "calculation_formula_template": "25% Recargo (Noche / Festivos)"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Overtime_Towage_Petranso", "sub_item_name": "Recargos Overtime Remolcaje Petranso",
            "supplier_name": "Petranso",
            "multiplier_source": "FIXED", "cost": 743.31, "rate_usd": 743.31,
            "calculation_formula_template": "25% Recargo (Noche / Festivos)"
        },

        # B) GENERAL PORT EXPENSES
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Lighthouse_Dues", "sub_item_name": "Derechos de Faro y Balisas (Puerto Nacional)",
            "supplier_name": "Hidrografía / MGP",
            "multiplier_source": "TRB", "cost": 247.77, "rate_usd": 0.03,
            "calculation_formula_template": "0.03/GRT (Nacional) / 0.12/GRT (Extranjero)"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Coordinator_Ilo", "sub_item_name": "Coordinator on Board (2 Turnos)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 400.0, "rate_usd": 200.0,
            "calculation_formula_template": "200.00 USD * 2 Turnos"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Sanitary_Ilo", "sub_item_name": "Inspección Sanitaria (Sanidad Marítima)",
            "supplier_name": "Sanidad Marítima",
            "multiplier_source": "FIXED", "cost": 520.0, "rate_usd": 520.0,
            "allow_pass_through": True,
            "calculation_formula_template": "520.00 USD Flat (S/ 1,254.00)"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Launch_Authorities_Ilo", "sub_item_name": "Lancha Autoridades / Práctico (Min 4h)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 360.0, "rate_usd": 90.0,
            "calculation_formula_template": "90.00 USD * 4 Horas"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Launch_Coordinator", "sub_item_name": "Lancha Coordinador (Min 4h)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 340.0, "rate_usd": 85.0,
            "calculation_formula_template": "85.00 USD * 4 Horas"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Launch_Mooring_Ilo", "sub_item_name": "Lancha Amarre/Desamarre (2in/2out)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 1500.0, "rate_usd": 375.0,
            "calculation_formula_template": "375.00 USD * 4 Maniobras"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Launch_Pos_Ilo", "sub_item_name": "Lancha Posicionamiento",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 400.0, "rate_usd": 100.0,
            "calculation_formula_template": "100.00 USD * 4 Eventos"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Clearance", "sub_item_name": "Clearance In / Out",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 200.0, "rate_usd": 200.0,
            "allow_pass_through": True,
            "calculation_formula_template": "200.00 USD Flat"
        },

        # C) AGENCY EXPENSES
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Agency_Fee_Ilo", "sub_item_name": "Agency Fee (Agenciamiento)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 900.0, "rate_usd": 900.0,
            "calculation_formula_template": "900.00 USD Flat"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Transportation", "sub_item_name": "Transportation (Movilidad)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 200.0, "rate_usd": 200.0,
            "calculation_formula_template": "200.00 USD Flat"
        },
        {
            "port_id": "ILO", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Comunication_Ilo", "sub_item_name": "Comunication (Comunicaciones)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 200.0, "rate_usd": 200.0,
            "calculation_formula_template": "200.00 USD Flat"
        }
    ]

    print("\n3. Insertando reglas oficiales de Ilo en 'port_costs_matrix'...")
    for rule in rules_ilo:
        sid = supplier_map.get(rule["supplier_name"])
        for term in ["ENAPU", "SPCC", "GENERAL"]:
            cur.execute("""
                INSERT INTO port_costs_matrix (
                    port_id, terminal, operation_type, vessel_id, concept_id,
                    sub_item_name, supplier_id, multiplier_source, cost, rate_usd,
                    calculation_formula_template, allow_pass_through
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                rule["port_id"], term, rule["operation_type"], rule["vessel_id"],
                rule["concept_id"], rule["sub_item_name"], sid, rule["multiplier_source"],
                rule["cost"], rule["rate_usd"], rule["calculation_formula_template"],
                rule.get("allow_pass_through", False)
            ))
        print(f"   ✅ {rule['sub_item_name']} -> Proveedor: {rule['supplier_name']} ({sid})")

    print("\n" + "=" * 80)
    print(" 🎉 ILO SEMBRADO EXITOSAMENTE CON 100% FIDELIDAD A LA EXPERTA")
    print("=" * 80)

if __name__ == "__main__":
    main()
