import os
import re

filepath = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\InteractiveChart.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Update PlotMetric
content = content.replace(
    "type PlotMetric = 'net_income' | 'total_port_costs' | 'total_bunker_costs' | 'voyage_result' | 'gross_profit_breakdown';",
    "type PlotMetric = 'net_income' | 'total_port_costs' | 'total_bunker_costs' | 'voyage_result' | 'gross_profit_breakdown' | 'total_cargo' | 'none';"
)

# Replace state variables
content = content.replace(
    "const [plotMetric, setPlotMetric] = useState<PlotMetric>('voyage_result');",
    "const [primaryMetric, setPrimaryMetric] = useState<PlotMetric>('voyage_result');\n    const [secondaryMetric, setSecondaryMetric] = useState<PlotMetric>('none');"
)

# Update options dependency array
content = content.replace(
    "[data, groupBy, months, filterClient, filterRoute, filterVessel, plotMetric, plotMode]",
    "[data, groupBy, months, filterClient, filterRoute, filterVessel, primaryMetric, secondaryMetric, plotMode]"
)

# Function to get metric label
metric_label_fn = """
const getMetricLabel = (m: PlotMetric) => {
    switch (m) {
        case 'voyage_result': return 'Voyage Result';
        case 'net_income': return 'Gross Revenue';
        case 'total_port_costs': return 'Port Costs';
        case 'total_bunker_costs': return 'Bunker Costs';
        case 'gross_profit_breakdown': return 'Gross Profit';
        case 'total_cargo': return 'Toneladas';
        case 'none': return '';
        default: return m;
    }
};

const getMetricValue = (metrics: any, m: PlotMetric) => {
    if (m === 'none') return 0;
    if (m === 'total_cargo') {
        const carga_unit = metrics['carga_unit'] || 0;
        const freq = metrics['raw_inputs']?.['monthly_frequency'] || metrics['freq'] || 1;
        return carga_unit * freq;
    }
    return metrics[m] || 0;
};
"""

content = content.replace("const isBreakdown = plotMetric === 'gross_profit_breakdown';", metric_label_fn + "\n        const isBreakdown = primaryMetric === 'gross_profit_breakdown';")

# Extract metrics logic
old_extract = """
                            const result = metrics[plotMetric] || 0;

                            seriesMap[key][month] = (seriesMap[key][month] || 0) + result;
                            revenueMap[key][month] = (revenueMap[key][month] || 0) + revenue;

                            totalMap[month] = (totalMap[month] || 0) + result;
                            totalRevenueMap[month] = (totalRevenueMap[month] || 0) + revenue;
"""

new_extract = """
                            const result = getMetricValue(metrics, primaryMetric);
                            const secResult = getMetricValue(metrics, secondaryMetric);

                            if (!seriesMap[key]) {
                                seriesMap[key] = {};
                                revenueMap[key] = {};
                            }

                            seriesMap[key][month] = (seriesMap[key][month] || 0) + result;
                            revenueMap[key][month] = (revenueMap[key][month] || 0) + revenue;
                            totalMap[month] = (totalMap[month] || 0) + result;
                            totalRevenueMap[month] = (totalRevenueMap[month] || 0) + revenue;

                            // We abuse totalRevenueMap to store secondary values since we need a total for the line graph
                            if (!revenueMap['__secondary__']) revenueMap['__secondary__'] = {};
                            revenueMap['__secondary__'][month] = (revenueMap['__secondary__'][month] || 0) + secResult;
"""
content = content.replace(old_extract, new_extract)

# Update series.push logic for secondary axis
old_cumulative = """
        // 2. Build Cumulative Line Series
        let cumulativeSum = 0;
        let cumulativeRev = 0;
        const cumulativeData = xAxisData.map(m => {
            cumulativeSum += (totalMap[m] || 0);
            cumulativeRev += (totalRevenueMap[m] || 0);
            if (isPct) {
                return cumulativeRev ? (cumulativeSum / cumulativeRev) * 100 : 0;
            }
            return cumulativeSum;
        });

        series.push({
            name: 'Total Acumulado',
            type: 'line',
            yAxisIndex: 1, // Enrutar al segundo eje
            smooth: true,
            symbolSize: 10,
            data: cumulativeData,
            lineStyle: { width: 3, color: '#F59E0B', type: 'dashed' }, // Amber
            itemStyle: { color: '#F59E0B' },
            z: 10 // Dibujar por encima de las barras
        });
"""

new_secondary = """
        // 2. Build Secondary Series
        if (secondaryMetric !== 'none') {
            const secData = xAxisData.map(m => revenueMap['__secondary__']?.[m] || 0);
            series.push({
                name: getMetricLabel(secondaryMetric),
                type: 'line',
                yAxisIndex: 1, // Enrutar al segundo eje
                smooth: true,
                symbolSize: 10,
                data: secData,
                lineStyle: { width: 3, color: '#F59E0B', type: 'solid' }, // Amber
                itemStyle: { color: '#F59E0B' },
                z: 10
            });
        }
"""
content = content.replace(old_cumulative, new_secondary)

# yAxis labels
yAxis_pattern = re.compile(r"yAxis: \[(.+?)\]", re.DOTALL)
new_yAxis = """
yAxis: [
                {
                    type: 'value',
                    name: getMetricLabel(primaryMetric) + (isPct ? ' (%)' : primaryMetric === 'total_cargo' ? ' (MT)' : ' (USD)'),
                    nameTextStyle: { color: '#64748b', padding: [0, 0, 0, -40] },
                    axisLine: { show: false },
                    axisLabel: { color: '#94a3b8', formatter: (v: number) => isPct ? `${v}%` : primaryMetric === 'total_cargo' ? `${(v/1000).toFixed(1)}k` : `$${(v/1000)}k` },
                    splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
                    ...(isPct ? { max: 100 } : {})
                },
                {
                    type: 'value',
                    name: secondaryMetric === 'none' ? '' : getMetricLabel(secondaryMetric) + (secondaryMetric === 'total_cargo' ? ' (MT)' : ' (USD)'),
                    nameTextStyle: { color: '#F59E0B', padding: [0, -40, 0, 0] },
                    axisLine: { show: false },
                    axisLabel: { color: '#F59E0B', fontWeight: 'bold', formatter: (v: number) => secondaryMetric === 'none' ? '' : secondaryMetric === 'total_cargo' ? `${(v/1000).toFixed(1)}k` : `$${(v/1000)}k` },
                    splitLine: { show: false }
                }
            ]
"""
content = re.sub(yAxis_pattern, new_yAxis.strip(), content)

# UI Ribbon Controls
old_ribbon = """
                {/* Selección de Métrica */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Métrica Y:</span>
                    <select 
                        className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-2 focus:outline-none focus:border-petral-teal text-slate-700 font-bold"
                        value={plotMetric}
                        onChange={(e) => setPlotMetric(e.target.value as PlotMetric)}
                    >
                        <option value="voyage_result">Voyage Result</option>
                        <option value="net_income">Gross Revenue</option>
                        <option value="total_port_costs">Port Costs</option>
                        <option value="total_bunker_costs">Bunker Costs</option>
                        <option value="gross_profit_breakdown">Gross Profit (100%)</option>
                    </select>
                </div>
"""

new_ribbon = """
                {/* Selección de Métrica Primaria */}
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Eje Izquierdo (Barras):</span>
                    <select 
                        className="w-full text-[11px] bg-white border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-petral-teal text-slate-700 font-bold"
                        value={primaryMetric}
                        onChange={(e) => setPrimaryMetric(e.target.value as PlotMetric)}
                    >
                        <option value="voyage_result">Voyage Result</option>
                        <option value="net_income">Gross Revenue</option>
                        <option value="total_port_costs">Port Costs</option>
                        <option value="total_bunker_costs">Bunker Costs</option>
                        <option value="gross_profit_breakdown">Gross Profit (Breakdown)</option>
                        <option value="total_cargo">Toneladas (MT)</option>
                    </select>
                </div>

                {/* Selección de Métrica Secundaria */}
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Eje Derecho (Línea):</span>
                    <select 
                        className="w-full text-[11px] bg-amber-50 border border-amber-200 rounded px-2 py-1.5 focus:outline-none focus:border-amber-500 text-amber-700 font-bold"
                        value={secondaryMetric}
                        onChange={(e) => setSecondaryMetric(e.target.value as PlotMetric)}
                    >
                        <option value="none">--- Ninguno ---</option>
                        <option value="voyage_result">Voyage Result</option>
                        <option value="net_income">Gross Revenue</option>
                        <option value="total_cargo">Toneladas (MT)</option>
                    </select>
                </div>
"""
content = content.replace(old_ribbon, new_ribbon)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("InteractiveChart.tsx updated successfully.")
