import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Save, RotateCcw, Trash2 } from 'lucide-react';
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
        handleDeleteNode,
        hideNaRows,
        showSubtotals,
        showAccumulatedTotal
    } = useForecastContext_V2();

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

    // Helper colores PETRAL con diseño ergonómico
    const getClientColor = (name: string) => {
        if (name.includes('SPCC')) return 'bg-sky-700 text-white';
        if (name.includes('SPOT')) return 'bg-orange-500 text-white';
        return 'bg-slate-800 text-white';
    };

    const getRouteColor = (name: string) => {
        if (name.includes('MATARANI')) return 'bg-cyan-700 text-white';
        if (name.includes('MARCONA')) return 'bg-purple-700 text-white';
        if (name.includes('MEJILLONES')) return 'bg-fuchsia-700 text-white';
        return 'bg-slate-700 text-white';
    };

    const getVesselColor = (name: string) => {
        if (name.includes('TABLONES')) return 'bg-rose-700 text-white';
        if (name.includes('MOQUEGUA')) return 'bg-emerald-700 text-white';
        if (name.includes('CONCON')) return 'bg-slate-600 text-white';
        if (name.includes('HUEMUL')) return 'bg-indigo-700 text-white';
        return 'bg-teal-700 text-white';
    };

    const fmtUsd = (val: number) => {
        if (val === 0 || isNaN(val)) return '$ 0.00';
        const isNeg = val < 0;
        const absStr = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return isNeg ? `-$ ${absStr}` : `$ ${absStr}`;
    };

    // Estructurar datos agrupados por Cliente -> Ruta -> Buque
    const clientsData = useMemo(() => {
        if (!data || !data.aggregated_data) return [];
        const clientsList: any[] = [];

        Object.entries(data.aggregated_data).forEach(([clientId, routes]: [string, any]) => {
            const routesList: any[] = [];

            Object.entries(routes || {}).forEach(([routeKey, vessels]: [string, any]) => {
                const vesselsList: any[] = [];

                Object.entries(vessels || {}).forEach(([vesselId, monthsMap]: [string, any]) => {
                    const lineKey = `${clientId}__${routeKey}__${vesselId}`;
                    vesselsList.push({
                        lineKey,
                        clientId,
                        routeKey,
                        vesselId,
                        monthsMap
                    });
                });

                routesList.push({
                    routeKey,
                    vessels: vesselsList
                });
            });

            clientsList.push({
                clientId,
                routes: routesList
            });
        });

        return clientsList;
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

    if (!clientsData.length) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400">
                <span>No hay datos proyectados en el modelo. Selecciona un cliente, ruta y buque en el Ribbon superior y presiona <strong>➕ Añadir al Modelo</strong>.</span>
            </div>
        );
    }

    // Totales Globales Consolidados (Flota Total)
    const globalMonthly = months.map(m => {
        let vent = 0;
        let cDir = 0;
        let arr = 0;
        let pers = 0;
        let nav = 0;

        clientsData.forEach(c => {
            c.routes.forEach((r: any) => {
                r.vessels.forEach((v: any) => {
                    const mData = v.monthsMap[m] || {};
                    const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                    const hire = (Number(mData.gross_income) || (Number(mData.carga_unit || 13500) * Number(mData.flete_unit || 30) * freq));
                    const demRev = Number(mData.demurrage_revenue || mData.demurrage_income || 0) * freq;
                    const ingPto = Number(mData.refacturacion_muellaje || mData.dockage_revenue || 0) * freq;
                    vent += hire + demRev + ingPto;

                    const comb = Number(mData.total_bunker_costs || 0) * (mData.total_bunker_costs_unit ? freq : 1);
                    const pto = Number(mData.total_port_costs || 0) * (mData.total_port_costs_unit ? freq : 1);
                    const demCost = Number(mData.demurrage_hire_cost || mData.costos_demora || 0) * freq;
                    const com = Number(mData.commissions_cost || mData.total_commissions || 0) * freq;
                    cDir += -(comb + pto + demCost + com);

                    arr += -Number(mData.charter_hire_cost || 0) * freq;
                    pers += -Number(mData.personal_cost || 0);
                    nav += -Number(mData.ship_cost || 0);
                });
            });
        });

        const tce = vent + cDir;
        const mb = tce + arr;
        return { vent, cDir, tce, arr, mb, pers, nav };
    });

    const globalTotVent = globalMonthly.reduce((acc, m) => acc + m.vent, 0);
    const globalTotCDir = globalMonthly.reduce((acc, m) => acc + m.cDir, 0);
    const globalTotTce = globalMonthly.reduce((acc, m) => acc + m.tce, 0);
    const globalTotArr = globalMonthly.reduce((acc, m) => acc + m.arr, 0);
    const globalTotMb = globalMonthly.reduce((acc, m) => acc + m.mb, 0);

    return (
        <div className="table-container shadow-xs border border-slate-200 rounded-xl overflow-x-auto bg-white" style={{ fontFamily: "'Segoe UI', 'Inter', sans-serif", fontVariantNumeric: 'tabular-nums' }}>
            <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-900 text-slate-100 text-[10px] font-black uppercase tracking-wider sticky top-0 z-20 select-none shadow-xs">
                    <tr>
                        <th className="py-2 px-1 border-r border-slate-700 w-10 text-center">CLI</th>
                        <th className="py-2 px-1 border-r border-slate-700 w-10 text-center">RUTA</th>
                        <th className="py-2 px-1 border-r border-slate-700 w-10 text-center">BUQ</th>
                        <th className="py-2 px-2 border-r border-slate-700 w-48 text-left">RUBRO NAVITRANSO (P&L)</th>
                        {months.map(m => (
                            <th key={m} className="py-2 px-1 border-r border-slate-700 text-right min-w-[75px]">{m}</th>
                        ))}
                        <th className="py-2 px-2 text-right min-w-[95px] bg-emerald-950 text-emerald-300 font-black border-l border-emerald-800">TOTAL ACUM.</th>
                        <th className="py-2 px-1 text-center w-12 border-l border-slate-700">ACC.</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                    {clientsData.map(clientGroup => {
                        const { clientId, routes } = clientGroup;

                        // Calcular subtotales mensuales del cliente
                        const clientMonthly = months.map(m => {
                            let vent = 0;
                            let cDir = 0;
                            let arr = 0;

                            routes.forEach((r: any) => {
                                r.vessels.forEach((v: any) => {
                                    const mData = v.monthsMap[m] || {};
                                    const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                    const hire = (Number(mData.gross_income) || (Number(mData.carga_unit || 13500) * Number(mData.flete_unit || 30) * freq));
                                    const demRev = Number(mData.demurrage_revenue || mData.demurrage_income || 0) * freq;
                                    const ingPto = Number(mData.refacturacion_muellaje || mData.dockage_revenue || 0) * freq;
                                    vent += hire + demRev + ingPto;

                                    const comb = Number(mData.total_bunker_costs || 0) * (mData.total_bunker_costs_unit ? freq : 1);
                                    const pto = Number(mData.total_port_costs || 0) * (mData.total_port_costs_unit ? freq : 1);
                                    const demCost = Number(mData.demurrage_hire_cost || mData.costos_demora || 0) * freq;
                                    const com = Number(mData.commissions_cost || mData.total_commissions || 0) * freq;
                                    cDir += -(comb + pto + demCost + com);

                                    arr += -Number(mData.charter_hire_cost || 0) * freq;
                                });
                            });

                            const tce = vent + cDir;
                            const mb = tce + arr;
                            return { vent, cDir, tce, arr, mb };
                        });

                        const clientTotVent = clientMonthly.reduce((acc, m) => acc + m.vent, 0);
                        const clientTotCDir = clientMonthly.reduce((acc, m) => acc + m.cDir, 0);
                        const clientTotTce = clientMonthly.reduce((acc, m) => acc + m.tce, 0);
                        const clientTotArr = clientMonthly.reduce((acc, m) => acc + m.arr, 0);
                        const clientTotMb = clientMonthly.reduce((acc, m) => acc + m.mb, 0);

                        return (
                            <React.Fragment key={clientId}>
                                {routes.map((routeGroup: any) => {
                                    const { routeKey, vessels } = routeGroup;

                                    return vessels.map((vesselItem: any) => {
                                        const { lineKey, vesselId, monthsMap } = vesselItem;
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

                                        // Conteo exacto dinámico del rowSpan
                                        let count = 1; // Frecuencia
                                        count += 1; // VENTAS (Subtotal)
                                        count += 1; // HIRE
                                        if (expandedHire[lineKey]) count += 1;
                                        if (!hideNaRows) count += 1; // VENTA DE TERCEROS
                                        count += 1; // DEMORAS
                                        if (expandedDemurrageRev[lineKey]) count += 1;
                                        count += 1; // INGRESOS DE PUERTO
                                        if (expandedPortRev[lineKey]) count += 1;
                                        if (!hideNaRows) count += 1; // OTROS INGRESOS

                                        count += 1; // COSTOS DIRECTOS (Subtotal)
                                        count += 1; // COMBUSTIBLE
                                        if (expandedBunker[lineKey]) count += 3;
                                        count += 1; // GASTOS DE PUERTO
                                        if (expandedPortCosts[lineKey]) count += 2;
                                        count += 1; // COSTOS DE DEMORA
                                        if (expandedDemurrageCost[lineKey]) count += 1;
                                        count += 1; // COMISIONES VARIAS
                                        if (expandedCommissions[lineKey]) count += 1;
                                        if (!hideNaRows) count += 1; // OTROS COSTOS DIRECTOS

                                        count += 1; // TIME CHARTER EQUIVALENT
                                        if (!hideNaRows) count += 1; // COSTO DE ARRIENDO NAVES
                                        count += 1; // MARGEN BRUTO
                                        count += 1; // GTOS. PERSONAL A BORDO
                                        count += 1; // GASTOS DE LA NAVE

                                        const rowBgClass = isModified ? 'bg-amber-50/50' : 'hover:bg-slate-50/80';

                                        return (
                                            <React.Fragment key={lineKey}>
                                                {/* FILA 0: FRECUENCIA CON CELDAS VERTICALES ANGOSTAS */}
                                                <tr className={`border-t-2 border-slate-300 ${rowBgClass}`}>
                                                    {/* CLIENTE (Texto Vertical Compacto) */}
                                                    <td
                                                        rowSpan={count}
                                                        className={`p-0 border-r border-slate-300 font-extrabold text-center align-middle ${getClientColor(clientId)} w-9 select-none`}
                                                        title={`Cliente: ${clientId}`}
                                                    >
                                                        <div className="flex items-center justify-center h-full w-full py-3" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                                            <span className="tracking-widest uppercase text-[11px] font-black whitespace-nowrap">{clientId}</span>
                                                        </div>
                                                    </td>

                                                    {/* RUTA (Texto Vertical Compacto) */}
                                                    <td
                                                        rowSpan={count}
                                                        className={`p-0 border-r border-slate-300 font-bold text-center align-middle ${getRouteColor(routeKey)} w-9 select-none`}
                                                        title={`Ruta: ${routeKey}`}
                                                    >
                                                        <div className="flex items-center justify-center h-full w-full py-3" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                                            <span className="tracking-wide uppercase text-[10px] font-bold whitespace-nowrap">{routeKey}</span>
                                                        </div>
                                                    </td>

                                                    {/* BUQUE (Texto Vertical Compacto) */}
                                                    <td
                                                        rowSpan={count}
                                                        className={`p-0 border-r border-slate-300 font-bold text-center align-middle ${getVesselColor(vesselId)} w-9 select-none`}
                                                        title={`Buque: ${vesselId}`}
                                                    >
                                                        <div className="flex items-center justify-center h-full w-full py-3" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                                            <span className="tracking-wide uppercase text-[10px] font-bold whitespace-nowrap">{vesselId}</span>
                                                        </div>
                                                    </td>

                                                    {/* Métrica 0: FRECUENCIA */}
                                                    <td className="p-1.5 border-r font-extrabold text-sky-900 bg-sky-50/60 flex items-center justify-between">
                                                        <span>🚢 FRECUENCIA VIAJES</span>
                                                        <span className="text-[8.5px] bg-sky-200 text-sky-800 px-1 rounded">Viajes/m</span>
                                                    </td>
                                                    {months.map(m => {
                                                        const mData = monthsMap[m] || {};
                                                        const freqVal = mData.freq !== undefined ? mData.freq : 1;
                                                        return (
                                                            <td key={m} className="p-1 border-r text-right bg-sky-50/30">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="20"
                                                                    value={freqVal}
                                                                    onChange={(e) => {
                                                                        markRowModified(lineKey);
                                                                        handleFrequencyChange(clientId, routeKey, vesselId, m, parseInt(e.target.value) || 0);
                                                                    }}
                                                                    className={`w-11 text-[11px] font-bold text-center border rounded py-0.5 ${isModified ? 'border-amber-400 ring-1 ring-amber-400 bg-amber-50' : 'border-slate-300 bg-white'}`}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="p-1.5 border-r text-right font-black text-sky-950 bg-sky-100 border-l border-slate-200">
                                                        {months.reduce((acc, m) => acc + Number(monthsMap[m]?.freq !== undefined ? monthsMap[m]?.freq : 1), 0)} vjes
                                                    </td>
                                                    <td rowSpan={count} className="p-1 text-center align-middle bg-slate-50 border-l border-slate-200">
                                                        <div className="flex flex-col items-center gap-1">
                                                            {isModified && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSaveRow(lineKey)}
                                                                        title="Guardar frecuencias"
                                                                        className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-xs text-[9px] font-bold cursor-pointer"
                                                                    >
                                                                        <Save size={12} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleResetRow(lineKey)}
                                                                        title="Restablecer"
                                                                        className="p-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-[9px] font-bold cursor-pointer"
                                                                    >
                                                                        <RotateCcw size={12} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteNode('route', clientId, routeKey, vesselId)}
                                                                title="Eliminar ruta"
                                                                className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* ======================================================== */}
                                                {/* 🟢 1. BLOQUE VENTAS                                      */}
                                                {/* ======================================================== */}
                                                <tr className="bg-emerald-100/70 border-t border-emerald-300 font-extrabold text-emerald-950">
                                                    <td className="p-1.5 border-r border-emerald-200 uppercase tracking-wide">
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
                                                            <td key={m} className="p-1.5 border-r border-emerald-200 text-right">
                                                                {fmtUsd(ventasVal)}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="p-1.5 border-r border-emerald-300 text-right font-black bg-emerald-200/80 text-emerald-950">
                                                        {fmtUsd(totVentas)}
                                                    </td>
                                                </tr>

                                                {/* 1.1 HIRE (Acordeón) */}
                                                <tr className="hover:bg-slate-50">
                                                    <td className="p-1 border-r pl-4 flex items-center gap-1 font-bold text-slate-800 cursor-pointer select-none" onClick={() => toggleExpand(setExpandedHire, lineKey)}>
                                                        {expandedHire[lineKey] ? <ChevronDown size={13} className="text-emerald-600" /> : <ChevronRight size={13} className="text-slate-400" />}
                                                        <span>HIRE</span>
                                                    </td>
                                                    {months.map(m => {
                                                        const mData = monthsMap[m] || {};
                                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                                        const val = (Number(mData.gross_income) || (Number(mData.carga_unit || 13500) * Number(mData.flete_unit || 30) * freq));
                                                        return <td key={m} className="p-1 border-r text-right font-semibold text-slate-800">{fmtUsd(val)}</td>;
                                                    })}
                                                    <td className="p-1 border-r text-right font-bold bg-slate-100/60 text-slate-900">{fmtUsd(totHire)}</td>
                                                </tr>
                                                {expandedHire[lineKey] && (
                                                    <tr className="bg-slate-50 text-[9.5px] text-slate-600 italic">
                                                        <td className="p-1 border-r pl-8 text-slate-500">↳ Desglose: Toneladas × Flete Unitario</td>
                                                        {months.map(m => {
                                                            const mData = monthsMap[m] || {};
                                                            const tons = Number(mData.carga_unit || 13500) * Number(mData.freq !== undefined ? mData.freq : 1);
                                                            const rate = Number(mData.flete_unit || 30);
                                                            return <td key={m} className="p-1 border-r text-right text-slate-500">{tons.toLocaleString()} MT @ ${rate}/MT</td>;
                                                        })}
                                                        <td className="p-1 border-r text-right font-medium text-slate-600">Base Flete</td>
                                                    </tr>
                                                )}

                                                {/* 1.2 VENTA DE TERCEROS (Fila N/A) */}
                                                {!hideNaRows && (
                                                    <tr className="bg-slate-50/40 text-slate-400 text-[10.5px]">
                                                        <td className="p-1 border-r pl-4 flex items-center justify-between">
                                                            <span>VENTA DE TERCEROS</span>
                                                            <span className="text-[8px] bg-slate-200 text-slate-600 px-1 rounded">N/A</span>
                                                        </td>
                                                        {months.map(m => <td key={m} className="p-1 border-r text-right text-slate-400">$ 0.00</td>)}
                                                        <td className="p-1 border-r text-right text-slate-400 bg-slate-100/30">$ 0.00</td>
                                                    </tr>
                                                )}

                                                {/* 1.3 DEMORAS (Acordeón) */}
                                                <tr className="hover:bg-slate-50">
                                                    <td className="p-1 border-r pl-4 flex items-center gap-1 font-bold text-slate-800 cursor-pointer select-none" onClick={() => toggleExpand(setExpandedDemurrageRev, lineKey)}>
                                                        {expandedDemurrageRev[lineKey] ? <ChevronDown size={13} className="text-emerald-600" /> : <ChevronRight size={13} className="text-slate-400" />}
                                                        <span>DEMORAS</span>
                                                    </td>
                                                    {months.map(m => {
                                                        const mData = monthsMap[m] || {};
                                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                                        const val = Number(mData.demurrage_revenue || mData.demurrage_income || 0) * freq;
                                                        return <td key={m} className="p-1 border-r text-right font-semibold text-slate-800">{fmtUsd(val)}</td>;
                                                    })}
                                                    <td className="p-1 border-r text-right font-bold bg-slate-100/60 text-slate-900">{fmtUsd(totDemurrageRev)}</td>
                                                </tr>
                                                {expandedDemurrageRev[lineKey] && (
                                                    <tr className="bg-slate-50 text-[9.5px] text-slate-600 italic">
                                                        <td className="p-1 border-r pl-8 text-slate-500">↳ Días Demora × Tarifa Demurrage</td>
                                                        {months.map(m => {
                                                            const mData = monthsMap[m] || {};
                                                            const days = Number(mData.demurrage_days || 0);
                                                            return <td key={m} className="p-1 border-r text-right text-slate-500">{days > 0 ? `${days.toFixed(2)}d @ Tarifa` : '$ 0.00'}</td>;
                                                        })}
                                                        <td className="p-1 border-r text-right font-medium text-slate-600">Demurrage Rate</td>
                                                    </tr>
                                                )}

                                                {/* 1.4 INGRESOS DE PUERTO (Acordeón) */}
                                                <tr className="hover:bg-slate-50">
                                                    <td className="p-1 border-r pl-4 flex items-center gap-1 font-bold text-slate-800 cursor-pointer select-none" onClick={() => toggleExpand(setExpandedPortRev, lineKey)}>
                                                        {expandedPortRev[lineKey] ? <ChevronDown size={13} className="text-emerald-600" /> : <ChevronRight size={13} className="text-slate-400" />}
                                                        <span>INGRESOS DE PUERTO</span>
                                                    </td>
                                                    {months.map(m => {
                                                        const mData = monthsMap[m] || {};
                                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                                        const val = Number(mData.refacturacion_muellaje || mData.dockage_revenue || 0) * freq;
                                                        return <td key={m} className="p-1 border-r text-right font-semibold text-slate-800">{fmtUsd(val)}</td>;
                                                    })}
                                                    <td className="p-1 border-r text-right font-bold bg-slate-100/60 text-slate-900">{fmtUsd(totIngresosPuerto)}</td>
                                                </tr>
                                                {expandedPortRev[lineKey] && (
                                                    <tr className="bg-slate-50 text-[9.5px] text-slate-600 italic">
                                                        <td className="p-1 border-r pl-8 text-slate-500">↳ Refacturación Muellaje [RF]</td>
                                                        {months.map(m => {
                                                            const mData = monthsMap[m] || {};
                                                            const rf = Number(mData.refacturacion_muellaje || 0);
                                                            return <td key={m} className="p-1 border-r text-right text-slate-500">{rf > 0 ? `$${rf.toLocaleString()}` : '$ 0.00'}</td>;
                                                        })}
                                                        <td className="p-1 border-r text-right font-medium text-slate-600">Refacturado</td>
                                                    </tr>
                                                )}

                                                {/* 1.5 OTROS INGRESOS (Fila N/A) */}
                                                {!hideNaRows && (
                                                    <tr className="bg-slate-50/40 text-slate-400 text-[10.5px]">
                                                        <td className="p-1 border-r pl-4 flex items-center justify-between">
                                                            <span>OTROS INGRESOS</span>
                                                            <span className="text-[8px] bg-slate-200 text-slate-600 px-1 rounded">N/A</span>
                                                        </td>
                                                        {months.map(m => <td key={m} className="p-1 border-r text-right text-slate-400">$ 0.00</td>)}
                                                        <td className="p-1 border-r text-right text-slate-400 bg-slate-100/30">$ 0.00</td>
                                                    </tr>
                                                )}

                                                {/* ======================================================== */}
                                                {/* 🔴 2. BLOQUE COSTOS DIRECTOS                             */}
                                                {/* ======================================================== */}
                                                <tr className="bg-rose-100/70 border-t border-rose-300 font-extrabold text-rose-950">
                                                    <td className="p-1.5 border-r border-rose-200 uppercase tracking-wide">
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
                                                            <td key={m} className="p-1.5 border-r border-rose-200 text-right">
                                                                {fmtUsd(costosSubtotal)}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="p-1.5 border-r border-rose-300 text-right font-black bg-rose-200/80 text-rose-950">
                                                        {fmtUsd(totCostosDirectos)}
                                                    </td>
                                                </tr>

                                                {/* 2.1 COMBUSTIBLE (Acordeón) */}
                                                <tr className="hover:bg-slate-50">
                                                    <td className="p-1 border-r pl-4 flex items-center gap-1 font-bold text-rose-900 cursor-pointer select-none" onClick={() => toggleExpand(setExpandedBunker, lineKey)}>
                                                        {expandedBunker[lineKey] ? <ChevronDown size={13} className="text-rose-600" /> : <ChevronRight size={13} className="text-slate-400" />}
                                                        <span>COMBUSTIBLE</span>
                                                    </td>
                                                    {months.map(m => {
                                                        const mData = monthsMap[m] || {};
                                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                                        const val = -Number(mData.total_bunker_costs || 0) * (mData.total_bunker_costs_unit ? freq : 1);
                                                        return <td key={m} className="p-1 border-r text-right font-semibold text-rose-800">{fmtUsd(val)}</td>;
                                                    })}
                                                    <td className="p-1 border-r text-right font-bold bg-slate-100/60 text-rose-950">{fmtUsd(totCombustible)}</td>
                                                </tr>
                                                {expandedBunker[lineKey] && (
                                                    <>
                                                        <tr className="bg-slate-50 text-[9.5px] text-slate-600 italic">
                                                            <td className="p-1 border-r pl-8">↳ Búnker Mar (IFO + MDO Navegación)</td>
                                                            {months.map(m => {
                                                                const mData = monthsMap[m] || {};
                                                                const val = -Number(mData.bunker_sea_cost || (mData.total_bunker_costs ? mData.total_bunker_costs * 0.75 : 0));
                                                                return <td key={m} className="p-1 border-r text-right text-slate-600">{fmtUsd(val)}</td>;
                                                            })}
                                                            <td className="p-1 border-r text-right font-medium">Navegación</td>
                                                        </tr>
                                                        <tr className="bg-slate-50 text-[9.5px] text-slate-600 italic">
                                                            <td className="p-1 border-r pl-8">↳ Búnker Puerto (Operación & Espera)</td>
                                                            {months.map(m => {
                                                                const mData = monthsMap[m] || {};
                                                                const val = -Number(mData.bunker_port_cost || (mData.total_bunker_costs ? mData.total_bunker_costs * 0.20 : 0));
                                                                return <td key={m} className="p-1 border-r text-right text-slate-600">{fmtUsd(val)}</td>;
                                                            })}
                                                            <td className="p-1 border-r text-right font-medium">Puerto</td>
                                                        </tr>
                                                        <tr className="bg-slate-50 text-[9.5px] text-slate-600 italic">
                                                            <td className="p-1 border-r pl-8">↳ Búnker Demoras (Idle en Fondeo)</td>
                                                            {months.map(m => {
                                                                const mData = monthsMap[m] || {};
                                                                const val = -Number(mData.bunker_demurrage_cost || (mData.total_bunker_costs ? mData.total_bunker_costs * 0.05 : 0));
                                                                return <td key={m} className="p-1 border-r text-right text-slate-600">{fmtUsd(val)}</td>;
                                                            })}
                                                            <td className="p-1 border-r text-right font-medium">Demoras</td>
                                                        </tr>
                                                    </>
                                                )}

                                                {/* 2.2 GASTOS DE PUERTO (Acordeón) */}
                                                <tr className="hover:bg-slate-50">
                                                    <td className="p-1 border-r pl-4 flex items-center gap-1 font-bold text-rose-900 cursor-pointer select-none" onClick={() => toggleExpand(setExpandedPortCosts, lineKey)}>
                                                        {expandedPortCosts[lineKey] ? <ChevronDown size={13} className="text-rose-600" /> : <ChevronRight size={13} className="text-slate-400" />}
                                                        <span>GASTOS DE PUERTO</span>
                                                    </td>
                                                    {months.map(m => {
                                                        const mData = monthsMap[m] || {};
                                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                                        const val = -Number(mData.total_port_costs || 0) * (mData.total_port_costs_unit ? freq : 1);
                                                        return <td key={m} className="p-1 border-r text-right font-semibold text-rose-800">{fmtUsd(val)}</td>;
                                                    })}
                                                    <td className="p-1 border-r text-right font-bold bg-slate-100/60 text-rose-950">{fmtUsd(totGastosPuerto)}</td>
                                                </tr>
                                                {expandedPortCosts[lineKey] && (
                                                    <>
                                                        <tr className="bg-slate-50 text-[9.5px] text-slate-600 italic">
                                                            <td className="p-1 border-r pl-8">↳ Agenciamiento & Gastos Puerto Origen (POL)</td>
                                                            {months.map(m => {
                                                                const mData = monthsMap[m] || {};
                                                                const val = -Number(mData.port_cost_origin || (mData.total_port_costs ? mData.total_port_costs * 0.45 : 0));
                                                                return <td key={m} className="p-1 border-r text-right text-slate-600">{fmtUsd(val)}</td>;
                                                            })}
                                                            <td className="p-1 border-r text-right font-medium">Costos POL</td>
                                                        </tr>
                                                        <tr className="bg-slate-50 text-[9.5px] text-slate-600 italic">
                                                            <td className="p-1 border-r pl-8">↳ Agenciamiento & Muellaje Puerto Destino (POD)</td>
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
                                                    <td className="p-1 border-r pl-4 flex items-center gap-1 font-bold text-rose-900 cursor-pointer select-none" onClick={() => toggleExpand(setExpandedDemurrageCost, lineKey)}>
                                                        {expandedDemurrageCost[lineKey] ? <ChevronDown size={13} className="text-rose-600" /> : <ChevronRight size={13} className="text-slate-400" />}
                                                        <span>COSTOS DE DEMORA</span>
                                                    </td>
                                                    {months.map(m => {
                                                        const mData = monthsMap[m] || {};
                                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                                        const val = -Number(mData.demurrage_hire_cost || mData.costos_demora || 0) * freq;
                                                        return <td key={m} className="p-1 border-r text-right font-semibold text-rose-800">{fmtUsd(val)}</td>;
                                                    })}
                                                    <td className="p-1 border-r text-right font-bold bg-slate-100/60 text-rose-950">{fmtUsd(totCostosDemora)}</td>
                                                </tr>
                                                {expandedDemurrageCost[lineKey] && (
                                                    <tr className="bg-slate-50 text-[9.5px] text-slate-600 italic">
                                                        <td className="p-1 border-r pl-8">↳ Costo Nave Parada (Días Demora × TCE Req.)</td>
                                                        {months.map(m => {
                                                            const mData = monthsMap[m] || {};
                                                            const days = Number(mData.demurrage_days || 0);
                                                            const tce = Number(mData.tce_required_unit || 15000);
                                                            return <td key={m} className="p-1 border-r text-right text-slate-500">{days > 0 ? `${days.toFixed(2)}d × $${tce.toLocaleString()}/d` : '$ 0.00'}</td>;
                                                        })}
                                                        <td className="p-1 border-r text-right font-medium text-slate-600">Hire Demora</td>
                                                    </tr>
                                                )}

                                                {/* 2.4 COMISIONES VARIAS (Acordeón) */}
                                                <tr className="hover:bg-slate-50">
                                                    <td className="p-1 border-r pl-4 flex items-center gap-1 font-bold text-rose-900 cursor-pointer select-none" onClick={() => toggleExpand(setExpandedCommissions, lineKey)}>
                                                        {expandedCommissions[lineKey] ? <ChevronDown size={13} className="text-rose-600" /> : <ChevronRight size={13} className="text-slate-400" />}
                                                        <span>COMISIONES VARIAS</span>
                                                    </td>
                                                    {months.map(m => {
                                                        const mData = monthsMap[m] || {};
                                                        const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                                        const val = -Number(mData.commissions_cost || mData.total_commissions || 0) * freq;
                                                        return <td key={m} className="p-1 border-r text-right font-semibold text-rose-800">{fmtUsd(val)}</td>;
                                                    })}
                                                    <td className="p-1 border-r text-right font-bold bg-slate-100/60 text-rose-950">{fmtUsd(totComisiones)}</td>
                                                </tr>
                                                {expandedCommissions[lineKey] && (
                                                    <tr className="bg-slate-50 text-[9.5px] text-slate-600 italic">
                                                        <td className="p-1 border-r pl-8">↳ Address & Broker Commissions</td>
                                                        {months.map(m => {
                                                            const mData = monthsMap[m] || {};
                                                            const comm = Number(mData.commissions_cost || 0);
                                                            return <td key={m} className="p-1 border-r text-right text-slate-500">{comm > 0 ? `-$ ${comm.toLocaleString()}` : '$ 0.00'}</td>;
                                                        })}
                                                        <td className="p-1 border-r text-right font-medium text-slate-600">Comisiones</td>
                                                    </tr>
                                                )}

                                                {/* 2.5 OTROS COSTOS DIRECTOS (Fila N/A) */}
                                                {!hideNaRows && (
                                                    <tr className="bg-slate-50/40 text-slate-400 text-[10.5px]">
                                                        <td className="p-1 border-r pl-4 flex items-center justify-between">
                                                            <span>OTROS COSTOS DIRECTOS</span>
                                                            <span className="text-[8px] bg-slate-200 text-slate-600 px-1 rounded">N/A</span>
                                                        </td>
                                                        {months.map(m => <td key={m} className="p-1 border-r text-right text-slate-400">$ 0.00</td>)}
                                                        <td className="p-1 border-r text-right text-slate-400 bg-slate-100/30">$ 0.00</td>
                                                    </tr>
                                                )}

                                                {/* ======================================================== */}
                                                {/* 🔵 3. TIME CHARTER EQUIVALENT                           */}
                                                {/* ======================================================== */}
                                                <tr className="bg-blue-100/80 border-t-2 border-b border-blue-400 font-black text-blue-950">
                                                    <td className="p-1.5 border-r border-blue-300 uppercase tracking-wide">
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
                                                            <td key={m} className="p-1.5 border-r border-blue-300 text-right font-black">
                                                                {fmtUsd(tceVal)}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="p-1.5 border-r border-blue-400 text-right font-black bg-blue-200 text-blue-950">
                                                        {fmtUsd(totTce)}
                                                    </td>
                                                </tr>

                                                {/* 3.1 COSTO DE ARRIENDO NAVES */}
                                                {!hideNaRows && (
                                                    <tr className="hover:bg-slate-50 text-slate-700 text-[10.5px]">
                                                        <td className="p-1 border-r pl-4 flex items-center justify-between font-semibold">
                                                            <span>COSTO DE ARRIENDO NAVES</span>
                                                            <span className="text-[8px] bg-slate-100 text-slate-500 px-1 rounded">Charter</span>
                                                        </td>
                                                        {months.map(m => {
                                                            const mData = monthsMap[m] || {};
                                                            const freq = Number(mData.freq !== undefined ? mData.freq : 1);
                                                            const val = -Number(mData.charter_hire_cost || 0) * freq;
                                                            return <td key={m} className="p-1 border-r text-right font-semibold">{fmtUsd(val)}</td>;
                                                        })}
                                                        <td className="p-1 border-r text-right font-bold bg-slate-100/60">{fmtUsd(totArriendo)}</td>
                                                    </tr>
                                                )}

                                                {/* ======================================================== */}
                                                {/* 🏆 4. MARGEN BRUTO                                      */}
                                                {/* ======================================================== */}
                                                <tr className="bg-emerald-200/90 border-t-2 border-b-2 border-emerald-500 font-black text-emerald-950">
                                                    <td className="p-1.5 border-r border-emerald-300 uppercase tracking-wide">
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
                                                            <td key={m} className="p-1.5 border-r border-emerald-300 text-right font-black">
                                                                {fmtUsd(mbVal)}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="p-1.5 border-r border-emerald-500 text-right font-black bg-emerald-300 text-emerald-950">
                                                        {fmtUsd(totMargenBruto)}
                                                    </td>
                                                </tr>

                                                {/* ======================================================== */}
                                                {/* ⚪ 5. OPEX / COSTOS FIJOS                                */}
                                                {/* ======================================================== */}
                                                <tr className="hover:bg-slate-50 text-slate-600 text-[10.5px]">
                                                    <td className="p-1 border-r pl-4 flex items-center justify-between font-semibold">
                                                        <span>GTOS. PERSONAL A BORDO</span>
                                                        <span className="text-[8px] bg-slate-100 text-slate-500 px-1 rounded">OPEX</span>
                                                    </td>
                                                    {months.map(m => {
                                                        const mData = monthsMap[m] || {};
                                                        const val = -Number(mData.personal_cost || 0);
                                                        return <td key={m} className="p-1 border-r text-right font-semibold">{fmtUsd(val)}</td>;
                                                    })}
                                                    <td className="p-1 border-r text-right font-bold bg-slate-100/60">{fmtUsd(totPersonal)}</td>
                                                </tr>

                                                <tr className="hover:bg-slate-50 text-slate-600 text-[10.5px]">
                                                    <td className="p-1 border-r pl-4 flex items-center justify-between font-semibold">
                                                        <span>GASTOS DE LA NAVE</span>
                                                        <span className="text-[8px] bg-slate-100 text-slate-500 px-1 rounded">OPEX</span>
                                                    </td>
                                                    {months.map(m => {
                                                        const mData = monthsMap[m] || {};
                                                        const val = -Number(mData.ship_cost || 0);
                                                        return <td key={m} className="p-1 border-r text-right font-semibold">{fmtUsd(val)}</td>;
                                                    })}
                                                    <td className="p-1 border-r text-right font-bold bg-slate-100/60">{fmtUsd(totNave)}</td>
                                                </tr>

                                            </React.Fragment>
                                        );
                                    });
                                })}

                                {/* =================================================================== */}
                                {/* 📊 RESUMEN / SUBTOTAL CONSOLIDADO POR CLIENTE                       */}
                                {/* =================================================================== */}
                                {showSubtotals && (
                                    <tr className="bg-amber-100/80 border-t-2 border-b border-amber-300 font-extrabold text-amber-950">
                                        <td colSpan={4} className="p-2 border-r border-amber-300 text-left uppercase tracking-wider pl-4">
                                            📊 SUBTOTAL CLIENTE: <span className="font-black text-amber-900">{clientId}</span>
                                        </td>
                                        {clientMonthly.map((cm, idx) => (
                                            <td key={idx} className="p-1.5 border-r border-amber-200 text-right font-black">
                                                {fmtUsd(cm.mb)}
                                            </td>
                                        ))}
                                        <td className="p-1.5 border-r border-amber-300 text-right font-black bg-amber-200 text-amber-950">
                                            {fmtUsd(clientTotMb)}
                                        </td>
                                        <td className="p-1 text-center bg-amber-50"></td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}

                    {/* =================================================================== */}
                    {/* 🏆 BLOQUE TOTAL FLOTA CONSOLIDADA (ESTÁNDAR NAVITRANSO)             */}
                    {/* =================================================================== */}
                    {showAccumulatedTotal && (
                        <>
                            {/* TOTAL VENTAS FLOTA */}
                            <tr className="bg-emerald-900 text-emerald-100 border-t-4 border-emerald-500 font-black tracking-wide">
                                <td colSpan={4} className="p-2 border-r border-emerald-800 uppercase tracking-widest pl-4 text-xs">
                                    🟢 TOTAL VENTAS CONSOLIDADAS (FLOTA)
                                </td>
                                {globalMonthly.map((gm, idx) => (
                                    <td key={idx} className="p-2 border-r border-emerald-800 text-right font-mono text-xs font-black">
                                        {fmtUsd(gm.vent)}
                                    </td>
                                ))}
                                <td className="p-2 border-r border-emerald-700 text-right font-mono text-xs font-black bg-emerald-950 text-emerald-300">
                                    {fmtUsd(globalTotVent)}
                                </td>
                                <td className="p-1 text-center bg-emerald-950"></td>
                            </tr>

                            {/* TOTAL COSTOS DIRECTOS FLOTA */}
                            <tr className="bg-rose-900 text-rose-100 border-t border-rose-700 font-black tracking-wide">
                                <td colSpan={4} className="p-2 border-r border-rose-800 uppercase tracking-widest pl-4 text-xs">
                                    🔴 TOTAL COSTOS DIRECTOS (FLOTA)
                                </td>
                                {globalMonthly.map((gm, idx) => (
                                    <td key={idx} className="p-2 border-r border-rose-800 text-right font-mono text-xs font-black">
                                        {fmtUsd(gm.cDir)}
                                    </td>
                                ))}
                                <td className="p-2 border-r border-rose-700 text-right font-mono text-xs font-black bg-rose-950 text-rose-300">
                                    {fmtUsd(globalTotCDir)}
                                </td>
                                <td className="p-1 text-center bg-rose-950"></td>
                            </tr>

                            {/* TOTAL TIME CHARTER EQUIVALENT FLOTA */}
                            <tr className="bg-blue-900 text-blue-100 border-t border-blue-700 font-black tracking-wide">
                                <td colSpan={4} className="p-2 border-r border-blue-800 uppercase tracking-widest pl-4 text-xs">
                                    🔵 TOTAL TIME CHARTER EQUIVALENT (TCE)
                                </td>
                                {globalMonthly.map((gm, idx) => (
                                    <td key={idx} className="p-2 border-r border-blue-800 text-right font-mono text-xs font-black">
                                        {fmtUsd(gm.tce)}
                                    </td>
                                ))}
                                <td className="p-2 border-r border-blue-700 text-right font-mono text-xs font-black bg-blue-950 text-blue-300">
                                    {fmtUsd(globalTotTce)}
                                </td>
                                <td className="p-1 text-center bg-blue-950"></td>
                            </tr>

                            {/* TOTAL MARGEN BRUTO FLOTA */}
                            <tr className="bg-emerald-950 text-white border-t-2 border-b-4 border-emerald-400 font-black tracking-wide text-sm">
                                <td colSpan={4} className="p-2.5 border-r border-emerald-800 uppercase tracking-widest pl-4 text-xs font-black text-emerald-300">
                                    🏆 TOTAL MARGEN BRUTO CONSOLIDADO (P&L)
                                </td>
                                {globalMonthly.map((gm, idx) => (
                                    <td key={idx} className="p-2.5 border-r border-emerald-800 text-right font-mono text-xs font-black text-emerald-200">
                                        {fmtUsd(gm.mb)}
                                    </td>
                                ))}
                                <td className="p-2.5 border-r border-emerald-700 text-right font-mono text-xs font-black bg-black text-emerald-400">
                                    {fmtUsd(globalTotMb)}
                                </td>
                                <td className="p-1 text-center bg-black"></td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>
        </div>
    );
};
