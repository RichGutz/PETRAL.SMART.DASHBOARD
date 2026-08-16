import React from 'react';
import { InteractiveChart } from '../../components/CommercialForecast/InteractiveChart';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';

export const GraphicAnalysis_V2: React.FC = () => {
    const context = useForecastContext_V2();

    React.useEffect(() => {
        if (!context.loading && (!context.data || !context.data.aggregated_data) && context.projectionLines.length > 0) {
            context.runSimulationWith(context.projectionLines, context.startDate, context.endDate);
        }
    }, [context.data, context.projectionLines, context.loading]);

    if (context.loading || (!context.data || !context.data.aggregated_data)) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[600px] w-full bg-white rounded-xl border border-slate-200 shadow-sm mt-2">
                <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                <p className="text-slate-700 font-bold text-base">Cargando Análisis Gráfico...</p>
                <p className="text-slate-400 text-xs mt-1">Calculando simulación de {context.forecastName || 'Escenario'}</p>
            </div>
        );
    }


    return (
        <section className="flex flex-col flex-1 gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {context.forecastName && (
                <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 z-[9999] bg-sky-50 border border-sky-200 py-1 px-3 rounded-md shadow-md pointer-events-none select-none">
                    <span className="text-[11px] font-bold text-sky-900 flex items-center gap-1.5 leading-none">
                        <span>📁</span> Escenario Activo: {context.forecastName}
                    </span>
                </div>
            )}
            <InteractiveChart 
                data={context.data} 
                months={context.dynamicMonths || []}
                demurragePct={context.demurragePct || ''}
                showDemurrage={context.showDemurrage || false}
                excludedDemurrages={context.excludedDemurrages || []}
                customDemurrages={context.customDemurrages || {}}
            />
        </section>
    );
};
