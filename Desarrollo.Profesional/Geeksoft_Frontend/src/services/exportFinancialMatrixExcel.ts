import ExcelJS from 'exceljs';

// Mapeo de colores hex a ARGB con 75% de transparencia (25% tint pastel) para ahorro de tinta en impresión física
const COLOR_MAP: Record<string, { bg: string; fg: string }> = {
    // Clientes (75% transparencia / 25% tint)
    'bg-sky-700': { bg: 'FFC0DAE8', fg: 'FF0369A1' },
    'bg-petral-blue': { bg: 'FFC3D2E0', fg: 'FF0F4C81' },
    'bg-orange-500': { bg: 'FFFEDCC5', fg: 'FFC2410C' },
    // Rutas (75% transparencia / 25% tint)
    'bg-cyan-500': { bg: 'FFC1EDF4', fg: 'FF0E7490' },
    'bg-purple-500': { bg: 'FFE9D5FD', fg: 'FF6B21A8' },
    'bg-fuchsia-500': { bg: 'FFF6D1FB', fg: 'FF86198F' },
    'bg-slate-700': { bg: 'FFCCD0D5', fg: 'FF1E293B' },
    // Buques (75% transparencia / 25% tint)
    'bg-red-600': { bg: 'FFF6C9C9', fg: 'FF991B1B' },
    'bg-green-600': { bg: 'FFC5E8D2', fg: 'FF166534' },
    'bg-slate-600': { bg: 'FFD1D5DA', fg: 'FF1E293B' },
    'bg-indigo-600': { bg: 'FFD3D1F9', fg: 'FF3730A3' },
    'bg-slate-800': { bg: 'FFC7CACE', fg: 'FF0F172A' },
    'bg-amber-100': { bg: 'FFFEF3C7', fg: 'FF78350F' },
    'bg-petral-teal': { bg: 'FFC3E4E1', fg: 'FF115E59' },
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
    if (upper.includes('NEXA')) return { bg: 'FFC3D2E0', fg: 'FF0F4C81' };
    if (upper.includes('SPCC')) return { bg: 'FFC0DAE8', fg: 'FF0369A1' };
    if (upper.includes('MATARANI')) return { bg: 'FFC1EDF4', fg: 'FF0E7490' };
    if (upper.includes('MARCONA')) return { bg: 'FFE9D5FD', fg: 'FF6B21A8' };
    if (upper.includes('MEJILLONES')) return { bg: 'FFF6D1FB', fg: 'FF86198F' };
    if (upper.includes('TABLONES')) return { bg: 'FFF6C9C9', fg: 'FF991B1B' };
    if (upper.includes('MOQUEGUA')) return { bg: 'FFC5E8D2', fg: 'FF166534' };
    if (upper.includes('CONCON')) return { bg: 'FFD1D5DA', fg: 'FF1E293B' };
    if (upper.includes('HUEMUL')) return { bg: 'FFD3D1F9', fg: 'FF3730A3' };
    if (upper.includes('TOTAL ACUMULADO')) return { bg: 'FFC3E4E1', fg: 'FF115E59' };
    if (upper.includes('TOTAL FLOTA')) return { bg: 'FFC7CACE', fg: 'FF0F172A' };
    if (upper.includes('SUBTOTAL') || upper.includes('TOTAL CLIENT')) return { bg: 'FFFEF3C7', fg: 'FF78350F' };

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
        views: [{ showGridLines: true, state: 'frozen', ySplit: 1, xSplit: 0, zoomScale: 75, zoomScaleNormal: 75 }]
    });
    ws.views = [{ showGridLines: true, state: 'frozen', ySplit: 1, xSplit: 0, zoomScale: 75, zoomScaleNormal: 75 }];

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

                if (currentCol === 1) cleanText = 'C';
                else if (currentCol === 2) cleanText = 'R';
                else if (currentCol === 3) cleanText = 'B';

                const cell = ws.getCell(currentRow, currentCol);
                cell.value = cleanText.toUpperCase();
                
                const isTotalAcum = cleanText.toUpperCase().includes('TOTAL ACUM');
                const colors = getCellArgb(th.className, cleanText, true, isTotalAcum);

                cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colors?.fg || 'FFFFFFFF' } };
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

                // Extraer el texto real evitando artefactos de <select>, svg o badges parásitos
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
                    // Extraer texto del botón sanitizando iconos svg y badges de tipo "Net" o "TCE $/d"
                    const btnClone = btnEl.cloneNode(true) as HTMLElement;
                    btnClone.querySelectorAll('svg, .font-mono, [class*="text-[9px]"]').forEach(el => el.remove());
                    textValue = btnClone.textContent?.trim() || '';
                } else {
                    const clone = td.cloneNode(true) as HTMLElement;
                    clone.querySelectorAll('svg, select, input, [class*="text-[9px]"]').forEach(el => el.remove());
                    textValue = clone.textContent?.trim() || '';
                }

                const isDimensionCol = tdClass.includes('vertical-text') || td.querySelector('.vertical-text') !== null || currentCol <= 3;
                const isMetricCol = currentCol === 4;
                const isDataCol = currentCol >= 5;
                const cell = ws.getCell(currentRow, currentCol);

                // La columna 4 siempre contiene el nombre de la métrica
                if (isMetricCol && textValue !== '') {
                    currentMetricName = textValue.toUpperCase().trim();
                }

                // Identificar y parsear valores numéricos (solo en columnas de datos)
                const rawClean = textValue.replace(/[\$,\s]/g, '');
                const isPercent = textValue.includes('%') || currentMetricName.includes('%') || currentMetricName.includes('MARGEN') || currentMetricName.includes('YIELD %');
                const cleanNumStr = rawClean.replace('%', '');

                let isNumeric = false;
                let parsedNum = 0;
                if (isDataCol && textValue !== '-' && textValue !== '' && !isNaN(Number(cleanNumStr)) && cleanNumStr !== '') {
                    isNumeric = true;
                    parsedNum = parseFloat(cleanNumStr);
                }

                // Asignar valor y formato según la columna
                if (isDimensionCol || isMetricCol) {
                    // Dimensiones y Métricas: SIEMPRE preservan su texto íntegro
                    cell.value = textValue;
                } else if (isDataCol) {
                    // Columnas de datos (Meses y Total Acum): números reales o vacío si es 0 / guión
                    if (isNumeric && parsedNum !== 0) {
                        if (isPercent) {
                            cell.value = parsedNum > 1 ? parsedNum / 100 : parsedNum;
                            cell.numFmt = '0.0%';
                        } else if (
                            currentMetricName.includes('VIAJE') || currentMetricName.includes('FREQ') || 
                            currentMetricName.includes('FREQUENCY')
                        ) {
                            // NO MONETARIO: Viajes
                            cell.value = parsedNum;
                            cell.numFmt = Number.isInteger(parsedNum) ? '#,##0' : '0.0';
                        } else if (
                            !currentMetricName.includes('HIRE') && (
                                currentMetricName.includes('DÍA') || currentMetricName.includes('DAYS') || 
                                currentMetricName.includes('DÍAS') || currentMetricName.includes('DURACIÓN')
                            )
                        ) {
                            // NO MONETARIO: Días de operación
                            cell.value = parsedNum;
                            cell.numFmt = '0.0';
                        } else if (
                            currentMetricName.includes('TONELADA') || currentMetricName.includes('TONS') || 
                            currentMetricName.includes('CARGA') || currentMetricName.includes('BASE FLETE') || 
                            currentMetricName.includes('VOLUMEN') || currentMetricName.includes('MT')
                        ) {
                            // NO MONETARIO: Toneladas de carga
                            cell.value = parsedNum;
                            cell.numFmt = '#,##0';
                        } else if (
                            !currentMetricName.includes('HIRE') && (
                                currentMetricName.includes('USD/MT') || currentMetricName.includes('TARIFA') || 
                                currentMetricName.includes('TCE') || currentMetricName.includes('TCY') || 
                                currentMetricName.includes('$/D') || currentMetricName.includes('$/DÍA')
                            )
                        ) {
                            // MONETARIO UNITARIO: Tarifas y TCE con centavos
                            cell.value = parsedNum;
                            cell.numFmt = '#,##0.00';
                        } else {
                            // MONETARIO GLOBAL: Net Revenue, Hire, Bunker, Puertos, P&L, etc.
                            cell.value = parsedNum;
                            cell.numFmt = '#,##0';
                        }
                    } else {
                        // Ceros, guiones y vacíos en meses inactivos: celda limpia y vacía
                        cell.value = '';
                    }
                } else {
                    cell.value = textValue;
                }

                // Aplicar estilos según tipo de celda
                if (isDimensionCol) {
                    const colors = getCellArgb(tdClass, textValue, false, false);
                    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: colors?.fg || 'FF0F172A' } };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: colors?.bg || 'FFC0DAE8' }
                    };
                    // Rotación de texto vertical a 90 grados
                    cell.alignment = { vertical: 'middle', horizontal: 'center', textRotation: 90, wrapText: true };
                } else if (isGlobalTotalRow) {
                    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E1B4B' } };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFEEF2FF' } // Indigo 50
                    };
                    cell.alignment = { vertical: 'middle', horizontal: isNumeric ? 'right' : 'left' };
                } else if (isSubtotalRow) {
                    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFFBEB' } // Amber 50
                    };
                    cell.alignment = { vertical: 'middle', horizontal: isNumeric ? 'right' : 'left' };
                } else {
                    cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } };
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

    // 3. Ajustar Ancho Automático de Columnas (Calibrado al dígito más ancho)
    for (let colNum = 1; colNum <= ws.columnCount; colNum++) {
        const col = ws.getColumn(colNum);
        let maxVisualLen = 0;
        col.eachCell?.({ includeEmpty: false }, (cell, rowIdx) => {
            if (rowIdx === 1) {
                // Header (ej. "ENE 2027" -> 8 caracteres)
                maxVisualLen = Math.max(maxVisualLen, String(cell.value || '').trim().length);
            } else {
                let visualLen = 0;
                if (typeof cell.value === 'number') {
                    const num = cell.value;
                    const fmt = cell.numFmt || '';
                    if (fmt.includes('.00')) {
                        visualLen = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).length;
                    } else if (fmt.includes('%')) {
                        visualLen = `${(num * 100).toFixed(1)}%`.length;
                    } else if (fmt.includes('.0')) {
                        visualLen = num.toFixed(1).length;
                    } else {
                        visualLen = Math.round(num).toLocaleString('en-US').length;
                    }
                } else {
                    const str = String(cell.value || '').trim();
                    if (colNum >= 5 && (str === '-' || str === '')) {
                        visualLen = 0;
                    } else {
                        visualLen = str.length;
                    }
                }

                // Las dimensiones verticales no deben agrandar las columnas de meses
                if (colNum <= 3 && visualLen > 15) {
                    maxVisualLen = Math.max(maxVisualLen, 6.5);
                } else if (colNum === 4) {
                    maxVisualLen = Math.max(maxVisualLen, visualLen);
                } else {
                    maxVisualLen = Math.max(maxVisualLen, visualLen);
                }
            }
        });

        if (colNum <= 3) {
            col.width = 6.5; // Columnas de dimensiones verticales compactas
        } else if (colNum === 4) {
            col.width = 33;  // Columna de Nombres de Métricas
        } else {
            // Ancho neto calibrado exactamente al número de dígitos más largo + padding ergonómico de 2.5
            col.width = Math.max(maxVisualLen + 2.5, 11);
        }
    }

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
