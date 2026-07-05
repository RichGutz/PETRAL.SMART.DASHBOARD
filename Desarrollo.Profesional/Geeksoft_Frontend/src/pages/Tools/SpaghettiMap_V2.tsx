import React from 'react';
import { SpaghettiMap } from '../../components/CommercialForecast/SpaghettiMap';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';

export const SpaghettiMap_V2: React.FC = () => {
    const context = useForecastContext_V2();

    return (
        <section className="flex-1 flex flex-col gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SpaghettiMap 
                data={context.data} 
                months={context.dynamicMonths} 
                ports={context.ports} 
                isDarkMode={context.isDarkMode} 
            />
        </section>
    );
};
