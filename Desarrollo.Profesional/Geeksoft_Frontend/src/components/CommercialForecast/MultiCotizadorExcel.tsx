import React, { useState, useEffect } from 'react';
import { ForecastService } from '../../services/api';
import { Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Servicios Provistos (Providers)
import { VesselProviderService } from '../../services/providers/vesselProviderService';
import { RouteDistancesService } from '../../services/providers/routeDistancesService';
import { PortCostsRatesService } from '../../services/providers/portCostsRatesService';
import { MulticotizadorStorageService } from '../../services/providers/multicotizadorStorageService';
import { MulticotizadorRetrieverService } from '../../services/providers/multicotizadorRetrieverService';
import { BunkerProviderService } from '../../services/providers/bunkerProviderService';
import { MulticotizadorPdfPrintService } from '../../services/providers/multicotizadorPdfPrintService';

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
    const { user } = useAuth();
    // 1. Estados de Navegación & Pestañas
    const [clientType, setClientType] = useState<'ACTIVOS' | 'PROSPECTOS'>('ACTIVOS');
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [selectedRouteId, setSelectedRouteId] = useState<string>('CREAR_RUTA');
    
    // Estados de Vigencia / Validez (Paso 5)
    const [validFrom, setValidFrom] = useState<string>(new Date().toISOString().split('T')[0]);
    const [validTo, setValidTo] = useState<string>(
        new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    );

    // 2. Estados de Catálogos, Contratos & Etiquetas UX
    const [vessels, setVessels] = useState<any[]>([]);
    const [ports, setPorts] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [rawClients, setRawClients] = useState<any[]>([]);
    const [clients, setClients] = useState<string[]>([]);

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
    const [contractsList, setContractsList] = useState<any[]>([]);
    const [latestSpotPrices, setLatestSpotPrices] = useState<{ ifo: number; mdo: number }>({ ifo: 0, mdo: 0 });

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

    // 6. Comisiones, Demurrage & BAF
    const [addressCommPct, setAddressCommPct] = useState<number>(0);
    const [brokerCommPct, setBrokerCommPct] = useState<number>(0);
    const [demurrageRate, setDemurrageRate] = useState<number>(20000);
    const [commentsText, setCommentsText] = useState<string>('');
    const [bafFormula, setBafFormula] = useState<string>('');
    const [bafValidFrom, setBafValidFrom] = useState<string>('');
    const [bafValidTo, setBafValidTo] = useState<string>('');
    const [bafIfoBase, setBafIfoBase] = useState<number>(0);
    const [bafMdoBase, setBafMdoBase] = useState<number>(0);
    const [tariffTiers, setTariffTiers] = useState<any[]>([
        { label: '', rate: 0 },
        { label: '', rate: 0 },
        { label: '', rate: 0 },
        { label: '', rate: 0 }
    ]);
    const [demurrageRatesMap, setDemurrageRatesMap] = useState<Record<string, number>>({
        'HUEMUL': 20000,
        'MOQUEGUA': 20000,
        'TABLONES': 20000,
        'CONCON TRADER': 20000
    });
    const [refacturarMuellajeMap, setRefacturarMuellajeMap] = useState<Record<number, boolean>>({});

    // 7. Resultados & Persistencia Modales
    const [result, setResult] = useState<any>(null);
    const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
    const [showLoadModal, setShowLoadModal] = useState<boolean>(false);
    const [routeSuffix, setRouteSuffix] = useState<string>('2026');
    const [saveMode, setSaveMode] = useState<'OVERWRITE' | 'NEW'>('NEW');
    const [loadedRouteName, setLoadedRouteName] = useState<string>('');
    const [loadedRouteId, setLoadedRouteId] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);
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
                const [vData, pData, cData, spotData, quoteList, contractsData, latestBunker] = await Promise.all([
                    ForecastService.getVessels(),       // tabla: vessels
                    ForecastService.getPorts(),         // tabla: ports
                    ForecastService.getClients(),       // tabla: clients
                    ForecastService.getSpotVoyages(),   // tabla: routes_clients / routes_quotes
                    MulticotizadorRetrieverService.searchSavedQuotes('', true, true, ''),
                    ForecastService.getContractsMaster(), // tabla: contracts
                    BunkerProviderService.fetchLatestBunkerPrices() // tabla: bunker_prices
                ]);
                setVessels(vData || []);
                setPorts(pData || []);
                setRawClients(cData || []);
                setSavedRoutes(quoteList || []);
                setContractsList(contractsData || []);
                setLatestSpotPrices(latestBunker || { ifo: 0, mdo: 0 });

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

    // Ejecución Reactiva de Búsqueda de Búnker según Fuente y Parámetros
    useEffect(() => {
        const executeBunkerLookup = async () => {
            if (bunkerSource === 'MAESTRO_CONTRATOS') {
                const destPorts = tramos.map(t => t.destination_port_id).filter(Boolean);
                const isProspect = clientType === 'PROSPECTOS';
                const resolved = BunkerProviderService.resolveContractPricesForClient(
                    selectedClient,
                    isProspect,
                    destPorts,
                    contractsList,
                    latestSpotPrices
                );
                setBunkerPriceIfo(resolved.ifo > 0 ? resolved.ifo : (latestSpotPrices.ifo || 0));
                setBunkerPriceMdo(resolved.mdo > 0 ? resolved.mdo : (latestSpotPrices.mdo || 0));
            } else if (bunkerSource === 'COTIZACION') {
                if (selectedRouteId && selectedRouteId !== 'CREAR_RUTA') {
                    const q = savedRoutes.find(x => (x.name || x.route_id || x.spot_id || x.id) === selectedRouteId);
                    if (q) {
                        const unpacked = MulticotizadorRetrieverService.unpackQuoteData(q);
                        setBunkerPriceIfo(unpacked.bunker_price_ifo || latestSpotPrices.ifo || 0);
                        setBunkerPriceMdo(unpacked.bunker_price_mdo || latestSpotPrices.mdo || 0);
                    }
                } else {
                    setBunkerPriceIfo(latestSpotPrices.ifo || 0);
                    setBunkerPriceMdo(latestSpotPrices.mdo || 0);
                }
            } else if (bunkerSource === 'MAESTRO_BUNKER') {
                let spot = latestSpotPrices;
                if (!spot || spot.ifo === 0) {
                    spot = await BunkerProviderService.fetchLatestBunkerPrices();
                    setLatestSpotPrices(spot);
                }
                setBunkerPriceIfo(spot.ifo || 0);
                setBunkerPriceMdo(spot.mdo || 0);
            } else if (bunkerSource === 'SOBREESCRITURA') {
                setBunkerPriceIfo(0);
                setBunkerPriceMdo(0);
            }
        };

        executeBunkerLookup();
    }, [bunkerSource, selectedClient, clientType, tramos, selectedRouteId, contractsList, latestSpotPrices]);

    // Filtrado Dinámico e Instantáneo (en memoria) de Clientes (ACTIVOS vs PROSPECTOS)
    useEffect(() => {
        const isProspectMode = clientType === 'PROSPECTOS';
        
        if (isProspectMode) {
            const prospectDefaults = ['MARCOBRE', 'PRIMAX', 'CODELCO', 'R TRADING', 'CERRO VERDE', 'PROSPECTO GENERAL'];
            const dbProspects: string[] = [];
            (rawClients || []).forEach((c: any) => {
                if (c.is_prospect === true || String(c.is_prospect).toLowerCase() === 'true') {
                    const name = c.client_name || c.client_id || '';
                    if (name) dbProspects.push(name.trim());
                }
            });
            const finalList = Array.from(new Set([...dbProspects, ...prospectDefaults].filter(Boolean)));
            setClients(finalList);
        } else {
            const activoDefaults = ['SPCC', 'NEXA'];
            const dbActivos: string[] = [];
            (rawClients || []).forEach((c: any) => {
                if (!c.is_prospect || c.is_prospect === false || String(c.is_prospect).toLowerCase() === 'false') {
                    const name = c.client_name || c.client_id || '';
                    if (name) dbActivos.push(name.trim());
                }
            });
            const finalList = Array.from(new Set([...dbActivos, ...activoDefaults].filter(Boolean)));
            setClients(finalList);
        }
    }, [clientType, rawClients]);

    // Manejador de Cambio de Buque
    const handleVesselChange = (vesselId: string) => {
        setSelectedVessel(vesselId);
        if (!vesselId) return;
        const v = vessels.find(x => x.vessel_id === vesselId);
        if (v) {
            const resolved = VesselProviderService.extractVesselParams(vesselId, vessels);
            if (resolved) setVesselParams(resolved);
        }

        // Barrido automático de costos portuarios estáticos al seleccionar buque
        puertosConfig.forEach((p, idx) => {
            const portId = idx === 0 ? (tramos[0]?.origin_port_id || '') : (tramos[idx - 1]?.destination_port_id || '');
            if (portId && p.action !== 'NONE') {
                autoFillPortCost(idx, portId, p.action, vesselId);
            }
        });
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
                if (Number(auto.route_distance) > 0) {
                    list[index].route_distance = auto.route_distance;
                }
                if (auto.weather_factor) {
                    list[index].weather_factor = auto.weather_factor;
                }
                if (!list[index].speed || Number(list[index].speed) <= 0) {
                    const currentVessel = vessels.find(v => v.vessel_id === selectedVessel);
                    list[index].speed = currentVessel?.vessel_speed || vesselParams?.vessel_speed || 11.0;
                }
            }
            if (field === 'destination_port_id' && index < list.length - 1) {
                list[index + 1].origin_port_id = value;
                const autoNext = RouteDistancesService.resolveAutoRouteInfo(list[index + 1].origin_port_id, list[index + 1].destination_port_id, list[index + 1].type, routes);
                if (Number(autoNext.route_distance) > 0) {
                    list[index + 1].route_distance = autoNext.route_distance;
                }
                if (autoNext.weather_factor) {
                    list[index + 1].weather_factor = autoNext.weather_factor;
                }
                if (!list[index + 1].speed || Number(list[index + 1].speed) <= 0) {
                    const currentVessel = vessels.find(v => v.vessel_id === selectedVessel);
                    list[index + 1].speed = currentVessel?.vessel_speed || vesselParams?.vessel_speed || 11.0;
                }
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

        if (field === 'freight_rate' && idx > 0) {
            setTramos(prev => {
                const updated = [...prev];
                if (updated[idx - 1]) {
                    updated[idx - 1] = { ...updated[idx - 1], freight_rate: Number(val) || 0 };
                }
                return updated;
            });
        }

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
        puertosConfig.forEach((p, pIdx) => {
            if (p.action !== 'NONE') {
                const portId = pIdx === 0 ? (tramos[0]?.origin_port_id || '') : (tramos[pIdx - 1]?.destination_port_id || '');
                if (portId) {
                    const isMejillonesDischarge = portId.trim().toUpperCase() === 'MEJILLONES' && p.action === 'DESCARGAR';
                    const muellajeVal = Number(p.muellaje_cost) || (isMejillonesDischarge ? 33333 : 0);
                    const costVal = Number(p.manual_port_cost) || (isMejillonesDischarge ? 33333 : 0);
                    items.push({
                        label: `${pIdx === 0 ? 'POL' : 'POD'} (${portId})`,
                        cost: costVal,
                        muellaje_cost: muellajeVal,
                        port_id: portId,
                        role: pIdx === 0 ? 'POL' : 'POD',
                        pIndex: pIdx
                    });
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
                    dest_op_rate: pDest.op_rate || 400,
                    time_to_count_carga_hrs: Number(pOrig.time_to_count !== undefined && pOrig.time_to_count !== '' ? pOrig.time_to_count : (pOrig.overhead ?? 0)) || 0,
                    time_to_count_descarga_hrs: Number(pDest.time_to_count !== undefined && pDest.time_to_count !== '' ? pDest.time_to_count : (pDest.overhead ?? 0)) || 0,
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
    const getSuggestedRoutePrefix = (client: string) => {
        const clientClean = (client || 'CLIENTE').trim().toUpperCase();
        const portsList: string[] = [];
        if (tramos[0]?.origin_port_id) portsList.push(tramos[0].origin_port_id.trim().toUpperCase());
        tramos.forEach(tr => {
            if (tr.destination_port_id) portsList.push(tr.destination_port_id.trim().toUpperCase());
        });
        const portsSeq = portsList.length > 0 ? portsList.join('.') : 'RUTA';
        return `${clientClean}.${portsSeq}.`;
    };

    const [saveTargetTable, setSaveTargetTable] = useState<'contracts' | 'routes_quotes'>('contracts');
    const [saveNotification, setSaveNotification] = useState<{ message: string; detail: string; table: string; timestamp: string } | null>(null);

    const handleSaveRoute = async () => {
        const isSavingContract = clientType === 'ACTIVOS' && saveTargetTable === 'contracts';
        const calculatedTramos = getCalculatedTramos();
        const masterName = isSavingContract ? "Maestro de Rutas COA" : "Maestro de Cotizaciones";
        const tableSource = isSavingContract ? "contracts" : "routes_quotes";

        if (isSavingContract) {
            // Validación estricta para guardar un Contrato Formal (contracts)
            if (!selectedClient || !selectedClient.trim()) {
                alert(`⚠️ Validación de Contrato: Debe seleccionar un cliente activo válido antes de guardar en el ${masterName}.`);
                return;
            }
            if (!selectedVessel || !selectedVessel.trim()) {
                alert(`⚠️ Validación de Contrato: Para registrar un Contrato Formal en el ${masterName} (${tableSource}) se requiere seleccionar un Buque asignado en el Paso 4.`);
                return;
            }
            if (!validFrom || !validFrom.trim() || !validTo || !validTo.trim()) {
                alert("⚠️ Validación de Contrato: Debe completar las fechas de Inicio y Fin de Validez (Paso 5).");
                return;
            }
            const hasValidLadenTramo = calculatedTramos.some(tr => 
                (tr.type === 'LADEN' || tr.desc_tons > 0 || tr.quantity > 0) &&
                (Number(tr.desc_tons || tr.quantity || 0) > 0) &&
                (Number(tr.freight_rate || 0) > 0)
            );
            if (!hasValidLadenTramo) {
                alert(`⚠️ Validación de Contrato: Para registrar en el ${masterName} (${tableSource}) se requiere al menos un tramo de carga (LADEN) con Tonelaje > 0 MT y Tarifa de Flete > $0/MT.`);
                return;
            }
        } else {
            // Validación estándar para Cotizaciones (routes_quotes)
            if (!validFrom || !validFrom.trim() || !validTo || !validTo.trim()) {
                alert("⚠️ Validación Requerida: Debe seleccionar las fechas de Inicio y Fin en el Paso 5 (VALIDEZ) antes de guardar.");
                return;
            }
        }

        const prefix = getSuggestedRoutePrefix(selectedClient);
        const finalName = (saveMode === 'OVERWRITE' && loadedRouteName)
            ? loadedRouteName
            : `${prefix}${routeSuffix.trim() ? routeSuffix.trim() : '2026'}`;

        if (!finalName.trim()) return;
        setIsSaving(true);
        try {
            await MulticotizadorStorageService.saveQuote({
                routeId: saveMode === 'OVERWRITE' ? loadedRouteId : undefined,
                routeName: finalName,
                selectedClient,
                filterProspecto: clientType === 'PROSPECTOS' || !isSavingContract,
                isContract: isSavingContract,
                selectedVessel,
                bunkerPriceIfo,
                bunkerPriceMdo,
                tramosEnriquecidos: calculatedTramos,
                puertosConfig,
                vesselParams,
                addressCommPct,
                brokerCommPct,
                rawClients,
                validFrom,
                validTo,
                bafFormula,
                bafValidFrom,
                bafValidTo,
                bafIfoBase,
                bafMdoBase,
                tariffTiers,
                demurrageRatesMap
            });
            setLoadedRouteName(finalName);
            setShowSaveModal(false);
            const [freshContracts, freshQuotes, freshRoutes] = await Promise.all([
                ForecastService.getContractsMaster(),
                MulticotizadorRetrieverService.searchSavedQuotes('', true, true, ''),
                ForecastService.getRoutesMaster()
            ]);
            if (freshContracts && Array.isArray(freshContracts)) setContractsList(freshContracts);
            if (freshQuotes && Array.isArray(freshQuotes)) setSavedRoutes(freshQuotes);
            if (freshRoutes && Array.isArray(freshRoutes)) setRoutes(freshRoutes);

            const successMsg = `✅ Se grabó correctamente en el ${masterName} (${tableSource})\n📌 Nombre: ${finalName}`;
            setSaveNotification({
                message: `Se grabó correctamente en el ${masterName} (${tableSource})`,
                detail: finalName,
                table: tableSource,
                timestamp: new Date().toLocaleTimeString()
            });
            alert(successMsg);
        } catch (e) {
            console.error("Error guardando registro comercial:", e);
        } finally {
            setIsSaving(false);
        }
    };

    const buildPuertosConfigFromTramos = (tramosList: any[], client: string) => {
        if (!tramosList || tramosList.length === 0) return [];
        
        const clientClean = (client || '').trim().toUpperCase();
        const clientContracts = (contractsList || []).filter((c: any) => {
            const cName = (c.client_name || c.client_id || '').trim().toUpperCase();
            return cName === clientClean || cName.includes(clientClean) || clientClean.includes(cName);
        });

        const config: any[] = [];
        const t0 = tramosList[0] || {};
        const polId = (t0.origin_port_id || '').trim().toUpperCase();
        
        // Fila 0: POL (Origen del viaje)
        const polContract = clientContracts.find((c: any) => (c.origin_port_id || '').trim().toUpperCase() === polId) || clientContracts[0];
        const action0 = (t0.origin_action === 'CARGAR' || (t0.type === 'LADEN' && t0.origin_action !== 'NONE')) ? 'CARGAR' : 'NONE';
        const is0Loading = action0 === 'CARGAR';
        
        config.push({
            action: action0,
            time_to_count: !is0Loading ? 0 : (polContract?.time_to_count_carga_hrs ?? t0.time_to_count_carga_hrs ?? 6),
            overhead: !is0Loading ? 0 : (polContract?.time_to_count_carga_hrs ?? t0.time_to_count_carga_hrs ?? 6),
            op_rate: !is0Loading ? 0 : (polContract?.load_rate ?? t0.origin_op_rate ?? 500),
            rate_unit: t0.rate_unit_origin || 'TH',
            quantity: is0Loading ? (t0.quantity || 13500) : 0,
            freight_rate: is0Loading ? (t0.freight_rate ?? 0) : 0,
            positioning: !is0Loading ? 0 : (polContract?.maneuver_carga_hrs ?? t0.positioning_carga_hrs ?? 1),
            manual_port_cost: !is0Loading ? '' : (t0.manual_agency_cost_origin ?? polContract?.agency_cost ?? (polId === 'CALLAO' ? 17000 : polId === 'MATARANI' ? 18000 : ''))
        });

        // Filas 1..N: POD (Destinos de cada tramo)
        tramosList.forEach((tr: any, idx: number) => {
            const podId = (tr.destination_port_id || '').trim().toUpperCase();
            const podContract = clientContracts.find((c: any) => 
                (c.origin_port_id || '').trim().toUpperCase() === podId ||
                (c.destination_port_id || c.destination_port || '').trim().toUpperCase() === podId
            ) || clientContracts[0];

            const nextTramo = tramosList[idx + 1];

            let actionN: 'NONE' | 'CARGAR' | 'DESCARGAR' = 'NONE';
            if (tr.destination_action) {
                actionN = tr.destination_action;
            } else if (tr.type === 'BALLAST' && nextTramo && nextTramo.type === 'LADEN') {
                actionN = 'CARGAR';
            } else if (tr.type === 'LADEN') {
                actionN = 'DESCARGAR';
            }

            const isCargar = actionN === 'CARGAR';
            const isDescargar = actionN === 'DESCARGAR';
            const hasAction = isCargar || isDescargar;

            let ttc = 0;
            let opRate = 0;
            let pos = 0;

            if (isCargar) {
                ttc = podContract?.time_to_count_carga_hrs ?? tr.time_to_count_carga_hrs ?? 6;
                opRate = podContract?.load_rate ?? (clientClean === 'NEXA' ? 500 : 500);
                pos = podContract?.maneuver_carga_hrs ?? tr.positioning_carga_hrs ?? 1;
            } else if (isDescargar) {
                ttc = podContract?.time_to_count_descarga_hrs ?? tr.time_to_count_descarga_hrs ?? 6;
                opRate = podContract?.discharge_rate ?? (clientClean === 'NEXA' ? 400 : 500);
                pos = podContract?.maneuver_descarga_hrs ?? tr.positioning_descarga_hrs ?? 0;
            }

            const qVal = hasAction ? (tr.quantity || tr.desc_tons || 13500) : 0;
            const fVal = (tr.freight_rate !== undefined && tr.freight_rate !== null && tr.freight_rate !== '')
                ? Number(tr.freight_rate)
                : (isDescargar ? 30 : 0);

            // PURIFICACIÓN DE COSTOS DE PUERTO (CERO FALLBACK 20000 BACKEND LEGACY)
            const rawManualCost = tr.manual_agency_cost_dest ?? tr.manual_port_cost;
            const isMejillones = podId === 'MEJILLONES' && isDescargar;
            const pCost = hasAction
                ? (rawManualCost !== undefined && rawManualCost !== null && rawManualCost !== '' 
                    ? rawManualCost 
                    : (podContract?.agency_cost ?? (podId === 'CALLAO' ? 17000 : podId === 'MATARANI' ? 18000 : (isMejillones ? 33333 : ''))))
                : '';
            const mCost = isMejillones ? 33333 : Number(tr.muellaje_cost || 0);

            config.push({
                action: actionN,
                time_to_count: ttc,
                overhead: ttc,
                op_rate: opRate,
                rate_unit: tr.rate_unit_destination || 'TH',
                quantity: qVal,
                freight_rate: fVal,
                positioning: pos,
                manual_port_cost: pCost,
                muellaje_cost: mCost
            });
        });

        return config;
    };

    const handleCreateNewGrid = async () => {
        setLoadedRouteName('');
        setTramos([
            { type: 'BALLAST', origin_port_id: '', destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 },
            { type: 'LADEN', origin_port_id: '', destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 },
            { type: 'BALLAST', origin_port_id: '', destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 }
        ]);
        setPuertosConfig([
            { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' },
            { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' },
            { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' },
            { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' }
        ]);

        const spotBunker = await BunkerProviderService.fetchLatestBunkerPrices();
        if (spotBunker.ifo > 0) setBunkerPriceIfo(spotBunker.ifo);
        if (spotBunker.mdo > 0) setBunkerPriceMdo(spotBunker.mdo);
        setBunkerSource('MAESTRO_BUNKER');
    };

    const handleSelectRoute = (routeId: string) => {
        if (!routeId) return;
        if (routeId === 'CREAR_RUTA') {
            handleCreateNewGrid();
            return;
        }
        const r = contractsList.find(x => x.name === routeId || x.route_id === routeId || x.id === routeId || x.spot_id === routeId)
               || savedRoutes.find(x => x.name === routeId || x.route_id === routeId || x.id === routeId || x.spot_id === routeId)
               || routes.find(x => x.name === routeId || x.route_id === routeId || x.id === routeId || x.spot_id === routeId);
        if (!r) return;

        setLoadedRouteName(r.name || r.route_id || '');
        setLoadedRouteId(r.route_id || r.client_route_id || r.prospect_route_id || r.spot_id || r.id || '');
        setBunkerSource('MAESTRO_CONTRATOS');

        const legsData = r.legs_data || {};
        const tramosList = legsData.tramos || [];

        if (tramosList.length > 0) {
            const enrichedTramos = tramosList.map((tr: any) => {
                const auto = RouteDistancesService.resolveAutoRouteInfo(tr.origin_port_id, tr.destination_port_id, tr.type, routes);
                return {
                    ...tr,
                    route_distance: (Number(tr.route_distance) > 0) ? tr.route_distance : (auto.route_distance || 0),
                    weather_factor: (tr.weather_factor !== undefined && tr.weather_factor !== null && Number(tr.weather_factor) > 0) ? tr.weather_factor : (auto.weather_factor || 3.0),
                    speed: (Number(tr.speed) > 0) ? tr.speed : 11.0
                };
            });
            setTramos(enrichedTramos);
            const resolvedConfig = (legsData.puertosConfig && Array.isArray(legsData.puertosConfig) && legsData.puertosConfig.length === tramosList.length + 1)
                ? legsData.puertosConfig.map((p: any) => ({
                    ...p,
                    time_to_count: (p.time_to_count !== undefined && p.time_to_count !== '') 
                        ? p.time_to_count 
                        : (p.overhead !== undefined && p.overhead !== '' ? p.overhead : (p.action !== 'NONE' ? 6 : '')),
                    overhead: p.overhead ?? p.time_to_count ?? (p.action !== 'NONE' ? 6 : '')
                }))
                : buildPuertosConfigFromTramos(enrichedTramos, selectedClient);
            setPuertosConfig(resolvedConfig);
        } else if (r.origin_port_id && r.destination_port_id) {
            const auto = RouteDistancesService.resolveAutoRouteInfo(r.origin_port_id, r.destination_port_id, 'LADEN', routes);
            const singleTramo = [{
                type: 'LADEN' as 'LADEN' | 'BALLAST',
                origin_port_id: r.origin_port_id,
                destination_port_id: r.destination_port_id,
                quantity: 0,
                freight_rate: 0,
                port_delay_hours_loading: selectedClient === 'NEXA' ? 12 : 6,
                port_delay_hours_discharging: selectedClient === 'NEXA' ? 12 : 6,
                route_distance: r.route_distance || r.distance || auto.route_distance || 0,
                weather_factor: r.weather_factor || auto.weather_factor || 3.0,
                speed: 11.0
            }];
            setTramos(singleTramo);
            setPuertosConfig(buildPuertosConfigFromTramos(singleTramo, selectedClient));
        }

        const ifo = Number(legsData.bunker_price_ifo ?? r.bunker_price_ifo ?? (selectedClient === 'NEXA' ? 450 : selectedClient === 'SPCC' ? 895.14 : 967.26));
        const mdo = Number(legsData.bunker_price_mdo ?? r.bunker_price_mdo ?? (selectedClient === 'NEXA' ? 800 : selectedClient === 'SPCC' ? 1460.30 : 1528.26));

        if (ifo > 0) setBunkerPriceIfo(ifo);
        if (mdo > 0) setBunkerPriceMdo(mdo);

        if (legsData.addressCommPct !== undefined) setAddressCommPct(Number(legsData.addressCommPct));
        if (legsData.brokerCommPct !== undefined) setBrokerCommPct(Number(legsData.brokerCommPct));
        if (legsData.vessel_id || r.vessel_id) handleVesselChange(legsData.vessel_id || r.vessel_id);
    };

    const handleLoadRoute = (quote: any) => {
        if (!quote) return;
        setLoadedRouteName(quote.name || quote.route_id || quote.spot_id || '');
        setLoadedRouteId(quote.route_id || quote.client_route_id || quote.prospect_route_id || quote.spot_id || quote.id || '');
        setBunkerSource('COTIZACION');
        const unpacked = MulticotizadorRetrieverService.unpackQuoteData(quote);

        if (unpacked.tramos && unpacked.tramos.length > 0) {
            const enrichedTramos = unpacked.tramos.map((tr: any) => {
                const auto = RouteDistancesService.resolveAutoRouteInfo(tr.origin_port_id, tr.destination_port_id, tr.type, routes);
                return {
                    ...tr,
                    route_distance: (Number(tr.route_distance) > 0) ? tr.route_distance : (auto.route_distance || 0),
                    weather_factor: (tr.weather_factor !== undefined && tr.weather_factor !== null && Number(tr.weather_factor) > 0) ? tr.weather_factor : (auto.weather_factor || 3.0),
                    speed: (Number(tr.speed) > 0) ? tr.speed : 11.0
                };
            });
            setTramos(enrichedTramos);
            const pConfig = (unpacked.puertosConfig && unpacked.puertosConfig.length > 0)
                ? unpacked.puertosConfig
                : buildPuertosConfigFromTramos(enrichedTramos, selectedClient);
            setPuertosConfig(pConfig);
        }

        if (unpacked.vessel_id) handleVesselChange(unpacked.vessel_id);
        if (unpacked.bunker_price_ifo > 0) setBunkerPriceIfo(unpacked.bunker_price_ifo);
        if (unpacked.bunker_price_mdo > 0) setBunkerPriceMdo(unpacked.bunker_price_mdo);
        if (unpacked.addressCommPct !== undefined) setAddressCommPct(unpacked.addressCommPct);
        if (unpacked.brokerCommPct !== undefined) setBrokerCommPct(unpacked.brokerCommPct);
        if (unpacked.vesselParams) setVesselParams(unpacked.vesselParams);

        setShowLoadModal(false);
    };

    const handlePrintPDF = () => {
        MulticotizadorPdfPrintService.printDocument({
            clientType,
            selectedClient,
            selectedRouteName: loadedRouteName || selectedRouteId,
            selectedRouteId: loadedRouteId || selectedRouteId,
            selectedVessel,
            validFrom,
            validTo,
            vessels,
            vesselParams,
            bunkerSource,
            bunkerPriceIfo,
            bunkerPriceMdo,
            tramos,
            puertosConfig,
            ports,
            refacturarMuellajeMap,
            addressCommPct,
            brokerCommPct,
            commentsText,
            bafFormula,
            bafValidFrom,
            bafValidTo,
            bafIfoBase,
            bafMdoBase,
            tariffTiers,
            demurrageRatesMap,
            printedBy: user?.full_name || user?.email || 'Usuario Comercial'
        });
    };

    const calculatedTramosList = getCalculatedTramos();

    const filteredRoutes = React.useMemo(() => {
        if (!selectedClient) return contractsList;
        const sClient = selectedClient.trim().toUpperCase();
        return contractsList.filter(r => {
            const nameUpper = (r.name || r.route_id || '').toUpperCase();
            const cid = (r.client_id || (nameUpper.startsWith('SPCC') ? 'SPCC' : 'NEXA')).toUpperCase();
            return cid === sClient || nameUpper.startsWith(sClient);
        });
    }, [contractsList, selectedClient]);

    const filteredQuotes = React.useMemo(() => {
        if (!selectedClient) return savedRoutes;
        const sClient = selectedClient.trim().toUpperCase();
        return savedRoutes.filter(q => {
            const nameUpper = (q.name || q.route_id || '').toUpperCase();
            const cid = (q.client_id || (nameUpper.startsWith('SPCC') ? 'SPCC' : 'NEXA')).toUpperCase();
            return cid === sClient || nameUpper.startsWith(sClient);
        });
    }, [savedRoutes, selectedClient]);

    return (
        <div className="w-full min-h-screen bg-white p-2 text-slate-800 font-sans flex flex-col select-text">
            {/* BARRA UNIFICADA Y ESTANDARIZADA DE PASOS COMERCIALES (1 A 5) - UNA SOLA FILA HORIZONTAL (FLEX-NOWRAP) */}
            <div className="bg-slate-50 border border-slate-300 rounded p-1.5 mb-2 select-none flex-shrink-0 overflow-x-auto">
                <div className="flex items-center gap-1.5 flex-nowrap min-w-max">
                    
                    {/* PASO 1: CLIENTE */}
                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-1.5 py-0.5 shadow-xs shrink-0">
                        <span className="text-[8.5px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">
                            1. CLIENTE
                        </span>
                        <div className="flex rounded bg-slate-100 p-0.5 border border-slate-200">
                            <button
                                onClick={() => {
                                    setClientType('ACTIVOS');
                                    setSelectedClient('');
                                    setSelectedRouteId('CREAR_RUTA');
                                }}
                                className={`px-1.5 py-0.2 text-[8px] font-black uppercase rounded cursor-pointer ${clientType === 'ACTIVOS' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                Activos
                            </button>
                            <button
                                onClick={() => {
                                    setClientType('PROSPECTOS');
                                    setSelectedClient('');
                                    setSelectedRouteId('CREAR_RUTA');
                                }}
                                className={`px-1.5 py-0.2 text-[8px] font-black uppercase rounded cursor-pointer ${clientType === 'PROSPECTOS' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                Prospectos
                            </button>
                        </div>
                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className={`h-5.5 text-[9.5px] font-extrabold border rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${!selectedClient ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold' : 'bg-white border-slate-300 text-blue-900'}`}
                        >
                            <option value="">[SELECCIONAR CLIENTE]</option>
                            {clients.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* PASO 2: RUTA (JALA DE CONTRACTS -> GRABA EN CONTRACTS) */}
                    <div className={`flex items-center gap-1 border rounded px-1.5 py-0.5 shadow-xs shrink-0 transition-opacity ${clientType === 'PROSPECTOS' ? 'bg-slate-100 border-slate-200 opacity-50' : 'bg-white border-slate-300'}`}>
                        <span className={`text-[8.5px] font-black uppercase tracking-wider whitespace-nowrap ${clientType === 'PROSPECTOS' ? 'text-slate-400' : 'text-slate-700'}`}>
                            2. RUTA
                        </span>
                        <select
                            value={selectedRouteId}
                            disabled={clientType === 'PROSPECTOS'}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedRouteId(val);
                                setSaveTargetTable('contracts');
                                if (val === 'CREAR_RUTA') {
                                    handleCreateNewGrid();
                                    return;
                                }
                                handleSelectRoute(val);
                            }}
                            className={`h-5.5 text-[9.5px] font-extrabold border rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 ${clientType === 'PROSPECTOS' ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-800 border-slate-300 cursor-pointer'}`}
                        >
                            <option value="CREAR_RUTA">➕ NUEVA RUTA (`contracts`)</option>
                            {filteredRoutes.map(r => {
                                const rKey = r.name || r.route_id || r.id || r.spot_id;
                                const routeLabel = r.name || (r.origin_port_id && r.destination_port_id ? `${r.origin_port_id} ➔ ${r.destination_port_id}` : r.route_id);
                                return (
                                    <option key={rKey} value={rKey}>
                                        {routeLabel}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* PASO 3: COTIZACIÓN */}
                    <div className="flex items-center gap-1 border rounded px-1.5 py-0.5 shadow-xs shrink-0 bg-white border-slate-300">
                        <span className="text-[8.5px] font-black uppercase tracking-wider whitespace-nowrap text-slate-700">
                            3. COTIZACIÓN
                        </span>
                        <select
                            value={selectedRouteId}
                            disabled={false}
                            onChange={(e) => {
                                const qId = e.target.value;
                                setSelectedRouteId(qId);
                                setSaveTargetTable('routes_quotes');
                                if (!qId) return;
                                if (qId === 'CREAR_RUTA') {
                                    handleCreateNewGrid();
                                    return;
                                }
                                const q = savedRoutes.find(x => (x.name || x.route_id || x.spot_id || x.id) === qId);
                                if (q) handleLoadRoute(q);
                            }}
                            className="h-5.5 text-[9.5px] font-extrabold border rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 border-slate-300 cursor-pointer"
                        >
                            <option value="CREAR_RUTA">➕ NUEVA COTIZACIÓN (`routes_quotes`)</option>
                            {filteredQuotes.map(q => {
                                const qKey = q.name || q.route_id || q.spot_id || q.id;
                                return (
                                    <option key={qKey} value={qKey}>
                                        {q.name || q.route_id || 'COTIZACIÓN'}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* PASO 4: BUQUE */}
                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-1.5 py-0.5 shadow-xs shrink-0">
                        <span className="text-[8.5px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">
                            4. BUQUE
                        </span>
                        <select
                            value={selectedVessel}
                            onChange={(e) => handleVesselChange(e.target.value)}
                            className="h-5.5 text-[9.5px] font-extrabold bg-white border border-slate-300 rounded px-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="">[SELECCIONAR BUQUE]</option>
                            {vessels.map(v => (
                                <option key={v.vessel_id} value={v.vessel_id}>{v.vessel_name || v.vessel_id}</option>
                            ))}
                        </select>
                    </div>

                    {/* PASO 5: VALIDEZ (FECHA INICIO Y FIN) */}
                    <div className={`flex items-center gap-1 bg-white border rounded px-1.5 py-0.5 shadow-xs shrink-0 ${!validFrom || !validTo ? 'border-amber-400 bg-amber-50/50' : 'border-slate-300'}`}>
                        <span className="text-[8.5px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
                            <Calendar size={11} className="text-blue-600" />
                            <span>5. VALIDEZ</span>
                        </span>
                        <div className="flex items-center gap-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase">Inicio:</label>
                            <input
                                type="date"
                                value={validFrom}
                                onChange={(e) => setValidFrom(e.target.value)}
                                className="h-5.5 text-[9px] font-mono font-bold bg-white border border-slate-300 rounded px-1 text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase">Fin:</label>
                            <input
                                type="date"
                                value={validTo}
                                onChange={(e) => setValidTo(e.target.value)}
                                className="h-5.5 text-[9px] font-mono font-bold bg-white border border-slate-300 rounded px-1 text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            />
                        </div>
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
                    bunkerPriceIfo={bunkerPriceIfo}
                    bunkerPriceMdo={bunkerPriceMdo}
                    vesselParams={vesselParams}
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
                    vessels={vessels}
                    selectedVessel={selectedVessel}
                    vesselParams={vesselParams}
                    addressCommPct={addressCommPct}
                    brokerCommPct={brokerCommPct}
                    demurrageRate={demurrageRate}
                    commentsText={commentsText}
                    bafFormula={bafFormula}
                    bafValidFrom={bafValidFrom}
                    bafValidTo={bafValidTo}
                    bafIfoBase={bafIfoBase}
                    bafMdoBase={bafMdoBase}
                    tariffTiers={tariffTiers}
                    demurrageRatesMap={demurrageRatesMap}
                    refacturarMuellajeMap={refacturarMuellajeMap}
                    setAddressCommPct={setAddressCommPct}
                    setBrokerCommPct={setBrokerCommPct}
                    setDemurrageRate={setDemurrageRate}
                    setCommentsText={setCommentsText}
                    setBafFormula={setBafFormula}
                    setBafValidFrom={setBafValidFrom}
                    setBafValidTo={setBafValidTo}
                    setBafIfoBase={setBafIfoBase}
                    setBafMdoBase={setBafMdoBase}
                    setTariffTiers={setTariffTiers}
                    setDemurrageRatesMap={setDemurrageRatesMap}
                    getDynamicPortCostItems={getDynamicPortCostItems}
                    fmtCur={fmtCur}
                    fmtNum={fmtNum}
                    fmtDays={fmtDays}
                    fmtThousandSep={fmtThousandSep}
                />
            </div>

            {/* BANNER PERSISTENTE DE CONFIRMACIÓN DE GUARDADO */}
            {saveNotification && (
                <div className="bg-emerald-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-md shadow-lg border border-emerald-700 flex items-center justify-between mt-2 animate-in fade-in slide-in-from-bottom duration-200">
                    <div className="flex items-center gap-2">
                        <span className="text-base">✅</span>
                        <div>
                            <span>{saveNotification.message}</span>
                            <span className="ml-2 bg-emerald-800 px-2 py-0.5 rounded text-[11px] font-mono text-emerald-100 border border-emerald-600">
                                📌 Nombre: {saveNotification.detail}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSaveNotification(null)}
                        className="text-emerald-200 hover:text-white font-bold text-xs px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-800 transition-colors cursor-pointer"
                    >
                        ✕ Cerrar
                    </button>
                </div>
            )}

            {/* MODALES DE GRABAR Y CARGAR PERSISTENTES */}
            <SaveLoadQuoteModals
                showSaveModal={showSaveModal}
                showLoadModal={showLoadModal}
                routeSuffix={routeSuffix}
                saveMode={saveMode}
                saveTargetTable={saveTargetTable}
                setSaveTargetTable={setSaveTargetTable}
                loadedRouteName={loadedRouteName}
                clientType={clientType}
                selectedClient={selectedClient}
                isSaving={isSaving}
                isLoadingRoutes={false}
                savedRoutes={savedRoutes}
                setShowSaveModal={setShowSaveModal}
                setShowLoadModal={setShowLoadModal}
                setRouteSuffix={setRouteSuffix}
                setSaveMode={setSaveMode}
                handleSaveRoute={handleSaveRoute}
                handleLoadRoute={handleLoadRoute}
                handlePrintPDF={handlePrintPDF}
                getSuggestedRoutePrefix={getSuggestedRoutePrefix}
            />
        </div>
    );
};
