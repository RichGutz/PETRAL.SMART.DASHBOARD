import React, { useState, useMemo } from 'react';
import { 
    Search, 
    Ship, 
    ChevronRight, 
    Building2, 
    GitFork, 
    BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoPetral from '../../assets/Logo.Petral.png';
import { MOF_ROLES_V2 } from '../../data/mofManualData_V2';
import type { MofRole_V2 } from '../../data/mofManualData_V2';
import { MofRoleBookReader_V2 } from '../../components/MofManual/MofRoleBookReader_V2';

export const MofManual_V2: React.FC = () => {
    const navigate = useNavigate();
    const [selectedRoleId, setSelectedRoleId] = useState<string>('mof-fernando');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Filtro predictivo de puestos
    const filteredRoles = useMemo(() => {
        if (!searchTerm.trim()) return MOF_ROLES_V2;
        const lower = searchTerm.toLowerCase().trim();
        return MOF_ROLES_V2.filter(r => 
            r.personName.toLowerCase().includes(lower) ||
            r.title.toLowerCase().includes(lower) ||
            r.code.toLowerCase().includes(lower) ||
            r.department.toLowerCase().includes(lower) ||
            r.shortTitle.toLowerCase().includes(lower)
        );
    }, [searchTerm]);

    // Índice activo y navegación entre puestos
    const activeIndex = MOF_ROLES_V2.findIndex(r => r.id === selectedRoleId);
    const currentRole: MofRole_V2 = MOF_ROLES_V2[activeIndex] || MOF_ROLES_V2[0];

    const handlePrevRole = () => {
        if (activeIndex > 0) {
            setSelectedRoleId(MOF_ROLES_V2[activeIndex - 1].id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleNextRole = () => {
        if (activeIndex < MOF_ROLES_V2.length - 1) {
            setSelectedRoleId(MOF_ROLES_V2[activeIndex + 1].id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300 print:block print:gap-0 print:p-0 print:m-0 print:w-full">
            
            {/* ── ENCABEZADO CORPORATIVO PRINCIPAL ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <img src={logoPetral} alt="Naviera Petral" className="h-10 w-auto object-contain" />
                    <div className="h-8 border-l border-slate-200 hidden md:block"></div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">MANUAL DE ORGANIZACIÓN Y FUNCIONES (MOF)</h2>
                        <span className="text-xs text-slate-500 font-bold tracking-wider uppercase block">
                            ESTÁNDAR OPERATIVO NAVAL CANÓNICO • 6 PUESTOS HOMOLOGADOS
                        </span>
                    </div>
                </div>

                {/* Acciones & Navegación Rápida */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => navigate('/company-organigram')}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        <GitFork size={14} />
                        <span className="hidden sm:inline">Organigrama Oficial</span>
                    </button>
                    <button
                        onClick={() => navigate('/system-documentation')}
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        <BookOpen size={14} className="text-slate-500" />
                        <span className="hidden sm:inline">Docs as Code</span>
                    </button>
                </div>
            </div>

            {/* ── CONTENEDOR PRINCIPAL: SIDEBAR 320px + VISOR DE LIBRO A4 ── */}
            <div className="flex flex-col lg:flex-row gap-6 items-start w-full min-w-0 print:block print:w-full print:p-0 print:m-0">

                {/* PANEL LATERAL IZQUIERDO: PADRÓN DE LOS 6 PUESTOS (320px CONGELADOS) */}
                <aside className="w-full lg:w-[320px] lg:min-w-[320px] lg:max-w-[320px] shrink-0 space-y-4 print:hidden">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-hidden">
                        
                        {/* Buscador de Puestos */}
                        <div className="relative mb-3.5">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nombre, código o cargo..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            />
                        </div>

                        {/* Listado de Puestos */}
                        <div className="space-y-1.5 max-h-[500px] overflow-y-auto scrollbar-thin">
                            {filteredRoles.map((role) => {
                                const isSelected = selectedRoleId === role.id;
                                return (
                                    <button
                                        key={role.id}
                                        onClick={() => setSelectedRoleId(role.id)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer block ${
                                            isSelected 
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                                : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${
                                                isSelected 
                                                    ? 'bg-blue-500 text-white border-blue-400' 
                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                {role.code}
                                            </span>
                                            {role.assignedAsset && (
                                                <span className={`text-[10px] font-bold flex items-center gap-1 ${
                                                    isSelected ? 'text-blue-100' : 'text-emerald-700'
                                                }`}>
                                                    <Ship size={11} />
                                                    <span className="truncate max-w-[110px]">
                                                        {role.assignedAsset.includes('MOQUEGUA') ? 'MOQUEGUA' 
                                                       : role.assignedAsset.includes('TABLONES') ? 'TABLONES' 
                                                       : 'Flota'}
                                                    </span>
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-1 mt-1">
                                            <div className="min-w-0">
                                                <p className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                                    {role.personName}
                                                </p>
                                                <p className={`text-[11px] font-medium truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                                    {role.title}
                                                </p>
                                            </div>
                                            <ChevronRight size={14} className={`shrink-0 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Pie del Padrón */}
                        <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono text-center">
                            Naviera Petral S.A. • 6 Puestos Homologados
                        </div>

                    </div>
                </aside>

                {/* PANEL PRINCIPAL DERECHO: VISOR DE LIBRO EDITORIAL A4 */}
                <div className="flex-1 min-w-0 w-full print:block print:w-full print:p-0 print:m-0">
                    <MofRoleBookReader_V2
                        role={currentRole}
                        onPrevRole={handlePrevRole}
                        onNextRole={handleNextRole}
                        hasPrev={activeIndex > 0}
                        hasNext={activeIndex < MOF_ROLES_V2.length - 1}
                        currentIndex={activeIndex}
                        totalCount={MOF_ROLES_V2.length}
                        onNavigateToOrganigram={() => navigate('/company-organigram')}
                        onNavigateToDocs={() => navigate('/system-documentation')}
                    />
                </div>

            </div>

        </div>
    );
};

export default MofManual_V2;
