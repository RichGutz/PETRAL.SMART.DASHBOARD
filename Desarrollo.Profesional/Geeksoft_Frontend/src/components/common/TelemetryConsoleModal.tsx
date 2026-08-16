import React, { useState, useEffect } from 'react';
import { TelemetryLogger, type TelemetryLogEntry } from '../../services/TelemetryLogger';
import { useAuth } from '../../context/AuthContext';
import { Terminal, X, Trash2, ShieldAlert } from 'lucide-react';

export const TelemetryConsoleModal: React.FC = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState<TelemetryLogEntry[]>([]);
    const [filterLevel, setFilterLevel] = useState<'ALL' | 'ERROR' | 'WARN' | 'INFO'>('ALL');

    // Solo visible para usuarios con rol ADMIN
    if (user?.role !== 'ADMIN') return null;

    useEffect(() => {
        const unsubscribe = TelemetryLogger.subscribe((newLogs) => {
            setLogs(newLogs);
        });
        return () => unsubscribe();
    }, []);

    const filteredLogs = logs.filter(l => filterLevel === 'ALL' || l.level === filterLevel);
    const errorCount = logs.filter(l => l.level === 'ERROR').length;

    return (
        <>
            {/* Botón flotante discreto en esquina inferior izquierda */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-3 left-3 z-[9999] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg transition-all border cursor-pointer ${
                    errorCount > 0 
                        ? 'bg-rose-600 text-white border-rose-400 animate-pulse' 
                        : 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800'
                }`}
                title="Abrir Consola de Telemetría VPS y Diagnóstico (ADMIN)"
            >
                <Terminal size={14} className={errorCount > 0 ? 'text-white' : 'text-emerald-400'} />
                <span>Telemetría VPS</span>
                {errorCount > 0 && (
                    <span className="bg-white text-rose-700 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                        {errorCount}
                    </span>
                )}
            </button>

            {/* Modal / Panel Flotante de Telemetría */}
            {isOpen && (
                <div className="fixed inset-y-12 right-4 w-[650px] max-w-[90vw] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-[9999] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Header */}
                    <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={18} className="text-amber-400" />
                            <h3 className="text-sm font-black text-white tracking-wide uppercase">Consola de Telemetría &amp; Logs VPS</h3>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">ADMIN OYES</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => TelemetryLogger.clearLogs()} 
                                className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                                title="Limpiar logs en pantalla"
                            >
                                <Trash2 size={12} /> Limpiar
                            </button>
                            <button 
                                onClick={() => setIsOpen(false)} 
                                className="text-slate-400 hover:text-white rounded-full p-1 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Barra de Filtros */}
                    <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800 flex items-center gap-2 text-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filtro:</span>
                        {(['ALL', 'ERROR', 'WARN', 'INFO'] as const).map(lvl => (
                            <button
                                key={lvl}
                                onClick={() => setFilterLevel(lvl)}
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                                    filterLevel === lvl
                                        ? lvl === 'ERROR' ? 'bg-rose-600 text-white' : lvl === 'WARN' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                {lvl}
                            </button>
                        ))}
                    </div>

                    {/* Cuerpo del Log (Estilo Terminal Pro) */}
                    <div className="flex-1 p-4 overflow-y-auto font-mono text-xs flex flex-col gap-3 leading-relaxed">
                        {filteredLogs.length === 0 ? (
                            <div className="text-slate-600 text-center py-12 italic text-sm">
                                No hay registros de error capturados. Transmisión a VPS activa.
                            </div>
                        ) : (
                            filteredLogs.map((log) => (
                                <div 
                                    key={log.id} 
                                    className={`p-3 rounded-lg border flex flex-col gap-1 transition-all ${
                                        log.level === 'ERROR' 
                                            ? 'bg-rose-950/40 border-rose-800/80 text-rose-200' 
                                            : log.level === 'WARN' 
                                                ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' 
                                                : 'bg-slate-900 border-slate-800 text-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between text-[11px] opacity-80 border-b border-white/10 pb-1">
                                        <span className="font-bold flex items-center gap-1">
                                            <span>[{log.timestamp}]</span>
                                            <span className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                                                log.level === 'ERROR' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-white'
                                            }`}>
                                                {log.level}
                                            </span>
                                        </span>
                                        <span className="truncate max-w-[280px] font-mono text-[10px] text-slate-400">
                                            {log.url}
                                        </span>
                                    </div>
                                    <div className="font-semibold text-xs mt-1 text-slate-100 whitespace-pre-wrap">
                                        {log.message}
                                    </div>
                                    {log.stack && (
                                        <pre className="mt-1 p-2 bg-black/60 rounded text-[10px] text-rose-300 overflow-x-auto whitespace-pre-wrap max-h-40">
                                            {log.stack}
                                        </pre>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-900 px-4 py-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
                        <span>Archivo VPS: /opt/geeksoft_engine/frontend_runtime_errors.log</span>
                        <span>API: https://forecast.geeksoft.tech/api/v1/forecast/telemetry-log</span>
                    </div>

                </div>
            )}
        </>
    );
};
