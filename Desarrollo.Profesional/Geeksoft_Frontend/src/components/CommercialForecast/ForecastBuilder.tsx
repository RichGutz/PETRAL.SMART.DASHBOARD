import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
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
}

export const ForecastBuilder: React.FC<ForecastBuilderProps> = ({ 
    onHorizonChange, 
    onAddLine,
    currentStartDate,
    currentEndDate,
    dynamicMonths
}) => {
    // Form State
    const [monthIndex, setMonthIndex] = useState('');
    const [client, setClient] = useState('');
    const [route, setRoute] = useState('');
    const [vessel, setVessel] = useState('');
    const [quantity, setQuantity] = useState('');
    const [frequency, setFrequency] = useState('1');

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

    const handleAdd = () => {
        if (!client || !route || !vessel || !monthIndex || !quantity || !frequency) return;

        onAddLine({
            month_index: monthIndex,
            client_id: client,
            origin_port_id: route.split('-')[0],
            destination_port_id: route.split('-')[1],
            vessel_id: vessel,
            quantity: parseInt(quantity),
            monthly_frequency: parseInt(frequency)
        });
    };

    const formatMonth = (m: string) => {
        if (!m) return '';
        const date = new Date(`${m}-02`); // Avoid timezone issues
        return new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' }).format(date).replace('.', '');
    };

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-petral-teal" />
                            Constructor de Proyección (Builder)
                        </CardTitle>
                        <CardDescription className="text-slate-500 mt-1">
                            Paso 1: Define el horizonte. Luego añade viajes mes a mes.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                
                {/* Contenedor Flex en una sola línea sin wrap, con scroll horizontal si es muy pequeña la pantalla */}
                <div className="flex flex-row items-end gap-3 w-full overflow-x-auto pb-2">
                    
                    {/* 1. Inicio */}
                    <div className="flex flex-col gap-2 min-w-[140px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">1. Inicio Forecast</Label>
                        <Input 
                            type="month" 
                            value={currentStartDate.slice(0, 7)}
                            onChange={(e) => onHorizonChange(`${e.target.value}-01`, currentEndDate)}
                            className="w-full h-10"
                        />
                    </div>

                    {/* 2. Fin */}
                    <div className="flex flex-col gap-2 min-w-[140px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Fin Forecast</Label>
                        <Input 
                            type="month" 
                            value={currentEndDate.slice(0, 7)}
                            onChange={(e) => {
                                const val = e.target.value;
                                const year = parseInt(val.split('-')[0]);
                                const month = parseInt(val.split('-')[1]);
                                const lastDay = new Date(year, month, 0).getDate();
                                onHorizonChange(currentStartDate, `${val}-${lastDay}`);
                            }}
                            className="w-full h-10"
                        />
                    </div>

                    {/* 3. Mes */}
                    <div className="flex flex-col gap-2 min-w-[120px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">2. Mes a Modelar</Label>
                        <Select value={monthIndex} onValueChange={(val) => setMonthIndex(val || '')}>
                            <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent>
                                {dynamicMonths.map(m => (
                                    <SelectItem key={m} value={m} className="capitalize">
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
                            <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SPCC">SPCC</SelectItem>
                                <SelectItem value="MINSUR">MINSUR</SelectItem>
                                <SelectItem value="CHINALCO">CHINALCO</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 5. Ruta */}
                    <div className="flex flex-col gap-2 min-w-[160px] flex-[1.5]">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">4. Ruta</Label>
                        <Select value={route} onValueChange={(val) => setRoute(val || '')} disabled={!client}>
                            <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Ruta" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ILO-MATARANI">ILO - MATARANI</SelectItem>
                                <SelectItem value="ILO-SAN_JUAN_DE_MARCONA">ILO - MARCONA</SelectItem>
                                <SelectItem value="ILO-MEJILLONES">ILO - MEJILLONES</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 6. Buque */}
                    <div className="flex flex-col gap-2 min-w-[140px] flex-1">
                        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">5. Buque</Label>
                        <Select value={vessel} onValueChange={(val) => setVessel(val || '')} disabled={!route}>
                            <SelectTrigger className="w-full h-10">
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
                        <div className="flex gap-2">
                            <Input 
                                type="number" 
                                value={frequency} 
                                onChange={e => setFrequency(e.target.value)}
                                placeholder="Freq"
                                title="Frecuencia Mensual"
                                className="w-16 h-10"
                            />
                            <Input 
                                type="number" 
                                value={quantity} 
                                onChange={e => setQuantity(e.target.value)}
                                placeholder="TM"
                                title="Toneladas (Full Carga)"
                                className="w-full h-10"
                            />
                        </div>
                    </div>

                    {/* 8. Botón */}
                    <div className="flex flex-col gap-2 min-w-[100px] flex-1">
                        {/* Empty label to force exact same height alignment */}
                        <Label className="text-xs opacity-0 pointer-events-none">X</Label>
                        <Button 
                            onClick={handleAdd} 
                            className="bg-petral-blue hover:bg-slate-800 text-white w-full h-10"
                            disabled={!client || !route || !vessel || !monthIndex || !quantity || !frequency}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir
                        </Button>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
};
