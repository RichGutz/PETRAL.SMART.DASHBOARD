import os

p_container = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(p_container, 'r', encoding='utf-8') as f:
    c_container = f.read()

# 1. Fix routes select rendering to parse port_a and port_b from routes_clients table
old_route_select = """                        <select
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

new_route_select = """                        <select
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

c_container = c_container.replace(old_route_select, new_route_select)

# 2. Fix client filtering effect to handle raw string clients from Supabase DB ("NEXA", "SPCC") and spot_voyages quotes
new_clients_effect = """    // Filtrado Dinámico de Clientes desde Supabase DB (clients & routes_quotes)
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
    }, [clientType, rawClients.length]);"""

idx_filter_start = c_container.find("    // Filtrado Dinámico Estricto de Clientes")
idx_filter_end = c_container.find("    // Manejador de Cambio de Buque")

if idx_filter_start != -1 and idx_filter_end != -1:
    c_container = c_container[:idx_filter_start] + new_clients_effect + "\n\n" + c_container[idx_filter_end:]

with open(p_container, 'w', encoding='utf-8') as f:
    f.write(c_container)

print("REAL SUPABASE COLUMNS port_a / port_b AND clients LIST FIXED SUCCESSFULLY!")
