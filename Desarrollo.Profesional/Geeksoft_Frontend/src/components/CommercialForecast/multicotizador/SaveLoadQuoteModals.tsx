import React, { useState, useEffect } from 'react';
import { X, Save, Users, Layers } from 'lucide-react';

export interface SaveLoadQuoteModalsProps {
    showSaveModal: boolean;
    showLoadModal: boolean;
    routeSuffix: string;
    saveMode: 'OVERWRITE' | 'NEW';
    saveTargetTable?: 'contracts' | 'routes_quotes';
    setSaveTargetTable?: (table: 'contracts' | 'routes_quotes') => void;
    loadedRouteName: string;
    clientType: 'ACTIVOS' | 'PROSPECTOS';
    selectedClient: string;
    rawClients?: any[];
    isSaving: boolean;
    isLoadingRoutes: boolean;
    savedRoutes: any[];
    setShowSaveModal: (val: boolean) => void;
    setShowLoadModal: (val: boolean) => void;
    setRouteSuffix: (val: string) => void;
    setSaveMode: (mode: 'OVERWRITE' | 'NEW') => void;
    handleSaveRoute: (options?: {
        targetClient?: string;
        targetClientType?: 'ACTIVOS' | 'PROSPECTOS';
        isContract?: boolean;
        finalName?: string;
    }) => void;
    handleLoadRoute: (route: any) => void;
    handlePrintPDF: () => void;
    getSuggestedRoutePrefix: (client: string) => string;
}

export const SaveLoadQuoteModals: React.FC<SaveLoadQuoteModalsProps> = ({
    showSaveModal,
    showLoadModal,
    routeSuffix,
    saveMode,
    loadedRouteName,
    clientType,
    selectedClient,
    rawClients = [],
    isSaving,
    isLoadingRoutes,
    savedRoutes,
    setShowSaveModal,
    setShowLoadModal,
    setRouteSuffix,
    setSaveMode,
    handleSaveRoute,
    handleLoadRoute,
    handlePrintPDF,
    getSuggestedRoutePrefix
}) => {
    // Estado local para selector de cliente destino en el modal de guardado
    const [targetClientType, setTargetClientType] = useState<'ACTIVOS' | 'PROSPECTOS'>('ACTIVOS');
    const [targetClient, setTargetClient] = useState<string>('');
    const [recordCategory, setRecordCategory] = useState<'COA' | 'SPOT'>('COA');

    // Sincronizar cliente por defecto cuando se abre el modal
    useEffect(() => {
        if (showSaveModal) {
            setTargetClientType(clientType);
            setTargetClient(selectedClient || (clientType === 'ACTIVOS' ? 'SPCC' : 'PRIMAX'));
            setRecordCategory('COA');
            if (loadedRouteName && loadedRouteName.trim() !== '') {
                setSaveMode('OVERWRITE');
            } else {
                setSaveMode('NEW');
            }
        }
    }, [showSaveModal, clientType, selectedClient, loadedRouteName, setSaveMode]);

    // Lista dinámica de clientes según targetClientType
    const availableClients = React.useMemo(() => {
        if (rawClients && rawClients.length > 0) {
            return rawClients
                .filter(c => targetClientType === 'ACTIVOS' ? (c.is_active === true) : (c.is_prospect === true))
                .map(c => c.client_id)
                .filter(Boolean);
        }
        return targetClientType === 'ACTIVOS' ? ['SPCC', 'NEXA', 'OTROS'] : ['PRIMAX', 'R TRADING'];
    }, [rawClients, targetClientType]);

    // Cuando cambia targetClientType, validar que targetClient pertenezca a la lista
    const handleTargetTypeChange = (newType: 'ACTIVOS' | 'PROSPECTOS') => {
        setTargetClientType(newType);
        const filtered = (rawClients || [])
            .filter(c => newType === 'ACTIVOS' ? (c.is_active === true) : (c.is_prospect === true))
            .map(c => c.client_id)
            .filter(Boolean);
        const nextClient = filtered[0] || (newType === 'ACTIVOS' ? 'SPCC' : 'PRIMAX');
        setTargetClient(nextClient);
        if (nextClient !== selectedClient) {
            setSaveMode('NEW');
        }
    };

    const handleTargetClientChange = (newClient: string) => {
        setTargetClient(newClient);
        if (newClient !== selectedClient) {
            setSaveMode('NEW');
        }
    };

    const isLoadedRoute = Boolean(loadedRouteName && loadedRouteName.trim() !== '');
    const isSameClient = targetClient === selectedClient;
    const canOverwrite = isLoadedRoute && isSameClient;

    const routePrefix = getSuggestedRoutePrefix(targetClient || selectedClient);
    const finalFullName = (saveMode === 'OVERWRITE' && canOverwrite)
        ? loadedRouteName
        : `${routePrefix}${routeSuffix.trim() ? routeSuffix.trim() : '2026'}`;

    const onConfirmSave = () => {
        handleSaveRoute({
            targetClient: targetClient || selectedClient,
            targetClientType,
            isContract: targetClientType === 'ACTIVOS' && recordCategory === 'COA',
            finalName: finalFullName
        });
    };

    return (
        <>
            {/* 5. GRABAR Y EXPORTAR EN LA PARTE INFERIOR DE LA PANTALLA */}
            <div className="bg-white border border-slate-300 rounded shadow-sm p-2 mt-2 select-none flex-shrink-0 w-full">
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200 flex-nowrap whitespace-nowrap gap-2 w-full">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-black uppercase text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 tracking-wide whitespace-nowrap">
                            5. GRABAR Y EXPORTAR
                        </span>
                        {loadedRouteName && (
                            <span className="text-[10.5px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                📌 Ruta Activa: {loadedRouteName}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 flex-nowrap whitespace-nowrap shrink-0">
                        <button
                            onClick={() => {
                                setShowSaveModal(true);
                            }}
                            className="h-7 text-xs font-black uppercase tracking-wider rounded px-3.5 bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                        >
                            <Save size={14} /> 💾 Grabar
                        </button>

                        <button
                            onClick={handlePrintPDF}
                            className="h-7 text-xs font-bold rounded px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                        >
                            🖨️ Export PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL DE GRABAR */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2">
                    <div className="bg-white p-4.5 rounded-xl w-[460px] max-w-full shadow-2xl border border-slate-300 animate-in fade-in zoom-in duration-150 flex flex-col gap-3">
                        
                        {/* CABECERA */}
                        <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                                    💾 Grabar Ruta Cierres / Cotizaciones
                                </h3>
                                <span className="text-[10px] font-mono text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                                    Destino: <strong className="text-blue-700">📄 Supabase (routes_quotes)</strong>
                                </span>
                            </div>
                            <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        {/* BLOQUE 1: SELECTOR DE CLIENTE DESTINO (ACTIVOS / PROSPECTOS) */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-250 flex flex-col gap-1.5">
                            <label className="text-[10.5px] font-bold text-slate-700 uppercase flex items-center gap-1">
                                <Users size={13} className="text-blue-600" /> 1️⃣ Cliente Destino:
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="flex rounded bg-slate-200 p-0.5 border border-slate-300 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleTargetTypeChange('ACTIVOS')}
                                        className={`px-2 py-0.5 text-[9px] font-black uppercase rounded cursor-pointer transition-all ${targetClientType === 'ACTIVOS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-300'}`}
                                    >
                                        Activos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTargetTypeChange('PROSPECTOS')}
                                        className={`px-2 py-0.5 text-[9px] font-black uppercase rounded cursor-pointer transition-all ${targetClientType === 'PROSPECTOS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-300'}`}
                                    >
                                        Prospectos
                                    </button>
                                </div>
                                <select
                                    value={targetClient}
                                    onChange={(e) => handleTargetClientChange(e.target.value)}
                                    className="flex-1 h-7 text-xs font-bold border border-slate-300 rounded px-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                >
                                    {availableClients.map(c => (
                                        <option key={c} value={c}>
                                            {c} {c === selectedClient ? '(Actual)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* BLOQUE 2: CLASIFICACIÓN COMERCIAL (Campo description) */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-250 flex flex-col gap-1.5">
                            <label className="text-[10.5px] font-bold text-slate-700 uppercase flex items-center gap-1">
                                <Layers size={13} className="text-purple-600" /> 2️⃣ Tipo de Registro ({targetClient}):
                            </label>
                            {targetClientType === 'ACTIVOS' ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRecordCategory('COA')}
                                        className={`py-1.5 px-2 text-[11px] font-extrabold rounded border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${recordCategory === 'COA' ? 'bg-blue-700 text-white border-blue-800 shadow-sm ring-1 ring-blue-500' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                                    >
                                        <span>📜 Ruta Cierres</span>
                                        <span className={`text-[8.5px] font-normal ${recordCategory === 'COA' ? 'text-blue-100' : 'text-slate-400'}`}>(Aparecerá en Paso 2)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRecordCategory('SPOT')}
                                        className={`py-1.5 px-2 text-[11px] font-extrabold rounded border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${recordCategory === 'SPOT' ? 'bg-purple-700 text-white border-purple-800 shadow-sm ring-1 ring-purple-500' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                                    >
                                        <span>📄 Cotizaciones</span>
                                        <span className={`text-[8.5px] font-normal ${recordCategory === 'SPOT' ? 'text-purple-100' : 'text-slate-400'}`}>(Aparecerá en Paso 3)</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded p-2 text-center text-xs font-bold">
                                    🏭 Cotización Prospecto <span className="text-[9.5px] font-normal text-emerald-700 block">(Se listará en el Paso 3)</span>
                                </div>
                            )}
                        </div>

                        {/* BLOQUE 3: MODO DE GUARDADO (SOBRESCRIBIR VS NUEVO) */}
                        {canOverwrite && (
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col gap-1">
                                <label className="text-[10.5px] font-bold text-slate-600 uppercase font-sans">
                                    3️⃣ Acción de Guardado:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSaveMode('OVERWRITE')}
                                        className={`py-1 px-2 text-xs font-bold rounded border transition-all cursor-pointer ${saveMode === 'OVERWRITE' ? 'bg-amber-500 text-white border-amber-600 shadow-xs' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                                    >
                                        ✍️ Sobrescribir
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSaveMode('NEW')}
                                        className={`py-1 px-2 text-xs font-bold rounded border transition-all cursor-pointer ${saveMode === 'NEW' ? 'bg-blue-600 text-white border-blue-700 shadow-xs' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                                    >
                                        ➕ Guardar como Nuevo
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* DETALLE SEGÚN ACCIÓN */}
                        {saveMode === 'OVERWRITE' && canOverwrite ? (
                            <div className="bg-amber-50 border border-amber-300 rounded p-2.5 text-xs font-sans text-amber-900">
                                <p className="font-bold text-[11px]">⚠️ Sobrescribiendo el registro cargado:</p>
                                <p className="font-mono font-bold text-amber-950 text-xs mt-1 bg-amber-100/80 p-1.5 rounded border border-amber-300 truncate">
                                    {loadedRouteName}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wide">
                                    🏷️ Nomenclatura del Nuevo Registro:
                                </label>
                                <div className="flex items-center gap-1 font-mono text-xs bg-slate-50 p-2 rounded-lg border border-slate-250">
                                    <span className="bg-slate-200 text-slate-800 font-extrabold px-2 py-1 rounded border border-slate-350 select-none shrink-0 text-[11px]">
                                        {routePrefix}
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="2026.V1"
                                        value={routeSuffix}
                                        onChange={(e) => setRouteSuffix(e.target.value)}
                                        className="flex-1 bg-white border border-blue-400 rounded px-2 py-1 text-xs font-mono font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                                    />
                                </div>
                                <div className="bg-emerald-50 border border-emerald-300 p-1.5 rounded text-xs font-mono">
                                    <span className="text-[9.5px] text-emerald-800 font-bold block uppercase font-sans">Nombre Final en Supabase:</span>
                                    <span className="font-black text-emerald-950 text-xs block truncate mt-0.5">
                                        {finalFullName}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* BOTONES DE ACCIÓN */}
                        <div className="flex justify-end gap-2 text-xs font-sans border-t border-slate-200 pt-2.5">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="h-8 font-bold rounded px-3.5 bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={onConfirmSave}
                                disabled={isSaving}
                                className="h-8 font-extrabold uppercase tracking-wide rounded px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <Save size={14} />
                                {isSaving ? "Grabando en routes_quotes..." : (saveMode === 'OVERWRITE' && canOverwrite ? "Sobrescribir" : "Confirmar Guardado")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CARGAR */}
            {showLoadModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-5 rounded-xl w-96 shadow-2xl border border-slate-300 animate-in fade-in zoom-in duration-150">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase">📂 Cargar Ruta Multicotizador</h3>
                                <span className="text-[10px] font-mono text-slate-500">
                                    Cliente: <strong className="text-blue-700">{selectedClient}</strong> (routes_quotes)
                                </span>
                            </div>
                            <button onClick={() => setShowLoadModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="max-h-80 overflow-y-auto flex flex-col gap-1.5 mb-4 pr-1">
                            {isLoadingRoutes ? (
                                <div className="text-xs font-sans text-slate-500 py-6 text-center">Listando rutas grabadas...</div>
                            ) : savedRoutes.length === 0 ? (
                                <div className="text-xs font-sans text-slate-400 py-6 text-center italic">No hay rutas grabadas para {selectedClient}</div>
                            ) : (
                                savedRoutes.map(route => (
                                    <button
                                        key={route.spot_id || route.id || route.route_id}
                                        onClick={() => handleLoadRoute(route)}
                                        className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-400 transition-all flex justify-between items-center group cursor-pointer"
                                    >
                                        <div>
                                            <span className="text-xs font-bold text-slate-800 block group-hover:text-blue-900">{route.name}</span>
                                            <span className="text-[10.5px] text-slate-400 font-mono block">{route.description || 'Ruta Multicotizador'}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                            {route.created_at ? new Date(route.created_at).toLocaleDateString() : ''}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end text-xs font-sans border-t border-slate-100 pt-2.5">
                            <button
                                onClick={() => setShowLoadModal(false)}
                                className="h-7 font-bold rounded px-3 bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
