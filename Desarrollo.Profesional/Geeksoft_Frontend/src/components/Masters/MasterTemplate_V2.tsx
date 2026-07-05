import React from 'react';
import { LogOut, ExternalLink, User, Settings, ArrowLeft, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

interface MasterTemplateProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    activeTab?: string;
    onBackToDashboard?: () => void;
}

export const MasterTemplate: React.FC<MasterTemplateProps> = ({
    title,
    subtitle,
    children,
    activeTab = '',
    onBackToDashboard
}) => {
    const navigate = useNavigate();
    
    const handleNewWindow = () => {
        window.open(window.location.href, '_blank', 'width=1200,height=800,menubar=no,status=no');
    };

    const handleLogout = () => {
        if (confirm('¿Desea cerrar la sesión de usuario?')) {
            alert('Sesión cerrada (Demo Mode)');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col antialiased">
            {/* Header Superior Principal */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm px-6 py-3">
                <div className="flex items-center justify-between max-w-[1600px] mx-auto w-full">
                    
                    {/* Logos y Título de App */}
                    <div className="flex items-center gap-3">
                        <img src="/Logo.Petral.png" alt="Naviera Petral" className="h-8 object-contain" />
                        <div className="flex flex-col border-l border-slate-200 pl-3">
                            <h1 className="text-sm font-black text-slate-800 tracking-tight uppercase">SHIPPING.SOFT</h1>
                            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Módulos de Datos Maestros</span>
                        </div>
                    </div>

                    {/* Título Central del Módulo */}
                    <div className="hidden md:flex flex-col items-center">
                        <div className="flex items-center gap-2">
                            <Database size={16} className="text-teal-600" />
                            <h2 className="text-base font-black text-slate-800 tracking-tight">{title}</h2>
                        </div>
                        {subtitle && <p className="text-[11px] text-slate-500 font-medium mt-0.5">{subtitle}</p>}
                    </div>

                    {/* Acciones y Panel de Usuario */}
                    <div className="flex items-center gap-4">
                        {/* Botones de Control de Ventana */}
                        <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 border-slate-200 text-slate-600 cursor-pointer"
                                onClick={handleNewWindow}
                                title="Abrir este módulo en una ventana independiente"
                            >
                                <ExternalLink size={13} />
                                <span className="hidden sm:inline">Nueva Ventana</span>
                            </Button>
                            
                            {onBackToDashboard && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 border-slate-200 text-slate-600 cursor-pointer"
                                    onClick={onBackToDashboard}
                                >
                                    <ArrowLeft size={13} />
                                    <span className="hidden sm:inline">Volver a Dashboard</span>
                                </Button>
                            )}
                        </div>

                        {/* Widget de Usuario y Logo Geeksoft */}
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end hidden lg:flex">
                                <span className="text-xs font-bold text-slate-800 leading-tight">Demo User</span>
                                <span className="text-[9px] font-black text-teal-600 uppercase tracking-wider">Administrador</span>
                            </div>
                            
                            {/* Avatar */}
                            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                                <User size={16} />
                            </div>

                            {/* Botón Salir */}
                            <button 
                                onClick={handleLogout}
                                className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors border border-transparent hover:border-red-100 cursor-pointer mr-1"
                                title="Cerrar Sesión"
                            >
                                <LogOut size={16} />
                            </button>

                            <span className="text-slate-200 text-lg">|</span>
                            <img src="/Logo.Geeksoft.png" alt="Geeksoft" className="h-9 object-contain pl-1" />
                        </div>
                    </div>

                </div>
            </header>

            {/* Layout Principal con Sidebar Lateral de Maestros */}
            <div className="flex-1 flex max-w-[1600px] w-full mx-auto p-6 gap-6">
                
                {/* Sidebar Izquierdo */}
                <aside className="w-64 shrink-0 flex flex-col gap-4 hidden md:flex">
                    {/* BLOQUE 1: MAESTROS */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col gap-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Datos Maestros</div>
                        
                        <nav className="flex flex-col gap-1">
                            <button 
                                onClick={() => navigate('/vessels')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all ${activeTab === 'vessels' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <span className="text-sm">🚢</span> Maestro de Buques
                            </button>
                            
                            <button 
                                onClick={() => navigate('/routes')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all ${activeTab === 'routes' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <span className="text-sm">🗺️</span> Maestro de Rutas
                            </button>
                            
                            <button 
                                onClick={() => navigate('/clients')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all ${activeTab === 'clients' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <span className="text-sm">💼</span> Maestro de Clientes
                            </button>
                            
                            <button 
                                onClick={() => navigate('/ports')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all ${activeTab === 'ports' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <span className="text-sm">⚓</span> Maestro de Puertos
                            </button>

                            <button 
                                onClick={() => navigate('/contracts')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all ${activeTab === 'contracts' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <span className="text-sm">📝</span> Maestro de Contratos
                            </button>
                        </nav>
                    </div>

                    {/* BLOQUE 2: HERRAMIENTAS */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col gap-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Herramientas</div>
                        
                        <nav className="flex flex-col gap-1">
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all ${activeTab === 'financial-matrix' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <span className="text-sm">📊</span> Matriz Financiera
                            </button>
                            <button 
                                onClick={() => navigate('/graphic-analysis')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all ${activeTab === 'graphic-analysis' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <span className="text-sm">📈</span> Análisis Gráfico
                            </button>
                            <button 
                                onClick={() => navigate('/spaghetti-map')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all ${activeTab === 'spaghetti-map' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <span className="text-sm">🗺️</span> Spaguetti Map
                            </button>
                            <button 
                                onClick={() => navigate('/audit-ledger')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all ${activeTab === 'audit-ledger' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <span className="text-sm">🔍</span> Auditoría Ledger
                            </button>
                            <button 
                                onClick={() => navigate('/audit-engine')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all ${activeTab === 'audit-engine' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <span className="text-sm">🔎</span> Auditoría Motor
                            </button>
                        </nav>
                    </div>

                    {/* BLOQUE 3: CONFIGURACIÓN */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col gap-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Configuración</div>
                        <nav className="flex flex-col gap-1">
                            <button className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                                <Settings size={14} /> Temas y Estilos
                            </button>
                        </nav>
                    </div>

                    {/* BLOQUE 4: USUARIOS Y PERMISOS */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col gap-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Usuarios y Permisos</div>
                        <nav className="flex flex-col gap-1">
                            <button 
                                onClick={() => navigate('/users')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <User size={14} /> Gestión de Usuarios
                            </button>
                        </nav>
                    </div>
                </aside>

                {/* Contenido Principal */}
                <main className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm p-6 min-w-0 overflow-hidden">
                    {children}
                </main>

            </div>

            {/* Footer Corporativo */}
            <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-auto">
                © {new Date().getFullYear()} NAVIERA PETRAL · GEEKSOFT TECHNOLOGY PARTNER
            </footer>
        </div>
    );
};
