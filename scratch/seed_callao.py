import os, psycopg2, uuid
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
cur = conn.cursor()

port_id = 'CALLAO'
terminal = 'APM'
op_type = 'CARGA'

# First, let's delete existing CALLAO APM rules to insert the correct ones
cur.execute("DELETE FROM port_costs_matrix WHERE port_id = %s AND terminal = %s", (port_id, terminal))

new_concepts = [
    ('pilotage_in', 'Pilotage In', 'shifting'),
    ('towage_in', 'Towage In', 'shifting'),
    ('pilotage_out', 'Pilotage Out', 'shifting'),
    ('towage_out', 'Towage Out', 'shifting')
]

for c in new_concepts:
    cur.execute("INSERT INTO port_cost_concepts (concept_id, concept_name, category) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING", c)

rules = [
    # Shifting Expenses (In)
    ('pilotage_in', 'Pilotage In', 'PER_MANEUVER', 0.0, 'MAX(750, 0.055 * GRT) * QTY', False, 'Pilotaje: Lo que sea mayor entre USD 750 o USD 0.055 x GRT. Luego se multiplica por el Nro de maniobras.'),
    ('towage_in', 'Towage In', 'PER_MANEUVER', 0.0, 'MAX(750 * QTY * TUGBOATS, 0.055 * GRT)', False, 'Remolcaje: Lo que sea mayor entre USD 750 x maniobra x Nro de Tugs o USD 0.055 x GRT.'),
    
    # Shifting Expenses (Out)
    ('pilotage_out', 'Pilotage Out', 'PER_MANEUVER', 0.0, 'MAX(750, 0.055 * GRT) * QTY', False, 'Pilotaje: Lo que sea mayor entre USD 750 o USD 0.055 x GRT. Luego se multiplica por el Nro de maniobras.'),
    ('towage_out', 'Towage Out', 'PER_MANEUVER', 0.0, 'MAX(750 * QTY * TUGBOATS, 0.055 * GRT)', False, 'Remolcaje: Lo que sea mayor entre USD 750 x maniobra x Nro de Tugs o USD 0.055 x GRT.'),
    
    # General Port Expenses
    ('lighthouse_national', 'Lighthouse Dues (Nacional)', 'PER_GRT', 0.03, None, False, 'Derecho de Faro: Aplica USD 0.03 x GRT si proviene de puerto nacional.'),
    ('lighthouse_foreign', 'Lighthouse Dues (Extranjero)', 'PER_GRT', 0.06, None, False, 'Derecho de Faro: Aplica USD 0.06 x GRT si proviene de puerto extranjero.'),
    ('dockage', 'Dockage / Muellaje ($1.50 * LOA * Hr)', 'PER_LOA_HOUR', 1.50, None, False, 'Muellaje: USD 1.50 x Eslora (LOA) x Horas de Puerto estimadas.'),
    ('launch_hire', 'Launch Hire', 'PER_MANEUVER', 0.0, None, True, 'Lanchas: Tarifa plana passthrough (negociada). Típicamente $85 x lancha.'),
    ('coordinator_board', 'Coordinator on board', 'PER_MANEUVER', 0.0, None, True, 'Coordinador: Tarifa plana passthrough. Típicamente USD 225 x turno.'),
    ('clearance', 'Clearance (In/Out)', 'PER_MANEUVER', 0.0, None, True, 'Clearance: Tarifa plana passthrough. Típicamente USD 200.'),
    ('sanitary_inspection', 'Sanitary Inspection', 'PER_MANEUVER', 0.0, None, True, 'Sanidad: Tarifa plana passthrough. Típicamente USD 520.'),
    
    # Agency Expenses
    ('agency_fee', 'Agency Fee', 'FIXED', 1000.0, None, True, 'Agenciamiento: Fee plano passthrough. Típicamente USD 1000.'),
    ('transport_agency', 'Transportation', 'PER_MANEUVER', 0.0, None, True, 'Transporte: Movilidad de autoridades y personal. Tarifa plana passthrough.'),
    ('comms_agency', 'Comunication', 'PER_MANEUVER', 0.0, None, True, 'Comunicaciones: Tarifa plana passthrough.'),
]

for r in rules:
    rule_id = str(uuid.uuid4())
    sql = """
    INSERT INTO port_costs_matrix 
    (rule_id, port_id, terminal, operation_type, vessel_id, concept_id, sub_item_name, multiplier_source, rate_usd, allow_pass_through, calculation_formula_template, logic_comments)
    VALUES (%s, %s, %s, %s, 'ALL', %s, %s, %s, %s, %s, %s, %s)
    """
    cur.execute(sql, (rule_id, port_id, terminal, op_type, r[0], r[1], r[2], r[3], r[5], r[4], r[6]))

# Replicate for DESCARGA
for r in rules:
    rule_id = str(uuid.uuid4())
    sql = """
    INSERT INTO port_costs_matrix 
    (rule_id, port_id, terminal, operation_type, vessel_id, concept_id, sub_item_name, multiplier_source, rate_usd, allow_pass_through, calculation_formula_template, logic_comments)
    VALUES (%s, %s, %s, %s, 'ALL', %s, %s, %s, %s, %s, %s, %s)
    """
    cur.execute(sql, (rule_id, port_id, terminal, 'DESCARGA', r[0], r[1], r[2], r[3], r[5], r[4], r[6]))

conn.commit()
print("Rules inserted for CALLAO APM!")
