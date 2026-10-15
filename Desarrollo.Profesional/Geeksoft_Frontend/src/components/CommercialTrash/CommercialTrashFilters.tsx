import React from 'react';
import { Search, RotateCcw, Filter, Eye } from 'lucide-react';
import type { TrashEntityType, TrashFiltersState } from '../../types/commercialTrash';

interface CommercialTrashFiltersProps {
    filters: TrashFiltersState;
    onChangeFilters: (newFilters: Partial<TrashFiltersState>) => void;
    onRefresh: () => void;
    availableClients: string[];
    isLoading?: boolean;
}

export const CommercialTrashFilters: React.FC<CommercialTrashFiltersProps> = ({
    filters,
    onChangeFilters,
    onRefresh,
    availableClients,
    isLoading = false
}) => {
    const tabs: { label: string; value: TrashEntityType; icon: string; countColor: string }[] = [
        { label: 'Todos', value: 'ALL', icon: '📁', countColor: 'bg-slate-200 text-slate-800' },
        { label: 'Cierres (COA)', value: 'CIERRE', icon: '📜', countColor: 'bg-emerald-100 text-emerald-800' },
        { label: 'Cotizaciones', value: 'COTIZACION', icon: '📑', countColor: 'bg-blue-100 text-blue-800' },
        { label: 'Presupuestos', value: 'PRESUPUESTO', icon: '📊', countColor: 'bg-amber-100 text-amber-800' },
        { label: 'Matrices', value: 'MATRIZ', icon: '📈', countColor: 'bg-purple-100 text-purple-800' }
    ];

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3 w-full">
            {/* Fila 1: Pestañas de Tipo de Entidad */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-2.5">
                {tabs.map(tab => {
                    const isActive = filters.entity_type === tab.value;
                    return (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => onChangeFilters({ entity_type: tab.value })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 select-none ${
                                isActive
                                    ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Fila 2: Búsqueda, Filtro de Cliente y Switch de Restaurados */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre de documento, clave o buque..."
                            value={filters.search}
                            onChange={(e) => onChangeFilters({ search: e.target.value })}
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 placeholder-slate-400"
                        />
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Filter size={14} className="text-slate-400 shrink-0" />
                        <select
                            value={filters.client_name}
                            onChange={(e) => onChangeFilters({ client_name: e.target.value })}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="ALL">Todos los Clientes</option>
                            {availableClients.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors">
                        <input
                            type="checkbox"
                            checked={filters.include_restored}
                            onChange={(e) => onChangeFilters({ include_restored: e.target.checked })}
                            className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                        />
                        <span className="flex items-center gap-1">
                            <Eye size={13} className="text-slate-400" />
                            Incluir Restaurados / Histórico
                        </span>
                    </label>

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isLoading}
                        title="Actualizar listado"
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border border-slate-200 disabled:opacity-50"
                    >
                        <RotateCcw size={13} className={isLoading ? 'animate-spin text-blue-600' : ''} />
                        <span>Refrescar</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
