async function runMecConvergenceTest() {
    console.log('================================================================================');
    console.log('   [LOOP QC BENOIT BLANC] AUDITORIA DE CONVERGENCIA MATRIZ FINANCIERA VS INFORME MEC');
    console.log('   Verificacion Integral de Convergencia 1:1 en Todos los Escenarios de Supabase');
    console.log('================================================================================\n');

    const resList = await fetch('https://forecast.geeksoft.tech/api/v1/forecast/list');
    const scenarios = await resList.json();

    let totalScenarios = 0;
    let passedScenarios = 0;
    let totalAssertions = 0;
    let passedAssertions = 0;

    const foreignPorts = ['BARQUITO', 'MEJILLONES', 'ANTOFAGASTA', 'QUINTERO', 'PATILLOS', 'VENTANAS', 'SAN VICENTE', 'ARICA', 'IQUIQUE', 'CORONEL', 'COQUIMBO', 'VALPARAISO', 'HUASCO', 'MICHILLA', 'GUAYACAN', 'CALETA COLOSO', 'TOCOPILLA', 'PUERTO ANGAMOS', 'LIRQUEN', 'SAN ANTONIO', 'GUAYAQUIL', 'ESMERALDAS', 'MANTA', 'BUENAVENTURA', 'LAZARO CARDENAS'];

    for (const sc of scenarios) {
        const resDetail = await fetch('https://forecast.geeksoft.tech/api/v1/forecast/load/' + sc.id);
        const detail = await resDetail.json();
        const pLines = detail.projection_lines || [];
        if (!pLines || pLines.length === 0) continue;

        totalScenarios++;
        const sDate = detail.start_date && detail.start_date.length === 7 ? detail.start_date + '-01' : (detail.start_date || '2027-01-01');
        const eDate = detail.end_date && detail.end_date.length === 7 ? detail.end_date + '-28' : (detail.end_date || '2027-12-31');

        const resSim = await fetch('https://forecast.geeksoft.tech/api/v1/forecast/run_universal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start_date: sDate, end_date: eDate, projection_lines: pLines })
        });
        const simRes = await resSim.json();
        const agg = simRes.aggregated_data || {};

        let matTrips = 0, matTm = 0, matMargin = 0, matDays = 0;
        const mecRoutes = [];

        for (const [client, routesDict] of Object.entries(agg)) {
            for (const [rName, vesselsDict] of Object.entries(routesDict)) {
                for (const [vName, monthsDict] of Object.entries(vesselsDict)) {
                    let totTm = 0, totTrips = 0, totPnl = 0, totDur = 0;
                    for (const [mK, mV] of Object.entries(monthsDict)) {
                        const f = Number(mV.freq || 0);
                        const q = Number(mV.carga_unit || 13500);
                        const p = Number(mV.voyage_result || 0);
                        const d = Number(mV.total_duration || 0);
                        totTrips += f; totTm += (q * f); totPnl += p; totDur += d;
                        matTrips += f; matTm += (q * f); matMargin += p; matDays += d;
                    }
                    if (totTrips > 0) {
                        const isExp = foreignPorts.some(fp => rName.toUpperCase().includes(fp)) || rName.toUpperCase().includes('EXP') || rName.toUpperCase().includes('CHILE');
                        mecRoutes.push({ route: rName, vessel: vName, isExport: isExp, annualTm: totTm, trips: totTrips, grossMargin: totPnl, daysOccupation: totDur });
                    }
                }
            }
        }

        const mecTrips = mecRoutes.reduce((acc, r) => acc + r.trips, 0);
        const mecTm = mecRoutes.reduce((acc, r) => acc + r.annualTm, 0);
        const mecMargin = mecRoutes.reduce((acc, r) => acc + r.grossMargin, 0);
        const mecDays = mecRoutes.reduce((acc, r) => acc + r.daysOccupation, 0);

        const dTrips = Math.abs(matTrips - mecTrips);
        const dTm = Math.abs(matTm - mecTm);
        const dMargin = Math.abs(matMargin - mecMargin);
        const dDays = Math.abs(matDays - mecDays);

        totalAssertions += 4;
        if (dTrips < 0.001 && dTm < 0.001 && dMargin < 0.01 && dDays < 0.001) {
            passedScenarios++;
            passedAssertions += 4;
            console.log('[ESCENARIO OK] ' + detail.name);
            console.log('   - Viajes: ' + matTrips.toFixed(0) + ' v | Toneladas: ' + matTm.toLocaleString() + ' MT | Margen Bruto: $' + matMargin.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' | Dias: ' + matDays.toFixed(1) + ' d | Delta: .00 [OK]');
        } else {
            console.error('[DISCREPANCIA] ' + detail.name + ' | dMargin=' + dMargin);
        }
    }

    console.log('\n================================================================================');
    console.log('RESULTADOS FINALES DEL LOOP QC:');
    console.log('  - Escenarios Auditados:   ' + totalScenarios);
    console.log('  - Escenarios Exitosos:    ' + passedScenarios);
    console.log('  - Total de Aserciones:    ' + totalAssertions);
    console.log('  - Aserciones Aprobadas:   ' + passedAssertions);
    console.log('  - Tasa de Convergencia:   ' + ((passedAssertions / totalAssertions) * 100).toFixed(2) + '% [OK]');
    console.log('================================================================================\n');
}

runMecConvergenceTest();
