import React, { useState, useEffect } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { AuthService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Laptop, CheckCircle2, XCircle, RefreshCw, Shield, AlertTriangle, Search, Info } from 'lucide-react';

interface AuthorizedDevice {
    id: string;
    user_email: string;
    device_fingerprint: string;
    device_name: string;
    ip_address: string;
    status: 'APPROVED' | 'PENDING' | 'REVOKED';
    approved_by: string | null;
    approved_at: string | null;
    created_at: string | null;
    last_access_at: string | null;
}

export const DeviceVaultMaster: React.FC = () => {
    const { user } = useAuth();
    const [devices, setDevices] = useState<AuthorizedDevice[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REVOKED'>('ALL');
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    const loadDevices = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await AuthService.getDevices();
            setDevices(data);
        } catch (err: any) {
            setError('Error al conectar con la bóveda de dispositivos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDevices();
    }, []);

    const handleApproveDevice = async (deviceId: string) => {
        if (!user?.email) return;
        setActionLoading(deviceId);
        setError('');
        setSuccess('');
        try {
            await AuthService.approveDevice(deviceId, user.email);
            setSuccess('Dispositivo autorizado con éxito. El usuario ahora puede ingresar con 2FA.');
            await loadDevices();
        } catch (err: any) {
            setError('Error al autorizar el dispositivo.');
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRevokeDevice = async (deviceId: string) => {
        if (!user?.email) return;
        if (!confirm('¿Desea revocar el acceso a este dispositivo? El usuario no podrá ingresar desde este equipo.')) return;
        setActionLoading(deviceId);
        setError('');
        setSuccess('');
        try {
            await AuthService.revokeDevice(deviceId, user.email);
            setSuccess('Acceso del dispositivo revocado exitosamente.');
            await loadDevices();
        } catch (err: any) {
            setError('Error al revocar el dispositivo.');
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredDevices = devices.filter((d) => {
        const matchesSearch = 
            d.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.device_fingerprint.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.ip_address && d.ip_address.includes(searchTerm));
        
        const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const pendingCount = devices.filter(d => d.status === 'PENDING').length;
    const approvedCount = devices.filter(d => d.status === 'APPROVED').length;
    const revokedCount = devices.filter(d => d.status === 'REVOKED').length;

    return (
        <MasterTemplate
            title="DEVICE VAULT (BÓVEDA DE EQUIPOS AUTORIZADOS)"
            subtitle="Control de acceso criptográfico por huella de hardware y whitelist de dispositivos"
            activeTab="device-vault"
        >
            <div className="flex flex-col gap-4 h-full max-w-full">
                {/* Header Superior Corporativo */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg border border-teal-200/80">
                            <Shield size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-black tracking-wide text-slate-800 uppercase">
                                    Bóveda de Dispositivos DELFOS
                                </h2>
                                <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    MFA & DRM ACTIVE
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Solo los equipos aprobados por el Administrador pueden recibir códigos OTP y acceder a las funciones del sistema.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={loadDevices}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer shadow-2xs self-end sm:self-auto"
                        title="Recargar lista de dispositivos"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin text-teal-600' : 'text-slate-500'} />
                        <span>Actualizar</span>
                    </button>
                </div>

                {/* Métricas Rápidas Corporativas */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div 
                        onClick={() => setStatusFilter('ALL')}
                        className={`p-3 rounded-xl border transition-all cursor-pointer bg-white ${
                            statusFilter === 'ALL' 
                                ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-sm bg-blue-50/20' 
                                : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                    >
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Total Dispositivos</span>
                        <span className="text-xl font-black text-slate-800 mt-0.5 block">{devices.length}</span>
                    </div>

                    <div 
                        onClick={() => setStatusFilter('PENDING')}
                        className={`p-3 rounded-xl border transition-all cursor-pointer bg-white ${
                            statusFilter === 'PENDING' 
                                ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-sm bg-amber-50/20' 
                                : 'border-amber-200 hover:border-amber-300 shadow-2xs'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 block">Pendientes</span>
                            {pendingCount > 0 && (
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            )}
                        </div>
                        <span className="text-xl font-black text-amber-600 mt-0.5 block">
                            {pendingCount}
                        </span>
                    </div>

                    <div 
                        onClick={() => setStatusFilter('APPROVED')}
                        className={`p-3 rounded-xl border transition-all cursor-pointer bg-white ${
                            statusFilter === 'APPROVED' 
                                ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm bg-emerald-50/20' 
                                : 'border-emerald-200 hover:border-emerald-300 shadow-2xs'
                        }`}
                    >
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 block">Autorizados</span>
                        <span className="text-xl font-black text-emerald-600 mt-0.5 block">
                            {approvedCount}
                        </span>
                    </div>

                    <div 
                        onClick={() => setStatusFilter('REVOKED')}
                        className={`p-3 rounded-xl border transition-all cursor-pointer bg-white ${
                            statusFilter === 'REVOKED' 
                                ? 'border-rose-500 ring-2 ring-rose-500/10 shadow-sm bg-rose-50/20' 
                                : 'border-rose-200 hover:border-rose-300 shadow-2xs'
                        }`}
                    >
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 block">Revocados</span>
                        <span className="text-xl font-black text-rose-600 mt-0.5 block">
                            {revokedCount}
                        </span>
                    </div>
                </div>

                {/* Mensajes de Estado */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <AlertTriangle size={15} className="text-red-500 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                {/* Barra de Búsqueda y Filtro */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="relative w-full sm:w-80">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por correo, equipo, huella o IP..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold self-end sm:self-auto">
                        <Info size={13} className="text-slate-400" />
                        <span>Mostrando {filteredDevices.length} de {devices.length} dispositivos</span>
                    </div>
                </div>

                {/* Tabla de Dispositivos Corporativa */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50/90 border-b border-slate-200 text-[10.5px] font-black text-slate-600 uppercase tracking-wider sticky top-0 z-10">
                                <tr>
                                    <th className="py-3 px-4">Usuario</th>
                                    <th className="py-3 px-4">Equipo / Nombre</th>
                                    <th className="py-3 px-4">Huella Hardware</th>
                                    <th className="py-3 px-4">IP / Último Acceso</th>
                                    <th className="py-3 px-4 text-center">Estado</th>
                                    <th className="py-3 px-4 text-center">Autorizado Por</th>
                                    <th className="py-3 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <RefreshCw size={22} className="animate-spin text-teal-600" />
                                                <span className="font-semibold text-xs text-slate-600">Consultando Bóveda Device Vault...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredDevices.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Laptop size={28} className="text-slate-300" />
                                                <span className="font-bold text-slate-700 text-sm">No se encontraron dispositivos</span>
                                                <span className="text-xs text-slate-400">Los nuevos equipos aparecerán aquí automáticamente al intentar iniciar sesión.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDevices.map((dev) => (
                                        <tr key={dev.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-4 font-bold text-slate-900">
                                                {dev.user_email}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Laptop size={14} className="text-slate-400 shrink-0" />
                                                    <span className="font-semibold text-slate-700">{dev.device_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-mono text-[10.5px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                                    {dev.device_fingerprint}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                                                <div className="font-semibold text-slate-700">{dev.ip_address || '—'}</div>
                                                <div className="text-[10px] text-slate-400 font-sans">
                                                    {dev.last_access_at ? new Date(dev.last_access_at).toLocaleString() : 'Sin accesos'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {dev.status === 'APPROVED' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                                                        <CheckCircle2 size={11} className="text-emerald-600" /> Autorizado
                                                    </span>
                                                )}
                                                {dev.status === 'PENDING' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse shadow-2xs">
                                                        <AlertTriangle size={11} className="text-amber-600" /> Pendiente
                                                    </span>
                                                )}
                                                {dev.status === 'REVOKED' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full border border-rose-200 shadow-2xs">
                                                        <XCircle size={11} className="text-rose-600" /> Revocado
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center text-slate-500 text-[11px]">
                                                {dev.approved_by ? (
                                                    <div>
                                                        <span className="font-bold text-slate-700">{dev.approved_by}</span>
                                                        <div className="text-[10px] text-slate-400">
                                                            {dev.approved_at ? new Date(dev.approved_at).toLocaleDateString() : ''}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {dev.status !== 'APPROVED' && (
                                                        <button
                                                            onClick={() => handleApproveDevice(dev.id)}
                                                            disabled={actionLoading === dev.id}
                                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                                                            title="Autorizar este dispositivo"
                                                        >
                                                            <CheckCircle2 size={12} />
                                                            <span>Autorizar</span>
                                                        </button>
                                                    )}
                                                    {dev.status !== 'REVOKED' && (
                                                        <button
                                                            onClick={() => handleRevokeDevice(dev.id)}
                                                            disabled={actionLoading === dev.id}
                                                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-rose-200 cursor-pointer disabled:opacity-50"
                                                            title="Revocar acceso de este dispositivo"
                                                        >
                                                            <XCircle size={12} />
                                                            <span>Revocar</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MasterTemplate>
    );
};
