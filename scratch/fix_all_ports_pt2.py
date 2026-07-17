import os
import uuid
import psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
conn.autocommit = True
cur = conn.cursor(cursor_factory=DictCursor)

def safe_id(concept_name):
    import re
    cleaned = re.sub(r'[^a-zA-Z0-9]', '_', concept_name).lower()
    return cleaned[:50]

def insert_rule(port_id, terminal, concept_name, category, sub_item_name, rate_usd, multiplier_source, formula, comments):
    concept_id = safe_id(f"{port_id}_{terminal}_{concept_name}")
    cur.execute("""
        INSERT INTO port_cost_concepts (concept_id, concept_name, category) 
        VALUES (%s, %s, %s) ON CONFLICT DO NOTHING
    """, (concept_id, concept_name, category))
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

# MEJILLONES TGN
port = 'MEJILLONES'
term = 'TGN'
insert_rule(port, term, 'Pilotage', 'shifting', 'Pilotage.', 1.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Autoridad Maritima.')
insert_rule(port, term, 'Towage', 'shifting', 'Towage.', 2800.00, 'FIXED', '{RATE_USD}', 'Tarifa Fija. 2026 $ 2,800. maniobra mooring/unmooring- Remolcadores Ultratug Ltd.')
insert_rule(port, term, 'Pilot Insurance', 'shifting', 'Pilot Insurance (amarre/desamarre/anchorage)', 110.00, 'FIXED', '{RATE_USD}', 'Tarifa Fija Puerto Mejillones.')
insert_rule(port, term, 'Linesmen', 'shifting', 'Linesmen /amarre y desamarre', 871.25, 'FIXED', '{RATE_USD}', 'Tarifa fija según Puerto Mejillones amarradores en tierra.')
insert_rule(port, term, 'Ligth Dues', 'general_port', 'Ligth Dues.( $1.60*GRT)', 1.60, 'PER_GRT', '{RATE_USD} * {GRT}', '*LIGHT DUES CHILE = USD 1.60 /GRT POR AÑO')
insert_rule(port, term, 'Dockage /Muellaje', 'general_port', 'Dockage /Muellaje ( $3.99*LOA*Hr)', 3.99, 'PER_LOA_HOUR', '{RATE_USD} * {LOA} * {HOURS}', '3.99 *loa*36 h')
insert_rule(port, term, 'Launch Anchorage', 'general_port', 'Launch Anchorage', 390.00, 'FIXED', '{RATE_USD}', 'Por hora, si es requerida')
insert_rule(port, term, 'Launch pier usage', 'general_port', 'Launch pier usage', 420.00, 'FIXED', '{RATE_USD}', 'Uso por muelle')
insert_rule(port, term, 'Launch recepcion/amarre', 'general_port', 'Launch recepcion/amarre y desamarre', 450.00, 'FIXED', '{RATE_USD}', 'T.Fija.Mooring (02 lanchas ) /unmooring (01 lancha) /recepción por maniobra/por lancha.')
insert_rule(port, term, 'Launch Inward/Outward', 'general_port', 'Launch Inward/Outward clearances', 420.00, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'Pilot Transport', 'general_port', 'Pilot Transport (amarre/desamarre/anchorage)', 165.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Puerto Mejillones.')
insert_rule(port, term, 'Authorities Transport', 'general_port', 'Authorities Transport ( In/Out)', 650.00, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'Authorities Charges', 'general_port', 'Authorities Charges ( Inward/Outward clearances)', 700.00, 'FIXED', '{RATE_USD}', 'Authorities clearance fee')
insert_rule(port, term, 'ISPS Fee', 'general_port', 'ISPS Fee.', 1140.35, 'FIXED', '{RATE_USD}', 'Tarifa fija según Puerto Mejillones.')
insert_rule(port, term, 'Immigration Authorities', 'general_port', 'Immigration Authorities.', 25.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Policia de Investigacion de Chile.')
insert_rule(port, term, 'Health authorities', 'general_port', 'Health authorities.', 110.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Sanidad Maritima.')
insert_rule(port, term, 'Loading Master', 'general_port', 'Loading Master', 3264.40, 'FIXED', '{RATE_USD}', 'Tarifa fija según Puerto Mejillones. $ 62 x th 36 H')
insert_rule(port, term, 'Agency Fee', 'agency', 'Agency Fee', 1200.00, 'FIXED', '{RATE_USD}', 'Tarifa fija.B&M por Agenciamiento de Nave.')

# MEJILLONES INTERACID
port = 'MEJILLONES'
term = 'INTERACID'
insert_rule(port, term, 'Pilotage', 'shifting', 'Pilotage.( Based on GRT)', 1.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Autoridad Maritima.')
insert_rule(port, term, 'Towage', 'shifting', 'Towage.', 2800.00, 'FIXED', '{RATE_USD}', 'Tarifa Fija. 2026 $ 2,800. maniobra mooring/unmooring- Remolcadores Ultratug Ltd.')
insert_rule(port, term, 'Pilot Insurance', 'shifting', 'Pilot Insurance (amarre/desamarre/anchorage)', 110.00, 'FIXED', '{RATE_USD}', 'Tarifa Fija Puerto Mejillones.')
insert_rule(port, term, 'Linesmen', 'shifting', 'Linesmen /amarre y desamarre', 870.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Puerto Mejillones amarradores en tierra.')
insert_rule(port, term, 'Ligth Dues', 'general_port', 'Ligth Dues.( $1.60*GRT)', 1.60, 'PER_GRT', '{RATE_USD} * {GRT}', '*LIGHT DUES CHILE = USD 1.60 /GRT POR AÑO')
insert_rule(port, term, 'Dockage', 'general_port', 'Dockage /Muellaje', 702.00, 'FIXED', '{RATE_USD}', '702 *TH /36 H')
insert_rule(port, term, 'Launch Anchorage', 'general_port', 'Launch Anchorage', 390.00, 'FIXED', '{RATE_USD}', 'Por hora, si es requerida')
insert_rule(port, term, 'Launch pier usage', 'general_port', 'Launch pier usage', 420.00, 'FIXED', '{RATE_USD}', 'Uso por muelle')
insert_rule(port, term, 'Launch recepcion', 'general_port', 'Launch recepcion/amarre y desamarre', 450.00, 'FIXED', '{RATE_USD}', 'T.Fija.Mooring (02 lanchas ) /unmooring (01 lancha) /recepción por maniobra/por lancha.')
insert_rule(port, term, 'Launch embarcadero', 'general_port', 'Launch embarcadero', 280.00, 'FIXED', '{RATE_USD}', 'T.Fija.Mooring (02 lanchas ) /unmooring (01 lancha) /recepción por maniobra/por lancha.')
insert_rule(port, term, 'Launch Inward', 'general_port', 'Launch Inward/Outward clearances', 420.00, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'Pilot Transport', 'general_port', 'Pilot Transport (amarre/desamarre/anchorage)', 165.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Puerto Mejillones.')
insert_rule(port, term, 'Authorities Transport', 'general_port', 'Authorities Transport ( In/Out)', 650.00, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'Authorities Charges', 'general_port', 'Authorities Charges ( Inward/Outward clearances)', 700.00, 'FIXED', '{RATE_USD}', 'Authorities clearance fee')
insert_rule(port, term, 'ISPS Fee', 'general_port', 'ISPS Fee.', 1273.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Puerto Mejillones.')
insert_rule(port, term, 'Immigration Authorities', 'general_port', 'Immigration Authorities.', 28.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Policia de Investigacion de Chile.')
insert_rule(port, term, 'Health authorities', 'general_port', 'Health authorities.', 120.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Sanidad Maritima.')
insert_rule(port, term, 'Loading Master', 'general_port', 'Loading Master ($86.00 * Hr)', 86.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Puerto Mejillones. $ 86 x th 36 H')
insert_rule(port, term, 'Agency Fee', 'agency', 'Agency Fee', 1200.00, 'FIXED', '{RATE_USD}', 'Tarifa fija.B&M por Agenciamiento de Nave.')

# MEJILLONES TERQUIM
port = 'MEJILLONES'
term = 'TERQUIM'
insert_rule(port, term, 'Pilotage', 'shifting', 'Pilotage.', 1.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Autoridad Maritima.')
insert_rule(port, term, 'Towage', 'shifting', 'Towage.', 2800.00, 'FIXED', '{RATE_USD}', 'Tarifa Fija. 2026 $ 2,800. maniobra mooring/unmooring- Remolcadores Ultratug Ltd.')
insert_rule(port, term, 'Pilot Insurance', 'shifting', 'Pilot Insurance (amarre/desamarre/anchorage)', 110.00, 'FIXED', '{RATE_USD}', 'Tarifa Fija Puerto Mejillones.')
insert_rule(port, term, 'Linesmen', 'shifting', 'Linesmen /amarre y desamarre', 801.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Puerto Mejillones amarradores en tierra.')
insert_rule(port, term, 'Ligth Dues', 'general_port', 'Ligth Dues.( $1.60*GRT)', 1.60, 'PER_GRT', '{RATE_USD} * {GRT}', '*LIGHT DUES CHILE = USD 1.60 /GRT POR AÑO')
insert_rule(port, term, 'Dockage', 'general_port', 'Dockage /Muellaje($5.72*LOA*TH)', 5.72, 'PER_LOA_HOUR', '{RATE_USD} * {LOA} * {HOURS}', '5.72*LOA*TH /30 H Puerto Mejillones terquim')
insert_rule(port, term, 'Launch recepcion', 'general_port', 'Launch recepcion/amarre y desamarre', 450.00, 'FIXED', '{RATE_USD}', 'T.Fija.Mooring (02 lanchas ) /unmooring (01 lancha) /recepción por maniobra/por lancha.')
insert_rule(port, term, 'Launch embarcadero', 'general_port', 'Launch embarcadero', 280.00, 'FIXED', '{RATE_USD}', 'T.Fija.Mooring (02 lanchas ) /unmooring (01 lancha) /recepción por maniobra/por lancha.')
insert_rule(port, term, 'Launch Anchorage', 'general_port', 'Launch Anchorage', 390.00, 'FIXED', '{RATE_USD}', 'Por hora, si es requerida')
insert_rule(port, term, 'Launch Inward', 'general_port', 'Launch Inward/Outward clearances', 420.00, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'Launch pier usage', 'general_port', 'Launch pier usage', 420.00, 'FIXED', '{RATE_USD}', 'Uso por muelle')
insert_rule(port, term, 'Pilot Transport', 'general_port', 'Pilot Transport (amarre/desamarre/anchorage)', 165.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Puerto Mejillones.')
insert_rule(port, term, 'Authorities Transport', 'general_port', 'Authorities Transport ( In/Out)', 650.00, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'ISPS Fee', 'general_port', 'ISPS Fee.', 1191.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Puerto Mejillones.')
insert_rule(port, term, 'Authorities Charges', 'general_port', 'Authorities Charges ( Inward/Outward clearances)', 700.00, 'FIXED', '{RATE_USD}', 'Authorities clearance fee')
insert_rule(port, term, 'Immigration Authorities', 'general_port', 'Immigration Authorities.', 28.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Policia de Investigacion de Chile.')
insert_rule(port, term, 'Health authorities', 'general_port', 'Health authorities.', 120.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Sanidad Maritima.')
insert_rule(port, term, 'Loading Master', 'general_port', 'Loading Master', 2923.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Puerto Mejillones.por nominacion usd 2401.90')
insert_rule(port, term, 'Agency Fee', 'agency', 'Agency Fee', 1200.00, 'FIXED', '{RATE_USD}', 'Tarifa fija.B&M por Agenciamiento de Nave.')
insert_rule(port, term, 'Hose conection', 'agency', 'Hose conection/Portalon (Solo Si requiere)', 2500.00, 'FIXED', '{RATE_USD}', 'Tarifa fija.B&M .')

# BARQUITO
port = 'BARQUITO'
term = 'BARQUITO'
insert_rule(port, term, 'Pilotage', 'shifting', 'Pilotage.', 1.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Autoridad Maritima.')
insert_rule(port, term, 'Towage', 'shifting', 'Towage.(amarre/desamarre)', 6500.00, 'FIXED', '{RATE_USD}', 'Tarifa Ultratug.(Tarifario Publico ) / Basado en 02 horas')
insert_rule(port, term, 'Pilot Insurance', 'shifting', 'Pilot Insurance (amarre/desamarre/anchorage)', 110.00, 'FIXED', '{RATE_USD}', 'Tarifa Fija por 2 seguros de practico $80.00 c/u.')
insert_rule(port, term, 'Linesmen', 'shifting', 'Linesmen /amarre y desamarre', 1000.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según SMPs amarradores en tierra.')
insert_rule(port, term, 'Port toll', 'shifting', 'Port toll /Land transport /terminal fee', 75.00, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'Ligth Dues', 'general_port', 'Ligth Dues.( $1.56*GRT)', 1.56, 'PER_GRT', '{RATE_USD} * {GRT}', '*LIGHT DUES CHILE = USD 4.07 /GRT POR AÑO : USD 33,614.13 /15 viajes aprox/NAV.PETRAL PAGA POR AÑO')
insert_rule(port, term, 'Dockage', 'general_port', 'Dockage /Muellaje( $71.92*TH)', 71.92, 'PER_HOUR', '{RATE_USD} * {HOURS}', 'USD71.92 por hora (28 H)')
insert_rule(port, term, 'Launch amarre', 'general_port', 'Launch amarre y desamarre', 720.00, 'FIXED', '{RATE_USD}', 'T.Fija.Mooring(x maniobra(02)x02 hrs) /unmooring (x maniobra(02)x01 hrs) por maniobra/por lancha.')
insert_rule(port, term, 'Launch Stand by', 'general_port', 'Launch Stand by', 100.00, 'FIXED', '{RATE_USD}', 'Lancha Stand by en puerto como regularización local')
insert_rule(port, term, 'Launch Anchorage at roads', 'general_port', 'Launch Anchorage at roads', 430.00, 'FIXED', '{RATE_USD}', 'Por hora si es requerida')
insert_rule(port, term, 'Launch Inward', 'general_port', 'Launch Inward/Outward clearances', 380.00, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'Pilot Transport', 'general_port', 'Pilot Transport (amarre/desamarre/anchorage)', 140.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Puerto Mejillones.')
insert_rule(port, term, 'Linesmen transportation', 'general_port', 'Linesmen transportation', 350.00, 'FIXED', '{RATE_USD}', 'Linesmen transportation In/Out')
insert_rule(port, term, 'Tugboat stand by', 'general_port', 'Tugboat stand by', 648.00, 'FIXED', '{RATE_USD}', 'Tarifa Ultratug.( Concepto exigido por Autoridad Maritma) $648 por hora.')
insert_rule(port, term, 'Tugboat Navigation', 'general_port', 'Tugboat Navigation', 745.00, 'FIXED', '{RATE_USD}', 'Navegación desde Caldera a Barquito( Segundo remolcador)')
insert_rule(port, term, 'Authorities Transport', 'general_port', 'Authorities Transport ( In/Out)', 550.00, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'Authorities Charges', 'general_port', 'Authorities Charges ( Inward/Outward clearances)', 700.00, 'FIXED', '{RATE_USD}', 'Authorities clearance fee')
insert_rule(port, term, 'Immigration Authorities', 'general_port', 'Immigration Authorities.', 28.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Policia de Investigacion de Chile.')
insert_rule(port, term, 'Health authorities', 'general_port', 'Health authorities.', 130.00, 'FIXED', '{RATE_USD}', 'Tarifa fija según Sanidad maritima.')
insert_rule(port, term, 'Loading Master', 'agency', 'Loading Master', 2450.00, 'FIXED', '{RATE_USD}', '')
insert_rule(port, term, 'Agency Fee', 'agency', 'Agency Fee', 1200.00, 'FIXED', '{RATE_USD}', 'Tarifa fija.B&M por Agenciamiento de Nave.')

print("Part 2 complete. All ports fixed.")
