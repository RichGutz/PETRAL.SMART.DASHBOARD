import React from 'react';
import { MultiCotizadorExcel } from '../../components/CommercialForecast/MultiCotizadorExcel';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';

export const MultiCotizador_V2: React.FC = () => {
    const context = useForecastContext_V2();

    return (
        <section className="flex-1 flex flex-col -mt-4 md:-mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full h-full min-h-[600px] -mx-4 md:-mx-6 -mb-4 md:-mb-6 overflow-hidden bg-white border border-slate-200 rounded-tl-xl shadow-lg" style={{ width: 'calc(100% + 2rem)' }}>
            <MultiCotizadorExcel portCostMode={context.portCostMode} />
        </section>
    );
};
