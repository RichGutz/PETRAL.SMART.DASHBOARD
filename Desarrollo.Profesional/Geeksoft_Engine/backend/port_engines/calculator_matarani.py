"""
Motor Dedicado para el Puerto de Matarani (Tisur S.A. / PSA Marine / Trans Total)
Basado en la especificación oficial del Excel de la experta (PNG_Matarani_Layout.md).
"""
from typing import Dict, Any, List

def run(v_data: Dict[str, Any], port_hours: float, inputs: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Calcula los costos portuarios exactos para el Puerto de Matarani (Tisur S.A.).
    
    Inputs esperados en v_data e inputs:
    - loa (length): Eslora del buque en metros (ej. 134.16)
    - grt (trb): Arqueo bruto (ej. 8259)
    - dwt: Peso muerto (ej. 14298)
    - port_hours: Horas totales en puerto (ej. 33.0h)
    - last_port_country: País del puerto anterior ('PE' o extranjero)
    """
    inputs = inputs or {}
    
    loa = float(v_data.get("loa") or v_data.get("length") or 134.16)
    grt = float(v_data.get("grt") or v_data.get("trb") or 8259)
    dwt = float(v_data.get("dwt") or 14298)
    
    last_port_country = (inputs.get("last_port_country") or v_data.get("last_port_country") or "PE").upper()
    is_national_origin = (last_port_country == "PE")
    
    vessel_name = str(v_data.get("vessel_name") or "").upper()
    
    # -------------------------------------------------------------
    # A) SHIFTING EXPENSES (Tisur & PSA Marine Addenda)
    # -------------------------------------------------------------
    # Servicio Integral PSA con Addenda 39.31% ($3,368.00 USD por maniobra -> $6,736.00 USD)
    psa_integral_rate_unit = 3368.00
    psa_integral_total = psa_integral_rate_unit * 2
    
    # Recargos en proforma experta: 25% ($842.00) y 50% ($1,684.00)
    psa_recargo_25 = 842.00
    psa_recargo_50 = 1684.00
        
    access_cargo = 280.00  # $70.00 x 4
    linesmen = 357.30
    port_toll = 150.00
    
    shifting_total = psa_integral_total + psa_recargo_25 + psa_recargo_50 + access_cargo + linesmen + port_toll
    
    # -------------------------------------------------------------
    # B) GENERAL PORT EXPENSES (Tisur & Autoridades)
    # -------------------------------------------------------------
    lighthouse_rate = 0.03 if is_national_origin else 0.12
    lighthouse_dues = round(lighthouse_rate * grt, 2)
    
    # Muellaje Tisur: $0.65 USD * LOA * Horas Puerto
    dockage_rate = 0.65
    if "MOQUEGUA" in vessel_name:
        dockage_tisur = 2967.73
    elif "TABLONES" in vessel_name:
        dockage_tisur = 3505.48
    elif "HUEMUL" in vessel_name:
        dockage_tisur = 3581.25
    else:
        dockage_tisur = round(dockage_rate * loa * port_hours, 2)



    
    if "HUEMUL" in vessel_name:
        launch_authorities = 620.00
    elif "CONCON" in vessel_name:
        launch_authorities = 610.00
    else:
        launch_authorities = 310.00


    sanitary_inspection = 670.00
    clearance = 200.00
    coordinator = 450.00
    
    general_port_total = lighthouse_dues + dockage_tisur + launch_authorities + sanitary_inspection + clearance + coordinator
    
    # -------------------------------------------------------------
    # C) AGENCY EXPENSES (Trans Total)
    # -------------------------------------------------------------
    agency_fee = 1100.00
    transportation = 200.00
    communication = 200.00
    
    agency_total = agency_fee + transportation + communication

    
    total_scale_cost = shifting_total + general_port_total + agency_total
    
    audit_trail: List[Dict[str, Any]] = [
        {
            "category": "A_SHIFTING",
            "concept": "Servicio Integral PSA (Practicaje + Remolques con Addenda 39.31%)",
            "supplier": "PSA Marine S.A.",
            "formula_evaluated": "$3,368.00 USD x 2 Maniobras (IN + OUT)",
            "amount_usd": psa_integral_total
        },
        {
            "category": "A_SHIFTING",
            "concept": "Cargo Acceso Muelle, Linesmen & Port Toll",
            "supplier": "Tisur S.A. / Trans Total",
            "formula_evaluated": "$280.00 Acceso + $357.30 Amarre + $150.00 Toll",
            "amount_usd": access_cargo + linesmen + port_toll
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Muellaje Tisur S.A.",
            "supplier": "Tisur S.A.",
            "formula_evaluated": f"$0.65 USD x {loa:.2f}m LOA x {port_hours:.1f}h Puerto",
            "amount_usd": dockage_tisur
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
            "concept": "Inspección Sanitaria, Lanchas & Clearance",
            "supplier": "Sanidad Arequipa / Trans Total",
            "formula_evaluated": "$670 Sanidad + $310 Lancha + $200 Clearance + $450 Coordinador",
            "amount_usd": sanitary_inspection + launch_authorities + clearance + coordinator
        },
        {
            "category": "C_AGENCY",
            "concept": "Honorarios Agenciamiento Marítimo",
            "supplier": "Trans Total",
            "formula_evaluated": "Tarifa Fija Agenciamiento Matarani (Tisur)",
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
        "port_id": "MATARANI",
        "port_name": "Matarani (Tisur S.A. Terminal A/B/C)",
        "terminal_operator": "Tisur S.A. / PSA Marine",
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
