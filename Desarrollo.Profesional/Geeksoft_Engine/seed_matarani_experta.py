import sys
import json
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def main():
    print("=" * 80)
    print(" ⚓ SEMBRANDO MATRIZ DE COSTOS DINÁMICOS DE MATARANI (TISUR / PSA MARINE 2026)")
    print("=" * 80)

    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Registrar Proveedores
    suppliers_list = [
        "Trans Total",
        "PSA Marine",
        "Tisur",
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
        ("Pilot_Tug_Integral", "Servicio Integral PSA Marine", "shifting", "FIXED"),
        ("Overtime_PSA_25", "Recargo Servicio Integral 25%", "shifting", "FIXED"),
        ("Overtime_PSA_50", "Recargo Servicio Integral 50%", "shifting", "FIXED"),
        ("Access_Berth_Tisur", "Cargo de Acceso Muelle Tisur", "shifting", "FIXED"),
        ("Linesmen", "Linesmen (Amarre y Desamarre)", "shifting", "FIXED"),
        ("Terminal_Fee", "Port Toll / Land Transport", "shifting", "FIXED"),
        ("Lighthouse_Dues", "Derechos de Faro y Balisas", "general_port", "VARIABLE_TIME"),
        ("Dockage_Tisur", "Muellaje Tisur S.A.", "general_port", "VARIABLE_TIME"),
        ("Launch_Authorities", "Lancha de Autoridades / Mooring", "general_port", "FIXED"),
        ("Sanitary_Matarani", "Inspección Sanitaria", "general_port", "FIXED"),
        ("Clearance", "Clearance In/Out", "general_port", "FIXED"),
        ("Coordinator", "Coordinador a Bordo", "general_port", "FIXED"),
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

    # 3. Asegurar Puerto y Terminal Matarani en la BD
    cur.execute("""
        INSERT INTO ports (port_id, port_name, country, lat, lon)
        VALUES ('MATARANI', 'Puerto de Matarani', 'PE', -17.001, -72.106)
        ON CONFLICT (port_id) DO NOTHING;
    """)
    cur.execute("""
        INSERT INTO terminals (terminal_id, port_id, terminal_name)
        VALUES ('TISUR', 'MATARANI', 'Terminal Tisur S.A.')
        ON CONFLICT (terminal_id, port_id) DO NOTHING;
    """)

    # 4. Limpiar reglas antiguas de Matarani
    cur.execute("DELETE FROM port_costs_matrix WHERE port_id = 'MATARANI';")
    print("   ✅ Reglas antiguas de Matarani limpiadas.")

    # 5. Definición Oficial de Tarifas de Matarani
    rules_matarani = [
        # A) SHIFTING EXPENSES
        {
            "port_id": "MATARANI", "terminal": "TISUR", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Pilot_Tug_Integral", "sub_item_name": "Servicio Integral PSA (Pilot + Tug + Lancha)",
            "supplier_name": "PSA Marine",
            "multiplier_source": "FIXED", "cost": 6736.0, "rate_usd": 3368.0,
            "calculation_formula_template": "3,368.00 USD (Tarifa Addenda 39.31% x 2 Maniobras)"
        },
        {
            "port_id": "MATARANI", "terminal": "TISUR", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Overtime_PSA_25", "sub_item_name": "Recargo Servicio Integral (Overtime 25%)",
            "supplier_name": "PSA Marine",
            "multiplier_source": "FIXED", "cost": 842.0, "rate_usd": 842.0,
            "calculation_formula_template": "25% Recargo (Lunes-Sábado 18:00 - 24:00h)"
        },
        {
            "port_id": "MATARANI", "terminal": "TISUR", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Overtime_PSA_50", "sub_item_name": "Recargo Servicio Integral (Overtime 50%)",
            "supplier_name": "PSA Marine",
            "multiplier_source": "FIXED", "cost": 1684.0, "rate_usd": 1684.0,
            "calculation_formula_template": "50% Recargo (00:00 - 07:00h / Dom / Feriados)"
        },
        {
            "port_id": "MATARANI", "terminal": "TISUR", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Access_Berth_Tisur", "sub_item_name": "Cargo de Acceso Muelle Tisur",
            "supplier_name": "Tisur",
            "multiplier_source": "FIXED", "cost": 280.0, "rate_usd": 70.0,
            "calculation_formula_template": "70.00 USD * 4 Eventos"
        },
        {
            "port_id": "MATARANI", "terminal": "TISUR", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Linesmen", "sub_item_name": "Linesmen (Amarre y Desamarre)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 357.30, "rate_usd": 357.30,
            "calculation_formula_template": "357.30 USD Flat"
        },
        {
            "port_id": "MATARANI", "terminal": "TISUR", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Terminal_Fee", "sub_item_name": "Port Toll / Land Transport / Terminal Fee",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 150.0, "rate_usd": 75.0,
            "calculation_formula_template": "75.00 USD * 2 Eventos"
        },

        # B) GENERAL PORT EXPENSES
        {
            "port_id": "MATARANI", "terminal": "TISUR", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Lighthouse_Dues", "sub_item_name": "Derechos de Faro y Balisas (Puerto Nacional)",
            "supplier_name": "Hidrografía / MGP",
            "multiplier_source": "TRB", "cost": 247.77, "rate_usd": 0.03,
            "calculation_formula_template": "0.03/GRT (Nacional) / 0.12/GRT (Extranjero)"
        },
        {
            "port_id": "MATARANI", "terminal": "TISUR", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Dockage_Tisur", "sub_item_name": "Dockage Muellaje Tisur S.A.",
            "supplier_name": "Tisur",
            "multiplier_source": "LOA", "cost": 2877.73, "rate_usd": 0.65,
            "calculation_formula_template": "0.65 USD * LOA * Horas Puerto"
        },
        {
            "port_id": "MATARANI", "terminal": "TISUR", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Launch_Authorities", "sub_item_name": "Launch Authorities / Mooring Lanchas",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 310.0, "rate_usd": 155.0,
            "calculation_formula_template": "155.00 USD * 2 Lanchas"
        },
        {
            "port_id": "MATARANI", "terminal": "TISUR", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Sanitary_Matarani", "sub_item_name": "Inspección Sanitaria (Sanidad)",
            "supplier_name": "Sanidad Marítima",
            "multiplier_source": "FIXED", "cost": 670.0, "rate_usd": 670.0,
            "allow_pass_through": True,
            "calculation_formula_template": "670.00 USD Flat"
        },
        {
            "port_id": "MATARANI", "terminal": "TISUR", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Clearance", "sub_item_name": "Clearance In / Out",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 200.0, "rate_usd": 200.0,
            "allow_pass_through": True,
            "calculation_formula_template": "200.00 USD Flat"
        },
        {
            "port_id": "MATARANI", "terminal": "TISUR", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Coordinator", "sub_item_name": "Coordinator on Board (2 Turnos)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 450.0, "rate_usd": 225.0,
            "calculation_formula_template": "225.00 USD * 2 Turnos"
        },

        # C) AGENCY EXPENSES
        {
            "port_id": "MATARANI", "terminal": "TISUR", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Agency_Fee", "sub_item_name": "Agency Fee (Agenciamiento)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 1100.0, "rate_usd": 1100.0,
            "calculation_formula_template": "1,100.00 USD Flat"
        },
        {
            "port_id": "MATARANI", "terminal": "TISUR", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Transportation", "sub_item_name": "Transportation (Movilidad)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 200.0, "rate_usd": 200.0,
            "calculation_formula_template": "200.00 USD Flat"
        },
        {
            "port_id": "MATARANI", "terminal": "TISUR", "operation_type": "DESCARGA", "vessel_id": "DEFAULT",
            "concept_id": "Comunication", "sub_item_name": "Comunication (Comunicaciones)",
            "supplier_name": "Trans Total",
            "multiplier_source": "FIXED", "cost": 250.0, "rate_usd": 250.0,
            "calculation_formula_template": "250.00 USD Flat"
        }
    ]

    print("\n3. Insertando reglas oficiales de Matarani en 'port_costs_matrix'...")
    for rule in rules_matarani:
        sid = supplier_map.get(rule["supplier_name"])
        for term in ["TISUR", "GENERAL"]:
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
    print(" 🎉 MATARANI SEMBRADO EXITOSAMENTE CON 100% FIDELIDAD A LA EXPERTA")
    print("=" * 80)

if __name__ == "__main__":
    main()
