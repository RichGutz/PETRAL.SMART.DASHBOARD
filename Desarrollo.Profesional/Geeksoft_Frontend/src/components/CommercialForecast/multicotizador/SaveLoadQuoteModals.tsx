import React from 'react';
import { X, Save } from 'lucide-react';

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
    isSaving: boolean;
    isLoadingRoutes: boolean;
    savedRoutes: any[];
    setShowSaveModal: (val: boolean) => void;
    setShowLoadModal: (val: boolean) => void;
    setRouteSuffix: (val: string) => void;
    setSaveMode: (mode: 'OVERWRITE' | 'NEW') => void;
    handleSaveRoute: () => void;
    handleLoadRoute: (route: any) => void;
    handlePrintPDF: () => void;
    getSuggestedRoutePrefix: (client: string) => string;
}

export const SaveLoadQuoteModals: React.FC<SaveLoadQuoteModalsProps> = ({
    showSaveModal,
    showLoadModal,
    routeSuffix,
    saveMode,
    saveTargetTable = 'contracts',
    setSaveTargetTable,
    loadedRouteName,
    clientType,
    selectedClient,
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
    const routePrefix = getSuggestedRoutePrefix(selectedClient);
    const activeTargetTable = clientType === 'PROSPECTOS' ? 'routes_quotes' : (saveTargetTable || 'contracts');
    const targetTableLabel = activeTargetTable === 'contracts' ? '📜 Maestro de Rutas COA (contracts)' : '📑 Maestro de Cotizaciones (routes_quotes)';
    const isLoadedRoute = Boolean(loadedRouteName && loadedRouteName.trim() !== '');

    const finalFullName = saveMode === 'OVERWRITE'
        ? loadedRouteName
        : `${routePrefix}${routeSuffix.trim() ? routeSuffix.trim() : '2026'}`;

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
                                if (isLoadedRoute) {
                                    setSaveMode('OVERWRITE');
                                } else {
                                    setSaveMode('NEW');
                                }
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-5 rounded-xl w-[440px] shadow-2xl border border-slate-300 animate-in fade-in zoom-in duration-150">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                                    💾 Grabar Cotización / Ruta Comercial
                                </h3>
                                <span className="text-[10px] font-mono text-slate-500 font-semibold">
                                    Destino Supabase: <strong className="text-blue-700">{targetTableLabel}</strong>
                                </span>
                            </div>
                            <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        {/* SELECCIÓN DE TABLA DESTINO SEGÚN MODO CLIENTE */}
                        {clientType === 'ACTIVOS' ? (
                            <div className="mb-3 bg-blue-50/60 p-2 rounded-lg border border-blue-200 flex flex-col gap-1">
                                <label className="text-[10.5px] font-bold text-blue-900 uppercase">
                                    📋 Tipo de Registro para Cliente Activo ({selectedClient}):
                                </label>
                                <div className="grid grid-cols-2 gap-2 mt-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setSaveTargetTable && setSaveTargetTable('contracts')}
                                        className={`py-1 px-2 text-[11px] font-extrabold rounded border transition-all cursor-pointer ${activeTargetTable === 'contracts' ? 'bg-blue-700 text-white border-blue-800 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                                    >
                                        📜 Maestro de Rutas COA (`contracts`)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSaveTargetTable && setSaveTargetTable('routes_quotes')}
                                        className={`py-1 px-2 text-[11px] font-extrabold rounded border transition-all cursor-pointer ${activeTargetTable === 'routes_quotes' ? 'bg-purple-700 text-white border-purple-800 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                                    >
                                        📑 Maestro de Cotizaciones (`routes_quotes`)
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-3 bg-emerald-50/60 p-2 rounded-lg border border-emerald-200 text-[11px] font-bold text-emerald-900">
                                🏭 Cliente Prospecto ({selectedClient}): Graba exclusivamente en <span className="font-mono text-emerald-950">`Maestro de Cotizaciones (routes_quotes)`</span>
                            </div>
                        )}

                        {/* MODO DE GRABADO: SOBRESCRIBIR VS NUEVO NOMBRE */}
                        {isLoadedRoute && (
                            <div className="mb-4 bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">
                                    Seleccione Acción de Guardado:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSaveMode('OVERWRITE')}
                                        className={`py-1.5 px-2 text-xs font-bold rounded border transition-all cursor-pointer ${saveMode === 'OVERWRITE' ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                                    >
                                        ✍️ Sobrescribir
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSaveMode('NEW')}
                                        className={`py-1.5 px-2 text-xs font-bold rounded border transition-all cursor-pointer ${saveMode === 'NEW' ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                                    >
                                        ➕ Guardar como Nuevo
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* MODO A: SOBRESCRIBIR REGISTRO CARGADO */}
                        {saveMode === 'OVERWRITE' && isLoadedRoute ? (
                            <div className="bg-amber-50 border border-amber-300 rounded p-3 mb-4 text-xs font-sans text-amber-900">
                                <p className="font-bold">⚠️ Sobrescribiendo el registro cargado:</p>
                                <p className="font-mono font-bold text-amber-950 text-sm mt-1 bg-amber-100/80 p-1.5 rounded border border-amber-300">
                                    {loadedRouteName}
                                </p>
                                <p className="text-[10.5px] text-amber-800 mt-1.5 italic">
                                    Se actualizará el payload prístino completo en la tabla <strong className="font-bold">{targetTableLabel}</strong>.
                                </p>
                            </div>
                        ) : (
                            /* MODO B: GUARDAR CON NUEVA NOMENCLATURA */
                            <div className="flex flex-col gap-2.5 mb-4">
                                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                                    🏷️ Nomenclatura Estándar:
                                </label>
                                
                                <div className="flex flex-col gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-250">
                                    <div className="flex items-center gap-1 font-mono text-xs">
                                        <span className="bg-slate-200 text-slate-800 font-extrabold px-2 py-1 rounded border border-slate-350 select-none shrink-0">
                                            {routePrefix}
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="2026.V1"
                                            value={routeSuffix}
                                            onChange={(e) => setRouteSuffix(e.target.value)}
                                            className="flex-1 bg-white border border-blue-400 rounded px-2 py-1 text-xs font-mono font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic pl-0.5">
                                        * El prefijo <strong className="font-mono font-bold">{routePrefix}</strong> es automático. Ingrese su sufijo distintivo.
                                    </p>
                                </div>

                                <div className="bg-emerald-50 border border-emerald-300 p-2 rounded text-xs font-mono">
                                    <span className="text-[10px] text-emerald-800 font-bold block uppercase font-sans">Vista Previa Nombre Final:</span>
                                    <span className="font-black text-emerald-950 text-xs block truncate mt-0.5">
                                        {finalFullName}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 text-xs font-sans border-t border-slate-100 pt-3">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="h-8 font-bold rounded px-3.5 bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveRoute}
                                disabled={isSaving}
                                className="h-8 font-extrabold uppercase tracking-wide rounded px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <Save size={14} />
                                {isSaving ? "Grabando Payload..." : (saveMode === 'OVERWRITE' ? "Sobrescribir" : "Confirmar Guardado")}
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
                                    Cliente: <strong className="text-blue-700">{selectedClient}</strong> ({targetTableLabel})
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
