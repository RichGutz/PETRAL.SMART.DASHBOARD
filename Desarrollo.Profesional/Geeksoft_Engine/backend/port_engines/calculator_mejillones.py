"""
Motor Dedicado para el Puerto TPM Mejillones (Terminal Puerto Mejillones S.A. - Chile)
Basado en la especificación oficial del Excel de la experta (PNG_Mejillones_Layout.md).
"""
from typing import Dict, Any, List

def run(v_data: Dict[str, Any], port_hours: float, inputs: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Calcula los costos portuarios exactos para el Puerto TPM Mejillones (Chile).
    
    Inputs esperados en v_data e inputs:
    - loa (length): Eslora del buque en metros (ej. 134.16)
    - grt (trb): Arqueo bruto (ej. 8259)
    - dwt: Peso muerto (ej. 14298)
    - port_hours: Horas totales en puerto (ej. 36.0h)
    - is_annual_light_dues: True si aplica pago anual prorrateado (15 viajes), False si aplica $1.60 por viaje
    """
    inputs = inputs or {}
    
    loa = float(v_data.get("loa") or v_data.get("length") or 134.16)
    grt = float(v_data.get("grt") or v_data.get("trb") or 8259)
    dwt = float(v_data.get("dwt") or 14298)
    vessel_name = str(v_data.get("vessel_name") or "").upper()
    
    is_annual_light_dues = bool(inputs.get("is_annual_light_dues", False))
    # Por defecto, Moquegua y Tablones aplican prorrateo anual en la planilla de la experta
    if "MOQUEGUA" in vessel_name or "TABLONES" in vessel_name:
        is_annual_light_dues = True

    # -------------------------------------------------------------
    # A) SHIFTING EXPENSES (Practicaje, Remolques Ultratug, Linesmen)
    # -------------------------------------------------------------
    # 1. Practicaje (Basado en GRT)
    if grt <= 8300:
        pilotage = 1207.38
    elif grt <= 11400:
        pilotage = 1591.10
    elif grt <= 12000:
        pilotage = 1540.77
    else:
        pilotage = 1609.80

    # 2. Remolcaje Ultratug ($2,800 x 4 = $11,200 USD)
    towage = 11200.00
    
    # 3. Linesmen ($871.25 x 2 = $1,742.50 USD)
    linesmen = 1742.50
    
    shifting_total = pilotage + towage + linesmen
    
    # -------------------------------------------------------------
    # B) GENERAL PORT EXPENSES (Muellaje $3.99*LOA*hr, Faro, Lanchas)
    # -------------------------------------------------------------
    # Light Dues ($1.60 x GRT por viaje OR $4.07 x GRT / 15 viajes)
    if is_annual_light_dues:
        lighthouse_dues = round((4.07 * grt) / 15.0, 2)
    else:
        lighthouse_dues = round(1.60 * grt, 2)
        
    # Dockage Muellaje: $3.99 USD * LOA * Horas Puerto
    dockage_rate = 3.99
    dockage = round(dockage_rate * loa * port_hours, 2)
    
    launch_anchorage = 390.00
    launch_pier = 272.57
    launch_mooring = 1800.00
    
    # Custom fees por nave según planilla
    if "HUEMUL" in vessel_name or "CONCON" in vessel_name:
        launch_clearances = 840.00
        pilot_transport = 420.00
        pilot_insurance = 0.00
        authorities_charges = 0.00
    elif "TABLONES" in vessel_name:
        launch_clearances = 420.00
        pilot_transport = 840.00 # $280 + $560
        pilot_insurance = 330.00
        authorities_charges = 0.00
    else:
        # MOQUEGUA / Default
        launch_clearances = 420.00
        pilot_transport = 840.00 # $280 + $560
        pilot_insurance = 330.00
        authorities_charges = 700.00

    authorities_transport = 650.00
    isps_fee = 1140.35
    immigration = 29.00
    health_auth = 110.00
    loading_master = 3264.40
    
    general_port_total = (lighthouse_dues + dockage + launch_anchorage + launch_pier + 
                          launch_mooring + launch_clearances + pilot_transport + 
                          pilot_insurance + authorities_transport + authorities_charges + 
                          isps_fee + immigration + health_auth + loading_master)
    
    # -------------------------------------------------------------
    # C) AGENCY EXPENSES (B&M Agencia Marítima Chile)
    # -------------------------------------------------------------
    agency_fee = 1200.00
    agency_total = agency_fee
    
    total_scale_cost = shifting_total + general_port_total + agency_total
    
    audit_trail: List[Dict[str, Any]] = [
        {
            "category": "A_SHIFTING",
            "concept": "Practicaje (Autoridad Marítima de Chile)",
            "supplier": "Autoridad Marítima Chile",
            "formula_evaluated": f"Tarifa Autoridad según {grt:,.0f} GRT",
            "amount_usd": pilotage
        },
        {
            "category": "A_SHIFTING",
            "concept": "Remolcaje (Ultratug Ltd. 4 Maniobras)",
            "supplier": "Ultratug Ltd.",
            "formula_evaluated": "$2,800.00 USD x 4 Remolques",
            "amount_usd": towage
        },
        {
            "category": "A_SHIFTING",
            "concept": "Amarradores en Tierra (Linesmen)",
            "supplier": "Puerto Mejillones",
            "formula_evaluated": "$871.25 USD x 2 Maniobras",
            "amount_usd": linesmen
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Muellaje TPM Mejillones (Dockage)",
            "supplier": "Terminal Puerto Mejillones S.A.",
            "formula_evaluated": f"$3.99 USD x {loa:.2f}m LOA x {port_hours:.1f}h Puerto",
            "amount_usd": dockage
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Derechos de Faro y Balisas (Light Dues Chile)",
            "supplier": "Directemar / Armada de Chile",
            "formula_evaluated": f"{'($4.07 x GRT) / 15 Viajes' if is_annual_light_dues else '$1.60 x GRT por Viaje'}",
            "amount_usd": lighthouse_dues
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Lanchas Operativas (Amarre, Fondeo & Pier Usage)",
            "supplier": "B&M Agencia Marítima",
            "formula_evaluated": "$1,800 Mooring + $390 Fondeo + $272.57 Pier Usage + Clearances",
            "amount_usd": launch_mooring + launch_anchorage + launch_pier + launch_clearances
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Seguros, Transportes & Servicios de Autoridades",
            "supplier": "Autoridades / B&M",
            "formula_evaluated": "Pilot Transport + Insurance + Authorities Transport + ISPS + Health + Loading Master",
            "amount_usd": pilot_transport + pilot_insurance + authorities_transport + authorities_charges + isps_fee + immigration + health_auth + loading_master
        },
        {
            "category": "C_AGENCY",
            "concept": "Honorarios Agenciamiento Marítimo",
            "supplier": "B&M Agencia Marítima",
            "formula_evaluated": "Tarifa Fija B&M Agenciamiento Nave TPM Mejillones",
            "amount_usd": agency_fee
        }
    ]
    
    return {
        "port_id": "MEJILLONES",
        "port_name": "Mejillones (Terminal Puerto Mejillones S.A.)",
        "terminal_operator": "Terminal Puerto Mejillones S.A. / B&M",
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
