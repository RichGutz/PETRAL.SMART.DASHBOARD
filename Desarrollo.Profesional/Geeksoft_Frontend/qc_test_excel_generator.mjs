import { JSDOM } from 'jsdom';
import ExcelJS from 'exceljs';
import fs from 'fs';

// Helper de color ARGB
function getCellArgb(className, text, isHeader = false, isTotalAcum = false) {
    if (isHeader) {
        if (isTotalAcum) return { bg: 'FF0D9488', fg: 'FFFFFFFF' };
        return { bg: 'FF0F172A', fg: 'FFFFFFFF' };
    }
    const upper = (text || '').toUpperCase();
    if (upper.includes('TOTAL ACUMULADO')) return { bg: 'FF0D9488', fg: 'FFFFFFFF' };
    if (upper.includes('TOTAL FLOTA')) return { bg: 'FF1E293B', fg: 'FFFFFFFF' };
    if (upper.includes('SUBTOTAL') || upper.includes('TOTAL CLIENT')) return { bg: 'FF1E293B', fg: 'FFFBBF24' };
    return null;
}

// Generar tabla HTML completa de prueba con TOTAL FLOTA y TOTAL ACUMULADO (15 filas cada una)
const htmlContent = `
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
    <!-- Fila Normal SPCC -->
    <tr>
      <td rowspan="4" class="bg-sky-700 text-white"><div class="vertical-text">SPCC</div></td>
      <td rowspan="4" class="bg-purple-500 text-white"><div class="vertical-text">ILO-CALLAO</div></td>
      <td rowspan="4" class="bg-green-600 text-white"><div class="vertical-text">MOQUEGUA</div></td>
      <td>Viajes (freq)</td>
      <td>1</td><td>1</td><td>1</td><td>1</td><td>1</td><td>1</td><td>1</td><td>1</td><td>1</td><td>1</td><td>1</td><td>1</td><td>12</td>
    </tr>
    <tr><td>Toneladas</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>13,500</td><td>162,000</td></tr>
    <tr><td>Net Revenue</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$311,850</td><td>$3,742,200</td></tr>
    <tr><td>(=) VOYAGE RESULT / P&amp;L</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$85,420</td><td>$1,025,040</td></tr>
    
    <!-- TOTAL FLOTA (15 FILAS DESPLEGADAS) -->
    <tr class="TOTAL FLOTA">
      <td rowspan="15" class="bg-slate-800 text-white"><div class="vertical-text">TOTAL FLOTA</div></td>
      <td></td><td></td><td>Viajes</td>
      <td>5</td><td>5</td><td>5</td><td>6</td><td>5</td><td>5</td><td>5</td><td>6</td><td>6</td><td>5</td><td>6</td><td>7</td><td>66</td>
    </tr>
    <tr class="TOTAL FLOTA"><td></td><td></td><td>Días-Buque</td><td>26.9</td><td>26.9</td><td>26.9</td><td>32.8</td><td>26.9</td><td>26.9</td><td>26.9</td><td>32.8</td><td>32.8</td><td>26.9</td><td>32.8</td><td>38.7</td><td>354.2</td></tr>
    <tr class="TOTAL FLOTA"><td></td><td></td><td>Toneladas</td><td>67,500</td><td>67,500</td><td>67,500</td><td>81,000</td><td>67,500</td><td>67,500</td><td>67,500</td><td>81,000</td><td>81,000</td><td>67,500</td><td>81,000</td><td>94,500</td><td>891,000</td></tr>
    <tr class="TOTAL FLOTA"><td></td><td></td><td>Net Revenue</td><td>$1,539,665</td><td>$1,539,665</td><td>$1,539,665</td><td>$1,847,598</td><td>$1,539,665</td><td>$1,539,665</td><td>$1,539,665</td><td>$1,847,598</td><td>$1,847,598</td><td>$1,539,665</td><td>$1,847,598</td><td>$2,155,531</td><td>$20,323,578</td></tr>
    <tr class="TOTAL FLOTA"><td></td><td></td><td>↳ (+) Freight Revenue</td><td>$1,450,000</td><td>$1,450,000</td><td>$1,450,000</td><td>$1,740,000</td><td>$1,450,000</td><td>$1,450,000</td><td>$1,450,000</td><td>$1,740,000</td><td>$1,740,000</td><td>$1,450,000</td><td>$1,740,000</td><td>$2,030,000</td><td>$19,140,000</td></tr>
    <tr class="TOTAL FLOTA"><td></td><td></td><td>↳ (+) Demurrage</td><td>$50,000</td><td>$50,000</td><td>$50,000</td><td>$60,000</td><td>$50,000</td><td>$50,000</td><td>$50,000</td><td>$60,000</td><td>$60,000</td><td>$50,000</td><td>$60,000</td><td>$70,000</td><td>$660,000</td></tr>
    <tr class="TOTAL FLOTA"><td></td><td></td><td>↳ (+) Dockage Revenue</td><td>$39,665</td><td>$39,665</td><td>$39,665</td><td>$47,598</td><td>$39,665</td><td>$39,665</td><td>$39,665</td><td>$47,598</td><td>$47,598</td><td>$39,665</td><td>$47,598</td><td>$55,531</td><td>$523,578</td></tr>
    <tr class="TOTAL FLOTA"><td></td><td></td><td>↳ (=) Gross Revenue</td><td>$1,539,665</td><td>$1,539,665</td><td>$1,539,665</td><td>$1,847,598</td><td>$1,539,665</td><td>$1,539,665</td><td>$1,539,665</td><td>$1,847,598</td><td>$1,847,598</td><td>$1,539,665</td><td>$1,847,598</td><td>$2,155,531</td><td>$20,323,578</td></tr>
    <tr class="TOTAL FLOTA"><td></td><td></td><td>↳ (-) Comisiones</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td></tr>
    <tr class="TOTAL FLOTA"><td></td><td></td><td>(-) Hire (TCE x días)</td><td>$372,050</td><td>$372,050</td><td>$372,050</td><td>$446,460</td><td>$372,050</td><td>$372,050</td><td>$372,050</td><td>$446,460</td><td>$446,460</td><td>$372,050</td><td>$446,460</td><td>$520,870</td><td>$4,911,060</td></tr>
    <tr class="TOTAL FLOTA"><td></td><td></td><td>(-) Bunker Costs</td><td>$201,247</td><td>$201,247</td><td>$201,247</td><td>$241,496</td><td>$201,247</td><td>$201,247</td><td>$201,247</td><td>$241,496</td><td>$241,496</td><td>$201,247</td><td>$241,496</td><td>$281,745</td><td>$2,656,464</td></tr>
    <tr class="TOTAL FLOTA"><td></td><td></td><td>(-) Port Costs</td><td>$255,000</td><td>$255,000</td><td>$255,000</td><td>$306,000</td><td>$255,000</td><td>$255,000</td><td>$255,000</td><td>$306,000</td><td>$306,000</td><td>$255,000</td><td>$306,000</td><td>$357,000</td><td>$3,366,000</td></tr>
    <tr class="TOTAL FLOTA"><td></td><td></td><td>(-) Dockage</td><td>$84,500</td><td>$84,500</td><td>$84,500</td><td>$101,400</td><td>$84,500</td><td>$84,500</td><td>$84,500</td><td>$101,400</td><td>$101,400</td><td>$84,500</td><td>$101,400</td><td>$118,300</td><td>$1,115,400</td></tr>
    <tr class="TOTAL FLOTA"><td></td><td></td><td>(-) Arriendo de Naves</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td></tr>
    <tr class="TOTAL FLOTA"><td></td><td></td><td>(=) VOYAGE RESULT / P&amp;L</td><td>$626,868</td><td>$626,868</td><td>$626,868</td><td>$752,242</td><td>$626,868</td><td>$626,868</td><td>$626,868</td><td>$752,242</td><td>$752,242</td><td>$626,868</td><td>$752,242</td><td>$877,615</td><td>$8,274,254</td></tr>

    <!-- TOTAL ACUMULADO (15 FILAS DESPLEGADAS) -->
    <tr class="TOTAL ACUMULADO">
      <td rowspan="15" class="bg-teal-700 text-white"><div class="vertical-text">TOTAL ACUMULADO</div></td>
      <td></td><td></td><td>Viajes</td>
      <td>5</td><td>10</td><td>15</td><td>21</td><td>26</td><td>31</td><td>36</td><td>42</td><td>48</td><td>53</td><td>59</td><td>66</td><td>66</td>
    </tr>
    <tr class="TOTAL ACUMULADO"><td></td><td></td><td>Días-Buque</td><td>26.9</td><td>53.8</td><td>80.7</td><td>113.5</td><td>140.4</td><td>167.3</td><td>194.2</td><td>227.0</td><td>259.8</td><td>286.7</td><td>319.5</td><td>358.2</td><td>358.2</td></tr>
    <tr class="TOTAL ACUMULADO"><td></td><td></td><td>Toneladas</td><td>67,500</td><td>135,000</td><td>202,500</td><td>283,500</td><td>351,000</td><td>418,500</td><td>486,000</td><td>567,000</td><td>648,000</td><td>715,500</td><td>796,500</td><td>891,000</td><td>891,000</td></tr>
    <tr class="TOTAL ACUMULADO"><td></td><td></td><td>Net Revenue</td><td>$1,539,665</td><td>$3,079,330</td><td>$4,618,995</td><td>$6,466,593</td><td>$8,006,258</td><td>$9,545,923</td><td>$11,085,588</td><td>$12,933,186</td><td>$14,780,784</td><td>$16,320,449</td><td>$18,168,047</td><td>$20,323,578</td><td>$20,323,578</td></tr>
    <tr class="TOTAL ACUMULADO"><td></td><td></td><td>↳ (+) Freight Revenue</td><td>$1,450,000</td><td>$2,900,000</td><td>$4,350,000</td><td>$6,090,000</td><td>$7,540,000</td><td>$8,990,000</td><td>$10,440,000</td><td>$12,180,000</td><td>$13,920,000</td><td>$15,370,000</td><td>$17,110,000</td><td>$19,140,000</td><td>$19,140,000</td></tr>
    <tr class="TOTAL ACUMULADO"><td></td><td></td><td>↳ (+) Demurrage</td><td>$50,000</td><td>$100,000</td><td>$150,000</td><td>$210,000</td><td>$260,000</td><td>$310,000</td><td>$360,000</td><td>$420,000</td><td>$480,000</td><td>$530,000</td><td>$590,000</td><td>$660,000</td><td>$660,000</td></tr>
    <tr class="TOTAL ACUMULADO"><td></td><td></td><td>↳ (+) Dockage Revenue</td><td>$39,665</td><td>$79,330</td><td>$118,995</td><td>$166,593</td><td>$206,258</td><td>$245,923</td><td>$285,588</td><td>$333,186</td><td>$380,784</td><td>$420,449</td><td>$468,047</td><td>$523,578</td><td>$523,578</td></tr>
    <tr class="TOTAL ACUMULADO"><td></td><td></td><td>↳ (=) Gross Revenue</td><td>$1,539,665</td><td>$3,079,330</td><td>$4,618,995</td><td>$6,466,593</td><td>$8,006,258</td><td>$9,545,923</td><td>$11,085,588</td><td>$12,933,186</td><td>$14,780,784</td><td>$16,320,449</td><td>$18,168,047</td><td>$20,323,578</td><td>$20,323,578</td></tr>
    <tr class="TOTAL ACUMULADO"><td></td><td></td><td>↳ (-) Comisiones</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td></tr>
    <tr class="TOTAL ACUMULADO"><td></td><td></td><td>(-) Hire (TCE x días)</td><td>$372,050</td><td>$744,100</td><td>$1,116,150</td><td>$1,562,610</td><td>$1,934,660</td><td>$2,306,710</td><td>$2,678,760</td><td>$3,125,220</td><td>$3,571,680</td><td>$3,943,730</td><td>$4,390,190</td><td>$4,911,060</td><td>$4,911,060</td></tr>
    <tr class="TOTAL ACUMULADO"><td></td><td></td><td>(-) Bunker Costs</td><td>$201,247</td><td>$402,494</td><td>$603,741</td><td>$845,237</td><td>$1,046,484</td><td>$1,247,731</td><td>$1,448,978</td><td>$1,690,474</td><td>$1,931,970</td><td>$2,133,217</td><td>$2,374,713</td><td>$2,656,464</td><td>$2,656,464</td></tr>
    <tr class="TOTAL ACUMULADO"><td></td><td></td><td>(-) Port Costs</td><td>$255,000</td><td>$510,000</td><td>$765,000</td><td>$1,071,000</td><td>$1,326,000</td><td>$1,581,000</td><td>$1,836,000</td><td>$2,142,000</td><td>$2,448,000</td><td>$2,703,000</td><td>$3,009,000</td><td>$3,366,000</td><td>$3,366,000</td></tr>
    <tr class="TOTAL ACUMULADO"><td></td><td></td><td>(-) Dockage</td><td>$84,500</td><td>$169,000</td><td>$253,500</td><td>$354,900</td><td>$439,400</td><td>$523,900</td><td>$608,400</td><td>$709,800</td><td>$811,200</td><td>$895,700</td><td>$997,100</td><td>$1,115,400</td><td>$1,115,400</td></tr>
    <tr class="TOTAL ACUMULADO"><td></td><td></td><td>(-) Arriendo de Naves</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td></tr>
    <tr class="TOTAL ACUMULADO"><td></td><td></td><td>(=) VOYAGE RESULT / P&amp;L</td><td>$626,868</td><td>$1,253,736</td><td>$1,880,604</td><td>$2,632,846</td><td>$3,259,714</td><td>$3,886,582</td><td>$4,513,450</td><td>$5,265,692</td><td>$6,017,934</td><td>$6,644,802</td><td>$7,397,044</td><td>$8,274,254</td><td>$8,274,254</td></tr>
  </tbody>
</table>
</body>
</html>
`;

const dom = new JSDOM(htmlContent);
const table = dom.window.document.getElementById('forecast-grid-table');

async function runExport() {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'PETRAL SMART DASHBOARD';
    wb.created = new Date();

    const ws = wb.addWorksheet('Matriz Financiera', {
        views: [{ showGridLines: true, state: 'frozen', ySplit: 1, xSplit: 0, zoomScale: 65, zoomScaleNormal: 65 }]
    });
    ws.views = [{ showGridLines: true, state: 'frozen', ySplit: 1, xSplit: 0, zoomScale: 65, zoomScaleNormal: 65 }];

    const occupied = [];
    const setOccupied = (r, c, rSpan, cSpan) => {
        for (let row = r; row < r + rSpan; row++) {
            if (!occupied[row]) occupied[row] = [];
            for (let col = c; col < c + cSpan; col++) {
                occupied[row][col] = true;
            }
        }
    };
    const isOccupied = (r, c) => !!(occupied[r] && occupied[r][c]);

    let currentRow = 1;

    // 1. THEAD
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
                const isTotalAcum = cleanText.toUpperCase().includes('TOTAL ACUM');
                const colors = getCellArgb(th.className, cleanText, true, isTotalAcum);

                cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors?.fg || 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors?.bg || 'FF1E293B' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

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
        tbody.querySelectorAll('tr').forEach(tr => {
            let currentCol = 1;
            const trClass = tr.className || '';
            const isGlobalTotalRow = trClass.includes('TOTAL ACUMULADO') || trClass.includes('TOTAL FLOTA');
            let currentMetricName = '';

            tr.querySelectorAll('td').forEach(td => {
                while (isOccupied(currentRow, currentCol)) currentCol++;
                const rSpan = parseInt(td.getAttribute('rowspan') || '1', 10);
                const cSpan = parseInt(td.getAttribute('colspan') || '1', 10);
                const tdClass = td.className || '';

                let textValue = '';
                const vertDiv = td.querySelector('.vertical-text');
                if (vertDiv) {
                    textValue = vertDiv.textContent?.trim() || '';
                } else {
                    textValue = td.textContent?.trim() || '';
                }

                const isDimensionCol = tdClass.includes('vertical-text') || td.querySelector('.vertical-text') !== null || currentCol <= 3;
                const isMetricCol = currentCol === 4;
                const isDataCol = currentCol >= 5;
                const cell = ws.getCell(currentRow, currentCol);

                if (isMetricCol && textValue !== '') {
                    currentMetricName = textValue.toUpperCase().trim();
                }

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
                            cell.numFmt = Number.isInteger(parsedNum) ? '#,##0' : '0.0';
                        } else if (currentMetricName.includes('DÍA') || currentMetricName.includes('DAYS') || currentMetricName.includes('DÍAS')) {
                            cell.value = parsedNum;
                            cell.numFmt = '0.0';
                        } else if (currentMetricName.includes('TONELADA') || currentMetricName.includes('TONS') || currentMetricName.includes('CARGA')) {
                            cell.value = parsedNum;
                            cell.numFmt = '#,##0';
                        } else if (currentMetricName.includes('USD/MT') || currentMetricName.includes('TARIFA') || currentMetricName.includes('TCE') || currentMetricName.includes('$/D')) {
                            cell.value = parsedNum;
                            cell.numFmt = '$#,##0.00';
                        } else {
                            cell.value = parsedNum;
                            cell.numFmt = '$#,##0';
                        }
                    } else {
                        cell.value = '';
                    }
                } else {
                    cell.value = textValue;
                }

                if (isDimensionCol) {
                    const colors = getCellArgb(tdClass, textValue, false, false);
                    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors?.fg || 'FFFFFFFF' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors?.bg || 'FF0F4C81' } };
                    cell.alignment = { vertical: 'middle', horizontal: 'center', textRotation: 90, wrapText: true };
                } else if (isGlobalTotalRow) {
                    cell.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: 'FF1E1B4B' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
                    cell.alignment = { vertical: 'middle', horizontal: isNumeric ? 'right' : 'left' };
                } else {
                    cell.font = { name: 'Segoe UI', size: 8.5, color: { argb: 'FF334155' } };
                    cell.alignment = { vertical: 'middle', horizontal: isNumeric ? 'right' : 'left' };
                }

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
    for (let colNum = 1; colNum <= ws.columnCount; colNum++) {
        const col = ws.getColumn(colNum);
        let maxVisualLen = 0;
        col.eachCell({ includeEmpty: false }, (cell, rowIdx) => {
            if (rowIdx === 1) {
                maxVisualLen = Math.max(maxVisualLen, String(cell.value || '').trim().length);
            } else {
                let visualLen = 0;
                if (typeof cell.value === 'number') {
                    const num = cell.value;
                    const fmt = cell.numFmt || '';
                    if (fmt.includes('$') && fmt.includes('.00')) {
                        visualLen = ('$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })).length;
                    } else if (fmt.includes('$')) {
                        visualLen = ('$' + Math.round(num).toLocaleString('en-US')).length;
                    } else if (fmt.includes('%')) {
                        visualLen = ((num * 100).toFixed(1) + '%').length;
                    } else if (fmt.includes('.0')) {
                        visualLen = num.toFixed(1).length;
                    } else {
                        visualLen = (Math.round(num).toLocaleString('en-US')).length;
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
            col.width = 6.5;
        } else if (colNum === 4) {
            col.width = 33;
        } else {
            col.width = Math.max(maxVisualLen + 2.5, 11);
        }
    }

    await wb.xlsx.writeFile('test_petral_matrix_qc.xlsx');
    console.log('✅ Archivo test_petral_matrix_qc.xlsx generado con éxito.');
}

runExport();
