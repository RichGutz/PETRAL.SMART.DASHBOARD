import React, { useState, useEffect, useRef } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { Plus, Trash2, Edit3, X, Calendar, DollarSign, FileUp, Building2, User as UserIcon, Clock, Flame } from 'lucide-react';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import { useAuth } from '../../context/AuthContext';
import type { ExportColumn } from '../../lib/masterExport';

interface BunkerRow {
    id?: string;
    date: string;
    fuel_type: 'IFO' | 'MDO';
    supplier: string;
    market_price_usd: number;
    updated_by?: string;
    updated_at?: string;
}

export const BunkerMaster: React.FC = () => {
    const { user } = useAuth();
    const [rows, setRows] = useState<BunkerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isParsingPdf, setIsParsingPdf] = useState(false);
    
    // Referencia de archivo
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Estados del Formulario (Modal / Panel de Edición)
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formDate, setFormDate] = useState('');
    const [formFuelType, setFormFuelType] = useState<'IFO' | 'MDO'>('IFO');
    const [formSupplier, setFormSupplier] = useState('OIL TRADING S.A.C.');
    const [formPrice, setFormPrice] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const rawPrices = await ForecastService.getBunkerPrices();
            
            // Mapear cada registro individual por combustible
            const list: BunkerRow[] = (rawPrices || []).map((row: any) => ({
                id: `${row.fuel_type}_${row.date}`,
                date: row.date || '',
                fuel_type: (row.fuel_type || 'IFO').toUpperCase() as 'IFO' | 'MDO',
                supplier: row.supplier || row.provider || 'OIL TRADING S.A.C.',
                market_price_usd: Number(row.market_price_usd) || 0,
                updated_by: row.updated_by || 'RICHARD GUTIERREZ',
                updated_at: row.updated_at || row.created_at || row.date
            }));
            
            // Ordenar por fecha descendente (más reciente primero) y luego por tipo de combustible
            const sorted = list.sort((a, b) => {
                const dateCompare = b.date.localeCompare(a.date);
                if (dateCompare !== 0) return dateCompare;
                return a.fuel_type.localeCompare(b.fuel_type);
            });

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
        setFormFuelType('IFO');
        setFormSupplier('OIL TRADING S.A.C.');
        setFormPrice('');
        setShowForm(true);
    };

    const handleOpenEdit = (row: BunkerRow) => {
        setIsEditing(true);
        setFormDate(row.date);
        setFormFuelType(row.fuel_type);
        setFormSupplier(row.supplier || 'OIL TRADING S.A.C.');
        setFormPrice(row.market_price_usd.toString());
        setShowForm(true);
    };

    const handleUploadPdfClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsParsingPdf(true);
            const data = await ForecastService.parseBunkerPdf(file);
            
            setIsEditing(false);
            const targetDate = data.date || new Date().toISOString().split('T')[0];
            setFormDate(targetDate);
            if (data.supplier) setFormSupplier(data.supplier);
            
            // Detectar tipo de combustible
            if (data.fuel_type === 'MDO' || data.mdo_price > 0) {
                setFormFuelType('MDO');
                setFormPrice(data.mdo_price ? data.mdo_price.toString() : (data.price ? data.price.toString() : ''));
            } else {
                setFormFuelType('IFO');
                setFormPrice(data.ifo_price ? data.ifo_price.toString() : (data.price ? data.price.toString() : ''));
            }
            
            setShowForm(true);
            alert(`Factura leída exitosamente:\n- Fecha: ${targetDate}\n- Combustible: ${data.fuel_type || 'IFO'}\n- Proveedor: ${data.supplier || 'OIL TRADING S.A.C.'}\n- Precio USD/MT: $${data.price || data.ifo_price || data.mdo_price}`);
        } catch (err) {
            console.error("Error al procesar factura PDF:", err);
            alert("Error al procesar la factura PDF. Verifique que el archivo sea un PDF de factura válido.");
        } finally {
            setIsParsingPdf(false);
            e.target.value = '';
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formDate) {
            alert("Por favor, seleccione una fecha.");
            return;
        }
        
        const priceNum = parseFloat(formPrice) || 0;
        
        if (priceNum <= 0) {
            alert("Por favor, ingrese un precio mayor a 0.");
            return;
        }

        const currentUser = user?.full_name || user?.email || 'RICHARD GUTIERREZ';
        const nowIso = new Date().toLocaleString('es-PE');

        try {
            setIsSaving(true);
            const payload = [{ 
                fuel_type: formFuelType, 
                market_price_usd: priceNum, 
                date: formDate, 
                supplier: formSupplier,
                updated_by: currentUser,
                updated_at: nowIso
            }];
            
            await ForecastService.saveBunkerPrices(payload);
            setShowForm(false);
            await loadData();
            alert(`Cotización de ${formFuelType} guardada exitosamente.`);
        } catch (err) {
            console.error("Error al guardar precio de bunker:", err);
            alert("Error al guardar la cotización.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (row: BunkerRow) => {
        if (confirm(`¿Estás seguro de eliminar el registro de ${row.fuel_type} del ${row.date}?`)) {
            try {
                setLoading(true);
                await ForecastService.deleteBunkerPrices(row.date, row.fuel_type);
                await loadData();
                alert("Registro eliminado exitosamente.");
            } catch (err) {
                console.error("Error al eliminar precio de bunker:", err);
                alert("Error al eliminar el registro.");
                setLoading(false);
            }
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return '-';
        if (dateStr.includes('/')) return dateStr;
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleString('es-PE');
        } catch {
            return dateStr;
        }
    };

    const latestRecord = rows.length > 0 ? rows[0] : null;

    const exportColumns: ExportColumn[] = [
        { header: 'Fecha Cotización', key: 'date', type: 'string' },
        { header: 'Combustible', key: 'fuel_type', type: 'string' },
        { header: 'Proveedor', key: 'supplier', type: 'string' },
        { header: 'Precio (USD/MT)', key: 'market_price_usd', type: 'currency' },
        { header: 'Registrado Por', key: 'updated_by', type: 'string' },
        { header: 'Fecha/Hora Registro', key: 'updated_at', type: 'string' }
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
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".pdf" 
                className="hidden" 
            />

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 flex flex-col h-[calc(100vh-140px)]">
                {/* Cabecera / Controles */}
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleOpenCreate}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                        >
                            <Plus size={14} /> Registrar Cotización
                        </button>

                        <button 
                            onClick={handleUploadPdfClick}
                            disabled={isParsingPdf}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                            {isParsingPdf ? (
                                <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <FileUp size={14} />
                            )}
                            {isParsingPdf ? "Leyendo Factura..." : "📄 Cargar Factura PDF"}
                        </button>

                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50/80 border border-amber-200 px-2.5 py-1 rounded-lg shadow-xs">
                            <span>📌 Regla del Sistema:</span>
                            <span className="font-mono font-black">MGO ➔ MDO</span>
                            <span className="text-[10px] text-amber-700 font-semibold">(Facturas MGO se registran unificadamente como MDO)</span>
                        </div>
                    </div>

                    {/* Resumen de Auditoría ÚLTIMO REGISTRO */}
                    {latestRecord && (
                        <div className="flex items-center gap-3 bg-white border border-slate-200 px-3 py-1 rounded-lg text-xs shadow-xs">
                            <div className="flex items-center gap-1 text-slate-600 font-bold">
                                <UserIcon size={12} className="text-blue-600" />
                                <span>Último Usuario:</span>
                                <span className="text-slate-900 font-black uppercase">{latestRecord.updated_by || 'RICHARD GUTIERREZ'}</span>
                            </div>
                            <div className="h-3.5 w-px bg-slate-200" />
                            <div className="flex items-center gap-1 text-slate-600 font-bold">
                                <Clock size={12} className="text-amber-500" />
                                <span>Fecha/Hora:</span>
                                <span className="text-slate-900 font-mono font-bold">{formatDateTime(latestRecord.updated_at)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Contenedor Grilla */}
                <div className="flex-1 p-6 overflow-auto bg-slate-50/30">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-655 font-black uppercase tracking-wider">
                                        <th className="p-3.5 w-1/6">Fecha Cotización</th>
                                        <th className="p-3.5 w-1/6">Combustible</th>
                                        <th className="p-3.5 w-1/4">Proveedor</th>
                                        <th className="p-3.5 text-right w-1/6">Precio (USD/MT)</th>
                                        <th className="p-3.5 w-1/5">Registrado Por</th>
                                        <th className="p-3.5 w-1/5">Fecha/Hora Registro</th>
                                        <th className="p-3.5 text-center w-20">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-150">
                                    {rows.map((row, idx) => (
                                        <tr key={row.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                {row.date}
                                            </td>
                                            <td className="p-3.5 font-black">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-black uppercase border ${
                                                    row.fuel_type === 'IFO' 
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                                }`}>
                                                    <Flame size={12} className={row.fuel_type === 'IFO' ? 'text-blue-600' : 'text-amber-600'} />
                                                    {row.fuel_type === 'IFO' ? 'IFO 380 VLSFO' : 'MGO / MDO'}
                                                </span>
                                            </td>
                                            <td className="p-3.5 font-semibold text-slate-700">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px]">
                                                    <Building2 size={12} className="text-blue-500" />
                                                    {row.supplier || 'OIL TRADING S.A.C.'}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-right font-mono font-bold text-slate-800 text-sm">
                                                {formatCurrency(row.market_price_usd)}
                                            </td>
                                            <td className="p-3.5">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px]">
                                                    <UserIcon size={11} className="text-slate-500" />
                                                    {row.updated_by || 'RICHARD GUTIERREZ'}
                                                </span>
                                            </td>
                                            <td className="p-3.5 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock size={11} className="text-slate-400" />
                                                    {formatDateTime(row.updated_at)}
                                                </span>
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
                                                    onClick={() => handleDelete(row)}
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
                                            <td colSpan={7} className="p-8 text-center text-slate-400 italic">
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
                                {isEditing ? "Editar Cotización de Combustible" : "Registrar Cotización de Combustible"}
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

                            {/* Tipo de Combustible */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Combustible</label>
                                <select
                                    value={formFuelType}
                                    onChange={(e) => setFormFuelType(e.target.value as 'IFO' | 'MDO')}
                                    disabled={isEditing}
                                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-500 disabled:bg-slate-100"
                                >
                                    <option value="IFO">IFO 380 BAJO AZUFRE (VLSFO)</option>
                                    <option value="MDO">MGO / MDO (DIESEL MARINO)</option>
                                </select>
                            </div>

                            {/* Proveedor */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Proveedor</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formSupplier}
                                        onChange={(e) => setFormSupplier(e.target.value)}
                                        placeholder="Ej. OIL TRADING S.A.C."
                                        required
                                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500 shadow-sm font-semibold text-slate-700 uppercase"
                                    />
                                </div>
                            </div>

                            {/* Precio */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Precio (USD / Tonelada)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formPrice}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setFormPrice(e.target.value)}
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
