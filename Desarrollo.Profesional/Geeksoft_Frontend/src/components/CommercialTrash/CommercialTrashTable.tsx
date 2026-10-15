import React from 'react';
import { RotateCcw, Eye, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { TrashItem } from '../../types/commercialTrash';

interface CommercialTrashTableProps {
    items: TrashItem[];
    isLoading: boolean;
    onViewSnapshot: (item: TrashItem) => void;
    onRestore: (item: TrashItem) => void;
    onPurge: (item: TrashItem) => void;
    restoringId?: string | null;
    purgingId?: string | null;
}

export const CommercialTrashTable: React.FC<CommercialTrashTableProps> = ({
    items,
    isLoading,
    onViewSnapshot,
    onRestore,
    onPurge,
    restoringId,
    purgingId
}) => {
    const getBadgeStyle = (type: string) => {
        switch (type) {
            case 'CIERRE':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20';
            case 'COTIZACION':
                return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20';
            case 'PRESUPUESTO':
                return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20';
            case 'MATRIZ':
                return 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/20';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200 ring-1 ring-slate-500/20';
        }
    };

    const formatRelativeTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);

            if (diffHours < 1) return 'Hace unos momentos';
            if (diffHours < 24) return `Hace ${diffHours}h`;
            if (diffDays === 1) return 'Ayer';
            if (diffDays < 30) return `Hace ${diffDays} días`;
            return date.toLocaleDateString();
        } catch {
            return dateStr;
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs">
                <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-full animate-spin mb-3">
                    <RotateCcw size={24} />
                </div>
                <p className="text-xs font-semibold text-slate-600">Consultando registros de la papelera comercial...</p>
            </div>
        );
    }

    if (!items || items.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs">
                <div className="inline-flex items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-full mb-3">
                    <CheckCircle2 size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Papelera Limpia</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    No hay documentos eliminados pendientes en este criterio de búsqueda.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden w-full flex-1">
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 select-none">
                        <tr>
                            <th className="py-3 px-4 w-28">Tipo</th>
                            <th className="py-3 px-4">Documento Comercial</th>
                            <th className="py-3 px-4 w-28">Cliente</th>
                            <th className="py-3 px-4 w-32">Buque</th>
                            <th className="py-3 px-4 w-44">Eliminado Por</th>
                            <th className="py-3 px-4 w-36">Fecha Baja</th>
                            <th className="py-3 px-4 w-28 text-center">Estado</th>
                            <th className="py-3 px-4 w-48 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal">
                        {items.map((item) => {
                            const isRestoringThis = restoringId === item.id;
                            const isPurgingThis = purgingId === item.id;
                            return (
                                <tr
                                    key={item.id}
                                    className={`hover:bg-slate-50/80 transition-colors ${
                                        item.restored ? 'opacity-70 bg-slate-50/30' : ''
                                    }`}
                                >
                                    {/* Tipo */}
                                    <td className="py-3 px-4">
                                        <span
                                            className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${getBadgeStyle(
                                                item.entity_type
                                            )}`}
                                        >
                                            {item.entity_type}
                                        </span>
                                    </td>

                                    {/* Documento Comercial */}
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col">
                                            <span
                                                onClick={() => onViewSnapshot(item)}
                                                className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer truncate max-w-xl 2xl:max-w-4xl transition-colors"
                                                title={item.document_name}
                                            >
                                                {item.document_name}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-mono">
                                                ID: {item.entity_id} • Tabla: {item.source_table}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Cliente */}
                                    <td className="py-2.5 px-3.5">
                                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                            {item.client_name || 'N/A'}
                                        </span>
                                    </td>

                                    {/* Buque */}
                                    <td className="py-2.5 px-3.5">
                                        <span className="font-semibold text-slate-600 text-[11px] truncate block">
                                            {item.vessel_id || 'Flota / General'}
                                        </span>
                                    </td>

                                    {/* Eliminado Por */}
                                    <td className="py-2.5 px-3.5">
                                        <span
                                            className="text-slate-600 text-[11px] truncate block max-w-[140px]"
                                            title={item.deleted_by}
                                        >
                                            {item.deleted_by || 'Usuario'}
                                        </span>
                                    </td>

                                    {/* Fecha Baja */}
                                    <td className="py-2.5 px-3.5">
                                        <div className="flex items-center gap-1 text-slate-500 text-[11px]" title={new Date(item.deleted_at).toLocaleString()}>
                                            <Clock size={12} className="text-slate-400 shrink-0" />
                                            <span>{formatRelativeTime(item.deleted_at)}</span>
                                        </div>
                                    </td>

                                    {/* Estado */}
                                    <td className="py-2.5 px-3.5 text-center">
                                        {item.restored ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <CheckCircle2 size={11} /> Restaurado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                En Papelera
                                            </span>
                                        )}
                                    </td>

                                    {/* Acciones */}
                                    <td className="py-2.5 px-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {/* Botón Ver Snapshot */}
                                            <button
                                                type="button"
                                                onClick={() => onViewSnapshot(item)}
                                                title="Inspeccionar datos"
                                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                            >
                                                <Eye size={14} />
                                            </button>

                                            {/* Botón Restaurar */}
                                            {!item.restored && (
                                                <button
                                                    type="button"
                                                    onClick={() => onRestore(item)}
                                                    disabled={isRestoringThis}
                                                    title="Restaurar a Maestro Original"
                                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    <RotateCcw size={12} className={isRestoringThis ? 'animate-spin' : ''} />
                                                    <span>{isRestoringThis ? '...' : 'Restaurar'}</span>
                                                </button>
                                            )}

                                            {/* Botón Purgar Definitivo */}
                                            <button
                                                type="button"
                                                onClick={() => onPurge(item)}
                                                disabled={isPurgingThis}
                                                title="Eliminación definitiva (Purgar)"
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 disabled:opacity-50"
                                            >
                                                <Trash2 size={14} className={isPurgingThis ? 'animate-pulse' : ''} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
