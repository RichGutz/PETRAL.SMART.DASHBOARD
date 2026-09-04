import React, { useMemo, useState } from 'react';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';
import { Download, FileText, RotateCcw, Filter, UserCheck, Navigation, Anchor, Calendar, Loader2 } from 'lucide-react';
import { exportFinancialMatrixExcel } from '../../services/exportFinancialMatrixExcel';
import { exportFinancialMatrixPdf } from '../../services/exportFinancialMatrixPdf';
import { exportFinancialMatrixNavitransoExcel } from '../../services/exportFinancialMatrixNavitransoExcel';
import { exportFinancialMatrixNavitransoPdf } from '../../services/exportFinancialMatrixNavitransoPdf';

export const ForecastGridFilters: React.FC = () => {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const { 
        data, 
        dynamicMonths: months = [],
        matrixFormat = 'PETRAL',
        hiddenClients = [], setHiddenClients = (() => {}),
        hiddenRoutes = [], setHiddenRoutes = (() => {}),
        hiddenVessels = [], setHiddenVessels = (() => {}),
        hiddenMonths = [], setHiddenMonths = (() => {}),
        showSubtotals = true, setShowSubtotals = (() => {}),
        showAccumulatedTotal = true, setShowAccumulatedTotal = (() => {})
    } = useForecastContext_V2() || {};

    const safeMonths = months || [];
    const safeHiddenClients = hiddenClients || [];
    const safeHiddenRoutes = hiddenRoutes || [];
    const safeHiddenVessels = hiddenVessels || [];
    const safeHiddenMonths = hiddenMonths || [];

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
        const list = hiddenList || [];
        if (list.includes(item)) setHiddenList(list.filter(i => i !== item));
        else setHiddenList([...list, item]);
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

    const isAnyFilterActive = safeHiddenClients.length > 0 || safeHiddenRoutes.length > 0 || safeHiddenVessels.length > 0 || safeHiddenMonths.length > 0;

    const activeFilterSummary = useMemo(() => {
        const activeC = clientList.filter(c => !safeHiddenClients.includes(c));
        const activeR = routeList.filter(r => !safeHiddenRoutes.includes(r));
        const activeV = vesselList.filter(v => !safeHiddenVessels.includes(v));
        const activeM = safeMonths.filter(m => !safeHiddenMonths.includes(m));

        const summaries: string[] = [];
        if (safeHiddenClients.length > 0) {
            summaries.push(activeC.length === 1 ? `Cliente: ${activeC[0]}` : `${activeC.length}/${clientList.length} Clientes`);
        }
        if (safeHiddenRoutes.length > 0) {
            summaries.push(activeR.length === 1 ? `Ruta: ${activeR[0]}` : `${activeR.length}/${routeList.length} Rutas`);
        }
        if (safeHiddenVessels.length > 0) {
            summaries.push(activeV.length === 1 ? `Buque: ${activeV[0]}` : `${activeV.length}/${vesselList.length} Buques`);
        }
        if (safeHiddenMonths.length > 0) {
            summaries.push(`${activeM.length}/${safeMonths.length} Meses`);
        }
        return summaries.join(' • ');
    }, [clientList, routeList, vesselList, safeMonths, safeHiddenClients, safeHiddenRoutes, safeHiddenVessels, safeHiddenMonths]);

    const handleExportExcel = async () => {
        try {
            if (matrixFormat === 'NAVITRANSO') {
                await exportFinancialMatrixNavitransoExcel('forecast-grid-table');
            } else {
                await exportFinancialMatrixExcel('forecast-grid-table');
            }
        } catch (err: any) {
            console.error('Error exportando Excel con ExcelJS:', err);
            alert(`Error al exportar Excel: ${err?.message || err}`);
        }
    };

    const handlePrintPDF = async (orientation: 'portrait' | 'landscape') => {
        if (isGeneratingPdf) return;
        setIsGeneratingPdf(true);
        try {
            const scenarioName = data?.name || data?.scenario_name || (matrixFormat === 'NAVITRANSO' ? 'Escenario Base NAVITRANSO' : 'Escenario Base PETRAL');
            if (matrixFormat === 'NAVITRANSO') {
                await exportFinancialMatrixNavitransoPdf('forecast-grid-table', orientation, scenarioName);
            } else {
                await exportFinancialMatrixPdf('forecast-grid-table', orientation, scenarioName, data);
            }
        } catch (err: any) {
            console.error('Error generando PDF de la Matriz Financiera:', err);
            alert(`Error al generar PDF: ${err?.message || err}`);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const monthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'
    ];

    const quarters = useMemo(() => {
        const qMap: Record<string, string[]> = {};
        (safeMonths || []).forEach(m => {
            if (!m || typeof m !== 'string') return;
            const parts = m.split('-');
            if (parts.length < 2) return;
            const year = parts[0];
            const monthNum = parseInt(parts[1], 10);
            if (isNaN(monthNum)) return;
            const q = Math.ceil(monthNum / 3);
            const key = `Q${q} ${year}`;
            if (!qMap[key]) qMap[key] = [];
            qMap[key].push(m);
        });
        return qMap;
    }, [safeMonths]);

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
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Clientes ({clientList.length - safeHiddenClients.length}/{clientList.length})</span>
                            </div>
                            <div className="flex gap-1 text-[10px]">
                                <button type="button" onClick={() => setHiddenClients([])} className="text-sky-600 hover:text-sky-800 font-bold px-1 rounded hover:bg-sky-50 cursor-pointer">Todos</button>
                                <span className="text-slate-300">|</span>
                                <button type="button" onClick={() => setHiddenClients([...clientList])} className="text-slate-500 hover:text-slate-700 font-bold px-1 rounded hover:bg-slate-100 cursor-pointer">Ninguno</button>
                            </div>
                        </div>
                        <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-1.5 bg-slate-50 flex flex-col gap-1 shadow-2xs">
                            {clientList.map(c => {
                                const isChecked = !safeHiddenClients.includes(c);
                                return (
                                    <div key={c} className="flex items-center justify-between group px-1 py-0.5 hover:bg-white rounded transition-colors">
                                        <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 cursor-pointer truncate flex-1">
                                            <input 
                                                type="checkbox" 
                                                checked={isChecked} 
                                                onChange={() => toggleFilter(c, safeHiddenClients, setHiddenClients)} 
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
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Rutas ({routeList.length - safeHiddenRoutes.length}/{routeList.length})</span>
                            </div>
                            <div className="flex gap-1 text-[10px]">
                                <button type="button" onClick={() => setHiddenRoutes([])} className="text-sky-600 hover:text-sky-800 font-bold px-1 rounded hover:bg-sky-50 cursor-pointer">Todas</button>
                                <span className="text-slate-300">|</span>
                                <button type="button" onClick={() => setHiddenRoutes([...routeList])} className="text-slate-500 hover:text-slate-700 font-bold px-1 rounded hover:bg-slate-100 cursor-pointer">Ninguna</button>
                            </div>
                        </div>
                        <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-1.5 bg-slate-50 flex flex-col gap-1 shadow-2xs">
                            {routeList.map(r => {
                                const isChecked = !safeHiddenRoutes.includes(r);
                                return (
                                    <div key={r} className="flex items-center justify-between group px-1 py-0.5 hover:bg-white rounded transition-colors">
                                        <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 cursor-pointer truncate flex-1">
                                            <input 
                                                type="checkbox" 
                                                checked={isChecked} 
                                                onChange={() => toggleFilter(r, safeHiddenRoutes, setHiddenRoutes)} 
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
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Buques ({vesselList.length - safeHiddenVessels.length}/{vesselList.length})</span>
                            </div>
                            <div className="flex gap-1 text-[10px]">
                                <button type="button" onClick={() => setHiddenVessels([])} className="text-sky-600 hover:text-sky-800 font-bold px-1 rounded hover:bg-sky-50 cursor-pointer">Todos</button>
                                <span className="text-slate-300">|</span>
                                <button type="button" onClick={() => setHiddenVessels([...vesselList])} className="text-slate-500 hover:text-slate-700 font-bold px-1 rounded hover:bg-slate-100 cursor-pointer">Ninguno</button>
                            </div>
                        </div>
                        <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-1.5 bg-slate-50 flex flex-col gap-1 shadow-2xs">
                            {vesselList.map(v => {
                                const isChecked = !safeHiddenVessels.includes(v);
                                return (
                                    <div key={v} className="flex items-center justify-between group px-1 py-0.5 hover:bg-white rounded transition-colors">
                                        <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 cursor-pointer truncate flex-1">
                                            <input 
                                                type="checkbox" 
                                                checked={isChecked} 
                                                onChange={() => toggleFilter(v, safeHiddenVessels, setHiddenVessels)} 
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
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Meses ({safeMonths.length - safeHiddenMonths.length}/{safeMonths.length})</span>
                            </div>
                            <div className="flex gap-1 text-[10px]">
                                <button type="button" onClick={() => setHiddenMonths([])} className="text-sky-600 hover:text-sky-800 font-bold px-1 rounded hover:bg-sky-50 cursor-pointer">Todos</button>
                                <span className="text-slate-300">|</span>
                                <button type="button" onClick={() => setHiddenMonths([...safeMonths])} className="text-slate-500 hover:text-slate-700 font-bold px-1 rounded hover:bg-slate-100 cursor-pointer">Ninguno</button>
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
                                            const isChecked = !safeHiddenMonths.includes(m);
                                            return (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => toggleFilter(m, safeHiddenMonths, setHiddenMonths)}
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
                            onClick={() => handlePrintPDF('landscape')}
                            id="btn-export-pdf"
                            disabled={isGeneratingPdf}
                            className={`flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-extrabold shadow-2xs transition-all ${isGeneratingPdf ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                            title="Genera y descarga el PDF en el servidor con WeasyPrint (Anti Sharing Violation)"
                        >
                            {isGeneratingPdf ? (
                                <>
                                    <Loader2 size={13} className="animate-spin" />
                                    Generando PDF...
                                </>
                            ) : (
                                <>
                                    <FileText size={13} />
                                    PDF Horizontal
                                </>
                            )}
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
