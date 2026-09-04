import React, { useState } from 'react';
import { LogOut, ExternalLink, User, Settings, ArrowLeft, Database, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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

    // Estado para colapsar / expandir el Sidebar Izquierdo (Permite anchar la vista de auditoría a 100%)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
        return localStorage.getItem('petral_sidebar_collapsed') === 'true';
    });

    React.useEffect(() => {
        const handleToggleEvent = () => {
            setIsSidebarCollapsed(localStorage.getItem('petral_sidebar_collapsed') === 'true');
        };
        window.addEventListener('petral_sidebar_toggle', handleToggleEvent);
        return () => window.removeEventListener('petral_sidebar_toggle', handleToggleEvent);
    }, []);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('petral_sidebar_collapsed', String(next));
            window.dispatchEvent(new Event('petral_sidebar_toggle'));
            return next;
        });
    };

    
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
                <div className="flex items-center justify-between max-w-full mx-auto w-full">
                    
                    {/* Logos y Título de App */}
                    <div className="flex items-center gap-3.5">
                        <img src="/Logo.Petral.png" alt="Naviera Petral" className="object-contain" style={{ height: '55px', maxHeight: '55px' }} />
                        <div className="flex items-center border-l border-slate-200 pl-3.5">
                            <img src="/LOGO.DELFOS.NUEVO.BLANCO.3.horizontal.jpg" alt="DELFOS" className="h-9 object-contain" />
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

            {/* PESTAÑA / RIBBON FLOTANTE VERTICAL CUANDO EL MENÚ ESTÁ COLAPSADO */}
            {isSidebarCollapsed && (
                <button
                    onClick={toggleSidebar}
                    className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-white hover:bg-slate-100 text-slate-700 py-4 px-2 rounded-r-lg shadow-md flex flex-col items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer border border-l-0 border-slate-300 transition-all hover:pr-3 group select-none pointer-events-auto"
                    title="Expandir Menú Lateral de NAVEGACIÓN"
                >
                    <PanelLeftOpen size={16} className="text-teal-600 group-hover:scale-110 transition-transform pointer-events-none" />
                    <span className="[writing-mode:vertical-lr] rotate-180 tracking-widest text-[9px] text-slate-600 font-bold pointer-events-none">EXPANDIR MENÚ</span>
                </button>
            )}

            {/* Layout Principal con Sidebar Lateral de Maestros */}
            <div className="flex-1 flex max-w-full w-full mx-auto p-4 gap-4">
                
                {/* Sidebar Izquierdo Colapsable */}
                <aside className={`${isSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden p-0 m-0 border-0 pointer-events-none' : 'w-64 opacity-100'} shrink-0 flex flex-col gap-4 hidden md:flex transition-all duration-300`}>

                    {/* CINTA / RIBBON SUPERIOR DEL SIDEBAR */}
                    <button
                        onClick={toggleSidebar}
                        className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-between shadow-sm cursor-pointer transition-all border border-slate-300 select-none group pointer-events-auto"
                        title="Colapsar Menú Lateral hacia la Izquierda (Anchar 100% Pantalla)"
                    >
                        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-700 pointer-events-none">
                            <PanelLeftClose size={15} className="text-slate-500 group-hover:-translate-x-0.5 transition-transform" /> COLAPSAR MAESTROS
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold pointer-events-none">100%</span>
                    </button>



                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col gap-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Menú de Navegación</div>
                        
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
                                <span className="text-sm">🗺️</span> Maestro de Navegación
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
                                <span className="text-sm">⚓</span> Maestro de Puertos & Terminales
                            </button>

                            <button 
                                onClick={() => navigate('/contracts')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all ${activeTab === 'contracts' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <span className="text-sm">📝</span> Maestro de Contratos
                            </button>
                        </nav>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col gap-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Configuración</div>
                        <nav className="flex flex-col gap-1">
                            <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                                <Settings size={14} /> Temas y Estilos
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
