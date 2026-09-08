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
    
    // Estados de Usuarios
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
        analisis_grafico: 'Visor',
        spaghetti_map: 'Visor',
        analisis_liquidaciones: 'Visor',
        maestro_buques: 'Visor',
        maestro_puertos: 'Visor',
        maestro_rutas: 'Visor',
        maestro_tarifas: 'Visor',
        maestro_contratos: 'Visor',
        maestro_cotizaciones: 'Visor',
        maestro_presupuestos: 'Visor',
        maestro_matrices: 'Visor',
        maestro_tarifas_portuarias: 'Visor',
        maestro_costos_agencia: 'Visor',
        maestro_demoras: 'Visor',
        maestro_bunker: 'Visor',
        maestro_originacion: 'Visor'
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

    const handleEditClick = (userToEdit: FullUser) => {
        setEditingUserId(userToEdit.id);
        setEditingUser(JSON.parse(JSON.stringify(userToEdit)));
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

    const handlePermChange = (moduleKey: string, level: PermissionLevel) => {
        if (!editingUser) return;
        setEditingUser({
            ...editingUser,
            permissions: {
                ...editingUser.permissions,
                [moduleKey]: level
            }
        });
    };

    const handleSaveUser = async (userId: string) => {
        if (!editingUser) return;
        try {
            await AuthService.updateUser(userId, {
                full_name: editingUser.full_name,
                email: editingUser.email,
                role: editingUser.role,
                permissions: editingUser.permissions
            });
            showNotification('Usuario actualizado exitosamente.', 'success');
            setEditingUserId(null);
            setEditingUser(null);
            loadUsers();
        } catch (err: any) {
            showNotification(err.response?.data?.detail || 'Error al actualizar usuario.', 'error');
        }
    };

    const handleDeleteUser = async (userId: string, email: string) => {
        if (email === user.email) {
            alert('No puedes eliminar tu propia cuenta de administrador.');
            return;
        }
        if (!confirm(`¿Está seguro de eliminar permanentemente al usuario ${email}?`)) {
            return;
        }

        try {
            await AuthService.deleteUser(userId);
            showNotification('Usuario eliminado exitosamente.', 'success');
            loadUsers();
        } catch (err: any) {
            showNotification(err.response?.data?.detail || 'Error al eliminar usuario.', 'error');
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
            showNotification('Usuario creado exitosamente.', 'success');
            setShowModal(false);
            setNewName('');
            setNewEmail('');
            setNewPassword('');
            setNewRole('USER');
            loadUsers();
        } catch (err: any) {
            showNotification(err.response?.data?.detail || 'Error al crear usuario.', 'error');
        }
    };

    const modulesList: { key: string; label: string }[] = [
        // Herramientas
        { key: 'multicotizador_spot', label: 'Voyage Calc' },
        { key: 'matriz_financiera', label: 'Matriz Financiera' },
        { key: 'analisis_grafico', label: 'Análisis Gráfico' },
        { key: 'spaghetti_map', label: 'Spaghetti Map' },
        { key: 'analisis_liquidaciones', label: 'Análisis Liquidaciones' },
        // Maestros Físicos
        { key: 'maestro_buques', label: 'M. Flota' },
        { key: 'maestro_puertos', label: 'M. Puertos' },
        { key: 'maestro_rutas', label: 'M. Distancias' },
        // Maestros Comerciales
        { key: 'maestro_tarifas', label: 'M. Clientes' },
        { key: 'maestro_contratos', label: 'M. Cierres' },
        { key: 'maestro_cotizaciones', label: 'M. Cotizaciones' },
        { key: 'maestro_presupuestos', label: 'M. Presupuestos' },
        { key: 'maestro_matrices', label: 'M. Matrices' },
        // Maestros de Costos
        { key: 'maestro_tarifas_portuarias', label: 'M. Tarifas Portuarias' },
        { key: 'maestro_costos_agencia', label: 'M. Gastos Portuarios' },
        { key: 'maestro_demoras', label: 'M. Demoras' },
        // Mercado & Originación
        { key: 'maestro_bunker', label: 'M. Búnker ⛽' },
        { key: 'maestro_originacion', label: 'M. Originación ⚙️' }
    ];

    return (
        <MasterTemplate 
            title="GESTIÓN DE USUARIOS Y MATRIZ DE PERMISOS" 
            subtitle="Administración centralizada de cuentas de acceso, roles y niveles de privilegio en DELFOS" 
            activeTab="users"
        >
            <div className="flex-1 flex flex-col gap-4 max-w-full w-full">
                {/* Cabecera / Acciones */}
                <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200/80">
                            <UserIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black tracking-wide text-slate-800 uppercase flex items-center gap-2">
                                Cuentas y Matriz de Roles
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                    {users.length} Registrados
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500">Configura accesos de tipo Editor, Visor o Nulo para cada módulo del sistema.</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                        <UserPlus size={14} /> Registrar Nuevo Usuario
                    </button>
                </div>

                {/* Notificaciones */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle size={15} /> {error}
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                        <Check size={15} /> {success}
                    </div>
                )}

                {/* Tabla de Usuarios */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left border-collapse min-w-[1000px] text-xs">
                            <thead className="bg-slate-50/90 border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-[10.5px] font-black text-slate-600 uppercase tracking-wider w-[180px]">Nombre Completo</th>
                                    <th className="px-4 py-3 text-[10.5px] font-black text-slate-600 uppercase tracking-wider w-[220px]">Correo Electrónico</th>
                                    <th className="px-4 py-3 text-[10.5px] font-black text-slate-600 uppercase tracking-wider w-[110px]">Rol</th>
                                    {modulesList.map(mod => (
                                        <th key={mod.key} className="px-3 py-3 text-[10px] font-black text-slate-600 uppercase tracking-wider text-center w-[115px]">
                                            {mod.label}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-[10.5px] font-black text-slate-600 uppercase tracking-wider text-right w-[110px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={modulesList.length + 4} className="px-4 py-12 text-center text-slate-400 font-semibold">
                                            <div className="animate-spin h-6 w-6 border-2 border-slate-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                                            Cargando usuarios...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={modulesList.length + 4} className="px-4 py-12 text-center text-slate-400 font-semibold">
                                            No se encontraron usuarios en la base de datos.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map(userItem => {
                                        const isEditing = editingUserId === userItem.id;
                                        const currentUser = isEditing ? editingUser! : userItem;
                                        const isAdmin = currentUser.role === 'ADMIN';

                                        return (
                                            <tr key={userItem.id} className={`hover:bg-slate-50/80 transition-colors ${isEditing ? 'bg-blue-50/30' : ''}`}>
                                                {/* Nombre */}
                                                <td className="px-4 py-3 text-xs font-bold text-slate-800">
                                                    {isEditing ? (
                                                        <input 
                                                            type="text" 
                                                            value={currentUser.full_name} 
                                                            onChange={(e) => handleEditChange('full_name', e.target.value)} 
                                                            className="w-full border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 font-normal bg-white text-xs"
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
                                                            className="w-full border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 font-normal bg-white text-xs"
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
                                                            onChange={(e) => handleEditChange('role', e.target.value as 'ADMIN' | 'USER')}
                                                            className="border border-slate-300 rounded px-2 py-1 bg-white font-bold text-xs"
                                                        >
                                                            <option value="USER">USER</option>
                                                            <option value="ADMIN">ADMIN</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${currentUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600'}`}>
                                                            {currentUser.role}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Permisos por Módulo */}
                                                {modulesList.map(mod => {
                                                    const permLevel = currentUser.permissions ? currentUser.permissions[mod.key] || 'Visor' : 'Visor';

                                                    return (
                                                        <td key={mod.key} className="px-3 py-3 text-center">
                                                            {isAdmin ? (
                                                                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100" title="ADMIN tiene acceso total (Editor)">
                                                                    Editor
                                                                </span>
                                                            ) : isEditing ? (
                                                                <select
                                                                    value={permLevel}
                                                                    onChange={(e) => handlePermChange(mod.key, e.target.value as PermissionLevel)}
                                                                    className={`text-[11px] font-bold rounded px-1.5 py-0.5 border cursor-pointer ${
                                                                        permLevel === 'Editor' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                                                        permLevel === 'Visor' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                                                        'bg-slate-100 text-slate-400 border-slate-200'
                                                                    }`}
                                                                >
                                                                    <option value="Editor">Editor</option>
                                                                    <option value="Visor">Visor</option>
                                                                    <option value="Nulo">Nulo</option>
                                                                </select>
                                                            ) : (
                                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                                    permLevel === 'Editor' ? 'bg-emerald-100 text-emerald-800' :
                                                                    permLevel === 'Visor' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-slate-100 text-slate-400'
                                                                }`}>
                                                                    {permLevel}
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}

                                                {/* Acciones */}
                                                <td className="px-4 py-3 text-right text-xs">
                                                    <div className="flex justify-end items-center gap-1.5">
                                                        {isEditing ? (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleSaveUser(userItem.id)}
                                                                    className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                                                                    title="Guardar Cambios"
                                                                >
                                                                    <Save size={13} />
                                                                </button>
                                                                <button 
                                                                    onClick={handleCancelEdit}
                                                                    className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded transition-colors"
                                                                    title="Cancelar"
                                                                >
                                                                    <X size={13} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleEditClick(userItem)}
                                                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                    title="Editar Usuario y Permisos"
                                                                >
                                                                    <Edit2 size={13} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteUser(userItem.id, userItem.email)}
                                                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                    title="Eliminar Usuario"
                                                                >
                                                                    <Trash2 size={13} />
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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-white rounded-2xl w-full max-w-[620px] shadow-2xl relative border border-slate-200 overflow-hidden">
                        
                        {/* Header Modal */}
                        <div className="flex justify-between items-center bg-slate-50 border-b border-slate-200 px-6 py-4">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <UserPlus size={16} className="text-blue-600" /> Registrar Nuevo Usuario
                            </h3>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                <X size={18} />
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
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500" 
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
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500" 
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
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500" 
                                        placeholder="••••••••" 
                                        required 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rol en el Sistema</label>
                                    <select 
                                        value={newRole} 
                                        onChange={(e) => setNewRole(e.target.value as 'ADMIN' | 'USER')}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500"
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
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                                        {modulesList.map(mod => (
                                            <div key={mod.key} className="flex flex-col gap-1">
                                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{mod.label}</label>
                                                <select
                                                    value={newPerms[mod.key]}
                                                    onChange={(e) => setNewPerms({
                                                        ...newPerms,
                                                        [mod.key]: e.target.value as PermissionLevel
                                                    })}
                                                    className="border border-slate-300 rounded px-1.5 py-1 bg-white text-[11px] font-bold"
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
