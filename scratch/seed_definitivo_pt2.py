"""
SEED DEFINITIVO PT2 - MATARANI + MARCONA
Fuente: PNG_Matarani_Layout.md, PNG_Marcona_Layout.md
"""
import os, uuid, psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(
    os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD'))
)
conn.autocommit = False
cur = conn.cursor(cursor_factory=DictCursor)

CALC_TYPE_MAP = {
    'PER_GRT':      'VARIABLE_TONS',
    'PER_LOA_HOUR': 'VARIABLE_TIME',
    'PER_MANEUVER': 'VARIABLE_TIME',
    'PER_HOUR':     'VARIABLE_TIME',
    'FIXED':        'FIXED',
}

def R(port_id, terminal, concept_id, sub_item, category,
      rate, multiplier, formula, comments,
      origin_country=None, is_optional=False, allow_pt=False):
    calc_type = CALC_TYPE_MAP.get(multiplier, 'FIXED')
    cur.execute("""
        INSERT INTO port_cost_concepts (concept_id, concept_name, category, default_calculation_type)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (concept_id) DO UPDATE
          SET concept_name=EXCLUDED.concept_name,
              category=EXCLUDED.category,
              default_calculation_type=EXCLUDED.default_calculation_type
    """, (concept_id, sub_item, category, calc_type))
    for op in ('CARGA', 'DESCARGA'):
        cur.execute("""
            INSERT INTO port_costs_matrix
            (rule_id, port_id, terminal, operation_type, vessel_id, concept_id,
             cost, rate_usd, multiplier_source, calculation_formula_template,
             sub_item_name, origin_country, allow_pass_through, is_optional, logic_comments)
            VALUES (%s,%s,%s,%s,'ALL',%s, 0,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            str(uuid.uuid4()), port_id, terminal, op, concept_id,
            rate, multiplier, formula,
            sub_item, origin_country, allow_pt, is_optional, comments
        ))

# ══════════════════════════════════════════════════════════
# 3. MATARANI / GENERAL
# Fuente: PNG_Matarani_Layout.md  (Terminal: Tisur)
# ══════════════════════════════════════════════════════════
P, T = 'MATARANI', 'GENERAL'
# A) Shifting
R(P,T,'matarani_integral',
  'Pilot + Tug Boats + Lancha para pilot (Servicio integral)', 'shifting',
  5550.00, 'PER_MANEUVER', '5550 * QTY',
  'Tarifa servicio integral-PSA. Incluye Remolcaje, Practicaje, Lancha.')

R(P,T,'matarani_recargo_25',
  'Recargo Servicio Integral Atraque/Desatraque - 25%', 'shifting',
  5550.00, 'FIXED', '5550 * 0.25',
  'Tarifa servicio integral-PSA min 25% max 50%. Sobre tarifa base $5,550.')

R(P,T,'matarani_recargo_50',
  'Recargo Servicio Integral Atraque/Desatraque - 50%', 'shifting',
  5550.00, 'FIXED', '5550 * 0.50',
  'Tarifa servicio integral-PSA min 25% max 50%. Sobre tarifa base $5,550.', is_optional=True)

R(P,T,'matarani_cargo_acceso',
  'Cargo de Acceso', 'shifting',
  70.00, 'PER_MANEUVER', '70 * QTY',
  'Tarifa servicio integral-PSA. Acceso $70.00 + IGV.')

R(P,T,'matarani_linesmen',
  'Linesmen /amarre y desamarre', 'shifting',
  357.30, 'FIXED', '357.30',
  '')

R(P,T,'matarani_port_toll',
  'Port toll /Land transport /terminal fee', 'shifting',
  75.00, 'PER_MANEUVER', '75 * MOVES',
  '')

# B) General Port Expenses
R(P,T,'matarani_lighthouse_nac',
  'Lighthouse Dues (Puerto Nacional)', 'general_port',
  0.03, 'PER_GRT', '0.03 * GRT',
  'Tarifa Direccion de Hidrografia y Navegacion.', origin_country='PE')

R(P,T,'matarani_lighthouse_ext',
  'Lighthouse Dues (Puerto Extranjero)', 'general_port',
  0.12, 'PER_GRT', '0.12 * GRT',
  '')

R(P,T,'matarani_dockage',
  'Dockage /Muellaje ( $0.65*LOA*Hr)', 'general_port',
  0.65, 'PER_LOA_HOUR', '0.65 * LOA * HOURS',
  'Tisur Tarifa $0.57 X Hora (24h) X Eslora.')

R(P,T,'matarani_launch_autoridades',
  'Launch autoridades / Min 2 hrs', 'general_port',
  155.00, 'FIXED', '155',
  'Tarifa Transtotal. Fija. Mooring/unmooring por maniobra/por lancha.')

R(P,T,'matarani_sanitary',
  'Sanitary Inspection (Reception/Dispatch)', 'general_port',
  670.00, 'FIXED', '670',
  'Tarifa Region Moquegua.')

R(P,T,'matarani_clearance',
  'Clearance (In/Out)', 'general_port',
  200.00, 'FIXED', '200',
  'Tarifa APN.')

R(P,T,'matarani_coordinator',
  'Coordinator on board', 'general_port',
  225.00, 'FIXED', '225 * DAYS',
  'USD $225 por dia + 18% IGV.')

# C) Agency
R(P,T,'matarani_agency_fee',
  'Agency Fee', 'agency',
  1100.00, 'FIXED', '1100',
  'Tarifa fija Transtotal por Agenciamiento de Nave.')

R(P,T,'matarani_transport',
  'Transportation (Autoridades, coordinador y personal operativo)', 'agency',
  200.00, 'FIXED', '200',
  'Tarifa fija Transtotal.')

R(P,T,'matarani_comms',
  'Comunication', 'agency',
  200.00, 'FIXED', '200',
  'Tarifa fija Transtotal.')

print("MATARANI OK")

# ══════════════════════════════════════════════════════════
# 4. MARCONA / GENERAL
# Fuente: PNG_Marcona_Layout.md  (Terminal: PSA Marine / Shougang)
# ══════════════════════════════════════════════════════════
P, T = 'MARCONA', 'GENERAL'
# A) Shifting
R(P,T,'marcona_practicaje',
  'Practicaje + Launch for pilot', 'shifting',
  4980.00, 'PER_MANEUVER', '4980 * QTY',
  'Tarifa PSA MARINE ($4,980*Mnver + 18%vat) por maniobra.')

R(P,T,'marcona_linesmen',
  'Linesmen /amarre y desamarre (Por maniobra)', 'shifting',
  4450.00, 'PER_MANEUVER', '4450 * QTY',
  'Tarifa PSA MARINE ($4,450*Launchboat + 18%vat). Incluye 2 lanchas y gavieras.')

R(P,T,'marcona_towage',
  'Towage /Remolcaje (Por maniobra)', 'shifting',
  18000.00, 'PER_MANEUVER', '18000 * QTY',
  'Tarifa PSA MARINE ($18,000*Mnver + 18%vat) por maniobra. 2 remolcadores.')

R(P,T,'marcona_port_toll',
  'Port toll /Land transport /terminal fee', 'shifting',
  75.00, 'PER_MANEUVER', '75 * MOVES',
  '')

# B) General Port Expenses
R(P,T,'marcona_lighthouse_nac',
  'Lighthouse Dues (Puerto Nacional)', 'general_port',
  0.03, 'PER_GRT', '0.03 * GRT',
  'Tarifa Direccion de Hidrografia y navegacion.', origin_country='PE')

R(P,T,'marcona_lighthouse_ext',
  'Lighthouse Dues (Puerto Extranjero)', 'general_port',
  0.12, 'PER_GRT', '0.12 * GRT',
  '')

R(P,T,'marcona_coordinator',
  'Coordinator on board', 'general_port',
  225.00, 'FIXED', '225 * DAYS',
  '$225 per day + 18%.')

R(P,T,'marcona_clearance',
  'Clearance Expenses (In/Out)', 'general_port',
  200.00, 'FIXED', '200',
  '')

R(P,T,'marcona_sanitary',
  'Sanitary Inspection (Reception/Dispatch)', 'general_port',
  670.00, 'FIXED', '670',
  'Tarifa APN.')

R(P,T,'marcona_launch_auth',
  'Launch for Authorities', 'general_port',
  200.00, 'FIXED', '200',
  '$200 por maniobra + 18%.')

R(P,T,'marcona_launch_stanby',
  'Launch Hire (Stand By)', 'general_port',
  40.00, 'PER_HOUR', '40 * HOURS',
  '$40 X HORA. Aproximado 40 horas. Tarifa PSA Marine SA.')

R(P,T,'marcona_towage_standby',
  'Remolcaje Stand by (Por maniobra)', 'general_port',
  16000.00, 'FIXED', '16000',
  '$3,000 a partir de 60 horas.', is_optional=True)

# C) Agency
R(P,T,'marcona_agency_fee',
  'Agency Fee', 'agency',
  1400.00, 'FIXED', '1400',
  'Tarifa fija Transtotal por Agenciamiento de Nave.')

R(P,T,'marcona_transport',
  'Transportation (Autoridades, coordinador y personal operativo)', 'agency',
  200.00, 'FIXED', '200',
  'Tarifa fija Transtotal.')

R(P,T,'marcona_comms',
  'Comunication', 'agency',
  250.00, 'FIXED', '250',
  'Tarifa fija Transtotal.')

print("MARCONA OK")
conn.commit()
