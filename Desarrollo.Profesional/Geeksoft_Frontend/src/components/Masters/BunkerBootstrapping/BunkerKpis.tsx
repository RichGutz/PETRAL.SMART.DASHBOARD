import React from 'react';
import type { BunkeringEventRecord } from '../../../services/bunkerBootstrappingService';

interface BunkerKpisProps {
    events: BunkeringEventRecord[];
    latestEvent?: BunkeringEventRecord;
    activeVessel: string;
}

export const BunkerKpis: React.FC<BunkerKpisProps> = ({ events, latestEvent, activeVessel }) => {
    // Cálculo de volumen e importes consolidados
    const totalTankings = events.length;

    const totalIfoMt = events.reduce((acc, ev) => acc + (Number(ev.purchased_ifo_mt) || 0), 0);
    const totalMdoMt = events.reduce((acc, ev) => acc + (Number(ev.purchased_mdo_mt) || 0), 0);

    const totalIfoUsd = events.reduce((acc, ev) => acc + (Number(ev.purchased_ifo_total_usd) || 0), 0);
    const totalMdoUsd = events.reduce((acc, ev) => acc + (Number(ev.purchased_mdo_total_usd) || 0), 0);
    const totalUsd = totalIfoUsd + totalMdoUsd;

    const ifoCurrentAvg = latestEvent ? Number(latestEvent.weighted_avg_ifo_usd) : 911.90;
    const mdoCurrentAvg = latestEvent ? Number(latestEvent.weighted_avg_mdo_usd) : 1571.65;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {/* Card 1 (1 col): Conteo de Tanqueos Registrados */}
            <div className="glass-card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-center shadow-2xs">
                <small className="text-[11px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-wider">
                    Tanqueos Registrados ({activeVessel === 'TODOS' ? 'Flota' : activeVessel})
                </small>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-mono font-black text-[#0f172a] dark:text-[#f8fafc] tabular-nums">
                        {totalTankings}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                        operaciones auditadas
                    </span>
                </div>
            </div>

            {/* Card 2 (2 cols): Costo Total Gestionado & Ponderados Actuales */}
            <div className="glass-card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-center md:col-span-2 shadow-2xs">
                <div className="flex items-center justify-between">
                    <small className="text-[11px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-wider">
                        Costo Total Búnker & Precios Ponderados Vigentes (AUM)
                    </small>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                        SPCC Homologado
                    </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-1">
                    <span className="text-lg font-mono font-black text-[#0284c7] dark:text-[#38bdf8] tabular-nums">
                        USD {totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                        IFO Ponderado: <span className="text-amber-600 dark:text-amber-400 font-black">${ifoPriceFormat(ifoCurrentAvg)}/TM</span>
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                        MDO Ponderado: <span className="text-cyan-600 dark:text-cyan-400 font-black">${ifoPriceFormat(mdoCurrentAvg)}/TM</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

function ifoPriceFormat(val: number): string {
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
