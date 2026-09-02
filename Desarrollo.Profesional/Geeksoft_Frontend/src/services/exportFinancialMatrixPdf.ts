import { LOGO_PETRAL_BASE64, LOGO_GEEKSOFT_BASE64 } from '../assets/logosBase64';

// Paleta corporativa oficial homologada con el Excel canónico
const COLOR_MAP: Record<string, { bg: string; fg: string }> = {
    // Clientes
    'bg-sky-700': { bg: '#0369a1', fg: '#ffffff' },
    'bg-petral-blue': { bg: '#0f4c81', fg: '#ffffff' },
    'bg-orange-500': { bg: '#f97316', fg: '#ffffff' },
    // Rutas
    'bg-cyan-500': { bg: '#06b6d4', fg: '#ffffff' },
    'bg-purple-500': { bg: '#a855f7', fg: '#ffffff' },
    'bg-fuchsia-500': { bg: '#d946ef', fg: '#ffffff' },
    'bg-slate-700': { bg: '#334155', fg: '#ffffff' },
    // Buques
    'bg-red-600': { bg: '#dc2626', fg: '#ffffff' },
    'bg-green-600': { bg: '#16a34a', fg: '#ffffff' },
    'bg-slate-600': { bg: '#475569', fg: '#ffffff' },
    'bg-indigo-600': { bg: '#4f46e5', fg: '#ffffff' },
    'bg-slate-800': { bg: '#1e293b', fg: '#ffffff' },
    'bg-amber-100': { bg: '#fef3c7', fg: '#78350f' },
    'bg-petral-teal': { bg: '#0d9488', fg: '#ffffff' },
};

function getDimensionColor(className: string, text: string): { bg: string; fg: string } | null {
    for (const [cls, colors] of Object.entries(COLOR_MAP)) {
        if (className.includes(cls)) {
            return colors;
        }
    }
    const upper = text.toUpperCase();
    if (upper.includes('NEXA')) return { bg: '#0f4c81', fg: '#ffffff' };
    if (upper.includes('SPCC')) return { bg: '#0369a1', fg: '#ffffff' };
    if (upper.includes('MATARANI')) return { bg: '#06b6d4', fg: '#ffffff' };
    if (upper.includes('MARCONA')) return { bg: '#a855f7', fg: '#ffffff' };
    if (upper.includes('MEJILLONES')) return { bg: '#d946ef', fg: '#ffffff' };
    if (upper.includes('TABLONES')) return { bg: '#dc2626', fg: '#ffffff' };
    if (upper.includes('MOQUEGUA')) return { bg: '#16a34a', fg: '#ffffff' };
    if (upper.includes('CONCON')) return { bg: '#475569', fg: '#ffffff' };
    if (upper.includes('HUEMUL')) return { bg: '#4f46e5', fg: '#ffffff' };
    if (upper.includes('TOTAL ACUMULADO')) return { bg: '#0d9488', fg: '#ffffff' };
    if (upper.includes('TOTAL FLOTA')) return { bg: '#1e293b', fg: '#ffffff' };
    if (upper.includes('SUBTOTAL') || upper.includes('TOTAL CLIENT')) return { bg: '#1e293b', fg: '#fbbf24' };
    return null;
}

interface ParsedRow {
    client: string;
    route: string;
    vessel: string;
    clientCls: string;
    routeCls: string;
    vesselCls: string;
    metric: string;
    values: string[];
    isSubtotal: boolean;
    isFleet: boolean;
    isAccum: boolean;
}

export function generateFinancialMatrixPdfHtml(
    tableId: string = 'forecast-grid-table',
    _orientation: 'portrait' | 'landscape' = 'landscape',
    scenarioName: string = 'Escenario de Proyección'
): string {
    const table = document.getElementById(tableId) as HTMLTableElement;
    if (!table) {
        throw new Error('No se encontró la tabla de Matriz Financiera en el DOM.');
    }

    // 1. Extraer Columnas del THEAD
    const headerCols: string[] = [];
    const thead = table.querySelector('thead');
    if (thead) {
        const ths = thead.querySelectorAll('th');
        ths.forEach(th => {
            const span = th.querySelector('span');
            let clean = (span && span.textContent ? span.textContent : th.textContent || '').trim().toUpperCase();
            clean = clean.replace(/[\n\r]+/g, ' ').trim();
            headerCols.push(clean);
        });
    }

    const safeMonths = headerCols.slice(4, -1).length > 0 ? headerCols.slice(4, -1) : [
        'ENE 2027', 'FEB 2027', 'MAR 2027', 'ABR 2027', 'MAY 2027', 'JUN 2027',
        'JUL 2027', 'AGO 2027', 'SET 2027', 'OCT 2027', 'NOV 2027', 'DIC 2027'
    ];
    const totalHeader = headerCols[headerCols.length - 1] || 'TOTAL ACUM';

    // 2. Extraer todas las filas con Matriz de Ocupación para resolver rowSpan
    const occupied: boolean[][] = [];
    const setOccupied = (r: number, c: number, rSpan: number, cSpan: number) => {
        for (let row = r; row < r + rSpan; row++) {
            if (!occupied[row]) occupied[row] = [];
            for (let col = c; col < c + cSpan; col++) {
                occupied[row][col] = true;
            }
        }
    };
    const isOccupied = (r: number, c: number) => !!(occupied[r] && occupied[r][c]);

    let currentRow = 1;
    const rawRows: ParsedRow[] = [];
    let lastClient = '';
    let lastRoute = '';
    let lastVessel = '';
    let lastClientCls = '';
    let lastRouteCls = '';
    let lastVesselCls = '';

    const tbody = table.querySelector('tbody');
    if (tbody) {
        const trs = tbody.querySelectorAll('tr');
        trs.forEach(tr => {
            let currentCol = 1;
            const tds = tr.querySelectorAll('td');

            let rowClient = '';
            let rowRoute = '';
            let rowVessel = '';
            let rowMetric = '';
            let clientCls = '';
            let routeCls = '';
            let vesselCls = '';
            const rowValues: string[] = [];

            tds.forEach(td => {
                while (isOccupied(currentRow, currentCol)) {
                    currentCol++;
                }

                const rSpan = parseInt(td.getAttribute('rowspan') || '1', 10);
                const cSpan = parseInt(td.getAttribute('colspan') || '1', 10);
                const tdClass = td.className || '';

                let textValue = '';
                const selectEl = td.querySelector('select');
                const inputEl = td.querySelector('input');
                const vertDiv = td.querySelector('.vertical-text');
                const btnEl = td.querySelector('button');

                if (selectEl) {
                    textValue = selectEl.value || (vertDiv ? vertDiv.textContent?.trim() : '') || '';
                } else if (inputEl) {
                    textValue = inputEl.value;
                } else if (vertDiv) {
                    textValue = vertDiv.textContent?.trim() || '';
                } else if (btnEl) {
                    const btnClone = btnEl.cloneNode(true) as HTMLElement;
                    btnClone.querySelectorAll('svg, .font-mono, [class*="text-[9px]"]').forEach(el => el.remove());
                    textValue = btnClone.textContent?.trim() || '';
                } else {
                    const cellClone = td.cloneNode(true) as HTMLElement;
                    cellClone.querySelectorAll('svg, select, input, [class*="text-[9px]"]').forEach(el => el.remove());
                    textValue = cellClone.textContent?.trim() || '';
                }

                if (currentCol === 1 && textValue) { rowClient = textValue; clientCls = tdClass; }
                else if (currentCol === 2 && textValue) { rowRoute = textValue; routeCls = tdClass; }
                else if (currentCol === 3 && textValue) { rowVessel = textValue; vesselCls = tdClass; }
                else if (currentCol === 4) { rowMetric = textValue; }
                else if (currentCol >= 5) { rowValues.push(textValue); }

                setOccupied(currentRow, currentCol, rSpan, cSpan);
                currentCol += cSpan;
            });

            if (rowClient) { lastClient = rowClient; lastClientCls = clientCls; }
            if (rowRoute) { lastRoute = rowRoute; lastRouteCls = routeCls; }
            if (rowVessel) { lastVessel = rowVessel; lastVesselCls = vesselCls; }

            const isSub = lastRoute.toUpperCase().includes('SUBTOTAL') || lastVessel.toUpperCase().includes('TOTAL CLIENT') || lastClient.toUpperCase().includes('SUBTOTAL');
            const isFleet = lastClient.toUpperCase().includes('TOTAL FLOTA');
            const isAccum = lastClient.toUpperCase().includes('TOTAL ACUMULADO');

            rawRows.push({
                client: lastClient,
                route: lastRoute,
                vessel: lastVessel,
                clientCls: lastClientCls,
                routeCls: lastRouteCls,
                vesselCls: lastVesselCls,
                metric: rowMetric,
                values: rowValues,
                isSubtotal: isSub,
                isFleet: isFleet,
                isAccum: isAccum
            });

            currentRow++;
        });
    }

    // 3. Formateo Numérico Estricto: CERO CENTAVOS ($#,##0) en todas las cifras monetarias
    const formatNumericCell = (valStr: string, metricName: string): string => {
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
        // Todas las cifras monetarias (incluyendo TCE y Tarifas) redondeadas a entero SIN CENTAVOS
        return '$' + Math.round(parsedNum).toLocaleString('en-US');
    };

    // 4. Agrupación Atómica Estricta: Cada buque es UN SOLO BLOQUE indivisible de 9 filas
    interface AtomicBlock {
        client: string;
        route: string;
        vessel: string;
        clientCls: string;
        routeCls: string;
        vesselCls: string;
        isSubtotal: boolean;
        isFleet: boolean;
        isAccum: boolean;
        rows: { metric: string; values: string[] }[];
    }

    const blocks: AtomicBlock[] = [];
    let currentBlock: AtomicBlock | null = null;

    rawRows.forEach(r => {
        const upperMetric = r.metric.toUpperCase();
        const isStartOfVessel = upperMetric.includes('VIAJES') || upperMetric.includes('FREQ');
        const isSubtotalBlock = r.isSubtotal;
        const isFleetBlock = r.isFleet;
        const isAccumBlock = r.isAccum;

        let shouldStartNewBlock = false;
        if (!currentBlock) {
            shouldStartNewBlock = true;
        } else if (isAccumBlock !== currentBlock.isAccum || isFleetBlock !== currentBlock.isFleet || isSubtotalBlock !== currentBlock.isSubtotal) {
            shouldStartNewBlock = true;
        } else if (!isSubtotalBlock && !isFleetBlock && !isAccumBlock) {
            if (isStartOfVessel && currentBlock.rows.length >= 7) {
                shouldStartNewBlock = true;
            } else if (r.vessel !== currentBlock.vessel || r.route !== currentBlock.route || r.client !== currentBlock.client) {
                shouldStartNewBlock = true;
            }
        }

        if (shouldStartNewBlock) {
            currentBlock = {
                client: r.client,
                route: r.route,
                vessel: r.vessel,
                clientCls: r.clientCls,
                routeCls: r.routeCls,
                vesselCls: r.vesselCls,
                isSubtotal: isSubtotalBlock,
                isFleet: isFleetBlock,
                isAccum: isAccumBlock,
                rows: []
            };
            blocks.push(currentBlock);
        }

        currentBlock.rows.push({
            metric: r.metric,
            values: r.values.map(v => formatNumericCell(v, r.metric))
        });
    });

    // 5. Paginación Atómica: Ningún bloque de 9 filas se parte (Límite: 20 filas por hoja)
    const MAX_ROWS_PER_PAGE = 20;
    interface PageStructure {
        blocks: AtomicBlock[];
        totalRows: number;
    }

    const pages: PageStructure[] = [];
    let activePage: PageStructure = { blocks: [], totalRows: 0 };

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
    const formattedDate = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // 6. Renderizado de Páginas con Fusión Vertical Jerárquica y Textos Verticales
    const pagesHtml = pages.map((p, pageIdx) => {
        const clientSpanMap = new Map<string, number>();
        const routeSpanMap = new Map<string, number>();

        p.blocks.forEach(b => {
            const rowCount = b.rows.length;
            const cKey = b.client;
            const rKey = `${b.client}____${b.route}`;

            clientSpanMap.set(cKey, (clientSpanMap.get(cKey) || 0) + rowCount);
            routeSpanMap.set(rKey, (routeSpanMap.get(rKey) || 0) + rowCount);
        });

        const renderedClients = new Set<string>();
        const renderedRoutes = new Set<string>();

        const tbodyHtml = p.blocks.map(b => {
            const cKey = b.client;
            const rKey = `${b.client}____${b.route}`;
            const clientSpan = clientSpanMap.get(cKey) || b.rows.length;
            const routeSpan = routeSpanMap.get(rKey) || b.rows.length;
            const vesselSpan = b.rows.length;

            const cColor = getDimensionColor(b.clientCls, b.client) || { bg: '#0369a1', fg: '#ffffff' };
            const rColor = getDimensionColor(b.routeCls, b.route) || { bg: '#a855f7', fg: '#ffffff' };
            const vColor = getDimensionColor(b.vesselCls, b.vessel) || { bg: '#16a34a', fg: '#ffffff' };

            const isClientFirst = !renderedClients.has(cKey);
            if (isClientFirst) renderedClients.add(cKey);

            const isRouteFirst = !renderedRoutes.has(rKey);
            if (isRouteFirst) renderedRoutes.add(rKey);

            return b.rows.map((row, rIdx) => {
                const isVesselFirst = rIdx === 0;
                const trClass = b.isAccum ? 'tr-global-accum' : (b.isFleet ? 'tr-fleet-total' : (b.isSubtotal ? 'tr-subtotal' : 'tr-data-row'));

                return `
                <tr class="${trClass}">
                    ${isClientFirst && rIdx === 0 ? `
                        <td rowspan="${clientSpan}" class="td-dimension" style="background-color: ${cColor.bg} !important; color: ${cColor.fg} !important;">
                            <div class="pdf-vertical-text">${b.client}</div>
                        </td>
                    ` : ''}
                    ${isRouteFirst && rIdx === 0 ? `
                        <td rowspan="${routeSpan}" class="td-dimension" style="background-color: ${rColor.bg} !important; color: ${rColor.fg} !important;">
                            <div class="pdf-vertical-text">${b.route}</div>
                        </td>
                    ` : ''}
                    ${isVesselFirst ? `
                        <td rowspan="${vesselSpan}" class="td-dimension" style="background-color: ${vColor.bg} !important; color: ${vColor.fg} !important;">
                            <div class="pdf-vertical-text">${b.vessel}</div>
                        </td>
                    ` : ''}
                    <td class="td-metric-name ${row.metric.startsWith('↳') ? 'pl-subrow' : ''}">
                        ${row.metric}
                    </td>
                    ${row.values.map((v, valIdx) => {
                        const isTotalCol = valIdx === row.values.length - 1;
                        return `<td class="${v ? 'td-num' : 'td-empty'} ${isTotalCol ? 'td-total-cell' : ''}">${v}</td>`;
                    }).join('')}
                </tr>
                `;
            }).join('');
        }).join('');

        return `
        <div class="report-page">
            <!-- 1. Cabecera Institucional Oficial -->
            <table class="top-header-table">
                <tr>
                    <td style="width: 25%; text-align: left;">
                        <img src="${LOGO_GEEKSOFT_BASE64}" class="logo-geeksoft" alt="Geeksoft Logo" />
                    </td>
                    <td style="width: 50%; text-align: center;">
                        <div class="report-main-title">NAVIERA PETRAL S.A.</div>
                        <div class="report-sub-title">MATRIZ FINANCIERA • VOYAGE CALCULATOR & PROYECCIÓN COMERCIAL</div>
                    </td>
                    <td style="width: 25%; text-align: right;">
                        <img src="${LOGO_PETRAL_BASE64}" class="logo-petral" alt="Petral Logo" />
                    </td>
                </tr>
            </table>

            <div class="scenario-badge-banner">
                ESCENARIO: ${scenarioName} &bull; MONEDA: USD &bull; (Parte ${pageIdx + 1} de ${totalPagesCount})
            </div>

            <!-- 2. Grilla Contable con THEAD Oficial: CLI, RUT, BUQ -->
            <table class="data-table">
                <thead>
                    <tr>
                        <th class="th-dim" style="width: 24px;">CLI</th>
                        <th class="th-dim" style="width: 24px;">RUT</th>
                        <th class="th-dim" style="width: 24px;">BUQ</th>
                        <th class="th-metric" style="width: 165px;">MÉTRICA</th>
                        ${safeMonths.map(m => `<th class="th-month" style="width: 53px;">${m}</th>`).join('')}
                        <th class="th-total" style="width: 80px;">${totalHeader}</th>
                    </tr>
                </thead>
                <tbody>
                    ${tbodyHtml}
                </tbody>
            </table>

            <!-- 3. Pie de Página Oficial -->
            <div class="page-footer">
                <div class="page-footer-cell" style="text-align: left;">
                    Petral Forecast Engine &copy; 2026 &mdash; Sistema de Inteligencia Comercial y Proyecciones Marítimas
                </div>
                <div class="page-footer-cell" style="text-align: center;">
                    Página ${pageIdx + 1} de ${totalPagesCount}
                </div>
                <div class="page-footer-cell" style="text-align: right;">
                    Emisión: ${formattedDate}
                </div>
            </div>
        </div>
        `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>NAVIERA PETRAL S.A. - Matriz Financiera</title>
    <style>
        @page {
            size: A4 landscape !important;
            margin: 4mm 5mm !important;
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
            font-size: 9px !important;
            font-weight: normal !important;
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

        /* 1. Cabecera Institucional Oficial */
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
        .logo-geeksoft {
            height: 44px;
            width: auto;
            object-fit: contain;
        }
        .logo-petral {
            height: 18px;
            width: auto;
            object-fit: contain;
        }
        .report-main-title {
            font-weight: 700;
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
            font-weight: 600;
            color: #334155;
            text-align: center;
            margin-top: 1px;
            letter-spacing: 0.2px;
        }
        .scenario-badge-banner {
            background-color: #0f4c81;
            color: #ffffff;
            font-weight: 700;
            font-size: 9px;
            text-transform: uppercase;
            padding: 2px 8px;
            border-radius: 3px;
            text-align: center;
            margin: 2px auto 3px auto;
            width: fit-content;
            max-width: 95%;
            letter-spacing: 0.2px;
        }

        /* 2. Tabla Contable Matriz 100% Nativa */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2px;
            table-layout: fixed;
            font-size: 9px !important;
            font-weight: normal !important;
            line-height: 1.15;
        }
        table.data-table th {
            background-color: #1e293b !important;
            color: #ffffff !important;
            font-weight: 700;
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
            font-weight: normal !important;
        }
        
        /* Celdas de Dimensiones Verticales (CLI, RUT, BUQ) */
        td.td-dimension {
            width: 24px !important;
            max-width: 24px !important;
            min-width: 24px !important;
            text-align: center !important;
            vertical-align: middle !important;
            padding: 0 !important;
        }
        .pdf-vertical-text {
            writing-mode: vertical-rl !important;
            transform: rotate(180deg) !important;
            font-weight: 700;
            font-size: 8.5px;
            letter-spacing: 0.5px;
            text-align: center;
            margin: auto;
            white-space: nowrap;
            display: inline-block;
            line-height: 1;
        }

        /* Columna 4: Nombres de Métricas 100% HORIZONTAL */
        td.td-metric-name {
            width: 165px !important;
            min-width: 165px !important;
            max-width: 165px !important;
            text-align: left !important;
            font-weight: normal !important;
            color: #0f172a;
            padding-left: 5px;
            writing-mode: horizontal-tb !important;
            transform: none !important;
            white-space: nowrap !important;
            font-size: 9.5px !important;
        }
        .pl-subrow {
            padding-left: 14px !important;
            color: #475569;
        }

        /* Columnas de Datos (Meses a Fuente 9px) */
        td.td-num {
            width: 53px !important;
            max-width: 53px !important;
            text-align: right !important;
            font-size: 9px !important;
            font-weight: normal !important;
            color: #1e293b;
            padding-right: 3px;
        }
        td.td-empty {
            width: 53px !important;
            max-width: 53px !important;
            text-align: center;
            color: #cbd5e1;
        }
        /* Columna Total Acumulado Ampliada (80px) */
        td.td-total-cell {
            width: 80px !important;
            max-width: 80px !important;
            min-width: 80px !important;
            font-size: 9px !important;
            font-weight: 700 !important;
            color: #0f172a !important;
        }

        /* Filas Especiales */
        tr.tr-subtotal td {
            background-color: #fffbeb !important;
            color: #1e293b;
            border-top: 1.5px solid #fbbf24;
            border-bottom: 1.5px solid #fbbf24;
            font-weight: 600 !important;
        }
        tr.tr-fleet-total td {
            background-color: #f1f5f9 !important;
            color: #0f172a;
            border-top: 1.5px solid #334155;
            border-bottom: 1.5px solid #334155;
            font-weight: 600 !important;
        }
        tr.tr-global-accum td {
            background-color: #eef2ff !important;
            color: #1e1b4b;
            border-top: 2px solid #0d9488;
            border-bottom: 2px solid #0d9488;
            font-weight: 700 !important;
        }
        tr.tr-data-row:nth-child(even) td:not(.td-dimension) {
            background-color: #f8fafc;
        }

        /* 3. Pie de Página Institucional */
        .page-footer {
            width: 100%;
            margin-top: 3px;
            border-top: 1px solid #cbd5e1;
            padding-top: 2px;
            font-size: 8px;
            font-weight: 600;
            color: #64748b;
            display: table;
            table-layout: fixed;
        }
        .page-footer-cell {
            display: table-cell;
            vertical-align: middle;
        }
    </style>
</head>
<body>
    ${pagesHtml}
</body>
</html>
    `;
}

export async function exportFinancialMatrixPdf(
    tableId: string = 'forecast-grid-table',
    orientation: 'portrait' | 'landscape' = 'landscape',
    scenarioName: string = 'Escenario de Proyección'
): Promise<void> {
    const htmlContent = generateFinancialMatrixPdfHtml(tableId, orientation, scenarioName);
    
    // 1. Nombre único con timestamp exacto (YYYYMMDD_HHMMSS) para evitar bloqueos por archivo abierto
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `Petral_Matriz_Financiera_${orientation}_${timeStamp}.pdf`;

    // 2. Ruta API Dinámica (Producción / Local)
    const apiBase = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.origin.includes('localhost') ? 'http://localhost:8000/api/v1' : '/api/v1');
    const endpoint = `${apiBase.replace(/\/+$/, '')}/utils/generate-pdf`;

    // 3. Generación Asíncrona en Backend (WeasyPrint) con timeout de 60s (Anti Sharing Violation)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html: htmlContent, filename }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || `Error del servidor HTTP ${response.status}`);
        }

        const blob = await response.blob();
        if (blob.size < 500) {
            throw new Error('El PDF generado está vacío o dañado.');
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 3000);

    } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new Error('La generación del PDF tomó más de 60 segundos. Por favor, reintente.');
        }
        console.error('Error en servicio de PDF WeasyPrint:', err);
        throw err;
    }
}
