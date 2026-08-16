import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MasterTemplate } from '../components/Masters/MasterTemplate_V2';
import { ForecastBuilder } from '../components/CommercialForecast/ForecastBuilder_V2';
import { useForecastContext_V2 } from '../context/ForecastContext_V2';
import { Save, FolderOpen, X, RefreshCw, Trash2 } from 'lucide-react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';


export const ToolsLayout_V2: React.FC = () => {
    const context = useForecastContext_V2();
    const location = useLocation();

    // Map URL to activeTab for MasterTemplate and Builder
    let activeTab = 'financial-matrix';
    if (location.pathname.includes('/multicotizador')) activeTab = 'multicotizador';
    else if (location.pathname.includes('/dashboard')) activeTab = 'financial-matrix';
    else if (location.pathname.includes('/liquidations-pdf-audit')) activeTab = 'liquidations-pdf-audit';
    else if (location.pathname.includes('/liquidations-graphic-analysis')) activeTab = 'liquidations-graphic-analysis';
    else if (location.pathname.includes('/graphic-analysis')) activeTab = 'graphic-analysis';
    else if (location.pathname.includes('/spaghetti-map')) activeTab = 'spaghetti-map';
    else if (location.pathname.includes('/audit-ledger')) activeTab = 'audit-ledger';
    else if (location.pathname.includes('/audit-engine')) activeTab = 'audit-engine';
    else if (location.pathname.includes('/audit-final')) activeTab = 'audit-final';
    else if (location.pathname.includes('/system-flowchart')) activeTab = 'system-flowchart';
    else if (location.pathname.includes('/static-vs-dynamic-port-cost')) activeTab = 'static-vs-dynamic-port-cost';
    else if (location.pathname.includes('/system-documentation')) activeTab = 'system-documentation';



    return (
        <MasterTemplate title="Herramientas" subtitle="Análisis y Proyección" activeTab={activeTab}>
            
            <div className="flex-1 flex flex-col gap-6 print:gap-0 print:m-0 h-full">
                {/* 1. Builder Bar (Shared across interactive modeling tools) */}
                {activeTab !== 'liquidations-pdf-audit' && activeTab !== 'system-documentation' && activeTab !== 'system-flowchart' && activeTab !== 'multicotizador' && (
                    <div className="print:hidden">
                    <ForecastBuilder 
                        currentStartDate={context.startDate}
                        currentEndDate={context.endDate}
                        dynamicMonths={context.dynamicMonths}
                        onHorizonChange={(start: string, end: string) => {
                            context.setStartDate(start);
                            context.setEndDate(end);
                        }}
                        onAddLine={context.handleAddLine}
                        forecastName={context.forecastName}
                        hideInputs={activeTab !== 'financial-matrix' || context.isRibbonCollapsed}
                        displayMode={context.displayMode}
                        onDisplayModeChange={context.setDisplayMode}
                        isAdding={context.loading}
                        demurragePct={context.demurragePct}
                        showDemurrage={context.showDemurrage}
                        onDemurragePctChange={context.setDemurragePct}
                        onShowDemurrageChange={context.handleSetShowDemurrage}
                        demurrageDays={context.demurrageDays}
                        showDemurrageDays={context.showDemurrageDays}
                        onDemurrageDaysChange={context.setDemurrageDays}
                        onShowDemurrageDaysChange={context.handleSetShowDemurrageDays}
                        portCostMode={context.portCostMode}
                        onPortCostModeChange={context.setPortCostMode}
                        bottomRightContent={
                            <>
                                <div className="flex flex-row items-center gap-2 h-8">
                                    <button 
                                        onClick={context.handleClearSession} 
                                        disabled={context.loading}
                                        className="flex items-center justify-center gap-1 h-8 px-3 rounded font-semibold text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all duration-200 shadow-sm cursor-pointer"
                                        title="Limpiar sesión y volver a pantalla en blanco"
                                    >
                                        <Trash2 size={13} className="text-rose-600" />
                                        <span>Limpiar</span>
                                    </button>
                                    <button 
                                        onClick={context.handleManualRecalculate} 
                                        disabled={context.loading}
                                        className={`flex items-center justify-center gap-1 h-8 px-3 rounded font-semibold text-[11px] transition-all duration-300 shadow-sm cursor-pointer ${
                                            context.loading
                                                ? 'bg-slate-400 text-white cursor-not-allowed'
                                                : context.isDirty 
                                                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                                        }`}
                                    >
                                        {context.loading ? (
                                            <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></div>
                                        ) : (
                                            <RefreshCw size={14} />
                                        )}
                                        <span>{context.loading ? 'Calculando...' : context.isDirty ? '¡Recalcular!' : 'Recalcular'}</span>
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            if (context.isDirty) {
                                                await context.handleManualRecalculate();
                                            }
                                            context.setShowSaveModal(true);
                                        }} 
                                        className="flex items-center justify-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-3 rounded font-medium text-[11px] transition-colors shadow-sm cursor-pointer"
                                    >
                                        <Save size={14} /> Guardar
                                    </button>
                                    <button 
                                        onClick={context.handleLoadClick} 
                                        disabled={context.actionLoading === 'loadList'}
                                        className={`relative overflow-hidden flex items-center justify-center gap-1 h-8 px-3 rounded font-medium text-[11px] transition-colors shadow-sm cursor-pointer ${context.actionLoading === 'loadList' ? 'bg-slate-200 pointer-events-none' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'}`}
                                    >
                                        {context.actionLoading === 'loadList' && <div className="absolute inset-0 bg-slate-300/50 animate-pulse" style={{ width: '100%' }}></div>}
                                        <span className="relative flex items-center justify-center z-10 w-full gap-1">
                                            {context.actionLoading === 'loadList' ? (
                                                <>
                                                    <div className="animate-spin h-3 w-3 border-2 border-slate-500 border-t-transparent rounded-full"></div>
                                                    <span>Abrir...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FolderOpen size={14} /> Cargar
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </>
                        }
                    />
                </div>
                )}

                {/* 2. Sincronización Canónica de Rutas con React Router Outlet */}
                <ErrorBoundary fallbackTitle="Error al cargar la herramienta interactiva">
                    <div className="flex-1 flex flex-col min-h-0 relative w-full h-full">
                        <Outlet />
                    </div>
                </ErrorBoundary>




            </div>

            {/* Save Modal */}
            {context.showSaveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-xl relative">
                        <button onClick={() => context.setShowSaveModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Guardar Escenario</h3>
                        
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-600 mb-1 block">Nombre del Forecast</label>
                                <input type="text" value={context.forecastName} onChange={(e) => context.setForecastName(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-petral-teal focus:outline-none" placeholder="Ej. Escenario Conservador H2" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-600 mb-1 block">Usuario / Autor</label>
                                <input type="text" value={context.userId} onChange={(e) => context.setUserId(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none" />
                            </div>
                            <div className="flex flex-col gap-2 mt-2">
                                <button 
                                    onClick={() => context.handleSaveForecast(true)} 
                                    disabled={context.actionLoading === 'save'}
                                    className={`relative overflow-hidden w-full font-bold py-2 rounded-full transition-colors ${context.actionLoading === 'save' ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-petral-teal hover:bg-teal-600 text-white shadow-md'}`}
                                >
                                    {context.actionLoading === 'save' && <div className="absolute inset-0 bg-white/20 animate-pulse" style={{ width: '100%' }}></div>}
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {context.actionLoading === 'save' ? 'Procesando...' : 'Guardar Nuevo (Clonar)'}
                                    </span>
                                </button>
                                
                                {context.currentForecastId && (context.loadedAuthor === context.userId || !context.loadedAuthor) && (
                                    <button 
                                        onClick={() => context.handleSaveForecast(false)} 
                                        disabled={context.actionLoading === 'save'}
                                        className={`w-full font-bold py-2 rounded-full transition-colors text-sm border-2 ${context.actionLoading === 'save' ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300 text-slate-600 hover:border-petral-teal hover:text-petral-teal'}`}
                                    >
                                        Sobrescribir Mi Escenario
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Load Modal */}
            {context.showLoadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-[500px] shadow-xl relative">
                        <button onClick={() => context.setShowLoadModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Catálogo de Escenarios</h3>
                        
                        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
                            {context.savedForecasts.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">No hay escenarios guardados en la BD.</p>
                            ) : (
                                context.savedForecasts.map(f => (
                                    <div key={f.id} className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${f.user_id === context.userId ? 'border-petral-teal/30 bg-blue-50/50 hover:bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`} onClick={() => context.handleLoadSelected(f.id)}>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                {f.name} 
                                                {f.user_id === context.userId ? (
                                                    <span className="text-[10px] bg-petral-teal text-white px-2 py-0.5 rounded-full font-semibold">Tuyo</span>
                                                ) : (
                                                    <span className="font-normal text-slate-400 text-xs">@{f.user_id}</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500">{f.start_date} a {f.end_date}</div>
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(f.updated_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </MasterTemplate>
    );
};
