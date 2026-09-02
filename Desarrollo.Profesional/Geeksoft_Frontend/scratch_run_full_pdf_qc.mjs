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

// Extraer bloques y generar HTML idéntico a exportFinancialMatrixPdf.ts
const headerCols = [];
document.querySelectorAll('#forecast-grid-table thead th').forEach(th => {
    headerCols.push(th.textContent.trim().toUpperCase());
});

const safeHeaderCols = headerCols.length >= 5 ? headerCols : [
    'CLIENTE', 'RUTA', 'BUQUE', 'MÉTRICA',
    'ENE 2027', 'FEB 2027', 'MAR 2027', 'ABR 2027', 'MAY 2027', 'JUN 2027',
    'JUL 2027', 'AGO 2027', 'SET 2027', 'OCT 2027', 'NOV 2027', 'DIC 2027',
    'TOTAL ACUM'
];

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
const blocks = [];
let currentBlock = null;
let lastClientName = '';
let lastRouteName = '';
let lastVesselName = '';

document.querySelectorAll('#forecast-grid-table tbody tr').forEach(tr => {
    let currentCol = 1;
    const tds = tr.querySelectorAll('td');
    let rowClient = '';
    let rowRoute = '';
    let rowVessel = '';
    let rowMetric = '';
    let clientCls = '';
    let routeCls = '';
    let vesselCls = '';
    const rowValues = [];

    tds.forEach(td => {
        while (isOccupied(currentRow, currentCol)) {
            currentCol++;
        }
        const rSpan = parseInt(td.getAttribute('rowspan') || '1', 10);
        const cSpan = parseInt(td.getAttribute('colspan') || '1', 10);
        const tdClass = td.className || '';
        const textValue = td.textContent?.trim() || '';

        if (currentCol === 1 && textValue) { rowClient = textValue; clientCls = tdClass; }
        else if (currentCol === 2 && textValue) { rowRoute = textValue; routeCls = tdClass; }
        else if (currentCol === 3 && textValue) { rowVessel = textValue; vesselCls = tdClass; }
        else if (currentCol === 4) { rowMetric = textValue; }
        else if (currentCol >= 5) { rowValues.push(textValue); }

        setOccupied(currentRow, currentCol, rSpan, cSpan);
        currentCol += cSpan;
    });

    if (rowClient) lastClientName = rowClient;
    if (rowRoute) lastRouteName = rowRoute;
    if (rowVessel) lastVesselName = rowVessel;

    const isNewBlock = !currentBlock || (rowVessel !== '' || rowRoute !== '' || rowClient !== '');
    if (isNewBlock) {
        currentBlock = {
            type: 'vessel',
            clientName: lastClientName,
            routeName: lastRouteName,
            vesselName: lastVesselName,
            clientColor: lastClientName.includes('NEXA') ? { bg: '#0f4c81', fg: '#fff' } : { bg: '#0369a1', fg: '#fff' },
            routeColor: { bg: '#a855f7', fg: '#fff' },
            vesselColor: { bg: '#16a34a', fg: '#fff' },
            rows: []
        };
        blocks.push(currentBlock);
    }

    const formattedVals = [];
    let formattedTot = '';
    rowValues.forEach((valStr, idx) => {
        if (idx === rowValues.length - 1) formattedTot = valStr === '-' ? '' : valStr;
        else formattedVals.push(valStr === '-' ? '' : valStr);
    });

    currentBlock.rows.push({
        name: rowMetric,
        formattedValues: formattedVals,
        formattedTotal: formattedTot,
        isNumeric: true
    });

    currentRow++;
});

// Paginación atómica
const MAX_ROWS_PER_PAGE = 21;
const pages = [];
let activePage = { blocks: [], totalRows: 0 };

blocks.forEach(block => {
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

const pagesHtml = pages.map((p, pageIdx) => `
<div class="report-page">
    <table class="top-header-table">
        <tr>
            <td style="width: 25%; text-align: left;">
                <div style="font-weight: 900; font-size: 14px; color: #0284c7;">GEEKSOFT FORECAST</div>
            </td>
            <td style="width: 50%; text-align: center;">
                <div class="report-main-title">NAVIERA PETRAL S.A.</div>
                <div class="report-sub-title">MATRIZ FINANCIERA • VOYAGE CALCULATOR & PROYECCIÓN COMERCIAL</div>
            </td>
            <td style="width: 25%; text-align: right;">
                <div style="font-weight: 800; font-size: 11px; color: #0f4c81;">PETRAL S.A.</div>
            </td>
        </tr>
    </table>

    <div class="scenario-badge-banner">
        ESCENARIO: PB 2027 (Jose de los Heros) &bull; MONEDA: USD &bull; (Parte ${pageIdx + 1} de ${totalPagesCount})
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th class="th-dim" style="width: 22px;">CLI</th>
                <th class="th-dim" style="width: 22px;">RUTA</th>
                <th class="th-dim" style="width: 22px;">BUQ</th>
                <th class="th-metric" style="width: 170px;">MÉTRICA</th>
                ${safeHeaderCols.slice(4, -1).map(h => `<th class="th-month" style="width: 58px;">${h}</th>`).join('')}
                <th class="th-total" style="width: 62px;">TOTAL ACUM</th>
            </tr>
        </thead>
        <tbody>
            ${p.blocks.map(b => {
                const rowCount = b.rows.length;
                return b.rows.map((row, rIdx) => `
                <tr class="tr-data-row">
                    ${rIdx === 0 ? `
                        <td rowspan="${rowCount}" class="td-dimension" style="background-color: ${b.clientColor.bg} !important; color: ${b.clientColor.fg} !important;">
                            <div class="pdf-vertical-text">${b.clientName}</div>
                        </td>
                        <td rowspan="${rowCount}" class="td-dimension" style="background-color: ${b.routeColor.bg} !important; color: ${b.routeColor.fg} !important;">
                            <div class="pdf-vertical-text">${b.routeName}</div>
                        </td>
                        <td rowspan="${rowCount}" class="td-dimension" style="background-color: ${b.vesselColor.bg} !important; color: ${b.vesselColor.fg} !important;">
                            <div class="pdf-vertical-text">${b.vesselName}</div>
                        </td>
                    ` : ''}
                    <td class="td-metric-name">${row.name}</td>
                    ${row.formattedValues.map(v => `<td class="${v ? 'td-num' : 'td-empty'}">${v}</td>`).join('')}
                    <td class="${row.formattedTotal ? 'td-num font-bold' : 'td-empty'}">${row.formattedTotal}</td>
                </tr>
                `).join('');
            }).join('')}
        </tbody>
    </table>

    <div class="page-footer">
        <div style="display: table-cell; text-align: left;">Petral Forecast Engine &copy; 2026</div>
        <div style="display: table-cell; text-align: center;">Página ${pageIdx + 1} de ${totalPagesCount}</div>
        <div style="display: table-cell; text-align: right;">Documento Oficial de Auditoría</div>
    </div>
</div>
`).join('');

const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>NAVIERA PETRAL S.A. - Matriz Financiera</title>
    <style>
        @page {
            size: A4 landscape !important;
            margin: 4mm 6mm !important;
        }
        * {
            box-sizing: border-box;
            font-family: 'Consolas', 'Courier New', 'Lucida Console', ui-monospace, monospace !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
            color: #0f172a;
            font-size: 10px !important;
            line-height: 1.15;
        }
        .report-page {
            width: 100%;
            margin: 0;
            padding: 0;
            page-break-after: always;
            page-break-inside: avoid;
            box-sizing: border-box;
        }
        .report-page:last-child {
            page-break-after: avoid;
        }
        .top-header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 3px;
        }
        .top-header-table td {
            border: none !important;
            padding: 0 !important;
            vertical-align: middle;
        }
        .report-main-title {
            font-weight: 900;
            font-size: 13px;
            color: #0f172a;
            margin: 0;
            text-transform: uppercase;
            text-align: center;
            letter-spacing: 0.4px;
            line-height: 1.1;
        }
        .report-sub-title {
            font-size: 9.5px;
            font-weight: 700;
            color: #334155;
            text-align: center;
            margin-top: 1px;
            letter-spacing: 0.2px;
        }
        .scenario-badge-banner {
            background-color: #0f4c81;
            color: #ffffff;
            font-weight: 800;
            font-size: 9.5px;
            text-transform: uppercase;
            padding: 2px 8px;
            border-radius: 3px;
            text-align: center;
            margin: 2px auto 3px auto;
            width: fit-content;
            max-width: 95%;
            letter-spacing: 0.2px;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2px;
            table-layout: fixed;
            font-size: 10px !important;
            line-height: 1.15;
        }
        table.data-table th {
            background-color: #1e293b !important;
            color: #ffffff !important;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 9px;
            padding: 3px 2px;
            border: 1px solid #334155;
            text-align: center;
            letter-spacing: 0.1px;
        }
        table.data-table th.th-total {
            background-color: #0d9488 !important;
            color: #ffffff !important;
        }
        table.data-table td {
            border: 1px solid #cbd5e1;
            padding: 2px 3px;
            vertical-align: middle;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        td.td-dimension {
            width: 22px !important;
            max-width: 22px !important;
            min-width: 22px !important;
            text-align: center !important;
            vertical-align: middle !important;
            padding: 0 !important;
        }
        .pdf-vertical-text {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            font-weight: 800;
            font-size: 8.5px;
            letter-spacing: 0.2px;
            text-align: center;
            margin: auto;
            white-space: nowrap;
            line-height: 1;
        }
        td.td-metric-name {
            width: 170px !important;
            min-width: 170px !important;
            max-width: 170px !important;
            text-align: left !important;
            font-weight: 700;
            color: #0f172a;
            padding-left: 5px;
            writing-mode: horizontal-tb !important;
            transform: none !important;
            white-space: nowrap !important;
            font-size: 10px !important;
        }
        td.td-num {
            width: 58px !important;
            max-width: 58px !important;
            text-align: right !important;
            font-size: 10px !important;
            font-weight: 600;
            color: #1e293b;
            padding-right: 3px;
        }
        td.td-empty {
            width: 58px !important;
            max-width: 58px !important;
            text-align: center;
            color: #cbd5e1;
        }
        tr.tr-data-row:nth-child(even) td:not(.td-dimension) {
            background-color: #f8fafc;
        }
        .page-footer {
            width: 100%;
            margin-top: 3px;
            border-top: 1px solid #cbd5e1;
            padding-top: 2px;
            font-size: 8px;
            font-weight: 700;
            color: #64748b;
            display: table;
            table-layout: fixed;
        }
    </style>
</head>
<body>
    ${pagesHtml}
</body>
</html>`;

fs.writeFileSync('./scratch_atomic_full.html', fullHtml, 'utf-8');
console.log(`✅ Generadas ${totalPagesCount} páginas A4 Landscape independientes con bloques atómicos indivisibles.`);
