import React from 'react';
import { DollarSign, Clock, Anchor, Fuel, TrendingUp } from 'lucide-react';
import type { VoyageLiquidationCalculatedSummary } from '../../types/voyageLiquidator';

interface VoyageLiquidatorSummaryBarProps {
    summary: VoyageLiquidationCalculatedSummary;
    hireDailyRate: number;
    onHireDailyRateChange: (rate: number) => void;
}

export const VoyageLiquidatorSummaryBar: React.FC<VoyageLiquidatorSummaryBarProps> = ({
    summary,
    hireDailyRate,
    onHireDailyRateChange
}) => {
    const isProfitPositive = summary.net_profit_usd >= 0;

    return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800 flex flex-col gap-3 font-mono">
            {/* Fila 1: Resumen de Tiempos y Consumos */}
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                    <Clock size={15} className="text-sky-400" />
                    <span className="text-slate-400 font-sans">Duración Real Total:</span>
                    <strong className="text-white text-sm">
                        {summary.total_voyage_days.toFixed(2)} d
                    </strong>
                    <span className="text-slate-500 text-[11px]">
                        ({summary.total_sailing_days.toFixed(2)}d Mar + {summary.total_port_days.toFixed(2)}d Puerto)
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Fuel size={15} className="text-amber-400" />
                    <span className="text-slate-400 font-sans">Consumo Búnker:</span>
                    <span className="text-amber-300 font-bold">
                        {summary.total_ifo_consumed_mt.toFixed(1)}t IFO
                    </span>
                    {summary.total_mdo_consumed_mt > 0 && (
                        <>
                            <span className="text-slate-600">+</span>
                            <span className="text-cyan-300 font-bold">
                                {summary.total_mdo_consumed_mt.toFixed(1)}t MDO
                            </span>
                        </>
                    )}
                    <span className="text-slate-500">=</span>
                    <span className="text-white font-bold">
                        ${summary.total_bunker_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Anchor size={15} className="text-indigo-400" />
                    <span className="text-slate-400 font-sans">Gastos Puerto + Otros:</span>
                    <span className="text-slate-200">
                        ${(summary.total_port_expenses_usd + summary.total_other_expenses_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </span>
                    {summary.total_other_expenses_usd > 0 && (
                        <span className="text-amber-400 text-[10px] bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                            (Inc. ${summary.total_other_expenses_usd.toFixed(2)} Otros)
                        </span>
                    )}
                </div>
            </div>

            {/* Fila 2: Métricas Financieras Principales (P&L, TCE, Margen) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-6 flex-wrap">
                    {/* Facturación Bruta */}
                    <div>
                        <div className="text-[10px] font-sans uppercase tracking-wider text-slate-400">Facturación Flete (Gross)</div>
                        <div className="text-base font-bold text-white">
                            ${summary.gross_freight_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    {/* Costos Directos */}
                    <div>
                        <div className="text-[10px] font-sans uppercase tracking-wider text-slate-400">Costos Directos Viaje</div>
                        <div className="text-base font-bold text-rose-400">
                            -${summary.total_direct_costs_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    {/* Net Voyage Revenue (NVR) */}
                    <div>
                        <div className="text-[10px] font-sans uppercase tracking-wider text-slate-400">Net Voyage Revenue (NVR)</div>
                        <div className="text-base font-bold text-sky-300">
                            ${summary.net_voyage_revenue_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    {/* Hire / Opex Diario */}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-sans uppercase tracking-wider text-slate-400">Opex/Hire ($/día):</span>
                        <input
                            type="number"
                            value={hireDailyRate}
                            onChange={(e) => onHireDailyRateChange(Number(e.target.value) || 0)}
                            className="w-24 px-2 py-0.5 text-xs font-mono font-bold bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* TCE y Resultado Neto P&L */}
                <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
                    <div>
                        <div className="text-[10px] font-sans uppercase tracking-wider text-slate-400">TCE Real Obtenido</div>
                        <div className="text-lg font-black text-amber-300">
                            ${summary.tce_actual_usd_day.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            <span className="text-xs font-normal text-slate-400"> /día</span>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-800" />

                    <div>
                        <div className="text-[10px] font-sans uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <TrendingUp size={11} className={isProfitPositive ? 'text-emerald-400' : 'text-rose-400'} />
                            <span>Utilidad Neta Real (P/L)</span>
                        </div>
                        <div className={`text-lg font-black ${isProfitPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfitPositive ? '+' : ''}${summary.net_profit_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs font-medium ml-1 opacity-80">
                                ({summary.operating_margin_pct.toFixed(1)}%)
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
