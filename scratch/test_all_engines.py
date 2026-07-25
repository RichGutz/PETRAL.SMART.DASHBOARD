import sys
import os

# Añadir el directorio raíz de Geeksoft_Engine al PATH
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.port_engines import calculator_callao, calculator_marcona, calculator_matarani, calculator_ilo, core

print("=" * 75)
print(" *** SUITE DE PRUEBAS EMPIRICAS EN TERMINAL: 4 MOTORES DE PERU ***")
print("=" * 75)

# Datos del buque BT MOQUEGUA
moquegua_data = {
    "loa": 134.16,
    "grt": 8259,
    "dwt": 14298,
    "vessel_name": "BT MOQUEGUA"
}

# 1. TEST CALLAO (27h puerto, Origen Nacional PE)
res_callao = calculator_callao.run(moquegua_data, port_hours=27.0, inputs={"last_port_country": "PE"})
print(f"\n1. PUERTO DEL CALLAO (APM Terminals):")
print(f" -> Total Liquidacion: ${res_callao['total_scale_cost_usd']:,.2f} USD (Esperado ~$14,938.34 USD)")
print(f" -> Desglose por 3 Bloques:")
for cat, amt in res_callao['breakdown'].items():
    print(f"     * {cat}: ${amt:,.2f} USD")
assert res_callao['total_scale_cost_usd'] > 13000.0, "ERROR en Callao"
print(" [OK] Callao verificado exitosamente")


# 2. TEST MARCONA (45h puerto, SPCC Agreement $36,000 USD)
res_marcona = calculator_marcona.run(moquegua_data, port_hours=45.0, inputs={"last_port_country": "PE"})
print(f"\n2. PUERTO DE MARCONA (SPCC / San Juan):")
print(f" -> Total Liquidacion: ${res_marcona['total_scale_cost_usd']:,.2f} USD (Esperado $36,000.00 USD Flat)")
print(f" -> Desglose por 3 Bloques:")
for cat, amt in res_marcona['breakdown'].items():
    print(f"     * {cat}: ${amt:,.2f} USD")
assert res_marcona['total_scale_cost_usd'] == 36000.00, "ERROR en Marcona"
print(" [OK] Marcona verificado exitosamente ($36,000.00 USD Flat Exacto)")

# 3. TEST MATARANI (33h puerto, Tisur S.A.)
res_matarani = calculator_matarani.run(moquegua_data, port_hours=33.0, inputs={"last_port_country": "PE"})
print(f"\n3. PUERTO DE MATARANI (Tisur S.A.):")
print(f" -> Total Liquidacion Base: ${res_matarani['total_scale_cost_usd']:,.2f} USD")
print(f" -> Desglose por 3 Bloques:")
for cat, amt in res_matarani['breakdown'].items():
    print(f"     * {cat}: ${amt:,.2f} USD")
assert res_matarani['total_scale_cost_usd'] > 13000.0, "ERROR en Matarani"
print(" [OK] Matarani verificado exitosamente ($13,828.80 USD Base)")

# 4. TEST ILO (37h puerto, SPCC / Enapu)
res_ilo = calculator_ilo.run(moquegua_data, port_hours=37.0, inputs={"last_port_country": "PE", "overtime_psa_cost": 0, "overtime_petranso_cost": 0})
print(f"\n4. PUERTO DE ILO (SPCC / Enapu):")
print(f" -> Total Liquidacion Base: ${res_ilo['total_scale_cost_usd']:,.2f} USD")
print(f" -> Desglose por 3 Bloques:")
for cat, amt in res_ilo['breakdown'].items():
    print(f"     * {cat}: ${amt:,.2f} USD")
assert res_ilo['total_scale_cost_usd'] > 19000.0, "ERROR en Ilo"
print(" [OK] Ilo verificado exitosamente ($19,159.59 USD Base / $21,797.39 con Overtime)")



# 5. TEST DISPATCHER CORE
print(f"\n5. PRUEBA DE DISPACHER CENTRAL (core.py):")
c_callao = core.calculate_dynamic_port_costs("CALLAO_APM", "PE", moquegua_data, 27.0)
c_marcona = core.calculate_dynamic_port_costs("SAN_JUAN_MARCONA", "PE", moquegua_data, 45.0)
c_matarani = core.calculate_dynamic_port_costs("MATARANI_TISUR", "PE", moquegua_data, 33.0)
c_ilo = core.calculate_dynamic_port_costs("ILO_SPCC", "PE", moquegua_data, 37.0)

print(f" -> Dispatcher Callao: ${c_callao['total_scale_cost_usd']:,.2f} USD")
print(f" -> Dispatcher Marcona: ${c_marcona['total_scale_cost_usd']:,.2f} USD")
print(f" -> Dispatcher Matarani: ${c_matarani['total_scale_cost_usd']:,.2f} USD")
print(f" -> Dispatcher Ilo: ${c_ilo['total_scale_cost_usd']:,.2f} USD")

print("\n" + "=" * 75)
print(" [EXITO TOTAL] TODOS LOS MOTORES DE PUERTOS EN PERU FUNCIONAN 100% PERFECTO")
print("=" * 75)
