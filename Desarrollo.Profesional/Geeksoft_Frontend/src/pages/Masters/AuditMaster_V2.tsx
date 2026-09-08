import React from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { UserAuditLedgerViewer } from '../../components/Audit/UserAuditLedgerViewer';

export const AuditMaster_V2: React.FC = () => {
    return (
        <MasterTemplate 
            title="BITÁCORA DE AUDITORÍA FORENSE & TRAZABILIDAD" 
            subtitle="Libro mayor inmutable de cambios transaccionales y acciones de usuarios en DELFOS" 
            activeTab="audit-ledger"
        >
            <div className="flex-1 flex flex-col max-w-full w-full">
                <UserAuditLedgerViewer />
            </div>
        </MasterTemplate>
    );
};
