import os
import uuid
import psycopg2
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
conn.autocommit = True
cur = conn.cursor()

# 1. Delete old Matarani rules
cur.execute("DELETE FROM port_costs_matrix WHERE port_id = 'MATARANI'")

# 2. Insert Concepts with Correct Categories
concepts = [
    # Shifting
    ('integral_matarani', 'Pilot + Tug Boats + Lancha para pilot(Servicio integral)', 'shifting'),
    ('recargo_25_matarani', 'Recargo Servicio Integral Atraque/Desatraque - 25%', 'shifting'),
    ('recargo_50_matarani', 'Recargo Servicio Integral Atraque/Desatraque - 50%', 'shifting'),
    ('cargo_acceso_matarani', 'Cargo de Acceso', 'shifting'),
    ('linesmen_matarani', 'Linesmen /amarre y desamarre', 'shifting'),
    ('port_toll_matarani', 'Port toll /Land transport /terminal fee', 'shifting'),
    
    # General
    ('light_nat_matarani', 'Lighthouse Dues (Aplica si el buque viene de PUERTO NACIONAL)', 'general_port'),
    ('light_ext_matarani', 'Lighthouse Dues (Aplica si el buque viene de PUERTO EXTRANJERO)', 'general_port'),
    ('dockage_matarani', 'Dockage /Muellaje ( $0.65*LOA*Hr)', 'general_port'),
    ('launch_auth_matarani', 'Launch autoridades / Min 2 hrs', 'general_port'),
    ('sanitary_matarani', 'Sanitary Inspection (Reception/Dispatch)', 'general_port'),
    ('clearance_matarani', 'Clearance (In/Out)', 'general_port'),
    ('coord_board_matarani', 'Coordinator on board', 'general_port'),
    
    # Agency
    ('agency_fee_matarani', 'Agency Fee', 'agency'),
    ('transp_matarani', 'Transportation (Autoridades,coordinador y personal operativo)', 'agency'),
    ('comms_matarani', 'Comunication', 'agency')
]

for c in concepts:
    cur.execute("INSERT INTO port_cost_concepts (concept_id, concept_name, category) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING", c)

# 3. Define Rules exactly matching the image
rules = [
    # Shifting
    ('integral_matarani', 'Pilot + Tug Boats + Lancha para pilot(Servicio integral)', 'PER_MANEUVER', 5550.0, None, False, 'Servicio Integral: $5550 por maniobra base.'),
    ('recargo_25_matarani', 'Recargo Servicio Integral Atraque/Desatraque - 25%', 'PER_MANEUVER', 0.0, '5550 * 0.25 * QTY', False, 'Recargo 25%: Aplica Lunes a Sábado de 18:00 a 24:00.'),
    ('recargo_50_matarani', 'Recargo Servicio Integral Atraque/Desatraque - 50%', 'PER_MANEUVER', 0.0, '5550 * 0.50 * QTY', False, 'Recargo 50%: Aplica Domingos, Feriados o Madrugada.'),
    ('cargo_acceso_matarani', 'Cargo de Acceso', 'PER_MANEUVER', 70.0, None, False, 'Cargo de Acceso: $70 por cantidad.'),
    ('linesmen_matarani', 'Linesmen /amarre y desamarre', 'FIXED', 357.30, None, False, 'Amarre Matarani: Tarifa única $357.30.'),
    ('port_toll_matarani', 'Port toll /Land transport /terminal fee', 'PER_MANEUVER', 0.0, None, True, 'Port Toll: Pass-through o Flat.'),
    
    # General
    ('light_nat_matarani', 'Lighthouse Dues (Aplica si el buque viene de PUERTO NACIONAL)', 'PER_GRT', 0.03, None, False, 'Faro (Nacional): $0.03 x GRT.'),
    ('light_ext_matarani', 'Lighthouse Dues (Aplica si el buque viene de PUERTO EXTRANJERO)', 'PER_GRT', 0.12, None, False, 'Faro (Extranjero): $0.12 x GRT.'),
    ('dockage_matarani', 'Dockage /Muellaje ( $0.65*LOA*Hr)', 'PER_LOA_HOUR', 0.65, None, False, 'Muellaje Matarani: $0.65 x LOA x Horas.'),
    ('launch_auth_matarani', 'Launch autoridades / Min 2 hrs', 'PER_HOUR', 155.0, 'MAX(2, PORT_HOURS) * 155', False, 'Lancha Autoridades: $155/hr, Min 2 hrs.'),
    ('sanitary_matarani', 'Sanitary Inspection (Reception/Dispatch)', 'PER_MANEUVER', 520.0, None, True, 'Sanidad: $520 (si es extranjero).'),
    ('clearance_matarani', 'Clearance (In/Out)', 'PER_MANEUVER', 200.0, None, True, 'Clearance: $200 (si es extranjero).'),
    ('coord_board_matarani', 'Coordinator on board', 'PER_MANEUVER', 0.0, None, True, 'Coordinator: Pass-through.'),
    
    # Agency
    ('agency_fee_matarani', 'Agency Fee', 'FIXED', 1100.0, None, False, 'Agency Fee: $1100 flat.'),
    ('transp_matarani', 'Transportation (Autoridades,coordinador y personal operativo)', 'FIXED', 250.0, None, True, 'Transporte: Pass-through o Flat.'),
    ('comms_matarani', 'Comunication', 'PER_MANEUVER', 0.0, None, True, 'Comunicaciones: Pass-through.')
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

insert_rules('MATARANI', 'TISUR', 'CARGA', rules)
insert_rules('MATARANI', 'TISUR', 'DESCARGA', rules)

print("Matarani fixed!")
