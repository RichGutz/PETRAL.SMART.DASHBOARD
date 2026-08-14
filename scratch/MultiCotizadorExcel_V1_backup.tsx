import React, { useState, useEffect } from 'react';
import { ForecastService } from '../../services/api';
import { FolderOpen } from 'lucide-react';

// Servicios Provistos (Providers)
import { VesselProviderService } from '../../services/providers/vesselProviderService';
import { RouteDistancesService } from '../../services/providers/routeDistancesService';
import { PortCostsRatesService } from '../../services/providers/portCostsRatesService';
import { MulticotizadorStorageService } from '../../services/providers/multicotizadorStorageService';
import { MulticotizadorRetrieverService } from '../../services/providers/multicotizadorRetrieverService';

// Subcomponentes Visuales UI (Fase 2)
import { VesselFactSheetHeader } from './multicotizador/VesselFactSheetHeader';
import { SpreadsheetTramosGrid } from './multicotizador/SpreadsheetTramosGrid';
import { FinancialResultCards } from './multicotizador/FinancialResultCards';
import { SaveLoadQuoteModals } from './multicotizador/SaveLoadQuoteModals';

interface TramoState {
    type: 'BALLAST' | 'LADEN';
    origin_port_id: string;
    destination_port_id: string;
    quantity: string | number;
    freight_rate: string | number;
    port_delay_hours_loading: string | number;
    port_delay_hours_discharging: string | number;
    route_distance?: string | number;
    weather_factor?: string | number;
    speed?: string | number;
}

interface PuertoConfig {
    action: 'NONE' | 'CARGAR' | 'DESCARGAR';
    quantity: string | number;
    freight_rate: string | number;
    op_rate: string | number;
    rate_unit?: 'TD' | 'TH';
    time_to_count?: string | number;
    overhead?: string | number;
    positioning?: string | number;
    manual_port_cost?: string | number;
    muellaje_cost?: number;
}

export interface MultiCotizadorExcelProps {
    portCostMode?: 'static' | 'matrix';
}

export const MultiCotizadorExcel: React.FC<MultiCotizadorExcelProps> = () => {
    // 1. Estados de Navegación & Pestañas
    const [clientType, setClientType] = useState<'ACTIVOS' | 'PROSPECTOS'>('ACTIVOS');
    const [selectedClient, setSelectedClient] = useState<string>('');
    // const [localPortCostMode, setLocalPortCostMode] = useState<'static' | 'matrix'>(initialPortCostMode);

    // 2. Estados de Catálogos, Contratos & Etiquetas UX
    const [vessels, setVessels] = useState<any[]>([]);
    const [ports, setPorts] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [rawClients, setRawClients] = useState<any[]>([]);
    const [clients, setClients] = useState<string[]>([]);
    const [contractsMaster, setContractsMaster] = useState<any[]>([]);
    const [activeRouteLabel, setActiveRouteLabel] = useState<string>('');
    const [loadedQuoteLabel, setLoadedQuoteLabel] = useState<string>('');

    // 3. Selección de Buque y Fact Sheet
    const [selectedVessel, setSelectedVessel] = useState<string>('');
    const [vesselParams, setVesselParams] = useState<any>({
        grt: 0, dwt: 0, dwcc: 0, vessel_speed: 0, tce_required: 0,
        length: 0, beam: 0, draft_m: 0,
        consumption_sea_ifo: 0, consumption_idle_ifo: 0, consumption_load_ifo: 0, consumption_disch_ifo: 0,
        consumption_sea_mdo: 0, consumption_idle_mdo: 0, consumption_load_mdo: 0, consumption_disch_mdo: 0
    });

    // 4. Búnker y Fuentes de Precios
    const [bunkerSource, setBunkerSource] = useState<'MAESTRO_CONTRATOS' | 'COTIZACION' | 'MAESTRO_BUNKER' | 'SOBREESCRITURA'>('MAESTRO_CONTRATOS');
    const [bunkerPriceIfo, setBunkerPriceIfo] = useState<number>(0);
    const [bunkerPriceMdo, setBunkerPriceMdo] = useState<number>(0);

    // 5. Grilla de Tramos & Configuración de Puertos
    const [tramos, setTramos] = useState<TramoState[]>([
        { type: 'BALLAST', origin_port_id: '', destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 },
        { type: 'LADEN', origin_port_id: '', destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 },
        { type: 'BALLAST', origin_port_id: '', destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 }
    ]);
    const [puertosConfig, setPuertosConfig] = useState<PuertoConfig[]>([
        { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' },
        { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' },
        { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' },
        { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' }
    ]);

    // 6. Comisiones, Demurrage & Refacturación
    const [addressCommPct, setAddressCommPct] = useState<number>(0);
    const [brokerCommPct, setBrokerCommPct] = useState<number>(0);
    const [demurrageRate, setDemurrageRate] = useState<number>(20000);
    const [commentsText, setCommentsText] = useState<string>('');
    const [refacturarMuellajeMap, setRefacturarMuellajeMap] = useState<Record<number, boolean>>({});

    // 7. Resultados & Persistencia Modales
    const [result, setResult] = useState<any>(null);
    const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
    const [showLoadModal, setShowLoadModal] = useState<boolean>(false);
    const [routeName, setRouteName] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isLoadingRoutes, setIsLoadingRoutes] = useState<boolean>(false);
    const [savedRoutes, setSavedRoutes] = useState<any[]>([]);

    // Formatters Helper
    const fmtCur = (val: any) => {
        if (val === undefined || val === null || val === '') return '$0';
        const num = Number(val);
        if (isNaN(num)) return '$0';
        return `$${Math.round(num).toLocaleString('en-US')}`;
    };
    const fmtNum = (val: any) => {
        if (val === undefined || val === null || val === '') return '0.0';
        const num = Number(val);
        if (isNaN(num)) return '0.0';
        return num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    };
    const fmtDays = (val: any) => {
        if (val === undefined || val === null || val === '') return '0.00';
        const num = Number(val);
        if (isNaN(num)) return '0.00';
        return num.toFixed(2);
    };
    const fmtThousandSep = (val: any) => {
        if (val === undefined || val === null || val === '') return '';
        const num = Number(val);
        if (isNaN(num)) return String(val);
        return num.toLocaleString('en-US');
    };

    // Carga de Catálogos Iniciales (Mapeo a tablas reales BD)
    useEffect(() => {
        const init = async () => {
            try {
                const [vData, pData, cData, spotData] = await Promise.all([
                    ForecastService.getVessels(),       // tabla: vessels
                    ForecastService.getPorts(),         // tabla: ports
                    ForecastService.getClients(),       // tabla: clients
                    ForecastService.getSpotVoyages()    // tabla: routes_clients / routes_quotes
                ]);
                setVessels(vData || []);
                setPorts(pData || []);
                setRawClients(cData || []);

                // Carga exclusiva de rutas desde la tabla routes_clients
                if (spotData && Array.isArray(spotData)) {
                    const clientRoutes = spotData.filter((s: any) => s.table_source === 'routes_clients' || s.is_prospect === false);
                    setRoutes(clientRoutes);
                }
            } catch (e) {
                console.error("Error cargando catálogos BD:", e);
            }
        };
        init();
    }, []);

    // Filtrado Dinámico de Clientes desde Supabase DB (clients & routes_quotes)
    useEffect(() => {
        const fetchAllClients = async () => {
            try {
                let dbClients = rawClients || [];
                const clientNames: string[] = [];

                dbClients.forEach((c: any) => {
                    const name = typeof c === 'string' ? c : (c.client_name || c.client_id || '');
                    if (name) clientNames.push(name.trim());
                });

                // Cargar también clientes guardados en cotizaciones / routes_quotes
                const spots = await ForecastService.getSpotVoyages();
                if (spots && Array.isArray(spots)) {
                    spots.forEach((s: any) => {
                        const name = (s.client_id || s.name || '').split('.')[0];
                        if (name && !clientNames.includes(name)) {
                            clientNames.push(name.trim());
                        }
                    });
                }

                const uniqueClients = Array.from(new Set(clientNames.filter(Boolean)));
                setClients(uniqueClients.length > 0 ? uniqueClients : ['SPCC', 'NEXA', 'TRAFIGURA', 'GLENCORE']);
            } catch (e) {
                setClients(['SPCC', 'NEXA', 'TRAFIGURA', 'GLENCORE']);
            }
        };

        fetchAllClients();
    }, [clientType, rawClients.length]);

    // Manejador de Cambio de Buque
    const handleVesselChange = (vesselId: string) => {
        setSelectedVessel(vesselId);
        if (!vesselId) return;
        const v = vessels.find(x => x.vessel_id === vesselId);
        if (v) {
            const resolved = VesselProviderService.extractVesselParams(vesselId, vessels);
            if (resolved) setVesselParams(resolved);
        }
    };

    const handleVesselParamChange = (field: string, val: any) => {
        setVesselParams((prev: any) => ({ ...prev, [field]: val }));
    };

    const autoFillPortCost = async (idx: number, portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR', vId: string) => {
        if (!vId || !portId || action === 'NONE') return;
        const res = await PortCostsRatesService.lookupPortCost(vId, portId, action, 'static');
        if (res.total_cost !== '') {
            setPuertosConfig(prev => {
                const list = [...prev];
                if (list[idx]) {
                    list[idx].manual_port_cost = res.total_cost;
                    list[idx].muellaje_cost = res.muellaje_cost;
                }
                return list;
            });
        }
    };

    const updateTramoField = (index: number, field: keyof TramoState, value: any) => {
        setTramos(prev => {
            const list = [...prev];
            list[index] = { ...list[index], [field]: value };
            if (field === 'origin_port_id' || field === 'destination_port_id' || field === 'type') {
                const auto = RouteDistancesService.resolveAutoRouteInfo(list[index].origin_port_id, list[index].destination_port_id, list[index].type, routes);
                list[index].route_distance = auto.route_distance;
                list[index].weather_factor = auto.weather_factor;
            }
            if (field === 'destination_port_id' && index < list.length - 1) {
                list[index + 1].origin_port_id = value;
                const autoNext = RouteDistancesService.resolveAutoRouteInfo(list[index + 1].origin_port_id, list[index + 1].destination_port_id, list[index + 1].type, routes);
                list[index + 1].route_distance = autoNext.route_distance;
                list[index + 1].weather_factor = autoNext.weather_factor;
            }
            return list;
        });

        if (field === 'origin_port_id' && index === 0) {
            if (puertosConfig[0] && puertosConfig[0].action !== 'NONE') {
                autoFillPortCost(0, value, puertosConfig[0].action, selectedVessel);
            }
        }
        if (field === 'destination_port_id') {
            const pIdx = index + 1;
            if (puertosConfig[pIdx] && puertosConfig[pIdx].action !== 'NONE') {
                autoFillPortCost(pIdx, value, puertosConfig[pIdx].action, selectedVessel);
            }
        }
    };

    const updatePuertoConfigField = (idx: number, field: keyof PuertoConfig, val: any) => {
        setPuertosConfig(prev => {
            const list = [...prev];
            list[idx] = { ...list[idx], [field]: val };
            if (field === 'action') {
                if (val === 'NONE') {
                    list[idx].quantity = '';
                    list[idx].freight_rate = '';
                    list[idx].op_rate = '';
                    list[idx].time_to_count = '';
                    list[idx].positioning = '';
                }
            }
            if (field === 'freight_rate') {
                const firstDescargaIdx = list.findIndex(p => p.action === 'DESCARGAR');
                if (idx === firstDescargaIdx) {
                    for (let i = idx + 1; i < list.length; i++) {
                        if (list[i].action === 'DESCARGAR' && (!list[i].freight_rate || list[i].freight_rate === 0 || list[i].freight_rate === '0')) {
                            list[i].freight_rate = val;
                        }
                    }
                }
            }
            return list;
        });

        if (field === 'action') {
            const portId = idx === 0 ? (tramos[0]?.origin_port_id || '') : (tramos[idx - 1]?.destination_port_id || '');
            if (portId) {
                autoFillPortCost(idx, portId, val, selectedVessel);
            }
        }
    };

    const getCalculatedTramos = () => {
        let carga_a_bordo = 0;
        return tramos.map((tr, idx) => {
            const pOrig = puertosConfig[idx] || { action: 'NONE', quantity: 0 };
            let qOrig = Number(pOrig.quantity) || 0;
            if (pOrig.action === 'CARGAR') {
                carga_a_bordo += qOrig;
            } else if (pOrig.action === 'DESCARGAR') {
                carga_a_bordo -= qOrig;
                if (carga_a_bordo < 0) carga_a_bordo = 0;
            }
            const qtyTramo = carga_a_bordo;
            const typeTramo = qtyTramo > 0 ? 'LADEN' : 'BALLAST';
            const pDest = puertosConfig[idx + 1] || { action: 'NONE', quantity: 0, freight_rate: 0 };
            const fleteTramo = pDest.action === 'DESCARGAR' ? (Number(pDest.freight_rate) || 0) : 0;
            const descTons = pDest.action === 'DESCARGAR' ? (Number(pDest.quantity) || 0) : 0;

            return { ...tr, type: typeTramo, quantity: qtyTramo, freight_rate: fleteTramo, desc_tons: descTons };
        });
    };

    const handleAddTramo = () => {
        const lastPort = tramos.length > 0 ? tramos[tramos.length - 1].destination_port_id : '';
        setTramos(prev => [
            ...prev,
            { type: 'BALLAST', origin_port_id: lastPort, destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 11.0 }
        ]);
        setPuertosConfig(prev => [
            ...prev,
            { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' }
        ]);
    };

    const handleRemoveLastTramo = () => {
        if (tramos.length <= 3) return; // Mínimo 3 piernas obligatorias
        setTramos(prev => prev.slice(0, -1));
        setPuertosConfig(prev => prev.slice(0, -1));
    };

    const getDynamicPortCostItems = () => {
        const items: any[] = [];
        puertosConfig.forEach((p, idx) => {
            if (p.action !== 'NONE') {
                const portId = idx === 0 ? (tramos[0]?.origin_port_id || '') : (tramos[idx - 1]?.destination_port_id || '');
                if (portId) {
                    const costVal = Number(p.manual_port_cost) || 0;
                    items.push({ label: `${idx === 0 ? 'POL' : 'POD'} (${portId})`, cost: costVal, port_id: portId, role: idx === 0 ? 'POL' : 'POD' });
                }
            }
        });
        return items;
    };

    const handleCalculate = async () => {
        try {
            const calculatedTramos = getCalculatedTramos();
            const payloadTramos = calculatedTramos.map((tr, idx) => {
                const pOrig = puertosConfig[idx] || {};
                const pDest = puertosConfig[idx + 1] || {};
                return {
                    leg: idx + 1,
                    type: tr.type,
                    origin_port_id: tr.origin_port_id,
                    destination_port_id: tr.destination_port_id,
                    quantity: tr.desc_tons,
                    freight_rate: tr.freight_rate,
                    origin_op_rate: pOrig.op_rate || 500,
                    dest_op_rate: pDest.op_rate || 300,
                    time_to_count_carga_hrs: Number(pOrig.time_to_count) || 0,
                    time_to_count_descarga_hrs: Number(pDest.time_to_count) || 0,
                    positioning_carga_hrs: Number(pOrig.positioning) || 0,
                    positioning_descarga_hrs: Number(pDest.positioning) || 0,
                    manual_agency_cost_origin: pOrig.manual_port_cost !== '' ? Number(pOrig.manual_port_cost) : null,
                    manual_agency_cost_dest: pDest.manual_port_cost !== '' ? Number(pDest.manual_port_cost) : null,
                    refacturar_muellaje_origin: refacturarMuellajeMap[idx] ?? true,
                    refacturar_muellaje_dest: refacturarMuellajeMap[idx + 1] ?? true,
                    route_distance: Number(tr.route_distance) || 0,
                    weather_factor: Number(tr.weather_factor) || 3.0,
                    speed: Number(tr.speed) || 11.0
                };
            });

            const payload = {
                vessel_id: selectedVessel,
                vessel_params: vesselParams,
                bunker_prices: { ifo: bunkerPriceIfo, mdo: bunkerPriceMdo },
                bunker_source: bunkerSource,
                port_cost_mode: 'static',
                client_id: selectedClient,
                address_commission_pct: addressCommPct,
                broker_commission_pct: brokerCommPct,
                demurrage_rate: demurrageRate,
                tramos: payloadTramos
            };

            const data = await ForecastService.calculateMultiCotizador(payload);
            setResult(data);
        } catch (e) {
            console.error("Error en simulación:", e);
        }
    };

    // Auto-calculo reactivo de simulación al modificar parámetros
    useEffect(() => {
        if (selectedVessel && tramos[0]?.origin_port_id && tramos[0]?.destination_port_id) {
            const timer = setTimeout(() => { handleCalculate(); }, 350);
            return () => clearTimeout(timer);
        }
    }, [selectedVessel, selectedClient, bunkerPriceIfo, bunkerPriceMdo, tramos, puertosConfig, addressCommPct, brokerCommPct, demurrageRate, refacturarMuellajeMap]);

    // Persistencia: Guardar y Cargar Cotizaciones
    const getSuggestedRouteName = (client: string) => {
        return `${client || 'CLIENTE'}_${tramos[0]?.origin_port_id || 'POL'}_${tramos[tramos.length - 1]?.destination_port_id || 'POD'}`;
    };

    const handleSaveRoute = async () => {
        if (!routeName.trim()) return;
        setIsSaving(true);
        try {
            await MulticotizadorStorageService.saveQuote({
                routeName,
                selectedClient,
                filterProspecto: clientType === 'PROSPECTOS',
                selectedVessel,
                bunkerPriceIfo,
                bunkerPriceMdo,
                tramosEnriquecidos: tramos,
                puertosConfig,
                vesselParams,
                addressCommPct,
                brokerCommPct,
                rawClients
            });
            setShowSaveModal(false);
        } catch (e) {
            console.error("Error guardando cotización:", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleListRoutes = async () => {
        setIsLoadingRoutes(true);
        setShowLoadModal(true);
        try {
            const list = await MulticotizadorRetrieverService.searchSavedQuotes('', true, clientType === 'PROSPECTOS', selectedClient);
            setSavedRoutes(list || []);
        } catch (e) {
            console.error("Error listando cotizaciones:", e);
        } finally {
            setIsLoadingRoutes(false);
        }
    };

    const handleLoadRoute = (quote: any) => {
        if (!quote) return;
        const unpacked = MulticotizadorRetrieverService.unpackQuoteData(quote);
        if (unpacked.tramos && unpacked.tramos.length > 0) setTramos(unpacked.tramos);
        if (unpacked.puertosConfig && unpacked.puertosConfig.length > 0) setPuertosConfig(unpacked.puertosConfig);
        if (unpacked.vessel_id) setSelectedVessel(unpacked.vessel_id);
        setShowLoadModal(false);
    };

    const handlePrintPDF = () => {
        window.print();
    };

    const calculatedTramosList = getCalculatedTramos();

    return (
        <div className="w-full min-h-screen bg-white p-2 text-slate-800 font-sans flex flex-col select-text">
            
            {/* BARRA UNIFICADA Y ESTANDARIZADA DE PASOS COMERCIALES (1 A 6) - SIN LOGOS NI CONTENEDORES DESIGUALES */}
            <div className="bg-slate-50 border border-slate-300 rounded p-1.5 mb-2 select-none flex-shrink-0">
                <div className="flex items-center justify-between gap-1.5 flex-nowrap overflow-x-auto">
                    
                    {/* PASO 1: SELECCIONAR CLIENTE */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2 py-1 shadow-sm shrink-0">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">
                            1. SELECCIONAR CLIENTE
                        </span>
                        <div className="flex rounded bg-slate-100 p-0.5 border border-slate-250">
                            <button
                                onClick={() => setClientType('ACTIVOS')}
                                className={`px-2 py-0.5 text-[9.5px] font-black uppercase rounded cursor-pointer ${clientType === 'ACTIVOS' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                Activos
                            </button>
                            <button
                                onClick={() => setClientType('PROSPECTOS')}
                                className={`px-2 py-0.5 text-[9.5px] font-black uppercase rounded cursor-pointer ${clientType === 'PROSPECTOS' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                Prospectos
                            </button>
                        </div>
                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className="h-6 text-[11px] font-extrabold bg-white border border-slate-300 rounded px-1.5 text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            {clients.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* PASO 2: CARGAR RUTA */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2 py-1 shadow-sm shrink-0">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">
                            2. CARGAR RUTA
                        </span>
                        <select
                            onChange={(e) => {
                                const rId = e.target.value;
                                if (!rId) return;
                                const r = routes.find(x => x.route_id === rId);
                                if (r) {
                                    setTramos([{
                                        type: 'LADEN',
                                        origin_port_id: r.origin_port_id,
                                        destination_port_id: r.destination_port_id,
                                        quantity: 0,
                                        freight_rate: 0,
                                        port_delay_hours_loading: 0,
                                        port_delay_hours_discharging: 0,
                                        route_distance: r.route_distance || r.distance || 0,
                                        weather_factor: 3.0,
                                        speed: 11.0
                                    }]);
                                }
                            }}
                            className="h-6 text-[11px] font-extrabold bg-white border border-slate-300 rounded px-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[160px]"
                        >
                            <option value="">[SELECCIONAR RUTA]</option>
                            {routes.map(r => (
                                <option key={r.route_id} value={r.route_id}>
                                    {r.origin_port_id} ➔ {r.destination_port_id}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* PASO 3: CARGAR COTIZACIÓN */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2 py-1 shadow-sm shrink-0">
                        <button
                            onClick={handleListRoutes}
                            className="h-6 text-[10px] font-black uppercase text-slate-700 hover:text-blue-700 flex items-center gap-1 cursor-pointer tracking-wider"
                        >
                            <FolderOpen size={13} className="text-blue-600" />
                            <span>3. CARGAR COTIZACIÓN</span>
                        </button>
                    </div>

                    {/* PASO 4: SELECCIONAR BUQUE */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2 py-1 shadow-sm shrink-0">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">
                            4. SELECCIONAR BUQUE
                        </span>
                        <select
                            value={selectedVessel}
                            onChange={(e) => handleVesselChange(e.target.value)}
                            className="h-6 text-[11px] font-extrabold bg-white border border-slate-300 rounded px-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="">[SELECCIONE BUQUE]</option>
                            {vessels.map(v => (
                                <option key={v.vessel_id} value={v.vessel_id}>{v.vessel_name || v.vessel_id}</option>
                            ))}
                        </select>
                    </div>





                </div>
            </div>

            {/* SECCIONES CONTINUAS PEGEDAS DIRECTAMENTE SOBRE EL FONDO BLANCO PRINCIPAL (SIN HUECOS NI GRISES) */}
            <div className="flex flex-col gap-2 w-full">
                {/* FACT SHEET CABECERA BUQUE */}
                <VesselFactSheetHeader
                    selectedVessel={selectedVessel}
                    vessels={vessels}
                    vesselParams={vesselParams}
                    bunkerPriceIfo={bunkerPriceIfo}
                    bunkerPriceMdo={bunkerPriceMdo}
                    bunkerSource={bunkerSource}
                    handleVesselParamChange={handleVesselParamChange}
                    handleIfoInputChange={(val) => setBunkerPriceIfo(val)}
                    handleMdoInputChange={(val) => setBunkerPriceMdo(val)}
                    handleBunkerSourceChange={(s: any) => setBunkerSource(s)}
                    fmtThousandSep={fmtThousandSep}
                />

                {/* GRILLA TABULAR TRAMOS Y PUERTOS */}
                <SpreadsheetTramosGrid
                    tramos={tramos}
                    puertosConfig={puertosConfig}
                    ports={ports}
                    vessels={vessels}
                    selectedVessel={selectedVessel}
                    result={result}
                    refacturarMuellajeMap={refacturarMuellajeMap}
                    calculatedTramosList={calculatedTramosList}
                    handleAddTramo={handleAddTramo}
                    handleRemoveLastTramo={handleRemoveLastTramo}
                    updateTramoField={updateTramoField}
                    updatePuertoConfigField={updatePuertoConfigField}
                    setRefacturarMuellajeMap={setRefacturarMuellajeMap}
                    getAutoPortRate={(portId, action) => PortCostsRatesService.resolveAutoPortRate(portId, action, ports)}
                    fmtCur={fmtCur}
                    fmtNum={fmtNum}
                    fmtDays={fmtDays}
                    fmtThousandSep={fmtThousandSep}
                />

                {/* TARJETAS FINANCIERAS Y RESULTADO DE VIAJE */}
                <FinancialResultCards
                    result={result}
                    bunkerPriceIfo={bunkerPriceIfo}
                    bunkerPriceMdo={bunkerPriceMdo}
                    puertosConfig={puertosConfig}
                    tramos={tramos}
                    vesselParams={vesselParams}
                    addressCommPct={addressCommPct}
                    brokerCommPct={brokerCommPct}
                    demurrageRate={demurrageRate}
                    commentsText={commentsText}
                    refacturarMuellajeMap={refacturarMuellajeMap}
                    setAddressCommPct={setAddressCommPct}
                    setBrokerCommPct={setBrokerCommPct}
                    setDemurrageRate={setDemurrageRate}
                    setCommentsText={setCommentsText}
                    getDynamicPortCostItems={getDynamicPortCostItems}
                    fmtCur={fmtCur}
                    fmtNum={fmtNum}
                    fmtDays={fmtDays}
                    fmtThousandSep={fmtThousandSep}
                />
            </div>

            {/* MODALES DE GRABAR Y CARGAR PERSISTENTES */}
            <SaveLoadQuoteModals
                showSaveModal={showSaveModal}
                showLoadModal={showLoadModal}
                routeName={routeName}
                isSaving={isSaving}
                isLoadingRoutes={isLoadingRoutes}
                savedRoutes={savedRoutes}
                selectedClient={selectedClient}
                setShowSaveModal={setShowSaveModal}
                setShowLoadModal={setShowLoadModal}
                setRouteName={setRouteName}
                handleSaveRoute={handleSaveRoute}
                handleLoadRoute={handleLoadRoute}
                handlePrintPDF={handlePrintPDF}
                getSuggestedRouteName={getSuggestedRouteName}
            />
        </div>
    );
};
