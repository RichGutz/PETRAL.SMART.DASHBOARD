import fs from 'fs';
import { MulticotizadorCalculationEngine } from './src/services/providers/multicotizadorCalculationEngine.ts';

// Mock localStorage
if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} };
}

const SUPABASE_URL = "https://hjjxooxcpvlvbaxgifbn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc";

async function backfill() {
    console.log("=".repeat(120));
    console.log(`🚀 [BACKFILL UNIFICADO] SINCRONIZANDO SNAPSHOTS FINANCIEROS EN SUPABASE VIA REST`);
    console.log("=".repeat(120));

    const resp = await fetch(`${SUPABASE_URL}/rest/v1/routes_quotes?select=*`, {
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`
        }
    });

    if (!resp.ok) {
        console.error("Error al obtener routes_quotes:", resp.status, await resp.text());
        return;
    }

    const quotes = await resp.json();
    console.log(`Total rutas recuperadas de Supabase: ${quotes.length}`);

    let count = 0;

    for (const q of quotes) {
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

        if (!tramos || tramos.length === 0) continue;

        // Calcular con el motor TypeScript oficial
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

        legs_data.financial_summary = calc;

        const updateResp = await fetch(`${SUPABASE_URL}/rest/v1/routes_quotes?name=eq.${encodeURIComponent(q.name)}`, {
            method: 'PATCH',
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            body: JSON.stringify({ legs_data })
        });

        if (!updateResp.ok) {
            console.error(`❌ Error actualizando ${q.name}:`, updateResp.status, await updateResp.text());
        } else {
            console.log(`✅ [${(count + 1).toString().padStart(2, '0')}] ${q.name.substring(0, 48).padEnd(48)} | Bunker: $${calc.grandBunkerTotal.toFixed(2).padStart(9)} | P&L: $${calc.voyageResultPnl.toFixed(2).padStart(9)}`);
            count++;
        }
    }

    console.log("=".repeat(120));
    console.log(`🏁 FIN: ${count} de ${quotes.length} rutas sincronizadas y selladas con éxito en Supabase.`);
    console.log("=".repeat(120));
}

backfill();
