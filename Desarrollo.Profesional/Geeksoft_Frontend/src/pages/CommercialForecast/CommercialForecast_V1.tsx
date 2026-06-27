import React, { useEffect, useState, useMemo } from 'react';
import { ForecastGrid } from '../../components/CommercialForecast/ForecastGrid';
import { ForecastBuilder } from '../../components/CommercialForecast/ForecastBuilder';
import { InteractiveChart } from '../../components/CommercialForecast/InteractiveChart';
import { ForecastService } from '../../services/api';
import { Activity, Save, FolderOpen, X, Table, BarChart2 } from 'lucide-react';
import { VoyageLedgerTest } from '../../components/CommercialForecast/VoyageLedgerTest';

export const CommercialForecast: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    
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
    const [activeTab, setActiveTab] = useState<'grid' | 'chart' | 'ledger'>('ledger');

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

    const handleSaveForecast = async () => {
        if (!forecastName) {
            alert("Ingrese un nombre para el forecast");
            return;
        }
        try {
            // Si el autor original del escenario es diferente al usuario actual, forzamos un clon (INSERT) quitando el ID
            const isOwner = !loadedAuthor || loadedAuthor === userId;
            
            const payload = {
                id: isOwner ? currentForecastId : null,
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
        }
    };

    const handleLoadClick = async () => {
        try {
            const list = await ForecastService.listForecasts();
            setSavedForecasts(list);
            setShowLoadModal(true);
        } catch(e) {
            alert("Error al cargar la lista de forecasts");
        }
    };

    const handleLoadSelected = async (id: string) => {
        try {
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
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <header className="mb-6 flex items-center justify-between">
                {/* Left: Geeksoft Logo */}
                <div className="flex items-center flex-1">
                    <img src="/Logo.Geeksoft.png" alt="Geeksoft Logo" className="h-24 object-contain" />
                </div>
                
                {/* Center: Title & Subtitle */}
                <div className="flex flex-col items-center justify-center flex-[2]">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Activity size={24} className="text-petral-blue" />
                        Commercial Forecast {forecastName && <span className="text-petral-teal ml-1">[{forecastName}]</span>}
                    </h1>
                </div>

                {/* Right: Petral Logo */}
                <div className="flex items-center justify-end flex-1">
                    <img src="/Logo.Petral.png" alt="Petral Logo" className="h-8 object-contain" />
                </div>
            </header>

            <main className="flex flex-col gap-6">
                
                {/* 1. Builder Bar */}
                <ForecastBuilder 
                    currentStartDate={startDate}
                    currentEndDate={endDate}
                    dynamicMonths={dynamicMonths}
                    onHorizonChange={(start, end) => {
                        setStartDate(start);
                        setEndDate(end);
                    }}
                    onAddLine={handleAddLine}
                    hideInputs={activeTab === 'ledger'}
                    centerContent={
                        <div className="bg-slate-200 p-1 rounded-lg inline-flex gap-1 shadow-inner">
                            <button 
                                onClick={() => setActiveTab('grid')}
                                className={`flex items-center gap-2 px-6 py-2 rounded-md font-semibold text-sm transition-all ${activeTab === 'grid' ? 'bg-white text-petral-blue shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                            >
                                <Table size={16} /> Matriz Financiera
                            </button>
                            <button 
                                onClick={() => setActiveTab('chart')}
                                className={`flex items-center gap-2 px-6 py-2 rounded-md font-semibold text-sm transition-all ${activeTab === 'chart' ? 'bg-white text-petral-blue shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                            >
                                <BarChart2 size={16} /> Análisis Gráfico
                            </button>
                            <button 
                                onClick={() => setActiveTab('ledger')}
                                className={`flex items-center gap-2 px-6 py-2 rounded-md font-semibold text-sm transition-all ${activeTab === 'ledger' ? 'bg-white text-petral-teal shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                            >
                                <span className="text-lg">🧪</span> Auditoría Ledger
                            </button>
                        </div>
                    }
                    rightContent={
                        activeTab !== 'ledger' && (
                            <div className="flex items-center gap-3">
                                {loading && <span className="text-xs text-petral-teal font-medium flex items-center gap-2"><div className="animate-spin h-3 w-3 border-2 border-petral-teal border-t-transparent rounded-full"></div> Recalculando...</span>}
                                <button onClick={() => setShowSaveModal(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm">
                                    <Save size={16} /> Guardar
                                </button>
                                <button onClick={handleLoadClick} className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm">
                                    <FolderOpen size={16} /> Cargar
                                </button>
                            </div>
                        )
                    }
                />

                {/* 2. Custom Grid (1:1 with Mockup) */}
                {activeTab === 'grid' && (
                    <section className="flex flex-col gap-2 relative animate-in fade-in slide-in-from-bottom-2 duration-300 mt-2">
                        <ForecastGrid data={data} months={dynamicMonths} projectionLines={projectionLines} displayMode="usd" onFrequencyChange={handleFrequencyChange} onTariffChange={handleTariffChange} />
                    </section>
                )}
                
                {/* 3. ECharts Summary */}
                {activeTab === 'chart' && (
                    <section className="flex flex-col gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                            <button onClick={handleSaveForecast} className="mt-2 w-full bg-petral-teal hover:bg-teal-700 text-white font-bold py-2 rounded transition-colors">
                                {currentForecastId && (loadedAuthor === userId || !loadedAuthor) ? 'Sobrescribir Mi Escenario' : 'Guardar Nuevo (Clonar)'}
                            </button>
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
                                    <div key={f.id} className="flex items-center justify-between p-3 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => handleLoadSelected(f.id)}>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">
                                                {f.name} <span className="font-normal text-petral-teal ml-2">@{f.user_id}</span>
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
