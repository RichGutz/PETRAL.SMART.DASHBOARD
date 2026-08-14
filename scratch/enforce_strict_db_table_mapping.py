import os

# 1. Fix MultiCotizadorExcel.tsx to pull routes strictly from routes_clients, port costs strictly from port_cost_static, and quotes strictly from routes_quotes
p_container = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(p_container, 'r', encoding='utf-8') as f:
    code = f.read()

# Update init loading to fetch routes_clients specifically
old_init_block = """    // Carga de Catálogos & Contratos Iniciales
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
    }, []);"""

new_init_block = """    // Carga de Catálogos & Contratos Iniciales (Mapeo estricto a las tablas reales BD)
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
                console.error("Error cargando catálogos:", e);
            }
        };
        init();
    }, []);"""

code = code.replace(old_init_block, new_init_block)

# Hardcode portCostMode parameter in autoFillPortCost call to 'static' strictly (tabla: port_cost_static)
code = code.replace("const res = await PortCostsRatesService.lookupPortCost(vId, portId, action, localPortCostMode);", "const res = await PortCostsRatesService.lookupPortCost(vId, portId, action, 'static');")
code = code.replace("port_cost_mode: localPortCostMode,", "port_cost_mode: 'static',")

with open(p_container, 'w', encoding='utf-8') as f:
    f.write(code)

print("EXACT DB MAPPING WRITTEN TO MultiCotizadorExcel.tsx SUCCESSFULLY!")
