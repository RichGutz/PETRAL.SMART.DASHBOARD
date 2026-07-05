import React from 'react';
import { VoyageLedgerUniversal } from '../../components/CommercialForecast/VoyageLedgerUniversal';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';

export const AuditEngine_V2: React.FC = () => {
    const context = useForecastContext_V2();

    return (
        <section className="flex flex-col gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 flex-1">
            <VoyageLedgerUniversal portCostMode={context.portCostMode} />
        </section>
    );
};
