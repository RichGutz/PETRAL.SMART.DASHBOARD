import React, { useState, useEffect } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { AuthService } from '../../services/api';
import type { UserPermissions, PermissionLevel } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Save, Trash2, Edit2, Shield, User as UserIcon, X, Check, AlertCircle } from 'lucide-react';

interface FullUser {
    id: string;
    email: string;
    full_name: string;
    role: 'ADMIN' | 'USER';
    permissions: UserPermissions;
}

export const UsersPermissions: React.FC = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<FullUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Estado para edición en línea
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<FullUser | null>(null);

    // Estado para el modal de nuevo usuario
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<'ADMIN' | 'USER'>('USER');
    const [newPerms, setNewPerms] = useState<UserPermissions>({
        multicotizador_spot: 'Visor',
        matriz_financiera: 'Visor',
        maestro_buques: 'Visor',
        maestro_rutas: 'Visor',
        maestro_puertos: 'Visor',
        maestro_contratos: 'Visor',
        maestro_tarifas: 'Visor',
        maestro_costos_agencia: 'Visor',
        maestro_bunker: 'Visor'
    });

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await AuthService.getUsers();
            setUsers(data);
        } catch (err: any) {
            setError('Error al cargar la lista de usuarios.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            loadUsers();
        }
    }, [user]);

    if (!user || user.role !== 'ADMIN') {
        return (
            <MasterTemplate title="Acceso Restringido" subtitle="Seguridad del Sistema">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Shield className="h-16 w-16 text-red-500 mb-4 animate-bounce" />
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Acceso Denegado</h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                        Esta sección está reservada exclusivamente para usuarios administradores. Su actividad ha sido registrada.
                    </p>
                </div>
            </MasterTemplate>
        );
    }

    const showNotification = (msg: string, type: 'success' | 'error') => {
        if (type === 'success') {
            setSuccess(msg);
            setTimeout(() => setSuccess(''), 4000);
        } else {
            setError(msg);
            setTimeout(() => setError(''), 4000);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await AuthService.createUser({
                full_name: newName,
                email: newEmail,
                password: newPassword,
                role: newRole,
                permissions: newPerms
            });
            showNotification('Usuario creado exitosamente', 'success');
            setShowModal(false);
            // Reset campos
            setNewName('');
            setNewEmail('');
            setNewPassword('');
            setNewRole('USER');
            loadUsers();
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Error al crear usuario.';
            showNotification(msg, 'error');
        }
    };

    const handleStartEdit = (user: FullUser) => {
        setEditingUserId(user.id);
        setEditingUser(JSON.parse(JSON.stringify(user))); // Clon profundo
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setEditingUser(null);
    };

    const handleEditChange = (field: keyof FullUser, value: any) => {
        if (!editingUser) return;
        setEditingUser({
            ...editingUser,
            [field]: value
        });
    };

    const handleEditPermissionChange = (module: keyof UserPermissions, value: PermissionLevel) => {
        if (!editingUser) return;
        setEditingUser({
            ...editingUser,
            permissions: {
                ...editingUser.permissions,
                [module]: value
            }
        });
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;
        try {
            await AuthService.updateUser(editingUser.id, {
                full_name: editingUser.full_name,
                email: editingUser.email,
                role: editingUser.role,
                permissions: editingUser.permissions
            });
            showNotification('Usuario y permisos actualizados', 'success');
            setEditingUserId(null);
            setEditingUser(null);
            loadUsers();
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Error al actualizar usuario.';
            showNotification(msg, 'error');
        }
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (!confirm(`¿Está seguro de que desea eliminar permanentemente al usuario ${name}?`)) {
            return;
        }
        try {
            await AuthService.deleteUser(id);
            showNotification('Usuario eliminado del sistema', 'success');
            loadUsers();
        } catch (err: any) {
            showNotification('Error al eliminar usuario.', 'error');
        }
    };

    const modulesList: { key: keyof UserPermissions; label: string }[] = [
        { key: 'multicotizador_spot', label: 'Multicotizador' },
        { key: 'matriz_financiera', label: 'Matriz Financiera' },
        { key: 'maestro_buques', label: 'M. Buques' },
        { key: 'maestro_rutas', label: 'M. Rutas' },
        { key: 'maestro_puertos', label: 'M. Puertos' },
        { key: 'maestro_contratos', label: 'M. Contratos' },
        { key: 'maestro_tarifas', label: 'M. Tarifas/Clientes' },
        { key: 'maestro_costos_agencia', label: 'M. Costos Agencia' },
        { key: 'maestro_bunker', label: 'M. Bunker ⛽' }
    ];

    return (
        <MasterTemplate title="Gestión de Usuarios y Permisos" subtitle="Administración de accesos del Smart Dashboard" activeTab="users">
            
            <div className="flex-1 flex flex-col gap-6 max-w-full w-full">
                
                {/* Cabecera / Acciones */}
                <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Cuentas y Matriz de Roles</h2>
                        <p className="text-xs text-slate-500">Configura accesos de tipo Editor, Visor o Nulo para cada persona.</p>
                    </div>
                    
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                        <UserPlus size={14} /> Registrar Nuevo Usuario
                    </button>
                </div>

                {/* Notificaciones */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-xs font-semibold flex items-center gap-2 animate-shake">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
                        <Check size={16} /> {success}
                    </div>
                )}

                {/* Tabla de Usuarios */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50/75 border-b border-slate-200">
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[180px]">Nombre Completo</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[220px]">Correo / Email</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[110px]">Rol Principal</th>
                                    {modulesList.map(mod => (
                                        <th key={mod.key} className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-[120px]">
                                            {mod.label}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right w-[110px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150">
                                {loading ? (
                                    <tr>
                                        <td colSpan={12} className="px-4 py-12 text-center text-slate-400 font-semibold">
                                            <div className="animate-spin h-6 w-6 border-2 border-slate-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                                            Cargando usuarios...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="px-4 py-12 text-center text-slate-400 font-semibold">
                                            No se encontraron usuarios en la base de datos.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map(user => {
                                        const isEditing = editingUserId === user.id;
                                        const currentUser = isEditing ? editingUser! : user;
                                        const isAdmin = currentUser.role === 'ADMIN';

                                        return (
                                            <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${isEditing ? 'bg-blue-50/30' : ''}`}>
                                                {/* Nombre */}
                                                <td className="px-4 py-3 text-xs font-bold text-slate-800">
                                                    {isEditing ? (
                                                        <input 
                                                            type="text" 
                                                            value={currentUser.full_name} 
                                                            onChange={(e) => handleEditChange('full_name', e.target.value)} 
                                                            className="w-full border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 font-normal bg-white"
                                                        />
                                                    ) : (
                                                        currentUser.full_name
                                                    )}
                                                </td>

                                                {/* Email */}
                                                <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                                                    {isEditing ? (
                                                        <input 
                                                            type="email" 
                                                            value={currentUser.email} 
                                                            onChange={(e) => handleEditChange('email', e.target.value)} 
                                                            className="w-full border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 font-normal bg-white font-mono"
                                                        />
                                                    ) : (
                                                        currentUser.email
                                                    )}
                                                </td>

                                                {/* Rol */}
                                                <td className="px-4 py-3 text-xs">
                                                    {isEditing ? (
                                                        <select 
                                                            value={currentUser.role} 
                                                            onChange={(e) => handleEditChange('role', e.target.value)}
                                                            className="border border-slate-300 rounded px-1.5 py-1 focus:outline-none focus:border-blue-500 bg-white"
                                                        >
                                                            <option value="USER">USER</option>
                                                            <option value="ADMIN">ADMIN</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${isAdmin ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                                            {isAdmin ? <Shield size={10} /> : <UserIcon size={10} />}
                                                            {currentUser.role}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Permisos Dinámicos */}
                                                {modulesList.map(mod => {
                                                    const permVal = isAdmin ? 'Editor' : currentUser.permissions[mod.key] || 'Visor';
                                                    
                                                    return (
                                                        <td key={mod.key} className="px-3 py-3 text-center text-xs">
                                                            {isAdmin ? (
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase italic">Total</span>
                                                            ) : isEditing ? (
                                                                <select
                                                                    value={permVal}
                                                                    onChange={(e) => handleEditPermissionChange(mod.key, e.target.value as PermissionLevel)}
                                                                    className="border border-slate-300 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500 bg-white text-xs"
                                                                >
                                                                    <option value="Editor">Editor</option>
                                                                    <option value="Visor">Visor</option>
                                                                    <option value="Nulo">Nulo</option>
                                                                </select>
                                                            ) : (
                                                                <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold tracking-tight w-20 text-center ${
                                                                    permVal === 'Editor' 
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                                                                        : permVal === 'Visor' 
                                                                            ? 'bg-amber-50 text-amber-700 border border-amber-150' 
                                                                            : 'bg-red-50 text-red-700 border border-red-150'
                                                                }`}>
                                                                    {permVal}
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}

                                                {/* Acciones */}
                                                <td className="px-4 py-3 text-right text-xs">
                                                    <div className="flex justify-end gap-1.5">
                                                        {isEditing ? (
                                                            <>
                                                                <button 
                                                                    onClick={handleSaveUser}
                                                                    className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
                                                                    title="Guardar"
                                                                >
                                                                    <Save size={14} />
                                                                </button>
                                                                <button 
                                                                    onClick={handleCancelEdit}
                                                                    className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition-colors cursor-pointer"
                                                                    title="Cancelar"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleStartEdit(user)}
                                                                    className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                                                                    title="Editar"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteUser(user.id, user.full_name)}
                                                                    className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-150 transition-colors cursor-pointer"
                                                                    title="Eliminar"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Modal de Creación de Nuevo Usuario */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl w-full max-w-[620px] shadow-2xl relative border border-slate-100 overflow-hidden">
                        
                        {/* Header Modal */}
                        <div className="flex justify-between items-center bg-slate-50 border-b border-slate-200 px-6 py-4">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <UserPlus size={16} className="text-blue-600" /> Registrar Nuevo Usuario
                            </h3>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Body Modal */}
                        <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nombre Completo</label>
                                    <input 
                                        type="text" 
                                        value={newName} 
                                        onChange={(e) => setNewName(e.target.value)} 
                                        className="w-full border border-slate-350 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500" 
                                        placeholder="Ej. Jorge Neyra" 
                                        required 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Correo Electrónico</label>
                                    <input 
                                        type="email" 
                                        value={newEmail} 
                                        onChange={(e) => setNewEmail(e.target.value)} 
                                        className="w-full border border-slate-350 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500" 
                                        placeholder="ejemplo@petral.com.pe" 
                                        required 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Contraseña Temporal</label>
                                    <input 
                                        type="password" 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)} 
                                        className="w-full border border-slate-350 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500" 
                                        placeholder="••••••••" 
                                        required 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rol en el Sistema</label>
                                    <select 
                                        value={newRole} 
                                        onChange={(e) => setNewRole(e.target.value as 'ADMIN' | 'USER')}
                                        className="w-full border border-slate-350 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="USER">USER (Acceso por matriz de permisos)</option>
                                        <option value="ADMIN">ADMIN (Acceso Total Bypass)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Matriz de Permisos Iniciales */}
                            {newRole === 'USER' && (
                                <div className="border-t border-slate-200 pt-4 mt-2">
                                    <h4 className="text-xs font-bold text-slate-700 mb-3">Definir Permisos Iniciales:</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-150">
                                        {modulesList.map(mod => (
                                            <div key={mod.key} className="flex flex-col gap-1">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{mod.label}</label>
                                                <select
                                                    value={newPerms[mod.key]}
                                                    onChange={(e) => setNewPerms({
                                                        ...newPerms,
                                                        [mod.key]: e.target.value as PermissionLevel
                                                    })}
                                                    className="border border-slate-300 rounded px-1 py-0.5 bg-white text-[11px]"
                                                >
                                                    <option value="Editor">Editor</option>
                                                    <option value="Visor">Visor</option>
                                                    <option value="Nulo">Nulo</option>
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Botones de Acción */}
                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md cursor-pointer"
                                >
                                    Guardar Usuario
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
        </MasterTemplate>
    );
};
