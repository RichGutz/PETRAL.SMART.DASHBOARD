import fs from 'fs';
import { JSDOM } from 'jsdom';

// 1. Cargar datos de simulación
const simData = JSON.parse(fs.readFileSync('./scratch_sim_data.json', 'utf-8'));
const months = ['Ene 2027', 'Feb 2027', 'Mar 2027', 'Abr 2027', 'May 2027', 'Jun 2027', 'Jul 2027', 'Ago 2027', 'Set 2027', 'Oct 2027', 'Nov 2027', 'Dic 2027'];

const dom = new JSDOM('<!DOCTYPE html><html><body><table id="forecast-grid-table"><thead></thead><tbody></tbody></table></body></html>');
const { document } = dom.window;

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

// Construir filas para simulación real
const clients = Object.keys(simData.aggregated_data || {});

clients.forEach(client => {
    const routesData = simData.aggregated_data[client];
    Object.keys(routesData).forEach(route => {
        const vesselsData = routesData[route];
        Object.keys(vesselsData).forEach(vessel => {
            const nodeData = vesselsData[vessel];
            const mData = nodeData.months_data || {};
            
            const trips = months.map((_, i) => mData[Object.keys(mData)[i]]?.trips || 0);
            const days = months.map((_, i) => mData[Object.keys(mData)[i]]?.days || 0);
            const tons = months.map((_, i) => mData[Object.keys(mData)[i]]?.tons || 0);
            const netRev = months.map((_, i) => mData[Object.keys(mData)[i]]?.net_revenue || 0);
            const hire = months.map((_, i) => mData[Object.keys(mData)[i]]?.tce_cost_total || 0);
            const bunker = months.map((_, i) => mData[Object.keys(mData)[i]]?.bunker_cost || 0);
            const port = months.map((_, i) => mData[Object.keys(mData)[i]]?.port_cost || 0);
            const margin = months.map((_, i) => mData[Object.keys(mData)[i]]?.voyage_margin || 0);
            const tce = months.map((_, i) => mData[Object.keys(mData)[i]]?.tce || 0);

            const sum = arr => arr.reduce((a, b) => a + b, 0);
            const avg = arr => {
                const act = arr.filter(x => x > 0);
                return act.length > 0 ? sum(act) / act.length : 0;
            };

            const metrics = [
                { name: 'Viajes (freq)', vals: trips, tot: sum(trips) },
                { name: 'Días-Buque', vals: days, tot: sum(days) },
                { name: 'Toneladas', vals: tons, tot: sum(tons) },
                { name: 'Net Revenue', vals: netRev, tot: sum(netRev) },
                { name: '(-) Hire (TCE x días)', vals: hire, tot: sum(hire) },
                { name: '(-) Bunker Costs', vals: bunker, tot: sum(bunker) },
                { name: '(-) Port Costs', vals: port, tot: sum(port) },
                { name: '(=) VOYAGE RESULT / P&L', vals: margin, tot: sum(margin) },
                { name: 'Métricas TCE ($/d)', vals: tce, tot: avg(tce) }
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
                    td3.innerHTML = `<div class="vertical-text mx-auto px-2">${vessel}</div><select><option value="${vessel}" selected>${vessel}</option></select>`;
                    tr.appendChild(td3);
                }

                const tdM = document.createElement('td');
                tdM.textContent = m.name;
                tr.appendChild(tdM);

                m.vals.forEach(v => {
                    const tdV = document.createElement('td');
                    tdV.textContent = v > 0 ? (m.name.includes('Viaje') || m.name.includes('Día') ? String(v) : '$' + v.toLocaleString()) : '-';
                    tr.appendChild(tdV);
                });

                const tdTot = document.createElement('td');
                tdTot.textContent = m.tot > 0 ? (m.name.includes('Viaje') || m.name.includes('Día') ? String(m.tot) : '$' + m.tot.toLocaleString()) : '-';
                tr.appendChild(tdTot);

                tbody.appendChild(tr);
            });
        });
    });
});

// Guardar tabla renderizada en HTML temporal para inspección
const fullHtml = document.getElementById('forecast-grid-table').outerHTML;
fs.writeFileSync('./scratch_rendered_table.html', fullHtml, 'utf-8');
console.log('✅ DOM Tabla generado con éxito (Filas:', tbody.querySelectorAll('tr').length, ')');
