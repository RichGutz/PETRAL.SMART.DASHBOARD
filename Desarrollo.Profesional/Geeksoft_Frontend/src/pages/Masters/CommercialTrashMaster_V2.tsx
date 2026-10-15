import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { CommercialTrashService } from '../../services/commercialTrashService';
import { CommercialTrashFilters } from '../../components/CommercialTrash/CommercialTrashFilters';
import { CommercialTrashTable } from '../../components/CommercialTrash/CommercialTrashTable';
import { CommercialTrashSnapshotModal } from '../../components/CommercialTrash/CommercialTrashSnapshotModal';
import type { TrashItem, TrashFiltersState } from '../../types/commercialTrash';
import { useAuth } from '../../context/AuthContext';
import { Trash2, RotateCcw, ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export const CommercialTrashMaster_V2: React.FC = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<TrashItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null);
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const [purgingId, setPurgingId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const [filters, setFilters] = useState<TrashFiltersState>({
        entity_type: 'ALL',
        client_name: 'ALL',
        include_restored: false,
        search: ''
    });

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    const loadTrash = async () => {
        setIsLoading(true);
        try {
            const data = await CommercialTrashService.getTrashItems(filters);
            setItems(data);
        } catch (err: any) {
            console.error('Error al cargar papelera comercial:', err);
            showToast('Error al conectar con la papelera de reciclaje.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTrash();
    }, [filters.entity_type, filters.client_name, filters.include_restored]);

    // Extraer lista única de clientes para el dropdown
    const availableClients = useMemo(() => {
        const set = new Set<string>();
        items.forEach(it => {
            if (it.client_name && it.client_name.trim()) {
                set.add(it.client_name.trim().toUpperCase());
            }
        });
        return Array.from(set).sort();
    }, [items]);

    // Filtrado en memoria para búsqueda textual instantánea
    const filteredItems = useMemo(() => {
        let result = items;
        if (filters.search && filters.search.trim()) {
            const q = filters.search.trim().toLowerCase();
            result = result.filter(it =>
                it.document_name.toLowerCase().includes(q) ||
                it.entity_id.toLowerCase().includes(q) ||
                (it.vessel_id && it.vessel_id.toLowerCase().includes(q)) ||
                (it.client_name && it.client_name.toLowerCase().includes(q)) ||
                it.deleted_by.toLowerCase().includes(q)
            );
        }
        return result;
    }, [items, filters.search]);

    // Contadores por tipo de documento
    const stats = useMemo(() => {
        const active = items.filter(i => !i.restored);
        return {
            total: active.length,
            cierres: active.filter(i => i.entity_type === 'CIERRE').length,
            cotizaciones: active.filter(i => i.entity_type === 'COTIZACION').length,
            presupuestos: active.filter(i => i.entity_type === 'PRESUPUESTO').length,
            matrices: active.filter(i => i.entity_type === 'MATRIZ').length
        };
    }, [items]);

    const handleRestore = async (item: TrashItem) => {
        const confirmRestore = window.confirm(
            `¿Desea restaurar el documento "${item.document_name}" a su maestro de origen (${item.source_table})?`
        );
        if (!confirmRestore) return;

        setRestoringId(item.id);
        try {
            const res = await CommercialTrashService.restoreTrashItem(item.id, user?.email || 'Usuario Comercial');
            showToast(`Documento "${item.document_name}" restaurado exitosamente.`);
            if (selectedItem?.id === item.id) {
                setSelectedItem(null);
            }
            await loadTrash();
            // Disparar evento para actualizar badges en la barra lateral
            window.dispatchEvent(new Event('commercial_trash_updated'));
        } catch (err: any) {
            console.error('Error al restaurar elemento:', err);
            showToast(`Error al restaurar: ${err?.response?.data?.detail || err.message}`, 'error');
        } finally {
            setRestoringId(null);
        }
    };

    const handlePurge = async (item: TrashItem) => {
        const confirmPurge = window.confirm(
            `⚠️ ATENCIÓN: Esta acción es DESTRUCTIVA E IRREVERSIBLE.\n\n¿Está totalmente seguro de purgar y eliminar definitivamente el documento "${item.document_name}" de la base de datos?`
        );
        if (!confirmPurge) return;

        setPurgingId(item.id);
        try {
            await CommercialTrashService.purgeTrashItem(item.id);
            showToast(`Documento "${item.document_name}" purgado definitivamente.`);
            if (selectedItem?.id === item.id) {
                setSelectedItem(null);
            }
            await loadTrash();
            window.dispatchEvent(new Event('commercial_trash_updated'));
        } catch (err: any) {
            console.error('Error al purgar elemento:', err);
            showToast(`Error al purgar: ${err?.response?.data?.detail || err.message}`, 'error');
        } finally {
            setPurgingId(null);
        }
    };

    return (
        <MasterTemplate
            title="Papelera de Reciclaje Comercial"
            subtitle="Custodia segura, recuperación forense y reversión de documentos eliminados (Cierres, Cotizaciones, Presupuestos y Matrices)"
            activeTab="commercial-trash"
        >
            <div className="space-y-4 max-w-7xl mx-auto pb-10">
                {/* Banner de Notificación / Toast */}
                {toastMessage && (
                    <div
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm ${
                            toastMessage.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {toastMessage.type === 'success' ? (
                                <CheckCircle2 size={16} className="text-emerald-600" />
                            ) : (
                                <AlertTriangle size={16} className="text-red-600" />
                            )}
                            <span>{toastMessage.text}</span>
                        </div>
                    </div>
                )}

                {/* Banner Informativo de Arquitectura Benoit Blanc */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
                            <Trash2 size={22} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                                <span>Custodia de Integridad Comercial (Safe Soft-Delete)</span>
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                                    Zero-Data-Loss
                                </span>
                            </h2>
                            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                                Todo documento eliminado en Maestros Comerciales es capturado íntegramente con sus piernas, costos y fletes. Ningún dato se pierde y puede retornarse a su origen con un solo clic.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tarjetas de Estadísticas / KPI */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Total en Papelera</div>
                        <div className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Pendientes de restauración</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                        <div className="text-[10px] uppercase font-bold text-emerald-600">Cierres (COA)</div>
                        <div className="text-xl font-black text-emerald-700 mt-0.5">{stats.cierres}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Contratos y acuerdos</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                        <div className="text-[10px] uppercase font-bold text-blue-600">Cotizaciones</div>
                        <div className="text-xl font-black text-blue-700 mt-0.5">{stats.cotizaciones}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Rutas Spot evaluadas</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                        <div className="text-[10px] uppercase font-bold text-amber-600">Presupuestos</div>
                        <div className="text-xl font-black text-amber-700 mt-0.5">{stats.presupuestos}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Forecasts comerciales</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                        <div className="text-[10px] uppercase font-bold text-purple-600">Matrices</div>
                        <div className="text-xl font-black text-purple-700 mt-0.5">{stats.matrices}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Reglas de costos</div>
                    </div>
                </div>

                {/* Filtros de la Papelera */}
                <CommercialTrashFilters
                    filters={filters}
                    onChangeFilters={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
                    onRefresh={loadTrash}
                    availableClients={availableClients}
                    isLoading={isLoading}
                />

                {/* Tabla Forense */}
                <CommercialTrashTable
                    items={filteredItems}
                    isLoading={isLoading}
                    onViewSnapshot={(item) => setSelectedItem(item)}
                    onRestore={handleRestore}
                    onPurge={handlePurge}
                    restoringId={restoringId}
                    purgingId={purgingId}
                />

                {/* Modal de Inspección Forense de Snapshot */}
                <CommercialTrashSnapshotModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onRestore={handleRestore}
                    isRestoring={restoringId === selectedItem?.id}
                />
            </div>
        </MasterTemplate>
    );
};
