"""
Motor Dedicado para el Terminal Terquim (Mejillones - Chile)
Basado en la especificación oficial del Excel de la experta (PNG_Mejillones_Terquim_Layout.md).
"""
from typing import Dict, Any, List

def run(v_data: Dict[str, Any], port_hours: float, inputs: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Calcula los costos portuarios exactos para el Terminal Terquim (Mejillones - Chile).
    
    Inputs esperados en v_data e inputs:
    - loa (length): Eslora del buque en metros (ej. 134.16)
    - grt (trb): Arqueo bruto (ej. 8259)
    - dwt: Peso muerto (ej. 14298)
    - port_hours: Horas totales en puerto (ej. 30.0h)
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
        pilotage = 1156.26
    elif grt <= 11400:
        pilotage = 1591.10
    elif grt <= 12000:
        pilotage = 1540.77
    else:
        pilotage = 1609.80

    # 2. Remolcaje Ultratug ($2,800 x 3 Moquegua / x 4 Otros)
    towage = 8400.00 if "MOQUEGUA" in vessel_name else 11200.00
    
    # 3. Pilot Insurance ($110 x 2 Moquegua/Tablones vs $110 x 3 Huemul/Concon)
    pilot_insurance = 220.00 if ("MOQUEGUA" in vessel_name or "TABLONES" in vessel_name) else 330.00
    
    # 4. Linesmen ($801.00 x 2 = $1,602.00 USD)
    linesmen = 1602.00
    
    shifting_total = pilotage + towage + pilot_insurance + linesmen
    
    # -------------------------------------------------------------
    # B) GENERAL PORT EXPENSES (Muellaje $5.72*LOA*hr, Faro, Lanchas)
    # -------------------------------------------------------------
    # Light Dues ($1.60 x GRT por viaje OR $4.07 x GRT / 15 viajes)
    if is_annual_light_dues:
        lighthouse_dues = round((4.07 * grt) / 15.0, 2)
    else:
        lighthouse_dues = round(1.60 * grt, 2)
        
    # Dockage Muellaje Terquim ($5.72 * LOA * port_hours)
    dockage_rate = 5.72
    dockage = round(dockage_rate * loa * port_hours, 2)
    
    launch_mooring = 1800.00
    launch_embarcadero = 280.00 if "MOQUEGUA" in vessel_name else 420.00
    launch_anchorage = 390.00
    launch_clearances = 840.00
    launch_pier = 420.00
    
    # Pilot transport & authorities
    if "MOQUEGUA" in vessel_name:
        pilot_transport = 330.00
        loading_master = 2923.00
    elif "TABLONES" in vessel_name:
        pilot_transport = 495.00
        loading_master = 2923.00
    else:
        # HUEMUL / CONCON
        pilot_transport = 495.00
        loading_master = 3108.29

    authorities_charges = 0.00


    authorities_transport = 650.00
    isps_fee = 1191.00
    immigration = 28.00
    health_auth = 120.00
    
    general_port_total = (lighthouse_dues + dockage + launch_mooring + launch_embarcadero + 
                          launch_anchorage + launch_clearances + launch_pier + pilot_transport + 
                          authorities_transport + authorities_charges + 
                          isps_fee + immigration + health_auth + loading_master)
    
    # -------------------------------------------------------------
    # C) AGENCY EXPENSES (B&M Agency Fee & Hose Connection)
    # -------------------------------------------------------------
    agency_fee = 1200.00
    hose_connection = 2500.00 if "MOQUEGUA" in vessel_name else 3000.00
    agency_total = agency_fee + hose_connection
    
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
            "concept": "Remolcaje (Ultratug Ltd.)",
            "supplier": "Ultratug Ltd.",
            "formula_evaluated": f"$2,800.00 USD x {'3' if 'MOQUEGUA' in vessel_name else '4'} Remolques",
            "amount_usd": towage
        },
        {
            "category": "A_SHIFTING",
            "concept": "Seguro de Práctico & Amarradores",
            "supplier": "Puerto Mejillones / B&M",
            "formula_evaluated": f"${pilot_insurance:.2f} Seguro + $1,602.00 Linesmen",
            "amount_usd": pilot_insurance + linesmen
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Muellaje Terminal Terquim (Dockage)",
            "supplier": "Terminal Terquim Mejillones",
            "formula_evaluated": f"$5.72 USD x {loa:.2f}m LOA x {port_hours:.1f}h Puerto",
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
            "concept": "Lanchas Operativas (Amarre, Embarcadero, Pier & Clearances)",
            "supplier": "B&M Agencia Marítima",
            "formula_evaluated": "$1,800 Mooring + $840 Clearances + $420 Pier + Embarcadero + Fondeo",
            "amount_usd": launch_mooring + launch_embarcadero + launch_anchorage + launch_clearances + launch_pier
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Transportes, Autoridades & Loading Master",
            "supplier": "Autoridades / Terquim / B&M",
            "formula_evaluated": "Pilot Transport + Authorities Transport + ISPS + Health + Loading Master",
            "amount_usd": pilot_transport + authorities_transport + authorities_charges + isps_fee + immigration + health_auth + loading_master
        },
        {
            "category": "C_AGENCY",
            "concept": "Honorarios Agenciamiento Marítimo & Conexión Manguera",
            "supplier": "B&M Agencia Marítima",
            "formula_evaluated": f"$1,200 Agency Fee + ${hose_connection:,.2f} Hose Connection / Portalón",
            "amount_usd": agency_total
        }
    ]
    
    return {
        "port_id": "TERQUIM",
        "port_name": "Mejillones (Terminal Terquim)",
        "terminal_operator": "Terminal Terquim / B&M",
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
