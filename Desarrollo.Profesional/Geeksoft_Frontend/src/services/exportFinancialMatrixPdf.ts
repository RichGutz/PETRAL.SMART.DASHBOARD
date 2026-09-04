import { LOGO_PETRAL_BASE64, LOGO_GEEKSOFT_BASE64 } from '../assets/logosBase64';

// Paleta corporativa con 75% de transparencia (25% tint pastel) para ahorro de tinta en impresión física
const COLOR_MAP: Record<string, { bg: string; fg: string }> = {
    // Clientes (75% transparencia / 25% tint)
    'bg-sky-700': { bg: '#c0dae8', fg: '#0369a1' },
    'bg-petral-blue': { bg: '#c3d2e0', fg: '#0f4c81' },
    'bg-orange-500': { bg: '#fedcc5', fg: '#c2410c' },
    // Rutas (75% transparencia / 25% tint)
    'bg-cyan-500': { bg: '#c1edf4', fg: '#0e7490' },
    'bg-purple-500': { bg: '#e9d5fd', fg: '#6b21a8' },
    'bg-fuchsia-500': { bg: '#f6d1fb', fg: '#86198f' },
    'bg-slate-700': { bg: '#ccd0d5', fg: '#1e293b' },
    // Buques (75% transparencia / 25% tint)
    'bg-red-600': { bg: '#f6c9c9', fg: '#991b1b' },
    'bg-green-600': { bg: '#c5e8d2', fg: '#166534' },
    'bg-slate-600': { bg: '#d1d5da', fg: '#1e293b' },
    'bg-indigo-600': { bg: '#d3d1f9', fg: '#3730a3' },
    'bg-slate-800': { bg: '#c7cace', fg: '#0f172a' },
    'bg-amber-100': { bg: '#fef3c7', fg: '#78350f' },
    'bg-petral-teal': { bg: '#c3e4e1', fg: '#115e59' },
};

function getDimensionColor(className: string, text: string): { bg: string; fg: string } | null {
    for (const [cls, colors] of Object.entries(COLOR_MAP)) {
        if (className.includes(cls)) {
            return colors;
        }
    }
    const upper = text.toUpperCase();
    if (upper.includes('NEXA')) return { bg: '#c3d2e0', fg: '#0f4c81' };
    if (upper.includes('SPCC')) return { bg: '#c0dae8', fg: '#0369a1' };
    if (upper.includes('MATARANI')) return { bg: '#c1edf4', fg: '#0e7490' };
    if (upper.includes('MARCONA')) return { bg: '#e9d5fd', fg: '#6b21a8' };
    if (upper.includes('MEJILLONES')) return { bg: '#f6d1fb', fg: '#86198f' };
    if (upper.includes('TABLONES')) return { bg: '#f6c9c9', fg: '#991b1b' };
    if (upper.includes('MOQUEGUA')) return { bg: '#c5e8d2', fg: '#166534' };
    if (upper.includes('CONCON')) return { bg: '#d1d5da', fg: '#1e293b' };
    if (upper.includes('HUEMUL')) return { bg: '#d3d1f9', fg: '#3730a3' };
    if (upper.includes('TOTAL ACUMULADO')) return { bg: '#c3e4e1', fg: '#115e59' };
    if (upper.includes('TOTAL FLOTA')) return { bg: '#c7cace', fg: '#0f172a' };
    if (upper.includes('SUBTOTAL') || upper.includes('TOTAL CLIENT')) return { bg: '#fef3c7', fg: '#78350f' };
    return null;
}

function createVerticalSvg(text: string, rowSpan: number, fill: string = '#ffffff'): string {
    const height = Math.max(26, rowSpan * 15);
    const midY = -height / 2;
    return `
    <svg width="13" height="${height}" viewBox="0 0 13 ${height}" style="display: block; margin: 0 auto; overflow: visible;">
        <text x="${midY}" y="9" transform="rotate(-90)" text-anchor="middle" fill="${fill}" font-family="Consolas, 'Courier New', monospace" font-size="7.5" font-weight="bold" letter-spacing="0.2">${text}</text>
    </svg>
    `;
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
    const numMonths = safeMonths.length;

    // 2. Extraer todas las filas con Matriz de Ocupación
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

    // 3. Formateo Numérico Estricto: CERO CENTAVOS ($#,##0)
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
        if (parsedNum < 0) {
            return '-' + Math.round(Math.abs(parsedNum)).toLocaleString('en-US');
        }
        return Math.round(parsedNum).toLocaleString('en-US');
    };

    const parseNum = (valStr: string): number => {
        if (!valStr || valStr === '-') return 0;
        const clean = valStr.replace(/[\$,\s]/g, '').replace('%', '');
        const n = parseFloat(clean);
        return isNaN(n) ? 0 : n;
    };

    // 4. Agrupación Atómica: Buques Estándar y Subtotales
    const vesselBlocks: AtomicBlock[] = [];
    const subtotalBlocks: AtomicBlock[] = [];
    let currentBlock: AtomicBlock | null = null;

    rawRows.forEach(r => {
        if (r.isFleet || r.isAccum) return; // Se sintetizan al final con desglose completo de 15 filas

        const upperMetric = r.metric.toUpperCase();
        const isStartOfVessel = upperMetric.includes('VIAJES') || upperMetric.includes('FREQ');
        const isSubtotalBlock = r.isSubtotal;

        let shouldStartNewBlock = false;
        if (!currentBlock) {
            shouldStartNewBlock = true;
        } else if (isSubtotalBlock !== currentBlock.isSubtotal) {
            shouldStartNewBlock = true;
        } else if (!isSubtotalBlock) {
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
                isFleet: false,
                isAccum: false,
                rows: []
            };
            if (isSubtotalBlock) {
                subtotalBlocks.push(currentBlock);
            } else {
                vesselBlocks.push(currentBlock);
            }
        }

        currentBlock.rows.push({
            metric: r.metric,
            values: r.values.map(v => formatNumericCell(v, r.metric))
        });
    });

    // 5. Garantía de Despliegue Completo: TOTAL FLOTA y TOTAL ACUMULADO con DESGLOSE DE NET REVENUE (15 Filas)
    const fleetMonthlyTotals: Record<string, number[]> = {
        trips: Array(numMonths).fill(0),
        days: Array(numMonths).fill(0),
        tons: Array(numMonths).fill(0),
        netRev: Array(numMonths).fill(0),
        freight: Array(numMonths).fill(0),
        demurrage: Array(numMonths).fill(0),
        dockageRev: Array(numMonths).fill(0),
        grossRev: Array(numMonths).fill(0),
        commissions: Array(numMonths).fill(0),
        hire: Array(numMonths).fill(0),
        bunker: Array(numMonths).fill(0),
        port: Array(numMonths).fill(0),
        dockageCost: Array(numMonths).fill(0),
        arriendo: Array(numMonths).fill(0),
        pl: Array(numMonths).fill(0)
    };

    vesselBlocks.forEach(vb => {
        vb.rows.forEach(r => {
            const up = r.metric.toUpperCase();
            let key = '';
            if (up.includes('VIAJE') || up.includes('FREQ')) key = 'trips';
            else if (!up.includes('HIRE') && (up.includes('DÍA') || up.includes('DAYS'))) key = 'days';
            else if (up.includes('TONELADA') || up.includes('TONS') || up.includes('MT')) key = 'tons';
            else if (up.includes('NET REVENUE') || up.includes('VENTAS')) key = 'netRev';
            else if (up.includes('FREIGHT')) key = 'freight';
            else if (up.includes('DEMURRAGE')) key = 'demurrage';
            else if (up.includes('DOCKAGE') && up.includes('REVENUE')) key = 'dockageRev';
            else if (up.includes('GROSS REVENUE')) key = 'grossRev';
            else if (up.includes('COMISIONES')) key = 'commissions';
            else if (up.includes('HIRE')) key = 'hire';
            else if (up.includes('BUNKER')) key = 'bunker';
            else if (up.includes('PORT') && !up.includes('DOCKAGE')) key = 'port';
            else if (up.includes('DOCKAGE')) key = 'dockageCost';
            else if (up.includes('ARRIENDO')) key = 'arriendo';
            else if (up.includes('VOYAGE RESULT') || up.includes('MARGEN') || up.includes('P&L')) key = 'pl';

            if (key && fleetMonthlyTotals[key]) {
                r.values.slice(0, numMonths).forEach((vStr, mIdx) => {
                    fleetMonthlyTotals[key][mIdx] += parseNum(vStr);
                });
            }
        });
    });

    // Si las subfilas de Net Revenue no vinieron explicitas por estar colapsadas, calcularlas matematicamente
    for (let mIdx = 0; mIdx < numMonths; mIdx++) {
        if (fleetMonthlyTotals.freight[mIdx] === 0 && fleetMonthlyTotals.netRev[mIdx] > 0) {
            fleetMonthlyTotals.freight[mIdx] = fleetMonthlyTotals.netRev[mIdx];
            fleetMonthlyTotals.dockageRev[mIdx] = fleetMonthlyTotals.dockageCost[mIdx];
            fleetMonthlyTotals.grossRev[mIdx] = fleetMonthlyTotals.freight[mIdx] + fleetMonthlyTotals.demurrage[mIdx] + fleetMonthlyTotals.dockageRev[mIdx];
            fleetMonthlyTotals.commissions[mIdx] = fleetMonthlyTotals.dockageRev[mIdx]; // comisiones / ajustes
        }
    }

    // Estructura de 15 filas con Desglose de Net Revenue
    const full15MetricDefinitions = [
        { name: 'Viajes', key: 'trips', isSub: false, isBold: false },
        { name: 'Días-Buque', key: 'days', isSub: false, isBold: false },
        { name: 'Toneladas', key: 'tons', isSub: false, isBold: false },
        { name: 'Net Revenue', key: 'netRev', isSub: false, isBold: true },
        { name: '↳ (+) Freight Revenue', key: 'freight', isSub: true, isBold: false },
        { name: '↳ (+) Demurrage', key: 'demurrage', isSub: true, isBold: false },
        { name: '↳ (+) Dockage Revenue', key: 'dockageRev', isSub: true, isBold: false },
        { name: '↳ (=) Gross Revenue', key: 'grossRev', isSub: true, isBold: false },
        { name: '↳ (-) Comisiones', key: 'commissions', isSub: true, isBold: false },
        { name: '(-) Hire (TCE x días)', key: 'hire', isSub: false, isBold: false },
        { name: '(-) Bunker Costs', key: 'bunker', isSub: false, isBold: false },
        { name: '(-) Port Costs', key: 'port', isSub: false, isBold: false },
        { name: '(-) Dockage', key: 'dockageCost', isSub: false, isBold: false },
        { name: '(-) Arriendo de Naves', key: 'arriendo', isSub: false, isBold: false },
        { name: '(=) VOYAGE RESULT / P&L', key: 'pl', isSub: false, isBold: true }
    ];

    // Construir Bloque TOTAL FLOTA (15 filas completas)
    const fleetBlock: AtomicBlock = {
        client: 'TOTAL FLOTA',
        route: 'FLOTA',
        vessel: 'TODOS',
        clientCls: 'bg-slate-800 text-white',
        routeCls: 'bg-slate-800 text-white',
        vesselCls: 'bg-slate-800 text-white',
        isSubtotal: false,
        isFleet: true,
        isAccum: false,
        rows: full15MetricDefinitions.map(def => {
            const monthlyVals = fleetMonthlyTotals[def.key] || Array(numMonths).fill(0);
            const sumTot = monthlyVals.reduce((a, b) => a + b, 0);
            const valStrings = monthlyVals.map(n => formatNumericCell(String(n), def.name));
            valStrings.push(formatNumericCell(String(sumTot), def.name)); // Total Acum
            return {
                metric: def.name,
                values: valStrings
            };
        })
    };

    // Construir Bloque TOTAL ACUMULADO (15 filas progresivas completas)
    const accumMonthlyTotals: Record<string, number[]> = {};
    Object.keys(fleetMonthlyTotals).forEach(key => {
        accumMonthlyTotals[key] = Array(numMonths).fill(0);
        let runningSum = 0;
        for (let colIdx = 0; colIdx < numMonths; colIdx++) {
            runningSum += fleetMonthlyTotals[key][colIdx];
            accumMonthlyTotals[key][colIdx] = runningSum;
        }
    });

    const accumBlock: AtomicBlock = {
        client: 'TOTAL ACUMULADO',
        route: 'PROGRESIVO',
        vessel: 'YTD',
        clientCls: 'bg-petral-teal text-white',
        routeCls: 'bg-petral-teal text-white',
        vesselCls: 'bg-petral-teal text-white',
        isSubtotal: false,
        isFleet: false,
        isAccum: true,
        rows: full15MetricDefinitions.map(def => {
            const monthlyVals = accumMonthlyTotals[def.key] || Array(numMonths).fill(0);
            const endTot = monthlyVals[monthlyVals.length - 1] || 0;
            const valStrings = monthlyVals.map(n => formatNumericCell(String(n), def.name));
            valStrings.push(formatNumericCell(String(endTot), def.name)); // Total Acum
            return {
                metric: def.name,
                values: valStrings
            };
        })
    };

    // Unir todos los bloques en el orden contable correcto
    const allBlocks: AtomicBlock[] = [...vesselBlocks, ...subtotalBlocks, fleetBlock, accumBlock];

    // 6. Paginación Óptima (Límite: 30 filas por hoja)
    const MAX_ROWS_PER_PAGE = 30;
    interface PageStructure {
        blocks: AtomicBlock[];
        totalRows: number;
    }

    const pages: PageStructure[] = [];
    let activePage: PageStructure = { blocks: [], totalRows: 0 };

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
    const formattedDate = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // 7. Renderizado de Páginas con Rotación Vectorial SVG y Fusión Vertical Jerárquica
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

            const isFleet = b.isFleet;
            const isAccum = b.isAccum;
            const isSub = b.isSubtotal;

            const cColor = isAccum ? { bg: '#c3e4e1', fg: '#115e59' } : (isFleet ? { bg: '#c7cace', fg: '#0f172a' } : (getDimensionColor(b.clientCls, b.client) || { bg: '#c0dae8', fg: '#0369a1' }));
            const rColor = isAccum ? { bg: '#c3e4e1', fg: '#115e59' } : (isFleet ? { bg: '#c7cace', fg: '#0f172a' } : (getDimensionColor(b.routeCls, b.route) || { bg: '#e9d5fd', fg: '#6b21a8' }));
            const vColor = isAccum ? { bg: '#c3e4e1', fg: '#115e59' } : (isFleet ? { bg: '#c7cace', fg: '#0f172a' } : (getDimensionColor(b.vesselCls, b.vessel) || { bg: '#c5e8d2', fg: '#166534' }));

            const isClientFirst = !renderedClients.has(cKey);
            if (isClientFirst) renderedClients.add(cKey);

            const isRouteFirst = !renderedRoutes.has(rKey);
            if (isRouteFirst) renderedRoutes.add(rKey);

            return b.rows.map((row, rIdx) => {
                const isVesselFirst = rIdx === 0;
                const trClass = isAccum ? 'tr-global-accum' : (isFleet ? 'tr-fleet-total' : (isSub ? 'tr-subtotal' : 'tr-data-row'));

                return `
                <tr class="${trClass}">
                    ${isClientFirst && rIdx === 0 ? `
                        <td rowspan="${clientSpan}" class="td-dimension" style="background-color: ${cColor.bg} !important;">
                            ${createVerticalSvg(b.client, clientSpan, cColor.fg)}
                        </td>
                    ` : ''}
                    ${isRouteFirst && rIdx === 0 ? `
                        <td rowspan="${routeSpan}" class="td-dimension" style="background-color: ${rColor.bg} !important;">
                            ${createVerticalSvg(b.route, routeSpan, rColor.fg)}
                        </td>
                    ` : ''}
                    ${isVesselFirst ? `
                        <td rowspan="${vesselSpan}" class="td-dimension" style="background-color: ${vColor.bg} !important;">
                            ${createVerticalSvg(b.vessel, vesselSpan, vColor.fg)}
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

            <!-- 2. Grilla Contable con THEAD Oficial: C, R, B -->
            <table class="data-table">
                <thead>
                    <tr>
                        <th class="th-dim" style="width: 13px;">C</th>
                        <th class="th-dim" style="width: 13px;">R</th>
                        <th class="th-dim" style="width: 13px;">B</th>
                        <th class="th-metric" style="width: 129px;">MÉTRICA</th>
                        ${safeMonths.map(m => `<th class="th-month" style="width: 63px;">${m}</th>`).join('')}
                        <th class="th-total" style="width: 70px;">${totalHeader}</th>
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
            font-family: 'Segoe UI', Arial, 'DejaVu Sans', sans-serif !important;
            font-variant-numeric: tabular-nums;
            -webkit-font-feature-settings: "tnum";
            font-feature-settings: "tnum";
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
            padding: 3px 6px;
            border-radius: 0 !important;
            text-align: center;
            margin: 2px 0 3px 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            letter-spacing: 0.3px;
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
        
        /* Celdas de Dimensiones Verticales (C, R, B) con ROTACIÓN VECTORIAL SVG 100% BLINDADA */
        td.td-dimension {
            width: 13px !important;
            max-width: 13px !important;
            min-width: 13px !important;
            text-align: center !important;
            vertical-align: middle !important;
            padding: 0 !important;
        }

        /* Columna 4: Nombres de Métricas (129px) */
        td.td-metric-name {
            width: 129px !important;
            min-width: 129px !important;
            max-width: 129px !important;
            text-align: left !important;
            font-weight: 500 !important;
            color: #0f172a;
            padding-left: 4px;
            writing-mode: horizontal-tb !important;
            transform: none !important;
            white-space: nowrap !important;
            font-size: 9px !important;
        }
        .pl-subrow {
            padding-left: 10px !important;
            color: #475569 !important;
            font-size: 8.5px !important;
        }

        /* Columnas de Datos (Meses a 63px, Fuente 9.5px) */
        td.td-num {
            width: 63px !important;
            max-width: 63px !important;
            text-align: right !important;
            font-size: 9.5px !important;
            font-weight: 500 !important;
            color: #1e293b;
            padding-right: 2px;
            padding-left: 2px;
            letter-spacing: -0.1px;
        }
        td.td-empty {
            width: 63px !important;
            max-width: 63px !important;
            text-align: center;
            color: #cbd5e1;
        }
        /* Columna Total Acumulado (70px) */
        td.td-total-cell {
            width: 70px !important;
            max-width: 70px !important;
            min-width: 70px !important;
            font-size: 9.5px !important;
            font-weight: 700 !important;
            color: #0f172a !important;
            padding-right: 2px;
            padding-left: 2px;
            letter-spacing: -0.1px;
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
