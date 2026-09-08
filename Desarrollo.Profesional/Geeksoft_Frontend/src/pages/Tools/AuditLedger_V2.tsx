import React, { useState } from 'react';
import { VoyageLedgerTest } from '../../components/CommercialForecast/VoyageLedgerTest';
import { UserAuditLedgerViewer } from '../../components/Audit/UserAuditLedgerViewer';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';
import { ShieldCheck, Ship } from 'lucide-react';

export const AuditLedger_V2: React.FC = () => {
    const context = useForecastContext_V2();
    const [activeAuditView, setActiveAuditView] = useState<'USER_TRAIL' | 'VOYAGE_LEDGER'>('USER_TRAIL');

    return (
        <section className="flex flex-col gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 flex-1">
            
            {/* Barra de Sub-Navegación de Auditoría */}
            <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveAuditView('USER_TRAIL')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeAuditView === 'USER_TRAIL'
                                ? 'bg-[#0b2545] text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <ShieldCheck size={15} className={activeAuditView === 'USER_TRAIL' ? 'text-blue-400' : 'text-slate-400'} />
                        <span>Trazabilidad de Usuarios (Quién hizo qué)</span>
                    </button>

                    <button
                        onClick={() => setActiveAuditView('VOYAGE_LEDGER')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeAuditView === 'VOYAGE_LEDGER'
                                ? 'bg-[#0b2545] text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <Ship size={15} className={activeAuditView === 'VOYAGE_LEDGER' ? 'text-blue-400' : 'text-slate-400'} />
                        <span>Auditoría de Liquidaciones de Viaje</span>
                    </button>
                </div>

                <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
                    DELFOS LEDGER ENGINE • V2.0
                </div>
            </div>

            {/* Contenido Dinámico */}
            {activeAuditView === 'USER_TRAIL' ? (
                <UserAuditLedgerViewer />
            ) : (
                <VoyageLedgerTest portCostMode={context.portCostMode} />
            )}
        </section>
    );
};
