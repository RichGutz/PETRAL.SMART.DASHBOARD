import React, { createContext, useContext, useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { ForecastService } from '../services/api';

interface ForecastContextType {
    // State
    data: any;
    loading: boolean;
    actionLoading: 'none' | 'save' | 'loadList' | 'loadSelected';
    isRibbonCollapsed: boolean;
    setIsRibbonCollapsed: (v: boolean) => void;
    isDarkMode: boolean;
    setIsDarkMode: (v: boolean) => void;
    
    startDate: string;
    endDate: string;
    setStartDate: (v: string) => void;
    setEndDate: (v: string) => void;
    dynamicMonths: string[];

    projectionLines: any[];
    setProjectionLines: React.Dispatch<React.SetStateAction<any[]>>;
    
    currentForecastId: string | null;
    forecastName: string;
    setForecastName: (v: string) => void;
    userId: string;
    setUserId: (v: string) => void;
    loadedAuthor: string;
    
    showSaveModal: boolean;
    setShowSaveModal: (v: boolean) => void;
    showLoadModal: boolean;
    setShowLoadModal: (v: boolean) => void;
    savedForecasts: any[];

    isDirty: boolean;
    handleManualRecalculate: () => Promise<void>;

    displayMode: 'usd' | 'pct';
    setDisplayMode: (v: 'usd' | 'pct') => void;

    ports: any[];
    spotRoutes: any[];
    portCostMode: 'static' | 'matrix';
    setPortCostMode: (v: 'static' | 'matrix') => void;

    demurragePct: string;
    setDemurragePct: (v: string) => void;
    showDemurrage: boolean;
    setShowDemurrage: (v: boolean) => void;
    excludedDemurrages: string[];
    setExcludedDemurrages: React.Dispatch<React.SetStateAction<string[]>>;
    customDemurrages: Record<string, Record<number, string>>;
    setCustomDemurrages: React.Dispatch<React.SetStateAction<Record<string, Record<number, string>>>>;

    // Actions
    handleAddLine: (newLine: any) => void;
    handleFrequencyChange: (client_id: string, route_key: string, vessel_id: string, month_index: string, newFrequency: number) => void;
    handleTariffChange: (client_id: string, route_key: string, vessel_id: string, month_index: string, newTariff: number) => void;
    handleDeleteNode: (type: 'client' | 'route' | 'vessel', client_id: string, route_key?: string, vessel_id?: string) => void;
    handleSaveForecast: (isNew?: boolean) => Promise<void>;
    handleLoadClick: () => Promise<void>;
    handleLoadSelected: (id: string) => Promise<void>;
    runSimulationWith: (lines: any[], sDate: string, eDate: string) => Promise<void>;
}

const ForecastContext = createContext<ForecastContextType | undefined>(undefined);

export const ForecastProvider_V2 = ({ children }: { children: ReactNode }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<'none' | 'save' | 'loadList' | 'loadSelected'>('none');
    const [isRibbonCollapsed, setIsRibbonCollapsed] = useState(false);
    
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);
    
    const [isDirty, setIsDirty] = useState(false);
    
    const [startDate, setStartDate] = useState("2026-07-01");
    const [endDate, setEndDate] = useState("2026-12-31");
    const [projectionLines, setProjectionLines] = useState<any[]>([]);

    const [currentForecastId, setCurrentForecastId] = useState<string | null>(null);
    const [forecastName, setForecastName] = useState<string>("");
    const [userId, setUserId] = useState<string>("Demo User");
    const [loadedAuthor, setLoadedAuthor] = useState<string>("");

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [savedForecasts, setSavedForecasts] = useState<any[]>([]);

    const [displayMode, setDisplayMode] = useState<'usd'|'pct'>('usd');
    const [ports, setPorts] = useState<any[]>([]);
    const [spotRoutes, setSpotRoutes] = useState<any[]>([]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [portsData, routesData] = await Promise.all([
                    ForecastService.getPorts(),
                    ForecastService.listSpots()
                ]);
                setPorts(portsData || []);
                setSpotRoutes(routesData || []);
            } catch (e) {
                console.error("Error loading initial context data:", e);
            }
        };
        loadInitialData();
    }, []);

    const [demurragePct, setDemurragePct] = useState<string>('');
    const [showDemurrage, setShowDemurrage] = useState<boolean>(false);
    const [excludedDemurrages, setExcludedDemurrages] = useState<string[]>([]);
    const [customDemurrages, setCustomDemurrages] = useState<Record<string, Record<number, string>>>({});
    const [portCostMode, setPortCostMode] = useState<'static' | 'matrix'>('static');

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

    // Ref para evitar simulaciones concurrentes (mutex simple)
    const simulatingRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const runSimulationWith = async (lines: any[], sDate: string, eDate: string) => {
        if (lines.length === 0) {
            setData(null);
            setIsDirty(false);
            return;
        }

        // Cancelar cualquier request anterior en vuelo
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;
        simulatingRef.current = true;

        setLoading(true);
        try {
            const requestPayload = {
                start_date: sDate,
                end_date: eDate,
                projection_lines: lines,
                port_cost_mode: portCostMode
            };
            const result = await ForecastService.runSimulation(requestPayload);
            // Solo actualizar si este request no fue cancelado
            if (!controller.signal.aborted) {
                setData(result);
                setIsDirty(false);
            }
        } catch (error: any) {
            if (controller.signal.aborted) return; // Ignorar errores de requests cancelados
            console.error("Error fetching simulation:", error);
            const msg = error?.response?.data?.detail || error?.message || "Error desconocido";
            alert(`Error al correr simulación: ${msg}`);
            setData(null);
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
            simulatingRef.current = false;
        }
    };

    const handleManualRecalculate = async () => {
        await runSimulationWith(projectionLines, startDate, endDate);
    };

    useEffect(() => {
        if (projectionLines.length > 0) {
            runSimulationWith(projectionLines, startDate, endDate);
        }
    }, [projectionLines.length, startDate, endDate, portCostMode]);

    const handleAddLine = (newLine: any) => {
        setIsDirty(true);
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
        setIsDirty(true);
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

    const handleTariffChange = (client_id: string, route_key: string, vessel_id: string, _month_index: string, newTariff: number) => {
        setIsDirty(true);
        setProjectionLines(prev => {
            const destination_port_id = route_key.split('-')[1];
            return prev.map(p => {
                if (p.client_id === client_id && p.vessel_id === vessel_id && p.destination_port_id === destination_port_id) {
                    return { ...p, custom_tariff: newTariff };
                }
                return p;
            });
        });
    };

    const handleDeleteNode = (type: 'client' | 'route' | 'vessel', client_id: string, route_key?: string, vessel_id?: string) => {
        setIsDirty(true);
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
            const enrichedLines = projectionLines.map(line => ({
                ...line,
                metadata_demurrage_pct: demurragePct,
                metadata_show_demurrage: showDemurrage,
                metadata_excluded_demurrages: excludedDemurrages,
                metadata_custom_demurrages: customDemurrages
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
            setLoadedAuthor(userId);
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
                if (firstLine.metadata_demurrage_pct !== undefined) setDemurragePct(firstLine.metadata_demurrage_pct);
                if (firstLine.metadata_show_demurrage !== undefined) setShowDemurrage(firstLine.metadata_show_demurrage);
                if (firstLine.metadata_excluded_demurrages !== undefined) setExcludedDemurrages(firstLine.metadata_excluded_demurrages);
                if (firstLine.metadata_custom_demurrages !== undefined) setCustomDemurrages(firstLine.metadata_custom_demurrages);
            }

            const cleanedLines = loadedLines.map((line: any) => {
                const { metadata_demurrage_pct, metadata_show_demurrage, metadata_excluded_demurrages, metadata_custom_demurrages, ...rest } = line;
                return {
                    ...rest,
                    quantity: parseFloat(rest.quantity) || 0,
                    monthly_frequency: parseFloat(rest.monthly_frequency) || 1,
                    custom_tariff: rest.custom_tariff != null ? parseFloat(rest.custom_tariff) : undefined,
                    forecast_bunker_price_ifo: rest.forecast_bunker_price_ifo != null ? parseFloat(rest.forecast_bunker_price_ifo) : undefined,
                    forecast_bunker_price_mdo: rest.forecast_bunker_price_mdo != null ? parseFloat(rest.forecast_bunker_price_mdo) : undefined,
                };
            });

            setProjectionLines(cleanedLines);
            setCurrentForecastId(loadedData.id);
            setForecastName(loadedData.name);
            setLoadedAuthor(loadedData.user_id);
            setShowLoadModal(false);

            await runSimulationWith(cleanedLines, newStartDate, newEndDate);

        } catch(e: any) {
            const msg = e?.response?.data?.detail || e?.message || "Error desconocido";
            alert(`Error al cargar el forecast: ${msg}`);
        } finally {
            setActionLoading('none');
        }
    };

    return (
        <ForecastContext.Provider value={{
            data, loading, actionLoading, isRibbonCollapsed, setIsRibbonCollapsed,
            isDarkMode, setIsDarkMode, startDate, endDate, setStartDate, setEndDate,
            dynamicMonths, projectionLines, setProjectionLines, currentForecastId,
            forecastName, setForecastName, userId, setUserId, loadedAuthor,
            showSaveModal, setShowSaveModal, showLoadModal, setShowLoadModal, savedForecasts,
            isDirty, handleManualRecalculate,
            displayMode, setDisplayMode, ports, spotRoutes, portCostMode, setPortCostMode,
            demurragePct, setDemurragePct, showDemurrage, setShowDemurrage,
            excludedDemurrages, setExcludedDemurrages, customDemurrages, setCustomDemurrages,
            handleAddLine, handleFrequencyChange, handleTariffChange, handleDeleteNode,
            handleSaveForecast, handleLoadClick, handleLoadSelected, runSimulationWith
        }}>
            {children}
        </ForecastContext.Provider>
    );
};

export const useForecastContext_V2 = () => {
    const context = useContext(ForecastContext);
    if (!context) {
        throw new Error("useForecastContext_V2 must be used within a ForecastProvider_V2");
    }
    return context;
};
