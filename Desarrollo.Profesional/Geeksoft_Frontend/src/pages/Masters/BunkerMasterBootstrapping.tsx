import React, { useState, useEffect, useCallback } from 'react';
import { 
    Plus, Sparkles, Fuel, RefreshCw, FileText, Layers, 
    ArrowLeft, ShieldCheck, Download, AlertCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { BunkerFleetTabs } from '../../components/Masters/BunkerBootstrapping/BunkerFleetTabs';
import { BunkerKpis } from '../../components/Masters/BunkerBootstrapping/BunkerKpis';
import { BunkerEventsHistoryTable } from '../../components/Masters/BunkerBootstrapping/BunkerEventsHistoryTable';
import { BunkerInvoicesTable } from '../../components/Masters/BunkerBootstrapping/BunkerInvoicesTable';
import { BunkerBootstrapModal } from '../../components/Masters/BunkerBootstrapping/BunkerBootstrapModal';
import { BunkerBunkeringWizardModal } from '../../components/Masters/BunkerBootstrapping/BunkerBunkeringWizardModal';
import { BunkerPdfViewerModal } from '../../components/Masters/BunkerBootstrapping/BunkerPdfViewerModal';
import { BunkerBootstrappingService } from '../../services/bunkerBootstrappingService';
import type { BunkeringEventRecord, InvoiceRecord } from '../../services/bunkerBootstrappingService';

export const BunkerMasterBootstrapping: React.FC = () => {
    const navigate = useNavigate();
    const [activeVessel, setActiveVessel] = useState<string>('MOQUEGUA');
    const [activeView, setActiveView] = useState<'events' | 'invoices'>('events');

    const [events, setEvents] = useState<BunkeringEventRecord[]>([]);
    const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Modals
    const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
    const [isBootstrapOpen, setIsBootstrapOpen] = useState<boolean>(false);

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
            const [evs, invs] = await Promise.all([
                BunkerBootstrappingService.getVesselEvents(activeVessel),
                BunkerBootstrappingService.getVesselInvoices(activeVessel),
            ]);
            setEvents(evs);
            setInvoices(invs);
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

    const latestEvent = events.length > 0 ? events[0] : undefined;

    return (
        <MasterTemplate activeTab="bunker-bootstrapping">
            <div className="flex flex-col gap-4 w-full pb-12">
                
                {/* 1. Header Superior & Acciones Principales */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                            <Fuel size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black uppercase tracking-wider text-white">
                                    Maestro de Búnker: Bootstrapping & Facturación V2
                                </h1>
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    PONDERADO DINÁMICO
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                                Cadena de Precios P_N • Soporte Multifactura por Tanqueo • Repositorio PDF Digital
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2.5">
                        <button
                            type="button"
                            onClick={loadData}
                            disabled={loading}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                            title="Refrescar datos"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin text-blue-400" : ""} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsBootstrapOpen(true)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                            <Sparkles size={15} />
                            <span>Saldo Inicial (Bootstrapping)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsWizardOpen(true)}
                            className="px-4 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                        >
                            <Plus size={16} />
                            <span>Nuevo Tanqueo (Asistente)</span>
                        </button>
                    </div>
                </div>

                {/* 2. Selector de Buque (Tabs) */}
                <BunkerFleetTabs
                    activeVessel={activeVessel}
                    onSelectVessel={setActiveVessel}
                />

                {/* 3. Indicadores Clave KPI */}
                <BunkerKpis
                    latestEvent={latestEvent}
                    activeVessel={activeVessel}
                />

                {/* 4. Switch de Vistas (Eventos vs Facturas) */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setActiveView('events')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                activeView === 'events'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Layers size={14} />
                            <span>Eventos de Tanqueo ({events.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveView('invoices')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                activeView === 'invoices'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <FileText size={14} />
                            <span>Repositorio de Facturas ({invoices.length})</span>
                        </button>
                    </div>

                    <div className="text-xs text-slate-400 font-mono hidden sm:block">
                        Mostrando datos para: <span className="text-white font-bold">{activeVessel}</span>
                    </div>
                </div>

                {/* 5. Tabla Principal según Vista */}
                {loading ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-400 font-mono">
                        <RefreshCw size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
                        <p className="text-sm font-bold text-white">Sincronizando estado del búnker...</p>
                    </div>
                ) : activeView === 'events' ? (
                    <BunkerEventsHistoryTable
                        events={events}
                        onOpenPdfViewer={handleOpenPdf}
                        onDeleteEvent={handleDeleteEvent}
                    />
                ) : (
                    <BunkerInvoicesTable
                        invoices={invoices}
                        onOpenPdfViewer={handleOpenPdf}
                    />
                )}

                {/* Modals */}
                <BunkerBootstrapModal
                    isOpen={isBootstrapOpen}
                    onClose={() => setIsBootstrapOpen(false)}
                    onSuccess={loadData}
                    initialVesselId={activeVessel === 'TODOS' ? 'MOQUEGUA' : activeVessel}
                />

                <BunkerBunkeringWizardModal
                    isOpen={isWizardOpen}
                    onClose={() => setIsWizardOpen(false)}
                    onSuccess={loadData}
                    activeVessel={activeVessel}
                    latestEvent={latestEvent}
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
