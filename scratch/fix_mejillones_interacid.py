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
    ('pilotage_mej_int', 'Pilotage.( Based on GRT)', 'shifting'),
    ('towage_mej_int', 'Towage.', 'shifting'),
    ('pilot_ins_mej_int', 'Pilot Insurance (amarre/desamarre/anchorage)', 'shifting'),
    ('linesmen_mej_int', 'Linesmen /amarre y desamarre', 'shifting'),
    
    # General
    ('light_mej_int', 'Ligth  Dues.( $1.60*GRT)', 'general_port'),
    ('dockage_mej_int', 'Dockage /Muellaje', 'general_port'),
    ('launch_anch_mej_int', 'Launch Anchorage', 'general_port'),
    ('launch_pier_mej_int', 'Launch pier usage', 'general_port'),
    ('launch_rec_mej_int', 'Launch recepcion/amarre y desamarre', 'general_port'),
    ('launch_emb_mej_int', 'Launch embarcadero', 'general_port'),
    ('launch_clear_mej_int', 'Launch Inward/Outward clearances', 'general_port'),
    ('pilot_transp_mej_int', 'Pilot Transport (amarre/desamarre/anchorage)', 'general_port'),
    ('auth_transp_mej_int', 'Authorities Transport ( In/Out)', 'general_port'),
    ('auth_charges_mej_int', 'Authorities Charges ( Inward/Outward clearances)', 'general_port'),
    ('isps_mej_int', 'ISPS Fee.', 'general_port'),
    ('immig_mej_int', 'Immigration Authorities.', 'general_port'),
    ('health_mej_int', 'Health authorities.', 'general_port'),
    ('load_master_mej_int', 'Loading Master ($86.00 * Hr)', 'general_port'),
    
    # Agency
    ('agency_fee_mej_int', 'Agency Fee', 'agency')
]

for c in concepts:
    cur.execute("INSERT INTO port_cost_concepts (concept_id, concept_name, category) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING", c)

# 3. Define Rules exactly matching the image
rules = [
    # Shifting
    ('pilotage_mej_int', 'Pilotage.( Based on GRT)', 'PER_GRT', 0.15, None, False, 'Practicaje Interacid: Basado en GRT (ej proxy 0.15).'),
    ('towage_mej_int', 'Towage.', 'PER_MANEUVER', 6500.0, None, False, 'Remolque: $6500 por maniobra.'),
    ('pilot_ins_mej_int', 'Pilot Insurance (amarre/desamarre/anchorage)', 'PER_MANEUVER', 110.0, None, False, 'Seguro Práctico: $110 por maniobra.'),
    ('linesmen_mej_int', 'Linesmen /amarre y desamarre', 'PER_MANEUVER', 1000.0, None, False, 'Amarre Mejillones: $1000 por maniobra.'),
    
    # General
    ('light_mej_int', 'Ligth  Dues.( $1.60*GRT)', 'PER_GRT', 1.60, None, False, 'Faro Mejillones: $1.60 x GRT.'),
    ('dockage_mej_int', 'Dockage /Muellaje', 'PER_LOA_HOUR', 3.99, None, False, 'Muellaje: proxy tarifa (depende terminal).'),
    ('launch_anch_mej_int', 'Launch Anchorage', 'PER_MANEUVER', 720.0, None, False, 'Lancha Anchorage: $720 por maniobra.'),
    ('launch_pier_mej_int', 'Launch pier usage', 'PER_MANEUVER', 720.0, None, False, 'Lancha Pier Usage: $720 por maniobra.'),
    ('launch_rec_mej_int', 'Launch recepcion/amarre y desamarre', 'PER_MANEUVER', 720.0, None, False, 'Lancha Recepción/Amarre: $720 por maniobra.'),
    ('launch_emb_mej_int', 'Launch embarcadero', 'PER_MANEUVER', 720.0, None, False, 'Lancha Embarcadero: $720 por maniobra.'),
    ('launch_clear_mej_int', 'Launch Inward/Outward clearances', 'PER_MANEUVER', 720.0, None, False, 'Lancha Clearances: $720 por maniobra.'),
    ('pilot_transp_mej_int', 'Pilot Transport (amarre/desamarre/anchorage)', 'PER_MANEUVER', 0.0, None, True, 'Transporte Práctico: Pass-through.'),
    ('auth_transp_mej_int', 'Authorities Transport ( In/Out)', 'PER_MANEUVER', 0.0, None, True, 'Transporte Autoridades: Pass-through.'),
    ('auth_charges_mej_int', 'Authorities Charges ( Inward/Outward clearances)', 'FIXED', 500.0, None, True, 'Cargos Autoridades: Flat $500 o Pass-through.'),
    ('isps_mej_int', 'ISPS Fee.', 'FIXED', 150.0, None, True, 'ISPS Fee: Pass-through.'),
    ('immig_mej_int', 'Immigration Authorities.', 'FIXED', 100.0, None, True, 'Migraciones: Pass-through.'),
    ('health_mej_int', 'Health authorities.', 'FIXED', 100.0, None, True, 'Sanidad: Pass-through.'),
    ('load_master_mej_int', 'Loading Master ($86.00 * Hr)', 'PER_HOUR', 86.0, 'MAX(4, PORT_HOURS) * 86', False, 'Loading Master: $86.00 por hora.'),
    
    # Agency
    ('agency_fee_mej_int', 'Agency Fee', 'FIXED', 1200.0, None, False, 'Agency Fee Mejillones: $1200 flat.')
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

insert_rules('MEJILLONES', 'INTERACID', 'CARGA', rules)
insert_rules('MEJILLONES', 'INTERACID', 'DESCARGA', rules)

print("Mejillones Interacid fixed!")
