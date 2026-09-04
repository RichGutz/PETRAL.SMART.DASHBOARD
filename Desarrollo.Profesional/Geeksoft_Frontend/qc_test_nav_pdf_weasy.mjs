import { JSDOM } from 'jsdom';
import fs from 'fs';

// HTML fiel al renderizado del DOM de NAVITRANSO con select, inputs, 12 meses y subtotales
const testNavDomHtml = `
<!DOCTYPE html>
<html>
<body>
<table id="forecast-grid-table">
  <thead>
    <tr>
      <th><span>Cliente</span></th><th><span>Ruta</span></th><th><span>Buque</span></th><th><span>Métrica</span></th>
      <th><span>2027-01</span></th><th><span>2027-02</span></th><th><span>2027-03</span></th><th><span>2027-04</span></th>
      <th><span>2027-05</span></th><th><span>2027-06</span></th><th><span>2027-07</span></th><th><span>2027-08</span></th>
      <th><span>2027-09</span></th><th><span>2027-10</span></th><th><span>2027-11</span></th><th><span>2027-12</span></th>
      <th><span>TOTAL ACUM</span></th>
    </tr>
  </thead>
  <tbody>
    <!-- NODO 1: NEXA CALLAO-MARCONA MOQUEGUA -->
    <tr>
      <td rowspan="16" class="bg-petral-blue text-white"><div class="vertical-text">NEXA</div></td>
      <td rowspan="16" class="bg-purple-500 text-white"><div class="vertical-text">CALLAO-MARCONA</div></td>
      <td rowspan="16" class="bg-green-600 text-white"><div class="vertical-text">MOQUEGUA</div><select><option value="MOQUEGUA" selected>MOQUEGUA</option></select></td>
      <td>Viajes (freq)</td>
      <td><input type="number" value="1" /></td><td><input type="number" value="1" /></td><td><input type="number" value="0" /></td><td><input type="number" value="1" /></td><td><input type="number" value="0" /></td><td><input type="number" value="0" /></td><td><input type="number" value="0" /></td><td><input type="number" value="1" /></td><td><input type="number" value="0" /></td><td><input type="number" value="0" /></td><td><input type="number" value="0" /></td><td><input type="number" value="0" /></td><td>4</td>
    </tr>
    <tr><td>VENTAS</td><td>$336,750</td><td>$336,750</td><td>-</td><td>$336,750</td><td>-</td><td>-</td><td>-</td><td>$336,750</td><td>-</td><td>-</td><td>-</td><td>-</td><td>$1,347,000</td></tr>
    <tr><td>  HIRE</td><td>$330,750</td><td>$330,750</td><td>-</td><td>$330,750</td><td>-</td><td>-</td><td>-</td><td>$330,750</td><td>-</td><td>-</td><td>-</td><td>-</td><td>$1,323,000</td></tr>
    <tr><td>  VENTA DE TERCEROS</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
    <tr><td>  DEMORAS</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
    <tr><td>  INGRESOS DE PUERTO</td><td>$6,000</td><td>$6,000</td><td>-</td><td>$6,000</td><td>-</td><td>-</td><td>-</td><td>$6,000</td><td>-</td><td>-</td><td>-</td><td>-</td><td>$24,000</td></tr>
    <tr><td>  OTROS INGRESOS</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
    <tr><td>COSTOS DIRECTOS</td><td>-$95,152</td><td>-$95,152</td><td>-</td><td>-$95,152</td><td>-</td><td>-</td><td>-</td><td>-$95,152</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-$380,608</td></tr>
    <tr><td>  COMBUSTIBLE</td><td>-$36,152</td><td>-$36,152</td><td>-</td><td>-$36,152</td><td>-</td><td>-</td><td>-</td><td>-$36,152</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-$144,608</td></tr>
    <tr><td>  GASTOS DE PUERTO</td><td>-$59,000</td><td>-$59,000</td><td>-</td><td>-$59,000</td><td>-</td><td>-</td><td>-</td><td>-$59,000</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-$236,000</td></tr>
    <tr><td>  COSTOS DE DEMORA</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
    <tr><td>  COMISIONES VARIAS</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
    <tr><td>  OTROS COSTOS DIRECTOS</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
    <tr><td>TIME CHARTER EQUIVALENT</td><td>$241,598</td><td>$241,598</td><td>-</td><td>$241,598</td><td>-</td><td>-</td><td>-</td><td>$241,598</td><td>-</td><td>-</td><td>-</td><td>-</td><td>$966,392</td></tr>
    <tr><td>  COSTO DE ARRIENDO NAVES</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
    <tr><td>MARGEN BRUTO</td><td>$241,598</td><td>$241,598</td><td>-</td><td>$241,598</td><td>-</td><td>-</td><td>-</td><td>$241,598</td><td>-</td><td>-</td><td>-</td><td>-</td><td>$966,392</td></tr>

    <!-- SUBTOTAL NEXA -->
    <tr>
      <td rowspan="5" class="bg-slate-800 text-amber-400 font-bold" colspan="3"><div class="vertical-text">Σ SUBTOTAL NEXA</div></td>
      <td>VENTAS</td>
      <td>$336,750</td><td>$336,750</td><td>-</td><td>$336,750</td><td>-</td><td>-</td><td>-</td><td>$336,750</td><td>-</td><td>-</td><td>-</td><td>-</td><td>$1,347,000</td></tr>
    </tr>
    <tr><td>COSTOS DIRECTOS</td><td>-$95,152</td><td>-$95,152</td><td>-</td><td>-$95,152</td><td>-</td><td>-</td><td>-</td><td>-$95,152</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-$380,608</td></tr>
    <tr><td>TIME CHARTER EQUIVALENT</td><td>$241,598</td><td>$241,598</td><td>-</td><td>$241,598</td><td>-</td><td>-</td><td>-</td><td>$241,598</td><td>-</td><td>-</td><td>-</td><td>-</td><td>$966,392</td></tr>
    <tr><td>  COSTO DE ARRIENDO NAVES</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
    <tr><td>MARGEN BRUTO (P&amp;L)</td><td>$241,598</td><td>$241,598</td><td>-</td><td>$241,598</td><td>-</td><td>-</td><td>-</td><td>$241,598</td><td>-</td><td>-</td><td>-</td><td>-</td><td>$966,392</td></tr>

    <!-- TOTAL FLOTA -->
    <tr>
      <td rowspan="5" class="bg-slate-800 text-white font-bold" colspan="3"><div class="vertical-text">TOTAL FLOTA</div></td>
      <td>VENTAS CONSOLIDADAS</td>
      <td>$336,750</td><td>$336,750</td><td>-</td><td>$336,750</td><td>-</td><td>-</td><td>-</td><td>$336,750</td><td>-</td><td>-</td><td>-</td><td>-</td><td>$1,347,000</td></tr>
    </tr>
    <tr><td>COSTOS DIRECTOS</td><td>-$95,152</td><td>-$95,152</td><td>-</td><td>-$95,152</td><td>-</td><td>-</td><td>-</td><td>-$95,152</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-$380,608</td></tr>
    <tr><td>TIME CHARTER EQUIVALENT</td><td>$241,598</td><td>$241,598</td><td>-</td><td>$241,598</td><td>-</td><td>-</td><td>-</td><td>$241,598</td><td>-</td><td>-</td><td>-</td><td>-</td><td>$966,392</td></tr>
    <tr><td>  COSTO DE ARRIENDO NAVES</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
    <tr><td>MARGEN BRUTO (P&amp;L)</td><td>$241,598</td><td>$241,598</td><td>-</td><td>$241,598</td><td>-</td><td>-</td><td>-</td><td>$241,598</td><td>-</td><td>-</td><td>-</td><td>-</td><td>$966,392</td></tr>
  </tbody>
</table>
</body>
</html>
`;

// Construir HTML y guardar a archivo
const dom = new JSDOM(testNavDomHtml);
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLSelectElement = dom.window.HTMLSelectElement;
global.HTMLInputElement = dom.window.HTMLInputElement;

// Importar dinamicamente la funcion de generacion de html
async function run() {
    const { generateFinancialMatrixNavitransoPdfHtml } = await import('./src/services/exportFinancialMatrixNavitransoPdf.ts');
    const html = generateFinancialMatrixNavitransoPdfHtml('forecast-grid-table', 'landscape', 'Escenario Base NAVITRANSO');
    fs.writeFileSync('test_navitranso_generated.html', html, 'utf8');
    console.log('✅ Archivo test_navitranso_generated.html guardado.');
}
run();
