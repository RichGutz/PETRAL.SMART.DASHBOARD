import React, { useState } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { UserAuditLedgerViewer } from '../../components/Audit/UserAuditLedgerViewer';
import { VoyageLedgerTest } from '../../components/CommercialForecast/VoyageLedgerTest';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';
import { ShieldCheck, Ship, History, Activity } from 'lucide-react';

export const AuditMaster_V2: React.FC = () => {
    const context = useForecastContext_V2();
    const [activeAuditView, setActiveAuditView] = useState<'USER_TRAIL' | 'VOYAGE_LEDGER'>('USER_TRAIL');

    return (
        <MasterTemplate 
            title="BITÁCORA DE AUDITORÍA FORENSE & TRAZABILIDAD" 
            subtitle="Libro mayor de cambios transaccionales, trazabilidad de usuarios y auditoría de liquidaciones en DELFOS" 
            activeTab="audit-ledger"
        >
            <div className="flex-1 flex flex-col gap-4 max-w-full w-full">
                {/* Selector de Vistas de Auditoría */}
                <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveAuditView('USER_TRAIL')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                activeAuditView === 'USER_TRAIL'
                                    ? 'bg-[#0B2545] text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <ShieldCheck size={15} className={activeAuditView === 'USER_TRAIL' ? 'text-teal-400' : 'text-slate-400'} />
                            <span>Trazabilidad de Usuarios (Quién hizo qué)</span>
                        </button>

                        <button
                            onClick={() => setActiveAuditView('VOYAGE_LEDGER')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                activeAuditView === 'VOYAGE_LEDGER'
                                    ? 'bg-[#0B2545] text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <Ship size={15} className={activeAuditView === 'VOYAGE_LEDGER' ? 'text-blue-400' : 'text-slate-400'} />
                            <span>Auditoría de Liquidaciones de Viaje</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                        <Activity size={13} className="text-teal-600 animate-pulse" />
                        <span>DELFOS FORENSIC ENGINE • V2.0</span>
                    </div>
                </div>

                {/* Contenido Dinámico */}
                <div className="flex-1 w-full min-w-0">
                    {activeAuditView === 'USER_TRAIL' ? (
                        <UserAuditLedgerViewer />
                    ) : (
                        <VoyageLedgerTest portCostMode={context.portCostMode} />
                    )}
                </div>
            </div>
        </MasterTemplate>
    );
};
