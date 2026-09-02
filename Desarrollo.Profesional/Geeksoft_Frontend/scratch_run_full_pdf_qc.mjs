import fs from 'fs';
import { JSDOM } from 'jsdom';

// 1. Cargar datos de simulación
const simData = JSON.parse(fs.readFileSync('./scratch_sim_data.json', 'utf-8'));
const months = ['Ene 2027', 'Feb 2027', 'Mar 2027', 'Abr 2027', 'May 2027', 'Jun 2027', 'Jul 2027', 'Ago 2027', 'Set 2027', 'Oct 2027', 'Nov 2027', 'Dic 2027'];

const dom = new JSDOM('<!DOCTYPE html><html><body><table id="forecast-grid-table"><thead></thead><tbody></tbody></table></body></html>');
const { document } = dom.window;

const thead = document.querySelector('thead');
const tbody = document.querySelector('tbody');

// Header
const hTr = document.createElement('tr');
['Cliente', 'Ruta', 'Buque', 'Métrica', ...months, 'TOTAL ACUM'].forEach((h, idx) => {
    const th = document.createElement('th');
    th.className = idx === 16 ? 'py-1 px-2 border border-sky-800 bg-sky-900 text-sky-100' : 'py-1 px-2 border border-slate-700 bg-slate-800 text-white';
    th.textContent = h;
    hTr.appendChild(th);
});
thead.appendChild(hTr);

// Construir filas para simulación real
const clients = Object.keys(simData.aggregated_data || {});

clients.forEach(client => {
    const routesData = simData.aggregated_data[client];
    Object.keys(routesData).forEach(route => {
        const vesselsData = routesData[route];
        Object.keys(vesselsData).forEach(vessel => {
            const nodeData = vesselsData[vessel];
            const mData = nodeData.months_data || {};
            
            const trips = months.map((_, i) => mData[Object.keys(mData)[i]]?.trips || 0);
            const days = months.map((_, i) => mData[Object.keys(mData)[i]]?.days || 0);
            const tons = months.map((_, i) => mData[Object.keys(mData)[i]]?.tons || 0);
            const netRev = months.map((_, i) => mData[Object.keys(mData)[i]]?.net_revenue || 0);
            const hire = months.map((_, i) => mData[Object.keys(mData)[i]]?.tce_cost_total || 0);
            const bunker = months.map((_, i) => mData[Object.keys(mData)[i]]?.bunker_cost || 0);
            const port = months.map((_, i) => mData[Object.keys(mData)[i]]?.port_cost || 0);
            const margin = months.map((_, i) => mData[Object.keys(mData)[i]]?.voyage_margin || 0);
            const tce = months.map((_, i) => mData[Object.keys(mData)[i]]?.tce || 0);

            const sum = arr => arr.reduce((a, b) => a + b, 0);
            const avg = arr => {
                const act = arr.filter(x => x > 0);
                return act.length > 0 ? sum(act) / act.length : 0;
            };

            const metrics = [
                { name: 'Viajes (freq)', vals: trips, tot: sum(trips) },
                { name: 'Días-Buque', vals: days, tot: sum(days) },
                { name: 'Toneladas', vals: tons, tot: sum(tons) },
                { name: 'Net Revenue', vals: netRev, tot: sum(netRev) },
                { name: '(-) Hire (TCE x días)', vals: hire, tot: sum(hire) },
                { name: '(-) Bunker Costs', vals: bunker, tot: sum(bunker) },
                { name: '(-) Port Costs', vals: port, tot: sum(port) },
                { name: '(=) VOYAGE RESULT / P&L', vals: margin, tot: sum(margin) },
                { name: 'Métricas TCE ($/d)', vals: tce, tot: avg(tce) }
            ];

            metrics.forEach((m, idx) => {
                const tr = document.createElement('tr');
                if (idx === 0) {
                    const td1 = document.createElement('td');
                    td1.setAttribute('rowspan', String(metrics.length));
                    td1.className = client === 'NEXA' ? 'bg-petral-blue text-white' : 'bg-sky-700 text-white';
                    td1.innerHTML = `<div class="vertical-text mx-auto px-2">${client}</div>`;
                    tr.appendChild(td1);

                    const td2 = document.createElement('td');
                    td2.setAttribute('rowspan', String(metrics.length));
                    td2.className = 'bg-purple-500 text-white';
                    td2.innerHTML = `<div class="vertical-text mx-auto px-2">${route}</div>`;
                    tr.appendChild(td2);

                    const td3 = document.createElement('td');
                    td3.setAttribute('rowspan', String(metrics.length));
                    td3.className = 'bg-green-600 text-white';
                    td3.innerHTML = `<div class="vertical-text mx-auto px-2">${vessel}</div><select><option value="${vessel}" selected>${vessel}</option></select>`;
                    tr.appendChild(td3);
                }

                const tdM = document.createElement('td');
                tdM.textContent = m.name;
                tr.appendChild(tdM);

                m.vals.forEach(v => {
                    const tdV = document.createElement('td');
                    tdV.textContent = v > 0 ? (m.name.includes('Viaje') || m.name.includes('Día') ? String(v) : '$' + v.toLocaleString()) : '-';
                    tr.appendChild(tdV);
                });

                const tdTot = document.createElement('td');
                tdTot.textContent = m.tot > 0 ? (m.name.includes('Viaje') || m.name.includes('Día') ? String(m.tot) : '$' + m.tot.toLocaleString()) : '-';
                tr.appendChild(tdTot);

                tbody.appendChild(tr);
            });
        });
    });
});

function createVerticalSvg(text, rowSpan, fill = '#ffffff') {
    const height = Math.max(35, rowSpan * 18);
    const midY = -height / 2;
    return `
    <svg width="24" height="${height}" viewBox="0 0 24 ${height}" style="display: block; margin: 0 auto; overflow: visible;">
        <text x="${midY}" y="15" transform="rotate(-90)" text-anchor="middle" fill="${fill}" font-family="Consolas, 'Courier New', monospace" font-size="8.5" font-weight="bold" letter-spacing="0.5">${text}</text>
    </svg>
    `;
}

// Importar dinámicamente o aplicar la lógica de exportFinancialMatrixPdf.ts
const occupied = [];
const setOccupied = (r, c, rSpan, cSpan) => {
    for (let row = r; row < r + rSpan; row++) {
        if (!occupied[row]) occupied[row] = [];
        for (let col = c; col < c + cSpan; col++) {
            occupied[row][col] = true;
        }
    }
};
const isOccupied = (r, c) => !!(occupied[r] && occupied[r][c]);

let currentRow = 1;
const rawRows = [];
let lastClient = '';
let lastRoute = '';
let lastVessel = '';

document.querySelectorAll('#forecast-grid-table tbody tr').forEach(tr => {
    let currentCol = 1;
    const tds = tr.querySelectorAll('td');
    let rowClient = '';
    let rowRoute = '';
    let rowVessel = '';
    let rowMetric = '';
    const rowValues = [];

    tds.forEach(td => {
        while (isOccupied(currentRow, currentCol)) {
            currentCol++;
        }
        const rSpan = parseInt(td.getAttribute('rowspan') || '1', 10);
        const cSpan = parseInt(td.getAttribute('colspan') || '1', 10);
        const textValue = td.textContent?.trim() || '';

        if (currentCol === 1 && textValue) { rowClient = textValue; }
        else if (currentCol === 2 && textValue) { rowRoute = textValue; }
        else if (currentCol === 3 && textValue) { rowVessel = textValue; }
        else if (currentCol === 4) { rowMetric = textValue; }
        else if (currentCol >= 5) { rowValues.push(textValue); }

        setOccupied(currentRow, currentCol, rSpan, cSpan);
        currentCol += cSpan;
    });

    if (rowClient) lastClient = rowClient;
    if (rowRoute) lastRoute = rowRoute;
    if (rowVessel) lastVessel = rowVessel;

    rawRows.push({
        client: lastClient,
        route: lastRoute,
        vessel: lastVessel,
        metric: rowMetric,
        values: rowValues,
        isSubtotal: false,
        isFleet: false,
        isAccum: false
    });

    currentRow++;
});

// Formateo estricto: cero centavos en cifras monetarias
const formatNumericCell = (valStr, metricName) => {
    const rawClean = valStr.replace(/[\$,\s]/g, '');
    const upperMetric = metricName.toUpperCase();
    const isPercent = valStr.includes('%') || upperMetric.includes('%') || upperMetric.includes('MARGEN') || upperMetric.includes('YIELD');
    const cleanNumStr = rawClean.replace('%', '');

    if (valStr === '-' || valStr === '' || isNaN(Number(cleanNumStr)) || cleanNumStr === '') {
        return '';
    }

    const parsedNum = parseFloat(cleanNumStr);
    if (parsedNum === 0) return '';

    if (isPercent) {
        return (parsedNum > 1 ? parsedNum : parsedNum * 100).toFixed(1) + '%';
    }
    if (upperMetric.includes('VIAJE') || upperMetric.includes('FREQ')) {
        return Number.isInteger(parsedNum) ? parsedNum.toLocaleString('en-US') : parsedNum.toFixed(1);
    }
    if (!upperMetric.includes('HIRE') && (upperMetric.includes('DÍA') || upperMetric.includes('DAYS') || upperMetric.includes('DURACIÓN'))) {
        return Number.isInteger(parsedNum) ? String(parsedNum) : parsedNum.toFixed(1);
    }
    if (upperMetric.includes('TONELADA') || upperMetric.includes('TONS') || upperMetric.includes('MT') || upperMetric.includes('CARGA')) {
        return Math.round(parsedNum).toLocaleString('en-US');
    }
    return '$' + Math.round(parsedNum).toLocaleString('en-US');
};

const parseNum = (valStr) => {
    if (!valStr || valStr === '-') return 0;
    const clean = valStr.replace(/[\$,\s]/g, '').replace('%', '');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
};

const vesselBlocks = [];
const subtotalBlocks = [];
let currentBlock = null;

rawRows.forEach(r => {
    const upperMetric = r.metric.toUpperCase();
    const isStartOfVessel = upperMetric.includes('VIAJES') || upperMetric.includes('FREQ');

    let shouldStart = false;
    if (!currentBlock) {
        shouldStart = true;
    } else if (isStartOfVessel && currentBlock.rows.length >= 7) {
        shouldStart = true;
    } else if (r.vessel !== currentBlock.vessel || r.route !== currentBlock.route || r.client !== currentBlock.client) {
        shouldStart = true;
    }

    if (shouldStart) {
        currentBlock = {
            client: r.client,
            route: r.route,
            vessel: r.vessel,
            rows: []
        };
        vesselBlocks.push(currentBlock);
    }
    currentBlock.rows.push({
        metric: r.metric,
        values: r.values.map(v => formatNumericCell(v, r.metric))
    });
});

const numMonths = months.length;
const standardMetricNames = [
    'Viajes', 'Días-Buque', 'Toneladas', 'Net Revenue',
    '(-) Hire (TCE x días)', '(-) Bunker Costs', '(-) Port Costs',
    '(-) Dockage', '(-) Arriendo de Naves', '(=) VOYAGE RESULT / P&L'
];

const fleetMonthlyTotals = Array.from({ length: 10 }, () => Array(numMonths).fill(0));

vesselBlocks.forEach(vb => {
    vb.rows.forEach(r => {
        const up = r.metric.toUpperCase();
        let metricIdx = -1;
        if (up.includes('VIAJE') || up.includes('FREQ')) metricIdx = 0;
        else if (!up.includes('HIRE') && (up.includes('DÍA') || up.includes('DAYS'))) metricIdx = 1;
        else if (up.includes('TONELADA') || up.includes('TONS') || up.includes('MT')) metricIdx = 2;
        else if (up.includes('NET REVENUE') || up.includes('VENTAS')) metricIdx = 3;
        else if (up.includes('HIRE')) metricIdx = 4;
        else if (up.includes('BUNKER')) metricIdx = 5;
        else if (up.includes('PORT') && !up.includes('DOCKAGE')) metricIdx = 6;
        else if (up.includes('DOCKAGE')) metricIdx = 7;
        else if (up.includes('ARRIENDO')) metricIdx = 8;
        else if (up.includes('VOYAGE RESULT') || up.includes('MARGEN') || up.includes('P&L')) metricIdx = 9;

        if (metricIdx >= 0) {
            r.values.slice(0, numMonths).forEach((vStr, mIdx) => {
                fleetMonthlyTotals[metricIdx][mIdx] += parseNum(vStr);
            });
        }
    });
});

const fleetBlock = {
    client: 'TOTAL FLOTA',
    route: 'FLOTA',
    vessel: 'TODOS',
    isSubtotal: false,
    isFleet: true,
    isAccum: false,
    rows: standardMetricNames.map((mName, mIdx) => {
        const monthlyVals = fleetMonthlyTotals[mIdx];
        const sumTot = monthlyVals.reduce((a, b) => a + b, 0);
        const valStrings = monthlyVals.map(n => formatNumericCell(String(n), mName));
        valStrings.push(formatNumericCell(String(sumTot), mName));
        return { metric: mName, values: valStrings };
    })
};

const accumMonthlyTotals = Array.from({ length: 10 }, () => Array(numMonths).fill(0));
for (let mIdx = 0; mIdx < 10; mIdx++) {
    let runningSum = 0;
    for (let colIdx = 0; colIdx < numMonths; colIdx++) {
        runningSum += fleetMonthlyTotals[mIdx][colIdx];
        accumMonthlyTotals[mIdx][colIdx] = runningSum;
    }
}

const accumBlock = {
    client: 'TOTAL ACUMULADO',
    route: 'PROGRESIVO',
    vessel: 'YTD',
    isSubtotal: false,
    isFleet: false,
    isAccum: true,
    rows: standardMetricNames.map((mName, mIdx) => {
        const monthlyVals = accumMonthlyTotals[mIdx];
        const endTot = monthlyVals[monthlyVals.length - 1] || 0;
        const valStrings = monthlyVals.map(n => formatNumericCell(String(n), mName));
        valStrings.push(formatNumericCell(String(endTot), mName));
        return { metric: mName, values: valStrings };
    })
};

const allBlocks = [...vesselBlocks, ...subtotalBlocks, fleetBlock, accumBlock];

const MAX_ROWS_PER_PAGE = 30;
const pages = [];
let activePage = { blocks: [], totalRows: 0 };

allBlocks.forEach(block => {
    const count = block.rows.length;
    if (activePage.totalRows + count > MAX_ROWS_PER_PAGE && activePage.blocks.length > 0) {
        pages.push(activePage);
        activePage = { blocks: [], totalRows: 0 };
    }
    activePage.blocks.push(block);
    activePage.totalRows += count;
});
if (activePage.blocks.length > 0) pages.push(activePage);

const totalPagesCount = pages.length;

const pagesHtml = pages.map((p, pageIdx) => {
    const clientSpanMap = new Map();
    const routeSpanMap = new Map();

    p.blocks.forEach(b => {
        const rowCount = b.rows.length;
        const cKey = b.client;
        const rKey = `${b.client}____${b.route}`;
        clientSpanMap.set(cKey, (clientSpanMap.get(cKey) || 0) + rowCount);
        routeSpanMap.set(rKey, (routeSpanMap.get(rKey) || 0) + rowCount);
    });

    const renderedClients = new Set();
    const renderedRoutes = new Set();

    const tbodyHtml = p.blocks.map(b => {
        const cKey = b.client;
        const rKey = `${b.client}____${b.route}`;
        const clientSpan = clientSpanMap.get(cKey) || b.rows.length;
        const routeSpan = routeSpanMap.get(rKey) || b.rows.length;
        const vesselSpan = b.rows.length;

        const isClientFirst = !renderedClients.has(cKey);
        if (isClientFirst) renderedClients.add(cKey);

        const isRouteFirst = !renderedRoutes.has(rKey);
        if (isRouteFirst) renderedRoutes.add(rKey);

        const isFleet = b.isFleet;
        const isAccum = b.isAccum;
        const trClass = isAccum ? 'tr-accum' : (isFleet ? 'tr-fleet' : 'tr-data-row');

        const cBg = isAccum ? '#0d9488' : (isFleet ? '#1e293b' : '#0369a1');
        const cFg = isFleet ? '#fbbf24' : '#ffffff';
        const rBg = isAccum ? '#0d9488' : (isFleet ? '#1e293b' : '#a855f7');
        const rFg = isFleet ? '#94a3b8' : '#ffffff';
        const vBg = isAccum ? '#0d9488' : (isFleet ? '#1e293b' : '#16a34a');
        const vFg = isFleet ? '#94a3b8' : '#ffffff';

        return b.rows.map((row, rIdx) => {
            const isVesselFirst = rIdx === 0;
            return `
            <tr class="${trClass}">
                ${isClientFirst && rIdx === 0 ? `
                    <td rowspan="${clientSpan}" class="td-dimension" style="background-color: ${cBg} !important;">
                        ${createVerticalSvg(b.client, clientSpan, cFg)}
                    </td>
                ` : ''}
                ${isRouteFirst && rIdx === 0 ? `
                    <td rowspan="${routeSpan}" class="td-dimension" style="background-color: ${rBg} !important;">
                        ${createVerticalSvg(b.route, routeSpan, rFg)}
                    </td>
                ` : ''}
                ${isVesselFirst ? `
                    <td rowspan="${vesselSpan}" class="td-dimension" style="background-color: ${vBg} !important;">
                        ${createVerticalSvg(b.vessel, vesselSpan, vFg)}
                    </td>
                ` : ''}
                <td class="td-metric-name">${row.metric}</td>
                ${row.values.map((v, valIdx) => `<td class="${v ? 'td-num' : 'td-empty'} ${valIdx === row.values.length - 1 ? 'td-total-cell' : ''}">${v}</td>`).join('')}
            </tr>
            `;
        }).join('');
    }).join('');

    return `
    <div class="report-page">
        <table class="top-header-table">
            <tr>
                <td style="width: 25%; text-align: left;"><div style="font-weight: 700; font-size: 13px; color: #0284c7;">GEEKSOFT FORECAST</div></td>
                <td style="width: 50%; text-align: center;">
                    <div class="report-main-title">NAVIERA PETRAL S.A.</div>
                    <div class="report-sub-title">MATRIZ FINANCIERA • VOYAGE CALCULATOR & PROYECCIÓN COMERCIAL</div>
                </td>
                <td style="width: 25%; text-align: right;"><div style="font-weight: 700; font-size: 11px; color: #0f4c81;">PETRAL S.A.</div></td>
            </tr>
        </table>
        <div class="scenario-badge-banner">ESCENARIO: PB 2027 (Jose de los Heros) &bull; MONEDA: USD &bull; (Parte ${pageIdx + 1} de ${totalPagesCount})</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th class="th-dim" style="width: 24px;">CLI</th>
                    <th class="th-dim" style="width: 24px;">RUT</th>
                    <th class="th-dim" style="width: 24px;">BUQ</th>
                    <th class="th-metric" style="width: 165px;">MÉTRICA</th>
                    ${months.map(m => `<th class="th-month" style="width: 53px;">${m.toUpperCase()}</th>`).join('')}
                    <th class="th-total" style="width: 80px;">TOTAL ACUM</th>
                </tr>
            </thead>
            <tbody>
                ${tbodyHtml}
            </tbody>
        </table>
        <div class="page-footer">
            <div style="display: table-cell; text-align: left;">Petral Forecast Engine © 2026</div>
            <div style="display: table-cell; text-align: center;">Página ${pageIdx + 1} de ${totalPagesCount}</div>
            <div style="display: table-cell; text-align: right;">Documento Oficial de Auditoría</div>
        </div>
    </div>
    `;
}).join('');

const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>NAVIERA PETRAL S.A. - Matriz Financiera</title>
    <style>
        @page { size: A4 landscape !important; margin: 4mm 5mm !important; }
        * { box-sizing: border-box; font-family: 'Consolas', 'Courier New', monospace !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        html, body { margin: 0 !important; padding: 0 !important; background-color: #ffffff !important; color: #0f172a; font-size: 9px !important; font-weight: normal !important; line-height: 1.15; }
        .report-page { width: 100%; margin: 0; padding: 0; page-break-after: always; page-break-inside: avoid; box-sizing: border-box; }
        .report-page:last-child { page-break-after: avoid; }
        .top-header-table { width: 100%; border-collapse: collapse; margin-bottom: 3px; }
        .top-header-table td { border: none !important; padding: 0 !important; vertical-align: middle; }
        .report-main-title { font-weight: 700; font-size: 13px; color: #0f172a; margin: 0; text-transform: uppercase; text-align: center; }
        .report-sub-title { font-size: 9.5px; font-weight: 600; color: #334155; text-align: center; margin-top: 1px; }
        .scenario-badge-banner { background-color: #0f4c81; color: #ffffff; font-weight: 700; font-size: 9px; text-transform: uppercase; padding: 2px 8px; border-radius: 3px; text-align: center; margin: 2px auto 3px auto; width: fit-content; }
        table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 2px; table-layout: fixed; font-size: 9px !important; font-weight: normal !important; line-height: 1.15; }
        table.data-table th { background-color: #1e293b !important; color: #ffffff !important; font-weight: 700; text-transform: uppercase; font-size: 9px; padding: 3px 2px; border: 1px solid #334155; text-align: center; }
        table.data-table th.th-total { background-color: #0d9488 !important; color: #ffffff !important; }
        table.data-table td { border: 1px solid #cbd5e1; padding: 2px 3px; vertical-align: middle; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: normal !important; }
        td.td-dimension { width: 24px !important; max-width: 24px !important; min-width: 24px !important; text-align: center !important; vertical-align: middle !important; padding: 0 !important; }
        td.td-metric-name { width: 165px !important; min-width: 165px !important; max-width: 165px !important; text-align: left !important; font-weight: normal !important; color: #0f172a; padding-left: 5px; writing-mode: horizontal-tb !important; transform: none !important; white-space: nowrap !important; font-size: 9.5px !important; }
        td.td-num { width: 53px !important; max-width: 53px !important; text-align: right !important; font-size: 9px !important; font-weight: normal !important; color: #1e293b; padding-right: 3px; }
        td.td-empty { width: 53px !important; max-width: 53px !important; text-align: center; color: #cbd5e1; }
        td.td-total-cell { width: 80px !important; max-width: 80px !important; min-width: 80px !important; font-size: 9px !important; font-weight: 700 !important; color: #0f172a !important; }
        tr.tr-fleet td { background-color: #f1f5f9 !important; font-weight: 600 !important; }
        tr.tr-accum td { background-color: #eef2ff !important; font-weight: 700 !important; }
        .page-footer { width: 100%; margin-top: 3px; border-top: 1px solid #cbd5e1; padding-top: 2px; font-size: 8px; font-weight: 600; color: #64748b; display: table; table-layout: fixed; }
    </style>
</head>
<body>
    ${pagesHtml}
</body>
</html>`;

fs.writeFileSync('./scratch_atomic_full.html', fullHtml, 'utf-8');
console.log(`✅ Paginación y rotación SVG en todas las dimensiones generada con éxito (${totalPagesCount} páginas A4 Landscape).`);
