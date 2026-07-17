import os
import uuid
import psycopg2
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
conn.autocommit = True
cur = conn.cursor()

# 2. Insert Concepts with Correct Categories (Terquim specific concepts)
concepts = [
    # Shifting
    ('pilotage_mej_terq', 'Pilotage.', 'shifting'),
    ('towage_mej_terq', 'Towage.', 'shifting'),
    ('pilot_ins_mej_terq', 'Pilot Insurance (amarre/desamarre/anchorage)', 'shifting'),
    ('linesmen_mej_terq', 'Linesmen /amarre y desamarre', 'shifting'),
    
    # General
    ('light_mej_terq', 'Ligth  Dues.( $1.60*GRT)', 'general_port'),
    ('dockage_mej_terq', 'Dockage /Muellaje( $5.72*LOA*TH)', 'general_port'),
    ('launch_rec_mej_terq', 'Launch recepcion/amarre y desamarre', 'general_port'),
    ('launch_emb_mej_terq', 'Launch embarcadero', 'general_port'),
    ('launch_anch_mej_terq', 'Launch Anchorage', 'general_port'),
    ('launch_clear_mej_terq', 'Launch Inward/Outward clearances', 'general_port'),
    ('launch_pier_mej_terq', 'Launch pier usage', 'general_port'),
    ('pilot_transp_mej_terq', 'Pilot Transport (amarre/desamarre/anchorage)', 'general_port'),
    ('auth_transp_mej_terq', 'Authorities Transport ( In/Out)', 'general_port'),
    ('isps_mej_terq', 'ISPS Fee.', 'general_port'),
    ('auth_charges_mej_terq', 'Authorities Charges ( Inward/Outward clearances)', 'general_port'),
    ('immig_mej_terq', 'Immigration Authorities.', 'general_port'),
    ('health_mej_terq', 'Health authorities.', 'general_port'),
    ('load_master_mej_terq', 'Loading Master', 'general_port'),
    
    # Agency
    ('agency_fee_mej_terq', 'Agency Fee', 'agency'),
    ('hose_mej_terq', 'Hose conection/Portalon (Solo Si requiere)', 'agency')
]

for c in concepts:
    cur.execute("INSERT INTO port_cost_concepts (concept_id, concept_name, category) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING", c)

# 3. Define Rules exactly matching the image
rules = [
    # Shifting
    ('pilotage_mej_terq', 'Pilotage.', 'PER_GRT', 0.15, None, False, 'Practicaje Terquim: Basado en GRT.'),
    ('towage_mej_terq', 'Towage.', 'PER_MANEUVER', 6500.0, None, False, 'Remolque: $6500 por maniobra.'),
    ('pilot_ins_mej_terq', 'Pilot Insurance (amarre/desamarre/anchorage)', 'PER_MANEUVER', 110.0, None, False, 'Seguro Práctico: $110 por maniobra.'),
    ('linesmen_mej_terq', 'Linesmen /amarre y desamarre', 'PER_MANEUVER', 1000.0, None, False, 'Amarre Mejillones: $1000 por maniobra.'),
    
    # General
    ('light_mej_terq', 'Ligth  Dues.( $1.60*GRT)', 'PER_GRT', 1.60, None, False, 'Faro Mejillones: $1.60 x GRT.'),
    ('dockage_mej_terq', 'Dockage /Muellaje( $5.72*LOA*TH)', 'PER_LOA_HOUR', 5.72, None, False, 'Muellaje Terquim: $5.72 x LOA x Horas.'),
    ('launch_rec_mej_terq', 'Launch recepcion/amarre y desamarre', 'PER_MANEUVER', 720.0, None, False, 'Lancha Recepción/Amarre: $720 por maniobra.'),
    ('launch_emb_mej_terq', 'Launch embarcadero', 'PER_MANEUVER', 720.0, None, False, 'Lancha Embarcadero: $720 por maniobra.'),
    ('launch_anch_mej_terq', 'Launch Anchorage', 'PER_MANEUVER', 720.0, None, False, 'Lancha Anchorage: $720 por maniobra.'),
    ('launch_clear_mej_terq', 'Launch Inward/Outward clearances', 'PER_MANEUVER', 720.0, None, False, 'Lancha Clearances: $720 por maniobra.'),
    ('launch_pier_mej_terq', 'Launch pier usage', 'PER_MANEUVER', 720.0, None, False, 'Lancha Pier Usage: $720 por maniobra.'),
    ('pilot_transp_mej_terq', 'Pilot Transport (amarre/desamarre/anchorage)', 'PER_MANEUVER', 0.0, None, True, 'Transporte Práctico: Pass-through.'),
    ('auth_transp_mej_terq', 'Authorities Transport ( In/Out)', 'PER_MANEUVER', 0.0, None, True, 'Transporte Autoridades: Pass-through.'),
    ('isps_mej_terq', 'ISPS Fee.', 'FIXED', 150.0, None, True, 'ISPS Fee: Pass-through.'),
    ('auth_charges_mej_terq', 'Authorities Charges ( Inward/Outward clearances)', 'FIXED', 500.0, None, True, 'Cargos Autoridades: Flat $500 o Pass-through.'),
    ('immig_mej_terq', 'Immigration Authorities.', 'FIXED', 100.0, None, True, 'Migraciones: Pass-through.'),
    ('health_mej_terq', 'Health authorities.', 'FIXED', 100.0, None, True, 'Sanidad: Pass-through.'),
    ('load_master_mej_terq', 'Loading Master', 'FIXED', 2450.0, None, False, 'Loading Master: Flat $2450.'),
    
    # Agency
    ('agency_fee_mej_terq', 'Agency Fee', 'FIXED', 1200.0, None, False, 'Agency Fee Mejillones: $1200 flat.'),
    ('hose_mej_terq', 'Hose conection/Portalon (Solo Si requiere)', 'PER_MANEUVER', 0.0, None, True, 'Hose Connection: Pass-through si requiere.')
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

# Delete previously existing MEJILLONES TERQUIM to avoid duplicates if re-run
cur.execute("DELETE FROM port_costs_matrix WHERE port_id = 'MEJILLONES' AND terminal = 'TERQUIM'")
insert_rules('MEJILLONES', 'TERQUIM', 'CARGA', rules)
insert_rules('MEJILLONES', 'TERQUIM', 'DESCARGA', rules)

print("Mejillones Terquim fixed!")
