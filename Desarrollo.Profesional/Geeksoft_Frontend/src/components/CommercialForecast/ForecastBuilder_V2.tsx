import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { MonthPicker } from '../ui/month-picker';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { PlusCircle, Filter } from 'lucide-react';
import { ForecastGridFilters } from './ForecastGridFilters';

interface ForecastBuilderProps {
    onHorizonChange: (start: string, end: string) => void;
    onAddLine: (line: any) => void;
    currentStartDate: string;
    currentEndDate: string;
    dynamicMonths: string[];
    bottomRightContent?: React.ReactNode;
    hideInputs?: boolean;
    displayMode?: 'usd' | 'pct';
    onDisplayModeChange?: (mode: 'usd' | 'pct') => void;
    portCostMode?: 'static' | 'matrix';
    onPortCostModeChange?: (mode: 'static' | 'matrix') => void;
    forecastName?: string;
    isAdding?: boolean;
    demurragePct?: string;
    showDemurrage?: boolean;
    onDemurragePctChange?: (val: string) => void;
    onShowDemurrageChange?: (val: boolean) => void;
    demurrageDays?: string;
    showDemurrageDays?: boolean;
    onDemurrageDaysChange?: (val: string) => void;
    onShowDemurrageDaysChange?: (val: boolean) => void;
}

export const ForecastBuilder: React.FC<ForecastBuilderProps> = ({ 
    onHorizonChange, 
    onAddLine,
    currentStartDate,
    currentEndDate,
    dynamicMonths,
    bottomRightContent,
    hideInputs = false,
    displayMode = 'usd',
    onDisplayModeChange,
    forecastName,
    isAdding = false,
    demurragePct = '0',
    showDemurrage = false,
    onDemurragePctChange,
    onShowDemurrageChange,
    demurrageDays = '0',
    showDemurrageDays = false,
    onDemurrageDaysChange,
    onShowDemurrageDaysChange,
}) => {
    // Form State
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [clientTab, setClientTab] = useState<'activos' | 'prospectos'>('activos');
    const [client, setClient] = useState('');
    const [route, setRoute] = useState('');
    const [vessel, setVessel] = useState('');
    const [quantity, setQuantity] = useState('');
    const [frequency, setFrequency] = useState('1');
    const [customTariff, setCustomTariff] = useState('');
    const [spotSuffix, setSpotSuffix] = useState('');
    
    // Dynamic Clients State
    const [activeClients, setActiveClients] = useState<string[]>(['SPCC', 'NEXA', 'SPOT']);
    const [prospectClients, setProspectClients] = useState<string[]>([]);
    const [spotRoutes, setSpotRoutes] = useState<any[]>([]);

    // Identificar si la ruta seleccionada es una ruta de cotización o ruta multicotizador compleja
    const matchedSpot = useMemo(() => {
        if (!client || !route) return null;
        if (route.startsWith('QUOTE:')) {
            const parts = route.split(':');
            const spotIdStr = parts[1];
            return spotRoutes.find(s => 
                String(s.spot_id) === spotIdStr || 
                String(s.route_id) === spotIdStr || 
                String(s.contract_id) === spotIdStr || 
                String(s.id) === spotIdStr ||
                String(s.name) === spotIdStr
            ) || null;
        }

        const ports = route.split('-');
        if (ports.length < 2) return null;
        const orig = ports[0].toUpperCase();
        const dest = ports[1].toUpperCase();

        return spotRoutes.find(s => {
            const name = (s.name || "").toUpperCase();
            if (!name.startsWith(`${client.toUpperCase()}.`)) return false;

            const tramos = s.legs_data?.tramos || [];
            const laden = tramos.filter((t: any) => t.type?.toUpperCase() === 'LADEN');
            if (laden.length === 0) return false;

            const firstOrig = laden[0].origin_port_id?.toUpperCase();
            const lastDest = laden[laden.length - 1].destination_port_id?.toUpperCase();

            return firstOrig === orig && lastDest === dest;
        });
    }, [client, route, spotRoutes]);

    const isComplexRoute = useMemo(() => {
        return matchedSpot?.legs_data?.is_multicotizador === true || 
               Boolean(matchedSpot?.legs_data?.tramos && matchedSpot.legs_data.tramos.length > 0) || 
               route.startsWith('QUOTE:');
    }, [matchedSpot, route]);

    // Filtrar las rutas disponibles comercialmente y cotizaciones para el cliente activo
    const clientRoutes = useMemo(() => {
        if (!client) return [];
        const cleanClient = client.trim().toUpperCase();
        const routesList: Array<{ key: string; label: string; isQuote?: boolean }> = [];
        const addedKeys = new Set<string>();

        // 1. Carga 100% Dinámica desde Supabase (contracts, routes_quotes, routes_clients)
        spotRoutes.forEach(s => {
            const name = (s.name || "").trim().toUpperCase();
            let qClient = (s.client_id || s.client_name || "").trim().toUpperCase();
            if (!qClient) {
                if (name.includes('.')) {
                    qClient = name.split('.')[0].trim();
                } else if (name.includes('-')) {
                    qClient = name.split('-')[0].trim();
                }
            }

            if (qClient === cleanClient || name.startsWith(`${cleanClient}.`) || name.startsWith(`${cleanClient}_`)) {
                const tramos = s.legs_data?.tramos || [];
                const laden = tramos.filter((t: any) => t.type?.toUpperCase() === 'LADEN');
                let key = '';
                const sId = s.name || s.spot_id || s.route_id || s.contract_id || s.id;
                if (laden.length > 0) {
                    const orig = laden[0].origin_port_id;
                    const dest = laden[laden.length - 1].destination_port_id;
                    key = `QUOTE:${sId}:${orig}-${dest}`;
                } else if (s.origin_port_id && s.destination_port_id) {
                    key = `QUOTE:${sId}:${s.origin_port_id}-${s.destination_port_id}`;
                } else {
                    key = `QUOTE:${sId}:UNK-UNK`;
                }

                if (!addedKeys.has(key)) {
                    addedKeys.add(key);
                    routesList.push({
                        key,
                        label: s.name,
                        isQuote: true
                    });
                }
            }
        });

        return routesList;
    }, [client, spotRoutes]);


    // Lógica reactiva para autocompletar buque, cantidad y flete (yield)
    useEffect(() => {
        if (isComplexRoute && matchedSpot) {
            const legs = matchedSpot.legs_data || {};
            
            // 1. Resolver buque guardado
            const savedVessel = legs.vessel_id || legs.vesselParams?.vessel_id || matchedSpot.vessel_id || '';
            if (savedVessel) {
                setVessel(savedVessel);
            }

            // 2. Calcular cantidad total de la ruta compleja (suma de tramos LADEN)
            const tramos = legs.tramos || [];
            const totalQty = tramos.reduce((acc: number, tr: any) => 
                acc + (tr.type?.toUpperCase() === 'LADEN' ? (Number(tr.quantity) || 0) : 0), 0
            );
            if (totalQty > 0) {
                setQuantity(String(totalQty));
            }

            // 3. Calcular flete ponderado (Yield Flete)
            const totalRevenue = tramos.reduce((acc: number, tr: any) => 
                acc + (tr.type?.toUpperCase() === 'LADEN' ? (Number(tr.quantity) || 0) * (Number(tr.freight_rate) || 0) : 0), 0
            );
            const yieldFlete = totalQty > 0 ? (totalRevenue / totalQty) : 0;
            if (yieldFlete > 0) {
                setCustomTariff(yieldFlete.toFixed(2));
            }
        } else {
            if (route && !route.startsWith('QUOTE:')) {
                setCustomTariff('');
                setVessel('');
                setQuantity('');
            }
        }
    }, [isComplexRoute, matchedSpot, client, route]);

    const formatMonthPill = (yyyymm: string) => {
        const [y, m] = yyyymm.split('-');
        const date = new Date(parseInt(y), parseInt(m) - 1);
        const month = date.toLocaleString('es-ES', { month: 'short' }).replace('.', '');
        return `${month.charAt(0).toUpperCase() + month.slice(1)} ${y.slice(2)}`;
    };

    useEffect(() => {
        import('../../services/api').then(({ ForecastService }) => {
            // 1. Clientes Activos
            ForecastService.getRoutesMaster().then(routesList => {
                const clientNames = (routesList || []).map((r: any) => {
                    const name = r.name || "";
                    const firstPart = name.split('.')[0] || "";
                    return firstPart.trim().toUpperCase();
                }).filter((name: string) => name && name !== 'SPOT');

                const uniqueActive = Array.from(new Set(['SPCC', 'NEXA', ...clientNames]));
                uniqueActive.sort();
                setActiveClients(uniqueActive);
            }).catch(err => {
                console.error("Failed to load routes master for clients:", err);
                setActiveClients(['SPCC', 'NEXA']);
            });

            // 2. Cotizaciones y Prospectos
            ForecastService.listSpots().then(spots => {
                setSpotRoutes(spots || []);
                const prospectNames = new Set<string>();
                (spots || []).forEach((s: any) => {
                    const name = (s.name || "").trim().toUpperCase();
                    let pName = name;
                    if (name.includes('.')) pName = name.split('.')[0].trim();
                    else if (name.includes('-')) pName = name.split('-')[0].trim();
                    if (pName && pName !== 'SPCC' && pName !== 'NEXA' && pName !== 'SPOT') {
                        prospectNames.add(pName);
                    }
                });
                const sortedProspects = Array.from(prospectNames).sort();
                setProspectClients(sortedProspects.length > 0 ? sortedProspects : ['MARCOBRE', 'PRIMAX', 'CODELCO', 'CERRO VERDE']);
            }).catch(err => console.error("Failed to fetch spot routes:", err));
        });
    }, []);

    // Limpiar la ruta seleccionada si cambia el cliente o la pestaña
    useEffect(() => {
        setRoute('');
    }, [client, clientTab]);

    // Limpiar cliente al cambiar de pestaña
    const handleTabChange = (tab: 'activos' | 'prospectos') => {
        setClientTab(tab);
        setClient('');
        setRoute('');
    };

    // Clear month if it falls outside the new horizon
    useEffect(() => {
        setSelectedMonths(prev => prev.filter(m => dynamicMonths.includes(m)));
    }, [dynamicMonths]);

    // Maestro de Flota (Capacidad de Carga Normal)
    const VESSEL_CAPACITY: Record<string, string> = {
        'TABLONES': '13500',
        'MOQUEGUA': '13500',
        'CONCON_TRADER': '19000',
        'HUEMUL': '22062'
    };

    // Autocompletar la capacidad del buque (MT) cuando se selecciona uno
    useEffect(() => {
        if (!isComplexRoute) {
            if (vessel && VESSEL_CAPACITY[vessel]) {
                setQuantity(VESSEL_CAPACITY[vessel]);
            }
        }
    }, [vessel, isComplexRoute]);

    useEffect(() => {
        if (client !== 'SPOT') {
            setSpotSuffix('');
        }
    }, [client]);

    // Validación precisa de campos faltantes para la burbuja / tooltip
    const missingFields = useMemo(() => {
        const missing: string[] = [];
        if (selectedMonths.length === 0) missing.push("3. Meses a modelar");
        if (!client) missing.push("4. Cliente");
        if (!route) missing.push("5. Ruta / Quote");
        if (!vessel) missing.push("6. Buque");
        if (!frequency || parseInt(frequency) <= 0) missing.push("7. N° Viajes");
        if (client === 'SPOT' && !spotSuffix.trim()) missing.push("Sufijo SPOT");
        if (client === 'SPOT' && !customTariff) missing.push("Flete SPOT");
        return missing;
    }, [selectedMonths, client, route, vessel, frequency, spotSuffix, customTariff]);

    const isFormValid = missingFields.length === 0;

    const handleAdd = () => {
        const effectiveQty = quantity || (vessel ? VESSEL_CAPACITY[vessel] : '13500');
        if (!isFormValid || !effectiveQty) return;

        const finalClient = client === 'SPOT' ? `SPOT-${spotSuffix.trim().toUpperCase()}` : client;

        selectedMonths.forEach(mIdx => {
            let origin_port_id = '';
            let destination_port_id = '';
            let quote_id: number | undefined = undefined;

            if (route.startsWith('QUOTE:')) {
                const parts = route.split(':');
                const rawQuoteId = parts[1];
                quote_id = isNaN(Number(rawQuoteId)) ? (rawQuoteId as any) : parseInt(rawQuoteId);
                const ports = parts[2].split('-');
                origin_port_id = ports[0];
                destination_port_id = ports[1];
            } else {
                origin_port_id = route.split('-')[0];
                destination_port_id = route.split('-')[1];
            }

            onAddLine({
                month_index: mIdx,
                client_id: finalClient,
                origin_port_id,
                destination_port_id,
                vessel_id: vessel,
                quantity: parseInt(effectiveQty),
                monthly_frequency: parseInt(frequency),
                custom_tariff: customTariff ? parseFloat(customTariff) : undefined,
                quote_id
            });
        });
    };

    const currentClientList = clientTab === 'activos' ? activeClients : prospectClients;

    // Resolver objeto y etiqueta legible de la ruta seleccionada
    const selectedRouteObj = useMemo(() => {
        return clientRoutes.find(r => r.key === route);
    }, [clientRoutes, route]);

    const selectedRouteDisplay = useMemo(() => {
        if (!selectedRouteObj) return '';
        return selectedRouteObj.isQuote ? `💬 ${selectedRouteObj.label}` : selectedRouteObj.label.replace('-', ' - ');
    }, [selectedRouteObj]);

    // SERIE 33: Guarda DESPUÉS de todos los hooks (Fix React Error #300)
    // hideInputs cambia con activeTab (false en /dashboard, true en /graphic-analysis)
    // Si el return estuviera antes de los useMemo de arriba, React contaría hooks distintos
    // en cada render y lanzaría "Rendered fewer hooks than expected".
    if (hideInputs) {
        return null;
    }

    return (
        <Card className="glass-card bg-white border border-slate-200 shadow-xs relative overflow-visible rounded-xl">
            <CardContent className="py-2.5 px-4 flex flex-col gap-3">
                
                {/* ========================================================================= */}
                {/* FILA 1: HORIZONTE, CLIENTE, RUTA Y BUQUE (SISTEMA DE DISEÑO APEFAC LIGHT) */}
                {/* ========================================================================= */}
                <div className="flex flex-row items-center gap-2.5 w-full overflow-x-auto pb-1 scrollbar-none shrink-0">
                    
                    {/* 1. Inicio forecast */}
                    <div className="flex flex-col gap-1 flex-1 min-w-[130px] bg-slate-50/80 border border-slate-200 rounded-lg p-1.5 shadow-2xs hover:border-slate-300 transition-all">
                        <Label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap">1. Inicio forecast</Label>
                        <MonthPicker 
                            value={currentStartDate.slice(0, 7)}
                            onChange={(val) => {
                                const newStartVal = val || '';
                                const currentEndVal = currentEndDate.slice(0, 7);
                                if (newStartVal > currentEndVal) {
                                    const y = parseInt(newStartVal.split('-')[0]);
                                    const m = parseInt(newStartVal.split('-')[1]);
                                    const lastDay = new Date(y, m, 0).getDate();
                                    onHorizonChange(`${newStartVal}-01`, `${newStartVal}-${lastDay}`);
                                } else {
                                    onHorizonChange(`${newStartVal}-01`, currentEndDate);
                                }
                            }}
                            placeholder="Inicio"
                            className="border-slate-200 bg-white shadow-2xs h-7.5 text-xs font-bold"
                        />
                    </div>

                    {/* 2. Fin forecast */}
                    <div className="flex flex-col gap-1 flex-1 min-w-[130px] bg-slate-50/80 border border-slate-200 rounded-lg p-1.5 shadow-2xs hover:border-slate-300 transition-all">
                        <Label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap">2. Fin forecast</Label>
                        <MonthPicker 
                            value={currentEndDate.slice(0, 7)}
                            onChange={(val) => {
                                if (!val) return;
                                const currentStartVal = currentStartDate.slice(0, 7);
                                let finalStart = currentStartDate;
                                if (val < currentStartVal) {
                                    finalStart = `${val}-01`;
                                }
                                const year = parseInt(val.split('-')[0]);
                                const month = parseInt(val.split('-')[1]);
                                const lastDay = new Date(year, month, 0).getDate();
                                onHorizonChange(finalStart, `${val}-${lastDay}`);
                            }}
                            minDate={currentStartDate.slice(0, 7)}
                            placeholder="Fin"
                            className="border-slate-200 bg-white shadow-2xs h-7.5 text-xs font-bold"
                        />
                    </div>

                    {/* 3. Meses a modelar */}
                    <div className="flex flex-col gap-1 flex-1 min-w-[140px] relative bg-slate-50/80 border border-slate-200 rounded-lg p-1.5 shadow-2xs hover:border-slate-300 transition-all">
                        <Label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap">3. Meses a modelar</Label>
                        <Popover>
                            <PopoverTrigger
                                className="w-full flex items-center justify-between px-2.5 h-7.5 text-xs bg-white border border-sky-300 shadow-2xs rounded-md hover:border-sky-500 focus:outline-none transition-all text-sky-900 font-extrabold"
                            >
                                <span className="truncate text-left w-full">
                                    {selectedMonths.length === 0 ? "Seleccionar..." : 
                                     selectedMonths.length === 1 ? selectedMonths[0] : 
                                     `${selectedMonths.length} meses`}
                                </span>
                                <span className="text-[10px] text-sky-600 shrink-0 ml-1">▼</span>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px] p-4" side="bottom" align="start">
                                <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400 mb-3 border-b pb-1.5">Selección Múltiple</div>
                                <div className="flex gap-3">
                                    <div className="flex-1 max-h-[220px] overflow-y-auto pr-1 grid grid-cols-3 gap-2 custom-scrollbar">
                                        {dynamicMonths.length === 0 ? (
                                            <div className="col-span-3 text-xs text-slate-500 italic py-2 text-center">Falta definir horizonte</div>
                                        ) : (
                                            dynamicMonths.map(m => (
                                                 <button
                                                    key={m}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (selectedMonths.includes(m)) setSelectedMonths(prev => prev.filter(x => x !== m));
                                                        else setSelectedMonths(prev => [...prev, m].sort());
                                                    }}
                                                    className={`px-1.5 py-1.5 rounded-full text-[10px] font-bold transition-all border outline-none truncate ${
                                                        selectedMonths.includes(m) 
                                                        ? 'bg-petral-teal text-white border-petral-teal shadow-md transform scale-[1.02]' 
                                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-700'
                                                    }`}
                                                >
                                                    {formatMonthPill(m)}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    {dynamicMonths.length > 0 && (
                                        <div className="flex flex-col gap-2 border-l pl-3 justify-start pt-1">
                                            <button 
                                                type="button" 
                                                onClick={() => setSelectedMonths([...dynamicMonths])}
                                                className="text-[10px] w-[64px] py-1.5 bg-slate-100 rounded text-slate-600 font-bold hover:bg-slate-200 shadow-sm border border-slate-200"
                                            >Todos</button>
                                            <button 
                                                type="button" 
                                                onClick={() => setSelectedMonths([])}
                                                className="text-[10px] w-[64px] py-1.5 bg-slate-50 rounded text-slate-500 hover:bg-slate-200 shadow-sm border border-slate-200"
                                            >Ninguno</button>
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* 4. Cliente (Pestañas ACTIVOS / PROSPECTOS + Dropdown) */}
                    <div className="flex flex-col gap-1 flex-1 min-w-[170px] bg-slate-50/80 border border-slate-200 rounded-lg p-1.5 shadow-2xs hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap">4. Cliente</Label>
                            <div className="flex items-center gap-0.5 bg-white p-0.5 rounded border border-slate-200 text-[8px] font-black shadow-2xs">
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('activos')}
                                    className={`px-1.5 py-0.2 rounded transition-colors ${clientTab === 'activos' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    ACTIVOS
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('prospectos')}
                                    className={`px-1.5 py-0.2 rounded transition-colors ${clientTab === 'prospectos' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    PROSP.
                                </button>
                            </div>
                        </div>
                        <Select value={client} onValueChange={(val) => setClient(val || '')}>
                            <SelectTrigger className="w-full h-7.5 bg-white border border-slate-200 shadow-2xs text-xs font-bold">
                                <SelectValue placeholder="Cliente">
                                    {client || undefined}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {currentClientList.map(c => (
                                    <SelectItem key={c} value={c}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${clientTab === 'activos' ? 'bg-sky-600' : 'bg-purple-600'}`}></div>{c}
                                        </div>
                                    </SelectItem>
                                ))}
                             </SelectContent>
                        </Select>
                    </div>

                    {client === 'SPOT' && (
                        <div className="flex flex-col gap-1 flex-1 min-w-[120px] bg-red-50/80 border border-red-200 rounded-lg p-1.5 shadow-2xs">
                            <Label className="text-[10px] font-extrabold text-red-600 uppercase tracking-tight whitespace-nowrap">Sufijo SPOT *</Label>
                            <Input 
                                type="text" 
                                value={spotSuffix} 
                                onChange={e => setSpotSuffix(e.target.value)}
                                placeholder="Ej: NEXA"
                                className="w-full h-7.5 border-red-300 bg-white uppercase text-xs font-bold"
                            />
                        </div>
                    )}

                    {/* 5. Ruta o Cotización */}
                    <div className="flex flex-col gap-1 flex-2 min-w-[180px] max-w-[280px] bg-slate-50/80 border border-slate-200 rounded-lg p-1.5 shadow-2xs hover:border-slate-300 transition-all">
                        <Label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap">5. Ruta / Quote</Label>
                        <Select value={route} onValueChange={(val) => setRoute(val || '')} disabled={!client}>
                            <SelectTrigger className="w-full h-7.5 bg-white border border-slate-200 shadow-2xs text-xs font-bold truncate">
                                <SelectValue placeholder="Ruta" className="truncate">
                                    {selectedRouteDisplay || undefined}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="w-auto min-w-[max-content] max-h-[300px] overflow-y-auto">
                                {clientRoutes.length === 0 ? (
                                    <SelectItem value="" disabled>No hay rutas para {client}</SelectItem>
                                ) : (
                                    clientRoutes.map(rObj => {
                                        const key = rObj.key;
                                        const label = rObj.label;
                                        const isQuote = rObj.isQuote;
                                        const color = label.includes('MATARANI') ? '#06B6D4' :
                                                      label.includes('MARCONA') ? '#A855F7' :
                                                      label.includes('MEJILLONES') ? '#D946EF' :
                                                      label.includes('CALLAO') ? '#F59E0B' : '#64748B';
                                        return (
                                            <SelectItem key={key} value={key}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
                                                    {isQuote ? `💬 ${label}` : label.replace('-', ' - ')}
                                                </div>
                                            </SelectItem>
                                        );
                                    })
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 6. Buque */}
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">6. Buque</Label>
                        <Select value={vessel} onValueChange={(val) => setVessel(val || '')} disabled={!route}>
                            <SelectTrigger className="w-full h-8 bg-white disabled:opacity-80">
                                <SelectValue placeholder="Buque">
                                    {vessel ? vessel.replace('_', ' ') : undefined}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MOQUEGUA">
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></div>MOQUEGUA</div>
                                </SelectItem>
                                <SelectItem value="TABLONES">
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></div>TABLONES</div>
                                </SelectItem>
                                <SelectItem value="CONCON_TRADER">
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#475569]"></div>CONCON TRADER</div>
                                </SelectItem>
                                <SelectItem value="HUEMUL">
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]"></div>HUEMUL</div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                </div>
                {/* FIN FILA 1 */}

                {/* ====================================================================================== */}
                {/* FILA 2: PARÁMETROS OPERATIVOS, BOTÓN AÑADIR, ESCENARIOS Y ACCIONES (Look & Feel Fiel) */}
                {/* ====================================================================================== */}
                <div className="flex flex-row items-center gap-3 w-full pt-1 border-t border-slate-100">
                    
                    {/* 7. Nº Viajes */}
                    <div className="flex items-center gap-1.5">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">7. Viajes:</Label>
                        <Input 
                            type="number" 
                            min="1"
                            value={frequency} 
                            onChange={e => setFrequency(e.target.value)}
                            placeholder="1"
                            title="Frecuencia Mensual de Viajes"
                            className="w-16 h-8 text-center text-xs"
                        />
                    </div>

                    {/* 8. Demurrage (%) */}
                    <div className="flex items-center gap-1.5">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">8. Demurrage (%):</Label>
                        <div className="flex gap-1 h-8">
                            <Input 
                                type="number" 
                                min="0"
                                value={demurragePct} 
                                onChange={e => onDemurragePctChange?.(e.target.value)}
                                placeholder="%"
                                className="w-14 h-8 text-xs text-center"
                            />
                            <button 
                                type="button"
                                onClick={() => onShowDemurrageChange?.(!showDemurrage)}
                                className={`px-2 text-[11px] font-semibold rounded transition-colors border ${showDemurrage ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                title="Mostrar Demurrage Porcentual en la Matriz Financiera"
                            >
                                Mostrar
                            </button>
                        </div>
                    </div>

                    {/* 9. Demurrage (días) */}
                    <div className="flex items-center gap-1.5">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">9. Demurrage (d):</Label>
                        <div className="flex gap-1 h-8">
                            <Input 
                                type="number" 
                                min="0"
                                value={demurrageDays} 
                                onChange={e => onDemurrageDaysChange?.(e.target.value)}
                                placeholder="días"
                                className="w-14 h-8 text-xs text-center"
                            />
                            <button 
                                type="button"
                                onClick={() => onShowDemurrageDaysChange?.(!showDemurrageDays)}
                                className={`px-2 text-[11px] font-semibold rounded transition-colors border ${showDemurrageDays ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                title="Mostrar Demurrage en Días (toma tarifa diaria de la quote/buque)"
                            >
                                Mostrar
                            </button>
                        </div>
                    </div>

                    {/* ➕ Botón Añadir al Modelo con Burbuja de Validación */}
                    <div className="relative group">
                        <Button 
                            onClick={handleAdd} 
                            className={`relative h-8 px-4 overflow-hidden transition-colors rounded-full ${isAdding ? 'bg-primary text-white pointer-events-none' : isFormValid ? 'bg-primary hover:bg-primary/90 text-white shadow-sm' : 'bg-slate-200 text-slate-400 cursor-not-allowed hover:bg-slate-200'}`}
                            disabled={isAdding || !isFormValid}
                        >
                            {isAdding && (
                                <div className="absolute inset-0 bg-white/20 animate-pulse" style={{ width: '100%' }}></div>
                            )}
                            <span className="relative flex items-center justify-center z-10 gap-1.5 text-[11px] font-bold">
                                {isAdding ? (
                                    <>
                                        <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="h-3.5 w-3.5" />
                                        <span>Añadir al Modelo</span>
                                    </>
                                )}
                            </span>
                        </Button>
                        {!isFormValid && (
                            <div className="absolute bottom-[115%] left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                                <div className="bg-slate-800 text-white text-[10px] font-medium py-1.5 px-3 rounded shadow-xl whitespace-nowrap border border-slate-700">
                                    <span className="text-amber-400 font-bold">⚠️ Falta completar: </span>
                                    {missingFields.join(' • ')}
                                </div>
                                <div className="w-2 h-2 bg-slate-800 rotate-45 -mt-1 border-r border-b border-slate-700"></div>
                            </div>
                        )}
                    </div>

                    {/* Indicador de Escenario */}
                    <div className="flex items-center gap-1.5 font-bold text-sky-800 bg-sky-50 border border-sky-200 px-3 h-8 rounded-full shadow-xs text-[11px] shrink-0">
                        📁 Escenario: {forecastName || 'Sin guardar'}
                    </div>

                    {/* Botón de Filtros */}
                    <div>
                        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 h-8 rounded-full text-[11px] font-bold shadow-xs transition-colors shrink-0">
                            <Filter size={13} /> Filtros de Tabla y Exportación
                        </button>
                    </div>
                    {showFilters && (
                        <div className="absolute top-[100%] left-0 w-full z-50 mt-1 shadow-2xl rounded-xl border border-slate-200 overflow-hidden bg-white">
                            <ForecastGridFilters />
                        </div>
                    )}

                    {/* Vista ($ / %) */}
                    {displayMode && onDisplayModeChange && (
                        <div className="flex items-center gap-1 bg-slate-200 rounded p-0.5 h-8 w-28 shadow-inner shrink-0">
                            <span className="text-[10px] uppercase font-bold text-slate-600 px-1.5">Vista:</span>
                            <button
                                onClick={() => onDisplayModeChange('usd')}
                                className={`flex-1 text-center py-1 text-[10px] font-bold rounded transition-colors ${displayMode === 'usd' ? 'bg-white shadow-xs text-petral-blue' : 'text-slate-500 hover:bg-slate-300'}`}
                            >
                                UND
                            </button>
                            <button
                                onClick={() => onDisplayModeChange('pct')}
                                className={`flex-1 text-center py-1 text-[10px] font-bold rounded transition-colors ${displayMode === 'pct' ? 'bg-white shadow-xs text-petral-blue' : 'text-slate-500 hover:bg-slate-300'}`}
                            >
                                %
                            </button>
                        </div>
                    )}

                    {/* Spacer para empujar Recalcular / Guardar / Cargar a la derecha */}
                    <div className="flex-1"></div>

                    {/* Guardar / Cargar / Recalcular (bottomRightContent) */}
                    <div className="shrink-0">
                        {bottomRightContent}
                    </div>

                </div>
                {/* FIN FILA 2 */}

            </CardContent>
        </Card>
    );
};
