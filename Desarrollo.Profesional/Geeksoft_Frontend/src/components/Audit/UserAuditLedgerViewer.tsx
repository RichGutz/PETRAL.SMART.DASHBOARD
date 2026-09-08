import React, { useState, useEffect, useMemo } from 'react';
import { 
    ShieldCheck, 
    User, 
    Calendar, 
    Search, 
    Filter, 
    ArrowRight, 
    Clock, 
    FileText, 
    Download, 
    AlertTriangle, 
    Layers, 
    Eye, 
    CheckCircle2, 
    Database,
    Laptop,
    History,
    RefreshCw
} from 'lucide-react';
import { AuthService } from '../../services/api';

export interface AuditLogItem {
    id: string | number;
    table_name: string;
    record_id: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE' | 'UPLOAD' | 'EXPORT' | 'LOGIN' | 'EVENT';
    user_email: string;
    user_name?: string;
    user_role?: string;
    ip_address?: string;
    old_data?: Record<string, any> | null;
    new_data?: Record<string, any> | null;
    diff_data?: Record<string, { old: any; new: any }> | null;
    metadata?: Record<string, any> | null;
    created_at: string;
}

export const UserAuditLedgerViewer: React.FC = () => {
    const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedUserTab, setSelectedUserTab] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [actionFilter, setActionFilter] = useState<string>('ALL');
    const [selectedLogForModal, setSelectedLogForModal] = useState<AuditLogItem | null>(null);
    const [usersList, setUsersList] = useState<Array<{ email: string; name: string; role: string }>>([]);

    // Cargar bitácora real desde la base de datos
    const loadAuditLogs = async () => {
        setLoading(true);
        try {
            const data = await AuthService.getAuditLogs({ limit: 200 });
            if (Array.isArray(data)) {
                const formatted: AuditLogItem[] = data.map((d: any) => ({
                    id: d.id,
                    table_name: d.entity || d.table_name || 'General',
                    record_id: d.record_id || 'N/A',
                    action: d.action || 'EVENT',
                    user_email: d.user || d.user_email || 'SYSTEM',
                    user_name: d.user_name || (d.user || d.user_email || '').split('@')[0],
                    ip_address: d.ip || d.ip_address,
                    old_data: d.old_data,
                    new_data: d.new_data,
                    diff_data: d.diff || d.diff_data,
                    metadata: d.metadata,
                    created_at: d.timestamp || d.created_at || new Date().toISOString()
                }));
                setAuditLogs(formatted);
            } else {
                setAuditLogs([]);
            }
        } catch (err) {
            console.error('Error fetching real audit logs:', err);
            setAuditLogs([]);
        } finally {
            setLoading(false);
        }
    };

    // Cargar usuarios registrados para los tabs
    const loadUsers = async () => {
        try {
            const data = await AuthService.getUsers();
            if (data && Array.isArray(data)) {
                setUsersList(data.map((u: any) => ({
                    email: u.email,
                    name: u.full_name || u.email.split('@')[0],
                    role: u.role
                })));
            }
        } catch (e) {
            console.error('Error cargando usuarios:', e);
        }
    };

    useEffect(() => {
        loadAuditLogs();
        loadUsers();
    }, []);

    // Lista única de usuarios combinando logs y base de datos
    const userTabs = useMemo(() => {
        const map = new Map<string, { email: string; name: string; role: string; count: number }>();
        
        // Contar eventos por usuario
        auditLogs.forEach(log => {
            const email = (log.user_email || 'SYSTEM').toLowerCase();
            const existing = map.get(email);
            if (existing) {
                existing.count++;
            } else {
                map.set(email, {
                    email,
                    name: log.user_name || email.split('@')[0],
                    role: log.user_role || 'USER',
                    count: 1
                });
            }
        });

        // Asegurar que aparezcan los usuarios registrados del sistema aunque tengan 0 eventos
        usersList.forEach(u => {
            const email = u.email.toLowerCase();
            if (!map.has(email)) {
                map.set(email, {
                    email,
                    name: u.name,
                    role: u.role,
                    count: 0
                });
            }
        });

        return Array.from(map.values());
    }, [auditLogs, usersList]);

    // Filtrado de registros
    const filteredLogs = useMemo(() => {
        return auditLogs.filter(log => {
            // Filtro de Tab por usuario
            if (selectedUserTab !== 'ALL' && log.user_email.toLowerCase() !== selectedUserTab.toLowerCase()) {
                return false;
            }
            // Filtro por tipo de acción
            if (actionFilter !== 'ALL' && log.action !== actionFilter) {
                return false;
            }
            // Búsqueda de texto
            if (searchTerm.trim() !== '') {
                const term = searchTerm.toLowerCase();
                const matchTable = log.table_name.toLowerCase().includes(term);
                const matchRecord = log.record_id.toLowerCase().includes(term);
                const matchUser = (log.user_name || '').toLowerCase().includes(term) || log.user_email.toLowerCase().includes(term);
                return matchTable || matchRecord || matchUser;
            }
            return true;
        });
    }, [auditLogs, selectedUserTab, actionFilter, searchTerm]);

    // Helpers de visualización
    const getActionBadge = (action: string) => {
        switch (action) {
            case 'INSERT':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">CREACIÓN</span>;
            case 'UPDATE':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">MODIFICACIÓN</span>;
            case 'DELETE':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">ELIMINACIÓN</span>;
            case 'UPLOAD':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300">CARGA ARCHIVO</span>;
            case 'EXPORT':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-300">DESCARGA</span>;
            case 'LOGIN':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-300">ACCESO 2FA</span>;
            default:
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gray-100 text-gray-700">{action}</span>;
        }
    };

    const formatDate = (isoStr: string) => {
        try {
            const d = new Date(isoStr);
            return d.toLocaleString('es-PE', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return isoStr;
        }
    };

    return (
        <div className="space-y-4 font-sans text-slate-800">
            {/* 1. Header Hero con KPIs */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
                        <ShieldCheck size={26} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                                Módulo de Auditoría Forense &amp; Trazabilidad
                            </h1>
                            <span className="bg-teal-50 text-teal-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-teal-200">
                                DELFOS SECURITY VAULT
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Bitácora inmutable en vivo: quién hizo qué, cuándo y qué valores exactos fueron modificados.
                        </p>
                    </div>
                </div>

                {/* Resumen KPIs & Botón Refrescar */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadAuditLogs}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        title="Refrescar Bitácora"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin text-teal-600' : ''} />
                        <span>Actualizar</span>
                    </button>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Total Eventos</div>
                        <div className="text-lg font-black text-slate-800">{auditLogs.length}</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
                        <div className="text-[10px] uppercase font-bold text-emerald-600">Usuarios Registrados</div>
                        <div className="text-lg font-black text-emerald-800">{userTabs.length}</div>
                    </div>
                </div>
            </div>

            {/* 2. Pestañas (Tabs) por Usuario del Sistema */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                    onClick={() => setSelectedUserTab('ALL')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer ${
                        selectedUserTab === 'ALL'
                            ? 'bg-[#0B2545] text-white shadow-md'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    <Layers size={14} />
                    <span>🌟 Todos los Usuarios</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        selectedUserTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                        {auditLogs.length}
                    </span>
                </button>

                {userTabs.map(u => (
                    <button
                        key={u.email}
                        onClick={() => setSelectedUserTab(u.email)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer ${
                            selectedUserTab === u.email
                                ? 'bg-[#0B2545] text-white shadow-md'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        <User size={14} className={u.role === 'ADMIN' ? 'text-amber-400' : 'text-slate-400'} />
                        <span>{u.name}</span>
                        {u.role === 'ADMIN' && (
                            <span className="text-[9px] font-black bg-amber-500/20 text-amber-600 px-1.5 rounded">
                                ADMIN
                            </span>
                        )}
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                            selectedUserTab === u.email ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                            {u.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* 3. Barra de Controles, Búsqueda y Filtro de Acciones */}
            <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar por tabla, código de registro, usuario..."
                            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-slate-400" />
                    <select
                        value={actionFilter}
                        onChange={e => setActionFilter(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-bold focus:outline-none focus:border-slate-800"
                    >
                        <option value="ALL">Todas las Acciones</option>
                        <option value="UPDATE">Solo Modificaciones</option>
                        <option value="INSERT">Solo Creaciones</option>
                        <option value="UPLOAD">Solo Cargas de Archivos (PDF/Excel)</option>
                        <option value="EXPORT">Solo Descargas / Reportes</option>
                        <option value="LOGIN">Solo Accesos 2FA</option>
                    </select>
                </div>
            </div>

            {/* 4. Grilla Principal de Auditoría con Visualizador de Diffs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                <th className="py-3 px-4">Fecha / Hora</th>
                                <th className="py-3 px-4">Usuario Responsable</th>
                                <th className="py-3 px-4">Acción</th>
                                <th className="py-3 px-4">Entidad / Módulo</th>
                                <th className="py-3 px-4">ID Registro</th>
                                <th className="py-3 px-4">Diferencias Forenses (Antes vs Después)</th>
                                <th className="py-3 px-4 text-center">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <div className="animate-spin h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                        <p className="font-bold">Consultando bitácora forense en tiempo real...</p>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-slate-400">
                                        <History size={36} className="mx-auto mb-2 text-slate-300" />
                                        <p className="font-bold text-slate-600 text-sm">No hay registros de auditoría aún</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                                            Las modificaciones de tarifas, cargas de documentos, accesos y cambios realizados por los usuarios se registrarán automáticamente aquí en tiempo real.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                        {/* Fecha / Hora */}
                                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={13} className="text-slate-400" />
                                                <span>{formatDate(log.created_at)}</span>
                                            </div>
                                        </td>

                                        {/* Usuario */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-[10px]">
                                                    {(log.user_name || log.user_email).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{log.user_name || log.user_email}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{log.user_email}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Badge de Acción */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            {getActionBadge(log.action)}
                                        </td>

                                        {/* Entidad Afectada */}
                                        <td className="py-3.5 px-4 font-bold text-slate-800">
                                            {log.table_name}
                                        </td>

                                        {/* ID Registro */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                                {log.record_id}
                                            </span>
                                        </td>

                                        {/* Desglose de Diffs Forenses */}
                                        <td className="py-3.5 px-4 max-w-[400px]">
                                            {log.diff_data && Object.keys(log.diff_data).length > 0 ? (
                                                <div className="space-y-1.5">
                                                    {Object.entries(log.diff_data).map(([field, delta]) => (
                                                        <div key={field} className="text-[11px] bg-slate-50 border border-slate-200/60 rounded px-2 py-1">
                                                            <span className="font-bold text-slate-700">{field}: </span>
                                                            <span className="line-through text-rose-600 bg-rose-50 px-1 rounded mr-1">
                                                                {String(delta.old)}
                                                            </span>
                                                            <ArrowRight size={10} className="inline text-slate-400 mr-1" />
                                                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                                                                {String(delta.new)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : log.metadata ? (
                                                <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200 truncate max-w-[380px]" title={JSON.stringify(log.metadata)}>
                                                    {JSON.stringify(log.metadata)}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic text-[11px]">Sin delta numérico</span>
                                            )}
                                        </td>

                                        {/* Botón Ver Modal */}
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedLogForModal(log)}
                                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                                                title="Ver Ficha Forense Completa"
                                            >
                                                <Eye size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Pericial de Detalle */}
            {selectedLogForModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-[#0B2545] p-5 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-xl">
                                    <ShieldCheck size={20} className="text-teal-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base">Ficha Pericial de Auditoría #{selectedLogForModal.id}</h3>
                                    <p className="text-xs text-blue-200">Trazabilidad inmutable de evento transaccional</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLogForModal(null)}
                                className="text-slate-300 hover:text-white text-lg font-bold p-1 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Usuario</span>
                                    <span className="font-bold text-slate-800 text-sm">{selectedLogForModal.user_name || selectedLogForModal.user_email}</span>
                                    <span className="text-slate-500 font-mono block text-[11px]">{selectedLogForModal.user_email}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha / Hora</span>
                                    <span className="font-bold text-slate-800">{formatDate(selectedLogForModal.created_at)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Acción Realizada</span>
                                    <div className="mt-1">{getActionBadge(selectedLogForModal.action)}</div>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Dirección IP</span>
                                    <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-1">
                                        {selectedLogForModal.ip_address || '127.0.0.1 (Local)'}
                                    </span>
                                </div>
                            </div>

                            {/* Desglose JSON */}
                            <div>
                                <h4 className="font-bold text-slate-700 mb-2">Metadatos &amp; Datos Transaccionales</h4>
                                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto">
                                    {JSON.stringify({
                                        id: selectedLogForModal.id,
                                        entity: selectedLogForModal.table_name,
                                        record_id: selectedLogForModal.record_id,
                                        action: selectedLogForModal.action,
                                        user: selectedLogForModal.user_email,
                                        diff: selectedLogForModal.diff_data,
                                        old_data: selectedLogForModal.old_data,
                                        new_data: selectedLogForModal.new_data,
                                        metadata: selectedLogForModal.metadata
                                    }, null, 2)}
                                </pre>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={() => setSelectedLogForModal(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
                            >
                                Cerrar Ficha
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
