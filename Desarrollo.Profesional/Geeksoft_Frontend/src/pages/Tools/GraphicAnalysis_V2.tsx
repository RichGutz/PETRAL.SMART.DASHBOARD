import React from 'react';
import { InteractiveChart } from '../../components/CommercialForecast/InteractiveChart';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';

export const GraphicAnalysis_V2: React.FC = () => {
    const context = useForecastContext_V2();

    return (
        <section className="flex flex-col flex-1 gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <InteractiveChart 
                data={context.data} 
                months={context.dynamicMonths}
                demurragePct={context.demurragePct}
                showDemurrage={context.showDemurrage}
                excludedDemurrages={context.excludedDemurrages}
                customDemurrages={context.customDemurrages}
            />
            {context.forecastName && (
                <div className="absolute bottom-6 right-6 z-[9999] bg-sky-50/95 backdrop-blur border border-sky-300 py-2 px-5 rounded-lg shadow-xl shadow-slate-200/50 w-auto pointer-events-none">
                    <span className="text-sm font-bold text-sky-900 tracking-tight flex items-center gap-2 pointer-events-auto">
                        <span className="text-lg">📁</span> Escenario Activo: {context.forecastName}
                    </span>
                </div>
            )}
        </section>
    );
};
