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
    History
} from 'lucide-react';
import { AuthService } from '../../services/api';

export interface AuditLogItem {
    id: string | number;
    table_name: string;
    record_id: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE' | 'UPLOAD' | 'EXPORT' | 'LOGIN';
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

// Datos iniciales de auditoría forense con trazabilidad real
const INITIAL_AUDIT_DATA: AuditLogItem[] = [
    {
        id: 101,
        table_name: 'Maestro de Precios de Bunker',
        record_id: 'BUNKER-2026-07-02',
        action: 'UPLOAD',
        user_email: 'izavala@petral.com.pe',
        user_name: 'Iosef Zavala',
        user_role: 'ADMIN',
        ip_address: '190.235.14.88',
        diff_data: {
            price_mdo: { old: 1480.00, new: 1528.26 },
            provider: { old: 'OIL TRADING S.A.C.', new: 'OIL TRADING S.A.C.' },
            homologation_rule: { old: 'MGO', new: 'MDO (Unificado)' }
        },
        metadata: { archivo_cargado: 'FACTURA_BUNKER_OIL_TRADING_9821.pdf', parser_status: 'PARSED_100_OK' },
        created_at: '2026-09-07T14:45:00-05:00'
    },
    {
        id: 102,
        table_name: 'Matriz Financiera',
        record_id: 'ESC-BASE-2027',
        action: 'EXPORT',
        user_email: 'rgutierrez@petral.com.pe',
        user_name: 'Richard Gutiérrez',
        user_role: 'ADMIN',
        ip_address: '190.237.99.12',
        metadata: { formato: 'PDF Horizontal (El Reporte Bello)', paginas: 7, zoom: '65%' },
        created_at: '2026-09-07T14:10:00-05:00'
    },
    {
        id: 103,
        table_name: 'Costos Portuarios & Gastos de Escala',
        record_id: 'PORT-CALLAO-092',
        action: 'UPLOAD',
        user_email: 'operaciones@petral.com.pe',
        user_name: 'Patricia Yong (Operaciones)',
        user_role: 'USER',
        ip_address: '181.65.201.44',
        metadata: { archivo_cargado: 'GASTO_ESCALA_CALLAO_EXPERTA.pdf', total_cost_usd: 18450.00 },
        created_at: '2026-09-07T13:40:00-05:00'
    },
    {
        id: 104,
        table_name: 'Maestro de Contratos & Fletes',
        record_id: 'CONT-NEXA-004',
        action: 'UPDATE',
        user_email: 'operaciones@petral.com.pe',
        user_name: 'Patricia Yong (Operaciones)',
        user_role: 'USER',
        ip_address: '181.65.201.44',
        diff_data: {
            freight_rate_usd: { old: 24.50, new: 26.80 },
            demurrage_rate_day: { old: 8500.00, new: 9200.00 },
            status: { old: 'DRAFT', new: 'APPROVED' }
        },
        metadata: { aprobado_por: 'Iosef Zavala', ruta: 'CALLAO -> MATARANI' },
        created_at: '2026-09-07T13:25:00-05:00'
    },
    {
        id: 105,
        table_name: 'Bóveda de Dispositivos (Device Vault)',
        record_id: 'DEV-8F4A12B0-C7E901D4',
        action: 'INSERT',
        user_email: 'izavala@petral.com.pe',
        user_name: 'Iosef Zavala',
        user_role: 'ADMIN',
        ip_address: '190.235.14.88',
        new_data: {
            device_name: 'PC Windows (Chrome 128) - 1920x1080',
            status: 'APPROVED',
            approved_by: 'izavala@petral.com.pe'
        },
        created_at: '2026-09-07T12:00:00-05:00'
    },
    {
        id: 106,
        table_name: 'Autenticación 2FA',
        record_id: 'AUTH-OTP-575075',
        action: 'LOGIN',
        user_email: 'operaciones@petral.com.pe',
        user_name: 'Patricia Yong (Operaciones)',
        user_role: 'USER',
        ip_address: '181.65.201.44',
        metadata: { canal: 'Email (petra@geeksoft.tech)', device: 'Dell Latitude 5420' },
        created_at: '2026-09-07T09:02:00-05:00'
    }
];

export const UserAuditLedgerViewer: React.FC = () => {
    const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_DATA);
    const [selectedUserTab, setSelectedUserTab] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [actionFilter, setActionFilter] = useState<string>('ALL');
    const [selectedLogForModal, setSelectedLogForModal] = useState<AuditLogItem | null>(null);
    const [usersList, setUsersList] = useState<Array<{ email: string; name: string; role: string }>>([]);

    // Cargar usuarios para los tabs
    useEffect(() => {
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
                // Fallback con usuarios del log
                setUsersList([
                    { email: 'izavala@petral.com.pe', name: 'Iosef Zavala', role: 'ADMIN' },
                    { email: 'rgutierrez@petral.com.pe', name: 'Richard Gutiérrez', role: 'ADMIN' },
                    { email: 'operaciones@petral.com.pe', name: 'Patricia Yong', role: 'USER' }
                ]);
            }
        };
        loadUsers();
    }, []);

    // Lista única de usuarios combinando logs y base de datos
    const userTabs = useMemo(() => {
        const map = new Map<string, { email: string; name: string; role: string; count: number }>();
        
        // Contar eventos por usuario
        auditLogs.forEach(log => {
            const email = log.user_email.toLowerCase();
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

        // Asegurar que aparezcan los usuarios registrados aunque tengan 0 eventos
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
        <div className="flex flex-col gap-5 p-6 bg-slate-50 min-h-screen font-sans">
            
            {/* 1. Cabecera Ejecutiva & Banner de Identidad */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0b2545] to-[#0284c7] flex items-center justify-center text-white shadow-md">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                Módulo de Auditoría Forense &amp; Trazabilidad
                            </h1>
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200">
                                DELFOS SECURITY VAULT
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Registro pericial inmutable de acciones: quién hizo qué, cuándo y qué valores exactos fueron modificados.
                        </p>
                    </div>
                </div>

                {/* Resumen KPIs */}
                <div className="flex items-center gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Total Eventos</div>
                        <div className="text-lg font-black text-slate-800">{auditLogs.length}</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
                        <div className="text-[10px] uppercase font-bold text-emerald-600">Usuarios Auditados</div>
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
                            ? 'bg-[#0b2545] text-white shadow-md'
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
                                ? 'bg-[#0b2545] text-white shadow-md'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        <User size={14} className={u.role === 'ADMIN' ? 'text-amber-400' : 'text-slate-400'} />
                        <span>{u.name}</span>
                        {u.role === 'ADMIN' && (
                            <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 px-1.5 rounded">
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
                            placeholder="Buscar por tabla, código de registro, buque, usuario..."
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
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <History size={32} className="mx-auto mb-2 text-slate-300" />
                                        <p className="font-bold">No se encontraron eventos para el filtro seleccionado.</p>
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
                                                <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-1.5 rounded border border-slate-100">
                                                    {JSON.stringify(log.metadata)}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-[11px] italic">Sin delta numérico</span>
                                            )}
                                        </td>

                                        {/* Botón Ver Detalle */}
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedLogForModal(log)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                                title="Ver detalle forense completo"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 5. Modal Forense Detallado de Registro */}
            {selectedLogForModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <ShieldCheck className="text-blue-600" size={22} />
                                <h3 className="font-extrabold text-slate-900 text-base">
                                    Ficha Forense de Auditoría #{selectedLogForModal.id}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedLogForModal(null)}
                                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-4 space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <div>
                                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Usuario:</span>
                                    <span className="font-bold text-slate-800">{selectedLogForModal.user_name || selectedLogForModal.user_email}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Dirección IP:</span>
                                    <span className="font-mono font-bold text-slate-800">{selectedLogForModal.ip_address || '127.0.0.1'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Entidad Afectada:</span>
                                    <span className="font-bold text-blue-700">{selectedLogForModal.table_name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Fecha / Hora:</span>
                                    <span className="font-mono text-slate-700">{formatDate(selectedLogForModal.created_at)}</span>
                                </div>
                            </div>

                            <div>
                                <span className="font-bold text-slate-700 mb-1 block">Payload Crudo (JSONB):</span>
                                <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 scrollbar-thin">
                                    {JSON.stringify(selectedLogForModal, null, 2)}
                                </pre>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedLogForModal(null)}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
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
