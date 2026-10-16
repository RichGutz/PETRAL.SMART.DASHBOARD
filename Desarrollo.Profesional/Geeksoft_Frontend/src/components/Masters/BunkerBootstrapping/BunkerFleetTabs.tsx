import React from 'react';

interface BunkerFleetTabsProps {
    activeVessel: string;
    onSelectVessel: (vesselId: string) => void;
    vessels?: Array<{ vessel_id: string; vessel_name: string; short_label?: string }>;
}

export const BunkerFleetTabs: React.FC<BunkerFleetTabsProps> = ({
    activeVessel,
    onSelectVessel,
    vessels = [
        { vessel_id: 'MOQUEGUA', vessel_name: 'BT MOQUEGUA', short_label: 'MOQUEGUA' },
        { vessel_id: 'TABLONES', vessel_name: 'BT TABLONES', short_label: 'TABLONES' },
        { vessel_id: 'HUEMUL', vessel_name: 'BT HUEMUL', short_label: 'HUEMUL' },
        { vessel_id: 'CONCON_TRADER', vessel_name: 'CONCON TRADER', short_label: 'CONCON' },
        { vessel_id: 'BOW_CONDOR', vessel_name: 'BOW CONDOR', short_label: 'BOW CONDOR' },
    ]
}) => {
    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            <button
                type="button"
                onClick={() => onSelectVessel('TODOS')}
                className={`h-8 text-[11px] font-black uppercase px-3 rounded-lg cursor-pointer transition-all ${
                    activeVessel === 'TODOS'
                        ? 'bg-[#0284c7] text-white shadow-xs ring-1 ring-[#38bdf8]'
                        : 'bg-white hover:bg-[#f0f9ff] border border-[#e2e8f0] text-[#475569] hover:text-[#0284c7] hover:border-[#bae6fd] dark:bg-[#1e293b] dark:border-[#334155] dark:text-[#cbd5e1]'
                }`}
            >
                TODAS LAS NAVES
            </button>

            {vessels.map((v) => {
                const isSelected = activeVessel === v.vessel_id;
                return (
                    <button
                        key={v.vessel_id}
                        type="button"
                        onClick={() => onSelectVessel(v.vessel_id)}
                        className={`h-8 text-[11px] font-black uppercase px-3 rounded-lg cursor-pointer transition-all ${
                            isSelected
                                ? 'bg-[#0284c7] text-white shadow-xs ring-1 ring-[#38bdf8]'
                                : 'bg-white hover:bg-[#f0f9ff] border border-[#e2e8f0] text-[#475569] hover:text-[#0284c7] hover:border-[#bae6fd] dark:bg-[#1e293b] dark:border-[#334155] dark:text-[#cbd5e1]'
                        }`}
                    >
                        {v.short_label || v.vessel_name}
                    </button>
                );
            })}
        </div>
    );
};
