const fs = require('fs');
const filePath = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/ForecastGridFilters.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const startIndex = content.indexOf('    return (');
if (startIndex === -1) {
    console.error('No se encontro el return');
    process.exit(1);
}

const newJsx = \    return (
        <div className="w-full bg-white flex flex-col">
            <div className="p-4 flex flex-col gap-6 bg-white">
                
                {/* Filtros de Datos en Cascada */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    
                    {/* Clientes */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hiddenClients.length === 0}
                                ref={el => { if (el) el.indeterminate = hiddenClients.length > 0 && hiddenClients.length < clientList.length; }}
                                onChange={() => setHiddenClients(hiddenClients.length === 0 ? clientList : [])}
                                className="rounded text-petral-teal focus:ring-petral-teal"
                            />
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Clientes</span>
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50 flex flex-col gap-1.5">
                            {clientList.map(c => (
                                <label key={c} className="flex items-center gap-2 text-[13px] font-medium text-slate-700 cursor-pointer hover:text-petral-teal transition-colors">
                                    <input type="checkbox" checked={!hiddenClients.includes(c)} onChange={() => toggleFilter(c, hiddenClients, setHiddenClients)} className="rounded text-petral-teal focus:ring-petral-teal" />
                                    \
                                </label>
                            ))}
                            {clientList.length === 0 && <span className="text-[13px] text-slate-400 italic">No hay clientes</span>}
                        </div>
                    </div>

                    {/* Rutas (2 columnas) */}
                    <div className="flex flex-col gap-2 col-span-1 md:col-span-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hiddenRoutes.length === 0}
                                ref={el => { if (el) el.indeterminate = hiddenRoutes.length > 0 && hiddenRoutes.length < routeList.length; }}
                                onChange={() => setHiddenRoutes(hiddenRoutes.length === 0 ? routeList : [])}
                                className="rounded text-petral-teal focus:ring-petral-teal"
                            />
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rutas</span>
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                                {routeList.map(r => (
                                    <label key={r} className="flex items-center gap-2 text-[13px] font-medium text-slate-700 cursor-pointer hover:text-petral-teal transition-colors">
                                        <input type="checkbox" checked={!hiddenRoutes.includes(r)} onChange={() => toggleFilter(r, hiddenRoutes, setHiddenRoutes)} className="rounded text-petral-teal focus:ring-petral-teal" />
                                        <span className="truncate">\</span>
                                    </label>
                                ))}
                            </div>
                            {routeList.length === 0 && <span className="text-[13px] text-slate-400 italic">No hay rutas</span>}
                        </div>
                    </div>

                    {/* Buques */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hiddenVessels.length === 0}
                                ref={el => { if (el) el.indeterminate = hiddenVessels.length > 0 && hiddenVessels.length < vesselList.length; }}
                                onChange={() => setHiddenVessels(hiddenVessels.length === 0 ? vesselList : [])}
                                className="rounded text-petral-teal focus:ring-petral-teal"
                            />
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Buques</span>
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50 flex flex-col gap-1.5">
                            {vesselList.map(v => (
                                <label key={v} className="flex items-center gap-2 text-[13px] font-medium text-slate-700 cursor-pointer hover:text-petral-teal transition-colors">
                                    <input type="checkbox" checked={!hiddenVessels.includes(v)} onChange={() => toggleFilter(v, hiddenVessels, setHiddenVessels)} className="rounded text-petral-teal focus:ring-petral-teal" />
                                    \
                                </label>
                            ))}
                            {vesselList.length === 0 && <span className="text-[13px] text-slate-400 italic">No hay buques</span>}
                        </div>
                    </div>

                    {/* Meses (3 columnas) */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hiddenMonths.length === 0}
                                ref={el => { if (el) el.indeterminate = hiddenMonths.length > 0 && hiddenMonths.length < months.length; }}
                                onChange={() => setHiddenMonths(hiddenMonths.length === 0 ? [...months] : [])}
                                className="rounded text-petral-teal focus:ring-petral-teal"
                            />
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Meses</span>
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50">
                            <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
                                {months.map(m => (
                                    <label key={m} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700 cursor-pointer hover:text-petral-teal transition-colors">
                                        <input type="checkbox" checked={!hiddenMonths.includes(m)} onChange={() => toggleFilter(m, hiddenMonths, setHiddenMonths)} className="rounded text-petral-teal focus:ring-petral-teal" />
                                        <span className="truncate">\</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-200 my-1"></div>

                {/* Forma de la Tabla y Acciones en una sola linea horizontal */}
                <div className="flex flex-row items-center justify-between gap-4 bg-slate-50 p-3 rounded-md border border-slate-200">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-6">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-2">Estructura:</span>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={\elative inline-flex h-4 w-8 items-center rounded-full transition-colors \\}>
                                    <span className={\inline-block h-3 w-3 transform rounded-full bg-white transition-transform \\} />
                                </div>
                                <input type="checkbox" className="hidden" checked={showSubtotals} onChange={(e) => setShowSubtotals(e.target.checked)} />
                                <span className="text-[12px] font-medium text-slate-700 group-hover:text-petral-blue transition-colors">Subtotales Cliente</span>
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={\elative inline-flex h-4 w-8 items-center rounded-full transition-colors \\}>
                                    <span className={\inline-block h-3 w-3 transform rounded-full bg-white transition-transform \\} />
                                </div>
                                <input type="checkbox" className="hidden" checked={showAccumulatedTotal} onChange={(e) => setShowAccumulatedTotal(e.target.checked)} />
                                <span className="text-[12px] font-medium text-slate-700 group-hover:text-indigo-800 transition-colors">Acumulado Global</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handlePrintPDF('portrait')}
                            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-md text-[11px] font-bold shadow-sm transition-all"
                        >
                            <FileText size={14} /> PDF Vertical
                        </button>
                        <button 
                            onClick={() => handlePrintPDF('landscape')}
                            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-md text-[11px] font-bold shadow-sm transition-all"
                        >
                            <FileText size={14} /> PDF Horizontal
                        </button>
                        <button 
                            onClick={handleExportExcel}
                            id="btn-export-excel"
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-[11px] font-bold shadow-sm transition-all"
                        >
                            <Download size={14} /> a Excel
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
\

const newContent = content.substring(0, startIndex) + newJsx;
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Update completado');
