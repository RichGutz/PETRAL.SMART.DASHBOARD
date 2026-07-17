import os
import uuid
import psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
conn.autocommit = True
cur = conn.cursor(cursor_factory=DictCursor)

port_mappings = [
    ('CALLAO', 'DPW'),
    ('ILO', 'ENAPU'),
    ('MATARANI', 'TISUR'),
    ('MARCONA', 'SHOUGANG'),
    ('MEJILLONES', 'TGN'),
    ('MEJILLONES', 'INTERACID'),
    ('MEJILLONES', 'TERQUIM'),
    ('BARQUITO', 'BARQUITO')
]

# Delete old rules
for port, terminal in port_mappings:
    cur.execute("DELETE FROM port_costs_matrix WHERE port_id = %s AND terminal = %s", (port, terminal))
print("Deleted existing port_costs_matrix rules for all 8 ports.")

def safe_id(concept_name):
    # simple hashing or string cleaning for concept_id
    import re
    cleaned = re.sub(r'[^a-zA-Z0-9]', '_', concept_name).lower()
    return cleaned[:50]

def insert_rule(port_id, terminal, concept_name, category, sub_item_name, rate_usd, multiplier_source, formula, comments):
    concept_id = safe_id(f"{port_id}_{terminal}_{concept_name}")
    
    # 1. Insert Concept
    cur.execute("""
        INSERT INTO port_cost_concepts (concept_id, concept_name, category) 
        VALUES (%s, %s, %s) ON CONFLICT DO NOTHING
    """, (concept_id, concept_name, category))
    
    # 2. Insert Rule (for both CARGA and DESCARGA)
    for op_type in ['CARGA', 'DESCARGA']:
        rule_id = str(uuid.uuid4())
        sql = """
        INSERT INTO port_costs_matrix 
        (rule_id, port_id, terminal, operation_type, vessel_id, concept_id, sub_item_name, multiplier_source, rate_usd, allow_pass_through, calculation_formula_template, logic_comments)
        VALUES (%s, %s, %s, %s, 'ALL', %s, %s, %s, %s, %s, %s, %s)
        """
        allow_pt = False
        if "Pass-through" in comments or rate_usd == 0:
            allow_pt = True
        cur.execute(sql, (rule_id, port_id, terminal, op_type, concept_id, sub_item_name, multiplier_source, rate_usd, allow_pt, formula, comments))

# CALLAO
port = 'CALLAO'
term = 'DPW'
insert_rule(port, term, 'Pilotage.($750 + OT)', 'shifting', 'Pilotage.($750 + OT)', 750.00, 'PER_MANEUVER', '{RATE_USD}', 'Tarifa de Transtotal.Fija.Práctico por maniobra')
insert_rule(port, term, 'Pilotage ($ 0.055 *GRT)', 'shifting', 'Pilotage ($ 0.055 *GRT)', 0.055, 'PER_GRT', '{RATE_USD} * {GRT}', '')
insert_rule(port, term, 'Remolcaje', 'shifting', 'Remolcaje', 800.00, 'PER_MANEUVER', '{RATE_USD}', 'Petranso Remolcadores Tarifa minima $ 800 por maniobra (2) 2 in 2 out')
insert_rule(port, term, 'Remolcaje($ 0.065*GRT)', 'shifting', 'Remolcaje($ 0.065*GRT)', 0.065, 'PER_GRT', '{RATE_USD} * {GRT} * {TUGBOATS}', '')
insert_rule(port, term, 'Lighthouse Dues (Nacional)', 'general_port', 'Lighthouse Dues (Aplica si el buque viene de PUERTO NACIONAL)', 0.03, 'PER_GRT', '{RATE_USD} * {GRT}', 'Tarifa Direccion de Hidrografia y navegacion.')
insert_rule(port, term, 'Lighthouse Dues (Extranjero)', 'general_port', 'Lighthouse Dues (Aplica si el buque viene de PUERTO EXTRANJERO)', 0.12, 'PER_GRT', '{RATE_USD} * {GRT}', '')
insert_rule(port, term, 'Dockage /Muellaje', 'general_port', 'Dockage /Muellaje ( $1.50*LOA*Hr)', 1.50, 'PER_LOA_HOUR', '{RATE_USD} * {LOA} * {HOURS}', 'Tarifa APM $1.50 por hora o fraccion.')
insert_rule(port, term, 'Launch Hire.', 'general_port', 'Launch Hire.', 85.00, 'FIXED', '{RATE_USD}', 'Tarifa de Transtotal.Fija.Mooring /unmooring por maniobra/por lanch USD .85.00 xh.')
insert_rule(port, term, 'Coordinator on board', 'general_port', 'Coordinator on board', 225.00, 'FIXED', '{RATE_USD}', 'Tarifa fija. Transtotal por Nave.Turno x día')
insert_rule(port, term, 'Clearance ( In/Out )', 'general_port', 'Clearance ( In/Out )', 200.00, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'Sanitary Inspection', 'general_port', 'Sanitary Inspection (Reception/Dispatch)', 520.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Sanidad maritima.')
insert_rule(port, term, 'Agency Fee', 'agency', 'Agency Fee', 1000.00, 'FIXED', '{RATE_USD}', 'Tarifa fija Transtotal por Agenciamiento de Nave.')
insert_rule(port, term, 'Transportation', 'agency', 'Transportation (Autoridades,coordinador y personal operativo)', 200.00, 'FIXED', '{RATE_USD}', 'Tarifa fija Transtotal')
insert_rule(port, term, 'Comunication', 'agency', 'Comunication', 250.00, 'FIXED', '{RATE_USD}', 'Tarifa fija Transtotal')

# ILO
port = 'ILO'
term = 'ENAPU'
insert_rule(port, term, 'Practicaje', 'shifting', 'Practicaje', 1500.00, 'FIXED', '{RATE_USD}', 'Tarifa Port Opeartions $ 1,500 por maniobra.')
insert_rule(port, term, 'Linesmen', 'shifting', 'Linesmen /amarre y desamarre( Por maniobra)', 170.00, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'Towage PSA', 'shifting', 'Towage /Remolcaje($0.16*GRT*Mnvr*Tug) - PSA MARINE', 0.16, 'PER_GRT', '{RATE_USD} * {GRT} * {MOVES} * {TUGBOATS}', 'Tarifa-PSA $ 0.16 x Trb por maniobra por remolcador (2)')
insert_rule(port, term, 'Remolcaje Pos PSA', 'shifting', 'Remolcaje Posicionamiento - PSA MARINE', 700.00, 'FIXED', '{RATE_USD}', 'Petranso Remolcadores Tarifa $ 0.18 x Trb , sujeta a 10% descuentos, posicionamiento $ 1400')
insert_rule(port, term, 'Towage PETRANSO', 'shifting', 'Towage /Remolcaje($0.15*GRT*Mnvr*Tug) - PETRANSO', 0.15, 'PER_GRT', '{RATE_USD} * {GRT} * {MOVES} * {TUGBOATS}', 'Tarifa-PSA $ 0.16 x Trb por maniobra por remolcador (2)')
insert_rule(port, term, 'Remolcaje Pos PETRANSO', 'shifting', 'Remolcaje Posicionamiento - PETRANSO', 600.00, 'FIXED', '{RATE_USD}', 'Petranso Remolcadores Tarifa $ 0.18 x Trb , sujeta a 10% descuentos, posicionamiento $ 1400')
insert_rule(port, term, 'Port toll', 'shifting', 'Port toll /Land transport /terminal fee($75*move)', 75.00, 'PER_MANEUVER', '{RATE_USD} * {MOVES}', '')
insert_rule(port, term, 'Lighthouse Dues (Nacional)', 'general_port', 'Lighthouse Dues (Aplica si el buque viene de PUERTO NACIONAL)', 0.03, 'PER_GRT', '{RATE_USD} * {GRT}', 'Tarifa Direccion de Hidrografia y navegacion.')
insert_rule(port, term, 'Lighthouse Dues (Extranjero)', 'general_port', 'Lighthouse Dues (Aplica si el buque viene de PUERTO EXTRANJERO)', 0.12, 'PER_GRT', '{RATE_USD} * {GRT}', '')
insert_rule(port, term, 'Coordinator on board', 'general_port', 'Coordinator on board', 200.00, 'FIXED', '{RATE_USD}', 'Tarifa fija. Transtotal por Nave.Turno x día')
insert_rule(port, term, 'Sanitary Inspection', 'general_port', 'Sanitary Inspection (Reception/Dispatch)', 520.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Sanidad maritima. S/1,284.00')
insert_rule(port, term, 'Lancha autoridades', 'general_port', 'Lancha autoridades,práctico in/out / Por hora- Min 4 hrs', 90.00, 'FIXED', '{RATE_USD}', 'Lanchas de por transporte.')
insert_rule(port, term, 'Lancha coordinador', 'general_port', 'Lancha coordinador/ Por hora - Min 4 hrs', 85.00, 'FIXED', '{RATE_USD}', 'Lanchas de por transporte.')
insert_rule(port, term, 'Lancha amarre', 'general_port', 'Lancha amarre/desamarre/ Por maniobra (2in/ 2out)', 375.00, 'FIXED', '{RATE_USD}', 'Lanchas de por transporte. Por maniobra (2in/ 2out)')
insert_rule(port, term, 'Lancha posicionamiento', 'general_port', 'Lancha de posicionamiento/ Por maniobra(Si es aplicable)', 100.00, 'FIXED', '{RATE_USD}', 'Lanchas de por transporte.')
insert_rule(port, term, 'Clearance', 'general_port', 'Clearance (In/Out)', 200.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Sanidad maritima.')
insert_rule(port, term, 'Agency Fee', 'agency', 'Agency Fee', 900.00, 'FIXED', '{RATE_USD}', 'Tarifa fija Transtotal por Agenciamiento de Nave.')
insert_rule(port, term, 'Transportation', 'agency', 'Transportation (Autoridades,coordinador y personal operativo)', 200.00, 'FIXED', '{RATE_USD}', 'Tarifa fija Transtotal')
insert_rule(port, term, 'Comunication', 'agency', 'Comunication', 200.00, 'FIXED', '{RATE_USD}', 'Tarifa fija Transtotal')

# MATARANI
port = 'MATARANI'
term = 'TISUR'
insert_rule(port, term, 'Pilot/Tug/Lancha', 'shifting', 'Pilot + Tug Boats + Lancha para pilot(Servicio integral)', 5550.00, 'FIXED', '{RATE_USD}', 'Tarifa de servicio integral-PSA . Incluye Remolcaje , Practicaje , Lancha')
insert_rule(port, term, 'Recargo 25%', 'shifting', 'Recargo Servicio Integral Atraque/Desatraque - 25%', 5550.00, 'FIXED', '{RATE_USD} * 0.25', 'Tarifa de servicio integral-PSA min .25% max 50%')
insert_rule(port, term, 'Recargo 50%', 'shifting', 'Recargo Servicio Integral Atraque/Desatraque - 50%', 5550.00, 'FIXED', '{RATE_USD} * 0.50', 'Tarifa de servicio integral-PSA min .25% max 50%')
insert_rule(port, term, 'Cargo de Acceso', 'shifting', 'Cargo de Acceso', 70.00, 'FIXED', '{RATE_USD}', 'Tarifa de servicio integral-PSA . Acceso $ 70.00 + IGV')
insert_rule(port, term, 'Linesmen', 'shifting', 'Linesmen /amarre y desamarre', 357.30, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'Port toll', 'shifting', 'Port toll /Land transport /terminal fee', 75.00, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'Lighthouse Dues (Nacional)', 'general_port', 'Lighthouse Dues (Aplica si el buque viene de PUERTO NACIONAL)', 0.03, 'PER_GRT', '{RATE_USD} * {GRT}', '')
insert_rule(port, term, 'Lighthouse Dues (Extranjero)', 'general_port', 'Lighthouse Dues (Aplica si el buque viene de PUERTO EXTRANJERO)', 0.12, 'PER_GRT', '{RATE_USD} * {GRT}', '')
insert_rule(port, term, 'Dockage /Muellaje', 'general_port', 'Dockage /Muellaje ( $0.65*LOA*Hr)', 0.65, 'PER_LOA_HOUR', '{RATE_USD} * {LOA} * {HOURS}', 'Tisur Tarifa $0.57 X Hora (24 )X Eslora')
insert_rule(port, term, 'Launch autoridades', 'general_port', 'Launch autoridades / Min 2 hrs', 155.00, 'FIXED', '{RATE_USD}', 'Tarifa de Transtotal.Fija.Mooring /unmooring por maniobra/por lancha.')
insert_rule(port, term, 'Sanitary Inspection', 'general_port', 'Sanitary Inspection (Reception/Dispatch)', 670.00, 'FIXED', '{RATE_USD}', 'Tarifa Region Moquegua.')
insert_rule(port, term, 'Clearance', 'general_port', 'Clearance (In/Out)', 200.00, 'FIXED', '{RATE_USD}', 'Tarifa APN.')
insert_rule(port, term, 'Coordinator on board', 'general_port', 'Coordinator on board', 225.00, 'FIXED', '{RATE_USD}', 'USD$225* por dia + 18% IGV')
insert_rule(port, term, 'Agency Fee', 'agency', 'Agency Fee', 1100.00, 'FIXED', '{RATE_USD}', 'Tarifa fija Transtotal por Agenciamiento de Nave.')
insert_rule(port, term, 'Transportation', 'agency', 'Transportation (Autoridades,coordinador y personal operativo)', 200.00, 'FIXED', '{RATE_USD}', 'Tarifa fija Transtotal')
insert_rule(port, term, 'Comunication', 'agency', 'Comunication', 200.00, 'FIXED', '{RATE_USD}', 'Tarifa fija Transtotal')

# MARCONA
port = 'MARCONA'
term = 'SHOUGANG'
insert_rule(port, term, 'Practicaje', 'shifting', 'Practicaje + Launch for pilot', 4980.00, 'FIXED', '{RATE_USD}', 'Tarifa PSA MARINE ($4,980*Mnver + 18%vat) por maniobra.')
insert_rule(port, term, 'Linesmen', 'shifting', 'Linesmen /amarre y desamarre( Por maniobra)', 4450.00, 'FIXED', '{RATE_USD}', 'Tarifa PSA MARINE ($4,450*Launchboat + 18%vat) .(incluye 2 lanchas y gavieras )')
insert_rule(port, term, 'Towage', 'shifting', 'Towage /Remolcaje ( Por maniobra)', 18000.00, 'FIXED', '{RATE_USD}', 'Tarifa PSA MARINE ( $18,000*Mnver + 18%vat) por maniobra 2.')
insert_rule(port, term, 'Port toll', 'shifting', 'Port toll /Land transport /terminal fee', 75.00, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'Lighthouse Dues (Nacional)', 'general_port', 'Lighthouse Dues (Aplica si el buque viene de PUERTO NACIONAL)', 0.03, 'PER_GRT', '{RATE_USD} * {GRT}', 'Tarifa Direccion de Hidrografia y navegacion.')
insert_rule(port, term, 'Lighthouse Dues (Extranjero)', 'general_port', 'Lighthouse Dues (Aplica si el buque viene de PUERTO EXTRANJERO)', 0.12, 'PER_GRT', '{RATE_USD} * {GRT}', '')
insert_rule(port, term, 'Coordinator on board', 'general_port', 'Coordinator on board', 225.00, 'FIXED', '{RATE_USD}', '$ 225 per day +18%')
insert_rule(port, term, 'Clearance Expenses', 'general_port', 'Clearance Expenses (In/Out)', 200.00, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'Sanitary Inspection', 'general_port', 'Sanitary Inspection (Reception/Dispatch)', 670.00, 'FIXED', '{RATE_USD}', 'Tarifa APN.')
insert_rule(port, term, 'Launch for Authorities', 'general_port', 'Launch for Authorities', 200.00, 'FIXED', '{RATE_USD}', '$ 200 * maneuver +18%')
insert_rule(port, term, 'Launch Hire', 'general_port', 'Launch Hire (Stand By)', 40.00, 'FIXED', '{RATE_USD}', '$40X HORA aproximado de 40 horas (Tarifa PSA Marine SA)')
insert_rule(port, term, 'Remolcaje Stand by', 'general_port', 'Remolcaje Stand by.( Por maniobra)', 16000.00, 'FIXED', '{RATE_USD}', '$ 3,000.00 * a partir de 60 horas.')
insert_rule(port, term, 'Agency Fee', 'agency', 'Agency Fee', 1400.00, 'FIXED', '{RATE_USD}', 'Tarifa fija Transtotal por Agenciamiento de Nave.')
insert_rule(port, term, 'Transportation', 'agency', 'Transportation (Autoridades,coordinador y personal operativo)', 200.00, 'FIXED', '{RATE_USD}', 'Tarifa fija Transtotal')
insert_rule(port, term, 'Comunication', 'agency', 'Comunication', 250.00, 'FIXED', '{RATE_USD}', 'Tarifa fija Transtotal')

print("Part 1 complete.")
