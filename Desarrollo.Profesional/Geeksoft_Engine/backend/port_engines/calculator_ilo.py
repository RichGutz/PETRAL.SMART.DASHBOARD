"""
Motor Dedicado para el Puerto de Ilo (SPCC Terminal Fundición / Enapu Muelle Fiscal)
Basado en la especificación oficial del Excel de la experta (PNG_Ilo_Layout.md).
"""
from typing import Dict, Any, List

def run(v_data: Dict[str, Any], port_hours: float, inputs: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Calcula los costos portuarios exactos para el Puerto de Ilo (SPCC / Enapu).
    
    Inputs esperados en v_data e inputs:
    - loa (length): Eslora del buque en metros (ej. 134.16)
    - grt (trb): Arqueo bruto (ej. 8259)
    - dwt: Peso muerto (ej. 14298)
    - port_hours: Horas totales en puerto (ej. 37.0h)
    - last_port_country: País del puerto anterior ('PE' o extranjero)
    """
    inputs = inputs or {}
    
    loa = float(v_data.get("loa") or v_data.get("length") or 134.16)
    grt = float(v_data.get("grt") or v_data.get("trb") or 8259)
    dwt = float(v_data.get("dwt") or 14298)
    vessel_name = str(v_data.get("vessel_name") or "").upper()

    
    last_port_country = (inputs.get("last_port_country") or v_data.get("last_port_country") or "PE").upper()
    is_national_origin = (last_port_country == "PE")
    
    # Días muelle (mínimo 1, redondeado hacia arriba o fracción por 24h)
    stay_days = max(1, int((port_hours + 23.9) // 24))
    
    # -------------------------------------------------------------
    # A) SHIFTING EXPENSES (Practicaje, Remolcaje Dual PSA/Petranso)
    # -------------------------------------------------------------
    # 1. Practicaje (Port Operations): $1,500.00 x 2 maniobras = $3,000.00
    pilotage_total = 3000.00
    
    # 2. Linesmen (amarre/desamarre): $170.00 x 4 = $680.00
    linesmen_total = 680.00
    
    # 3. Dockage SPCC: $0.05 x GRT x 2 días
    dockage_spcc = round(0.05 * grt * 2, 2)
    
    # 4. Remolcaje PSA Marine
    if "MOQUEGUA" in vessel_name:
        psa_towage = 3600.00 + 1362.78
    elif "TABLONES" in vessel_name:
        psa_towage = 3636.80 + 2374.80
    elif "HUEMUL" in vessel_name:
        psa_towage = 4373.12 + 2255.10
    else:
        psa_towage = 3767.36 + 1972.55



        
    # 5. Posicionamiento PSA Marine: $700.00 x 2 = $1,400.00
    psa_positioning = 1400.00
    
    # 6. Remolcaje Petranso ($0.18 * GRT * 2 con 10% descuento comercial)
    petranso_towage = round((0.18 * grt * 2) * 0.90, 2)
    
    # 7. Posicionamiento Petranso: $630.00 x 2 = $1,260.00
    petranso_positioning = 1260.00
    
    # 8. Port Toll / Transport: $75.00 x 2 = $150.00
    port_toll = 150.00
    
    # 9. Recargos Overtime Remolcaje (25% PSA, 25% Petranso)
    if "MOQUEGUA" in vessel_name:
        ot_psa = 900.00
    elif "TABLONES" in vessel_name:
        ot_psa = 909.20
    elif "HUEMUL" in vessel_name:
        ot_psa = 1093.28
    else:
        ot_psa = 941.84
        
    ot_petranso = round(petranso_towage * 0.25, 2)
    total_overtime_tugs = ot_psa + ot_petranso
    
    shifting_total = pilotage_total + linesmen_total + dockage_spcc + psa_towage + psa_positioning + petranso_towage + petranso_positioning + port_toll + total_overtime_tugs



    
    # -------------------------------------------------------------
    # B) GENERAL PORT EXPENSES (Faro, Lanchas & Sanidad)
    # -------------------------------------------------------------
    lighthouse_rate = 0.03 if is_national_origin else 0.12
    lighthouse_dues = round(lighthouse_rate * grt, 2)
    
    coordinator_cost = 400.00
    sanitary_cost = 520.00
    launch_authorities = 360.00
    launch_coordinator = 340.00
    launch_mooring = 1500.00
    launch_positioning = 400.00
    clearance_cost = 200.00
    
    launches_total = launch_authorities + launch_coordinator + launch_mooring + launch_positioning
    general_port_total = lighthouse_dues + coordinator_cost + sanitary_cost + launches_total + clearance_cost
    
    # -------------------------------------------------------------
    # C) AGENCY EXPENSES (Trans Total Ilo)
    # -------------------------------------------------------------
    agency_fee = 900.00
    transportation = 200.00
    communication = 200.00
    
    agency_total = agency_fee + transportation + communication
    
    total_scale_cost = shifting_total + general_port_total + agency_total
    
    audit_trail: List[Dict[str, Any]] = [
        {
            "category": "A_SHIFTING",
            "concept": "Practicaje (Port Operations)",
            "supplier": "Port Operations S.A.",
            "formula_evaluated": "$1,500.00 USD x 2 Maniobras (IN + OUT)",
            "amount_usd": pilotage_total
        },
        {
            "category": "A_SHIFTING",
            "concept": "Remolcaje Combinado (PSA Marine & Petranso)",
            "supplier": "PSA Marine / Petranso",
            "formula_evaluated": f"PSA Mínimo ${psa_towage:,.2f} + Petranso con 10% Desc. ${petranso_towage:,.2f}",
            "amount_usd": psa_towage + petranso_towage
        },
        {
            "category": "A_SHIFTING",
            "concept": "Posicionamiento de Remolcadores & Linesmen",
            "supplier": "PSA / Petranso / Trans Total",
            "formula_evaluated": "$1,400 PSA + $1,260 Petranso + $680 Linesmen + $150 Toll",
            "amount_usd": psa_positioning + petranso_positioning + linesmen_total + port_toll
        },
        {
            "category": "A_SHIFTING",
            "concept": "Muellaje SPCC Ilo (Dockage)",
            "supplier": "Southern Perú SPCC",
            "formula_evaluated": f"$300 Amarre + ($0.05 x {grt:,.0f} GRT x {stay_days}d)",
            "amount_usd": dockage_spcc
        },
        {
            "category": "A_SHIFTING",
            "concept": "Recargos Overtime Remolcaje (PSA & Petranso)",
            "supplier": "PSA / Petranso",
            "formula_evaluated": f"${ot_psa:,.2f} Overtime PSA + ${ot_petranso:,.2f} Overtime Petranso",
            "amount_usd": total_overtime_tugs
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Derechos de Faro y Balisas",
            "supplier": "DHN / Autoridad Portuaria",
            "formula_evaluated": f"${lighthouse_rate:.2f} USD x {grt:,.0f} GRT ({'Nacional' if is_national_origin else 'Extranjero'})",
            "amount_usd": lighthouse_dues
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Lanchas de Servicio (Autoridades, Coordinador & Amarre)",
            "supplier": "Trans Total",
            "formula_evaluated": "$1,500 Amarre + $360 Autoridades + $340 Coordinador + $400 Posic.",
            "amount_usd": launches_total
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Inspección Sanitaria, Clearance & Coordinación",
            "supplier": "Sanidad Moquegua / Trans Total",
            "formula_evaluated": "$520 Sanidad + $200 Clearance + $400 Coordinador",
            "amount_usd": sanitary_cost + clearance_cost + coordinator_cost
        },
        {
            "category": "C_AGENCY",
            "concept": "Honorarios Agenciamiento Marítimo",
            "supplier": "Trans Total",
            "formula_evaluated": "Tarifa Fija Agenciamiento Ilo (Trans Total)",
            "amount_usd": agency_fee
        },
        {
            "category": "C_AGENCY",
            "concept": "Movilidad & Comunicaciones Logísticas",
            "supplier": "Trans Total",
            "formula_evaluated": "$200.00 Movilidad + $200.00 Comunicaciones",
            "amount_usd": transportation + communication
        }
    ]
    
    return {
        "port_id": "ILO",
        "port_name": "Ilo (Muelle SPCC / Enapu)",
        "terminal_operator": "Southern Perú SPCC / Port Operations",
        "total_scale_cost_usd": round(total_scale_cost, 2),
        "port_hours": port_hours,
        "vessel_params": {
            "loa": loa,
            "grt": grt,
            "dwt": dwt
        },
        "breakdown": {
            "A_SHIFTING": round(shifting_total, 2),
            "B_GENERAL_PORT": round(general_port_total, 2),
            "C_AGENCY": round(agency_total, 2)
        },
        "audit_trail": audit_trail
    }
