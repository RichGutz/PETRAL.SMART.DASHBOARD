/**
 * SERVICIO DEDICADO DE EXPORTACIÓN A PDF PARA MATRIZ NAVITRANSO (100% AISLADO)
 * 
 * Genera el documento PDF A4 Horizontal para la estructura contable NAVITRANSO:
 * - 4 Bloques Contables (Ingresos de Operación, Costos Directos de Viaje, TCE y Margen Bruto).
 * - Agrupación atómica por nodo (Cliente / Ruta / Buque).
 * - Paginación inteligente y micro-anchos calibrados con motor WeasyPrint.
 * - Cero interferencia con la Matriz PETRAL.
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

interface NavitransoAtomicBlock {
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

    // 1. Extraer Cabeceras
    const headerCols: string[] = [];
    const thead = table.querySelector('thead');
    if (thead) {
        const ths = thead.querySelectorAll('th');
        ths.forEach(th => {
            const span = th.querySelector('span');
            let clean = (span && span.textContent ? span.textContent : th.textContent || '').trim().toUpperCase();
            clean = clean.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ');
            headerCols.push(clean);
        });
    }

    const monthCols = headerCols.slice(4);

    // 2. Extraer Filas y Agrupar en Bloques Atómicos
    const atomicBlocks: NavitransoAtomicBlock[] = [];
    let currentBlock: NavitransoAtomicBlock | null = null;
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
            const tds = tr.querySelectorAll('td');
            const trClass = tr.className || '';
            const rowText = tr.textContent || '';

            const isFleet = rowText.includes('TOTAL FLOTA') || trClass.includes('TOTAL FLOTA');
            const isAccum = rowText.includes('TOTAL ACUMULADO') || trClass.includes('TOTAL ACUMULADO');
            const isSubtotal = rowText.includes('SUBTOTAL') || trClass.includes('subtotal') || isFleet || isAccum;

            let metricName = '';
            const vals: string[] = [];

            if (tds.length >= 4 + monthCols.length) {
                // Fila inicial de un nodo
                const cText = (tds[0]?.querySelector('.vertical-text')?.textContent || tds[0]?.textContent || '').trim();
                const rText = (tds[1]?.querySelector('.vertical-text')?.textContent || tds[1]?.textContent || '').trim();
                
                let vText = '';
                const vSel = tds[2]?.querySelector('select');
                if (vSel && (vSel as HTMLSelectElement).value) {
                    vText = (vSel as HTMLSelectElement).value;
                } else {
                    vText = (tds[2]?.querySelector('.vertical-text')?.textContent || tds[2]?.textContent || '').trim();
                }

                lastClient = cText || lastClient;
                lastRoute = rText || lastRoute;
                lastVessel = vText || lastVessel;

                lastClientCls = tds[0]?.className || '';
                lastRouteCls = tds[1]?.className || '';
                lastVesselCls = tds[2]?.className || '';

                const extractCleanCell = (cellEl: Element) => {
                    const input = cellEl.querySelector('input');
                    if (input) return (input as HTMLInputElement).value || '';
                    return (cellEl.textContent || '').trim();
                };

                metricName = (tds[3]?.textContent || '').trim();
                for (let i = 4; i < tds.length; i++) {
                    vals.push(extractCleanCell(tds[i]));
                }

                if (currentBlock) {
                    atomicBlocks.push(currentBlock);
                }

                currentBlock = {
                    client: lastClient,
                    route: lastRoute,
                    vessel: lastVessel,
                    clientCls: lastClientCls,
                    routeCls: lastRouteCls,
                    vesselCls: lastVesselCls,
                    isSubtotal,
                    isFleet,
                    isAccum,
                    rows: [{ metric: metricName, values: vals }]
                };
            } else if (tds.length > 0) {
                // Fila subsiguiente dentro del mismo nodo
                const extractCleanCell = (cellEl: Element) => {
                    const input = cellEl.querySelector('input');
                    if (input) return (input as HTMLInputElement).value || '';
                    return (cellEl.textContent || '').trim();
                };

                metricName = (tds[0]?.textContent || '').trim();
                for (let i = 1; i < tds.length; i++) {
                    vals.push(extractCleanCell(tds[i]));
                }

                if (!currentBlock) {
                    currentBlock = {
                        client: lastClient,
                        route: lastRoute,
                        vessel: lastVessel,
                        clientCls: lastClientCls,
                        routeCls: lastRouteCls,
                        vesselCls: lastVesselCls,
                        isSubtotal,
                        isFleet,
                        isAccum,
                        rows: []
                    };
                }
                currentBlock.rows.push({ metric: metricName, values: vals });
            }
        });

        if (currentBlock) {
            atomicBlocks.push(currentBlock);
        }
    }

    // 3. Paginación Atómica
    const MAX_ROWS_PER_PAGE = 36;
    const pages: NavitransoAtomicBlock[][] = [];
    let currentPage: NavitransoAtomicBlock[] = [];
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

    if (currentPage.length > 0) {
        pages.push(currentPage);
    }

    const totalPages = pages.length;

    // 4. Construir HTML Paginado
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
                                      r.metric.toUpperCase().includes('COSTOS DIRECTOS') || 
                                      r.metric.toUpperCase().includes('TIME CHARTER EQUIVALENT');
                const isSubRow = r.metric.includes('↳') || r.metric.startsWith('  ');

                let rowStyle = 'height: 18px;';
                if (isMargenBruto) rowStyle += ' background-color: #eef2ff; font-weight: bold; color: #312e81;';
                else if (isHeaderBlock) rowStyle += ' background-color: #f8fafc; font-weight: bold; color: #0f172a;';
                else if (b.isAccum) rowStyle += ' background-color: #f0fdfa; font-weight: 600;';
                else if (b.isFleet) rowStyle += ' background-color: #f8fafc; font-weight: 600;';
                else if (b.isSubtotal) rowStyle += ' background-color: #f1f5f9; font-weight: 600;';

                let dimCellsHtml = '';
                if (isFirstRow) {
                    if (b.isFleet) {
                        dimCellsHtml = `
                        <td rowspan="${blockRowCount}" class="dim-cell" style="background-color: #1e293b; color: #ffffff; width: 72px;" colspan="3">
                            <div class="horizontal-text" style="color: #ffffff; font-weight: 900; font-size: 8.5px; text-align: center;">TOTAL FLOTA</div>
                        </td>
                        `;
                    } else if (b.isAccum) {
                        dimCellsHtml = `
                        <td rowspan="${blockRowCount}" class="dim-cell" style="background-color: #0d9488; color: #ffffff; width: 72px;" colspan="3">
                            <div class="horizontal-text" style="color: #ffffff; font-weight: 900; font-size: 8.5px; text-align: center;">TOTAL ACUMULADO</div>
                        </td>
                        `;
                    } else {
                        dimCellsHtml = `
                        <td rowspan="${blockRowCount}" class="dim-cell" style="background-color: ${cCol.bg}; width: 24px;">
                            ${createVerticalSvg(b.client, blockRowCount, cCol.fg)}
                        </td>
                        <td rowspan="${blockRowCount}" class="dim-cell" style="background-color: ${rCol.bg}; width: 24px;">
                            ${createVerticalSvg(b.route, blockRowCount, rCol.fg)}
                        </td>
                        <td rowspan="${blockRowCount}" class="dim-cell" style="background-color: ${vCol.bg}; width: 24px;">
                            ${createVerticalSvg(b.vessel, blockRowCount, vCol.fg)}
                        </td>
                        `;
                    }
                }

                const metricIndent = isSubRow ? 'padding-left: 10px; color: #475569; font-size: 7.5px;' : 'font-size: 8px; font-weight: 600;';
                const metricCellHtml = `<td class="metric-cell" style="${metricIndent} width: 140px; text-align: left;">${r.metric}</td>`;

                const valCellsHtml = r.values.map((v, valIdx) => {
                    const isTotalCol = valIdx === r.values.length - 1;
                    const totalStyle = isTotalCol ? 'background-color: #e0f2fe; font-weight: bold; color: #0369a1;' : '';
                    return `<td class="val-cell" style="${totalStyle} text-align: right; width: ${isTotalCol ? '64px' : '56px'};">${v || '-'}</td>`;
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
        <tr style="background-color: #0f172a; color: #ffffff; height: 22px; font-size: 8px; font-weight: bold;">
            <th style="width: 24px; text-align: center; border: 1px solid #334155;">CLI</th>
            <th style="width: 24px; text-align: center; border: 1px solid #334155;">RUT</th>
            <th style="width: 24px; text-align: center; border: 1px solid #334155;">BUQ</th>
            <th style="width: 140px; text-align: left; padding-left: 6px; border: 1px solid #334155;">MÉTRICA NAVITRANSO</th>
            ${monthCols.map((m, mIdx) => {
                const isTotal = mIdx === monthCols.length - 1;
                const bg = isTotal ? '#0d9488' : '#0f172a';
                return `<th style="width: ${isTotal ? '64px' : '56px'}; text-align: center; background-color: ${bg}; border: 1px solid #334155;">${m}</th>`;
            }).join('')}
        </tr>
        `;

        return `
        <div class="page" style="page-break-after: ${pageIdx === totalPages - 1 ? 'auto' : 'always'};">
            <div class="page-header">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="width: 20%; text-align: left; vertical-align: middle;">
                            <img src="${LOGO_PETRAL_BASE64}" style="height: 24px; width: auto; object-fit: contain;" alt="Petral Logo" />
                        </td>
                        <td style="width: 60%; text-align: center; vertical-align: middle;">
                            <div style="font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                                MATRIZ FINANCIERA — FORMATO NAVITRANSO
                            </div>
                            <div style="font-size: 9px; font-weight: 600; color: #0284c7; margin-top: 1px;">
                                ${scenarioName}
                            </div>
                        </td>
                        <td style="width: 20%; text-align: right; vertical-align: middle;">
                            <img src="${LOGO_GEEKSOFT_BASE64}" style="height: 20px; width: auto; object-fit: contain;" alt="Geeksoft Logo" />
                        </td>
                    </tr>
                </table>
            </div>

            <div class="table-wrapper" style="margin-top: 5px;">
                <table class="matrix-table" style="width: 100%; border-collapse: collapse;">
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
            margin: 6mm 6mm 6mm 6mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            font-size: 8px;
        }
        .page {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .matrix-table {
            border: 1px solid #cbd5e1;
            table-layout: fixed;
        }
        .matrix-table th, .matrix-table td {
            border: 1px solid #e2e8f0;
            padding: 1px 3px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .dim-cell {
            padding: 0 !important;
            text-align: center;
            vertical-align: middle;
        }
        .metric-cell {
            font-family: Consolas, "Courier New", monospace;
        }
        .val-cell {
            font-family: Consolas, "Courier New", monospace;
        }
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
