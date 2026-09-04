/**
 * SERVICIO DEDICADO DE EXPORTACIÓN A EXCEL PARA MATRIZ NAVITRANSO (100% AISLADO)
 * 
 * Genera el archivo XLSX nativo para la estructura contable de 4 bloques de NAVITRANSO:
 * 1. INGRESOS DE OPERACIÓN
 * 2. COSTOS DIRECTOS DE VIAJE
 * 3. TIME CHARTER EQUIVALENT (TCE)
 * 4. MARGEN BRUTO
 * 
 * Configuración:
 * - Zoom panorámico al 65% nativo (zoomScale: 65).
 * - Calibración dinámica de ancho de columna neto basada en dígitos formateados.
 * - Cero interferencia con la Matriz PETRAL.
 */

import ExcelJS from 'exceljs';

// Colores ARGB con 75% de transparencia (25% tint pastel) para ahorro de tinta
function getNavitransoCellArgb(className: string, text: string, isHeader = false, isTotalAcum = false) {
    if (isHeader) {
        if (isTotalAcum) {
            return { bg: 'FF0D9488', fg: 'FFFFFFFF' }; // Teal 600
        }
        return { bg: 'FF0F172A', fg: 'FFFFFFFF' }; // Slate 900
    }

    const upper = (text || '').toUpperCase();

    // Bloques principales y subtotales NAVITRANSO
    if (upper.includes('MARGEN BRUTO')) {
        return { bg: 'FFEEF2FF', fg: 'FF312E81' }; // Indigo 900 (Total P&L)
    }
    if (upper.includes('INGRESOS DE OPERACIÓN') || upper.includes('INGRESOS DE OPERACION')) {
        return { bg: 'FFF0FDF4', fg: 'FF14532D' }; // Green 900
    }
    if (upper.includes('COSTOS DIRECTOS DE VIAJE')) {
        return { bg: 'FFFEF2F2', fg: 'FF7F1D1D' }; // Red 900
    }
    if (upper.includes('TIME CHARTER EQUIVALENT') || upper.includes('TCE')) {
        return { bg: 'FFEFF6FF', fg: 'FF1E3A8A' }; // Blue 900
    }
    if (upper.includes('TOTAL FLOTA')) {
        return { bg: 'FFC7CACE', fg: 'FF0F172A' };
    }
    if (upper.includes('TOTAL') || upper.includes('SUBTOTAL')) {
        return { bg: 'FFFEF3C7', fg: 'FF78350F' }; // Amber soft
    }

    // Colores de Clientes (75% transparencia / 25% tint)
    if (upper.includes('SPCC')) return { bg: 'FFC0DAE8', fg: 'FF0369A1' };
    if (upper.includes('SPOT')) return { bg: 'FFFEDCC5', fg: 'FFC2410C' };
    if (upper.includes('NEXA')) return { bg: 'FFC3D2E0', fg: 'FF0F4C81' };

    // Colores de Rutas (75% transparencia / 25% tint)
    if (upper.includes('MATARANI')) return { bg: 'FFC1EDF4', fg: 'FF0E7490' };
    if (upper.includes('MARCONA')) return { bg: 'FFE9D5FD', fg: 'FF6B21A8' };
    if (upper.includes('MEJILLONES')) return { bg: 'FFF6D1FB', fg: 'FF86198F' };

    // Colores de Buques (75% transparencia / 25% tint)
    if (upper.includes('TABLONES')) return { bg: 'FFF6C9C9', fg: 'FF991B1B' };
    if (upper.includes('MOQUEGUA')) return { bg: 'FFC5E8D2', fg: 'FF166534' };
    if (upper.includes('CONCON')) return { bg: 'FFD1D5DA', fg: 'FF1E293B' };
    if (upper.includes('HUEMUL')) return { bg: 'FFD3D1F9', fg: 'FF3730A3' };

    return null;
}

export async function exportFinancialMatrixNavitransoExcel(tableId: string = 'forecast-grid-table'): Promise<void> {
    const table = document.getElementById(tableId);
    if (!table) {
        throw new Error(`Tabla con ID "${tableId}" no encontrada en el DOM.`);
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = 'PETRAL SMART DASHBOARD - MOTOR NAVITRANSO';
    wb.created = new Date();

    const ws = wb.addWorksheet('Matriz NAVITRANSO', {
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
    const isOccupied = (r: number, c: number) => !!(occupied[r] && occupied[r][c]);

    let currentRow = 1;

    // 1. THEAD
    const thead = table.querySelector('thead');
    if (thead) {
        const trs = thead.querySelectorAll('tr');
        trs.forEach(tr => {
            let currentCol = 1;
            const ths = tr.querySelectorAll('th');
            ths.forEach(th => {
                while (isOccupied(currentRow, currentCol)) currentCol++;
                const rSpan = parseInt(th.getAttribute('rowspan') || '1', 10);
                const cSpan = parseInt(th.getAttribute('colspan') || '1', 10);
                let cleanText = th.textContent?.trim() || '';

                if (currentCol === 1) cleanText = 'C';
                else if (currentCol === 2) cleanText = 'R';
                else if (currentCol === 3) cleanText = 'B';

                const cell = ws.getCell(currentRow, currentCol);
                cell.value = cleanText.toUpperCase();
                
                const isTotalAcum = cleanText.toUpperCase().includes('TOTAL ACUM');
                const colors = getNavitransoCellArgb(th.className, cleanText, true, isTotalAcum);

                cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colors?.fg || 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors?.bg || 'FF0F172A' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF334155' } },
                    bottom: { style: 'thin', color: { argb: 'FF334155' } },
                    left: { style: 'thin', color: { argb: 'FF334155' } },
                    right: { style: 'thin', color: { argb: 'FF334155' } }
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

    // 2. TBODY
    const tbody = table.querySelector('tbody');
    if (tbody) {
        const trs = tbody.querySelectorAll('tr');
        trs.forEach(tr => {
            let currentCol = 1;
            const trClass = tr.className || '';
            const isSubtotalRow = trClass.includes('subtotal') || trClass.includes('TOTAL') || trClass.includes('MARGEN BRUTO');
            let currentMetricName = '';

            const tds = tr.querySelectorAll('td');
            tds.forEach(td => {
                while (isOccupied(currentRow, currentCol)) currentCol++;
                const rSpan = parseInt(td.getAttribute('rowspan') || '1', 10);
                const cSpan = parseInt(td.getAttribute('colspan') || '1', 10);
                const tdClass = td.className || '';

                // Extraer texto limpio ignorando selects/dropdowns y soportando inputs
                let textValue = '';
                const vertDiv = td.querySelector('.vertical-text');
                const inputEl = td.querySelector('input');
                if (vertDiv) {
                    textValue = vertDiv.textContent?.trim() || '';
                } else if (inputEl) {
                    textValue = (inputEl as HTMLInputElement).value || '';
                } else {
                    const clone = td.cloneNode(true) as HTMLElement;
                    clone.querySelectorAll('select, button, svg').forEach(el => el.remove());
                    textValue = clone.textContent?.trim() || '';
                }

                const isDimensionCol = tdClass.includes('vertical-text') || td.querySelector('.vertical-text') !== null || currentCol <= 3;
                const isMetricCol = currentCol === 4;
                const isDataCol = currentCol >= 5;
                const cell = ws.getCell(currentRow, currentCol);

                if (isMetricCol && textValue !== '') {
                    currentMetricName = textValue.toUpperCase().trim();
                }

                // Limpieza numérica
                const rawClean = textValue.replace(/[\$,\s]/g, '');
                const isPercent = textValue.includes('%') || currentMetricName.includes('%');
                const cleanNumStr = rawClean.replace('%', '');

                let isNumeric = false;
                let parsedNum = 0;
                if (isDataCol && textValue !== '-' && textValue !== '' && !isNaN(Number(cleanNumStr)) && cleanNumStr !== '') {
                    isNumeric = true;
                    parsedNum = parseFloat(cleanNumStr);
                }

                // Asignar valor y formato numérico
                if (isDimensionCol || isMetricCol) {
                    cell.value = textValue;
                } else if (isDataCol) {
                    if (isNumeric && parsedNum !== 0) {
                        if (isPercent) {
                            cell.value = parsedNum > 1 ? parsedNum / 100 : parsedNum;
                            cell.numFmt = '0.0%';
                        } else if (currentMetricName.includes('VIAJE') || currentMetricName.includes('FREQ')) {
                            cell.value = parsedNum;
                            cell.numFmt = Number.isInteger(parsedNum) ? '#,##0' : '0.0';
                        } else if (currentMetricName.includes('DÍA') || currentMetricName.includes('DAYS') || currentMetricName.includes('DÍAS')) {
                            cell.value = parsedNum;
                            cell.numFmt = '0.0';
                        } else if (currentMetricName.includes('TONELADA') || currentMetricName.includes('TONS') || currentMetricName.includes('CARGA')) {
                            cell.value = parsedNum;
                            cell.numFmt = '#,##0';
                        } else if (currentMetricName.includes('USD/MT') || currentMetricName.includes('TARIFA') || currentMetricName.includes('TCE') || currentMetricName.includes('$/D')) {
                            cell.value = parsedNum;
                            cell.numFmt = '#,##0.00';
                        } else {
                            cell.value = parsedNum;
                            cell.numFmt = '#,##0';
                        }
                    } else {
                        cell.value = '';
                    }
                } else {
                    cell.value = textValue;
                }

                // Estilos por tipo de celda
                if (isDimensionCol) {
                    const colors = getNavitransoCellArgb(tdClass, textValue, false, false);
                    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: colors?.fg || 'FF0F172A' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors?.bg || 'FFC0DAE8' } };
                    cell.alignment = { vertical: 'middle', horizontal: 'center', textRotation: 90, wrapText: true };
                } else if (currentMetricName.includes('MARGEN BRUTO')) {
                    // Fila de Margen Bruto (Destacada)
                    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF312E81' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
                    cell.alignment = { vertical: 'middle', horizontal: isNumeric ? 'right' : 'left' };
                } else if (currentMetricName.includes('INGRESOS DE OPERACIÓN') || currentMetricName.includes('COSTOS DIRECTOS') || currentMetricName.includes('TIME CHARTER EQUIVALENT')) {
                    // Cabeceras de Bloques Contables
                    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                    cell.alignment = { vertical: 'middle', horizontal: isNumeric ? 'right' : 'left' };
                } else if (isSubtotalRow) {
                    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                    cell.alignment = { vertical: 'middle', horizontal: isNumeric ? 'right' : 'left' };
                } else {
                    cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } };
                    cell.alignment = { vertical: 'middle', horizontal: isNumeric ? 'right' : 'left' };
                }

                // Bordes discretos
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                };

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
            col.width = 6.5; // Dimensiones verticales compactas
        } else if (colNum === 4) {
            col.width = 36;  // Métricas NAVITRANSO
        } else {
            col.width = Math.max(maxVisualLen + 2.5, 11);
        }
    }

    // 4. Descargar archivo XLSX
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Navitranso_Forecast_Matriz_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
