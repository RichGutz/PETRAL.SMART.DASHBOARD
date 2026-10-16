import React from 'react';
import { Fuel, ShieldCheck, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BunkerActiveSnapshot } from '../../types/voyageLiquidator';

interface VoyageLiquidatorBunkerBadgeProps {
    snapshot: BunkerActiveSnapshot;
    loading?: boolean;
}

export const VoyageLiquidatorBunkerBadge: React.FC<VoyageLiquidatorBunkerBadgeProps> = ({
    snapshot,
    loading = false
}) => {
    const navigate = useNavigate();

    return (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-[#0284c7] font-bold text-[11px]">
                    <Fuel size={13} />
                    <span>ENLACE A BUNKER BOOTSTRAPPING</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">{snapshot.vessel_id}:</span>
                    <span className="text-slate-500">[{snapshot.event_code}]</span>
                </div>

                <span className="text-slate-300 dark:text-slate-700">•</span>

                <div className="flex items-center gap-2 font-mono">
                    <span className="text-amber-800 dark:text-amber-400 font-medium">
                        P_pond IFO: <strong className="font-bold text-amber-950 dark:text-amber-200">${snapshot.price_ifo_usd.toFixed(2)}/TM</strong>
                    </span>

                    {snapshot.supports_mdo && (
                        <>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-cyan-800 dark:text-cyan-400 font-medium">
                                P_pond MDO: <strong className="font-bold text-cyan-950 dark:text-cyan-200">${snapshot.price_mdo_usd.toFixed(2)}/TM</strong>
                            </span>
                        </>
                    )}
                </div>

                <span className="text-slate-300 dark:text-slate-700">•</span>

                <div className="flex items-center gap-1 font-mono text-purple-900 dark:text-purple-300 font-medium bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800 text-[11px]">
                    <span>BAF: {snapshot.baf_factor.toFixed(4)}</span>
                    <span className={snapshot.baf_variation_usd <= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                        ({snapshot.baf_variation_usd > 0 ? '+' : ''}{snapshot.baf_variation_usd.toFixed(4)} $/pmt)
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {snapshot.is_live ? (
                    <span className="flex items-center gap-1 text-[11px] font-sans font-semibold text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck size={13} className="text-emerald-500" />
                        Base Activa Certificada
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-[11px] font-sans font-semibold text-amber-600 dark:text-amber-400" title="Usando precios contractuales de referencia">
                        <AlertCircle size={13} />
                        Base Contractual
                    </span>
                )}

                <button
                    type="button"
                    onClick={() => navigate('/bunker-bootstrapping')}
                    className="flex items-center gap-1 px-2 py-1 text-[10.5px] font-medium text-slate-600 hover:text-blue-600 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                    title="Ir a Bunker Bootstrapping para auditar o registrar tanqueos"
                >
                    <span>Auditar Búnker</span>
                    <ArrowUpRight size={11} />
                </button>
            </div>
        </div>
    );
};
