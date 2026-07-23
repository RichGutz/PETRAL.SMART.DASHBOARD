import sys
import json
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def main():
    print("=" * 80)
    print(" ⚓ SEMBRANDO MATRIZ DE COSTOS DINÁMICOS DE MARCONA (SPCC / PSA MARINE 2026)")
    print("=" * 80)

    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Registrar Proveedores
    suppliers_list = [
        "Trans Total",
        "PSA Marine",
        "SPCC / Marcobre",
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
        ("Integral_SPCC", "Servicio Integral de Atraque Acuerdo SPCC", "shifting", "FIXED"),
        ("Pilotage_Marcona", "Practicaje + Launch for Pilot", "shifting", "FIXED"),
        ("Linesmen_Marcona", "Linesmen (Amarre y Desamarre)", "shifting", "FIXED"),
        ("Towage_Marcona", "Towage / Remolcaje", "shifting", "FIXED"),
        ("Terminal_Fee", "Port Toll / Land Transport", "shifting", "FIXED"),
        ("Lighthouse_Dues", "Derechos de Faro y Balisas", "general_port", "VARIABLE_TIME"),
        ("Coordinator", "Coordinador a Bordo", "general_port", "FIXED"),
        ("Clearance", "Clearance In/Out", "general_port", "FIXED"),
        ("Sanitary_Marcona", "Inspección Sanitaria", "general_port", "FIXED"),
        ("Launch_Authorities", "Launch for Authorities", "general_port", "FIXED"),
        ("Launch_Standby", "Launch Hire (Stand By)", "general_port", "VARIABLE_TIME"),
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

    # 3. Asegurar Puerto y Terminal Marcona en la BD
    cur.execute("""
        INSERT INTO ports (port_id, port_name, country, lat, lon)
        VALUES ('MARCONA', 'Puerto de San Juan de Marcona', 'PE', -15.353, -75.162)
        ON CONFLICT (port_id) DO NOTHING;
    """)
    cur.execute("""
        INSERT INTO terminals (terminal_id, port_id, terminal_name)
        VALUES ('SPCC', 'MARCONA', 'Terminal Muelle San Juan SPCC')
        ON CONFLICT (terminal_id, port_id) DO NOTHING;
    """)
    cur.execute("""
        INSERT INTO terminals (terminal_id, port_id, terminal_name)
        VALUES ('GENERAL', 'MARCONA', 'General sin nombre')
        ON CONFLICT (terminal_id, port_id) DO NOTHING;
    """)

    # 4. Limpiar reglas antiguas de Marcona
    cur.execute("DELETE FROM port_costs_matrix WHERE port_id = 'MARCONA';")
    print("   ✅ Reglas antiguas de Marcona limpiadas.")

    # 5. Definición Oficial de Tarifas de Marcona
    rules_marcona = [
        # A) SHIFTING EXPENSES
        {
            "port_id": "MARCONA", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Integral_SPCC", "sub_item_name": "Servicio Integral de Atraque Seg. Acuerdo SPCC",
            "supplier_name": "PSA Marine",
            "multiplier_source": "FIXED", "cost": 30508.48, "rate_usd": 30508.48,
            "calculation_formula_template": "30,508.48 USD Flat (Tarifa Preferencial Acuerdo SPCC/PSA)"
        },
        {
            "port_id": "MARCONA", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Pilotage_Marcona", "sub_item_name": "Practicaje + Launch for Pilot (PSA Marine)",
            "supplier_name": "PSA Marine",
            "multiplier_source": "FIXED", "cost": 9960.0, "rate_usd": 4980.0,
            "calculation_formula_template": "4,980.00 USD * 2 Maniobras (Tarifa Pública Referencial)"
        },
        {
            "port_id": "MARCONA", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Linesmen_Marcona", "sub_item_name": "Linesmen Amarre / Desamarre (2 Lanchas)",
            "supplier_name": "PSA Marine",
            "multiplier_source": "FIXED", "cost": 8900.0, "rate_usd": 4450.0,
            "calculation_formula_template": "4,450.00 USD * 2 Maniobras"
        },
        {
            "port_id": "MARCONA", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Towage_Marcona", "sub_item_name": "Towage / Remolcaje (PSA Marine)",
            "supplier_name": "PSA Marine",
            "multiplier_source": "FIXED", "cost": 30000.0, "rate_usd": 15000.0,
            "calculation_formula_template": "15,000.00 USD * 2 Maniobras"
        },
        {
            "port_id": "MARCONA", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Terminal_Fee", "sub_item_name": "Port Toll / Land Transport / Terminal Fee",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 150.0, "rate_usd": 75.0,
            "calculation_formula_template": "75.00 USD * 2 Eventos"
        },

        # B) GENERAL PORT EXPENSES
        {
            "port_id": "MARCONA", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Lighthouse_Dues", "sub_item_name": "Derechos de Faro y Balisas (Puerto Nacional)",
            "supplier_name": "Hidrografía / MGP",
            "multiplier_source": "TRB", "cost": 247.77, "rate_usd": 0.03,
            "calculation_formula_template": "0.03/GRT (Nacional) / 0.12/GRT (Extranjero)"
        },
        {
            "port_id": "MARCONA", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Coordinator", "sub_item_name": "Coordinator on Board (2 Turnos)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 450.0, "rate_usd": 225.0,
            "calculation_formula_template": "225.00 USD * 2 Turnos"
        },
        {
            "port_id": "MARCONA", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Clearance", "sub_item_name": "Clearance Expenses (In / Out)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 200.0, "rate_usd": 200.0,
            "allow_pass_through": True,
            "calculation_formula_template": "200.00 USD Flat"
        },
        {
            "port_id": "MARCONA", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Sanitary_Marcona", "sub_item_name": "Inspección Sanitaria (Sanidad Marítima)",
            "supplier_name": "Sanidad Marítima",
            "multiplier_source": "FIXED", "cost": 670.0, "rate_usd": 670.0,
            "allow_pass_through": True,
            "calculation_formula_template": "670.00 USD Flat"
        },
        {
            "port_id": "MARCONA", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Launch_Authorities", "sub_item_name": "Launch for Authorities",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 200.0, "rate_usd": 200.0,
            "calculation_formula_template": "200.00 USD Flat"
        },
        {
            "port_id": "MARCONA", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Launch_Standby", "sub_item_name": "Launch Hire (Stand By PSA Marine)",
            "supplier_name": "PSA Marine",
            "multiplier_source": "PORT_HOURS", "cost": 1800.0, "rate_usd": 40.0,
            "calculation_formula_template": "40.00 USD * Horas Puerto"
        },

        # C) AGENCY EXPENSES
        {
            "port_id": "MARCONA", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Agency_Fee", "sub_item_name": "Agency Fee (Agenciamiento)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 1400.0, "rate_usd": 1400.0,
            "calculation_formula_template": "1,400.00 USD Flat"
        },
        {
            "port_id": "MARCONA", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Transportation", "sub_item_name": "Transportation (Movilidad)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 200.0, "rate_usd": 200.0,
            "calculation_formula_template": "200.00 USD Flat"
        },
        {
            "port_id": "MARCONA", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Comunication", "sub_item_name": "Comunication (Comunicaciones)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 250.0, "rate_usd": 250.0,
            "calculation_formula_template": "250.00 USD Flat"
        }
    ]

    print("\n3. Insertando reglas oficiales de Marcona en 'port_costs_matrix'...")
    for rule in rules_marcona:
        sid = supplier_map.get(rule["supplier_name"])
        for term in ["SPCC", "GENERAL"]:
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
    print(" 🎉 MARCONA SEMBRADO EXITOSAMENTE CON 100% FIDELIDAD A LA EXPERTA")
    print("=" * 80)

if __name__ == "__main__":
    main()
