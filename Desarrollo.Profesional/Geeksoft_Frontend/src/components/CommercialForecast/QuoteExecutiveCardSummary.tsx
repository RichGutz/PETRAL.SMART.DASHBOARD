import React from 'react';
import { MulticotizadorRetrieverService } from '../../services/providers/multicotizadorRetrieverService';
import { MulticotizadorCalculationEngine } from '../../services/providers/multicotizadorCalculationEngine';
import { ExternalLink } from 'lucide-react';

interface QuoteExecutiveCardSummaryProps {
    route: any;
    onOpenInMulticotizador?: (route: any) => void;
}

export const QuoteExecutiveCardSummary: React.FC<QuoteExecutiveCardSummaryProps> = ({
    route,
    onOpenInMulticotizador
}) => {
    const unpacked = MulticotizadorRetrieverService.unpackQuoteData(route);
    const trms = unpacked.tramos || [];
    const portsCfg = unpacked.puertosConfig || [];
    
    // 1. Usar fotografía financiera (financial_summary) si ya fue guardada en el JSONB, o calcular con motor puro
    const calc = React.useMemo(() => {
        const fs = unpacked.financial_summary;
        const hasValidFinancialSummary = fs && typeof fs === 'object' && Object.keys(fs).length > 0 && (Number(fs.grossRevenueTotal || 0) > 0 || Number(fs.totalDist || 0) > 0 || Number(fs.totalFreight || 0) > 0);

        if (hasValidFinancialSummary) {
            return {
                totalDist: Number(fs.totalDist || 0),
                totalSeaDays: Number(fs.totalSeaDays || 0),
                totalPortDays: Number(fs.totalPortDays || 0),
                totalDays: Number(fs.totalDays || 0),
                totalIfoTons: Number(fs.totalIfoTons || 0),
                totalMdoTons: Number(fs.totalMdoTons || 0),
                totalFuelTons: Number(fs.totalFuelTons || (Number(fs.totalIfoTons || 0) + Number(fs.totalMdoTons || 0))),
                ifoCost: Number(fs.ifoCost || 0),
                mdoCost: Number(fs.mdoCost || 0),
                grandBunkerTotal: Number(fs.grandBunkerTotal || 0),
                totalQuantity: Number(fs.totalQuantity || 0),
                totalFreight: Number(fs.totalFreight || 0),
                refacturacionMuellaje: Number(fs.refacturacionMuellaje || 0),
                grossRevenueTotal: Number(fs.grossRevenueTotal || 0),
                totalPortCosts: Number(fs.totalPortCosts || 0),
                tceReq: Number(fs.tceReq || 0),
                hireUsd: Number(fs.hireUsd || 0),
                addressCommUsd: Number(fs.addressCommUsd || 0),
                brokerCommUsd: Number(fs.brokerCommUsd || 0),
                totalCommUsd: Number(fs.totalCommUsd || 0),
                voyageResultPnl: Number(fs.voyageResultPnl || 0),
                tceRealizado: Number(fs.tceRealizado || 0),
                tceDiff: Number(fs.tceDiff || 0),
                calculatedTramos: fs.calculatedTramos || [],
                portCostItems: fs.portCostItems || []
            };
        }

        try {
            return MulticotizadorCalculationEngine.calculateVoyage({
                tramos: trms,
                puertosConfig: portsCfg,
                vesselParams: unpacked.vesselParams,
                bunkerPriceIfo: unpacked.bunker_price_ifo,
                bunkerPriceMdo: unpacked.bunker_price_mdo,
                addressCommPct: unpacked.addressCommPct,
                brokerCommPct: unpacked.brokerCommPct,
                refacturarMuellajeMap: unpacked.refacturarMuellajeMap
            });
        } catch (err) {
            console.error("Error al calcular resumen de cotización:", err);
            return {
                totalDist: 0,
                totalSeaDays: 0,
                totalPortDays: 0,
                totalDays: 0,
                totalIfoTons: 0,
                totalMdoTons: 0,
                totalFuelTons: 0,
                ifoCost: 0,
                mdoCost: 0,
                grandBunkerTotal: 0,
                totalQuantity: 0,
                totalFreight: 0,
                refacturacionMuellaje: 0,
                grossRevenueTotal: 0,
                totalPortCosts: 0,
                tceReq: 0,
                hireUsd: 0,
                addressCommUsd: 0,
                brokerCommUsd: 0,
                totalCommUsd: 0,
                voyageResultPnl: 0,
                tceRealizado: 0,
                tceDiff: 0,
                calculatedTramos: [],
                portCostItems: []
            };
        }
    }, [route, trms, portsCfg, unpacked]);

    const ladenTramos = trms.filter((tr: any) => tr.type === 'LADEN' || Number(tr.quantity || 0) > 0 || Number(tr.freight_rate || 0) > 0);
    const createdBy = route.created_by || route.legs_data?.created_by || 'izavala@petral.com.pe';
    const validFrom = route.valid_from || route.legs_data?.valid_from || 'Sin Fecha';
    const validTo = route.valid_to || route.legs_data?.valid_to || 'Sin Fecha';
    const vesselName = unpacked.vessel_name || unpacked.vessel_id || route.vessel_name || 'BT MOQUEGUA';

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onOpenInMulticotizador) {
            onOpenInMulticotizador(route);
        } else {
            try {
                sessionStorage.setItem('petral_load_quote', JSON.stringify(route));
                window.open('/multicotizador', '_blank');
            } catch (err) {
                console.error("Error opening quote:", err);
                window.open('/multicotizador', '_blank');
            }
        }
    };

    return (
        <div className="space-y-3">
            {/* BARRA SUPERIOR DE METADATOS COMERCIALES */}
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-300 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                        📅 <strong>Creación:</strong> {route.created_at ? new Date(route.created_at).toLocaleString() : '-'}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-bold text-blue-900 flex items-center gap-1">
                        ⏳ <strong>Validez (Paso 5):</strong> {validFrom} ➔ {validTo}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-600">
                        👤 <strong>Por:</strong> {createdBy}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-mono text-[11px] font-bold">
                        🚢 {vesselName}
                    </span>
                    <button
                        onClick={handleOpen}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-sm transition-all cursor-pointer"
                        title="Abrir esta cotización en el Multicotizador en nueva pestaña"
                    >
                        <ExternalLink size={13} />
                        <span>Ver en Multicotizador ➔</span>
                    </button>
                </div>
            </div>

            {/* GRID DE 4 CARDS EJECUTIVAS CALCULADAS CON EL MOTOR PURO */}
            <div className="bg-slate-100/90 border border-slate-300 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs shadow-inner">
                
                {/* CARD 1: ITINERARIO */}
                <div className="flex flex-col gap-1 bg-white p-2.5 rounded border border-slate-300 shadow-2xs">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                        <span>🧭 1. Itinerario ({trms.length} Piernas)</span>
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold">{calc.totalDist.toFixed(0)} NM</span>
                    </span>
                    <div className="flex flex-col gap-1 pt-1 divide-y divide-slate-100 max-h-36 overflow-y-auto">
                        {trms.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">Sin tramos definidos</span>
                        ) : trms.map((tr: any, tIdx: number) => {
                            const isLaden = tr.type === 'LADEN' || Number(tr.quantity || 0) > 0;
                            const orig = tr.origin_port_id || '-';
                            const dest = tr.destination_port_id || '-';
                            const dist = Number(tr.route_distance || tr.distance || 0);
                            return (
                                <div key={tIdx} className="pt-1 first:pt-0 text-[10.5px] flex items-center justify-between font-mono">
                                    <div className="flex items-center gap-1 truncate">
                                        <span className="font-bold text-slate-800">{orig} ➔ {dest}</span>
                                        <span className={`text-[8.5px] px-1 py-0.2 rounded font-sans font-bold ${isLaden ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                            {isLaden ? 'LADEN' : 'BALLAST'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold shrink-0">{dist} NM</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CARD 2: FLETE & GROSS REVENUE */}
                <div className="flex flex-col gap-1 bg-white p-2.5 rounded border border-blue-200 shadow-2xs">
                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider flex items-center justify-between">
                        <span>💰 2. Flete & Gross Rev</span>
                        <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-[8.5px]">MT × Rate</span>
                    </span>
                    <div className="text-[10.5px] text-slate-700 font-mono flex flex-col gap-1 pt-1">
                        {ladenTramos.length > 0 ? (
                            ladenTramos.map((tr: any, idx: number) => {
                                const q = Number(tr.quantity) || calc.totalQuantity;
                                const r = Number(tr.freight_rate) || 0;
                                const dest = tr.destination_port_id || `P${idx+1}`;
                                return (
                                    <div key={idx} className="flex items-center justify-between text-[10px]">
                                        <span className="truncate">{dest}: {q.toLocaleString()} MT @ ${r.toFixed(2)}</span>
                                        <span className="font-bold text-blue-900">${(q * r).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex items-center justify-between text-[10px]">
                                <span>Carga: {calc.totalQuantity.toLocaleString()} MT</span>
                                <span className="font-bold text-blue-900">${calc.totalFreight.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                            </div>
                        )}
                        {calc.refacturacionMuellaje > 0 && (
                            <div className="flex items-center justify-between text-[10px] text-emerald-800 pt-0.5 border-t border-slate-100">
                                <span>Dockage Rev:</span>
                                <span className="font-bold">+${calc.refacturacionMuellaje.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                            </div>
                        )}
                        <div className="text-[10px] font-bold text-blue-900 pt-1 border-t border-slate-200 flex items-center justify-between">
                            <span>Gross Total:</span>
                            <span className="font-black text-[11px] text-blue-700">${calc.grossRevenueTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>

                {/* CARD 3: BÚNKERES & PUERTOS */}
                <div className="flex flex-col gap-1 bg-white p-2.5 rounded border border-amber-200 shadow-2xs">
                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center justify-between">
                        <span>⛽ 3. Búnkeres & Puertos</span>
                        <span className="bg-amber-100 text-amber-800 px-1 py-0.5 rounded text-[8.5px]">Costos Op</span>
                    </span>
                    <div className="text-[10.5px] text-slate-700 font-mono flex flex-col gap-0.5 pt-1">
                        <span>IFO 380: <strong>{calc.totalIfoTons.toFixed(1)} MT</strong> × <strong>${(unpacked.bunker_price_ifo || 0).toFixed(0)}</strong></span>
                        <span>MDO: <strong>{calc.totalMdoTons.toFixed(1)} MT</strong> × <strong>${(unpacked.bunker_price_mdo || 0).toFixed(0)}</strong></span>
                        <div className="flex items-center justify-between text-[10px] text-amber-900 pt-0.5">
                            <span>Costo Búnker:</span>
                            <span className="font-bold">${calc.grandBunkerTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="text-[10px] font-bold text-teal-900 pt-0.5 border-t border-slate-100 flex items-center justify-between">
                            <span>Puertos + Agencias:</span>
                            <span className="font-bold text-teal-700">${calc.totalPortCosts.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>

                {/* CARD 4: RESULTADO & P&L */}
                <div className="flex flex-col gap-1 bg-emerald-50/90 p-2.5 rounded border border-emerald-300 shadow-2xs">
                    <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider flex items-center justify-between">
                        <span>📈 4. Resultado & P&L</span>
                        <span className="bg-emerald-200 text-emerald-900 px-1 py-0.5 rounded text-[8.5px]">Voyage PnL</span>
                    </span>
                    <div className="text-[10.5px] text-emerald-950 font-mono flex flex-col gap-0.5 pt-1">
                        <span>Voyage P&L: <strong className={calc.voyageResultPnl >= 0 ? "text-emerald-800" : "text-rose-700"}>${calc.voyageResultPnl.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong></span>
                        <span>Duración Total: <strong>{calc.totalDays.toFixed(2)} días</strong></span>
                        <div className="text-[10px] font-black text-emerald-950 pt-1 border-t border-emerald-200 flex items-center justify-between">
                            <span>TCE Realizado:</span>
                            <span className="text-[11px] text-emerald-700 font-extrabold">${calc.tceRealizado.toLocaleString('en-US', { maximumFractionDigits: 0 })}/d</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
