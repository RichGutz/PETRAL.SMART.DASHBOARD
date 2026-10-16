import React from 'react';
import { Plus, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import type { VoyageLegExecution, BunkerActiveSnapshot } from '../../types/voyageLiquidator';
import { voyageLiquidatorService } from '../../services/voyageLiquidatorService';

interface VoyageLiquidatorGridProps {
    legs: VoyageLegExecution[];
    onUpdateLeg: (index: number, updated: Partial<VoyageLegExecution>) => void;
    onAddLeg: () => void;
    onRemoveLeg: (index: number) => void;
    bunker: BunkerActiveSnapshot;
}

const COMMON_PORTS = [
    'ILO', 'CALLAO', 'MATARANI', 'SAN JUAN DE MARCONA', 
    'MEJILLONES', 'MEJILLONES TPM', 'MEJILLONES TERQUIM', 
    'PISCO', 'CONCON', 'COQUIMBO', 'ANTOFAGASTA', 'PATILLOS'
];

export const VoyageLiquidatorGrid: React.FC<VoyageLiquidatorGridProps> = ({
    legs,
    onUpdateLeg,
    onAddLeg,
    onRemoveLeg,
    bunker
}) => {
    // Calcular carga acumulada a bordo para determinar LADEN vs BALLAST
    let runningCargo = 0;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse font-mono text-[11px] select-text">
                    <thead>
                        <tr className="bg-slate-100/80 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-sans font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <th className="py-2.5 px-2 text-center w-8">LEG</th>
                            <th className="py-2.5 px-2 text-center w-14">TIPO</th>
                            <th className="py-2.5 px-3 min-w-[130px]">PUERTO RECALADA</th>
                            <th className="py-2.5 px-2 min-w-[150px]">INICIO (ATA)</th>
                            <th className="py-2.5 px-2 min-w-[150px]">FIN (ATD)</th>
                            <th className="py-2.5 px-2 text-right w-16">D.MAR</th>
                            <th className="py-2.5 px-2 text-right w-16">D.PTO</th>
                            <th className="py-2.5 px-2 text-center min-w-[110px]">OPERACIÓN</th>
                            <th className="py-2.5 px-2 text-right min-w-[100px]">CARGA (TM)</th>
                            <th className="py-2.5 px-2 text-right min-w-[85px]">FLETE ($/T)</th>
                            <th className="py-2.5 px-2 text-right min-w-[100px]">INGRESO ($)</th>
                            <th className="py-2.5 px-2 text-right min-w-[70px]">IFO (TM)</th>
                            {bunker.supports_mdo && (
                                <th className="py-2.5 px-2 text-right min-w-[70px]">MDO (TM)</th>
                            )}
                            <th className="py-2.5 px-2 text-right min-w-[95px]">BÚNKER ($)</th>
                            <th className="py-2.5 px-2 text-right min-w-[90px]">PUERTO ($)</th>
                            <th className="py-2.5 px-2 text-right min-w-[90px]">OTROS ($)</th>
                            <th className="py-2.5 px-3 min-w-[150px]">GLOSA OTROS</th>
                            <th className="py-2.5 px-2 text-right min-w-[100px]">NVR ($)</th>
                            <th className="py-2.5 px-2 text-center w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {legs.map((leg, idx) => {
                            const prevLeg = idx > 0 ? legs[idx - 1] : null;

                            // Actualizar balance de carga a bordo
                            if (leg.operation === 'CARGAR') {
                                runningCargo += (Number(leg.cargo_quantity_mt) || 0);
                            } else if (leg.operation === 'DESCARGAR') {
                                runningCargo = Math.max(0, runningCargo - (Number(leg.cargo_quantity_mt) || 0));
                            }
                            const isLaden = idx === 0 ? false : (runningCargo > 0 || leg.operation === 'DESCARGAR');

                            // Días de Puerto: (ATD - ATA) / 24
                            const portHrs = voyageLiquidatorService.diffHours(leg.arrival_datetime, leg.departure_datetime);
                            const portDays = portHrs / 24;

                            // Días de Mar: (ATA actual - ATD anterior) / 24
                            const sailingHrs = (prevLeg && prevLeg.departure_datetime && leg.arrival_datetime)
                                ? voyageLiquidatorService.diffHours(prevLeg.departure_datetime, leg.arrival_datetime)
                                : 0;
                            const sailingDays = sailingHrs / 24;

                            // Ingreso
                            const freightIncome = leg.operation === 'DESCARGAR'
                                ? (Number(leg.cargo_quantity_mt) || 0) * (Number(leg.freight_rate_usd) || 0)
                                : 0;

                            // Búnker
                            const ifoCost = (Number(leg.ifo_consumed_mt) || 0) * bunker.price_ifo_usd;
                            const mdoCost = bunker.supports_mdo 
                                ? ((Number(leg.mdo_consumed_mt) || 0) * bunker.price_mdo_usd)
                                : 0;
                            const totalBunkerLeg = ifoCost + mdoCost;

                            // Otros y Puerto
                            const portCost = Number(leg.port_expenses_usd) || 0;
                            const otherCost = Number(leg.other_expenses_usd) || 0;

                            // NVR
                            const nvrLeg = freightIncome - totalBunkerLeg - portCost - otherCost;

                            const isBaseLeg = idx === 0;

                            return (
                                <tr 
                                    key={leg.id}
                                    className={`hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors ${
                                        isBaseLeg ? 'bg-slate-50/50 dark:bg-slate-950/40' : ''
                                    }`}
                                >
                                    {/* A: LEG */}
                                    <td className="py-2 px-2 text-center text-slate-400 font-bold">
                                        {isBaseLeg ? '—' : idx}
                                    </td>

                                    {/* B: TIPO */}
                                    <td className="py-2 px-2 text-center">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-sans font-bold uppercase tracking-wider ${
                                            isBaseLeg
                                                ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                                : isLaden
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                                        }`}>
                                            {isBaseLeg ? 'BASE' : (isLaden ? 'LADEN' : 'BALLAST')}
                                        </span>
                                    </td>

                                    {/* C: PUERTO */}
                                    <td className="py-2 px-3">
                                        <div className="flex items-center gap-1">
                                            <input
                                                list={`ports-list-${idx}`}
                                                type="text"
                                                value={leg.port_id}
                                                onChange={(e) => onUpdateLeg(idx, { port_id: e.target.value.toUpperCase() })}
                                                placeholder="PUERTO"
                                                className="w-full px-2 py-1 text-xs font-bold font-sans text-slate-800 dark:text-white bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:bg-white focus:border-blue-500 uppercase"
                                            />
                                            <datalist id={`ports-list-${idx}`}>
                                                {COMMON_PORTS.map((p) => (
                                                    <option key={p} value={p} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </td>

                                    {/* D: INICIO (ATA) */}
                                    <td className="py-2 px-2">
                                        <input
                                            type="datetime-local"
                                            value={leg.arrival_datetime}
                                            onChange={(e) => onUpdateLeg(idx, { arrival_datetime: e.target.value })}
                                            className="w-full px-1.5 py-1 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:bg-white focus:border-blue-500 text-slate-700 dark:text-slate-300"
                                        />
                                    </td>

                                    {/* E: FIN (ATD) */}
                                    <td className="py-2 px-2">
                                        <input
                                            type="datetime-local"
                                            value={leg.departure_datetime}
                                            onChange={(e) => onUpdateLeg(idx, { departure_datetime: e.target.value })}
                                            className="w-full px-1.5 py-1 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:bg-white focus:border-blue-500 text-slate-700 dark:text-slate-300"
                                        />
                                    </td>

                                    {/* F: DÍAS MAR */}
                                    <td className="py-2 px-2 text-right text-slate-600 dark:text-slate-400">
                                        {isBaseLeg ? '—' : `${sailingDays.toFixed(2)}d`}
                                    </td>

                                    {/* G: DÍAS PTO */}
                                    <td className="py-2 px-2 text-right text-slate-600 dark:text-slate-400 font-semibold">
                                        {portDays > 0 ? `${portDays.toFixed(2)}d` : '0.00d'}
                                    </td>

                                    {/* H: OP. DEST */}
                                    <td className="py-2 px-2 text-center">
                                        <select
                                            value={leg.operation}
                                            onChange={(e) => onUpdateLeg(idx, { operation: e.target.value as any })}
                                            className="w-full px-1.5 py-1 text-[10.5px] font-sans font-bold bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:bg-white focus:border-blue-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                                        >
                                            <option value="CARGAR">CARGAR</option>
                                            <option value="DESCARGAR">DESCARGAR</option>
                                            <option value="BUNKERING">BUNKERING</option>
                                            <option value="SHIFTING">SHIFTING</option>
                                            <option value="NONE">NONE</option>
                                        </select>
                                    </td>

                                    {/* I: Q REAL (TM) */}
                                    <td className="py-2 px-2 text-right">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={leg.cargo_quantity_mt || ''}
                                            onChange={(e) => onUpdateLeg(idx, { cargo_quantity_mt: Number(e.target.value) || 0 })}
                                            placeholder="0.00"
                                            className="w-full px-1.5 py-1 text-right bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:bg-white focus:border-blue-500 font-bold text-slate-900 dark:text-white"
                                        />
                                    </td>

                                    {/* J: FLETE REAL ($/TM) */}
                                    <td className="py-2 px-2 text-right">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={leg.freight_rate_usd || ''}
                                            onChange={(e) => onUpdateLeg(idx, { freight_rate_usd: Number(e.target.value) || 0 })}
                                            placeholder="0.00"
                                            disabled={leg.operation !== 'DESCARGAR'}
                                            className="w-full px-1.5 py-1 text-right bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:bg-white focus:border-blue-500 text-slate-800 dark:text-slate-200 disabled:opacity-30"
                                        />
                                    </td>

                                    {/* K: INGRESO FLETE ($) */}
                                    <td className="py-2 px-2 text-right font-bold text-slate-900 dark:text-white">
                                        {freightIncome > 0 
                                            ? `$${freightIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                                            : '—'}
                                    </td>

                                    {/* L: IFO (TM) */}
                                    <td className="py-2 px-2 text-right">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={leg.ifo_consumed_mt || ''}
                                            onChange={(e) => onUpdateLeg(idx, { ifo_consumed_mt: Number(e.target.value) || 0 })}
                                            placeholder="0.0"
                                            className="w-full px-1.5 py-1 text-right bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:bg-white focus:border-blue-500 text-amber-800 dark:text-amber-300 font-bold"
                                        />
                                    </td>

                                    {/* M: MDO (TM) */}
                                    {bunker.supports_mdo && (
                                        <td className="py-2 px-2 text-right">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={leg.mdo_consumed_mt || ''}
                                                onChange={(e) => onUpdateLeg(idx, { mdo_consumed_mt: Number(e.target.value) || 0 })}
                                                placeholder="0.0"
                                                className="w-full px-1.5 py-1 text-right bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:bg-white focus:border-blue-500 text-cyan-800 dark:text-cyan-300 font-bold"
                                            />
                                        </td>
                                    )}

                                    {/* P: BÚNKER ($) */}
                                    <td className="py-2 px-2 text-right text-slate-800 dark:text-slate-200 font-semibold" title={`IFO: $${ifoCost.toFixed(2)} | MDO: $${mdoCost.toFixed(2)}`}>
                                        {totalBunkerLeg > 0
                                            ? `$${totalBunkerLeg.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                                            : '$0'}
                                    </td>

                                    {/* Q: PUERTO ($) */}
                                    <td className="py-2 px-2 text-right">
                                        <input
                                            type="number"
                                            step="1"
                                            value={leg.port_expenses_usd || ''}
                                            onChange={(e) => onUpdateLeg(idx, { port_expenses_usd: Number(e.target.value) || 0 })}
                                            placeholder="0"
                                            className="w-full px-1.5 py-1 text-right bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:bg-white focus:border-blue-500 text-slate-800 dark:text-slate-200"
                                        />
                                    </td>

                                    {/* R: OTROS ($) */}
                                    <td className="py-2 px-2 text-right">
                                        <input
                                            type="number"
                                            step="1"
                                            value={leg.other_expenses_usd || ''}
                                            onChange={(e) => onUpdateLeg(idx, { other_expenses_usd: Number(e.target.value) || 0 })}
                                            placeholder="0"
                                            className="w-full px-1.5 py-1 text-right bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:bg-white focus:border-blue-500 text-rose-700 dark:text-rose-400 font-medium"
                                        />
                                    </td>

                                    {/* S: GLOSA OTROS */}
                                    <td className="py-2 px-3">
                                        <input
                                            type="text"
                                            value={leg.other_expenses_desc || ''}
                                            onChange={(e) => onUpdateLeg(idx, { other_expenses_desc: e.target.value })}
                                            placeholder={leg.other_expenses_usd > 0 ? "Detalle del gasto..." : "—"}
                                            className="w-full px-2 py-1 text-xs font-sans text-slate-700 dark:text-slate-300 bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:bg-white focus:border-blue-500"
                                        />
                                    </td>

                                    {/* T: NVR TRAMO ($) */}
                                    <td className={`py-2 px-2 text-right font-bold ${
                                        nvrLeg >= 0 ? 'text-sky-700 dark:text-sky-300' : 'text-rose-600 dark:text-rose-400'
                                    }`}>
                                        ${nvrLeg.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </td>

                                    {/* ACCIONES */}
                                    <td className="py-2 px-2 text-center">
                                        {!isBaseLeg && legs.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => onRemoveLeg(idx)}
                                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                                title="Eliminar tramo"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer de la Grilla con botón de agregar escala */}
            <div className="p-3 bg-slate-50/70 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                    type="button"
                    onClick={onAddLeg}
                    className="px-3 py-1.5 rounded-lg border border-dashed border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                    <Plus size={14} />
                    <span>+ Agregar Escala / Recalada</span>
                </button>

                <div className="text-[11px] text-slate-500 font-sans">
                    Precios de Búnker aplicados: IFO ${bunker.price_ifo_usd.toFixed(2)}/TM {bunker.supports_mdo ? `• MDO $${bunker.price_mdo_usd.toFixed(2)}/TM` : ''}
                </div>
            </div>
        </div>
    );
};
