/**
 * SERVICIO DEDICADO DE EXPORTACIÓN A PDF PARA MATRIZ NAVITRANSO (100% AISLADO)
 * 
 * Basado en la arquitectura de matriz 2D ocupada para resolución perfecta de rowSpan/colSpan,
 * formateo de 12 meses A4 Landscape, rotación SVG y paginación atómica sin desbordes.
 */

import { LOGO_PETRAL_BASE64, LOGO_GEEKSOFT_BASE64 } from '../assets/logosBase64';

const NAVITRANSO_COLOR_MAP: Record<string, { bg: string; fg: string }> = {
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

function getNavitransoDimensionColor(className: string, text: string): { bg: string; fg: string } | null {
    for (const [cls, colors] of Object.entries(NAVITRANSO_COLOR_MAP)) {
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
    if (upper.includes('TOTAL FLOTA') || upper.includes('TOTAL GENERAL')) return { bg: '#1e293b', fg: '#ffffff' };
    if (upper.includes('SUBTOTAL') || upper.includes('TOTAL CLIENT') || upper.includes('TOTAL ')) return { bg: '#1e293b', fg: '#fbbf24' };
    return null;
}

function createVerticalSvg(text: string, rowSpan: number, fill: string = '#ffffff'): string {
    const height = Math.max(30, rowSpan * 16.5);
    const midY = -height / 2;
    return `
    <svg width="20" height="${height}" viewBox="0 0 20 ${height}" style="display: block; margin: 0 auto; overflow: visible;">
        <text x="${midY}" y="13.5" transform="rotate(-90)" text-anchor="middle" fill="${fill}" font-family="Consolas, 'Courier New', monospace" font-size="8" font-weight="bold" letter-spacing="0.3">${text}</text>
    </svg>
    `;
}

interface RawNavRow {
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

interface NavAtomicBlock {
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

export function generateFinancialMatrixNavitransoPdfHtml(
    tableId: string = 'forecast-grid-table',
    _orientation: 'portrait' | 'landscape' = 'landscape',
    scenarioName: string = 'Escenario de Proyección NAVITRANSO'
): string {
    const table = document.getElementById(tableId) as HTMLTableElement;
    if (!table) {
        throw new Error('No se encontró la tabla de Matriz Financiera NAVITRANSO en el DOM.');
    }

    // 1. Extraer Columnas del THEAD y formatear nombres de meses
    const headerCols: string[] = [];
    const thead = table.querySelector('thead');
    if (thead) {
        const ths = thead.querySelectorAll('th');
        ths.forEach(th => {
            const span = th.querySelector('span');
            let clean = (span && span.textContent ? span.textContent : th.textContent || '').trim().toUpperCase();
            clean = clean.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ');

            // Formatear meses "2027-01" -> "ENE 27"
            if (/^\d{4}-\d{2}$/.test(clean)) {
                const [year, month] = clean.split('-');
                const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];
                const mIdx = parseInt(month, 10) - 1;
                clean = `${monthNames[mIdx]} ${year.slice(2)}`;
            }
            headerCols.push(clean);
        });
    }

    const monthCols = headerCols.slice(4);

    // 2. Matriz de Ocupación 2D para Extracción Celda por Celda Robusta
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
    let lastClient = '';
    let lastRoute = '';
    let lastVessel = '';
    let lastClientCls = '';
    let lastRouteCls = '';
    let lastVesselCls = '';

    const rawRows: RawNavRow[] = [];

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

                if (selectEl) {
                    textValue = selectEl.value || (vertDiv ? vertDiv.textContent?.trim() : '') || '';
                } else if (inputEl) {
                    textValue = inputEl.value;
                } else if (vertDiv) {
                    textValue = vertDiv.textContent?.trim() || '';
                } else {
                    const cellClone = td.cloneNode(true) as HTMLElement;
                    cellClone.querySelectorAll('svg, select, input, button').forEach(el => el.remove());
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

            const isSub = lastRoute.toUpperCase().includes('SUBTOTAL') || lastVessel.toUpperCase().includes('TOTAL ') || lastClient.toUpperCase().includes('SUBTOTAL');
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
                isFleet,
                isAccum
            });

            currentRow++;
        });
    }

    // 3. Formateador Numérico Estricto
    const formatNumericCell = (valStr: string, metricName: string): string => {
        if (!valStr || valStr === '-' || valStr.trim() === '') return '-';
        const rawClean = valStr.replace(/[\$,\s]/g, '');
        const upperMetric = metricName.toUpperCase();
        const isPercent = valStr.includes('%') || upperMetric.includes('%') || upperMetric.includes('MARGEN') && upperMetric.includes('%');
        const cleanNumStr = rawClean.replace('%', '');

        if (isNaN(Number(cleanNumStr)) || cleanNumStr === '') return valStr;

        const parsedNum = parseFloat(cleanNumStr);
        if (parsedNum === 0) return '-';

        if (isPercent) {
            return (parsedNum > 1 ? parsedNum : parsedNum * 100).toFixed(1) + '%';
        }
        if (upperMetric.includes('VIAJE') || upperMetric.includes('FREQ')) {
            return Number.isInteger(parsedNum) ? parsedNum.toLocaleString('en-US') : parsedNum.toFixed(1);
        }
        if (upperMetric.includes('BASE FLETE') || upperMetric.includes('TONELADA') || upperMetric.includes('TONS') || upperMetric.includes('CARGA')) {
            return Math.round(parsedNum).toLocaleString('en-US');
        }
        if (parsedNum < 0) {
            return '-$' + Math.round(Math.abs(parsedNum)).toLocaleString('en-US');
        }
        return '$' + Math.round(parsedNum).toLocaleString('en-US');
    };

    // 4. Agrupación en Bloques Atómicos
    const atomicBlocks: NavAtomicBlock[] = [];
    let currentBlock: NavAtomicBlock | null = null;
    let blockKey = '';

    rawRows.forEach(r => {
        const key = `${r.client}|${r.route}|${r.vessel}|${r.isSubtotal}|${r.isFleet}|${r.isAccum}`;
        if (key !== blockKey) {
            if (currentBlock) atomicBlocks.push(currentBlock);
            blockKey = key;
            currentBlock = {
                client: r.client,
                route: r.route,
                vessel: r.vessel,
                clientCls: r.clientCls,
                routeCls: r.routeCls,
                vesselCls: r.vesselCls,
                isSubtotal: r.isSubtotal,
                isFleet: r.isFleet,
                isAccum: r.isAccum,
                rows: []
            };
        }
        if (currentBlock) {
            currentBlock.rows.push({
                metric: r.metric,
                values: r.values.map(v => formatNumericCell(v, r.metric))
            });
        }
    });
    if (currentBlock) atomicBlocks.push(currentBlock);

    // 5. Paginación Atómica Cuidadosa (Máx 24 filas por página A4 Horizontal)
    const MAX_ROWS_PER_PAGE = 24;
    const pages: NavAtomicBlock[][] = [];
    let currentPage: NavAtomicBlock[] = [];
    let currentCount = 0;

    atomicBlocks.forEach(b => {
        const bRows = b.rows.length;
        if (currentCount + bRows > MAX_ROWS_PER_PAGE && currentPage.length > 0) {
            pages.push(currentPage);
            currentPage = [b];
            currentCount = bRows;
        } else {
            currentPage.push(b);
            currentCount += bRows;
        }
    });
    if (currentPage.length > 0) pages.push(currentPage);

    const totalPages = pages.length;

    // 6. Construir HTML Paginado
    const pagesHtml = pages.map((pageBlocks, pageIdx) => {
        let tbodyHtml = '';

        pageBlocks.forEach(b => {
            const blockRowCount = b.rows.length;
            const cCol = getNavitransoDimensionColor(b.clientCls, b.client) || { bg: '#0369a1', fg: '#ffffff' };
            const rCol = getNavitransoDimensionColor(b.routeCls, b.route) || { bg: '#06b6d4', fg: '#ffffff' };
            const vCol = getNavitransoDimensionColor(b.vesselCls, b.vessel) || { bg: '#16a34a', fg: '#ffffff' };

            b.rows.forEach((r, rIdx) => {
                const isFirstRow = rIdx === 0;
                const isMargenBruto = r.metric.toUpperCase().includes('MARGEN BRUTO');
                const isHeaderBlock = r.metric.toUpperCase().includes('INGRESOS DE OPERACIÓN') || 
                                      r.metric.toUpperCase().includes('VENTAS') ||
                                      r.metric.toUpperCase().includes('COSTOS DIRECTOS') || 
                                      r.metric.toUpperCase().includes('TIME CHARTER EQUIVALENT');
                const isSubRow = r.metric.includes('↳') || r.metric.startsWith('  ');

                let rowStyle = 'height: 16.5px;';
                if (isMargenBruto) rowStyle += ' background-color: #eef2ff; font-weight: 700; color: #312e81;';
                else if (isHeaderBlock) rowStyle += ' background-color: #f8fafc; font-weight: 700; color: #0f172a;';
                else if (b.isAccum) rowStyle += ' background-color: #f0fdfa; font-weight: 600;';
                else if (b.isFleet) rowStyle += ' background-color: #f1f5f9; font-weight: 600;';
                else if (b.isSubtotal) rowStyle += ' background-color: #fffbeb; font-weight: 600;';

                let dimCellsHtml = '';
                if (isFirstRow) {
                    if (b.isFleet) {
                        dimCellsHtml = `
                        <td rowspan="${blockRowCount}" class="dim-cell" style="background-color: #1e293b; color: #ffffff; width: 60px;" colspan="3">
                            <div style="color: #ffffff; font-weight: 900; font-size: 8px; text-align: center;">TOTAL FLOTA</div>
                        </td>
                        `;
                    } else if (b.isAccum) {
                        dimCellsHtml = `
                        <td rowspan="${blockRowCount}" class="dim-cell" style="background-color: #0d9488; color: #ffffff; width: 60px;" colspan="3">
                            <div style="color: #ffffff; font-weight: 900; font-size: 8px; text-align: center;">TOTAL ACUMULADO</div>
                        </td>
                        `;
                    } else if (b.isSubtotal) {
                        const subTitle = b.client.includes('SUBTOTAL') ? b.client : `Σ SUBTOTAL ${b.client}`;
                        dimCellsHtml = `
                        <td rowspan="${blockRowCount}" class="dim-cell" style="background-color: #1e293b; color: #fbbf24; width: 60px;" colspan="3">
                            <div style="color: #fbbf24; font-weight: 900; font-size: 8px; text-align: center;">${subTitle}</div>
                        </td>
                        `;
                    } else {
                        dimCellsHtml = `
                        <td rowspan="${blockRowCount}" class="dim-cell" style="background-color: ${cCol.bg}; width: 20px;">
                            ${createVerticalSvg(b.client, blockRowCount, cCol.fg)}
                        </td>
                        <td rowspan="${blockRowCount}" class="dim-cell" style="background-color: ${rCol.bg}; width: 20px;">
                            ${createVerticalSvg(b.route, blockRowCount, rCol.fg)}
                        </td>
                        <td rowspan="${blockRowCount}" class="dim-cell" style="background-color: ${vCol.bg}; width: 20px;">
                            ${createVerticalSvg(b.vessel, blockRowCount, vCol.fg)}
                        </td>
                        `;
                    }
                }

                const metricIndent = isSubRow ? 'padding-left: 10px; color: #475569; font-size: 7px;' : 'font-size: 7.5px; font-weight: 600; padding-left: 4px;';
                const metricCellHtml = `<td class="metric-cell" style="${metricIndent} width: 140px; text-align: left;">${r.metric}</td>`;

                const valCellsHtml = r.values.map((v, valIdx) => {
                    const isTotalCol = valIdx === r.values.length - 1;
                    const totalStyle = isTotalCol ? 'background-color: #e0f2fe; font-weight: 700; color: #0369a1;' : '';
                    const cellCls = isTotalCol ? 'val-total-cell' : 'val-cell';
                    return `<td class="${cellCls}" style="${totalStyle} text-align: right; padding-right: 3px;">${v}</td>`;
                }).join('');

                tbodyHtml += `
                <tr style="${rowStyle}">
                    ${dimCellsHtml}
                    ${metricCellHtml}
                    ${valCellsHtml}
                </tr>
                `;
            });
        });

        const headerColsHtml = `
        <tr style="background-color: #1e293b; color: #ffffff; height: 20px; font-size: 7.5px; font-weight: bold;">
            <th style="width: 20px; text-align: center; border: 1px solid #334155;">CLI</th>
            <th style="width: 20px; text-align: center; border: 1px solid #334155;">RUT</th>
            <th style="width: 20px; text-align: center; border: 1px solid #334155;">BUQ</th>
            <th style="width: 140px; text-align: left; padding-left: 6px; border: 1px solid #334155;">MÉTRICA NAVITRANSO</th>
            ${monthCols.map((m, mIdx) => {
                const isTotal = mIdx === monthCols.length - 1;
                const bg = isTotal ? '#0d9488' : '#1e293b';
                const w = isTotal ? '75px' : '63px';
                return `<th style="width: ${w}; text-align: center; background-color: ${bg}; border: 1px solid #334155;">${m}</th>`;
            }).join('')}
        </tr>
        `;

        return `
        <div class="report-page">
            <div class="page-header">
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 2px;">
                    <tr>
                        <td style="width: 20%; text-align: left; vertical-align: middle;">
                            <img src="${LOGO_PETRAL_BASE64}" style="height: 20px; width: auto; object-fit: contain;" alt="Petral Logo" />
                        </td>
                        <td style="width: 60%; text-align: center; vertical-align: middle;">
                            <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.4px;">
                                MATRIZ FINANCIERA — FORMATO NAVITRANSO
                            </div>
                            <div style="font-size: 8px; font-weight: 600; color: #0284c7; margin-top: 1px;">
                                ${scenarioName}
                            </div>
                        </td>
                        <td style="width: 20%; text-align: right; vertical-align: middle;">
                            <img src="${LOGO_GEEKSOFT_BASE64}" style="height: 18px; width: auto; object-fit: contain;" alt="Geeksoft Logo" />
                        </td>
                    </tr>
                </table>
            </div>

            <div class="table-wrapper">
                <table class="matrix-table" style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                    <thead>
                        ${headerColsHtml}
                    </thead>
                    <tbody>
                        ${tbodyHtml}
                    </tbody>
                </table>
            </div>

            <div class="page-footer">
                <div class="page-footer-cell" style="text-align: left; width: 33%;">
                    CONFIDENCIAL — PETRAL & NAVITRANSO
                </div>
                <div class="page-footer-cell" style="text-align: center; width: 34%;">
                    PÁGINA ${pageIdx + 1} DE ${totalPages}
                </div>
                <div class="page-footer-cell" style="text-align: right; width: 33%;">
                    EMITIDO: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
        `;
    }).join('\n');

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>Matriz Financiera NAVITRANSO</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 6mm 5mm 6mm 5mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Consolas', 'Courier New', ui-monospace, monospace !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
            color: #0f172a;
            font-size: 7.5px;
            line-height: 1.1;
        }
        .report-page {
            width: 100%;
            page-break-after: always;
            page-break-inside: avoid;
            box-sizing: border-box;
        }
        .report-page:last-child {
            page-break-after: avoid;
        }
        .matrix-table {
            border: 1px solid #cbd5e1;
            border-collapse: collapse !important;
            table-layout: fixed;
            width: 100%;
        }
        .matrix-table th, .matrix-table td {
            border: 1px solid #cbd5e1;
            padding: 1px 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            height: 16.5px !important;
            max-height: 16.5px !important;
            vertical-align: middle;
        }
        .dim-cell {
            padding: 0 !important;
            text-align: center;
            vertical-align: middle;
            width: 20px !important;
            max-width: 20px !important;
        }
        .metric-cell {
            font-family: Consolas, "Courier New", monospace;
            width: 140px !important;
            max-width: 140px !important;
            min-width: 140px !important;
            font-size: 7.5px !important;
            font-weight: 600;
        }
        .val-cell {
            font-family: Consolas, "Courier New", monospace;
            font-size: 7.5px !important;
            letter-spacing: -0.2px;
            width: 63px !important;
            min-width: 63px !important;
            max-width: 63px !important;
        }
        .val-total-cell {
            font-family: Consolas, "Courier New", monospace;
            font-size: 7.5px !important;
            font-weight: 700;
            width: 75px !important;
            min-width: 75px !important;
            max-width: 75px !important;
        }
        .page-footer {
            width: 100%;
            margin-top: 3px;
            border-top: 1px solid #cbd5e1;
            padding-top: 2px;
            font-size: 7px;
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

export async function exportFinancialMatrixNavitransoPdf(
    tableId: string = 'forecast-grid-table',
    orientation: 'portrait' | 'landscape' = 'landscape',
    scenarioName: string = 'Escenario de Proyección NAVITRANSO'
): Promise<void> {
    const htmlContent = generateFinancialMatrixNavitransoPdfHtml(tableId, orientation, scenarioName);

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `Navitranso_Matriz_Financiera_${orientation}_${timeStamp}.pdf`;

    const apiBase = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.origin.includes('localhost') ? 'http://localhost:8000/api/v1' : '/api/v1');
    const endpoint = `${apiBase.replace(/\/+$/, '')}/utils/generate-pdf`;

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
        console.error('Error en servicio de PDF WeasyPrint NAVITRANSO:', err);
        throw err;
    }
}
