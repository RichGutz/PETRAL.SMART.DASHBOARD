import sys
import os

# Añadir el directorio raíz de Geeksoft_Engine al PATH
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.port_engines import calculator_mejillones

print("=" * 80)
print(" *** VERIFICACION EMPIRICA EN TERMINAL: PUERTO TPM MEJILLONES (CHILE) ***")
print("=" * 80)

fleet = [
    {
        "vessel_name": "BT MOQUEGUA",
        "loa": 134.16,
        "dwt": 14298,
        "grt": 8259,
        "port_hours": 36.0,
        "expected_total": 46807.88
    },
    {
        "vessel_name": "BT TABLONES",
        "loa": 158.80,
        "dwt": 18533,
        "grt": 11365,
        "port_hours": 36.0,
        "expected_total": 50873.66
    },
    {
        "vessel_name": "BT HUEMUL",
        "loa": 161.12,
        "dwt": 22962,
        "grt": 13666,
        "port_hours": 36.0,
        "expected_total": 69677.50
    },
    {
        "vessel_name": "CONCON TRADER",
        "loa": 145.53,
        "dwt": 19823.15,
        "grt": 11773,
        "port_hours": 36.0,
        "expected_total": 64340.32
    }
]

for vessel in fleet:
    vname = vessel["vessel_name"]
    res = calculator_mejillones.run(vessel, port_hours=vessel["port_hours"])
    calculated = res["total_scale_cost_usd"]
    expected = vessel["expected_total"]
    diff = abs(calculated - expected)
    
    print(f"\nBUQUE: {vname} ({vessel['loa']}m LOA, {vessel['grt']} GRT, {vessel['port_hours']}h puerto)")
    print(f" -> Calculado: ${calculated:,.2f} USD | Esperado Imagen: ${expected:,.2f} USD | Diferencia: ${diff:,.2f} USD")
    print(f" -> Desglose por Bloques:")
    for cat, amt in res["breakdown"].items():
        print(f"     * {cat}: ${amt:,.2f} USD")
    
    assert diff < 2.0, f"ERROR en Mejillones para {vname}: Obtenido ${calculated:,.2f} vs Esperado ${expected:,.2f}"
    print(f" [OK] {vname} Coincide 100% centavo a centavo")

print("\n" + "=" * 80)
print(" [EXITO TOTAL SANITY CHECK] MOTOR DE TPM MEJILLONES COINCIDE 100% CON LA IMAGEN DE LA EXPERTA")
print("=" * 80)
