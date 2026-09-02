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

interface MetricRowData {
    name: string;
    formattedValues: string[];
    formattedTotal: string;
    isNumeric: boolean;
    isSubRowMetric?: boolean;
}

interface TableBlock {
    type: 'vessel' | 'subtotal' | 'fleet' | 'accum';
    clientName: string;
    routeName: string;
    vesselName: string;
    clientColor?: { bg: string; fg: string } | null;
    routeColor?: { bg: string; fg: string } | null;
    vesselColor?: { bg: string; fg: string } | null;
    rows: MetricRowData[];
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

    // 1. Extraer Nombres de Columnas del THEAD
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

    // Si no hay thead explícito, defaults canónicos
    const safeHeaderCols = headerCols.length >= 5 ? headerCols : [
        'CLIENTE', 'RUTA', 'BUQUE', 'MÉTRICA',
        'ENE 2027', 'FEB 2027', 'MAR 2027', 'ABR 2027', 'MAY 2027', 'JUN 2027',
        'JUL 2027', 'AGO 2027', 'SET 2027', 'OCT 2027', 'NOV 2027', 'DIC 2027',
        'TOTAL ACUM'
    ];

    // 2. Extraer Filas y reconstruir Bloques Atómicos usando Matriz de Ocupación
    const occupied: boolean[][] = [];
    const setOccupied = (r: number, c: number, rSpan: number, cSpan: number) => {
        for (let row = r; row < r + rSpan; row++) {
            if (!occupied[row]) occupied[row] = [];
            for (let col = c; col < c + cSpan; col++) {
                occupied[row][col] = true;
            }
        }
    };
    const isOccupied = (r: number, c: number) => {
        return !!(occupied[r] && occupied[r][c]);
    };

    let currentRow = 1;
    const blocks: TableBlock[] = [];
    let currentBlock: TableBlock | null = null;
    let lastClientName = '';
    let lastRouteName = '';
    let lastVesselName = '';

    const tbody = table.querySelector('tbody');
    if (tbody) {
        const trs = tbody.querySelectorAll('tr');
        trs.forEach(tr => {
            let currentCol = 1;
            const tds = tr.querySelectorAll('td');
            const trClass = tr.className || '';
            const isSubtotalRow = trClass.includes('font-semibold') || trClass.includes('bg-amber-50') || trClass.includes('bg-slate-100');
            const isGlobalTotalRow = trClass.includes('bg-indigo-50') || trClass.includes('TOTAL ACUMULADO') || trClass.includes('TOTAL FLOTA');

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

                if (currentCol === 1 && textValue) {
                    rowClient = textValue;
                    clientCls = tdClass;
                } else if (currentCol === 2 && textValue) {
                    rowRoute = textValue;
                    routeCls = tdClass;
                } else if (currentCol === 3 && textValue) {
                    rowVessel = textValue;
                    vesselCls = tdClass;
                } else if (currentCol === 4) {
                    rowMetric = textValue;
                } else if (currentCol >= 5) {
                    rowValues.push(textValue);
                }

                setOccupied(currentRow, currentCol, rSpan, cSpan);
                currentCol += cSpan;
            });

            // Si es nueva combinación de Buque/Ruta/Cliente o Subtotal, iniciar nuevo Bloque Atómico
            if (rowClient) lastClientName = rowClient;
            if (rowRoute) lastRouteName = rowRoute;
            if (rowVessel) lastVesselName = rowVessel;

            const isSubtotalBlock = isSubtotalRow || lastRouteName.toUpperCase().includes('SUBTOTAL') || lastVesselName.toUpperCase().includes('TOTAL CLIENT');
            const isFleetTotalBlock = isGlobalTotalRow && lastClientName.toUpperCase().includes('TOTAL FLOTA');
            const isAccumBlock = isGlobalTotalRow && lastClientName.toUpperCase().includes('TOTAL ACUMULADO');

            let blockType: 'vessel' | 'subtotal' | 'fleet' | 'accum' = 'vessel';
            if (isAccumBlock) blockType = 'accum';
            else if (isFleetTotalBlock) blockType = 'fleet';
            else if (isSubtotalBlock) blockType = 'subtotal';

            // Detectar inicio de bloque
            const isNewBlock = !currentBlock || 
                (blockType !== currentBlock.type) || 
                (blockType === 'vessel' && (rowVessel !== '' || rowRoute !== '' || rowClient !== ''));

            if (isNewBlock) {
                currentBlock = {
                    type: blockType,
                    clientName: lastClientName,
                    routeName: lastRouteName,
                    vesselName: lastVesselName,
                    clientColor: getDimensionColor(clientCls, lastClientName),
                    routeColor: getDimensionColor(routeCls, lastRouteName),
                    vesselColor: getDimensionColor(vesselCls, lastVesselName),
                    rows: []
                };
                blocks.push(currentBlock);
            }

            // Formatear valores numéricos idéntico a Excel
            const formattedVals: string[] = [];
            let formattedTot = '';
            const rawMetric = rowMetric.toUpperCase();

            rowValues.forEach((valStr, idx) => {
                const rawClean = valStr.replace(/[\$,\s]/g, '');
                const isPercent = valStr.includes('%') || rawMetric.includes('%') || rawMetric.includes('MARGEN') || rawMetric.includes('YIELD %');
                const cleanNumStr = rawClean.replace('%', '');

                let formatted = '';
                if (valStr !== '-' && valStr !== '' && !isNaN(Number(cleanNumStr)) && cleanNumStr !== '') {
                    const parsedNum = parseFloat(cleanNumStr);
                    if (parsedNum !== 0) {
                        if (isPercent) {
                            formatted = (parsedNum > 1 ? parsedNum : parsedNum * 100).toFixed(1) + '%';
                        } else if (
                            rawMetric.includes('VIAJE') || rawMetric.includes('FREQ') || rawMetric.includes('FREQUENCY')
                        ) {
                            formatted = Number.isInteger(parsedNum) ? parsedNum.toLocaleString('en-US') : parsedNum.toFixed(1);
                        } else if (
                            !rawMetric.includes('HIRE') && (
                                rawMetric.includes('DÍA') || rawMetric.includes('DAYS') || 
                                rawMetric.includes('DÍAS') || rawMetric.includes('DURACIÓN')
                            )
                        ) {
                            formatted = parsedNum.toFixed(1);
                        } else if (
                            rawMetric.includes('TONELADA') || rawMetric.includes('TONS') || 
                            rawMetric.includes('CARGA') || rawMetric.includes('BASE FLETE') || 
                            rawMetric.includes('VOLUMEN') || rawMetric.includes('MT')
                        ) {
                            formatted = Math.round(parsedNum).toLocaleString('en-US');
                        } else if (
                            !rawMetric.includes('HIRE') && (
                                rawMetric.includes('USD/MT') || rawMetric.includes('TARIFA') || 
                                rawMetric.includes('TCE') || rawMetric.includes('TCY') || 
                                rawMetric.includes('$/D') || rawMetric.includes('$/DÍA')
                            )
                        ) {
                            formatted = '$' + parsedNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        } else {
                            // Monetario Global
                            formatted = '$' + Math.round(parsedNum).toLocaleString('en-US');
                        }
                    }
                }

                if (idx === rowValues.length - 1) {
                    formattedTot = formatted;
                } else {
                    formattedVals.push(formatted);
                }
            });

            currentBlock.rows.push({
                name: rowMetric,
                formattedValues: formattedVals,
                formattedTotal: formattedTot,
                isNumeric: true,
                isSubRowMetric: rowMetric.startsWith('↳')
            });

            currentRow++;
        });
    }

    // 3. Paginador Atómico: Distribuir Bloques en Páginas A4 Landscape (Límite: 20-22 filas/hoja)
    const MAX_ROWS_PER_PAGE = 21;
    interface PageStructure {
        blocks: TableBlock[];
        totalRows: number;
    }

    const pages: PageStructure[] = [];
    let activePage: PageStructure = { blocks: [], totalRows: 0 };

    blocks.forEach(block => {
        const blockRowCount = block.rows.length;
        // Si agregar este bloque completo supera el presupuesto de la página, abrir nueva página
        if (activePage.totalRows + blockRowCount > MAX_ROWS_PER_PAGE && activePage.blocks.length > 0) {
            pages.push(activePage);
            activePage = { blocks: [], totalRows: 0 };
        }
        activePage.blocks.push(block);
        activePage.totalRows += blockRowCount;
    });

    if (activePage.blocks.length > 0) {
        pages.push(activePage);
    }

    const totalPagesCount = pages.length;
    const formattedDate = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // 4. Renderizar cada Página A4 Landscape con Cabecera Oficial y Grilla Repetida
    const pagesHtml = pages.map((p, pageIdx) => {
        return `
        <div class="report-page">
            <!-- 1. Cabecera Institucional Oficial con Proporción de Logos Corregida -->
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

            <!-- 2. Grilla Contable con THEAD Repetido en Cada Página -->
            <table class="data-table">
                <thead>
                    <tr>
                        <th class="th-dim" style="width: 22px;">CLI</th>
                        <th class="th-dim" style="width: 22px;">RUTA</th>
                        <th class="th-dim" style="width: 22px;">BUQ</th>
                        <th class="th-metric" style="width: 170px;">MÉTRICA</th>
                        ${safeHeaderCols.slice(4, -1).map(h => `<th class="th-month" style="width: 58px;">${h}</th>`).join('')}
                        <th class="th-total" style="width: 62px;">${safeHeaderCols[safeHeaderCols.length - 1] || 'TOTAL ACUM'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${p.blocks.map(b => {
                        const rowCount = b.rows.length;
                        const isSubtotal = b.type === 'subtotal';
                        const isFleet = b.type === 'fleet';
                        const isAccum = b.type === 'accum';

                        const cColor = b.clientColor ? `background-color: ${b.clientColor.bg} !important; color: ${b.clientColor.fg} !important;` : 'background-color: #0369a1 !important; color: #fff !important;';
                        const rColor = b.routeColor ? `background-color: ${b.routeColor.bg} !important; color: ${b.routeColor.fg} !important;` : 'background-color: #a855f7 !important; color: #fff !important;';
                        const vColor = b.vesselColor ? `background-color: ${b.vesselColor.bg} !important; color: ${b.vesselColor.fg} !important;` : 'background-color: #16a34a !important; color: #fff !important;';

                        return b.rows.map((row, rIdx) => {
                            const isFirst = rIdx === 0;
                            const trClass = isAccum ? 'tr-global-accum' : (isFleet ? 'tr-fleet-total' : (isSubtotal ? 'tr-subtotal' : 'tr-data-row'));

                            return `
                            <tr class="${trClass}">
                                ${isFirst ? `
                                    <td rowspan="${rowCount}" class="td-dimension" style="${cColor}">
                                        <div class="pdf-vertical-text">${b.clientName}</div>
                                    </td>
                                    <td rowspan="${rowCount}" class="td-dimension" style="${rColor}">
                                        <div class="pdf-vertical-text">${b.routeName}</div>
                                    </td>
                                    <td rowspan="${rowCount}" class="td-dimension" style="${vColor}">
                                        <div class="pdf-vertical-text">${b.vesselName}</div>
                                    </td>
                                ` : ''}
                                <td class="td-metric-name ${row.isSubRowMetric ? 'pl-subrow' : ''}">
                                    ${row.name}
                                </td>
                                ${row.formattedValues.map(v => `<td class="${v ? 'td-num' : 'td-empty'}">${v}</td>`).join('')}
                                <td class="${row.formattedTotal ? 'td-num font-bold' : 'td-empty'}">${row.formattedTotal}</td>
                            </tr>
                            `;
                        }).join('');
                    }).join('')}
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

        /* 1. Cabecera Institucional Oficial con Logos Calibrados */
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
        /* Logo Geeksoft Duplicado */
        .logo-geeksoft {
            height: 48px;
            width: auto;
            object-fit: contain;
        }
        /* Logo Petral Reducido a la Mitad */
        .logo-petral {
            height: 18px;
            width: auto;
            object-fit: contain;
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

        /* 2. Tabla Contable Matriz 100% Nativa */
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
        
        /* Celdas de Dimensiones Verticales (Columnas 1 a 3) */
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

        /* Columna 4: Nombres de Métricas 100% HORIZONTAL con Ancho Holgado */
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
        .pl-subrow {
            padding-left: 14px !important;
            color: #334155;
            font-weight: 600;
        }

        /* Columnas de Datos (Meses y Totales) Calibradas al Dígito Máximo */
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

        /* Filas Especiales */
        tr.tr-subtotal td {
            background-color: #fffbeb !important;
            font-weight: 800;
            color: #1e293b;
            border-top: 1.5px solid #fbbf24;
            border-bottom: 1.5px solid #fbbf24;
        }
        tr.tr-fleet-total td {
            background-color: #f1f5f9 !important;
            font-weight: 900;
            color: #0f172a;
            border-top: 1.5px solid #334155;
            border-bottom: 1.5px solid #334155;
        }
        tr.tr-global-accum td {
            background-color: #eef2ff !important;
            font-weight: 900;
            color: #1e1b4b;
            border-top: 2px solid #0d9488;
            border-bottom: 2px solid #0d9488;
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
            font-weight: 700;
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

    // 3. Generación Asíncrona en Backend (WeasyPrint) con timeout de 60s
    // Esto previene al 100% el Sharing Violation (Error 32 de Windows) al evitar el print dialog de Chrome
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
