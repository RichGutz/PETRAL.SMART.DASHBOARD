import { LOGO_PETRAL_BASE64, LOGO_GEEKSOFT_BASE64 } from '../assets/logosBase64';

// Paleta de colores homologada con el Excel canónico
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

export function generateFinancialMatrixPdfHtml(
    tableId: string = 'forecast-grid-table',
    _orientation: 'portrait' | 'landscape' = 'landscape',
    scenarioName: string = 'Escenario de Proyección'
): string {
    const table = document.getElementById(tableId) as HTMLTableElement;
    if (!table) {
        throw new Error('No se encontró la tabla de Matriz Financiera en el DOM.');
    }

    // Clonar la tabla para procesamiento no destructivo
    const clone = table.cloneNode(true) as HTMLTableElement;

    // Métricas Resumen para Cajas KPI de Cabecera
    let kpiTrips = '-';
    let kpiTons = '-';
    let kpiNetRev = '-';
    let kpiBunker = '-';
    let kpiPort = '-';
    let kpiHire = '-';
    let kpiPL = '-';

    // 1. Matriz de Ocupación para THEAD y TBODY
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

    // 1. Procesar THEAD
    const thead = clone.querySelector('thead');
    if (thead) {
        const trs = thead.querySelectorAll('tr');
        trs.forEach(tr => {
            let currentCol = 1;
            const ths = tr.querySelectorAll('th');
            ths.forEach(th => {
                while (isOccupied(currentRow, currentCol)) {
                    currentCol++;
                }

                const rSpan = parseInt(th.getAttribute('rowspan') || '1', 10);
                const cSpan = parseInt(th.getAttribute('colspan') || '1', 10);

                const span = th.querySelector('span');
                let cleanText = (span && span.textContent ? span.textContent : th.textContent || '').trim().toUpperCase();
                // Limpiar botones e iconos
                cleanText = cleanText.replace(/[\n\r]+/g, ' ').trim();

                th.innerHTML = cleanText;
                th.removeAttribute('style');

                if (cleanText.includes('TOTAL ACUM')) {
                    th.className = 'th-total-acum';
                } else {
                    th.className = 'th-header-cell';
                }

                setOccupied(currentRow, currentCol, rSpan, cSpan);
                currentCol += cSpan;
            });
            currentRow++;
        });
    }

    // 2. Procesar TBODY con la Matriz de Ocupación canónica
    const tbody = clone.querySelector('tbody');
    if (tbody) {
        const trs = tbody.querySelectorAll('tr');
        trs.forEach(tr => {
            let currentCol = 1;
            const tds = tr.querySelectorAll('td');
            const trClass = tr.className || '';
            const isSubtotalRow = trClass.includes('font-semibold') || trClass.includes('bg-amber-50') || trClass.includes('bg-slate-100');
            const isGlobalTotalRow = trClass.includes('bg-indigo-50') || trClass.includes('TOTAL ACUMULADO') || trClass.includes('TOTAL FLOTA');

            if (isGlobalTotalRow) {
                tr.className = 'tr-global-total';
            } else if (isSubtotalRow) {
                tr.className = 'tr-subtotal';
            } else {
                tr.className = 'tr-data-row';
            }

            let rowMetricName = '';

            tds.forEach(td => {
                while (isOccupied(currentRow, currentCol)) {
                    currentCol++;
                }

                const rSpan = parseInt(td.getAttribute('rowspan') || '1', 10);
                const cSpan = parseInt(td.getAttribute('colspan') || '1', 10);
                const tdClass = td.className || '';

                // Extraer texto limpio evitando artefactos de UI
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

                // Determinación determinística de la columna vía currentCol
                const isDimensionCol = currentCol <= 3;
                const isMetricCol = currentCol === 4;
                const isDataCol = currentCol >= 5;

                if (isMetricCol && textValue !== '') {
                    rowMetricName = textValue.toUpperCase().trim();
                }

                // Limpieza numérica
                const rawClean = textValue.replace(/[\$,\s]/g, '');
                const isPercent = textValue.includes('%') || rowMetricName.includes('%') || rowMetricName.includes('MARGEN') || rowMetricName.includes('YIELD %');
                const cleanNumStr = rawClean.replace('%', '');

                let isNumeric = false;
                let parsedNum = 0;
                if (isDataCol && textValue !== '-' && textValue !== '' && !isNaN(Number(cleanNumStr)) && cleanNumStr !== '') {
                    isNumeric = true;
                    parsedNum = parseFloat(cleanNumStr);
                }

                // Asignar clases y contenido según tipo de columna
                if (isDimensionCol) {
                    const colors = getDimensionColor(tdClass, textValue);
                    td.className = 'td-dimension';
                    if (colors) {
                        td.setAttribute('style', `background-color: ${colors.bg} !important; color: ${colors.fg} !important;`);
                    }
                    // Solo las columnas 1 a 3 llevan rotación vertical 90°
                    td.innerHTML = `<div class="pdf-vertical-text">${textValue}</div>`;
                } else if (isMetricCol) {
                    // Columna 4: 100% HORIZONTAL
                    td.className = 'td-metric-name';
                    td.removeAttribute('style');
                    td.innerHTML = `<span class="pdf-metric-text">${textValue}</span>`;
                } else if (isDataCol) {
                    td.className = isNumeric ? 'td-num' : 'td-empty';
                    td.removeAttribute('style');

                    if (isNumeric && parsedNum !== 0) {
                        if (isPercent) {
                            td.textContent = (parsedNum > 1 ? parsedNum : parsedNum * 100).toFixed(1) + '%';
                        } else if (
                            rowMetricName.includes('VIAJE') || rowMetricName.includes('FREQ') || 
                            rowMetricName.includes('FREQUENCY')
                        ) {
                            td.textContent = Number.isInteger(parsedNum) ? parsedNum.toLocaleString('en-US') : parsedNum.toFixed(1);
                        } else if (
                            !rowMetricName.includes('HIRE') && (
                                rowMetricName.includes('DÍA') || rowMetricName.includes('DAYS') || 
                                rowMetricName.includes('DÍAS') || rowMetricName.includes('DURACIÓN')
                            )
                        ) {
                            td.textContent = parsedNum.toFixed(1);
                        } else if (
                            rowMetricName.includes('TONELADA') || rowMetricName.includes('TONS') || 
                            rowMetricName.includes('CARGA') || rowMetricName.includes('BASE FLETE') || 
                            rowMetricName.includes('VOLUMEN') || rowMetricName.includes('MT')
                        ) {
                            td.textContent = Math.round(parsedNum).toLocaleString('en-US');
                        } else if (
                            !rowMetricName.includes('HIRE') && (
                                rowMetricName.includes('USD/MT') || rowMetricName.includes('TARIFA') || 
                                rowMetricName.includes('TCE') || rowMetricName.includes('TCY') || 
                                rowMetricName.includes('$/D') || rowMetricName.includes('$/DÍA')
                            )
                        ) {
                            td.textContent = '$' + parsedNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        } else {
                            // Monetario Global: Net Revenue, Hire, Bunker, Port, P&L
                            td.textContent = '$' + Math.round(parsedNum).toLocaleString('en-US');
                        }

                        // Capturar KPI de totales
                        if (isGlobalTotalRow) {
                            const lastTd = tds[tds.length - 1];
                            if (td === lastTd) {
                                if (rowMetricName.includes('VIAJE')) kpiTrips = td.textContent || '-';
                                else if (rowMetricName.includes('TON')) kpiTons = td.textContent || '-';
                                else if (rowMetricName.includes('NET REV')) kpiNetRev = td.textContent || '-';
                                else if (rowMetricName.includes('BUNKER')) kpiBunker = td.textContent || '-';
                                else if (rowMetricName.includes('PORT')) kpiPort = td.textContent || '-';
                                else if (rowMetricName.includes('HIRE')) kpiHire = td.textContent || '-';
                                else if (rowMetricName.includes('VOYAGE RESULT') || rowMetricName.includes('P/L')) kpiPL = td.textContent || '-';
                            }
                        }
                    } else {
                        td.textContent = '';
                    }
                }

                setOccupied(currentRow, currentCol, rSpan, cSpan);
                currentCol += cSpan;
            });

            currentRow++;
        });
    }

    const formattedDate = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

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
            font-size: 11px !important;
            line-height: 1.2;
        }
        
        .report-container {
            width: 100%;
            margin: 0;
            padding: 0;
        }

        /* 1. Cabecera Institucional Oficial */
        .top-header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }
        .top-header-table td {
            border: none !important;
            padding: 0 !important;
            vertical-align: middle;
        }
        .logo-geeksoft {
            height: 32px;
            width: auto;
            object-fit: contain;
        }
        .logo-petral {
            height: 36px;
            width: auto;
            object-fit: contain;
        }
        .report-main-title {
            font-weight: 900;
            font-size: 14px;
            color: #0f172a;
            margin: 0;
            text-transform: uppercase;
            text-align: center;
            letter-spacing: 0.5px;
            line-height: 1.1;
        }
        .report-sub-title {
            font-size: 11px;
            font-weight: 700;
            color: #334155;
            text-align: center;
            margin-top: 2px;
            letter-spacing: 0.2px;
        }
        .scenario-badge-banner {
            background-color: #0f4c81;
            color: #ffffff;
            font-weight: 800;
            font-size: 10.5px;
            text-transform: uppercase;
            padding: 2px 10px;
            border-radius: 4px;
            text-align: center;
            margin: 3px auto 4px auto;
            width: fit-content;
            max-width: 95%;
            letter-spacing: 0.3px;
        }

        /* 2. Cajas KPI Horizontales */
        table.kpi-cards-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 3px 0;
            margin-bottom: 4px;
            table-layout: fixed;
        }
        table.kpi-cards-table td.kpi-card {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 2px 4px;
            text-align: center;
            vertical-align: middle;
        }
        .kpi-title {
            font-size: 8.5px;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            margin-bottom: 1px;
            letter-spacing: 0.2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .kpi-value {
            font-size: 11.5px;
            font-weight: 900;
            color: #0f172a;
            white-space: nowrap;
        }
        .kpi-green { color: #059669; }
        .kpi-blue { color: #0284c7; }
        .kpi-red { color: #dc2626; }

        /* 3. Tabla Contable Matriz */
        table#forecast-grid-table, table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
            table-layout: fixed;
            font-size: 10px;
            line-height: 1.18;
        }
        table th {
            background-color: #1e293b !important;
            color: #ffffff !important;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 9.5px;
            padding: 3px 2px;
            border: 1px solid #334155;
            text-align: center;
            letter-spacing: 0.2px;
        }
        table th.th-total-acum {
            background-color: #0d9488 !important;
            color: #ffffff !important;
        }
        table td {
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
            font-size: 9px;
            letter-spacing: 0.3px;
            text-align: center;
            margin: auto;
            white-space: nowrap;
            line-height: 1;
        }

        /* Columna 4: Nombres de Métricas 100% HORIZONTAL */
        td.td-metric-name {
            width: 135px !important;
            min-width: 135px !important;
            max-width: 135px !important;
            text-align: left !important;
            font-weight: 700;
            color: #0f172a;
            padding-left: 4px;
            writing-mode: horizontal-tb !important;
            transform: none !important;
            white-space: nowrap !important;
            font-size: 10px !important;
        }
        .pdf-metric-text {
            display: inline-block;
            text-align: left;
            writing-mode: horizontal-tb !important;
            transform: none !important;
            white-space: nowrap;
        }

        /* Columnas de Datos (Meses y Totales) */
        td.td-num {
            text-align: right !important;
            font-size: 10px;
            font-weight: 600;
            color: #1e293b;
            padding-right: 3px;
        }
        td.td-empty {
            text-align: center;
            color: #e2e8f0;
        }

        /* Filas Especiales */
        tr.tr-subtotal td {
            background-color: #fffbeb !important;
            font-weight: 800;
            color: #1e293b;
            border-top: 1.5px solid #fbbf24;
            border-bottom: 1.5px solid #fbbf24;
        }
        tr.tr-global-total td {
            background-color: #eef2ff !important;
            font-weight: 900;
            color: #1e1b4b;
            border-top: 2px solid #0d9488;
            border-bottom: 2px solid #0d9488;
        }
        tr.tr-data-row:nth-child(even) td:not(.td-dimension) {
            background-color: #f8fafc;
        }

        /* 4. Pie de Página Institucional */
        .page-footer {
            width: 100%;
            margin-top: 4px;
            border-top: 1px solid #cbd5e1;
            padding-top: 2px;
            font-size: 8.5px;
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
    <div class="report-container">
        <!-- 1. Cabecera Institucional con Logos -->
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
            ESCENARIO: ${scenarioName} &bull; MONEDA: USD &bull; GENERADO: ${formattedDate}
        </div>

        <!-- 2. Tarjetas KPI Ejecutivas -->
        ${kpiNetRev !== '-' ? `
        <table class="kpi-cards-table">
            <tr>
                <td class="kpi-card">
                    <div class="kpi-title">Viajes Totales</div>
                    <div class="kpi-value kpi-blue">${kpiTrips}</div>
                </td>
                <td class="kpi-card">
                    <div class="kpi-title">Toneladas (MT)</div>
                    <div class="kpi-value">${kpiTons}</div>
                </td>
                <td class="kpi-card">
                    <div class="kpi-title">Net Revenue</div>
                    <div class="kpi-value kpi-green">${kpiNetRev}</div>
                </td>
                <td class="kpi-card">
                    <div class="kpi-title">(-) Bunker Costs</div>
                    <div class="kpi-value kpi-red">${kpiBunker}</div>
                </td>
                <td class="kpi-card">
                    <div class="kpi-title">(-) Port Costs</div>
                    <div class="kpi-value kpi-red">${kpiPort}</div>
                </td>
                <td class="kpi-card">
                    <div class="kpi-title">(-) Hire / Charter</div>
                    <div class="kpi-value kpi-red">${kpiHire}</div>
                </td>
                <td class="kpi-card">
                    <div class="kpi-title">Voyage Result (P/L)</div>
                    <div class="kpi-value kpi-green">${kpiPL}</div>
                </td>
            </tr>
        </table>
        ` : ''}

        <!-- 3. Grilla de la Matriz Financiera -->
        ${clone.outerHTML}

        <!-- 4. Pie de Página Oficial -->
        <div class="page-footer">
            <div class="page-footer-cell" style="text-align: left;">
                Petral Forecast Engine &copy; 2026 &mdash; Sistema de Inteligencia Comercial y Proyecciones Marítimas
            </div>
            <div class="page-footer-cell" style="text-align: center;">
                Documento Oficial de Auditoría Financiera
            </div>
            <div class="page-footer-cell" style="text-align: right;">
                Emisión: ${formattedDate}
            </div>
        </div>
    </div>
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
    const filename = `Petral_Matriz_Financiera_${orientation}_${new Date().toISOString().slice(0, 10)}.pdf`;

    // 1. Vía Primaria: Backend FastAPI + WeasyPrint
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const response = await fetch('/api/v1/utils/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html: htmlContent, filename }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const blob = await response.blob();
            if (blob.size > 500) {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                return;
            }
        }
    } catch (err) {
        console.warn('Backend WeasyPrint no disponible o timeout. Utilizando motor de impresión vectorial nativo.', err);
    }

    // 2. Vía Secundaria: Motor de Impresión Vectorial Nativo del Navegador
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Por favor, permite las ventanas emergentes en tu navegador para generar el PDF.');
        return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
        setTimeout(() => {
            printWindow.print();
            setTimeout(() => printWindow.close(), 1000);
        }, 250);
    };
}
