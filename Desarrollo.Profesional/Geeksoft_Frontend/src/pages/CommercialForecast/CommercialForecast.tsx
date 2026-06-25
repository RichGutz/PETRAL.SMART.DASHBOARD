import React, { useEffect, useState, useMemo } from 'react';
import { ForecastGrid } from '../../components/CommercialForecast/ForecastGrid';
import { ForecastBuilder } from '../../components/CommercialForecast/ForecastBuilder';
import { InteractiveChart } from '../../components/CommercialForecast/InteractiveChart';
import { ForecastService } from '../../services/api';
import { Activity } from 'lucide-react';

export const CommercialForecast: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    
    // Global Horizon State
    const [startDate, setStartDate] = useState("2026-07-01");
    const [endDate, setEndDate] = useState("2026-12-31");
    
    // Builder Bricks
    const [projectionLines, setProjectionLines] = useState<any[]>([]);

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

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <header className="mb-6 flex items-center gap-3">
                <div className="p-2 bg-petral-blue rounded-lg text-white shadow-sm">
                    <Activity size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Commercial Forecast</h1>
                    <p className="text-sm text-slate-500 font-medium">Proformador Financiero Interactivo</p>
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
                />

                {/* 2. Custom Grid (1:1 with Mockup) */}
                <section className="flex flex-col gap-2 relative">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800">Matriz Financiera Viva</h2>
                        {loading && <span className="text-xs text-petral-teal font-medium flex items-center gap-2"><div className="animate-spin h-3 w-3 border-2 border-petral-teal border-t-transparent rounded-full"></div> Recalculando...</span>}
                    </div>
                    
                    <ForecastGrid data={data} months={dynamicMonths} projectionLines={projectionLines} onFrequencyChange={handleFrequencyChange} />
                </section>
                
                {/* 3. ECharts Summary */}
                <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-2">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Análisis de Tendencia (Cross-Filtering)</h2>
                        <p className="text-xs text-slate-400">Voyage Result Mensual (USD)</p>
                    </div>
                    <InteractiveChart data={data} />
                </section>
            </main>
        </div>
    );
};
