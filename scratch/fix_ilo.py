import os
import uuid
import psycopg2
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
conn.autocommit = True
cur = conn.cursor()

# 1. Delete old Ilo rules
cur.execute("DELETE FROM port_costs_matrix WHERE port_id = 'ILO'")

# 2. Insert Concepts with Correct Categories
concepts = [
    # Shifting
    ('pilot_ilo', 'Practicaje', 'shifting'),
    ('linesmen_ilo', 'Linesmen /amarre y desamarre( Por maniobra)', 'shifting'),
    ('towage_psa_ilo', 'Towage /Remolcaje($0.16*GRT*Mnvr*Tug) - PSA MARINE', 'shifting'),
    ('pos_psa_ilo', 'Remolcaje Posicionamiento - PSA MARINE', 'shifting'),
    ('towage_petr_ilo', 'Towage /Remolcaje($0.15*GRT*Mnvr*Tug) - PETRANSO', 'shifting'),
    ('pos_petr_ilo', 'Remolcaje Posicionamiento - PETRANSO', 'shifting'),
    ('port_toll_ilo', 'Port toll /Land transport /terminal fee($75*move)', 'shifting'),
    
    # General
    ('light_nat_ilo', 'Lighthouse Dues (Aplica si el buque viene de PUERTO NACIONAL)', 'general_port'),
    ('light_ext_ilo', 'Lighthouse Dues (Aplica si el buque viene de PUERTO EXTRANJERO)', 'general_port'),
    ('coord_board_ilo', 'Coordinator on board', 'general_port'),
    ('sanitary_ilo', 'Sanitary Inspection (Reception/Dispatch)', 'general_port'),
    ('launch_auth_ilo', 'Lancha autoridades,práctico in/out / Por hora- Min 4 hrs', 'general_port'),
    ('launch_coord_ilo', 'Lancha coordinador/ Por hora - Min 4 hrs', 'general_port'),
    ('launch_linesmen_ilo', 'Lancha amarre/desamarre/ Por maniobra (2in/ 2out)', 'general_port'),
    ('launch_pos_ilo', 'Lancha de posicionamiento/ Por maniobra(Si es aplicable)', 'general_port'),
    ('clearance_ilo', 'Clearance (In/Out)', 'general_port'),
    
    # Agency
    ('agency_fee_ilo', 'Agency Fee', 'agency'),
    ('transp_ilo', 'Transportation (Autoridades,coordinador y personal operativo)', 'agency'),
    ('comms_ilo', 'Comunication', 'agency')
]

for c in concepts:
    cur.execute("INSERT INTO port_cost_concepts (concept_id, concept_name, category) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING", c)

# 3. Define Rules exactly matching the image
rules = [
    # Shifting
    ('pilot_ilo', 'Practicaje', 'PER_MANEUVER', 0.0, None, True, 'Practicaje: Tarifa plana (Pass-through).'),
    ('linesmen_ilo', 'Linesmen /amarre y desamarre( Por maniobra)', 'PER_MANEUVER', 375.0, None, False, 'Amarre/Desamarre: $375 por maniobra.'),
    ('towage_psa_ilo', 'Towage /Remolcaje($0.16*GRT*Mnvr*Tug) - PSA MARINE', 'PER_MANEUVER', 0.0, '0.16 * GRT * TUGBOATS * QTY', False, 'Towage PSA: $0.16 x GRT x Maniobras x Tugs.'),
    ('pos_psa_ilo', 'Remolcaje Posicionamiento - PSA MARINE', 'PER_MANEUVER', 700.0, None, False, 'Posicionamiento PSA: $700 por maniobra.'),
    ('towage_petr_ilo', 'Towage /Remolcaje($0.15*GRT*Mnvr*Tug) - PETRANSO', 'PER_MANEUVER', 0.0, '0.15 * GRT * TUGBOATS * QTY', False, 'Towage PETRANSO: $0.15 x GRT x Maniobras x Tugs.'),
    ('pos_petr_ilo', 'Remolcaje Posicionamiento - PETRANSO', 'PER_MANEUVER', 600.0, None, False, 'Posicionamiento PETRANSO: $600 por maniobra.'),
    ('port_toll_ilo', 'Port toll /Land transport /terminal fee($75*move)', 'PER_MANEUVER', 75.0, None, False, 'Port Toll: $75 x maniobra.'),
    
    # General
    ('light_nat_ilo', 'Lighthouse Dues (Aplica si el buque viene de PUERTO NACIONAL)', 'PER_GRT', 0.03, None, False, 'Faro (Nacional): $0.03 x GRT.'),
    ('light_ext_ilo', 'Lighthouse Dues (Aplica si el buque viene de PUERTO EXTRANJERO)', 'PER_GRT', 0.12, None, False, 'Faro (Extranjero): $0.12 x GRT.'),
    ('coord_board_ilo', 'Coordinator on board', 'PER_MANEUVER', 0.0, None, True, 'Coordinator: Pass-through.'),
    ('sanitary_ilo', 'Sanitary Inspection (Reception/Dispatch)', 'PER_MANEUVER', 520.0, None, True, 'Sanidad: $520 (si aplica).'),
    ('launch_auth_ilo', 'Lancha autoridades,práctico in/out / Por hora- Min 4 hrs', 'PER_HOUR', 90.0, 'MAX(4, PORT_HOURS) * 90', False, 'Lancha Autoridades: $90/hr, Min 4 hrs.'),
    ('launch_coord_ilo', 'Lancha coordinador/ Por hora - Min 4 hrs', 'PER_HOUR', 85.0, 'MAX(4, PORT_HOURS) * 85', False, 'Lancha Coordinador: $85/hr, Min 4 hrs.'),
    ('launch_linesmen_ilo', 'Lancha amarre/desamarre/ Por maniobra (2in/ 2out)', 'PER_MANEUVER', 375.0, None, False, 'Lancha Amarre/Desamarre: $375 por maniobra.'),
    ('launch_pos_ilo', 'Lancha de posicionamiento/ Por maniobra(Si es aplicable)', 'PER_MANEUVER', 100.0, None, True, 'Lancha Posicionamiento: $100 por maniobra (si aplica).'),
    ('clearance_ilo', 'Clearance (In/Out)', 'PER_MANEUVER', 200.0, None, True, 'Clearance: $200 (si es extranjero).'),
    
    # Agency
    ('agency_fee_ilo', 'Agency Fee', 'FIXED', 900.0, None, False, 'Agency Fee: $900 flat.'),
    ('transp_ilo', 'Transportation (Autoridades,coordinador y personal operativo)', 'FIXED', 200.0, None, True, 'Transporte: Pass-through o Flat.'),
    ('comms_ilo', 'Comunication', 'PER_MANEUVER', 0.0, None, True, 'Comunicaciones: Pass-through.')
]

def insert_rules(port_id, terminal, op_type, rules):
    for r in rules:
        rule_id = str(uuid.uuid4())
        sql = """
        INSERT INTO port_costs_matrix 
        (rule_id, port_id, terminal, operation_type, vessel_id, concept_id, sub_item_name, multiplier_source, rate_usd, allow_pass_through, calculation_formula_template, logic_comments)
        VALUES (%s, %s, %s, %s, 'ALL', %s, %s, %s, %s, %s, %s, %s)
        """
        cur.execute(sql, (rule_id, port_id, terminal, op_type, r[0], r[1], r[2], r[3], r[5], r[4], r[6]))

insert_rules('ILO', 'SPCC', 'CARGA', rules)
insert_rules('ILO', 'SPCC', 'DESCARGA', rules)

print("Ilo fixed!")
