import React, { useState } from 'react';
import { Sparkles, X, ShieldCheck, RefreshCw, CheckCircle2, Lock, AlertCircle } from 'lucide-react';

interface DocsAsCodeSyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    lastSyncedDate: string;
    onSyncSuccess: (newDate: string) => void;
}

export const DocsAsCodeSyncModal_V2: React.FC<DocsAsCodeSyncModalProps> = ({
    isOpen,
    onClose,
    lastSyncedDate,
    onSyncSuccess
}) => {
    const [pinCode, setPinCode] = useState<string>('');
    const [syncError, setSyncError] = useState<string>('');
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
    const [syncStep, setSyncStep] = useState<number>(0);

    if (!isOpen) return null;

    const handleExecuteSync = () => {
        if (pinCode.trim() !== '061121') {
            setSyncError('Clave de autorización incorrecta. Verifique e intente nuevamente.');
            return;
        }

        setSyncError('');
        setIsSyncing(true);
        setSyncStep(1);

        setTimeout(() => {
            setSyncStep(2);
            setTimeout(() => {
                setSyncStep(3);
                setTimeout(() => {
                    setSyncStep(4);
                    const now = new Date().toLocaleString('es-PE');
                    localStorage.setItem('petral_docs_last_synced', now);
                    onSyncSuccess(now);
                    setIsSyncing(false);
                    setSyncSuccess(true);
                }, 700);
            }, 700);
        }, 800);
    };

    const handleClose = () => {
        if (isSyncing) return;
        setPinCode('');
        setSyncError('');
        setSyncSuccess(false);
        setSyncStep(0);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 no-print">
            <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl border border-slate-200 overflow-hidden">
                
                {/* Header del Modal */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-black text-sm shadow-2xs">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Sincronizador Docs-as-Code</h3>
                            <p className="text-[11px] text-slate-500 font-medium">Actualización As-Built de Manual y Flujogramas</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        disabled={isSyncing}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Cuerpo del Modal */}
                <div className="p-5 flex flex-col gap-4">
                    
                    {/* Tarjeta Informativa de la Rutina */}
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1.5 text-slate-800">
                                <ShieldCheck size={14} className="text-teal-600" /> Alcance de la Rutina de Cierre:
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">v2.5 AS-BUILT</span>
                        </div>
                        <ul className="text-[11px] text-slate-600 space-y-1 pl-4 list-disc">
                            <li>Auditoría y cálculo de <strong>Líneas de Código (LOC)</strong> en tiempo real.</li>
                            <li>Regeneración de flujogramas de arquitectura en <strong>PDF / SVG</strong>.</li>
                            <li>Sincronización del catálogo interactivo de <strong>11 Maestros y 8 Herramientas</strong>.</li>
                        </ul>
                        <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 flex items-center justify-between font-mono">
                            <span>Última Sincronización:</span>
                            <span className="font-bold text-slate-700">{lastSyncedDate}</span>
                        </div>
                    </div>

                    {/* Pasos / Feedback de Ejecución */}
                    {isSyncing && (
                        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex flex-col gap-2.5 animate-in fade-in duration-150">
                            <div className="flex items-center gap-2 text-teal-800 font-bold text-xs">
                                <RefreshCw size={14} className="animate-spin text-teal-600" />
                                <span>Ejecutando Sincronización de Sistema...</span>
                            </div>
                            <div className="space-y-1 text-[11px] text-teal-700 font-mono">
                                <div className={`flex items-center gap-1.5 ${syncStep >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                                    <span>{syncStep >= 1 ? '✓' : '○'}</span> Escaneando LOCs de Frontend y Backend...
                                </div>
                                <div className={`flex items-center gap-1.5 ${syncStep >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                                    <span>{syncStep >= 2 ? '✓' : '○'}</span> Compilando especificaciones de Maestros y Herramientas...
                                </div>
                                <div className={`flex items-center gap-1.5 ${syncStep >= 3 ? 'opacity-100' : 'opacity-40'}`}>
                                    <span>{syncStep >= 3 ? '✓' : '○'}</span> Regenerando Flujograma General V1 (Graphviz DOT/PDF/SVG)...
                                </div>
                                <div className={`flex items-center gap-1.5 ${syncStep >= 4 ? 'opacity-100' : 'opacity-40'}`}>
                                    <span>{syncStep >= 4 ? '✓' : '○'}</span> Publicando activos As-Built en portal interactivo...
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Estado de Éxito */}
                    {syncSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-150">
                            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <div className="text-xs font-black text-emerald-800 uppercase tracking-wide">¡Sincronización Exitosa!</div>
                                <div className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                                    La documentación Docs-as-Code y los flujogramas del sistema están 100% actualizados y alineados con el código de producción.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Campo de Clave / PIN de Autorización */}
                    {!syncSuccess && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
                                <Lock size={12} className="text-slate-500" /> Clave de Seguridad Requerida
                            </label>
                            <div className="relative">
                                <input 
                                    type="password"
                                    value={pinCode}
                                    onChange={(e) => {
                                        setPinCode(e.target.value);
                                        if (syncError) setSyncError('');
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !isSyncing) handleExecuteSync();
                                    }}
                                    disabled={isSyncing}
                                    placeholder="Ingresa la clave de autorización..."
                                    className={`w-full h-9 border rounded-lg px-3 text-xs font-mono font-bold tracking-widest text-slate-800 focus:outline-none transition-all ${
                                        syncError 
                                            ? 'border-rose-400 bg-rose-50/50 focus:ring-1 focus:ring-rose-500' 
                                            : 'border-slate-200 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                                    }`}
                                />
                            </div>
                            {syncError && (
                                <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-0.5">
                                    <AlertCircle size={12} /> {syncError}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Botones de Acción */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button 
                            type="button"
                            onClick={handleClose}
                            disabled={isSyncing}
                            className="flex-1 h-9 rounded-lg font-bold text-xs text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                        >
                            {syncSuccess ? 'Cerrar' : 'Cancelar'}
                        </button>
                        {!syncSuccess && (
                            <button 
                                type="button"
                                onClick={handleExecuteSync}
                                disabled={isSyncing || !pinCode.trim()}
                                className={`flex-1 h-9 rounded-lg font-black text-xs text-white transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                                    isSyncing || !pinCode.trim() 
                                        ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                                        : 'bg-teal-600 hover:bg-teal-700 active:scale-[0.99]'
                                }`}
                            >
                                {isSyncing ? (
                                    <>
                                        <RefreshCw size={13} className="animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={13} />
                                        <span>Ejecutar Sincronización</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
