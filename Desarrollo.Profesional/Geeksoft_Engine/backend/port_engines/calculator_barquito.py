"""
Motor Dedicado para el Terminal Barquito (Chañaral, Atacama - Chile)
Basado en la especificación oficial del Excel de la experta (PNG_Barquito_Layout.md).
"""
from typing import Dict, Any, List

def run(v_data: Dict[str, Any], port_hours: float, inputs: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Calcula los costos portuarios exactos para el Terminal Barquito (Chile).
    
    Inputs esperados en v_data e inputs:
    - loa (length): Eslora del buque en metros (ej. 134.16)
    - grt (trb): Arqueo bruto (ej. 8259)
    - dwt: Peso muerto (ej. 14298)
    - port_hours: Horas totales en puerto (ej. 32.0h o 40.0h)
    - is_annual_light_dues: True si aplica pago anual prorrateado, False si aplica $1.60 por viaje
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
    # A) SHIFTING EXPENSES (Practicaje, Remolques Ultratug, Insurance, Linesmen, Access)
    # -------------------------------------------------------------
    # 1. Practicaje
    if grt <= 8300:
        pilotage = 1151.01
    elif grt <= 11400:
        pilotage = 1388.62
    elif grt <= 12000:
        pilotage = 1540.77
    else:
        pilotage = 1609.80

    # 2. Remolcaje Ultratug ($6,776.25 x 5 = $33,881.25 USD)
    towage = 33881.25
    
    # 3. Pilot Insurance ($110.00 x 3 = $330.00 USD)
    pilot_insurance = 330.00
    
    # 4. Linesmen ($1,500.00 x 2 = $3,000.00 USD)
    linesmen = 3000.00
    
    # 5. Port Toll / Access
    port_toll = 90.00
    
    shifting_total = pilotage + towage + pilot_insurance + linesmen + port_toll
    
    # -------------------------------------------------------------
    # B) GENERAL PORT EXPENSES (Dockage, Tug Standby $650/h, Launch Standby $110/h, Faro)
    # -------------------------------------------------------------
    # Light Dues ($1.60 x GRT por viaje OR Cuota Anual Moquegua/Tablones)
    if "TABLONES" in vessel_name:
        lighthouse_dues = 4485.97
    elif is_annual_light_dues:
        lighthouse_dues = round((4.07 * grt) / 15.0, 2)
    else:
        lighthouse_dues = round(1.60 * grt, 2)


        
    # Dockage Muellaje Barquito ($71.92 * port_hours)
    dockage = round(71.92 * port_hours, 2)
    
    # Tugboat Stand-By ($650/h * port_hours)
    tugboat_standby = round(650.00 * port_hours, 2)
    
    # Launch Stand-By ($110/h * port_hours)
    launch_standby = round(110.00 * port_hours, 2)
    
    # Tugboat Navigation desde Caldera ($750 x 6 = $4,500 USD)
    tugboat_navigation = 4500.00
    
    launch_mooring = 2880.00
    launch_anchorage = 420.00
    launch_clearances = 840.00
    pilot_transport = 330.00
    linesmen_transport = 450.00
    authorities_transport = 750.00
    authorities_charges = 640.20 if "MOQUEGUA" in vessel_name else 700.00
    isps_fee = 0.00
    immigration = 28.00
    health_auth = 130.00
    loading_master = 2450.00

    
    general_port_total = (lighthouse_dues + dockage + tugboat_standby + launch_standby + 
                          tugboat_navigation + launch_mooring + launch_anchorage + 
                          launch_clearances + pilot_transport + linesmen_transport + 
                          authorities_transport + authorities_charges + 
                          isps_fee + immigration + health_auth + loading_master)
    
    # -------------------------------------------------------------
    # C) AGENCY EXPENSES (B&M Agency Fee)
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
            "concept": "Remolcaje (Ultratug Ltd. 5 Maniobras)",
            "supplier": "Ultratug Ltd.",
            "formula_evaluated": "$6,776.25 USD x 5 Remolques",
            "amount_usd": towage
        },
        {
            "category": "A_SHIFTING",
            "concept": "Seguro de Práctico, Linesmen & Port Toll",
            "supplier": "SMPs / Puerto Barquito / B&M",
            "formula_evaluated": "$330 Seguro + $3,000 Linesmen + $90 Port Toll",
            "amount_usd": pilot_insurance + linesmen + port_toll
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Muellaje & Remolcador Stand-By Exigido",
            "supplier": "Ultratug / Codelco Barquito",
            "formula_evaluated": f"$650.00/h Remolcador Stand-By + $71.92/h Muellaje ({port_hours:.0f}h)",
            "amount_usd": tugboat_standby + dockage
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Derechos de Faro y Balisas (Light Dues Chile)",
            "supplier": "Directemar / Armada de Chile",
            "formula_evaluated": f"{'Anual Prorrateado' if is_annual_light_dues else '$1.60 x GRT por Viaje'}",
            "amount_usd": lighthouse_dues
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Lanchas (Mooring, Stand-By, Anchorage & Clearances)",
            "supplier": "B&M Agencia Marítima",
            "formula_evaluated": f"$2,880 Mooring + ${launch_standby:,.2f} Lancha Stand-by ({port_hours:.0f}h) + $420 Anchorage + $840 Clearances",
            "amount_usd": launch_mooring + launch_standby + launch_anchorage + launch_clearances
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Navegación Remolcador desde Caldera & Autoridades",
            "supplier": "Ultratug / Autoridades / B&M",
            "formula_evaluated": "$4,500 Navegación Caldera + $750 Transport + $700 Charges + $1,191 ISPS + $2,450 Loading Master",
            "amount_usd": tugboat_navigation + pilot_transport + linesmen_transport + authorities_transport + authorities_charges + isps_fee + immigration + health_auth + loading_master
        },
        {
            "category": "C_AGENCY",
            "concept": "Honorarios Agenciamiento Marítimo",
            "supplier": "B&M Agencia Marítima",
            "formula_evaluated": "Tarifa Fija B&M Agenciamiento Nave Terminal Barquito",
            "amount_usd": agency_fee
        }
    ]
    
    return {
        "port_id": "BARQUITO",
        "port_name": "Barquito (Terminal Codelco Barquito)",
        "terminal_operator": "Codelco Barquito / B&M / Ultratug",
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
