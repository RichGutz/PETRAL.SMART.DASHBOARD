import React from 'react';
import { Fuel, TrendingDown, TrendingUp, Calendar, Anchor, ShieldCheck } from 'lucide-react';
import type { BunkeringEventRecord } from '../../../services/bunkerBootstrappingService';

interface BunkerKpisProps {
    latestEvent?: BunkeringEventRecord;
    activeVessel: string;
}

export const BunkerKpis: React.FC<BunkerKpisProps> = ({ latestEvent, activeVessel }) => {
    const ifoPrice = latestEvent ? Number(latestEvent.weighted_avg_ifo_usd) : 911.90;
    const mdoPrice = latestEvent ? Number(latestEvent.weighted_avg_mdo_usd) : 1571.65;
    const bafFactor = latestEvent?.spcc_baf_factor ? Number(latestEvent.spcc_baf_factor) : 0.9669;
    const bafVariation = latestEvent?.spcc_baf_variation !== undefined ? Number(latestEvent.spcc_baf_variation) : -0.1380;
    const lastDate = latestEvent?.event_date || '06/10/2026';
    const lastPort = latestEvent?.port_id || 'CALLAO';
    const isBootstrap = latestEvent?.is_bootstrap || false;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
            {/* KPI 1: IFO 380 VLSFO */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Fuel size={14} className="text-amber-400" />
                        Ponderado IFO 380 (VLSFO)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20">
                        USD / TM
                    </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white font-mono tracking-tight">
                        ${ifoPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                        base: $950
                    </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Stock Total: {latestEvent ? (Number(latestEvent.rob_ifo_mt) + Number(latestEvent.purchased_ifo_mt)).toFixed(2) : '470.40'} TM</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                        <TrendingDown size={12} />
                        -4.01%
                    </span>
                </div>
            </div>

            {/* KPI 2: MDO (MGO Homologado) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Fuel size={14} className="text-cyan-400" />
                        Ponderado MDO (Diesel Marino)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                        MGO Homologado
                    </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white font-mono tracking-tight">
                        ${mdoPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                        base: $1,550
                    </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Stock Total: {latestEvent ? (Number(latestEvent.rob_mdo_mt) + Number(latestEvent.purchased_mdo_mt)).toFixed(2) : '140.30'} TM</span>
                    <span className="text-rose-400 flex items-center gap-1">
                        <TrendingUp size={12} />
                        +1.40%
                    </span>
                </div>
            </div>

            {/* KPI 3: BAF Contractual SPCC */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-purple-400" />
                        Factor BAF Contrato SPCC
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        bafVariation <= 0 
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                    }`}>
                        {bafVariation <= 0 ? 'Crédito SPCC' : 'Sobrecargo'}
                    </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-purple-300 font-mono tracking-tight">
                        {bafFactor.toFixed(4)}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                        ({(bafFactor * 100).toFixed(2)}%)
                    </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Var. Flete:</span>
                    <span className={`font-bold ${bafVariation <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {bafVariation > 0 ? '+' : ''}{bafVariation.toFixed(4)} USD/pmt
                    </span>
                </div>
            </div>

            {/* KPI 4: Último Tanqueo / Vigencia */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Anchor size={14} className="text-emerald-400" />
                        Último Evento ({activeVessel})
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isBootstrap 
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' 
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                    }`}>
                        {isBootstrap ? 'Génesis / Bootstrap' : 'Tanqueo Completo'}
                    </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-white font-mono tracking-tight flex items-center gap-1.5">
                        <Calendar size={16} className="text-slate-400" />
                        {lastDate}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                        {lastPort}
                    </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Facturas Asociadas:</span>
                    <span className="text-slate-200 font-bold">
                        {latestEvent?.invoices ? latestEvent.invoices.length : 3} facturas
                    </span>
                </div>
            </div>
        </div>
    );
};
