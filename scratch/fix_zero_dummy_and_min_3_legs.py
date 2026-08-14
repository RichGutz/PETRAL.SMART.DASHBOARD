import os

path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update vesselParams initial state to zero dummy values
old_vessel_params = """    const [vesselParams, setVesselParams] = useState<any>({
        grt: 0, dwt: 0, dwcc: 0, vessel_speed: 11.0, tce_required: 15000,
        length: 0, beam: 0, draft_m: 0,
        consumption_sea_ifo: 0, consumption_idle_ifo: 0, consumption_load_ifo: 0, consumption_disch_ifo: 0,
        consumption_sea_mdo: 0, consumption_idle_mdo: 0, consumption_load_mdo: 0, consumption_disch_mdo: 0
    });"""

new_vessel_params = """    const [vesselParams, setVesselParams] = useState<any>({
        grt: 0, dwt: 0, dwcc: 0, vessel_speed: 0, tce_required: 0,
        length: 0, beam: 0, draft_m: 0,
        consumption_sea_ifo: 0, consumption_idle_ifo: 0, consumption_load_ifo: 0, consumption_disch_ifo: 0,
        consumption_sea_mdo: 0, consumption_idle_mdo: 0, consumption_load_mdo: 0, consumption_disch_mdo: 0
    });"""

code = code.replace(old_vessel_params, new_vessel_params)

# 2. Update initial tramos state to 3 legs minimum and puertosConfig to 4 ports
old_tramos_init = """    const [tramos, setTramos] = useState<TramoState[]>([
        { type: 'LADEN', origin_port_id: '', destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 11.0 }
    ]);
    const [puertosConfig, setPuertosConfig] = useState<PuertoConfig[]>([
        { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' },
        { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' }
    ]);"""

new_tramos_init = """    const [tramos, setTramos] = useState<TramoState[]>([
        { type: 'BALLAST', origin_port_id: '', destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 },
        { type: 'LADEN', origin_port_id: '', destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 },
        { type: 'BALLAST', origin_port_id: '', destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 }
    ]);
    const [puertosConfig, setPuertosConfig] = useState<PuertoConfig[]>([
        { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' },
        { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' },
        { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' },
        { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' }
    ]);"""

code = code.replace(old_tramos_init, new_tramos_init)

# 3. Enforce minimum 3 legs in handleRemoveLastTramo
old_remove = "if (tramos.length <= 1) return;"
new_remove = "if (tramos.length <= 3) return; // Mínimo 3 piernas obligatorias"

code = code.replace(old_remove, new_remove)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("ZERO DUMMY DATA AND MINIMUM 3 LEGS APPLIED SUCCESSFULLY!")
