import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { Anchor, Save, Ship, Clock, FileSpreadsheet } from 'lucide-react';
import { DynamicAuditViewer } from '../../components/Masters/DynamicAuditViewer';
import { BandasResumenViewer } from '../../components/Masters/BandasResumenViewer';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import type { ExportColumn } from '../../lib/masterExport';
import { useAuth } from '../../context/AuthContext';

// Helper para obtener código ISO de 2 letras y nombre limpio de país
const getCountryInfo = (countryStr: string) => {
    if (!countryStr) return { code: 'pe', name: '-', color: '#64748b' };
    const c = countryStr.trim().toUpperCase();
    if (c === 'PE' || c === 'PERU' || c === 'PERÚ') return { code: 'pe', name: 'Perú', color: '#dc2626' };
    if (c === 'CL' || c === 'CHILE') return { code: 'cl', name: 'Chile', color: '#2563eb' };
    if (c === 'EC' || c === 'ECUADOR') return { code: 'ec', name: 'Ecuador', color: '#ca8a04' };
    const fallbackCode = countryStr.slice(0, 2).toLowerCase();
    return { code: fallbackCode, name: countryStr, color: '#64748b' };
};

// Helper de normalización universal de buques
const normalizeVesselKey = (vId: string) => {
    if (!vId) return '';
    return vId.toUpperCase()
        .replace(/^B\/?T\s*/, '')
        .replace(/[\s_-]+/g, '');
};

export const PortCostsMaster_V2: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Configuración Inicial
    const [mode, setMode] = useState<'static' | 'matrix' | 'bandas'>('static');
    
    // Maestros
    const [ports, setPorts] = useState<any[]>([]);
    const [vessels, setVessels] = useState<any[]>([]);
    
    // Estado de costos: costsState[portId][vesselKey][operation][subOp]
    const [costsState, setCostsState] = useState<any>({});
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    
    // Selección Activa
    const [activePortId, setActivePortId] = useState('');

    const formatCostValue = (value: number | undefined | null) => {
        if (value == null || isNaN(value)) return '';
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [portsData, vesselsData, staticCostsData] = await Promise.all([
                ForecastService.getPorts(),
                ForecastService.getVessels(),
                ForecastService.getPortCostsStatic()
            ]);

            const sortedPorts = [...(portsData || [])].sort((a: any, b: any) => {
                const latA = a.lat !== undefined && a.lat !== null ? parseFloat(a.lat) : 0;
                const latB = b.lat !== undefined && b.lat !== null ? parseFloat(b.lat) : 0;
                return latB - latA;
            });

            setPorts(sortedPorts);
            setVessels(vesselsData || []);
            
            const newState: any = {};
            (staticCostsData || []).forEach((row: any) => {
                const portId = (row.port_id || '').toUpperCase();
                const rawVesselId = (row.vessel_id || '').toUpperCase();
                const vKey = normalizeVesselKey(rawVesselId);
                const op = (row.operation_type || 'CARGA').toUpperCase();
                const subOp = row.sub_operation_type || 'MAIN';

                if (!newState[portId]) newState[portId] = {};
                if (!newState[portId][vKey]) {
                    newState[portId][vKey] = {
                        CARGA: { MAIN: 0, loading_master: 0, muellaje: 0, other: 0 },
                        DESCARGA: { MAIN: 0, loading_master: 0, muellaje: 0, other: 0 },
                        updated_at: row.updated_at || null,
                        updated_by: row.updated_by || null,
                        raw_vessel_id: rawVesselId
                    };
                }

                if (newState[portId][vKey][op]) {
                    newState[portId][vKey][op][subOp] = Number(row.cost || 0);
                }
            });
            setCostsState(newState);
            
            // SELECCIÓN AUTOMÁTICA DEL PRIMER PUERTO AL CARGAR
            if (sortedPorts?.length > 0) {
                setActivePortId(sortedPorts[0].port_id);
            }
        } catch (error) {
            console.error('Error al cargar maestro de costos portuarios:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCostChange = (portId: string, vesselId: string, operation: 'CARGA' | 'DESCARGA', subOp: string, value: string) => {
        const cleanValue = value.replace(/,/g, '');
        const numValue = parseFloat(cleanValue) || 0;
        const vKey = normalizeVesselKey(vesselId);
        const upperPortId = (portId || '').toUpperCase().trim();

        setCostsState((prev: any) => {
            const next = { ...prev };
            if (!next[upperPortId]) next[upperPortId] = {};
            if (!next[upperPortId][vKey]) {
                next[upperPortId][vKey] = {
                    CARGA: { MAIN: 0, loading_master: 0, muellaje: 0, other: 0 },
                    DESCARGA: { MAIN: 0, loading_master: 0, muellaje: 0, other: 0 },
                    updated_at: null,
                    updated_by: null,
                    raw_vessel_id: vesselId
                };
            }
            if (!next[upperPortId][vKey][operation]) {
                next[upperPortId][vKey][operation] = { MAIN: 0, loading_master: 0, other: 0 };
            }
            next[upperPortId][vKey][operation][subOp] = numValue;
            return next;
        });
    };

    const handleSaveGlobal = async () => {
        try {
            setSaving(true);
            const payload: any[] = [];
            const seenKeys = new Set<string>();
            
            Object.keys(costsState).forEach(portId => {
                const cleanPortId = (portId || '').toUpperCase().trim();
                if (!cleanPortId) return;

                Object.keys(costsState[portId]).forEach(vKey => {
                    const costData = costsState[portId][vKey];
                    const targetVesselId = costData.raw_vessel_id || vKey;
                    if (!targetVesselId) return;
                    
                    const currentUser = user?.full_name || user?.email || 'USUARIO';
                    const subOps = ['MAIN', 'loading_master', 'muellaje', 'other'];
                    subOps.forEach(subOp => {
                        const cargaVal = costData.CARGA?.[subOp] ?? 0;
                        const descargaVal = costData.DESCARGA?.[subOp] ?? 0;
                        
                        const cargaKey = `${cleanPortId}|CARGA|${targetVesselId}|${subOp}`;
                        if (!seenKeys.has(cargaKey)) {
                            seenKeys.add(cargaKey);
                            payload.push({
                                client_id: 'PETRAL',
                                port_id: cleanPortId,
                                operation_type: 'CARGA',
                                vessel_id: targetVesselId,
                                sub_operation_type: subOp,
                                cost: cargaVal,
                                updated_by: currentUser
                            });
                        }
                        
                        const descargaKey = `${cleanPortId}|DESCARGA|${targetVesselId}|${subOp}`;
                        if (!seenKeys.has(descargaKey)) {
                            seenKeys.add(descargaKey);
                            payload.push({
                                client_id: 'PETRAL',
                                port_id: cleanPortId,
                                operation_type: 'DESCARGA',
                                vessel_id: targetVesselId,
                                sub_operation_type: subOp,
                                cost: descargaVal,
                                updated_by: currentUser
                            });
                        }
                    });
                });
            });
            
            await ForecastService.savePortCostsStatic(payload);
            await fetchData();
            alert("Costos portuarios guardados exitosamente.");
        } catch (error) {
            console.error("Error al guardar costos:", error);
            alert("Ocurrió un error al guardar los costos.");
        } finally {
            setSaving(false);
        }
    };

    const currentPort = ports.find(p => p.port_id === activePortId);
    const activeCountry = (currentPort?.country || "PE").toUpperCase();
    const uniqueCountries = Array.from(new Set(ports.map(p => (p.country || "PE").toUpperCase()))).sort((a, b) => {
        const order: Record<string, number> = { 'PERU': 1, 'PERÚ': 1, 'PE': 1, 'CHILE': 2, 'CL': 2, 'ECUADOR': 3, 'EC': 3 };
        return (order[a] || 99) - (order[b] || 99);
    });
    const portsForCountry = ports.filter(p => (p.country || "PE").toUpperCase() === activeCountry);

    // AUTO-SELECCIÓN DEL PRIMER PUERTO DEL PAÍS AL CAMBIAR DE PESTAÑA DE PAÍS
    const handleCountryClick = (countryCode: string) => {
        const firstPortOfCountry = ports.find(p => (p.country || "PE").toUpperCase() === countryCode);
        if (firstPortOfCountry) {
            setActivePortId(firstPortOfCountry.port_id);
        }
    };

    // GARANTIZAR PUERTO SELECCIONADO SIEMPRE DE FORMA AUTO-CORRECTIVA
    const effectiveActivePortId = useMemo(() => {
        if (portsForCountry.some(p => p.port_id === activePortId)) {
            return activePortId;
        }
        return portsForCountry[0]?.port_id || activePortId || ports[0]?.port_id || '';
    }, [activePortId, portsForCountry, ports]);

    // EXPORTADOR COMPLETO DE PLANTILLA EXCEL PARA TODOS LOS PUERTOS Y BUQUES
    const exportData = useMemo(() => {
        const rows: any[] = [];
        
        // Iterar sobre TODOS los puertos del catálogo maestro
        ports.forEach(portObj => {
            const portId = portObj.port_id;
            const portName = portObj.port_name || portId;
            const portCountry = (portObj.country || 'PE').toUpperCase();

            // Iterar sobre TODOS los buques de la flota
            vessels.forEach(vesselObj => {
                const vesselId = vesselObj.vessel_id;
                const vesselName = vesselObj.vessel_name || vesselId;
                const vKey = normalizeVesselKey(vesselId);

                // Extraer datos del estado o inicializar en ceros para la plantilla
                const data = (costsState[portId] && costsState[portId][vKey]) 
                    ? costsState[portId][vKey]
                    : { CARGA: { MAIN: 0, loading_master: 0, muellaje: 0, other: 0 }, DESCARGA: { MAIN: 0, loading_master: 0, muellaje: 0, other: 0 } };

                // Fila Operación CARGA
                const cMain = data.CARGA?.MAIN || 0;
                const cLm = data.CARGA?.loading_master || 0;
                const cMuellaje = data.CARGA?.muellaje || 0;
                const cOther = data.CARGA?.other || 0;
                const cTotal = cMain + cLm + cMuellaje + cOther;

                rows.push({
                    country: portCountry,
                    port_id: portId,
                    port_name: portName,
                    client_name: 'PETRAL',
                    vessel_id: vesselId,
                    vessel_name: vesselName,
                    operation: 'Carga',
                    main_cost: cMain,
                    lm_cost: cLm,
                    muellaje_cost: cMuellaje,
                    other_cost: cOther,
                    total_cost: cTotal
                });

                // Fila Operación DESCARGA
                const dMain = data.DESCARGA?.MAIN || 0;
                const dLm = data.DESCARGA?.loading_master || 0;
                const dMuellaje = data.DESCARGA?.muellaje || 0;
                const dOther = data.DESCARGA?.other || 0;
                const dTotal = dMain + dLm + dMuellaje + dOther;

                rows.push({
                    country: portCountry,
                    port_id: portId,
                    port_name: portName,
                    client_name: 'PETRAL',
                    vessel_id: vesselId,
                    vessel_name: vesselName,
                    operation: 'Descarga',
                    main_cost: dMain,
                    lm_cost: dLm,
                    muellaje_cost: dMuellaje,
                    other_cost: dOther,
                    total_cost: dTotal
                });
            });
        });

        return rows;
    }, [costsState, ports, vessels]);

    const exportColumns: ExportColumn[] = [
        { header: 'País', key: 'country', type: 'string' },
        { header: 'ID Puerto', key: 'port_id', type: 'string' },
        { header: 'Puerto', key: 'port_name', type: 'string' },
        { header: 'ID Buque', key: 'vessel_id', type: 'string' },
        { header: 'Buque', key: 'vessel_name', type: 'string' },
        { header: 'Operación', key: 'operation', type: 'string' },
        { header: 'Costo Agencia (USD)', key: 'main_cost', type: 'currency' },
        { header: 'Loading Master (USD)', key: 'lm_cost', type: 'currency' },
        { header: 'Muellaje (USD)', key: 'muellaje_cost', type: 'currency' },
        { header: 'Otros Costos (USD)', key: 'other_cost', type: 'currency' },
        { header: 'Costo Total (USD)', key: 'total_cost', type: 'currency' }
    ];

    const handleExportExcel = () => {
        exportMasterToExcel('Plantilla_Maestro_Costos_Estaticos_PETRAL', exportColumns, exportData);
    };

    const handleExportPDF = () => {
        exportMasterToPDF('Maestro de Costos de Puerto', exportColumns, exportData);
    };

    return (
        <MasterTemplate 
            title="Maestro de Gastos Portuarios" 
            subtitle="Configuración de tarifas operativas por Puerto, Cliente y Buque"
            activeTab="port-costs"
            onBackToDashboard={() => navigate('/dashboard')}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
        >
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 font-semibold animate-pulse gap-2">
                    <div className="animate-spin h-6 w-6 border-2 border-slate-300 border-t-blue-600 rounded-full"></div>
                    <span>Cargando matriz de costos portuarios...</span>
                </div>
            ) : (
                <div className="flex flex-col gap-6 w-full pb-8">
                    
                    {/* Header y Selector de Modo */}
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setMode('static')}
                                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${mode === 'static' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Modelo Estático
                            </button>
                            <button 
                                onClick={() => setMode('matrix')}
                                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${mode === 'matrix' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Modelo Matriz Compleja
                            </button>
                            <button 
                                onClick={() => setMode('bandas')}
                                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${mode === 'bandas' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                📊 Bandas Tarifarias
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* BOTÓN EJECUTIVO DE DESCARGA DE PLANTILLA EXCEL (REEMPLAZA EL SELECTOR INERTE ACTIVOS/PROSPECTOS) */}
                            {mode === 'static' && (
                                <button
                                    onClick={handleExportExcel}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-emerald-500"
                                    title="Descargar matriz completa de costos estáticos en Excel para edición y carga"
                                >
                                    <FileSpreadsheet size={16} />
                                    <span>Descargar Plantilla Excel</span>
                                </button>
                            )}

                            {mode === 'static' && (
                                <button 
                                    onClick={handleSaveGlobal}
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    Guardar Todos los Costos
                                </button>
                            )}
                        </div>
                    </div>

                    {mode === 'bandas' ? (
                        <div className="w-full">
                            <BandasResumenViewer />
                        </div>
                    ) : mode === 'matrix' ? (
                        <div className="w-full flex-1 min-h-[720px]">
                            <DynamicAuditViewer />
                        </div>
                    ) : (

                        <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            
                            {/* Nivel 1: TABS DE PAÍSES */}
                            <div className="flex overflow-x-auto border-b border-slate-200 bg-white scrollbar-none shrink-0">
                                {uniqueCountries.map(countryCode => {
                                    const meta = getCountryInfo(countryCode);
                                    const isActive = activeCountry === countryCode;
                                    return (
                                        <button 
                                            key={countryCode} 
                                            onClick={() => handleCountryClick(countryCode)}
                                            className={`px-6 py-3 font-black text-xs uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                                                isActive
                                                    ? "bg-slate-50"
                                                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                            }`}
                                            style={isActive ? { color: meta.color, borderColor: meta.color } : {}}
                                        >
                                            <img 
                                                src={`https://flagcdn.com/16x12/${meta.code}.png`} 
                                                alt={meta.name} 
                                                className="w-5 h-3.5 object-cover rounded shadow-sm border border-slate-200 shrink-0"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                            {meta.name}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Nivel 2: TABS DE PUERTOS (AUTOSELECCIONADOS) */}
                            <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 scrollbar-none">
                                {portsForCountry.map((p) => (
                                    <button
                                        key={p.port_id}
                                        onClick={() => setActivePortId(p.port_id)}
                                        className={`px-6 py-2.5 font-black text-[11px] uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                                            effectiveActivePortId === p.port_id
                                                ? 'border-slate-800 text-slate-800 bg-white'
                                                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Anchor size={12} />
                                        {p.port_name || p.port_id}
                                    </button>
                                ))}
                            </div>

                            {/* Contenido (Cards de Buques para todos los puertos) */}
                            <div className="p-6 bg-slate-50/50 min-h-[400px]">
                                {effectiveActivePortId ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {vessels.map(v => {
                                            const getVesselData = (portId: string, vesselId: string) => {
                                                const upperPort = (portId || '').toUpperCase().trim();
                                                const vKey = normalizeVesselKey(vesselId);
                                                if (costsState[upperPort] && costsState[upperPort][vKey]) {
                                                    return costsState[upperPort][vKey];
                                                }
                                                const pNorm = upperPort.replace(/[\s_-]+/g, '');
                                                for (const pKey of Object.keys(costsState)) {
                                                    if (pKey.toUpperCase().replace(/[\s_-]+/g, '') === pNorm) {
                                                        if (costsState[pKey] && costsState[pKey][vKey]) {
                                                            return costsState[pKey][vKey];
                                                        }
                                                    }
                                                }
                                                return null;
                                            };

                                            const vData = getVesselData(effectiveActivePortId, v.vessel_id) || {
                                                CARGA: { MAIN: 0, loading_master: 0, muellaje: 0, other: 0 },
                                                DESCARGA: { MAIN: 0, loading_master: 0, muellaje: 0, other: 0 },
                                                updated_at: null,
                                                updated_by: null
                                            };
                                            
                                            // Formatear fecha
                                            let formattedDate = "Sin modificaciones";
                                            if (vData.updated_at) {
                                                const d = new Date(vData.updated_at);
                                                formattedDate = d.toLocaleString();
                                            }

                                            return (
                                                <div key={v.vessel_id} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col group">
                                                    
                                                    {/* Header Card Buque */}
                                                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                                                        <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                                                            <Ship size={20} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <h3 className="font-black text-slate-800 text-sm leading-tight uppercase">
                                                                {v.vessel_name || v.vessel_id}
                                                            </h3>
                                                            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                                                                <Clock size={10} /> {formattedDate}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Formulario Carga / Descarga */}
                                                    <div className="flex flex-col gap-4 flex-1">
                                                        
                                                        {/* Operación CARGA */}
                                                        <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                            <div className="text-[11px] font-black text-blue-700 uppercase tracking-wider flex items-center justify-between">
                                                                <span>Carga</span>
                                                                <span className="text-[10px] text-slate-400 font-bold">
                                                                    Total: ${( (vData.CARGA?.MAIN || 0) + (vData.CARGA?.loading_master || 0) + (vData.CARGA?.muellaje || 0) + (vData.CARGA?.other || 0) ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-1.5">
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Agencia</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-CARGA-MAIN` ? (vData.CARGA?.MAIN ?? '') : formatCostValue(vData.CARGA?.MAIN)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-CARGA-MAIN`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'CARGA', 'MAIN', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Load Master</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-CARGA-loading_master` ? (vData.CARGA?.loading_master ?? '') : formatCostValue(vData.CARGA?.loading_master)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-CARGA-loading_master`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'CARGA', 'loading_master', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-blue-800 uppercase">Muellaje</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-CARGA-muellaje` ? (vData.CARGA?.muellaje ?? '') : formatCostValue(vData.CARGA?.muellaje)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-CARGA-muellaje`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'CARGA', 'muellaje', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-blue-50/50 border border-blue-200 rounded focus:border-blue-500 focus:outline-none text-blue-900 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Otros</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-CARGA-other` ? (vData.CARGA?.other ?? '') : formatCostValue(vData.CARGA?.other)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-CARGA-other`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'CARGA', 'other', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Operación DESCARGA */}
                                                        <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                            <div className="text-[11px] font-black text-emerald-700 uppercase tracking-wider flex items-center justify-between">
                                                                <span>Descarga</span>
                                                                <span className="text-[10px] text-slate-400 font-bold">
                                                                    Total: ${( (vData.DESCARGA?.MAIN || 0) + (vData.DESCARGA?.loading_master || 0) + (vData.DESCARGA?.muellaje || 0) + (vData.DESCARGA?.other || 0) ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-1.5">
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Agencia</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-DESCARGA-MAIN` ? (vData.DESCARGA?.MAIN ?? '') : formatCostValue(vData.DESCARGA?.MAIN)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-DESCARGA-MAIN`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'DESCARGA', 'MAIN', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Load Master</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-DESCARGA-loading_master` ? (vData.DESCARGA?.loading_master ?? '') : formatCostValue(vData.DESCARGA?.loading_master)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-DESCARGA-loading_master`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'DESCARGA', 'loading_master', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-emerald-800 uppercase">Muellaje</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-DESCARGA-muellaje` ? (vData.DESCARGA?.muellaje ?? '') : formatCostValue(vData.DESCARGA?.muellaje)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-DESCARGA-muellaje`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'DESCARGA', 'muellaje', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-emerald-50/50 border border-emerald-200 rounded focus:border-emerald-500 focus:outline-none text-emerald-900 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Otros</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-DESCARGA-other` ? (vData.DESCARGA?.other ?? '') : formatCostValue(vData.DESCARGA?.other)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-DESCARGA-other`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'DESCARGA', 'other', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>

                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center py-12 text-slate-400 font-bold">
                                        Seleccione un Puerto para ver la configuración de buques.
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                </div>
            )}
        </MasterTemplate>
    );
};
