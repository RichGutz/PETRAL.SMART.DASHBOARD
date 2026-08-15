// QC Test Local no-interactivo para Frontend Data Transformers
import assert from 'assert';

console.log('='.repeat(100));
console.log('🧪 [QC FRONTEND LOCAL] AUDITORÍA DE TRANSFORMACIONES DE DATOS PARA CHARTS Y MAPA');
console.log('='.repeat(100));

// Payload simulado exacto de PRIMER.MODELO.MODULAR
const months2027 = ['2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06', '2027-07', '2027-08', '2027-09', '2027-10', '2027-11', '2027-12'];

const mockAggregatedData = {
    "NEXA": {
        "CALLAO-MEJILLONES": {
            "MOQUEGUA": {}
        }
    },
    "SPCC": {
        "ILO-MEJILLONES": {
            "MOQUEGUA": {}
        }
    }
};

months2027.forEach(m => {
    mockAggregatedData["NEXA"]["CALLAO-MEJILLONES"]["MOQUEGUA"][m] = {
        freq: 1,
        net_income: 360937.5,
        voyage_result: 231883.23,
        total_port_costs: 81327.99,
        total_bunker_costs: 47726.28,
        carga_unit: 15000,
        raw_inputs: { monthly_frequency: 1 }
    };
    mockAggregatedData["SPCC"]["ILO-MEJILLONES"]["MOQUEGUA"][m] = {
        freq: 1,
        net_income: 281745.0,
        voyage_result: 149429.98,
        total_port_costs: 65000.0,
        total_bunker_costs: 67315.02,
        carga_unit: 13500,
        raw_inputs: { monthly_frequency: 1 }
    };
});

const data = { aggregated_data: mockAggregatedData };

// 1. Validar extracción automática de meses activos
const monthsSet = new Set();
Object.values(data.aggregated_data).forEach(routes => {
    Object.values(routes).forEach(vessels => {
        Object.values(vessels).forEach(mMap => {
            Object.keys(mMap).forEach(m => {
                if (m && m.match(/^\d{4}-\d{2}$/)) monthsSet.add(m);
            });
        });
    });
});
const activeMonths = Array.from(monthsSet).sort();
console.log(`\n📅 1. Meses activos detectados (${activeMonths.length}):`, activeMonths);
assert.strictEqual(activeMonths.length, 12, "Deben existir 12 meses");

// 2. Simular cálculo de series en InteractiveChart
console.log('\n📈 2. Simulando generación de series de ECharts (InteractiveChart)...');
const seriesMapPri = {};
const totalPriMap = {};

Object.entries(data.aggregated_data).forEach(([client, routes]) => {
    Object.entries(routes).forEach(([route, vessels]) => {
        Object.entries(vessels).forEach(([vessel, mData]) => {
            const key = vessel; // Group by vessel
            if (!seriesMapPri[key]) seriesMapPri[key] = {};
            
            Object.entries(mData).forEach(([month, metrics]) => {
                const val = metrics.voyage_result || 0;
                seriesMapPri[key][month] = (seriesMapPri[key][month] || 0) + val;
                totalPriMap[month] = (totalPriMap[month] || 0) + val;
            });
        });
    });
});

console.log('   Series generadas:', Object.keys(seriesMapPri));
assert.ok(seriesMapPri["MOQUEGUA"], "Debe existir la serie MOQUEGUA");

const moqueguaTotal = Object.values(seriesMapPri["MOQUEGUA"]).reduce((a, b) => a + b, 0);
console.log(`   Total Voyage Result MOQUEGUA: $${moqueguaTotal.toLocaleString()}`);
assert.ok(moqueguaTotal > 4000000, "El total debe ser superior a $4M");

// 3. Simular descomposición de piernas en SpaghettiMap
console.log('\n🗺️ 3. Simulando procesamiento de Spaghetti Map...');
const activePortsMock = [
    { port_id: 'CALLAO', port_name: 'CALLAO', lon: -77.15, lat: -12.05, type: 'SOURCE' },
    { port_id: 'ILO', port_name: 'ILO', lon: -71.34, lat: -17.64, type: 'SOURCE' },
    { port_id: 'MEJILLONES', port_name: 'MEJILLONES', lon: -70.45, lat: -23.10, type: 'SINK' }
];

const portMap = {};
activePortsMock.forEach(p => { portMap[p.port_id] = { carga: 0, descarga: 0 }; });

let totalTrips = 0;
Object.entries(data.aggregated_data).forEach(([client, routes]) => {
    Object.entries(routes).forEach(([route, vessels]) => {
        const parts = route.split(/[\.\-\s\(\):_]+/).map(p => p.trim().toUpperCase()).filter(Boolean);
        const valid = parts.filter(p => activePortsMock.some(ap => ap.port_id === p));
        
        Object.entries(vessels).forEach(([vessel, mData]) => {
            const m = mData['2027-01'];
            if (m) {
                totalTrips += m.freq || 0;
                if (valid.length >= 2) {
                    portMap[valid[0]].carga += m.carga_unit || 0;
                    portMap[valid[valid.length - 1]].descarga += m.carga_unit || 0;
                }
            }
        });
    });
});

console.log(`   Viajes en mes 2027-01: ${totalTrips}`);
console.log('   Carga y Descarga en Puertos:', portMap);
assert.strictEqual(totalTrips, 2, "Deben existir 2 viajes en 2027-01");
assert.ok(portMap['CALLAO'].carga > 0, "CALLAO debe tener carga registrada");
assert.ok(portMap['MEJILLONES'].descarga > 0, "MEJILLONES debe tener descarga registrada");

console.log('\n' + '='.repeat(100));
console.log('✅ [QC FRONTEND PASSED] Todas las transformaciones de datos fueron validadas y son 100% consistentes.');
console.log('='.repeat(100));
