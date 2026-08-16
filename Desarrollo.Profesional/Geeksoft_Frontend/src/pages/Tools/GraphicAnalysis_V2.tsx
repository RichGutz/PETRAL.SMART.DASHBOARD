import React from 'react';
import { InteractiveChart } from '../../components/CommercialForecast/InteractiveChart';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';

export const GraphicAnalysis_V2: React.FC = () => {
    const context = useForecastContext_V2();

    const hasData = context.data && context.data.aggregated_data && typeof context.data.aggregated_data === 'object' && Object.keys(context.data.aggregated_data).length > 0;


    return (
        <section className="flex flex-col flex-1 gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full min-h-[600px]">
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

