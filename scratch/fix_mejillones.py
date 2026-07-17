import os
import uuid
import psycopg2
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
conn.autocommit = True
cur = conn.cursor()

# 1. Delete old Mejillones rules
cur.execute("DELETE FROM port_costs_matrix WHERE port_id = 'MEJILLONES'")

# 2. Insert Concepts with Correct Categories
concepts = [
    # Shifting
    ('pilotage_mejillones', 'Pilotage.', 'shifting'),
    ('towage_mejillones', 'Towage.', 'shifting'),
    ('pilot_ins_mejillones', 'Pilot Insurance (amarre/desamarre/anchorage)', 'shifting'),
    ('linesmen_mejillones', 'Linesmen /amarre y desamarre', 'shifting'),
    
    # General
    ('light_mejillones', 'Ligth  Dues.( $1.60*GRT)', 'general_port'),
    ('dockage_mejillones', 'Dockage /Muellaje ( $3.99*LOA*Hr)', 'general_port'),
    ('launch_anch_mejillones', 'Launch Anchorage', 'general_port'),
    ('launch_pier_mejillones', 'Launch pier usage', 'general_port'),
    ('launch_rec_mejillones', 'Launch recepcion/amarre y desamarre', 'general_port'),
    ('launch_clear_mejillones', 'Launch Inward/Outward clearances', 'general_port'),
    ('pilot_transp_mejillones', 'Pilot Transport (amarre/desamarre/anchorage)', 'general_port'),
    ('auth_transp_mejillones', 'Authorities Transport ( In/Out)', 'general_port'),
    ('auth_charges_mejillones', 'Authorities Charges ( Inward/Outward clearances)', 'general_port'),
    ('isps_mejillones', 'ISPS Fee.', 'general_port'),
    ('immig_mejillones', 'Immigration Authorities.', 'general_port'),
    ('health_mejillones', 'Health authorities.', 'general_port'),
    ('load_master_mejillones', 'Loading Master', 'general_port'),
    
    # Agency
    ('agency_fee_mejillones', 'Agency Fee', 'agency')
]

for c in concepts:
    cur.execute("INSERT INTO port_cost_concepts (concept_id, concept_name, category) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING", c)

# 3. Define Rules exactly matching the image
rules = [
    # Shifting
    ('pilotage_mejillones', 'Pilotage.', 'PER_MANEUVER', 1151.01, None, False, 'Practicaje Mejillones: $1151.01 base.'),
    ('towage_mejillones', 'Towage.', 'PER_MANEUVER', 6500.0, None, False, 'Remolque: $6500 por maniobra.'),
    ('pilot_ins_mejillones', 'Pilot Insurance (amarre/desamarre/anchorage)', 'PER_MANEUVER', 110.0, None, False, 'Seguro Práctico: $110 por maniobra.'),
    ('linesmen_mejillones', 'Linesmen /amarre y desamarre', 'PER_MANEUVER', 1000.0, None, False, 'Amarre Mejillones: $1000 por maniobra.'),
    
    # General
    ('light_mejillones', 'Ligth  Dues.( $1.60*GRT)', 'PER_GRT', 1.60, None, False, 'Faro Mejillones: $1.60 x GRT.'),
    ('dockage_mejillones', 'Dockage /Muellaje ( $3.99*LOA*Hr)', 'PER_LOA_HOUR', 3.99, None, False, 'Muellaje: $3.99 x LOA x Horas.'),
    ('launch_anch_mejillones', 'Launch Anchorage', 'PER_MANEUVER', 720.0, None, False, 'Lancha Anchorage: $720 por maniobra.'),
    ('launch_pier_mejillones', 'Launch pier usage', 'PER_MANEUVER', 720.0, None, False, 'Lancha Pier Usage: $720 por maniobra.'),
    ('launch_rec_mejillones', 'Launch recepcion/amarre y desamarre', 'PER_MANEUVER', 720.0, None, False, 'Lancha Recepción/Amarre: $720 por maniobra.'),
    ('launch_clear_mejillones', 'Launch Inward/Outward clearances', 'PER_MANEUVER', 720.0, None, False, 'Lancha Clearances: $720 por maniobra.'),
    ('pilot_transp_mejillones', 'Pilot Transport (amarre/desamarre/anchorage)', 'PER_MANEUVER', 0.0, None, True, 'Transporte Práctico: Pass-through.'),
    ('auth_transp_mejillones', 'Authorities Transport ( In/Out)', 'PER_MANEUVER', 0.0, None, True, 'Transporte Autoridades: Pass-through.'),
    ('auth_charges_mejillones', 'Authorities Charges ( Inward/Outward clearances)', 'FIXED', 500.0, None, True, 'Cargos Autoridades: Flat $500 o Pass-through.'),
    ('isps_mejillones', 'ISPS Fee.', 'FIXED', 150.0, None, True, 'ISPS Fee: Pass-through.'),
    ('immig_mejillones', 'Immigration Authorities.', 'FIXED', 100.0, None, True, 'Migraciones: Pass-through.'),
    ('health_mejillones', 'Health authorities.', 'FIXED', 100.0, None, True, 'Sanidad: Pass-through.'),
    ('load_master_mejillones', 'Loading Master', 'FIXED', 2450.0, None, False, 'Loading Master: $2450 flat.'),
    
    # Agency
    ('agency_fee_mejillones', 'Agency Fee', 'FIXED', 1200.0, None, False, 'Agency Fee Mejillones: $1200 flat.')
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

insert_rules('MEJILLONES', 'GENERICO', 'CARGA', rules)
insert_rules('MEJILLONES', 'GENERICO', 'DESCARGA', rules)

print("Mejillones fixed!")
