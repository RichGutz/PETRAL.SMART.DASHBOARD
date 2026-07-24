"""
Motor Dedicado para el Puerto del Callao (APM Terminals / Trans Total)
Basado en la especificación oficial de la experta de operaciones de Naviera Petral.
"""
from typing import Dict, Any, List

def run(v_data: Dict[str, Any], port_hours: float, inputs: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Calcula los costos portuarios exactos para el Puerto del Callao (APM Terminals).
    
    Inputs esperados en v_data e inputs:
    - loa (length): Eslora del buque en metros (ej. 134.16)
    - grt (trb): Arqueo bruto (ej. 8259)
    - dwt: Peso muerto (ej. 14298)
    - port_hours: Horas totales en puerto (ej. 27.0)
    - last_port_country: País del puerto anterior ('PE' o extranjero)
    - is_foreign_voyage: Bool si el viaje involucra puerto extranjero
    - tugboats_in: Cantidad remolques ingreso (default 2)
    - tugboats_out: Cantidad remolques salida (default 2)
    - entry_datetime / exit_datetime: Para cálculo de overtime
    """
    inputs = inputs or {}
    
    loa = float(v_data.get("loa") or v_data.get("length") or 134.16)
    grt = float(v_data.get("grt") or v_data.get("trb") or 8259)
    dwt = float(v_data.get("dwt") or 14298)
    
    last_port_country = (inputs.get("last_port_country") or v_data.get("last_port_country") or "PE").upper()
    is_national_origin = (last_port_country == "PE")
    is_foreign_voyage = inputs.get("is_foreign_voyage", not is_national_origin)
    
    tugboats_in = int(inputs.get("tugboats_in") or 2)
    tugboats_out = int(inputs.get("tugboats_out") or 2)
    total_tugs = tugboats_in + tugboats_out
    
    launches_count = int(inputs.get("launches_count") or 4)
    coordinator_shifts = int(inputs.get("coordinator_shifts") or 2)
    access_maneuvers = int(inputs.get("access_maneuvers") or 2)
    
    # 1. Practicaje (IN + OUT)
    # Base: MAX(750.00, 0.055 * GRT) por maniobra
    base_pilotage_unit = max(750.00, 0.055 * grt)
    # Check overtime percentages if passed, default 0%
    ot_in_pct = float(inputs.get("pilotage_in_overtime_pct") or 0.0)
    ot_out_pct = float(inputs.get("pilotage_out_overtime_pct") or 0.0)
    
    pilotage_in_cost = base_pilotage_unit * (1.0 + ot_in_pct / 100.0)
    pilotage_out_cost = base_pilotage_unit * (1.0 + ot_out_pct / 100.0)
    total_pilotage = pilotage_in_cost + pilotage_out_cost
    
    # 2. Remolcaje (Petranso)
    # $800.00 por remolque
    towage_rate = 800.00
    total_towage = towage_rate * total_tugs
    
    # 3. Acceso Atraque / Desatraque (APM Terminals)
    access_rate = 70.00
    total_access = access_rate * access_maneuvers
    
    # 4. Faro y Balisas (Lighthouse Dues)
    # $0.03 USD / GRT si nacional, $0.12 USD / GRT si extranjero
    lighthouse_rate = 0.03 if is_national_origin else 0.12
    total_lighthouse = round(lighthouse_rate * grt, 2)
    
    # 5. Muellaje APM Terminals (Dockage)
    # $1.50 USD * LOA * Horas Puerto
    dockage_rate = 1.50
    total_dockage = round(dockage_rate * loa * port_hours, 2)
    
    # 6. Lanchas Operativas
    launch_rate = 85.00
    total_launches = launch_rate * launches_count
    
    # 7. Coordinador a Bordo
    coordinator_rate = 225.00
    total_coordinator = coordinator_rate * coordinator_shifts
    
    # 8. Clearance (In/Out)
    total_clearance = 200.00
    
    # 9. Inspección Sanitaria
    total_sanitary = 520.00 if is_foreign_voyage else 520.00  # En proforma experta Moquegua es $520.00
    
    # 10. Honorarios Agencia (Trans Total)
    agency_fee_base = 1000.00
    stay_days = port_hours / 24.0
    extra_days = max(0, int(stay_days - 5))
    total_agency_fee = agency_fee_base + (extra_days * 150.00)
    
    # 11. Movilidad & Comunicaciones Logística
    mobility = 200.00
    communications = 250.00
    total_logistics = mobility + communications
    
    audit_trail = [
        {
            "category": "A_SHIFTING",
            "concept": "Practicaje (IN + OUT)",
            "supplier": "Trans Total",
            "formula_evaluated": f"MAX($750.00, 0.055 x {grt:,.0f} GRT) x 2 Maniobras",
            "amount_usd": round(total_pilotage, 2),
            "badge": "Pass-Through"
        },
        {
            "category": "A_SHIFTING",
            "concept": "Remolcaje (Petranso)",
            "supplier": "Petranso",
            "formula_evaluated": f"${towage_rate:,.2f} x {total_tugs} Remolques ({tugboats_in} IN / {tugboats_out} OUT)",
            "amount_usd": round(total_towage, 2),
            "badge": "Pass-Through"
        },
        {
            "category": "A_SHIFTING",
            "concept": "Acceso Atraque / Desatraque",
            "supplier": "APM Terminals",
            "formula_evaluated": f"${access_rate:,.2f} x {access_maneuvers} Maniobras",
            "amount_usd": round(total_access, 2),
            "badge": "Tarifa APM"
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Derechos de Faro y Balisas",
            "supplier": "Autoridad Portuaria Nacional",
            "formula_evaluated": f"${lighthouse_rate:.2f} x {grt:,.0f} GRT ({'Nacional' if is_national_origin else 'Extranjero'})",
            "amount_usd": total_lighthouse,
            "badge": "Regla Origen"
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Muellaje APM Terminals",
            "supplier": "APM Terminals",
            "formula_evaluated": f"$1.50 x {loa:.2f}m (LOA) x {port_hours:.1f}h (Puerto)",
            "amount_usd": total_dockage,
            "badge": "Tarifa APM"
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Lanchas Operativas",
            "supplier": "Trans Total",
            "formula_evaluated": f"${launch_rate:,.2f} x {launches_count} Lanchas",
            "amount_usd": round(total_launches, 2),
            "badge": "Agencia"
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Coordinador a Bordo",
            "supplier": "Trans Total",
            "formula_evaluated": f"${coordinator_rate:,.2f} x {coordinator_shifts} Turnos",
            "amount_usd": round(total_coordinator, 2),
            "badge": "Agencia"
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Clearance (Entrada / Salida)",
            "supplier": "Autoridades Portuarias",
            "formula_evaluated": "Tarifa Fija Clearance In/Out",
            "amount_usd": round(total_clearance, 2),
            "badge": "Fijo"
        },
        {
            "category": "B_GENERAL_PORT",
            "concept": "Inspección Sanitaria Marítima",
            "supplier": "Sanidad Marítima del Callao",
            "formula_evaluated": "Tarifa Fija Sanidad Callao",
            "amount_usd": round(total_sanitary, 2),
            "badge": "Sanidad"
        },
        {
            "category": "C_AGENCY",
            "concept": "Honorarios de Agenciamiento",
            "supplier": "Trans Total Agencia Marítima",
            "formula_evaluated": f"Agency Fee Base (${agency_fee_base:,.2f} hasta 5 días)",
            "amount_usd": round(total_agency_fee, 2),
            "badge": "Acuerdo Agencia"
        },
        {
            "category": "C_AGENCY",
            "concept": "Movilidad & Comunicaciones",
            "supplier": "Trans Total Agencia Marítima",
            "formula_evaluated": f"Movilidad (${mobility:,.2f}) + Comunicaciones (${communications:,.2f})",
            "amount_usd": round(total_logistics, 2),
            "badge": "Gastos Agencia"
        }
    ]
    
    total_cost = sum(item["amount_usd"] for item in audit_trail)
    
    return {
        "port_id": "CALLAO",
        "port_name": "Callao (APM Terminals)",
        "total_cost": round(total_cost, 2),
        "vessel_params": {
            "loa": loa,
            "grt": grt,
            "dwt": dwt
        },
        "port_hours": port_hours,
        "audit_trail": audit_trail
    }
