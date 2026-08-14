path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add PortCostsRatesService import
old_import = "import { ForecastService } from '../../services/api';"
new_import = """import { ForecastService } from '../../services/api';
import { PortCostsRatesService } from '../../services/providers/portCostsRatesService';"""

code = code.replace(old_import, new_import)

# 2. Update PuertoConfig interface to include time_to_count
old_interface = """interface PuertoConfig {
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

new_interface = """interface PuertoConfig {
    action: 'NONE' | 'CARGAR' | 'DESCARGAR';
    quantity: string | number;
    freight_rate: string | number;
    op_rate: string | number; // Ritmo de operación
    rate_unit?: 'TD' | 'TH'; // Unidad de ritmo: TD (Ton/Día), TH (Ton/Hora)
    time_to_count?: string | number;
    overhead?: string | number;
    positioning?: string | number;
    manual_port_cost?: string | number;
    muellaje_cost?: number;
}"""

code = code.replace(old_interface, new_interface)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("IMPORTS AND PUERTO CONFIG INTERFACE UPDATED SUCCESSFULLY!")
