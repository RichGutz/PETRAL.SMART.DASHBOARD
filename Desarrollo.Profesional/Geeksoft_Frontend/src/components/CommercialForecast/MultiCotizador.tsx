import React, { useState, useEffect } from 'react';
import { ForecastService } from '../../services/api';
import { Play, Plus, Trash2, Sparkles, RefreshCw, Save, FolderOpen, X } from 'lucide-react';

interface TramoState {
    type: 'BALLAST' | 'LADEN';
    origin_port_id: string;
    destination_port_id: string;
    quantity: number;
    freight_rate: number;
    port_delay_hours_loading: number;
    port_delay_hours_discharging: number;
}

interface PuertoConfig {
    action: 'NONE' | 'CARGAR' | 'DESCARGAR';
    quantity: string | number;
    freight_rate: string | number;
}

export const MultiCotizador: React.FC = () => {
    const [vessels, setVessels] = useState<any[]>([]);
    const [selectedVessel, setSelectedVessel] = useState('');
    const [ports, setPorts] = useState<any[]>([]);
    
    // Precios de bunker configurables
    const [bunkerPriceIfo, setBunkerPriceIfo] = useState<number>(600);
    const [bunkerPriceMdo, setBunkerPriceMdo] = useState<number>(900);
    const [bunkerDate, setBunkerDate] = useState<string>('Cargando...');

    // Lista de tramos (inicialmente 2 tramos)
    const [tramos, setTramos] = useState<TramoState[]>([
        {
            type: 'BALLAST',
            origin_port_id: 'ILO',
            destination_port_id: 'MATARANI',
            quantity: 0,
            freight_rate: 0,
            port_delay_hours_loading: 0,
            port_delay_hours_discharging: 0
        },
        {
            type: 'LADEN',
            origin_port_id: 'MATARANI',
            destination_port_id: 'MEJILLONES',
            quantity: 13500,
            freight_rate: 22.50,
            port_delay_hours_loading: 0,
            port_delay_hours_discharging: 0
        }
    ]);

    // Configuración de puertos a eje de las letras (tramos.length + 1)
    const [puertosConfig, setPuertosConfig] = useState<PuertoConfig[]>([
        { action: 'CARGAR', quantity: 13500, freight_rate: 0 },       // Puerto 0 (A)
        { action: 'NONE', quantity: 0, freight_rate: 0 },            // Puerto 1 (B)
        { action: 'DESCARGAR', quantity: 13500, freight_rate: 22.50 } // Puerto 2 (C)
    ]);

    const [result, setResult] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    // Persistencia de Rutas
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [routeName, setRouteName] = useState('');
    const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
    const [loadedRouteName, setLoadedRouteName] = useState<string | null>(null);

    // Cargar Catálogos
    useEffect(() => {
        ForecastService.getVessels().then(data => {
            setVessels(data);
            if (data && data.length > 0) {
                setSelectedVessel(data[0].vessel_id);
            }
        });
        
        ForecastService.getPorts().then(data => {
            const uniquePorts = data.filter((p: any, idx: number, self: any[]) => 
                self.findIndex((x: any) => x.port_id === p.port_id) === idx
            );
            setPorts(uniquePorts);
        });

        ForecastService.getLatestBunker().then(prices => {
            if (prices) {
                setBunkerPriceIfo(prices.ifo || 600);
                setBunkerPriceMdo(prices.mdo || 900);
                setBunkerDate(prices.date || 'N/A');
            }
        }).catch(err => {
            console.error("Error al cargar precios de bunker:", err);
        });
    }, []);

    // Actualizar precios de bunker al cambiar de barco
    const handleVesselChange = (vId: string) => {
        setSelectedVessel(vId);
        const v = vessels.find(x => x.vessel_id === vId);
        if (v && v.max_capacity_mdo <= 0) {
            setBunkerPriceMdo(0);
        } else {
            ForecastService.getLatestBunker().then(prices => {
                if (prices) setBunkerPriceMdo(prices.mdo || 900);
            });
        }
    };

    // Propagar cambios de origen/destino reactivos en cadena
    const updateTramoField = (index: number, field: keyof TramoState, value: any) => {
        setTramos(prev => {
            const list = [...prev];
            list[index] = { ...list[index], [field]: value };
            
            if (field === 'destination_port_id' && index < list.length - 1) {
                list[index + 1].origin_port_id = value;
            }
            return list;
        });
    };

    // Propagar cambios en configuración de puerto y auto-propagar flete
    const updatePuertoConfigField = (idx: number, field: keyof PuertoConfig, val: any) => {
        setPuertosConfig(prev => {
            const list = [...prev];
            list[idx] = { ...list[idx], [field]: val };
            
            // Si cambia la acción, limpiar inputs inválidos
            if (field === 'action') {
                if (val === 'NONE') {
                    list[idx].quantity = '';
                    list[idx].freight_rate = '';
                } else if (val === 'CARGAR') {
                    list[idx].freight_rate = ''; // Flete se ingresa en descarga
                }
            }

            // Propagación de Flete: al ingresar el flete de la primera descarga, duplicarlo a las siguientes descargas vacías
            if (field === 'freight_rate') {
                const firstDescargaIdx = list.findIndex(p => p.action === 'DESCARGAR');
                if (idx === firstDescargaIdx) {
                    for (let i = idx + 1; i < list.length; i++) {
                        if (list[i].action === 'DESCARGAR' && (list[i].freight_rate === 0 || !list[i].freight_rate || list[i].freight_rate === '0' || list[i].freight_rate === '')) {
                            list[i].freight_rate = val;
                        }
                    }
                }
            }
            return list;
        });
    };

    // Calcular la cantidad de toneladas y naturaleza de cada tramo basado en el acumulador de bodega
    const getCalculatedTramos = () => {
        let carga_a_bordo = 0;
        return tramos.map((tr, idx) => {
            const pOrig = puertosConfig[idx] || { action: 'NONE', quantity: 0, freight_rate: 0 };
            const qOrig = Number(pOrig.quantity) || 0;
            if (pOrig.action === 'CARGAR') {
                carga_a_bordo += qOrig;
            } else if (pOrig.action === 'DESCARGAR') {
                carga_a_bordo -= qOrig;
                if (carga_a_bordo < 0) carga_a_bordo = 0;
            }

            const qtyTramo = carga_a_bordo;
            const typeTramo = qtyTramo > 0 ? 'LADEN' : 'BALLAST';

            // El flete de este tramo se define por lo que se descarga en el puerto destino (idx + 1)
            const pDest = puertosConfig[idx + 1] || { action: 'NONE', quantity: 0, freight_rate: 0 };
            const fleteTramo = pDest.action === 'DESCARGAR' ? (Number(pDest.freight_rate) || 0) : 0;
            const descTons = pDest.action === 'DESCARGAR' ? (Number(pDest.quantity) || 0) : 0;

            return {
                ...tr,
                type: typeTramo,
                quantity: qtyTramo,
                freight_rate: fleteTramo,
                desc_tons: descTons
            };
        });
    };

    // Agregar un nuevo tramo y su puerto asociado
    const handleAddTramo = () => {
        setTramos(prev => {
            const last = prev[prev.length - 1];
            const defaultDest = ports.find(p => p.port_id !== last.destination_port_id)?.port_id || 'ILO';
            return [
                ...prev,
                {
                    type: 'LADEN',
                    origin_port_id: last.destination_port_id,
                    destination_port_id: defaultDest,
                    quantity: 13500,
                    freight_rate: 20.00,
                    port_delay_hours_loading: 0,
                    port_delay_hours_discharging: 0
                }
            ];
        });
        setPuertosConfig(prev => [
            ...prev,
            { action: 'NONE', quantity: 0, freight_rate: 0 }
        ]);
    };

    // Eliminar el último tramo y su puerto asociado
    const handleRemoveLastTramo = () => {
        if (tramos.length <= 1) return;
        setTramos(prev => prev.slice(0, prev.length - 1));
        setPuertosConfig(prev => prev.slice(0, prev.length - 1));
    };

    // Ejecutar simulación
    const handleCalculate = async () => {
        if (!selectedVessel) return alert('Seleccione un buque para cotizar');
        
        // Obtener tramos calculados dinámicamente según bodega
        const trs = getCalculatedTramos();

        for (let i = 0; i < trs.length; i++) {
            const tr = trs[i];
            if (tr.origin_port_id === tr.destination_port_id) {
                return alert(`Error en Tramo ${i+1}: El puerto de origen y destino no pueden ser iguales (${tr.origin_port_id}).`);
            }
        }

        try {
            setIsCalculating(true);
            const payloadTramos = trs.map(tr => {
                const isLaden = tr.type === 'LADEN';
                return {
                    origin_port_id: tr.origin_port_id,
                    destination_port_id: tr.destination_port_id,
                    type: tr.type,
                    // Si hay descarga en el destino, cobramos por lo descargado. Si no, 0.
                    quantity: isLaden ? Number(tr.quantity) : 0,
                    freight_rate: Number(tr.freight_rate),
                    port_delay_hours_loading: Number(tr.port_delay_hours_loading),
                    port_delay_hours_discharging: Number(tr.port_delay_hours_discharging)
                };
            });

            // tweak de ingresos por tramo:
            // Para que net_income en el tramo sea igual a (desc_tons * freight_rate) en vez de (carga_a_bordo * flete),
            // podemos recalcular el net_income en el backend o simplemente sobreescribir 'quantity' para el cobro.
            // En spot_engine, process_laden_leg hace: net_income = Q * F.
            // Si le pasamos en el flete una tarifa ponderada o si modificamos temporalmente el flete para que
            // dé el total correcto de la descarga, o mejor aún:
            // Enviamos al backend el payload tal cual, y en la respuesta sobreescribimos los ingresos del tramo
            // en base a la descarga real del puerto destino.
            // ¡Esto es 100% seguro y no requiere tocar el motor de simulación física del backend!
            // Hagámoslo así: llamamos al backend con los tramos calculados, y al recibir la respuesta,
            // recalculamos y pisamos el flete del tramo en el frontend con desc_tons * flete_descarga,
            // y ajustamos los totales de ingresos consolidados en consecuencia.
            const res = await ForecastService.calculateMultiCotizador({
                vessel_id: selectedVessel,
                bunker_price_ifo: bunkerPriceIfo,
                bunker_price_mdo: bunkerPriceMdo,
                tramos: payloadTramos
            });

            // Recalcular ingresos del tramo en el frontend según flete de descarga
            let totalFreightRevenue = 0;
            res.tramos = res.tramos.map((trRes: any, idx: number) => {
                const pDest = puertosConfig[idx + 1];
                let fleteIngreso = 0;
                if (pDest && pDest.action === 'DESCARGAR') {
                    fleteIngreso = Number(pDest.quantity || 0) * Number(pDest.freight_rate || 0);
                }
                totalFreightRevenue += fleteIngreso;
                return {
                    ...trRes,
                    net_income: fleteIngreso,
                    pnl_tramo: fleteIngreso - trRes.bunker_costs - trRes.port_costs
                };
            });

            // Ajustar consolidados generales
            res.consolidated.total_freight_revenue = totalFreightRevenue;
            res.consolidated.pnl_net_utility = totalFreightRevenue - res.consolidated.total_port_costs - res.consolidated.total_bunker_costs;
            res.consolidated.tce_real = res.consolidated.total_days > 0 ? (res.consolidated.pnl_net_utility / res.consolidated.total_days) : 0;

            setResult(res);
        } catch (e) {
            console.error("Error al simular:", e);
            alert("Error en el cálculo. Revise los logs del servidor.");
        } finally {
            setIsCalculating(false);
        }
    };

    // Guardar ruta multicotizador
    const handleSaveRoute = async () => {
        if (!routeName) return alert('Ingrese un nombre para la ruta');
        try {
            setIsSaving(true);
            const pais = tramos.some(tr => (tr.destination_port_id || "").toLowerCase().includes("meji") || (tr.destination_port_id || "").toLowerCase().includes("barq")) ? "Chile" : "Peru";
            const payload = {
                name: routeName,
                description: "Ruta de Multicotizador",
                pais,
                legs_data: {
                    is_multicotizador: true,
                    vessel_id: selectedVessel,
                    bunker_price_ifo: bunkerPriceIfo,
                    bunker_price_mdo: bunkerPriceMdo,
                    tramos,
                    puertosConfig
                }
            };
            await ForecastService.saveSpot(payload);
            alert("Ruta multicotizador guardada con éxito");
            setLoadedRouteName(routeName);
            setShowSaveModal(false);
            setRouteName('');
        } catch (e) {
            console.error(e);
            alert("Error al guardar la ruta multicotizador");
        } finally {
            setIsSaving(false);
        }
    };

    // Cargar rutas multicotizador
    const handleLoadClick = async () => {
        try {
            setIsLoadingRoutes(true);
            setShowLoadModal(true);
            const list = await ForecastService.listSpots();
            const filtered = list.filter((s: any) => s.legs_data?.is_multicotizador === true);
            setSavedRoutes(filtered);
        } catch (e) {
            console.error(e);
            alert("Error al listar las rutas guardadas");
        } finally {
            setIsLoadingRoutes(false);
        }
    };

    // Aplicar ruta cargada
    const handleLoadRoute = (route: any) => {
        const data = route.legs_data;
        if (data) {
            if (data.vessel_id) setSelectedVessel(data.vessel_id);
            if (data.bunker_price_ifo) setBunkerPriceIfo(data.bunker_price_ifo);
            if (data.bunker_price_mdo) setBunkerPriceMdo(data.bunker_price_mdo);
            if (data.tramos) setTramos(data.tramos);
            if (data.puertosConfig) setPuertosConfig(data.puertosConfig);
            setLoadedRouteName(route.name);
            setResult(null); // Limpiar cálculo anterior
            setShowLoadModal(false);
        }
    };

    const fmtCur = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    const fmtNum = (val: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(val);

    const calculatedTramosList = getCalculatedTramos();

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-5 text-slate-800 flex-1 flex flex-col min-h-0 w-full transition-all">
            {/* Header / Panel Superior de Configuración General */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 text-indigo-600">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h2 className="text-md font-bold text-slate-900 flex items-center gap-2">
                            ⚓ Multicotizador Spot Multileg {loadedRouteName && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black font-mono">[{loadedRouteName}]</span>}
                        </h2>
                        <p className="text-[11px] text-slate-500 font-medium">Cotización lineal consecutiva de viajes por tramos secuenciales con herencia de estados</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/60 shadow-inner">
                    
                    {/* Selector de Nave */}
                    <div className="flex flex-col gap-0.5 justify-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">Buque:</span>
                        <select
                            value={selectedVessel}
                            onChange={(e) => handleVesselChange(e.target.value)}
                            className="h-7 bg-white border border-slate-300 rounded px-2 text-xs font-semibold text-slate-700 shadow-sm cursor-pointer focus:outline-none focus:border-indigo-500"
                        >
                            {vessels.map(v => (
                                <option key={v.vessel_id} value={v.vessel_id}>{v.vessel_name}</option>
                            ))}
                        </select>
                        <span className="text-[8px] text-transparent select-none font-mono">Spacer</span>
                    </div>

                    {/* Precios Bunker IFO */}
                    <div className="flex flex-col gap-0.5 justify-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">IFO ($/t):</span>
                        <input
                            type="number"
                            step="0.01"
                            value={bunkerPriceIfo}
                            onChange={(e) => setBunkerPriceIfo(Number(e.target.value))}
                            className="h-7 w-20 bg-white border border-slate-300 rounded px-2 text-xs font-semibold text-slate-700 text-right shadow-sm focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-[8px] text-slate-400 font-semibold font-mono text-right mr-1">Lec: {bunkerDate}</span>
                    </div>

                    {/* Precios Bunker MDO */}
                    <div className="flex flex-col gap-0.5 justify-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">MDO ($/t):</span>
                        <input
                            type="number"
                            step="0.01"
                            value={bunkerPriceMdo}
                            onChange={(e) => setBunkerPriceMdo(Number(e.target.value))}
                            className="h-7 w-20 bg-white border border-slate-300 rounded px-2 text-xs font-semibold text-slate-700 text-right shadow-sm focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-[8px] text-slate-400 font-semibold font-mono text-right mr-1">Lec: {bunkerDate}</span>
                    </div>

                    {/* Controles de Tramos */}
                    <div className="flex flex-col gap-0.5 justify-center border-l border-slate-300 pl-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">Tramos:</span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handleAddTramo}
                                className="h-7 text-[10px] font-semibold rounded px-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                                <Plus size={11} /> Agregar
                            </button>
                            <button
                                onClick={handleRemoveLastTramo}
                                disabled={tramos.length <= 1}
                                className="h-7 text-[10px] font-semibold rounded px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                                <Trash2 size={11} /> Quitar
                            </button>
                        </div>
                        <span className="text-[8px] text-transparent select-none font-mono">Spacer</span>
                    </div>

                    {/* Controles de Grabar y Cargar */}
                    <div className="flex items-center gap-1.5 border-l border-slate-300 pl-3">
                        <button
                            onClick={() => setShowSaveModal(true)}
                            className="h-7 text-[10px] font-semibold rounded px-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                            <Save size={11} /> Grabar
                        </button>
                        <button
                            onClick={handleLoadClick}
                            className="h-7 text-[10px] font-semibold rounded px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                            <FolderOpen size={11} /> Cargar
                        </button>
                    </div>
                </div>
            </div>

            {/* SECCIÓN HORIZONTAL COMPLETA DE TRABAJO - GRID INTERCALADO RESPONSIVO */}
            <div className="w-full overflow-x-auto pt-8 pb-3 flex-1 flex flex-col min-h-0">
                <div className="flex items-start justify-start gap-0 select-none pb-4 pl-12 pr-6 w-full">
                    
                    {/* PUERTO INICIAL (A) */}
                    <div 
                        style={{ width: '12%', minWidth: '110px', maxWidth: '12%', flex: '0 0 12%' }}
                        className="flex flex-col items-center z-10"
                    >
                        {/* Selector de Puerto y Pelotita en h-20 */}
                        <div className="relative flex flex-col items-center w-full h-20 justify-end">
                            <div className="absolute top-0 flex flex-col items-center w-24">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">Origen</span>
                                <select
                                    value={tramos[0].origin_port_id}
                                    onChange={(e) => updateTramoField(0, 'origin_port_id', e.target.value)}
                                    className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 focus:outline-none shadow-sm cursor-pointer w-full text-center"
                                >
                                    {ports.map(p => (
                                        <option key={p.port_id} value={p.port_id}>{p.port_id}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="bg-indigo-600 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md text-white font-bold text-xs select-none">
                                A
                            </div>
                        </div>

                        {/* TARJETA DE PUERTO A (OPERACIÓN COMERCIAL) */}
                        <div className="mt-8 w-[86px] bg-indigo-50/40 border border-indigo-100 rounded-xl p-1 flex flex-col gap-1.5 shadow-sm min-h-[170px] mx-auto">
                            <div className="border-b border-indigo-100/60 pb-0.5 text-center">
                                <span className="text-[8px] font-black text-indigo-750 uppercase tracking-wider">{tramos[0].origin_port_id}</span>
                            </div>

                            {/* Operación */}
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[7px] font-bold text-slate-400 uppercase text-center">Operación</span>
                                <select
                                    value={puertosConfig[0].action}
                                    onChange={(e) => updatePuertoConfigField(0, 'action', e.target.value)}
                                    className="bg-indigo-50 border-indigo-400 border-2 rounded px-0.5 py-0.25 text-[7.5px] text-indigo-900 font-black focus:outline-none cursor-pointer w-full text-center h-5 shadow-sm"
                                >
                                    <option value="NONE">Ninguna</option>
                                    <option value="CARGAR">Carga</option>
                                    <option value="DESCARGAR">Descarga</option>
                                </select>
                            </div>

                            {/* Cantidad Q */}
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[7px] font-bold text-slate-400 uppercase text-center">Q (MT)</span>
                                {puertosConfig[0].action !== 'NONE' ? (
                                    <input
                                        type="number"
                                        placeholder="MT"
                                        value={puertosConfig[0].quantity}
                                        onChange={(e) => updatePuertoConfigField(0, 'quantity', e.target.value)}
                                        className="bg-white border border-slate-300 rounded px-1 py-0.25 text-[8px] text-slate-700 font-semibold w-full text-center focus:outline-none h-5"
                                    />
                                ) : (
                                    <span className="text-[8px] text-slate-400 font-medium font-mono py-0.25 text-center">—</span>
                                )}
                            </div>

                            {/* Flete F */}
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[7px] font-bold text-slate-400 uppercase text-center">F ($/t)</span>
                                {puertosConfig[0].action === 'DESCARGAR' ? (
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="$/t"
                                        value={puertosConfig[0].freight_rate}
                                        onChange={(e) => updatePuertoConfigField(0, 'freight_rate', e.target.value)}
                                        className="bg-white border border-slate-300 rounded px-1 py-0.25 text-[8px] text-slate-700 font-semibold w-full text-center focus:outline-none h-5"
                                    />
                                ) : (
                                    <span className="text-[8px] text-slate-400 font-medium font-mono py-0.25 text-center">—</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* TRAMOS Y PUERTOS SECUENCIALES INTERCALADOS */}
                    {tramos.map((tr, idx) => {
                        const trCalculado = calculatedTramosList[idx];
                        const trResult = result?.tramos?.[idx];
                        
                        return (
                            <React.Fragment key={idx}>
                                
                                {/* COLUMNA DEL TRAMO - w-15% o 15% adaptativo */}
                                <div 
                                    style={{ width: '15%', minWidth: '150px', maxWidth: '15%', flex: '0 0 15%' }}
                                    className="flex-1 flex flex-col items-center px-0.5"
                                >
                                    
                                    {/* Cabecera del Tramo (Línea Conectora) */}
                                    <div className="w-full flex flex-col items-center h-20 justify-end relative">
                                        <div className={`h-1.5 w-full ${trCalculado.type === 'LADEN' ? 'bg-emerald-500/80' : 'bg-blue-500/75'} shadow-sm mb-[13px]`} />
                                        <div className="absolute top-0.5 flex items-center justify-center">
                                            <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider ${trCalculado.type === 'LADEN' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                                                T{idx + 1}: {trCalculado.type}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Tarjeta de cálculos y resultados del tramo */}
                                    <div className="mt-8 w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 flex flex-col gap-2.5 shadow-sm hover:border-slate-300 transition-all min-h-[190px]">
                                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                                            <span className="text-[9px] font-black uppercase text-indigo-650 tracking-wider">TRAMO {idx + 1}</span>
                                            <span className="text-[8px] text-slate-400 font-mono font-bold">{trCalculado.origin_port_id}➔{trCalculado.destination_port_id}</span>
                                        </div>

                                        {/* Valores calculados y operacionales en este tramo */}
                                        <div className="flex flex-col gap-1.5 text-[10px]">
                                            <div className="flex justify-between h-4 items-center">
                                                <span className="text-slate-500 font-medium">Carga a bordo:</span>
                                                <strong className="font-mono text-slate-700">{fmtNum(trCalculado.quantity)} MT</strong>
                                            </div>
                                            <div className="flex justify-between h-4 items-center">
                                                <span className="text-slate-500 font-medium">Días M/P:</span>
                                                <strong className="font-mono text-slate-700">
                                                    {trResult ? `${fmtNum(trResult.sea_days)}d / ${fmtNum(trResult.port_days)}d` : 'TBD'}
                                                </strong>
                                            </div>
                                            <div className="flex justify-between h-4 items-center">
                                                <span className="text-slate-500 font-medium">Distancia:</span>
                                                <strong className="font-mono text-slate-600">
                                                    {trResult ? `${fmtNum(trResult.distance)} NM` : 'TBD'}
                                                </strong>
                                            </div>
                                            <div className="flex justify-between h-4 items-center border-t border-slate-200/50 pt-1">
                                                <span className="text-slate-500 font-medium">Costo Bunker:</span>
                                                <strong className="font-mono text-slate-700">
                                                    {trResult ? fmtCur(trResult.bunker_costs) : 'TBD'}
                                                </strong>
                                            </div>
                                            <div className="flex justify-between h-4 items-center">
                                                <span className="text-slate-500 font-medium">Port Cost:</span>
                                                <strong className="font-mono text-red-650">
                                                    {trResult ? fmtCur(trResult.port_costs) : 'TBD'}
                                                </strong>
                                            </div>
                                            <div className="flex justify-between h-4 items-center border-t border-slate-200/50 pt-1">
                                                <span className="text-slate-500 font-medium">Ingreso Flete:</span>
                                                <strong className="font-mono text-emerald-650">
                                                    {trResult ? fmtCur(trResult.net_income) : 'TBD'}
                                                </strong>
                                            </div>
                                            <div className="flex justify-between items-baseline pt-1 mt-0.5 border-t border-slate-200">
                                                <span className="text-[8px] font-black text-slate-500 uppercase">P&L Tramo</span>
                                                <span className={`font-mono text-[10px] font-black ${trResult?.pnl_tramo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {trResult ? fmtCur(trResult.pnl_tramo) : 'TBD'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* NODO DESTINO/INTERMEDIO (B, C, etc.) */}
                                <div 
                                    style={{ width: '12%', minWidth: '110px', maxWidth: '12%', flex: '0 0 12%' }}
                                    className="flex flex-col items-center z-10"
                                >
                                    {/* Selector de Puerto y Pelotita */}
                                    <div className="relative flex flex-col items-center w-full h-20 justify-end">
                                        <div className="absolute top-0 flex flex-col items-center w-24">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                                                {idx === tramos.length - 1 ? 'Destino' : `Nodo ${String.fromCharCode(66 + idx)}`}
                                            </span>
                                            <select
                                                value={tr.destination_port_id}
                                                onChange={(e) => updateTramoField(idx, 'destination_port_id', e.target.value)}
                                                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 focus:outline-none shadow-sm cursor-pointer w-full text-center"
                                            >
                                                {ports.map(p => (
                                                    <option key={p.port_id} value={p.port_id}>{p.port_id}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md text-white font-bold text-xs select-none ${idx === tramos.length - 1 ? 'bg-slate-500' : 'bg-indigo-600'}`}>
                                            {String.fromCharCode(66 + idx)}
                                        </div>
                                    </div>

                                    {/* TARJETA DE PUERTO COMERCIAL B, C, D... */}
                                    <div className="mt-8 w-[86px] bg-indigo-50/40 border border-indigo-100 rounded-xl p-1 flex flex-col gap-1.5 shadow-sm min-h-[170px] mx-auto">
                                        <div className="border-b border-indigo-100/60 pb-0.5 text-center">
                                            <span className="text-[8px] font-black text-indigo-750 uppercase tracking-wider">{tr.destination_port_id}</span>
                                        </div>

                                        {/* Operación */}
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[7px] font-bold text-slate-400 uppercase text-center">Operación</span>
                                            <select
                                                value={puertosConfig[idx + 1].action}
                                                onChange={(e) => updatePuertoConfigField(idx + 1, 'action', e.target.value)}
                                                className="bg-indigo-50 border-indigo-400 border-2 rounded px-0.5 py-0.25 text-[7.5px] text-indigo-900 font-black focus:outline-none cursor-pointer w-full text-center h-5 shadow-sm"
                                            >
                                                <option value="NONE">Ninguna</option>
                                                <option value="CARGAR">Carga</option>
                                                <option value="DESCARGAR">Descarga</option>
                                            </select>
                                        </div>

                                        {/* Cantidad Q */}
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[7px] font-bold text-slate-400 uppercase text-center">Q (MT)</span>
                                            {puertosConfig[idx + 1].action !== 'NONE' ? (
                                                <input
                                                    type="number"
                                                    placeholder="MT"
                                                    value={puertosConfig[idx + 1].quantity}
                                                    onChange={(e) => updatePuertoConfigField(idx + 1, 'quantity', e.target.value)}
                                                    className="bg-white border border-slate-300 rounded px-1 py-0.25 text-[8px] text-slate-700 font-semibold w-full text-center focus:outline-none h-5"
                                                />
                                            ) : (
                                                <span className="text-[8px] text-slate-400 font-medium font-mono py-0.25 text-center">—</span>
                                            )}
                                        </div>

                                        {/* Flete F */}
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[7px] font-bold text-slate-400 uppercase text-center">F ($/t)</span>
                                            {puertosConfig[idx + 1].action === 'DESCARGAR' ? (
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    placeholder="$/t"
                                                    value={puertosConfig[idx + 1].freight_rate}
                                                    onChange={(e) => updatePuertoConfigField(idx + 1, 'freight_rate', e.target.value)}
                                                    className="bg-white border border-slate-300 rounded px-1 py-0.25 text-[8px] text-slate-700 font-semibold w-full text-center focus:outline-none h-5"
                                                />
                                            ) : (
                                                <span className="text-[8px] text-slate-400 font-medium font-mono py-0.25 text-center">—</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                            </React.Fragment>
                        );
                    })}

                    {/* COLUMNA EXTREMA DERECHA: TOTAL DEL VIAJE */}
                    <div className="w-[240px] flex-shrink-0 ml-6 flex flex-col items-center">
                        
                        {/* Cabecera del Consolidado */}
                        <div className="h-20 flex flex-col items-center justify-end w-full relative">
                            <div className="h-1 w-full bg-slate-200 border-dashed border-t mb-[13px]" />
                            <span className="absolute top-0.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-300">
                                TOTALES CONSOLIDADOS
                            </span>
                        </div>

                        {/* Tarjeta Consolidada */}
                        <div className="mt-8 w-full bg-slate-100/75 border border-slate-300 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden min-h-[190px]">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-600/5 rounded-full blur-2xl z-0" />
                            
                            <div className="relative z-10 flex flex-col gap-3">
                                <div className="border-b border-slate-300 pb-1.5 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">RESUMEN VIAJE</span>
                                    <span className="text-[8px] bg-indigo-100 text-indigo-750 font-bold px-1.5 py-0.5 rounded uppercase">Final</span>
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    <div className="flex justify-between text-[11px] h-4 items-center">
                                        <span className="text-slate-500 font-medium">Duración Total:</span>
                                        <strong className="font-mono text-slate-800">{result ? `${fmtNum(result.consolidated.total_days)} días` : 'TBD'}</strong>
                                    </div>
                                    <div className="flex justify-between text-[11px] h-4 items-center">
                                        <span className="text-slate-500 font-medium">Distancia Total:</span>
                                        <strong className="font-mono text-slate-800">{result ? `${fmtNum(result.consolidated.total_distance)} NM` : 'TBD'}</strong>
                                    </div>
                                    <div className="flex justify-between text-[11px] h-4 items-center">
                                        <span className="text-slate-500 font-medium">Costo Bunker:</span>
                                        <strong className="font-mono text-slate-800">{result ? fmtCur(result.consolidated.total_bunker_costs) : 'TBD'}</strong>
                                    </div>
                                    <div className="flex justify-between text-[11px] h-4 items-center">
                                        <span className="text-slate-500 font-medium">Costos Puerto:</span>
                                        <strong className="font-mono text-red-650">{result ? fmtCur(result.consolidated.total_port_costs) : 'TBD'}</strong>
                                    </div>
                                    <div className="flex justify-between text-[11px] border-t border-slate-300 pt-1.5 mt-1 h-4 items-center">
                                        <span className="text-slate-500 font-medium">Flete Total:</span>
                                        <strong className="font-mono text-emerald-650">{result ? fmtCur(result.consolidated.total_freight_revenue) : 'TBD'}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 border-t border-slate-300 pt-3 mt-3 flex flex-col gap-2.5">
                                <div className="flex justify-between items-center border-b border-slate-200/50 pb-1.5">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-wide">Voyage Result</span>
                                    <span className={`text-[13px] font-black font-mono tracking-tight ${result?.consolidated.pnl_net_utility >= 0 ? 'text-emerald-650' : 'text-rose-600'}`}>
                                        {result ? fmtCur(result.consolidated.pnl_net_utility) : '$0'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-wide">TCE Realizado</span>
                                        {result && (
                                            <span className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">
                                                Req: {fmtCur(result.consolidated.tce_required)}/d
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-[12px] font-black font-mono tracking-tight ${result?.consolidated.tce_real >= result?.consolidated.tce_required ? 'text-indigo-650' : 'text-yellow-600'}`}>
                                        {result ? `${fmtCur(result.consolidated.tce_real)}/d` : '$0/d'}
                                    </span>
                                </div>

                                <button
                                    onClick={handleCalculate}
                                    disabled={isCalculating}
                                    className="w-full bg-indigo-600 hover:bg-indigo-750 disabled:opacity-50 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                                >
                                    {isCalculating ? (
                                        <>
                                            <RefreshCw size={12} className="animate-spin" /> ...
                                        </>
                                    ) : (
                                        <>
                                            <Play size={12} fill="white" /> Simular Viaje
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* MODALES DE PERSISTENCIA */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-5 rounded-xl w-80 shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                            <h3 className="text-sm font-bold text-slate-900">Grabar Ruta Multicotizador</h3>
                            <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-slate-650"><X size={16} /></button>
                        </div>
                        <input
                            type="text"
                            placeholder="Nombre de la ruta (Ej: Callao-Valparaiso)"
                            value={routeName}
                            onChange={(e) => setRouteName(e.target.value)}
                            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 mb-4 focus:outline-none focus:border-indigo-500 shadow-sm"
                        />
                        <div className="flex justify-end gap-2 text-xs">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="h-7 font-semibold rounded px-3 bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveRoute}
                                disabled={isSaving}
                                className="h-7 font-semibold rounded px-3 bg-primary text-primary-foreground shadow-sm hover:bg-primary/95 cursor-pointer disabled:opacity-50"
                            >
                                {isSaving ? "Grabando..." : "Confirmar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showLoadModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-5 rounded-xl w-96 shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                            <h3 className="text-sm font-bold text-slate-900">Cargar Ruta Multicotizador</h3>
                            <button onClick={() => setShowLoadModal(false)} className="text-slate-400 hover:text-slate-650"><X size={16} /></button>
                        </div>
                        <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5 mb-4">
                            {isLoadingRoutes ? (
                                <div className="text-xs text-slate-500 py-4 text-center">Listando rutas grabadas...</div>
                            ) : savedRoutes.length === 0 ? (
                                <div className="text-xs text-slate-400 py-4 text-center">No hay rutas grabadas para el Multicotizador</div>
                            ) : (
                                savedRoutes.map(route => (
                                    <button
                                        key={route.spot_id}
                                        onClick={() => handleLoadRoute(route)}
                                        className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-indigo-500 transition-all flex justify-between items-center group cursor-pointer"
                                    >
                                        <div>
                                            <span className="text-xs font-bold text-slate-700 block group-hover:text-indigo-650">{route.name}</span>
                                            <span className="text-[9px] text-slate-400">{route.description || 'Sin descripción'}</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-slate-400">{route.created_at ? new Date(route.created_at).toLocaleDateString() : ''}</span>
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="flex justify-end text-xs">
                            <button
                                onClick={() => setShowLoadModal(false)}
                                className="h-7 font-semibold rounded px-3 bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
