path1 = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\multicotizador\FinancialResultCards.tsx'
with open(path1, 'r', encoding='utf-8') as f:
    c1 = f.read()

c1 = c1.replace("                                                <tr className=\"bg-slate-50 font-bold text-slate-800 border-t border-slate-200\">\n                                                    <td className=\"py-1.5 pl-1.5 font-sans text-[10.5px] uppercase\">Total Port Costs</td>\n                                                    <td className=\"text-right py-1.5 pr-1.5\">\n                                                        {result || totalPortCosts > 0 ? fmtCur(totalPortCosts) : '$0'}\n                                                    </td>\n                                                </tr>", """                                                <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                                    <td className="py-1.5 pl-1.5 font-sans text-[10.5px] uppercase">Total Port Costs</td>
                                                    <td className="text-right py-1.5 pr-1.5">
                                                        {fmtCur(result?.consolidated?.total_port_costs || 0)}
                                                    </td>
                                                </tr>""")

with open(path1, 'w', encoding='utf-8') as f:
    f.write(c1)

path2 = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\multicotizador\SpreadsheetTramosGrid.tsx'
grid_interface_clean = """import React from 'react';

export interface SpreadsheetTramosGridProps {
    tramos: any[];
    puertosConfig: any[];
    ports: any[];
    vessels: any[];
    selectedVessel: string;
    result: any;
    refacturarMuellajeMap: Record<number, boolean>;
    calculatedTramosList: any[];
    handleAddTramo: () => void;
    handleRemoveLastTramo: () => void;
    updateTramoField: (index: number, field: any, value: any) => void;
    updatePuertoConfigField: (index: number, field: any, value: any) => void;
    setRefacturarMuellajeMap: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
    getAutoPortRate: (portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR') => number | string;
    getAutoPortTimeToCount?: (portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR') => number | string;
    getAutoPortPositioning?: (portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR') => number | string;
    fmtCur: (val: number | string | undefined | null) => string;
    fmtNum: (val: number | string | undefined | null) => string;
    fmtDays: (val: number | string | undefined | null) => string;
    fmtThousandSep: (val: number | string | undefined | null) => string;
}"""

with open(path2, 'r', encoding='utf-8') as f:
    c2 = f.read()

# replace header lines 1 to 24 with clean interface
idx_body = c2.find("export const SpreadsheetTramosGrid")
if idx_body != -1:
    new_c2 = grid_interface_clean + "\n\n" + c2[idx_body:]
    with open(path2, 'w', encoding='utf-8') as f:
        f.write(new_c2)

print("DUPLICATE IDENTIFIERS CLEANED SUCCESSFULLY!")
