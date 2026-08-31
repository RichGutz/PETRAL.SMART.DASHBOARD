import React, { useMemo } from 'react';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';
import { Download, FileText, RotateCcw, Filter, UserCheck, Navigation, Anchor, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import logoPetral from '../../assets/Logo.Petral.png';
import logoGeeksoft from '../../assets/Logo.Geeksoft.png';

export const ForecastGridFilters: React.FC = () => {
    const { 
        data, 
        dynamicMonths: months,
        hiddenClients, setHiddenClients,
        hiddenRoutes, setHiddenRoutes,
        hiddenVessels, setHiddenVessels,
        hiddenMonths, setHiddenMonths,
        showSubtotals, setShowSubtotals,
        showAccumulatedTotal, setShowAccumulatedTotal
    } = useForecastContext_V2();

    const { clientList, routeList, vesselList } = useMemo(() => {
        const allClients = new Set<string>();
        const allRoutes = new Set<string>();
        const allVessels = new Set<string>();

        if (data?.aggregated_data) {
            Object.entries(data.aggregated_data).forEach(([client, routesData]: any) => {
                allClients.add(client);
                if (routesData && typeof routesData === 'object') {
                    Object.entries(routesData).forEach(([route, vesselsData]: any) => {
                        allRoutes.add(route);
                        if (vesselsData && typeof vesselsData === 'object') {
                            Object.entries(vesselsData).forEach(([vessel]: any) => {
                                allVessels.add(vessel);
                            });
                        }
                    });
                }
            });
        }
        return {
            clientList: Array.from(allClients).sort(),
            routeList: Array.from(allRoutes).sort(),
            vesselList: Array.from(allVessels).sort()
        };
    }, [data]);

    const toggleFilter = (item: string, hiddenList: string[], setHiddenList: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (hiddenList.includes(item)) setHiddenList(hiddenList.filter(i => i !== item));
        else setHiddenList([...hiddenList, item]);
    };

    // Funciones "Solo este" para aislamiento inmediato
    const isolateClient = (client: string) => {
        setHiddenClients(clientList.filter(c => c !== client));
        setHiddenRoutes([]);
        setHiddenVessels([]);
    };

    const isolateRoute = (route: string) => {
        setHiddenRoutes(routeList.filter(r => r !== route));
        setHiddenClients([]);
        setHiddenVessels([]);
    };

    const isolateVessel = (vessel: string) => {
        setHiddenVessels(vesselList.filter(v => v !== vessel));
        setHiddenClients([]);
        setHiddenRoutes([]);
    };

    const resetAllFilters = () => {
        setHiddenClients([]);
        setHiddenRoutes([]);
        setHiddenVessels([]);
        setHiddenMonths([]);
    };

    const isAnyFilterActive = hiddenClients.length > 0 || hiddenRoutes.length > 0 || hiddenVessels.length > 0 || hiddenMonths.length > 0;

    const activeFilterSummary = useMemo(() => {
        const activeC = clientList.filter(c => !hiddenClients.includes(c));
        const activeR = routeList.filter(r => !hiddenRoutes.includes(r));
        const activeV = vesselList.filter(v => !hiddenVessels.includes(v));
        const activeM = months.filter(m => !hiddenMonths.includes(m));

        const summaries: string[] = [];
        if (hiddenClients.length > 0) {
            summaries.push(activeC.length === 1 ? `Cliente: ${activeC[0]}` : `${activeC.length}/${clientList.length} Clientes`);
        }
        if (hiddenRoutes.length > 0) {
            summaries.push(activeR.length === 1 ? `Ruta: ${activeR[0]}` : `${activeR.length}/${routeList.length} Rutas`);
        }
        if (hiddenVessels.length > 0) {
            summaries.push(activeV.length === 1 ? `Buque: ${activeV[0]}` : `${activeV.length}/${vesselList.length} Buques`);
        }
        if (hiddenMonths.length > 0) {
            summaries.push(`${activeM.length}/${months.length} Meses`);
        }
        return summaries.join(' • ');
    }, [clientList, routeList, vesselList, months, hiddenClients, hiddenRoutes, hiddenVessels, hiddenMonths]);

    const handleExportExcel = () => {
        const table = document.getElementById('forecast-grid-table');
        if (!table) return alert('No se encontró la tabla para exportar.');
        
        // Clonar la tabla para remover inputs y dejar solo sus valores antes de exportar
        const clone = table.cloneNode(true) as HTMLTableElement;
        
        // Reemplazar inputs con su texto
        const inputs = clone.querySelectorAll('input');
        inputs.forEach(input => {
            const val = input.value;
            const parent = input.parentElement;
            if (parent) {
                parent.textContent = val;
            }
        });

        const wb = XLSX.utils.table_to_book(clone, { sheet: "Forecast" });
        
        // Formatear las celdas numéricas con separador de miles y formato de moneda
        const ws = wb.Sheets["Forecast"];
        if (ws) {
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
            for (let r = range.s.r; r <= range.e.r; r++) {
                let metricName = '';
                for (let c = 0; c <= 4; c++) {
                    const cellRef = XLSX.utils.encode_cell({ r, c });
                    const cell = ws[cellRef];
                    if (cell && cell.t === 's' && cell.v) {
                        const valStr = String(cell.v).trim();
                        if (valStr.includes('P/L') || valStr.includes('Toneladas') || valStr.includes('Revenue') || 
                            valStr.includes('Costs') || valStr.includes('Bunker') || valStr.includes('Margen') || 
                            valStr.includes('Yield') || valStr.includes('Demurrage') || valStr.includes('Flete') ||
                            valStr.includes('Viajes')) {
                            metricName = valStr;
                            break;
                        }
                    }
                }

                if (!metricName) continue;

                for (let c = 0; c <= range.e.c; c++) {
                    const cellRef = XLSX.utils.encode_cell({ r, c });
                    const cell = ws[cellRef];
                    if (!cell) continue;

                    if (cell.t === 's' && cell.v) {
                        const cleanVal = String(cell.v).replace(/[\$,]/g, '').trim();
                        const num = parseFloat(cleanVal);
                        if (!isNaN(num)) {
                            cell.t = 'n';
                            cell.v = num;
                        }
                    }

                    if (cell.t === 'n') {
                        if (metricName.includes('%')) {
                            cell.z = '0.0%';
                        } else if (metricName.includes('Yield') || metricName.includes('USD/MT') || metricName.includes('Flete (USD/MT)')) {
                            cell.z = '$#,##0.00';
                        } else if (metricName.includes('Viajes') || metricName.includes('freq')) {
                            cell.z = '0.0';
                        } else if (metricName.includes('Toneladas')) {
                            cell.z = '#,##0';
                        } else {
                            cell.z = '$#,##0';
                        }
                    }
                }
            }
        }

        XLSX.writeFile(wb, "Petral_Forecast_Matriz.xlsx");
    };

    const handlePrintPDF = (orientation: 'portrait' | 'landscape') => {
        const table = document.getElementById('forecast-grid-table');
        if (!table) return alert('No se encontró la tabla para imprimir.');

        const clone = table.cloneNode(true) as HTMLTableElement;
        
        const inputs = clone.querySelectorAll('input');
        inputs.forEach(input => {
            const val = input.value;
            const parent = input.parentElement;
            if (parent) parent.textContent = val;
        });

        const buttons = clone.querySelectorAll('button');
        buttons.forEach(btn => {
            const val = btn.textContent || '';
            const span = document.createElement('span');
            span.textContent = val;
            btn.parentNode?.replaceChild(span, btn);
        });

        const visibleMonthsCount = months.filter(m => !hiddenMonths.includes(m)).length;
        const trs = clone.querySelectorAll('tr');
        trs.forEach(tr => {
            const ths = tr.querySelectorAll('th');
            if (ths.length > 0) {
                if (ths.length >= 4) {
                    ths[0].classList.add('col-header-client');
                    ths[1].classList.add('col-header-route');
                    ths[2].classList.add('col-header-vessel');
                    ths[3].classList.add('col-header-metric');
                }
                if (ths.length >= 1) {
                    ths[ths.length - 1].classList.add('col-header-total');
                }
                for (let j = 1; j <= visibleMonthsCount; j++) {
                    const idx = ths.length - 1 - j;
                    if (idx >= 0) {
                        ths[idx].classList.add('col-header-month');
                    }
                }
            }

            const tds = tr.querySelectorAll('td');
            if (tds.length === 0) return;
            
            tds[tds.length - 1].classList.add('col-total');
            
            for (let j = 1; j <= visibleMonthsCount; j++) {
                const idx = tds.length - 1 - j;
                if (idx >= 0) {
                    tds[idx].classList.add('col-month');
                }
            }
            
            const metricIdx = tds.length - visibleMonthsCount - 2;
            if (metricIdx >= 0) {
                tds[metricIdx].classList.add('col-metric');
            }
            
            for (let idx = 0; idx < metricIdx; idx++) {
                tds[idx].classList.add('col-nav-cell');
            }
        });

        const getAbsoluteUrl = (path: string) => {
            if (!path) return '';
            if (path.startsWith('http://') || path.startsWith('https://')) {
                return path;
            }
            const cleanPath = path.startsWith('/') ? path : '/' + path;
            return window.location.origin + cleanPath;
        };
        const absolutePetralLogo = getAbsoluteUrl(logoPetral);
        const absoluteGeeksoftLogo = getAbsoluteUrl(logoGeeksoft);

        const html = `
            <html>
            <head>
                <title>Matriz Comercial - PDF</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; font-size: 9px; }
                    .header-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
                    .title { font-size: 18px; font-weight: bold; color: #0f172a; }
                    .subtitle { font-size: 10px; color: #475569; margin-top: 4px; }
                    .logo-img { height: 35px; object-fit: contain; }
                    
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 7px; table-layout: fixed; }
                    th, td { border: 1px solid #cbd5e1; padding: 3px 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                    th { background-color: #1e293b; color: white; text-transform: uppercase; font-size: 7px; text-align: center; }
                    .text-left { text-align: left; }
                    .text-center { text-align: center; }
                    .font-bold { font-weight: bold; }
                    
                    .vertical-text {
                        writing-mode: vertical-rl;
                        transform: rotate(180deg);
                        font-weight: bold;
                        white-space: nowrap;
                        margin: auto;
                        font-size: 7px;
                        line-height: 1;
                        padding: 4px 0;
                    }
                    
                    td[class*="border-t-2"], td[class*="border-b-2"] { border-top: 2px solid #334155 !important; border-bottom: 2px solid #334155 !important; }
                    .bg-slate-100 { background-color: #f1f5f9 !important; }
                    .bg-slate-50 { background-color: #f8fafc !important; }
                    .bg-blue-50 { background-color: #eff6ff !important; }
                    .bg-amber-50 { background-color: #fffbeb !important; }
                    .bg-emerald-50 { background-color: #ecfdf5 !important; }
                    .bg-slate-800 { background-color: #1e293b !important; color: white !important; }
                    .text-slate-900 { color: #0f172a !important; }
                    
                    /* Anchos fijos por tipo de columna */
                    .col-header-client, .col-header-route, .col-header-vessel { width: 35px !important; max-width: 35px !important; }
                    .col-header-metric { width: 120px !important; min-width: 120px !important; }
                    .col-header-month { width: auto !important; }
                    .col-header-total { width: 65px !important; min-width: 65px !important; }
                    
                    .col-nav-cell { width: 35px !important; max-width: 35px !important; }
                    .col-metric { width: 120px !important; min-width: 120px !important; }
                    .col-month { width: auto !important; }
                    .col-total { width: 65px !important; min-width: 65px !important; }
                    
                    @media print {
                        @page { size: ${orientation}; margin: 10mm; }
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header-container">
                    <div>
                        <div class="title">NAVIERA PETRAL S.A.</div>
                        <div class="subtitle">MATRIZ COMERCIAL DE ESTIMACIONES Y PROYECCIÓN FINANCIERA</div>
                    </div>
                    <div>
                        <img src="${absolutePetralLogo}" class="logo-img" alt="Logo Petral" />
                    </div>
                </div>
                ${clone.outerHTML}
                <div style="margin-top: 20px; font-size: 8px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                    Reporte generado automáticamente por Geeksoft Forecast Platform &bull; PETRAL S.A.
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
        } else {
            alert('Por favor, permite las ventanas emergentes para poder imprimir el PDF.');
        }
    };

    const monthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'
    ];

    const quarters = useMemo(() => {
        const qMap: Record<string, string[]> = {};
        months.forEach(m => {
            const parts = m.split('-');
            const year = parts[0];
            const monthNum = parseInt(parts[1], 10);
            const q = Math.ceil(monthNum / 3);
            const key = `Q${q} ${year}`;
            if (!qMap[key]) qMap[key] = [];
            qMap[key].push(m);
        });
        return qMap;
    }, [months]);

    return (
        <div className="w-full bg-white flex flex-col">
            <div className="p-3.5 flex flex-col gap-3 bg-white">
                
                {/* BARRA SUPERIOR DE RESUMEN Y RESTABLECER */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-sky-600 shrink-0" />
                        <span className="font-extrabold text-slate-700">Filtros Multidimensionales:</span>
                        {isAnyFilterActive ? (
                            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold text-[11px] border border-amber-300">
                                🎯 {activeFilterSummary}
                            </span>
                        ) : (
                            <span className="text-slate-500 font-medium text-[11px]">
                                Mostrando todos los clientes, rutas, buques y meses
                            </span>
                        )}
                    </div>

                    {isAnyFilterActive && (
                        <button
                            type="button"
                            onClick={resetAllFilters}
                            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                            <RotateCcw size={12} className="text-sky-600" />
                            Mostrar Todo (Restablecer)
                        </button>
                    )}
                </div>

                {/* FILTROS EN 4 COLUMNAS */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    
                    {/* 1. Clientes */}
                    <div className="flex flex-col gap-1.5 col-span-1 md:col-span-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <div className="flex items-center gap-1.5">
                                <UserCheck size={13} className="text-sky-600" />
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Clientes ({clientList.length - hiddenClients.length}/{clientList.length})</span>
                            </div>
                            <div className="flex gap-1 text-[10px]">
                                <button type="button" onClick={() => setHiddenClients([])} className="text-sky-600 hover:text-sky-800 font-bold px-1 rounded hover:bg-sky-50 cursor-pointer">Todos</button>
                                <span className="text-slate-300">|</span>
                                <button type="button" onClick={() => setHiddenClients([...clientList])} className="text-slate-500 hover:text-slate-700 font-bold px-1 rounded hover:bg-slate-100 cursor-pointer">Ninguno</button>
                            </div>
                        </div>
                        <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-1.5 bg-slate-50 flex flex-col gap-1 shadow-2xs">
                            {clientList.map(c => {
                                const isChecked = !hiddenClients.includes(c);
                                return (
                                    <div key={c} className="flex items-center justify-between group px-1 py-0.5 hover:bg-white rounded transition-colors">
                                        <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 cursor-pointer truncate flex-1">
                                            <input 
                                                type="checkbox" 
                                                checked={isChecked} 
                                                onChange={() => toggleFilter(c, hiddenClients, setHiddenClients)} 
                                                className="rounded text-sky-600 focus:ring-sky-500" 
                                            />
                                            <span className="truncate">{c}</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => isolateClient(c)}
                                            title={`Aislar solo ${c}`}
                                            className="text-[10px] font-black text-sky-700 bg-sky-50 hover:bg-sky-600 hover:text-white border border-sky-200 px-1.5 py-0.2 rounded transition-colors cursor-pointer shrink-0 ml-1"
                                        >
                                            Solo
                                        </button>
                                    </div>
                                );
                            })}
                            {clientList.length === 0 && <span className="text-[12px] text-slate-400 italic p-1">No hay clientes</span>}
                        </div>
                    </div>

                    {/* 2. Rutas */}
                    <div className="flex flex-col gap-1.5 col-span-1 md:col-span-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <div className="flex items-center gap-1.5">
                                <Navigation size={13} className="text-sky-600" />
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Rutas ({routeList.length - hiddenRoutes.length}/{routeList.length})</span>
                            </div>
                            <div className="flex gap-1 text-[10px]">
                                <button type="button" onClick={() => setHiddenRoutes([])} className="text-sky-600 hover:text-sky-800 font-bold px-1 rounded hover:bg-sky-50 cursor-pointer">Todas</button>
                                <span className="text-slate-300">|</span>
                                <button type="button" onClick={() => setHiddenRoutes([...routeList])} className="text-slate-500 hover:text-slate-700 font-bold px-1 rounded hover:bg-slate-100 cursor-pointer">Ninguna</button>
                            </div>
                        </div>
                        <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-1.5 bg-slate-50 flex flex-col gap-1 shadow-2xs">
                            {routeList.map(r => {
                                const isChecked = !hiddenRoutes.includes(r);
                                return (
                                    <div key={r} className="flex items-center justify-between group px-1 py-0.5 hover:bg-white rounded transition-colors">
                                        <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 cursor-pointer truncate flex-1">
                                            <input 
                                                type="checkbox" 
                                                checked={isChecked} 
                                                onChange={() => toggleFilter(r, hiddenRoutes, setHiddenRoutes)} 
                                                className="rounded text-sky-600 focus:ring-sky-500" 
                                            />
                                            <span className="truncate" title={r}>{r}</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => isolateRoute(r)}
                                            title={`Aislar solo ${r}`}
                                            className="text-[10px] font-black text-sky-700 bg-sky-50 hover:bg-sky-600 hover:text-white border border-sky-200 px-1.5 py-0.2 rounded transition-colors cursor-pointer shrink-0 ml-1"
                                        >
                                            Solo
                                        </button>
                                    </div>
                                );
                            })}
                            {routeList.length === 0 && <span className="text-[12px] text-slate-400 italic p-1">No hay rutas</span>}
                        </div>
                    </div>

                    {/* 3. Buques */}
                    <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <div className="flex items-center gap-1.5">
                                <Anchor size={13} className="text-sky-600" />
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Buques ({vesselList.length - hiddenVessels.length}/{vesselList.length})</span>
                            </div>
                            <div className="flex gap-1 text-[10px]">
                                <button type="button" onClick={() => setHiddenVessels([])} className="text-sky-600 hover:text-sky-800 font-bold px-1 rounded hover:bg-sky-50 cursor-pointer">Todos</button>
                                <span className="text-slate-300">|</span>
                                <button type="button" onClick={() => setHiddenVessels([...vesselList])} className="text-slate-500 hover:text-slate-700 font-bold px-1 rounded hover:bg-slate-100 cursor-pointer">Ninguno</button>
                            </div>
                        </div>
                        <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-1.5 bg-slate-50 flex flex-col gap-1 shadow-2xs">
                            {vesselList.map(v => {
                                const isChecked = !hiddenVessels.includes(v);
                                return (
                                    <div key={v} className="flex items-center justify-between group px-1 py-0.5 hover:bg-white rounded transition-colors">
                                        <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 cursor-pointer truncate flex-1">
                                            <input 
                                                type="checkbox" 
                                                checked={isChecked} 
                                                onChange={() => toggleFilter(v, hiddenVessels, setHiddenVessels)} 
                                                className="rounded text-sky-600 focus:ring-sky-500" 
                                            />
                                            <span className="truncate">{v}</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => isolateVessel(v)}
                                            title={`Aislar solo ${v}`}
                                            className="text-[10px] font-black text-sky-700 bg-sky-50 hover:bg-sky-600 hover:text-white border border-sky-200 px-1.5 py-0.2 rounded transition-colors cursor-pointer shrink-0 ml-1"
                                        >
                                            Solo
                                        </button>
                                    </div>
                                );
                            })}
                            {vesselList.length === 0 && <span className="text-[12px] text-slate-400 italic p-1">No hay buques</span>}
                        </div>
                    </div>

                    {/* 4. Meses */}
                    <div className="flex flex-col gap-1.5 col-span-1 md:col-span-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <div className="flex items-center gap-1.5">
                                <Calendar size={13} className="text-sky-600" />
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Meses ({months.length - hiddenMonths.length}/{months.length})</span>
                            </div>
                            <div className="flex gap-1 text-[10px]">
                                <button type="button" onClick={() => setHiddenMonths([])} className="text-sky-600 hover:text-sky-800 font-bold px-1 rounded hover:bg-sky-50 cursor-pointer">Todos</button>
                                <span className="text-slate-300">|</span>
                                <button type="button" onClick={() => setHiddenMonths([...months])} className="text-slate-500 hover:text-slate-700 font-bold px-1 rounded hover:bg-slate-100 cursor-pointer">Ninguno</button>
                            </div>
                        </div>
                        <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col gap-2 shadow-2xs">
                            {Object.entries(quarters).map(([qKey, qMonths]) => (
                                <div key={qKey} className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[11px] font-black text-slate-700 w-14 shrink-0 font-mono">{qKey}:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {qMonths.map(m => {
                                            const monthIdx = parseInt(m.split('-')[1], 10) - 1;
                                            const mName = monthNames[monthIdx];
                                            const isChecked = !hiddenMonths.includes(m);
                                            return (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => toggleFilter(m, hiddenMonths, setHiddenMonths)}
                                                    className={`px-2 py-0.5 text-[11px] font-bold rounded border transition-colors cursor-pointer ${isChecked ? 'bg-sky-600 text-white border-sky-700 shadow-2xs' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'}`}
                                                >
                                                    {mName}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* ESTRUCTURA DE MATRIZ Y BOTONES DE EXPORTACIÓN */}
                <div className="flex flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-6">
                        <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Estructura Matriz:</span>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${showSubtotals ? 'bg-sky-600' : 'bg-slate-300'}`}>
                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showSubtotals ? 'translate-x-4' : 'translate-x-1'}`} />
                            </div>
                            <input type="checkbox" className="hidden" checked={showSubtotals} onChange={(e) => setShowSubtotals(e.target.checked)} />
                            <span className="text-[11.5px] font-bold text-slate-700 group-hover:text-sky-800 transition-colors">Subtotales Cliente</span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${showAccumulatedTotal ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showAccumulatedTotal ? 'translate-x-4' : 'translate-x-1'}`} />
                            </div>
                            <input type="checkbox" className="hidden" checked={showAccumulatedTotal} onChange={(e) => setShowAccumulatedTotal(e.target.checked)} />
                            <span className="text-[11.5px] font-bold text-slate-700 group-hover:text-indigo-800 transition-colors">Acumulado Global</span>
                        </label>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            type="button"
                            onClick={() => handlePrintPDF('portrait')}
                            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-extrabold shadow-2xs transition-all cursor-pointer"
                        >
                            <FileText size={13} /> PDF Vertical
                        </button>
                        <button 
                            type="button"
                            onClick={() => handlePrintPDF('landscape')}
                            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-extrabold shadow-2xs transition-all cursor-pointer"
                        >
                            <FileText size={13} /> PDF Horizontal
                        </button>
                        <button 
                            type="button"
                            onClick={handleExportExcel}
                            id="btn-export-excel"
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-extrabold shadow-2xs transition-all cursor-pointer"
                        >
                            <Download size={13} /> Exportar Excel
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
