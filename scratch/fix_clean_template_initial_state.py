path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace empty arrays with safe empty initial leg template
old_empty_states = """    const [tramos, setTramos] = useState<TramoState[]>([]);
    const [puertosConfig, setPuertosConfig] = useState<PuertoConfig[]>([]);"""

new_clean_template = """    const [tramos, setTramos] = useState<TramoState[]>([
        {
            type: 'LADEN',
            origin_port_id: '',
            destination_port_id: '',
            quantity: 0,
            freight_rate: 0,
            port_delay_hours_loading: 0,
            port_delay_hours_discharging: 0,
            route_distance: 0,
            weather_factor: 3.0,
            speed: 11.0
        }
    ]);
    const [puertosConfig, setPuertosConfig] = useState<PuertoConfig[]>([
        { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', overhead: 0, positioning: 0, manual_port_cost: '' },
        { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', overhead: 0, positioning: 0, manual_port_cost: '' }
    ]);"""

code = code.replace(old_empty_states, new_clean_template)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SAFE CLEAN TEMPLATE INITIAL STATE APPLIED SUCCESSFULLY!")
