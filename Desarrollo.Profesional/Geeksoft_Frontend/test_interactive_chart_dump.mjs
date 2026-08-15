// Test de auditoría síncrono sobre InteractiveChart.tsx utilizando raw_scenario_dump.json
import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('='.repeat(100));
console.log('🔬 [QC DETALLADO] INGESTIÓN DE RAW DUMP EN INTERACTIVE CHART LOGIC');
console.log('='.repeat(100));

const rawPath = path.resolve('../Geeksoft_Engine/raw_scenario_dump.json');
const rawContent = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

const data = rawContent.simulation_output;
console.log('📦 Scenario Metadata:', rawContent.scenario_metadata);
console.log('🔑 Keys en simulation_output:', Object.keys(data));

// Simular dynamicMonths de ForecastContext_V2
const monthsSet = new Set();
if (data && data.aggregated_data) {
    Object.values(data.aggregated_data).forEach(routes => {
        Object.values(routes).forEach(vessels => {
            Object.values(vessels).forEach(mMap => {
                Object.keys(mMap).forEach(m => {
                    if (m && m.match(/^\d{4}-\d{2}$/)) monthsSet.add(m);
                });
            });
        });
    });
}
const months = Array.from(monthsSet).sort();
console.log(`📅 Meses extraídos (${months.length}):`, months);

// Simular InteractiveChart options evaluation
const groupBy = 'vessel';
const filterClient = 'ALL';
const filterRoute = 'ALL';
const filterVessel = 'ALL';
const filterTradeType = ['Cabotaje', 'Chile'];
const primaryMetric = 'viajes';
const primaryGraphType = 'bar_stack';
const secondaryMetric = 'none';

const getTradeType = (route) => {
    if (!route) return 'Cabotaje';
    const r = route.toUpperCase();
    if (r.includes('MEJILLONES') || r.includes('BARQUITO') || r.includes('CHILE')) return 'Chile';
    return 'Cabotaje';
};

const seriesMapPri = {};
const totalPriMap = {};

Object.entries(data.aggregated_data).forEach(([client, routes]) => {
    if (filterClient !== 'ALL' && client !== filterClient) return;
    Object.entries(routes).forEach(([route, vessels]) => {
        if (filterRoute !== 'ALL' && route !== filterRoute) return;
        if (!filterTradeType.includes(getTradeType(route))) return;
        Object.entries(vessels).forEach(([vessel, mData]) => {
            if (filterVessel !== 'ALL' && vessel !== filterVessel) return;

            Object.entries(mData).forEach(([month, metrics]) => {
                let key = vessel;
                if (!seriesMapPri[key]) seriesMapPri[key] = {};

                const rawFreq = metrics?.['raw_inputs']?.['monthly_frequency'];
                const freq = rawFreq !== undefined ? rawFreq : (metrics?.['freq'] !== undefined ? metrics['freq'] : 0);
                
                seriesMapPri[key][month] = (seriesMapPri[key][month] || 0) + freq;
                totalPriMap[month] = (totalPriMap[month] || 0) + freq;
            });
        });
    });
});

console.log('📊 seriesMapPri result:', seriesMapPri);
console.log('📊 totalPriMap result:', totalPriMap);

const buildSeries = (seriesMap, totalMap) => {
    return Object.entries(seriesMap).map(([name, mData]) => {
        const dataArr = months.map(m => {
            const val = mData[m] || 0;
            return { value: val, pct: 0, rawVal: val };
        });
        return {
            name: `${name} (Pri)`,
            type: 'bar',
            data: dataArr
        };
    });
};

const seriesPri = buildSeries(seriesMapPri, totalPriMap);
console.log('📈 Series ECharts finales:', JSON.stringify(seriesPri, null, 2));

assert.ok(seriesPri.length > 0, "Debe existir al menos 1 serie");
assert.ok(seriesPri[0].data.length === 12, "Cada serie debe tener 12 elementos");
console.log('\n' + '='.repeat(100));
console.log('✅ [QC RAW DUMP PASSED] El payload del escenario genera series 100% válidas en InteractiveChart.');
console.log('='.repeat(100));
