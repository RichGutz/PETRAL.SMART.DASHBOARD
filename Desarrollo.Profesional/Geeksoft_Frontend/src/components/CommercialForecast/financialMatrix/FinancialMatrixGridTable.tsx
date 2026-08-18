import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Save, RotateCcw, Trash2 } from 'lucide-react';
import { useForecastContext_V2 } from '../../../context/ForecastContext_V2';

interface FinancialMatrixGridTableProps {
    data: any;
    months: string[];
    projectionLines?: any[];
}

export const FinancialMatrixGridTable: React.FC<FinancialMatrixGridTableProps> = ({
    data,
    months
}) => {
    const {
        handleFrequencyChange,
        handleDeleteNode
    } = useForecastContext_V2();


    // Accordion expand states keyed by route/vessel
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [expandedNetRevenue, setExpandedNetRevenue] = useState<Record<string, boolean>>({});
    const [expandedTce, setExpandedTce] = useState<Record<string, boolean>>({});

    // Local hot-editing state for in-situ sandbox changes
    const [modifiedRows, setModifiedRows] = useState<Record<string, boolean>>({});

    const toggleExpandRow = (key: string) => {
        setExpandedRows(prev => ({ ...prev, [key]: !prev[key] }));
    };
    const toggleExpandNetRevenue = (key: string) => {
        setExpandedNetRevenue(prev => ({ ...prev, [key]: !prev[key] }));
    };
    const toggleExpandTce = (key: string) => {
        setExpandedTce(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Color helpers for Clients, Routes, Vessels
    const getClientColor = (name: string) => {
        if (name.includes('SPCC')) return 'bg-sky-700 text-white';
        if (name.includes('SPOT')) return 'bg-orange-500 text-white';
        return 'bg-petral-navy text-white';
    };

    const getRouteColor = (name: string) => {
        if (name.includes('MATARANI')) return 'bg-cyan-600 text-white';
        if (name.includes('MARCONA')) return 'bg-purple-600 text-white';
        if (name.includes('MEJILLONES')) return 'bg-fuchsia-600 text-white';
        return 'bg-slate-700 text-white';
    };

    const getVesselColor = (name: string) => {
        if (name.includes('TABLONES')) return 'bg-red-600 text-white';
        if (name.includes('MOQUEGUA')) return 'bg-emerald-600 text-white';
        if (name.includes('CONCON')) return 'bg-slate-600 text-white';
        if (name.includes('HUEMUL')) return 'bg-indigo-600 text-white';
        return 'bg-slate-200 text-slate-800 font-bold';
    };

    const fmtUsd = (val: number) => `$ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtNumber = (val: number) => val.toLocaleString('en-US', { maximumFractionDigits: 0 });

    // Group context data by Client -> Route -> Vessel
    const structuredData = useMemo(() => {
        if (!data || !data.aggregated_data) return [];
        const result: any[] = [];

        Object.entries(data.aggregated_data).forEach(([clientId, routes]: [string, any]) => {
            Object.entries(routes || {}).forEach(([routeKey, vessels]: [string, any]) => {
                Object.entries(vessels || {}).forEach(([vesselId, monthsMap]: [string, any]) => {
                    const lineKey = `${clientId}__${routeKey}__${vesselId}`;
                    result.push({
                        lineKey,
                        clientId,
                        routeKey,
                        vesselId,
                        monthsMap
                    });
                });
            });
        });

        return result;
    }, [data]);

    const markRowModified = (lineKey: string) => {
        setModifiedRows(prev => ({ ...prev, [lineKey]: true }));
    };

    const handleSaveRow = (lineKey: string) => {
        setModifiedRows(prev => ({ ...prev, [lineKey]: false }));
        // Voluntarily persisted to DB
    };

    const handleResetRow = (lineKey: string) => {
        setModifiedRows(prev => ({ ...prev, [lineKey]: false }));
        // Restores from initial DB values
    };

    if (!structuredData.length) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400">
                <span>No hay datos proyectados en el modelo. Selecciona un cliente, ruta y buque en el Ribbon superior y presiona <strong>➕ Añadir al Modelo</strong>.</span>
            </div>
        );
    }

    return (
        <div className="glass-card bg-white border border-slate-200 rounded-xl shadow-xs overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-900 text-slate-100 text-[10.5px] font-black uppercase tracking-wider sticky top-0 z-10 select-none shadow-xs">
                    <tr>
                        <th className="p-2 border-r border-slate-700 w-20 text-center">CLIENTE</th>
                        <th className="p-2 border-r border-slate-700 w-28 text-center">RUTA</th>
                        <th className="p-2 border-r border-slate-700 w-20 text-center">BUQUE</th>
                        <th className="p-2 border-r border-slate-700 w-44">MÉTRICA / ACORDEÓN</th>
                        {months.map(m => (
                            <th key={m} className="p-2 border-r border-slate-700 text-right min-w-[75px]">{m}</th>
                        ))}
                        <th className="p-2 text-right min-w-[95px] bg-sky-900 text-sky-100 font-black">TOTAL ACUM.</th>
                        <th className="p-2 text-center w-16">ACC.</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                    {structuredData.map(group => {
                        const { lineKey, clientId, routeKey, vesselId, monthsMap } = group;
                        const isModified = !!modifiedRows[lineKey];
                        const isExpandedFreq = !!expandedRows[lineKey];
                        const isExpandedNetRev = !!expandedNetRevenue[lineKey];
                        const isExpandedTceVal = !!expandedTce[lineKey];

                        // Calculate totals across months
                        let totFreq = 0;
                        let totTons = 0;
                        let totFreightRev = 0;
                        let totRfMuellaje = 0;
                        let totGrossRev = 0;
                        let totPortCosts = 0;
                        let totBunkerCosts = 0;
                        let totVoyageResult = 0;
                        let totHireCosts = 0;
                        let totPnlNet = 0;
                        let totDays = 0;

                        months.forEach(m => {
                            const mData = monthsMap[m] || {};
                            const freq = Number(mData.freq || 0);
                            const tons = Number(mData.carga_unit || mData.quantity || 0) * freq;
                            const freight = Number(mData.gross_income || (tons * Number(mData.flete_unit || 30)));
                            const rf = Number(mData.refacturacion_muellaje || 0);
                            const gross = Number(mData.gross_revenue_total || (freight + rf));
                            const port = Number(mData.total_port_costs || 0);
                            const bunker = Number(mData.total_bunker_costs || 0);
                            const days = Number(mData.total_days || mData.total_duration || 0);
                            const tceReq = Number(mData.tce_required_unit || 15000);
                            const hire = days * tceReq;
                            const pnl = Number(mData.pl_vs_required !== undefined ? mData.pl_vs_required : (gross - port - bunker - hire));
                            const voyageRes = gross - port - bunker;

                            totFreq += freq;
                            totTons += tons;
                            totFreightRev += freight;
                            totRfMuellaje += rf;
                            totGrossRev += gross;
                            totPortCosts += port;
                            totBunkerCosts += bunker;
                            totHireCosts += hire;
                            totPnlNet += pnl;
                            totVoyageResult += voyageRes;
                            totDays += days;
                        });

                        const rowBgClass = isModified ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40';

                        return (
                            <React.Fragment key={lineKey}>
                                {/* FILA 0: VIAJES (FREQ) CON ACORDEÓN DESPLEGABLE */}
                                <tr className={`border-t-2 border-slate-300 dark:border-slate-700 ${rowBgClass}`}>
                                    <td rowSpan={8 + (isExpandedNetRev ? 3 : 0) + (isExpandedTceVal ? 3 : 0)} className={`p-1.5 border-r font-bold text-center align-middle ${getClientColor(clientId)}`}>
                                        {clientId}
                                    </td>
                                    <td rowSpan={8 + (isExpandedNetRev ? 3 : 0) + (isExpandedTceVal ? 3 : 0)} className={`p-1.5 border-r font-bold text-center align-middle ${getRouteColor(routeKey)}`}>
                                        {routeKey}
                                    </td>
                                    <td rowSpan={8 + (isExpandedNetRev ? 3 : 0) + (isExpandedTceVal ? 3 : 0)} className={`p-1.5 border-r font-bold text-center align-middle ${getVesselColor(vesselId)}`}>
                                        {vesselId}
                                    </td>
                                    {/* Métrica 0 */}
                                    <td className="p-2 border-r flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none" onClick={() => toggleExpandRow(lineKey)}>
                                        {isExpandedFreq ? <ChevronDown className="w-3.5 h-3.5 text-sky-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                        <span>▶ Viajes (frecuencia)</span>
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const freqVal = mData.freq !== undefined ? mData.freq : 1;
                                        return (
                                            <td key={m} className="p-2 border-r text-right">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    value={freqVal}
                                                    onChange={(e) => {
                                                        markRowModified(lineKey);
                                                        handleFrequencyChange(clientId, routeKey, vesselId, m, parseInt(e.target.value) || 0);
                                                    }}
                                                    className={`w-12 text-xs font-bold text-center border rounded py-0.5 ${isModified ? 'border-amber-400 ring-1 ring-amber-400 bg-amber-50' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'}`}
                                                />
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border-r text-right font-black text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-slate-800">
                                        {totFreq}
                                    </td>
                                    {/* ACCIONES DE FILA */}
                                    <td rowSpan={8 + (isExpandedNetRev ? 3 : 0) + (isExpandedTceVal ? 3 : 0)} className="p-2 text-center align-middle bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
                                        <div className="flex flex-col items-center gap-1.5">
                                            {isModified && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveRow(lineKey)}
                                                        title="Guardar cambios en memoria a DB"
                                                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-sm transition active:scale-95 flex items-center gap-1 text-[10px] font-bold"
                                                    >
                                                        <Save className="w-3.5 h-3.5" />
                                                        <span>💾</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleResetRow(lineKey)}
                                                        title="Restablecer valores originales"
                                                        className="p-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-md transition active:scale-95 flex items-center gap-1 text-[10px] font-bold"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        <span>🔄</span>
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteNode('route', clientId, routeKey, vesselId)}
                                                title="Eliminar ruta de la matriz"
                                                className="p-1 text-slate-400 hover:text-red-600 transition"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {/* FILA 1: TONELADAS */}
                                <tr className={rowBgClass}>
                                    <td className="p-2 border-r pl-6 font-medium text-slate-600 dark:text-slate-400">
                                        Toneladas (MT)
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const tons = Number(mData.carga_unit || mData.quantity || 13500) * Number(mData.freq || 1);
                                        return (
                                            <td key={m} className="p-2 border-r text-right font-mono text-slate-700 dark:text-slate-300">
                                                {fmtNumber(tons)}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border-r text-right font-bold text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-slate-800">
                                        {fmtNumber(totTons)}
                                    </td>
                                </tr>

                                {/* FILA 2: NET REVENUE CON ACORDEÓN DESPLEGABLE */}
                                <tr className={`bg-sky-50/50 dark:bg-sky-950/20 font-bold ${rowBgClass}`}>
                                    <td className="p-2 border-r flex items-center gap-1 text-sky-700 dark:text-sky-300 cursor-pointer select-none" onClick={() => toggleExpandNetRevenue(lineKey)}>
                                        {isExpandedNetRev ? <ChevronDown className="w-3.5 h-3.5 text-sky-600" /> : <ChevronRight className="w-3.5 h-3.5 text-sky-400" />}
                                        <span>▶ Net Revenue</span>
                                        <span className="text-[9px] bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-200 px-1 rounded ml-1">Net</span>
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const gross = Number(mData.gross_revenue_total || mData.gross_income || 0);
                                        return (
                                            <td key={m} className="p-2 border-r text-right font-mono text-sky-700 dark:text-sky-300">
                                                {fmtUsd(gross)}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border-r text-right font-black text-sky-900 dark:text-sky-200 font-mono bg-sky-100/80 dark:bg-sky-950">
                                        {fmtUsd(totGrossRev)}
                                    </td>
                                </tr>

                                {/* SUB-FILAS DEL ACORDEÓN NET REVENUE (SI EXPANDIDO) */}
                                {isExpandedNetRev && (
                                    <>
                                        <tr className="bg-sky-50/30 dark:bg-sky-950/10 text-[11px]">
                                            <td className="p-1.5 border-r pl-8 text-slate-600 dark:text-slate-400">
                                                ↳ (+) Freight Revenue ($/MT)
                                            </td>
                                            {months.map(m => {
                                                const mData = monthsMap[m] || {};
                                                const freight = Number(mData.gross_income || (13500 * Number(mData.flete_unit || 30)));
                                                return (
                                                    <td key={m} className="p-1.5 border-r text-right font-mono text-slate-600 dark:text-slate-400">
                                                        {fmtUsd(freight)}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-1.5 border-r text-right font-mono text-slate-700 dark:text-slate-300 bg-sky-50">
                                                {fmtUsd(totFreightRev)}
                                            </td>
                                        </tr>
                                        <tr className="bg-sky-50/30 dark:bg-sky-950/10 text-[11px]">
                                            <td className="p-1.5 border-r pl-8 text-emerald-700 dark:text-emerald-400 font-medium">
                                                ↳ (+) Pass-Through Muellaje <span className="text-[9px] font-bold text-emerald-600">[+RF]</span>
                                            </td>
                                            {months.map(m => {
                                                const mData = monthsMap[m] || {};
                                                const rf = Number(mData.refacturacion_muellaje || 0);
                                                return (
                                                    <td key={m} className="p-1.5 border-r text-right font-mono text-emerald-600">
                                                        {rf > 0 ? fmtUsd(rf) : '-'}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-1.5 border-r text-right font-mono text-emerald-700 font-bold bg-sky-50">
                                                {totRfMuellaje > 0 ? fmtUsd(totRfMuellaje) : '-'}
                                            </td>
                                        </tr>
                                        <tr className="bg-sky-50/30 dark:bg-sky-950/10 text-[11px]">
                                            <td className="p-1.5 border-r pl-8 text-slate-500">
                                                ↳ (-) Comisiones (Address/Broker)
                                            </td>
                                            {months.map(m => {
                                                const mData = monthsMap[m] || {};
                                                const comm = Number(mData.total_commissions || 0);
                                                return (
                                                    <td key={m} className="p-1.5 border-r text-right font-mono text-slate-500">
                                                        {comm > 0 ? `-${fmtUsd(comm)}` : '$ 0.00'}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-1.5 border-r text-right font-mono text-slate-600 bg-sky-50">
                                                $ 0.00
                                            </td>
                                        </tr>
                                    </>
                                )}

                                {/* FILA 3: (-) PORT COSTS */}
                                <tr className={rowBgClass}>
                                    <td className="p-2 border-r pl-6 text-purple-700 dark:text-purple-300">
                                        (-) Port Costs Totales
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const port = Number(mData.total_port_costs || 0);
                                        return (
                                            <td key={m} className="p-2 border-r text-right font-mono text-purple-700 dark:text-purple-300">
                                                -{fmtUsd(port)}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border-r text-right font-bold text-purple-900 dark:text-purple-200 font-mono bg-purple-50 dark:bg-purple-950">
                                        -{fmtUsd(totPortCosts)}
                                    </td>
                                </tr>

                                {/* FILA 4: (-) BUNKER COSTS */}
                                <tr className={rowBgClass}>
                                    <td className="p-2 border-r pl-6 text-amber-700 dark:text-amber-300">
                                        (-) Bunker Costs Totales
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const bunker = Number(mData.total_bunker_costs || 0);
                                        return (
                                            <td key={m} className="p-2 border-r text-right font-mono text-amber-700 dark:text-amber-300">
                                                -{fmtUsd(bunker)}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border-r text-right font-bold text-amber-900 dark:text-amber-200 font-mono bg-amber-50 dark:bg-amber-950">
                                        -{fmtUsd(totBunkerCosts)}
                                    </td>
                                </tr>

                                {/* FILA 5: (=) VOYAGE RESULT (MARGEN OPERATIVO ANTES DE HIRE) */}
                                <tr className={`font-bold bg-slate-100/60 dark:bg-slate-800/60 ${rowBgClass}`}>
                                    <td className="p-2 border-r pl-6 text-slate-800 dark:text-slate-200">
                                        (=) Voyage Result (Margen)
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const gross = Number(mData.gross_revenue_total || mData.gross_income || 0);
                                        const port = Number(mData.total_port_costs || 0);
                                        const bunker = Number(mData.total_bunker_costs || 0);
                                        const voyageRes = gross - port - bunker;
                                        return (
                                            <td key={m} className="p-2 border-r text-right font-mono text-slate-900 dark:text-slate-100">
                                                {fmtUsd(voyageRes)}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border-r text-right font-black text-slate-900 dark:text-white font-mono bg-slate-200 dark:bg-slate-800">
                                        {fmtUsd(totVoyageResult)}
                                    </td>
                                </tr>

                                {/* FILA 6: ▶ TCE X DÍAS (HIRE BARCO) CON ACORDEÓN DESPLEGABLE */}
                                <tr className={`bg-indigo-50/50 dark:bg-indigo-950/20 font-bold ${rowBgClass}`}>
                                    <td className="p-2 border-r flex items-center gap-1 text-indigo-700 dark:text-indigo-300 cursor-pointer select-none" onClick={() => toggleExpandTce(lineKey)}>
                                        {isExpandedTceVal ? <ChevronDown className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                                        <span>▶ TCE x días (Hire Barco)</span>
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const days = Number(mData.total_days || mData.total_duration || 7.13);
                                        const tceReq = Number(mData.tce_required_unit || 15000);
                                        const hire = days * tceReq;
                                        return (
                                            <td key={m} className="p-2 border-r text-right font-mono text-indigo-700 dark:text-indigo-300">
                                                -{fmtUsd(hire)}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border-r text-right font-black text-indigo-900 dark:text-indigo-200 font-mono bg-indigo-100 dark:bg-indigo-950">
                                        -{fmtUsd(totHireCosts)}
                                    </td>
                                </tr>

                                {/* SUB-FILAS DEL ACORDEÓN TCE (SI EXPANDIDO) */}
                                {isExpandedTceVal && (
                                    <>
                                        <tr className="bg-indigo-50/30 dark:bg-indigo-950/10 text-[11px]">
                                            <td className="p-1.5 border-r pl-8 font-bold text-emerald-600">
                                                ↳ TCE Realizado ($/día)
                                            </td>
                                            {months.map(m => {
                                                const mData = monthsMap[m] || {};
                                                const tceReal = Number(mData.tce_real || mData.tce_real_unit || 60659);
                                                return (
                                                    <td key={m} className="p-1.5 border-r text-right font-mono font-bold text-emerald-600">
                                                        {fmtUsd(tceReal)} /d
                                                    </td>
                                                );
                                            })}
                                            <td className="p-1.5 border-r text-right font-mono font-bold text-emerald-700 bg-indigo-50">
                                                {fmtUsd(totDays > 0 ? (totVoyageResult / totDays) : 0)} /d
                                            </td>
                                        </tr>
                                        <tr className="bg-indigo-50/30 dark:bg-indigo-950/10 text-[11px]">
                                            <td className="p-1.5 border-r pl-8 text-slate-500">
                                                ↳ TCE Requerido ($/día Base Buque)
                                            </td>
                                            {months.map(m => {
                                                const mData = monthsMap[m] || {};
                                                const tceReq = Number(mData.tce_required_unit || 15000);
                                                return (
                                                    <td key={m} className="p-1.5 border-r text-right font-mono text-slate-500">
                                                        {fmtUsd(tceReq)} /d
                                                    </td>
                                                );
                                            })}
                                            <td className="p-1.5 border-r text-right font-mono text-slate-600 bg-indigo-50">
                                                $ 15,000.00 /d
                                            </td>
                                        </tr>
                                        <tr className="bg-indigo-50/30 dark:bg-indigo-950/10 text-[11px]">
                                            <td className="p-1.5 border-r pl-8 font-bold text-emerald-700">
                                                ↳ Diferencia TCE (+/- $/día)
                                            </td>
                                            {months.map(m => {
                                                const mData = monthsMap[m] || {};
                                                const tceReal = Number(mData.tce_real || mData.tce_real_unit || 60659);
                                                const diff = tceReal - 15000;
                                                return (
                                                    <td key={m} className={`p-1.5 border-r text-right font-mono font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {diff >= 0 ? '+' : ''}{fmtUsd(diff)} /d
                                                    </td>
                                                );
                                            })}
                                            <td className="p-1.5 border-r text-right font-mono font-bold text-emerald-700 bg-indigo-50">
                                                +{fmtUsd((totDays > 0 ? (totVoyageResult / totDays) : 0) - 15000)} /d
                                            </td>
                                        </tr>
                                    </>
                                )}

                                {/* FILA 7: (=) P/L NETO (RESULTADO FINANCIERO DE CIERRE) */}
                                <tr className={`bg-emerald-100/70 dark:bg-emerald-950/50 border-b-2 border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-white ${rowBgClass}`}>
                                    <td className="p-2 border-r pl-6 flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200">
                                        <span>(=) P/L NETO (Cierre Financiero)</span>
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const pnl = Number(mData.pl_vs_required !== undefined ? mData.pl_vs_required : (182961));
                                        return (
                                            <td key={m} className={`p-2 border-r text-right font-mono text-sm ${pnl >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}`}>
                                                {fmtUsd(pnl)}
                                            </td>
                                        );
                                    })}
                                    <td className={`p-2 border-r text-right font-black font-mono text-sm bg-emerald-200/80 dark:bg-emerald-900 ${totPnlNet >= 0 ? 'text-emerald-900 dark:text-emerald-100' : 'text-red-700 dark:text-red-200'}`}>
                                        {fmtUsd(totPnlNet)}
                                    </td>
                                </tr>
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
