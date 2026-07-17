import os
import uuid
import psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
conn.autocommit = False
cursor = conn.cursor(cursor_factory=DictCursor)

try:
    terminals = {
        'Mejillones': ('Chile', 'Mejillones', 'TGN'),
        'Mejillones_Interacid': ('Chile', 'Mejillones', 'Interacid'),
        'Mejillones_Terquim': ('Chile', 'Mejillones', 'Terquim'),
        'Barquito': ('Chile', 'Chanaral', 'Barquito')
    }

    terminal_ids = {}
    for key, (country, port, term) in terminals.items():
        cursor.execute("""
            SELECT t.id 
            FROM maestro_terminales t
            JOIN maestro_puertos p ON t.port_id = p.id
            JOIN maestro_paises pa ON p.country_id = pa.id
            WHERE pa.name = %s AND p.name = %s AND t.name = %s
        """, (country, port, term))
        row = cursor.fetchone()
        if row:
            terminal_ids[key] = row['id']
            print(f"Found {key}: {row['id']}")

    def insert_cost(t_id, section, item, formula, rate, comments):
        cursor.execute("""
            INSERT INTO port_costs (id, terminal_id, category, concept, logic_formula, base_rate, comments)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (str(uuid.uuid4()), t_id, section, item, formula, rate, comments))

    # --- MEJILLONES ---
    tid = terminal_ids.get('Mejillones')
    if tid:
        # A) Shifting Expenses
        insert_cost(tid, 'Shifting Expenses', 'Pilotage.', 'FIXED', 1.00, 'Tarifa fija según Autoridad Maritima.')
        insert_cost(tid, 'Shifting Expenses', 'Towage.', 'FIXED', 2800.00, 'Tarifa Fija. 2026 $ 2,800. maniobra mooring/unmooring- Remolcadores Ultratug Ltd.')
        insert_cost(tid, 'Shifting Expenses', 'Pilot Insurance (amarre/desamarre/anchorage)', 'FIXED', 110.00, 'Tarifa Fija Puerto Mejillones.')
        insert_cost(tid, 'Shifting Expenses', 'Linesmen /amarre y desamarre', 'FIXED', 871.25, 'Tarifa fija según Puerto Mejillones amarradores en tierra.')
        # B) General Port Expenses
        insert_cost(tid, 'General Port Expenses', 'Ligth Dues.( $1.60*GRT)', '1.60 * GRT', 1.60, '*LIGHT DUES CHILE = USD 1.60 /GRT POR AÑO')
        insert_cost(tid, 'General Port Expenses', 'Dockage /Muellaje ( $3.99*LOA*Hr)', '3.99 * LOA * HOURS', 3.99, '3.99 *loa*36 h')
        insert_cost(tid, 'General Port Expenses', 'Launch Anchorage', 'FIXED', 390.00, 'Por hora, si es requerida')
        insert_cost(tid, 'General Port Expenses', 'Launch pier usage', 'FIXED', 420.00, 'Uso por muelle')
        insert_cost(tid, 'General Port Expenses', 'Launch recepcion/amarre y desamarre', 'FIXED', 450.00, 'T.Fija.Mooring (02 lanchas ) /unmooring (01 lancha) /recepción por maniobra/por lancha.')
        insert_cost(tid, 'General Port Expenses', 'Launch Inward/Outward clearances', 'FIXED', 420.00, '')
        insert_cost(tid, 'General Port Expenses', 'Pilot Transport (amarre/desamarre/anchorage)', 'FIXED', 165.00, 'Tarifa fija según Puerto Mejillones.')
        insert_cost(tid, 'General Port Expenses', 'Authorities Transport ( In/Out)', 'FIXED', 650.00, '')
        insert_cost(tid, 'General Port Expenses', 'Authorities Charges ( Inward/Outward clearances)', 'FIXED', 700.00, 'Authorities clearance fee')
        insert_cost(tid, 'General Port Expenses', 'ISPS Fee.', 'FIXED', 1140.35, 'Tarifa fija según Puerto Mejillones.')
        insert_cost(tid, 'General Port Expenses', 'Immigration Authorities.', 'FIXED', 25.00, 'Tarifa fija según Policia de Investigacion de Chile.')
        insert_cost(tid, 'General Port Expenses', 'Health authorities.', 'FIXED', 110.00, 'Tarifa fija según Sanidad Maritima.')
        insert_cost(tid, 'General Port Expenses', 'Loading Master', 'FIXED', 3264.40, 'Tarifa fija según Puerto Mejillones. $ 62 x th 36 H')
        # C) Agency Expenses
        insert_cost(tid, 'Agency Expenses', 'Agency Fee', 'FIXED', 1200.00, 'Tarifa fija.B&M por Agenciamiento de Nave.')

    # --- MEJILLONES INTERACID ---
    tid = terminal_ids.get('Mejillones_Interacid')
    if tid:
        # A) Shifting Expenses
        insert_cost(tid, 'Shifting Expenses', 'Pilotage.( Based on GRT)', 'FIXED', 1.00, 'Tarifa fija según Autoridad Maritima.')
        insert_cost(tid, 'Shifting Expenses', 'Towage.', 'FIXED', 2800.00, 'Tarifa Fija. 2026 $ 2,800. maniobra mooring/unmooring- Remolcadores Ultratug Ltd.')
        insert_cost(tid, 'Shifting Expenses', 'Pilot Insurance (amarre/desamarre/anchorage)', 'FIXED', 110.00, 'Tarifa Fija Puerto Mejillones.')
        insert_cost(tid, 'Shifting Expenses', 'Linesmen /amarre y desamarre', 'FIXED', 870.00, 'Tarifa fija según Puerto Mejillones amarradores en tierra.')
        # B) General Port Expenses
        insert_cost(tid, 'General Port Expenses', 'Ligth Dues.( $1.60*GRT)', '1.60 * GRT', 1.60, '*LIGHT DUES CHILE = USD 1.60 /GRT POR AÑO')
        insert_cost(tid, 'General Port Expenses', 'Dockage /Muellaje', 'FIXED', 702.00, '702 *TH /36 H')
        insert_cost(tid, 'General Port Expenses', 'Launch Anchorage', 'FIXED', 390.00, 'Por hora, si es requerida')
        insert_cost(tid, 'General Port Expenses', 'Launch pier usage', 'FIXED', 420.00, 'Uso por muelle')
        insert_cost(tid, 'General Port Expenses', 'Launch recepcion/amarre y desamarre', 'FIXED', 450.00, 'T.Fija.Mooring (02 lanchas ) /unmooring (01 lancha) /recepción por maniobra/por lancha.')
        insert_cost(tid, 'General Port Expenses', 'Launch embarcadero', 'FIXED', 280.00, 'T.Fija.Mooring (02 lanchas ) /unmooring (01 lancha) /recepción por maniobra/por lancha.')
        insert_cost(tid, 'General Port Expenses', 'Launch Inward/Outward clearances', 'FIXED', 420.00, '')
        insert_cost(tid, 'General Port Expenses', 'Pilot Transport (amarre/desamarre/anchorage)', 'FIXED', 165.00, 'Tarifa fija según Puerto Mejillones.')
        insert_cost(tid, 'General Port Expenses', 'Authorities Transport ( In/Out)', 'FIXED', 650.00, '')
        insert_cost(tid, 'General Port Expenses', 'Authorities Charges ( Inward/Outward clearances)', 'FIXED', 700.00, 'Authorities clearance fee')
        insert_cost(tid, 'General Port Expenses', 'ISPS Fee.', 'FIXED', 1273.00, 'Tarifa fija según Puerto Mejillones.')
        insert_cost(tid, 'General Port Expenses', 'Immigration Authorities.', 'FIXED', 28.00, 'Tarifa fija según Policia de Investigacion de Chile.')
        insert_cost(tid, 'General Port Expenses', 'Health authorities.', 'FIXED', 120.00, 'Tarifa fija según Sanidad Maritima.')
        insert_cost(tid, 'General Port Expenses', 'Loading Master ($86.00 * Hr)', 'FIXED', 86.00, 'Tarifa fija según Puerto Mejillones. $ 86 x th 36 H')
        # C) Agency Expenses
        insert_cost(tid, 'Agency Expenses', 'Agency Fee', 'FIXED', 1200.00, 'Tarifa fija.B&M por Agenciamiento de Nave.')

    # --- MEJILLONES TERQUIM ---
    tid = terminal_ids.get('Mejillones_Terquim')
    if tid:
        # A) Shifting Expenses
        insert_cost(tid, 'Shifting Expenses', 'Pilotage.', 'FIXED', 1.00, 'Tarifa fija según Autoridad Maritima.')
        insert_cost(tid, 'Shifting Expenses', 'Towage.', 'FIXED', 2800.00, 'Tarifa Fija. 2026 $ 2,800. maniobra mooring/unmooring- Remolcadores Ultratug Ltd.')
        insert_cost(tid, 'Shifting Expenses', 'Pilot Insurance (amarre/desamarre/anchorage)', 'FIXED', 110.00, 'Tarifa Fija Puerto Mejillones.')
        insert_cost(tid, 'Shifting Expenses', 'Linesmen /amarre y desamarre', 'FIXED', 801.00, 'Tarifa fija según Puerto Mejillones amarradores en tierra.')
        # B) General Port Expenses
        insert_cost(tid, 'General Port Expenses', 'Ligth Dues.( $1.60*GRT)', '1.60 * GRT', 1.60, '*LIGHT DUES CHILE = USD 1.60 /GRT POR AÑO')
        insert_cost(tid, 'General Port Expenses', 'Dockage /Muellaje($5.72*LOA*TH)', '5.72 * LOA * HOURS', 5.72, '5.72*LOA*TH /30 H Puerto Mejillones terquim')
        insert_cost(tid, 'General Port Expenses', 'Launch recepcion/amarre y desamarre', 'FIXED', 450.00, 'T.Fija.Mooring (02 lanchas ) /unmooring (01 lancha) /recepción por maniobra/por lancha.')
        insert_cost(tid, 'General Port Expenses', 'Launch embarcadero', 'FIXED', 280.00, 'T.Fija.Mooring (02 lanchas ) /unmooring (01 lancha) /recepción por maniobra/por lancha.')
        insert_cost(tid, 'General Port Expenses', 'Launch Anchorage', 'FIXED', 390.00, 'Por hora, si es requerida')
        insert_cost(tid, 'General Port Expenses', 'Launch Inward/Outward clearances', 'FIXED', 420.00, '')
        insert_cost(tid, 'General Port Expenses', 'Launch pier usage', 'FIXED', 420.00, 'Uso por muelle')
        insert_cost(tid, 'General Port Expenses', 'Pilot Transport (amarre/desamarre/anchorage)', 'FIXED', 165.00, 'Tarifa fija según Puerto Mejillones.')
        insert_cost(tid, 'General Port Expenses', 'Authorities Transport ( In/Out)', 'FIXED', 650.00, '')
        insert_cost(tid, 'General Port Expenses', 'ISPS Fee.', 'FIXED', 1191.00, 'Tarifa fija según Puerto Mejillones.')
        insert_cost(tid, 'General Port Expenses', 'Authorities Charges ( Inward/Outward clearances)', 'FIXED', 700.00, 'Authorities clearance fee')
        insert_cost(tid, 'General Port Expenses', 'Immigration Authorities.', 'FIXED', 28.00, 'Tarifa fija según Policia de Investigacion de Chile.')
        insert_cost(tid, 'General Port Expenses', 'Health authorities.', 'FIXED', 120.00, 'Tarifa fija según Sanidad Maritima.')
        insert_cost(tid, 'General Port Expenses', 'Loading Master', 'FIXED', 2923.00, 'Tarifa fija según Puerto Mejillones.por nominacion usd 2401.90')
        # C) Agency Expenses
        insert_cost(tid, 'Agency Expenses', 'Agency Fee', 'FIXED', 1200.00, 'Tarifa fija.B&M por Agenciamiento de Nave.')
        insert_cost(tid, 'Agency Expenses', 'Hose conection/Portalon (Solo Si requiere)', 'FIXED', 2500.00, 'Tarifa fija.B&M .')

    # --- BARQUITO ---
    tid = terminal_ids.get('Barquito')
    if tid:
        # A) Shifting Expenses
        insert_cost(tid, 'Shifting Expenses', 'Pilotage.', 'FIXED', 1.00, 'Tarifa fija según Autoridad Maritima.')
        insert_cost(tid, 'Shifting Expenses', 'Towage.(amarre/desamarre)', 'FIXED', 6500.00, 'Tarifa Ultratug.(Tarifario Publico ) / Basado en 02 horas')
        insert_cost(tid, 'Shifting Expenses', 'Pilot Insurance (amarre/desamarre/anchorage)', 'FIXED', 110.00, 'Tarifa Fija por 2 seguros de practico $80.00 c/u.')
        insert_cost(tid, 'Shifting Expenses', 'Linesmen /amarre y desamarre', 'FIXED', 1000.00, 'Tarifa fija según SMPs amarradores en tierra.')
        insert_cost(tid, 'Shifting Expenses', 'Port toll /Land transport /terminal fee', 'FIXED', 75.00, '')
        # B) General Port Expenses
        insert_cost(tid, 'General Port Expenses', 'Ligth Dues.( $1.56*GRT)', '1.56 * GRT', 1.56, '*LIGHT DUES CHILE = USD 4.07 /GRT POR AÑO : USD 33,614.13 /15 viajes aprox/NAV.PETRAL PAGA POR AÑO')
        insert_cost(tid, 'General Port Expenses', 'Dockage /Muellaje( $71.92*TH)', '71.92 * HOURS', 71.92, 'USD71.92 por hora (28 H)')
        insert_cost(tid, 'General Port Expenses', 'Launch amarre y desamarre', 'FIXED', 720.00, 'T.Fija.Mooring(x maniobra(02)x02 hrs) /unmooring (x maniobra(02)x01 hrs) por maniobra/por lancha.')
        insert_cost(tid, 'General Port Expenses', 'Launch Stand by', 'FIXED', 100.00, 'Lancha Stand by en puerto como regularización local')
        insert_cost(tid, 'General Port Expenses', 'Launch Anchorage at roads', 'FIXED', 430.00, 'Por hora si es requerida')
        insert_cost(tid, 'General Port Expenses', 'Launch Inward/Outward clearances', 'FIXED', 380.00, '')
        insert_cost(tid, 'General Port Expenses', 'Pilot Transport (amarre/desamarre/anchorage)', 'FIXED', 140.00, 'Tarifa fija según Puerto Mejillones.')
        insert_cost(tid, 'General Port Expenses', 'Linesmen transportation', 'FIXED', 350.00, 'Linesmen transportation In/Out')
        insert_cost(tid, 'General Port Expenses', 'Tugboat stand by', 'FIXED', 648.00, 'Tarifa Ultratug.( Concepto exigido por Autoridad Maritma) $648 por hora.')
        insert_cost(tid, 'General Port Expenses', 'Tugboat Navigation', 'FIXED', 745.00, 'Navegación desde Caldera a Barquito( Segundo remolcador)')
        insert_cost(tid, 'General Port Expenses', 'Authorities Transport ( In/Out)', 'FIXED', 550.00, '')
        insert_cost(tid, 'General Port Expenses', 'Authorities Charges ( Inward/Outward clearances)', 'FIXED', 700.00, 'Authorities clearance fee')
        insert_cost(tid, 'General Port Expenses', 'Immigration Authorities.', 'FIXED', 28.00, 'Tarifa fija según Policia de Investigacion de Chile.')
        insert_cost(tid, 'General Port Expenses', 'Health authorities.', 'FIXED', 130.00, 'Tarifa fija según Sanidad maritima.')
        # C) Agency Expenses
        insert_cost(tid, 'Agency Expenses', 'Loading Master', 'FIXED', 2450.00, '')
        insert_cost(tid, 'Agency Expenses', 'Agency Fee', 'FIXED', 1200.00, 'Tarifa fija.B&M por Agenciamiento de Nave.')

    conn.commit()
    print("Committed successfully second half!")
except Exception as e:
    conn.rollback()
    print(f"Error: {e}")
finally:
    cursor.close()
    conn.close()
