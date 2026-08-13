path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update selectedVessel initial state
code = code.replace("const [selectedVessel, setSelectedVessel] = useState('');", "const [selectedVessel, setSelectedVessel] = useState('MOQUEGUA');")

# 2. Update bunkerPrice initial state
code = code.replace("const [bunkerPriceIfo, setBunkerPriceIfo] = useState<number>(0.0);", "const [bunkerPriceIfo, setBunkerPriceIfo] = useState<number>(967.26);")
code = code.replace("const [bunkerPriceMdo, setBunkerPriceMdo] = useState<number>(0.0);", "const [bunkerPriceMdo, setBunkerPriceMdo] = useState<number>(1528.26);")

# 3. Update vesselParams initial state
old_vparams = """    const [vesselParams, setVesselParams] = useState<any>({
        vessel_id: '',
        vessel_name: '',
        grt: '',
        dwt: '',
        dwcc: '',
        vessel_speed: '',
        tce_required: '',
        length: '',
        beam: '',
        draft_m: '',
        consumption_sea_ifo: '',
        consumption_idle_ifo: '',
        consumption_load_ifo: '',
        consumption_disch_ifo: '',
        consumption_sea_mdo: '',
        consumption_idle_mdo: '',
        consumption_load_mdo: '',
        consumption_disch_mdo: ''
    });"""

new_vparams = """    const [vesselParams, setVesselParams] = useState<any>({
        vessel_id: 'MOQUEGUA',
        vessel_name: 'B/T MOQUEGUA',
        grt: 11365,
        dwt: 16533,
        dwcc: 13500,
        vessel_speed: 11.0,
        tce_required: 15000,
        length: 159,
        beam: 23,
        draft_m: '8.2',
        consumption_sea_ifo: 14.5,
        consumption_idle_ifo: 3.5,
        consumption_load_ifo: 3.5,
        consumption_disch_ifo: 5.0,
        consumption_sea_mdo: 0.1,
        consumption_idle_mdo: 0.1,
        consumption_load_mdo: 0.1,
        consumption_disch_mdo: 0.1,
        act_load: 500,
        act_disch: 350
    });"""

code = code.replace(old_vparams, new_vparams)

# 4. Update tramos initial state
old_tramos = """    const [tramos, setTramos] = useState<TramoState[]>([
        {
            type: 'LADEN',
            origin_port_id: '',
            destination_port_id: '',
            quantity: '',
            freight_rate: '',
            port_delay_hours_loading: 0,
            port_delay_hours_discharging: 0,
            route_distance: '',
            weather_factor: '',
            speed: ''
        },
        {
            type: 'BALLAST',
            origin_port_id: '',
            destination_port_id: '',
            quantity: '',
            freight_rate: '',
            port_delay_hours_loading: 0,
            port_delay_hours_discharging: 0,
            route_distance: '',
            weather_factor: '',
            speed: ''
        }
    ]);"""

new_tramos = """    const [tramos, setTramos] = useState<TramoState[]>([
        {
            type: 'LADEN',
            origin_port_id: 'MATARANI',
            destination_port_id: 'MEJILLONES',
            quantity: 13500,
            freight_rate: 30,
            port_delay_hours_loading: 0,
            port_delay_hours_discharging: 0,
            route_distance: 334,
            weather_factor: 3.0,
            speed: 11.0
        },
        {
            type: 'BALLAST',
            origin_port_id: 'MEJILLONES',
            destination_port_id: 'ILO',
            quantity: 0,
            freight_rate: 0,
            port_delay_hours_loading: 0,
            port_delay_hours_discharging: 0,
            route_distance: 250,
            weather_factor: 3.0,
            speed: 11.0
        }
    ]);"""

code = code.replace(old_tramos, new_tramos)

# 5. Update puertosConfig initial state
old_pconfig = """    const [puertosConfig, setPuertosConfig] = useState<PuertoConfig[]>([
        { action: 'NONE', quantity: '', freight_rate: '', op_rate: '', rate_unit: 'TH', overhead: '', positioning: '', manual_port_cost: '' },       // Puerto 0 (A)
        { action: 'NONE', quantity: '', freight_rate: '', op_rate: '', rate_unit: 'TH', overhead: '', positioning: '', manual_port_cost: '' },        // Puerto 1 (B)
        { action: 'NONE', quantity: '', freight_rate: '', op_rate: '', rate_unit: 'TH', overhead: '', positioning: '', manual_port_cost: '' }         // Puerto 2 (C)
    ]);"""

new_pconfig = """    const [puertosConfig, setPuertosConfig] = useState<PuertoConfig[]>([
        { action: 'CARGAR', quantity: 13500, freight_rate: 0, op_rate: 500, rate_unit: 'TH', overhead: 6, positioning: 0, manual_port_cost: '' },
        { action: 'DESCARGAR', quantity: 13500, freight_rate: 30, op_rate: 350, rate_unit: 'TH', overhead: 6, positioning: 0, manual_port_cost: 67833, muellaje_cost: 33333 },
        { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', overhead: 0, positioning: 0, manual_port_cost: '' }
    ]);"""

code = code.replace(old_pconfig, new_pconfig)

# 6. Update refacturarMuellajeMap initial state
code = code.replace("const [refacturarMuellajeMap, setRefacturarMuellajeMap] = useState<Record<number, boolean>>({});", "const [refacturarMuellajeMap, setRefacturarMuellajeMap] = useState<Record<number, boolean>>({ 1: true });")

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("RICH DUMMY INITIAL STATE APPLIED SUCCESSFULLY!")
