import os

path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the top bar block with generous, clear, high-legibility dropdowns
old_top_bar = """            {/* BARRA UNIFICADA Y ESTANDARIZADA DE PASOS COMERCIALES (1 A 6) - SIN LOGOS NI CONTENEDORES DESIGUALES */}
            <div className="bg-slate-50 border border-slate-300 rounded p-1.5 mb-2 select-none flex-shrink-0">
                <div className="flex items-center justify-between gap-1.5 flex-nowrap overflow-x-auto">
                    
                    {/* PASO 1: SELECCIONAR CLIENTE */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2 py-1 shadow-sm shrink-0">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">
                            1. SELECCIONAR CLIENTE
                        </span>
                        <div className="flex rounded bg-slate-100 p-0.5 border border-slate-250">
                            <button
                                onClick={() => setClientType('ACTIVOS')}
                                className={`px-2 py-0.5 text-[9.5px] font-black uppercase rounded cursor-pointer ${clientType === 'ACTIVOS' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                Activos
                            </button>
                            <button
                                onClick={() => setClientType('PROSPECTOS')}
                                className={`px-2 py-0.5 text-[9.5px] font-black uppercase rounded cursor-pointer ${clientType === 'PROSPECTOS' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                Prospectos
                            </button>
                        </div>
                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className="h-6 text-[11px] font-extrabold bg-white border border-slate-300 rounded px-1.5 text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            {clients.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* PASO 2: CARGAR RUTA */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2 py-1 shadow-sm shrink-0">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">
                            2. CARGAR RUTA
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
                            className="h-6 text-[11px] font-extrabold bg-white border border-slate-300 rounded px-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[160px]"
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
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2 py-1 shadow-sm shrink-0">
                        <button
                            onClick={handleListRoutes}
                            className="h-6 text-[10px] font-black uppercase text-slate-700 hover:text-blue-700 flex items-center gap-1 cursor-pointer tracking-wider"
                        >
                            <FolderOpen size={13} className="text-blue-600" />
                            <span>3. CARGAR COTIZACIÓN</span>
                        </button>
                    </div>

                    {/* PASO 4: SELECCIONAR BUQUE */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2 py-1 shadow-sm shrink-0">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">
                            4. SELECCIONAR BUQUE
                        </span>
                        <select
                            value={selectedVessel}
                            onChange={(e) => handleVesselChange(e.target.value)}
                            className="h-6 text-[11px] font-extrabold bg-white border border-slate-300 rounded px-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="">[SELECCIONE BUQUE]</option>
                            {vessels.map(v => (
                                <option key={v.vessel_id} value={v.vessel_id}>{v.vessel_name || v.vessel_id}</option>
                            ))}
                        </select>
                    </div>

                    {/* PASO 5: COSTOS PUERTO (STATIC / MATRIX) */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2 py-1 shadow-sm shrink-0">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">
                            5. COSTOS PUERTO:
                        </span>
                        <div className="flex rounded bg-slate-100 p-0.5 border border-slate-250">
                            <button
                                onClick={() => setLocalPortCostMode('static')}
                                className={`px-2 py-0.5 text-[9.5px] font-black uppercase rounded cursor-pointer ${localPortCostMode === 'static' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                STATIC
                            </button>
                            <button
                                onClick={() => setLocalPortCostMode('matrix')}
                                className={`px-2 py-0.5 text-[9.5px] font-black uppercase rounded cursor-pointer ${localPortCostMode === 'matrix' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                MATRIX
                            </button>
                        </div>
                    </div>

                </div>
            </div>"""

new_top_bar = """            {/* BARRA UNIFICADA DE PASOS COMERCIALES (1 AL 5) - AMPLIADA CON MÁXIMA VISIBILIDAD */}
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

code = code.replace(old_top_bar, new_top_bar)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("CLIENT DROPDOWN AND STEP CONTROLS ENLARGED AND FIXED SUCCESSFULLY!")
