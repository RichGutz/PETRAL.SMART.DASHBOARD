import os

path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the top bar section with flex-1 growing Pasos 1 & 2, and fixed right-aligned Pasos 3, 4 & 5
old_bar = """            {/* BARRA UNIFICADA DE PASOS COMERCIALES (1 AL 5) - AMPLIADA CON MÁXIMA VISIBILIDAD */}
            <div className="bg-slate-50 border border-slate-300 rounded p-2 mb-2 select-none flex-shrink-0">
                <div className="flex items-center justify-between gap-2 flex-wrap md:flex-nowrap overflow-x-auto">
                    
                    {/* PASO 1: SELECCIONAR CLIENTE */}
                    <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-2.5 py-1.5 shadow-sm shrink-0">
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide whitespace-nowrap">
                            1. SELECCIONAR CLIENTE:
                        </span>
                        <div className="flex rounded bg-slate-100 p-0.5 border border-slate-250">
                            <button
                                onClick={() => setClientType('ACTIVOS')}
                                className={`px-2 py-1 text-[10px] font-black uppercase rounded cursor-pointer ${clientType === 'ACTIVOS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                Activos
                            </button>
                            <button
                                onClick={() => setClientType('PROSPECTOS')}
                                className={`px-2 py-1 text-[10px] font-black uppercase rounded cursor-pointer ${clientType === 'PROSPECTOS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                Prospectos
                            </button>
                        </div>
                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className="h-7 min-w-[150px] text-xs font-black bg-white border border-slate-300 rounded px-2 text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                        >
                            {clients.length > 0 ? (
                                clients.map(c => <option key={c} value={c}>{c}</option>)
                            ) : (
                                <>
                                    <option value="SPCC">SPCC</option>
                                    <option value="TRAFIGURA">TRAFIGURA</option>
                                    <option value="GLENCORE">GLENCORE</option>
                                    <option value="SOUTHERN">SOUTHERN</option>
                                </>
                            )}
                        </select>
                    </div>

                    {/* PASO 2: CARGAR RUTA */}
                    <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-2.5 py-1.5 shadow-sm shrink-0">
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide whitespace-nowrap">
                            2. CARGAR RUTA:
                        </span>
                        <select
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
                            className="h-7 min-w-[180px] text-xs font-bold bg-white border border-slate-300 rounded px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                        >
                            <option value="">[SELECCIONAR RUTA]</option>
                            {routes.map(r => (
                                <option key={r.route_id} value={r.route_id}>
                                    {r.origin_port_id} ➔ {r.destination_port_id}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* PASO 3: CARGAR COTIZACIÓN */}
                    <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-2.5 py-1.5 shadow-sm shrink-0">
                        <button
                            onClick={handleListRoutes}
                            className="h-7 text-xs font-black uppercase text-slate-700 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer tracking-wide"
                        >
                            <FolderOpen size={15} className="text-blue-600" />
                            <span>3. CARGAR COTIZACIÓN</span>
                        </button>
                    </div>

                    {/* PASO 4: SELECCIONAR BUQUE */}
                    <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-2.5 py-1.5 shadow-sm shrink-0">
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide whitespace-nowrap">
                            4. SELECCIONAR BUQUE:
                        </span>
                        <select
                            value={selectedVessel}
                            onChange={(e) => handleVesselChange(e.target.value)}
                            className="h-7 min-w-[170px] text-xs font-bold bg-white border border-slate-300 rounded px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                        >
                            <option value="">[SELECCIONE BUQUE]</option>
                            {vessels.map(v => (
                                <option key={v.vessel_id} value={v.vessel_id}>{v.vessel_name || v.vessel_id}</option>
                            ))}
                        </select>
                    </div>

                    {/* PASO 5: COSTOS PUERTO (STATIC / MATRIX) */}
                    <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-2.5 py-1.5 shadow-sm shrink-0">
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide whitespace-nowrap">
                            5. COSTOS PUERTO:
                        </span>
                        <div className="flex rounded bg-slate-100 p-0.5 border border-slate-250">
                            <button
                                onClick={() => setLocalPortCostMode('static')}
                                className={`px-2 py-1 text-[10px] font-black uppercase rounded cursor-pointer ${localPortCostMode === 'static' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                STATIC
                            </button>
                            <button
                                onClick={() => setLocalPortCostMode('matrix')}
                                className={`px-2 py-1 text-[10px] font-black uppercase rounded cursor-pointer ${localPortCostMode === 'matrix' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                MATRIX
                            </button>
                        </div>
                    </div>

                </div>
            </div>"""

new_bar = """            {/* BARRA DE CONTROL MOCK: PASOS 1 Y 2 EXPANDIBLES (FLEX-1) Y PASOS 3, 4 Y 5 ALINEADOS A LA DERECHA */}
            <div className="bg-slate-50 border border-slate-300 rounded p-1.5 mb-2 select-none flex-shrink-0 w-full">
                <div className="flex items-center justify-between gap-2 w-full">
                    
                    {/* GRUPO IZQUIERDO: PASO 1 Y PASO 2 EXPANDEN EN FLEX */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        
                        {/* PASO 1: SELECCIONAR CLIENTE (EXPANDE FLEX-1) */}
                        <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-2.5 py-1 shadow-sm flex-1 min-w-[260px]">
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide whitespace-nowrap shrink-0">
                                1. SELECCIONAR CLIENTE:
                            </span>
                            <div className="flex rounded bg-slate-100 p-0.5 border border-slate-250 shrink-0">
                                <button
                                    onClick={() => setClientType('ACTIVOS')}
                                    className={`px-2 py-0.5 text-[9.5px] font-black uppercase rounded cursor-pointer ${clientType === 'ACTIVOS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Activos
                                </button>
                                <button
                                    onClick={() => setClientType('PROSPECTOS')}
                                    className={`px-2 py-0.5 text-[9.5px] font-black uppercase rounded cursor-pointer ${clientType === 'PROSPECTOS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Prospectos
                                </button>
                            </div>
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="h-7 flex-1 w-full text-xs font-black bg-white border border-slate-300 rounded px-2 text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs min-w-0"
                            >
                                {clients.length > 0 ? (
                                    clients.map(c => <option key={c} value={c}>{c}</option>)
                                ) : (
                                    <>
                                        <option value="SPCC">SPCC (Southern Peru Copper)</option>
                                        <option value="TRAFIGURA">TRAFIGURA PERU S.A.C.</option>
                                        <option value="GLENCORE">GLENCORE PERU S.A.</option>
                                        <option value="SOUTHERN">SOUTHERN COPPER CORPORATION</option>
                                    </>
                                )}
                            </select>
                        </div>

                        {/* PASO 2: CARGAR RUTA (EXPANDE FLEX-1) */}
                        <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-2.5 py-1 shadow-sm flex-1 min-w-[280px]">
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide whitespace-nowrap shrink-0">
                                2. CARGAR RUTA:
                            </span>
                            <select
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
                            </select>
                        </div>

                    </div>

                    {/* GRUPO DERECHO: PASOS 3, 4 Y 5 TAMAÑO FIJO ALINEADOS A LA DERECHA */}
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
                                <option value="">[SELECCIONE BUQUE]</option>
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

                    </div>

                </div>
            </div>"""

code = code.replace(old_bar, new_bar)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("FLEX MOCK LAYOUT FOR PASOS 1 & 2 AND RIGHT-ALIGNED PASOS 3, 4 & 5 APPLIED SUCCESSFULLY!")
