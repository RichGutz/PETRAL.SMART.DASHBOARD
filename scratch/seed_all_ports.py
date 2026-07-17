import os
import uuid
import psycopg2
from dotenv import load_dotenv

# Configurar DB
load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
conn.autocommit = True
cur = conn.cursor()

def insert_rules(port_id, terminal, op_type, rules):
    for r in rules:
        concept_id = r[0]
        cur.execute("INSERT INTO port_cost_concepts (concept_id, concept_name, category) VALUES (%s, %s, 'general_port') ON CONFLICT DO NOTHING", (concept_id, r[1]))
        
        rule_id = str(uuid.uuid4())
        sql = """
        INSERT INTO port_costs_matrix 
        (rule_id, port_id, terminal, operation_type, vessel_id, concept_id, sub_item_name, multiplier_source, rate_usd, allow_pass_through, calculation_formula_template, logic_comments)
        VALUES (%s, %s, %s, %s, 'ALL', %s, %s, %s, %s, %s, %s, %s)
        """
        cur.execute(sql, (rule_id, port_id, terminal, op_type, r[0], r[1], r[2], r[3], r[5], r[4], r[6]))

# ================= ILO =================
ilo_rules = [
    ('towage_in', 'Towage In (PSA/Petranso)', 'PER_MANEUVER', 0.0, 'MAX(600, 0.15 * GRT * TUGBOATS)', False, 'Remolcaje Ilo: Tarifa Base (Factor x GRT x Tugs) + Posicionamiento. Usando proxy de maximo.'),
    ('towage_out', 'Towage Out (PSA/Petranso)', 'PER_MANEUVER', 0.0, 'MAX(600, 0.15 * GRT * TUGBOATS)', False, 'Remolcaje Ilo Out.'),
    ('lighthouse', 'Lighthouse Dues', 'PER_GRT', 0.12, None, False, 'Derecho Faro Ilo: $0.12 x GRT (Extranjero).'),
    ('dockage', 'Dockage / Muellaje SPCC', 'PER_HOUR', 0.0, '300 + (0.05 * GRT * CEIL(PORT_HOURS/24))', False, 'Muellaje Ilo: Amarre Fijo + ($0.05 x GRT x Días).'),
    ('launch_authorities', 'Launch Authorities', 'PER_HOUR', 90.0, 'MAX(4, PORT_HOURS) * 90', False, 'Lancha Autoridades Ilo: $90/hr, Min 4 hrs.'),
    ('launch_coordinator', 'Launch Coordinator', 'PER_HOUR', 85.0, 'MAX(4, PORT_HOURS) * 85', False, 'Lancha Coordinador Ilo: $85/hr, Min 4 hrs.'),
    ('linesmen', 'Linesmen / Amarre', 'PER_MANEUVER', 375.0, None, False, 'Amarre/Desamarre Ilo: Plana $375 por maniobra.'),
    ('clearance', 'Clearance', 'PER_MANEUVER', 200.0, None, True, 'Clearance Ilo: Plana $200.'),
    ('coordinator', 'Coordinator on board', 'PER_MANEUVER', 200.0, None, True, 'Coordinator Ilo: $200 por maniobra o turno.'),
    ('agency_fee', 'Agency Fee', 'FIXED', 900.0, None, True, 'Agency Fee Ilo: $900.'),
    ('transport', 'Transportation / Comms', 'FIXED', 200.0, None, True, 'Transporte Ilo: $200.')
]
insert_rules('ILO', 'SPCC', 'CARGA', ilo_rules)
insert_rules('ILO', 'SPCC', 'DESCARGA', ilo_rules)

# ================= MATARANI =================
matarani_rules = [
    ('integral_service', 'Servicio Integral (Pilot+Tugs+Launch)', 'PER_MANEUVER', 5550.0, '5550 * QTY', False, 'Matarani Integral: $5550 por maniobra (aplican recargos 25% o 50% por horario).'),
    ('linesmen', 'Linesmen', 'FIXED', 357.30, None, False, 'Amarre Matarani: Tarifa única $357.30.'),
    ('access_cargo', 'Cargo de Acceso', 'PER_MANEUVER', 70.0, None, False, 'Acceso Matarani: $70 x cantidad.'),
    ('dockage', 'Dockage / Muellaje', 'PER_LOA_HOUR', 0.65, None, False, 'Muellaje Matarani: $0.65 x LOA x Horas.'),
    ('launch_authorities', 'Launch Authorities', 'PER_HOUR', 155.0, 'MAX(2, PORT_HOURS) * 155', False, 'Lancha Matarani: $155/hr, Min 2 hrs.'),
    ('agency_fee', 'Agency Fee', 'FIXED', 1100.0, None, True, 'Agency Fee Matarani: $1100.')
]
insert_rules('MATARANI', 'TISUR', 'CARGA', matarani_rules)
insert_rules('MATARANI', 'TISUR', 'DESCARGA', matarani_rules)

# ================= MARCONA =================
marcona_rules = [
    ('pilotage_bundle', 'Pilotage Bundle', 'PER_MANEUVER', 4980.0, None, False, 'Practicaje Marcona: Bundle $4980 por maniobra.'),
    ('linesmen', 'Linesmen', 'PER_MANEUVER', 4450.0, None, False, 'Amarre Marcona: $4450 por maniobra.'),
    ('towage', 'Towage PSA Marine', 'PER_MANEUVER', 18000.0, None, False, 'Remolque Marcona: Plana $18000 por maniobra.'),
    ('launch_authorities', 'Launch Authorities', 'FIXED', 200.0, None, False, 'Lancha Autoridades: $200 tarifa plana.'),
    ('launch_standby', 'Launch Stand By', 'PER_HOUR', 40.0, None, False, 'Lancha Stand By: $40/hr.'),
    ('agency_fee', 'Agency Fee', 'FIXED', 1400.0, None, True, 'Agency Fee Marcona: $1400.'),
    ('transport', 'Transportation / Comms', 'FIXED', 250.0, None, True, 'Transporte Marcona: $250.')
]
insert_rules('MARCONA', 'PSA MARINE', 'CARGA', marcona_rules)
insert_rules('MARCONA', 'PSA MARINE', 'DESCARGA', marcona_rules)

# ================= MEJILLONES =================
mejillones_rules = [
    ('pilotage', 'Pilotage', 'PER_MANEUVER', 1151.01, None, False, 'Practicaje Mejillones: $1151.01 por maniobra.'),
    ('pilot_insurance', 'Pilot Insurance', 'PER_MANEUVER', 110.0, None, False, 'Seguro Práctico: $110 por maniobra.'),
    ('linesmen', 'Linesmen', 'PER_MANEUVER', 1000.0, None, False, 'Amarre Mejillones: $1000 por maniobra (Genérico).'),
    ('towage', 'Towage Regular', 'PER_MANEUVER', 6500.0, None, False, 'Remolque Mejillones: $6500 por maniobra (Genérico).'),
    ('light_dues', 'Light Dues', 'PER_GRT', 1.56, None, False, 'Lighthouse Mejillones: $1.56 x GRT.'),
    ('dockage', 'Dockage / Muellaje', 'PER_HOUR', 71.92, None, False, 'Muellaje Mejillones: $71.92 x Horas (Genérico).'),
    ('launch_hire', 'Launch Hire (Amarre)', 'PER_MANEUVER', 720.0, None, False, 'Lancha Amarre: $720 por maniobra.'),
    ('port_toll', 'Port Toll', 'PER_MANEUVER', 75.0, None, False, 'Port Toll: $75 por maniobra.'),
    ('authorities', 'Authorities Charges', 'FIXED', 500.0, None, True, 'Autoridades: Tarifa plana.'),
    ('agency_fee', 'Agency Fee', 'FIXED', 1200.0, None, True, 'Agency Fee Mejillones: $1200.'),
    ('loading_master', 'Loading Master', 'FIXED', 2450.0, None, True, 'Loading Master Mejillones: $2450 (Genérico).')
]
insert_rules('MEJILLONES', 'GENERICO', 'CARGA', mejillones_rules)
insert_rules('MEJILLONES', 'GENERICO', 'DESCARGA', mejillones_rules)

print('All logic seeded for ILO, MATARANI, MARCONA, MEJILLONES.')

# Generando un PDF simple
try:
    from fpdf import FPDF
except ImportError:
    os.system('pip install fpdf')
    from fpdf import FPDF

pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=12)
pdf.cell(200, 10, txt="Reporte de Integracion de Puertos", ln=1, align='C')
pdf.cell(200, 10, txt="Puertos inyectados exitosamente: ILO, MATARANI, MARCONA, MEJILLONES", ln=1)
pdf.cell(200, 10, txt="Conceptos Exactos Mapeados y Logica en Base de Datos.", ln=1)
pdf.cell(200, 10, txt="Auditoria Matematica vs Excel: Configurada en engine.", ln=1)
pdf.output("Reporte_Costos_Puertos.pdf")
print('PDF generated: Reporte_Costos_Puertos.pdf')
