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
    # We will reset exactly the 8 ports: Callao, Ilo, Matarani, Marcona, Mejillones, Mejillones (Interacid), Mejillones (Terquim), Barquito
    # Actually, the terminals are associated with locations. Let's find their IDs.
    terminals = {
        'Callao': ('Peru', 'Callao', 'APM / DPW'),
        'Ilo': ('Peru', 'Ilo', 'Enapu / Southern'),
        'Matarani': ('Peru', 'Matarani', 'Tisur'),
        'Marcona': ('Peru', 'San Nicolas', 'Shougang'),
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
        else:
            print(f"NOT FOUND: {key}")

    # Delete existing costs for these terminals
    for t_id in terminal_ids.values():
        cursor.execute("DELETE FROM port_costs WHERE terminal_id = %s", (t_id,))
    
    print("Deleted old costs for the 8 terminals.")

    def insert_cost(t_id, section, item, formula, rate, comments):
        cursor.execute("""
            INSERT INTO port_costs (id, terminal_id, category, concept, logic_formula, base_rate, comments)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (str(uuid.uuid4()), t_id, section, item, formula, rate, comments))

    # --- CALLAO ---
    tid = terminal_ids.get('Callao')
    if tid:
        # A) Shifting Expenses
        insert_cost(tid, 'Shifting Expenses', 'Pilotage.($750 + OT)', 'FIXED', 750.00, 'Tarifa de Transtotal.Fija.Práctico por maniobra')
        insert_cost(tid, 'Shifting Expenses', 'Pilotage ($ 0.055 *GRT)', '0.055 * GRT', 0.055, '')
        insert_cost(tid, 'Shifting Expenses', 'Remolcaje', 'FIXED', 800.00, 'Petranso Remolcadores Tarifa minima $ 800 por maniobra (2) 2 in 2 out')
        insert_cost(tid, 'Shifting Expenses', 'Remolcaje($ 0.065*GRT)', '0.065 * GRT * TUGBOATS', 0.065, '')
        # B) General Port Expenses
        insert_cost(tid, 'General Port Expenses', 'Lighthouse Dues (Aplica si el buque viene de PUERTO NACIONAL)', '0.03 * GRT', 0.03, 'Tarifa Direccion de Hidrografia y navegacion.')
        insert_cost(tid, 'General Port Expenses', 'Lighthouse Dues (Aplica si el buque viene de PUERTO EXTRANJERO)', '0.12 * GRT', 0.12, '')
        insert_cost(tid, 'General Port Expenses', 'Dockage /Muellaje ( $1.50*LOA*Hr)', '1.50 * LOA * HOURS', 1.50, 'Tarifa APM $1.50 por hora o fraccion.')
        insert_cost(tid, 'General Port Expenses', 'Launch Hire.', 'FIXED', 85.00, 'Tarifa de Transtotal.Fija.Mooring /unmooring por maniobra/por lanch USD .85.00 xh.')
        insert_cost(tid, 'General Port Expenses', 'Coordinator on board', 'FIXED', 225.00, 'Tarifa fija. Transtotal por Nave.Turno x día')
        insert_cost(tid, 'General Port Expenses', 'Clearance ( In/Out )', 'FIXED', 200.00, '')
        insert_cost(tid, 'General Port Expenses', 'Sanitary Inspection (Reception/Dispatch)', 'FIXED', 520.00, 'Tarifa fija según Sanidad maritima.')
        # C) Agency Expenses
        insert_cost(tid, 'Agency Expenses', 'Agency Fee', 'FIXED', 1000.00, 'Tarifa fija Transtotal por Agenciamiento de Nave.')
        insert_cost(tid, 'Agency Expenses', 'Transportation (Autoridades,coordinador y personal operativo)', 'FIXED', 200.00, 'Tarifa fija Transtotal')
        insert_cost(tid, 'Agency Expenses', 'Comunication', 'FIXED', 250.00, 'Tarifa fija Transtotal')

    # --- ILO ---
    tid = terminal_ids.get('Ilo')
    if tid:
        # A) Shifting Expenses
        insert_cost(tid, 'Shifting Expenses', 'Practicaje', 'FIXED', 1500.00, 'Tarifa Port Opeartions $ 1,500 por maniobra.')
        insert_cost(tid, 'Shifting Expenses', 'Linesmen /amarre y desamarre( Por maniobra)', 'FIXED', 170.00, '')
        insert_cost(tid, 'Shifting Expenses', 'Towage /Remolcaje($0.16*GRT*Mnvr*Tug) - PSA MARINE', '0.16 * GRT * MOVES * TUGBOATS', 0.16, 'Tarifa-PSA $ 0.16 x Trb por maniobra por remolcador (2)')
        insert_cost(tid, 'Shifting Expenses', 'Remolcaje Posicionamiento - PSA MARINE', 'FIXED', 700.00, 'Petranso Remolcadores Tarifa $ 0.18 x Trb , sujeta a 10% descuentos, posicionamiento $ 1400')
        insert_cost(tid, 'Shifting Expenses', 'Towage /Remolcaje($0.15*GRT*Mnvr*Tug) - PETRANSO', '0.15 * GRT * MOVES * TUGBOATS', 0.15, 'Tarifa-PSA $ 0.16 x Trb por maniobra por remolcador (2)')
        insert_cost(tid, 'Shifting Expenses', 'Remolcaje Posicionamiento - PETRANSO', 'FIXED', 600.00, 'Petranso Remolcadores Tarifa $ 0.18 x Trb , sujeta a 10% descuentos, posicionamiento $ 1400')
        insert_cost(tid, 'Shifting Expenses', 'Port toll /Land transport /terminal fee($75*move)', '75 * MOVES', 75.00, '')
        # B) General Port Expenses
        insert_cost(tid, 'General Port Expenses', 'Lighthouse Dues (Aplica si el buque viene de PUERTO NACIONAL)', '0.03 * GRT', 0.03, 'Tarifa Direccion de Hidrografia y navegacion.')
        insert_cost(tid, 'General Port Expenses', 'Lighthouse Dues (Aplica si el buque viene de PUERTO EXTRANJERO)', '0.12 * GRT', 0.12, '')
        insert_cost(tid, 'General Port Expenses', 'Coordinator on board', 'FIXED', 200.00, 'Tarifa fija. Transtotal por Nave.Turno x día')
        insert_cost(tid, 'General Port Expenses', 'Sanitary Inspection (Reception/Dispatch)', 'FIXED', 520.00, 'Tarifa fija según Sanidad maritima. S/1,284.00')
        insert_cost(tid, 'General Port Expenses', 'Lancha autoridades,práctico in/out / Por hora- Min 4 hrs', 'FIXED', 90.00, 'Lanchas de por transporte.')
        insert_cost(tid, 'General Port Expenses', 'Lancha coordinador/ Por hora - Min 4 hrs', 'FIXED', 85.00, 'Lanchas de por transporte.')
        insert_cost(tid, 'General Port Expenses', 'Lancha amarre/desamarre/ Por maniobra (2in/ 2out)', 'FIXED', 375.00, 'Lanchas de por transporte. Por maniobra (2in/ 2out)')
        insert_cost(tid, 'General Port Expenses', 'Lancha de posicionamiento/ Por maniobra(Si es aplicable)', 'FIXED', 100.00, 'Lanchas de por transporte.')
        insert_cost(tid, 'General Port Expenses', 'Clearance (In/Out)', 'FIXED', 200.00, 'Tarifa fija según Sanidad maritima.')
        # C) Agency Expenses
        insert_cost(tid, 'Agency Expenses', 'Agency Fee', 'FIXED', 900.00, 'Tarifa fija Transtotal por Agenciamiento de Nave.')
        insert_cost(tid, 'Agency Expenses', 'Transportation (Autoridades,coordinador y personal operativo)', 'FIXED', 200.00, 'Tarifa fija Transtotal')
        insert_cost(tid, 'Agency Expenses', 'Comunication', 'FIXED', 200.00, 'Tarifa fija Transtotal')

    # --- MATARANI ---
    tid = terminal_ids.get('Matarani')
    if tid:
        # A) Shifting Expenses
        insert_cost(tid, 'Shifting Expenses', 'Pilot + Tug Boats + Lancha para pilot(Servicio integral)', 'FIXED', 5550.00, 'Tarifa de servicio integral-PSA . Incluye Remolcaje , Practicaje , Lancha')
        insert_cost(tid, 'Shifting Expenses', 'Recargo Servicio Integral Atraque/Desatraque - 25%', 'FIXED', 5550.00, 'Tarifa de servicio integral-PSA min .25% max 50%')
        insert_cost(tid, 'Shifting Expenses', 'Recargo Servicio Integral Atraque/Desatraque - 50%', 'FIXED', 5550.00, 'Tarifa de servicio integral-PSA min .25% max 50%')
        insert_cost(tid, 'Shifting Expenses', 'Cargo de Acceso', 'FIXED', 70.00, 'Tarifa de servicio integral-PSA . Acceso $ 70.00 + IGV')
        insert_cost(tid, 'Shifting Expenses', 'Linesmen /amarre y desamarre', 'FIXED', 357.30, '')
        insert_cost(tid, 'Shifting Expenses', 'Port toll /Land transport /terminal fee', 'FIXED', 75.00, '')
        # B) General Port Expenses
        insert_cost(tid, 'General Port Expenses', 'Lighthouse Dues (Aplica si el buque viene de PUERTO NACIONAL)', '0.03 * GRT', 0.03, '')
        insert_cost(tid, 'General Port Expenses', 'Lighthouse Dues (Aplica si el buque viene de PUERTO EXTRANJERO)', '0.12 * GRT', 0.12, '')
        insert_cost(tid, 'General Port Expenses', 'Dockage /Muellaje ( $0.65*LOA*Hr)', '0.65 * LOA * HOURS', 0.65, 'Tisur Tarifa $0.57 X Hora (24 )X Eslora')
        insert_cost(tid, 'General Port Expenses', 'Launch autoridades / Min 2 hrs', 'FIXED', 155.00, 'Tarifa de Transtotal.Fija.Mooring /unmooring por maniobra/por lancha.')
        insert_cost(tid, 'General Port Expenses', 'Sanitary Inspection (Reception/Dispatch)', 'FIXED', 670.00, 'Tarifa Region Moquegua.')
        insert_cost(tid, 'General Port Expenses', 'Clearance (In/Out)', 'FIXED', 200.00, 'Tarifa APN.')
        insert_cost(tid, 'General Port Expenses', 'Coordinator on board', 'FIXED', 225.00, 'USD$225* por dia + 18% IGV')
        # C) Agency Expenses
        insert_cost(tid, 'Agency Expenses', 'Agency Fee', 'FIXED', 1100.00, 'Tarifa fija Transtotal por Agenciamiento de Nave.')
        insert_cost(tid, 'Agency Expenses', 'Transportation (Autoridades,coordinador y personal operativo)', 'FIXED', 200.00, 'Tarifa fija Transtotal')
        insert_cost(tid, 'Agency Expenses', 'Comunication', 'FIXED', 200.00, 'Tarifa fija Transtotal')

    # --- MARCONA ---
    tid = terminal_ids.get('Marcona')
    if tid:
        # A) Shifting Expenses
        insert_cost(tid, 'Shifting Expenses', 'Practicaje + Launch for pilot', 'FIXED', 4980.00, 'Tarifa PSA MARINE ($4,980*Mnver + 18%vat) por maniobra.')
        insert_cost(tid, 'Shifting Expenses', 'Linesmen /amarre y desamarre( Por maniobra)', 'FIXED', 4450.00, 'Tarifa PSA MARINE ($4,450*Launchboat + 18%vat) .(incluye 2 lanchas y gavieras )')
        insert_cost(tid, 'Shifting Expenses', 'Towage /Remolcaje ( Por maniobra)', 'FIXED', 18000.00, 'Tarifa PSA MARINE ( $18,000*Mnver + 18%vat) por maniobra 2.')
        insert_cost(tid, 'Shifting Expenses', 'Port toll /Land transport /terminal fee', 'FIXED', 75.00, '')
        # B) General Port Expenses
        insert_cost(tid, 'General Port Expenses', 'Lighthouse Dues (Aplica si el buque viene de PUERTO NACIONAL)', '0.03 * GRT', 0.03, 'Tarifa Direccion de Hidrografia y navegacion.')
        insert_cost(tid, 'General Port Expenses', 'Lighthouse Dues (Aplica si el buque viene de PUERTO EXTRANJERO)', '0.12 * GRT', 0.12, '')
        insert_cost(tid, 'General Port Expenses', 'Coordinator on board', 'FIXED', 225.00, '$ 225 per day +18%')
        insert_cost(tid, 'General Port Expenses', 'Clearance Expenses (In/Out)', 'FIXED', 200.00, '')
        insert_cost(tid, 'General Port Expenses', 'Sanitary Inspection (Reception/Dispatch)', 'FIXED', 670.00, 'Tarifa APN.')
        insert_cost(tid, 'General Port Expenses', 'Launch for Authorities', 'FIXED', 200.00, '$ 200 * maneuver +18%')
        insert_cost(tid, 'General Port Expenses', 'Launch Hire (Stand By)', 'FIXED', 40.00, '$40X HORA aproximado de 40 horas (Tarifa PSA Marine SA)')
        insert_cost(tid, 'General Port Expenses', 'Remolcaje Stand by.( Por maniobra)', 'FIXED', 16000.00, '$ 3,000.00 * a partir de 60 horas.')
        # C) Agency Expenses
        insert_cost(tid, 'Agency Expenses', 'Agency Fee', 'FIXED', 1400.00, 'Tarifa fija Transtotal por Agenciamiento de Nave.')
        insert_cost(tid, 'Agency Expenses', 'Transportation (Autoridades,coordinador y personal operativo)', 'FIXED', 200.00, 'Tarifa fija Transtotal')
        insert_cost(tid, 'Agency Expenses', 'Comunication', 'FIXED', 250.00, 'Tarifa fija Transtotal')

    conn.commit()
    print("Committed successfully first half!")
except Exception as e:
    conn.rollback()
    print(f"Error: {e}")
finally:
    cursor.close()
    conn.close()
