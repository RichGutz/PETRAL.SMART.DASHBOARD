import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { PlusCircle, CalendarDays } from 'lucide-react';

interface ForecastBuilderProps {
    onHorizonChange: (start: string, end: string) => void;
    onAddLine: (line: any) => void;
    currentStartDate: string;
    currentEndDate: string;
    dynamicMonths: string[];
    centerContent?: React.ReactNode;
    rightContent?: React.ReactNode;
    hideInputs?: boolean;
}

export const ForecastBuilder: React.FC<ForecastBuilderProps> = ({ 
    onHorizonChange, 
    onAddLine,
    currentStartDate,
    currentEndDate,
    dynamicMonths,
    centerContent,
    rightContent,
    hideInputs
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

    const formatMonth = (m: string) => {
        if (!m) return '';
        const date = new Date(`${m}-02`); // Avoid timezone issues
        const formatted = new Intl.DateTimeFormat('es-ES', { month: 'long', year: '2-digit' }).format(date);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace(' de ', ' ');
    };

    const generateHorizonOptions = () => {
        const options = [];
        const d = new Date();
        for (let i = -6; i < 24; i++) {
            const date = new Date(d.getFullYear(), d.getMonth() + i, 1);
            const mStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            options.push(mStr);
        }
        return options;
    };
    const horizonOptions = generateHorizonOptions();

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3 pt-3">
                <div className="flex items-center justify-between w-full">
                    {/* Left */}
                    <div className="flex-[1.2]">
                        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-petral-teal" />
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
                    {rightContent && (
                        <div className="flex-1 flex justify-end">
                            {rightContent}
                        </div>
                    )}
                </div>
            </CardHeader>
            {!hideInputs && (
            <CardContent className="pt-6">
                
                {/* Contenedor Flex en una sola línea sin wrap, con scroll horizontal si es muy pequeña la pantalla */}
                <div className="flex flex-row items-end gap-3 w-full overflow-x-auto pb-2">
                    
                    {/* 1. Inicio */}
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">1. Inicio Forecast</Label>
                        <Select value={currentStartDate.slice(0, 7)} onValueChange={(val) => onHorizonChange(`${val || ''}-01`, currentEndDate)}>
                            <SelectTrigger className="w-full h-8 bg-white">
                                <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent>
                                {horizonOptions.map(m => (
                                    <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 2. Fin */}
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Fin Forecast</Label>
                        <Select value={currentEndDate.slice(0, 7)} onValueChange={(val) => {
                                if (!val) return;
                                const year = parseInt(val.split('-')[0]);
                                const month = parseInt(val.split('-')[1]);
                                const lastDay = new Date(year, month, 0).getDate();
                                onHorizonChange(currentStartDate, `${val}-${lastDay}`);
                            }}>
                            <SelectTrigger className="w-full h-8 bg-white">
                                <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent>
                                {horizonOptions.map(m => (
                                    <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 3. Mes */}
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">2. Mes a Modelar</Label>
                        <Select value={monthIndex} onValueChange={(val) => setMonthIndex(val || '')}>
                            <SelectTrigger className="w-full h-8 bg-white border-petral-teal border-2">
                                <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent>
                                {dynamicMonths.map(m => (
                                    <SelectItem key={m} value={m}>
                                        {formatMonth(m)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 4. Cliente */}
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">3. Cliente</Label>
                        <Select value={client} onValueChange={(val) => setClient(val || '')}>
                            <SelectTrigger className="w-full h-8 bg-white">
                                <SelectValue placeholder="Cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SPCC">SPCC</SelectItem>
                                <SelectItem value="MINSUR">MINSUR</SelectItem>
                                <SelectItem value="CHINALCO">CHINALCO</SelectItem>
                                <SelectItem value="SPOT">SPOT</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {client === 'SPOT' && (
                        <div className="flex flex-col gap-2 min-w-[100px]">
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

                    {/* 5. Ruta */}
                    <div className="flex flex-col gap-2 min-w-[160px] flex-[1.5]">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">4. Ruta</Label>
                        <Select value={route} onValueChange={(val) => setRoute(val || '')} disabled={!client}>
                            <SelectTrigger className="w-full h-8">
                                <SelectValue placeholder="Ruta" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ILO-MATARANI">ILO - MATARANI</SelectItem>
                                <SelectItem value="ILO-MARCONA">ILO - MARCONA</SelectItem>
                                <SelectItem value="ILO-MEJILLONES">ILO - MEJILLONES</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 6. Buque */}
                    <div className="flex flex-col gap-2 min-w-[140px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">5. Buque</Label>
                        <Select value={vessel} onValueChange={(val) => setVessel(val || '')} disabled={!route}>
                            <SelectTrigger className="w-full h-8">
                                <SelectValue placeholder="Buque" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MOQUEGUA">MOQUEGUA</SelectItem>
                                <SelectItem value="TABLONES">TABLONES</SelectItem>
                                <SelectItem value="CONCON_TRADER">CONCON TRADER</SelectItem>
                                <SelectItem value="HUEMUL">HUEMUL</SelectItem>
                                <SelectItem value="AMAZONAS">AMAZONAS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 7. Viajes */}
                    <div className="flex flex-col gap-2 min-w-[160px] flex-[1.5]">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">6. Viajes (MT)</Label>
                        <div className="flex gap-2 h-8">
                            <Input 
                                type="number" 
                                min="0"
                                value={frequency} 
                                onChange={e => setFrequency(e.target.value)}
                                placeholder="Freq"
                                title="Frecuencia Mensual"
                                className="w-16 h-8"
                            />
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
                    </div>

                    {/* 7.5 Flete Override */}
                    <div className="flex flex-col gap-2 min-w-[100px] flex-1">
                        <Label className={`text-xs font-semibold whitespace-nowrap ${client === 'SPOT' ? 'text-red-500' : 'text-slate-600'}`}>
                            7. Flete (USD/MT) {client === 'SPOT' && '*'}
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

                    {/* 8. Botón */}
                    <div className="flex flex-col gap-2 min-w-[100px] flex-1">
                        {/* Empty label to force exact same height alignment */}
                        <Label className="text-xs opacity-0 pointer-events-none">X</Label>
                        <Button 
                            onClick={handleAdd} 
                            className="bg-petral-blue hover:bg-slate-800 text-white w-full h-8"
                            disabled={!client || !route || !vessel || !monthIndex || !quantity || !frequency || (client === 'SPOT' && (!customTariff || !spotSuffix.trim()))}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir
                        </Button>
                    </div>

                </div>
            </CardContent>
            )}
        </Card>
    );
};
