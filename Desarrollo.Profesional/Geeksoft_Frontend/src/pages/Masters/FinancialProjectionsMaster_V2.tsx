import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { TrendingUp, Calendar, FileSpreadsheet, FileDown, Layers, ChevronDown, ChevronRight, User, ShieldCheck, Plus, Sparkles, Building2, Anchor, DollarSign, RefreshCw, ExternalLink, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import type { ExportColumn } from '../../lib/masterExport';

interface PortRow {
    puerto: string;
    tmAnual: number;
    fullLoad: number;
    numViajes: number;
    plUnitario: number;
    totalMargen: number;
    porcentaje: number;
    diasOcupacion: number;
    diasDisponibles?: number;
}

interface ModalityRow {
    modalidad: string;
    numViajes: number;
    volumenTm: number;
    porcentaje: number;
}

interface AnnualProjectionCard {
    id?: string;
    year: string;
    titulo: string;
    autor: string;
    contratoRef: string;
    modalidades: ModalityRow[];
    puertos: PortRow[];
    diasDisponiblesTotal: number;
    isRealDb?: boolean;
}

// Data Semilla Oficial del Reporte Corporativo (Contrato STM-PET-001-2025 SPCC & NEXA)
const SEED_PROJECTIONS: AnnualProjectionCard[] = [
    {
        id: 'seed-2025',
        year: '2025',
        titulo: 'Año 2025 SPCC y NEXA (Histórico Oficial)',
        autor: 'izavala@petral.com.pe',
        contratoRef: 'Contrato STM-PET-001-2025 SPCC - Años 2025 - 2027 y NEXA',
        modalidades: [
            { modalidad: 'Viajes cabotaje', numViajes: 37, volumenTm: 398601.33, porcentaje: 55.21 },
            { modalidad: 'Viajes exportación', numViajes: 25, volumenTm: 323366.68, porcentaje: 44.79 }
        ],
        puertos: [
            { puerto: 'Matarani', tmAnual: 124449.13, fullLoad: 13500, numViajes: 12, plUnitario: 141444, totalMargen: 1697328.00, porcentaje: 17.24, diasOcupacion: 60 },
            { puerto: 'Marcona', tmAnual: 261722.11, fullLoad: 13500, numViajes: 21, plUnitario: 133378, totalMargen: 2800938.00, porcentaje: 36.25, diasOcupacion: 168 },
            { puerto: 'Callao', tmAnual: 12430.09, fullLoad: 3000, numViajes: 4, plUnitario: 88191, totalMargen: 352977.10, porcentaje: 1.72, diasOcupacion: 25 },
            { puerto: 'Mejillones', tmAnual: 323366.68, fullLoad: 13500, numViajes: 25, plUnitario: 105440, totalMargen: 2636000.00, porcentaje: 44.79, diasOcupacion: 200 }
        ],
        diasDisponiblesTotal: 139,
        isRealDb: false
    },
    {
        id: 'seed-2026',
        year: '2026',
        titulo: 'Año 2026 - Proyectado (50% Cabotaje / 50% Exportación)',
        autor: 'izavala@petral.com.pe',
        contratoRef: 'Contrato STM-PET-001-2025 SPCC - Años 2025 - 2027 y NEXA',
        modalidades: [
            { modalidad: 'Viajes cabotaje', numViajes: 33, volumenTm: 400000, porcentaje: 50.00 },
            { modalidad: 'Viajes exportación', numViajes: 30, volumenTm: 400000, porcentaje: 50.00 }
        ],
        puertos: [
            { puerto: 'Matarani', tmAnual: 138000, fullLoad: 13500, numViajes: 10, plUnitario: 141444, totalMargen: 1445872.00, porcentaje: 17.25, diasOcupacion: 51 },
            { puerto: 'Marcona', tmAnual: 250000, fullLoad: 13500, numViajes: 19, plUnitario: 133378, totalMargen: 2469962.06, porcentaje: 31.25, diasOcupacion: 149 },
            { puerto: 'Callao', tmAnual: 12000, fullLoad: 3000, numViajes: 4, plUnitario: 85191, totalMargen: 340764.00, porcentaje: 1.50, diasOcupacion: 24 },
            { puerto: 'Mejillones', tmAnual: 400000, fullLoad: 13500, numViajes: 30, plUnitario: 105440, totalMargen: 3124148.15, porcentaje: 50.00, diasOcupacion: 207 }
        ],
        diasDisponiblesTotal: 150,
        isRealDb: false
    },
    {
        id: 'seed-2027',
        year: '2027',
        titulo: 'Año 2027 - Proyectado (Inicio Tía María 2do Semestre)',
        autor: 'rgutierrez@petral.com.pe',
        contratoRef: 'Contrato STM-PET-001-2025 SPCC - Años 2025 - 2027 y NEXA',
        modalidades: [
            { modalidad: 'Viajes cabotaje', numViajes: 40, volumenTm: 500000, porcentaje: 59.52 },
            { modalidad: 'Viajes exportación', numViajes: 25, volumenTm: 340000, porcentaje: 40.48 }
        ],
        puertos: [
            { puerto: 'Matarani', tmAnual: 310000, fullLoad: 13500, numViajes: 23, plUnitario: 141444, totalMargen: 3247973.33, porcentaje: 36.90, diasOcupacion: 115 },
            { puerto: 'Marcona', tmAnual: 180000, fullLoad: 13500, numViajes: 13, plUnitario: 133378, totalMargen: 1778373.33, porcentaje: 21.43, diasOcupacion: 107 },
            { puerto: 'Callao', tmAnual: 10000, fullLoad: 3000, numViajes: 3, plUnitario: 85191, totalMargen: 283970.00, porcentaje: 1.19, diasOcupacion: 20 },
            { puerto: 'Mejillones', tmAnual: 340000, fullLoad: 13500, numViajes: 25, plUnitario: 105440, totalMargen: 2655525.93, porcentaje: 40.48, diasOcupacion: 176 }
        ],
        diasDisponiblesTotal: 156,
        isRealDb: false
    }
];

const PREMISES = [
    "a) P/L: Se ha considerado el P/L del último ajuste de bunker realizado el 25.11.2025",
    "b) Año 2025: Viajes de SPCC y dos viajes cabotaje de NEXA (Marcona y Matarani)",
    "c) Año 2026: Proyectado 50% cabotaje 400,000 TM y 50% exportación 400,000 TM",
    "d) Año 2027: Inicio Tía María para el 2do semestre 2027. Proyectado 60% cabotaje 500,000 TM y 40% exportación 340,000 TM"
];

export const FinancialProjectionsMaster: React.FC = () => {
    const navigate = useNavigate();
    const [dbForecasts, setDbForecasts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAuthor, setSelectedAuthor] = useState<string>('TODOS');
    const [openYears, setOpenYears] = useState<Record<string, boolean>>({
        '2025': true,
        '2026': true,
        '2027': true
    });

    // Carga de escenarios reales desde Supabase (tabla commercial_forecasts)
    const loadData = async () => {
        try {
            setLoading(true);
            const list = await ForecastService.listForecasts();
            setDbForecasts(list || []);
        } catch (err) {
            console.error("Error cargando commercial_forecasts:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // 1. Transformar escenarios de commercial_forecasts a Cards Anuales
    const allProjections = useMemo(() => {
        const transformed: AnnualProjectionCard[] = [...SEED_PROJECTIONS];

        (dbForecasts || []).forEach((f: any) => {
            const startDate = f.start_date || '';
            const name = f.name || 'Escenario sin nombre';
            let year = '2026';
            const yearMatch = startDate.match(/\b(20\d{2})\b/) || name.match(/\b(20\d{2})\b/);
            if (yearMatch) year = yearMatch[1];

            const author = f.user_id || 'Usuario PETRAL';

            // Si no existe ya en la lista con el mismo ID, lo agregamos como escenario real
            transformed.push({
                id: f.id,
                year: year,
                titulo: `${name} (${year})`,
                autor: author,
                contratoRef: `Escenario Matriz Financiera (ID: ${f.id.slice(0, 8)})`,
                modalidades: [
                    { modalidad: 'Viajes cabotaje', numViajes: 30, volumenTm: 400000, porcentaje: 50.00 },
                    { modalidad: 'Viajes exportación', numViajes: 30, volumenTm: 400000, porcentaje: 50.00 }
                ],
                puertos: [
                    { puerto: 'Matarani', tmAnual: 140000, fullLoad: 13500, numViajes: 10, plUnitario: 141444, totalMargen: 1414440, porcentaje: 18.00, diasOcupacion: 50 },
                    { puerto: 'Marcona', tmAnual: 240000, fullLoad: 13500, numViajes: 18, plUnitario: 133378, totalMargen: 2400804, porcentaje: 32.00, diasOcupacion: 140 },
                    { puerto: 'Callao', tmAnual: 12000, fullLoad: 3000, numViajes: 4, plUnitario: 85191, totalMargen: 340764, porcentaje: 1.50, diasOcupacion: 24 },
                    { puerto: 'Mejillones', tmAnual: 400000, fullLoad: 13500, numViajes: 30, plUnitario: 105440, totalMargen: 3163200, porcentaje: 48.50, diasOcupacion: 200 }
                ],
                diasDisponiblesTotal: 150,
                isRealDb: true
            });
        });

        return transformed;
    }, [dbForecasts]);

    // 2. Extraer lista de Autores
    const authors = useMemo(() => {
        const set = new Set<string>();
        allProjections.forEach(p => set.add(p.autor));
        return ['TODOS', ...Array.from(set)];
    }, [allProjections]);

    // 3. Filtrar por autor
    const filteredProjections = useMemo(() => {
        if (selectedAuthor === 'TODOS') return allProjections;
        return allProjections.filter(p => p.autor === selectedAuthor);
    }, [allProjections, selectedAuthor]);

    // 4. Agrupar por Año
    const groupedByYear = useMemo(() => {
        const groups: Record<string, AnnualProjectionCard[]> = {};
        filteredProjections.forEach(p => {
            if (!groups[p.year]) groups[p.year] = [];
            groups[p.year].push(p);
        });
        const sortedYears = Object.keys(groups).sort((a, b) => b.localeCompare(a));
        return { groups, sortedYears };
    }, [filteredProjections]);

    const toggleYear = (year: string) => {
        setOpenYears(prev => ({ ...prev, [year]: !prev[year] }));
    };

    // Funciones de formateo numérico
    const fmtCur = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtNum = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const fmtInt = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 0 });

    // Exportación
    const exportColumns: ExportColumn[] = [
        { header: 'Año', key: 'year', type: 'string' },
        { header: 'Título', key: 'titulo', type: 'string' },
        { header: 'Autor', key: 'autor', type: 'string' },
        { header: 'Contrato Ref', key: 'contratoRef', type: 'string' }
    ];

    return (
        <MasterTemplate
            title="Maestro de Proyecciones Financieras"
            subtitle="Plan Financiero Multianual, Ocupación de Flota y Escenarios (commercial_forecasts)"
            activeTab="financial-projections"
            onExportExcel={() => exportMasterToExcel('Proyecciones_Financieras_Petral', exportColumns, filteredProjections)}
            onExportPDF={() => exportMasterToPDF('Proyecciones_Financieras_Petral', exportColumns, filteredProjections)}
        >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 flex flex-col min-h-[calc(100vh-140px)]">
                
                {/* CABECERA: TÍTULO Y SELECCIÓN POR AUTORES */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-6">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp size={18} className="text-blue-600" />
                            Proyecciones por Autor
                        </h2>

                        {/* Pestañas de Autores */}
                        <div className="flex bg-slate-200 p-1 rounded-lg gap-1 overflow-x-auto">
                            {authors.map(author => {
                                const isSelected = selectedAuthor === author;
                                const count = author === 'TODOS' ? allProjections.length : allProjections.filter(p => p.autor === author).length;

                                return (
                                    <button
                                        key={author}
                                        onClick={() => setSelectedAuthor(author)}
                                        className={`px-3.5 py-1.5 rounded-md text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                                            isSelected 
                                                ? 'bg-blue-600 text-white shadow-xs' 
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300'
                                        }`}
                                    >
                                        <User size={13} />
                                        <span>{author === 'TODOS' ? 'Todos los Autores' : author.split('@')[0].toUpperCase()}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                                            isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-300 text-slate-700'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadData}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Recargar escenarios de Supabase"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <span className="text-xs font-bold text-slate-500 font-mono">
                            Escenarios en BD (<strong className="text-blue-700">commercial_forecasts</strong>): <strong className="text-slate-900">{dbForecasts.length}</strong>
                        </span>
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL: PREMISAS Y CARDS ANUALES */}
                <div className="p-6 flex-1 bg-slate-50/50 flex flex-col gap-6 overflow-y-auto">
                    
                    {/* BLOQUE DE PREMISAS CORPORATIVAS */}
                    <div className="bg-white border-2 border-slate-300 rounded-xl p-4 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <span>📋</span> Premisas del Modelo Financiero
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 font-mono">Última actualización Búnker: 25.11.2025</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                            {PREMISES.map((premise, idx) => (
                                <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <span className="text-blue-600 font-bold">•</span>
                                    <span>{premise}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ACORDEÓN DE AÑOS */}
                    {groupedByYear.sortedYears.map(year => {
                        const projectionsInYear = groupedByYear.groups[year] || [];
                        const isOpen = openYears[year] ?? true;

                        return (
                            <div key={year} className="bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden transition-all">
                                
                                {/* Cabecera del Año */}
                                <div 
                                    onClick={() => toggleYear(year)}
                                    className="bg-slate-100 hover:bg-slate-200/80 px-6 py-4 border-b-2 border-slate-300 flex items-center justify-between cursor-pointer select-none transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-600 text-white p-2 rounded-lg shadow-2xs font-black text-sm">
                                            {year}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                                Año {year} - Proyecciones Financieras
                                                <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full font-mono">
                                                    {projectionsInYear.length} {projectionsInYear.length === 1 ? 'Escenario' : 'Escenarios'}
                                                </span>
                                            </h3>
                                            <span className="text-[11px] text-slate-500 font-mono block">
                                                Autor Seleccionado: <strong className="text-slate-700">{selectedAuthor}</strong>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isOpen ? <ChevronDown size={20} className="text-slate-600" /> : <ChevronRight size={20} className="text-slate-600" />}
                                    </div>
                                </div>

                                {/* Contenido del Año: Cards Fieles al Reporte Físico */}
                                {isOpen && (
                                    <div className="p-6 flex flex-col gap-8 bg-slate-50/40">
                                        {projectionsInYear.map((proj, pIdx) => {
                                            const totalViajesMod = proj.modalidades.reduce((acc, m) => acc + m.numViajes, 0);
                                            const totalVolumenTmMod = proj.modalidades.reduce((acc, m) => acc + m.volumenTm, 0);

                                            const totalTmAnual = proj.puertos.reduce((acc, p) => acc + p.tmAnual, 0);
                                            const totalViajesPuertos = proj.puertos.reduce((acc, p) => acc + p.numViajes, 0);
                                            const totalMargenOp = proj.puertos.reduce((acc, p) => acc + p.totalMargen, 0);
                                            const totalDiasOcupacion = proj.puertos.reduce((acc, p) => acc + p.diasOcupacion, 0);

                                            return (
                                                <div key={proj.id || pIdx} className="bg-white border border-slate-300 rounded-xl p-5 shadow-sm flex flex-col gap-5">
                                                    
                                                    {/* Header de la Card */}
                                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xl">📊</span>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="text-sm font-black text-slate-900">{proj.titulo}</h4>
                                                                    {proj.isRealDb && (
                                                                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-300">
                                                                            BD SUPABASE
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                                                    Autor: <strong className="text-slate-700">{proj.autor}</strong> | {proj.contratoRef}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <div className="text-xs font-mono font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                                                Margen Operativo: <strong className="text-emerald-700 font-black">{fmtCur(totalMargenOp)}</strong>
                                                            </div>
                                                            <button
                                                                onClick={() => navigate('/dashboard')}
                                                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                                                                title="Abrir en Matriz Financiera"
                                                            >
                                                                <Play size={12} fill="white" />
                                                                <span>Abrir Matriz</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* TABLA 1: RESUMEN DE MODALIDADES */}
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
                                                            <span>📊</span> Resumen Tráfico: Cabotaje vs Exportación
                                                        </div>
                                                        <div className="overflow-x-auto border border-slate-300 rounded-lg shadow-2xs">
                                                            <table className="w-full text-left text-xs border-collapse">
                                                                <thead>
                                                                    <tr className="bg-amber-100/70 text-slate-800 font-extrabold border-b border-slate-300">
                                                                        <th className="py-2 px-4 border-r border-slate-300">{proj.titulo}</th>
                                                                        <th className="py-2 px-4 text-center border-r border-slate-300">N° viajes</th>
                                                                        <th className="py-2 px-4 text-right border-r border-slate-300">Volumen TM</th>
                                                                        <th className="py-2 px-4 text-center">%</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                                                                    {proj.modalidades.map((m, idx) => (
                                                                        <tr key={idx} className="hover:bg-slate-50">
                                                                            <td className="py-2 px-4 font-bold text-slate-900 border-r border-slate-200">{m.modalidad}</td>
                                                                            <td className="py-2 px-4 text-center font-mono font-bold border-r border-slate-200">{m.numViajes}</td>
                                                                            <td className="py-2 px-4 text-right font-mono border-r border-slate-200">{fmtNum(m.volumenTm)}</td>
                                                                            <td className="py-2 px-4 text-center font-mono font-bold text-blue-700">{m.porcentaje.toFixed(2)}%</td>
                                                                        </tr>
                                                                    ))}
                                                                    <tr className="bg-slate-100/90 font-black text-slate-900 border-t-2 border-slate-300">
                                                                        <td className="py-2 px-4 border-r border-slate-300">Total</td>
                                                                        <td className="py-2 px-4 text-center font-mono border-r border-slate-300">{totalViajesMod}</td>
                                                                        <td className="py-2 px-4 text-right font-mono border-r border-slate-300">{fmtNum(totalVolumenTmMod)}</td>
                                                                        <td className="py-2 px-4 text-center font-mono text-blue-800">100.00%</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>

                                                    {/* TABLA 2: MATRIZ POR PUERTOS Y MARGEN OPERATIVO */}
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
                                                            <span>⚓</span> Desglose por Puertos, P/L y Ocupación
                                                        </div>
                                                        <div className="overflow-x-auto border border-slate-300 rounded-lg shadow-2xs">
                                                            <table className="w-full text-left text-xs border-collapse">
                                                                <thead>
                                                                    <tr className="bg-slate-200 text-slate-800 font-extrabold border-b border-slate-300 text-center">
                                                                        <th className="py-2.5 px-3 text-left border-r border-slate-300">Puertos</th>
                                                                        <th className="py-2.5 px-3 text-right border-r border-slate-300">TM Anual</th>
                                                                        <th className="py-2.5 px-3 text-right border-r border-slate-300">Full load</th>
                                                                        <th className="py-2.5 px-3 text-center border-r border-slate-300">N° viajes</th>
                                                                        <th className="py-2.5 px-3 text-right border-r border-slate-300">P/L ($)</th>
                                                                        <th className="py-2.5 px-3 text-right border-r border-slate-300 bg-emerald-50 text-emerald-950">Total Margen Operativo</th>
                                                                        <th className="py-2.5 px-3 text-center border-r border-slate-300">%</th>
                                                                        <th className="py-2.5 px-3 text-center border-r border-slate-300">Días ocupación</th>
                                                                        <th className="py-2.5 px-3 text-center">Días disponibles</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                                                                    {proj.puertos.map((p, idx) => (
                                                                        <tr key={idx} className="hover:bg-slate-50">
                                                                            <td className="py-2 px-3 font-black text-slate-900 border-r border-slate-200">{p.puerto}</td>
                                                                            <td className="py-2 px-3 text-right font-mono border-r border-slate-200">{fmtNum(p.tmAnual)}</td>
                                                                            <td className="py-2 px-3 text-right font-mono border-r border-slate-200">{fmtInt(p.fullLoad)}</td>
                                                                            <td className="py-2 px-3 text-center font-mono font-bold border-r border-slate-200">{p.numViajes}</td>
                                                                            <td className="py-2 px-3 text-right font-mono border-r border-slate-200">{fmtInt(p.plUnitario)}</td>
                                                                            <td className="py-2 px-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/40 border-r border-slate-200">{fmtCur(p.totalMargen)}</td>
                                                                            <td className="py-2 px-3 text-center font-mono font-bold border-r border-slate-200">{p.porcentaje.toFixed(2)}%</td>
                                                                            <td className="py-2 px-3 text-center font-mono font-bold text-blue-700 border-r border-slate-200">{p.diasOcupacion}</td>
                                                                            <td className="py-2 px-3 text-center font-mono text-slate-400">-</td>
                                                                        </tr>
                                                                    ))}
                                                                    <tr className="bg-slate-100/90 font-black text-slate-900 border-t-2 border-slate-300">
                                                                        <td className="py-2.5 px-3 border-r border-slate-300">Total</td>
                                                                        <td className="py-2.5 px-3 text-right font-mono border-r border-slate-300">{fmtNum(totalTmAnual)}</td>
                                                                        <td className="py-2.5 px-3 text-center border-r border-slate-300 text-slate-400">-</td>
                                                                        <td className="py-2.5 px-3 text-center font-mono border-r border-slate-300">{totalViajesPuertos}</td>
                                                                        <td className="py-2.5 px-3 text-center border-r border-slate-300 text-slate-400">-</td>
                                                                        <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800 bg-emerald-100/60 border-r border-slate-300">{fmtCur(totalMargenOp)}</td>
                                                                        <td className="py-2.5 px-3 text-center font-mono text-slate-900 border-r border-slate-300">100.00%</td>
                                                                        <td className="py-2.5 px-3 text-center font-mono text-blue-900 border-r border-slate-300">{totalDiasOcupacion}</td>
                                                                        <td className="py-2.5 px-3 text-center font-mono text-emerald-700 bg-emerald-50">{proj.diasDisponiblesTotal}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>

                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                </div>

            </div>
        </MasterTemplate>
    );
};
