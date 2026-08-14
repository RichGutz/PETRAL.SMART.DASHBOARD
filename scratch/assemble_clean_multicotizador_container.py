import os

path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

clean_container_code = """import React, { useState, useEffect } from 'react';
import { ForecastService } from '../../services/api';
import { Save, FolderOpen, X, ChevronDown } from 'lucide-react';
import logoPetral from '../../assets/Logo.Petral.png';
import logoGeeksoft from '../../assets/Logo.Geeksoft.png';

// Servicios Provistos (Providers)
import { VesselProviderService } from '../../services/providers/vesselProviderService';
import { BunkerProviderService } from '../../services/providers/bunkerProviderService';
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

export const MultiCotizadorExcel: React.FC = () => {
    // 1. Estados de Navegación & Pestañas
    const [activeMainTab, setActiveMainTab] = useState<'calc' | 'audit' | 'json'>('calc');
    const [clientType, setClientType] = useState<'ACTIVOS' | 'PROSPECTOS'>('ACTIVOS');
    const [selectedClient, setSelectedClient] = useState<string>('SPCC');

    // 2. Estados de Catálogos & Contratos
    const [vessels, setVessels] = useState<any[]>([]);
    const [ports, setPorts] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [rawClients, setRawClients] = useState<any[]>([]);
    const [clients, setClients] = useState<string[]>([]);
    const [contractsMaster, setContractsMaster] = useState<any[]>([]);

    // 3. Selección de Buque y Fact Sheet
    const [selectedVessel, setSelectedVessel] = useState<string>('');
    const [vesselParams, setVesselParams] = useState<any>({
        grt: 0, dwt: 0, dwcc: 0, vessel_speed: 11.0, tce_required: 15000,
        length: 0, beam: 0, draft_m: 0,
        consumption_sea_ifo: 0, consumption_idle_ifo: 0, consumption_load_ifo: 0, consumption_disch_ifo: 0,
        consumption_sea_mdo: 0, consumption_idle_mdo: 0, consumption_load_mdo: 0, consumption_disch_mdo: 0
    });

    // 4. Búnker y Fuertes de Precios
    const [bunkerSource, setBunkerSource] = useState<'MAESTRO_CONTRATOS' | 'COTIZACION' | 'MAESTRO_BUNKER' | 'SOBREESCRITURA'>('MAESTRO_CONTRATOS');
    const [bunkerPriceIfo, setBunkerPriceIfo] = useState<number>(0);
    const [bunkerPriceMdo, setBunkerPriceMdo] = useState<number>(0);

    // 5. Grilla de Tramos & Configuración de Puertos
    const [tramos, setTramos] = useState<TramoState[]>([
        { type: 'LADEN', origin_port_id: '', destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 11.0 }
    ]);
    const [puertosConfig, setPuertosConfig] = useState<PuertoConfig[]>([
        { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' },
        { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' }
    ]);

    // 6. Comisiones, Demurrage & Refacturación
    const [addressCommPct, setAddressCommPct] = useState<number>(0);
    const [brokerCommPct, setBrokerCommPct] = useState<number>(0);
    const [demurrageRate, setDemurrageRate] = useState<number>(20000);
    const [commentsText, setCommentsText] = useState<string>('');
    const [refacturarMuellajeMap, setRefacturarMuellajeMap] = useState<Record<number, boolean>>({});
    const [localPortCostMode, setLocalPortCostMode] = useState<'static' | 'matrix'>('static');

    // 7. Resultados & Persistencia Modales
    const [result, setResult] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
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

    // Carga de Catálogos & Contratos Iniciales
    useEffect(() => {
        const init = async () => {
            try {
                const [vData, pData, rData, cData, contractsData] = await Promise.all([
                    ForecastService.getVessels(),
                    ForecastService.getPorts(),
                    ForecastService.getRoutes(),
                    ForecastService.getClients(),
                    ForecastService.getContractsMaster()
                ]);
                setVessels(vData || []);
                setPorts(pData || []);
                setRoutes(rData || []);
                setRawClients(cData || []);
                setContractsMaster(contractsData || []);
                const cList = (cData || []).map((c: any) => typeof c === 'string' ? c : c.client_name || c.client_id || '');
                setClients(Array.from(new Set(cList.filter(Boolean))));
            } catch (e) {
                console.error("Error cargando catálogos:", e);
            }
        };
        init();
    }, []);

    // Consulta de Contratos & Auto-poblado (Zero Fallbacks Rule)
    useEffect(() => {
        if (tramos.length === 0) return;

        tramos.forEach((tr, idx) => {
            const match = PortCostsRatesService.lookupContractInfo(
                contractsMaster,
                selectedClient,
                tr.origin_port_id,
                tr.destination_port_id,
                Number(puertosConfig[idx + 1]?.quantity || tr.quantity || 0)
            );

            if (match.has_contract) {
                if (match.address_commission > 0) setAddressCommPct(match.address_commission);
                if (match.broker_commission > 0) setBrokerCommPct(match.broker_commission);

                setPuertosConfig(prev => {
                    const list = [...prev];
                    if (list[idx]) {
                        list[idx].time_to_count = match.time_to_count_origin;
                        list[idx].positioning = match.positioning_origin;
                        if (list[idx].action === 'CARGAR' && match.load_rate > 0) {
                            list[idx].op_rate = match.load_rate;
                        }
                    }
                    if (list[idx + 1]) {
                        list[idx + 1].time_to_count = match.time_to_count_dest;
                        list[idx + 1].positioning = match.positioning_dest;
                        if (list[idx + 1].action === 'DESCARGAR') {
                            if (match.discharge_rate > 0) list[idx + 1].op_rate = match.discharge_rate;
                            if (match.freight_rate > 0) list[idx + 1].freight_rate = match.freight_rate;
                        }
                    }
                    return list;
                });
            } else {
                setPuertosConfig(prev => {
                    const list = [...prev];
                    if (list[idx] && list[idx].action === 'NONE') {
                        list[idx].time_to_count = 0;
                        list[idx].positioning = 0;
                    }
                    if (list[idx + 1] && list[idx + 1].action === 'NONE') {
                        list[idx + 1].time_to_count = 0;
                        list[idx + 1].positioning = 0;
                    }
                    return list;
                });
            }
        });

        if (selectedVessel) {
            puertosConfig.forEach((p, idx) => {
                if (p.action !== 'NONE') {
                    const portId = idx === 0 ? (tramos[0]?.origin_port_id || '') : (tramos[idx - 1]?.destination_port_id || '');
                    if (portId) {
                        autoFillPortCost(idx, portId, p.action, selectedVessel);
                    }
                }
            });
        }
    }, [selectedClient, selectedVessel, localPortCostMode, tramos[0]?.origin_port_id, tramos[0]?.destination_port_id, contractsMaster.length]);

    // Manejador de Cambio de Buque
    const handleVesselChange = (vesselId: string) => {
        setSelectedVessel(vesselId);
        if (!vesselId) return;
        const v = vessels.find(x => x.vessel_id === vesselId);
        if (v) {
            const resolved = VesselProviderService.extractVesselParams(v);
            setVesselParams(resolved);
        }
    };

    const handleVesselParamChange = (field: string, val: any) => {
        setVesselParams((prev: any) => ({ ...prev, [field]: val }));
    };

    const autoFillPortCost = async (idx: number, portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR', vId: string) => {
        if (!vId || !portId || action === 'NONE') return;
        const res = await PortCostsRatesService.lookupPortCost(vId, portId, action, localPortCostMode);
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
                const auto = RouteDistancesService.getAutoRouteInfo(list[index].origin_port_id, list[index].destination_port_id, list[index].type, routes);
                list[index].route_distance = auto.route_distance;
                list[index].weather_factor = auto.weather_factor;
            }
            if (field === 'destination_port_id' && index < list.length - 1) {
                list[index + 1].origin_port_id = value;
                const autoNext = RouteDistancesService.getAutoRouteInfo(list[index + 1].origin_port_id, list[index + 1].destination_port_id, list[index + 1].type, routes);
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
        if (tramos.length <= 1) return;
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
        setIsCalculating(true);
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
                port_cost_mode: localPortCostMode,
                client_id: selectedClient,
                address_commission_pct: addressCommPct,
                broker_commission_pct: brokerCommPct,
                demurrage_rate: demurrageRate,
                tramos: payloadTramos
            };

            const data = await ForecastService.calculateMulticotizador(payload);
            setResult(data);
        } catch (e) {
            console.error("Error en simulación:", e);
        } finally {
            setIsCalculating(false);
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
            const payload = {
                name: routeName,
                client_id: selectedClient,
                vessel_id: selectedVessel,
                bunker_prices: { ifo: bunkerPriceIfo, mdo: bunkerPriceMdo },
                tramos,
                puertos_config: puertosConfig,
                comments: commentsText
            };
            await MulticotizadorStorageService.saveQuote(payload);
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
            const list = await MulticotizadorRetrieverService.getQuotes(selectedClient);
            setSavedRoutes(list || []);
        } catch (e) {
            console.error("Error listando cotizaciones:", e);
        } finally {
            setIsLoadingRoutes(false);
        }
    };

    const handleLoadRoute = (quote: any) => {
        if (!quote) return;
        const unpacked = MulticotizadorRetrieverService.unpackQuote(quote);
        if (unpacked.tramos) setTramos(unpacked.tramos);
        if (unpacked.puertosConfig) setPuertosConfig(unpacked.puertosConfig);
        if (unpacked.vesselId) setSelectedVessel(unpacked.vesselId);
        if (unpacked.comments) setCommentsText(unpacked.comments);
        setShowLoadModal(false);
    };

    const handlePrintPDF = () => {
        window.print();
    };

    const calculatedTramosList = getCalculatedTramos();

    return (
        <div className="w-full min-h-screen bg-slate-100 p-2 md:p-4 text-slate-800 font-sans flex flex-col justify-between">
            {/* CABECERA SUPERIOR Y SELECCIÓN DE CLIENTE Y RUTA */}
            <div className="bg-white border border-slate-300 rounded shadow-sm p-2 mb-3 select-none flex-shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2">
                    <div className="flex items-center gap-3">
                        <img src={logoPetral} alt="PETRAL" className="h-7 object-contain" />
                        <span className="font-extrabold text-slate-400 text-sm font-mono">/</span>
                        <img src={logoGeeksoft} alt="GEEKSOFT" className="h-6 object-contain" />
                        <h1 className="text-base font-black tracking-tight text-slate-800 uppercase ml-2">
                            MULTICOTIZADOR <span className="text-blue-600 font-bold text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200">📌 {selectedClient || 'PETRAL'}</span>
                        </h1>
                    </div>

                    {/* BARRA DE 5 PASOS PROCESO COMERCIAL */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-250">
                            <span className="text-[10.5px] font-bold text-slate-500 uppercase px-1">1. SELECCIONAR CLIENTE</span>
                            <div className="flex rounded bg-white p-0.5 border border-slate-200">
                                <button
                                    onClick={() => setClientType('ACTIVOS')}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${clientType === 'ACTIVOS' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    Activos
                                </button>
                                <button
                                    onClick={() => setClientType('PROSPECTOS')}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${clientType === 'PROSPECTOS' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    Prospectos
                                </button>
                            </div>
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="h-7 text-xs font-bold bg-white border border-slate-300 rounded px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                                {clients.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <button
                            onClick={handleListRoutes}
                            className="h-7 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 rounded border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                            <FolderOpen size={14} /> 3. CARGAR COTIZACIÓN
                        </button>

                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-250">
                            <span className="text-[10.5px] font-bold text-slate-500 uppercase px-1">4. SELECCIONAR BUQUE</span>
                            <select
                                value={selectedVessel}
                                onChange={(e) => handleVesselChange(e.target.value)}
                                className="h-7 text-xs font-bold bg-white border border-slate-300 rounded px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="">[SELECCIONE BUQUE]</option>
                                {vessels.map(v => (
                                    <option key={v.vessel_id} value={v.vessel_id}>{v.vessel_name || v.vessel_id}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

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
                getAutoPortTimeToCount={(portId, action) => 0}
                getAutoPortPositioning={(portId, action) => 0}
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
"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(clean_container_code)

print("CLEAN MODULAR CONTAINER MultiCotizadorExcel.tsx WRITTEN SUCCESSFULLY!")
