import React, { useState, useEffect } from 'react';
import { SpaghettiMap as SpaghettiMapComponent } from '../../components/CommercialForecast/SpaghettiMap';
import { SourcesSinksEditor } from '../../components/CommercialForecast/SourcesSinksEditor';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';
import type { SourceSink } from '../../components/CommercialForecast/useSpaghettiData';
import { ForecastService } from '../../services/api';

export const SpaghettiMap_V2: React.FC = () => {
    const context = useForecastContext_V2();
    const months = context.dynamicMonths;
    const [selectedMonths, setSelectedMonths] = useState<string[]>(() => context.dynamicMonths || []);
    const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
    const [, setForceRender] = useState(0);
    const [ports, setPorts] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [rawClients, setRawClients] = useState<any[]>([]);


    // Controles de animación y nodos
    const [showPies, setShowPies] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playSpeed, setPlaySpeed] = useState(2);
    const [, setAnimationIndex] = useState(0);

    // Cargar puertos y clientes al montar
    useEffect(() => {
        const loadData = async () => {
            try {
                const [portsData, clientsData] = await Promise.all([
                    ForecastService.getPorts(),
                    ForecastService.getClientsMaster()
                ]);
                setPorts(portsData || []);
                setRawClients(clientsData || []);
            } catch (e) {
                console.error("Error al cargar datos maestros en SpaghettiMap:", e);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        // En el Spaghetti Map solo mostramos los clientes activos
        const activeClients = rawClients.filter(c => c.is_active !== false);
        setClients(activeClients);
    }, [rawClients]);

    // Seleccionar por defecto todos los meses activos modelados en la grilla
    const monthsStr = months ? months.join(',') : '';
    useEffect(() => {
        if (months && months.length > 0 && selectedMonths.length === 0 && !isPlaying) {
            setSelectedMonths([...months]);
        }
    }, [monthsStr, isPlaying]);



    // Animación automática de la línea de tiempo
    useEffect(() => {
        let interval: any;
        if (isPlaying && months.length > 0) {
            interval = setInterval(() => {
                setAnimationIndex(prev => {
                    const next = prev + 1;
                    if (next < months.length) {
                        setSelectedMonths([months[next]]);
                        return next;
                    } else if (next === months.length) {
                        // Último paso: Todo el año (todos los meses activos)
                        setSelectedMonths([...months]);
                        return next;
                    } else {
                        // Fin de la animación
                        setIsPlaying(false);
                        return 0; // Reiniciar
                    }
                });
            }, playSpeed * 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPlaying, playSpeed, months]);

    const handlePlayAnimation = () => {
        if (!isPlaying) {
            setAnimationIndex(0);
            if (months.length > 0) {
                setSelectedMonths([months[0]]);
            }
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
        }
    };

    const formatMonthPill = (yyyymm: string) => {
        if (!yyyymm) return '';
        const [y, m] = yyyymm.split('-');
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${monthNames[parseInt(m) - 1]} '${y.slice(2)}`;
    };

    const toggleMonth = (m: string) => {
        if (selectedMonths.includes(m)) {
            if (selectedMonths.length > 1) {
                setSelectedMonths(selectedMonths.filter(x => x !== m));
            }
        } else {
            setSelectedMonths([...selectedMonths, m]);
        }
    };

    const toggleAllMonths = () => {
        if (selectedMonths.length === months.length) {
            // Si todos están marcados, desmarcar todos y dejar solo el primero
            setSelectedMonths([months[0]]);
        } else {
            // Marcar todos
            setSelectedMonths([...months]);
        }
    };

    const getMonthData = (m: string) => {
        let trips = 0;
        let tons = 0;
        const ag = context.data?.aggregated_data;
        if (!ag || typeof ag !== 'object') return { trips: 0, tons: 0 };
        
        Object.values(ag).forEach((rMap: any) => {
            if (!rMap || typeof rMap !== 'object') return;
            Object.values(rMap).forEach((vMap: any) => {
                if (!vMap || typeof vMap !== 'object') return;
                Object.values(vMap).forEach((mMap: any) => {
                    if (!mMap || typeof mMap !== 'object') return;
                    const metrics = mMap[m];
                    if (metrics && typeof metrics === 'object') {
                        const rawFreq = metrics?.['raw_inputs']?.['monthly_frequency'];
                        const freq = rawFreq !== undefined ? rawFreq : (metrics?.['freq'] !== undefined ? metrics['freq'] : 0);
                        const carga = metrics?.['carga_unit'] || 0;
                        trips += Number(freq) || 0;
                        tons += ((Number(freq) || 0) * (Number(carga) || 0));
                    }
                });
            });
        });
        return { trips: Math.round(trips), tons: Math.round(tons) };
    };

    const totalSelectedTrips = (selectedMonths || []).reduce((acc, m) => acc + getMonthData(m).trips, 0);
    const totalSelectedTons = (selectedMonths || []).reduce((acc, m) => acc + getMonthData(m).tons, 0);

    const hasData = context.data && context.data.aggregated_data && typeof context.data.aggregated_data === 'object' && Object.keys(context.data.aggregated_data).length > 0;

    if (context.loading && !hasData) {
        return (
            <section className="flex-1 flex flex-col items-center justify-center min-h-[600px] w-full mt-2 bg-white border border-slate-200 rounded-tl-xl shadow-lg -mx-4 md:-mx-6 -mb-4 md:-mb-6" style={{ width: 'calc(100% + 2rem)' }}>
                <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                <p className="text-slate-700 font-bold text-base">Cargando Spaghetti Map...</p>
                <p className="text-slate-400 text-xs mt-1">Calculando flujos marítimos de {context.forecastName || 'Escenario'}</p>
            </section>
        );
    }

    if (!hasData) {
        return (
            <section className="flex-1 flex flex-col items-center justify-center min-h-[600px] w-full mt-2 bg-white border border-slate-200 rounded-tl-xl shadow-lg -mx-4 md:-mx-6 -mb-4 md:-mb-6 p-8 text-center" style={{ width: 'calc(100% + 2rem)' }}>
                <div className="w-16 h-16 bg-blue-50 text-blue-600 border border-blue-200 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">
                    🗺️
                </div>
                <h3 className="text-base font-black text-slate-800 mb-1 uppercase tracking-tight">Spaghetti Map en Blanco</h3>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                    No hay un escenario cargado en la sesión. Agrega líneas en la Matriz Financiera o haz clic en <strong>"Cargar"</strong> para proyectar la red de navegación.
                </p>
            </section>
        );
    }


    return (
        <section className="flex-1 flex flex-col mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full h-full min-h-[600px] -mx-4 md:-mx-6 -mb-4 md:-mb-6 overflow-hidden glass-card bg-white border border-slate-200 rounded-xl shadow-xs" style={{ width: 'calc(100% + 2rem)' }}>
            
            {/* Margen Superior Blanco para Escenario Activo */}
            {context.forecastName && (
                <div className="w-full bg-white border-b border-slate-200 py-2 px-4 flex items-center justify-center shrink-0 shadow-sm z-20">
                    <div className="flex items-center gap-2 bg-sky-50 px-4 py-1 rounded-full border border-sky-200 shadow-sm">
                        <span className="text-xs font-bold text-sky-700">📁 Escenario Activo:</span>
                        <span className="text-xs font-extrabold text-sky-900">{context.forecastName}</span>
                    </div>
                </div>
            )}

            {/* GRID LAYOUT: 1 Row with 2 Columns */}
            <div className="flex-1 flex flex-row w-full h-full relative">
                
                {/* COLUMN 1: Custom HTML Timeline */}
                <div className="w-[340px] md:w-[380px] bg-slate-50/70 border-r border-slate-200 flex flex-col py-5 px-4 shadow-[4px_0_15px_rgba(0,0,0,0.03)] z-10 overflow-y-auto">

                    {/* Controls Panel */}
                    <div className="flex flex-row items-stretch bg-white rounded-xl border border-slate-200 shadow-2xs mb-4 shrink-0">
                        <div className="bg-slate-900 w-7 flex items-center justify-center shrink-0 rounded-l-xl self-stretch min-h-full">
                            <span className="text-[10.5px] font-black text-white uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Controles</span>
                        </div>
                        <div className="flex-1 p-2.5 flex flex-col gap-3 bg-slate-50/70 rounded-r-xl">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                            <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-tight">Nodos (Pies y Líneas)</span>
                            <button
                                onClick={() => setShowPies(!showPies)}
                                className={`w-10 h-5 rounded-full relative transition-colors focus:outline-none ${showPies ? 'bg-sky-600' : 'bg-slate-300'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${showPies ? 'translate-x-5' : 'translate-x-0'}`}></span>
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 pt-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-tight">Animación</span>
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="10" 
                                        value={playSpeed} 
                                        onChange={(e) => setPlaySpeed(Number(e.target.value) || 2)}
                                        className="w-10 h-6 text-center text-xs font-bold border border-slate-200 rounded-lg text-slate-700 bg-white shadow-2xs focus:outline-none focus:border-sky-500"
                                    />
                                    <span className="text-[10px] text-slate-500 font-bold">seg/mes</span>
                                </div>
                            </div>
                            <button
                                onClick={handlePlayAnimation}
                                className={`w-full h-7.5 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer ${isPlaying ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-sky-600 text-white hover:bg-sky-700'}`}
                            >
                                {isPlaying ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                        </svg>
                                        Detener
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Reproducir Mes a Mes
                                    </>
                                )}
                            </button>
                        </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sky-700 text-[11px] font-black uppercase tracking-widest text-left">Línea de Tiempo</h3>
                    </div>
                    
                    {/* List of Months Header */}
                    {months.length > 0 && (
                        <div className="flex items-center pb-2 mb-2 border-b border-slate-200 px-1">
                            <div className="w-[45%]">
                                <button
                                    onClick={toggleAllMonths}
                                    className="text-[10px] font-extrabold text-sky-600 hover:text-sky-800 uppercase flex items-center gap-1 transition-colors"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {selectedMonths.length === months.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                                </button>
                            </div>
                            <div className="w-[20%] text-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Viajes</span>
                            </div>
                            <div className="w-[35%] text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Toneladas</span>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex flex-col gap-1 relative mt-1">
                        {months.length === 0 && (
                            <p className="text-slate-500 text-[10px] text-center italic mt-10">Sin horizonte</p>
                        )}
                        
                        {months.map((m) => {
                            const isSelected = selectedMonths.includes(m);
                            const { trips, tons } = getMonthData(m);
                            return (
                                <button
                                    key={m}
                                    onClick={() => toggleMonth(m)}
                                    className={`w-full flex items-center p-1.5 px-2 rounded-lg transition-all border ${isSelected ? 'bg-white border-sky-200 shadow-2xs' : 'bg-transparent border-transparent hover:bg-slate-100 hover:border-slate-200'} focus:outline-none group cursor-pointer`}
                                >
                                    <div className="w-[45%] flex items-center gap-3">
                                        <div className={`w-[20px] h-[20px] flex items-center justify-center shrink-0 transition-colors border-2 ${isSelected ? 'bg-sky-600 border-sky-600' : 'bg-white border-slate-300 group-hover:border-sky-500'} rounded-[4px]`}>
                                            {isSelected && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className={`text-[12px] font-extrabold transition-colors ${isSelected ? 'text-sky-700' : 'text-slate-500 group-hover:text-slate-700'}`}>
                                            {formatMonthPill(m)}
                                        </span>
                                    </div>
                                    <div className="w-[20%] text-center">
                                        <span className={`text-[12px] font-bold font-mono ${isSelected ? 'text-sky-900' : 'text-slate-400'}`}>
                                            {trips}
                                        </span>
                                    </div>
                                    <div className="w-[35%] text-right">
                                        <span className={`text-[12px] font-bold font-mono ${isSelected ? 'text-sky-600' : 'text-slate-400'}`}>
                                            {tons.toLocaleString('en-US')} <span className="text-[10px] font-normal">MT</span>
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    
                    {/* Footer Row: Accumulated Total pegadito al último mes */}
                    <div className="flex flex-col bg-white border border-slate-200 rounded-xl p-3 mt-2 shadow-2xs">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Acumulado ({selectedMonths.length} meses)</span>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xl font-black font-mono text-sky-900">{totalSelectedTrips}</span>
                                <span className="text-[10px] text-slate-400 uppercase">Viajes</span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-xl font-black font-mono text-sky-600">{totalSelectedTons.toLocaleString('en-US')}</span>
                                <span className="text-[10px] text-slate-400 uppercase">Toneladas (MT)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: ECharts Map */}
                <div className="flex-1 relative overflow-hidden">
                    <SpaghettiMapComponent 
                        data={context.data} 
                        months={months} 
                        selectedMonths={selectedMonths}
                        ports={ports} 
                        clients={clients}
                        isDarkMode={false} 
                        showPies={showPies}
                        playSpeed={playSpeed}
                        onPortClick={setSelectedPortId}
                    />
                    
                    {/* SourcesSinksEditor Slide-over */}
                    {selectedPortId && (
                        <SourcesSinksEditor
                            portId={selectedPortId}
                            portName={ports.find((p: any) => p.port_id === selectedPortId)?.port_name || selectedPortId}
                            sourcesSinks={ports.find((p: any) => p.port_id === selectedPortId)?.sources_sinks || []}
                            onClose={() => setSelectedPortId(null)}
                            onSave={(updatedData) => {
                                // Muta los datos en memoria para simular el cambio visual instantáneo
                                const newPorts = [...ports];
                                const port = newPorts.find((p: any) => p.port_id === selectedPortId);
                                if (port) {
                                    port.sources_sinks = updatedData;
                                    port.capacity_mt = updatedData.reduce((acc: number, curr: SourceSink) => acc + (curr.capacity_mt || 0), 0);
                                    setPorts(newPorts);
                                    setForceRender(prev => prev + 1);
                                }
                                setSelectedPortId(null);
                            }}
                        />
                    )}
                </div>
            </div>
        </section>
    );
};
