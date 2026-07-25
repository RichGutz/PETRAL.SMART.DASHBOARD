import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { Anchor, Save, Clock, Ship } from 'lucide-react';
import { CallaoAuditViewer } from '../../components/Masters/CallaoAuditViewer';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import type { ExportColumn } from '../../lib/masterExport';


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

export const PortCostsMaster_V2: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Configuración Inicial
    const [mode, setMode] = useState<'static' | 'matrix'>('static');
    
    // Maestros
    const [ports, setPorts] = useState<any[]>([]);
    const [rawClients, setRawClients] = useState<any[]>([]);
    const [filterActivo, setFilterActivo] = useState(true);
    const [filterProspecto, setFilterProspecto] = useState(false);
    const [vessels, setVessels] = useState<any[]>([]);
    
    // Estado de costos
    const [costsState, setCostsState] = useState<any>({});
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    
    // Selección Activa
    const [activePortId, setActivePortId] = useState('');
    const activeClientId = 'PETRAL';


    const formatCostValue = (value: number | undefined | null) => {
        if (value == null || isNaN(value)) return '';
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [portsData, clientsData, vesselsData, staticCostsData] = await Promise.all([
                ForecastService.getPorts(),
                ForecastService.getClientsMaster(),
                ForecastService.getVessels(),
                ForecastService.getPortCostsStatic()
            ]);
            
            const sortedPorts = [...(portsData || [])].sort((a: any, b: any) => {
                const latA = a.lat !== undefined && a.lat !== null ? parseFloat(a.lat) : 0;
                const latB = b.lat !== undefined && b.lat !== null ? parseFloat(b.lat) : 0;
                return latB - latA;
            });

            setPorts(sortedPorts);
            setRawClients(clientsData || []);
            setVessels(vesselsData);
            
            const newState: any = {};
            staticCostsData.forEach((row: any) => {
                const portId = (row.port_id || '').toUpperCase();
                const vesselId = (row.vessel_id || '').toUpperCase();
                const op = (row.operation_type || 'CARGA').toUpperCase();
                const subOp = row.sub_operation_type || 'MAIN';

                if (!newState[portId]) newState[portId] = {};
                if (!newState[portId][vesselId]) {
                    newState[portId][vesselId] = {
                        CARGA: { MAIN: 0, loading_master: 0, other: 0 },
                        DESCARGA: { MAIN: 0, loading_master: 0, other: 0 }
                    };
                }

                if (newState[portId][vesselId][op]) {
                    newState[portId][vesselId][op][subOp] = Number(row.cost || 0);
                }
            });
            setCostsState(newState);

            if (sortedPorts.length > 0 && !activePortId) {
                setActivePortId(sortedPorts[0].port_id);
            }
        } catch (err) {
            console.error("Error al cargar maestro de costos de puerto:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleActivo = () => {
        setFilterActivo(true);
        setFilterProspecto(false);
    };

    const toggleProspecto = () => {
        setFilterProspecto(true);
        setFilterActivo(false);
    };

    const handleCostChange = (portId: string, clientId: string, vesselId: string, operation: 'CARGA' | 'DESCARGA', subOp: string, value: string) => {

        const cleanValue = value.replace(/,/g, '');
        const numValue = parseFloat(cleanValue) || 0;
        setCostsState((prev: any) => {
            const next = { ...prev };
            if (!next[portId]) next[portId] = {};
            if (!next[portId][clientId]) next[portId][clientId] = {};
            if (!next[portId][clientId][vesselId]) {
                next[portId][clientId][vesselId] = {
                    CARGA: { MAIN: 0, loading_master: 0, other: 0 },
                    DESCARGA: { MAIN: 0, loading_master: 0, other: 0 },
                    updated_at: null,
                    updated_by: null
                };
            }
            if (!next[portId][clientId][vesselId][operation]) {
                next[portId][clientId][vesselId][operation] = { MAIN: 0, loading_master: 0, other: 0 };
            }
            next[portId][clientId][vesselId][operation][subOp] = numValue;
            return next;
        });
    };

    const handleSaveGlobal = async () => {
        try {
            setSaving(true);
            const payload: any[] = [];
            
            // Recorremos el estado completo para armar el payload de upsert masivo
            Object.keys(costsState).forEach(portId => {
                Object.keys(costsState[portId]).forEach(clientId => {
                    Object.keys(costsState[portId][clientId]).forEach(vesselId => {
                        const costData = costsState[portId][clientId][vesselId];
                        
                        const subOps = ['MAIN', 'loading_master', 'other'];
                        subOps.forEach(subOp => {
                            const cargaVal = costData.CARGA?.[subOp] ?? 0;
                            const descargaVal = costData.DESCARGA?.[subOp] ?? 0;
                            
                            payload.push({
                                client_id: clientId,
                                port_id: portId,
                                operation_type: 'CARGA',
                                vessel_id: vesselId,
                                sub_operation_type: subOp,
                                cost: cargaVal,
                                updated_by: 'USUARIO'
                            });
                            
                            payload.push({
                                client_id: clientId,
                                port_id: portId,
                                operation_type: 'DESCARGA',
                                vessel_id: vesselId,
                                sub_operation_type: subOp,
                                cost: descargaVal,
                                updated_by: 'USUARIO'
                            });
                        });
                    });
                });
            });
            
            await ForecastService.savePortCostsStatic(payload);
            await fetchData(); // Refresh para traer los nuevos updated_at
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
    const uniqueCountries = Array.from(new Set(ports.map(p => (p.country || "PE").toUpperCase())));
    const portsForCountry = ports.filter(p => (p.country || "PE").toUpperCase() === activeCountry);

    const handleCountryClick = (countryCode: string) => {
        const firstPort = ports.find(p => (p.country || "PE").toUpperCase() === countryCode);
        if (firstPort) {
            setActivePortId(firstPort.port_id);
        }
    };

    // Un puerto está "configurado" si tiene al menos un valor Q > 0 en costsState
    // Esto es 100% data-driven: solo muestran cards los puertos que tienen data real en BD
    const isPortConfigured = (portId: string): boolean => {
        const normalizeStr = (s: string) => (s || '').toUpperCase().replace(/[\s_-]+/g, '');
        const targetNorm = normalizeStr(portId);
        for (const pKey of Object.keys(costsState)) {
            const pNorm = normalizeStr(pKey);
            if (pNorm === targetNorm || pNorm.includes(targetNorm) || targetNorm.includes(pNorm)) {
                const portData = costsState[pKey];
                for (const vesselKey of Object.keys(portData || {})) {
                    const d = portData[vesselKey];
                    if (d) {
                        const totalQ = (d.CARGA?.MAIN || 0) + (d.CARGA?.loading_master || 0) + (d.CARGA?.other || 0)
                                     + (d.DESCARGA?.MAIN || 0) + (d.DESCARGA?.loading_master || 0) + (d.DESCARGA?.other || 0);
                        if (totalQ > 0) return true;
                    }
                }
            }
        }
        return false;
    };

    const exportData = useMemo(() => {
        const rows: any[] = [];
        Object.keys(costsState).forEach(portId => {
            const portObj = ports.find(p => p.port_id === portId);
            const portName = portObj ? portObj.port_name : portId;

            Object.keys(costsState[portId] || {}).forEach(clientId => {
                const clientObj = rawClients.find(c => c.client_id === clientId);
                const clientName = clientObj ? clientObj.client_name : clientId;

                Object.keys(costsState[portId][clientId] || {}).forEach(vesselId => {
                    const vesselObj = vessels.find(v => v.vessel_id === vesselId);
                    const vesselName = vesselObj ? vesselObj.vessel_name : vesselId;

                    const data = costsState[portId][clientId][vesselId];
                    
                    // CARGA
                    const cMain = data.CARGA?.MAIN || 0;
                    const cLm = data.CARGA?.loading_master || 0;
                    const cOther = data.CARGA?.other || 0;
                    const cTotal = cMain + cLm + cOther;
                    if (cTotal > 0) {
                        rows.push({
                            port_name: portName,
                            client_name: clientName,
                            vessel_name: vesselName,
                            operation: 'Carga',
                            main_cost: cMain,
                            lm_cost: cLm,
                            other_cost: cOther,
                            total_cost: cTotal
                        });
                    }

                    // DESCARGA
                    const dMain = data.DESCARGA?.MAIN || 0;
                    const dLm = data.DESCARGA?.loading_master || 0;
                    const dOther = data.DESCARGA?.other || 0;
                    const dTotal = dMain + dLm + dOther;
                    if (dTotal > 0) {
                        rows.push({
                            port_name: portName,
                            client_name: clientName,
                            vessel_name: vesselName,
                            operation: 'Descarga',
                            main_cost: dMain,
                            lm_cost: dLm,
                            other_cost: dOther,
                            total_cost: dTotal
                        });
                    }
                });
            });
        });
        return rows;
    }, [costsState, ports, rawClients, vessels]);

    const exportColumns: ExportColumn[] = [
        { header: 'Puerto', key: 'port_name', type: 'string' },
        { header: 'Cliente', key: 'client_name', type: 'string' },
        { header: 'Buque', key: 'vessel_name', type: 'string' },
        { header: 'Operación', key: 'operation', type: 'string' },
        { header: 'Costo Agencia (USD)', key: 'main_cost', type: 'currency' },
        { header: 'Loading Master (USD)', key: 'lm_cost', type: 'currency' },
        { header: 'Otros Costos (USD)', key: 'other_cost', type: 'currency' },
        { header: 'Costo Total (USD)', key: 'total_cost', type: 'currency' }
    ];

    const handleExportExcel = () => {
        exportMasterToExcel('Maestro de Costos de Puerto', exportColumns, exportData);
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
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Selector elegante de Activos / Prospectos */}
                            <div className="flex items-center gap-2 select-none">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Clientes:</span>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg h-8 shadow-inner items-center border border-slate-200">
                                    <button
                                        onClick={toggleActivo}
                                        className={`px-3 py-1 text-xs font-black rounded-md transition-all cursor-pointer ${filterActivo ? 'bg-white text-blue-600 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Activos
                                    </button>
                                    <button
                                        onClick={toggleProspecto}
                                        className={`px-3 py-1 text-xs font-black rounded-md transition-all cursor-pointer ${filterProspecto ? 'bg-white text-blue-600 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Prospectos
                                    </button>
                                </div>
                            </div>
                            
                            {mode === 'static' && (
                                <button 
                                    onClick={handleSaveGlobal}
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-bold text-sm flex items-center gap-2 disabled:opacity-50 mt-4 sm:mt-0"
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

                    {mode === 'matrix' ? (
                        <div className="w-full flex-1 min-h-[720px]">
                            <CallaoAuditViewer />
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

                            {/* Nivel 2: TABS DE PUERTOS */}
                            <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 scrollbar-none">
                                {portsForCountry.map((p) => (
                                    <button
                                        key={p.port_id}
                                        onClick={() => setActivePortId(p.port_id)}
                                        className={`px-6 py-2.5 font-black text-[11px] uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                                            activePortId === p.port_id
                                                ? 'border-slate-800 text-slate-800 bg-white'
                                                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Anchor size={12} />
                                        {p.port_name || p.port_id}
                                    </button>
                                ))}
                            </div>

                            {/* Contenido (Cards de Buques) */}
                            <div className="p-6 bg-slate-50/50 min-h-[400px]">
                                {activePortId && !isPortConfigured(activePortId) ? (
                                    // Puerto sin data Q configurada
                                    <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-400">
                                        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                            <Anchor size={28} className="text-slate-300" />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-black text-slate-500 text-base uppercase tracking-wide">
                                                {currentPort?.port_name || activePortId}
                                            </div>
                                            <div className="text-sm text-slate-400 mt-1 font-semibold">
                                                Terminal sin data configurada
                                            </div>
                                            <div className="text-xs text-slate-300 mt-2 max-w-xs">
                                                Este puerto no tiene tarifas Q ingresadas en el Motor Geeksoft Engine.
                                                Los puertos configurados son: Callao, Marcona, Ilo, Matarani, Mejillones y Barquito.
                                            </div>
                                        </div>
                                    </div>
                                ) : activePortId ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {vessels.map(v => {
                                            const normalizeStr = (s: string) => (s || '').toUpperCase().replace(/[\s_-]+/g, '');
                                            
                                            const getVesselData = (portId: string, vesselId: string) => {
                                                const targetPortNorm = normalizeStr(portId);
                                                const targetVesselNorm = normalizeStr(vesselId);

                                                for (const pKey of Object.keys(costsState)) {
                                                    const pNorm = normalizeStr(pKey);
                                                    const matchPort = pNorm === targetPortNorm || 
                                                        (targetPortNorm.includes('SANJUAN') && pNorm.includes('MARCONA')) || 
                                                        (targetPortNorm.includes('MARCONA') && pNorm.includes('SANJUAN')) ||
                                                        (targetPortNorm.includes('CALLAO') && pNorm.includes('CALLAO')) ||
                                                        (targetPortNorm.includes('MATARANI') && pNorm.includes('MATARANI')) ||
                                                        (targetPortNorm.includes('ILO') && pNorm.includes('ILO'));

                                                    if (matchPort) {
                                                        const portObj = costsState[pKey];
                                                        if (!portObj) continue;

                                                        for (const vKey of Object.keys(portObj)) {
                                                            if (normalizeStr(vKey) === targetVesselNorm) {
                                                                return portObj[vKey];
                                                            }
                                                        }
                                                    }
                                                }
                                                return null;
                                            };

                                            const vData = getVesselData(activePortId, v.vessel_id) || {
                                                CARGA: { MAIN: 0, loading_master: 0, other: 0 },
                                                DESCARGA: { MAIN: 0, loading_master: 0, other: 0 },
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
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID: {v.vessel_id}</span>
                                                        </div>
                                                    </div>

                                                    {/* Inputs de Operación */}
                                                    <div className="flex flex-col gap-4 text-[11px]">
                                                        {/* Sección Carga */}
                                                        <div className="flex flex-col gap-2">
                                                            <span className="text-xs font-black text-blue-700 uppercase border-b border-blue-100 pb-0.5">Carga</span>
                                                            
                                                            <div className="flex items-center justify-between gap-2 pl-1">
                                                                <label className="font-bold text-slate-500 uppercase">Gastos Portuarios</label>
                                                                <input 
                                                                    type="text"
                                                                    value={focusedInput === `${v.vessel_id}-CARGA-MAIN` ? (vData.CARGA?.MAIN ?? '') : formatCostValue(vData.CARGA?.MAIN)}
                                                                    onFocus={() => setFocusedInput(`${v.vessel_id}-CARGA-MAIN`)}
                                                                    onBlur={() => setFocusedInput(null)}
                                                                    onChange={(e) => handleCostChange(activePortId, activeClientId, v.vessel_id, 'CARGA', 'MAIN', e.target.value)}
                                                                    className="w-24 text-right font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-xs font-mono"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between gap-2 pl-1">
                                                                <label className="font-bold text-slate-500 uppercase">Loading Master</label>
                                                                <input 
                                                                    type="text"
                                                                    value={focusedInput === `${v.vessel_id}-CARGA-loading_master` ? (vData.CARGA?.loading_master ?? '') : formatCostValue(vData.CARGA?.loading_master)}
                                                                    onFocus={() => setFocusedInput(`${v.vessel_id}-CARGA-loading_master`)}
                                                                    onBlur={() => setFocusedInput(null)}
                                                                    onChange={(e) => handleCostChange(activePortId, activeClientId, v.vessel_id, 'CARGA', 'loading_master', e.target.value)}
                                                                    className="w-24 text-right font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-xs font-mono"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between gap-2 pl-1">
                                                                <label className="font-bold text-slate-500 uppercase">Otros Costos</label>
                                                                <input 
                                                                    type="text"
                                                                    value={focusedInput === `${v.vessel_id}-CARGA-other` ? (vData.CARGA?.other ?? '') : formatCostValue(vData.CARGA?.other)}
                                                                    onFocus={() => setFocusedInput(`${v.vessel_id}-CARGA-other`)}
                                                                    onBlur={() => setFocusedInput(null)}
                                                                    onChange={(e) => handleCostChange(activePortId, activeClientId, v.vessel_id, 'CARGA', 'other', e.target.value)}
                                                                    className="w-24 text-right font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-xs font-mono"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Sección Descarga */}
                                                        <div className="flex flex-col gap-2">
                                                            <span className="text-xs font-black text-amber-700 uppercase border-b border-amber-100 pb-0.5">Descarga</span>
                                                            
                                                            <div className="flex items-center justify-between gap-2 pl-1">
                                                                <label className="font-bold text-slate-500 uppercase">Gastos Portuarios</label>
                                                                <input 
                                                                    type="text"
                                                                    value={focusedInput === `${v.vessel_id}-DESCARGA-MAIN` ? (vData.DESCARGA?.MAIN ?? '') : formatCostValue(vData.DESCARGA?.MAIN)}
                                                                    onFocus={() => setFocusedInput(`${v.vessel_id}-DESCARGA-MAIN`)}
                                                                    onBlur={() => setFocusedInput(null)}
                                                                    onChange={(e) => handleCostChange(activePortId, activeClientId, v.vessel_id, 'DESCARGA', 'MAIN', e.target.value)}
                                                                    className="w-24 text-right font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-xs font-mono"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between gap-2 pl-1">
                                                                <label className="font-bold text-slate-500 uppercase">Loading Master</label>
                                                                <input 
                                                                    type="text"
                                                                    value={focusedInput === `${v.vessel_id}-DESCARGA-loading_master` ? (vData.DESCARGA?.loading_master ?? '') : formatCostValue(vData.DESCARGA?.loading_master)}
                                                                    onFocus={() => setFocusedInput(`${v.vessel_id}-DESCARGA-loading_master`)}
                                                                    onBlur={() => setFocusedInput(null)}
                                                                    onChange={(e) => handleCostChange(activePortId, activeClientId, v.vessel_id, 'DESCARGA', 'loading_master', e.target.value)}
                                                                    className="w-24 text-right font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-xs font-mono"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between gap-2 pl-1">
                                                                <label className="font-bold text-slate-500 uppercase">Otros Costos</label>
                                                                <input 
                                                                    type="text"
                                                                    value={focusedInput === `${v.vessel_id}-DESCARGA-other` ? (vData.DESCARGA?.other ?? '') : formatCostValue(vData.DESCARGA?.other)}
                                                                    onFocus={() => setFocusedInput(`${v.vessel_id}-DESCARGA-other`)}
                                                                    onBlur={() => setFocusedInput(null)}
                                                                    onChange={(e) => handleCostChange(activePortId, activeClientId, v.vessel_id, 'DESCARGA', 'other', e.target.value)}
                                                                    className="w-24 text-right font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-xs font-mono"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Panel de Auditoría / Modificación */}
                                                    <div className="mt-4 pt-3 border-t border-slate-100">
                                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col gap-1.5">
                                                            <div className="flex justify-between items-center text-[10px]">
                                                                <span className="font-bold text-slate-500 uppercase">Actualizado por:</span>
                                                                <span className="font-black text-slate-700 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">
                                                                    {vData.updated_by || 'SISTEMA'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[10px]">
                                                                <span className="font-bold text-slate-500 uppercase">Fecha Act.:</span>
                                                                <span className="font-black text-slate-700 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200 flex items-center gap-1">
                                                                    <Clock size={10} className={vData.updated_at ? "text-amber-500" : "text-slate-300"} />
                                                                    {formattedDate}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-slate-400 font-semibold p-12">
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
