import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { MonthPicker } from '../ui/month-picker';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { PlusCircle } from 'lucide-react';

interface ForecastBuilderProps {
    onHorizonChange: (start: string, end: string) => void;
    onAddLine: (line: any) => void;
    currentStartDate: string;
    currentEndDate: string;
    dynamicMonths: string[];
    centerContent?: React.ReactNode;
    rightContent?: React.ReactNode;
    bottomRightContent?: React.ReactNode;
    hideInputs?: boolean;
    displayMode?: 'usd' | 'pct';
    onDisplayModeChange?: (mode: 'usd' | 'pct') => void;
    forecastName?: string;
    isAdding?: boolean;
    demurragePct?: string;
    showDemurrage?: boolean;
    onDemurragePctChange?: (val: string) => void;
    onShowDemurrageChange?: (val: boolean) => void;
}

export const ForecastBuilder: React.FC<ForecastBuilderProps> = ({ 
    onHorizonChange, 
    onAddLine,
    currentStartDate,
    currentEndDate,
    dynamicMonths,
    centerContent,
    rightContent,
    bottomRightContent,
    hideInputs,
    displayMode,
    onDisplayModeChange,
    forecastName,
    isAdding = false,
    demurragePct = '',
    showDemurrage = false,
    onDemurragePctChange,
    onShowDemurrageChange
}) => {
    // Form State
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [client, setClient] = useState('');
    const [route, setRoute] = useState('');
    const [vessel, setVessel] = useState('');
    const [quantity, setQuantity] = useState('');
    const [frequency, setFrequency] = useState('1');
    const [customTariff, setCustomTariff] = useState('');
    const [spotSuffix, setSpotSuffix] = useState('');
    
    // Dynamic Clients State
    const [availableClients, setAvailableClients] = useState<string[]>([]);
    const [spotRoutes, setSpotRoutes] = useState<any[]>([]);

    const formatMonthPill = (yyyymm: string) => {
        const [y, m] = yyyymm.split('-');
        const date = new Date(parseInt(y), parseInt(m) - 1);
        const month = date.toLocaleString('es-ES', { month: 'short' }).replace('.', '');
        return `${month.charAt(0).toUpperCase() + month.slice(1)} ${y.slice(2)}`;
    };

    useEffect(() => {
        import('../../services/api').then(({ ForecastService }) => {
            ForecastService.getClients().then(clients => {
                const list = clients.includes('NEXA') ? clients : [...clients, 'NEXA'];
                setAvailableClients(list);
            }).catch(err => console.error("Failed to fetch clients:", err));

            ForecastService.listSpots().then(setSpotRoutes)
                .catch(err => console.error("Failed to fetch spot routes:", err));
        });
    }, []);

    // Limpiar la ruta seleccionada si cambia el cliente
    useEffect(() => {
        setRoute('');
    }, [client]);

    // Clear month if it falls outside the new horizon, otherwise leave it alone (or empty initially)
    useEffect(() => {
        setSelectedMonths(prev => prev.filter(m => dynamicMonths.includes(m)));
    }, [dynamicMonths]);

    // Maestro de Flota (Capacidad de Carga Normal/Comercial, no DWT nominal)
    const VESSEL_CAPACITY: Record<string, string> = {
        'TABLONES': '13500',
        'MOQUEGUA': '13500',
        'CONCON_TRADER': '19000',
        'HUEMUL': '22062' // DWT por defecto hasta que se especifique su carga normal
    };

    // Autocompletar la capacidad del buque (MT) cuando se selecciona uno
    useEffect(() => {
        if (vessel && VESSEL_CAPACITY[vessel]) {
            setQuantity(VESSEL_CAPACITY[vessel]);
        } else {
            setQuantity('');
        }
    }, [vessel]);

    useEffect(() => {
        if (client !== 'SPOT') {
            setSpotSuffix('');
        }
    }, [client]);

    const handleAdd = () => {
        if (!client || !route || !vessel || selectedMonths.length === 0 || !quantity || !frequency) return;
        if (client === 'SPOT' && (!customTariff || !spotSuffix.trim())) return;
        if (client === 'NEXA' && !customTariff) return;

        const finalClient = client === 'SPOT' ? `SPOT-${spotSuffix.trim().toUpperCase()}` : client;

        selectedMonths.forEach(mIdx => {
            onAddLine({
                month_index: mIdx,
                client_id: finalClient,
                origin_port_id: route.split('-')[0],
                destination_port_id: route.split('-')[1],
                vessel_id: vessel,
                quantity: parseInt(quantity),
                monthly_frequency: parseInt(frequency),
                custom_tariff: customTariff ? parseFloat(customTariff) : undefined
            });
        });
    };

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-2 pt-2 relative">
                <div className="flex items-center justify-between w-full">
                    {/* Left */}
                    <div className="flex-[1.2]">
                        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                            <img src="/Logo.Geeksoft.png" alt="Geeksoft" className="h-20 object-contain" />
                            Commercial Forecast Builder
                        </CardTitle>
                    </div>

                    {/* Center */}
                    {centerContent && (
                        <div className="flex-[1.5] flex justify-center">
                            {centerContent}
                        </div>
                    )}

                    {/* Right */}
                    <div className="flex-[1.2] flex justify-end">
                        {rightContent}
                    </div>
                </div>
                {forecastName && (
                    <div className="absolute bottom-[4px] left-1/2 transform -translate-x-1/2 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-3 py-0.5 rounded-full shadow-sm animate-fade-in z-20">
                        📁 Escenario: {forecastName}
                    </div>
                )}
            </CardHeader>
            {!hideInputs && (
            <CardContent className="py-1 px-6">
                
                {/* Contenedor Flex en una sola línea sin wrap, con scroll horizontal si es muy pequeña la pantalla */}
                <div className="flex flex-row items-center gap-2 w-full pb-0.5">
                    
                    {/* 1. Inicio */}
                    <div className="flex flex-col gap-2 flex-1 w-0 flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">1. Inicio forecast</Label>
                        <MonthPicker 
                            value={currentStartDate.slice(0, 7)}
                            onChange={(val) => {
                                const newStartVal = val || '';
                                const currentEndVal = currentEndDate.slice(0, 7);
                                // Si elige un inicio MAYOR al fin actual, empujamos el fin
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
                            className="border-slate-200 shadow-sm"
                        />
                    </div>

                    {/* 2. Fin */}
                    <div className="flex flex-col gap-2 flex-1 w-0 flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">2. Fin forecast</Label>
                        <MonthPicker 
                            value={currentEndDate.slice(0, 7)}
                            onChange={(val) => {
                                if (!val) return;
                                const currentStartVal = currentStartDate.slice(0, 7);
                                let finalStart = currentStartDate;
                                // Si elige un fin MENOR al inicio actual, retrocedemos el inicio
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
                            className="border-slate-200 shadow-sm"
                        />
                    </div>

                    {/* 3. Meses a Modelar */}
                    <div className="flex flex-col gap-2 flex-1 w-0 flex-1 relative">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">3. Meses a modelar</Label>
                        <Popover>
                            <PopoverTrigger
                                className="w-full flex items-center justify-between px-3 h-8 text-xs bg-white border-2 border-petral-teal shadow-sm rounded hover:border-[#0F2340] focus:outline-none transition-all text-slate-700"
                            >
                                <span className="truncate text-left w-full font-medium">
                                    {selectedMonths.length === 0 ? "Seleccionar..." : 
                                     selectedMonths.length === 1 ? selectedMonths[0] : 
                                     `${selectedMonths.length} meses`}
                                </span>
                                <span className="text-[10px] text-slate-500 shrink-0 ml-1">▼</span>
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

                    {/* 4. Cliente */}
                    <div className="flex flex-col gap-2 flex-1 w-0 flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">4. Cliente</Label>
                        <Select value={client} onValueChange={(val) => setClient(val || '')}>
                            <SelectTrigger className="w-full h-8 bg-white">
                                <SelectValue placeholder="Cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableClients.map(c => (
                                    <SelectItem key={c} value={c}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]"></div>{c}
                                        </div>
                                    </SelectItem>
                                ))}
                                {/* Default SPOT fallback */}
                                {!availableClients.includes('SPOT') && (
                                    <SelectItem value="SPOT">
                                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></div>SPOT</div>
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {client === 'SPOT' && (
                        <div className="flex flex-col gap-2 flex-1 w-0 flex-1">
                            <Label className="text-xs font-semibold text-red-500 whitespace-nowrap">Sufijo SPOT *</Label>
                            <Input 
                                type="text" 
                                value={spotSuffix} 
                                onChange={e => setSpotSuffix(e.target.value)}
                                placeholder="Ej: NEXA"
                                className="w-full h-8 border-red-300 bg-red-50 uppercase text-xs"
                            />
                        </div>
                    )}

                    {/* 4. Ruta */}
                    <div className="flex flex-col gap-2 flex-1 w-0 flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">5. Ruta</Label>
                        <Select value={route} onValueChange={(val) => setRoute(val || '')} disabled={!client}>
                            <SelectTrigger className="w-full h-8">
                                <SelectValue placeholder="Ruta" />
                            </SelectTrigger>
                            <SelectContent>
                                {client === 'NEXA' ? (
                                    spotRoutes.length === 0 ? (
                                        <SelectItem value="" disabled>No hay rutas spot guardadas</SelectItem>
                                    ) : (
                                        spotRoutes.map(s => (
                                            <SelectItem key={s.spot_id} value={`SPOT-${s.name}`}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]"></div>
                                                    {s.name || s.spot_id}
                                                    <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{background: s.pais === 'Chile' ? '#d1fae5' : '#dbeafe', color: s.pais === 'Chile' ? '#065f46' : '#1e40af'}}>
                                                        {s.pais === 'Chile' ? '🇨🇱 Chile' : '🇵🇪 Peru'}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )
                                ) : (
                                    <>
                                        <SelectItem value="ILO-MATARANI">
                                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]"></div>ILO - MATARANI</div>
                                        </SelectItem>
                                        <SelectItem value="ILO-MARCONA">
                                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#A855F7]"></div>ILO - MARCONA</div>
                                        </SelectItem>
                                        <SelectItem value="ILO-MEJILLONES">
                                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#D946EF]"></div>ILO - MEJILLONES</div>
                                        </SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 5. Buque */}
                    <div className="flex flex-col gap-2 flex-1 w-0 flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">6. Buque</Label>
                        <Select value={vessel} onValueChange={(val) => setVessel(val || '')} disabled={!route}>
                            <SelectTrigger className="w-full h-8">
                                <SelectValue placeholder="Buque" />
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

                    {/* 6. Viajes */}
                    <div className="flex flex-col gap-2 flex-1 w-0 flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">7. N° Viajes</Label>
                        <Input 
                            type="number" 
                            min="0"
                            value={frequency} 
                            onChange={e => setFrequency(e.target.value)}
                            placeholder="Freq"
                            title="Frecuencia Mensual"
                            className="w-full h-8"
                        />
                    </div>

                    {/* 7. Toneladas por Viaje */}
                    <div className="flex flex-col gap-2 flex-1 w-0 flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">8. TM/viaje</Label>
                        <Input 
                            type="number" 
                            min="0"
                            value={quantity} 
                            onChange={e => setQuantity(e.target.value)}
                            placeholder="TM"
                            title="Toneladas (Full Carga)"
                            className="w-full h-8"
                        />
                    </div>

                    {/* 8. Flete Override */}
                    <div className="flex flex-col gap-2 flex-1 w-0 flex-1">
                        <Label className={`text-xs font-semibold whitespace-nowrap ${(client === 'SPOT' || client === 'NEXA') ? 'text-red-500' : 'text-slate-600'}`}>
                            9. Flete {(client === 'SPOT' || client === 'NEXA') && '*'}
                        </Label>
                        <Input 
                            type="number" 
                            min="0"
                            step="0.01"
                            value={customTariff} 
                            onChange={e => setCustomTariff(e.target.value)}
                            placeholder={(client === 'SPOT' || client === 'NEXA') ? "Obligatorio" : "Auto"}
                            title="Sobrescribir tarifa del contrato. Déjelo vacío para usar la tarifa maestra."
                            className={`w-full h-8 ${(client === 'SPOT' || client === 'NEXA') ? 'border-red-300 bg-red-50' : ''}`}
                        />
                    </div>

                    {/* 9. Demurrage (%) */}
                    <div className="flex flex-col gap-2 flex-1 w-0 flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">10. Demurrage (%)</Label>
                        <div className="flex gap-1 h-8">
                            <Input 
                                type="number" 
                                min="0"
                                value={demurragePct} 
                                onChange={e => onDemurragePctChange?.(e.target.value)}
                                placeholder="%"
                                className="w-16 h-8"
                            />
                            <button 
                                onClick={() => onShowDemurrageChange?.(!showDemurrage)}
                                className={`flex-1 text-[11px] font-semibold rounded transition-colors border ${showDemurrage ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                title="Mostrar Demurrage en la Matriz Financiera"
                            >
                                Mostrar
                            </button>
                        </div>
                    </div>

                    {/* 9. Botón Añadir */}
                    <div className="flex flex-col gap-2 flex-1 w-0 flex-1">
                        <Label className="text-xs opacity-0 pointer-events-none">X</Label>
                        <Button 
                            onClick={handleAdd} 
                            className={`relative w-full h-8 overflow-hidden transition-colors rounded-full ${isAdding ? 'bg-primary text-white pointer-events-none' : 'bg-primary hover:bg-primary/90 text-white'}`}
                            disabled={isAdding || !client || !route || !vessel || selectedMonths.length === 0 || !quantity || !frequency || (client === 'SPOT' && (!customTariff || !spotSuffix.trim())) || (client === 'NEXA' && !customTariff)}
                        >
                            {isAdding && (
                                <div className="absolute inset-0 bg-white/20 animate-pulse" style={{ width: '100%' }}></div>
                            )}
                            <span className="relative flex items-center justify-center z-10 w-full">
                                {isAdding ? (
                                    <>
                                        <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        <span>Añadir</span>
                                    </>
                                )}
                            </span>
                        </Button>
                    </div>
                    
                    {/* 10. Vista ($ / %) */}
                    {displayMode && onDisplayModeChange && (
                        <div className="flex flex-col gap-2 flex-1 w-0 flex-1">
                            <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Vista de tabla</Label>
                            <div className="flex bg-slate-200 rounded p-0.5 h-8 w-full shadow-inner">
                                <button
                                    onClick={() => onDisplayModeChange('usd')}
                                    className={`flex-1 text-center py-1 text-[10px] font-bold rounded transition-colors ${displayMode === 'usd' ? 'bg-white shadow-sm text-petral-blue' : 'text-slate-500 hover:bg-slate-300'}`}
                                >
                                    UND
                                </button>
                                <button
                                    onClick={() => onDisplayModeChange('pct')}
                                    className={`flex-1 text-center py-1 text-[10px] font-bold rounded transition-colors ${displayMode === 'pct' ? 'bg-white shadow-sm text-petral-blue' : 'text-slate-500 hover:bg-slate-300'}`}
                                >
                                    %
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 11. Guardar / Cargar (bottomRightContent) */}
                    {bottomRightContent}

                </div>
            </CardContent>
            )}
        </Card>
    );
};
