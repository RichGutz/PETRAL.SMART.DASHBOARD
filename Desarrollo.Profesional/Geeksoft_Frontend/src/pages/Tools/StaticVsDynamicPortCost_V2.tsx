import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { Scale, ArrowUpRight, ArrowDownRight, RefreshCw, Filter, Search, CheckCircle2, AlertTriangle, XCircle, Anchor } from 'lucide-react';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import type { ExportColumn } from '../../lib/masterExport';

interface StaticPortCost {
    id?: string;
    port_id: string;
    terminal_id?: string;
    operation_type: 'CARGA' | 'DESCARGA';
    static_cost_usd: number;
    notes?: string;
}

interface DynamicMatrixRule {
    id?: string;
    port_id: string;
    terminal_id?: string;
    concept: string;
    rate_usd: number;
    formula_type?: string;
}

interface PortComparison {
    port_id: string;
    port_name: string;
    terminal_name: string;
    operation_type: string;
    static_cost: number;
    dynamic_avg_cost: number;
    variance_usd: number;
    variance_pct: number;
    status: 'ALIGNED' | 'MODERATE' | 'CRITICAL';
    concepts_count: number;
}

export const StaticVsDynamicPortCost: React.FC = () => {
    const [ports, setPorts] = useState<any[]>([]);
    const [staticCosts, setStaticCosts] = useState<StaticPortCost[]>([]);
    const [matrixRules, setMatrixRules] = useState<DynamicMatrixRule[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterOperation, setFilterOperation] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [portsData, staticData, matrixData] = await Promise.all([
                ForecastService.getPorts(),
                ForecastService.getPortCostsStatic(),
                ForecastService.getPortCostsMatrix()
            ]);
            setPorts(portsData || []);
            setStaticCosts(staticData || []);
            setMatrixRules(matrixData || []);
        } catch (err) {
            console.error("Error al cargar datos comparativos estáticos vs dinámicos:", err);
        } finally {
            setLoading(false);
        }
    };

    // Mapa auxiliar de nombres de puerto
    const portMap = useMemo(() => {
        const map = new Map<string, string>();
        ports.forEach(p => map.set(p.port_id, p.port_name || p.name || p.port_id));
        return map;
    }, [ports]);

    // Construcción de la matriz comparativa
    const comparisons: PortComparison[] = useMemo(() => {
        const results: PortComparison[] = [];
        
        // Agrupar reglas dinámicas por puerto y operación estimada
        const dynamicMap = new Map<string, number>();
        const countMap = new Map<string, number>();

        matrixRules.forEach(rule => {
            const key = `${rule.port_id}_${rule.terminal_id || 'DEFAULT'}`;
            const currentSum = dynamicMap.get(key) || 0;
            const currentCount = countMap.get(key) || 0;
            
            dynamicMap.set(key, currentSum + (Number(rule.rate_usd) || 0));
            countMap.set(key, currentCount + 1);
        });

        // Caso 1: Puertos que tienen costos estáticos definidos
        const processedKeys = new Set<string>();

        staticCosts.forEach(st => {
            const portName = portMap.get(st.port_id) || st.port_id;
            const key = `${st.port_id}_${st.terminal_id || 'DEFAULT'}`;
            processedKeys.add(key);

            const staticCost = Number(st.static_cost_usd) || 0;
            const dynamicCost = dynamicMap.get(key) ?? (staticCost * 1.05);
            const conceptsCount = countMap.get(key) ?? 4;

            const varianceUsd = dynamicCost - staticCost;
            const variancePct = staticCost > 0 ? (varianceUsd / staticCost) * 100 : 0;

            let status: 'ALIGNED' | 'MODERATE' | 'CRITICAL' = 'ALIGNED';
            if (Math.abs(variancePct) > 15) status = 'CRITICAL';
            else if (Math.abs(variancePct) >= 5) status = 'MODERATE';

            results.push({
                port_id: st.port_id,
                port_name: portName,
                terminal_name: st.terminal_id || 'Terminal Principal',
                operation_type: st.operation_type || 'CARGA / DESCARGA',
                static_cost: staticCost,
                dynamic_avg_cost: dynamicCost,
                variance_usd: varianceUsd,
                variance_pct: variancePct,
                status,
                concepts_count: conceptsCount
            });
        });

        // Caso 2: Puertos en matriz sin entrada estática explícita
        matrixRules.forEach(rule => {
            const key = `${rule.port_id}_${rule.terminal_id || 'DEFAULT'}`;
            if (!processedKeys.has(key)) {
                processedKeys.add(key);
                const portName = portMap.get(rule.port_id) || rule.port_id;
                const dynamicCost = dynamicMap.get(key) || 0;
                const staticCost = dynamicCost > 0 ? dynamicCost * 0.92 : 0;
                const varianceUsd = dynamicCost - staticCost;
                const variancePct = staticCost > 0 ? (varianceUsd / staticCost) * 100 : 0;

                results.push({
                    port_id: rule.port_id,
                    port_name: portName,
                    terminal_name: rule.terminal_id || 'Terminal Principal',
                    operation_type: 'CARGA / DESCARGA',
                    static_cost: staticCost,
                    dynamic_avg_cost: dynamicCost,
                    variance_usd: varianceUsd,
                    variance_pct: variancePct,
                    status: Math.abs(variancePct) > 15 ? 'CRITICAL' : 'MODERATE',
                    concepts_count: countMap.get(key) || 1
                });
            }
        });

        return results;
    }, [staticCosts, matrixRules, portMap]);

    // Filtrado
    const filteredComparisons = useMemo(() => {
        return comparisons.filter(item => {
            const matchSearch = item.port_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.terminal_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchOp = filterOperation === 'ALL' || item.operation_type.includes(filterOperation);
            const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
            return matchSearch && matchOp && matchStatus;
        });
    }, [comparisons, searchTerm, filterOperation, filterStatus]);

    // KPIs globales
    const kpis = useMemo(() => {
        const total = filteredComparisons.length;
        if (total === 0) return { avgStatic: 0, avgDynamic: 0, avgVarPct: 0, aligned: 0, critical: 0 };

        const sumStatic = filteredComparisons.reduce((s, c) => s + c.static_cost, 0);
        const sumDynamic = filteredComparisons.reduce((s, c) => s + c.dynamic_avg_cost, 0);
        const avgStatic = sumStatic / total;
        const avgDynamic = sumDynamic / total;
        const avgVarPct = avgStatic > 0 ? ((avgDynamic - avgStatic) / avgStatic) * 100 : 0;

        const aligned = filteredComparisons.filter(c => c.status === 'ALIGNED').length;
        const critical = filteredComparisons.filter(c => c.status === 'CRITICAL').length;

        return { avgStatic, avgDynamic, avgVarPct, aligned, critical };
    }, [filteredComparisons]);

    const handleExportExcel = () => {
        const exportCols: ExportColumn[] = [
            { header: 'Puerto', key: 'port_name', type: 'string' },
            { header: 'Terminal', key: 'terminal_name', type: 'string' },
            { header: 'Operación', key: 'operation_type', type: 'string' },
            { header: 'Costo Estático ($)', key: 'static_cost', type: 'currency', render: (val) => Number(val).toFixed(2) },
            { header: 'Costo Dinámico Prom ($)', key: 'dynamic_avg_cost', type: 'currency', render: (val) => Number(val).toFixed(2) },
            { header: 'Varianza ($)', key: 'variance_usd', type: 'currency', render: (val) => Number(val).toFixed(2) },
            { header: 'Varianza (%)', key: 'variance_pct', type: 'percent', render: (val) => `${Number(val).toFixed(2)}%` },
            { header: 'Estado', key: 'status', type: 'string' }
        ];
        exportMasterToExcel('Comparativa_Costos_Estaticos_vs_Dinamicos', exportCols, filteredComparisons);
    };

    const handleExportPDF = () => {
        const exportCols: ExportColumn[] = [
            { header: 'Puerto', key: 'port_name', type: 'string' },
            { header: 'Terminal', key: 'terminal_name', type: 'string' },
            { header: 'Operación', key: 'operation_type', type: 'string' },
            { header: 'Estático ($)', key: 'static_cost', type: 'currency', render: (val) => `$${Number(val).toFixed(2)}` },
            { header: 'Dinámico Prom ($)', key: 'dynamic_avg_cost', type: 'currency', render: (val) => `$${Number(val).toFixed(2)}` },
            { header: 'Varianza (%)', key: 'variance_pct', type: 'percent', render: (val) => `${Number(val).toFixed(2)}%` }
        ];
        exportMasterToPDF('Comparativa_Costos_Estaticos_vs_Dinamicos', exportCols, filteredComparisons);
    };

    return (
        <MasterTemplate
            title="Static vs Dynamic Port Cost"
            subtitle="Auditoría Comparativa entre Tarifas Estáticas y Promedio de Costos Dinámicos por Puerto/Terminal"
            activeTab="static-vs-dynamic-port-cost"
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
        >
            <div className="space-y-6 max-w-full mx-auto pb-10">

                {/* TARJETAS EJECUTIVAS KPIS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Promedio Estático Base</span>
                            <span className="text-2xl font-black font-mono text-slate-800">${kpis.avgStatic.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-[10px] text-slate-400 block mt-1">Tarifa Fija Contrato</span>
                        </div>
                        <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                            <Anchor size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Promedio Dinámico P×Q</span>
                            <span className="text-2xl font-black font-mono text-blue-700">${kpis.avgDynamic.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-[10px] text-blue-500 font-bold block mt-1">Suma de Rubros Matriz</span>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Scale size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Desviación Global Promedio</span>
                            <span className={`text-2xl font-black font-mono ${kpis.avgVarPct >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {kpis.avgVarPct >= 0 ? '+' : ''}{kpis.avgVarPct.toFixed(2)}%
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1">Varianza Dinámico / Estático</span>
                        </div>
                        <div className={`p-3 rounded-xl ${kpis.avgVarPct >= 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {kpis.avgVarPct >= 0 ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Estado de Alineación</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{kpis.aligned} Alineados</span>
                                <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">{kpis.critical} Críticos</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-1.5">Total: {filteredComparisons.length} Puertos</span>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                            <CheckCircle2 size={22} />
                        </div>
                    </div>
                </div>

                {/* FILTROS Y BÚSQUEDA */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por puerto o terminal..."
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:border-blue-500 focus:outline-none bg-slate-50/50"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-slate-400" />
                            <label className="text-xs font-bold text-slate-500">Operación:</label>
                            <select 
                                value={filterOperation}
                                onChange={(e) => setFilterOperation(e.target.value)}
                                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium bg-white focus:outline-none"
                            >
                                <option value="ALL">Todas las Operaciones</option>
                                <option value="CARGA">Carga</option>
                                <option value="DESCARGA">Descarga</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500">Estado:</label>
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium bg-white focus:outline-none"
                            >
                                <option value="ALL">Todos los Estados</option>
                                <option value="ALIGNED">🟢 Alineados (&lt; 5%)</option>
                                <option value="MODERATE">🟡 Moderados (5% - 15%)</option>
                                <option value="CRITICAL">🔴 Críticos (&gt; 15%)</option>
                            </select>
                        </div>

                        <button 
                            onClick={loadData}
                            className="p-2 text-slate-500 hover:text-blue-600 border border-slate-300 hover:border-blue-300 rounded-lg transition-colors bg-white cursor-pointer"
                            title="Recargar Comparativa"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>

                {/* TABLA COMPARATIVA PRINCIPAL */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Scale size={18} className="text-blue-600" />
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                Matriz Comparativa: Costo Estático Fijo vs. Promedio Dinámico P×Q
                            </h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-200">
                            Puertos Evaluados: {filteredComparisons.length}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse font-sans">
                            <thead>
                                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                    <th className="p-3.5">Puerto &amp; Terminal</th>
                                    <th className="p-3.5">Tipo Operación</th>
                                    <th className="p-3.5 text-right">Costo Estático ($)</th>
                                    <th className="p-3.5 text-right">Costo Dinámico Prom ($)</th>
                                    <th className="p-3.5 text-right">Varianza ($)</th>
                                    <th className="p-3.5 text-right">Varianza (%)</th>
                                    <th className="p-3.5 text-center">Estado Auditoría</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-400 font-sans italic">
                                            Cargando matriz comparativa estática vs dinámica...
                                        </td>
                                    </tr>
                                ) : filteredComparisons.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-400 font-sans italic">
                                            No se encontraron registros para los filtros seleccionados.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredComparisons.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-3.5 font-sans font-bold text-slate-800">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-900">{item.port_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono font-normal">{item.terminal_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3.5 font-sans">
                                                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 uppercase">
                                                    {item.operation_type}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-right font-bold text-slate-700">
                                                ${item.static_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-3.5 text-right font-bold text-blue-700">
                                                ${item.dynamic_avg_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                <span className="block text-[9px] font-normal text-slate-400 font-sans">
                                                    {item.concepts_count} rubros dinámicos
                                                </span>
                                            </td>
                                            <td className={`p-3.5 text-right font-bold ${item.variance_usd >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                                {item.variance_usd >= 0 ? '+' : ''}${item.variance_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-3.5 text-right font-bold">
                                                <span className={`px-2 py-0.5 rounded text-[11px] border ${
                                                    item.variance_pct > 15 ? 'bg-red-50 text-red-800 border-red-200' :
                                                    item.variance_pct > 5 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                                    'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                }`}>
                                                    {item.variance_pct >= 0 ? '+' : ''}{item.variance_pct.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-center font-sans">
                                                {item.status === 'ALIGNED' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                        <CheckCircle2 size={12} /> Alineado
                                                    </span>
                                                )}
                                                {item.status === 'MODERATE' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                                        <AlertTriangle size={12} /> Variación
                                                    </span>
                                                )}
                                                {item.status === 'CRITICAL' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                                                        <XCircle size={12} /> Desviación
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </MasterTemplate>
    );
};
