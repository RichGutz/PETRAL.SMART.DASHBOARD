import { JSDOM } from 'jsdom';
import ExcelJS from 'exceljs';
import fs from 'fs';

// HTML fiel al renderizado exacto del componente React FinancialMatrixNavitransoGridTable.tsx
const realDomHtml = `
<!DOCTYPE html>
<html>
<body>
<table id="forecast-grid-table">
  <thead>
    <tr>
      <th>Cliente</th><th>Ruta</th><th>Buque</th><th>Métrica</th>
      <th>Ene 2027</th><th>Feb 2027</th><th>Mar 2027</th><th>Abr 2027</th><th>May 2027</th><th>Jun 2027</th>
      <th>Jul 2027</th><th>Ago 2027</th><th>Set 2027</th><th>Oct 2027</th><th>Nov 2027</th><th>Dic 2027</th>
      <th>TOTAL ACUM</th>
    </tr>
  </thead>
  <tbody>
    <!-- NODO 1: SPCC - ILO-CALLAO - MOQUEGUA (rowSpan Col1 = 21 porque incluye sus 5 subtotales) -->
    <tr>
      <td rowspan="21" class="bg-sky-700 text-white"><div class="vertical-text">SPCC</div></td>
      <td rowspan="16" class="bg-purple-500 text-white"><div class="vertical-text">ILO-CALLAO</div></td>
      <td rowspan="16" class="bg-green-600 text-white"><div class="vertical-text">MOQUEGUA</div><select><option value="MOQUEGUA" selected>MOQUEGUA</option></select></td>
      <td>Viajes (freq)</td>
      <td><input type="number" value="1" /></td><td><input type="number" value="1" /></td><td><input type="number" value="1" /></td><td><input type="number" value="1" /></td><td><input type="number" value="1" /></td><td><input type="number" value="1" /></td><td><input type="number" value="1" /></td><td><input type="number" value="1" /></td><td><input type="number" value="1" /></td><td><input type="number" value="1" /></td><td><input type="number" value="1" /></td><td><input type="number" value="1" /></td><td>12</td>
    </tr>
    <tr><td>VENTAS</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$3,742,200</td></tr>
    <tr><td>  HIRE</td><td>$295,000</td><td>$295,000</td><td>$295,000</td><td>$295,000</td><td>$295,000</td><td>$295,000</td><td>$295,000</td><td>$295,000</td><td>$295,000</td><td>$295,000</td><td>$295,000</td><td>$295,000</td><td>$3,540,000</td></tr>
    <tr><td>  ↳ Base Flete (TM x Tarifa)</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>162,000</td></tr>
    <tr><td>  VENTA DE TERCEROS</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td></tr>
    <tr><td>  DEMORAS</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$120,000</td></tr>
    <tr><td>  ↳ Demurrage Revenue (Días x Rate)</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$10,000</td><td>$120,000</td></tr>
    <tr><td>  INGRESOS DE PUERTO</td><td>$6,850</td><td>$6,850</td><td>$6,850</td><td>$6,850</td><td>$6,850</td><td>$6,850</td><td>$6,850</td><td>$6,850</td><td>$6,850</td><td>$6,850</td><td>$6,850</td><td>$6,850</td><td>$82,200</td></tr>
    <tr><td>  OTROS INGRESOS</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td></tr>
    <tr><td>COSTOS DIRECTOS</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$1,800,000</td></tr>
    <tr><td>  COMBUSTIBLE</td><td>$60,000</td><td>$60,000</td><td>$60,000</td><td>$60,000</td><td>$60,000</td><td>$60,000</td><td>$60,000</td><td>$60,000</td><td>$60,000</td><td>$60,000</td><td>$60,000</td><td>$60,000</td><td>$720,000</td></tr>
    <tr><td>  GASTOS DE PUERTO</td><td>$50,000</td><td>$50,000</td><td>$50,000</td><td>$50,000</td><td>$50,000</td><td>$50,000</td><td>$50,000</td><td>$50,000</td><td>$50,000</td><td>$50,000</td><td>$50,000</td><td>$50,000</td><td>$600,000</td></tr>
    <tr><td>  COSTOS DE DEMORA</td><td>$40,000</td><td>$40,000</td><td>$40,000</td><td>$40,000</td><td>$40,000</td><td>$40,000</td><td>$40,000</td><td>$40,000</td><td>$40,000</td><td>$40,000</td><td>$40,000</td><td>$40,000</td><td>$480,000</td></tr>
    <tr><td>TIME CHARTER EQUIVALENT</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$1,942,200</td></tr>
    <tr><td>  COSTO DE ARRIENDO NAVES</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$917,160</td></tr>
    <tr><td>MARGEN BRUTO</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$1,025,040</td></tr>

    <!-- SUBTOTAL CLIENTE SPCC (Col1 ocupado por el rowspan=21 de arriba) -->
    <tr>
      <td rowspan="5" class="bg-slate-800 text-amber-400 font-bold"><div class="vertical-text">Σ SUBTOTAL</div></td>
      <td rowspan="5" class="bg-slate-800 text-amber-400 font-bold"><div class="vertical-text">TOTAL SPCC</div></td>
      <td>VENTAS</td>
      <td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$3,742,200</td>
    </tr>
    <tr><td>COSTOS DIRECTOS</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$1,800,000</td></tr>
    <tr><td>TIME CHARTER EQUIVALENT</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$1,942,200</td></tr>
    <tr><td>  COSTO DE ARRIENDO NAVES</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$917,160</td></tr>
    <tr><td>MARGEN BRUTO (P&amp;L)</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$1,025,040</td></tr>

    <!-- TOTAL FLOTA (ColSpan=3, RowSpan=5) -->
    <tr>
      <td rowspan="5" colspan="3" class="bg-slate-800 text-white font-bold"><div class="vertical-text">TOTAL FLOTA</div></td>
      <td>VENTAS CONSOLIDADAS</td>
      <td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$3,742,200</td>
    </tr>
    <tr><td>COSTOS DIRECTOS</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$150,000</td><td>$1,800,000</td></tr>
    <tr><td>TIME CHARTER EQUIVALENT</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$161,850</td><td>$1,942,200</td></tr>
    <tr><td>  COSTO DE ARRIENDO NAVES</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$76,430</td><td>$917,160</td></tr>
    <tr><td>MARGEN BRUTO (P&amp;L)</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$1,025,040</td></tr>
  </tbody>
</table>
</body>
</html>
`;

const dom = new JSDOM(realDomHtml);
const table = dom.window.document.getElementById('forecast-grid-table');

async function testFullExportReal() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Matriz NAVITRANSO', {
        views: [{ showGridLines: true, state: 'frozen', ySplit: 1, xSplit: 0, zoomScale: 65, zoomScaleNormal: 65 }]
    });
    ws.views = [{ showGridLines: true, state: 'frozen', ySplit: 1, xSplit: 0, zoomScale: 65, zoomScaleNormal: 65 }];

    const occupied = [];
    const setOccupied = (r, c, rSpan, cSpan) => {
        for (let row = r; row < r + rSpan; row++) {
            if (!occupied[row]) occupied[row] = [];
            for (let col = c; col < c + cSpan; col++) occupied[row][col] = true;
        }
    };
    const isOccupied = (r, c) => !!(occupied[r] && occupied[r][c]);

    let currentRow = 1;
    const thead = table.querySelector('thead');
    if (thead) {
        thead.querySelectorAll('tr').forEach(tr => {
            let currentCol = 1;
            tr.querySelectorAll('th').forEach(th => {
                while (isOccupied(currentRow, currentCol)) currentCol++;
                const rSpan = parseInt(th.getAttribute('rowspan') || '1', 10);
                const cSpan = parseInt(th.getAttribute('colspan') || '1', 10);
                const cleanText = th.textContent?.trim() || '';

                const cell = ws.getCell(currentRow, currentCol);
                cell.value = cleanText.toUpperCase();
                cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };

                if (rSpan > 1 || cSpan > 1) ws.mergeCells(currentRow, currentCol, currentRow + rSpan - 1, currentCol + cSpan - 1);
                setOccupied(currentRow, currentCol, rSpan, cSpan);
                currentCol += cSpan;
            });
            ws.getRow(currentRow).height = 25;
            currentRow++;
        });
    }

    const tbody = table.querySelector('tbody');
    if (tbody) {
        tbody.querySelectorAll('tr').forEach(tr => {
            let currentCol = 1;
            let currentMetricName = '';
            tr.querySelectorAll('td').forEach(td => {
                while (isOccupied(currentRow, currentCol)) currentCol++;
                const rSpan = parseInt(td.getAttribute('rowspan') || '1', 10);
                const cSpan = parseInt(td.getAttribute('colspan') || '1', 10);

                let textValue = '';
                const vertDiv = td.querySelector('.vertical-text');
                const inputEl = td.querySelector('input');
                if (vertDiv) textValue = vertDiv.textContent?.trim() || '';
                else if (inputEl) textValue = (inputEl).value || '';
                else {
                    const clone = td.cloneNode(true);
                    clone.querySelectorAll('select, button, svg').forEach(el => el.remove());
                    textValue = clone.textContent?.trim() || '';
                }

                const isDimensionCol = currentCol <= 3;
                const isMetricCol = currentCol === 4;
                const isDataCol = currentCol >= 5;
                const cell = ws.getCell(currentRow, currentCol);

                if (isMetricCol && textValue !== '') currentMetricName = textValue.toUpperCase().trim();

                const rawClean = textValue.replace(/[\$,\s]/g, '');
                const isPercent = textValue.includes('%') || currentMetricName.includes('%');
                const cleanNumStr = rawClean.replace('%', '');

                let isNumeric = false;
                let parsedNum = 0;
                if (isDataCol && textValue !== '-' && textValue !== '' && !isNaN(Number(cleanNumStr)) && cleanNumStr !== '') {
                    isNumeric = true;
                    parsedNum = parseFloat(cleanNumStr);
                }

                if (isDimensionCol || isMetricCol) {
                    cell.value = textValue;
                } else if (isDataCol) {
                    if (isNumeric && parsedNum !== 0) {
                        if (isPercent) {
                            cell.value = parsedNum > 1 ? parsedNum / 100 : parsedNum;
                            cell.numFmt = '0.0%';
                        } else if (currentMetricName.includes('VIAJE') || currentMetricName.includes('FREQ')) {
                            cell.value = parsedNum;
                            cell.numFmt = '#,##0';
                        } else if (currentMetricName.includes('BASE FLETE') || currentMetricName.includes('TONELADA')) {
                            cell.value = parsedNum;
                            cell.numFmt = '#,##0';
                        } else {
                            cell.value = parsedNum;
                            cell.numFmt = '$#,##0';
                        }
                    } else {
                        cell.value = '';
                    }
                }

                if (isDimensionCol) {
                    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F4C81' } };
                    cell.alignment = { vertical: 'middle', horizontal: 'center', textRotation: 90 };
                } else if (currentMetricName.includes('MARGEN BRUTO')) {
                    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF312E81' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
                    cell.alignment = { vertical: 'middle', horizontal: isNumeric ? 'right' : 'left' };
                } else {
                    cell.font = { name: 'Segoe UI', size: 8.5, color: { argb: 'FF334155' } };
                    cell.alignment = { vertical: 'middle', horizontal: isNumeric ? 'right' : 'left' };
                }

                if (rSpan > 1 || cSpan > 1) ws.mergeCells(currentRow, currentCol, currentRow + rSpan - 1, currentCol + cSpan - 1);
                setOccupied(currentRow, currentCol, rSpan, cSpan);
                currentCol += cSpan;
            });
            ws.getRow(currentRow).height = 19;
            currentRow++;
        });
    }

    for (let colNum = 1; colNum <= ws.columnCount; colNum++) {
        const col = ws.getColumn(colNum);
        let maxVisualLen = 0;
        col.eachCell({ includeEmpty: false }, (cell, rowIdx) => {
            if (rowIdx === 1) maxVisualLen = Math.max(maxVisualLen, String(cell.value || '').trim().length);
            else {
                let visualLen = 0;
                if (typeof cell.value === 'number') {
                    const num = cell.value;
                    const fmt = cell.numFmt || '';
                    if (fmt.includes('$')) visualLen = ('$' + Math.round(num).toLocaleString('en-US')).length;
                    else if (fmt.includes('%')) visualLen = ((num * 100).toFixed(1) + '%').length;
                    else visualLen = (Math.round(num).toLocaleString('en-US')).length;
                } else visualLen = String(cell.value || '').trim().length;

                if (colNum <= 3 && visualLen > 15) maxVisualLen = Math.max(maxVisualLen, 6.5);
                else maxVisualLen = Math.max(maxVisualLen, visualLen);
            }
        });

        if (colNum <= 3) col.width = 6.5;
        else if (colNum === 4) col.width = 36;
        else col.width = Math.max(maxVisualLen + 2.5, 11);
    }

    await wb.xlsx.writeFile('test_navitranso_full_qc.xlsx');
    console.log('✅ Archivo test_navitranso_full_qc.xlsx generado con éxito.');
}

testFullExportReal();
