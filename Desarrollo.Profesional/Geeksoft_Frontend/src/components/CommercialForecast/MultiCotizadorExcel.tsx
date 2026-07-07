import React, { useState, useEffect } from 'react';
import { ForecastService } from '../../services/api';
import { Plus, Trash2, Save, FolderOpen, X } from 'lucide-react';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';

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
    const context = useForecastContext_V2();
    const [vessels, setVessels] = useState<any[]>([]);
    const [selectedVessel, setSelectedVessel] = useState('');
    const [ports, setPorts] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [clients, setClients] = useState<string[]>([]);
    const [selectedClient, setSelectedClient] = useState('');

    // Comisiones
    const [addressCommPct, setAddressCommPct] = useState<number>(0);
    const [brokerCommPct, setBrokerCommPct] = useState<number>(0);
    
    // Precios de bunker configurables
    const [bunkerPriceIfo, setBunkerPriceIfo] = useState<number>(600);
    const [bunkerPriceMdo, setBunkerPriceMdo] = useState<number>(900);
    const [bunkerDate, setBunkerDate] = useState<string>('Cargando...');

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

    // Lista de tramos (inicialmente 1 tramo vacío)
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
        }
    ]);

    // Configuración de puertos a eje de las letras (tramos.length + 1)
    const [puertosConfig, setPuertosConfig] = useState<PuertoConfig[]>([
        { action: 'NONE', quantity: '', freight_rate: '', op_rate: '', rate_unit: 'TH', overhead: '', positioning: '', manual_port_cost: '' },       // Puerto 0 (A)
        { action: 'NONE', quantity: '', freight_rate: '', op_rate: '', rate_unit: 'TH', overhead: '', positioning: '', manual_port_cost: '' }        // Puerto 1 (B)
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
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportClient, setExportClient] = useState('');
    const [exportMonth, setExportMonth] = useState('');
    const [exportMode, setExportMode] = useState<'active' | 'new'>('active');
    const [exportNewScenarioName, setExportNewScenarioName] = useState('');
    const [exportCloneActive, setExportCloneActive] = useState(true);
    const [exportCustomRouteName, setExportCustomRouteName] = useState('');
    const [exportClientsList, setExportClientsList] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    // Resolver info de ruta
    const getAutoRouteInfo = (origin: string, destination: string, type: 'LADEN' | 'BALLAST') => {
        const matched = routes.find(r => r.origin_port_id === origin && r.destination_port_id === destination);
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

        ForecastService.listSpots().then(spotRoutes => {
            const filtered = (spotRoutes || []).filter((s: any) => s.legs_data?.is_multicotizador === true);
            const clientIds: string[] = filtered.map((s: any) => {
                const parts = (s.name || "").split('.');
                return parts.length > 1 ? parts[0].toUpperCase() : "";
            }).filter(Boolean);
            
            const uniqueClients = Array.from(new Set(clientIds));
            setClients(uniqueClients);
            if (uniqueClients.length > 0) {
                setSelectedClient(uniqueClients[0]);
            }
        }).catch(err => {
            console.error("Error al cargar clientes desde las rutas de routes_master:", err);
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
                    newList[0].op_rate = getAutoPortRate(value, newList[0].action);
                    newList[0].overhead = getAutoPortOverhead(value, newList[0].action);
                    newList[0].positioning = getAutoPortPositioning(value, newList[0].action);
                }
                return newList;
            });
        }
        if (field === 'destination_port_id') {
            setPuertosConfig(prevPorts => {
                const newList = [...prevPorts];
                const pIdx = index + 1;
                if (newList[pIdx] && newList[pIdx].action !== 'NONE') {
                    newList[pIdx].op_rate = getAutoPortRate(value, newList[pIdx].action);
                    newList[pIdx].overhead = getAutoPortOverhead(value, newList[pIdx].action);
                    newList[pIdx].positioning = getAutoPortPositioning(value, newList[pIdx].action);
                }
                return newList;
            });
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
                    const portId = idx === 0 ? tramos[0].origin_port_id : tramos[idx - 1].destination_port_id;
                    list[idx].op_rate = getAutoPortRate(portId, val);
                    list[idx].overhead = getAutoPortOverhead(portId, val);
                    list[idx].positioning = getAutoPortPositioning(portId, val);
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
                    : Number(getAutoPortOverhead(tr.origin_port_id, pOrig.action)) || 6.0;
                
                let overheadDest = pDest && pDest.action !== 'NONE' && pDest.overhead !== '' 
                    ? Number(pDest.overhead) 
                    : Number(getAutoPortOverhead(tr.destination_port_id, pDest.action)) || 6.0;

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

                let overridePortCostOrig = pOrig && pOrig.manual_port_cost !== '' && pOrig.manual_port_cost !== undefined ? Number(pOrig.manual_port_cost) : 0.0;
                let overridePortCostDest = pDest && pDest.manual_port_cost !== '' && pDest.manual_port_cost !== undefined ? Number(pDest.manual_port_cost) : 0.0;

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

            // Enviar payload con todos los particularidades y consumos del buque editados
            const res = await ForecastService.calculateMultiCotizador({
                vessel_id: selectedVessel,
                bunker_price_ifo: bunkerPriceIfo,
                bunker_price_mdo: bunkerPriceMdo,
                port_cost_mode: portCostMode,
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
    }, [selectedVessel, bunkerPriceIfo, bunkerPriceMdo, tramos, puertosConfig, routes, vesselParams, addressCommPct, brokerCommPct, portCostMode]);

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

                // Costos de puerto manuales (override)
                const overridePortCostOrig = pOrig && pOrig.manual_port_cost !== '' && pOrig.manual_port_cost !== undefined ? Number(pOrig.manual_port_cost) : 0.0;
                const overridePortCostDest = pDest && pDest.manual_port_cost !== '' && pDest.manual_port_cost !== undefined ? Number(pDest.manual_port_cost) : 0.0;

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

            const payload = {
                name: routeName,
                description: "Ruta de Multicotizador",
                pais,
                legs_data: {
                    is_multicotizador: true,
                    vessel_id: selectedVessel,
                    bunker_price_ifo: bunkerPriceIfo,
                    bunker_price_mdo: bunkerPriceMdo,
                    tramos: tramosEnriquecidos,    // ← paquete completo para el engine
                    puertosConfig,                 // ← configuración visual de cada puerto
                    vesselParams,                  // ← particularidades del buque
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
            if (data.vesselParams) setVesselParams(data.vesselParams);
            setAddressCommPct(data.addressCommPct || 0);
            setBrokerCommPct(data.brokerCommPct || 0);
            setLoadedRouteName(route.name);
            setResult(null); // Limpiar cálculo anterior
            setShowLoadModal(false);
        }
    };

    const getSuggestedRouteName = (clientId: string) => {
        if (!selectedVessel || tramos.length === 0) return '';
        const portList = [tramos[0]?.origin_port_id || ''];
        tramos.forEach(tr => {
            if (tr.destination_port_id && tr.destination_port_id !== portList[portList.length - 1]) {
                portList.push(tr.destination_port_id);
            }
        });
        const cleanPorts = portList.filter(Boolean).map(p => p.toUpperCase());
        const vesselName = selectedVessel.toUpperCase();
        const clientPrefix = clientId ? `${clientId.toUpperCase()}.` : '';
        return `${clientPrefix}${cleanPorts.join('.')}.${vesselName}`;
    };

    const handleOpenExportModal = async () => {
        if (!result) {
            return alert('Por favor, ejecute la simulación en el estimador antes de exportar.');
        }
        if (!selectedVessel) {
            return alert('Por favor, seleccione un buque en el estimador antes de exportar.');
        }
        
        setIsExporting(false);
        try {
            setExportClientsList(clients);
            
            const initialClient = selectedClient || clients[0] || '';
            setExportClient(initialClient);
            
            const initialMonth = context.dynamicMonths[0] || '';
            setExportMonth(initialMonth);
            
            if (context.currentForecastId) {
                setExportMode('active');
            } else {
                setExportMode('new');
            }
            
            const suggested = getSuggestedRouteName(initialClient);
            setExportCustomRouteName(suggested);
            
            setExportNewScenarioName('');
            setExportCloneActive(true);
            setShowExportModal(true);
        } catch (e) {
            console.error(e);
            alert("Error al inicializar los datos de exportación");
        }
    };

    useEffect(() => {
        if (showExportModal) {
            const suggested = getSuggestedRouteName(exportClient);
            setExportCustomRouteName(suggested);
        }
    }, [exportClient, selectedVessel, tramos, showExportModal]);

    const handleConfirmExport = async () => {
        if (!exportCustomRouteName) {
            return alert("Ingrese un nombre para la ruta");
        }
        if (exportMode === 'new' && !exportNewScenarioName) {
            return alert("Ingrese un nombre para el nuevo escenario");
        }
        
        setIsExporting(true);
        try {
            const tramosLaden = tramos.filter(t => t.type === 'LADEN');
            const lastLadenDest = tramosLaden[tramosLaden.length - 1]?.destination_port_id || '';
            const isChile = ['MEJILLONES', 'BARQUITO'].includes(lastLadenDest);
            const pais = isChile ? 'Chile' : 'Peru';

            const tramosEnriquecidos = tramos.map((tr, idx) => {
                const pOrig = puertosConfig[idx];
                const pDest = puertosConfig[idx + 1];
                
                const customLoad = pDest?.action === 'CARGAR' && pDest?.op_rate ? Number(pDest.op_rate) : 0.0;
                const customDisch = pDest?.action === 'DESCARGAR' && pDest?.op_rate ? Number(pDest.op_rate) : 0.0;
                
                const overheadOrig = pOrig?.overhead !== '' && pOrig?.overhead !== undefined ? Number(pOrig.overhead) : 6.0;
                const overheadDest = pDest?.overhead !== '' && pDest?.overhead !== undefined ? Number(pDest.overhead) : 6.0;
                const posCarga = pOrig?.positioning !== '' && pOrig?.positioning !== undefined ? Number(pOrig.positioning) : 0.0;
                const posDescarga = pDest?.positioning !== '' && pDest?.positioning !== undefined ? Number(pDest.positioning) : 0.0;
                
                const overridePortCostOrig = pOrig?.manual_port_cost !== '' && pOrig?.manual_port_cost !== undefined ? Number(pOrig.manual_port_cost) : 0.0;
                const overridePortCostDest = pDest?.manual_port_cost !== '' && pDest?.manual_port_cost !== undefined ? Number(pDest.manual_port_cost) : 0.0;

                return {
                    origin_port_id: tr.origin_port_id,
                    destination_port_id: tr.destination_port_id,
                    type: tr.type,
                    quantity: Number(tr.quantity) || 0,
                    freight_rate: Number(tr.freight_rate) || 0,
                    route_distance: Number(tr.route_distance) || 0,
                    weather_factor: (Number(tr.weather_factor) || 0) / 100,
                    speed: Number(tr.speed) || Number(vesselParams.vessel_speed) || 11.0,
                    origin_action: pOrig?.action || 'NONE',
                    destination_action: pDest?.action || 'NONE',
                    custom_load_rate: customLoad,
                    custom_discharge_rate: customDisch,
                    rate_unit_origin: pOrig?.rate_unit || 'TH',
                    rate_unit_destination: pDest?.rate_unit || 'TH',
                    port_overhead_hours_origin: overheadOrig,
                    port_overhead_hours_dest: overheadDest,
                    positioning_carga_hrs: posCarga,
                    positioning_descarga_hrs: posDescarga,
                    port_delay_hours_loading: Number(tr.port_delay_hours_loading) || 0,
                    port_delay_hours_discharging: Number(tr.port_delay_hours_discharging) || 0,
                    agency_costs_origin: overridePortCostOrig,
                    agency_costs_destination: overridePortCostDest,
                };
            });

            const spotPayload = {
                name: exportCustomRouteName,
                description: "Ruta de Multicotizador",
                pais,
                legs_data: {
                    is_multicotizador: true,
                    vessel_id: selectedVessel,
                    bunker_price_ifo: bunkerPriceIfo,
                    bunker_price_mdo: bunkerPriceMdo,
                    tramos: tramosEnriquecidos,
                    puertosConfig,
                    vesselParams,
                    addressCommPct,
                    brokerCommPct
                }
            };
            
            await ForecastService.saveSpot(spotPayload);

            const totalQuantity = tramosLaden.reduce((acc, tr) => acc + (Number(tr.quantity) || 0), 0);
            const totalRevenue = tramosLaden.reduce((acc, tr) => acc + (Number(tr.quantity) || 0) * (Number(tr.freight_rate) || 0), 0);
            const yieldFlete = totalQuantity > 0 ? (totalRevenue / totalQuantity) : 0;

            const newLine = {
                month_index: exportMonth,
                client_id: exportClient,
                origin_port_id: 'SPOT',
                destination_port_id: exportCustomRouteName,
                vessel_id: selectedVessel,
                quantity: totalQuantity,
                monthly_frequency: 1,
                forecast_bunker_price_ifo: null,
                forecast_bunker_price_mdo: null,
                custom_tariff: yieldFlete > 0 ? Number(yieldFlete.toFixed(2)) : null
            };

            let targetForecastId = context.currentForecastId;
            let targetForecastName = context.forecastName;
            let targetLines: any[] = [];

            if (exportMode === 'new') {
                targetLines = exportCloneActive ? [...context.projectionLines, newLine] : [newLine];
                targetForecastName = exportNewScenarioName;
                targetForecastId = null;
            } else {
                const existingIndex = context.projectionLines.findIndex(p => 
                    p.month_index === exportMonth && 
                    p.vessel_id === selectedVessel &&
                    p.destination_port_id === exportCustomRouteName &&
                    p.client_id === exportClient
                );

                if (existingIndex >= 0) {
                    const clone = [...context.projectionLines];
                    clone[existingIndex] = newLine;
                    targetLines = clone;
                } else {
                    targetLines = [...context.projectionLines, newLine];
                }
            }

            const forecastPayload = {
                id: targetForecastId,
                name: targetForecastName,
                user_id: context.userId,
                start_date: context.startDate,
                end_date: context.endDate,
                projection_lines: targetLines
            };

            const resultForecast = await ForecastService.saveForecast(forecastPayload);
            await context.handleLoadSelected(resultForecast.id);

            alert("Viaje exportado exitosamente a la Matriz Financiera");
            setShowExportModal(false);
        } catch (e: any) {
            console.error(e);
            const msg = e?.response?.data?.detail || e?.message || "Error desconocido";
            alert(`Error al exportar: ${msg}`);
        } finally {
            setIsExporting(false);
        }
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
            const wfVal = tr.weather_factor ? `${(tr.weather_factor * 100).toFixed(0)}%` : '—';
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
                overheadHrs = Number(getAutoPortOverhead(portId, p.action)) || 6.0;
            } else {
                overheadHrs = 6.0;
            }
        }

        // Resolver posicionamiento por defecto del puerto correspondiente
        let posHrs = Number(p.positioning) || 0;
        if (p.positioning === '' || p.positioning === undefined) {
            const portId = idx === 0 ? tramos[0]?.origin_port_id : tramos[idx - 1]?.destination_port_id;
            if (portId) {
                posHrs = Number(getAutoPortPositioning(portId, p.action)) || 0.0;
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
        <div className="bg-[#f3f4f6] text-[13px] text-slate-800 flex-1 flex flex-col min-h-0 w-full p-2 font-sans">
            
            {/* 1. RIBBON SUPERIOR DE DOS FILAS: ACCIONES Y FACT SHEET */}
            <div className="bg-white border border-slate-300 rounded shadow-sm p-2 mb-2 flex flex-col gap-2 select-none flex-shrink-0">
                
                {/* FILA 1: CABECERA Y ACCIONES DE PERSISTENCIA */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-base">📊</span>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 leading-none">
                                Estimador de Voyage y Fletamentos (Excel Mode)
                                {loadedRouteName && <span className="text-[11px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-mono ml-2">[{loadedRouteName}]</span>}
                            </h2>
                            <span className="text-[10.5px] text-slate-400 font-medium">Rejilla contable de alta densidad para estimación de tramos paralelos (Multi-Leg)</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Selector de Cliente */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded px-2 h-7 shadow-sm">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans whitespace-nowrap">Client:</label>
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="h-5 bg-white border border-slate-300 rounded px-1.5 text-[10.5px] font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                            >
                                <option value="">[SELECCIONAR]</option>
                                {clients.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Botones de Control de Tramos */}
                        <div className="flex gap-1">
                            <button
                                onClick={handleAddTramo}
                                className="h-7 text-[11px] font-bold rounded px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                                <Plus size={10} /> Add Leg
                            </button>
                            <button
                                onClick={handleRemoveLastTramo}
                                disabled={tramos.length <= 1}
                                className="h-7 text-[11px] font-bold rounded px-2 bg-slate-150 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-40 shadow-sm"
                            >
                                <Trash2 size={10} /> Delete Leg
                            </button>
                        </div>


                        {/* Botones de Persistencia */}
                        <div className="flex gap-1 border-l border-slate-200 pl-3">
                            <button
                                onClick={() => {
                                    const suggested = getSuggestedRouteName(selectedClient);
                                    setRouteName(suggested);
                                    setShowSaveModal(true);
                                }}
                                className="h-7 text-[11px] font-bold rounded px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                                <Save size={10} /> Save Route
                            </button>
                            <button
                                onClick={handleLoadClick}
                                className="h-7 text-[11px] font-bold rounded px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                                <FolderOpen size={10} /> Load Route
                            </button>
                            <button
                                onClick={handlePrintPDF}
                                className="h-7 text-[11px] font-bold rounded px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                                🖨️ Export PDF
                            </button>
                            <button
                                onClick={handleOpenExportModal}
                                className="h-7 text-[11px] font-bold rounded px-2 bg-emerald-600 hover:bg-emerald-750 text-white border border-emerald-700 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                                📦 Export to Matrix
                            </button>
                        </div>
                    </div>
                </div>

                {/* FILA 2: FACT SHEET DEL BARCO Y BUNKER EN TABLA UNIFICADA */}
                <div className="bg-slate-50/50 border border-slate-200 rounded p-1 flex-shrink-0">
                    <table className="w-full border-collapse border border-slate-250 bg-white font-mono text-[11px] table-fixed">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-250 font-sans text-[9.5px] text-slate-500 font-bold uppercase tracking-wider h-7">
                                <th className="border-r border-slate-200 text-left pl-2" style={{ width: '11%' }}>Vessel</th>
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
                                <th className="text-center" style={{ width: '7.5%' }}>MDO ($/T)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-200 h-8">
                                {/* Buque Selector */}
                                <td className="border-r border-slate-200 p-0 text-left align-middle" rowSpan={2}>
                                    <select
                                        value={selectedVessel}
                                        onChange={(e) => handleVesselChange(e.target.value)}
                                        className="w-[96%] mx-[2%] h-[26px] bg-white border border-slate-300 rounded px-1 text-[11.5px] font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                                    >
                                        <option value="">⚓ [SELECCIONE BUQUE]</option>
                                        {vessels.map(v => (
                                            <option key={v.vessel_id} value={v.vessel_id}>{v.vessel_name}</option>
                                        ))}
                                    </select>
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

                                {/* Precios Bunker */}
                                <td className="border-r border-slate-200 p-0 text-center align-middle bg-slate-50/20" rowSpan={2}>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={bunkerPriceIfo}
                                        onChange={(e) => setBunkerPriceIfo(Number(e.target.value))}
                                        className="w-full h-7 bg-white border-0 p-0 text-center text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <div className="text-[6.5px] text-slate-400 font-mono text-center border-t border-slate-100 py-0.5 leading-none select-none">
                                        Lec: {bunkerDate}
                                    </div>
                                </td>
                                <td className="p-0 text-center align-middle bg-slate-50/20" rowSpan={2}>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={bunkerPriceMdo}
                                        onChange={(e) => setBunkerPriceMdo(Number(e.target.value))}
                                        className="w-full h-7 bg-white border-0 p-0 text-center text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <div className="text-[6.5px] text-slate-400 font-mono text-center border-t border-slate-100 py-0.5 leading-none select-none">
                                        Lec: {bunkerDate}
                                    </div>
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
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2. PORT ROTATION TABLE (MAIN ESTIMATION REJILLA) */}
            <div className="flex-1 overflow-auto border border-slate-300 rounded bg-white shadow-sm min-h-0 flex flex-col mb-2">
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
                            <th className="border-r border-slate-300 text-center">Leg</th>
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
                                        placeholder="6.0"
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
                                        placeholder="0.0"
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
                                            placeholder="Auto"
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
                                        type="number"
                                        placeholder="Q"
                                        value={puertosConfig[0].quantity ?? ''}
                                        onChange={(e) => updatePuertoConfigField(0, 'quantity', e.target.value)}
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
                                {puertosConfig[0].action !== 'NONE' ? (
                                    <input
                                        type="number"
                                        value={puertosConfig[0].manual_port_cost ?? ''}
                                        onChange={(e) => updatePuertoConfigField(0, 'manual_port_cost', e.target.value)}
                                        className={`w-full h-full bg-white border-0 px-1.5 text-right font-mono text-xs focus:outline-none ${
                                            puertosConfig[0].manual_port_cost !== '' && puertosConfig[0].manual_port_cost !== undefined
                                                ? 'text-blue-800 font-extrabold bg-blue-50/20'
                                                : 'text-slate-500 font-medium'
                                        }`}
                                        placeholder={result?.tramos?.[0]?.agency_costs_origin ? String(result.tramos[0].agency_costs_origin) : 'Auto'}
                                    />
                                ) : (
                                    <span className="text-slate-350 select-none pr-2">—</span>
                                )}
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
                                            placeholder="Auto"
                                        />
                                    </td>
                                    
                                    {/* Weather Factor (%) - Input Fluido */}
                                    <td className="border-r border-slate-200 p-0 text-right">
                                        <input
                                            type="number"
                                            value={tr.weather_factor ?? ''}
                                            onChange={(e) => updateTramoField(idx, 'weather_factor', e.target.value)}
                                            className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                            placeholder="Auto"
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
                                            placeholder="Auto"
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
                                                placeholder="6.0"
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
                                                placeholder="0.0"
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
                                                    placeholder="Auto"
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
                                                type="number"
                                                placeholder="Q"
                                                value={puertosConfig[idx + 1].quantity ?? ''}
                                                onChange={(e) => updatePuertoConfigField(idx + 1, 'quantity', e.target.value)}
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
                                                type="number"
                                                value={puertosConfig[idx + 1].manual_port_cost ?? ''}
                                                onChange={(e) => updatePuertoConfigField(idx + 1, 'manual_port_cost', e.target.value)}
                                                className={`w-full h-full bg-white border-0 px-1.5 text-right font-mono text-xs focus:outline-none ${
                                                    puertosConfig[idx + 1].manual_port_cost !== '' && puertosConfig[idx + 1].manual_port_cost !== undefined
                                                        ? 'text-blue-800 font-extrabold bg-blue-50/20'
                                                        : 'text-slate-500 font-medium'
                                                }`}
                                                placeholder={trResult?.agency_costs_destination ? String(trResult.agency_costs_destination) : 'Auto'}
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
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1 font-sans">
                            <span>⛽</span> Bunker Expenses (Combustible)
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
                                    🔍 Rastro de Auditoría Bunker (Fórmula & Toneladas)
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
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1 font-sans">
                            <span>⚓</span> Port Costs (Gastos de Puerto)
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
                                    let totalLoadingMaster = 0;
                                    let totalPortCosts = result?.consolidated?.total_port_costs || 0;
                                    
                                    if (result?.tramos) {
                                        result.tramos.forEach((tr: any) => {
                                            const oLM = tr.agency_costs_origin_details?.breakdown?.loading_master || 0;
                                            const dLM = tr.agency_costs_destination_details?.breakdown?.loading_master || 0;
                                            totalLoadingMaster += (oLM + dLM);
                                        });
                                    }
                                    
                                    const netPortCosts = Math.max(0, totalPortCosts - totalLoadingMaster);
                                    
                                    return (
                                        <>
                                            <tr className="border-b border-slate-100">
                                                <td className="py-1.5 pl-1.5 text-slate-650 font-bold">Port Costs Matrix & Agencias</td>
                                                <td className="text-right py-1.5 pr-1.5 font-bold">
                                                    {result ? fmtCur(netPortCosts) : '$0'}
                                                </td>
                                            </tr>
                                            {totalLoadingMaster > 0 && (
                                                <tr className="border-b border-slate-100 bg-amber-50/30 text-amber-900">
                                                    <td className="py-1.5 pl-1.5 font-bold">Loading Master (Mejillones)</td>
                                                    <td className="text-right py-1.5 pr-1.5 font-bold">
                                                        {fmtCur(totalLoadingMaster)}
                                                    </td>
                                                </tr>
                                            )}
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
                                    🔍 Rastro de Auditoría Port Costs (Matriz / Fallback)
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
                            <span className="flex items-center gap-1"><span>💼</span> Comisiones de Viaje</span>
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
                        <h3 className="text-[11.5px] font-black text-emerald-800 uppercase tracking-wide border-b border-emerald-200 pb-1 mb-1.5 flex items-center gap-1 font-sans">
                            <span>💹</span> Financial Voyage Result (P/L)
                        </h3>
                        <table className="w-full border-collapse text-xs font-mono">
                            <tbody>
                                {/* P/L — MÉTRICA PRINCIPAL */}
                                <tr className="border-b-2 border-emerald-300">
                                    <td className="py-1 pl-1.5 text-emerald-900 font-sans text-[11px] font-black uppercase tracking-wide">P/L (vs TCE Req)</td>
                                    <td className={`text-right py-1 pr-1.5 font-black text-xl ${result ? ((result.consolidated.pnl_net_utility - (result.consolidated.tce_required * result.consolidated.total_days)) >= 0 ? 'text-emerald-700' : 'text-rose-600') : 'text-slate-400'}`}>
                                        {result ? fmtCur(result.consolidated.pnl_net_utility - (result.consolidated.tce_required * result.consolidated.total_days)) : '$0'}
                                    </td>
                                </tr>
                                <tr className="border-b border-emerald-100/40">
                                    <td className="py-0.5 pl-1.5 text-slate-600">Revenue (Fletes)</td>
                                    <td className="text-right py-0.5 pr-1.5 font-bold text-slate-800">
                                        {result ? fmtCur(result.consolidated.total_freight_revenue || 0) : '$0'}
                                    </td>
                                </tr>
                                <tr className="border-b border-emerald-100/40">
                                    <td className="py-0.5 pl-1.5 text-slate-600">Expenses (Bunker + Puertos)</td>
                                    <td className="text-right py-0.5 pr-1.5 font-bold text-slate-800">
                                        {result ? fmtCur((result.consolidated.total_bunker_costs || 0) + (result.consolidated.total_port_costs || 0)) : '$0'}
                                    </td>
                                </tr>
                                <tr className="border-b border-emerald-100/40">
                                    <td className="py-0.5 pl-1.5 text-slate-500">Voyage Result (Net Profit)</td>
                                    <td className={`text-right py-0.5 pr-1.5 font-bold text-base ${result?.consolidated.pnl_net_utility >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                        {result ? fmtCur(result.consolidated.pnl_net_utility || 0) : '$0'}
                                    </td>
                                </tr>
                                <tr className="border-b border-emerald-100/40">
                                    <td className="py-0.5 pl-1.5 text-slate-600">Días Totales del Viaje</td>
                                    <td className="text-right py-0.5 pr-1.5 font-bold text-slate-800">
                                        {result ? fmtDays(result.consolidated.total_days || 0) : '0.00'} d
                                    </td>
                                </tr>
                                <tr className="font-bold border-t border-emerald-250">
                                    <td className="py-0.5 pl-1.5 text-slate-600 font-sans text-[10.5px] uppercase">TCE Realizado</td>
                                    <td className={`text-right py-0.5 pr-1.5 font-black text-base ${result?.consolidated.tce_real >= result?.consolidated.tce_required ? 'text-emerald-750' : 'text-yellow-600'}`}>
                                        {result ? `${fmtCur(result.consolidated.tce_real || 0)}/d` : '$0/d'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

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
            {showExportModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 font-sans">
                    <div className="bg-white p-6 rounded-xl w-[420px] shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <span>📦 Exportar a Matriz Financiera</span>
                            </h3>
                            <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 text-sm text-slate-700 mb-6">
                            {/* 1. Cliente */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Cliente</label>
                                <select
                                    value={exportClient}
                                    onChange={(e) => setExportClient(e.target.value)}
                                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-indigo-500 shadow-sm"
                                >
                                    {exportClientsList.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 2. Mes de la Proyección */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Mes Proyectado</label>
                                <select
                                    value={exportMonth}
                                    onChange={(e) => setExportMonth(e.target.value)}
                                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-indigo-500 shadow-sm"
                                >
                                    {context.dynamicMonths.map(m => {
                                        const [y, mm] = m.split('-');
                                        const date = new Date(parseInt(y), parseInt(mm) - 1);
                                        const monthLabel = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
                                        return (
                                            <option key={m} value={m}>
                                                {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* 3. Nombre de la Ruta */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">3. Nombre de Ruta (SPOT)</label>
                                <input
                                    type="text"
                                    value={exportCustomRouteName}
                                    onChange={(e) => setExportCustomRouteName(e.target.value)}
                                    placeholder="Ej: SPCC.ILO.MATARANI (MOQUEGUA)"
                                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500 shadow-sm"
                                />
                            </div>

                            {/* 4. Escenario Destino */}
                            <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">4. Escenario Destino</label>
                                
                                <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <label className="flex items-center gap-2 font-medium cursor-pointer">
                                        <input
                                            type="radio"
                                            name="exportMode"
                                            value="active"
                                            disabled={!context.currentForecastId}
                                            checked={exportMode === 'active'}
                                            onChange={() => setExportMode('active')}
                                            className="text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                                        />
                                        <span className={!context.currentForecastId ? 'opacity-50 text-slate-400' : 'text-slate-700'}>
                                            Actualizar escenario activo {context.forecastName ? `("${context.forecastName}")` : ''}
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-2 font-medium cursor-pointer">
                                        <input
                                            type="radio"
                                            name="exportMode"
                                            value="new"
                                            checked={exportMode === 'new'}
                                            onChange={() => setExportMode('new')}
                                            className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <span className="text-slate-700">Crear un nuevo escenario</span>
                                    </label>

                                    {exportMode === 'new' && (
                                        <div className="flex flex-col gap-2.5 pl-5 mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                            <input
                                                type="text"
                                                value={exportNewScenarioName}
                                                onChange={(e) => setExportNewScenarioName(e.target.value)}
                                                placeholder="Nombre del nuevo escenario"
                                                className="w-full border border-slate-300 bg-white rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 shadow-sm"
                                            />
                                            {context.currentForecastId && (
                                                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={exportCloneActive}
                                                        onChange={(e) => setExportCloneActive(e.target.checked)}
                                                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                    <span>Clonar líneas de proyección del escenario activo</span>
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 text-sm border-t border-slate-100 pt-3">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="h-8 font-semibold rounded px-4 bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmExport}
                                disabled={isExporting}
                                className="h-8 font-semibold rounded px-4 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                            >
                                {isExporting ? "Exportando..." : "Confirmar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
