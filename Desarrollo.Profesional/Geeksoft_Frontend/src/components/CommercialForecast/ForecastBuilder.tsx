import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { MonthPicker } from '../ui/month-picker';
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
    const [monthIndex, setMonthIndex] = useState('');
    const [client, setClient] = useState('');
    const [route, setRoute] = useState('');
    const [vessel, setVessel] = useState('');
    const [quantity, setQuantity] = useState('');
    const [frequency, setFrequency] = useState('1');
    const [customTariff, setCustomTariff] = useState('');
    const [spotSuffix, setSpotSuffix] = useState('');
    
    // Dynamic Clients State
    const [availableClients, setAvailableClients] = useState<string[]>([]);

    useEffect(() => {
        import('../../services/api').then(({ ForecastService }) => {
            ForecastService.getClients().then(clients => {
                setAvailableClients(clients);
            }).catch(err => console.error("Failed to fetch clients:", err));
        });
    }, []);

    // Clear month if it falls outside the new horizon, otherwise leave it alone (or empty initially)
    useEffect(() => {
        if (monthIndex && !dynamicMonths.includes(monthIndex)) {
            setMonthIndex('');
        }
    }, [dynamicMonths]);

    // Maestro de Flota (Capacidad de Carga Normal/Comercial, no DWT nominal)
    const VESSEL_CAPACITY: Record<string, string> = {
        'TABLONES': '13500',
        'MOQUEGUA': '13500',
        'CONCON_TRADER': '19000',
        'HUEMUL': '22062', // DWT por defecto hasta que se especifique su carga normal
        'AMAZONAS': '20000' // Legacy/Mock fallback
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
        if (!client || !route || !vessel || !monthIndex || !quantity || !frequency) return;
        if (client === 'SPOT' && (!customTariff || !spotSuffix.trim())) return;

        const finalClient = client === 'SPOT' ? `SPOT-${spotSuffix.trim().toUpperCase()}` : client;

        onAddLine({
            month_index: monthIndex,
            client_id: finalClient,
            origin_port_id: route.split('-')[0],
            destination_port_id: route.split('-')[1], // Reverted hack since DB was updated
            vessel_id: vessel,
            quantity: parseInt(quantity),
            monthly_frequency: parseInt(frequency),
            custom_tariff: customTariff ? parseFloat(customTariff) : undefined
        });
    };

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-2 pt-2">
                <div className="flex items-center justify-between w-full">
                    {/* Left */}
                    <div className="flex-[1.2]">
                        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                            <img src="/Logo.Geeksoft.png" alt="Geeksoft" className="h-20 object-contain" />
                            Commercial Forecast Builder {forecastName && <span className="text-petral-teal ml-1">[{forecastName}]</span>}
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
            </CardHeader>
            {!hideInputs && (
            <CardContent className="pt-6">
                
                {/* Contenedor Flex en una sola línea sin wrap, con scroll horizontal si es muy pequeña la pantalla */}
                <div className="flex flex-row items-end gap-3 w-full overflow-x-auto pb-2">
                    
                    {/* 1. Inicio */}
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">1. Inicio Forecast</Label>
                        <MonthPicker 
                            value={currentStartDate.slice(0, 7)}
                            onChange={(val) => onHorizonChange(`${val || ''}-01`, currentEndDate)}
                            placeholder="Inicio"
                            className="border-slate-200 shadow-sm"
                        />
                    </div>

                    {/* 2. Fin */}
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Fin Forecast</Label>
                        <MonthPicker 
                            value={currentEndDate.slice(0, 7)}
                            onChange={(val) => {
                                if (!val) return;
                                const year = parseInt(val.split('-')[0]);
                                const month = parseInt(val.split('-')[1]);
                                const lastDay = new Date(year, month, 0).getDate();
                                onHorizonChange(currentStartDate, `${val}-${lastDay}`);
                            }}
                            placeholder="Fin"
                            className="border-slate-200 shadow-sm"
                        />
                    </div>

                    {/* 3. Mes */}
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">2. Mes a Modelar</Label>
                        <MonthPicker 
                            value={monthIndex}
                            onChange={(val) => setMonthIndex(val || '')}
                            minDate={currentStartDate.slice(0, 7)}
                            maxDate={currentEndDate.slice(0, 7)}
                            placeholder="Mes"
                            className="border-petral-teal border-2 shadow-sm"
                        />
                    </div>

                    {/* 4. Cliente */}
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">3. Cliente</Label>
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
                        <div className="flex flex-col gap-2 min-w-[120px] flex-1">
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
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">4. Ruta</Label>
                        <Select value={route} onValueChange={(val) => setRoute(val || '')} disabled={!client}>
                            <SelectTrigger className="w-full h-8">
                                <SelectValue placeholder="Ruta" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ILO-MATARANI">
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]"></div>ILO - MATARANI</div>
                                </SelectItem>
                                <SelectItem value="ILO-MARCONA">
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#A855F7]"></div>ILO - MARCONA</div>
                                </SelectItem>
                                <SelectItem value="ILO-MEJILLONES">
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#D946EF]"></div>ILO - MEJILLONES</div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 5. Buque */}
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">5. Buque</Label>
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
                                <SelectItem value="AMAZONAS">
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]"></div>AMAZONAS</div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 6. Viajes */}
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">6. N° Viajes</Label>
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
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">7. Toneladas por Viaje</Label>
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
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className={`text-xs font-semibold whitespace-nowrap ${client === 'SPOT' ? 'text-red-500' : 'text-slate-600'}`}>
                            8. Flete {client === 'SPOT' && '*'}
                        </Label>
                        <Input 
                            type="number" 
                            min="0"
                            step="0.01"
                            value={customTariff} 
                            onChange={e => setCustomTariff(e.target.value)}
                            placeholder={client === 'SPOT' ? "Obligatorio" : "Auto"}
                            title="Sobrescribir tarifa del contrato. Déjelo vacío para usar la tarifa maestra."
                            className={`w-full h-8 ${client === 'SPOT' ? 'border-red-300 bg-red-50' : ''}`}
                        />
                    </div>

                    {/* 9. Demurrage (%) */}
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">9. Demurrage (%)</Label>
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
                                className={`flex-1 text-xs font-semibold rounded transition-colors border ${showDemurrage ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                title="Mostrar Demurrage en la Matriz Financiera"
                            >
                                Mostrar
                            </button>
                        </div>
                    </div>

                    {/* 9. Botón Añadir */}
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className="text-xs opacity-0 pointer-events-none">X</Label>
                        <Button 
                            onClick={handleAdd} 
                            className={`relative w-full h-8 overflow-hidden transition-colors rounded-full ${isAdding ? 'bg-primary text-white pointer-events-none' : 'bg-primary hover:bg-primary/90 text-white'}`}
                            disabled={isAdding || !client || !route || !vessel || !monthIndex || !quantity || !frequency || (client === 'SPOT' && (!customTariff || !spotSuffix.trim()))}
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
                        <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                            <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Vista de Tabla</Label>
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
