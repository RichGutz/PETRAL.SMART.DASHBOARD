import os

# 1. Update multicotizadorRetrieverService.ts so listSavedQuotes queries routes_quotes ONLY when called from Step 3
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
     * PASO 3: Carga cotizaciones guardadas EXCLUSIVAMENTE desde la tabla routes_quotes.
     */
    public static async searchSavedQuotes(
        searchQuery: string,
        filterActivo: boolean,
        filterProspecto: boolean,
        selectedClient: string
    ): Promise<RetrievedQuote[]> {
        const rawSpots = await ForecastService.getSpotVoyages();
        if (!rawSpots || !Array.isArray(rawSpots)) return [];

        // Filtro estricto: Paso 3 busca UNICAMENTE cotizaciones de routes_quotes
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


# 2. Update MultiCotizadorExcel.tsx so Step 2 loads EXCLUSIVELY from routes_clients (/forecast/routes) with port_a ➔ port_b
p_container = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(p_container, 'r', encoding='utf-8') as f:
    code_container = f.read()

# Replace routes initialization effect to fetch from ForecastService.getRoutes() (tabla: routes_clients)
new_init_effect = """    // Carga de Catálogos Iniciales (Mapeo estricto a las tablas BD)
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

idx_init_start = code_container.find("    // Carga de Catálogos Iniciales")
idx_init_end = code_container.find("    // Filtrado Dinámico Estricto de Clientes")

if idx_init_start != -1 and idx_init_end != -1:
    code_container = code_container[:idx_init_start] + new_init_effect + "\n\n" + code_container[idx_init_end:]

# Replace Step 2 select dropdown to render port_a ➔ port_b from routes_clients
old_step2_select = """                        <select
                            onChange={(e) => {
                                const spotId = e.target.value;
                                if (!spotId) return;
                                const selectedRoute = routes.find(x => (x.spot_id === spotId || x.route_id === spotId));
                                if (selectedRoute && selectedRoute.legs_data?.tramos) {
                                    setTramos(selectedRoute.legs_data.tramos);
                                    if (selectedRoute.legs_data.puertosConfig) {
                                        setPuertosConfig(selectedRoute.legs_data.puertosConfig);
                                    }
                                }
                            }}
                            className="h-7 flex-1 w-full text-xs font-bold bg-white border border-slate-300 rounded px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs min-w-0"
                        >
                            <option value="">[SELECCIONAR RUTA]</option>
                            {routes
                                .filter((r: any) => {
                                    if (!selectedClient) return true;
                                    const rName = String(r.name || r.client_id || '').toUpperCase();
                                    return rName.includes(selectedClient.toUpperCase());
                                })
                                .map((r: any, idx: number) => {
                                    const label = r.name || `Ruta ${idx + 1}`;
                                    const val = r.spot_id || r.route_id || idx;
                                    return (
                                        <option key={val} value={val}>
                                            {label}
                                        </option>
                                    );
                                })}
                        </select>"""

new_step2_select = """                        <select
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
                        </select>"""

code_container = code_container.replace(old_step2_select, new_step2_select)

with open(p_container, 'w', encoding='utf-8') as f:
    f.write(code_container)

print("STEP 2 (routes_clients) AND STEP 3 (routes_quotes) FIXED STRICTLY!")
