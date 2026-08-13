path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add CHILEAN_PORTS constant at module level
old_puerto_config = """interface PuertoConfig {
    action: 'NONE' | 'CARGAR' | 'DESCARGAR';
    quantity: string | number;
    freight_rate: string | number;
    op_rate: string | number; // Ritmo de operación
    rate_unit?: 'TD' | 'TH'; // Unidad de ritmo: TD (Ton/Día), TH (Ton/Hora)
    overhead?: string | number;
    positioning?: string | number;
    manual_port_cost?: string | number;
    muellaje_cost?: number;
}"""

new_puerto_config = """interface PuertoConfig {
    action: 'NONE' | 'CARGAR' | 'DESCARGAR';
    quantity: string | number;
    freight_rate: string | number;
    op_rate: string | number; // Ritmo de operación
    rate_unit?: 'TD' | 'TH'; // Unidad de ritmo: TD (Ton/Día), TH (Ton/Hora)
    overhead?: string | number;
    positioning?: string | number;
    manual_port_cost?: string | number;
    muellaje_cost?: number;
}

const CHILEAN_PORTS = ['MEJILLONES', 'BARQUITO', 'PATILLOS', 'ARICA', 'SAN ANTONIO', 'VALPARAISO', 'QUINTERO'];"""

code = code.replace(old_puerto_config, new_puerto_config)

# Update Card 3 use of chileanPorts -> CHILEAN_PORTS
code = code.replace("const isChile = chileanPorts.includes((item.port_id || '').toUpperCase());", "const isChile = CHILEAN_PORTS.includes((item.port_id || '').toUpperCase());")

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("CHILEAN PORTS SCOPE FIXED SUCCESSFULLY!")
