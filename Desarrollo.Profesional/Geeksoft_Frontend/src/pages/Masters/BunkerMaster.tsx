import React, { useState, useEffect } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { Plus, Trash2, Edit3, X, Calendar, DollarSign } from 'lucide-react';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import type { ExportColumn } from '../../lib/masterExport';

interface BunkerRow {
    date: string;
    ifo_price: number;
    mdo_price: number;
}

export const BunkerMaster: React.FC = () => {
    const [rows, setRows] = useState<BunkerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Estados del Formulario (Modal / Panel de Edición)
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formDate, setFormDate] = useState('');
    const [formIfo, setFormIfo] = useState('');
    const [formMdo, setFormMdo] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const rawPrices = await ForecastService.getBunkerPrices();
            
            // Agrupar por fecha
            const groups: { [date: string]: BunkerRow } = {};
            rawPrices.forEach((row: any) => {
                const d = row.date;
                if (!groups[d]) {
                    groups[d] = { date: d, ifo_price: 0, mdo_price: 0 };
                }
                if (row.fuel_type === 'IFO') {
                    groups[d].ifo_price = Number(row.market_price_usd) || 0;
                } else if (row.fuel_type === 'MDO') {
                    groups[d].mdo_price = Number(row.market_price_usd) || 0;
                }
            });
            
            // Ordenar por fecha descendente (más reciente primero)
            const sorted = Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
            setRows(sorted);
        } catch (err) {
            console.error("Error al cargar precios de bunker:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenCreate = () => {
        setIsEditing(false);
        setFormDate(new Date().toISOString().split('T')[0]); // Fecha de hoy por defecto
        setFormIfo('');
        setFormMdo('');
        setShowForm(true);
    };

    const handleOpenEdit = (row: BunkerRow) => {
        setIsEditing(true);
        setFormDate(row.date);
        setFormIfo(row.ifo_price.toString());
        setFormMdo(row.mdo_price.toString());
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formDate) {
            alert("Por favor, seleccione una fecha.");
            return;
        }
        
        const ifoNum = parseFloat(formIfo);
        const mdoNum = parseFloat(formMdo);
        
        if (isNaN(ifoNum) || ifoNum <= 0) {
            alert("Por favor, ingrese un precio IFO válido mayor a 0.");
            return;
        }
        if (isNaN(mdoNum) || mdoNum <= 0) {
            alert("Por favor, ingrese un precio MDO válido mayor a 0.");
            return;
        }

        try {
            setIsSaving(true);
            const payload = [
                { fuel_type: 'IFO', market_price_usd: ifoNum, date: formDate },
                { fuel_type: 'MDO', market_price_usd: mdoNum, date: formDate }
            ];
            
            await ForecastService.saveBunkerPrices(payload);
            setShowForm(false);
            await loadData();
            alert("Precios de bunker guardados exitosamente.");
        } catch (err) {
            console.error("Error al guardar precios de bunker:", err);
            alert("Error al guardar los precios.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (dateStr: string) => {
        if (confirm(`¿Estás seguro de eliminar el registro de cotización del ${dateStr}?`)) {
            try {
                setLoading(true);
                await ForecastService.deleteBunkerPrices(dateStr);
                await loadData();
                alert("Registro eliminado exitosamente.");
            } catch (err) {
                console.error("Error al eliminar precios de bunker:", err);
                alert("Error al eliminar el registro.");
                setLoading(false);
            }
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    const exportColumns: ExportColumn[] = [
        { header: 'Fecha Cotización', key: 'date', type: 'string' },
        { header: 'Precio IFO (USD/MT)', key: 'ifo_price', type: 'currency' },
        { header: 'Precio MDO (USD/MT)', key: 'mdo_price', type: 'currency' }
    ];

    const handleExportExcel = () => {
        exportMasterToExcel('Maestro de Precios de Bunker', exportColumns, rows);
    };

    const handleExportPDF = () => {
        exportMasterToPDF('Maestro de Precios de Bunker', exportColumns, rows);
    };

    if (loading && rows.length === 0) {
        return (
            <MasterTemplate title="Maestro de Precios de Bunker" activeTab="bunker">
                <div className="flex justify-center items-center h-64 text-slate-500 font-medium">
                    Cargando cotizaciones históricas de combustible...
                </div>
            </MasterTemplate>
        );
    }

    return (
        <MasterTemplate 
            title="Maestro de Precios de Bunker" 
            activeTab="bunker"
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
        >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 flex flex-col h-[calc(100vh-140px)]">
                {/* Cabecera / Controles */}
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <button 
                        onClick={handleOpenCreate}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                    >
                        <Plus size={14} /> Registrar Nueva Cotización
                    </button>
                    
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Historial de Precios de Mercado
                    </span>
                </div>

                {/* Contenedor Grilla */}
                <div className="flex-1 p-6 overflow-auto bg-slate-50/30">
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-655 font-black uppercase tracking-wider">
                                        <th className="p-3.5 w-1/3">Fecha de Cotización</th>
                                        <th className="p-3.5 text-right w-1/4">Precio IFO (USD/MT)</th>
                                        <th className="p-3.5 text-right w-1/4">Precio MDO (USD/MT)</th>
                                        <th className="p-3.5 text-center w-24">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-150">
                                    {rows.map((row) => (
                                        <tr key={row.date} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                {row.date}
                                            </td>
                                            <td className="p-3.5 text-right font-mono font-bold text-slate-700">
                                                {formatCurrency(row.ifo_price)}
                                            </td>
                                            <td className="p-3.5 text-right font-mono font-bold text-slate-700">
                                                {formatCurrency(row.mdo_price)}
                                            </td>
                                            <td className="p-3.5 text-center flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(row)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Editar cotización"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(row.date)}
                                                    className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded transition-colors"
                                                    title="Eliminar registro"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {rows.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                                                No hay cotizaciones de bunker registradas en la base de datos.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* FORMULARIO MODAL (CREACIÓN / EDICIÓN) */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-96 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* Cabecera Modal */}
                        <div className="flex justify-between items-center bg-slate-50 px-4 py-3.5 border-b border-slate-200">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                <DollarSign size={16} className="text-blue-500" />
                                {isEditing ? "Editar Cotización" : "Registrar Nueva Cotización"}
                            </h3>
                            <button 
                                onClick={() => setShowForm(false)} 
                                className="text-slate-400 hover:text-slate-655 p-1 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
                            {/* Fecha */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha de Cotización</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={formDate}
                                        onChange={(e) => setFormDate(e.target.value)}
                                        disabled={isEditing}
                                        required
                                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500 shadow-sm font-mono text-slate-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Precio IFO */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Precio IFO (USD/Tonelada)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formIfo}
                                        onChange={(e) => setFormIfo(e.target.value)}
                                        placeholder="0.00"
                                        required
                                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500 shadow-sm font-mono text-slate-700"
                                    />
                                </div>
                            </div>

                            {/* Precio MDO */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Precio MDO (USD/Tonelada)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formMdo}
                                        onChange={(e) => setFormMdo(e.target.value)}
                                        placeholder="0.00"
                                        required
                                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500 shadow-sm font-mono text-slate-700"
                                    />
                                </div>
                            </div>

                            {/* Footer Modal */}
                            <div className="flex justify-end gap-2 text-xs border-t border-slate-100 pt-4 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="h-8 font-semibold rounded-lg px-4 bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="h-8 font-bold rounded-lg px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 min-w-[80px]"
                                >
                                    {isSaving ? "Guardando..." : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MasterTemplate>
    );
};
