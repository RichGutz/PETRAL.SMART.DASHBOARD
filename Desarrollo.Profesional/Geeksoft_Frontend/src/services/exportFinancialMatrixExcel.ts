import ExcelJS from 'exceljs';

// Mapeo de colores hex a ARGB para ExcelJS
const COLOR_MAP: Record<string, { bg: string; fg: string }> = {
    // Clientes
    'bg-sky-700': { bg: 'FF0369A1', fg: 'FFFFFFFF' },
    'bg-petral-blue': { bg: 'FF0F4C81', fg: 'FFFFFFFF' },
    'bg-orange-500': { bg: 'FFF97316', fg: 'FFFFFFFF' },
    // Rutas
    'bg-cyan-500': { bg: 'FF06B6D4', fg: 'FFFFFFFF' },
    'bg-purple-500': { bg: 'FFA855F7', fg: 'FFFFFFFF' },
    'bg-fuchsia-500': { bg: 'FFD946EF', fg: 'FFFFFFFF' },
    'bg-slate-700': { bg: 'FF334155', fg: 'FFFFFFFF' },
    // Buques
    'bg-red-600': { bg: 'FFDC2626', fg: 'FFFFFFFF' },
    'bg-green-600': { bg: 'FF16A34A', fg: 'FFFFFFFF' },
    'bg-slate-600': { bg: 'FF475569', fg: 'FFFFFFFF' },
    'bg-indigo-600': { bg: 'FF4F46E5', fg: 'FFFFFFFF' },
    'bg-slate-800': { bg: 'FF1E293B', fg: 'FFFFFFFF' },
    'bg-amber-100': { bg: 'FFFEF3C7', fg: 'FF78350F' },
    'bg-petral-teal': { bg: 'FF0D9488', fg: 'FFFFFFFF' },
};

function getCellArgb(className: string, text: string, isHeader: boolean, isTotalAcumHeader: boolean) {
    if (isTotalAcumHeader) {
        return { bg: 'FF0C4A6E', fg: 'FFFFFFFF' }; // Sky 900
    }
    if (isHeader) {
        return { bg: 'FF1E293B', fg: 'FFFFFFFF' }; // Slate 800
    }

    // Buscar si contiene alguna clase de color conocida
    for (const [cls, colors] of Object.entries(COLOR_MAP)) {
        if (className.includes(cls)) {
            return colors;
        }
    }

    // Heurística basada en el texto si no coincide por clase
    const upper = text.toUpperCase();
    if (upper.includes('NEXA')) return { bg: 'FF0F4C81', fg: 'FFFFFFFF' };
    if (upper.includes('SPCC')) return { bg: 'FF0369A1', fg: 'FFFFFFFF' };
    if (upper.includes('MATARANI')) return { bg: 'FF06B6D4', fg: 'FFFFFFFF' }; // Cyan
    if (upper.includes('MARCONA')) return { bg: 'FFA855F7', fg: 'FFFFFFFF' }; // Purple
    if (upper.includes('MEJILLONES')) return { bg: 'FFD946EF', fg: 'FFFFFFFF' }; // Fuchsia
    if (upper.includes('TABLONES')) return { bg: 'FFDC2626', fg: 'FFFFFFFF' };
    if (upper.includes('MOQUEGUA')) return { bg: 'FF16A34A', fg: 'FFFFFFFF' };
    if (upper.includes('CONCON')) return { bg: 'FF475569', fg: 'FFFFFFFF' };
    if (upper.includes('HUEMUL')) return { bg: 'FF4F46E5', fg: 'FFFFFFFF' };
    if (upper.includes('TOTAL ACUMULADO')) return { bg: 'FF0D9488', fg: 'FFFFFFFF' }; // Teal
    if (upper.includes('TOTAL FLOTA')) return { bg: 'FF1E293B', fg: 'FFFFFFFF' }; // Slate 800
    if (upper.includes('SUBTOTAL') || upper.includes('TOTAL CLIENT')) return { bg: 'FF1E293B', fg: 'FFFBBF24' }; // Slate 800 + Amber

    return null;
}

export async function exportFinancialMatrixExcel(tableId: string = 'forecast-grid-table'): Promise<void> {
    const table = document.getElementById(tableId) as HTMLTableElement;
    if (!table) {
        alert('No se encontró la tabla de Matriz Financiera para exportar.');
        return;
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = 'PETRAL SMART DASHBOARD';
    wb.lastModifiedBy = 'Petral Financial Engine';
    wb.created = new Date();

    const ws = wb.addWorksheet('Matriz Financiera', {
        views: [{ showGridLines: true, state: 'frozen', ySplit: 1, xSplit: 0 }]
    });

    // Matriz de ocupación para resolver rowSpan y colSpan
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
    const thead = table.querySelector('thead');
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

                // Obtener texto limpio de la cabecera
                let cleanText = '';
                const span = th.querySelector('span');
                if (span && span.textContent) {
                    cleanText = span.textContent.trim();
                } else {
                    // Remover botones/iconos del texto
                    const clone = th.cloneNode(true) as HTMLElement;
                    clone.querySelectorAll('button, svg').forEach(el => el.remove());
                    cleanText = clone.textContent?.trim() || '';
                }

                const cell = ws.getCell(currentRow, currentCol);
                cell.value = cleanText.toUpperCase();
                
                const isTotalAcum = cleanText.toUpperCase().includes('TOTAL ACUM');
                const colors = getCellArgb(th.className, cleanText, true, isTotalAcum);

                cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors?.fg || 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: colors?.bg || 'FF1E293B' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF475569' } },
                    left: { style: 'thin', color: { argb: 'FF475569' } },
                    bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
                    right: { style: 'thin', color: { argb: 'FF475569' } }
                };

                if (rSpan > 1 || cSpan > 1) {
                    ws.mergeCells(currentRow, currentCol, currentRow + rSpan - 1, currentCol + cSpan - 1);
                }
                setOccupied(currentRow, currentCol, rSpan, cSpan);
                currentCol += cSpan;
            });

            ws.getRow(currentRow).height = 25;
            currentRow++;
        });
    }

    // 2. Procesar TBODY
    const tbody = table.querySelector('tbody');
    if (tbody) {
        const trs = tbody.querySelectorAll('tr');
        trs.forEach(tr => {
            let currentCol = 1;
            const tds = tr.querySelectorAll('td');
            const trClass = tr.className || '';
            const isSubtotalRow = trClass.includes('font-semibold') || trClass.includes('bg-amber-50') || trClass.includes('bg-slate-100');
            const isGlobalTotalRow = trClass.includes('bg-indigo-50') || trClass.includes('TOTAL ACUMULADO') || trClass.includes('TOTAL FLOTA');
            
            let currentMetricName = '';

            tds.forEach(td => {
                while (isOccupied(currentRow, currentCol)) {
                    currentCol++;
                }

                const rSpan = parseInt(td.getAttribute('rowspan') || '1', 10);
                const cSpan = parseInt(td.getAttribute('colspan') || '1', 10);
                const tdClass = td.className || '';

                // Extraer el texto real evitando artefactos de <select> o botones
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
                    const clone = td.cloneNode(true) as HTMLElement;
                    clone.querySelectorAll('button, svg, select').forEach(el => el.remove());
                    textValue = clone.textContent?.trim() || '';
                }

                const isDimensionCol = tdClass.includes('vertical-text') || td.querySelector('.vertical-text') !== null;
                const cell = ws.getCell(currentRow, currentCol);

                // Detectar si esta celda define la métrica de la fila (columna de métricas)
                const upperText = textValue.toUpperCase();
                if (
                    upperText.includes('P/L') || upperText.includes('TONELADAS') || upperText.includes('REVENUE') || 
                    upperText.includes('COSTS') || upperText.includes('BUNKER') || upperText.includes('MARGEN') || 
                    upperText.includes('YIELD') || upperText.includes('DEMURRAGE') || upperText.includes('DEMORAS') || 
                    upperText.includes('FLETE') || upperText.includes('VIAJES') || upperText.includes('VENTAS') || 
                    upperText.includes('HIRE') || upperText.includes('COMBUSTIBLE') || upperText.includes('PUERTO') || 
                    upperText.includes('ARRIENDO') || upperText.includes('TCY') || upperText.includes('TCE') || 
                    upperText.includes('GASTOS') || upperText.includes('CANAL') || upperText.includes('TARIFA') ||
                    upperText.includes('DÍAS-BUQUE')
                ) {
                    currentMetricName = upperText;
                }

                // Identificar y parsear valores numéricos
                const rawClean = textValue.replace(/[\$,\s]/g, '');
                const isPercent = textValue.includes('%') || currentMetricName.includes('%') || currentMetricName.includes('MARGEN');
                const cleanNumStr = rawClean.replace('%', '');

                let isNumeric = false;
                let parsedNum = 0;
                if (textValue !== '-' && textValue !== '' && !isDimensionCol && !isNaN(Number(cleanNumStr)) && cleanNumStr !== '') {
                    isNumeric = true;
                    parsedNum = parseFloat(cleanNumStr);
                }

                // Asignar valor y formato
                if (isNumeric) {
                    if (isPercent) {
                        cell.value = parsedNum > 1 ? parsedNum / 100 : parsedNum;
                        cell.numFmt = '0.0%';
                    } else if (
                        currentMetricName.includes('YIELD') || currentMetricName.includes('USD/MT') || 
                        currentMetricName.includes('FLETE') || currentMetricName.includes('TARIFA') || 
                        currentMetricName.includes('TCE') || currentMetricName.includes('TCY')
                    ) {
                        cell.value = parsedNum;
                        cell.numFmt = '$#,##0.00';
                    } else if (currentMetricName.includes('VIAJES') || currentMetricName.includes('FREQ') || currentMetricName.includes('DÍAS')) {
                        cell.value = parsedNum;
                        cell.numFmt = '0.0';
                    } else if (currentMetricName.includes('TONELADAS') || currentMetricName.includes('BASE FLETE')) {
                        cell.value = parsedNum;
                        cell.numFmt = '#,##0';
                    } else {
                        cell.value = parsedNum;
                        cell.numFmt = '$#,##0';
                    }
                } else {
                    cell.value = textValue === '-' ? '-' : textValue;
                }

                // Aplicar estilos según tipo de celda
                if (isDimensionCol) {
                    const colors = getCellArgb(tdClass, textValue, false, false);
                    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors?.fg || 'FFFFFFFF' } };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: colors?.bg || 'FF0F4C81' }
                    };
                    // Rotación de texto vertical a 90 grados
                    cell.alignment = { vertical: 'middle', horizontal: 'center', textRotation: 90, wrapText: true };
                } else if (isGlobalTotalRow) {
                    cell.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: 'FF1E1B4B' } };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFEEF2FF' } // Indigo 50
                    };
                    cell.alignment = { vertical: 'middle', horizontal: isNumeric ? 'right' : 'left' };
                } else if (isSubtotalRow) {
                    cell.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: 'FF1E293B' } };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFFBEB' } // Amber 50
                    };
                    cell.alignment = { vertical: 'middle', horizontal: isNumeric ? 'right' : 'left' };
                } else {
                    cell.font = { name: 'Segoe UI', size: 8.5, color: { argb: 'FF334155' } };
                    cell.alignment = { vertical: 'middle', horizontal: isNumeric ? 'right' : 'left' };
                }

                // Bordes elegantes
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                };

                // Merge cells si tiene rowSpan o colSpan
                if (rSpan > 1 || cSpan > 1) {
                    ws.mergeCells(currentRow, currentCol, currentRow + rSpan - 1, currentCol + cSpan - 1);
                }
                setOccupied(currentRow, currentCol, rSpan, cSpan);
                currentCol += cSpan;
            });

            ws.getRow(currentRow).height = 19;
            currentRow++;
        });
    }

    // 3. Ajustar Ancho Automático de Columnas
    ws.columns.forEach((col, colIdx) => {
        let maxLen = 10;
        col.eachCell?.({ includeEmpty: false }, (cell, rowIdx) => {
            if (rowIdx === 1) {
                // Header
                maxLen = Math.max(maxLen, String(cell.value || '').length + 4);
            } else {
                const str = String(cell.value || '');
                // No expandir excesivamente por celdas combinadas de dimensiones
                if (colIdx < 3 && str.length > 20) {
                    maxLen = Math.max(maxLen, 8);
                } else {
                    maxLen = Math.max(maxLen, str.length + 3);
                }
            }
        });

        if (colIdx < 3) {
            col.width = 6.5; // Columnas de dimensiones verticales compactas
        } else if (colIdx === 3) {
            col.width = 34;  // Columna de Nombres de Métricas
        } else {
            col.width = Math.max(maxLen, 14); // Columnas de Meses y Total Acum
        }
    });

    // 4. Descargar archivo XLSX
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Petral_Forecast_Matriz_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
