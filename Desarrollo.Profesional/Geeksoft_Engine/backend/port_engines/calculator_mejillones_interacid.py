"""
Motor Dedicado para el Terminal Interacid (Mejillones - Chile)
Basado en la especificación oficial del Excel de la experta (PNG_Mejillones_Interacid_Layout.md).
"""
from typing import Dict, Any, List

def run(v_data: Dict[str, Any], port_hours: float, inputs: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Calcula los costos portuarios exactos para el Terminal Interacid (Mejillones - Chile).
    
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
    if "MOQUEGUA" in vessel_name or "TABLONES" in vessel_name:
        is_annual_light_dues = True

    # -------------------------------------------------------------
    # A) SHIFTING EXPENSES (Practicaje, Remolques Ultratug, Insurance, Linesmen)
    # -------------------------------------------------------------
    # 1. Practicaje
    if grt <= 8300:
        pilotage = 1151.01
    elif grt <= 11400:
        pilotage = 1591.10
    elif grt <= 12000:
        pilotage = 1540.77
    else:
        pilotage = 1609.80

    # 2. Remolcaje Ultratug ($2,800 x 4 = $11,200 USD)
    towage = 11200.00
    
    # 3. Pilot Insurance
    pilot_insurance = 330.00
    
    # 4. Linesmen ($871.25 x 2 = $1,742.50 USD)
    linesmen = 1742.50
    
    shifting_total = pilotage + towage + pilot_insurance + linesmen
    
    # -------------------------------------------------------------
    # B) GENERAL PORT EXPENSES (Muellaje $702/$754*hr, Faro, Lanchas)
    # -------------------------------------------------------------
    # Light Dues ($1.60 x GRT por viaje OR $4.07 x GRT / 15 viajes)
    if is_annual_light_dues:
        lighthouse_dues = round((4.07 * grt) / 15.0, 2)
    else:
        lighthouse_dues = round(1.60 * grt, 2)
        
    # Dockage Muellaje Interacid ($702/h Moquegua vs $754/h Otros)
    dockage_rate = 702.00 if "MOQUEGUA" in vessel_name else 754.00
    dockage = round(dockage_rate * port_hours, 2)
    
    launch_anchorage = 390.00
    launch_pier = 420.00
    launch_mooring = 1800.00
    launch_embarcadero = 280.00
    
    # Custom fees por nave según planilla Interacid
    if "CONCON" in vessel_name:
        launch_clearances = 840.00
        pilot_transport = 450.00
    elif "HUEMUL" in vessel_name:
        launch_clearances = 0.00
        pilot_transport = 450.00
    elif "TABLONES" in vessel_name:
        launch_clearances = 0.00
        pilot_transport = 150.00
    else:
        # MOQUEGUA / Default
        launch_clearances = 0.00
        pilot_transport = 150.00

    authorities_charges = 0.00


    authorities_transport = 650.00
    isps_fee = 1273.00
    immigration = 28.00
    health_auth = 110.00 if "HUEMUL" in vessel_name else 120.00
    loading_master = round(86.00 * port_hours, 2) # $86/h x 36h = $3,096.00

    
    general_port_total = (lighthouse_dues + dockage + launch_anchorage + launch_pier + 
                          launch_mooring + launch_embarcadero + launch_clearances + pilot_transport + 
                          authorities_transport + authorities_charges + 
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
            "concept": "Seguro de Práctico & Amarradores",
            "supplier": "Puerto Mejillones / B&M",
            "formula_evaluated": "$330 Seguro + $1,742.50 Linesmen",
            "amount_usd": pilot_insurance + linesmen
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Muellaje Terminal Interacid (Dockage)",
            "supplier": "Terminal Interacid Mejillones",
            "formula_evaluated": f"${dockage_rate:.2f} USD/h x {port_hours:.1f}h Puerto",
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
            "concept": "Lanchas Operativas (Amarre, Embarcadero & Fondeo)",
            "supplier": "B&M Agencia Marítima",
            "formula_evaluated": "$1,800 Mooring + $390 Fondeo + $420 Pier + $280 Embarcadero",
            "amount_usd": launch_mooring + launch_anchorage + launch_pier + launch_embarcadero + launch_clearances
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Transportes, Autoridades & Loading Master",
            "supplier": "Autoridades / Interacid / B&M",
            "formula_evaluated": "$650 Transport + $1,273 ISPS + $148 Sanidad/PDI + $3,096 Loading Master",
            "amount_usd": pilot_transport + authorities_transport + authorities_charges + isps_fee + immigration + health_auth + loading_master
        },
        {
            "category": "C_AGENCY",
            "concept": "Honorarios Agenciamiento Marítimo",
            "supplier": "B&M Agencia Marítima",
            "formula_evaluated": "Tarifa Fija B&M Agenciamiento Nave Terminal Interacid",
            "amount_usd": agency_fee
        }
    ]
    
    return {
        "port_id": "INTERACID",
        "port_name": "Mejillones (Terminal Interacid)",
        "terminal_operator": "Terminal Interacid / B&M",
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
