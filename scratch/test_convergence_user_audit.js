// Test de Convergencia Matemática contra Rutas Auditadas por el Usuario
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vvdgswbkwugqjlnzdrka.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2ZGdzd2Jrd3VncWpsbnpkcmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNDcyMjgsImV4cCI6MjA1NzYyMzIyOH0.Vn08E_L1Ew4pT2-J5fT3b-yGv7D4f2n_8t4m9v_1x2k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runConvergenceAudit() {
    console.log("================================================================================");
    console.log("🕵️‍♂️ BENOIT BLANC QC: TEST DE CONVERGENCIA CONTRA RUTAS AUDITADAS POR EL USUARIO");
    console.log("================================================================================\n");

    const { data: routes, error } = await supabase.table('routes_quotes').select('*');
    if (error || !routes) {
        console.error("Error al consultar Supabase:", error);
        return;
    }

    console.log(`Total rutas encontradas en routes_quotes: ${routes.length}\n`);

    let passedTests = 0;
    let totalTests = 0;

    for (const r of routes) {
        const name = r.name;
        const ld = typeof r.legs_data === 'string' ? JSON.parse(r.legs_data) : (r.legs_data || {});
        const fs = ld.financial_summary;

        if (!fs) continue;

        totalTests++;

        const tramos = ld.tramos || [];
        const puertosConfig = ld.puertosConfig || [];
        const vparams = ld.vesselParams || {};

        // Verificación 1: Suma vertical de Búnker de Tramos === grandBunkerTotal
        const calcTramos = fs.calculatedTramos || [];
        const sumLegsBunker = calcTramos.reduce((s, t) => s + (Number(t.bunker_cost) || 0), 0);
        const diffBunker = Math.abs(sumLegsBunker - Number(fs.grandBunkerTotal || 0));

        // Verificación 2: Suma vertical de Flete de Tramos === totalFreight
        const sumLegsFreight = calcTramos.reduce((s, t) => s + (Number(t.freight_revenue) || 0), 0);
        const diffFreight = Math.abs(sumLegsFreight - Number(fs.totalFreight || 0));

        // Verificación 3: Gross Revenue === Freight + Refacturación Muellaje
        const expectedGross = Number(fs.totalFreight || 0) + Number(fs.refacturacionMuellaje || 0);
        const diffGross = Math.abs(expectedGross - Number(fs.grossRevenueTotal || 0));

        // Verificación 4: P&L = Gross Revenue - Hire - Bunker - Port Costs - Comm
        const expectedPnl = Number(fs.grossRevenueTotal || 0) - (Number(fs.hireUsd || 0) + Number(fs.grandBunkerTotal || 0) + Number(fs.totalPortCosts || 0) + Number(fs.totalCommUsd || 0));
        const diffPnl = Math.abs(expectedPnl - Number(fs.voyageResultPnl || 0));

        const isExact = diffBunker < 0.5 && diffFreight < 0.5 && diffGross < 0.5 && diffPnl < 0.5;

        if (isExact) {
            passedTests++;
            console.log(`[PASS ✓] ${name}`);
            console.log(`         Gross: $${Number(fs.grossRevenueTotal).toLocaleString()} | Bunker: $${Number(fs.grandBunkerTotal).toLocaleString()} | P&L: $${Number(fs.voyageResultPnl).toLocaleString()} | TCE: $${Number(fs.tceRealizado).toLocaleString()}/d`);
        } else {
            console.log(`[FAIL ✗] ${name}`);
            console.log(`         Diff Bunker: ${diffBunker} | Diff Freight: ${diffFreight} | Diff PnL: ${diffPnl}`);
        }
    }

    console.log("\n================================================================================");
    console.log(`🎯 RESULTADO FINAL DE CONVERGENCIA: ${passedTests} / ${totalTests} RUTAS AUDITADAS CONVERGEN AL 100%`);
    console.log("================================================================================\n");
}

runConvergenceAudit();
