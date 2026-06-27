import re

filepath = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\InteractiveChart.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state
state_search = "const [secondaryMetric, setSecondaryMetric] = useState<PlotMetric>('none');"
state_replace = "const [secondaryMetric, setSecondaryMetric] = useState<PlotMetric>('none');\n    const [isSecondaryCumulative, setIsSecondaryCumulative] = useState<boolean>(false);"
content = content.replace(state_search, state_replace)

# 2. Add to dependencies
dep_search = "primaryMetric, secondaryMetric, plotMode]"
dep_replace = "primaryMetric, secondaryMetric, isSecondaryCumulative, plotMode]"
content = content.replace(dep_search, dep_replace)

# 3. Update secData logic
old_sec_logic = """
        // 2. Build Secondary Series
        if (secondaryMetric !== 'none') {
            const secData = xAxisData.map(m => revenueMap['__secondary__']?.[m] || 0);
            series.push({
                name: getMetricLabel(secondaryMetric),
"""

new_sec_logic = """
        // 2. Build Secondary Series
        if (secondaryMetric !== 'none') {
            let runningTotal = 0;
            const secData = xAxisData.map(m => {
                const val = revenueMap['__secondary__']?.[m] || 0;
                runningTotal += val;
                return isSecondaryCumulative ? runningTotal : val;
            });
            series.push({
                name: getMetricLabel(secondaryMetric) + (isSecondaryCumulative ? ' (Acum)' : ''),
"""
content = content.replace(old_sec_logic, new_sec_logic.strip())

# 4. Update Y axis name for cumulative
old_yAxis = "name: secondaryMetric === 'none' ? '' : getMetricLabel(secondaryMetric) + (secondaryMetric === 'total_cargo' ? ' (MT)' : ' (USD)'),"
new_yAxis = "name: secondaryMetric === 'none' ? '' : getMetricLabel(secondaryMetric) + (isSecondaryCumulative ? ' Acum' : '') + (secondaryMetric === 'total_cargo' ? ' (MT)' : ' (USD)'),"
content = content.replace(old_yAxis, new_yAxis)

# 5. Add UI checkbox
old_ui = """
                    </select>
                </div>

                <div className="h-px w-full bg-slate-300 my-1"></div>
"""

new_ui = """
                    </select>
                    <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="w-3 h-3 accent-amber-500" 
                            checked={isSecondaryCumulative} 
                            onChange={(e) => setIsSecondaryCumulative(e.target.checked)} 
                        />
                        <span className="text-[10px] font-medium text-amber-700">Acumular en el tiempo</span>
                    </label>
                </div>

                <div className="h-px w-full bg-slate-300 my-1"></div>
"""
content = content.replace(old_ui, new_ui.strip() + "\n")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("InteractiveChart.tsx updated for cumulative.")
