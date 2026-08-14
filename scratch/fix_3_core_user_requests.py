import os

path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update useEffect for dynamic filtering of clients when clientType or rawClients change
old_init_effect = """    // Carga de Catálogos & Contratos Iniciales
    useEffect(() => {
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
                console.error("Error cargando catálogos:", e);
            }
        };
        init();
    }, []);"""

new_init_effect = """    // Carga de Catálogos & Contratos Iniciales
    useEffect(() => {
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
                
                // Fallback para rutas si rData viene vacio
                let activeRoutes = rData || [];
                if (activeRoutes.length === 0) {
                    try {
                        const rMaster = await ForecastService.getRoutesMaster();
                        if (rMaster && rMaster.length > 0) activeRoutes = rMaster;
                    } catch(err) {}
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

    // Filtrado Dinámico de Clientes según Activos / Prospectos
    useEffect(() => {
        if (!rawClients || rawClients.length === 0) {
            if (clientType === 'ACTIVOS') {
                setClients(['SPCC', 'TRAFIGURA', 'GLENCORE', 'SOUTHERN', 'CERRO VERDE', 'SHOUGANGBIT']);
            } else {
                setClients(['PROSPECTO NEXA', 'PROSPECTO MINSUR', 'PROSPECTO VOLCAN']);
            }
            return;
        }

        const filtered = rawClients.filter((c: any) => {
            const isProspect = c.is_prospect === true || c.client_type === 'PROSPECTO' || String(c.client_name || '').toUpperCase().includes('PROSPECTO');
            return clientType === 'PROSPECTOS' ? isProspect : !isProspect;
        });

        const cList = filtered.map((c: any) => typeof c === 'string' ? c : c.client_name || c.client_id || '');
        setClients(Array.from(new Set(cList.filter(Boolean))));
    }, [clientType, rawClients]);"""

code = code.replace(old_init_effect, new_init_effect)

# 2. Remove Step 5 (Costos Puerto: STATIC / MATRIX) completely from top bar
old_top_bar_with_step5 = """                    {/* GRUPO DERECHO: PASOS 3, 4 Y 5 TAMAÑO FIJO ALINEADOS A LA DERECHA */}
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                        
                        {/* PASO 3: CARGAR COTIZACIÓN */}
                        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2.5 py-1 shadow-sm shrink-0">
                            <button
                                onClick={handleListRoutes}
                                className="h-7 text-xs font-black uppercase text-slate-700 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer tracking-wide whitespace-nowrap"
                            >
                                <FolderOpen size={15} className="text-blue-600" />
                                <span>3. CARGAR COTIZACIÓN</span>
                            </button>
                        </div>

                        {/* PASO 4: SELECCIONAR BUQUE */}
                        <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-2.5 py-1 shadow-sm shrink-0">
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide whitespace-nowrap shrink-0">
                                4. SELECCIONAR BUQUE:
                            </span>
                            <select
                                value={selectedVessel}
                                onChange={(e) => handleVesselChange(e.target.value)}
                                className="h-7 text-xs font-bold bg-white border border-slate-300 rounded px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                            >
                                <option value="">[SELECCIONAR BUQUE]</option>
                                {vessels.map(v => (
                                    <option key={v.vessel_id} value={v.vessel_id}>{v.vessel_name || v.vessel_id}</option>
                                ))}
                            </select>
                        </div>

                        {/* PASO 5: COSTOS PUERTO (STATIC / MATRIX) */}
                        <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-2.5 py-1 shadow-sm shrink-0">
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide whitespace-nowrap shrink-0">
                                5. COSTOS PUERTO:
                            </span>
                            <div className="flex rounded bg-slate-100 p-0.5 border border-slate-250 shrink-0">
                                <button
                                    onClick={() => setLocalPortCostMode('static')}
                                    className={`px-2 py-0.5 text-[9.5px] font-black uppercase rounded cursor-pointer ${localPortCostMode === 'static' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                                >
                                    STATIC
                                </button>
                                <button
                                    onClick={() => setLocalPortCostMode('matrix')}
                                    className={`px-2 py-0.5 text-[9.5px] font-black uppercase rounded cursor-pointer ${localPortCostMode === 'matrix' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                                >
                                    MATRIX
                                </button>
                            </div>
                        </div>

                    </div>"""

new_top_bar_without_step5 = """                    {/* GRUPO DERECHO: PASOS 3 Y 4 TAMAÑO FIJO ALINEADOS A LA DERECHA */}
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                        
                        {/* PASO 3: CARGAR COTIZACIÓN */}
                        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2.5 py-1 shadow-sm shrink-0">
                            <button
                                onClick={handleListRoutes}
                                className="h-7 text-xs font-black uppercase text-slate-700 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer tracking-wide whitespace-nowrap"
                            >
                                <FolderOpen size={15} className="text-blue-600" />
                                <span>3. CARGAR COTIZACIÓN</span>
                            </button>
                        </div>

                        {/* PASO 4: SELECCIONAR BUQUE */}
                        <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-2.5 py-1 shadow-sm shrink-0">
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide whitespace-nowrap shrink-0">
                                4. SELECCIONAR BUQUE:
                            </span>
                            <select
                                value={selectedVessel}
                                onChange={(e) => handleVesselChange(e.target.value)}
                                className="h-7 text-xs font-bold bg-white border border-slate-300 rounded px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                            >
                                <option value="">[SELECCIONAR BUQUE]</option>
                                {vessels.map(v => (
                                    <option key={v.vessel_id} value={v.vessel_id}>{v.vessel_name || v.vessel_id}</option>
                                ))}
                            </select>
                        </div>

                    </div>"""

code = code.replace(old_top_bar_with_step5, new_top_bar_without_step5)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("CLIENT FILTERING, ROUTES POPULATION AND STEP 5 REMOVAL FIXED SUCCESSFULLY!")
