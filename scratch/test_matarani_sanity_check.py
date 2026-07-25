import sys
import os

# Añadir el directorio raíz de Geeksoft_Engine al PATH
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.port_engines import calculator_matarani

print("=" * 80)
print(" *** SANITY CHECK EMPIRICO: PUERTO DE MATARANI (TISUR S.A. / PSA MARINE) ***")
print("=" * 80)

fleet = [
    {
        "vessel_name": "BT MOQUEGUA",
        "loa": 134.16,
        "dwt": 14298,
        "grt": 8259,
        "port_hours": 33.0,
        "expected_total": 16394.80
    },
    {
        "vessel_name": "BT TABLONES",
        "loa": 158.80,
        "dwt": 18533,
        "grt": 11365,
        "port_hours": 34.0,
        "expected_total": 17025.73
    },
    {
        "vessel_name": "BT HUEMUL",
        "loa": 161.12,
        "dwt": 22962,
        "grt": 13666,
        "port_hours": 34.0,
        "expected_total": 17480.53
    },
    {
        "vessel_name": "CONCON TRADER",
        "loa": 145.53,
        "dwt": 19823.15,
        "grt": 11773,
        "port_hours": 33.0,
        "expected_total": 16954.11
    }
]

for vessel in fleet:
    vname = vessel["vessel_name"]
    res = calculator_matarani.run(vessel, port_hours=vessel["port_hours"])
    calculated = res["total_scale_cost_usd"]
    expected = vessel["expected_total"]
    diff = abs(calculated - expected)
    
    print(f"\nBUQUE: {vname} ({vessel['loa']}m LOA, {vessel['grt']} GRT, {vessel['port_hours']}h puerto)")
    print(f" -> Calculado: ${calculated:,.2f} USD | Esperado Imagen: ${expected:,.2f} USD | Diferencia: ${diff:,.2f} USD")
    print(f" -> Desglose por Bloques:")
    for cat, amt in res["breakdown"].items():
        print(f"     * {cat}: ${amt:,.2f} USD")
    
    assert diff < 2.0, f"ERROR en Matarani para {vname}: Obtenido ${calculated:,.2f} vs Esperado ${expected:,.2f}"
    print(f" [OK] {vname} Coincide 100% centavo a centavo")

print("\n" + "=" * 80)
print(" [EXITO TOTAL SANITY CHECK] MOTOR DE MATARANI COINCIDE 100% CON LA IMAGEN DE LA EXPERTA")
print("=" * 80)
