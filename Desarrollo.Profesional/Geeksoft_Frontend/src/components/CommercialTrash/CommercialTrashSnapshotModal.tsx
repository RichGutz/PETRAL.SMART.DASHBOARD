import React, { useState } from 'react';
import { X, Copy, Check, RotateCcw, AlertTriangle, Database } from 'lucide-react';
import type { TrashItem } from '../../types/commercialTrash';

interface CommercialTrashSnapshotModalProps {
    item: TrashItem | null;
    onClose: () => void;
    onRestore: (item: TrashItem) => void;
    isRestoring?: boolean;
}

export const CommercialTrashSnapshotModal: React.FC<CommercialTrashSnapshotModalProps> = ({
    item,
    onClose,
    onRestore,
    isRestoring = false
}) => {
    const [copied, setCopied] = useState(false);

    if (!item) return null;

    const payload = item.payload || {};
    let legsData: any[] = [];
    if (payload.legs_data) {
        if (Array.isArray(payload.legs_data)) {
            legsData = payload.legs_data;
        } else if (typeof payload.legs_data === 'string') {
            try {
                legsData = JSON.parse(payload.legs_data);
            } catch (e) {
                legsData = [];
            }
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getBadgeStyle = (type: string) => {
        switch (type) {
            case 'CIERRE': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
            case 'COTIZACION': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'PRESUPUESTO': return 'bg-amber-100 text-amber-800 border-amber-300';
            case 'MATRIZ': return 'bg-purple-100 text-purple-800 border-purple-300';
            default: return 'bg-slate-100 text-slate-800 border-slate-300';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
                            <Database size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getBadgeStyle(item.entity_type)}`}>
                                    {item.entity_type}
                                </span>
                                <h3 className="text-sm font-bold text-white tracking-wide truncate max-w-md">
                                    {item.document_name}
                                </h3>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Inspección Forense de Snapshot • Tabla Origen: <code className="text-slate-300 font-mono">{item.source_table}</code>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                    {/* Meta info cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente</span>
                            <span className="font-bold text-slate-800 text-xs">{item.client_name || 'N/A'}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Buque</span>
                            <span className="font-bold text-slate-800 text-xs">{item.vessel_id || payload.vessel_id || 'Flota / General'}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Eliminado Por</span>
                            <span className="font-bold text-slate-800 text-xs truncate block" title={item.deleted_by}>
                                {item.deleted_by}
                            </span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha de Baja</span>
                            <span className="font-semibold text-slate-700 text-xs">
                                {new Date(item.deleted_at).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Piernas de Viaje (si aplica) */}
                    {legsData && legsData.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                <span>🗺️</span> Piernas del Itinerario ({legsData.length} piernas)
                            </h4>
                            <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-48">
                                <table className="w-full text-left border-collapse text-[11px]">
                                    <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                                        <tr>
                                            <th className="p-2 border-b">#</th>
                                            <th className="p-2 border-b">Origen</th>
                                            <th className="p-2 border-b">Destino</th>
                                            <th className="p-2 border-b">Carga (TM)</th>
                                            <th className="p-2 border-b">Flete ($/TM)</th>
                                            <th className="p-2 border-b">Días Naveg.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {legsData.map((leg: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="p-2 font-bold text-slate-400">{idx + 1}</td>
                                                <td className="p-2 font-semibold text-slate-700">{leg.origin || leg.from_port || leg.origin_port_id || '-'}</td>
                                                <td className="p-2 font-semibold text-slate-700">{leg.destination || leg.to_port || leg.destination_port_id || '-'}</td>
                                                <td className="p-2 font-mono text-slate-600">{leg.cargo_qty?.toLocaleString() || leg.tonnage?.toLocaleString() || '-'}</td>
                                                <td className="p-2 font-mono font-bold text-blue-700">${leg.freight_rate || leg.freight_rate_mt || '-'}</td>
                                                <td className="p-2 font-mono text-slate-600">{leg.sea_days || leg.navigation_days || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Snapshot Crudo en Formato JSON */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                <span>📦</span> Snapshot Completo de Datos (Payload JSON)
                            </h4>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                            >
                                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                <span>{copied ? 'Copiado' : 'Copiar JSON'}</span>
                            </button>
                        </div>
                        <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto max-h-60 text-[10.5px] font-mono leading-relaxed border border-slate-800">
                            {JSON.stringify(payload, null, 2)}
                        </pre>
                    </div>

                    {item.restored && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800">
                            <Check size={16} className="text-emerald-600 shrink-0" />
                            <span>
                                Este documento ya fue restaurado por <strong>{item.restored_by || 'Usuario'}</strong> el{' '}
                                {item.restored_at ? new Date(item.restored_at).toLocaleString() : ''}.
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                        Cerrar
                    </button>

                    {!item.restored ? (
                        <button
                            onClick={() => onRestore(item)}
                            disabled={isRestoring}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <RotateCcw size={14} className={isRestoring ? 'animate-spin' : ''} />
                            <span>{isRestoring ? 'Restaurando...' : 'Restaurar a Origen'}</span>
                        </button>
                    ) : (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <Check size={14} /> Restaurado Activo
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
