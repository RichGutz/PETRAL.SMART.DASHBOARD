"""
SEED DEFINITIVO - port_costs_matrix
Fuente: MDs creados desde los PNGs (1:1)
Terminales reales según tabla `terminals`:
  CALLAO     -> APM
  ILO        -> GENERAL (port_id=ILO)
  MATARANI   -> GENERAL (port_id=MATARANI)
  MARCONA    -> GENERAL (port_id=MARCONA)
  MEJILLONES -> TPM (TGN), INTERACID, TERQUIM
  BARQUITO   -> GENERAL (port_id=BARQUITO)

Columnas port_costs_matrix:
  port_id, terminal, operation_type, vessel_id, concept_id,
  cost, rate_usd, multiplier_source, min_limit, max_limit,
  calculation_formula_template, origin_country, supplier_id,
  sub_item_name, allow_pass_through, is_optional, rule_id, logic_comments
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

# ─────────────────────────────────────────────────────────
# MAPEO FINAL: port_id -> terminal_id  (tabla terminals)
# ─────────────────────────────────────────────────────────
PORT_TERMINAL = {
    'CALLAO':     'APM',
    'ILO':        'GENERAL',
    'MATARANI':   'GENERAL',
    'MARCONA':    'GENERAL',
    'MEJILLONES_TGN':      'TPM',
    'MEJILLONES_INTERACID':'INTERACID',
    'MEJILLONES_TERQUIM':  'TERQUIM',
    'BARQUITO':   'GENERAL',
}

# ─────────────────────────────────────────────────────────
# BORRAR todo lo que vamos a reescribir (limpio)
# ─────────────────────────────────────────────────────────
TO_DELETE = [
    ('CALLAO',     'APM'),
    ('CALLAO',     'DPW'),          # basura de Gemini
    ('ILO',        'GENERAL'),
    ('ILO',        'ENAPU'),        # basura
    ('ILO',        'SPCC'),         # basura
    ('MATARANI',   'GENERAL'),
    ('MATARANI',   'TISUR'),        # basura
    ('MARCONA',    'GENERAL'),
    ('MARCONA',    'SHOUGANG'),     # basura
    ('MARCONA',    'PSA MARINE'),   # basura
    ('MEJILLONES', 'TPM'),
    ('MEJILLONES', 'TGN'),          # basura
    ('MEJILLONES', 'INTERACID'),
    ('MEJILLONES', 'TERQUIM'),
    ('MEJILLONES', 'GENERICO'),     # basura
    ('BARQUITO',   'GENERAL'),
    ('BARQUITO',   'BARQUITO'),     # basura
    ('BARQUITO',   'GENERICO'),     # basura
]

for port, term in TO_DELETE:
    cur.execute("DELETE FROM port_costs_matrix WHERE port_id=%s AND terminal=%s", (port, term))
    print(f"  DELETE {port}/{term}")

# ─────────────────────────────────────────────────────────
# HELPER: insert una regla en ambas operaciones (CARGA/DESCARGA)
# ─────────────────────────────────────────────────────────
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
    """Inserta la misma regla para CARGA y DESCARGA."""
    calc_type = CALC_TYPE_MAP.get(multiplier, 'FIXED')
    # Upsert concept
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
# 1. CALLAO / APM
# Fuente: PNG_Callao_Layout.md
# ══════════════════════════════════════════════════════════
P, T = 'CALLAO', 'APM'
# A) Shifting
R(P,T,'callao_pilotage_flat',      'Pilotage.($750 + OT)',           'shifting',
  750.00, 'PER_MANEUVER', 'MAX(750, 0.055*GRT) * QTY',
  'Tarifa Transtotal. Fija $750 o variable 0.055xGRT por maniobra. Aplica el mayor.')

R(P,T,'callao_pilotage_grt',       'Pilotage ($ 0.055 *GRT)',        'shifting',
  0.055, 'PER_GRT', '0.055 * GRT',
  'Pilotaje variable: $0.055 x GRT. Solo aplica si es mayor a $750.')

R(P,T,'callao_towage_flat',        'Remolcaje',                      'shifting',
  800.00, 'PER_MANEUVER', '800 * QTY * TUGBOATS',
  'Petranso Remolcadores Tarifa minima $ 800 por maniobra (2) 2 in 2 out.')

R(P,T,'callao_towage_grt',         'Remolcaje($ 0.065*GRT)',         'shifting',
  0.065, 'PER_GRT', '0.065 * GRT * TUGBOATS',
  'Remolcaje variable: $0.065 x GRT. Solo aplica si es mayor a $800 por maniobra.')

# B) General Port Expenses
R(P,T,'callao_lighthouse_nac',     'Lighthouse Dues (Puerto Nacional)',   'general_port',
  0.03, 'PER_GRT', '0.03 * GRT',
  'Derecho de Faro: $0.03 x GRT. Aplica si buque viene de PUERTO NACIONAL.',
  origin_country='PE')

R(P,T,'callao_lighthouse_ext',     'Lighthouse Dues (Puerto Extranjero)', 'general_port',
  0.12, 'PER_GRT', '0.12 * GRT',
  'Derecho de Faro: $0.12 x GRT. Aplica si buque viene de PUERTO EXTRANJERO.')

R(P,T,'callao_dockage',            'Dockage /Muellaje ( $1.50*LOA*Hr)',  'general_port',
  1.50, 'PER_LOA_HOUR', '1.50 * LOA * HOURS',
  'Muellaje APM: $1.50 por hora o fraccion, multiplicado por LOA (eslora).')

R(P,T,'callao_launch',             'Launch Hire.',                        'general_port',
  85.00, 'FIXED', '85 * QTY',
  'Tarifa Transtotal. Fija Mooring/unmooring por maniobra/por lancha USD 85.00 x hr.')

R(P,T,'callao_coordinator',        'Coordinator on board',                'general_port',
  225.00, 'FIXED', '225 * DAYS',
  'Tarifa fija Transtotal por Nave. Turno x dia.')

R(P,T,'callao_clearance',          'Clearance ( In/Out )',                'general_port',
  200.00, 'FIXED', '200',
  'Clearance In/Out.')

R(P,T,'callao_sanitary',           'Sanitary Inspection (Reception/Dispatch)', 'general_port',
  520.00, 'FIXED', '520',
  'Tarifa fija segun Sanidad maritima.')

# C) Agency
R(P,T,'callao_agency_fee',         'Agency Fee',                          'agency',
  1000.00, 'FIXED', '1000',
  'Tarifa fija Transtotal por Agenciamiento de Nave.')

R(P,T,'callao_transport',          'Transportation (Autoridades, coordinador y personal operativo)', 'agency',
  200.00, 'FIXED', '200',
  'Tarifa fija Transtotal.')

R(P,T,'callao_comms',              'Comunication',                        'agency',
  250.00, 'FIXED', '250',
  'Tarifa fija Transtotal.')

# ══════════════════════════════════════════════════════════
# 2. ILO / GENERAL
# Fuente: PNG_Ilo_Layout.md
# ══════════════════════════════════════════════════════════
P, T = 'ILO', 'GENERAL'
# A) Shifting
R(P,T,'ilo_practicaje',            'Practicaje',                          'shifting',
  1500.00, 'PER_MANEUVER', '1500 * QTY',
  'Tarifa Port Operations $1,500 por maniobra.')

R(P,T,'ilo_linesmen',              'Linesmen /amarre y desamarre (Por maniobra)', 'shifting',
  170.00, 'PER_MANEUVER', '170 * QTY',
  '')

R(P,T,'ilo_towage_psa',            'Towage /Remolcaje($0.16*GRT*Mnvr*Tug) - PSA MARINE', 'shifting',
  0.16, 'PER_GRT', '0.16 * GRT * MOVES * TUGBOATS',
  'Tarifa-PSA $0.16 x GRT por maniobra por remolcador (2).')

R(P,T,'ilo_towage_pos_psa',        'Remolcaje Posicionamiento - PSA MARINE', 'shifting',
  700.00, 'FIXED', '700',
  'Petranso Remolcadores. Tarifa $0.18 x GRT, sujeta a 10% descuento. Posicionamiento $1,400.')

R(P,T,'ilo_towage_petranso',       'Towage /Remolcaje($0.15*GRT*Mnvr*Tug) - PETRANSO', 'shifting',
  0.15, 'PER_GRT', '0.15 * GRT * MOVES * TUGBOATS',
  'Tarifa PETRANSO $0.15 x GRT por maniobra por remolcador (2).')

R(P,T,'ilo_towage_pos_petranso',   'Remolcaje Posicionamiento - PETRANSO', 'shifting',
  600.00, 'FIXED', '600',
  'Petranso Remolcadores Tarifa $0.18 x GRT, sujeta a 10% descuento, posicionamiento $1,400.')

R(P,T,'ilo_port_toll',             'Port toll /Land transport /terminal fee($75*move)', 'shifting',
  75.00, 'PER_MANEUVER', '75 * MOVES',
  '')

# B) General Port Expenses
R(P,T,'ilo_lighthouse_nac',        'Lighthouse Dues (Puerto Nacional)',   'general_port',
  0.03, 'PER_GRT', '0.03 * GRT',
  'Tarifa Direccion de Hidrografia y navegacion.', origin_country='PE')

R(P,T,'ilo_lighthouse_ext',        'Lighthouse Dues (Puerto Extranjero)', 'general_port',
  0.12, 'PER_GRT', '0.12 * GRT',
  '')

R(P,T,'ilo_coordinator',           'Coordinator on board',                'general_port',
  200.00, 'FIXED', '200 * DAYS',
  'Tarifa fija Transtotal por Nave. Turno x dia.')

R(P,T,'ilo_sanitary',              'Sanitary Inspection (Reception/Dispatch)', 'general_port',
  520.00, 'FIXED', '520',
  'Tarifa fija segun Sanidad maritima. S/1,284.00.')

R(P,T,'ilo_lancha_autoridades',    'Lancha autoridades/practico in/out - Min 4 hrs', 'general_port',
  90.00, 'FIXED', '90 * HOURS',
  'Lanchas de por transporte. Min 4 hrs.')

R(P,T,'ilo_lancha_coordinador',    'Lancha coordinador/ Por hora - Min 4 hrs', 'general_port',
  85.00, 'FIXED', '85 * HOURS',
  'Lanchas de por transporte. Min 4 hrs.')

R(P,T,'ilo_lancha_amarre',         'Lancha amarre/desamarre/ Por maniobra (2in/2out)', 'general_port',
  375.00, 'PER_MANEUVER', '375 * QTY',
  'Lanchas de por transporte. Por maniobra (2in/2out).')

R(P,T,'ilo_lancha_posicion',       'Lancha de posicionamiento/ Por maniobra (Si es aplicable)', 'general_port',
  100.00, 'PER_MANEUVER', '100 * QTY',
  'Lanchas de por transporte.', is_optional=True)

R(P,T,'ilo_clearance',             'Clearance (In/Out)',                  'general_port',
  200.00, 'FIXED', '200',
  'Tarifa fija segun Sanidad maritima.')

# C) Agency
R(P,T,'ilo_agency_fee',            'Agency Fee',                          'agency',
  900.00, 'FIXED', '900',
  'Tarifa fija Transtotal por Agenciamiento de Nave.')

R(P,T,'ilo_transport',             'Transportation (Autoridades, coordinador y personal operativo)', 'agency',
  200.00, 'FIXED', '200',
  'Tarifa fija Transtotal.')

R(P,T,'ilo_comms',                 'Comunication',                        'agency',
  200.00, 'FIXED', '200',
  'Tarifa fija Transtotal.')

print("CALLAO + ILO OK")
conn.commit()
