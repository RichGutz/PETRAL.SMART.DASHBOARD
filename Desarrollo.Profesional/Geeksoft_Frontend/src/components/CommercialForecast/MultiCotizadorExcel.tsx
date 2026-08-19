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
    
    // Estados de Vigencia / Validez (Paso 4) — Inicializan vacíos para obligar selección del usuario
    const [validFrom, setValidFrom] = useState<string>('');
    const [validTo, setValidTo] = useState<string>('');

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
    const [contractsList] = useState<any[]>([]);
    const [latestSpotPrices, setLatestSpotPrices] = useState<{ ifo: number; mdo: number }>({ ifo: 0, mdo: 0 });

    // 5. Grilla de Tramos & Configuración de Puertos
    const [tramos, setTramos] = useState<TramoState[]>([
        { type: 'BALLAST', origin_port_id: '', destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 },
        { type: 'LADEN', origin_port_id: '', destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 }
    ]);
    const [puertosConfig, setPuertosConfig] = useState<PuertoConfig[]>([
        { action: 'NONE', quantity: '', freight_rate: '', op_rate: '', rate_unit: 'TH', time_to_count: '', positioning: '', manual_port_cost: '' },
        { action: 'NONE', quantity: '', freight_rate: '', op_rate: '', rate_unit: 'TH', time_to_count: '', positioning: '', manual_port_cost: '' },
        { action: 'NONE', quantity: '', freight_rate: '', op_rate: '', rate_unit: 'TH', time_to_count: '', positioning: '', manual_port_cost: '' }
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
        'HUEMUL': 0,
        'MOQUEGUA': 0,
        'TABLONES': 0,
        'CONCON TRADER': 0,
        'CONCON': 0
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
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    };

    // Carga de Catálogos Iniciales (Mapeo a tablas reales BD)
    useEffect(() => {
        const init = async () => {
            try {
                const [vData, pData, cData, spotData, quoteList, latestBunker] = await Promise.all([
                    ForecastService.getVessels(),       // tabla: vessels
                    ForecastService.getPorts(),         // tabla: ports
                    ForecastService.getClients(),       // tabla: clients
                    ForecastService.getSpotVoyages(),   // tabla: routes_quotes (unificada)
                    MulticotizadorRetrieverService.searchSavedQuotes('', true, true, ''),
                    // SERIE 36: getContractsMaster() eliminado — contracts dado de baja
                    BunkerProviderService.fetchLatestBunkerPrices() // tabla: bunker_prices
                ]);
                setVessels(vData || []);
                
                // Ordenar puertos geográficamente de Norte (arriba) a Sur (abajo) según su latitud
                const sortedPortsData = [...(pData || [])].sort((a: any, b: any) => {
                    const latA = a.lat !== undefined && a.lat !== null ? parseFloat(a.lat) : (a.latitude !== undefined && a.latitude !== null ? parseFloat(a.latitude) : 0);
                    const latB = b.lat !== undefined && b.lat !== null ? parseFloat(b.lat) : (b.latitude !== undefined && b.latitude !== null ? parseFloat(b.latitude) : 0);
                    return latB - latA; // Mayor latitud (Norte) a menor latitud (Sur)
                });
                setPorts(sortedPortsData);

                setRawClients(cData || []);
                setSavedRoutes(quoteList || []);
                // SERIE 36: contractsList ya no se carga de BD. Se mantiene [] para compatibilidad con BunkerProviderService.
                setLatestSpotPrices(latestBunker || { ifo: 0, mdo: 0 });

                // Carga de rutas desde routes_quotes (tabla unificada)
                if (spotData && Array.isArray(spotData)) {
                    const allQuoteRoutes = spotData.filter((s: any) => s.table_source === 'routes_quotes' || s.is_quote === true || s.is_contract === true);
                    setRoutes(allQuoteRoutes);
                }

                // Detección y Carga Automática de Cotización enviada desde Maestros (sessionStorage)
                try {
                    const rawStored = sessionStorage.getItem('petral_load_quote');
                    if (rawStored) {
                        sessionStorage.removeItem('petral_load_quote');
                        const parsedQuote = JSON.parse(rawStored);
                        setTimeout(() => {
                            handleLoadRoute(parsedQuote);
                        }, 150);
                    }
                } catch (err) {
                    console.error("Error al recuperar cotización de sessionStorage:", err);
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
                // SERIE 35 FIX: En modo COTIZACION, los precios de bunker ya fueron seteados
                // DIRECTAMENTE por handleLoadRoute() (L.850-851) o handleSelectRoute() (L.817-818)
                // en el momento de cargar la cotización (ej: NEXA.ILO.CALLAO.MATARANI.ILO.2026 IZ).
                // Este useEffect NO debe re-buscar ni re-setear los precios porque:
                //   1. selectedRouteId no se actualiza en handleLoadRoute (queda en 'CREAR_RUTA')
                //   2. Re-ejecutar aquí pisa los valores correctos ya seteados desde la BD.
                // Los precios quedan PROTEGIDOS hasta que el usuario cambie la fuente explícitamente.
                return;
            } else if (bunkerSource === 'MAESTRO_BUNKER') {
                let spot = latestSpotPrices;
                if (!spot || spot.ifo === 0) {
                    spot = await BunkerProviderService.fetchLatestBunkerPrices();
                    setLatestSpotPrices(spot);
                }
                setBunkerPriceIfo(spot.ifo || 0);
                setBunkerPriceMdo(spot.mdo || 0);
            } else if (bunkerSource === 'SOBREESCRITURA') {
                // En modo SOBREESCRITURA se preservan intactos los valores tipeados manualmente por el usuario
            }
        };

        executeBunkerLookup();
    // SERIE 35 FIX: Removidos 'tramos' y 'latestSpotPrices' de las dependencias.
    // 'tramos' se actualizaba en handleLoadRoute y disparaba re-búsqueda espuria que pisaba precios de cotización.
    // 'latestSpotPrices' se resolvía async en init() y disparaba re-ejecución post-carga de cotización.
    // El branch MAESTRO_BUNKER hace su propio fetch interno cuando ifo === 0 (líneas 229-231).
    }, [bunkerSource, selectedClient, clientType, selectedRouteId, contractsList]);

    // Filtrado Dinámico e Instantáneo (en memoria) de Clientes (ACTIVOS vs PROSPECTOS) desde tabla clients
    useEffect(() => {
        const isProspectMode = clientType === 'PROSPECTOS';
        if (isProspectMode) {
            const list = (rawClients || [])
                .filter((c: any) => c.is_prospect === true || String(c.is_prospect).toLowerCase() === 'true')
                .map((c: any) => (c.client_id || c.client_name || '').trim())
                .filter(Boolean);
            setClients(Array.from(new Set(list)));
        } else {
            const list = (rawClients || [])
                .filter((c: any) => c.is_active === true || String(c.is_active).toLowerCase() === 'true' || (!c.is_prospect && c.is_prospect !== false))
                .map((c: any) => (c.client_id || c.client_name || '').trim())
                .filter(Boolean);
            setClients(Array.from(new Set(list)));
        }
    }, [clientType, rawClients]);

    // Manejador de Cambio de Buque
    const handleVesselChange = (vesselId: string, isAutoFillEnabled: boolean = false) => {
        setSelectedVessel(vesselId);
        if (!vesselId) return;
        const v = vessels.find(x => x.vessel_id === vesselId);
        if (v) {
            const resolved = VesselProviderService.extractVesselParams(vesselId, vessels);
            if (resolved) setVesselParams(resolved);
        }

        // AutoFill de costos portuarios SOLO si se está creando una nueva ruta/cotización desde cero
        if (isAutoFillEnabled) {
            puertosConfig.forEach((p, idx) => {
                const portId = idx === 0 ? (tramos[0]?.origin_port_id || '') : (tramos[idx - 1]?.destination_port_id || '');
                if (portId && p.action !== 'NONE') {
                    autoFillPortCost(idx, portId, p.action, vesselId);
                }
            });
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
                } else if (val === 'CARGAR' || val === 'DESCARGAR') {
                    if (list[idx].time_to_count === 0 || list[idx].time_to_count === '0') {
                        list[idx].time_to_count = '';
                    }
                    if (list[idx].positioning === 0 || list[idx].positioning === '0') {
                        list[idx].positioning = '';
                    }
                    const portId = idx === 0 ? (tramos[0]?.origin_port_id || '') : (tramos[idx - 1]?.destination_port_id || '');
                    if (portId) {
                        const autoRate = PortCostsRatesService.resolveAutoPortRate(portId, val, ports);
                        if (autoRate && (!list[idx].op_rate || list[idx].op_rate === 0 || list[idx].op_rate === '0')) {
                            list[idx].op_rate = autoRate;
                        }
                    }
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
            { action: 'NONE', quantity: '', freight_rate: '', op_rate: '', rate_unit: 'TH', time_to_count: '', positioning: '', manual_port_cost: '' }
        ]);
    };

    const handleRemoveLastTramo = () => {
        if (tramos.length <= 2) return; // Mínimo 2 tramos obligatorios (3 filas exactas en la tabla)
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

    const calculatedTramosList = getCalculatedTramos();

    // Orquestación Central Reactiva — Única Fuente de Verdad Inmune
    const liveCalculation = useMemo(() => {
        return MulticotizadorCalculationEngine.calculateVoyage({
            tramos: calculatedTramosList,
            puertosConfig,
            vesselParams,
            bunkerPriceIfo,
            bunkerPriceMdo,
            addressCommPct,
            brokerCommPct,
            refacturarMuellajeMap
        });
    }, [calculatedTramosList, puertosConfig, vesselParams, bunkerPriceIfo, bunkerPriceMdo, addressCommPct, brokerCommPct, refacturarMuellajeMap]);

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
        const rawPortsList: string[] = [];
        if (tramos[0]?.origin_port_id) rawPortsList.push(tramos[0].origin_port_id.trim().toUpperCase());
        tramos.forEach(tr => {
            if (tr.destination_port_id) rawPortsList.push(tr.destination_port_id.trim().toUpperCase());
        });
        // Deduplicar puertos adyacentes idénticos consecutivos (ej: ['ILO', 'ILO', 'MATARANI', 'ILO'] -> ['ILO', 'MATARANI', 'ILO'])
        const portsList = rawPortsList.filter((p, i) => i === 0 || p !== rawPortsList[i - 1]);
        const portsSeq = portsList.length > 0 ? portsList.join('.') : 'RUTA';
        return `${clientClean}.${portsSeq}.`;
    };

    const [saveTargetTable, setSaveTargetTable] = useState<'contracts' | 'routes_quotes'>('routes_quotes');
    const [saveNotification, setSaveNotification] = useState<{ message: string; detail: string; table: string; timestamp: string } | null>(null);

    const handleSaveRoute = async (saveOptions?: {
        targetClient?: string;
        targetClientType?: 'ACTIVOS' | 'PROSPECTOS';
        isContract?: boolean;
        finalName?: string;
    }) => {
        const effectiveClient = saveOptions?.targetClient || selectedClient;
        const effectiveClientType = saveOptions?.targetClientType || clientType;
        const isSavingContract = effectiveClientType === 'ACTIVOS' && (saveOptions?.isContract ?? (saveTargetTable === 'contracts'));
        const calculatedTramos = getCalculatedTramos();

        if (!effectiveClient || !effectiveClient.trim()) {
            alert("⚠️ Validación Requerida: Debe seleccionar un cliente destino válido antes de guardar.");
            return;
        }

        if (!validFrom || !validFrom.trim() || !validTo || !validTo.trim()) {
            alert("⚠️ Validación Requerida: Debe seleccionar las fechas de Inicio y Fin en el Paso 5 (VALIDEZ) antes de guardar.");
            return;
        }

        const prefix = getSuggestedRoutePrefix(effectiveClient);
        const finalName = saveOptions?.finalName || ((saveMode === 'OVERWRITE' && loadedRouteName && effectiveClient === selectedClient)
            ? loadedRouteName
            : `${prefix}${routeSuffix.trim() ? routeSuffix.trim() : '2026'}`);

        if (!finalName.trim()) return;
        setIsSaving(true);
        try {
            const activeUserEmail = localStorage.getItem('petral_user') 
                ? (JSON.parse(localStorage.getItem('petral_user')!).email || 'izavala@petral.com.pe')
                : 'izavala@petral.com.pe';

            const financialSummary = MulticotizadorCalculationEngine.calculateVoyage({
                tramos: calculatedTramos,
                puertosConfig,
                vesselParams,
                bunkerPriceIfo,
                bunkerPriceMdo,
                addressCommPct,
                brokerCommPct,
                refacturarMuellajeMap
            });

            await MulticotizadorStorageService.saveQuote({
                routeId: (saveMode === 'OVERWRITE' && effectiveClient === selectedClient) ? loadedRouteId : undefined,
                routeName: finalName,
                selectedClient: effectiveClient,
                filterProspecto: effectiveClientType === 'PROSPECTOS',
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
                demurrageRatesMap,
                commentsText,
                financialSummary,
                refacturarMuellajeMap,
                createdBy: activeUserEmail
            });
            setLoadedRouteName(finalName);
            setShowSaveModal(false);
            const [freshQuotes, freshRoutes] = await Promise.all([
                MulticotizadorRetrieverService.searchSavedQuotes('', true, true, ''),
                ForecastService.getRoutesMaster()
            ]);
            if (freshQuotes && Array.isArray(freshQuotes)) setSavedRoutes(freshQuotes);
            if (freshRoutes && Array.isArray(freshRoutes)) setRoutes(freshRoutes);

            const recordTypeDesc = isSavingContract 
                ? 'Ruta Cierres (Paso 2)' 
                : (effectiveClientType === 'PROSPECTOS' ? 'Cotización Prospecto (Paso 3)' : 'Cotizaciones (Paso 3)');

            setSaveNotification({
                message: `✅ ¡Guardado con Éxito en routes_quotes!`,
                detail: `"${finalName}" registrado como ${recordTypeDesc} para el cliente ${effectiveClient}.`,
                table: `routes_quotes`,
                timestamp: new Date().toLocaleTimeString()
            });
            setTimeout(() => setSaveNotification(null), 8000);
        } catch (e: any) {
            console.error("Error al guardar:", e);
            alert(`❌ Error al guardar en Supabase: ${e.message || e}`);
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
        setValidFrom('');
        setValidTo('');
        setTramos([
            { type: 'BALLAST', origin_port_id: '', destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 },
            { type: 'LADEN', origin_port_id: '', destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 }
        ]);
        setPuertosConfig([
            { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' },
            { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' },
            { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', time_to_count: 0, positioning: 0, manual_port_cost: '' }
        ]);

        const spotBunker = await BunkerProviderService.fetchLatestBunkerPrices();
        if (spotBunker.ifo > 0) setBunkerPriceIfo(spotBunker.ifo);
        if (spotBunker.mdo > 0) setBunkerPriceMdo(spotBunker.mdo);
        setBunkerSource('MAESTRO_BUNKER');
    };

    const handleLoadRoute = (quote: any) => {
        if (!quote) return;
        const clonedQuote = JSON.parse(JSON.stringify(quote));
        
        // 1. Identificadores de Ruta (Paso 2 / 3)
        const rKey = clonedQuote.name || clonedQuote.route_id || clonedQuote.spot_id || clonedQuote.id || '';
        setLoadedRouteName(rKey);
        setLoadedRouteId(clonedQuote.route_id || clonedQuote.client_route_id || clonedQuote.prospect_route_id || clonedQuote.spot_id || clonedQuote.id || '');
        setSelectedRouteId(rKey);
        setBunkerSource('COTIZACION');

        // 2. Cliente y Modo (Paso 1: ACTIVOS vs PROSPECTOS)
        const desc = (clonedQuote.description || '').trim();
        const isProspect = clonedQuote.is_prospect === true || String(clonedQuote.is_prospect).toLowerCase() === 'true' || desc.includes('Prospecto') || desc.includes('prospecto');
        setClientType(isProspect ? 'PROSPECTOS' : 'ACTIVOS');

        let extractedClient = clonedQuote.client_id || clonedQuote.legs_data?.client_id || clonedQuote.legs_data?.selectedClient || '';
        if (!extractedClient && rKey) {
            const parts = rKey.split('.');
            if (parts.length > 1) {
                extractedClient = parts[0];
            }
        }
        if (extractedClient) {
            setSelectedClient(extractedClient);
        }

        // 3. Validez Fechas (Paso 4: Inicio y Fin)
        const vFrom = clonedQuote.valid_from || clonedQuote.legs_data?.valid_from || clonedQuote.validity_start || clonedQuote.legs_data?.baf_valid_from || '';
        const vTo = clonedQuote.valid_to || clonedQuote.legs_data?.valid_to || clonedQuote.validity_end || clonedQuote.legs_data?.baf_valid_to || '';

        const formatToDateInput = (val: string) => {
            if (!val || val === 'Sin Fecha') return '';
            if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.substring(0, 10);
            if (/^\d{2}\/\d{2}\/\d{4}/.test(val)) {
                const [d, m, y] = val.split('/');
                return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
            return val;
        };

        if (vFrom) setValidFrom(formatToDateInput(vFrom));
        if (vTo) setValidTo(formatToDateInput(vTo));

        const unpacked = MulticotizadorRetrieverService.unpackQuoteData(clonedQuote);

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
                : buildPuertosConfigFromTramos(enrichedTramos, extractedClient || selectedClient);
            setPuertosConfig(pConfig);
        }

        // 4. Buque (Paso 5)
        const targetVessel = unpacked.vessel_id || clonedQuote.vessel_id || clonedQuote.legs_data?.vessel_id || '';
        if (targetVessel) {
            handleVesselChange(targetVessel, false);
        }

        // Precios de búnker y comisiones
        if (unpacked.bunker_price_ifo > 0) {
            setBunkerPriceIfo(unpacked.bunker_price_ifo);
        } else {
            setBunkerSource('MAESTRO_CONTRATOS');
        }
        if (unpacked.bunker_price_mdo > 0) {
            setBunkerPriceMdo(unpacked.bunker_price_mdo);
        }
        if (unpacked.addressCommPct !== undefined) setAddressCommPct(unpacked.addressCommPct);
        if (unpacked.brokerCommPct !== undefined) setBrokerCommPct(unpacked.brokerCommPct);
        if (unpacked.vesselParams) setVesselParams(unpacked.vesselParams);

        // Demurrage (Estadías por Buque) guardado con fallback 0
        if (unpacked.demurrage_rates && typeof unpacked.demurrage_rates === 'object') {
            setDemurrageRatesMap(unpacked.demurrage_rates);
        } else {
            setDemurrageRatesMap({
                'HUEMUL': 0,
                'MOQUEGUA': 0,
                'TABLONES': 0,
                'CONCON TRADER': 0,
                'CONCON': 0
            });
        }

        // Bandas Tarifarias (Tariff Tiers) guardadas con fallback 0
        if (unpacked.tariff_tiers && Array.isArray(unpacked.tariff_tiers) && unpacked.tariff_tiers.length > 0) {
            setTariffTiers(unpacked.tariff_tiers);
        } else {
            setTariffTiers([
                { label: '', rate: 0 },
                { label: '', rate: 0 },
                { label: '', rate: 0 },
                { label: '', rate: 0 }
            ]);
        }

        // Parámetros BAF guardados
        if (unpacked.baf_formula !== undefined) setBafFormula(unpacked.baf_formula);
        if (unpacked.baf_valid_from) setBafValidFrom(formatToDateInput(unpacked.baf_valid_from));
        if (unpacked.baf_valid_to) setBafValidTo(formatToDateInput(unpacked.baf_valid_to));
        if (unpacked.baf_ifo_base !== undefined) setBafIfoBase(Number(unpacked.baf_ifo_base) || 0);
        if (unpacked.baf_mdo_base !== undefined) setBafMdoBase(Number(unpacked.baf_mdo_base) || 0);

        // Comentarios guardados
        if (unpacked.comments_text !== undefined) setCommentsText(unpacked.comments_text);

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

    const filteredRoutes = React.useMemo(() => {
        if (!selectedClient) return [];
        const sClient = selectedClient.trim().toUpperCase();
        return savedRoutes.filter(r => {
            const nameUpper = (r.name || r.route_id || '').toUpperCase();
            const cid = (r.client_id || '').toUpperCase();
            const matchesClient = cid === sClient || nameUpper.startsWith(sClient);
            const desc = (r.description || '').trim();
            const isCOA = desc.includes('COA') || desc === 'COA Cliente Activo';
            return matchesClient && isCOA;
        });
    }, [savedRoutes, selectedClient]);

    const filteredQuotes = React.useMemo(() => {
        if (!selectedClient) return [];
        const sClient = selectedClient.trim().toUpperCase();
        const isProspectMode = clientType === 'PROSPECTOS';
        return savedRoutes.filter(q => {
            const nameUpper = (q.name || q.route_id || '').toUpperCase();
            const cid = (q.client_id || '').toUpperCase();
            const matchesClient = cid === sClient || nameUpper.startsWith(sClient);
            const desc = (q.description || '').trim();
            const isProspect = desc.includes('Prospecto') || desc.includes('prospecto');
            if (isProspectMode) {
                return matchesClient && isProspect;
            } else {
                const isCOA = desc.includes('COA') || desc === 'COA Cliente Activo';
                return matchesClient && !isCOA && !isProspect;
            }
        });
    }, [savedRoutes, selectedClient, clientType]);

    return (
        <div className="w-full min-h-screen bg-white p-2 text-slate-800 font-sans flex flex-col select-text">
            {/* BARRA UNIFICADA Y ESTANDARIZADA DE PASOS COMERCIALES (1 A 5) - SISTEMA DE DISEÑO APEFAC ENTERPRISE LIGHT */}
            <div className="bg-white border border-slate-200 rounded-xl p-2 mb-2 select-none flex-shrink-0 overflow-x-auto shadow-xs">
                <div className="flex items-center gap-2 flex-nowrap min-w-max">
                    
                    {/* PASO 1: CLIENTE */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 shadow-2xs shrink-0 hover:border-slate-300 transition-all">
                        <div className="w-7 h-7 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center font-black text-[11px] shadow-2xs">
                            1
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap">
                                    CLIENTE
                                </span>
                                <div className="flex rounded bg-white p-0.5 border border-slate-200 shadow-2xs">
                                    <button
                                        onClick={() => {
                                            setClientType('ACTIVOS');
                                            setSelectedClient('');
                                            setSelectedRouteId('CREAR_RUTA');
                                        }}
                                        className={`px-1.5 py-0.2 text-[8px] font-black uppercase rounded cursor-pointer transition-colors ${clientType === 'ACTIVOS' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        Activos
                                    </button>
                                    <button
                                        onClick={() => {
                                            setClientType('PROSPECTOS');
                                            setSelectedClient('');
                                            setSelectedRouteId('CREAR_RUTA');
                                        }}
                                        className={`px-1.5 py-0.2 text-[8px] font-black uppercase rounded cursor-pointer transition-colors ${clientType === 'PROSPECTOS' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        Prospectos
                                    </button>
                                </div>
                            </div>
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className={`h-6 text-[10px] font-extrabold border rounded-md px-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer ${!selectedClient ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-white border-slate-200 text-sky-900 shadow-2xs'}`}
                            >
                                <option value="">[SELECCIONAR CLIENTE]</option>
                                {clients.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* PASO 2: RUTA (COA Cliente Activo) */}
                    <div className={`flex items-center gap-2 border rounded-lg p-1.5 shadow-2xs shrink-0 transition-all ${clientType === 'PROSPECTOS' ? 'bg-slate-100 border-slate-200 opacity-50' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center font-black text-[11px] ${clientType === 'PROSPECTOS' ? 'bg-slate-200 text-slate-400' : 'bg-sky-100 text-sky-700 shadow-2xs'}`}>
                            2
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className={`text-[10px] font-extrabold uppercase tracking-tight whitespace-nowrap ${clientType === 'PROSPECTOS' ? 'text-slate-400' : 'text-slate-800'}`}>
                                RUTA COA
                            </span>
                            <select
                                value={selectedRouteId}
                                disabled={clientType === 'PROSPECTOS'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedRouteId(val);
                                    setSaveTargetTable('routes_quotes');
                                    if (val === 'CREAR_RUTA') {
                                        handleCreateNewGrid();
                                        return;
                                    }
                                    const r = savedRoutes.find(x => (x.name || x.route_id || x.spot_id || x.id) === val);
                                    if (r) handleLoadRoute(r);
                                }}
                                className={`h-6 text-[10px] font-extrabold border rounded-md px-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 ${clientType === 'PROSPECTOS' ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-800 border-slate-200 cursor-pointer shadow-2xs'}`}
                            >
                                <option value="CREAR_RUTA">➕ NUEVA RUTA COA</option>
                                {filteredRoutes.map(r => {
                                    const rKey = r.name || r.route_id || r.id || r.spot_id;
                                    return (
                                        <option key={rKey} value={rKey}>
                                            {r.name || r.route_id}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    {/* PASO 3: COTIZACIÓN */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 shadow-2xs shrink-0 hover:border-slate-300 transition-all">
                        <div className="w-7 h-7 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-black text-[11px] shadow-2xs">
                            3
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap">
                                COTIZACIÓN
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
                                className="h-6 text-[10px] font-extrabold border rounded-md px-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white text-slate-800 border-slate-200 cursor-pointer shadow-2xs"
                            >
                                <option value="CREAR_RUTA">
                                    {clientType === 'PROSPECTOS' ? '➕ NUEVA COTIZACIÓN PROSPECTO' : '➕ NUEVA COTIZACIÓN SPOT'}
                                </option>
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
                    </div>

                    {/* PASO 4: VALIDEZ (FECHA INICIO Y FIN) */}
                    <div className={`flex items-center gap-2 border rounded-lg p-1.5 shadow-2xs shrink-0 transition-all ${!validFrom || !validTo ? 'border-amber-300 bg-amber-50/60' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[11px] shadow-2xs">
                            4
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight whitespace-nowrap flex items-center gap-1">
                                <Calendar size={11} className="text-emerald-600" />
                                <span>VALIDEZ</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-1">
                                    <label className="text-[8px] font-extrabold text-slate-500 uppercase">Inicio:</label>
                                    <input
                                        type="date"
                                        value={validFrom}
                                        onChange={(e) => setValidFrom(e.target.value)}
                                        className="h-6 text-[9.5px] font-mono font-bold bg-white border border-slate-200 rounded-md px-1 text-sky-900 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
                                    />
                                </div>
                                <div className="flex items-center gap-1">
                                    <label className="text-[8px] font-extrabold text-slate-500 uppercase">Fin:</label>
                                    <input
                                        type="date"
                                        value={validTo}
                                        onChange={(e) => setValidTo(e.target.value)}
                                        className="h-6 text-[9.5px] font-mono font-bold bg-white border border-slate-200 rounded-md px-1 text-sky-900 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PASO 5: BUQUE (BLOQUEADO HASTA COMPLETAR PASO 4 VALIDEZ) */}
                    {(() => {
                        const isValidezComplete = Boolean(validFrom && validTo);
                        return (
                            <div 
                                className={`flex items-center gap-2 border rounded-lg p-1.5 shadow-2xs shrink-0 transition-all ${
                                    !isValidezComplete 
                                        ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed' 
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                }`}
                                title={!isValidezComplete ? 'Complete las fechas de Validez (Paso 4) para habilitar la selección de Buque' : ''}
                            >
                                <div className={`w-7 h-7 rounded-md flex items-center justify-center font-black text-[11px] ${!isValidezComplete ? 'bg-slate-200 text-slate-400' : 'bg-indigo-100 text-indigo-700 shadow-2xs'}`}>
                                    5
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className={`text-[10px] font-extrabold uppercase tracking-tight whitespace-nowrap ${!isValidezComplete ? 'text-slate-400' : 'text-slate-800'}`}>
                                        BUQUE
                                    </span>
                                    <select
                                        value={selectedVessel}
                                        disabled={!isValidezComplete}
                                        onChange={(e) => handleVesselChange(e.target.value)}
                                        className={`h-6 text-[10px] font-extrabold border rounded-md px-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                            !isValidezComplete 
                                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                                                : 'bg-white border-slate-200 text-slate-800 cursor-pointer shadow-2xs'
                                        }`}
                                    >
                                        <option value="">[SELECCIONAR BUQUE]</option>
                                        {vessels.map(v => (
                                            <option key={v.vessel_id} value={v.vessel_id}>{v.vessel_name || v.vessel_id}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        );
                    })()}

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
                    handleIfoInputChange={(val) => { setBunkerPriceIfo(val); setBunkerSource('SOBREESCRITURA'); }}
                    handleMdoInputChange={(val) => { setBunkerPriceMdo(val); setBunkerSource('SOBREESCRITURA'); }}
                    handleBunkerSourceChange={(s: any) => setBunkerSource(s)}
                    fmtThousandSep={fmtThousandSep}
                />

                {/* GRILLA TABULAR TRAMOS Y PUERTOS (ÚNICA FUENTE DE VERDAD) */}
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
                    liveCalc={liveCalculation}
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

                {/* TARJETAS FINANCIERAS Y RESULTADO DE VIAJE (ÚNICA FUENTE DE VERDAD) */}
                <FinancialResultCards
                    result={result}
                    liveCalc={liveCalculation}
                    bunkerPriceIfo={bunkerPriceIfo}
                    bunkerPriceMdo={bunkerPriceMdo}
                    puertosConfig={puertosConfig}
                    tramos={calculatedTramosList}
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
                rawClients={rawClients}
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
