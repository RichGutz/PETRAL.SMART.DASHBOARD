/**
 * SERVICIO DEDICADO DE EXPORTACIÓN A PDF PARA MATRIZ NAVITRANSO (100% AISLADO)
 * 
 * Basado en el motor canónico de paginación atómica y compaginación de 35 filas por hoja (2 combos/página),
 * preservación del orden contable por cliente (subtotales inmediatamente tras sus buques),
 * desglose contable completo de 15 métricas de Navitranso, fusión jerárquica blindada,
 * eliminación de desfases de columnas, y márgenes A4 Landscape (4mm 5mm).
 */

import { LOGO_PETRAL_BASE64, LOGO_GEEKSOFT_BASE64 } from '../assets/logosBase64';

// Paleta corporativa oficial homologada
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

function createVerticalSvg(text: string, rowSpan: number, fill: string = '#ffffff'): string {
    const height = Math.max(35, rowSpan * 18);
    const midY = -height / 2;
    return `
    <svg width="24" height="${height}" viewBox="0 0 24 ${height}" style="display: block; margin: 0 auto; overflow: visible;">
        <text x="${midY}" y="15" transform="rotate(-90)" text-anchor="middle" fill="${fill}" font-family="Consolas, 'Courier New', monospace" font-size="8.5" font-weight="bold" letter-spacing="0.5">${text}</text>
    </svg>
    `;
}

interface ParsedNavRow {
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

    // 2. Extraer todas las filas con Matriz de Ocupación 2D
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
    const rawRows: ParsedNavRow[] = [];
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

                if (selectEl) {
                    textValue = selectEl.value || (vertDiv ? vertDiv.textContent?.trim() : '') || '';
                } else if (inputEl) {
                    textValue = inputEl.value;
                } else if (vertDiv) {
                    textValue = vertDiv.textContent?.trim() || '';
                } else {
                    const cellClone = td.cloneNode(true) as HTMLElement;
                    cellClone.querySelectorAll('svg, select, input, button, [class*="text-[8.5px]"], [class*="bg-slate-200"]').forEach(el => el.remove());
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

            const isSub = lastRoute.toUpperCase().includes('SUBTOTAL') || lastVessel.toUpperCase().includes('TOTAL CLIENT') || lastClient.toUpperCase().includes('SUBTOTAL') || lastVessel.toUpperCase().includes('TOTAL ');
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

    // 3. Formateo Numérico Estricto
    const formatNumericCell = (valStr: string, metricName: string): string => {
        const rawClean = valStr.replace(/[\$,\s]/g, '');
        const upperMetric = metricName.toUpperCase();
        const isPercent = valStr.includes('%') || upperMetric.includes('%') || (upperMetric.includes('MARGEN') && upperMetric.includes('%'));
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
        if (upperMetric.includes('BASE FLETE') || upperMetric.includes('TONELADA') || upperMetric.includes('TONS') || upperMetric.includes('CARGA')) {
            return Math.round(parsedNum).toLocaleString('en-US');
        }
        if (parsedNum < 0) {
            return '-$' + Math.round(Math.abs(parsedNum)).toLocaleString('en-US');
        }
        return '$' + Math.round(parsedNum).toLocaleString('en-US');
    };

    // 4. Agrupación Atómica en Orden Contable Canónico (Los subtotales van inmediatamente tras sus buques)
    const allOrderedBlocks: NavAtomicBlock[] = [];
    let currentBlock: NavAtomicBlock | null = null;

    rawRows.forEach(r => {
        const isSubtotalBlock = r.isSubtotal;
        const isFleetBlock = r.isFleet;
        const isAccumBlock = r.isAccum;
        const isStartOfVessel = r.metric.toUpperCase().includes('VIAJES') || r.metric.toUpperCase().includes('FREQ');

        let shouldStartNewBlock = false;
        if (!currentBlock) {
            shouldStartNewBlock = true;
        } else if (isFleetBlock !== currentBlock.isFleet || isAccumBlock !== currentBlock.isAccum || isSubtotalBlock !== currentBlock.isSubtotal) {
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
            allOrderedBlocks.push(currentBlock);
        }

        currentBlock.rows.push({
            metric: r.metric,
            values: r.values.map(v => formatNumericCell(v, r.metric))
        });
    });

    // 5. Paginación Óptima (Límite: 30 filas por hoja para albergar exactamente 2 COMBOS por página)
    const MAX_ROWS_PER_PAGE = 30;
    interface PageStructure {
        blocks: NavAtomicBlock[];
        totalRows: number;
    }

    const pages: PageStructure[] = [];
    let activePage: PageStructure = { blocks: [], totalRows: 0 };

    allOrderedBlocks.forEach(block => {
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

    // 6. Renderizado de Páginas con Fusión Jerárquica y Cero Desfase de Columnas
    const pagesHtml = pages.map((p, pageIdx) => {
        const clientSpanMap = new Map<string, number>();
        const routeSpanMap = new Map<string, number>();

        p.blocks.forEach(b => {
            const rowCount = b.rows.length;
            if (!b.isSubtotal && !b.isFleet && !b.isAccum) {
                const cKey = b.client;
                const rKey = `${b.client}____${b.route}`;
                clientSpanMap.set(cKey, (clientSpanMap.get(cKey) || 0) + rowCount);
                routeSpanMap.set(rKey, (routeSpanMap.get(rKey) || 0) + rowCount);
            }
        });

        const renderedClients = new Set<string>();
        const renderedRoutes = new Set<string>();

        const tbodyHtml = p.blocks.map(b => {
            const rowCount = b.rows.length;
            const isFleet = b.isFleet;
            const isAccum = b.isAccum;
            const isSub = b.isSubtotal;

            const cColor = isAccum ? { bg: '#0d9488', fg: '#ffffff' } : (isFleet ? { bg: '#1e293b', fg: '#fbbf24' } : (getDimensionColor(b.clientCls, b.client) || { bg: '#0369a1', fg: '#ffffff' }));
            const rColor = isAccum ? { bg: '#0d9488', fg: '#ccfbf1' } : (isFleet ? { bg: '#1e293b', fg: '#94a3b8' } : (getDimensionColor(b.routeCls, b.route) || { bg: '#a855f7', fg: '#ffffff' }));
            const vColor = isAccum ? { bg: '#0d9488', fg: '#ccfbf1' } : (isFleet ? { bg: '#1e293b', fg: '#94a3b8' } : (getDimensionColor(b.vesselCls, b.vessel) || { bg: '#16a34a', fg: '#ffffff' }));

            if (isFleet) {
                return b.rows.map((row, rIdx) => {
                    const isFirst = rIdx === 0;
                    const isMargen = row.metric.toUpperCase().includes('MARGEN BRUTO');
                    const isHeader = row.metric.toUpperCase().includes('VENTAS') || row.metric.toUpperCase().includes('COSTOS DIRECTOS') || row.metric.toUpperCase().includes('TIME CHARTER EQUIVALENT');
                    const trClass = isMargen ? 'tr-nav-margen' : (isHeader ? 'tr-fleet-total' : 'tr-data-row');

                    return `
                    <tr class="${trClass}">
                        ${isFirst ? `
                            <td colspan="3" rowspan="${rowCount}" class="td-dimension" style="background-color: #1e293b !important; color: #ffffff !important; font-weight: 900; font-size: 8.5px; text-align: center; vertical-align: middle;">
                                TOTAL FLOTA
                            </td>
                        ` : ''}
                        <td class="td-metric-name ${row.metric.startsWith('↳') || row.metric.startsWith('  ') ? 'pl-subrow' : ''}">
                            ${row.metric}
                        </td>
                        ${row.values.map((v, valIdx) => {
                            const isTotalCol = valIdx === row.values.length - 1;
                            return `<td class="${v ? 'td-num' : 'td-empty'} ${isTotalCol ? 'td-total-cell' : ''}">${v}</td>`;
                        }).join('')}
                    </tr>
                    `;
                }).join('');
            }

            if (isAccum) {
                return b.rows.map((row, rIdx) => {
                    const isFirst = rIdx === 0;
                    const isMargen = row.metric.toUpperCase().includes('MARGEN BRUTO');
                    const isHeader = row.metric.toUpperCase().includes('VENTAS') || row.metric.toUpperCase().includes('COSTOS DIRECTOS') || row.metric.toUpperCase().includes('TIME CHARTER EQUIVALENT');
                    const trClass = isMargen ? 'tr-nav-margen' : (isHeader ? 'tr-global-accum' : 'tr-data-row');

                    return `
                    <tr class="${trClass}">
                        ${isFirst ? `
                            <td colspan="3" rowspan="${rowCount}" class="td-dimension" style="background-color: #0d9488 !important; color: #ffffff !important; font-weight: 900; font-size: 8.5px; text-align: center; vertical-align: middle;">
                                TOTAL ACUMULADO
                            </td>
                        ` : ''}
                        <td class="td-metric-name ${row.metric.startsWith('↳') || row.metric.startsWith('  ') ? 'pl-subrow' : ''}">
                            ${row.metric}
                        </td>
                        ${row.values.map((v, valIdx) => {
                            const isTotalCol = valIdx === row.values.length - 1;
                            return `<td class="${v ? 'td-num' : 'td-empty'} ${isTotalCol ? 'td-total-cell' : ''}">${v}</td>`;
                        }).join('')}
                    </tr>
                    `;
                }).join('');
            }

            if (isSub) {
                const subClientName = b.client.replace(/Σ|SUBTOTAL|TOTAL/gi, '').trim() || 'CLIENTE';
                return b.rows.map((row, rIdx) => {
                    const isFirst = rIdx === 0;
                    const isMargen = row.metric.toUpperCase().includes('MARGEN BRUTO');
                    const isHeader = row.metric.toUpperCase().includes('VENTAS') || row.metric.toUpperCase().includes('COSTOS DIRECTOS') || row.metric.toUpperCase().includes('TIME CHARTER EQUIVALENT');
                    const trClass = isMargen ? 'tr-nav-margen' : (isHeader ? 'tr-subtotal' : 'tr-data-row');

                    return `
                    <tr class="${trClass}">
                        ${isFirst ? `
                            <td rowspan="${rowCount}" class="td-dimension" style="background-color: ${cColor.bg} !important;">
                                ${createVerticalSvg(subClientName, rowCount, cColor.fg)}
                            </td>
                            <td rowspan="${rowCount}" class="td-dimension" style="background-color: #1e293b !important;">
                                ${createVerticalSvg('Σ SUBTOTAL', rowCount, '#fbbf24')}
                            </td>
                            <td rowspan="${rowCount}" class="td-dimension" style="background-color: #1e293b !important;">
                                ${createVerticalSvg('TOTAL ' + subClientName, rowCount, '#fbbf24')}
                            </td>
                        ` : ''}
                        <td class="td-metric-name ${row.metric.startsWith('↳') || row.metric.startsWith('  ') ? 'pl-subrow' : ''}">
                            ${row.metric}
                        </td>
                        ${row.values.map((v, valIdx) => {
                            const isTotalCol = valIdx === row.values.length - 1;
                            return `<td class="${v ? 'td-num' : 'td-empty'} ${isTotalCol ? 'td-total-cell' : ''}">${v}</td>`;
                        }).join('')}
                    </tr>
                    `;
                }).join('');
            }

            // Bloque Regular de Buque (Vessel)
            const cKey = b.client;
            const rKey = `${b.client}____${b.route}`;
            const clientSpan = clientSpanMap.get(cKey) || rowCount;
            const routeSpan = routeSpanMap.get(rKey) || rowCount;
            const vesselSpan = rowCount;

            const isClientFirst = !renderedClients.has(cKey);
            if (isClientFirst) renderedClients.add(cKey);

            const isRouteFirst = !renderedRoutes.has(rKey);
            if (isRouteFirst) renderedRoutes.add(rKey);

            return b.rows.map((row, rIdx) => {
                const isVesselFirst = rIdx === 0;
                const isMargen = row.metric.toUpperCase().includes('MARGEN BRUTO');
                const isHeaderBlock = row.metric.toUpperCase().includes('INGRESOS DE OPERACIÓN') || 
                                      row.metric.toUpperCase().includes('VENTAS') ||
                                      row.metric.toUpperCase().includes('COSTOS DIRECTOS') || 
                                      row.metric.toUpperCase().includes('TIME CHARTER EQUIVALENT');
                const isSubRow = row.metric.startsWith('↳') || row.metric.startsWith('  ');

                let trClass = 'tr-data-row';
                if (isMargen) trClass = 'tr-nav-margen';
                else if (isHeaderBlock) trClass = 'tr-nav-block-header';

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
                    <td class="td-metric-name ${isSubRow ? 'pl-subrow' : ''}">
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
                        <div class="report-sub-title">MATRIZ FINANCIERA • FORMATO NAVITRANSO</div>
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
                        <th class="th-metric" style="width: 135px;">MÉTRICA NAVITRANSO</th>
                        ${safeMonths.map(m => `<th class="th-month" style="width: 58px;">${m}</th>`).join('')}
                        <th class="th-total" style="width: 66px;">${totalHeader}</th>
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
    <title>NAVIERA PETRAL S.A. - Matriz Financiera NAVITRANSO</title>
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
            font-size: 8.5px !important;
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
            margin-bottom: 2px;
        }
        .top-header-table td {
            border: none !important;
            padding: 0 !important;
            vertical-align: middle;
        }
        .logo-geeksoft {
            height: 38px;
            width: auto;
            object-fit: contain;
        }
        .logo-petral {
            height: 16px;
            width: auto;
            object-fit: contain;
        }
        .report-main-title {
            font-weight: 700;
            font-size: 12px;
            color: #0f172a;
            margin: 0;
            text-transform: uppercase;
            text-align: center;
            letter-spacing: 0.4px;
            line-height: 1.1;
        }
        .report-sub-title {
            font-size: 8.5px;
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
            font-size: 8px;
            text-transform: uppercase;
            padding: 2px 8px;
            border-radius: 3px;
            text-align: center;
            margin: 2px auto 2px auto;
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
            font-size: 8.5px !important;
            font-weight: normal !important;
            line-height: 1.1;
        }
        table.data-table th {
            background-color: #1e293b !important;
            color: #ffffff !important;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 8.5px;
            padding: 2px 1px;
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
            padding: 1px 2px;
            vertical-align: middle;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: normal !important;
            height: 16px !important;
            max-height: 16px !important;
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

        /* Columna 4: Nombres de Métricas */
        td.td-metric-name {
            width: 135px !important;
            min-width: 135px !important;
            max-width: 135px !important;
            text-align: left !important;
            font-weight: normal !important;
            color: #0f172a;
            padding-left: 4px;
            writing-mode: horizontal-tb !important;
            transform: none !important;
            white-space: nowrap !important;
            font-size: 8.5px !important;
        }
        .pl-subrow {
            padding-left: 10px !important;
            color: #475569 !important;
            font-size: 7.5px !important;
        }

        /* Columnas de Datos */
        td.td-num {
            width: 58px !important;
            max-width: 58px !important;
            text-align: right !important;
            font-size: 8.5px !important;
            font-weight: normal !important;
            color: #1e293b;
            padding-right: 2px;
            letter-spacing: -0.2px;
        }
        td.td-empty {
            width: 58px !important;
            max-width: 58px !important;
            text-align: center;
            color: #cbd5e1;
        }
        /* Columna Total Acumulado */
        td.td-total-cell {
            width: 66px !important;
            max-width: 66px !important;
            min-width: 66px !important;
            font-size: 7.5px !important;
            font-weight: 700 !important;
            color: #0f172a !important;
            letter-spacing: -0.2px;
        }

        /* Filas Especiales */
        tr.tr-subtotal td {
            background-color: #fffbeb !important;
            color: #1e293b;
            border-top: 1px solid #fbbf24;
            border-bottom: 1px solid #fbbf24;
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
            border-top: 1.5px solid #0d9488;
            border-bottom: 1.5px solid #0d9488;
            font-weight: 700 !important;
        }
        tr.tr-nav-margen td {
            background-color: #eef2ff !important;
            color: #312e81;
            font-weight: 700 !important;
        }
        tr.tr-nav-block-header td {
            background-color: #f8fafc !important;
            font-weight: 700 !important;
            color: #0f172a;
        }
        tr.tr-data-row:nth-child(even) td:not(.td-dimension) {
            background-color: #f8fafc;
        }

        /* 3. Pie de Página Institucional */
        .page-footer {
            width: 100%;
            margin-top: 2px;
            border-top: 1px solid #cbd5e1;
            padding-top: 1.5px;
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
