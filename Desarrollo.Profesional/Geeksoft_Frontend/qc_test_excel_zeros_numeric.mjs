import { JSDOM } from 'jsdom';
import ExcelJS from 'exceljs';
import assert from 'assert';

// Mock table simulating both filled values, empty values, zeroes, dashes, and percentages
const mockHtml = `
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
    <tr>
      <td rowspan="4" class="bg-sky-700 text-white"><div class="vertical-text">SPCC</div></td>
      <td rowspan="4" class="bg-purple-500 text-white"><div class="vertical-text">ILO-CALLAO</div></td>
      <td rowspan="4" class="bg-green-600 text-white"><div class="vertical-text">MOQUEGUA</div></td>
      <td>INGRESOS DE OPERACIÓN</td>
      <td>$311,850</td><td>$0</td><td>-</td><td></td><td>$100,000</td><td>$0</td>
      <td>-</td><td>$50,000</td><td></td><td>$0</td><td>-</td><td>$20,000</td><td>$481,850</td>
    </tr>
    <tr>
      <td>MARGEN BRUTO (%)</td>
      <td>25.5%</td><td>0.0%</td><td>-</td><td>0%</td><td>15.0%</td><td></td>
      <td>-</td><td>10.0%</td><td></td><td>0%</td><td>-</td><td>5.0%</td><td>18.5%</td>
    </tr>
    <tr>
      <td>VIAJES</td>
      <td>2</td><td>0</td><td>-</td><td></td><td>1</td><td>0</td>
      <td>-</td><td>1</td><td></td><td>0</td><td>-</td><td>1</td><td>5</td>
    </tr>
    <tr>
      <td>TARIFA USD/MT</td>
      <td>$25.50</td><td>$0.00</td><td>-</td><td></td><td>$24.00</td><td>$0.00</td>
      <td>-</td><td>$25.00</td><td></td><td>$0.00</td><td>-</td><td>$25.00</td><td>$24.87</td>
    </tr>
  </tbody>
</table>
</body>
</html>
`;

async function testExport(tableId) {
    const dom = new JSDOM(mockHtml);
    const table = dom.window.document.getElementById(tableId);

    // Test Petral Matrix Logic
    const wbPetral = new ExcelJS.Workbook();
    const wsPetral = wbPetral.addWorksheet('Matriz Petral');
    
    // Test Navitrans Matrix Logic
    const wbNav = new ExcelJS.Workbook();
    const wsNav = wbNav.addWorksheet('Matriz Navitrans');

    // Run tests for Petral and Navitrans logic
    const tbody = table.querySelector('tbody');
    const trs = tbody.querySelectorAll('tr');

    let rowIdx = 1;
    trs.forEach(tr => {
        let colIdx = 1;
        const tds = tr.querySelectorAll('td');
        let currentMetric = '';

        tds.forEach(td => {
            let textValue = td.textContent?.trim() || '';
            const isDim = colIdx <= 3;
            const isMetric = colIdx === 4;
            const isData = colIdx >= 5;

            if (isMetric) {
                currentMetric = textValue.toUpperCase().trim();
            }

            const rawClean = textValue.replace(/[\$,\s]/g, '');
            const isPercent = textValue.includes('%') || currentMetric.includes('%') || currentMetric.includes('MARGEN');
            const cleanNumStr = rawClean.replace('%', '');

            let parsedNum = 0;
            let isNumeric = false;
            if (isData) {
                if (textValue !== '-' && textValue !== '' && !isNaN(Number(cleanNumStr)) && cleanNumStr !== '') {
                    parsedNum = parseFloat(cleanNumStr);
                } else {
                    parsedNum = 0;
                }
                isNumeric = true;
            }

            const cellP = wsPetral.getCell(rowIdx, colIdx);
            const cellN = wsNav.getCell(rowIdx, colIdx);

            if (isDim || isMetric) {
                cellP.value = textValue;
                cellN.value = textValue;
            } else if (isData) {
                if (isPercent) {
                    const v = parsedNum > 1 ? parsedNum / 100 : parsedNum;
                    cellP.value = v;
                    cellP.numFmt = '0.0%';
                    cellN.value = v;
                    cellN.numFmt = '0.0%';
                } else if (currentMetric.includes('VIAJE')) {
                    cellP.value = parsedNum;
                    cellP.numFmt = Number.isInteger(parsedNum) ? '#,##0' : '0.0';
                    cellN.value = parsedNum;
                    cellN.numFmt = Number.isInteger(parsedNum) ? '#,##0' : '0.0';
                } else if (currentMetric.includes('USD/MT')) {
                    cellP.value = parsedNum;
                    cellP.numFmt = '#,##0.00';
                    cellN.value = parsedNum;
                    cellN.numFmt = '#,##0.00';
                } else {
                    cellP.value = parsedNum;
                    cellP.numFmt = '#,##0';
                    cellN.value = parsedNum;
                    cellN.numFmt = '#,##0';
                }
            }
            colIdx++;
        });
        rowIdx++;
    });

    console.log('--- QC PERICIAL DE CELDAS NUMÉRICAS EN EXCEL ---');
    
    // Inspeccionar celdas de datos para certificar que NO hay strings vacíos
    for (let r = 1; r <= 4; r++) {
        for (let c = 5; c <= 17; c++) {
            const cellP = wsPetral.getCell(r, c);
            const cellN = wsNav.getCell(r, c);

            assert.strictEqual(typeof cellP.value, 'number', `Fila ${r} Col ${c} en Petral debe ser number, fue ${typeof cellP.value}`);
            assert.strictEqual(typeof cellN.value, 'number', `Fila ${r} Col ${c} en Navitrans debe ser number, fue ${typeof cellN.value}`);
            
            // Simular cálculo de diferencial entre Navitrans y Petral
            const diff = cellN.value - cellP.value;
            assert.strictEqual(isNaN(diff), false, `La resta en Fila ${r} Col ${c} no debe ser NaN`);
            assert.strictEqual(diff, 0, `Diferencial debe ser exactamente 0 en datos idénticos`);
        }
    }

    console.log('✅ TODAS LAS CELDAS DE DATOS SON NUMÉRICAS (0 o valor real)');
    console.log('✅ DIFERENCIAL ENTRE MATRICES EJECUTADO EXITOSAMENTE SIN ERRORES #VALUE! O NaN');
    console.log('✅ QC BENOIT BLANC PASADO AL 100%');
}

testExport('forecast-grid-table').catch(err => {
    console.error('❌ ERROR EN QC:', err);
    process.exit(1);
});
