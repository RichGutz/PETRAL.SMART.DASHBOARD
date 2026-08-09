/**
 * @deprecated 
 * IMPORTANTE (Arquitectura V2 - LA BURRADA): 
 * ESTA ES UNA VERSIÓN LEGACY. NO DEBE SER UTILIZADA NI MODIFICADA.
 * Toda nueva lógica visual, componentes y enrutamientos se hacen en los archivos _V2.tsx
 */
import React, { useEffect, useState, useMemo } from 'react';
import { ForecastGrid } from '../../components/CommercialForecast/ForecastGrid';
import { ForecastBuilder } from '../../components/CommercialForecast/ForecastBuilder';
import { InteractiveChart } from '../../components/CommercialForecast/InteractiveChart';
import { ForecastService } from '../../services/api';
import { Save, FolderOpen, X, Table, BarChart2, ChevronUp, ChevronDown, Sun, Moon, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VoyageLedgerTest } from '../../components/CommercialForecast/VoyageLedgerTest';
import { VoyageLedgerUniversal } from '../../components/CommercialForecast/VoyageLedgerUniversal';
import { SpaghettiMap } from '../../components/CommercialForecast/SpaghettiMap';
import { MultiCotizadorExcel } from '../../components/CommercialForecast/MultiCotizadorExcel';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';

export const CommercialForecast: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<'none' | 'save' | 'loadList' | 'loadSelected'>('none');
    const [isRibbonCollapsed, setIsRibbonCollapsed] = useState(false);
    const navigate = useNavigate();
    
    // Theme State
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);
    
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
    const [activeTab, setActiveTab] = useState<'grid' | 'chart' | 'ledger' | 'ledger_universal' | 'spot' | 'multicotizador' | 'multicotizador_excel' | 'map'>('grid');
    const [displayMode, setDisplayMode] = useState<'usd'|'pct'>('usd');

    // Ports State
    const [ports, setPorts] = useState<any[]>([]);

    useEffect(() => {
        const loadPorts = async () => {
            try {
                const data = await ForecastService.getPorts();
                setPorts(data);
            } catch (e) {
                console.error("Error loading ports:", e);
            }
        };
        loadPorts();
    }, []);

    // Demurrage State
    const { 
        demurragePct, setDemurragePct,
        showDemurrage, setShowDemurrage, handleSetShowDemurrage,
        demurrageDays, setDemurrageDays,
        showDemurrageDays, setShowDemurrageDays, handleSetShowDemurrageDays,
        excludedDemurrages, setExcludedDemurrages,
        customDemurrages, setCustomDemurrages,
        customDemurrageDays, setCustomDemurrageDays,
        handleManualRecalculate,
        spotRoutes
    } = useForecastContext_V2();

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

    // Port Cost Mode State (static vs matrix)
    const [portCostMode, setPortCostMode] = useState<'static' | 'matrix'>('static');

    // Helper reutilizable para correr la simulación con valores explícitos
    const runSimulationWith = async (lines: any[], sDate: string, eDate: string) => {
        if (lines.length === 0) {
            setData(null);
            return;
        }
        setLoading(true);
        try {
            const requestPayload = {
                start_date: sDate,
                end_date: eDate,
                projection_lines: lines,
                port_cost_mode: portCostMode
            };
            const result = await ForecastService.runSimulation(requestPayload);
            setData(result);
        } catch (error: any) {
            console.error("Error fetching simulation:", error);
            const msg = error?.response?.data?.detail || error?.message || "Error desconocido";
            alert(`Error al correr simulación: ${msg}`);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => runSimulationWith(projectionLines, startDate, endDate), 300);
        return () => clearTimeout(timeout);
    }, [projectionLines, startDate, endDate, portCostMode]);

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
            const parts = route_key.split('-');
            const origin_port_id = parts[0];
            const destination_port_id = parts[1];

            const firstMatchIndex = prev.findIndex(p => 
                p.month_index === month_index && 
                p.vessel_id === vessel_id &&
                p.origin_port_id === origin_port_id &&
                p.destination_port_id === destination_port_id &&
                p.client_id === client_id
            );

            if (firstMatchIndex >= 0) {
                const updatedLine = { ...prev[firstMatchIndex], monthly_frequency: newFrequency };
                const filtered = prev.filter((p, idx) => {
                    if (idx === firstMatchIndex) return false;
                    const isDup = (
                        p.month_index === month_index && 
                        p.vessel_id === vessel_id &&
                        p.origin_port_id === origin_port_id &&
                        p.destination_port_id === destination_port_id &&
                        p.client_id === client_id
                    );
                    return !isDup;
                });
                return [updatedLine, ...filtered];
            } else if (newFrequency > 0) {
                // Si la celda estaba en 0 (no existía el viaje en este mes), buscamos otro mes como plantilla
                const templateLine = prev.find(p => 
                    p.vessel_id === vessel_id &&
                    p.origin_port_id === origin_port_id &&
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
            const parts = route_key.split('-');
            const origin_port_id = parts[0];
            const destination_port_id = parts[1];

            const firstMatchIndex = prev.findIndex(p => 
                p.month_index === month_index && 
                p.vessel_id === vessel_id &&
                p.origin_port_id === origin_port_id &&
                p.destination_port_id === destination_port_id &&
                p.client_id === client_id
            );

            if (firstMatchIndex >= 0) {
                const updatedLine = { ...prev[firstMatchIndex], custom_tariff: newTariff };
                const filtered = prev.filter((p, idx) => {
                    if (idx === firstMatchIndex) return false;
                    const isDup = (
                        p.month_index === month_index && 
                        p.vessel_id === vessel_id &&
                        p.origin_port_id === origin_port_id &&
                        p.destination_port_id === destination_port_id &&
                        p.client_id === client_id
                    );
                    return !isDup;
                });
                return [updatedLine, ...filtered];
            }
            return prev;
        });
    };

    const handleBunkerPriceChange = (client_id: string, route_key: string, vessel_id: string, month_index: string, fuelType: 'ifo' | 'mdo', newPrice: number) => {
        setProjectionLines(prev => {
            const parts = route_key.split('-');
            const origin_port_id = parts[0];
            const destination_port_id = parts[1];

            const firstMatchIndex = prev.findIndex(p => 
                p.month_index === month_index && 
                p.vessel_id === vessel_id &&
                p.origin_port_id === origin_port_id &&
                p.destination_port_id === destination_port_id &&
                p.client_id === client_id
            );

            if (firstMatchIndex >= 0) {
                const updatedLine = { 
                    ...prev[firstMatchIndex], 
                    ...(fuelType === 'ifo' ? { forecast_bunker_price_ifo: newPrice } : { forecast_bunker_price_mdo: newPrice })
                };
                const filtered = prev.filter((_, idx) => idx !== firstMatchIndex);
                return [updatedLine, ...filtered];
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
            
            // Enriquecer cada línea con las variables globales de demurrage para persistencia
            const enrichedLines = projectionLines.map(line => ({
                ...line,
                metadata_demurrage_pct: demurragePct,
                metadata_show_demurrage: showDemurrage,
                metadata_demurrage_days: demurrageDays,
                metadata_show_demurrage_days: showDemurrageDays,
                metadata_excluded_demurrages: excludedDemurrages,
                metadata_custom_demurrages: customDemurrages,
                metadata_custom_demurrage_days: customDemurrageDays
            }));

            const payload = {
                id: isNew ? null : currentForecastId,
                name: forecastName,
                user_id: userId,
                start_date: startDate,
                end_date: endDate,
                projection_lines: enrichedLines
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
            const loadedData = await ForecastService.loadForecast(id);

            const newStartDate = loadedData.start_date || startDate;
            const newEndDate = loadedData.end_date || endDate;
            setStartDate(newStartDate);
            setEndDate(newEndDate);
            
            const loadedLines = loadedData.projection_lines || [];
            if (loadedLines.length > 0) {
                const firstLine = loadedLines[0];
                if (firstLine.metadata_demurrage_pct !== undefined) {
                    setDemurragePct(firstLine.metadata_demurrage_pct);
                }
                if (firstLine.metadata_show_demurrage !== undefined) {
                    setShowDemurrage(firstLine.metadata_show_demurrage);
                }
                if (firstLine.metadata_demurrage_days !== undefined) {
                    setDemurrageDays(firstLine.metadata_demurrage_days);
                }
                if (firstLine.metadata_show_demurrage_days !== undefined) {
                    setShowDemurrageDays(firstLine.metadata_show_demurrage_days);
                }
                if (firstLine.metadata_excluded_demurrages !== undefined) {
                    setExcludedDemurrages(firstLine.metadata_excluded_demurrages);
                }
                if (firstLine.metadata_custom_demurrages !== undefined) {
                    setCustomDemurrages(firstLine.metadata_custom_demurrages);
                }
                if (firstLine.metadata_custom_demurrage_days !== undefined) {
                    setCustomDemurrageDays(firstLine.metadata_custom_demurrage_days);
                }
            }

            // Limpiar las líneas de metadatos y normalizar tipos numéricos
            const cleanedLines = loadedLines.map((line: any) => {
                const {
                    metadata_demurrage_pct,
                    metadata_show_demurrage,
                    metadata_demurrage_days,
                    metadata_show_demurrage_days,
                    metadata_excluded_demurrages,
                    metadata_custom_demurrages,
                    metadata_custom_demurrage_days,
                    ...rest
                } = line;
                // Normalizar campos numéricos que podrían venir como strings desde la BD
                return {
                    ...rest,
                    quantity: parseFloat(rest.quantity) || 0,
                    monthly_frequency: parseFloat(rest.monthly_frequency) || 1,
                    custom_tariff: rest.custom_tariff != null ? parseFloat(rest.custom_tariff) : undefined,
                    forecast_bunker_price_ifo: rest.forecast_bunker_price_ifo != null ? parseFloat(rest.forecast_bunker_price_ifo) : undefined,
                    forecast_bunker_price_mdo: rest.forecast_bunker_price_mdo != null ? parseFloat(rest.forecast_bunker_price_mdo) : undefined,
                };
            });

            // Deduplicar de inmediato al cargar para curar inconsistencias históricas
            const uniqueLinesMap = new Map<string, any>();
            cleanedLines.forEach((line: any) => {
                const key = `${line.client_id}-${line.origin_port_id}-${line.destination_port_id}-${line.vessel_id}-${line.month_index}`;
                if (!uniqueLinesMap.has(key)) {
                    uniqueLinesMap.set(key, line);
                }
            });
            const deduplicatedLines = Array.from(uniqueLinesMap.values());

            // Correr la simulación directamente con los datos cargados
            // (no solo depender del useEffect que puede tener cierre sobre estados viejos)
            setProjectionLines(deduplicatedLines);
            setCurrentForecastId(loadedData.id);
            setForecastName(loadedData.name);
            setLoadedAuthor(loadedData.user_id);
            setShowLoadModal(false);

            // Forzar la simulación de forma inmediata con los valores exactos del escenario
            await runSimulationWith(deduplicatedLines, newStartDate, newEndDate);

        } catch(e: any) {
            const msg = e?.response?.data?.detail || e?.message || "Error desconocido";
            alert(`Error al cargar el forecast: ${msg}`);
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
                        forecastName={(activeTab === 'multicotizador_excel') ? undefined : forecastName}
                        hideInputs={isRibbonCollapsed || activeTab === 'ledger' || activeTab === 'ledger_universal' || activeTab === 'chart' || activeTab === 'multicotizador_excel'}
                        displayMode={displayMode}
                        onDisplayModeChange={setDisplayMode}
                        isAdding={loading}
                        demurragePct={demurragePct}
                        showDemurrage={showDemurrage}
                        onDemurragePctChange={setDemurragePct}
                        onShowDemurrageChange={handleSetShowDemurrage}
                        demurrageDays={demurrageDays}
                        showDemurrageDays={showDemurrageDays}
                        onDemurrageDaysChange={setDemurrageDays}
                        onShowDemurrageDaysChange={handleSetShowDemurrageDays}
                        centerContent={
                            <div className="bg-slate-200 p-1 rounded-lg inline-flex items-center gap-1 shadow-inner">
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
                                    onClick={() => setActiveTab('map')}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-sm transition-all ${activeTab === 'map' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                                >
                                    <span className="text-lg">🗺️</span> Mapa Espaguetis
                                </button>
                                <button 
                                    onClick={() => setActiveTab('multicotizador_excel')}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-sm transition-all ${activeTab === 'multicotizador_excel' ? 'bg-green-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                                >
                                    <span className="text-lg">📊</span> Estimador Excel
                                </button>
                                <button 
                                    onClick={() => setActiveTab('ledger')}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-sm transition-all ${activeTab === 'ledger' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                                >
                                    <span className="text-lg">🧪</span> Auditoría Ledger
                                </button>
                                <button 
                                    onClick={() => setActiveTab('ledger_universal')}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-sm transition-all ${activeTab === 'ledger_universal' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                                >
                                    <span className="text-lg">🧪</span> Ledger Universal
                                </button>
                                <button 
                                    onClick={() => navigate('/clients')}
                                    className="flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-sm transition-all text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                                >
                                    <Database size={16} /> Data Maestros
                                </button>
                            </div>
                        }
                        rightContent={
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1 shadow-inner">
                                    <button
                                        onClick={() => setIsDarkMode(false)}
                                        className={`p-1.5 rounded-full transition-all ${!isDarkMode ? 'bg-white shadow text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}
                                        title="Light Mode"
                                    >
                                        <Sun size={14} />
                                    </button>
                                    <button
                                        onClick={() => setIsDarkMode(true)}
                                        className={`p-1.5 rounded-full transition-all ${isDarkMode ? 'bg-slate-800 shadow text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}
                                        title="Dark Mode"
                                    >
                                        <Moon size={14} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setIsRibbonCollapsed(!isRibbonCollapsed)}
                                        className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 rounded-full p-1"
                                        title={isRibbonCollapsed ? "Expandir Controles" : "Minimizar Controles"}
                                    >
                                        {isRibbonCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                                    </button>
                                    <img src="/Logo.Geeksoft.png" alt="Geeksoft" className="h-9 object-contain" />
                                </div>
                            </div>
                        }
                        portCostModeToggle={
                            <div className="flex items-center gap-1 bg-slate-300 rounded p-0.5 h-8 w-full shadow-inner">
                                <span className="text-[10px] uppercase font-bold text-slate-600 px-2">Pto:</span>
                                <button 
                                    onClick={() => setPortCostMode('static')}
                                    className={`flex-1 text-center py-1 text-[10px] font-bold rounded transition-colors uppercase ${portCostMode === 'static' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:bg-slate-300 hover:text-slate-700'}`}
                                >
                                    Static
                                </button>
                                <button 
                                    onClick={() => setPortCostMode('matrix')}
                                    className={`flex-1 text-center py-1 text-[10px] font-bold rounded transition-colors uppercase ${portCostMode === 'matrix' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:bg-slate-300 hover:text-slate-700'}`}
                                >
                                    Matrix
                                </button>
                            </div>
                        }
                        manualRecalculateBtn={
                            <button 
                                onClick={handleManualRecalculate}
                                className="flex items-center justify-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 h-8 px-4 rounded font-medium text-[11px] transition-colors shadow-sm cursor-pointer"
                                title="Forzar recálculo manual"
                            >
                                Recalcular
                            </button>
                        }
                        bottomRightContent={
                            activeTab !== 'ledger' && activeTab !== 'ledger_universal' && activeTab !== 'multicotizador_excel' && (
                                <>
                                    <div className="flex gap-2 w-full justify-end h-full">
                                        <button onClick={() => setShowSaveModal(true)} className="flex items-center justify-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-4 rounded font-medium text-[11px] transition-colors shadow-sm cursor-pointer">
                                            <Save size={14} /> Guardar
                                        </button>
                                        <button 
                                            onClick={handleLoadClick} 
                                            disabled={actionLoading === 'loadList'}
                                            className={`relative overflow-hidden flex items-center justify-center gap-1 h-8 px-4 rounded font-medium text-[11px] transition-colors shadow-sm cursor-pointer ${actionLoading === 'loadList' ? 'bg-slate-200 pointer-events-none' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'}`}
                                        >
                                            {actionLoading === 'loadList' && <div className="absolute inset-0 bg-slate-300/50 animate-pulse" style={{ width: '100%' }}></div>}
                                            <span className="relative flex items-center justify-center z-10 w-full gap-1">
                                                {actionLoading === 'loadList' ? (
                                                    <>
                                                        <div className="animate-spin h-2.5 w-2.5 border-2 border-slate-500 border-t-transparent rounded-full"></div>
                                                        <span>Abrir...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FolderOpen size={14} /> Cargar
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
                        <ForecastGrid data={data} months={dynamicMonths} projectionLines={projectionLines} onFrequencyChange={handleFrequencyChange} onTariffChange={handleTariffChange} onBunkerPriceChange={handleBunkerPriceChange} onDeleteNode={handleDeleteNode} displayMode={displayMode} demurragePct={demurragePct} showDemurrage={showDemurrage} excludedDemurrages={excludedDemurrages} customDemurrages={customDemurrages} onExcludeDemurrage={setExcludedDemurrages} onCustomDemurrageChange={setCustomDemurrages} demurrageDays={demurrageDays} showDemurrageDays={showDemurrageDays} customDemurrageDays={customDemurrageDays} onCustomDemurrageDaysChange={setCustomDemurrageDays} spotRoutes={spotRoutes} />
                    </section>
                )}
                
                {/* 3. ECharts Summary */}
                {activeTab === 'chart' && (
                    <section className="flex flex-col flex-1 gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <InteractiveChart 
                            data={data} 
                            months={dynamicMonths}
                            demurragePct={demurragePct}
                            showDemurrage={showDemurrage}
                            excludedDemurrages={excludedDemurrages}
                            customDemurrages={customDemurrages}
                        />
                    </section>
                )}

                {/* 4. Voyage Ledger Test */}
                {activeTab === 'ledger' && (
                    <section className="flex flex-col gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <VoyageLedgerTest portCostMode={portCostMode} />
                    </section>
                )}

                {/* 4.5. Voyage Ledger Universal */}
                {activeTab === 'ledger_universal' && (
                    <section className="flex flex-col gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <VoyageLedgerUniversal portCostMode={portCostMode} />
                    </section>
                )}


                {/* 5.6. Multicotizador Excel */}
                {activeTab === 'multicotizador_excel' && (
                    <section className="flex-1 flex flex-col gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-0">
                        <MultiCotizadorExcel portCostMode={portCostMode} />
                    </section>
                )}

                {/* 6. Mapa Espaguetis */}
                {activeTab === 'map' && (
                    <section className="flex-1 flex flex-col gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <SpaghettiMap 
                            data={data} 
                            months={dynamicMonths}
                            selectedMonths={dynamicMonths.length > 0 ? [dynamicMonths[0]] : []}
                            ports={ports} 
                            isDarkMode={isDarkMode} 
                        />
                    </section>
                )}
            </main>

            {/* Save Modal */}
            {showSaveModal && activeTab !== 'multicotizador_excel' && (
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
            {showLoadModal && activeTab !== 'multicotizador_excel' && (
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
