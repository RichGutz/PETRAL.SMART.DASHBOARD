import os
import uuid
import psycopg2
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
conn.autocommit = True
cur = conn.cursor()

# 1. Delete old Marcona rules
cur.execute("DELETE FROM port_costs_matrix WHERE port_id = 'MARCONA'")

# 2. Insert Concepts with Correct Categories
concepts = [
    ('pilot_launch_marcona', 'Practicaje + Launch for plot', 'shifting'),
    ('linesmen_marcona', 'Linesmen /amarre y desamarre( Por maniobra)', 'shifting'),
    ('towage_marcona', 'Towage /Remolcaje ( Por maniobra)', 'shifting'),
    ('port_toll_marcona', 'Port toll /Land transport /terminal fee', 'shifting'),
    
    ('light_nat_marcona', 'Lighthouse Dues (Aplica si el buque viene de PUERTO NACIONAL)', 'general_port'),
    ('light_ext_marcona', 'Lighthouse Dues (Aplica si el buque viene de PUERTO EXTRANJERO)', 'general_port'),
    ('coord_board_marcona', 'Coordinator on board', 'general_port'),
    ('clearance_marcona', 'Clearance Expenses (In/Out)', 'general_port'),
    ('sanitary_marcona', 'Sanitary Inspection (Reception/Dispatch)', 'general_port'),
    ('launch_auth_marcona', 'Launch for Authorities', 'general_port'),
    ('launch_sb_marcona', 'Launch Hire (Stand By)', 'general_port'),
    ('towage_sb_marcona', 'Remolcaje Stand by.( Por maniobra)', 'general_port'),
    
    ('agency_fee_marcona', 'Agency Fee', 'agency'),
    ('transp_marcona', 'Transportation (Autoridades,coordinador y personal operativo)', 'agency'),
    ('comms_marcona', 'Comunication', 'agency')
]

for c in concepts:
    cur.execute("INSERT INTO port_cost_concepts (concept_id, concept_name, category) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING", c)

# 3. Define Rules exactly matching the image
rules = [
    # Shifting
    ('pilot_launch_marcona', 'Practicaje + Launch for plot', 'PER_MANEUVER', 4980.0, None, False, 'Practicaje + Lancha de Práctico: Bundle $4980 por maniobra.'),
    ('linesmen_marcona', 'Linesmen /amarre y desamarre( Por maniobra)', 'PER_MANEUVER', 4450.0, None, False, 'Amarre/Desamarre: $4450 por maniobra.'),
    ('towage_marcona', 'Towage /Remolcaje ( Por maniobra)', 'PER_MANEUVER', 18000.0, None, False, 'Remolque: $18000 por maniobra.'),
    ('port_toll_marcona', 'Port toll /Land transport /terminal fee', 'PER_MANEUVER', 75.0, None, True, 'Port Toll / Terminal Fee: Típicamente $75.'),
    
    # General
    ('light_nat_marcona', 'Lighthouse Dues (Aplica si el buque viene de PUERTO NACIONAL)', 'PER_GRT', 0.03, None, False, 'Faro (Nacional): $0.03 x GRT.'),
    ('light_ext_marcona', 'Lighthouse Dues (Aplica si el buque viene de PUERTO EXTRANJERO)', 'PER_GRT', 0.12, None, False, 'Faro (Extranjero): $0.12 x GRT.'),
    ('coord_board_marcona', 'Coordinator on board', 'PER_MANEUVER', 0.0, None, True, 'Coordinator: Pass-through.'),
    ('clearance_marcona', 'Clearance Expenses (In/Out)', 'PER_MANEUVER', 200.0, None, True, 'Clearance: $200 (si es extranjero).'),
    ('sanitary_marcona', 'Sanitary Inspection (Reception/Dispatch)', 'PER_MANEUVER', 520.0, None, True, 'Sanidad: $520 (si es extranjero).'),
    ('launch_auth_marcona', 'Launch for Authorities', 'FIXED', 200.0, None, False, 'Lancha Autoridades: $200 flat.'),
    ('launch_sb_marcona', 'Launch Hire (Stand By)', 'PER_HOUR', 40.0, None, False, 'Lancha Stand By: $40 / hora.'),
    ('towage_sb_marcona', 'Remolcaje Stand by.( Por maniobra)', 'PER_MANEUVER', 16000.0, None, False, 'Remolcaje Stand By: $16000 por maniobra extra.'),
    
    # Agency
    ('agency_fee_marcona', 'Agency Fee', 'FIXED', 1400.0, None, False, 'Agency Fee: $1400 flat.'),
    ('transp_marcona', 'Transportation (Autoridades,coordinador y personal operativo)', 'FIXED', 250.0, None, True, 'Transporte: $250 flat.'),
    ('comms_marcona', 'Comunication', 'PER_MANEUVER', 0.0, None, True, 'Comunicaciones: Pass-through.')
]

def insert_rules(port_id, terminal, op_type, rules):
    for r in rules:
        rule_id = str(uuid.uuid4())
        sql = """
        INSERT INTO port_costs_matrix 
        (rule_id, port_id, terminal, operation_type, vessel_id, concept_id, sub_item_name, multiplier_source, rate_usd, allow_pass_through, calculation_formula_template, logic_comments)
        VALUES (%s, %s, %s, %s, 'ALL', %s, %s, %s, %s, %s, %s, %s)
        """
        # Note: r[0] is concept_id, r[1] is name, r[2] multiplier, r[3] rate, r[4] formula, r[5] pass_through, r[6] comments
        cur.execute(sql, (rule_id, port_id, terminal, op_type, r[0], r[1], r[2], r[3], r[5], r[4], r[6]))

insert_rules('MARCONA', 'PSA MARINE', 'CARGA', rules)
insert_rules('MARCONA', 'PSA MARINE', 'DESCARGA', rules)

print("Marcona (San Juan) fixed!")
