"""
SEED DEFINITIVO PT3 - MEJILLONES (TPM/TGN + INTERACID + TERQUIM) + BARQUITO
Fuente: PNG_Mejillones_TGN_Layout.md, PNG_Mejillones_Interacid_Layout.md,
        PNG_Mejillones_Terquim_Layout.md, PNG_Barquito_Layout.md
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
# 5. MEJILLONES / TPM  (=TGN en el PNG)
# Fuente: PNG_Mejillones_TGN_Layout.md
# TOTAL ref Moquegua: $57,999.77
# ══════════════════════════════════════════════════════════
P, T = 'MEJILLONES', 'TPM'
# A) Shifting
R(P,T,'mej_tgn_pilotage',
  'Pilotage.', 'shifting',
  1.00, 'PER_GRT', '(GRT / 8259) * 1207.38',  # se calcula sobre GRT, ref: $1,207.38 para GRT=8259
  'Tarifa fija segun Autoridad Maritima Chile. Variable segun GRT.')

R(P,T,'mej_tgn_towage',
  'Towage.', 'shifting',
  2800.00, 'PER_MANEUVER', '2800 * QTY',
  'Tarifa Fija 2026 $2,800 por maniobra mooring/unmooring. Remolcadores Ultratug Ltd.')

R(P,T,'mej_tgn_pilot_ins',
  'Pilot Insurance (amarre/desamarre/anchorage)', 'shifting',
  110.00, 'FIXED', '110 * 3',  # 3 operaciones: amarre, desamarre, anchorage
  'Tarifa Fija Puerto Mejillones. $110 x operacion (3 operaciones).')

R(P,T,'mej_tgn_linesmen',
  'Linesmen /amarre y desamarre', 'shifting',
  871.25, 'FIXED', '871.25 * 2',  # 2 maniobras
  'Tarifa fija segun Puerto Mejillones. Amarradores en tierra.')

# B) General Port Expenses
R(P,T,'mej_tgn_lighthouse',
  'Ligth Dues.( $1.60*GRT)', 'general_port',
  1.60, 'PER_GRT', '1.60 * GRT',
  'LIGHT DUES CHILE = USD 1.60 /GRT POR ANO.')

R(P,T,'mej_tgn_dockage',
  'Dockage /Muellaje ( $3.99*LOA*Hr)', 'general_port',
  3.99, 'PER_LOA_HOUR', '3.99 * LOA * HOURS',
  '3.99 *loa*36 h. Tarifa Puerto Mejillones TGN.')

R(P,T,'mej_tgn_launch_anchorage',
  'Launch Anchorage', 'general_port',
  390.00, 'FIXED', '390',
  'Por hora, si es requerida.', is_optional=True)

R(P,T,'mej_tgn_launch_pier',
  'Launch pier usage', 'general_port',
  420.00, 'FIXED', '420',
  'Uso por muelle.')

R(P,T,'mej_tgn_launch_recepcion',
  'Launch recepcion/amarre y desamarre', 'general_port',
  450.00, 'PER_MANEUVER', '450 * QTY',
  'T.Fija. Mooring (02 lanchas) / unmooring (01 lancha). Recepcion por maniobra/por lancha.')

R(P,T,'mej_tgn_launch_clearances',
  'Launch Inward/Outward clearances', 'general_port',
  420.00, 'FIXED', '420 * 2',
  'Clearances entrada y salida.')

R(P,T,'mej_tgn_pilot_transport',
  'Pilot Transport (amarre/desamarre/anchorage)', 'general_port',
  165.00, 'FIXED', '165 * 3',
  'Tarifa fija segun Puerto Mejillones.')

R(P,T,'mej_tgn_auth_transport',
  'Authorities Transport ( In/Out)', 'general_port',
  650.00, 'FIXED', '650',
  '')

R(P,T,'mej_tgn_auth_charges',
  'Authorities Charges ( Inward/Outward clearances)', 'general_port',
  700.00, 'FIXED', '700',
  'Authorities clearance fee.')

R(P,T,'mej_tgn_isps',
  'ISPS Fee.', 'general_port',
  1140.35, 'FIXED', '1140.35',
  'Tarifa fija segun Puerto Mejillones.')

R(P,T,'mej_tgn_immigration',
  'Immigration Authorities.', 'general_port',
  25.00, 'FIXED', '25',
  'Tarifa fija segun Policia de Investigacion de Chile.')

R(P,T,'mej_tgn_health',
  'Health authorities.', 'general_port',
  110.00, 'FIXED', '110',
  'Tarifa fija segun Sanidad Maritima.')

R(P,T,'mej_tgn_loading_master',
  'Loading Master', 'general_port',
  3264.40, 'FIXED', '3264.40',
  'Tarifa fija segun Puerto Mejillones. $62 x th 36 H.')

# C) Agency
R(P,T,'mej_tgn_agency_fee',
  'Agency Fee', 'agency',
  1200.00, 'FIXED', '1200',
  'Tarifa fija. B&M por Agenciamiento de Nave.')

print("MEJILLONES TGN/TPM OK")

# ══════════════════════════════════════════════════════════
# 6. MEJILLONES / INTERACID
# Fuente: PNG_Mejillones_Interacid_Layout.md
# TOTAL ref Moquegua: $64,199.41
# ══════════════════════════════════════════════════════════
P, T = 'MEJILLONES', 'INTERACID'
R(P,T,'mej_int_pilotage',
  'Pilotage.( Based on GRT)', 'shifting',
  1.00, 'PER_GRT', '(GRT / 8259) * 1151.01',
  'Tarifa fija segun Autoridad Maritima Chile. Variable segun GRT.')

R(P,T,'mej_int_towage',
  'Towage.', 'shifting',
  2800.00, 'PER_MANEUVER', '2800 * QTY',
  'Tarifa Fija 2026 $2,800 maniobra mooring/unmooring. Remolcadores Ultratug Ltd.')

R(P,T,'mej_int_pilot_ins',
  'Pilot Insurance (amarre/desamarre/anchorage)', 'shifting',
  110.00, 'FIXED', '110 * 3',
  'Tarifa Fija Puerto Mejillones.')

R(P,T,'mej_int_linesmen',
  'Linesmen /amarre y desamarre', 'shifting',
  870.00, 'FIXED', '870 * 2',
  'Tarifa fija segun Puerto Mejillones. Amarradores en tierra.')

# B) General
R(P,T,'mej_int_lighthouse',
  'Ligth Dues.( $1.60*GRT)', 'general_port',
  1.60, 'PER_GRT', '1.60 * GRT',
  'LIGHT DUES CHILE = USD 1.60 /GRT POR ANO.')

R(P,T,'mej_int_dockage',
  'Dockage /Muellaje', 'general_port',
  702.00, 'PER_HOUR', '702 * HOURS',
  '702 *TH /36 H. Tarifa Puerto Mejillones Interacid.')

R(P,T,'mej_int_launch_anchorage',
  'Launch Anchorage', 'general_port',
  390.00, 'FIXED', '390',
  'Por hora, si es requerida.', is_optional=True)

R(P,T,'mej_int_launch_pier',
  'Launch pier usage', 'general_port',
  420.00, 'FIXED', '420',
  'Uso por muelle.')

R(P,T,'mej_int_launch_recepcion',
  'Launch recepcion/amarre y desamarre', 'general_port',
  450.00, 'PER_MANEUVER', '450 * QTY',
  'T.Fija. Mooring (02 lanchas) / unmooring (01 lancha). Recepcion por maniobra/por lancha.')

R(P,T,'mej_int_launch_embarcadero',
  'Launch embarcadero', 'general_port',
  280.00, 'FIXED', '280',
  'T.Fija. Mooring (02 lanchas) / unmooring (01 lancha). Recepcion por maniobra/por lancha.')

R(P,T,'mej_int_launch_clearances',
  'Launch Inward/Outward clearances', 'general_port',
  420.00, 'FIXED', '420 * 2',
  '')

R(P,T,'mej_int_pilot_transport',
  'Pilot Transport (amarre/desamarre/anchorage)', 'general_port',
  165.00, 'FIXED', '165 * 3',
  'Tarifa fija segun Puerto Mejillones.')

R(P,T,'mej_int_auth_transport',
  'Authorities Transport ( In/Out)', 'general_port',
  650.00, 'FIXED', '650',
  '')

R(P,T,'mej_int_auth_charges',
  'Authorities Charges ( Inward/Outward clearances)', 'general_port',
  700.00, 'FIXED', '700',
  'Authorities clearance fee.')

R(P,T,'mej_int_isps',
  'ISPS Fee.', 'general_port',
  1273.00, 'FIXED', '1273',
  'Tarifa fija segun Puerto Mejillones.')

R(P,T,'mej_int_immigration',
  'Immigration Authorities.', 'general_port',
  28.00, 'FIXED', '28',
  'Tarifa fija segun Policia de Investigacion de Chile.')

R(P,T,'mej_int_health',
  'Health authorities.', 'general_port',
  120.00, 'FIXED', '120',
  'Tarifa fija segun Sanidad Maritima.')

R(P,T,'mej_int_loading_master',
  'Loading Master ($86.00 * Hr)', 'general_port',
  86.00, 'PER_HOUR', '86 * HOURS',
  'Tarifa fija segun Puerto Mejillones. $86 x th 36 H.')

# C) Agency
R(P,T,'mej_int_agency_fee',
  'Agency Fee', 'agency',
  1200.00, 'FIXED', '1200',
  'Tarifa fija. B&M por Agenciamiento de Nave.')

print("MEJILLONES INTERACID OK")

# ══════════════════════════════════════════════════════════
# 7. MEJILLONES / TERQUIM
# Fuente: PNG_Mejillones_Terquim_Layout.md
# TOTAL ref Moquegua: $64,056.27
# ══════════════════════════════════════════════════════════
P, T = 'MEJILLONES', 'TERQUIM'
R(P,T,'mej_ter_pilotage',
  'Pilotage.', 'shifting',
  1.00, 'PER_GRT', '(GRT / 8259) * 1151.01',
  'Tarifa fija segun Autoridad Maritima Chile. Variable segun GRT.')

R(P,T,'mej_ter_towage',
  'Towage.', 'shifting',
  2800.00, 'PER_MANEUVER', '2800 * QTY',
  'Tarifa Fija 2026 $2,800 maniobra mooring/unmooring. Remolcadores Ultratug Ltd.')

R(P,T,'mej_ter_pilot_ins',
  'Pilot Insurance (amarre/desamarre/anchorage)', 'shifting',
  110.00, 'FIXED', '110 * 3',
  'Tarifa Fija Puerto Mejillones.')

R(P,T,'mej_ter_linesmen',
  'Linesmen /amarre y desamarre', 'shifting',
  801.00, 'FIXED', '801 * 2',
  'Tarifa fija segun Puerto Mejillones. Amarradores en tierra.')

# B) General
R(P,T,'mej_ter_lighthouse',
  'Ligth Dues.( $1.60*GRT)', 'general_port',
  1.60, 'PER_GRT', '1.60 * GRT',
  'LIGHT DUES CHILE = USD 1.60 /GRT POR ANO.')

R(P,T,'mej_ter_dockage',
  'Dockage /Muellaje($5.72*LOA*TH)', 'general_port',
  5.72, 'PER_LOA_HOUR', '5.72 * LOA * HOURS',
  '5.72*LOA*TH /30 H. Puerto Mejillones Terquim.')

R(P,T,'mej_ter_launch_recepcion',
  'Launch recepcion/amarre y desamarre', 'general_port',
  450.00, 'PER_MANEUVER', '450 * QTY',
  'T.Fija. Mooring (02 lanchas) / unmooring (01 lancha). Recepcion por maniobra/por lancha.')

R(P,T,'mej_ter_launch_embarcadero',
  'Launch embarcadero', 'general_port',
  280.00, 'FIXED', '280',
  'T.Fija. Mooring (02 lanchas) / unmooring (01 lancha). Recepcion por maniobra/por lancha.')

R(P,T,'mej_ter_launch_anchorage',
  'Launch Anchorage', 'general_port',
  390.00, 'FIXED', '390',
  'Por hora, si es requerida.', is_optional=True)

R(P,T,'mej_ter_launch_clearances',
  'Launch Inward/Outward clearances', 'general_port',
  420.00, 'FIXED', '420 * 2',
  '')

R(P,T,'mej_ter_launch_pier',
  'Launch pier usage', 'general_port',
  420.00, 'FIXED', '420',
  'Uso por muelle.')

R(P,T,'mej_ter_pilot_transport',
  'Pilot Transport (amarre/desamarre/anchorage)', 'general_port',
  165.00, 'FIXED', '165 * 3',
  'Tarifa fija segun Puerto Mejillones.')

R(P,T,'mej_ter_auth_transport',
  'Authorities Transport ( In/Out)', 'general_port',
  650.00, 'FIXED', '650',
  '')

R(P,T,'mej_ter_isps',
  'ISPS Fee.', 'general_port',
  1191.00, 'FIXED', '1191',
  'Tarifa fija segun Puerto Mejillones.')

R(P,T,'mej_ter_auth_charges',
  'Authorities Charges ( Inward/Outward clearances)', 'general_port',
  700.00, 'FIXED', '700',
  'Authorities clearance fee.')

R(P,T,'mej_ter_immigration',
  'Immigration Authorities.', 'general_port',
  28.00, 'FIXED', '28',
  'Tarifa fija segun Policia de Investigacion de Chile.')

R(P,T,'mej_ter_health',
  'Health authorities.', 'general_port',
  120.00, 'FIXED', '120',
  'Tarifa fija segun Sanidad Maritima.')

R(P,T,'mej_ter_loading_master',
  'Loading Master', 'general_port',
  2923.00, 'FIXED', '2923',
  'Tarifa fija segun Puerto Mejillones. Por nominacion USD 2,401.90.')

# C) Agency
R(P,T,'mej_ter_agency_fee',
  'Agency Fee', 'agency',
  1200.00, 'FIXED', '1200',
  'Tarifa fija. B&M por Agenciamiento de Nave.')

R(P,T,'mej_ter_hose',
  'Hose conection/Portalon (Solo Si requiere)', 'agency',
  2500.00, 'FIXED', '2500',
  'Tarifa fija. B&M.', is_optional=True)

print("MEJILLONES TERQUIM OK")

# ══════════════════════════════════════════════════════════
# 8. BARQUITO / GENERAL
# Fuente: PNG_Barquito_Layout.md
# TOTAL ref Moquegua: $89,195.81
# ══════════════════════════════════════════════════════════
P, T = 'BARQUITO', 'GENERAL'
# A) Shifting
R(P,T,'barq_pilotage',
  'Pilotage.', 'shifting',
  1.00, 'PER_GRT', '(GRT / 8259) * 1151.01',
  'Tarifa fija segun Autoridad Maritima Chile.')

R(P,T,'barq_towage',
  'Towage.(amarre/desamarre)', 'shifting',
  6500.00, 'PER_MANEUVER', '6500 * QTY',
  'Tarifa Ultratug. Tarifario Publico. Basado en 02 horas por maniobra.')

R(P,T,'barq_pilot_ins',
  'Pilot Insurance (amarre/desamarre/anchorage)', 'shifting',
  110.00, 'FIXED', '110 * 3',
  'Tarifa Fija. 2 seguros de practico $80.00 c/u. Total $110 x 3.')

R(P,T,'barq_linesmen',
  'Linesmen /amarre y desamarre', 'shifting',
  1000.00, 'FIXED', '1000 * 2',
  'Tarifa fija segun SMPs amarradores en tierra.')

R(P,T,'barq_port_toll',
  'Port toll /Land transport /terminal fee', 'shifting',
  75.00, 'FIXED', '75',
  '')

# B) General Port Expenses
R(P,T,'barq_lighthouse',
  'Ligth Dues.( $1.56*GRT)', 'general_port',
  1.56, 'PER_GRT', '1.56 * GRT',
  'LIGHT DUES CHILE = USD 4.07 /GRT POR ANO: USD 33,614.13 / 15 viajes aprox. NAV.PETRAL PAGA POR ANO.')

R(P,T,'barq_dockage',
  'Dockage /Muellaje( $71.92*TH)', 'general_port',
  71.92, 'PER_HOUR', '71.92 * HOURS',
  'USD 71.92 por hora (28 H).')

R(P,T,'barq_launch_amarre',
  'Launch amarre y desamarre', 'general_port',
  720.00, 'PER_MANEUVER', '720 * QTY',
  'T.Fija. Mooring (x maniobra(02)x02 hrs) / unmooring (x maniobra(02)x01 hrs) por maniobra/por lancha.')

R(P,T,'barq_launch_standby',
  'Launch Stand by', 'general_port',
  100.00, 'PER_HOUR', '100 * HOURS',
  'Lancha Stand by en puerto como regularizacion local.')

R(P,T,'barq_launch_anchorage',
  'Launch Anchorage at roads', 'general_port',
  430.00, 'FIXED', '430',
  'Por hora si es requerida.', is_optional=True)

R(P,T,'barq_launch_clearances',
  'Launch Inward/Outward clearances', 'general_port',
  380.00, 'FIXED', '380 * 2',
  '')

R(P,T,'barq_pilot_transport',
  'Pilot Transport (amarre/desamarre/anchorage)', 'general_port',
  140.00, 'FIXED', '140 * 3',
  'Tarifa fija segun Puerto Mejillones.')

R(P,T,'barq_linesmen_transport',
  'Linesmen transportation', 'general_port',
  350.00, 'FIXED', '350',
  'Linesmen transportation In/Out.')

R(P,T,'barq_tugboat_standby',
  'Tugboat stand by', 'general_port',
  648.00, 'PER_HOUR', '648 * HOURS',
  'Tarifa Ultratug. Concepto exigido por Autoridad Maritima. $648 por hora.')

R(P,T,'barq_tugboat_nav',
  'Tugboat Navigation', 'general_port',
  745.00, 'FIXED', '745 * 8',
  'Navegacion desde Caldera a Barquito (Segundo remolcador). 8 horas aprox.')

R(P,T,'barq_auth_transport',
  'Authorities Transport ( In/Out)', 'general_port',
  550.00, 'FIXED', '550',
  '')

R(P,T,'barq_auth_charges',
  'Authorities Charges ( Inward/Outward clearances)', 'general_port',
  700.00, 'FIXED', '700',
  'Authorities clearance fee.')

R(P,T,'barq_immigration',
  'Immigration Authorities.', 'general_port',
  28.00, 'FIXED', '28',
  'Tarifa fija segun Policia de Investigacion de Chile.')

R(P,T,'barq_health',
  'Health authorities.', 'general_port',
  130.00, 'FIXED', '130',
  'Tarifa fija segun Sanidad maritima.')

# C) Agency
R(P,T,'barq_loading_master',
  'Loading Master', 'agency',
  2450.00, 'FIXED', '2450',
  '')

R(P,T,'barq_agency_fee',
  'Agency Fee', 'agency',
  1200.00, 'FIXED', '1200',
  'Tarifa fija. B&M por Agenciamiento de Nave.')

print("BARQUITO OK")
conn.commit()
print("\n=== SEED DEFINITIVO COMPLETO ===")
