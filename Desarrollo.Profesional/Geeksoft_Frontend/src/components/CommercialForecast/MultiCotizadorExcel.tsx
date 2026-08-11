import React, { useState, useEffect } from 'react';
import { ForecastService } from '../../services/api';
import { Save, FolderOpen, X } from 'lucide-react';
import logoPetral from '../../assets/Logo.Petral.png';
import logoGeeksoft from '../../assets/Logo.Geeksoft.png';

interface TramoState {
    type: 'BALLAST' | 'LADEN';
    origin_port_id: string;
    destination_port_id: string;
    quantity: string | number;
    freight_rate: string | number;
    port_delay_hours_loading: string | number;
    port_delay_hours_discharging: string | number;
    route_distance?: string | number;
    weather_factor?: string | number; // Almacenado como porcentaje legible, ej. 3.0 para 3%
    speed?: string | number;
}

interface PuertoConfig {
    action: 'NONE' | 'CARGAR' | 'DESCARGAR';
    quantity: string | number;
    freight_rate: string | number;
    op_rate: string | number; // Ritmo de operación
    rate_unit?: 'TD' | 'TH'; // Unidad de ritmo: TD (Ton/Día), TH (Ton/Hora)
    overhead?: string | number;
    positioning?: string | number;
    manual_port_cost?: string | number;
}

export const MultiCotizadorExcel: React.FC<{ portCostMode?: 'static' | 'matrix' }> = ({ portCostMode = 'static' }) => {
    const [localPortCostMode, setLocalPortCostMode] = useState<'static' | 'matrix'>(portCostMode || 'static');
    const [activeMainTab, setActiveMainTab] = useState<'estimator' | 'audit'>('estimator');
    const [vessels, setVessels] = useState<any[]>([]);
    const [selectedVessel, setSelectedVessel] = useState('');
    const [ports, setPorts] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [clients, setClients] = useState<string[]>([]);
    const [rawClients, setRawClients] = useState<any[]>([]);
    const [filterActivo, setFilterActivo] = useState(true);
    const [filterProspecto, setFilterProspecto] = useState(false);
    const [selectedClient, setSelectedClient] = useState('');

    // Helpers de Formato con Separadores de Miles para Q (MT) y Costo Pto
    const fmtThousandSep = (val: number | string | undefined | null): string => {
        if (val === undefined || val === null || val === '') return '';
        const raw = String(val).replace(/,/g, '');
        const num = Number(raw);
        if (isNaN(num)) return String(val);
        return num.toLocaleString('en-US');
    };

    const fmtCurrencySep = (val: number | string | undefined | null): string => {
        if (val === undefined || val === null || val === '') return '';
        const raw = String(val).replace(/[^0-9.]/g, '');
        const num = Number(raw);
        if (isNaN(num)) return String(val);
        return '$' + Math.round(num).toLocaleString('en-US');
    };

    // Comisiones
    const [addressCommPct, setAddressCommPct] = useState<number>(0);
    const [brokerCommPct, setBrokerCommPct] = useState<number>(0);
    
    // Precios de bunker configurables (inicializados en 0, sin fallbacks silenciosos)
    const [bunkerPriceIfo, setBunkerPriceIfo] = useState<number>(0);
    const [bunkerPriceMdo, setBunkerPriceMdo] = useState<number>(0);
    const [bunkerDate, setBunkerDate] = useState<string>('Cargando...');
    const [contractsMaster, setContractsMaster] = useState<any[]>([]);

    // Particularidades y consumos del buque editable
    const [vesselParams, setVesselParams] = useState<any>({
        vessel_id: '',
        vessel_name: '',
        grt: '',
        dwt: '',
        dwcc: '',
        vessel_speed: '',
        tce_required: '',
        length: '',
        beam: '',
        consumption_sea_ifo: '',
        consumption_idle_ifo: '',
        consumption_load_ifo: '',
        consumption_disch_ifo: '',
        consumption_sea_mdo: '',
        consumption_idle_mdo: '',
        consumption_load_mdo: '',
        consumption_disch_mdo: ''
    });

    // Lista de tramos (inicialmente 2 tramos para viaje redondo: LADEN + BALLAST)
    const [tramos, setTramos] = useState<TramoState[]>([
        {
            type: 'LADEN',
            origin_port_id: '',
            destination_port_id: '',
            quantity: '',
            freight_rate: '',
            port_delay_hours_loading: 0,
            port_delay_hours_discharging: 0,
            route_distance: '',
            weather_factor: '',
            speed: ''
        },
        {
            type: 'BALLAST',
            origin_port_id: '',
            destination_port_id: '',
            quantity: '',
            freight_rate: '',
            port_delay_hours_loading: 0,
            port_delay_hours_discharging: 0,
            route_distance: '',
            weather_factor: '',
            speed: ''
        }
    ]);

    // Configuración de puertos a eje de las letras (tramos.length + 1)
    const [puertosConfig, setPuertosConfig] = useState<PuertoConfig[]>([
        { action: 'NONE', quantity: '', freight_rate: '', op_rate: '', rate_unit: 'TH', overhead: '', positioning: '', manual_port_cost: '' },       // Puerto 0 (A)
        { action: 'NONE', quantity: '', freight_rate: '', op_rate: '', rate_unit: 'TH', overhead: '', positioning: '', manual_port_cost: '' },        // Puerto 1 (B)
        { action: 'NONE', quantity: '', freight_rate: '', op_rate: '', rate_unit: 'TH', overhead: '', positioning: '', manual_port_cost: '' }         // Puerto 2 (C)
    ]);

    const [result, setResult] = useState<any>(null);


    // Persistencia de Rutas
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [routeName, setRouteName] = useState('');
    const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
    const [loadedRouteName, setLoadedRouteName] = useState<string | null>(null);

    // Exportación a la Matriz Financiera (Forecast)


    // Resolver info de ruta
    const getAutoRouteInfo = (origin: string, destination: string, type: 'LADEN' | 'BALLAST') => {
        if (!origin || !destination) {
            return { route_distance: '', weather_factor: '' };
        }
        const p1 = origin < destination ? origin : destination;
        const p2 = origin < destination ? destination : origin;
        const matched = routes.find(r => r.port_a === p1 && r.port_b === p2);
        if (matched) {
            const dist = Number(matched.route_distance) || 0;
            const wf = type === 'LADEN' 
                ? Number(matched.weather_factor_laden || matched.weather_factor || 0.05) 
                : Number(matched.weather_factor_ballast || matched.weather_factor || 0.05);
            return { route_distance: dist, weather_factor: wf * 100 }; // Devuelve porcentaje entero legible, ej. 5 para 5%
        }
        return { route_distance: 100, weather_factor: 5 };
    };

    // Resolver ritmo de operación por defecto del puerto
    const getAutoPortRate = (portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR') => {
        const p = ports.find(x => x.port_id === portId);
        if (action === 'CARGAR') {
            const limit = p?.max_load_rate || 9999;
            const vesselRate = Number(vesselParams.act_load) || 500;
            return limit > 0 && limit < 9999 ? Math.min(limit, vesselRate) : vesselRate;
        }
        if (action === 'DESCARGAR') {
            const limit = p?.max_disch_rate || 9999;
            const vesselRate = Number(vesselParams.act_disch) || 300;
            return limit > 0 && limit < 9999 ? Math.min(limit, vesselRate) : vesselRate;
        }
        return '';
    };

    // Resolver overhead por defecto del puerto
    const getAutoPortOverhead = (portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR') => {
        const p = ports.find(x => x.port_id === portId);
        if (p) {
            if (action === 'CARGAR') return p.time_to_count_carga_hrs ?? 6;
            if (action === 'DESCARGAR') return p.time_to_count_descarga_hrs ?? 6;
        }
        return '';
    };

    // Resolver posicionamiento por defecto del puerto
    const getAutoPortPositioning = (portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR') => {
        const p = ports.find(x => x.port_id === portId);
        if (p) {
            if (action === 'CARGAR') return p.maneuver_carga_hrs ?? 0;
            if (action === 'DESCARGAR') return p.maneuver_descarga_hrs ?? 0;
        }
        return '';
    };

    // Cargar Catálogos
    useEffect(() => {
        ForecastService.getVessels().then(data => {
            const customVessel = {
                vessel_id: 'SIN_NOMBRE',
                vessel_name: '⚓ [BUQUE SIN NOMBRE]',
                grt: 0,
                dwt: 0,
                dwcc: 0,
                vessel_speed: 11.0,
                tce_required: 0,
                length: 0,
                beam: 0,
                consumption_sea_ifo: 0,
                consumption_idle_ifo: 0,
                consumption_load_ifo: 0,
                consumption_disch_ifo: 0,
                consumption_sea_mdo: 0,
                consumption_idle_mdo: 0,
                consumption_load_mdo: 0,
                consumption_disch_mdo: 0,
                act_load: 500,
                act_disch: 300
            };
            const extended = [...data, customVessel];
            setVessels(extended);
            // No auto-seleccionar buque para obligar al usuario a elegir
            setSelectedVessel('');
        });
        
        ForecastService.getPorts().then(data => {
            const uniquePorts = data.filter((p: any, idx: number, self: any[]) => 
                self.findIndex((x: any) => x.port_id === p.port_id) === idx
            );
            setPorts(uniquePorts);
        });

        ForecastService.getRoutes().then(data => {
            setRoutes(data || []);
        });

        ForecastService.getClientsMaster().then(clientsList => {
            setRawClients(clientsList || []);
        }).catch(err => {
            console.error("Error al cargar clientes desde el Maestro de Clientes:", err);
        });

        ForecastService.getContractsMaster().then(contractsList => {
            setContractsMaster(contractsList || []);
        }).catch(err => {
            console.error("Error al cargar contratos desde Maestro de Contratos:", err);
        });

        ForecastService.getLatestBunker().then(prices => {
            if (prices) {
                setBunkerPriceIfo(prices.ifo || 0);
                setBunkerPriceMdo(prices.mdo || 0);
                setBunkerDate(prices.date || 'N/A');
            }
        }).catch(err => {
            console.error("Error al cargar precios de bunker:", err);
        });
    }, []);

    useEffect(() => {
        let filtered = rawClients;
        if (filterActivo && !filterProspecto) {
            filtered = rawClients.filter(c => c.is_active !== false);
        } else if (!filterActivo && filterProspecto) {
            filtered = rawClients.filter(c => c.is_prospect === true);
        } else if (!filterActivo && !filterProspecto) {
            filtered = [];
        }
        
        const clientIds = filtered.map(c => c.client_id).filter(Boolean);
        const uniqueIds = Array.from(new Set(clientIds));
        uniqueIds.sort();
        setClients(uniqueIds);
        
        if (selectedClient && !uniqueIds.includes(selectedClient)) {
            setSelectedClient('');
        }
    }, [rawClients, filterActivo, filterProspecto, selectedClient]);

    // Autocompletar búnker y tarifas desde el Maestro de Contratos dinámicamente
    useEffect(() => {
        if (contractsMaster.length > 0 && tramos.length > 0) {
            const ladenLeg = tramos.find(t => t.type === 'LADEN') || tramos[0];
            const destPort = ladenLeg?.destination_port_id;
            const origPort = tramos[0]?.origin_port_id;
            const Q = Number(ladenLeg?.quantity || 13500);

            const matched = contractsMaster.find((c: any) => 
                (!selectedClient || (c.client_id || '').toUpperCase() === selectedClient.toUpperCase()) &&
                (c.destination_port_id || '').toUpperCase() === (destPort || '').toUpperCase() &&
                (!origPort || !c.origin_port_id || (c.origin_port_id || '').toUpperCase() === origPort.toUpperCase())
            );

            if (matched) {
                if (matched.bunker_baseline_price_ifo > 0 && bunkerPriceIfo === 0) {
                    setBunkerPriceIfo(Number(matched.bunker_baseline_price_ifo));
                }
                if (matched.bunker_baseline_price_mdo > 0 && bunkerPriceMdo === 0) {
                    setBunkerPriceMdo(Number(matched.bunker_baseline_price_mdo));
                }
                const tariffs = matched.tariffs || matched.contract_tariffs || [];
                const matchedTariff = tariffs.find((t: any) => 
                    Q >= (Number(t.min_tonnage) || 0) && Q <= (Number(t.max_tonnage) || 999999)
                );
                const rate = matchedTariff ? Number(matchedTariff.freight_rate) : (tariffs[0] ? Number(tariffs[0].freight_rate) : 0);
                if (rate > 0 && puertosConfig[1] && puertosConfig[1].freight_rate !== rate) {
                    setPuertosConfig(prev => {
                        const copy = [...prev];
                        if (copy[1]) copy[1] = { ...copy[1], freight_rate: rate };
                        return copy;
                    });
                }
            }
        }
    }, [selectedClient, contractsMaster, tramos, bunkerPriceIfo, bunkerPriceMdo, puertosConfig]);

    const toggleActivo = () => {
        setFilterActivo(true);
        setFilterProspecto(false);
    };

    const toggleProspecto = () => {
        setFilterActivo(false);
        setFilterProspecto(true);
    };

    // Actualizar estado local del buque seleccionado
    const updateVesselState = (vId: string, list: any[]) => {
        const v = list.find(x => x.vessel_id === vId);
        if (v) {
            setVesselParams({
                vessel_id: v.vessel_id,
                vessel_name: v.vessel_name,
                grt: v.grt ?? 0,
                dwt: v.dwt ?? 0,
                dwcc: v.dwcc ?? 0,
                vessel_speed: v.vessel_speed ?? 11.0,
                tce_required: v.tce_required ?? 0,
                length: v.length ?? 0,
                beam: v.beam ?? 0,
                consumption_sea_ifo: v.consumption_sea_ifo ?? 0,
                consumption_idle_ifo: v.consumption_idle_ifo ?? 0,
                consumption_load_ifo: v.consumption_load_ifo ?? 0,
                consumption_disch_ifo: v.consumption_disch_ifo ?? 0,
                consumption_sea_mdo: v.consumption_sea_mdo ?? 0,
                consumption_idle_mdo: v.consumption_idle_mdo ?? 0,
                consumption_load_mdo: v.consumption_load_mdo ?? 0,
                consumption_disch_mdo: v.consumption_disch_mdo ?? 0,
                act_load: v.act_load ?? 500,
                act_disch: v.act_disch ?? 300
            });
        }
    };

    // Autocompletar reactivamente al cargar rutas, barcos o cambiar el buque
    useEffect(() => {
        if (routes.length > 0 && vessels.length > 0 && selectedVessel && ports.length > 0) {
            const defaultSpeed = Number(vesselParams.vessel_speed) || 11.0;
            
            setTramos(prev => prev.map(tr => {
                const auto = getAutoRouteInfo(tr.origin_port_id, tr.destination_port_id, tr.type);
                return {
                    ...tr,
                    route_distance: tr.route_distance !== undefined && tr.route_distance !== '' ? tr.route_distance : auto.route_distance,
                    weather_factor: tr.weather_factor !== undefined && tr.weather_factor !== '' ? tr.weather_factor : auto.weather_factor,
                    speed: tr.speed !== undefined && tr.speed !== '' ? tr.speed : defaultSpeed
                };
            }));

            // Autocompletar y actualizar explícitamente los ritmos de puertosConfig basándonos en el buque actual
            setPuertosConfig(prev => prev.map((p, idx) => {
                if (p.action === 'NONE') return p;
                const portId = idx === 0 ? (tramos[0]?.origin_port_id || 'MATARANI') : (tramos[idx - 1]?.destination_port_id || '');
                if (!portId) return p;
                
                // Si el ritmo está vacío o nulo, o es el valor Auto por defecto, poblarlo explícitamente
                const rate = p.op_rate === '' || p.op_rate === undefined ? getAutoPortRate(portId, p.action) : p.op_rate;
                return {
                    ...p,
                    op_rate: rate
                };
            }));
        }
    }, [routes, vessels, selectedVessel, vesselParams.vessel_speed, vesselParams.act_load, vesselParams.act_disch, ports]);

    const autoFillPortCost = async (idx: number, portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR', currentVesselId: string) => {
        if (!currentVesselId || !portId || action === 'NONE') {
            setPuertosConfig(prev => {
                const list = [...prev];
                if (list[idx]) {
                    list[idx].manual_port_cost = '';
                }
                return list;
            });
            return;
        }

        try {
            const res = await ForecastService.lookupPortCost(currentVesselId, portId, action, localPortCostMode);
            if (res && res.total_cost !== undefined) {
                setPuertosConfig(prev => {
                    const list = [...prev];
                    if (list[idx]) {
                        list[idx].manual_port_cost = res.total_cost > 0 ? res.total_cost : '';
                    }
                    return list;
                });
            }
        } catch (err) {
            console.error("Error doing port cost lookup:", err);
        }
    };

    // Actualizar precios de bunker al cambiar de barco
    const handleVesselChange = (vId: string) => {
        setSelectedVessel(vId);
        updateVesselState(vId, vessels);
        const v = vessels.find(x => x.vessel_id === vId);
        if (v && v.max_capacity_mdo <= 0) {
            setBunkerPriceMdo(0);
        } else {
            ForecastService.getLatestBunker().then(prices => {
                if (prices) setBunkerPriceMdo(prices.mdo || 900);
            });
        }

        // Pre-llenar costos de puerto automáticos para el nuevo buque
        puertosConfig.forEach((p, idx) => {
            if (p.action !== 'NONE') {
                const portId = idx === 0 ? (tramos[0]?.origin_port_id || '') : (tramos[idx - 1]?.destination_port_id || '');
                if (portId) {
                    autoFillPortCost(idx, portId, p.action, vId);
                }
            }
        });
    };

    // Propagar cambios en el Fact Sheet del buque
    const handleVesselParamChange = (field: string, val: any) => {
        setVesselParams((prev: any) => ({
            ...prev,
            [field]: val
        }));
    };

    // Propagar cambios de origen/destino reactivos en cadena
    const updateTramoField = (index: number, field: keyof TramoState, value: any) => {
        setTramos(prev => {
            const list = [...prev];
            list[index] = { ...list[index], [field]: value };
            
            // Si cambia origen o destino, autocompletar la distancia y clima del tramo modificado
            if (field === 'origin_port_id' || field === 'destination_port_id' || field === 'type') {
                const auto = getAutoRouteInfo(list[index].origin_port_id, list[index].destination_port_id, list[index].type);
                list[index].route_distance = auto.route_distance;
                list[index].weather_factor = auto.weather_factor;
            }

            // Heredar origen del tramo siguiente y autocompletarlo
            if (field === 'destination_port_id' && index < list.length - 1) {
                list[index + 1].origin_port_id = value;
                const autoNext = getAutoRouteInfo(list[index + 1].origin_port_id, list[index + 1].destination_port_id, list[index + 1].type);
                list[index + 1].route_distance = autoNext.route_distance;
                list[index + 1].weather_factor = autoNext.weather_factor;
            }
            return list;
        });

        // Actualizar ritmos, overhead y posicionamiento en puertosConfig si corresponden
        if (field === 'origin_port_id' && index === 0) {
            setPuertosConfig(prevPorts => {
                const newList = [...prevPorts];
                if (newList[0] && newList[0].action !== 'NONE') {
                    newList[0].op_rate = '';
                    newList[0].overhead = '';
                    newList[0].positioning = '';
                }
                return newList;
            });
            // Auto-fill Costo de Puerto al cambiar el origen
            if (puertosConfig[0] && puertosConfig[0].action !== 'NONE') {
                autoFillPortCost(0, value, puertosConfig[0].action, selectedVessel);
            }
        }
        if (field === 'destination_port_id') {
            const pIdx = index + 1;
            setPuertosConfig(prevPorts => {
                const newList = [...prevPorts];
                if (newList[pIdx] && newList[pIdx].action !== 'NONE') {
                    newList[pIdx].op_rate = '';
                    newList[pIdx].overhead = '';
                    newList[pIdx].positioning = '';
                }
                return newList;
            });
            // Auto-fill Costo de Puerto al cambiar el destino
            if (puertosConfig[pIdx] && puertosConfig[pIdx].action !== 'NONE') {
                autoFillPortCost(pIdx, value, puertosConfig[pIdx].action, selectedVessel);
            }
        }
    };

    // Propagar cambios en configuración de puerto y auto-propagar flete
    const updatePuertoConfigField = (idx: number, field: keyof PuertoConfig, val: any) => {
        setPuertosConfig(prev => {
            const list = [...prev];
            list[idx] = { ...list[idx], [field]: val };
            
            // Si cambia la acción, limpiar inputs inválidos y autocompletar ritmo, overhead y posicionamiento
            if (field === 'action') {
                if (val === 'NONE') {
                    list[idx].quantity = '';
                    list[idx].freight_rate = '';
                    list[idx].op_rate = '';
                    list[idx].overhead = '';
                    list[idx].positioning = '';
                } else {
                    list[idx].op_rate = '';
                    list[idx].overhead = '';
                    list[idx].positioning = '';
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

        // Auto-fill Costo de Puerto al cambiar la acción
        if (field === 'action') {
            const portId = idx === 0 ? (tramos[0]?.origin_port_id || '') : (tramos[idx - 1]?.destination_port_id || '');
            if (portId) {
                autoFillPortCost(idx, portId, val, selectedVessel);
            }
        }
    };

    // Calcular la cantidad de toneladas y naturaleza de cada tramo basado en el acumulador de bodega
    const getCalculatedTramos = () => {
        let carga_a_bordo = 0;
        return tramos.map((tr, idx) => {
            const pOrig = puertosConfig[idx] || { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '' };
            let qOrig = Number(pOrig.quantity) || 0;
            


            if (pOrig.action === 'CARGAR') {
                carga_a_bordo += qOrig;
            } else if (pOrig.action === 'DESCARGAR') {
                carga_a_bordo -= qOrig;
                if (carga_a_bordo < 0) carga_a_bordo = 0;
            }

            const qtyTramo = carga_a_bordo;
            const typeTramo = qtyTramo > 0 ? 'LADEN' : 'BALLAST';

            // El flete de este tramo se define por lo que se descarga en el puerto destino (idx + 1)
            const pDest = puertosConfig[idx + 1] || { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '' };
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
            const defaultSpeed = Number(vesselParams.vessel_speed) || 11.0;
            const auto = getAutoRouteInfo(last.destination_port_id, defaultDest, 'LADEN');
            return [
                ...prev,
                {
                    type: 'LADEN',
                    origin_port_id: last.destination_port_id,
                    destination_port_id: defaultDest,
                    quantity: 13500,
                    freight_rate: 20.00,
                    port_delay_hours_loading: 0,
                    port_delay_hours_discharging: 0,
                    route_distance: auto.route_distance,
                    weather_factor: auto.weather_factor,
                    speed: defaultSpeed
                }
            ];
        });
        setPuertosConfig(prev => [
            ...prev,
            { action: 'NONE', quantity: 0, freight_rate: 0, op_rate: '', rate_unit: 'TH', manual_port_cost: '' }
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
        if (!selectedVessel) return;
        
        // Obtener tramos calculados dinámicamente según bodega
        const trs = getCalculatedTramos();

        for (let i = 0; i < trs.length; i++) {
            const tr = trs[i];
            if (tr.origin_port_id === tr.destination_port_id) {
                return alert(`Error en Tramo ${i+1}: El puerto de origen y destino no pueden ser iguales (${tr.origin_port_id}).`);
            }
        }

        try {
            const totalCargas = puertosConfig
                .filter(p => p.action === 'CARGAR')
                .reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

            const totalDescargas = puertosConfig
                .filter(p => p.action === 'DESCARGAR')
                .reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

            if (totalCargas !== totalDescargas) {
                return; // Silencioso en el useEffect o con alerta si lo inicia el usuario
            }

            const payloadTramos = trs.map((tr, idx) => {
                // Mapear ratios de carga/descarga personalizados
                let customLoad: number | undefined = undefined;
                let customDisch: number | undefined = undefined;

                const pOrig = puertosConfig[idx];
                const pDest = puertosConfig[idx + 1];

                if (pOrig && pOrig.action === 'CARGAR' && pOrig.op_rate !== '') {
                    const val = Number(pOrig.op_rate);
                    // Backend espera T/h. TH -> as-is; TD -> dividir por 24 para convertir a T/h
                    customLoad = pOrig.rate_unit === 'TH' ? val : val / 24;
                }
                if (pDest && pDest.action === 'DESCARGAR' && pDest.op_rate !== '') {
                    const val = Number(pDest.op_rate);
                    customDisch = pDest.rate_unit === 'TH' ? val : val / 24;
                }

                let overheadOrig = pOrig && pOrig.action !== 'NONE' && pOrig.overhead !== '' 
                    ? Number(pOrig.overhead) 
                    : undefined;
                
                let overheadDest = pDest && pDest.action !== 'NONE' && pDest.overhead !== '' 
                    ? Number(pDest.overhead) 
                    : undefined;

                let posCarga: number | undefined = undefined;
                if (pOrig && pOrig.action === 'CARGAR') {
                    posCarga = pOrig.positioning !== '' ? Number(pOrig.positioning) : undefined;
                } else if (pDest && pDest.action === 'CARGAR') {
                    posCarga = pDest.positioning !== '' ? Number(pDest.positioning) : undefined;
                }

                let posDescarga: number | undefined = undefined;
                if (pOrig && pOrig.action === 'DESCARGAR') {
                    posDescarga = pOrig.positioning !== '' ? Number(pOrig.positioning) : undefined;
                } else if (pDest && pDest.action === 'DESCARGAR') {
                    posDescarga = pDest.positioning !== '' ? Number(pDest.positioning) : undefined;
                }

                // Regla Limpia: Solo hay costo de puerto cuando la acción es CARGAR o DESCARGAR.
                // Cada puerto de la rotación (0..N) se cobra 1 sola vez en la recalada.
                let overridePortCostOrig = 0.00001;
                let overridePortCostDest = 0.00001;

                // Puerto 0: Se asigna únicamente al origen del Tramo 0
                if (idx === 0 && pOrig && pOrig.action !== 'NONE') {
                    if (pOrig.manual_port_cost !== '' && pOrig.manual_port_cost !== undefined) {
                        overridePortCostOrig = Number(pOrig.manual_port_cost);
                    } else {
                        overridePortCostOrig = 0.0;
                    }
                }

                // Puertos 1..N: Se asignan como destino de cada Tramo idx
                if (pDest && pDest.action !== 'NONE') {
                    if (pDest.manual_port_cost !== '' && pDest.manual_port_cost !== undefined) {
                        overridePortCostDest = Number(pDest.manual_port_cost);
                    } else {
                        overridePortCostDest = 0.0;
                    }
                }

                return {
                    origin_port_id: tr.origin_port_id,
                    destination_port_id: tr.destination_port_id,
                    type: tr.type,
                    quantity: Number(tr.quantity) || 0,
                    freight_rate: Number(tr.freight_rate),
                    port_delay_hours_loading: Number(tr.port_delay_hours_loading),
                    port_delay_hours_discharging: Number(tr.port_delay_hours_discharging),
                    route_distance: Number(tr.route_distance) || 0,
                    weather_factor: (Number(tr.weather_factor) || 0) / 100, // Dividir entre 100 para decimal del backend
                    origin_action: puertosConfig[idx]?.action || 'NONE',
                    destination_action: puertosConfig[idx + 1]?.action || 'NONE',
                    custom_load_rate: customLoad,
                    custom_discharge_rate: customDisch,
                    port_overhead_hours_origin: overheadOrig,
                    port_overhead_hours_dest: overheadDest,
                    positioning_carga_hrs: posCarga,
                    positioning_descarga_hrs: posDescarga,
                    agency_costs_origin: overridePortCostOrig,
                    agency_costs_destination: overridePortCostDest
                };
            });

            // Enviar payload — con timeout 500ms y fallback client-side si backend no disponible
            const apiPayload = {
                vessel_id: selectedVessel,
                bunker_price_ifo: bunkerPriceIfo,
                bunker_price_mdo: bunkerPriceMdo,
                port_cost_mode: localPortCostMode,
                vessel_speed: Number(vesselParams.vessel_speed) || undefined,
                grt: Number(vesselParams.grt) || undefined,
                dwt: Number(vesselParams.dwt) || undefined,
                dwcc: Number(vesselParams.dwcc) || undefined,
                length: Number(vesselParams.length) || undefined,
                beam: Number(vesselParams.beam) || undefined,
                tce_required: Number(vesselParams.tce_required) || undefined,
                consumption_sea_ifo: Number(vesselParams.consumption_sea_ifo),
                consumption_idle_ifo: Number(vesselParams.consumption_idle_ifo),
                consumption_load_ifo: Number(vesselParams.consumption_load_ifo),
                consumption_disch_ifo: Number(vesselParams.consumption_disch_ifo),
                consumption_sea_mdo: Number(vesselParams.consumption_sea_mdo),
                consumption_idle_mdo: Number(vesselParams.consumption_idle_mdo),
                consumption_load_mdo: Number(vesselParams.consumption_load_mdo),
                consumption_disch_mdo: Number(vesselParams.consumption_disch_mdo),
                tramos: payloadTramos
            };

            let res: any;
            try {
                const apiCall = ForecastService.calculateMultiCotizador(apiPayload);
                const timeoutRace = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 500));
                res = await Promise.race([apiCall, timeoutRace]);
            } catch {
                // Fallback client-side: cálculo local cuando backend no está disponible
                const pIfo = bunkerPriceIfo; const pMdo = bunkerPriceMdo;
                const spd = Number(vesselParams.vessel_speed) || 11.0;
                const consSea = Number(vesselParams.consumption_sea_ifo) || 14.0;
                let totDist = 0, totSeaDays = 0, totPortDays = 0;
                let totBunker = 0, totPort = 0, ifoTot = 0, mdoTot = 0;
                const builtTramos = payloadTramos.map((t: any) => {
                    const dist = t.route_distance || 0;
                    const wf = t.weather_factor || 0.03;
                    const sd = dist > 0 ? (dist * (1 + wf)) / (spd * 24) : 0;
                    const q = t.quantity || 0;
                    const rL = t.custom_load_rate || 500;
                    const rD = t.custom_discharge_rate || 300;
                    const pd = t.type === 'LADEN' ? (q / rL / 24) + (q / rD / 24) + ((t.port_overhead_hours_origin || 6) + (t.port_overhead_hours_dest || 6)) / 24 : 0;
                    const ifoSea = sd * consSea;
                    const mdoPort = t.type === 'LADEN' ? 0.77 : 0;
                    const bunk = ifoSea * pIfo + mdoPort * pMdo;
                    const portCost = (t.agency_costs_origin || 0) + (t.agency_costs_destination || 0);
                    totDist += dist; totSeaDays += sd; totPortDays += pd;
                    totBunker += bunk; totPort += portCost;
                    ifoTot += ifoSea; mdoTot += mdoPort;
                    return { ...t, sea_days: sd, port_days: pd, bunker_costs: bunk, port_costs: portCost, net_income: 0, pnl_tramo: 0 };
                });
                const totDays = totSeaDays + totPortDays;
                res = {
                    tramos: builtTramos,
                    consolidated: {
                        total_distance: totDist, total_days: totDays,
                        total_sea_days: totSeaDays, total_port_days: totPortDays,
                        total_bunker_costs: totBunker, bunker_ifo_tonnage: ifoTot,
                        bunker_mdo_tonnage: mdoTot, total_port_costs: totPort,
                        total_freight_revenue: 0, total_commissions: 0,
                        pnl_net_utility: 0, tce_real: 0,
                        tce_required: Number(vesselParams.tce_required) || 0
                    }
                };
            }

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

            // Ajustar consolidados generales y descontar comisiones
            const totalCommPct = addressCommPct + brokerCommPct;
            const totalCommissionsUSD = totalFreightRevenue * (totalCommPct / 100);

            res.consolidated.total_freight_revenue = totalFreightRevenue;
            res.consolidated.total_commissions = totalCommissionsUSD;
            res.consolidated.pnl_net_utility = totalFreightRevenue - totalCommissionsUSD - res.consolidated.total_port_costs - res.consolidated.total_bunker_costs;
            res.consolidated.tce_real = res.consolidated.total_days > 0 ? (res.consolidated.pnl_net_utility / res.consolidated.total_days) : 0;

            setResult(res);
        } catch (e) {
            console.error("Error al simular:", e);
        }
    };

    // Recalculo Automatico Reactivo (Estilo Excel)
    useEffect(() => {
        if (!selectedVessel || tramos.length === 0 || routes.length === 0) return;

        const hasEmptyPorts = tramos.some(tr => !tr.origin_port_id || !tr.destination_port_id);
        if (hasEmptyPorts) return;

        const timer = setTimeout(() => {
            handleCalculate();
        }, 500);

        return () => clearTimeout(timer);
    }, [selectedVessel, bunkerPriceIfo, bunkerPriceMdo, tramos, puertosConfig, routes, vesselParams, addressCommPct, brokerCommPct, localPortCostMode]);

    // Guardar ruta multicotizador
    // Serializa el paquete COMPLETO tal como lo procesa handleCalculate,
    // para que al jalar la ruta en la Matriz Financiera no se pierda ningún dato.
    const handleSaveRoute = async () => {
        if (!routeName) return alert('Ingrese un nombre para la ruta');
        try {
            setIsSaving(true);
            const pais = tramos.some(tr => (tr.destination_port_id || "").toLowerCase().includes("meji") || (tr.destination_port_id || "").toLowerCase().includes("barq")) ? "Chile" : "Peru";
            const trs = getCalculatedTramos();

            // Construir tramos enriquecidos: mismo formato que envía handleCalculate al engine
            const tramosEnriquecidos = trs.map((tr, idx) => {
                const pOrig = puertosConfig[idx];
                const pDest = puertosConfig[idx + 1];

                // Ritmos de operación — convertidos a T/h (formato del backend)
                let customLoad: number | undefined = undefined;
                let customDisch: number | undefined = undefined;
                if (pOrig && pOrig.action === 'CARGAR' && pOrig.op_rate !== '') {
                    const val = Number(pOrig.op_rate);
                    customLoad = pOrig.rate_unit === 'TH' ? val : val / 24;
                }
                if (pDest && pDest.action === 'DESCARGAR' && pDest.op_rate !== '') {
                    const val = Number(pDest.op_rate);
                    customDisch = pDest.rate_unit === 'TH' ? val : val / 24;
                }

                // Overheads (time to count)
                const overheadOrig = pOrig && pOrig.action !== 'NONE' && pOrig.overhead !== ''
                    ? Number(pOrig.overhead)
                    : Number(getAutoPortOverhead(tr.origin_port_id, pOrig?.action || 'NONE')) || 6.0;
                const overheadDest = pDest && pDest.action !== 'NONE' && pDest.overhead !== ''
                    ? Number(pDest.overhead)
                    : Number(getAutoPortOverhead(tr.destination_port_id, pDest?.action || 'NONE')) || 6.0;

                // Posicionamiento (maniobra)
                let posCarga = 0;
                if (pOrig && pOrig.action === 'CARGAR') {
                    posCarga = pOrig.positioning !== '' ? Number(pOrig.positioning) : (Number(getAutoPortPositioning(tr.origin_port_id, 'CARGAR')) || 0);
                } else if (pDest && pDest.action === 'CARGAR') {
                    posCarga = pDest.positioning !== '' ? Number(pDest.positioning) : (Number(getAutoPortPositioning(tr.destination_port_id, 'CARGAR')) || 0);
                }
                let posDescarga = 0;
                if (pOrig && pOrig.action === 'DESCARGAR') {
                    posDescarga = pOrig.positioning !== '' ? Number(pOrig.positioning) : (Number(getAutoPortPositioning(tr.origin_port_id, 'DESCARGAR')) || 0);
                } else if (pDest && pDest.action === 'DESCARGAR') {
                    posDescarga = pDest.positioning !== '' ? Number(pDest.positioning) : (Number(getAutoPortPositioning(tr.destination_port_id, 'DESCARGAR')) || 0);
                }

                // Regla Limpia: Solo hay costo de puerto cuando la acción es CARGAR o DESCARGAR.
                // Cada puerto de la rotación (0..N) se cobra 1 sola vez en la recalada.
                let overridePortCostOrig = 0.00001;
                let overridePortCostDest = 0.00001;

                // Puerto 0: Se asigna únicamente al origen del Tramo 0
                if (idx === 0 && pOrig && pOrig.action !== 'NONE') {
                    if (pOrig.manual_port_cost !== '' && pOrig.manual_port_cost !== undefined) {
                        overridePortCostOrig = Number(pOrig.manual_port_cost);
                    } else {
                        overridePortCostOrig = 0.0;
                    }
                }

                // Puertos 1..N: Se asignan como destino de cada Tramo idx
                if (pDest && pDest.action !== 'NONE') {
                    if (pDest.manual_port_cost !== '' && pDest.manual_port_cost !== undefined) {
                        overridePortCostDest = Number(pDest.manual_port_cost);
                    } else {
                        overridePortCostDest = 0.0;
                    }
                }

                return {
                    // Identificadores del tramo
                    origin_port_id: tr.origin_port_id,
                    destination_port_id: tr.destination_port_id,
                    type: tr.type,
                    // Carga y flete
                    quantity: Number(tr.quantity) || 0,
                    freight_rate: Number(tr.freight_rate) || 0,
                    // Distancia y condiciones de mar
                    route_distance: Number(tr.route_distance) || 0,
                    weather_factor: (Number(tr.weather_factor) || 0) / 100, // decimal para el backend (ej. 0.05)
                    speed: Number(tr.speed) || Number(vesselParams.vessel_speed) || 11.0,
                    // Acción y ritmos por puerto
                    origin_action: pOrig?.action || 'NONE',
                    destination_action: pDest?.action || 'NONE',
                    custom_load_rate: customLoad,
                    custom_discharge_rate: customDisch,
                    rate_unit_origin: pOrig?.rate_unit || 'TH',
                    rate_unit_destination: pDest?.rate_unit || 'TH',
                    // Overheads (time to count) en horas
                    port_overhead_hours_origin: overheadOrig,
                    port_overhead_hours_dest: overheadDest,
                    // Posicionamiento (maniobra) en horas
                    positioning_carga_hrs: posCarga,
                    positioning_descarga_hrs: posDescarga,
                    // Demoras en puerto
                    port_delay_hours_loading: Number(tr.port_delay_hours_loading) || 0,
                    port_delay_hours_discharging: Number(tr.port_delay_hours_discharging) || 0,
                    // Costos de puerto (0 = usar port_cost_static del backend)
                    agency_costs_origin: overridePortCostOrig,
                    agency_costs_destination: overridePortCostDest,
                };
            });

            const clientInfo = rawClients.find((c: any) => c.client_id === selectedClient);
            const isClientProspect = (clientInfo?.is_prospect === true) || filterProspecto;

            const payload = {
                name: routeName,
                description: isClientProspect ? "Cotización Prospecto (routes_quotes)" : "Ruta Cliente Activo (routes_clients)",
                pais,
                is_prospect: isClientProspect,
                created_by: 'izavala@petral.com.pe',
                legs_data: {
                    is_multicotizador: true,
                    created_by: 'izavala@petral.com.pe',
                    vessel_id: isClientProspect ? selectedVessel : undefined,
                    bunker_price_ifo: bunkerPriceIfo,
                    bunker_price_mdo: bunkerPriceMdo,
                    tramos: tramosEnriquecidos,    // ← paquete completo para el engine
                    puertosConfig,                 // ← configuración visual de cada puerto
                    vesselParams: isClientProspect ? vesselParams : undefined,
                    addressCommPct,                // ← comisión de dirección (%)
                    brokerCommPct                  // ← comisión de corretaje (%)
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
            
            // Filtrar segun el modo activo (Activos vs Prospectos) y cliente seleccionado
            const filtered = list.filter((s: any) => {
                const name = (s.name || '').toUpperCase();
                const desc = (s.description || '').toUpperCase();
                const isProspectRoute = s.table_source === 'routes_quotes' || s.is_prospect === true || s.is_quote === true || desc.includes('PROSPECTO') || desc.includes('ROUTES_QUOTES') || name.startsWith('PROSPECT');
                
                // Si el selector esta en Activos, no mostrar cotizaciones prospecto
                if (filterActivo && isProspectRoute) return false;
                
                // Si el selector esta en Prospectos, solo mostrar prospectos
                if (filterProspecto && !isProspectRoute) return false;
                
                // Si se selecciono un cliente especifico, filtrar por el cliente
                if (selectedClient) {
                    const clientUpper = selectedClient.toUpperCase();
                    if (!name.includes(clientUpper) && !desc.includes(clientUpper) && s.client_id !== selectedClient) {
                        return false;
                    }
                }

                // Verificar que tenga legs_data con tramos o informacion de ruta
                const legs = s.legs_data;
                if (!legs) return false;
                
                return true;
            });

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
        if (!data) return;

        // Caso 1: Cotización rica completa (de routes_quotes o multicotizador)
        if (data.is_multicotizador || data.tramos) {
            if (data.vessel_id) setSelectedVessel(data.vessel_id);
            if (data.bunker_price_ifo) setBunkerPriceIfo(data.bunker_price_ifo);
            if (data.bunker_price_mdo) setBunkerPriceMdo(data.bunker_price_mdo);
            
            const tramosToLoad = Array.isArray(data.tramos) ? data.tramos : (Array.isArray(data) ? data : []);
            if (tramosToLoad.length > 0) {
                setTramos(tramosToLoad.map((tr: any) => ({
                    type: tr.type || 'LADEN',
                    origin_port_id: tr.origin_port_id || '',
                    destination_port_id: tr.destination_port_id || '',
                    quantity: tr.quantity !== undefined ? tr.quantity : 13500,
                    freight_rate: tr.freight_rate !== undefined ? tr.freight_rate : 0,
                    port_delay_hours_loading: tr.port_delay_hours_loading || 0,
                    port_delay_hours_discharging: tr.port_delay_hours_discharging || 0,
                    route_distance: tr.route_distance !== undefined ? tr.route_distance : '',
                    weather_factor: tr.weather_factor !== undefined ? (tr.weather_factor > 1 ? tr.weather_factor : tr.weather_factor * 100) : 3,
                    speed: tr.speed || 11.0
                })));
            }

            if (data.puertosConfig && Array.isArray(data.puertosConfig)) {
                setPuertosConfig(data.puertosConfig);
            } else if (tramosToLoad.length > 0) {
                // Reconstruir puertosConfig básico para armazones planos
                const newPortsConfig: PuertoConfig[] = [];
                newPortsConfig.push({
                    action: tramosToLoad[0].origin_action || (tramosToLoad[0].type === 'LADEN' ? 'CARGAR' : 'NONE'),
                    quantity: tramosToLoad[0].quantity || 13500,
                    freight_rate: 0,
                    op_rate: '',
                    rate_unit: 'TH',
                    overhead: '',
                    positioning: '',
                    manual_port_cost: tramosToLoad[0].agency_costs_origin || ''
                });

                tramosToLoad.forEach((tr: any) => {
                    newPortsConfig.push({
                        action: tr.destination_action || (tr.type === 'LADEN' ? 'DESCARGAR' : 'NONE'),
                        quantity: tr.type === 'LADEN' ? (tr.quantity || 13500) : 0,
                        freight_rate: tr.freight_rate || 0,
                        op_rate: '',
                        rate_unit: 'TH',
                        overhead: '',
                        positioning: '',
                        manual_port_cost: tr.agency_costs_destination || ''
                    });
                });

                setPuertosConfig(newPortsConfig);
            }

            if (data.vesselParams) setVesselParams(data.vesselParams);
            setAddressCommPct(data.addressCommPct || 0);
            setBrokerCommPct(data.brokerCommPct || 0);
            setLoadedRouteName(route.name);
            setResult(null); // Limpiar cálculo anterior para recalcular reactivamente
            setShowLoadModal(false);
        } else if (Array.isArray(data)) {
            // Caso 2: Objeto plano de legs en routes_clients
            const tramosToLoad = data;
            setTramos(tramosToLoad.map((tr: any) => ({
                type: tr.type || 'LADEN',
                origin_port_id: tr.origin_port_id || '',
                destination_port_id: tr.destination_port_id || '',
                quantity: tr.quantity !== undefined ? tr.quantity : 13500,
                freight_rate: tr.freight_rate !== undefined ? tr.freight_rate : 0,
                port_delay_hours_loading: 0,
                port_delay_hours_discharging: 0,
                route_distance: tr.route_distance !== undefined ? tr.route_distance : '',
                weather_factor: tr.weather_factor !== undefined ? (tr.weather_factor > 1 ? tr.weather_factor : tr.weather_factor * 100) : 3,
                speed: 11.0
            })));

            const newPortsConfig: PuertoConfig[] = [];
            newPortsConfig.push({
                action: tramosToLoad[0]?.type === 'LADEN' ? 'CARGAR' : 'NONE',
                quantity: 13500,
                freight_rate: 0,
                op_rate: '',
                rate_unit: 'TH',
                overhead: '',
                positioning: '',
                manual_port_cost: ''
            });
            tramosToLoad.forEach((tr: any) => {
                newPortsConfig.push({
                    action: tr.type === 'LADEN' ? 'DESCARGAR' : 'NONE',
                    quantity: tr.type === 'LADEN' ? 13500 : 0,
                    freight_rate: tr.freight_rate || 0,
                    op_rate: '',
                    rate_unit: 'TH',
                    overhead: '',
                    positioning: '',
                    manual_port_cost: ''
                });
            });
            setPuertosConfig(newPortsConfig);
            setLoadedRouteName(route.name);
            setResult(null);
            setShowLoadModal(false);
        }
    };

    const getSuggestedRouteName = (clientId: string) => {
        if (tramos.length === 0) return '';
        const portList = [tramos[0]?.origin_port_id || ''];
        tramos.forEach(tr => {
            if (tr.destination_port_id && tr.destination_port_id !== portList[portList.length - 1]) {
                portList.push(tr.destination_port_id);
            }
        });
        const cleanPorts = portList.filter(Boolean).map(p => p.toUpperCase());
        const clientPrefix = clientId ? `${clientId.toUpperCase()}.` : '';
        return `${clientPrefix}${cleanPorts.join('.')}`;
    };



    const handlePrintPDF = () => {
        if (!result) return alert('Por favor, ejecute o espere a que calcule la simulación antes de exportar.');
        
        const fechaStr = new Date().toLocaleDateString('es-PE', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        // Filas de tramos
        let tramosRowsHTML = '';
        result.tramos.forEach((tr: any, idx: number) => {
            const pDest = puertosConfig[idx + 1];
            const distVal = tr.distance ? fmtNum(tr.distance) : '—';
            const wfNum = tr.weather_factor ? (tr.weather_factor > 1 ? tr.weather_factor : tr.weather_factor * 100) : 0;
            const wfVal = tr.weather_factor ? `${wfNum.toFixed(1)}%` : '—';
            const speedVal = vesselParams.vessel_speed || '—';
            const trPortCost = pDest?.manual_port_cost !== '' && pDest?.manual_port_cost !== undefined ? Number(pDest.manual_port_cost) : (tr.port_costs || 0);
            
            tramosRowsHTML += `
                <tr>
                    <td style="text-align:center;font-weight:bold">${idx + 1}</td>
                    <td style="text-align:center">${tr.type === 'LADEN' ? '<span class="badge-laden">LADEN</span>' : '<span class="badge-ballast">BALLAST</span>'}</td>
                    <td>${tr.destination_port_id}</td>
                    <td style="text-align:right">${distVal}</td>
                    <td style="text-align:right">${wfVal}</td>
                    <td style="text-align:right">${speedVal}</td>
                    <td style="text-align:right">${fmtDays(tr.sea_days)}</td>
                    <td style="text-align:right">${fmtDays(tr.port_days)}</td>
                    <td style="text-align:right">${pDest?.overhead || '6.0'}</td>
                    <td style="text-align:right">${pDest?.positioning || '0.0'}</td>
                    <td style="text-align:center">${pDest?.action || 'NONE'}</td>
                    <td style="text-align:right">${pDest?.op_rate || 'auto'}</td>
                    <td style="text-align:right">${pDest?.quantity ? fmtNum(Number(pDest.quantity)) : '—'}</td>
                    <td style="text-align:right">${pDest?.freight_rate ? '$' + Number(pDest.freight_rate).toFixed(2) : '—'}</td>
                    <td style="text-align:right">${pDest?.action === 'NONE' ? '$0' : fmtCur(trPortCost)}</td>
                    <td style="text-align:right">${tr.net_income > 0 ? fmtCur(tr.net_income) : '$0'}</td>
                    <td style="text-align:right">${fmtCur(tr.bunker_costs)}</td>
                    <td style="text-align:right">${fmtNum(getBodegaSaliente(idx + 1))}</td>
                </tr>
            `;
        });

        // Puerto inicial
        const pInit = puertosConfig[0];
        const initialPortCost = pInit?.manual_port_cost !== '' && pInit?.manual_port_cost !== undefined ? Number(pInit.manual_port_cost) : (result?.tramos?.[0]?.agency_costs_origin || 0);
        
        const initialPortRowHTML = `
            <tr class="initial-port-row">
                <td style="text-align:center;font-weight:bold">—</td>
                <td style="text-align:center;color:#64748b">INICIO</td>
                <td>${tramos[0]?.origin_port_id || '—'}</td>
                <td style="text-align:right">—</td>
                <td style="text-align:right">—</td>
                <td style="text-align:right">—</td>
                <td style="text-align:right">—</td>
                <td style="text-align:right">${pInit?.action !== 'NONE' ? fmtDays(getPortDaysAndBunker(0).portDays) : '0.00'}</td>
                <td style="text-align:right">${pInit?.overhead || '6.0'}</td>
                <td style="text-align:right">${pInit?.positioning || '0.0'}</td>
                <td style="text-align:center">${pInit?.action || 'NONE'}</td>
                <td style="text-align:right">${pInit?.op_rate || 'auto'}</td>
                <td style="text-align:right">${pInit?.quantity ? fmtNum(Number(pInit.quantity)) : '—'}</td>
                <td style="text-align:right">—</td>
                <td style="text-align:right">${pInit?.action === 'NONE' ? '$0' : fmtCur(initialPortCost)}</td>
                <td style="text-align:right">—</td>
                <td style="text-align:right">${pInit?.action === 'NONE' ? '$0' : fmtCur(getPortDaysAndBunker(0).bunkerCost)}</td>
                <td style="text-align:right">${fmtNum(getBodegaSaliente(0))}</td>
            </tr>
        `;

        const totalDist = result.consolidated.total_distance;
        const totalSeaDays = result.consolidated.total_sea_days;
        const totalPortDays = result.consolidated.total_port_days;
        const totalFreight = result.consolidated.total_freight_revenue;
        const totalBunker = result.consolidated.total_bunker_costs;
        const totalPortCosts = result.consolidated.total_port_costs;
        const totalComm = result.consolidated.total_commissions || 0;
        const pnlNet = result.consolidated.pnl_net_utility;
        const tceReal = result.consolidated.tce_real;


        const html = `
            <html>
            <head>
                <title>GEEKSOFT MultiCotizador — ${vesselParams.vessel_name}</title>
                <style>
                    @page { size: letter landscape; margin: 6mm; }
                    body { font-family: 'Segoe UI', -apple-system, sans-serif; font-size: 8.5px; color: #1e293b; margin: 0; padding: 0; background: #fff; }
                    h1 { font-size: 11px; margin: 0; font-weight: 800; color: #0f172a; text-transform: uppercase; }
                    .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 4px; margin-bottom: 6px; }
                    .badge { background: #0284c7; color: white; padding: 2px 6px; font-weight: 800; border-radius: 3px; font-size: 8px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 8px; }
                    th { background: #f8fafc; color: #475569; font-weight: 700; border: 1px solid #cbd5e1; padding: 3px 4px; text-transform: uppercase; font-size: 7.5px; }
                    td { border: 1px solid #cbd5e1; padding: 3px 4px; font-family: monospace; }
                    .initial-port-row td { background: #f1f5f9; color: #475569; }
                    .total-row td { background: #e2e8f0; font-weight: bold; border-top: 2px double #64748b; font-size: 8.5px; }
                    
                    .badge-laden { background: #ffe4e6; color: #9f1239; padding: 1px 4px; border-radius: 2px; font-weight: bold; font-size: 7px; }
                    .badge-ballast { background: #f0fdf4; color: #166534; padding: 1px 4px; border-radius: 2px; font-weight: bold; font-size: 7px; }
                    
                    .cards-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 6px; }
                    .card { border: 1px solid #cbd5e1; border-radius: 4px; background: #fff; padding: 4px 6px; display: flex; flex-direction: column; justify-content: space-between; }
                    .card-header { font-weight: 800; font-size: 8.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px; color: #475569; display: flex; justify-content: space-between; }
                    .card-title-icon { display: flex; align-items: center; gap: 3px; }
                    .card-db-badge { background: #f1f5f9; color: #475569; padding: 0.5px 3px; font-size: 7px; font-family: monospace; border-radius: 2px; font-weight: bold; }
                    .card-green { background: #f0fdf4; border-color: #bbf7d0; }
                    .card-green .card-header { border-bottom-color: #bbf7d0; color: #166534; }
                    
                    .subtable { width: 100%; margin: 0; }
                    .subtable td { border: none; padding: 2px 0; }
                    .subtable tr.border-b td { border-bottom: 1px solid #f1f5f9; }
                    .subtable tr.total-sub td { border-top: 1px solid #cbd5e1; font-weight: bold; }
                    
                    .text-rose { color: #be123c; font-weight: bold; }
                    .text-emerald { color: #15803d; font-weight: bold; }
                    .text-right { text-align: right; }
                    
                    -webkit-print-color-adjust: exact; print-color-adjust: exact;
                </style>
            </head>
            <body>
                <div class="header-bar">
                    <div>
                        <h1>GEEKSOFT Estimador Quick Excel — Buque: ${vesselParams.vessel_name}</h1>
                        <div style="font-size:7.5px;color:#64748b;margin-top:1px">Fecha de cotización: ${fechaStr} | Fletes Totales (Q * F) en descargas</div>
                    </div>
                    <span class="badge">PETRAL · ESTIMADOR MULTI-LEG</span>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th style="width:2%">Leg</th>
                            <th style="width:4%">Tipo</th>
                            <th style="width:13%">Puerto Destino</th>
                            <th style="width:5%">Dist (NM)</th>
                            <th style="width:4%">WF (%)</th>
                            <th style="width:4%">Vel (KN)</th>
                            <th style="width:5%">Días Mar</th>
                            <th style="width:5%">Días Pto</th>
                            <th style="width:5%">Overhead (H)</th>
                            <th style="width:5%">Posic (H)</th>
                            <th style="width:5%">Op Dest</th>
                            <th style="width:6%">Ritmo</th>
                            <th style="width:6%">Q (MT)</th>
                            <th style="width:6%">F ($/T)</th>
                            <th style="width:7%">Costo Pto</th>
                            <th style="width:8%">Flete ($)</th>
                            <th style="width:8%">Bunker ($)</th>
                            <th style="width:7%">Bodega (T)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${initialPortRowHTML}
                        ${tramosRowsHTML}
                        <tr class="total-row">
                            <td colspan="3">Total Estimado</td>
                            <td style="text-align:right">${totalDist}</td>
                            <td style="text-align:right">—</td>
                            <td style="text-align:right">—</td>
                            <td style="text-align:right">${fmtDays(totalSeaDays)}</td>
                            <td style="text-align:right">${fmtDays(totalPortDays)}</td>
                            <td style="text-align:right">—</td>
                            <td style="text-align:right">—</td>
                            <td style="text-align:right">—</td>
                            <td style="text-align:right">—</td>
                            <td style="text-align:right">${fmtNum(totalCargas)}</td>
                            <td style="text-align:right">—</td>
                            <td style="text-align:right">${fmtCur(totalPortCosts)}</td>
                            <td style="text-align:right">${fmtCur(totalFreight)}</td>
                            <td style="text-align:right">${fmtCur(totalBunker)}</td>
                            <td style="text-align:right">—</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="cards-container">
                    <div class="card">
                        <div>
                            <div class="card-header">
                                <span class="card-title-icon">⛽ Combustible</span>
                            </div>
                            <table class="subtable">
                                <tr class="border-b">
                                    <td>IFO (Heavy Fuel)</td>
                                    <td class="text-right font-bold">${result.consolidated.bunker_ifo_tonnage || 0} t</td>
                                    <td class="text-right font-bold">${fmtCur(totalBunker)}</td>
                                </tr>
                                <tr class="border-b">
                                    <td>MDO (Diesel)</td>
                                    <td class="text-right font-bold">0.0 t</td>
                                    <td class="text-right font-bold">$0</td>
                                </tr>
                                <tr class="total-sub">
                                    <td>Total Fuel</td>
                                    <td class="text-right">${result.consolidated.bunker_ifo_tonnage || 0} t</td>
                                    <td class="text-right">${fmtCur(totalBunker)}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div>
                            <div class="card-header">
                                <span class="card-title-icon">⚓ Gastos de Puerto</span>
                                <span class="card-db-badge">${portCostMode === 'static' ? 'port_cost_static' : 'port_costs_matrix'}</span>
                            </div>
                            <table class="subtable">
                                <tr class="border-b">
                                    <td>Costos de Puerto</td>
                                    <td class="text-right font-bold">${fmtCur(totalPortCosts)}</td>
                                </tr>
                                <tr class="total-sub">
                                    <td>Total Puertos</td>
                                    <td class="text-right">${fmtCur(totalPortCosts)}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div>
                            <div class="card-header">
                                <span class="card-title-icon">💼 Comisiones de Viaje</span>
                            </div>
                            <table class="subtable">
                                <tr class="border-b">
                                    <td>Address Comm (${addressCommPct}%)</td>
                                    <td class="text-right font-bold">${fmtCur(totalFreight * (addressCommPct / 100))}</td>
                                </tr>
                                <tr class="border-b">
                                    <td>Broker Comm (${brokerCommPct}%)</td>
                                    <td class="text-right font-bold">${fmtCur(totalFreight * (brokerCommPct / 100))}</td>
                                </tr>
                                <tr class="total-sub">
                                    <td>Total Comm</td>
                                    <td class="text-right text-rose">-${fmtCur(totalComm)}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <div class="card card-green">
                        <div>
                            <div class="card-header">
                                <span class="card-title-icon">💹 P/L Financiero</span>
                            </div>
                            <table class="subtable">
                                <tr class="border-b">
                                    <td>Flete Bruto (Revenue)</td>
                                    <td class="text-right font-bold">${fmtCur(totalFreight)}</td>
                                </tr>
                                <tr class="border-b">
                                    <td>Gastos Totales (OpEx)</td>
                                    <td class="text-right text-rose">-${fmtCur(totalBunker + totalPortCosts + totalComm)}</td>
                                </tr>
                                <tr class="border-b">
                                    <td>Voyage Result (Net)</td>
                                    <td class="text-right text-emerald">${fmtCur(pnlNet)}</td>
                                </tr>
                                <tr class="border-b">
                                    <td>Días Totales del Viaje</td>
                                    <td class="text-right font-bold">${fmtDays(totalSeaDays + totalPortDays)} d</td>
                                </tr>
                                <tr class="total-sub">
                                    <td>TCE Realizado</td>
                                    <td class="text-right text-emerald">${fmtCur(tceReal)}/día</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
                
                <script>window.onload = function(){ window.print(); }</script>
            </body>
            </html>
        `;

        const pw = window.open('', '_blank', 'width=1100,height=750');
        if (pw) {
            pw.document.write(html);
            pw.document.close();
        } else {
            alert('El navegador bloqueó la ventana emergente. Habilítala para este sitio.');
        }
    };

    const fmtCur = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    const fmtNum = (val: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(val);
    const fmtDays = (val: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

    const calculatedTramosList = getCalculatedTramos();

    const totalCargas = puertosConfig
        .filter(p => p.action === 'CARGAR')
        .reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

    const totalDescargas = puertosConfig
        .filter(p => p.action === 'DESCARGAR')
        .reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

    const isBalanced = totalCargas === totalDescargas;

    const getPortDaysAndBunker = (idx: number) => {
        const p = puertosConfig[idx];
        if (!p || p.action === 'NONE') {
            return { portDays: 0, bunkerCost: 0 };
        }

        const qty = Number(p.quantity) || 0;
        
        // Resolver ritmo de operacion por defecto si esta vacio
        let rate = Number(p.op_rate) || 0;
        if (rate <= 0) {
            if (p.action === 'CARGAR') {
                rate = Number(vesselParams.act_load) || 500;
            } else if (p.action === 'DESCARGAR') {
                rate = Number(vesselParams.act_disch) || 300;
            }
        }
        
        // Resolver overhead por defecto del puerto correspondiente
        let overheadHrs = Number(p.overhead) || 0;
        if (p.overhead === '' || p.overhead === undefined) {
            // El puerto inicial (idx = 0) esta en tramos[0].origin_port_id, los siguientes en tramos[idx - 1].destination_port_id
            const portId = idx === 0 ? tramos[0]?.origin_port_id : tramos[idx - 1]?.destination_port_id;
            if (portId) {
                const trResult = idx === 0 ? result?.tramos?.[0] : result?.tramos?.[idx - 1];
                const backendOverhead = idx === 0 ? trResult?.port_overhead_hours_origin : trResult?.port_overhead_hours_dest;
                if (backendOverhead !== undefined) {
                    overheadHrs = backendOverhead;
                } else {
                    overheadHrs = Number(getAutoPortOverhead(portId, p.action)) || 6.0;
                }
            } else {
                overheadHrs = 6.0;
            }
        }

        // Resolver posicionamiento por defecto del puerto correspondiente
        let posHrs = Number(p.positioning) || 0;
        if (p.positioning === '' || p.positioning === undefined) {
            const portId = idx === 0 ? tramos[0]?.origin_port_id : tramos[idx - 1]?.destination_port_id;
            if (portId) {
                const trResult = idx === 0 ? result?.tramos?.[0] : result?.tramos?.[idx - 1];
                const backendPos = idx === 0 
                    ? trResult?.positioning_carga_hrs 
                    : (p.action === 'CARGAR' ? trResult?.positioning_carga_hrs : trResult?.positioning_descarga_hrs);
                if (backendPos !== undefined) {
                    posHrs = backendPos;
                } else {
                    posHrs = Number(getAutoPortPositioning(portId, p.action)) || 0.0;
                }
            }
        }
        
        let delayHrs = 0;
        if (idx === 0) {
            if (p.action === 'CARGAR') {
                delayHrs = Number(tramos[0]?.port_delay_hours_loading) || 0;
            } else if (p.action === 'DESCARGAR') {
                delayHrs = Number(tramos[0]?.port_delay_hours_discharging) || 0;
            }
        } else {
            if (p.action === 'CARGAR') {
                delayHrs = Number(tramos[idx - 1]?.port_delay_hours_loading) || 0;
            } else if (p.action === 'DESCARGAR') {
                delayHrs = Number(tramos[idx - 1]?.port_delay_hours_discharging) || 0;
            }
        }

        // Fórmula del Voyage Ledger:
        // port_days = (Q_hrs_op + overhead_hrs + positioning_hrs + delay_hrs) / 24
        // donde Q_hrs_op = Q / rate_en_T_por_hora
        const ratePerHour = p.rate_unit === 'TH' ? rate : rate / 24;  // T/h siempre
        const opHrs = ratePerHour > 0 ? qty / ratePerHour : 0;        // horas de operación
        const portDays = (opHrs + overheadHrs + posHrs + delayHrs) / 24; // todo a días

        let consIfo = 0;
        let consMdo = 0;
        if (p.action === 'CARGAR') {
            consIfo = Number(vesselParams.consumption_idle_ifo) || 0;
            consMdo = Number(vesselParams.consumption_idle_mdo) || 0;
        } else if (p.action === 'DESCARGAR') {
            consIfo = Number(vesselParams.consumption_disch_ifo) || 0;
            consMdo = Number(vesselParams.consumption_disch_mdo) || 0;
        }

        const bunkerCost = portDays * (consIfo * bunkerPriceIfo + consMdo * bunkerPriceMdo);
        return { portDays, bunkerCost };
    };

    const renderAuditTab = () => {
        if (!result) {
            return (
                <div className="flex-1 flex flex-col justify-center items-center bg-white border border-slate-300 rounded shadow-sm p-12 text-slate-500 font-bold">
                    <span>⚠️ Por favor, simule o cargue una cotización en la pestaña "Estimador" antes de ingresar a Cálculos Detallados.</span>
                </div>
            );
        }

        const tramosList = result.tramos || [];
        const c = result.consolidated;
        const tot_dist = c.total_distance || 0;
        const tot_days = c.total_days || 0;
        const sea_days = c.total_sea_days || 0;
        const port_days = c.total_port_days || 0;
        const bunker_cost = c.total_bunker_costs || 0;
        const ifo_tonnage = c.bunker_ifo_tonnage || 0;
        const mdo_tonnage = c.bunker_mdo_tonnage || 0;
        const port_costs = c.total_port_costs || 0;
        const net_income = c.total_freight_revenue || 0;
        const pnl_net = c.pnl_net_utility || 0;
        const tce_real = c.tce_real || 0;
        const tce_req = Number(vesselParams.tce_required) || Number((vessels.find((v: any) => v.vessel_id === selectedVessel) as any)?.tce_required) || 0;
          const comm_total = c.total_commissions !== undefined && c.total_commissions > 0 
            ? c.total_commissions 
            : (net_income * ((addressCommPct + brokerCommPct) / 100));

        const p_ifo = bunkerPriceIfo;
        const p_mdo = bunkerPriceMdo;
        const tce_diff = tce_real - tce_req;

        const ladenLeg = tramosList.find((t: any) => t.type === 'LADEN') || tramosList[0] || {};
        const Q = ladenLeg.quantity || 0;
        const F = ladenLeg.freight_rate || 0;
        const r_l = Number(vesselParams.act_load) || 0;
        const r_d = Number(vesselParams.act_disch) || 0;
        const orig_p = tramosList[0]?.origin_port_id || '';
        const dest_p = ladenLeg.destination_port_id || '';
        const c_orig = tramosList[0]?.agency_costs_origin || 0;
        const c_dest = ladenLeg.agency_costs_destination || 0;

        const trayectoStr = tramosList.map((t: any) => t.origin_port_id).concat([tramosList[tramosList.length - 1]?.destination_port_id]).join(' ➔ ');
        const seaDaysCalcStr = tramosList.map((tr: any, idx: number) => `P#${idx+1} ${tr.type}(${tr.distance || 0}NM: ${fmtDays(tr.sea_days || 0)}d)`).join(' + ');

        const W = 148;
        const lines: string[] = [];
        lines.push(`AUDITANDO RUTA: ${loadedRouteName || selectedClient || 'COTIZACIÓN MULTICOTIZADOR'} (${tramosList.length} Piernas)`);
        lines.push("═".repeat(W));
        lines.push("📋 [INPUTS Y VARIABLES DE ORIGEN DE CÁLCULO - CARDS MAESTROS]:");
        lines.push(`  • CARD 1 (RUTAS):                 Itinerario: ${trayectoStr} | Dist. Total: ${fmtNum(tot_dist)} NM | Weather Factor: 3.0% (0.03)`);
        lines.push(`  • CARD 2 (BUQUES):                Vessel: ${vesselParams.vessel_name || selectedVessel} | Speed: ${vesselParams.vessel_speed || 11.0} kts | Cons. Sea IFO: ${vesselParams.consumption_sea_ifo || 14.0} t/d | Cons. Idle IFO: ${vesselParams.consumption_idle_ifo || 2.4} t/d | TCE Requerido: ${fmtCur(tce_req)}/d`);
        lines.push(`  • CARD 3 (BÚNKER):                Precio IFO: ${fmtCur(p_ifo)}/t | Precio MDO: ${fmtCur(p_mdo)}/t | Consumo Est.: ${fmtDays(ifo_tonnage)} t IFO / ${fmtDays(mdo_tonnage)} t MDO | BAF Baseline: $430.00/t`);
        lines.push(`  • CARD 4 (CONTRATOS & COMERCIAL): Cliente: ${selectedClient || 'PROSPECTO'} | Q: ${fmtNum(Q)} MT | Freight Base: ${fmtCur(F)}/MT | Ritmo Carga: ${fmtNum(r_l)} T/h | Ritmo Desc: ${fmtNum(r_d)} T/h | Comisiones: Address ${addressCommPct}% / Broker ${brokerCommPct}%`);
        lines.push(`  • CARD 5 (PUERTOS & AGENCIA):     Agencia Carga (${orig_p}): ${fmtCur(c_orig)} USD | Agencia Descarga (${dest_p}): ${fmtCur(c_dest)} USD | Total Port Costs: ${fmtCur(port_costs)} USD`);
        lines.push("─".repeat(W));
        lines.push("  ┌" + "─".repeat(W - 4));
        lines.push(`  │ 📍 RESUMEN CONSOLIDADO: Distancia ${fmtNum(tot_dist)} NM | Días Totales ${fmtDays(tot_days)}d (${fmtDays(sea_days)}d Mar + ${fmtDays(port_days)}d Puerto)`);
        lines.push(`  │ ⛽ Búnker Total:  ${fmtCur(bunker_cost)} USD (${fmtDays(ifo_tonnage)} t IFO | ${fmtDays(mdo_tonnage)} t MDO)`);
        lines.push(`  │ ⚓ Puerto Total:  ${fmtCur(port_costs)} USD`);
        lines.push(`  │ 💰 Ingreso Flete: ${fmtCur(net_income)} USD | PnL Neto: ${fmtCur(pnl_net)} USD | TCE: ${fmtCur(tce_real)} USD/Día`);
        lines.push("  ├" + "─".repeat(W - 4));
        lines.push("  │ 🔍 ARITMÉTICA EXPLICATIVA Y ORIGEN DE LOS DÍAS (MAR VS PUERTO):");

        tramosList.forEach((tr: any, idx: number) => {
            const tipo = tr.type || 'BALLAST';
            const orig = tr.origin_port_id;
            const dest = tr.destination_port_id;
            const distP = tr.distance || 0;
            const wf = tr.weather_factor || 0.03;
            const seaD = tr.sea_days || 0;
            const portD = tr.port_days || 0;
            const bunkSeaIf_o = seaD * (Number(vesselParams.consumption_sea_ifo) || 14.0);
            const bunkSeaCost = bunkSeaIf_o * p_ifo;
            const bunkPortIf_o = (tr.bunker_ifo || 0) - bunkSeaIf_o;
            const bunkPortM_do = tr.bunker_mdo || 0;
            const bunkPortCost = (bunkPortIf_o * p_ifo) + (bunkPortM_do * p_mdo);
            const bunkTotalLeg = tr.bunker_costs || 0;
            const costOrig = tr.agency_costs_origin || 0;
            const costDest = tr.agency_costs_destination || 0;
            const incomeP = tr.net_income || 0;

            lines.push(`  │   • PIERNA #${idx+1} [${tipo}]: ${orig} ➔ ${dest} | Distancia: ${fmtNum(distP)} NM`);
            lines.push(`  │       🌊 Días de Mar (${fmtDays(seaD)}d): [${fmtNum(distP)} NM × (1 + ${(wf * (wf > 1 ? 1 : 100)).toFixed(1)}% WF)] / [${vesselParams.vessel_speed || 11.0} kts × 24h] = ${fmtDays(seaD)} Días`);
            lines.push(`  │          ↳ Búnker Mar: ${fmtDays(seaD)}d × ${vesselParams.consumption_sea_ifo || 14.0} t/d IFO × ${fmtCur(p_ifo)} = ${fmtCur(bunkSeaCost)} USD`);

            if (tipo === 'LADEN') {
                const legQ = tr.quantity || 13500;
                const legRl = r_l;
                const legRd = r_d;
                const loadD = legRl > 0 ? (legQ / legRl) / 24 : 0;
                const dischD = legRd > 0 ? (legQ / legRd) / 24 : 0;
                const idleD = Math.max(0, portD - loadD - dischD);

                lines.push(`  │       ⚓ Días de Puerto (${fmtDays(portD)}d): Carga (${fmtNum(legQ)}t/${fmtNum(legRl)}t/h = ${fmtDays(loadD)}d) + Descarga (${fmtNum(legQ)}t/${fmtNum(legRd)}t/h = ${fmtDays(dischD)}d) + Overheads (${fmtDays(idleD)}d) = ${fmtDays(portD)} Días`);
                lines.push(`  │          ↳ Búnker Puerto: ${fmtDays(bunkPortIf_o)} t IFO + ${fmtDays(bunkPortM_do)} t MDO = ${fmtCur(bunkPortCost)} USD`);
                lines.push(`  │       🔥 Búnker Total Pierna:  ${fmtCur(bunkSeaCost)} + ${fmtCur(bunkPortCost)} = ${fmtCur(bunkTotalLeg)} USD`);
                lines.push(`  │       🚢 Agencia Carga (${orig}):    ${fmtCur(costOrig)} USD`);
                lines.push(`  │       🚢 Agencia Descarga (${dest}): ${fmtCur(costDest)} USD`);
                lines.push(`  │       💵 Ingreso Flete Leg:     ${fmtCur(incomeP)} USD`);
            } else {
                lines.push(`  │       ⚓ Días de Puerto: 0.00 Días (Pierna en Lastre)`);
                lines.push(`  │       🔥 Búnker Total Pierna: ${fmtCur(bunkTotalLeg)} USD`);
                lines.push(`  │       🚢 Agencia Puerto:      $0.00 USD (Lastre)`);
            }
        });

        lines.push("  └" + "─".repeat(W - 4));
        const textBlock = lines.join("\n");

        const handlePrintCalculosDetalladosHtml = () => {
            const printWindow = window.open('', '_blank');
            if (!printWindow) return;

            const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Acta Oficial de Cálculos Detallados - ${loadedRouteName || selectedClient || 'Cotización'}</title>
    <style>
        @page { size: A4 landscape; margin: 6mm 8mm; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 6.8pt; color: #000; background: #fff; line-height: 1.2; margin: 0; padding: 0; }
        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; border-bottom: 2px solid #000; padding-bottom: 4px; }
        .header-table td { vertical-align: middle; }
        .console-block { white-space: pre; font-family: 'Courier New', Courier, monospace; font-size: 6.5pt; line-height: 1.18; margin-bottom: 6px; background: #fafafa; border: 1px solid #ccc; padding: 6px; }
        table.metrics-table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 6.5pt; page-break-inside: avoid !important; break-inside: avoid !important; }
        table.metrics-table th, table.metrics-table td { border: 1px solid #000; padding: 2px 4px; }
        table.metrics-table th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
        .metrics-block { page-break-inside: avoid !important; break-inside: avoid !important; margin-top: 6px; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td style="width: 25%; text-align: left;">
                <img src="${logoPetral}" style="height: 38px; object-fit: contain;" />
            </td>
            <td style="width: 50%; text-align: center;">
                <span style="font-size: 11pt; font-weight: bold;">PETRAL SMART DASHBOARD • MOTOR SPOT GEEKSOFT ENGINE</span><br/>
                <span style="font-size: 8.5pt; font-weight: bold; color: #333;">ACTA OFICIAL DE CÁLCULOS DETALLADOS Y LEDGER DE VIAJE (AUDITORÍA MATEMÁTICA V2)</span>
            </td>
            <td style="width: 25%; text-align: right;">
                <img src="${logoGeeksoft}" style="height: 38px; object-fit: contain;" />
            </td>
        </tr>
    </table>

    <div class="console-block">${textBlock}</div>

    <div class="metrics-block">
        <div style="font-weight: bold; font-size: 7pt; margin-bottom: 2px;">
            [TABLA OFICIAL DE AUDITORÍA LEDGER — 13 MÉTRICAS REPLICADAS DE LA UI]:
        </div>

    <table class="metrics-table">
        <thead>
            <tr>
                <th style="width: 22%;">ÍTEM / MÉTRICA OFICIAL</th>
                <th style="width: 30%;">FÓRMULA APLICADA</th>
                <th style="width: 34%;">CÁLCULO SUSTITUIDO NUMÉRICO</th>
                <th style="width: 14%;">GEEKSOFT ENGINE</th>
            </tr>
        </thead>
        <tbody>
            <tr><td class="bold">1. Ritmo Carga (act_load)</td><td>contract_load_rate</td><td>${r_l} T/h (${vesselParams.vessel_name || selectedVessel})</td><td class="text-right bold">${r_l} T/h</td></tr>
            <tr><td class="bold">2. Ritmo Descarga (act_disch)</td><td>contract_discharge_rate</td><td>${r_d} T/h (${vesselParams.vessel_name || selectedVessel})</td><td class="text-right bold">${r_d} T/h</td></tr>
            <tr><td class="bold">3. Días de Puerto (port_days)</td><td>Sum((Q/act_load)/24 + (Q/act_disch)/24 + idle)</td><td>Load(${fmtDays(Q/r_l/24)}d) + Disch(${fmtDays(Q/r_d/24)}d) + Overheads(${fmtDays(Math.max(0, port_days - (Q/r_l/24) - (Q/r_d/24)))}d)</td><td class="text-right bold">${fmtDays(port_days)} Días</td></tr>
            <tr><td class="bold">4. Días de Mar (sea_days)</td><td>Sum((dist_leg * (1 + WF)) / (speed * 24))</td><td>${seaDaysCalcStr}</td><td class="text-right bold">${fmtDays(sea_days)} Días</td></tr>
            <tr><td class="bold">5. Días de Viaje (tot_dur)</td><td>sea_days + port_days</td><td>${fmtDays(sea_days)}d Mar + ${fmtDays(port_days)}d Puerto</td><td class="text-right bold">${fmtDays(tot_days)} Días</td></tr>
            <tr><td class="bold">6. Income (income)</td><td>Sum(Q_leg * F_leg)</td><td>${tramosList.filter((t: any) => t.type === 'LADEN').length} Descargas × ${fmtNum(Q)} MT × ${fmtCur(F)} USD/MT</td><td class="text-right bold">${fmtCur(net_income)}</td></tr>
            <tr><td class="bold">7. Comisiones (commissions)</td><td>income * (addr_comm + bkr_comm)</td><td>${fmtCur(net_income)} × ${(addressCommPct + brokerCommPct).toFixed(2)}%</td><td class="text-right bold">${fmtCur(comm_total)}</td></tr>
            <tr><td class="bold">8. Costo Bunker (bunker)</td><td>bunker_sea + bunker_port</td><td>${fmtDays(ifo_tonnage)}t IFO × ${fmtCur(p_ifo)} + ${fmtDays(mdo_tonnage)}t MDO × ${fmtCur(p_mdo)}</td><td class="text-right bold">${fmtCur(bunker_cost)}</td></tr>
            <tr><td class="bold">9. Port Costs (port_costs)</td><td>Sum(agency_origin + agency_dest)</td><td>Puertos Origen + Puertos Destino</td><td class="text-right bold">${fmtCur(port_costs)}</td></tr>
            <tr><td class="bold">10. Voyage Result (P&L)</td><td>income - comm - bunker - port_costs</td><td>${fmtCur(net_income)} - ${comm_total > 0 ? fmtCur(comm_total) + ' - ' : ''}${fmtCur(bunker_cost)} - ${fmtCur(port_costs)}</td><td class="text-right bold">${fmtCur(pnl_net)}</td></tr>
            <tr><td class="bold">11. TCE Realizado (tce_real)</td><td>voyage_result / tot_dur</td><td>${fmtCur(pnl_net)} / ${fmtDays(tot_days)} Días</td><td class="text-right bold">${fmtCur(tce_real)}/día</td></tr>
            <tr><td class="bold">12. TCE Requerido (tce_req)</td><td>vessel_tce_required</td><td>${vesselParams.vessel_name || selectedVessel} (${fmtCur(tce_req)}/d)</td><td class="text-right bold">${fmtCur(tce_req)}/día</td></tr>
            <tr><td class="bold">13. Diferencia TCE (+/-)</td><td>tce_real - tce_req</td><td>${fmtCur(tce_real)}/d - ${fmtCur(tce_req)}/d</td><td class="text-right bold">${tce_diff >= 0 ? '+' : ''}${fmtCur(tce_diff)}/día</td></tr>
        </tbody>
    </table>
    </div>
</body>
</html>`;

            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        };

        return (
            <div className="flex-1 flex flex-col min-h-0 w-full gap-2 bg-slate-100 p-2 rounded">
                <style>{`
                    @media print {
                        .no-print { display: none !important; }
                        .print-only { display: block !important; }
                        body, html { background: white !important; color: black !important; width: 297mm; height: 210mm; margin: 0 !important; padding: 0 !important; }
                        @page { size: A4 landscape; margin: 6mm 8mm; }
                    }
                `}</style>
                <div className="bg-white border border-slate-300 rounded shadow-sm p-3 flex-shrink-0 flex items-center justify-between no-print">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">📐</span>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 leading-none">Cálculos Detallados y Demostración Algebraica</h2>
                            <span className="text-[10.5px] text-slate-400 font-medium">Desglose transparente paso a paso de todos los inputs, fórmulas y sustituciones numéricas del Estimador</span>
                        </div>
                    </div>
                    <button
                        onClick={handlePrintCalculosDetalladosHtml}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                        🖨️ Imprimir Cálculos Detallados (PDF)
                    </button>
                </div>
                
                {/* CONTENIDO INTERACTIVO EN PANTALLA & EN IMPRESIÓN CON FORMATO AUDITORÍA FINAL */}
                <div className="flex-1 bg-white border border-slate-300 rounded shadow-sm p-3 flex flex-col min-h-0 overflow-auto font-mono text-[11px] leading-tight">
                    {/* CABECERA CORPORATIVA DE AUDITORÍA CON LOGOS OFICIALES */}
                    <div className="border-b-2 border-black pb-2 mb-3 flex justify-between items-center bg-white px-2 py-1">
                        <div className="w-1/4 text-left">
                            <img src={logoPetral} alt="PETRAL Logo" className="h-9 object-contain" />
                        </div>
                        <div className="w-2/4 text-center font-bold">
                            <h1 className="text-sm font-black text-slate-900 block leading-tight">
                                PETRAL SMART DASHBOARD • MOTOR SPOT GEEKSOFT ENGINE
                            </h1>
                            <span className="text-[10px] text-slate-600 font-bold block mt-0.5">
                                ACTA OFICIAL DE CÁLCULOS DETALLADOS Y LEDGER DE VIAJE (AUDITORÍA MATEMÁTICA V2)
                            </span>
                        </div>
                        <div className="w-1/4 text-right flex justify-end">
                            <img src={logoGeeksoft} alt="GEEKSOFT Logo" className="h-9 object-contain" />
                        </div>
                    </div>

                    {/* CONSOLA DE ARITMÉTICA ASCII (FONDO CLARO TEXTO NEGRO) */}
                    <div className="bg-slate-50 text-slate-900 p-3 rounded border border-slate-300 whitespace-pre font-mono text-[9.5px] leading-tight overflow-x-auto mb-3">
                        {textBlock}
                    </div>

                    {/* TABLA OFICIAL DE 13 MÉTRICAS REPLICADAS DE LA UI */}
                    <div className="font-bold text-xs mb-1 text-slate-900">
                        [TABLA OFICIAL DE AUDITORÍA LEDGER — 13 MÉTRICAS REPLICADAS DE LA UI]:
                    </div>

                    <div className="border border-black rounded overflow-hidden">
                        <table className="w-full text-left font-mono text-[10px] border-collapse">
                            <thead>
                                <tr className="bg-slate-200 border-b border-black text-slate-900 font-bold">
                                    <th className="p-1.5 border-r border-black w-[22%]">ÍTEM / MÉTRICA OFICIAL</th>
                                    <th className="p-1.5 border-r border-black w-[30%]">FÓRMULA APLICADA</th>
                                    <th className="p-1.5 border-r border-black w-[34%]">CÁLCULO SUSTITUIDO NUMÉRICO</th>
                                    <th className="p-1.5 text-right w-[14%]">GEEKSOFT ENGINE</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-300">
                                <tr>
                                    <td className="p-1.5 font-bold border-r border-slate-300">1. Ritmo Carga (act_load)</td>
                                    <td className="p-1.5 border-r border-slate-300 text-slate-600">contract_load_rate</td>
                                    <td className="p-1.5 border-r border-slate-300">{r_l} T/h ({vesselParams.vessel_name || selectedVessel})</td>
                                    <td className="p-1.5 text-right font-bold">{r_l} T/h</td>
                                </tr>
                                <tr>
                                    <td className="p-1.5 font-bold border-r border-slate-300">2. Ritmo Descarga (act_disch)</td>
                                    <td className="p-1.5 border-r border-slate-300 text-slate-600">contract_discharge_rate</td>
                                    <td className="p-1.5 border-r border-slate-300">{r_d} T/h ({vesselParams.vessel_name || selectedVessel})</td>
                                    <td className="p-1.5 text-right font-bold">{r_d} T/h</td>
                                </tr>
                                <tr>
                                    <td className="p-1.5 font-bold border-r border-slate-300">3. Días de Puerto (port_days)</td>
                                    <td className="p-1.5 border-r border-slate-300 text-slate-600">Sum((Q/act_load)/24 + (Q/act_disch)/24 + idle)</td>
                                    <td className="p-1.5 border-r border-slate-300">Load({fmtDays(Q/r_l/24)}d) + Disch({fmtDays(Q/r_d/24)}d) + Overheads({fmtDays(Math.max(0, port_days - (Q/r_l/24) - (Q/r_d/24)))}d)</td>
                                    <td className="p-1.5 text-right font-bold">{fmtDays(port_days)} Días</td>
                                </tr>
                                <tr>
                                    <td className="p-1.5 font-bold border-r border-slate-300">4. Días de Mar (sea_days)</td>
                                    <td className="p-1.5 border-r border-slate-300 text-slate-600">Sum((dist_leg * (1 + WF)) / (speed * 24))</td>
                                    <td className="p-1.5 border-r border-slate-300">{seaDaysCalcStr}</td>
                                    <td className="p-1.5 text-right font-bold">{fmtDays(sea_days)} Días</td>
                                </tr>
                                <tr>
                                    <td className="p-1.5 font-bold border-r border-slate-300">5. Días de Viaje (tot_dur)</td>
                                    <td className="p-1.5 border-r border-slate-300 text-slate-600">sea_days + port_days</td>
                                    <td className="p-1.5 border-r border-slate-300">{fmtDays(sea_days)}d Mar + {fmtDays(port_days)}d Puerto</td>
                                    <td className="p-1.5 text-right font-bold">{fmtDays(tot_days)} Días</td>
                                </tr>
                                <tr>
                                    <td className="p-1.5 font-bold border-r border-slate-300">6. Income (income)</td>
                                    <td className="p-1.5 border-r border-slate-300 text-slate-600">Sum(Q_leg * F_leg)</td>
                                    <td className="p-1.5 border-r border-slate-300">{tramosList.filter((t: any) => t.type === 'LADEN').length} Descargas × {fmtNum(Q)} MT × {fmtCur(F)} USD/MT</td>
                                    <td className="p-1.5 text-right font-bold">{fmtCur(net_income)}</td>
                                </tr>
                                <tr>
                                    <td className="p-1.5 font-bold border-r border-slate-300">7. Comisiones (commissions)</td>
                                    <td className="p-1.5 border-r border-slate-300 text-slate-600">income * (addr_comm + bkr_comm)</td>
                                    <td className="p-1.5 border-r border-slate-300">{fmtCur(net_income)} × ${(addressCommPct + brokerCommPct).toFixed(2)}%</td>
                                    <td className="p-1.5 text-right font-bold">{fmtCur(comm_total)}</td>
                                </tr>
                                <tr>
                                    <td className="p-1.5 font-bold border-r border-slate-300">8. Costo Bunker (bunker)</td>
                                    <td className="p-1.5 border-r border-slate-300 text-slate-600">bunker_sea + bunker_port</td>
                                    <td className="p-1.5 border-r border-slate-300">{fmtDays(ifo_tonnage)}t IFO × {fmtCur(p_ifo)} + {fmtDays(mdo_tonnage)}t MDO × {fmtCur(p_mdo)}</td>
                                    <td className="p-1.5 text-right font-bold">{fmtCur(bunker_cost)}</td>
                                </tr>
                                <tr>
                                    <td className="p-1.5 font-bold border-r border-slate-300">9. Port Costs (port_costs)</td>
                                    <td className="p-1.5 border-r border-slate-300 text-slate-600">Sum(agency_origin + agency_dest)</td>
                                    <td className="p-1.5 border-r border-slate-300">Puertos Origen + Puertos Destino</td>
                                    <td className="p-1.5 text-right font-bold">{fmtCur(port_costs)}</td>
                                </tr>
                                <tr>
                                    <td className="p-1.5 font-bold border-r border-slate-300">10. Voyage Result (P&L)</td>
                                    <td className="p-1.5 border-r border-slate-300 text-slate-600">income - comm - bunker - port_costs</td>
                                    <td className="p-1.5 border-r border-slate-300">{fmtCur(net_income)} - {comm_total > 0 ? fmtCur(comm_total) + ' - ' : ''}{fmtCur(bunker_cost)} - {fmtCur(port_costs)}</td>
                                    <td className="p-1.5 text-right font-bold">{fmtCur(pnl_net)}</td>
                                </tr>
                                <tr>
                                    <td className="p-1.5 font-bold border-r border-slate-300">11. TCE Realizado (tce_real)</td>
                                    <td className="p-1.5 border-r border-slate-300 text-slate-600">voyage_result / tot_dur</td>
                                    <td className="p-1.5 border-r border-slate-300">{fmtCur(pnl_net)} / {fmtDays(tot_days)} Días</td>
                                    <td className="p-1.5 text-right font-bold">{fmtCur(tce_real)}/día</td>
                                </tr>
                                <tr>
                                    <td className="p-1.5 font-bold border-r border-slate-300">12. TCE Requerido (tce_req)</td>
                                    <td className="p-1.5 border-r border-slate-300 text-slate-600">vessel_tce_required</td>
                                    <td className="p-1.5 border-r border-slate-300">{vesselParams.vessel_name || selectedVessel} ({fmtCur(tce_req)}/d)</td>
                                    <td className="p-1.5 text-right font-bold">{fmtCur(tce_req)}/día</td>
                                </tr>
                                <tr>
                                    <td className="p-1.5 font-bold border-r border-slate-300">13. Diferencia TCE (+/-)</td>
                                    <td className="p-1.5 border-r border-slate-300 text-slate-600">tce_real - tce_req</td>
                                    <td className="p-1.5 border-r border-slate-300">{fmtCur(tce_real)}/d - {fmtCur(tce_req)}/d</td>
                                    <td className="p-1.5 text-right font-bold">{tce_diff >= 0 ? '+' : ''}${fmtCur(tce_diff)}/día</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const getBodegaSaliente = (idx: number) => {
        let qty = 0;
        for (let i = 0; i <= idx; i++) {
            const p = puertosConfig[i];
            if (!p) continue;
            if (p.action === 'CARGAR') {
                qty += Number(p.quantity) || 0;
            } else if (p.action === 'DESCARGAR') {
                qty -= Number(p.quantity) || 0;
            }
        }
        return qty >= 0 ? qty : 0;
    };

    return (
        <div className="bg-[#f3f4f6] text-[13px] text-slate-800 flex-1 flex flex-col min-h-0 w-full p-2 font-sans overflow-y-auto">
            {/* TABS PRINCIPALES (no-print) */}
            <div className="flex gap-1 mb-2 no-print shrink-0">
                <button
                    onClick={() => setActiveMainTab('estimator')}
                    className={`px-4 py-1.5 rounded-t-lg font-bold text-xs transition-colors flex items-center gap-1.5 border border-b-0 ${
                        activeMainTab === 'estimator'
                            ? 'bg-white border-slate-300 text-blue-600 shadow-sm font-black'
                            : 'bg-slate-200/60 border-transparent text-slate-500 hover:bg-slate-250 hover:text-slate-700'
                    }`}
                >
                    📊 Estimador (Excel)
                </button>
                <button
                    onClick={() => setActiveMainTab('audit')}
                    className={`px-4 py-1.5 rounded-t-lg font-bold text-xs transition-colors flex items-center gap-1.5 border border-b-0 ${
                        activeMainTab === 'audit'
                            ? 'bg-white border-slate-300 text-blue-600 shadow-sm font-black'
                            : 'bg-slate-200/60 border-transparent text-slate-500 hover:bg-slate-250 hover:text-slate-700'
                    }`}
                >
                    📐 Cálculos Detallados
                </button>
            </div>

            {activeMainTab === 'estimator' ? (
                <div className="flex-1 flex flex-col min-h-0 w-full overflow-y-auto">
                    {/* 1. RIBBON SUPERIOR DE DOS FILAS: ACCIONES Y FACT SHEET */}
                    <div className="bg-white border border-slate-300 rounded shadow-sm p-2 mb-2 flex flex-col gap-2 select-none flex-shrink-0">
                
                {/* FILA 1: UNIFICADA TOTAL DE CONTROLES (UNA SOLA FILA HORIZONTAL) */}
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200 flex-wrap gap-2">
                    {/* Título & Badge */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black tracking-tight text-slate-900 font-sans uppercase">
                            MultiCotizador
                        </span>
                        {loadedRouteName && (
                            <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                📌 {loadedRouteName}
                            </span>
                        )}
                    </div>

                    {/* 1. SELECCIONAR CLIENTE */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 tracking-wide">
                            1. SELECCIONAR CLIENTE
                        </span>
                        <div className="flex bg-slate-200/70 p-0.5 rounded h-6.5 shadow-inner items-center">
                            <button
                                onClick={toggleActivo}
                                className={`px-2 h-5.5 text-[9.5px] font-black rounded transition-all cursor-pointer ${filterActivo ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Activos
                            </button>
                            <button
                                onClick={toggleProspecto}
                                className={`px-2 h-5.5 text-[9.5px] font-black rounded transition-all cursor-pointer ${filterProspecto ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Prospectos
                            </button>
                        </div>
                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className="h-6.5 border border-slate-300 rounded px-1.5 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans shadow-sm min-w-[140px]"
                        >
                            <option value="">Seleccione cliente...</option>
                            {clients.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* 2. CARGAR RUTA */}
                    <button
                        onClick={handleLoadClick}
                        className="h-6.5 text-[11px] font-black uppercase text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-2.5 transition-colors cursor-pointer flex items-center gap-1 shadow-sm tracking-wide"
                        title="Cargar Ruta predeterminada desde la tabla de rutas"
                    >
                        <FolderOpen size={12} className="text-blue-600" />
                        2. CARGAR RUTA
                    </button>

                    {/* 3. CARGAR COTIZACIÓN */}
                    <button
                        onClick={handleLoadClick}
                        className="h-6.5 text-[11px] font-black uppercase text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-2.5 transition-colors cursor-pointer flex items-center gap-1 shadow-sm tracking-wide"
                        title="Cargar Cotización guardada"
                    >
                        <FolderOpen size={12} className="text-blue-600" />
                        3. CARGAR COTIZACIÓN
                    </button>

                    {/* 4. SELECCIONAR BUQUE */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 tracking-wide">
                            4. SELECCIONAR BUQUE
                        </span>
                        <select
                            value={selectedVessel}
                            onChange={(e) => handleVesselChange(e.target.value)}
                            className="h-6.5 bg-white border border-slate-300 rounded px-1.5 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans shadow-sm min-w-[160px]"
                        >
                            <option value="">⚓ [SELECCIONE BUQUE]</option>
                            {vessels.map(v => (
                                <option key={v.vessel_id} value={v.vessel_id}>{v.vessel_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* 5. COSTOS PUERTO */}
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded h-6.5 border border-slate-300">
                        <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 uppercase tracking-wide">
                            5. COSTOS PUERTO:
                        </span>
                        <button
                            onClick={() => setLocalPortCostMode('static')}
                            className={`px-1.5 h-5 text-[9px] font-black rounded transition-all cursor-pointer ${
                                localPortCostMode === 'static' ? 'bg-white text-blue-600 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700'
                            }`}
                            title="Modo Estático: Tarifa de port_cost_static ($0.00 estricto si falta)"
                        >
                            STATIC
                        </button>
                        <button
                            onClick={() => setLocalPortCostMode('matrix')}
                            className={`px-1.5 h-5 text-[9px] font-black rounded transition-all cursor-pointer ${
                                localPortCostMode === 'matrix' ? 'bg-white text-blue-600 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700'
                            }`}
                            title="Modo Matriz Compleja: Promedio entre Escenario Alto y Bajo"
                        >
                            MATRIX
                        </button>
                    </div>
                </div>

                {/* FILA 2: FACT SHEET DEL BARCO Y BUNKER EN TABLA UNIFICADA */}
                <div className="bg-slate-50/50 border border-slate-200 rounded p-1 flex-shrink-0">
                    <table className="w-full border-collapse border border-slate-250 bg-white font-mono text-[11px] table-fixed">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-250 font-sans text-[9.5px] text-slate-500 font-bold uppercase tracking-wider h-7">
                                <th className="border-r border-slate-200 text-left pl-1.5 font-extrabold uppercase text-[9.5px] text-slate-700 truncate" style={{ width: '8.5%' }} title={`Buque: ${selectedVessel || 'SELECCIONAR'}`}>
                                    VESSEL: {selectedVessel ? (vessels.find(v => v.vessel_id === selectedVessel)?.vessel_name || selectedVessel) : 'SELECCIONAR'}
                                </th>
                                <th className="border-r border-slate-200 text-right pr-2" style={{ width: '5%' }}>GRT (t)</th>
                                <th className="border-r border-slate-200 text-right pr-2" style={{ width: '6.5%' }}>DWT (t)</th>
                                <th className="border-r border-slate-200 text-right pr-2" style={{ width: '6.5%' }}>DWCC (t)</th>
                                <th className="border-r border-slate-200 text-right pr-2" style={{ width: '5%' }}>Speed (kn)</th>
                                <th className="border-r border-slate-200 text-right pr-2" style={{ width: '7%' }}>TCE Req ($/d)</th>
                                <th className="border-r border-slate-200 text-right pr-2" style={{ width: '5%' }}>LOA (m)</th>
                                <th className="border-r border-slate-200 text-right pr-2" style={{ width: '5%' }}>Beam (m)</th>
                                <th className="border-r border-slate-200 text-center bg-slate-50 text-[9px]" style={{ width: '4%' }}>Fuel</th>
                                <th className="border-r border-slate-200 text-center" style={{ width: '6.5%' }}>Sea (t/d)</th>
                                <th className="border-r border-slate-200 text-center" style={{ width: '6.5%' }}>Idle (t/d)</th>
                                <th className="border-r border-slate-200 text-center" style={{ width: '6.5%' }}>Load (t/d)</th>
                                <th className="border-r border-slate-200 text-center" style={{ width: '6.5%' }}>Disch (t/d)</th>
                                <th className="border-r border-slate-200 text-center" style={{ width: '6.5%' }}>IFO ($/T)</th>
                                <th className="text-center" style={{ width: '8%' }}>MDO ($/T)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-200 h-14">
                                {/* Buque con Foto Oficial de Flota (Fondo Blanco Limpio sin Marcos ni Textos Repetidos) */}
                                <td className="border-r border-slate-200 p-0.5 text-center align-middle bg-white" rowSpan={2}>
                                    {(() => {
                                        if (!selectedVessel || selectedVessel.trim() === '') {
                                            return (
                                                <div className="w-full h-full flex flex-col items-center justify-center p-1 text-slate-400 select-none bg-white font-sans font-bold text-[10px] uppercase">
                                                    Seleccionar buque
                                                </div>
                                            );
                                        }

                                        const vObj = vessels.find(v => v.vessel_id === selectedVessel);
                                        let photoSrc = vObj?.image_url;
                                        if (!photoSrc || photoSrc.trim() === '') {
                                            const vid = (selectedVessel || vObj?.vessel_id || '').toUpperCase();
                                            const vname = (vObj?.vessel_name || '').toUpperCase();
                                            if (vid.includes('MOQUEGUA') || vname.includes('MOQUEGUA')) {
                                                photoSrc = '/moquegua_1.jpg';
                                            } else if (vid.includes('TABLONES') || vname.includes('TABLONES') || vid.includes('CONCON') || vname.includes('CONCON')) {
                                                photoSrc = '/tablones.jpeg';
                                            } else {
                                                photoSrc = '/moquegua_1.jpg';
                                            }
                                        }

                                        return (
                                            <div className="w-full h-full flex items-center justify-center p-0.5 bg-white">
                                                <img
                                                    src={photoSrc}
                                                    alt={vObj?.vessel_name || selectedVessel}
                                                    className="w-full h-12 object-contain bg-white rounded"
                                                    title={`Buque Oficial: ${vObj?.vessel_name || selectedVessel}`}
                                                />
                                            </div>
                                        );
                                    })()}
                                </td>
                                
                                {/* Particularidades */}
                                <td className="border-r border-slate-200 p-0 text-right align-middle" rowSpan={2}>
                                    <input
                                        type="number"
                                        value={vesselParams.grt ?? ''}
                                        onChange={(e) => handleVesselParamChange('grt', e.target.value)}
                                        className="w-full h-8 bg-white border-0 p-0 pr-2 text-right font-mono font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="border-r border-slate-200 p-0 text-right align-middle" rowSpan={2}>
                                    <input
                                        type="number"
                                        value={vesselParams.dwt ?? ''}
                                        onChange={(e) => handleVesselParamChange('dwt', e.target.value)}
                                        className="w-full h-8 bg-white border-0 p-0 pr-2 text-right font-mono font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="border-r border-slate-200 p-0 text-right align-middle" rowSpan={2}>
                                    <input
                                        type="number"
                                        value={vesselParams.dwcc ?? ''}
                                        onChange={(e) => handleVesselParamChange('dwcc', e.target.value)}
                                        className="w-full h-8 bg-white border-0 p-0 pr-2 text-right font-mono font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="border-r border-slate-200 p-0 text-right align-middle" rowSpan={2}>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={vesselParams.vessel_speed ?? ''}
                                        onChange={(e) => handleVesselParamChange('vessel_speed', e.target.value)}
                                        className="w-full h-8 bg-white border-0 p-0 pr-2 text-right font-mono font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="border-r border-slate-200 p-0 text-right align-middle" rowSpan={2}>
                                    <input
                                        type="number"
                                        value={vesselParams.tce_required ?? ''}
                                        onChange={(e) => handleVesselParamChange('tce_required', e.target.value)}
                                        className="w-full h-8 bg-white border-0 p-0 pr-2 text-right font-mono font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="border-r border-slate-200 p-0 text-right align-middle" rowSpan={2}>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={vesselParams.length ?? ''}
                                        onChange={(e) => handleVesselParamChange('length', e.target.value)}
                                        className="w-full h-8 bg-white border-0 p-0 pr-2 text-right font-mono font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="LOA"
                                    />
                                </td>
                                <td className="border-r border-slate-200 p-0 text-right align-middle" rowSpan={2}>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={vesselParams.beam ?? ''}
                                        onChange={(e) => handleVesselParamChange('beam', e.target.value)}
                                        className="w-full h-8 bg-white border-0 p-0 pr-2 text-right font-mono font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Beam"
                                    />
                                </td>

                                {/* Consumos IFO */}
                                <td className="border-r border-slate-200 text-center bg-slate-100 font-sans font-bold text-[9px] text-slate-500 uppercase select-none align-middle">IFO</td>
                                <td className="border-r border-slate-200 p-0 text-center align-middle">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={vesselParams.consumption_sea_ifo ?? ''}
                                        onChange={(e) => handleVesselParamChange('consumption_sea_ifo', e.target.value)}
                                        className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                                    />
                                </td>
                                <td className="border-r border-slate-200 p-0 text-center align-middle">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={vesselParams.consumption_idle_ifo ?? ''}
                                        onChange={(e) => handleVesselParamChange('consumption_idle_ifo', e.target.value)}
                                        className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                                    />
                                </td>
                                <td className="border-r border-slate-200 p-0 text-center align-middle">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={vesselParams.consumption_load_ifo ?? ''}
                                        onChange={(e) => handleVesselParamChange('consumption_load_ifo', e.target.value)}
                                        className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                                    />
                                </td>
                                <td className="border-r border-slate-200 p-0 text-center align-middle">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={vesselParams.consumption_disch_ifo ?? ''}
                                        onChange={(e) => handleVesselParamChange('consumption_disch_ifo', e.target.value)}
                                        className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                                    />
                                </td>

                                {/* Precios Bunker (Fila IFO) */}
                                <td className="border-r border-slate-200 p-0 text-center align-middle bg-red-600">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={bunkerPriceIfo}
                                        onChange={(e) => setBunkerPriceIfo(Number(e.target.value))}
                                        className="w-full h-8 bg-red-600 border-0 p-0 text-center text-xs font-mono font-black text-white focus:outline-none focus:ring-1 focus:ring-red-400 align-middle"
                                    />
                                </td>
                                <td className="p-0 text-center align-middle bg-red-600">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={bunkerPriceMdo}
                                        onChange={(e) => setBunkerPriceMdo(Number(e.target.value))}
                                        className="w-full h-8 bg-red-600 border-0 p-0 text-center text-xs font-mono font-black text-white focus:outline-none focus:ring-1 focus:ring-red-400 align-middle"
                                    />
                                </td>
                            </tr>
                            
                            {/* Fila MDO de Consumos */}
                            <tr className="border-b border-slate-200 h-8">
                                <td className="border-r border-slate-200 text-center bg-slate-100 font-sans font-bold text-[9px] text-slate-500 uppercase select-none align-middle">MDO</td>
                                <td className="border-r border-slate-200 p-0 text-center align-middle">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={vesselParams.consumption_sea_mdo ?? ''}
                                        onChange={(e) => handleVesselParamChange('consumption_sea_mdo', e.target.value)}
                                        className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                                    />
                                </td>
                                <td className="border-r border-slate-200 p-0 text-center align-middle">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={vesselParams.consumption_idle_mdo ?? ''}
                                        onChange={(e) => handleVesselParamChange('consumption_idle_mdo', e.target.value)}
                                        className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                                    />
                                </td>
                                <td className="border-r border-slate-200 p-0 text-center align-middle">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={vesselParams.consumption_load_mdo ?? ''}
                                        onChange={(e) => handleVesselParamChange('consumption_load_mdo', e.target.value)}
                                        className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                                    />
                                </td>
                                <td className="border-r border-slate-200 p-0 text-center align-middle">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={vesselParams.consumption_disch_mdo ?? ''}
                                        onChange={(e) => handleVesselParamChange('consumption_disch_mdo', e.target.value)}
                                        className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                                    />
                                </td>
                                {/* Fechas de Bunker en fila MDO con estilo gris */}
                                <td className="border-r border-slate-200 text-center bg-slate-100 font-sans font-bold text-[9.5px] text-slate-500 select-none align-middle font-mono">
                                    {bunkerDate}
                                </td>
                                <td className="text-center bg-slate-100 font-sans font-bold text-[9.5px] text-slate-500 select-none align-middle font-mono">
                                    {bunkerDate}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2. PORT ROTATION TABLE (MAIN ESTIMATION REJILLA) */}
            <div className="overflow-x-auto border border-slate-300 rounded bg-white shadow-sm flex flex-col mb-3">
                <table className="w-full border-collapse text-[12px] font-mono table-fixed select-text">
                    
                    {/* Ancho de columnas - Suma 100% de forma perfecta y balanceada */}
                    <colgroup>
                        <col style={{ width: '2.5%' }} /> {/* Leg */}
                        <col style={{ width: '4%' }} />   {/* Tipo */}
                        <col style={{ width: '11%' }} />  {/* Puerto */}
                        <col style={{ width: '4.5%' }} /> {/* Distancia (NM) */}
                        <col style={{ width: '3.5%' }} /> {/* W.F (%) */}
                        <col style={{ width: '4%' }} />   {/* Vel (kn) */}
                        <col style={{ width: '4.5%' }} /> {/* Días Mar */}
                        <col style={{ width: '4.5%' }} /> {/* Días Puerto */}
                        <col style={{ width: '5.5%' }} /> {/* Overhead (h) */}
                        <col style={{ width: '5%' }} />   {/* Posic (h) */}
                        <col style={{ width: '6.5%' }} /> {/* Op. Dest */}
                        <col style={{ width: '8%' }} />   {/* Ritmo Op (C/D) */}
                        <col style={{ width: '7%' }} />   {/* Q (MT) */}
                        <col style={{ width: '7%' }} />   {/* F ($/t) */}
                        <col style={{ width: '7%' }} />   {/* Costo Puerto */}
                        <col style={{ width: '6.5%' }} /> {/* Flete Calculado */}
                        <col style={{ width: '7%' }} />   {/* Costo Bunker */}
                        <col style={{ width: '7%' }} />   {/* Bodega (T) */}
                    </colgroup>
 
                    <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 h-8 select-none font-sans text-[10.5px] uppercase tracking-wider">
                            <th className="border-r border-slate-300 text-center p-0.5">
                                <div className="flex items-center justify-center gap-0.5">
                                    <span className="font-black text-[10.5px] text-slate-800 uppercase">LEG</span>
                                    <button
                                        onClick={handleAddTramo}
                                        className="w-4 h-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] flex items-center justify-center shadow-sm cursor-pointer"
                                        title="Agregar Tramo (+)"
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={handleRemoveLastTramo}
                                        disabled={tramos.length <= 1}
                                        className="w-4 h-4 rounded bg-red-600 hover:bg-red-700 text-white font-black text-[11px] flex items-center justify-center shadow-sm disabled:opacity-30 cursor-pointer"
                                        title="Borrar Tramo (-)"
                                    >
                                        -
                                    </button>
                                </div>
                            </th>
                            <th className="border-r border-slate-300 text-center">Tipo</th>
                            <th className="border-r border-slate-300 text-left pl-2">Puerto</th>
                            <th className="border-r border-slate-300 text-right pr-2">Dist (NM)</th>
                            <th className="border-r border-slate-300 text-right pr-2">W.F (%)</th>
                            <th className="border-r border-slate-300 text-right pr-2">Vel (kn)</th>
                            <th className="border-r border-slate-300 text-right pr-2">Días Mar</th>
                            <th className="border-r border-slate-300 text-right pr-2">Días Pto</th>
                            <th className="border-r border-slate-300 text-right pr-2">Overhead (h)</th>
                            <th className="border-r border-slate-300 text-right pr-2">Posic (h)</th>
                            <th className="border-r border-slate-300 text-center">Op. Dest</th>
                            <th className="border-r border-slate-300 text-right pr-2">Ritmo (C/D)</th>
                            <th className="border-r border-slate-300 text-right pr-2">Q (MT)</th>
                            <th className="border-r border-slate-300 text-right pr-2">F ($/t)</th>
                            <th className="border-r border-slate-300 text-right pr-2">Costo Pto</th>
                            <th className="border-r border-slate-300 text-right pr-2">Flete ($)</th>
                            <th className="border-r border-slate-300 text-right pr-2">Bunker ($)</th>
                            <th className="text-right pr-2">Bodega (T)</th>
                        </tr>
                    </thead>
 
                    <tbody>
                        
                        {/* Fila 0: Origen del Viaje */}
                        <tr className="border-b border-slate-200 h-8 hover:bg-slate-50/50 bg-slate-50/20">
                            <td className="border-r border-slate-200 text-center text-slate-400 select-none">-</td>
                            <td className="border-r border-slate-200 text-center text-slate-400 select-none">-</td>
                            <td className="border-r border-slate-200 p-0 text-left">
                                <select
                                    value={tramos[0].origin_port_id}
                                    onChange={(e) => updateTramoField(0, 'origin_port_id', e.target.value)}
                                    className="w-[96%] bg-white border border-transparent hover:border-slate-300 rounded text-xs font-bold text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans pl-1.5 h-[26px]"
                                >
                                    <option value="">Seleccione puerto...</option>
                                    {ports.map(p => (
                                        <option key={p.port_id} value={p.port_id}>{p.port_id} — {p.port_name}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">—</td>
                            <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">—</td>
                            <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">—</td>
                            <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">—</td>
                            <td className="border-r border-slate-200 text-right pr-2 font-mono font-bold text-slate-700 bg-slate-50/50 select-none">
                                {puertosConfig[0].action !== 'NONE' ? fmtDays(getPortDaysAndBunker(0).portDays) : '0.00'}
                            </td>
                            
                            {/* Overhead */}
                            <td className="border-r border-slate-200 p-0 text-right">
                                {puertosConfig[0].action !== 'NONE' ? (
                                    <input
                                        type="number"
                                        value={puertosConfig[0].overhead ?? ''}
                                        onChange={(e) => updatePuertoConfigField(0, 'overhead', e.target.value)}
                                        className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs"
                                        placeholder={result?.tramos?.[0]?.port_overhead_hours_origin !== undefined ? String(result.tramos[0].port_overhead_hours_origin) : '6.0'}
                                    />
                                ) : (
                                    <span className="text-slate-350 select-none pr-2">—</span>
                                )}
                            </td>
                            
                            {/* Posic */}
                            <td className="border-r border-slate-200 p-0 text-right">
                                {puertosConfig[0].action !== 'NONE' ? (
                                    <input
                                        type="number"
                                        value={puertosConfig[0].positioning ?? ''}
                                        onChange={(e) => updatePuertoConfigField(0, 'positioning', e.target.value)}
                                        className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs"
                                        placeholder={result?.tramos?.[0]?.positioning_carga_hrs !== undefined ? String(result.tramos[0].positioning_carga_hrs) : '0.0'}
                                    />
                                ) : (
                                    <span className="text-slate-350 select-none pr-2">—</span>
                                )}
                            </td>

                            <td className="border-r border-slate-200 p-0 text-center">
                                <select
                                    value={puertosConfig[0].action}
                                    onChange={(e) => updatePuertoConfigField(0, 'action', e.target.value)}
                                    className="w-[96%] bg-white border border-indigo-200 hover:border-indigo-400 rounded text-[11.5px] font-bold text-indigo-900 focus:outline-none font-sans text-center h-[26px]"
                                >
                                    <option value="NONE">NONE</option>
                                    <option value="CARGAR">CARGAR</option>
                                    <option value="DESCARGAR">DESCARGAR</option>
                                </select>
                            </td>
                            {/* Fila 0 Ritmo Op */}
                            <td className="border-r border-slate-200 p-0">
                                {puertosConfig[0].action !== 'NONE' ? (
                                    <div className="flex items-center h-full w-full">
                                        <input
                                            type="number"
                                            value={puertosConfig[0].op_rate ?? ''}
                                            onChange={(e) => updatePuertoConfigField(0, 'op_rate', e.target.value)}
                                            className="w-[60%] h-full bg-white border-0 px-1 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs"
                                            placeholder={result?.tramos?.[0]?.contract_agreed_load_rate !== undefined ? String(result.tramos[0].contract_agreed_load_rate) : String(getAutoPortRate(tramos[0]?.origin_port_id || '', puertosConfig[0].action) || '500')}
                                        />
                                        <select
                                            value={puertosConfig[0].rate_unit || 'TH'}
                                            onChange={(e) => updatePuertoConfigField(0, 'rate_unit', e.target.value)}
                                            className="w-[40%] h-[22px] text-[9.5px] bg-slate-50 border border-slate-250 rounded font-sans cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 pl-0.5 text-slate-500 font-bold mr-1"
                                        >
                                            <option value="TD">T/d</option>
                                            <option value="TH">T/h</option>
                                         </select>
                                    </div>
                                ) : (
                                    <div className="text-right pr-2">
                                         <span className="text-slate-350 select-none">—</span>
                                    </div>
                                )}
                            </td>
                            <td className="border-r border-slate-200 p-0 text-right">
                                {puertosConfig[0].action === 'CARGAR' ? (
                                    <input
                                        type="text"
                                        placeholder="Q (MT)"
                                        value={puertosConfig[0].quantity !== '' && puertosConfig[0].quantity !== undefined ? fmtThousandSep(puertosConfig[0].quantity) : ''}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/,/g, '');
                                            if (/^\d*\.?\d*$/.test(raw)) {
                                                updatePuertoConfigField(0, 'quantity', raw);
                                            }
                                        }}
                                        className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs"
                                    />
                                ) : (
                                    <span className="text-slate-350 select-none pr-2">—</span>
                                )}
                            </td>
                            <td className="border-r border-slate-200 p-0 text-right">
                                {puertosConfig[0].action === 'DESCARGAR' ? (
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="F"
                                        value={puertosConfig[0].freight_rate ?? ''}
                                        onChange={(e) => updatePuertoConfigField(0, 'freight_rate', e.target.value)}
                                        className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs"
                                    />
                                ) : (
                                    <span className="text-slate-350 select-none pr-2">—</span>
                                )}
                            </td>
                            <td className="border-r border-slate-200 p-0 text-right">
                                <input
                                    type="text"
                                    value={puertosConfig[0].manual_port_cost !== '' && puertosConfig[0].manual_port_cost !== undefined ? fmtThousandSep(puertosConfig[0].manual_port_cost) : ''}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                                        if (/^\d*\.?\d*$/.test(raw)) {
                                            updatePuertoConfigField(0, 'manual_port_cost', raw);
                                        }
                                    }}
                                    className={`w-full h-full bg-white border-0 px-1.5 text-right font-mono text-xs focus:outline-none ${
                                        puertosConfig[0].manual_port_cost !== '' && puertosConfig[0].manual_port_cost !== undefined
                                            ? 'text-blue-800 font-extrabold bg-blue-50/20'
                                            : 'text-slate-500 font-medium'
                                    }`}
                                    placeholder={puertosConfig[0].action === 'NONE' ? '$0' : (result?.tramos?.[0]?.agency_costs_origin ? fmtCurrencySep(result.tramos[0].agency_costs_origin) : '$0')}
                                />
                            </td>
                            <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">—</td>
                            <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">—</td>
                            <td className="text-right pr-2 font-mono font-bold text-slate-500 bg-slate-50/70 select-none">
                                {fmtNum(getBodegaSaliente(0))}
                            </td>
                        </tr>

                        {/* Los Tramos de Navegación */}
                        {tramos.map((tr, idx) => {
                            const trCalculado = calculatedTramosList[idx];
                            const trResult = result?.tramos?.[idx];
                            const selectedVesselObj = vessels.find(v => v.vessel_id === selectedVessel);
                            
                            return (
                                <tr key={idx} className="border-b border-slate-200 h-8 hover:bg-slate-50">
                                    
                                    {/* Leg */}
                                    <td className="border-r border-slate-200 text-center font-bold text-slate-500 select-none">
                                        {idx + 1}
                                    </td>
                                    
                                    {/* Tipo de Viaje */}
                                    <td className="border-r border-slate-200 text-center font-bold">
                                        <span className={`text-[11px] px-1 py-0.25 rounded ${trCalculado.type === 'LADEN' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {trCalculado.type}
                                        </span>
                                    </td>
                                    
                                    {/* Puerto Destino */}
                                    <td className="border-r border-slate-200 p-0 text-left">
                                        <select
                                            value={tr.destination_port_id}
                                            onChange={(e) => updateTramoField(idx, 'destination_port_id', e.target.value)}
                                            className="w-[96%] bg-white border border-transparent hover:border-slate-300 rounded text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans pl-1.5 h-[26px]"
                                        >
                                            <option value="">Seleccione puerto...</option>
                                            {ports.map(p => (
                                                <option key={p.port_id} value={p.port_id}>{p.port_id} — {p.port_name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    
                                    {/* Distancia (NM) - Input Fluido */}
                                    <td className="border-r border-slate-200 p-0 text-right">
                                        <input
                                            type="number"
                                            value={tr.route_distance ?? ''}
                                            onChange={(e) => updateTramoField(idx, 'route_distance', e.target.value)}
                                            className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                            placeholder={trResult?.route_distance !== undefined ? String(trResult.route_distance) : ''}
                                        />
                                    </td>
                                    
                                    {/* Weather Factor (%) - Input Fluido */}
                                    <td className="border-r border-slate-200 p-0 text-right">
                                        <input
                                            type="number"
                                            value={tr.weather_factor ?? ''}
                                            onChange={(e) => updateTramoField(idx, 'weather_factor', e.target.value)}
                                            className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                            placeholder={trResult?.weather_factor !== undefined ? String(Math.round(trResult.weather_factor * 100)) : '3'}
                                        />
                                    </td>
                                    
                                    {/* Velocidad (kn) - Input Fluido */}
                                    <td className="border-r border-slate-200 p-0 text-right">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={tr.speed ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                updateTramoField(idx, 'speed', val);
                                                // Propagar a todos los tramos
                                                tramos.forEach((_, tIdx) => {
                                                    updateTramoField(tIdx, 'speed', val);
                                                });
                                            }}
                                            className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                            placeholder={selectedVesselObj?.vessel_speed !== undefined ? String(selectedVesselObj.vessel_speed) : '11.0'}
                                        />
                                    </td>
                                    
                                    {/* Días Mar (Solo Lectura) */}
                                    <td className="border-r border-slate-200 text-right pr-2 text-slate-500 bg-slate-50/50 font-bold select-none">
                                        {trResult ? fmtDays(trResult.sea_days || 0) : '0.00'}
                                    </td>
                                    
                                    {/* Días Puerto (Solo Lectura) */}
                                    <td className="border-r border-slate-200 text-right pr-2 text-slate-500 bg-slate-50/50 font-bold select-none">
                                        {puertosConfig[idx + 1].action !== 'NONE' ? fmtDays(getPortDaysAndBunker(idx + 1).portDays) : '0.00'}
                                    </td>
                                    
                                    {/* Overhead */}
                                    <td className="border-r border-slate-200 p-0 text-right">
                                        {puertosConfig[idx + 1].action !== 'NONE' ? (
                                            <input
                                                type="number"
                                                value={puertosConfig[idx + 1].overhead ?? ''}
                                                onChange={(e) => updatePuertoConfigField(idx + 1, 'overhead', e.target.value)}
                                                className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs"
                                                placeholder={trResult?.port_overhead_hours_dest !== undefined ? String(trResult.port_overhead_hours_dest) : '6.0'}
                                            />
                                        ) : (
                                            <span className="text-slate-350 select-none pr-2">—</span>
                                        )}
                                    </td>
                                    
                                    {/* Posic */}
                                    <td className="border-r border-slate-200 p-0 text-right">
                                        {puertosConfig[idx + 1].action !== 'NONE' ? (
                                            <input
                                                type="number"
                                                value={puertosConfig[idx + 1].positioning ?? ''}
                                                onChange={(e) => updatePuertoConfigField(idx + 1, 'positioning', e.target.value)}
                                                className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs"
                                                placeholder={puertosConfig[idx + 1].action === 'CARGAR' ? String(trResult?.positioning_carga_hrs ?? '0.0') : String(trResult?.positioning_descarga_hrs ?? '0.0')}
                                            />
                                        ) : (
                                            <span className="text-slate-350 select-none pr-2">—</span>
                                        )}
                                    </td>

                                    {/* Operación Destino */}
                                    <td className="border-r border-slate-200 p-0 text-center">
                                        <select
                                            value={puertosConfig[idx + 1].action}
                                            onChange={(e) => updatePuertoConfigField(idx + 1, 'action', e.target.value)}
                                            className="w-[96%] bg-white border border-indigo-200 hover:border-indigo-400 rounded text-[11.5px] font-bold text-indigo-900 focus:outline-none font-sans text-center h-[26px]"
                                        >
                                            <option value="NONE">NONE</option>
                                            <option value="CARGAR">CARGAR</option>
                                            <option value="DESCARGAR">DESCARGAR</option>
                                        </select>
                                    </td>

                                    {/* Ritmo Op en Destino - Input Fluido */}
                                    <td className="border-r border-slate-200 p-0">
                                        {puertosConfig[idx + 1].action !== 'NONE' ? (
                                            <div className="flex items-center h-full w-full">
                                                <input
                                                    type="number"
                                                    value={puertosConfig[idx + 1].op_rate ?? ''}
                                                    onChange={(e) => updatePuertoConfigField(idx + 1, 'op_rate', e.target.value)}
                                                    className="w-[60%] h-full bg-white border-0 px-1 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs"
                                                    placeholder={puertosConfig[idx + 1].action === 'CARGAR' ? (trResult?.contract_agreed_load_rate !== undefined ? String(trResult.contract_agreed_load_rate) : String(getAutoPortRate(tr.destination_port_id, 'CARGAR') || '500')) : (trResult?.contract_agreed_discharge_rate !== undefined ? String(trResult.contract_agreed_discharge_rate) : String(getAutoPortRate(tr.destination_port_id, 'DESCARGAR') || '300'))}
                                                />
                                                <select
                                                    value={puertosConfig[idx + 1].rate_unit || 'TD'}
                                                    onChange={(e) => updatePuertoConfigField(idx + 1, 'rate_unit', e.target.value)}
                                                    className="w-[40%] h-[22px] text-[9.5px] bg-slate-50 border border-slate-250 rounded font-sans cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 pl-0.5 text-slate-500 font-bold mr-1"
                                                >
                                                    <option value="TD">T/d</option>
                                                    <option value="TH">T/h</option>
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="text-right pr-2">
                                                <span className="text-slate-350 select-none">—</span>
                                            </div>
                                        )}
                                    </td>
                                    
                                    {/* Cantidad Q en Destino - Input Fluido */}
                                    <td className="border-r border-slate-200 p-0 text-right">
                                        {puertosConfig[idx + 1].action !== 'NONE' ? (
                                            <input
                                                type="text"
                                                placeholder="Q (MT)"
                                                value={puertosConfig[idx + 1].quantity !== '' && puertosConfig[idx + 1].quantity !== undefined ? fmtThousandSep(puertosConfig[idx + 1].quantity) : ''}
                                                onChange={(e) => {
                                                    const raw = e.target.value.replace(/,/g, '');
                                                    if (/^\d*\.?\d*$/.test(raw)) {
                                                        updatePuertoConfigField(idx + 1, 'quantity', raw);
                                                    }
                                                }}
                                                className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                            />
                                        ) : (
                                            <span className="text-slate-350 select-none pr-2">—</span>
                                        )}
                                    </td>
                                    
                                    {/* Flete F en Destino - Input Fluido */}
                                    <td className="border-r border-slate-200 p-0 text-right">
                                        {puertosConfig[idx + 1].action === 'DESCARGAR' ? (
                                            <input
                                                type="number"
                                                step="0.1"
                                                placeholder="F"
                                                value={puertosConfig[idx + 1].freight_rate ?? ''}
                                                onChange={(e) => updatePuertoConfigField(idx + 1, 'freight_rate', e.target.value)}
                                                className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                            />
                                        ) : (
                                            <span className="text-slate-350 select-none pr-2">—</span>
                                        )}
                                    </td>
                                    
                                    {/* Costo Puerto del Tramo */}
                                    <td className="border-r border-slate-200 p-0 text-right">
                                        {puertosConfig[idx + 1].action !== 'NONE' ? (
                                            <input
                                                type="text"
                                                value={puertosConfig[idx + 1].manual_port_cost !== '' && puertosConfig[idx + 1].manual_port_cost !== undefined ? fmtThousandSep(puertosConfig[idx + 1].manual_port_cost) : ''}
                                                onChange={(e) => {
                                                    const raw = e.target.value.replace(/[^0-9.]/g, '');
                                                    if (/^\d*\.?\d*$/.test(raw)) {
                                                        updatePuertoConfigField(idx + 1, 'manual_port_cost', raw);
                                                    }
                                                }}
                                                className={`w-full h-full bg-white border-0 px-1.5 text-right font-mono text-xs focus:outline-none ${
                                                    puertosConfig[idx + 1].manual_port_cost !== '' && puertosConfig[idx + 1].manual_port_cost !== undefined
                                                        ? 'text-blue-800 font-extrabold bg-blue-50/20'
                                                        : 'text-slate-500 font-medium'
                                                }`}
                                                placeholder={trResult?.agency_costs_destination ? fmtCurrencySep(trResult.agency_costs_destination) : ''}
                                            />
                                        ) : (
                                            <span className="text-slate-350 select-none pr-2">—</span>
                                        )}
                                    </td>
                                    
                                    {/* Ingreso de Flete del Tramo */}
                                    <td className="border-r border-slate-200 text-right pr-2 text-slate-500 bg-slate-50/50 font-bold select-none">
                                        {trResult ? fmtCur(trResult.net_income || 0) : '$0'}
                                    </td>
                                    
                                    {/* Costo Bunker del Tramo (incluye puerto de carga origen en Leg 1, mar, y puerto destino) */}
                                    <td className="border-r border-slate-200 text-right pr-2 text-slate-500 bg-slate-50/50 font-bold select-none">
                                        {trResult ? fmtCur(trResult.bunker_costs || 0) : '$0'}
                                    </td>

                                    {/* Bodega (T) que arrastra el Tramo */}
                                    <td className="text-right pr-2 font-mono font-bold text-slate-600 bg-slate-50/50 select-none">
                                        {fmtNum(getBodegaSaliente(idx + 1))}
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Fila de Totales Generales (Estilo Excel) */}
                        <tr className="bg-slate-100 border-t-2 border-double border-slate-400 h-8 select-none font-bold text-slate-700 text-xs">
                            <td colSpan={3} className="border-r border-slate-200 text-left pl-3 font-sans text-[10.5px] uppercase tracking-wide">Total Estimado</td>
                            <td className="border-r border-slate-200 text-right pr-2">
                                {result ? fmtNum(result.tramos.reduce((s: any, t: any) => s + (t.distance || 0), 0)) : '0'}
                            </td>
                            <td className="border-r border-slate-200 text-right pr-2 text-slate-400">—</td>
                            <td className="border-r border-slate-200 text-right pr-2 text-slate-400">—</td>
                            <td className="border-r border-slate-200 text-right pr-2">
                                {result ? fmtDays(result.consolidated.total_sea_days || 0) : '0.00'}
                            </td>
                            <td className="border-r border-slate-200 text-right pr-2">
                                {result ? fmtDays(result.consolidated.total_port_days || 0) : '0.00'}
                            </td>
                            <td className="border-r border-slate-200 text-right pr-2 text-slate-400">—</td>
                            <td className="border-r border-slate-200 text-right pr-2 text-slate-400">—</td>
                            <td className="border-r border-slate-200 text-right pr-2 text-slate-400">—</td>
                            <td className="border-r border-slate-200 text-right pr-2 text-slate-400">—</td>
                            <td className={`border-r border-slate-200 text-right pr-2 font-mono font-bold text-[11px] ${isBalanced ? 'text-emerald-700 bg-emerald-50/20' : 'text-rose-600 bg-rose-50/60'}`} title={isBalanced ? "Carga y descarga balanceadas" : `Desbalance: Carga ${totalCargas.toLocaleString()} MT vs Descarga ${totalDescargas.toLocaleString()} MT`}>
                                {isBalanced ? (
                                    <span>{totalDescargas > 0 ? fmtNum(totalDescargas) : '—'}</span>
                                ) : (
                                    <span>⚠️ {fmtNum(totalDescargas)} / {fmtNum(totalCargas)}</span>
                                )}
                            </td>
                            <td className="border-r border-slate-200 text-right pr-2 text-slate-400">—</td>
                            <td className="border-r border-slate-200 text-right pr-2">
                                {result ? fmtCur(result.consolidated.total_port_costs || 0) : '$0'}
                            </td>
                            <td className="border-r border-slate-200 text-right pr-2">
                                {result ? fmtCur(result.consolidated.total_freight_revenue || 0) : '$0'}
                            </td>
                            <td className="border-r border-slate-200 text-right pr-2">
                                {result ? fmtCur(result.consolidated.total_bunker_costs || 0) : '$0'}
                            </td>
                            <td className="text-right pr-2 text-slate-400">—</td>
                        </tr>

                    </tbody>
                </table>
            </div>

            {/* 3. RESUMEN FINANCIERO Y OPERATIVO INFERIOR (4 COLUMNAS PARALELAS) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-shrink-0">
                
                {/* Bunker Expenses */}
                <div className="bg-white border border-slate-350 rounded p-2 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1.5 font-sans">
                            Bunker Expenses (Combustible)
                        </h3>
                        <table className="w-full border-collapse text-xs font-mono">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 font-sans text-[10.5px] text-slate-500 font-bold">
                                    <th className="text-left py-0.5 pl-1.5">Fuel</th>
                                    <th className="text-right py-0.5 pr-1.5">Tonnage (T)</th>
                                    <th className="text-right py-0.5 pr-1.5">Expense (USD)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-slate-100">
                                    <td className="py-1 pl-1.5 text-slate-650 font-bold">IFO (Heavy Fuel)</td>
                                    <td className="text-right py-1 pr-1.5 font-bold">
                                        {result ? fmtNum(result.consolidated.bunker_ifo_tonnage || 0) : '0.0'}
                                    </td>
                                    <td className="text-right py-1 pr-1.5 font-bold">
                                        {result ? fmtCur((result.consolidated.bunker_ifo_tonnage || 0) * bunkerPriceIfo) : '$0'}
                                    </td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                    <td className="py-1 pl-1.5 text-slate-650 font-bold">MDO (Diesel)</td>
                                    <td className="text-right py-1 pr-1.5 font-bold">
                                        {result ? fmtNum(result.consolidated.bunker_mdo_tonnage || 0) : '0.0'}
                                    </td>
                                    <td className="text-right py-1 pr-1.5 font-bold">
                                        {result ? fmtCur((result.consolidated.bunker_mdo_tonnage || 0) * bunkerPriceMdo) : '$0'}
                                    </td>
                                </tr>
                                <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                    <td className="py-1 pl-1.5 font-sans text-[10.5px] uppercase">Total Fuel</td>
                                    <td className="text-right py-1 pr-1.5">
                                        {result ? fmtNum((result.consolidated.bunker_ifo_tonnage || 0) + (result.consolidated.bunker_mdo_tonnage || 0)) : '0.0'}
                                    </td>
                                    <td className="text-right py-1 pr-1.5">
                                        {result ? fmtCur(result.consolidated.bunker_costs || 0) : '$0'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Desplegable interactivo para Auditoría de Bunker */}
                        {result?.tramos && (
                            <details className="mt-2 border border-slate-250 rounded bg-slate-50 p-1.5 cursor-pointer">
                                <summary className="text-[10.5px] font-bold text-slate-500 hover:text-slate-800 outline-none select-none">
                                    Rastro de Auditoría Bunker (Fórmula & Toneladas)
                                </summary>
                                <div className="mt-1.5 space-y-1.5 text-[10.5px] font-mono text-slate-700 bg-white border border-slate-100 rounded p-1.5 max-h-36 overflow-y-auto">
                                    {result.tramos.map((tr: any, i: number) => (
                                        <div key={i} className="border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                                            <div className="font-sans font-bold text-slate-800 text-[11px] mb-0.5">
                                                Leg {i + 1} ({tr.origin_port_id} → {tr.destination_port_id}) — {tr.type}
                                            </div>
                                            {tr.type === 'LADEN' ? (
                                                <div className="space-y-0.5 pl-1.5 border-l-2 border-orange-300">
                                                    <div>• Días: Mar {fmtNum(tr.sea_days)} | Pto {fmtNum(tr.port_days)}</div>
                                                    <div>• IFO: {fmtNum(tr.bunker_ifo)} t</div>
                                                    <div className="text-[9.5px] text-slate-450 leading-none">
                                                        Fórm: ({fmtNum(tr.sea_days)}d * {vesselParams.consumption_sea_ifo}t) + (d_puerto_norm * {vesselParams.consumption_idle_ifo}t) + (d_carga * {vesselParams.consumption_load_ifo}t) + (d_desc * {vesselParams.consumption_disch_ifo}t)
                                                    </div>
                                                    <div className="mt-0.5">• MDO: {fmtNum(tr.bunker_mdo)} t</div>
                                                </div>
                                            ) : (
                                                <div className="space-y-0.5 pl-1.5 border-l-2 border-blue-300">
                                                    <div>• Días: Mar {fmtNum(tr.sea_days)} | Pto 0.0</div>
                                                    <div>• IFO: {fmtNum(tr.bunker_ifo)} t (Sea: {fmtNum(tr.sea_days)}d * {vesselParams.consumption_sea_ifo}t)</div>
                                                    <div>• MDO: {fmtNum(tr.bunker_mdo)} t (Sea: {fmtNum(tr.sea_days)}d * {vesselParams.consumption_sea_mdo}t)</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </details>
                        )}
                    </div>
                </div>

                {/* Port Costs */}
                <div className="bg-white border border-slate-350 rounded p-2 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1.5 font-sans">
                            Port Costs (Gastos de Puerto)
                        </h3>
                        <table className="w-full border-collapse text-xs font-mono">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 font-sans text-[10.5px] text-slate-500 font-bold">
                                    <th className="text-left py-0.5 pl-1.5">Expense Concept</th>
                                    <th className="text-right py-0.5 pr-1.5">Costo (USD)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    let costPOL = 0;
                                    let costPOD = 0;
                                    let origPort = tramos[0]?.origin_port_id || 'POL';
                                    let destPort = tramos[0]?.destination_port_id || 'POD';
                                    let totalPortCosts = result?.consolidated?.total_port_costs || 0;
                                    
                                    if (result?.tramos && result.tramos.length > 0) {
                                        costPOL = result.tramos[0].agency_costs_origin || 0;
                                        costPOD = result.tramos[0].agency_costs_destination || 0;
                                        if (result.tramos[0].origin_port_id) origPort = result.tramos[0].origin_port_id;
                                        if (result.tramos[0].destination_port_id) destPort = result.tramos[0].destination_port_id;
                                    }

                                    return (
                                        <>
                                            <tr className="border-b border-slate-100">
                                                <td className="py-1 pl-1.5 text-slate-650 font-bold">POL ({origPort})</td>
                                                <td className="text-right py-1 pr-1.5 font-bold">
                                                    {result ? fmtCur(costPOL) : '$0'}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-slate-100">
                                                <td className="py-1 pl-1.5 text-slate-650 font-bold">POD ({destPort})</td>
                                                <td className="text-right py-1 pr-1.5 font-bold">
                                                    {result ? fmtCur(costPOD) : '$0'}
                                                </td>
                                            </tr>
                                            <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                                <td className="py-1.5 pl-1.5 font-sans text-[10.5px] uppercase">Total Port Costs</td>
                                                <td className="text-right py-1.5 pr-1.5">
                                                    {result ? fmtCur(totalPortCosts) : '$0'}
                                                </td>
                                            </tr>
                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>

                        {/* Desplegable interactivo para Auditoría de Port Costs */}
                        {result?.tramos && (
                            <details className="mt-2 border border-slate-250 rounded bg-slate-50 p-1.5 cursor-pointer">
                                <summary className="text-[10.5px] font-bold text-slate-500 hover:text-slate-800 outline-none select-none">
                                    Rastro de Auditoría Port Costs (Matriz / Fallback)
                                </summary>
                                <div className="mt-1.5 space-y-1.5 text-[10.5px] font-mono text-slate-700 bg-white border border-slate-100 rounded p-1.5 max-h-36 overflow-y-auto">
                                    {result.tramos.map((tr: any, i: number) => {
                                        const origDet = tr.agency_costs_origin_details;
                                        const destDet = tr.agency_costs_destination_details;
                                        return (
                                            <div key={i} className="border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                                                <div className="font-sans font-bold text-slate-800 text-[11px] mb-0.5">
                                                    Leg {i + 1} ({tr.origin_port_id} → {tr.destination_port_id})
                                                </div>
                                                <div className="space-y-1.5 pl-1.5">
                                                    {/* Origen */}
                                                    {origDet && origDet.total_cost > 0 && (
                                                        <div className="border-l-2 border-indigo-300 pl-1">
                                                            <span className="font-bold text-slate-650">Origen {tr.origin_port_id}:</span> {fmtCur(origDet.total_cost)}
                                                            {origDet.breakdown && Object.keys(origDet.breakdown).length > 0 ? (
                                                                <div className="grid grid-cols-2 gap-x-2 pl-1.5 text-[9.5px] text-slate-450">
                                                                    {Object.entries(origDet.breakdown).map(([concept, cost]: any) => (
                                                                        <div key={concept}>{concept}: {fmtCur(cost)}</div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="pl-1.5 text-[9.5px] text-slate-400 italic">• Fallback Plano (Agency Matrix)</div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Destino */}
                                                    {destDet && destDet.total_cost > 0 && (
                                                        <div className="border-l-2 border-teal-300 pl-1">
                                                            <span className="font-bold text-slate-650">Destino {tr.destination_port_id}:</span> {fmtCur(destDet.total_cost)}
                                                            {destDet.breakdown && Object.keys(destDet.breakdown).length > 0 ? (
                                                                <div className="grid grid-cols-2 gap-x-2 pl-1.5 text-[9.5px] text-slate-450">
                                                                    {Object.entries(destDet.breakdown).map(([concept, cost]: any) => (
                                                                        <div key={concept}>{concept}: {fmtCur(cost)}</div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="pl-1.5 text-[9.5px] text-slate-400 italic">• Fallback Plano (Agency Matrix)</div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {(!origDet || origDet.total_cost === 0) && (!destDet || destDet.total_cost === 0) && (
                                                        <div className="text-slate-400 italic text-[9.5px] pl-1">• Sin cargos (NONE o visitado)</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </details>
                        )}
                    </div>
                </div>

                {/* Comisiones (Commercial Rules) */}
                <div className="bg-white border border-slate-350 rounded p-2 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1.5 flex items-center justify-between font-sans">
                            <span>Comisiones de Viaje</span>
                        </h3>
                        <div className="flex flex-col gap-2">
                            {/* Address Comm Input */}
                            <div className="flex justify-between items-center text-xs font-sans">
                                <span className="font-semibold text-slate-600">Address Comm (%)</span>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={addressCommPct}
                                        onChange={(e) => setAddressCommPct(Math.max(0, parseFloat(e.target.value) || 0))}
                                        className="w-12 h-7 text-right font-mono font-bold bg-white border border-slate-350 rounded px-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <span className="font-bold text-slate-500">%</span>
                                </div>
                            </div>
                            
                            {/* Broker Comm Input */}
                            <div className="flex justify-between items-center text-xs font-sans">
                                <span className="font-semibold text-slate-600">Broker Comm (%)</span>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={brokerCommPct}
                                        onChange={(e) => setBrokerCommPct(Math.max(0, parseFloat(e.target.value) || 0))}
                                        className="w-12 h-7 text-right font-mono font-bold bg-white border border-slate-350 rounded px-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <span className="font-bold text-slate-500">%</span>
                                </div>
                            </div>

                            {/* Resumen de Montos en Tabla */}
                            <table className="w-full border-collapse border-t border-slate-100 mt-1 text-xs font-mono">
                                <tbody>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-1 pl-1 text-slate-500">Address (USD)</td>
                                        <td className="text-right py-1 pr-1 font-bold">
                                            {result ? fmtCur(result.consolidated.total_freight_revenue * (addressCommPct / 100)) : '$0'}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-1 pl-1 text-slate-500">Broker (USD)</td>
                                        <td className="text-right py-1 pr-1 font-bold">
                                            {result ? fmtCur(result.consolidated.total_freight_revenue * (brokerCommPct / 100)) : '$0'}
                                        </td>
                                    </tr>
                                    <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                        <td className="py-1 pl-1 font-sans text-[10px] uppercase">Total Comm</td>
                                        <td className="text-right py-1 pr-1 text-rose-600 font-bold">
                                            {result ? `-${fmtCur(result.consolidated.total_commissions || 0)}` : '$0'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Financial Result (Voyage Result) */}
                <div className="bg-emerald-50 border-2 border-emerald-500/30 rounded p-2 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-[11.5px] font-black text-emerald-800 uppercase tracking-wide border-b border-emerald-200 pb-1 mb-1.5 flex items-center justify-between font-sans">
                            <span>FINANCIAL VOYAGE RESULT</span>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200 uppercase">P/L & TCE</span>
                        </h3>
                        <table className="w-full border-collapse text-xs font-mono">
                            <tbody>
                                {(() => {
                                    const Q = Number(puertosConfig[1]?.quantity || tramos[0]?.quantity || 0);
                                    const F = Number(puertosConfig[1]?.freight_rate || tramos[0]?.freight_rate || 0);
                                    const totalDays = result?.consolidated?.total_days || 0;
                                    const tceReq = result?.consolidated?.tce_required || Number(vesselParams.tce_required) || 0;
                                    const hireUsd = tceReq * totalDays;

                                    const ifoTons = result?.consolidated?.bunker_ifo_tonnage || 0;
                                    const mdoTons = result?.consolidated?.bunker_mdo_tonnage || 0;
                                    const ifoUsd = ifoTons * bunkerPriceIfo;
                                    const mdoUsd = mdoTons * bunkerPriceMdo;

                                    let costPOL = 0;
                                    let costPOD = 0;
                                    let origPort = tramos[0]?.origin_port_id || 'POL';
                                    let destPort = tramos[0]?.destination_port_id || 'POD';
                                    if (result?.tramos && result.tramos.length > 0) {
                                        costPOL = result.tramos[0].agency_costs_origin || 0;
                                        costPOD = result.tramos[0].agency_costs_destination || 0;
                                        if (result.tramos[0].origin_port_id) origPort = result.tramos[0].origin_port_id;
                                        if (result.tramos[0].destination_port_id) destPort = result.tramos[0].destination_port_id;
                                    }

                                    const revenue = result?.consolidated?.total_freight_revenue || (Q * F);
                                    const addressCommUsd = revenue * (addressCommPct / 100);
                                    const brokerCommUsd = revenue * (brokerCommPct / 100);
                                    const totalCommUsd = result?.consolidated?.total_commissions || (addressCommUsd + brokerCommUsd);
                                    const hasComm = (addressCommPct > 0 || brokerCommPct > 0 || totalCommUsd > 0);

                                    const tceReal = result?.consolidated?.tce_real || 0;
                                    const tceDiff = tceReal - tceReq;

                                    return (
                                        <>
                                            {/* 1. Revenue */}
                                            <tr className="border-b border-emerald-100/60">
                                                <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                    Revenue ({fmtThousandSep(Q)} MT × {fmtCur(F)}/MT)
                                                </td>
                                                <td className="text-right py-0.5 pr-1 font-bold text-slate-800">
                                                    {fmtCur(revenue)}
                                                </td>
                                            </tr>

                                            {/* 2. Hire (JUSTO DEBAJO DE REVENUE) */}
                                            <tr className="border-b border-emerald-100/60">
                                                <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                    (-) Hire ({fmtCur(tceReq)}/d × {fmtDays(totalDays)} d)
                                                </td>
                                                <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                    -{fmtCur(hireUsd)}
                                                </td>
                                            </tr>

                                            {/* 3. Bunker IFO */}
                                            <tr className="border-b border-emerald-100/60">
                                                <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                    (-) Bunker IFO ({fmtNum(ifoTons)} T × {fmtCur(bunkerPriceIfo)}/T)
                                                </td>
                                                <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                    -{fmtCur(ifoUsd)}
                                                </td>
                                            </tr>

                                            {/* 4. Bunker MDO */}
                                            <tr className="border-b border-emerald-100/60">
                                                <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                    (-) Bunker MDO ({fmtNum(mdoTons)} T × {fmtCur(bunkerPriceMdo)}/T)
                                                </td>
                                                <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                    -{fmtCur(mdoUsd)}
                                                </td>
                                            </tr>

                                            {/* 5. Port Costs POL */}
                                            <tr className="border-b border-emerald-100/60">
                                                <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                    (-) Port Costs POL ({origPort})
                                                </td>
                                                <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                    -{fmtCur(costPOL)}
                                                </td>
                                            </tr>

                                            {/* 6. Port Costs POD */}
                                            <tr className="border-b border-emerald-100/60">
                                                <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                    (-) Port Costs POD ({destPort})
                                                </td>
                                                <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                    -{fmtCur(costPOD)}
                                                </td>
                                            </tr>

                                            {/* 7. Comisiones (Solo si > 0%) */}
                                            {hasComm && (
                                                <tr className="border-b border-emerald-100/60">
                                                    <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                        (-) Comisiones ({addressCommPct + brokerCommPct}%)
                                                    </td>
                                                    <td className="text-right py-0.5 pr-1 text-rose-600 font-medium">
                                                        -{fmtCur(totalCommUsd)}
                                                    </td>
                                                </tr>
                                            )}

                                            {/* VOYAGE RESULT / P&L (SUMA MATEMÁTICA EXACTA FILAS 1 A 7: Revenue - Hire - Bunker - Ports - Comm) */}
                                            {(() => {
                                                const voyageResultPnl = revenue - hireUsd - ifoUsd - mdoUsd - costPOL - costPOD - totalCommUsd;
                                                return (
                                                    <tr className="bg-emerald-100/60 font-bold border-t-2 border-b-2 border-emerald-400">
                                                        <td className="py-1 pl-1 text-emerald-950 font-sans text-[11px] font-black uppercase">
                                                            VOYAGE RESULT / P&L
                                                        </td>
                                                        <td className={`text-right py-1 pr-1 font-black text-sm ${voyageResultPnl >= 0 ? 'text-emerald-800' : 'text-rose-600'}`}>
                                                            {fmtCur(voyageResultPnl)}
                                                        </td>
                                                    </tr>
                                                );
                                            })()}

                                            {/* BLOQUE INFERIOR DE KPIS TCE */}
                                            <tr className="border-b border-emerald-100/60 pt-1">
                                                <td className="py-0.5 pl-1 text-slate-700 font-sans text-[10.5px] uppercase font-bold">
                                                    TCE Realizado
                                                </td>
                                                <td className="text-right py-0.5 pr-1 font-bold text-slate-900">
                                                    {fmtCur(tceReal)}/d
                                                </td>
                                            </tr>
                                            <tr className="border-b border-emerald-100/60">
                                                <td className="py-0.5 pl-1 text-slate-500 font-sans text-[10.5px] uppercase">
                                                    TCE Requerido
                                                </td>
                                                <td className="text-right py-0.5 pr-1 text-slate-600 font-medium">
                                                    {fmtCur(tceReq)}/d
                                                </td>
                                            </tr>
                                            <tr className="border-b border-emerald-200">
                                                <td className="py-0.5 pl-1 text-slate-700 font-sans text-[10.5px] uppercase font-bold">
                                                    Diferencia TCE (+/-)
                                                </td>
                                                <td className={`text-right py-0.5 pr-1 font-black text-xs ${tceDiff >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                                    {tceDiff >= 0 ? '+' : ''}{fmtCur(tceDiff)}/d
                                                </td>
                                            </tr>
                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
                </div>

                {/* 6. GRABAR Y EXPORTAR (FUERA DEL GRID - 100% ANCHO COMPLETO UNIFICADO EN 1 SOLA FILA) */}
                <div className="bg-white border border-slate-300 rounded shadow-sm p-2 mt-3 select-none flex-shrink-0 w-full">
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200 flex-nowrap whitespace-nowrap gap-2 w-full">
                        {/* Título / Badge 6 */}
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-black uppercase text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 tracking-wide whitespace-nowrap">
                                6. GRABAR Y EXPORTAR
                            </span>
                        </div>

                        {/* Los 2 Botones en 1 Sola Fila Horizontal */}
                        <div className="flex items-center gap-3 flex-nowrap whitespace-nowrap shrink-0">
                            <button
                                onClick={() => {
                                    const suggested = getSuggestedRouteName(selectedClient);
                                    setRouteName(suggested);
                                    setShowSaveModal(true);
                                }}
                                className="h-7 text-xs font-black uppercase tracking-wider rounded px-3.5 bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                            >
                                <Save size={14} /> 💾 Grabar
                            </button>

                            <button
                                onClick={handlePrintPDF}
                                className="h-7 text-xs font-bold rounded px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                            >
                                🖨️ Export PDF
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            ) : (
                renderAuditTab()
            )}

            {/* MODALES DE PERSISTENCIA */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-5 rounded-xl w-80 shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                            <h3 className="text-base font-bold text-slate-900">Grabar Ruta Multicotizador</h3>
                            <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-slate-650"><X size={16} /></button>
                        </div>
                        <input
                            type="text"
                            placeholder="Nombre de la ruta (Ej: Callao-Valparaiso)"
                            value={routeName}
                            onChange={(e) => setRouteName(e.target.value)}
                            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm text-slate-700 mb-4 focus:outline-none focus:border-indigo-500 shadow-sm"
                        />
                        <div className="flex justify-end gap-2 text-sm">
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
                            <h3 className="text-base font-bold text-slate-900">Cargar Ruta Multicotizador</h3>
                            <button onClick={() => setShowLoadModal(false)} className="text-slate-400 hover:text-slate-650"><X size={16} /></button>
                        </div>
                        <div className="max-h-80 overflow-y-auto flex flex-col gap-1.5 mb-4">
                            {isLoadingRoutes ? (
                                <div className="text-sm text-slate-500 py-4 text-center">Listando rutas grabadas...</div>
                            ) : savedRoutes.length === 0 ? (
                                <div className="text-sm text-slate-400 py-4 text-center">No hay rutas grabadas para el Multicotizador</div>
                            ) : (
                                savedRoutes.map(route => (
                                    <button
                                        key={route.spot_id}
                                        onClick={() => handleLoadRoute(route)}
                                        className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-indigo-500 transition-all flex justify-between items-center group cursor-pointer"
                                    >
                                        <div>
                                            <span className="text-sm font-bold text-slate-700 block group-hover:text-indigo-650">{route.name}</span>
                                            <span className="text-[11px] text-slate-400">{route.description || 'Sin descripción'}</span>
                                        </div>
                                        <span className="text-[11px] font-mono text-slate-400">{route.created_at ? new Date(route.created_at).toLocaleDateString() : ''}</span>
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="flex justify-end text-sm">
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
