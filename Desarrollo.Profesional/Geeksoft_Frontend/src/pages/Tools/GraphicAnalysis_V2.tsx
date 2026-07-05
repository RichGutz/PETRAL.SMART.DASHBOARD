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
        </section>
    );
};
