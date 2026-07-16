def calcular_mejillones_barquito(grt, horas_muellaje):
    costos = {
        # A) Shifting Expenses (Gastos de Maniobra)
        "Pilotage": 1151.01 * 1,
        "Towage": 6500 * 5,
        "Pilot Insurance": 110 * 3,
        "Linesmen": 1000 * 2,
        "Port Toll": 75 * 1,
        
        # B) General Port Expenses
        "Light Dues": 1.56 * grt,
        "Dockage": 71.92 * horas_muellaje,
        "Launch Amarre y Desamarre": 720 * 6,
        "Launch Stand By": 100 * horas_muellaje,
        "Launch Anchorage": 430 * 1,
        "Launch Clearances": 380 * 2,
        "Pilot Transport": 140 * 3,
        "Linesmen Transport": 350 * 1,
        "Tugboat Stand By": 648 * horas_muellaje,
        "Tugboat Navigation": 745 * 8,
        "Authorities Transport": 550 * 1,
        "Authorities Charges": 700 * 1,
        "Immigration": 28 * 1,
        "Health Authorities": 130 * 1,
        
        # C) Agency Expenses
        "Loading Master": 2450 * 1,
        "Agency Fee": 1200 * 1
    }
    
    total = sum(costos.values())
    
    print("=== SIMULADOR DE CONVERGENCIA: MEJILLONES (BARQUITO) ===")
    print(f"Variables de entrada: GRT={grt}, Horas={horas_muellaje}\n")
    
    for concepto, monto in costos.items():
        print(f"{concepto:30}: ${monto:,.2f}")
        
    print("-" * 45)
    print(f"{'TOTAL LIQUIDACIÓN':30}: ${total:,.2f}")
    
    return total

if __name__ == "__main__":
    # Prueba de convergencia con las variables de la imagen (Columna 1)
    grt_prueba = 8259
    horas_prueba = 28
    
    total_calculado = calcular_mejillones_barquito(grt_prueba, horas_prueba)
    
    # Validar contra el total del Excel
    total_excel = 89195.81
    
    print(f"\nTotal Esperado (Excel)        : ${total_excel:,.2f}")
    
    diferencia = round(abs(total_calculado - total_excel), 2)
    if diferencia <= 0.01:
        print("✅ PRUEBA SUPERADA: Convergencia Matemática Perfecta.")
    else:
        print(f"❌ ERROR: Diferencia de ${diferencia}")
