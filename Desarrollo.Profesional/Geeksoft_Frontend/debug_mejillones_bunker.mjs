import fs from 'fs';
import { MulticotizadorCalculationEngine } from './src/services/providers/multicotizadorCalculationEngine.ts';

if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} };
}

const quotes = JSON.parse(fs.readFileSync('C:/Users/rguti/PETRAL.SMART.DASHBOARD/scratch/all_quotes.json', 'utf-8'));
const q = quotes.find(x => x.name.includes('SPCC.ILO.MEJILLONES.ILO.2025-2027 COA MOQUEGUA'));

const legs_data = q.legs_data;
const calc = MulticotizadorCalculationEngine.calculateVoyage({
    tramos: legs_data.tramos,
    puertosConfig: legs_data.puertosConfig,
    vesselParams: legs_data.vesselParams,
    bunkerPriceIfo: Number(legs_data.bunker_price_ifo),
    bunkerPriceMdo: Number(legs_data.bunker_price_mdo),
    addressCommPct: 0,
    brokerCommPct: 0,
    demurrageRate: 20000,
    refacturarMuellajeMap: legs_data.refacturarMuellajeMap,
    demurrageMode: 'C'
});

console.log("=== DESGLOSE MULTICOTIZADOR ENGINE ACTUAL ===");
console.log("Grand Bunker Total:", calc.grandBunkerTotal);
console.log("Total IFO Tons:", calc.totalIfoTons, "vs Foto:", legs_data.financial_summary.totalIfoTons);
console.log("Total MDO Tons:", calc.totalMdoTons, "vs Foto:", legs_data.financial_summary.totalMdoTons);
console.log("Total Sea Days:", calc.totalSeaDays, "vs Foto:", legs_data.financial_summary.totalSeaDays);
console.log("Total Port Days:", calc.totalPortDays, "vs Foto:", legs_data.financial_summary.totalPortDays);
console.log("Total Days:", calc.totalDays, "vs Foto:", legs_data.financial_summary.totalDays);
console.log("PortDays0:", calc.portDays0);
console.log("Calculated Tramos:", JSON.stringify(calc.calculatedTramos, null, 2));
