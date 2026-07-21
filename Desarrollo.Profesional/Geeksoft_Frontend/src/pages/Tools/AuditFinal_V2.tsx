import React from 'react';
import { VoyageLedgerFinal } from '../../components/CommercialForecast/VoyageLedgerFinal';

export const AuditFinal_V2: React.FC = () => {
    return (
        <section className="flex flex-col gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 flex-1">
            <VoyageLedgerFinal />
        </section>
    );
};
