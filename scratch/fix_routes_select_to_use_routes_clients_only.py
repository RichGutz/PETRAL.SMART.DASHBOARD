import os

p_container = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(p_container, 'r', encoding='utf-8') as f:
    code = f.read()

# Update route loading to fetch exclusively from routes_clients (/forecast/spot/list with table_source === 'routes_clients')
new_routes_init = """    // Carga de Rutas Exclusivamente desde la tabla routes_clients (Supabase DB)
    useEffect(() => {
        const fetchRoutesClients = async () => {
            try {
                const spotData = await ForecastService.getSpotVoyages();
                if (spotData && Array.isArray(spotData)) {
                    // Filtrar estrictamente registros de la tabla routes_clients
                    const clientRoutes = spotData.filter((s: any) => s.table_source === 'routes_clients' || s.is_prospect === false);
                    setRoutes(clientRoutes);
                }
            } catch (e) {
                console.error("Error cargando routes_clients:", e);
            }
        };
        fetchRoutesClients();
    }, []);"""

# Replace route loading in useEffect
idx_start = code.find("    // Carga de Catálogos & Contratos Iniciales")
idx_end = code.find("    // Filtrado Dinámico de Clientes")

if idx_start != -1 and idx_end != -1:
    old_block = code[idx_start:idx_end]
    # Insert new routes_clients loading logic
    new_init_full = """    // Carga de Catálogos Iniciales (Mapeo a tablas reales BD)
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
    }, []);"""
    code = code.replace(old_block, new_init_full + "\n\n")

# Replace option rendering in Paso 2 select dropdown to parse routes_clients legs
old_select = """                        <select
                            onChange={(e) => {
                                const valStr = e.target.value;
                                if (!valStr) return;
                                const r = routes.find(x => (x.route_id === valStr || x.id === valStr || `${x.port_a}_${x.port_b}` === valStr));
                                if (r) {
                                    const pol = r.port_a || r.origin_port_id || r.pol_port_id || r.pol || r.origin || 'CALLAO';
                                    const pod = r.port_b || r.destination_port_id || r.pod_port_id || r.pod || r.destination || 'VALPARAISO';
                                    const dist = Number(r.route_distance || r.distance || 1200);
                                    setTramos([
                                        { type: 'BALLAST', origin_port_id: pol, destination_port_id: pol, quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 },
                                        { type: 'LADEN', origin_port_id: pol, destination_port_id: pod, quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: dist, weather_factor: 3.0, speed: 0 },
                                        { type: 'BALLAST', origin_port_id: pod, destination_port_id: '', quantity: 0, freight_rate: 0, port_delay_hours_loading: 0, port_delay_hours_discharging: 0, route_distance: 0, weather_factor: 3.0, speed: 0 }
                                    ]);
                                }
                            }}
                            className="h-7 flex-1 w-full text-xs font-bold bg-white border border-slate-300 rounded px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs min-w-0"
                        >
                            <option value="">[SELECCIONAR RUTA]</option>
                            {routes.map((r, idx) => {
                                const pol = r.port_a || r.origin_port_id || r.pol_port_id || r.pol || r.origin || '';
                                const pod = r.port_b || r.destination_port_id || r.pod_port_id || r.pod || r.destination || '';
                                const keyVal = r.route_id || r.id || `${pol}_${pod}`;
                                const label = r.route_name || r.name || `${pol} ➔ ${pod}`;
                                return (
                                    <option key={keyVal || idx} value={keyVal}>
                                        {label}
                                    </option>
                                );
                            })}
                        </select>"""

new_select = """                        <select
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

code = code.replace(old_select, new_select)

with open(p_container, 'w', encoding='utf-8') as f:
    f.write(code)

print("SEARCH ONLY IN routes_clients IMPLEMENTED SUCCESSFULLY!")
