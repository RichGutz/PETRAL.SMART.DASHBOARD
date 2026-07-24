import sys
import os

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Desarrollo.Profesional', 'Geeksoft_Engine', 'backend')))

from port_engines.core import calculate_dynamic_port_costs

def test_callao():
    v_data = {
        "vessel_id": "MOQUEGUA",
        "vessel_name": "BT MOQUEGUA",
        "loa": 134.16,
        "grt": 8259,
        "dwt": 14298
    }
    
    inputs = {
        "last_port_country": "PE",
        "tugboats_in": 2,
        "tugboats_out": 2
    }
    
    res = calculate_dynamic_port_costs("CALLAO", "PE", v_data, 27.0, inputs=inputs)
    
    print("=" * 110)
    print(f" AUDITORIA DE COSTOS PORTUARIOS - PUERTO DEL CALLAO ({res['port_name']})")
    print("=" * 110)
    print(f" Buque: BT MOQUEGUA | LOA: {v_data['loa']}m | GRT: {v_data['grt']} | Horas en Puerto: {res['port_hours']}h")
    print(f" COSTO TOTAL CALCULADO: ${res['total_cost']:,.2f} USD")
    print("=" * 110)
    print(f"{'CAT':<16} | {'CONCEPTO':<32} | {'PROVEEDOR':<25} | {'FORMULA EVALUADA':<38} | {'SUBTOTAL':>10}")
    print("-" * 110)
    for item in res['audit_trail']:
        print(f"{item['category']:<16} | {item['concept']:<32} | {item['supplier']:<25} | {item['formula_evaluated']:<38} | ${item['amount_usd']:>9,.2f}")
    print("=" * 110)
    
    assert res['total_cost'] > 0
    print("\n OK PRUEBA EXITOSA: MOTOR CALLAO BACKEND VALIDADO Y EJECUTADO CON EXITO.")

if __name__ == "__main__":
    test_callao()
