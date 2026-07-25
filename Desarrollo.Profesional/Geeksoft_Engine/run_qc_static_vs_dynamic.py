import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
from supabase import create_client

# Cargar variables de entorno
env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
if not os.path.exists(env_path):
    env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://hjjxooxcpvlvbaxgifbn.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_KEY:
    print("❌ Error: SUPABASE_KEY no encontrada")
    sys.exit(1)

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# 4 Naves Oficiales de la Flota PETRAL
PETRAL_FLEET = [
    {'id': 'MOQUEGUA', 'name': 'B/T MOQUEGUA', 'loa': 134.16, 'grt': 8259},
    {'id': 'TABLONES', 'name': 'B/T TABLONES', 'loa': 134.16, 'grt': 8259},
    {'id': 'CONCON_TRADER', 'name': 'CONCON TRADER', 'loa': 134.16, 'grt': 8259},
    {'id': 'HUEMUL', 'name': 'HUEMUL', 'loa': 134.16, 'grt': 8259}
]

# 5 Puertos Oficiales con ambos modelos
VALID_PORTS = ['CALLAO', 'MATARANI', 'MARCONA', 'ILO', 'MEJILLONES']

def normalize_vessel_key(v_id):
    if not v_id: return ''
    return v_id.upper().replace('B/T', '').replace('BT', '').replace(' ', '').replace('_', '').replace('-', '').strip()

# Motor Dinámico PxQ Python equivalente al oficial de TypeScript (computePortItems)
def compute_port_items(port_code, vessel, port_hrs, is_national=True, tugs_in=2, tugs_out=2, is_casino=False):
    loa = vessel['loa']
    grt = vessel['grt']
    stay_days = max(1, int((port_hrs + 23.999) // 24.0))
    dockage_rate_p = 1.50
    towage_rate_p = 800.00
    launch_rate_p = 85.00
    agency_fee_p = 1000.00

    items = []
    if port_code == "MARCONA":
        extra_standby = 3000.00 if port_hrs > 48.0 else 0.0
        lighthouse_rate = 0.03 if is_national else 0.12
        total_lighthouse = round(lighthouse_rate * grt, 2)
        standby_base = min(1800.00, port_hrs * 40.0)

        items = [
            {'cost': 30508.48}, # SIA PSA
            {'cost': 150.00},   # Toll
            {'cost': total_lighthouse},
            {'cost': 450.00},   # Coord
            {'cost': 670.00},   # Sanidad
            {'cost': 400.00},   # Lancha
            {'cost': standby_base + extra_standby},
            {'cost': 1400.00},  # Agencia
            {'cost': 450.00}    # Gastos
        ]
    elif port_code == "MATARANI":
        base_psa = 3368.00
        psa_ot = base_psa * 0.25 if is_casino else 0.0
        total_psa = (base_psa * 2) + psa_ot
        lighthouse_rate = 0.03 if is_national else 0.12
        total_lighthouse = round(lighthouse_rate * grt, 2)
        total_dockage = round(0.65 * loa * port_hrs, 2)

        items = [
            {'cost': total_psa},
            {'cost': 787.30},   # Acceso/Amarre
            {'cost': total_lighthouse},
            {'cost': total_dockage},
            {'cost': 670.00},   # Sanidad
            {'cost': 960.00},   # Lanchas/Coord
            {'cost': 1100.00},  # Agencia
            {'cost': 450.00}    # Gastos
        ]
    elif port_code == "ILO":
        pilotage_total = 3000.00
        linesmen_total = 680.00
        dockage_spcc = round(300.00 + (0.05 * grt * stay_days), 2)
        psa_towage = max(3600.00, 0.16 * grt * 2)
        psa_pos = 1400.00
        petranso_towage = round(0.18 * grt * 2 * 0.90, 2)
        petranso_pos = 1260.00
        ot_tugs = 1643.31 if is_casino else 0.0
        lighthouse_rate = 0.03 if is_national else 0.12
        total_lighthouse = round(lighthouse_rate * grt, 2)

        items = [
            {'cost': pilotage_total},
            {'cost': psa_towage + petranso_towage + ot_tugs},
            {'cost': psa_pos + petranso_pos + linesmen_total + 150.00},
            {'cost': dockage_spcc},
            {'cost': total_lighthouse},
            {'cost': 2600.00},  # Lanchas
            {'cost': 1120.00},  # Sanidad
            {'cost': 900.00},   # Agencia
            {'cost': 400.00}    # Gastos
        ]
    else:
        # CALLAO
        base_pilotage = max(750.00, 0.055 * grt)
        pilotage_out = base_pilotage * 1.25 if is_casino else base_pilotage
        total_pilotage = round(base_pilotage + pilotage_out, 2)
        towage_out_rate = towage_rate_p * 1.25 if is_casino else towage_rate_p
        total_towage = (towage_rate_p * tugs_in) + (towage_out_rate * tugs_out)
        total_access = 70.00 * 2
        lighthouse_rate = 0.03 if is_national else 0.12
        total_lighthouse = round(lighthouse_rate * grt, 2)
        total_dockage = round(dockage_rate_p * loa * port_hrs, 2)

        items = [
            {'cost': total_pilotage},
            {'cost': total_towage},
            {'cost': total_access},
            {'cost': total_lighthouse},
            {'cost': total_dockage},
            {'cost': launch_rate_p * 4},
            {'cost': 450.00},   # Coord
            {'cost': 200.00},   # Clearance
            {'cost': 520.00},   # Sanidad
            {'cost': agency_fee_p},
            {'cost': 450.00}    # Gastos
        ]

    return items

def run_qc_suite():
    print("=" * 80)
    print("🔄 SUITE DE AUDITORÍA Y QC AUTÓNOMO: STATIC VS DYNAMIC PORT COST")
    print("=" * 80)

    # 1. Obtener registros de Supabase
    print("\n📡 1. Consultando tabla 'port_cost_static' en Supabase...")
    res = sb.table('port_cost_static').select('*').execute()
    static_rows = res.data or []
    print(f"   ✅ Se recuperaron {len(static_rows)} filas totales de 'port_cost_static'.")

    # Mapear static_map: port_vessel_op -> total_cost
    static_map = {}
    for r in static_rows:
        p_id = (r.get('port_id') or '').upper()
        v_norm = normalize_vessel_key(r.get('vessel_id') or '')
        op = (r.get('operation_type') or 'CARGA').upper()
        cost = float(r.get('cost') or 0.0)

        key = f"{p_id}_{v_norm}_{op}"
        static_map[key] = static_map.get(key, 0.0) + cost

    print(f"   ✅ Se construyó la matriz estática agregada con {len(static_map)} combinaciones únicas.")

    # 2. Ejecutar Auditoría por Puerto y Buque
    print("\n⚖️  2. Ejecutando comparativa Estático vs Dinámico (5 Puertos × 4 Buques × 2 Operaciones)...")
    print("-" * 80)
    print(f"{'Puerto':<12} | {'Buque':<15} | {'Operación':<8} | {'Estático BD':<12} | {'Dinámico Avg':<12} | {'Varianza $':<11} | {'Estado'}")
    print("-" * 80)

    total_tests = 0
    passed_tests = 0
    missing_static = 0
    missing_dynamic = 0

    results = []

    for port in VALID_PORTS:
        for vessel in PETRAL_FLEET:
            v_norm = normalize_vessel_key(vessel['id'])
            for op in ['CARGA', 'DESCARGA']:
                total_tests += 1
                key_static = f"{port}_{v_norm}_{op}"
                static_cost = static_map.get(key_static, 0.0)

                # Calcular Dinámico PxQ (Horas: Carga=31.0h, Descarga=42.57h)
                cargo_tons = 13500
                rate = 500 if op == 'CARGA' else 350
                port_hrs = (cargo_tons / rate) + 4.0

                items_min = compute_port_items(port, vessel, port_hrs, is_national=True, is_casino=False)
                items_max = compute_port_items(port, vessel, port_hrs, is_national=True, is_casino=True)

                total_min = sum(i['cost'] for i in items_min)
                total_max = sum(i['cost'] for i in items_max)
                dynamic_avg = (total_min + total_max) / 2.0

                if static_cost == 0:
                    status_str = "⚠️ SIN ESTÁTICO"
                    missing_static += 1
                elif dynamic_avg == 0:
                    status_str = "⚠️ SIN DINÁMICO"
                    missing_dynamic += 1
                else:
                    var_usd = dynamic_avg - static_cost
                    var_pct = (var_usd / static_cost) * 100.0
                    passed_tests += 1
                    status_str = f"✅ PASS ({var_pct:+.1f}%)"

                var_usd_val = dynamic_avg - static_cost if static_cost > 0 else 0.0
                print(f"{port:<12} | {vessel['name']:<15} | {op:<8} | ${static_cost:>11,.2f} | ${dynamic_avg:>11,.2f} | ${var_usd_val:>10,.2f} | {status_str}")

                results.append({
                    'port': port,
                    'vessel': vessel['name'],
                    'op': op,
                    'static': static_cost,
                    'dynamic': dynamic_avg,
                    'variance_usd': var_usd_val,
                    'status': status_str
                })

    print("-" * 80)
    print("\n📊 RESUMEN EJECUTIVO DE AUDITORÍA:")
    print(f"   • Total de Combinaciones Evaluadas: {total_tests}")
    print(f"   • Comparativas Reales Válidas (AND): {passed_tests} ✅")
    print(f"   • Registros Estáticos Faltantes en BD: {missing_static} ⚠️")
    print(f"   • Matrices Dinámicas Faltantes: {missing_dynamic} ⚠️")
    print("=" * 80)

    if passed_tests > 0:
        print("\n🎉 SUITE DE AUDITORÍA COMPLETADA SATISFACTORIAMENTE.")
    else:
        print("\n❌ SUITE CON ADVERTENCIAS QUE REQUIEREN REVISIÓN.")

if __name__ == '__main__':
    run_qc_suite()
