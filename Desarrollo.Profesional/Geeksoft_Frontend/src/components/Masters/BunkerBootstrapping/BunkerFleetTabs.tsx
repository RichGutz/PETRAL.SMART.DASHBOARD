import React from 'react';
import { Ship, Layers } from 'lucide-react';

interface BunkerFleetTabsProps {
    activeVessel: string;
    onSelectVessel: (vesselId: string) => void;
    vessels?: Array<{ vessel_id: string; vessel_name: string }>;
}

export const BunkerFleetTabs: React.FC<BunkerFleetTabsProps> = ({
    activeVessel,
    onSelectVessel,
    vessels = [
        { vessel_id: 'MOQUEGUA', vessel_name: 'BT MOQUEGUA' },
        { vessel_id: 'TABLONES', vessel_name: 'BT TABLONES' },
        { vessel_id: 'HUEMUL', vessel_name: 'BT HUEMUL' },
        { vessel_id: 'CONCON_TRADER', vessel_name: 'CONCON TRADER' },
        { vessel_id: 'BOW_CONDOR', vessel_name: 'BOW CONDOR' },
    ]
}) => {
    return (
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200 shadow-inner overflow-x-auto w-full">
            <button
                type="button"
                onClick={() => onSelectVessel('TODOS')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeVessel === 'TODOS'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
            >
                <Layers size={14} className={activeVessel === 'TODOS' ? 'text-amber-400' : 'text-slate-400'} />
                <span>FLOTA COMPLETA</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-300 mx-1 shrink-0" />

            {vessels.map((v) => {
                const isActive = activeVessel === v.vessel_id;
                return (
                    <button
                        key={v.vessel_id}
                        type="button"
                        onClick={() => onSelectVessel(v.vessel_id)}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            isActive
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                    >
                        <Ship size={14} className={isActive ? 'text-cyan-300' : 'text-slate-400'} />
                        <span>{v.vessel_name}</span>
                    </button>
                );
            })}
        </div>
    );
};
