import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/api';

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'ADMIN' | 'USER';
}

export type PermissionLevel = 'Editor' | 'Visor' | 'Nulo';

export interface UserPermissions {
    multicotizador_spot: PermissionLevel;
    matriz_financiera: PermissionLevel;
    maestro_buques: PermissionLevel;
    maestro_rutas: PermissionLevel;
    maestro_puertos: PermissionLevel;
    maestro_contratos: PermissionLevel;
    maestro_tarifas: PermissionLevel;
    maestro_costos_agencia: PermissionLevel;
    maestro_bunker: PermissionLevel;
    [key: string]: PermissionLevel; // Firma de índice para acceso dinámico
}

interface AuthContextType {
    user: User | null;
    permissions: UserPermissions | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    hasPermission: (module: keyof UserPermissions, required: 'Editor' | 'Visor') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<UserPermissions | null>(null);
    const [loading, setLoading] = useState(true);

    // Cargar sesión del localStorage al iniciar la aplicación
    useEffect(() => {
        const storedUser = localStorage.getItem('petral_user');
        const storedPermissions = localStorage.getItem('petral_permissions');
        const isAuth = localStorage.getItem('petral_session') === 'authenticated';

        if (isAuth && storedUser && storedPermissions) {
            try {
                setUser(JSON.parse(storedUser));
                setPermissions(JSON.parse(storedPermissions));
            } catch (e) {
                console.error("Error al cargar la sesión persistida:", e);
                logout();
            }
        } else if (import.meta.env.DEV) {
            // Auto-login automático en entorno local de desarrollo
            const devUser: User = {
                id: 'dev-admin',
                email: 'izavala@petral.com.pe',
                full_name: 'Iosef Zavala (Local Dev)',
                role: 'ADMIN'
            };
            const devPerms: UserPermissions = {
                multicotizador_spot: 'Editor',
                matriz_financiera: 'Editor',
                maestro_buques: 'Editor',
                maestro_rutas: 'Editor',
                maestro_puertos: 'Editor',
                maestro_contratos: 'Editor',
                maestro_tarifas: 'Editor',
                maestro_costos_agencia: 'Editor',
                maestro_bunker: 'Editor'
            };
            setUser(devUser);
            setPermissions(devPerms);
            localStorage.setItem('petral_session', 'authenticated');
            localStorage.setItem('petral_user', JSON.stringify(devUser));
            localStorage.setItem('petral_permissions', JSON.stringify(devPerms));
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const data = await AuthService.login({ email, password });
            const loggedUser: User = data.user;
            const userPerms: UserPermissions = data.permissions;

            setUser(loggedUser);
            setPermissions(userPerms);
            
            localStorage.setItem('petral_user', JSON.stringify(loggedUser));
            localStorage.setItem('petral_permissions', JSON.stringify(userPerms));
            localStorage.setItem('petral_session', 'authenticated');
        } catch (error) {
            logout();
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setPermissions(null);
        localStorage.removeItem('petral_user');
        localStorage.removeItem('petral_permissions');
        localStorage.removeItem('petral_session');
    };

    // Validación granular de accesos
    const hasPermission = (module: keyof UserPermissions, required: 'Editor' | 'Visor'): boolean => {
        if (!user) return false;
        
        // El Administrador (ADMIN) tiene bypass absoluto en todas las acciones y vistas
        if (user.role === 'ADMIN') return true;

        if (!permissions) return false;

        const currentPermission = permissions[module] || 'Nulo';

        if (currentPermission === 'Nulo') return false;

        if (required === 'Editor') {
            return currentPermission === 'Editor';
        }

        // Si se requiere 'Visor', se acepta tanto 'Editor' como 'Visor'
        return currentPermission === 'Editor' || currentPermission === 'Visor';
    };

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{ user, permissions, isAuthenticated, loading, login, logout, hasPermission }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
