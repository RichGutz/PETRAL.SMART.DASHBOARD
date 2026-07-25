"""
Motor Dedicado para el Puerto de Marcona (San Juan / SPCC - PSA Marine)
Basado en la especificación oficial del Excel de la experta (PNG_Marcona_Layout.md)
y el Contrato Marco SPCC / Southern 2025-2027.
"""
from typing import Dict, Any, List

def run(v_data: Dict[str, Any], port_hours: float, inputs: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Calcula los costos portuarios exactos para el Puerto de Marcona (Muelle Mineralero SPCC).
    
    Inputs esperados en v_data e inputs:
    - loa (length): Eslora del buque en metros (ej. 134.16)
    - grt (trb): Arqueo bruto (ej. 8259)
    - dwt: Peso muerto (ej. 14298)
    - port_hours: Horas totales en puerto (ej. 45.0h)
    - last_port_country: País del puerto anterior ('PE' o extranjero)
    """
    inputs = inputs or {}
    
    loa = float(v_data.get("loa") or v_data.get("length") or 134.16)
    grt = float(v_data.get("grt") or v_data.get("trb") or 8259)
    dwt = float(v_data.get("dwt") or 14298)
    
    last_port_country = (inputs.get("last_port_country") or v_data.get("last_port_country") or "PE").upper()
    is_national_origin = (last_port_country == "PE")
    
    # -------------------------------------------------------------
    # TARIFA ACORDADA MARCONA (Acuerdo Marco SPCC 2025-2027)
    # Total Tarifario Público Bruto: $61,424.07 USD
    # Tarifa Plana Preferencial SPCC: $36,000.00 USD Flat
    # -------------------------------------------------------------
    base_agreed_flat = 36000.00
    public_catalog_total = 61424.07
    
    # Evaluar Stand-By de Lancha y Remolque (Filtro de Tiempo: > 48 horas)
    extra_standby_recharge = 0.0
    if port_hours > 48.0:
        # $3,000.00 USD adicionales a partir de 48 horas de estadía
        extra_standby_recharge = 3000.00
        
    total_scale_cost = base_agreed_flat + extra_standby_recharge
    
    # Desglose Auditado por los 3 Bloques Oficiales
    # A) Shifting Expenses: Servicio Integral de Atraque ($30,508.48)
    shifting_total = 30508.48
    
    # B) General Port Expenses
    lighthouse_rate = 0.03 if is_national_origin else 0.12
    lighthouse_dues = round(lighthouse_rate * grt, 2)
    coordinator_cost = 450.00
    clearance_cost = 200.00
    sanitary_cost = 670.00
    authorities_launch = 200.00
    standby_launch_base = min(1800.00, port_hours * 40.0)
    
    general_port_total = lighthouse_dues + coordinator_cost + clearance_cost + sanitary_cost + authorities_launch + standby_launch_base + extra_standby_recharge
    
    # C) Agency Expenses
    agency_fee = 1400.00
    transportation = 200.00
    communication = 250.00
    agency_total = agency_fee + transportation + communication
    
    audit_trail: List[Dict[str, Any]] = [
        {
            "category": "A_SHIFTING",
            "concept": "Servicio Integral de Atraque (Practicaje, Remolques PSA & Amarre)",
            "supplier": "PSA Marine S.A.",
            "formula_evaluated": "Acuerdo Preferencial SPCC / Southern (Tarifa Convenio)",
            "amount_usd": shifting_total
        },
        {
            "category": "A_SHIFTING",
            "concept": "Port Toll & Terminal Access Fee",
            "supplier": "Trans Total",
            "formula_evaluated": "2 Maniobras x $75.00 (Incluido en Convenio)",
            "amount_usd": 150.00
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Derechos de Faro y Balisas",
            "supplier": "Autoridad Portuaria / DHN",
            "formula_evaluated": f"${lighthouse_rate:.2f} USD x {grt:,.0f} GRT ({'Nacional' if is_national_origin else 'Extranjero'})",
            "amount_usd": lighthouse_dues
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Coordinador a Bordo",
            "supplier": "Trans Total",
            "formula_evaluated": "2 Días x $225.00 USD/día",
            "amount_usd": coordinator_cost
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Inspección Sanitaria (Sanidad APN)",
            "supplier": "Sanidad Marítima",
            "formula_evaluated": "Tarifa APN Marcona Flat",
            "amount_usd": sanitary_cost
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Lancha de Autoridades & Clearance",
            "supplier": "Trans Total",
            "formula_evaluated": "$200 Clearance + $200 Lancha Autoridades",
            "amount_usd": clearance_cost + authorities_launch
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Lancha Stand-By Operativa",
            "supplier": "PSA Marine S.A.",
            "formula_evaluated": f"Covered in Flat ({min(48.0, port_hours):.1f}h x $40.00/h)" + (f" + ${extra_standby_recharge:,.2f} Recargo >48h" if extra_standby_recharge > 0 else ""),
            "amount_usd": standby_launch_base + extra_standby_recharge
        },
        {
            "category": "C_AGENCY",
            "concept": "Honorarios Agenciamiento Marítimo",
            "supplier": "Trans Total",
            "formula_evaluated": "Tarifa Fija Agenciamiento Marcona (Acuerdo SPCC)",
            "amount_usd": agency_fee
        },
        {
            "category": "C_AGENCY",
            "concept": "Movilidad & Comunicaciones Logísticas",
            "supplier": "Trans Total",
            "formula_evaluated": "$200.00 Movilidad + $250.00 Comunicaciones",
            "amount_usd": transportation + communication
        }
    ]
    
    return {
        "port_id": "MARCONA",
        "port_name": "Marcona (Muelle Mineralero San Nicolás)",
        "terminal_operator": "SPCC / PSA Marine",
        "public_catalog_usd": public_catalog_total,
        "total_scale_cost_usd": total_scale_cost,
        "is_agreed_flat": True,
        "port_hours": port_hours,
        "vessel_params": {
            "loa": loa,
            "grt": grt,
            "dwt": dwt
        },
        "breakdown": {
            "A_SHIFTING": shifting_total + 150.00,
            "B_GENERAL_PORT": general_port_total,
            "C_AGENCY": agency_total
        },
        "audit_trail": audit_trail
    }
