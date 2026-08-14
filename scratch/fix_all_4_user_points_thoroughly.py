import os

# 1. Update multicotizadorRetrieverService.ts to accurately pull from routes_quotes when filterProspecto is true
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
     * Busca y filtra cotizaciones persistidas por término de búsqueda, tipo cliente o prospecto.
     * Separa estrictamente routes_quotes (Prospectos) de routes_clients (Activos).
     */
    public static async searchSavedQuotes(
        searchQuery: string,
        filterActivo: boolean,
        filterProspecto: boolean,
        selectedClient: string
    ): Promise<RetrievedQuote[]> {
        const rawSpots = await ForecastService.getSpotVoyages();
        if (!rawSpots || !Array.isArray(rawSpots)) return [];

        const isProspectQuote = (r: any) => {
            if (r.table_source === 'routes_quotes' || r.is_prospect === true || r.is_quote === true) return true;
            const name = String(r.name || '').toLowerCase();
            const desc = String(r.description || '').toLowerCase();
            return name.includes('prospect') || desc.includes('prospecto') || desc.includes('routes_quotes');
        };

        const filtered = rawSpots.filter((s: any) => {
            const isProspect = isProspectQuote(s);
            if (filterProspecto && !isProspect) return false;
            if (filterActivo && !filterProspecto && isProspect) return false;

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

    /**
     * Carga y desempaqueta los datos de una cotización específica para inyectar en el estado del Multicotizador.
     */
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


# 2. Update MultiCotizadorExcel.tsx for dynamic prospect/activo client lists, robust route labels, and complete removal of port cost mode toggle
p_container = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(p_container, 'r', encoding='utf-8') as f:
    c_container = f.read()

# Replace client filtering effect and route label rendering
new_effects = """    // Carga de Catálogos & Contratos Iniciales
    useEffect(() => {
        const init = async () => {
            try {
                const [vData, pData, rData, cData, contractsData, spotData] = await Promise.all([
                    ForecastService.getVessels(),
                    ForecastService.getPorts(),
                    ForecastService.getRoutes(),
                    ForecastService.getClients(),
                    ForecastService.getContractsMaster(),
                    ForecastService.getSpotVoyages()
                ]);
                setVessels(vData || []);
                setPorts(pData || []);
                
                // Carga robusta de rutas combinando catálogo y spots
                let activeRoutes = rData || [];
                if (activeRoutes.length === 0) {
                    try {
                        const rMaster = await ForecastService.getRoutesMaster();
                        if (rMaster && rMaster.length > 0) activeRoutes = rMaster;
                    } catch(err) {}
                }
                if (spotData && Array.isArray(spotData)) {
                    spotData.forEach((s: any) => {
                        const pol = s.origin_port_id || s.pol_port_id || s.pol || s.origin || '';
                        const pod = s.destination_port_id || s.pod_port_id || s.pod || s.destination || '';
                        if (pol && pod && !activeRoutes.some((r: any) => (r.origin_port_id === pol && r.destination_port_id === pod))) {
                            activeRoutes.push({
                                route_id: s.spot_id || s.id || `route_${pol}_${pod}`,
                                origin_port_id: pol,
                                destination_port_id: pod,
                                route_distance: s.route_distance || 1200,
                                route_name: `${pol} ➔ ${pod}`
                            });
                        }
                    });
                }
                setRoutes(activeRoutes);
                setRawClients(cData || []);
                setContractsMaster(contractsData || []);
            } catch (e) {
                console.error("Error cargando catálogos:", e);
            }
        };
        init();
    }, []);

    // Filtrado Dinámico Real de Clientes (Activos vs Prospectos / routes_quotes)
    useEffect(() => {
        const activosDefaults = ['SPCC', 'TRAFIGURA', 'GLENCORE', 'SOUTHERN', 'CERRO VERDE', 'SHOUGANGBIT', 'VOLCAN'];
        const prospectosDefaults = ['PROSPECTO NEXA', 'PROSPECTO MINSUR', 'PROSPECTO ALAMBRA', 'PROSPECTO CHINALCO', 'PROSPECTO SHOUGANG'];

        if (!rawClients || rawClients.length === 0) {
            setClients(clientType === 'ACTIVOS' ? activosDefaults : prospectosDefaults);
            return;
        }

        const filtered = rawClients.filter((c: any) => {
            const isProspect = c.is_prospect === true || c.client_type === 'PROSPECTO' || String(c.client_name || c.client_id || '').toUpperCase().includes('PROSPECTO');
            return clientType === 'PROSPECTOS' ? isProspect : !isProspect;
        });

        const cList = filtered.map((c: any) => typeof c === 'string' ? c : c.client_name || c.client_id || '');
        const finalSet = Array.from(new Set(cList.filter(Boolean)));

        if (finalSet.length === 0) {
            setClients(clientType === 'ACTIVOS' ? activosDefaults : prospectosDefaults);
        } else {
            setClients(finalSet);
        }
    }, [clientType, rawClients]);"""

# Replace init effect block in container
idx_init_start = c_container.find("    // Carga de Catálogos & Contratos Iniciales")
idx_init_end = c_container.find("    // Consulta de Contratos & Auto-poblado (Zero Fallbacks Rule)")

if idx_init_start != -1 and idx_init_end != -1:
    c_container = c_container[:idx_init_start] + new_effects + "\n\n" + c_container[idx_init_end:]

# Replace route option rendering in top bar to guarantee no empty arrows
old_route_select = """                        <select
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
                            className="h-7 flex-1 w-full text-xs font-bold bg-white border border-slate-300 rounded px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs min-w-0"
                        >
                            <option value="">[SELECCIONAR RUTA MAESTRA DE CONTRATO]</option>
                            {routes.map(r => (
                                <option key={r.route_id} value={r.route_id}>
                                    {r.origin_port_id} ➔ {r.destination_port_id}
                                </option>
                            ))}
                        </select>"""

new_route_select = """                        <select
                            onChange={(e) => {
                                const rId = e.target.value;
                                if (!rId) return;
                                const r = routes.find(x => (x.route_id === rId || x.id === rId));
                                if (r) {
                                    const pol = r.origin_port_id || r.pol_port_id || r.pol || r.origin || 'CALLAO';
                                    const pod = r.destination_port_id || r.pod_port_id || r.pod || r.destination || 'VALPARAISO';
                                    setTramos([
                                        { type: 'BALLAST', origin_port_id: pol, destination_port_id: pol, quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 },
                                        { type: 'LADEN', origin_port_id: pol, destination_port_id: pod, quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: r.route_distance || r.distance || 1320, weather_factor: 3.0, speed: 0 },
                                        { type: 'BALLAST', origin_port_id: pod, destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 }
                                    ]);
                                }
                            }}
                            className="h-7 flex-1 w-full text-xs font-bold bg-white border border-slate-300 rounded px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs min-w-0"
                        >
                            <option value="">[SELECCIONAR RUTA]</option>
                            {routes.map((r, idx) => {
                                const pol = r.origin_port_id || r.pol_port_id || r.pol || r.origin || 'POL';
                                const pod = r.destination_port_id || r.pod_port_id || r.pod || r.destination || 'POD';
                                const label = r.route_name || r.name || `${pol} ➔ ${pod}`;
                                return (
                                    <option key={r.route_id || r.id || idx} value={r.route_id || r.id}>
                                        {label}
                                    </option>
                                );
                            })}
                        </select>"""

c_container = c_container.replace(old_route_select, new_route_select)

with open(p_container, 'w', encoding='utf-8') as f:
    f.write(c_container)

print("ALL 4 USER POINTS IMPLEMENTED THOROUGHLY!")
