import re
with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerUniversal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_inject = (
    'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";\n'
    'import { Label } from "../ui/label";\n'
    'import { Input } from "../ui/input";\n'
    'import { Play, Printer } from "lucide-react";\n'
)

split1 = content.split('export const VoyageLedgerUniversal')
part1 = split1[0].replace("import React, { useEffect, useState } from 'react';", "import React, { useEffect, useState } from 'react';\n" + import_inject)
part2 = split1[1]

top_section = """export const VoyageLedgerFinal: React.FC<{ portCostMode?: 'static' | 'matrix' }> = ({ portCostMode = 'static' }) => {
    const [localPortCostMode, setLocalPortCostMode] = useState<'static' | 'matrix'>(portCostMode);
    useEffect(() => { setLocalPortCostMode(portCostMode); }, [portCostMode]);

    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);
    
    // Data masters
    const [routes, setRoutes] = useState<any[]>([]);
    const [vessels, setVessels] = useState<any[]>([]);
    const [contracts, setContracts] = useState<any[]>([]);
    
    // Selections
    const [selectedRouteId, setSelectedRouteId] = useState<string>("");
    const [selectedVesselId, setSelectedVesselId] = useState<string>("");
    
    // Leg configuration
    const [legsConfig, setLegsConfig] = useState<any[]>([]);
    
    // Result
    const [runResult, setRunResult] = useState<any>(null);

    useEffect(() => {
        Promise.all([
            ForecastService.getSpotVoyages(),
            ForecastService.getVessels(),
            ForecastService.getContractsMaster()
        ]).then(([r, v, c]) => {
            setRoutes(r || []);
            setVessels((v || []).filter((x:any) => x.is_active));
            setContracts(c || []);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!selectedRouteId) {
            setLegsConfig([]);
            return;
        }
        const route = routes.find(r => r.route_id === selectedRouteId);
        if (!route || !route.legs_data || !route.legs_data.tramos) return;
        
        const tramos = route.legs_data.tramos;
        const config: any[] = [];
        for (let i = 0; i < tramos.length; i++) {
            const tr = tramos[i];
            config.push({
                idx: i,
                port_id: tr.origin_port_id,
                action: tr.origin_action || 'NONE',
                quantity: 0,
                freight_rate: 0
            });
            if (i === tramos.length - 1) {
                config.push({
                    idx: i + 1,
                    port_id: tr.destination_port_id,
                    action: tr.destination_action || 'NONE',
                    quantity: 0,
                    freight_rate: 0
                });
            }
        }
        setLegsConfig(config);
    }, [selectedRouteId, routes]);

    const handleQuantityChange = (idx: number, valStr: string) => {
        const val = parseFloat(valStr) || 0;
        const newConf = [...legsConfig];
        newConf[idx].quantity = val;
        
        if (newConf[idx].action === 'CARGAR') {
            const route = routes.find(r => r.route_id === selectedRouteId);
            if (route) {
                const client = (route.name || "").split('.')[0];
                const tr = route.legs_data.tramos.find((t:any) => t.origin_port_id === newConf[idx].port_id);
                if (tr) {
                    const dest = tr.destination_port_id;
                    const cMatch = contracts.find(c => c.client_id === client);
                    if (cMatch && cMatch.tariffs) {
                        const tMatch = cMatch.tariffs.find((t:any) => val >= t.min_tonnage && val <= t.max_tonnage && t.origin_port_id === tr.origin_port_id && t.destination_port_id === dest);
                        if (tMatch) {
                            newConf[idx].freight_rate = tMatch.freight_rate;
                        } else {
                            newConf[idx].freight_rate = 0;
                        }
                    }
                }
            }
        }
        setLegsConfig(newConf);
    };

    const handleCalculate = async () => {
        if (!selectedRouteId || !selectedVesselId) return;
        
        const totalCargas = legsConfig.filter(p => p.action === 'CARGAR').reduce((acc, p) => acc + (p.quantity || 0), 0);
        const totalDesc = legsConfig.filter(p => p.action === 'DESCARGAR').reduce((acc, p) => acc + (p.quantity || 0), 0);
        if (totalCargas === 0 || totalCargas !== totalDesc) {
            alert('Las toneladas de carga deben ser mayores a 0 y coincidir con las de descarga.');
            return;
        }
        
        const missingTariffs = legsConfig.filter(p => p.action === 'CARGAR' && (!p.freight_rate || p.freight_rate <= 0));
        if (missingTariffs.length > 0) {
            alert('Debe ingresar una tarifa mayor a 0 para todos los puertos de carga.');
            return;
        }

        const route = routes.find(r => r.route_id === selectedRouteId);
        const tramos = JSON.parse(JSON.stringify(route.legs_data.tramos));
        
        for (let i = 0; i < tramos.length; i++) {
            const conf = legsConfig.find(c => c.idx === i);
            if (conf && conf.action === 'CARGAR') {
                tramos[i].quantity = conf.quantity;
                tramos[i].freight_rate = conf.freight_rate;
            }
        }

        setSimulating(true);
        setRunResult(null);

        try {
            const payload = {
                vessel_id: selectedVesselId,
                tramos: tramos,
                port_cost_mode: localPortCostMode
            };
            const res = await ForecastService.calculateMultiCotizador(payload);
            let sim_key = Object.keys(res.aggregated_data?.['SPOT']?.['DYNAMIC']?.[selectedVesselId] || {})[0];
            setRunResult(res.aggregated_data?.['SPOT']?.['DYNAMIC']?.[selectedVesselId]?.[sim_key] || null);
        } catch (err) {
            console.error(err);
            alert('Error en el cálculo.');
        } finally {
            setSimulating(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-semibold animate-pulse">Cargando Auditoría Final...</div>;

"""

match = re.search(r'(const renderScenarioContent = \(.*?\);.*?)(?=\n    return \(\s*<>\s*<div className="flex)', part2, re.DOTALL)
if match:
    render_content = match.group(1)
else:
    splits = part2.split('\n    return (')
    if len(splits) >= 2:
        render_content = '\n    return ('.join(splits[:-1])
    else:
        print("COULD NOT FIND MAIN RETURN")
        exit(1)

return_block = """
    return (
        <div className="flex flex-col gap-4 p-4 bg-white border border-slate-200 rounded-md">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span className="text-2xl">⚖️</span> Auditoría Final
            </h2>

            <div className="flex gap-4 items-end flex-wrap">
                <div className="flex flex-col gap-2 w-72">
                    <Label className="text-xs font-semibold text-slate-600">Ruta</Label>
                    <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                        <SelectTrigger className="bg-white text-xs h-9">
                            <SelectValue placeholder="Seleccione una ruta" />
                        </SelectTrigger>
                        <SelectContent>
                            {routes.map(r => (
                                <SelectItem key={r.route_id} value={r.route_id}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="flex flex-col gap-2 w-48">
                    <Label className="text-xs font-semibold text-slate-600">Buque</Label>
                    <Select value={selectedVesselId} onValueChange={setSelectedVesselId}>
                        <SelectTrigger className="bg-white text-xs h-9">
                            <SelectValue placeholder="Seleccione un buque" />
                        </SelectTrigger>
                        <SelectContent>
                            {vessels.map(v => (
                                <SelectItem key={v.vessel_id} value={v.vessel_id}>{v.vessel_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2 w-48">
                    <Label className="text-xs font-semibold text-slate-600">Matriz Portuaria</Label>
                    <Select value={localPortCostMode} onValueChange={(val: any) => setLocalPortCostMode(val)}>
                        <SelectTrigger className="bg-white text-xs h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="static">Estática</SelectItem>
                            <SelectItem value="matrix">Dinámica</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <button 
                    onClick={handleCalculate}
                    disabled={!selectedRouteId || !selectedVesselId || simulating}
                    className="h-9 px-6 bg-teal-600 hover:bg-teal-700 text-white text-xs uppercase tracking-wider font-bold rounded flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    {simulating ? 'Calculando...' : <><Play size={14} /> Calcular</>}
                </button>
            </div>

            {legsConfig.length > 0 && (
                <div className="mt-4 border border-slate-200 rounded-md overflow-hidden bg-slate-50 p-4">
                    <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Itinerario y Carga</h3>
                    <table className="w-full text-sm text-left bg-white border border-slate-200 shadow-sm rounded">
                        <thead className="bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Puerto</th>
                                <th className="px-4 py-3 text-center">Acción</th>
                                <th className="px-4 py-3 text-right">Toneladas (MT)</th>
                                <th className="px-4 py-3 text-right">Tarifa (USD)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {legsConfig.map((conf, idx) => (
                                <tr key={idx} className={conf.action === 'NONE' ? 'bg-slate-50 opacity-60' : 'hover:bg-blue-50/30'}>
                                    <td className="px-4 py-3 font-bold text-slate-800 text-xs">{conf.port_id}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-black ${conf.action === 'CARGAR' ? 'bg-blue-100 text-blue-800' : conf.action === 'DESCARGAR' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                            {conf.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {conf.action !== 'NONE' ? (
                                            <Input 
                                                type="number" 
                                                className="w-32 h-8 text-right ml-auto text-xs font-bold bg-white"
                                                value={conf.quantity || ''}
                                                onChange={e => handleQuantityChange(idx, e.target.value)}
                                                placeholder="0.00"
                                            />
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {conf.action === 'CARGAR' ? (
                                            <Input 
                                                type="number" 
                                                className="w-24 h-8 text-right ml-auto text-xs font-bold bg-amber-50 border-amber-200 focus:border-amber-400 text-amber-900"
                                                value={conf.freight_rate || ''}
                                                onChange={e => {
                                                    const newConf = [...legsConfig];
                                                    newConf[idx].freight_rate = parseFloat(e.target.value) || 0;
                                                    setLegsConfig(newConf);
                                                }}
                                                placeholder="0.00"
                                            />
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {runResult && (
                <div className="mt-6 border-t-2 border-dashed border-slate-200 pt-6">
                    {renderScenarioContent(
                        selectedVesselId, 
                        legsConfig[0]?.port_id || '', 
                        legsConfig[legsConfig.length-1]?.port_id || '', 
                        runResult, 
                        { act_load: 0, act_disch: 0, port_days: 0, sea_days: 0, bunker_costs: 0, voyage_result: 0, total_duration: 0, tce_real: 0, pl_vs_req: 0 }, 
                        false
                    )}
                </div>
            )}
        </div>
    );
};
"""

with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'w', encoding='utf-8') as f:
    f.write(part1 + top_section + render_content + "\n" + return_block)
print("Done!")
