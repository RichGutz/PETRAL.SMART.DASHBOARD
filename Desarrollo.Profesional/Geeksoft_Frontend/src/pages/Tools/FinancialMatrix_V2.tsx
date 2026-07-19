import React from 'react';
import { ForecastGrid } from '../../components/CommercialForecast/ForecastGrid';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';

export const FinancialMatrix_V2: React.FC = () => {
    const context = useForecastContext_V2();

    return (
        <section className="flex flex-col gap-2 relative animate-in fade-in slide-in-from-bottom-2 duration-300 mt-2 min-h-0 flex-1">
            <ForecastGrid 
                data={context.data} 
                months={context.dynamicMonths} 
                projectionLines={context.projectionLines} 
                onFrequencyChange={context.handleFrequencyChange} 
                onTariffChange={context.handleTariffChange} 
                onDeleteNode={context.handleDeleteNode} 
                displayMode={context.displayMode} 
                demurragePct={context.demurragePct} 
                showDemurrage={context.showDemurrage} 
                excludedDemurrages={context.excludedDemurrages} 
                customDemurrages={context.customDemurrages} 
                onExcludeDemurrage={context.setExcludedDemurrages} 
                onCustomDemurrageChange={context.setCustomDemurrages} 
                demurrageDays={context.demurrageDays} 
                showDemurrageDays={context.showDemurrageDays} 
                customDemurrageDays={context.customDemurrageDays} 
                onCustomDemurrageDaysChange={context.setCustomDemurrageDays} 
                spotRoutes={context.spotRoutes}
            />
        </section>
    );
};
