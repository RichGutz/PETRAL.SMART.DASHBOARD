import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Save, RotateCcw, Trash2, Eye, EyeOff } from 'lucide-react';
import { useForecastContext_V2 } from '../../../context/ForecastContext_V2';

interface FinancialMatrixNavitransoGridTableProps {
    data: any;
    months: string[];
    projectionLines?: any[];
}

export const FinancialMatrixNavitransoGridTable: React.FC<FinancialMatrixNavitransoGridTableProps> = ({
    data,
    months
}) => {
    const {
        handleFrequencyChange,
        handleDeleteNode
    } = useForecastContext_V2();

    // Toggle para mostrar u ocultar filas N/A
    const [hideNaRows, setHideNaRows] = useState<boolean>(false);

    // Acordeones por rubro
    const [expandedHire, setExpandedHire] = useState<Record<string, boolean>>({});
    const [expandedDemurrageRev, setExpandedDemurrageRev] = useState<Record<string, boolean>>({});
    const [expandedPortRev, setExpandedPortRev] = useState<Record<string, boolean>>({});
    const [expandedBunker, setExpandedBunker] = useState<Record<string, boolean>>({});
    const [expandedPortCosts, setExpandedPortCosts] = useState<Record<string, boolean>>({});
    const [expandedDemurrageCost, setExpandedDemurrageCost] = useState<Record<string, boolean>>({});
    const [expandedCommissions, setExpandedCommissions] = useState<Record<string, boolean>>({});

    // Estado local para edición in-situ de frecuencias
    const [modifiedRows, setModifiedRows] = useState<Record<string, boolean>>({});

    const toggleExpand = (setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>, key: string) => {
        setter(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Helper colores PETRAL
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

    const fmtUsd = (val: number) => {
        if (val === 0) return '$ 0.00';
        const isNeg = val < 0;
        const absStr = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return isNeg ? `-$ ${absStr}` : `$ ${absStr}`;
    };

    // Estructurar datos agrupados por Cliente -> Ruta -> Buque
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
    };

    const handleResetRow = (lineKey: string) => {
        setModifiedRows(prev => ({ ...prev, [lineKey]: false }));
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
            {/* Barra de Herramientas Superior de la Matriz Navitranso */}
            <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black tracking-wider uppercase text-emerald-400">🏛️ ESTADO DE RESULTADOS — ESTÁNDAR NAVITRANSO</span>
                    <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">Control Presupuestal P&L</span>
                </div>
                <button
                    type="button"
                    onClick={() => setHideNaRows(!hideNaRows)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10.5px] font-bold transition-all cursor-pointer border ${hideNaRows ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                    title="Alternar visibilidad de filas N/A (Venta de terceros, otros ingresos/gastos)"
                >
                    {hideNaRows ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{hideNaRows ? 'Mostrar Filas N/A' : 'Ocultar Filas N/A'}</span>
                </button>
            </div>

            <table className="w-full text-xs text-left border-collapse" style={{ fontFamily: "'Segoe UI', 'Inter', sans-serif", fontVariantNumeric: 'tabular-nums' }}>
                <thead className="bg-slate-800 text-slate-100 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 select-none shadow-xs">
                    <tr>
                        <th className="p-2 border-r border-slate-700 w-20 text-center">CLIENTE</th>
                        <th className="p-2 border-r border-slate-700 w-28 text-center">RUTA</th>
                        <th className="p-2 border-r border-slate-700 w-20 text-center">BUQUE</th>
                        <th className="p-2 border-r border-slate-700 w-52">ESTRUCTURA NAVITRANSO (P&L)</th>
                        {months.map(m => (
                            <th key={m} className="p-2 border-r border-slate-700 text-right min-w-[80px]">{m}</th>
                        ))}
                        <th className="p-2 text-right min-w-[100px] bg-emerald-950 text-emerald-300 font-black border-l border-emerald-800">TOTAL ACUM.</th>
                        <th className="p-2 text-center w-14">ACC.</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                    {structuredData.map(group => {
                        const { lineKey, clientId, routeKey, vesselId, monthsMap } = group;
                        const isModified = !!modifiedRows[lineKey];

                        // Totales por rubro de Navitranso
                        let totHire = 0;
                        let totVentaTerceros = 0;
                        let totDemurrageRev = 0;
                        let totIngresosPuerto = 0;
                        let totOtrosIngresos = 0;
                        let totVentas = 0;

                        let totCombustible = 0;
                        let totGastosPuerto = 0;
                        let totCostosDemora = 0;
                        let totComisiones = 0;
                        let totOtrosCostos = 0;
                        let totCostosDirectos = 0;

                        let totTce = 0;
                        let totArriendo = 0;
                        let totMargenBruto = 0;
                        let totPersonal = 0;
                        let totNave = 0;

                        months.forEach(m => {
                            const mData = monthsMap[m] || {};
                            const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                            
                            // 1. VENTAS
                            const hireVal = (Number(mData.gross_income) || (Number(mData.carga_unit || 13500) * Number(mData.flete_unit || 30) * freq));
                            const demRevVal = Number(mData.demurrage_revenue || mData.demurrage_income || 0) * freq;
                            const ingPtoVal = Number(mData.refacturacion_muellaje || mData.dockage_revenue || 0) * freq;
                            const ventaTercVal = 0;
                            const otrosIngVal = 0;
                            const ventasSubtotal = hireVal + demRevVal + ingPtoVal + ventaTercVal + otrosIngVal;

                            // 2. COSTOS DIRECTOS (Negativos)
                            const combVal = Number(mData.total_bunker_costs || 0) * (mData.total_bunker_costs_unit ? freq : 1);
                            const ptoVal = Number(mData.total_port_costs || 0) * (mData.total_port_costs_unit ? freq : 1);
                            const demCostVal = Number(mData.demurrage_hire_cost || mData.costos_demora || 0) * freq;
                            const comVal = Number(mData.commissions_cost || mData.total_commissions || 0) * freq;
                            const otrosCostVal = 0;
                            const costosDirectosSubtotal = -(combVal + ptoVal + demCostVal + comVal + otrosCostVal);

                            // 3. TIME CHARTER EQUIVALENT & MARGEN BRUTO
                            const tceVal = ventasSubtotal + costosDirectosSubtotal;
                            const arriendoVal = Number(mData.charter_hire_cost || 0) * freq;
                            const mbVal = tceVal - arriendoVal;

                            // 4. OPEX
                            const personalVal = Number(mData.personal_cost || 0);
                            const naveVal = Number(mData.ship_cost || 0);

                            totHire += hireVal;
                            totVentaTerceros += ventaTercVal;
                            totDemurrageRev += demRevVal;
                            totIngresosPuerto += ingPtoVal;
                            totOtrosIngresos += otrosIngVal;
                            totVentas += ventasSubtotal;

                            totCombustible += -combVal;
                            totGastosPuerto += -ptoVal;
                            totCostosDemora += -demCostVal;
                            totComisiones += -comVal;
                            totOtrosCostos += -otrosCostVal;
                            totCostosDirectos += costosDirectosSubtotal;

                            totTce += tceVal;
                            totArriendo += -arriendoVal;
                            totMargenBruto += mbVal;
                            totPersonal += -personalVal;
                            totNave += -naveVal;
                        });

                        // Recuento de filas visibles para el rowSpan lateral
                        let visibleRowsCount = 13; // Frecuencia + Ventas (Subtotal) + 3 Operativas + Costos Directos (Subtotal) + 4 Operativas + TCE + Margen Bruto + 2 OPEX
                        if (!hideNaRows) {
                            visibleRowsCount += 4; // Venta Terceros, Otros Ingresos, Otros Costos, Arriendo
                        }
                        if (expandedHire[lineKey]) visibleRowsCount += 1;
                        if (expandedDemurrageRev[lineKey]) visibleRowsCount += 1;
                        if (expandedPortRev[lineKey]) visibleRowsCount += 1;
                        if (expandedBunker[lineKey]) visibleRowsCount += 3;
                        if (expandedPortCosts[lineKey]) visibleRowsCount += 2;
                        if (expandedDemurrageCost[lineKey]) visibleRowsCount += 1;
                        if (expandedCommissions[lineKey]) visibleRowsCount += 1;

                        const rowBgClass = isModified ? 'bg-amber-50/50' : 'hover:bg-slate-50/80';

                        return (
                            <React.Fragment key={lineKey}>
                                {/* FILA 0: FRECUENCIA / CONTROL DE VIAJES */}
                                <tr className={`border-t-2 border-slate-300 ${rowBgClass}`}>
                                    <td rowSpan={visibleRowsCount} className={`p-1.5 border-r font-bold text-center align-middle ${getClientColor(clientId)}`}>
                                        {clientId}
                                    </td>
                                    <td rowSpan={visibleRowsCount} className={`p-1.5 border-r font-bold text-center align-middle ${getRouteColor(routeKey)}`}>
                                        {routeKey}
                                    </td>
                                    <td rowSpan={visibleRowsCount} className={`p-1.5 border-r font-bold text-center align-middle ${getVesselColor(vesselId)}`}>
                                        {vesselId}
                                    </td>
                                    <td className="p-2 border-r font-extrabold text-sky-900 bg-sky-50/60 flex items-center justify-between">
                                        <span>🚢 FRECUENCIA DE VIAJES</span>
                                        <span className="text-[9px] bg-sky-200 text-sky-800 px-1 rounded">Viajes/Mes</span>
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const freqVal = mData.freq !== undefined ? mData.freq : 1;
                                        return (
                                            <td key={m} className="p-1.5 border-r text-right bg-sky-50/30">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="20"
                                                    value={freqVal}
                                                    onChange={(e) => {
                                                        markRowModified(lineKey);
                                                        handleFrequencyChange(clientId, routeKey, vesselId, m, parseInt(e.target.value) || 0);
                                                    }}
                                                    className={`w-12 text-xs font-bold text-center border rounded py-0.5 ${isModified ? 'border-amber-400 ring-1 ring-amber-400 bg-amber-50' : 'border-slate-300 bg-white'}`}
                                                />
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border-r text-right font-black text-sky-950 bg-sky-100 border-l border-slate-200">
                                        {months.reduce((acc, m) => acc + Number(monthsMap[m]?.freq !== undefined ? monthsMap[m]?.freq : 1), 0)} vjes
                                    </td>
                                    <td rowSpan={visibleRowsCount} className="p-2 text-center align-middle bg-slate-50 border-l border-slate-200">
                                        <div className="flex flex-col items-center gap-1.5">
                                            {isModified && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveRow(lineKey)}
                                                        title="Guardar cambios de frecuencia"
                                                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs transition active:scale-95 text-[10px] font-bold cursor-pointer"
                                                    >
                                                        <Save className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleResetRow(lineKey)}
                                                        title="Restablecer frecuencias originales"
                                                        className="p-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-md transition active:scale-95 text-[10px] font-bold cursor-pointer"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteNode('route', clientId, routeKey, vesselId)}
                                                title="Eliminar ruta de la matriz"
                                                className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {/* ======================================================== */}
                                {/* 🟢 1. BLOQUE VENTAS (Subtotal Consolidado Verde)        */}
                                {/* ======================================================== */}
                                <tr className="bg-emerald-100/70 border-t border-emerald-300 font-extrabold text-emerald-950">
                                    <td className="p-2 border-r border-emerald-200 uppercase tracking-wide">
                                        🟢 VENTAS
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                        const hireVal = (Number(mData.gross_income) || (Number(mData.carga_unit || 13500) * Number(mData.flete_unit || 30) * freq));
                                        const demRevVal = Number(mData.demurrage_revenue || mData.demurrage_income || 0) * freq;
                                        const ingPtoVal = Number(mData.refacturacion_muellaje || mData.dockage_revenue || 0) * freq;
                                        const ventasVal = hireVal + demRevVal + ingPtoVal;
                                        return (
                                            <td key={m} className="p-2 border-r border-emerald-200 text-right">
                                                {fmtUsd(ventasVal)}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border-r border-emerald-300 text-right font-black bg-emerald-200/80 text-emerald-950">
                                        {fmtUsd(totVentas)}
                                    </td>
                                </tr>

                                {/* 1.1 HIRE (Acordeón) */}
                                <tr className="hover:bg-slate-50">
                                    <td className="p-1.5 border-r pl-6 flex items-center gap-1 font-bold text-slate-800 cursor-pointer select-none" onClick={() => toggleExpand(setExpandedHire, lineKey)}>
                                        {expandedHire[lineKey] ? <ChevronDown className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                        <span>HIRE</span>
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                        const val = (Number(mData.gross_income) || (Number(mData.carga_unit || 13500) * Number(mData.flete_unit || 30) * freq));
                                        return <td key={m} className="p-1.5 border-r text-right font-semibold text-slate-800">{fmtUsd(val)}</td>;
                                    })}
                                    <td className="p-1.5 border-r text-right font-bold bg-slate-100/60 text-slate-900">{fmtUsd(totHire)}</td>
                                </tr>
                                {expandedHire[lineKey] && (
                                    <tr className="bg-slate-50 text-[10px] text-slate-600 italic">
                                        <td className="p-1 border-r pl-10 text-slate-500">↳ Desglose: Toneladas × Flete Unitario</td>
                                        {months.map(m => {
                                            const mData = monthsMap[m] || {};
                                            const tons = Number(mData.carga_unit || 13500) * Number(mData.freq !== undefined ? mData.freq : 1);
                                            const rate = Number(mData.flete_unit || 30);
                                            return <td key={m} className="p-1 border-r text-right text-slate-500">{tons.toLocaleString()} MT @ ${rate}/MT</td>;
                                        })}
                                        <td className="p-1 border-r text-right font-medium text-slate-600">Base Comercial</td>
                                    </tr>
                                )}

                                {/* 1.2 VENTA DE TERCEROS (Fila N/A) */}
                                {!hideNaRows && (
                                    <tr className="bg-slate-50/40 text-slate-400">
                                        <td className="p-1.5 border-r pl-6 flex items-center justify-between">
                                            <span>VENTA DE TERCEROS</span>
                                            <span className="text-[8.5px] bg-slate-200 text-slate-600 px-1 rounded">N/A</span>
                                        </td>
                                        {months.map(m => <td key={m} className="p-1.5 border-r text-right text-slate-400">$ 0.00</td>)}
                                        <td className="p-1.5 border-r text-right text-slate-400 bg-slate-100/30">$ 0.00</td>
                                    </tr>
                                )}

                                {/* 1.3 DEMORAS (Acordeón) */}
                                <tr className="hover:bg-slate-50">
                                    <td className="p-1.5 border-r pl-6 flex items-center gap-1 font-bold text-slate-800 cursor-pointer select-none" onClick={() => toggleExpand(setExpandedDemurrageRev, lineKey)}>
                                        {expandedDemurrageRev[lineKey] ? <ChevronDown className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                        <span>DEMORAS</span>
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                        const val = Number(mData.demurrage_revenue || mData.demurrage_income || 0) * freq;
                                        return <td key={m} className="p-1.5 border-r text-right font-semibold text-slate-800">{fmtUsd(val)}</td>;
                                    })}
                                    <td className="p-1.5 border-r text-right font-bold bg-slate-100/60 text-slate-900">{fmtUsd(totDemurrageRev)}</td>
                                </tr>
                                {expandedDemurrageRev[lineKey] && (
                                    <tr className="bg-slate-50 text-[10px] text-slate-600 italic">
                                        <td className="p-1 border-r pl-10 text-slate-500">↳ Desglose: Estadías Facturadas al Cliente</td>
                                        {months.map(m => {
                                            const mData = monthsMap[m] || {};
                                            const days = Number(mData.demurrage_days || 0);
                                            return <td key={m} className="p-1 border-r text-right text-slate-500">{days > 0 ? `${days.toFixed(2)} días @ Dem. Rate` : 'Sin Demoras'}</td>;
                                        })}
                                        <td className="p-1 border-r text-right font-medium text-slate-600">Tarifa Demurrage</td>
                                    </tr>
                                )}

                                {/* 1.4 INGRESOS DE PUERTO (Acordeón) */}
                                <tr className="hover:bg-slate-50">
                                    <td className="p-1.5 border-r pl-6 flex items-center gap-1 font-bold text-slate-800 cursor-pointer select-none" onClick={() => toggleExpand(setExpandedPortRev, lineKey)}>
                                        {expandedPortRev[lineKey] ? <ChevronDown className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                        <span>INGRESOS DE PUERTO</span>
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                        const val = Number(mData.refacturacion_muellaje || mData.dockage_revenue || 0) * freq;
                                        return <td key={m} className="p-1.5 border-r text-right font-semibold text-slate-800">{fmtUsd(val)}</td>;
                                    })}
                                    <td className="p-1.5 border-r text-right font-bold bg-slate-100/60 text-slate-900">{fmtUsd(totIngresosPuerto)}</td>
                                </tr>
                                {expandedPortRev[lineKey] && (
                                    <tr className="bg-slate-50 text-[10px] text-slate-600 italic">
                                        <td className="p-1 border-r pl-10 text-slate-500">↳ Desglose: Refacturación Muellaje [RF]</td>
                                        {months.map(m => {
                                            const mData = monthsMap[m] || {};
                                            const rf = Number(mData.refacturacion_muellaje || 0);
                                            return <td key={m} className="p-1 border-r text-right text-slate-500">{rf > 0 ? `RF Muellaje: $${rf.toLocaleString()}` : '$ 0.00'}</td>;
                                        })}
                                        <td className="p-1 border-r text-right font-medium text-slate-600">Refacturaciones</td>
                                    </tr>
                                )}

                                {/* 1.5 OTROS INGRESOS (Fila N/A) */}
                                {!hideNaRows && (
                                    <tr className="bg-slate-50/40 text-slate-400">
                                        <td className="p-1.5 border-r pl-6 flex items-center justify-between">
                                            <span>OTROS INGRESOS</span>
                                            <span className="text-[8.5px] bg-slate-200 text-slate-600 px-1 rounded">N/A</span>
                                        </td>
                                        {months.map(m => <td key={m} className="p-1.5 border-r text-right text-slate-400">$ 0.00</td>)}
                                        <td className="p-1.5 border-r text-right text-slate-400 bg-slate-100/30">$ 0.00</td>
                                    </tr>
                                )}

                                {/* ======================================================== */}
                                {/* 🔴 2. BLOQUE COSTOS DIRECTOS (Subtotal Rojo Negativo)   */}
                                {/* ======================================================== */}
                                <tr className="bg-rose-100/70 border-t border-rose-300 font-extrabold text-rose-950">
                                    <td className="p-2 border-r border-rose-200 uppercase tracking-wide">
                                        🔴 COSTOS DIRECTOS
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                        const combVal = Number(mData.total_bunker_costs || 0) * (mData.total_bunker_costs_unit ? freq : 1);
                                        const ptoVal = Number(mData.total_port_costs || 0) * (mData.total_port_costs_unit ? freq : 1);
                                        const demCostVal = Number(mData.demurrage_hire_cost || mData.costos_demora || 0) * freq;
                                        const comVal = Number(mData.commissions_cost || mData.total_commissions || 0) * freq;
                                        const costosSubtotal = -(combVal + ptoVal + demCostVal + comVal);
                                        return (
                                            <td key={m} className="p-2 border-r border-rose-200 text-right">
                                                {fmtUsd(costosSubtotal)}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border-r border-rose-300 text-right font-black bg-rose-200/80 text-rose-950">
                                        {fmtUsd(totCostosDirectos)}
                                    </td>
                                </tr>

                                {/* 2.1 COMBUSTIBLE (Acordeón) */}
                                <tr className="hover:bg-slate-50">
                                    <td className="p-1.5 border-r pl-6 flex items-center gap-1 font-bold text-rose-900 cursor-pointer select-none" onClick={() => toggleExpand(setExpandedBunker, lineKey)}>
                                        {expandedBunker[lineKey] ? <ChevronDown className="w-3.5 h-3.5 text-rose-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                        <span>COMBUSTIBLE</span>
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                        const val = -Number(mData.total_bunker_costs || 0) * (mData.total_bunker_costs_unit ? freq : 1);
                                        return <td key={m} className="p-1.5 border-r text-right font-semibold text-rose-800">{fmtUsd(val)}</td>;
                                    })}
                                    <td className="p-1.5 border-r text-right font-bold bg-slate-100/60 text-rose-950">{fmtUsd(totCombustible)}</td>
                                </tr>
                                {expandedBunker[lineKey] && (
                                    <>
                                        <tr className="bg-slate-50 text-[10px] text-slate-600 italic">
                                            <td className="p-1 border-r pl-10">↳ Búnker Mar (IFO Navegación + MDO)</td>
                                            {months.map(m => {
                                                const mData = monthsMap[m] || {};
                                                const val = -Number(mData.bunker_sea_cost || (mData.total_bunker_costs ? mData.total_bunker_costs * 0.75 : 0));
                                                return <td key={m} className="p-1 border-r text-right text-slate-600">{fmtUsd(val)}</td>;
                                            })}
                                            <td className="p-1 border-r text-right font-medium">Consumo Navegación</td>
                                        </tr>
                                        <tr className="bg-slate-50 text-[10px] text-slate-600 italic">
                                            <td className="p-1 border-r pl-10">↳ Búnker Puerto (Carga / Descarga / Idle)</td>
                                            {months.map(m => {
                                                const mData = monthsMap[m] || {};
                                                const val = -Number(mData.bunker_port_cost || (mData.total_bunker_costs ? mData.total_bunker_costs * 0.20 : 0));
                                                return <td key={m} className="p-1 border-r text-right text-slate-600">{fmtUsd(val)}</td>;
                                            })}
                                            <td className="p-1 border-r text-right font-medium">Consumo Puerto</td>
                                        </tr>
                                        <tr className="bg-slate-50 text-[10px] text-slate-600 italic">
                                            <td className="p-1 border-r pl-10">↳ Búnker Demoras (Idle en Fondeo)</td>
                                            {months.map(m => {
                                                const mData = monthsMap[m] || {};
                                                const val = -Number(mData.bunker_demurrage_cost || (mData.total_bunker_costs ? mData.total_bunker_costs * 0.05 : 0));
                                                return <td key={m} className="p-1 border-r text-right text-slate-600">{fmtUsd(val)}</td>;
                                            })}
                                            <td className="p-1 border-r text-right font-medium">Consumo Demoras</td>
                                        </tr>
                                    </>
                                )}

                                {/* 2.2 GASTOS DE PUERTO (Acordeón) */}
                                <tr className="hover:bg-slate-50">
                                    <td className="p-1.5 border-r pl-6 flex items-center gap-1 font-bold text-rose-900 cursor-pointer select-none" onClick={() => toggleExpand(setExpandedPortCosts, lineKey)}>
                                        {expandedPortCosts[lineKey] ? <ChevronDown className="w-3.5 h-3.5 text-rose-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                        <span>GASTOS DE PUERTO</span>
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                        const val = -Number(mData.total_port_costs || 0) * (mData.total_port_costs_unit ? freq : 1);
                                        return <td key={m} className="p-1.5 border-r text-right font-semibold text-rose-800">{fmtUsd(val)}</td>;
                                    })}
                                    <td className="p-1.5 border-r text-right font-bold bg-slate-100/60 text-rose-950">{fmtUsd(totGastosPuerto)}</td>
                                </tr>
                                {expandedPortCosts[lineKey] && (
                                    <>
                                        <tr className="bg-slate-50 text-[10px] text-slate-600 italic">
                                            <td className="p-1 border-r pl-10">↳ Agenciamiento & Tarifas Puerto Origen (POL)</td>
                                            {months.map(m => {
                                                const mData = monthsMap[m] || {};
                                                const val = -Number(mData.port_cost_origin || (mData.total_port_costs ? mData.total_port_costs * 0.45 : 0));
                                                return <td key={m} className="p-1 border-r text-right text-slate-600">{fmtUsd(val)}</td>;
                                            })}
                                            <td className="p-1 border-r text-right font-medium">Costos POL</td>
                                        </tr>
                                        <tr className="bg-slate-50 text-[10px] text-slate-600 italic">
                                            <td className="p-1 border-r pl-10">↳ Agenciamiento & Muellaje Puerto Destino (POD)</td>
                                            {months.map(m => {
                                                const mData = monthsMap[m] || {};
                                                const val = -Number(mData.port_cost_dest || (mData.total_port_costs ? mData.total_port_costs * 0.55 : 0));
                                                return <td key={m} className="p-1 border-r text-right text-slate-600">{fmtUsd(val)}</td>;
                                            })}
                                            <td className="p-1 border-r text-right font-medium">Costos POD</td>
                                        </tr>
                                    </>
                                )}

                                {/* 2.3 COSTOS DE DEMORA (Acordeón) */}
                                <tr className="hover:bg-slate-50">
                                    <td className="p-1.5 border-r pl-6 flex items-center gap-1 font-bold text-rose-900 cursor-pointer select-none" onClick={() => toggleExpand(setExpandedDemurrageCost, lineKey)}>
                                        {expandedDemurrageCost[lineKey] ? <ChevronDown className="w-3.5 h-3.5 text-rose-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                        <span>COSTOS DE DEMORA</span>
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                        const val = -Number(mData.demurrage_hire_cost || mData.costos_demora || 0) * freq;
                                        return <td key={m} className="p-1.5 border-r text-right font-semibold text-rose-800">{fmtUsd(val)}</td>;
                                    })}
                                    <td className="p-1.5 border-r text-right font-bold bg-slate-100/60 text-rose-950">{fmtUsd(totCostosDemora)}</td>
                                </tr>
                                {expandedDemurrageCost[lineKey] && (
                                    <tr className="bg-slate-50 text-[10px] text-slate-600 italic">
                                        <td className="p-1 border-r pl-10">↳ Costo Oportunidad / Nave Parada (Días Demora × TCE Requerido)</td>
                                        {months.map(m => {
                                            const mData = monthsMap[m] || {};
                                            const days = Number(mData.demurrage_days || 0);
                                            const tce = Number(mData.tce_required_unit || 15000);
                                            return <td key={m} className="p-1 border-r text-right text-slate-500">{days > 0 ? `${days.toFixed(2)}d × $${tce.toLocaleString()}/d` : '$ 0.00'}</td>;
                                        })}
                                        <td className="p-1 border-r text-right font-medium text-slate-600">Costo Hire Demora</td>
                                    </tr>
                                )}

                                {/* 2.4 COMISIONES VARIAS (Acordeón) */}
                                <tr className="hover:bg-slate-50">
                                    <td className="p-1.5 border-r pl-6 flex items-center gap-1 font-bold text-rose-900 cursor-pointer select-none" onClick={() => toggleExpand(setExpandedCommissions, lineKey)}>
                                        {expandedCommissions[lineKey] ? <ChevronDown className="w-3.5 h-3.5 text-rose-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                        <span>COMISIONES VARIAS</span>
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                        const val = -Number(mData.commissions_cost || mData.total_commissions || 0) * freq;
                                        return <td key={m} className="p-1.5 border-r text-right font-semibold text-rose-800">{fmtUsd(val)}</td>;
                                    })}
                                    <td className="p-1.5 border-r text-right font-bold bg-slate-100/60 text-rose-950">{fmtUsd(totComisiones)}</td>
                                </tr>
                                {expandedCommissions[lineKey] && (
                                    <tr className="bg-slate-50 text-[10px] text-slate-600 italic">
                                        <td className="p-1 border-r pl-10">↳ Address Commission & Brokerage</td>
                                        {months.map(m => {
                                            const mData = monthsMap[m] || {};
                                            const comm = Number(mData.commissions_cost || 0);
                                            return <td key={m} className="p-1 border-r text-right text-slate-500">{comm > 0 ? `-$ ${comm.toLocaleString()}` : '$ 0.00'}</td>;
                                        })}
                                        <td className="p-1 border-r text-right font-medium text-slate-600">Comisiones Comerciales</td>
                                    </tr>
                                )}

                                {/* 2.5 OTROS COSTOS DIRECTOS (Fila N/A) */}
                                {!hideNaRows && (
                                    <tr className="bg-slate-50/40 text-slate-400">
                                        <td className="p-1.5 border-r pl-6 flex items-center justify-between">
                                            <span>OTROS COSTOS DIRECTOS</span>
                                            <span className="text-[8.5px] bg-slate-200 text-slate-600 px-1 rounded">N/A</span>
                                        </td>
                                        {months.map(m => <td key={m} className="p-1.5 border-r text-right text-slate-400">$ 0.00</td>)}
                                        <td className="p-1.5 border-r text-right text-slate-400 bg-slate-100/30">$ 0.00</td>
                                    </tr>
                                )}

                                {/* ======================================================== */}
                                {/* 🔵 3. TIME CHARTER EQUIVALENT (Fila Destacada Azul)      */}
                                {/* ======================================================== */}
                                <tr className="bg-blue-100/80 border-t-2 border-b border-blue-400 font-black text-blue-950">
                                    <td className="p-2 border-r border-blue-300 uppercase tracking-wide">
                                        🔵 TIME CHARTER EQUIVALENT
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                        const hireVal = (Number(mData.gross_income) || (Number(mData.carga_unit || 13500) * Number(mData.flete_unit || 30) * freq));
                                        const demRevVal = Number(mData.demurrage_revenue || mData.demurrage_income || 0) * freq;
                                        const ingPtoVal = Number(mData.refacturacion_muellaje || mData.dockage_revenue || 0) * freq;
                                        const ventasVal = hireVal + demRevVal + ingPtoVal;

                                        const combVal = Number(mData.total_bunker_costs || 0) * (mData.total_bunker_costs_unit ? freq : 1);
                                        const ptoVal = Number(mData.total_port_costs || 0) * (mData.total_port_costs_unit ? freq : 1);
                                        const demCostVal = Number(mData.demurrage_hire_cost || mData.costos_demora || 0) * freq;
                                        const comVal = Number(mData.commissions_cost || mData.total_commissions || 0) * freq;
                                        const costosVal = -(combVal + ptoVal + demCostVal + comVal);

                                        const tceVal = ventasVal + costosVal;
                                        return (
                                            <td key={m} className="p-2 border-r border-blue-300 text-right">
                                                {fmtUsd(tceVal)}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border-r border-blue-400 text-right font-black bg-blue-200 text-blue-950">
                                        {fmtUsd(totTce)}
                                    </td>
                                </tr>

                                {/* 3.1 COSTO DE ARRIENDO NAVES */}
                                {!hideNaRows && (
                                    <tr className="hover:bg-slate-50 text-slate-700">
                                        <td className="p-1.5 border-r pl-6 flex items-center justify-between font-semibold">
                                            <span>COSTO DE ARRIENDO NAVES</span>
                                            <span className="text-[8.5px] bg-slate-100 text-slate-500 px-1 rounded">Charter Hire</span>
                                        </td>
                                        {months.map(m => {
                                            const mData = monthsMap[m] || {};
                                            const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                            const val = -Number(mData.charter_hire_cost || 0) * freq;
                                            return <td key={m} className="p-1.5 border-r text-right font-semibold">{fmtUsd(val)}</td>;
                                        })}
                                        <td className="p-1.5 border-r text-right font-bold bg-slate-100/60">{fmtUsd(totArriendo)}</td>
                                    </tr>
                                )}

                                {/* ======================================================== */}
                                {/* 🏆 4. MARGEN BRUTO (Fila Destacada Esmeralda / Dorada)   */}
                                {/* ======================================================== */}
                                <tr className="bg-emerald-200/90 border-t-2 border-b-2 border-emerald-500 font-black text-emerald-950">
                                    <td className="p-2 border-r border-emerald-300 uppercase tracking-wide">
                                        🏆 MARGEN BRUTO
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                        const hireVal = (Number(mData.gross_income) || (Number(mData.carga_unit || 13500) * Number(mData.flete_unit || 30) * freq));
                                        const demRevVal = Number(mData.demurrage_revenue || mData.demurrage_income || 0) * freq;
                                        const ingPtoVal = Number(mData.refacturacion_muellaje || mData.dockage_revenue || 0) * freq;
                                        const ventasVal = hireVal + demRevVal + ingPtoVal;

                                        const combVal = Number(mData.total_bunker_costs || 0) * (mData.total_bunker_costs_unit ? freq : 1);
                                        const ptoVal = Number(mData.total_port_costs || 0) * (mData.total_port_costs_unit ? freq : 1);
                                        const demCostVal = Number(mData.demurrage_hire_cost || mData.costos_demora || 0) * freq;
                                        const comVal = Number(mData.commissions_cost || mData.total_commissions || 0) * freq;
                                        const costosVal = -(combVal + ptoVal + demCostVal + comVal);

                                        const tceVal = ventasVal + costosVal;
                                        const arriendoVal = -Number(mData.charter_hire_cost || 0) * freq;
                                        const mbVal = tceVal + arriendoVal;
                                        return (
                                            <td key={m} className="p-2 border-r border-emerald-300 text-right">
                                                {fmtUsd(mbVal)}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border-r border-emerald-500 text-right font-black bg-emerald-300 text-emerald-950">
                                        {fmtUsd(totMargenBruto)}
                                    </td>
                                </tr>

                                {/* ======================================================== */}
                                {/* ⚪ 5. OPEX / COSTOS FIJOS (Personal y Nave)              */}
                                {/* ======================================================== */}
                                <tr className="hover:bg-slate-50 text-slate-600">
                                    <td className="p-1.5 border-r pl-6 flex items-center justify-between font-semibold">
                                        <span>GTOS. PERSONAL A BORDO</span>
                                        <span className="text-[8.5px] bg-slate-100 text-slate-500 px-1 rounded">OPEX</span>
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const val = -Number(mData.personal_cost || 0);
                                        return <td key={m} className="p-1.5 border-r text-right font-semibold">{fmtUsd(val)}</td>;
                                    })}
                                    <td className="p-1.5 border-r text-right font-bold bg-slate-100/60">{fmtUsd(totPersonal)}</td>
                                </tr>

                                <tr className="hover:bg-slate-50 text-slate-600">
                                    <td className="p-1.5 border-r pl-6 flex items-center justify-between font-semibold">
                                        <span>GASTOS DE LA NAVE</span>
                                        <span className="text-[8.5px] bg-slate-100 text-slate-500 px-1 rounded">OPEX</span>
                                    </td>
                                    {months.map(m => {
                                        const mData = monthsMap[m] || {};
                                        const val = -Number(mData.ship_cost || 0);
                                        return <td key={m} className="p-1.5 border-r text-right font-semibold">{fmtUsd(val)}</td>;
                                    })}
                                    <td className="p-1.5 border-r text-right font-bold bg-slate-100/60">{fmtUsd(totNave)}</td>
                                </tr>

                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
