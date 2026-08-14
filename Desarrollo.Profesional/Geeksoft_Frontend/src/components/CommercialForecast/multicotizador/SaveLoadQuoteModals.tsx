import React from 'react';
import { X, Save } from 'lucide-react';

export interface SaveLoadQuoteModalsProps {
    showSaveModal: boolean;
    showLoadModal: boolean;
    routeName: string;
    isSaving: boolean;
    isLoadingRoutes: boolean;
    savedRoutes: any[];
    selectedClient: string;
    setShowSaveModal: (val: boolean) => void;
    setShowLoadModal: (val: boolean) => void;
    setRouteName: (val: string) => void;
    handleSaveRoute: () => void;
    handleLoadRoute: (route: any) => void;
    handlePrintPDF: () => void;
    getSuggestedRouteName: (client: string) => string;
}

export const SaveLoadQuoteModals: React.FC<SaveLoadQuoteModalsProps> = ({
    showSaveModal,
    showLoadModal,
    routeName,
    isSaving,
    isLoadingRoutes,
    savedRoutes,
    selectedClient,
    setShowSaveModal,
    setShowLoadModal,
    setRouteName,
    handleSaveRoute,
    handleLoadRoute,
    handlePrintPDF,
    getSuggestedRouteName
}) => {
    return (
        <>
            {/* 6. GRABAR Y EXPORTAR COMPONENT */}
            <div className="bg-white border border-slate-300 rounded shadow-sm p-2 mt-3 select-none flex-shrink-0 w-full">
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200 flex-nowrap whitespace-nowrap gap-2 w-full">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-black uppercase text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 tracking-wide whitespace-nowrap">
                            6. GRABAR Y EXPORTAR
                        </span>
                    </div>

                    <div className="flex items-center gap-3 flex-nowrap whitespace-nowrap shrink-0">
                        <button
                            onClick={() => {
                                const suggested = getSuggestedRouteName(selectedClient);
                                setRouteName(suggested);
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
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-5 rounded-xl w-80 shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                            <h3 className="text-base font-bold text-slate-900">Grabar Ruta Multicotizador</h3>
                            <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                        </div>
                        <input
                            type="text"
                            placeholder="Nombre de la ruta (Ej: Callao-Valparaiso)"
                            value={routeName}
                            onChange={(e) => setRouteName(e.target.value)}
                            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm text-slate-700 mb-4 focus:outline-none focus:border-indigo-500 shadow-sm"
                        />
                        <div className="flex justify-end gap-2 text-sm">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="h-7 font-semibold rounded px-3 bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveRoute}
                                disabled={isSaving}
                                className="h-7 font-semibold rounded px-3 bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer disabled:opacity-50"
                            >
                                {isSaving ? "Grabando..." : "Confirmar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CARGAR */}
            {showLoadModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-5 rounded-xl w-96 shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                            <h3 className="text-base font-bold text-slate-900">Cargar Ruta Multicotizador</h3>
                            <button onClick={() => setShowLoadModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                        </div>
                        <div className="max-h-80 overflow-y-auto flex flex-col gap-1.5 mb-4">
                            {isLoadingRoutes ? (
                                <div className="text-sm text-slate-500 py-4 text-center">Listando rutas grabadas...</div>
                            ) : savedRoutes.length === 0 ? (
                                <div className="text-sm text-slate-400 py-4 text-center">No hay rutas grabadas para el Multicotizador</div>
                            ) : (
                                savedRoutes.map(route => (
                                    <button
                                        key={route.spot_id}
                                        onClick={() => handleLoadRoute(route)}
                                        className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-indigo-500 transition-all flex justify-between items-center group cursor-pointer"
                                    >
                                        <div>
                                            <span className="text-sm font-bold text-slate-700 block group-hover:text-indigo-650">{route.name}</span>
                                            <span className="text-[11px] text-slate-400">{route.description || 'Sin descripción'}</span>
                                        </div>
                                        <span className="text-[11px] font-mono text-slate-400">{route.created_at ? new Date(route.created_at).toLocaleDateString() : ''}</span>
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="flex justify-end text-sm">
                            <button
                                onClick={() => setShowLoadModal(false)}
                                className="h-7 font-semibold rounded px-3 bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 cursor-pointer"
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
