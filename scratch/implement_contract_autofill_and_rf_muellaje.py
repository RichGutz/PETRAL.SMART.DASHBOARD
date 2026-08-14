path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add contract loading to initial useEffect
old_use_effect = """    useEffect(() => {
        const init = async () => {
            try {
                const [vData, pData, rData, cData] = await Promise.all([
                    ForecastService.getVessels(),
                    ForecastService.getPorts(),
                    ForecastService.getRoutes(),
                    ForecastService.getClients()
                ]);
                setVessels(vData || []);
                setPorts(pData || []);
                setRoutes(rData || []);
                setRawClients(cData || []);
                const cList = (cData || []).map((c: any) => typeof c === 'string' ? c : c.client_name || c.client_id || '');
                setClients(Array.from(new Set(cList.filter(Boolean))));
            } catch (e) {
                console.error("Error cargando catálogos:", e);
            }
        };
        init();
    }, []);"""

new_use_effect = """    useEffect(() => {
        const init = async () => {
            try {
                const [vData, pData, rData, cData, contractsData] = await Promise.all([
                    ForecastService.getVessels(),
                    ForecastService.getPorts(),
                    ForecastService.getRoutes(),
                    ForecastService.getClients(),
                    ForecastService.getContractsMaster()
                ]);
                setVessels(vData || []);
                setPorts(pData || []);
                setRoutes(rData || []);
                setRawClients(cData || []);
                setContractsMaster(contractsData || []);
                const cList = (cData || []).map((c: any) => typeof c === 'string' ? c : c.client_name || c.client_id || '');
                setClients(Array.from(new Set(cList.filter(Boolean))));
            } catch (e) {
                console.error("Error cargando catálogos y contratos:", e);
            }
        };
        init();
    }, []);"""

code = code.replace(old_use_effect, new_use_effect)

# 2. Add automatic contract autocompletion when client, tramos or ports change
old_autofill_effect = """    // Auto-poblar costos estáticos de puerto reactivamente al cambiar buque, tramos o modo (STATIC vs MATRIX)
    useEffect(() => {
        if (!selectedVessel || tramos.length === 0) return;
        puertosConfig.forEach((p, idx) => {
            if (p.action !== 'NONE') {
                const portId = idx === 0 ? (tramos[0]?.origin_port_id || '') : (tramos[idx - 1]?.destination_port_id || '');
                if (portId) {
                    autoFillPortCost(idx, portId, p.action, selectedVessel);
                }
            }
        });
    }, [selectedVessel, localPortCostMode, tramos[0]?.origin_port_id, tramos[0]?.destination_port_id]);"""

new_autofill_effect = """    // Auto-poblar datos de Contrato y Costos de puerto reactivamente al cambiar Cliente, Ruta o Buque (Cero Fallbacks)
    useEffect(() => {
        if (tramos.length === 0) return;

        // Auto-poblar contrato si coincide client_id + tramo
        tramos.forEach((tr, idx) => {
            const match = PortCostsRatesService.lookupContractInfo(
                contractsMaster,
                selectedClient,
                tr.origin_port_id,
                tr.destination_port_id,
                Number(puertosConfig[idx + 1]?.quantity || tr.quantity || 0)
            );

            if (match.has_contract) {
                if (match.address_commission > 0) setAddressCommPct(match.address_commission);
                if (match.broker_commission > 0) setBrokerCommPct(match.broker_commission);

                setPuertosConfig(prev => {
                    const list = [...prev];
                    if (list[idx]) {
                        list[idx].time_to_count = match.time_to_count_origin;
                        list[idx].positioning = match.positioning_origin;
                        if (list[idx].action === 'CARGAR' && match.load_rate > 0) {
                            list[idx].op_rate = match.load_rate;
                        }
                    }
                    if (list[idx + 1]) {
                        list[idx + 1].time_to_count = match.time_to_count_dest;
                        list[idx + 1].positioning = match.positioning_dest;
                        if (list[idx + 1].action === 'DESCARGAR') {
                            if (match.discharge_rate > 0) list[idx + 1].op_rate = match.discharge_rate;
                            if (match.freight_rate > 0) list[idx + 1].freight_rate = match.freight_rate;
                        }
                    }
                    return list;
                });
            } else {
                // SI NO HAY CONTRATO -> COLOCAR CERO EN LOS CAMPOS (CERO FALLBACKS)
                setPuertosConfig(prev => {
                    const list = [...prev];
                    if (list[idx] && list[idx].action === 'NONE') {
                        list[idx].time_to_count = 0;
                        list[idx].positioning = 0;
                    }
                    if (list[idx + 1] && list[idx + 1].action === 'NONE') {
                        list[idx + 1].time_to_count = 0;
                        list[idx + 1].positioning = 0;
                    }
                    return list;
                });
            }
        });

        // Auto-poblar costos estáticos de puerto
        if (selectedVessel) {
            puertosConfig.forEach((p, idx) => {
                if (p.action !== 'NONE') {
                    const portId = idx === 0 ? (tramos[0]?.origin_port_id || '') : (tramos[idx - 1]?.destination_port_id || '');
                    if (portId) {
                        autoFillPortCost(idx, portId, p.action, selectedVessel);
                    }
                }
            });
        }
    }, [selectedClient, selectedVessel, localPortCostMode, tramos[0]?.origin_port_id, tramos[0]?.destination_port_id, contractsMaster.length]);"""

code = code.replace(old_autofill_effect, new_autofill_effect)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("CONTRACT AUTOFILL EFFECT APPLIED SUCCESSFULLY!")
