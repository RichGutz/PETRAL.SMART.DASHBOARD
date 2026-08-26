import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthService, ForecastService } from '../../services/api';
import { MulticotizadorRetrieverService } from '../../services/providers/multicotizadorRetrieverService';
import { ShieldCheck, Lock, CheckCircle2, Clock, X, AlertTriangle, FileText, UserCheck, Calendar } from 'lucide-react';

interface CierreApprovalModalProps {
    route: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CierreApprovalModal: React.FC<CierreApprovalModalProps> = ({
    route,
    isOpen,
    onClose,
    onSuccess
}) => {
    const { user } = useAuth();
    const [password, setPassword] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen || !route) return null;

    const isAuthorized = user?.role === 'ADMIN' || 
                         user?.email?.toLowerCase().includes('fharten') || 
                         user?.full_name?.toLowerCase().includes('harten') ||
                         (user as any)?.username?.toLowerCase()?.includes('fharten');
    const unpacked = MulticotizadorRetrieverService.unpackQuoteData(route);
    const legs = route.legs_data || {};
    const meta = legs.contract_metadata || {};

    const rawStatus = (route.status || meta.status || meta.contract_status || 'BORRADOR').toUpperCase();
    const isFirme = rawStatus === 'FIRME' || rawStatus === 'APROBADO' || rawStatus === 'ACTIVE';

    const approvedByName = route.approved_by_name || legs.approved_by_name || meta.approved_by_name || '';
    const approvedByEmail = route.approved_by || legs.approved_by || meta.approved_by || '';
    const approvedAt = route.approved_at || legs.approved_at || meta.approved_at || '';
    const approvalNotes = route.approval_notes || legs.approval_notes || meta.approval_notes || '';

    const handleAction = async (newStatus: 'FIRME' | 'BORRADOR') => {
        if (!isAuthorized) {
            setErrorMsg('Acción denegada: Solo los administradores o personal autorizado pueden autorizar o cambiar el estado de este cierre.');
            return;
        }

        if (!password.trim()) {
            setErrorMsg('Debe ingresar su contraseña de usuario como firma de seguridad.');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            // 1. Validar la contraseña contra el backend
            await AuthService.login({
                email: user?.email || '',
                password: password
            });

            // 2. Preparar el payload con la auditoría
            const nowIso = new Date().toISOString();
            const updatedLegsData = {
                ...legs,
                status: newStatus,
                contract_metadata: {
                    ...(meta || {}),
                    status: newStatus,
                    contract_status: newStatus,
                    approved_by: user?.email,
                    approved_by_name: user?.full_name,
                    approved_at: nowIso,
                    approval_notes: notes.trim()
                },
                approved_by: user?.email,
                approved_by_name: user?.full_name,
                approved_at: nowIso,
                approval_notes: notes.trim()
            };

            const payload = {
                ...route,
                status: newStatus,
                is_contract: true,
                approved_by: user?.email,
                approved_by_name: user?.full_name,
                approved_at: nowIso,
                approval_notes: notes.trim(),
                legs_data: updatedLegsData
            };

            // 3. Guardar en base de datos
            await ForecastService.saveSpot(payload);

            setPassword('');
            setNotes('');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Error verifying admin credentials or saving:", err);
            const detail = err.response?.data?.detail || err.response?.data?.message || 'Contraseña de administrador incorrecta. Autorización denegada.';
            setErrorMsg(detail);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                
                {/* Cabecera del Modal */}
                <div className={`p-4 border-b flex items-center justify-between ${isFirme ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/70 border-amber-200'}`}>
                    <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl shadow-2xs ${isFirme ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                            {isFirme ? <ShieldCheck size={20} /> : <Lock size={20} />}
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                                <span>Gobernanza Comercial: Cierre</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${isFirme ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>
                                    {isFirme ? 'FIRME' : 'BORRADOR'}
                                </span>
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                                {isFirme ? 'Cierre comercial formalmente autorizado y firmado' : 'Cierre comercial pendiente de firma por Administración'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Cuerpo del Modal */}
                <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
                    
                    {/* Tarjeta Resumen del Cierre */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <span className="text-xs font-black text-slate-800 font-mono flex items-center gap-1.5">
                                📍 {route.name}
                            </span>
                            <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                                {route.client_id || unpacked.selectedClient || 'Cliente No Especificado'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600 pt-1">
                            <div className="flex items-center gap-1.5">
                                <Calendar size={13} className="text-slate-400" />
                                <span>Vigencia: <strong className="text-slate-800 font-mono">{unpacked.valid_from || '—'} ➔ {unpacked.valid_to || '—'}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <FileText size={13} className="text-slate-400" />
                                <span>Buque: <strong className="text-slate-800">{unpacked.vessel_id || '—'}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5 col-span-2 text-slate-500 text-[10.5px]">
                                <span>Creado por: <strong className="text-slate-700">{route.created_by || 'Comercial'}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Registro de Auditoría si ya fue aprobado */}
                    {isFirme && approvedAt && (
                        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 flex flex-col gap-1.5 text-xs text-emerald-950">
                            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                                <UserCheck size={14} className="text-emerald-700" />
                                <span>Firma de Autorización Registrada</span>
                            </div>
                            <div className="text-[11px] text-emerald-800 font-medium">
                                Aprobado por <strong>{approvedByName || approvedByEmail}</strong> ({approvedByEmail}) el <strong>{new Date(approvedAt).toLocaleString()}</strong>.
                            </div>
                            {approvalNotes && (
                                <div className="text-[11px] bg-white/80 rounded p-2 border border-emerald-200 text-slate-700 mt-1 italic">
                                    "{approvalNotes}"
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mensaje de Error / Alerta */}
                    {errorMsg && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-rose-700">
                            <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Formulario de Firma (Exclusivo para ADMIN / Personal Autorizado) */}
                    {isAuthorized ? (
                        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck size={15} className="text-blue-600" />
                                <span>Firma de Seguridad y Autorización</span>
                            </h4>
                            
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                                    Notas u Observaciones de Auditoría:
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Comentarios sobre tarifas aprobadas, condiciones comerciales o vigencia..."
                                    rows={2}
                                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-tight flex items-center justify-between">
                                    <span>Contraseña de Ingreso ({user?.email}):</span>
                                    <span className="text-[9px] font-mono text-slate-400">Requerida para firmar</span>
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center gap-3 text-xs text-slate-600 font-medium">
                            <Lock size={20} className="text-slate-400 shrink-0" />
                            <span>
                                Esta operación requiere privilegios de <strong>Administrador o Personal Autorizado</strong>. Los usuarios estándar pueden visualizar la información del cierre pero no modificar su estado.
                            </span>
                        </div>
                    )}

                </div>

                {/* Botones de Pie */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        Cerrar
                    </button>

                    {isAuthorized && (
                        <div className="flex items-center gap-2">
                            {isFirme ? (
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => handleAction('BORRADOR')}
                                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <Clock size={14} />
                                    )}
                                    <span>Devolver a BORRADOR</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => handleAction('FIRME')}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <CheckCircle2 size={14} />
                                    )}
                                    <span>Autorizar y Pasar a FIRME</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
