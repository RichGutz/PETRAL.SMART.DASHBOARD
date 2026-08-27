import fs from 'fs';
import path from 'path';
import { MulticotizadorCalculationEngine } from './src/services/providers/multicotizadorCalculationEngine.ts';

// Mock localStorage para evitar errores en Node.js
if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
    };
}

const quotesPath = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/scratch/all_quotes.json';
const quotes = JSON.parse(fs.readFileSync(quotesPath, 'utf-8'));

console.log("=".repeat(130));
console.log(`🕵️ [QC TS ENGINE DIRECTO] EVALUANDO ${quotes.length} RUTAS: MULTICOTIZADOR CALCULATION ENGINE VS FOTO`);
console.log("=".repeat(130));

let discrepancies = 0;

for (let i = 0; i < quotes.length; i++) {
    const q = quotes[i];
    const legs_data = q.legs_data || {};
    const tramos = legs_data.tramos || [];
    const puertosConfig = legs_data.puertosConfig || [];
    const vesselParams = legs_data.vesselParams || {};
    const bunkerPriceIfo = Number(legs_data.bunker_price_ifo || legs_data.bunkerPriceIfo || 0);
    const bunkerPriceMdo = Number(legs_data.bunker_price_mdo || legs_data.bunkerPriceMdo || 0);
    const addressCommPct = Number(legs_data.address_comm_pct || legs_data.addressCommPct || 0);
    const brokerCommPct = Number(legs_data.broker_comm_pct || legs_data.brokerCommPct || 0);
    const refacturarMuellajeMap = legs_data.refacturarMuellajeMap || {};
    const charterHireCost = Number(legs_data.charter_hire_cost || legs_data.charterHireCost || 0);
    const demurrageMode = legs_data.demurrage_mode || legs_data.demurrageMode || 'C';
    const fin_summary = legs_data.financial_summary || {};

    if (!tramos || tramos.length === 0) continue;

    // Ejecutar MulticotizadorCalculationEngine con demurrageMode correcto
    const calc = MulticotizadorCalculationEngine.calculateVoyage({
        tramos,
        puertosConfig,
        vesselParams,
        bunkerPriceIfo,
        bunkerPriceMdo,
        addressCommPct,
        brokerCommPct,
        demurrageRate: Number(vesselParams?.demurrage_rate || 20000),
        refacturarMuellajeMap,
        charterHireCost,
        demurrageMode
    });

    const bunkerEngine = calc.grandBunkerTotal;
    const bunkerFoto = fin_summary.grandBunkerTotal;
    const pnlEngine = calc.voyageResultPnl;
    const pnlFoto = fin_summary.voyageResultPnl;

    const deltaBunker = bunkerFoto !== undefined ? Math.abs(bunkerEngine - bunkerFoto) : 0;
    const deltaPnl = pnlFoto !== undefined ? Math.abs(pnlEngine - pnlFoto) : 0;

    const status = (deltaBunker < 0.5 && deltaPnl < 0.5) ? "✅ 100% OK" : `🚨 DELTA: Bunker=$${deltaBunker.toFixed(2)} | PnL=$${deltaPnl.toFixed(2)}`;

    if (deltaBunker >= 0.5 || deltaPnl >= 0.5) {
        discrepancies++;
    }

    console.log(`[${(i + 1).toString().padStart(2, '0')}] ${q.name.substring(0, 46).padEnd(46)} | Bunker Engine: $${bunkerEngine.toFixed(2).padStart(9)} | Bunker Foto: $${(bunkerFoto || 0).toFixed(2).padStart(9)} | ${status}`);
}

console.log("=".repeat(130));
console.log(`🏁 FIN DEL QC TS ENGINE: ${discrepancies} discrepancias encontradas de ${quotes.length} rutas.`);
console.log("=".repeat(130));
