import os

# 1. Update multicotizadorRetrieverService.ts to strictly query routes_quotes for Step 3
p_retriever = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\services\providers\multicotizadorRetrieverService.ts'

code_retriever = """import { ForecastService } from '../api';

export interface RetrievedQuote {
    id: string;
    name: string;
    description?: string;
    table_source?: string;
    is_prospect?: boolean;
    vessel_id?: string;
    client_id?: string;
    legs_data: {
        is_multicotizador?: boolean;
        vessel_id?: string;
        bunker_price_ifo?: number;
        bunker_price_mdo?: number;
        tramos?: any[];
        puertosConfig?: any[];
        vesselParams?: any;
        addressCommPct?: number;
        brokerCommPct?: number;
        [key: string]: any;
    };
}

export class MulticotizadorRetrieverService {
    /**
     * Carga cotizaciones guardadas EXCLUSIVAMENTE desde la tabla routes_quotes (Paso 3).
     */
    public static async searchSavedQuotes(
        searchQuery: string,
        filterActivo: boolean,
        filterProspecto: boolean,
        selectedClient: string
    ): Promise<RetrievedQuote[]> {
        const rawSpots = await ForecastService.getSpotVoyages();
        if (!rawSpots || !Array.isArray(rawSpots)) return [];

        const filtered = rawSpots.filter((s: any) => {
            const isQuotesTable = s.table_source === 'routes_quotes' || s.is_quote === true || s.is_prospect === true;
            if (!isQuotesTable) return false;

            if (selectedClient && selectedClient.trim() !== '') {
                const clientUpper = selectedClient.trim().toUpperCase();
                const nameUpper = String(s.name || '').toUpperCase();
                const descUpper = String(s.description || '').toUpperCase();
                const cIdUpper = String(s.client_id || '').toUpperCase();
                if (!nameUpper.includes(clientUpper) && !descUpper.includes(clientUpper) && cIdUpper !== clientUpper) {
                    return false;
                }
            }
            return true;
        });

        if (!searchQuery || !searchQuery.trim()) {
            return filtered;
        }

        const queryUpper = searchQuery.trim().toUpperCase();
        return filtered.filter((item: any) => {
            const nameUpper = String(item.name || '').toUpperCase();
            const descUpper = String(item.description || '').toUpperCase();
            return nameUpper.includes(queryUpper) || descUpper.includes(queryUpper);
        });
    }

    public static unpackQuoteData(quote: RetrievedQuote) {
        const legsData = quote.legs_data || {};
        return {
            vessel_id: legsData.vessel_id || quote.vessel_id || '',
            bunker_price_ifo: legsData.bunker_price_ifo || 0,
            bunker_price_mdo: legsData.bunker_price_mdo || 0,
            tramos: legsData.tramos || [],
            puertosConfig: legsData.puertosConfig || [],
            vesselParams: legsData.vesselParams || null,
            addressCommPct: legsData.addressCommPct || 0,
            brokerCommPct: legsData.brokerCommPct || 0
        };
    }
}
"""

with open(p_retriever, 'w', encoding='utf-8') as f:
    f.write(code_retriever)


# 2. Update MultiCotizadorExcel.tsx to re-enable contractsMaster, auto-fill time_to_count/positioning/bunker/muellaje, and display active route/quote labels next to Step 2 and Step 3
p_container = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(p_container, 'r', encoding='utf-8') as f:
    code = f.read()

# Add activeRouteLabel and loadedQuoteLabel states
old_states = """    // 2. Estados de Catálogos & Contratos
    const [vessels, setVessels] = useState<any[]>([]);
    const [ports, setPorts] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [rawClients, setRawClients] = useState<any[]>([]);
    const [clients, setClients] = useState<string[]>([]);
    // const [contractsMaster, setContractsMaster] = useState<any[]>([]);"""

new_states = """    // 2. Estados de Catálogos, Contratos & Etiquetas UX
    const [vessels, setVessels] = useState<any[]>([]);
    const [ports, setPorts] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [rawClients, setRawClients] = useState<any[]>([]);
    const [clients, setClients] = useState<string[]>([]);
    const [contractsMaster, setContractsMaster] = useState<any[]>([]);
    const [activeRouteLabel, setActiveRouteLabel] = useState<string>('');
    const [loadedQuoteLabel, setLoadedQuoteLabel] = useState<string>('');"""

code = code.replace(old_states, new_states)

# Re-enable contractsMaster loading in useEffect
old_init_effect = """    // Carga de Catálogos Iniciales (Mapeo a tablas reales BD)
    useEffect(() => {
        const init = async () => {
            try {
                const [vData, pData, rData, cData] = await Promise.all([
                    ForecastService.getVessels(),       // tabla: vessels
                    ForecastService.getPorts(),         // tabla: ports
                    ForecastService.getRoutes(),        // tabla: routes_clients
                    ForecastService.getClients()        // tabla: clients
                ]);
                setVessels(vData || []);
                setPorts(pData || []);
                setRoutes(rData || []);
                setRawClients(cData || []);
            } catch (e) {
                console.error("Error cargando catálogos BD:", e);
            }
        };
        init();
    }, []);"""

new_init_effect = """    // Carga de Catálogos & Maestro de Contratos (Supabase BD)
    useEffect(() => {
        const init = async () => {
            try {
                const [vData, pData, rData, cData, contractsData] = await Promise.all([
                    ForecastService.getVessels(),       // tabla: vessels
                    ForecastService.getPorts(),         // tabla: ports
                    ForecastService.getRoutes(),        // tabla: routes_clients
                    ForecastService.getClients(),       // tabla: clients
                    ForecastService.getContractsMaster()// tabla: contracts_master
                ]);
                setVessels(vData || []);
                setPorts(pData || []);
                setRoutes(rData || []);
                setRawClients(cData || []);
                setContractsMaster(contractsData || []);
            } catch (e) {
                console.error("Error cargando catálogos BD:", e);
            }
        };
        init();
    }, []);"""

code = code.replace(old_init_effect, new_init_effect)

# Update contract lookup effect when tramos or selectedClient change
new_contract_lookup_effect = """    // Auto-poblado de Time to Count, Posicionamiento, Búnker y Muellaje desde Maestro de Contratos
    useEffect(() => {
        if (tramos.length === 0 || !selectedClient || contractsMaster.length === 0) return;

        tramos.forEach((tr, idx) => {
            if (!tr.origin_port_id || !tr.destination_port_id) return;

            const match = PortCostsRatesService.lookupContractInfo(
                contractsMaster,
                selectedClient,
                tr.origin_port_id,
                tr.destination_port_id,
                Number(puertosConfig[idx + 1]?.quantity || tr.quantity || 13500)
            );

            if (match.has_contract) {
                if (match.address_commission > 0) setAddressCommPct(match.address_commission);
                if (match.broker_commission > 0) setBrokerCommPct(match.broker_commission);

                setPuertosConfig(prev => {
                    const list = [...prev];
                    const portIdx = idx + 1;
                    if (list[portIdx]) {
                        list[portIdx] = {
                            ...list[portIdx],
                            time_to_count: list[portIdx].time_to_count || match.time_to_count_dest,
                            positioning: list[portIdx].positioning || match.positioning_dest,
                            op_rate: list[portIdx].op_rate || (tr.type === 'LADEN' ? match.discharge_rate : match.load_rate),
                            freight_rate: list[portIdx].freight_rate || match.freight_rate
                        };
                    }
                    return list;
                });
            }
        });
    }, [tramos, selectedClient, contractsMaster]);"""

# Replace top bar UI with labels for Step 2 and Step 3
old_top_bar_ui = """                    {/* PASO 2: CARGAR RUTA (routes_clients) */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-white border border-slate-300 rounded px-2 py-1 shadow-sm">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap shrink-0">
                            2. CARGAR RUTA
                        </span>
                        <select
                            onChange={(e) => {
                                const routeIdxStr = e.target.value;
                                if (routeIdxStr === '') return;
                                const r = routes[Number(routeIdxStr)];
                                if (r) {
                                    const pol = r.port_a || r.origin_port_id || r.pol || 'CALLAO';
                                    const pod = r.port_b || r.destination_port_id || r.pod || 'VALPARAISO';
                                    const dist = Number(r.route_distance || r.distance || 1200);
                                    const wfLaden = Number(r.weather_factor_laden || 0.03) * 100;
                                    const wfBallast = Number(r.weather_factor_ballast || 0.03) * 100;

                                    setTramos([
                                        { type: 'BALLAST', origin_port_id: pol, destination_port_id: pol, quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: wfBallast, speed: 0 },
                                        { type: 'LADEN', origin_port_id: pol, destination_port_id: pod, quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: dist, weather_factor: wfLaden, speed: 0 },
                                        { type: 'BALLAST', origin_port_id: pod, destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: wfBallast, speed: 0 }
                                    ]);
                                }
                            }}
                            className="h-7 flex-1 w-full text-xs font-bold bg-white border border-slate-300 rounded px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs min-w-0"
                        >
                            <option value="">[SELECCIONAR RUTA MAESTRA (routes_clients)]</option>
                            {routes.map((r: any, idx: number) => {
                                const pol = r.port_a || r.origin_port_id || r.pol || 'POL';
                                const pod = r.port_b || r.destination_port_id || r.pod || 'POD';
                                return (
                                    <option key={idx} value={idx}>
                                        {pol} ➔ {pod} ({r.route_distance || 0} NM)
                                    </option>
                                );
                            })}
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
                    </div>"""

new_top_bar_ui = """                    {/* PASO 2: CARGAR RUTA (routes_clients) + ETIQUETA RUTA ACTIVA */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-white border border-slate-300 rounded px-2 py-1 shadow-sm">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap shrink-0">
                            2. CARGAR RUTA
                        </span>
                        <select
                            onChange={(e) => {
                                const routeIdxStr = e.target.value;
                                if (routeIdxStr === '') return;
                                const r = routes[Number(routeIdxStr)];
                                if (r) {
                                    const pol = r.port_a || r.origin_port_id || r.pol || 'CALLAO';
                                    const pod = r.port_b || r.destination_port_id || r.pod || 'VALPARAISO';
                                    const dist = Number(r.route_distance || r.distance || 1200);
                                    const wfLaden = Number(r.weather_factor_laden || 0.03) * 100;
                                    const wfBallast = Number(r.weather_factor_ballast || 0.03) * 100;

                                    const routeNameFormatted = `${pol} ➔ ${pod} ➔ ${pol}`;
                                    setActiveRouteLabel(routeNameFormatted);

                                    setTramos([
                                        { type: 'BALLAST', origin_port_id: pol, destination_port_id: pol, quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: wfBallast, speed: 0 },
                                        { type: 'LADEN', origin_port_id: pol, destination_port_id: pod, quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: dist, weather_factor: wfLaden, speed: 0 },
                                        { type: 'BALLAST', origin_port_id: pod, destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: wfBallast, speed: 0 }
                                    ]);
                                }
                            }}
                            className="h-7 flex-1 w-full text-xs font-bold bg-white border border-slate-300 rounded px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs min-w-0"
                        >
                            <option value="">[SELECCIONAR RUTA MAESTRA (routes_clients)]</option>
                            {routes.map((r: any, idx: number) => {
                                const pol = r.port_a || r.origin_port_id || r.pol || 'POL';
                                const pod = r.port_b || r.destination_port_id || r.pod || 'POD';
                                return (
                                    <option key={idx} value={idx}>
                                        {pol} ➔ {pod} ({r.route_distance || 0} NM)
                                    </option>
                                );
                            })}
                        </select>
                        {activeRouteLabel && (
                            <span className="text-[10px] font-black text-blue-800 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 whitespace-nowrap shrink-0">
                                📌 {activeRouteLabel}
                            </span>
                        )}
                    </div>

                    {/* PASO 3: CARGAR COTIZACIÓN + ETIQUETA COTIZACIÓN CARGADA */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2 py-1 shadow-sm shrink-0">
                        <button
                            onClick={handleListRoutes}
                            className="h-6 text-[10px] font-black uppercase text-slate-700 hover:text-blue-700 flex items-center gap-1 cursor-pointer tracking-wider"
                        >
                            <FolderOpen size={13} className="text-blue-600" />
                            <span>3. CARGAR COTIZACIÓN</span>
                        </button>
                        {loadedQuoteLabel && (
                            <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 whitespace-nowrap shrink-0">
                                📁 {loadedQuoteLabel}
                            </span>
                        )}
                    </div>"""

code = code.replace(old_top_bar_ui, new_top_bar_ui)

# Update handleLoadRoute to set loadedQuoteLabel
old_handle_load = """    const handleLoadRoute = (route: any) => {
        const data = MulticotizadorRetrieverService.unpackQuoteData(route);
        if (data.vessel_id) setSelectedVessel(data.vessel_id);
        if (data.bunker_price_ifo) setBunkerPriceIfo(data.bunker_price_ifo);
        if (data.bunker_price_mdo) setBunkerPriceMdo(data.bunker_price_mdo);
        if (data.tramos && data.tramos.length > 0) setTramos(data.tramos);
        if (data.puertosConfig && data.puertosConfig.length > 0) setPuertosConfig(data.puertosConfig);
        if (data.vesselParams) setVesselParams(data.vesselParams);
        if (data.addressCommPct) setAddressCommPct(data.addressCommPct);
        if (data.brokerCommPct) setBrokerCommPct(data.brokerCommPct);
        setShowLoadModal(false);
    };"""

new_handle_load = """    const handleLoadRoute = (route: any) => {
        const data = MulticotizadorRetrieverService.unpackQuoteData(route);
        if (route.name) setLoadedQuoteLabel(route.name);
        if (data.vessel_id) setSelectedVessel(data.vessel_id);
        if (data.bunker_price_ifo) setBunkerPriceIfo(data.bunker_price_ifo);
        if (data.bunker_price_mdo) setBunkerPriceMdo(data.bunker_price_mdo);
        if (data.tramos && data.tramos.length > 0) setTramos(data.tramos);
        if (data.puertosConfig && data.puertosConfig.length > 0) setPuertosConfig(data.puertosConfig);
        if (data.vesselParams) setVesselParams(data.vesselParams);
        if (data.addressCommPct) setAddressCommPct(data.addressCommPct);
        if (data.brokerCommPct) setBrokerCommPct(data.brokerCommPct);
        setShowLoadModal(false);
    };"""

code = code.replace(old_handle_load, new_handle_load)

with open(p_container, 'w', encoding='utf-8') as f:
    f.write(code)

print("CONTRACT AUTOFILL AND STEP 2/STEP 3 UX LABELS APPLIED SUCCESSFULLY!")
