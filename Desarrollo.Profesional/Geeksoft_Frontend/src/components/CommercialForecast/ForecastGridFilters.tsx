import React, { useMemo } from 'react';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';
import { ChevronDown, ChevronRight, Download, Filter, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

export const ForecastGridFilters: React.FC = () => {
    const { 
        data, 
        dynamicMonths: months,
        hiddenClients, setHiddenClients,
        hiddenRoutes, setHiddenRoutes,
        hiddenVessels, setHiddenVessels,
        hiddenMonths, setHiddenMonths,
        isFiltersCollapsed, setIsFiltersCollapsed,
        showSubtotals, setShowSubtotals,
        showAccumulatedTotal, setShowAccumulatedTotal
    } = useForecastContext_V2();

    const { clientList, routeList, vesselList } = useMemo(() => {
        const allClients = new Set<string>();
        const validRoutes = new Set<string>();
        const validVessels = new Set<string>();

        if (data?.aggregated_data) {
            Object.entries(data.aggregated_data).forEach(([client, routesData]: any) => {
                allClients.add(client);
                
                // Si el cliente está activo (no oculto), procesamos sus rutas
                if (!hiddenClients.includes(client)) {
                    Object.entries(routesData).forEach(([route, vesselsData]: any) => {
                        validRoutes.add(route);
                        
                        // Si la ruta está activa (no oculta), procesamos sus buques
                        if (!hiddenRoutes.includes(route)) {
                            Object.entries(vesselsData).forEach(([vessel]: any) => {
                                validVessels.add(vessel);
                            });
                        }
                    });
                }
            });
        }
        return {
            clientList: Array.from(allClients).sort(),
            routeList: Array.from(validRoutes).sort(),
            vesselList: Array.from(validVessels).sort()
        };
    }, [data, hiddenClients, hiddenRoutes]);

    const toggleFilter = (item: string, hiddenList: string[], setHiddenList: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (hiddenList.includes(item)) setHiddenList(hiddenList.filter(i => i !== item));
        else setHiddenList([...hiddenList, item]);
    };

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
        XLSX.writeFile(wb, "Petral_Forecast_Matriz.xlsx");
    };

    const handlePrintPDF = () => {
        const table = document.getElementById('forecast-grid-table');
        if (!table) return alert('No se encontró la tabla para imprimir.');

        const clone = table.cloneNode(true) as HTMLTableElement;
        
        // Reemplazar inputs con sus valores
        const inputs = clone.querySelectorAll('input');
        inputs.forEach(input => {
            const val = input.value;
            const parent = input.parentElement;
            if (parent) parent.textContent = val;
        });

        // Add Petral logo logic
        const html = `
            <html>
            <head>
                <title>Matriz Comercial - PDF</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; font-size: 10px; }
                    .header-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
                    .title { font-size: 20px; font-weight: bold; color: #0f172a; }
                    .subtitle { font-size: 12px; color: #475569; margin-top: 4px; }
                    .logo-placeholder { background: #0f172a; color: white; padding: 10px 20px; font-weight: bold; border-radius: 4px; font-size: 18px; letter-spacing: 2px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right; }
                    th { background-color: #1e293b; color: white; text-transform: uppercase; font-size: 9px; text-align: center; }
                    .text-left { text-align: left; }
                    .text-center { text-align: center; }
                    .font-bold { font-weight: bold; }
                    .bg-slate-100 { background-color: #f1f5f9; }
                    .bg-slate-200 { background-color: #e2e8f0; }
                    .text-red-600 { color: #dc2626; }
                    .text-teal-700 { color: #0f766e; }
                    .footer-container { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; }
                    @media print {
                        @page { size: landscape; margin: 10mm; }
                        body { padding: 0; }
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                        thead { display: table-header-group; }
                        tfoot { display: table-footer-group; }
                    }
                </style>
            </head>
            <body>
                <div class="header-container">
                    <div>
                        <div class="title">Matriz de Forecast Comercial</div>
                        <div class="subtitle">Generado el: ${new Date().toLocaleString('es-PE')}</div>
                    </div>
                    <div class="logo-placeholder">PETRAL</div>
                </div>
                
                ${clone.outerHTML}

                <div class="footer-container">
                    <div>Generado por Shipping Soft</div>
                    <div>Desarrollado por Geeksoft</div>
                </div>
                
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        const pw = window.open('', '_blank');
        if (pw) {
            pw.document.write(html);
            pw.document.close();
        } else {
            alert('El navegador bloqueó la ventana emergente. Por favor, habilítala para exportar el PDF.');
        }
    };

    return (
        <div className="w-full bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden flex flex-col mb-4">
            <div 
                className="bg-slate-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
            >
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <Filter className="w-5 h-5 text-petral-teal" />
                    <span>Filtros Dinámicos y Controles de Exportación</span>
                </div>
                <div className="flex items-center gap-4">
                    {isFiltersCollapsed && (
                        <div className="flex gap-2 text-xs text-slate-500 font-medium">
                            <span>{clientList.length - hiddenClients.length}/{clientList.length} Clientes</span>
                            <span>{routeList.length - hiddenRoutes.length}/{routeList.length} Rutas</span>
                            <span>{vesselList.length - hiddenVessels.length}/{vesselList.length} Buques</span>
                            <span>{months.length - hiddenMonths.length}/{months.length} Meses</span>
                        </div>
                    )}
                    <button className="text-slate-400 hover:text-slate-600 focus:outline-none">
                        {isFiltersCollapsed ? <ChevronRight size={20}/> : <ChevronDown size={20}/>}
                    </button>
                </div>
            </div>

            {!isFiltersCollapsed && (
                <div className="p-4 flex flex-col gap-6 bg-white border-t border-slate-100">
                    
                    {/* Filtros de Datos en Cascada */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hiddenClients.length === 0}
                                    ref={el => { if (el) el.indeterminate = hiddenClients.length > 0 && hiddenClients.length < clientList.length; }}
                                    onChange={() => setHiddenClients(hiddenClients.length === 0 ? clientList : [])}
                                    className="rounded text-petral-teal focus:ring-petral-teal"
                                />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clientes</span>
                            </label>
                            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50 flex flex-col gap-1">
                                {clientList.map(c => (
                                    <label key={c} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                        <input type="checkbox" checked={!hiddenClients.includes(c)} onChange={() => toggleFilter(c, hiddenClients, setHiddenClients)} className="rounded text-petral-teal focus:ring-petral-teal" />
                                        {c}
                                    </label>
                                ))}
                                {clientList.length === 0 && <span className="text-xs text-slate-400 italic">No hay clientes</span>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hiddenRoutes.length === 0}
                                    ref={el => { if (el) el.indeterminate = hiddenRoutes.length > 0 && hiddenRoutes.length < routeList.length; }}
                                    onChange={() => setHiddenRoutes(hiddenRoutes.length === 0 ? routeList : [])}
                                    className="rounded text-petral-teal focus:ring-petral-teal"
                                />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rutas</span>
                            </label>
                            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50 flex flex-col gap-1">
                                {routeList.map(r => (
                                    <label key={r} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                        <input type="checkbox" checked={!hiddenRoutes.includes(r)} onChange={() => toggleFilter(r, hiddenRoutes, setHiddenRoutes)} className="rounded text-petral-teal focus:ring-petral-teal" />
                                        {r}
                                    </label>
                                ))}
                                {routeList.length === 0 && <span className="text-xs text-slate-400 italic">No hay rutas</span>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hiddenVessels.length === 0}
                                    ref={el => { if (el) el.indeterminate = hiddenVessels.length > 0 && hiddenVessels.length < vesselList.length; }}
                                    onChange={() => setHiddenVessels(hiddenVessels.length === 0 ? vesselList : [])}
                                    className="rounded text-petral-teal focus:ring-petral-teal"
                                />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Buques</span>
                            </label>
                            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50 flex flex-col gap-1">
                                {vesselList.map(v => (
                                    <label key={v} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                        <input type="checkbox" checked={!hiddenVessels.includes(v)} onChange={() => toggleFilter(v, hiddenVessels, setHiddenVessels)} className="rounded text-petral-teal focus:ring-petral-teal" />
                                        {v}
                                    </label>
                                ))}
                                {vesselList.length === 0 && <span className="text-xs text-slate-400 italic">No hay buques</span>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hiddenMonths.length === 0}
                                    ref={el => { if (el) el.indeterminate = hiddenMonths.length > 0 && hiddenMonths.length < months.length; }}
                                    onChange={() => setHiddenMonths(hiddenMonths.length === 0 ? [...months] : [])}
                                    className="rounded text-petral-teal focus:ring-petral-teal"
                                />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meses</span>
                            </label>
                            <div className="border border-slate-200 rounded p-2 bg-slate-50">
                                <div className="grid grid-cols-4 gap-x-3 gap-y-1">
                                    {months.map(m => (
                                        <label key={m} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer hover:text-petral-teal transition-colors">
                                            <input type="checkbox" checked={!hiddenMonths.includes(m)} onChange={() => toggleFilter(m, hiddenMonths, setHiddenMonths)} className="rounded text-petral-teal focus:ring-petral-teal w-3 h-3" />
                                            <span className="font-medium truncate">{m}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 my-1"></div>

                    {/* Forma de la Tabla y Acciones */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-md border border-slate-200">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Estructura de la Tabla</span>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showSubtotals ? 'bg-petral-teal' : 'bg-slate-300'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showSubtotals ? 'translate-x-4' : 'translate-x-1'}`} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={showSubtotals} onChange={(e) => setShowSubtotals(e.target.checked)} />
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-petral-blue transition-colors">Mostrar Subtotales por Cliente</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group mt-2">
                                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showAccumulatedTotal ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showAccumulatedTotal ? 'translate-x-4' : 'translate-x-1'}`} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={showAccumulatedTotal} onChange={(e) => setShowAccumulatedTotal(e.target.checked)} />
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-800 transition-colors">Mostrar Total Acumulado Global</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handlePrintPDF}
                                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-md text-sm font-bold shadow-sm transition-all hover:shadow-md"
                            >
                                <FileText size={16} />
                                Imprimir PDF
                            </button>
                            <button 
                                onClick={handleExportExcel}
                                id="btn-export-excel"
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-md text-sm font-bold shadow-sm transition-all hover:shadow-md"
                            >
                                <Download size={16} />
                                Bajar a Excel
                            </button>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};
