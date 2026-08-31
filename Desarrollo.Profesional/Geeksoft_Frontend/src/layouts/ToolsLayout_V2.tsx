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
                        matrixFormat={context.matrixFormat}
                        onMatrixFormatChange={context.setMatrixFormat}
                        hideNaRows={context.hideNaRows}
                        onToggleHideNaRows={context.toggleHideNaRows}
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
                                <div className="flex flex-row items-center gap-2 h-7.5">
                                    <button 
                                        onClick={context.handleClearSession} 
                                        disabled={context.loading}
                                        className="flex items-center justify-center gap-1.5 h-7.5 px-3.5 rounded-lg font-extrabold text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all duration-200 shadow-2xs cursor-pointer"
                                        title="Limpiar sesión y volver a pantalla en blanco"
                                    >
                                        <Trash2 size={13} className="text-rose-600" />
                                        <span>Limpiar</span>
                                    </button>
                                    <button 
                                        onClick={context.handleOpenSaveModal} 
                                        disabled={context.actionLoading === 'loadList'}
                                        className="flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white h-7.5 px-4 rounded-lg font-extrabold text-[11px] transition-all shadow-2xs cursor-pointer"
                                    >
                                        <Save size={14} /> Guardar
                                    </button>
                                    <button 
                                        onClick={context.handleLoadClick} 
                                        disabled={context.actionLoading === 'loadList'}
                                        className={`relative overflow-hidden flex items-center justify-center gap-1.5 h-7.5 px-4 rounded-lg font-extrabold text-[11px] transition-all shadow-2xs cursor-pointer ${context.actionLoading === 'loadList' ? 'bg-slate-100 text-slate-400 pointer-events-none' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'}`}
                                    >
                                        {context.actionLoading === 'loadList' && <div className="absolute inset-0 bg-slate-200/50 animate-pulse" style={{ width: '100%' }}></div>}
                                        <span className="relative flex items-center justify-center z-10 w-full gap-1.5">
                                            {context.actionLoading === 'loadList' ? (
                                                <>
                                                    <div className="animate-spin h-3 w-3 border-2 border-sky-600 border-t-transparent rounded-full"></div>
                                                    <span>Abrir...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FolderOpen size={14} className="text-sky-600" /> Cargar
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
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-[480px] shadow-2xl border border-slate-200/80 overflow-hidden">
                        
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xs shadow-2xs">
                                    💾
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Guardar Escenario Comercial</h3>
                                    <p className="text-[11px] text-slate-500 font-medium">Persistencia integral de matriz, viajes y demoras</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => context.setShowSaveModal(false)} 
                                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={16}/>
                            </button>
                        </div>
                        
                        <div className="p-5 flex flex-col gap-4">
                            
                            {/* Selector de Modalidad: Nuevo vs Sobrescribir */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => context.setSaveMode('NEW')}
                                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${context.saveMode === 'NEW' ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500/20 shadow-2xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${context.saveMode === 'NEW' ? 'border-sky-600 bg-sky-600' : 'border-slate-300'}`}>
                                            {context.saveMode === 'NEW' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                        </div>
                                        <span className="text-xs font-black text-slate-800">Nuevo Escenario</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 pl-5.5 font-medium">Crear registro independiente</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        context.setSaveMode('OVERWRITE');
                                        if (context.savedForecasts.length > 0 && !context.targetOverwriteId) {
                                            const targetId = context.currentForecastId || context.savedForecasts[0].id;
                                            context.setTargetOverwriteId(targetId);
                                            const found = context.savedForecasts.find((f: any) => f.id === targetId);
                                            if (found) context.setForecastName(found.name);
                                        }
                                    }}
                                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${context.saveMode === 'OVERWRITE' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-2xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${context.saveMode === 'OVERWRITE' ? 'border-amber-600 bg-amber-600' : 'border-slate-300'}`}>
                                            {context.saveMode === 'OVERWRITE' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                        </div>
                                        <span className="text-xs font-black text-slate-800">Sobrescribir</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 pl-5.5 font-medium">Actualizar existente en BD</span>
                                </button>
                            </div>

                            {/* Campo de Selección en modo Sobrescribir */}
                            {context.saveMode === 'OVERWRITE' && (
                                <div className="flex flex-col gap-1.5 bg-amber-50/60 border border-amber-200 rounded-xl p-3">
                                    <label className="text-[10.5px] font-black text-amber-900 uppercase tracking-tight">Escenario a Sobrescribir:</label>
                                    <select
                                        value={context.targetOverwriteId || (context.savedForecasts.length > 0 ? context.savedForecasts[0].id : '')}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            context.setTargetOverwriteId(val);
                                            const found = context.savedForecasts.find((f: any) => f.id === val);
                                            if (found) context.setForecastName(found.name);
                                        }}
                                        className="h-8 text-xs font-bold border border-amber-300 rounded-lg px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
                                    >
                                        {context.savedForecasts.map((f: any) => (
                                            <option key={f.id} value={f.id}>
                                                {f.name} ({f.start_date} ~ {f.end_date})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Nombre del Forecast */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-tight">Nombre del Escenario / Versión</label>
                                <input 
                                    type="text" 
                                    value={context.forecastName} 
                                    onChange={(e) => context.setForecastName(e.target.value)} 
                                    className="w-full h-8 border border-slate-200 rounded-lg px-3 text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-none shadow-2xs" 
                                    placeholder="Ej. Escenario Base 2026 H2" 
                                />
                            </div>

                            {/* Usuario / Autor */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-tight">Usuario / Autor</label>
                                <input 
                                    type="text" 
                                    value={context.userId} 
                                    onChange={(e) => context.setUserId(e.target.value)} 
                                    className="w-full h-8 border border-slate-200 rounded-lg px-3 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none shadow-2xs" 
                                />
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                <button 
                                    type="button"
                                    onClick={() => context.setShowSaveModal(false)} 
                                    className="flex-1 h-8 rounded-lg font-bold text-xs text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => context.handleSaveForecast()} 
                                    disabled={context.actionLoading === 'save'}
                                    className={`relative overflow-hidden flex-1 h-8 rounded-lg font-black text-xs text-white transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 ${
                                        context.actionLoading === 'save' 
                                            ? 'bg-slate-400 cursor-not-allowed' 
                                            : context.saveMode === 'OVERWRITE' 
                                                ? 'bg-amber-600 hover:bg-amber-700' 
                                                : 'bg-sky-600 hover:bg-sky-700'
                                    }`}
                                >
                                    {context.actionLoading === 'save' && <div className="absolute inset-0 bg-white/20 animate-pulse" style={{ width: '100%' }}></div>}
                                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                                        {context.actionLoading === 'save' ? (
                                            <>
                                                <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                                                <span>Guardando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save size={13} />
                                                <span>{context.saveMode === 'OVERWRITE' ? 'Sobrescribir Escenario' : 'Guardar Nuevo'}</span>
                                            </>
                                        )}
                                    </span>
                                </button>
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
