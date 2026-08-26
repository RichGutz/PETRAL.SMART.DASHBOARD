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
    matrixFormat?: 'PETRAL' | 'NAVITRANSO';
    onMatrixFormatChange?: (format: 'PETRAL' | 'NAVITRANSO') => void;
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
    matrixFormat = 'PETRAL',
    onMatrixFormatChange,
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
    const [routeSource, setRouteSource] = useState<'CIERRES' | 'COTIZACIONES' | 'PRESUPUESTOS'>('CIERRES');
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

    // Resetear ruta al cambiar de cliente o de fuente para evitar colisiones
    useEffect(() => {
        setRoute('');
    }, [client, routeSource]);

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

    // Filtrar las rutas disponibles por la LLAVE COMPUESTA CLIENTE + FUENTE
    const clientRoutes = useMemo(() => {
        if (!client) return [];
        const cleanClient = client.trim().toUpperCase();
        const routesList: Array<{ key: string; label: string; isQuote?: boolean; category?: string }> = [];
        const addedKeys = new Set<string>();

        // Carga Dinámica desde routes_quotes filtrando por CLIENTE + FUENTE
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

            const isClientMatch = (qClient === cleanClient || name.startsWith(`${cleanClient}.`) || name.startsWith(`${cleanClient}_`));
            if (!isClientMatch) return;

            // Clasificación por Fuente (CIERRES vs COTIZACIONES vs PRESUPUESTOS)
            const desc = (s.description || '').toUpperCase();
            const cat = (s.legs_data?.category || '').toUpperCase();
            const isBudget = desc.includes('PRESUPUESTO') || cat === 'PRESUPUESTO' || s.legs_data?.is_budget === true;
            const isCoa = desc.includes('COA') || cat === 'COA' || s.is_contract === true;
            const isSpot = (!isBudget && !isCoa) || desc.includes('COTIZACI') || cat === 'SPOT';

            let isSourceMatch = false;
            if (routeSource === 'PRESUPUESTOS') {
                isSourceMatch = isBudget;
            } else if (routeSource === 'CIERRES') {
                isSourceMatch = isCoa;
            } else if (routeSource === 'COTIZACIONES') {
                isSourceMatch = isSpot && !isBudget;
            }

            if (!isSourceMatch) return;

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
                    isQuote: true,
                    category: routeSource
                });
            }
        });

        return routesList;
    }, [client, routeSource, spotRoutes]);


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

            // 2. Clientes Prospectos
            ForecastService.getClients().then(clientsList => {
                const prospects = (clientsList || [])
                    .filter((c: any) => c.is_prospect === true)
                    .map((c: any) => c.client_id?.toUpperCase())
                    .filter(Boolean);
                const uniqueProspects = Array.from(new Set(prospects)) as string[];
                uniqueProspects.sort();
                setProspectClients(uniqueProspects);
            }).catch(err => console.error("Failed to fetch prospect clients:", err));

            // 3. Rutas Spot / Quotes / Multicotizador
            ForecastService.getSpotVoyages().then(spots => {
                setSpotRoutes(spots || []);
            }).catch(err => console.error("Failed to fetch spot routes:", err));
        });
    }, []);

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
        if (!route) missing.push(`5. Ruta (${routeSource})`);
        if (!vessel) missing.push("6. Buque");
        if (!frequency || parseInt(frequency) <= 0) missing.push("7. N° Viajes");
        if (client === 'SPOT' && !spotSuffix.trim()) missing.push("Sufijo SPOT");
        if (client === 'SPOT' && !customTariff) missing.push("Flete SPOT");
        return missing;
    }, [selectedMonths, client, route, routeSource, vessel, frequency, spotSuffix, customTariff]);

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
        const prefix = routeSource === 'PRESUPUESTOS' ? '📊 ' : routeSource === 'CIERRES' ? '📜 ' : '💬 ';
        return `${prefix}${selectedRouteObj.label}`;
    }, [selectedRouteObj, routeSource]);

    // SERIE 33: Guarda DESPUÉS de todos los hooks (Fix React Error #300)
    if (hideInputs) {
        return null;
    }

    return (
        <Card className="glass-card bg-white border border-slate-200 shadow-xs relative overflow-visible rounded-xl">
            <CardContent className="py-2.5 px-4 flex flex-col gap-3">
                
                {/* ========================================================================= */}
                {/* FILA 1: HORIZONTE, CLIENTE, FUENTE, RUTA Y BUQUE */}
                {/* ========================================================================= */}
                <div className="flex flex-row items-center gap-2.5 w-full overflow-x-auto pb-1 scrollbar-none shrink-0">
                    
                    {/* 1. Inicio forecast (+20% ancho: w-[138px]) */}
                    <div className="flex flex-col gap-1 w-[138px] shrink-0 bg-slate-50/80 border border-slate-200 rounded-lg p-1.5 shadow-2xs hover:border-slate-300 transition-all">
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

                    {/* 2. Fin forecast (+20% ancho: w-[138px]) */}
                    <div className="flex flex-col gap-1 w-[138px] shrink-0 bg-slate-50/80 border border-slate-200 rounded-lg p-1.5 shadow-2xs hover:border-slate-300 transition-all">
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

                    {/* 3. Meses a modelar (Crecido +30% adicional: w-[265px]) */}
                    <div className="flex flex-col gap-1 w-[265px] shrink-0 relative bg-slate-50/80 border border-slate-200 rounded-lg p-1.5 shadow-2xs hover:border-slate-300 transition-all">
                        <Label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap">3. Meses a modelar</Label>
                        <Popover>
                            <PopoverTrigger
                                className="w-full flex items-center justify-between px-2.5 h-7.5 text-xs bg-white border border-sky-300 shadow-2xs rounded-md hover:border-sky-500 focus:outline-none transition-all text-sky-900 font-extrabold"
                            >
                                <span className="truncate text-left w-full">
                                    {selectedMonths.length === 0 ? "Seleccionar..." : 
                                     selectedMonths.length === dynamicMonths.length ? `Todos (${dynamicMonths.length})` :
                                     selectedMonths.length === 1 ? formatMonthPill(selectedMonths[0]) : 
                                     `${selectedMonths.length} meses`}
                                </span>
                                <span className="text-[10px] text-sky-600 shrink-0 ml-1">▼</span>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px] p-4" side="bottom" align="start">
                                <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400 mb-3 border-b pb-1.5 flex justify-between items-center">
                                    <span>Horizonte ({dynamicMonths.length} meses)</span>
                                    <span className="text-[10px] text-slate-500 font-mono font-bold">{selectedMonths.length} marcados</span>
                                </div>
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
                                                    className={`px-1.5 py-1.5 rounded-full text-[10px] font-bold transition-all border outline-none truncate cursor-pointer ${
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
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSelectedMonths([...dynamicMonths]);
                                                }}
                                                className="text-[10px] w-[64px] py-1.5 bg-blue-600 rounded text-white font-black hover:bg-blue-700 shadow-sm cursor-pointer transition-colors"
                                            >Todos</button>
                                            <button 
                                                type="button" 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSelectedMonths([]);
                                                }}
                                                className="text-[10px] w-[64px] py-1.5 bg-slate-100 rounded text-slate-600 font-bold hover:bg-slate-200 shadow-sm border border-slate-200 cursor-pointer"
                                            >Ninguno</button>
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* 4. Cliente (Ancho 175px para albergar con holgura título + ACT./PROSP. + nombres largos) */}
                    <div className="flex flex-col gap-1 w-[175px] shrink-0 bg-slate-50/80 border border-slate-200 rounded-lg p-1.5 shadow-2xs hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap">4. Cliente</Label>
                            <div className="flex items-center gap-0.5 bg-white p-0.5 rounded border border-slate-200 text-[8px] font-black shadow-2xs">
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('activos')}
                                    className={`px-1.5 py-0.2 rounded transition-colors ${clientTab === 'activos' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    ACT.
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
                            <SelectTrigger className="w-full h-7.5 bg-white border border-slate-200 shadow-2xs text-xs font-bold px-2">
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

                    {/* FUENTE: CIERRES | COTIZACIONES | PRESUPUESTOS (Ancho 175px para que PRESUPUESTOS entre completo) */}
                    <div className="flex flex-col gap-1 w-[175px] shrink-0 bg-slate-50/80 border border-slate-200 rounded-lg p-1.5 shadow-2xs hover:border-slate-300 transition-all">
                        <Label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap">FUENTE</Label>
                        <Select value={routeSource} onValueChange={(val: any) => setRouteSource(val)}>
                            <SelectTrigger className="w-full h-7.5 bg-white border border-slate-200 shadow-2xs text-xs font-bold px-2">
                                <SelectValue placeholder="Fuente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CIERRES">
                                    <div className="flex items-center gap-1.5 font-bold text-blue-700 text-xs">
                                        <span>📜</span> CIERRES
                                    </div>
                                </SelectItem>
                                <SelectItem value="COTIZACIONES">
                                    <div className="flex items-center gap-1.5 font-bold text-purple-700 text-xs">
                                        <span>📄</span> COTIZACIONES
                                    </div>
                                </SelectItem>
                                <SelectItem value="PRESUPUESTOS">
                                    <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-xs">
                                        <span>📊</span> PRESUPUESTOS
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {client === 'SPOT' && (
                        <div className="flex flex-col gap-1 w-[120px] shrink-0 bg-red-50/80 border border-red-200 rounded-lg p-1.5 shadow-2xs">
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

                    {/* 5. Ruta (Expansión flexible en el espacio central) */}
                    <div className="flex flex-col gap-1 flex-1 min-w-[200px] bg-slate-50/80 border border-slate-200 rounded-lg p-1.5 shadow-2xs hover:border-slate-300 transition-all overflow-hidden">
                        <Label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap">
                            5. Ruta
                        </Label>
                        <Select value={route} onValueChange={(val) => setRoute(val || '')} disabled={!client}>
                            <SelectTrigger className="w-full h-7.5 bg-white border border-slate-200 shadow-2xs text-xs font-bold overflow-hidden">
                                <SelectValue placeholder="Seleccionar ruta..." className="block truncate max-w-full">
                                    {selectedRouteDisplay || undefined}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="w-auto min-w-[max-content] max-h-[300px] overflow-y-auto">
                                {clientRoutes.length === 0 ? (
                                    <SelectItem value="" disabled>
                                        No hay {routeSource.toLowerCase()} para {client}
                                    </SelectItem>
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
                                                    {routeSource === 'PRESUPUESTOS' ? `📊 ${label}` : routeSource === 'CIERRES' ? `📜 ${label}` : `💬 ${label}`}
                                                </div>
                                            </SelectItem>
                                        );
                                    })
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 6. Buque (Ancho 175px para que CONCON TRADER y dot de color entren completos) */}
                    <div className="flex flex-col gap-1 w-[175px] shrink-0 bg-slate-50/80 border border-slate-200 rounded-lg p-1.5 shadow-2xs hover:border-slate-300 transition-all">
                        <Label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap">6. Buque</Label>
                        <Select value={vessel} onValueChange={(val) => setVessel(val || '')} disabled={!route}>
                            <SelectTrigger className="w-full h-7.5 bg-white border border-slate-200 shadow-2xs text-xs font-bold disabled:opacity-80 px-2">
                                <SelectValue placeholder="Buque">
                                    {vessel ? vessel.replace('_', ' ') : undefined}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MOQUEGUA">
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>MOQUEGUA</div>
                                </SelectItem>
                                <SelectItem value="TABLONES">
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-600"></div>TABLONES</div>
                                </SelectItem>
                                <SelectItem value="CONCON_TRADER">
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>CONCON TRADER</div>
                                </SelectItem>
                                <SelectItem value="HUEMUL">
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>HUEMUL</div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                </div>
                {/* FIN FILA 1 */}

                {/* ====================================================================================== */}
                {/* FILA 2: PARÁMETROS OPERATIVOS, BOTÓN AÑADIR, ESCENARIOS Y ACCIONES (APEFAC ENTERPRISE) */}
                {/* ====================================================================================== */}
                <div className="flex flex-row items-center gap-2.5 w-full pt-2 border-t border-slate-200/80 overflow-x-auto">
                    
                    {/* 7. Nº Viajes */}
                    <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200 rounded-lg p-1.5 shadow-2xs shrink-0">
                        <Label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap">7. Viajes:</Label>
                        <Input 
                            type="number" 
                            min="1"
                            value={frequency} 
                            onChange={e => setFrequency(e.target.value)}
                            placeholder="1"
                            title="Frecuencia Mensual de Viajes"
                            className="w-14 h-7 text-center text-xs font-bold bg-white border-slate-200 shadow-2xs"
                        />
                    </div>

                    {/* 8. Demurrage (%) */}
                    <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200 rounded-lg p-1.5 shadow-2xs shrink-0">
                        <Label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap">8. Demurrage (%):</Label>
                        <div className="flex gap-1 h-7">
                            <Input 
                                type="number" 
                                min="0"
                                value={demurragePct} 
                                onChange={e => onDemurragePctChange?.(e.target.value)}
                                placeholder="%"
                                className="w-14 h-7 text-xs text-center font-bold bg-white border-slate-200 shadow-2xs"
                            />
                            <button 
                                type="button"
                                onClick={() => onShowDemurrageChange?.(!showDemurrage)}
                                className={`px-2 text-[10px] font-black rounded-md transition-colors border ${showDemurrage ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                title="Mostrar Demurrage Porcentual en la Matriz Financiera"
                            >
                                Mostrar
                            </button>
                        </div>
                    </div>

                    {/* 9. Demurrage (días) */}
                    <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200 rounded-lg p-1.5 shadow-2xs shrink-0">
                        <Label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap">9. Demurrage (d):</Label>
                        <div className="flex gap-1 h-7">
                            <Input 
                                type="number" 
                                min="0"
                                value={demurrageDays} 
                                onChange={e => onDemurrageDaysChange?.(e.target.value)}
                                placeholder="días"
                                className="w-14 h-7 text-xs text-center font-bold bg-white border-slate-200 shadow-2xs"
                            />
                            <button 
                                type="button"
                                onClick={() => onShowDemurrageDaysChange?.(!showDemurrageDays)}
                                className={`px-2 text-[10px] font-black rounded-md transition-colors border ${showDemurrageDays ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                title="Mostrar Demurrage en Días (toma tarifa diaria de la quote/buque)"
                            >
                                Mostrar
                            </button>
                        </div>
                    </div>

                    {/* ➕ Botón Añadir al Modelo con Burbuja de Validación */}
                    <div className="relative group shrink-0">
                        <Button 
                            onClick={handleAdd} 
                            className={`relative h-7.5 px-4 overflow-hidden transition-all rounded-lg shadow-2xs ${isAdding ? 'bg-sky-600 text-white pointer-events-none' : isFormValid ? 'bg-sky-600 hover:bg-sky-700 text-white font-extrabold' : 'bg-slate-200 text-slate-400 cursor-not-allowed hover:bg-slate-200'}`}
                            disabled={isAdding || !isFormValid}
                        >
                            {isAdding && (
                                <div className="absolute inset-0 bg-white/20 animate-pulse" style={{ width: '100%' }}></div>
                            )}
                            <span className="relative flex items-center justify-center z-10 gap-1.5 text-[11px] font-extrabold">
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
                    <div className="flex items-center gap-1.5 font-extrabold text-sky-800 bg-sky-50 border border-sky-200 px-3 h-7.5 rounded-lg shadow-2xs text-[11px] shrink-0">
                        📁 Escenario: {forecastName || 'Sin guardar'}
                    </div>

                    {/* Botón de Filtros */}
                    <div className="shrink-0">
                        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 h-7.5 rounded-lg text-[11px] font-extrabold shadow-2xs transition-colors">
                            <Filter size={13} className="text-sky-600" /> Filtros de Tabla y Exportación
                        </button>
                    </div>
                    {showFilters && (
                        <div className="absolute top-[100%] left-0 w-full z-50 mt-1 shadow-2xl rounded-xl border border-slate-200 overflow-hidden bg-white">
                            <ForecastGridFilters />
                        </div>
                    )}

                    {/* Vista ($ / %) */}
                    {displayMode && onDisplayModeChange && (
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 h-7.5 w-28 border border-slate-200 shadow-2xs shrink-0">
                            <span className="text-[9.5px] uppercase font-black text-slate-500 px-1">Vista:</span>
                            <button
                                type="button"
                                onClick={() => onDisplayModeChange('usd')}
                                className={`flex-1 text-center py-0.5 text-[9.5px] font-black rounded cursor-pointer transition-colors ${displayMode === 'usd' ? 'bg-white shadow-2xs text-sky-700 font-extrabold' : 'text-slate-500 hover:bg-slate-200'}`}
                            >
                                UND
                            </button>
                            <button
                                type="button"
                                onClick={() => onDisplayModeChange('pct')}
                                className={`flex-1 text-center py-0.5 text-[9.5px] font-black rounded cursor-pointer transition-colors ${displayMode === 'pct' ? 'bg-white shadow-2xs text-sky-700 font-extrabold' : 'text-slate-500 hover:bg-slate-200'}`}
                            >
                                %
                            </button>
                        </div>
                    )}

                    {/* Formato Matriz: PETRAL / NAVITRANSO */}
                    {onMatrixFormatChange && (
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 h-7.5 border border-slate-200 shadow-2xs shrink-0">
                            <span className="text-[9.5px] uppercase font-black text-slate-500 px-1">Formato:</span>
                            <button
                                type="button"
                                onClick={() => onMatrixFormatChange('PETRAL')}
                                className={`px-2 py-0.5 text-[9.5px] font-black rounded cursor-pointer transition-colors ${matrixFormat === 'PETRAL' ? 'bg-white shadow-2xs text-sky-800 font-black' : 'text-slate-500 hover:bg-slate-200'}`}
                            >
                                PETRAL
                            </button>
                            <button
                                type="button"
                                onClick={() => onMatrixFormatChange('NAVITRANSO')}
                                className={`px-2 py-0.5 text-[9.5px] font-black rounded cursor-pointer transition-colors ${matrixFormat === 'NAVITRANSO' ? 'bg-emerald-600 shadow-2xs text-white font-black' : 'text-slate-500 hover:bg-slate-200'}`}
                            >
                                NAVITRANSO
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
