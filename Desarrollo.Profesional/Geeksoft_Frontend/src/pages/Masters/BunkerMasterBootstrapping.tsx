import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Plus, Sparkles, Fuel, RefreshCw, FileText, Layers, 
    ArrowLeft, ShieldCheck, Download, AlertCircle, Search, X, Calendar, Anchor, FileSpreadsheet, Archive
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { BunkerFleetTabs } from '../../components/Masters/BunkerBootstrapping/BunkerFleetTabs';
import { BunkerEventsHistoryTable } from '../../components/Masters/BunkerBootstrapping/BunkerEventsHistoryTable';
import { BunkerBootstrapModal } from '../../components/Masters/BunkerBootstrapping/BunkerBootstrapModal';
import { BunkerBunkeringWizardModal } from '../../components/Masters/BunkerBootstrapping/BunkerBunkeringWizardModal';
import { BunkerPdfViewerModal } from '../../components/Masters/BunkerBootstrapping/BunkerPdfViewerModal';
import { BunkerEditBunkeringModal } from '../../components/Masters/BunkerBootstrapping/BunkerEditBunkeringModal';
import { BunkerBootstrappingService } from '../../services/bunkerBootstrappingService';
import type { BunkeringEventRecord } from '../../services/bunkerBootstrappingService';

export const BunkerMasterBootstrapping: React.FC = () => {
    const navigate = useNavigate();
    const [activeVessel, setActiveVessel] = useState<string>('MOQUEGUA');

    // Datos maestros
    const [events, setEvents] = useState<BunkeringEventRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Filtros Omnibox y Periodo
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedPeriodo, setSelectedPeriodo] = useState<string>('TODOS');

    // Selección múltiple (Checkboxes)
    const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());

    // Modals
    const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
    const [isBootstrapOpen, setIsBootstrapOpen] = useState<boolean>(false);
    const [isEditBunkeringOpen, setIsEditBunkeringOpen] = useState<boolean>(false);
    const [editingEvent, setEditingEvent] = useState<BunkeringEventRecord | null>(null);

    const handleEditEvent = (event: BunkeringEventRecord) => {
        setEditingEvent(event);
        if (event.is_bootstrap) {
            setIsBootstrapOpen(true);
        } else {
            setIsEditBunkeringOpen(true);
        }
    };

    // Visor de Factura
    const [pdfViewer, setPdfViewer] = useState<{
        isOpen: boolean;
        url: string | null;
        title: string;
        filename?: string;
    }>({
        isOpen: false,
        url: null,
        title: '',
        filename: ''
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const evs = await BunkerBootstrappingService.getVesselEvents(activeVessel);
            setEvents(evs);
        } catch (err: any) {
            console.error('Error cargando datos de bunker:', err);
            setErrorMsg(err.message || 'Error cargando datos');
        } finally {
            setLoading(false);
        }
    }, [activeVessel]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenPdf = (invoiceId: string, invoiceNumber: string, filename?: string) => {
        const streamUrl = BunkerBootstrappingService.getInvoicePdfUrl(invoiceId);
        setPdfViewer({
            isOpen: true,
            url: streamUrl,
            title: `Factura ${invoiceNumber}`,
            filename: filename || `factura_${invoiceNumber}.pdf`
        });
    };

    const handleDeleteEvent = async (eventId: string) => {
        try {
            await BunkerBootstrappingService.deleteBunkeringEvent(eventId);
            await loadData();
        } catch (err: any) {
            alert(`Error eliminando evento: ${err.message}`);
        }
    };

    // Filtro Omnibox en tiempo real
    const filteredEvents = useMemo(() => {
        return events.filter(ev => {
            // Filtro periodo
            if (selectedPeriodo !== 'TODOS') {
                if (!ev.event_date.startsWith(selectedPeriodo)) return false;
            }

            // Omnibox
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchVessel = ev.vessel_id.toLowerCase().includes(q);
                const matchPort = (ev.port_id || '').toLowerCase().includes(q);
                const matchVoyage = (ev.voyage_number || '').toLowerCase().includes(q);
                const matchNotes = (ev.notes || '').toLowerCase().includes(q);
                const matchInvoice = (ev.invoices || []).some(inv => 
                    inv.invoice_number.toLowerCase().includes(q) || 
                    inv.supplier.toLowerCase().includes(q) ||
                    (inv.supplier_ruc || '').includes(q)
                );

                if (!matchVessel && !matchPort && !matchVoyage && !matchNotes && !matchInvoice) {
                    return false;
                }
            }

            return true;
        });
    }, [events, searchQuery, selectedPeriodo]);


    // Periodos disponibles
    const availablePeriodos = useMemo(() => {
        const setP = new Set<string>();
        events.forEach(e => {
            if (e.event_date) {
                const ym = e.event_date.substring(0, 7);
                if (ym) setP.add(ym);
            }
        });
        ['2026-10', '2026-09', '2026-08', '2026-07'].forEach(p => setP.add(p));
        return Array.from(setP).sort().reverse();
    }, [events]);

    const toggleSelectEvent = (id: string) => {
        setSelectedEventIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedEventIds.size === filteredEvents.length) {
            setSelectedEventIds(new Set());
        } else {
            setSelectedEventIds(new Set(filteredEvents.map(e => e.id)));
        }
    };

    // Exportar a Excel multipestaña
    const handleExportExcel = () => {
        const targetList = selectedEventIds.size > 0 
            ? filteredEvents.filter(e => selectedEventIds.has(e.id))
            : filteredEvents;

        if (targetList.length === 0) return;

        const wb = XLSX.utils.book_new();

        // Hoja 1: Resumen de Tanqueadas
        const rowsEvents = targetList.map((e, idx) => ({
            'Item': idx + 1,
            'Código Tanqueada': `TNK-${e.event_date.replace(/-/g, '')}-${e.vessel_id}`,
            'Buque': e.vessel_id,
            'Fecha': e.event_date,
            'Puerto': e.port_id,
            'Viaje': e.voyage_number || 'N/A',
            'Tipo': e.is_bootstrap ? 'GÉNESIS (BOOTSTRAP)' : 'TANQUEO COMPLETO',
            'ROB IFO (TM)': Number(e.rob_ifo_mt),
            'Precio Previo IFO ($/TM)': Number(e.price_prev_ifo_usd),
            'Ponderado IFO ($/TM)': Number(e.weighted_avg_ifo_usd),
            'ROB MDO (TM)': Number(e.rob_mdo_mt),
            'Precio Previo MDO ($/TM)': Number(e.price_prev_mdo_usd),
            'Ponderado MDO ($/TM)': Number(e.weighted_avg_mdo_usd),
            'Factor BAF': Number(e.spcc_baf_factor || 0.9669),
            'Variación BAF (USD/pmt)': Number(e.spcc_baf_variation || -0.1380),
            'N° Facturas': (e.invoices || []).length
        }));

        const wsEvents = XLSX.utils.json_to_sheet(rowsEvents);
        XLSX.utils.book_append_sheet(wb, wsEvents, 'Tanqueadas');

        // Hoja 2: Detalle de Facturas
        const allInvs = targetList.flatMap(e => (e.invoices || []).map(inv => ({
            'Código Tanqueada': `TNK-${e.event_date.replace(/-/g, '')}-${e.vessel_id}`,
            'Buque': inv.vessel_id,
            'Factura N°': inv.invoice_number,
            'Proveedor': inv.supplier,
            'RUC': inv.supplier_ruc || 'N/A',
            'Fecha Emisión': inv.issue_date,
            'Combustible': inv.fuel_type,
            'Cantidad (TM)': Number(inv.quantity_mt),
            'Precio Unitario ($/TM)': Number(inv.unit_price_usd),
            'Total Factura (USD)': Number(inv.total_amount_usd),
            'Tiene PDF': inv.has_pdf ? 'SÍ' : 'NO'
        })));

        if (allInvs.length > 0) {
            const wsInvs = XLSX.utils.json_to_sheet(allInvs);
            XLSX.utils.book_append_sheet(wb, wsInvs, 'Facturas Detalle');
        }

        XLSX.writeFile(wb, `bunker_tanqueadas_${activeVessel}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const latestEvent = events.length > 0 ? events[0] : undefined;

    return (
        <MasterTemplate activeTab="bunker-bootstrapping">
            <div className="flex flex-col gap-6 w-full animate-fadeIn pb-16">
                


                {/* 2. Toolbar Unificada (Fila Única: Omnibox + Pills de Buques + Selector de Periodo + Refrescar) */}
                <div className="glass-card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col gap-4 shadow-2xs">
                    
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        
                        {/* Omnibox de Búsqueda Inteligente */}
                        <div className="relative flex-1 min-w-[280px] max-w-md">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <Search size={14} />
                            </span>
                            <input
                                type="text"
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-8 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] shadow-2xs transition-all"
                                placeholder="Buscar por Nave, Proveedor, Factura, Puerto o N° Viaje..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Pills de Buques */}
                        <BunkerFleetTabs
                            activeVessel={activeVessel}
                            onSelectVessel={setActiveVessel}
                        />

                        {/* Selector de Período y Botón Refrescar */}
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden md:inline">
                                Período:
                            </span>
                            <select
                                value={selectedPeriodo}
                                onChange={(e) => setSelectedPeriodo(e.target.value)}
                                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0284c7] cursor-pointer shadow-2xs"
                            >
                                <option value="TODOS">Todos los Periodos</option>
                                {availablePeriodos.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={loadData}
                                disabled={loading}
                                className="p-2 rounded-xl text-slate-500 hover:text-[#0284c7] hover:bg-blue-50 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                                title="Refrescar datos"
                            >
                                <RefreshCw size={14} className={loading ? "animate-spin text-[#0284c7]" : ""} />
                            </button>
                        </div>
                    </div>

                    {/* Barra de Acciones de la Nave Activa */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={toggleSelectAll}
                                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#0284c7] flex items-center gap-1.5 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={filteredEvents.length > 0 && selectedEventIds.size === filteredEvents.length}
                                    onChange={toggleSelectAll}
                                    className="rounded text-[#0284c7] cursor-pointer"
                                />
                                <span>Seleccionar Todos ({filteredEvents.length})</span>
                            </button>

                            <div className="text-xs text-slate-400 font-mono">
                                Buque Activo: <span className="font-bold text-[#0284c7]">{activeVessel}</span>
                            </div>
                        </div>

                        {/* Botones Operativos con Look Corporativo */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setIsBootstrapOpen(true)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                                title="Establecer Asiento de Apertura (ROB Inicial y precio de corte para la nave)"
                            >
                                <Sparkles size={14} className="text-amber-600" />
                                <span>Asiento de Apertura</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsWizardOpen(true)}
                                className="px-4 py-1.5 rounded-xl text-xs font-black bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                title="Registrar nuevo tanqueo y agrupar múltiples facturas"
                            >
                                <Plus size={15} />
                                <span>+ Nueva Tanqueada</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleExportExcel}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                            >
                                <FileSpreadsheet size={14} className="text-emerald-600" />
                                <span>Descargar Excel</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Contenido Principal: Grilla Unificada de Tanqueos con sus Facturas */}
                {loading ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center text-slate-500 font-mono shadow-2xs">
                        <RefreshCw size={32} className="animate-spin text-[#0284c7] mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Sincronizando estado del búnker...</p>
                    </div>
                ) : (
                    <BunkerEventsHistoryTable
                        events={filteredEvents}
                        onOpenPdfViewer={handleOpenPdf}
                        onDeleteEvent={handleDeleteEvent}
                        onEditEvent={handleEditEvent}
                        selectedEventIds={selectedEventIds}
                        onToggleSelectEvent={toggleSelectEvent}
                    />
                )}

                {/* 5. Modales Operativos */}
                <BunkerBootstrapModal
                    isOpen={isBootstrapOpen}
                    onClose={() => {
                        setIsBootstrapOpen(false);
                        setEditingEvent(null);
                    }}
                    onSuccess={loadData}
                    initialVesselId={activeVessel}
                    editRecord={editingEvent}
                />

                <BunkerBunkeringWizardModal
                    isOpen={isWizardOpen}
                    onClose={() => setIsWizardOpen(false)}
                    onSuccess={loadData}
                    activeVessel={activeVessel}
                    latestEvent={latestEvent}
                />

                <BunkerEditBunkeringModal
                    isOpen={isEditBunkeringOpen}
                    onClose={() => {
                        setIsEditBunkeringOpen(false);
                        setEditingEvent(null);
                    }}
                    onSuccess={loadData}
                    event={editingEvent}
                />

                <BunkerPdfViewerModal
                    isOpen={pdfViewer.isOpen}
                    onClose={() => setPdfViewer(prev => ({ ...prev, isOpen: false }))}
                    pdfUrl={pdfViewer.url}
                    title={pdfViewer.title}
                    filename={pdfViewer.filename}
                />

            </div>
        </MasterTemplate>
    );
};
