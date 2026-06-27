import React, { useEffect, useState, useMemo } from 'react';
import { ForecastGrid } from '../../components/CommercialForecast/ForecastGrid';
import { ForecastBuilder } from '../../components/CommercialForecast/ForecastBuilder';
import { InteractiveChart } from '../../components/CommercialForecast/InteractiveChart';
import { ForecastService } from '../../services/api';
import { Save, FolderOpen, X, Table, BarChart2, ChevronUp, ChevronDown } from 'lucide-react';
import { VoyageLedgerTest } from '../../components/CommercialForecast/VoyageLedgerTest';

export const CommercialForecast: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<'none' | 'save' | 'loadList' | 'loadSelected'>('none');
    const [isRibbonCollapsed, setIsRibbonCollapsed] = useState(false);
    
    // Global Horizon State
    const [startDate, setStartDate] = useState("2026-07-01");
    const [endDate, setEndDate] = useState("2026-12-31");
    
    // Builder Bricks
    const [projectionLines, setProjectionLines] = useState<any[]>([]);

    // Persistence State
    const [currentForecastId, setCurrentForecastId] = useState<string | null>(null);
    const [forecastName, setForecastName] = useState<string>("");
    const [userId, setUserId] = useState<string>("Demo User");
    const [loadedAuthor, setLoadedAuthor] = useState<string>("");

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [savedForecasts, setSavedForecasts] = useState<any[]>([]);

    // Tab State
    const [activeTab, setActiveTab] = useState<'grid' | 'chart' | 'ledger'>('grid');
    const [displayMode, setDisplayMode] = useState<'usd'|'pct'>('usd');

    // Derive months from horizon without JS Date timezone shifts
    const dynamicMonths = useMemo(() => {
        if (!startDate || !endDate) return [];
        const startParts = startDate.split('-');
        const endParts = endDate.split('-');
        let currentYear = parseInt(startParts[0]);
        let currentMonth = parseInt(startParts[1]);
        const endYear = parseInt(endParts[0]);
        const endMonth = parseInt(endParts[1]);

        const months = [];
        while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
            const m = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
            months.push(m);
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
        }
        return months;
    }, [startDate, endDate]);

    useEffect(() => {
        const fetchSimulation = async () => {
            if (projectionLines.length === 0) {
                setData(null);
                return;
            }
            
            setLoading(true);
            try {
                const requestPayload = {
                    start_date: startDate,
                    end_date: endDate,
                    projection_lines: projectionLines
                };

                const result = await ForecastService.runSimulation(requestPayload);
                setData(result);
            } catch (error) {
                console.error("Error fetching simulation:", error);
            } finally {
                setLoading(false);
            }
        };

        // Debounce slightly to prevent spamming the engine
        const timeout = setTimeout(fetchSimulation, 300);
        return () => clearTimeout(timeout);
        
    }, [projectionLines, startDate, endDate]);

    const handleAddLine = (newLine: any) => {
        // Simple logic to add or replace if same route/vessel/month exists
        setProjectionLines(prev => {
            const existingIndex = prev.findIndex(p => 
                p.month_index === newLine.month_index && 
                p.vessel_id === newLine.vessel_id &&
                p.destination_port_id === newLine.destination_port_id
            );
            if (existingIndex >= 0) {
                const clone = [...prev];
                clone[existingIndex] = newLine;
                return clone;
            }
            return [...prev, newLine];
        });
    };

    const handleFrequencyChange = (client_id: string, route_key: string, vessel_id: string, month_index: string, newFrequency: number) => {
        setProjectionLines(prev => {
            const destination_port_id = route_key.split('-')[1];
            const existingIndex = prev.findIndex(p => 
                p.month_index === month_index && 
                p.vessel_id === vessel_id &&
                p.destination_port_id === destination_port_id &&
                p.client_id === client_id
            );

            if (existingIndex >= 0) {
                const clone = [...prev];
                clone[existingIndex] = { ...clone[existingIndex], monthly_frequency: newFrequency };
                return clone;
            } else if (newFrequency > 0) {
                // Si la celda estaba en 0 (no existía el viaje en este mes), buscamos otro mes como plantilla
                const templateLine = prev.find(p => 
                    p.vessel_id === vessel_id &&
                    p.destination_port_id === destination_port_id &&
                    p.client_id === client_id
                );
                
                if (templateLine) {
                    const newLine = {
                        ...templateLine,
                        month_index: month_index,
                        monthly_frequency: newFrequency
                    };
                    return [...prev, newLine];
                }
            }
            return prev;
        });
    };
    const handleTariffChange = (client_id: string, route_key: string, vessel_id: string, month_index: string, newTariff: number) => {
        setProjectionLines(prev => {
            const destination_port_id = route_key.split('-')[1];
            const existingIndex = prev.findIndex(p => 
                p.month_index === month_index && 
                p.vessel_id === vessel_id &&
                p.destination_port_id === destination_port_id &&
                p.client_id === client_id
            );

            if (existingIndex >= 0) {
                const clone = [...prev];
                clone[existingIndex] = { ...clone[existingIndex], custom_tariff: newTariff };
                return clone;
            }
            return prev;
        });
    };

    const handleDeleteNode = (type: 'client' | 'route' | 'vessel', client_id: string, route_key?: string, vessel_id?: string) => {
        setProjectionLines(prev => prev.filter(p => {
            if (type === 'client') return p.client_id !== client_id;
            if (type === 'route') return !(p.client_id === client_id && `${p.origin_port_id}-${p.destination_port_id}` === route_key);
            if (type === 'vessel') return !(p.client_id === client_id && `${p.origin_port_id}-${p.destination_port_id}` === route_key && p.vessel_id === vessel_id);
            return true;
        }));
    };

    const handleSaveForecast = async (isNew: boolean = false) => {
        if (!forecastName) {
            alert("Ingrese un nombre para el forecast");
            return;
        }
        try {
            setActionLoading('save');
            
            const payload = {
                id: isNew ? null : currentForecastId,
                name: forecastName,
                user_id: userId,
                start_date: startDate,
                end_date: endDate,
                projection_lines: projectionLines
            };
            const result = await ForecastService.saveForecast(payload);
            setCurrentForecastId(result.id);
            setLoadedAuthor(userId); // Ahora somos los dueños
            setShowSaveModal(false);
        } catch(e) {
            alert("Error al guardar el forecast");
        } finally {
            setActionLoading('none');
        }
    };

    const handleLoadClick = async () => {
        try {
            setActionLoading('loadList');
            const list = await ForecastService.listForecasts();
            setSavedForecasts(list);
            setShowLoadModal(true);
        } catch(e) {
            alert("Error al cargar la lista de forecasts");
        } finally {
            setActionLoading('none');
        }
    };

    const handleLoadSelected = async (id: string) => {
        try {
            setActionLoading('loadSelected');
            const data = await ForecastService.loadForecast(id);
            setStartDate(data.start_date);
            setEndDate(data.end_date);
            setProjectionLines(data.projection_lines);
            setCurrentForecastId(data.id);
            setForecastName(data.name);
            setLoadedAuthor(data.user_id);
            setShowLoadModal(false);
        } catch(e) {
            alert("Error al cargar el forecast");
        } finally {
            setActionLoading('none');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans print:p-0 print:bg-white flex flex-col">

            <main className="flex-1 flex flex-col gap-6 print:gap-0 print:m-0">
                
                {/* 1. Builder Bar */}
                <div className="print:hidden">
                    <ForecastBuilder 
                        currentStartDate={startDate}
                        currentEndDate={endDate}
                        dynamicMonths={dynamicMonths}
                        onHorizonChange={(start, end) => {
                            setStartDate(start);
                            setEndDate(end);
                        }}
                        onAddLine={handleAddLine}
                        forecastName={forecastName}
                        hideInputs={isRibbonCollapsed || activeTab === 'ledger' || activeTab === 'chart'}
                        displayMode={displayMode}
                        onDisplayModeChange={setDisplayMode}
                        isAdding={loading}
                        centerContent={
                            <div className="bg-slate-200 p-1 rounded-lg inline-flex gap-1 shadow-inner">
                                <button 
                                    onClick={() => setActiveTab('grid')}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-sm transition-all ${activeTab === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                                >
                                    <Table size={16} /> Matriz Financiera
                                </button>
                                <button 
                                    onClick={() => setActiveTab('chart')}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-sm transition-all ${activeTab === 'chart' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                                >
                                    <BarChart2 size={16} /> Análisis Gráfico
                                </button>
                                <button 
                                    onClick={() => setActiveTab('ledger')}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-sm transition-all ${activeTab === 'ledger' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                                >
                                    <span className="text-lg">🧪</span> Auditoría Ledger
                                </button>
                            </div>
                        }
                        rightContent={
                            <div className="flex flex-col items-center gap-1">
                                <button 
                                    onClick={() => setIsRibbonCollapsed(!isRibbonCollapsed)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 rounded-full p-1"
                                    title={isRibbonCollapsed ? "Expandir Controles" : "Minimizar Controles"}
                                >
                                    {isRibbonCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                                </button>
                                <img src="/Logo.Petral.png" alt="Naviera Petral" className="h-8 object-contain" />
                            </div>
                        }
                        bottomRightContent={
                            activeTab !== 'ledger' && (
                                <>
                                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                                        <label className="text-xs opacity-0 pointer-events-none">X</label>
                                        <button onClick={() => setShowSaveModal(true)} className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 h-8 w-full rounded-full font-medium text-sm transition-colors shadow-sm">
                                            <Save size={16} /> Guardar
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                                        <label className="text-xs opacity-0 pointer-events-none">X</label>
                                        <button 
                                            onClick={handleLoadClick} 
                                            disabled={actionLoading === 'loadList'}
                                            className={`relative overflow-hidden flex items-center justify-center gap-2 h-8 w-full rounded-full font-medium text-sm transition-colors shadow-sm ${actionLoading === 'loadList' ? 'bg-slate-200 pointer-events-none' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'}`}
                                        >
                                            {actionLoading === 'loadList' && <div className="absolute inset-0 bg-slate-300/50 animate-pulse" style={{ width: '100%' }}></div>}
                                            <span className="relative flex items-center justify-center z-10 w-full gap-2">
                                                {actionLoading === 'loadList' ? (
                                                    <>
                                                        <div className="animate-spin h-3 w-3 border-2 border-slate-500 border-t-transparent rounded-full"></div>
                                                        <span>Abriendo...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FolderOpen size={16} /> Cargar
                                                    </>
                                                )}
                                            </span>
                                        </button>
                                    </div>
                                </>
                            )
                        }
                    />
                </div>

                {/* 2. Custom Grid (1:1 with Mockup) */}
                {activeTab === 'grid' && (
                    <section className="flex flex-col gap-2 relative animate-in fade-in slide-in-from-bottom-2 duration-300 mt-2">
                        <ForecastGrid data={data} months={dynamicMonths} projectionLines={projectionLines} onFrequencyChange={handleFrequencyChange} onTariffChange={handleTariffChange} onDeleteNode={handleDeleteNode} displayMode={displayMode} />
                    </section>
                )}
                
                {/* 3. ECharts Summary */}
                {activeTab === 'chart' && (
                    <section className="flex flex-col flex-1 gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <InteractiveChart data={data} months={dynamicMonths} />
                    </section>
                )}

                {/* 4. Voyage Ledger Test */}
                {activeTab === 'ledger' && (
                    <section className="flex flex-col gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <VoyageLedgerTest />
                    </section>
                )}
            </main>

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-xl relative">
                        <button onClick={() => setShowSaveModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Guardar Escenario</h3>
                        
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-600 mb-1 block">Nombre del Forecast</label>
                                <input type="text" value={forecastName} onChange={(e) => setForecastName(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-petral-teal focus:outline-none" placeholder="Ej. Escenario Conservador H2" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-600 mb-1 block">Usuario / Autor</label>
                                <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none" />
                            </div>
                            <div className="flex flex-col gap-2 mt-2">
                                <button 
                                    onClick={() => handleSaveForecast(true)} 
                                    disabled={actionLoading === 'save'}
                                    className={`relative overflow-hidden w-full font-bold py-2 rounded-full transition-colors ${actionLoading === 'save' ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-petral-teal hover:bg-teal-600 text-white shadow-md'}`}
                                >
                                    {actionLoading === 'save' && <div className="absolute inset-0 bg-white/20 animate-pulse" style={{ width: '100%' }}></div>}
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {actionLoading === 'save' ? 'Procesando...' : 'Guardar Nuevo (Clonar)'}
                                    </span>
                                </button>
                                
                                {currentForecastId && (loadedAuthor === userId || !loadedAuthor) && (
                                    <button 
                                        onClick={() => handleSaveForecast(false)} 
                                        disabled={actionLoading === 'save'}
                                        className={`w-full font-bold py-2 rounded-full transition-colors text-sm border-2 ${actionLoading === 'save' ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300 text-slate-600 hover:border-petral-teal hover:text-petral-teal'}`}
                                    >
                                        Sobrescribir Mi Escenario
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Load Modal */}
            {showLoadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-[500px] shadow-xl relative">
                        <button onClick={() => setShowLoadModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Catálogo de Escenarios</h3>
                        
                        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
                            {savedForecasts.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">No hay escenarios guardados en la BD.</p>
                            ) : (
                                savedForecasts.map(f => (
                                    <div key={f.id} className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${f.user_id === userId ? 'border-petral-teal/30 bg-blue-50/50 hover:bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`} onClick={() => handleLoadSelected(f.id)}>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                {f.name} 
                                                {f.user_id === userId ? (
                                                    <span className="text-[10px] bg-petral-teal text-white px-2 py-0.5 rounded-full font-semibold">Tuyo</span>
                                                ) : (
                                                    <span className="font-normal text-slate-400 text-xs">@{f.user_id}</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500">{f.start_date} a {f.end_date}</div>
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(f.updated_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
