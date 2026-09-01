import fs from 'fs';
import { JSDOM } from 'jsdom';
import ExcelJS from 'exceljs';

const dom = new JSDOM('<!DOCTYPE html><html><body><table id="forecast-grid-table"><thead></thead><tbody></tbody></table></body></html>');
const { document } = dom.window;

// 1. Cargar datos de simulación
const simData = JSON.parse(fs.readFileSync('./scratch_sim_data.json', 'utf-8'));
const months = ['Ene 2027', 'Feb 2027', 'Mar 2027', 'Abr 2027', 'May 2027', 'Jun 2027', 'Jul 2027', 'Ago 2027', 'Set 2027', 'Oct 2027', 'Nov 2027', 'Dic 2027'];

const thead = document.querySelector('thead');
const tbody = document.querySelector('tbody');

// Header
const hTr = document.createElement('tr');
['Cliente', 'Ruta', 'Buque', 'Métrica', ...months, 'TOTAL ACUM'].forEach((h, idx) => {
    const th = document.createElement('th');
    th.className = idx === 16 ? 'py-1 px-2 border border-sky-800 bg-sky-900 text-sky-100' : 'py-1 px-2 border border-slate-700 bg-slate-800 text-white';
    th.textContent = h;
    hTr.appendChild(th);
});
thead.appendChild(hTr);

// Construir filas para NEXA y SPCC según la simulación real
const clients = Object.keys(simData.aggregated_data || {});

clients.forEach(client => {
    const routesData = simData.aggregated_data[client];
    Object.keys(routesData).forEach(route => {
        const vesselsData = routesData[route];
        Object.keys(vesselsData).forEach(vessel => {
            const nodeData = vesselsData[vessel];
            const mData = nodeData.months_data || {};
            
            const trips = months.map((_, i) => {
                const mKey = Object.keys(mData)[i];
                return mData[mKey]?.trips || 0;
            });
            const tons = months.map((_, i) => {
                const mKey = Object.keys(mData)[i];
                return mData[mKey]?.tons || 0;
            });
            const netRev = months.map((_, i) => {
                const mKey = Object.keys(mData)[i];
                return mData[mKey]?.net_revenue || 0;
            });
            const bunker = months.map((_, i) => {
                const mKey = Object.keys(mData)[i];
                return mData[mKey]?.bunker_cost || 0;
            });
            const port = months.map((_, i) => {
                const mKey = Object.keys(mData)[i];
                return mData[mKey]?.port_cost || 0;
            });
            const margin = months.map((_, i) => {
                const mKey = Object.keys(mData)[i];
                return mData[mKey]?.voyage_margin || 0;
            });

            const sum = arr => arr.reduce((a, b) => a + b, 0);

            const metrics = [
                { name: 'Viajes', vals: trips, tot: sum(trips) },
                { name: 'Toneladas', vals: tons, tot: sum(tons) },
                { name: 'Net Revenue', vals: netRev, tot: sum(netRev) },
                { name: '(-) Bunker', vals: bunker, tot: sum(bunker) },
                { name: '(-) Port Costs', vals: port, tot: sum(port) },
                { name: '(=) VOYAGE MARGIN (P/L)', vals: margin, tot: sum(margin) }
            ];

            metrics.forEach((m, idx) => {
                const tr = document.createElement('tr');
                if (idx === 0) {
                    const td1 = document.createElement('td');
                    td1.setAttribute('rowspan', String(metrics.length));
                    td1.className = client === 'NEXA' ? 'bg-petral-blue text-white' : 'bg-sky-700 text-white';
                    td1.innerHTML = `<div class="vertical-text mx-auto px-2">${client}</div>`;
                    tr.appendChild(td1);

                    const td2 = document.createElement('td');
                    td2.setAttribute('rowspan', String(metrics.length));
                    td2.className = 'bg-purple-500 text-white';
                    td2.innerHTML = `<div class="vertical-text mx-auto px-2">${route}</div>`;
                    tr.appendChild(td2);

                    const td3 = document.createElement('td');
                    td3.setAttribute('rowspan', String(metrics.length));
                    td3.className = 'bg-green-600 text-white';
                    td3.innerHTML = `<div class="vertical-text mx-auto px-2">${vessel}</div><select><option value="${vessel}" selected>${vessel}</option><option value="OTRO">OTRO</option></select>`;
                    tr.appendChild(td3);
                }

                const tdM = document.createElement('td');
                tdM.textContent = m.name;
                tr.appendChild(tdM);

                m.vals.forEach(v => {
                    const tdV = document.createElement('td');
                    tdV.textContent = '$' + v.toLocaleString();
                    tr.appendChild(tdV);
                });

                const tdTot = document.createElement('td');
                tdTot.textContent = '$' + m.tot.toLocaleString();
                tr.appendChild(tdTot);

                tbody.appendChild(tr);
            });
        });
    });
});

console.log(`DOM generado con ${tbody.querySelectorAll('tr').length} filas.`);

// Generar Excel con ExcelJS usando la misma lógica de exportFinancialMatrixExcel
async function runExcelExport() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Matriz Financiera', {
        views: [{ showGridLines: true, state: 'frozen', ySplit: 1, xSplit: 0 }]
    });

    // Mapeo
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

    // thead
    const hRow = ws.addRow(['CLIENTE', 'RUTA', 'BUQUE', 'MÉTRICA', ...months, 'TOTAL ACUM']);
    hRow.height = 25;
    hRow.eachCell((cell, colIdx) => {
        const isTot = colIdx === 17;
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isTot ? 'FF0C4A6E' : 'FF1E293B' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF475569' } },
            left: { style: 'thin', color: { argb: 'FF475569' } },
            bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
            right: { style: 'thin', color: { argb: 'FF475569' } }
        };
    });
    currentRow++;

    // tbody
    const trs = tbody.querySelectorAll('tr');
    trs.forEach(tr => {
        let currentCol = 1;
        const tds = tr.querySelectorAll('td');

        tds.forEach(td => {
            while (isOccupied(currentRow, currentCol)) {
                currentCol++;
            }

            const rSpan = parseInt(td.getAttribute('rowspan') || '1', 10);
            const cSpan = parseInt(td.getAttribute('colspan') || '1', 10);
            const vertDiv = td.querySelector('.vertical-text');
            const selectEl = td.querySelector('select');
            
            let val = '';
            if (selectEl) {
                val = selectEl.value || (vertDiv ? vertDiv.textContent.trim() : '');
            } else if (vertDiv) {
                val = vertDiv.textContent.trim();
            } else {
                val = td.textContent.trim();
            }

            const cell = ws.getCell(currentRow, currentCol);
            const isDim = !!vertDiv;
            const rawClean = val.replace(/[\$,\s]/g, '');
            const num = parseFloat(rawClean);

            if (!isDim && !isNaN(num) && rawClean !== '') {
                cell.value = num;
                cell.numFmt = val.includes('%') ? '0.0%' : (val.includes('.') && num < 100 ? '$#,##0.00' : '$#,##0');
            } else {
                cell.value = val;
            }

            if (isDim) {
                let bg = 'FF0F4C81';
                if (val.includes('SPCC')) bg = 'FF0369A1';
                if (val.includes('MARCONA')) bg = 'FFA855F7';
                if (val.includes('MOQUEGUA')) bg = 'FF16A34A';
                if (val.includes('TABLONES')) bg = 'FFDC2626';

                cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                cell.alignment = { vertical: 'middle', horizontal: 'center', textRotation: 90 };
            } else {
                cell.font = { name: 'Segoe UI', size: 8.5, bold: val.includes('P/L') || val.includes('Revenue') };
                cell.alignment = { vertical: 'middle', horizontal: typeof cell.value === 'number' ? 'right' : 'left' };
            }

            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
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

    ws.getColumn(1).width = 7;
    ws.getColumn(2).width = 7;
    ws.getColumn(3).width = 7;
    ws.getColumn(4).width = 30;
    for (let c = 5; c <= 17; c++) ws.getColumn(c).width = 16;

    const outPath = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/test_qc_matriz_financiera_verified.xlsx';
    await wb.xlsx.writeFile(outPath);
    console.log(`Excel generado exitosamente en: ${outPath}`);
}

runExcelExport();
