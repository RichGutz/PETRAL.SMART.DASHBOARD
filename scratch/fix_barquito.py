import os
import uuid
import psycopg2
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
conn.autocommit = True
cur = conn.cursor()

# 2. Insert Concepts with Correct Categories (Barquito specific concepts)
concepts = [
    # Shifting
    ('pilotage_barq', 'Pilotage.', 'shifting'),
    ('towage_barq', 'Towage.(amarre/desamarre)', 'shifting'),
    ('pilot_ins_barq', 'Pilot Insurance (amarre/desamarre/anchorage)', 'shifting'),
    ('linesmen_barq', 'Linesmen /amarre y desamarre', 'shifting'),
    ('port_toll_barq', 'Port toll /Land transport /terminal fee', 'shifting'),
    
    # General
    ('light_barq', 'Ligth  Dues.( $1.56*GRT)', 'general_port'),
    ('dockage_barq', 'Dockage /Muellaje( $71.92*TH)', 'general_port'),
    ('launch_am_barq', 'Launch amarre y desamarre', 'general_port'),
    ('launch_sb_barq', 'Launch Stand by', 'general_port'),
    ('launch_anch_barq', 'Launch Anchorage at roads', 'general_port'),
    ('launch_clear_barq', 'Launch Inward/Outward clearances', 'general_port'),
    ('pilot_transp_barq', 'Pilot Transport (amarre/desamarre/anchorage)', 'general_port'),
    ('linesmen_transp_barq', 'Linesmen transportation', 'general_port'),
    ('tugboat_sb_barq', 'Tugboat stand by', 'general_port'),
    ('tugboat_nav_barq', 'Tugboat Navigation', 'general_port'),
    ('auth_transp_barq', 'Authorities Transport ( In/Out)', 'general_port'),
    ('auth_charges_barq', 'Authorities Charges ( Inward/Outward clearances)', 'general_port'),
    ('immig_barq', 'Immigration Authorities.', 'general_port'),
    ('health_barq', 'Health authorities.', 'general_port'),
    
    # Agency
    ('load_master_barq', 'Loading Master', 'agency'),
    ('agency_fee_barq', 'Agency Fee', 'agency')
]

for c in concepts:
    cur.execute("INSERT INTO port_cost_concepts (concept_id, concept_name, category) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING", c)

# 3. Define Rules exactly matching the image
rules = [
    # Shifting
    ('pilotage_barq', 'Pilotage.', 'PER_MANEUVER', 1.00, None, True, 'Practicaje: $1.00 base/pass-through.'),
    ('towage_barq', 'Towage.(amarre/desamarre)', 'PER_MANEUVER', 6500.0, None, False, 'Remolque: $6500 por maniobra.'),
    ('pilot_ins_barq', 'Pilot Insurance (amarre/desamarre/anchorage)', 'PER_MANEUVER', 110.0, None, False, 'Seguro Práctico: $110 por maniobra.'),
    ('linesmen_barq', 'Linesmen /amarre y desamarre', 'PER_MANEUVER', 1000.0, None, False, 'Amarre: $1000 por maniobra.'),
    ('port_toll_barq', 'Port toll /Land transport /terminal fee', 'PER_MANEUVER', 75.0, None, False, 'Port Toll: $75 por maniobra.'),
    
    # General
    ('light_barq', 'Ligth  Dues.( $1.56*GRT)', 'PER_GRT', 1.56, None, False, 'Faro: $1.56 x GRT.'),
    ('dockage_barq', 'Dockage /Muellaje( $71.92*TH)', 'PER_HOUR', 71.92, None, False, 'Muellaje: $71.92 x Horas.'),
    ('launch_am_barq', 'Launch amarre y desamarre', 'PER_MANEUVER', 720.0, None, False, 'Lancha Amarre: $720 por maniobra.'),
    ('launch_sb_barq', 'Launch Stand by', 'PER_HOUR', 100.0, None, False, 'Lancha Stand By: $100 / hora.'),
    ('launch_anch_barq', 'Launch Anchorage at roads', 'PER_MANEUVER', 430.0, None, False, 'Lancha Anchorage: $430 por maniobra.'),
    ('launch_clear_barq', 'Launch Inward/Outward clearances', 'PER_MANEUVER', 380.0, None, False, 'Lancha Clearances: $380 por maniobra.'),
    ('pilot_transp_barq', 'Pilot Transport (amarre/desamarre/anchorage)', 'PER_MANEUVER', 140.0, None, False, 'Transporte Práctico: $140 por maniobra.'),
    ('linesmen_transp_barq', 'Linesmen transportation', 'PER_MANEUVER', 350.0, None, False, 'Transporte Amarre: $350 por maniobra.'),
    ('tugboat_sb_barq', 'Tugboat stand by', 'PER_HOUR', 648.0, None, False, 'Tug Stand By: $648 / hora.'),
    ('tugboat_nav_barq', 'Tugboat Navigation', 'PER_MANEUVER', 745.0, None, False, 'Tug Navigation: $745 por maniobra.'),
    ('auth_transp_barq', 'Authorities Transport ( In/Out)', 'FIXED', 550.0, None, False, 'Transporte Autoridades: $550 flat.'),
    ('auth_charges_barq', 'Authorities Charges ( Inward/Outward clearances)', 'FIXED', 700.0, None, False, 'Cargos Autoridades: $700 flat.'),
    ('immig_barq', 'Immigration Authorities.', 'FIXED', 28.0, None, False, 'Migraciones: $28 flat.'),
    ('health_barq', 'Health authorities.', 'FIXED', 130.0, None, False, 'Sanidad: $130 flat.'),
    
    # Agency
    ('load_master_barq', 'Loading Master', 'FIXED', 2450.0, None, False, 'Loading Master: $2450 flat.'),
    ('agency_fee_barq', 'Agency Fee', 'FIXED', 1200.0, None, False, 'Agency Fee: $1200 flat.')
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

cur.execute("DELETE FROM port_costs_matrix WHERE port_id = 'BARQUITO'")
insert_rules('BARQUITO', 'GENERICO', 'CARGA', rules)
insert_rules('BARQUITO', 'GENERICO', 'DESCARGA', rules)

print("Barquito fixed!")
