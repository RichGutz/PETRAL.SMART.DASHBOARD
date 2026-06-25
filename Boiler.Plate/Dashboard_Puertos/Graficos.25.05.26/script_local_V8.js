// ==============================================================================
// SCRIPT DE PERSONALIZACIÃ“N LOCAL - GRÃFICO 1 (FERROBAMBA) â€” V6 FINAL (MOD-08)
// UbicaciÃ³n: C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Graficos.25.05.26\script_local_V8.js
//
// AISLAMIENTO TOTAL: Solo cargado por grafico1.html. Dashboard de producciÃ³n intacto.
// Sobreescribe funciones window.* antes de DOMContentLoaded para que initApp() las use.
// ==============================================================================

console.log("ðŸ”„ [G1-V8] Iniciando personalizaciÃ³n GrÃ¡fico 1 (Ferrobamba) - V8 Final...");

if (typeof CONFIG === 'undefined' || typeof PORT_CONFIG === 'undefined' || typeof MINING_PROJECTS === 'undefined') {
    console.error("âŒ Error crÃ­tico: script.js no cargado antes que script_local.js.");
} else {

    // ==========================================================================
    // 1. VISTA INICIAL DEL MAPA
    // ==========================================================================
    CONFIG.initialCenter = [-14.40, -75.50];
    CONFIG.initialZoom = 8;

    // ==========================================================================
    // 2. FILTRAR PORT_CONFIG â†’ Solo Pisco (PEPIO) y San NicolÃ¡s (PESQN)
    // ==========================================================================
    const portsToKeep = ['PEPIO', 'PESQN'];
    for (const portCode in PORT_CONFIG) {
        if (!portsToKeep.includes(portCode)) {
            delete PORT_CONFIG[portCode];
        }
    }

    // MOD-03: Inyectar tipo de buque en los puertos activos
    PORT_CONFIG['PEPIO'].ship_class  = 'SUPRAMAX / PANAMAX';
    PORT_CONFIG['PESQN'].ship_class  = 'CAPESIZE';
    console.log("âš“ [G1-V6] PORT_CONFIG filtrado. Activos: Pisco y San NicolÃ¡s.");

    // ==========================================================================
    // 3. RECALCULAR 'ports[]' en-place (const en script.js â†’ usar splice)
    // ==========================================================================
    if (typeof processShipData === 'function' && typeof ports !== 'undefined') {
        const portsFiltered = processShipData();
        ports.splice(0, ports.length, ...portsFiltered);
        console.log(`âš“ [G1-V6] ports[] recalculado. Total: ${ports.length}`);
    }

    // ==========================================================================
    // 4. FERROBAMBA â†’ Ãºnico proyecto minero
    // ==========================================================================
    MINING_PROJECTS.length = 0;
    MINING_PROJECTS.push({
        name: "Ferrobamba",
        owner: "MMG (Las Bambas)",
        type: "Cobre",
        state: "OperaciÃ³n",
        coords: [-13.806910, -73.252020]
    });
    console.log("â›°ï¸ [G1-V6] MINING_PROJECTS = solo Ferrobamba.");

    // ==========================================================================
    // MOD-02 & MOD-05: SOBREESCRIBIR renderPorts
    //   - Elimina AMBOS contadores: tanquero ðŸ›¢ï¸ Y barcos (N)
    //   - Omitimos bindTooltip para que desaparezcan las etiquetas originales en tierra
    // ==========================================================================
    window.renderPorts = function(portsData) {
        if (!window.portsLayer) window.portsLayer = L.layerGroup().addTo(map);
        window.portsLayer.clearLayers();
        markers = [];

        portsData.forEach(port => {
            const boatMarker = L.marker(port.coords, {
                icon: createInfoBoatIcon(port),
                zIndexOffset: 100,
                portCode: port.code
            }).addTo(window.portsLayer);

            const marker = L.marker(port.coords, {
                icon: createCustomIcon(port),
                portCode: port.code
            }).addTo(window.portsLayer);

            const clickHandler = () => {
                if (map.hasLayer(boatMarker)) {
                    map.removeLayer(boatMarker);
                } else {
                    map.addLayer(boatMarker);
                }
                selectPort(port);
                map.flyTo(port.coords, 10, { duration: 1.5 });
            };

            marker.on('click', clickHandler);
            boatMarker.on('click', clickHandler);
            markers.push(marker);
            markers.push(boatMarker);
        });
        console.log("âœ… [G1-V6] renderPorts: etiquetas en tierra removidas (solo burbujas flotantes).");
    };

    // ==========================================================================
    // MOD-03 & MOD-04 & MOD-05: SOBREESCRIBIR createInfoBoatIcon
    //   - Burbuja con fondo BLANCO y alto contraste
    //   - 4 filas de informaciÃ³n detallada
    //   - Desplazada al oeste (iconAnchor horizontal a 270) para alejarla de la costa
    // ==========================================================================
    window.createInfoBoatIcon = function(port) {
        // Calcular emoji-barco segÃºn DWT (mismo algoritmo original)
        let dwt = 35000;
        if (typeof port.max_dwt === 'string') {
            dwt = parseInt(port.max_dwt.replace(/k/i, '000'), 10) || 35000;
            if (port.max_dwt.toLowerCase().includes('k') && dwt < 1000) dwt *= 1000;
        }
        const pct      = Math.max(0, Math.min(1, (dwt - 35000) / (200000 - 35000)));
        const fontSize = Math.round(24 + (pct * (48 - 24))); // 24pxâ†’48px

        // Nombre del puerto en mayÃºsculas
        const portName = (port.name || '').toUpperCase();

        // Tipo de buque
        const shipClass = port.ship_class || '';

        // Fila 4: Ruta Terrestre
        let routeHtml = `
            <style>
                @keyframes pulse-g1-dark {
                    0% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.4; }
                }
            </style>
            <div style="
                font-size: 12px;
                color: #757575; /* Gris legible */
                font-weight: 500;
                letter-spacing: 0.5px;
                line-height: 1.3;
                white-space: nowrap;
                margin-top: 2px;
                animation: pulse-g1-dark 1.5s infinite;
            ">ðŸ›£ï¸ Calculando ruta terrestre...</div>
        `;
        
        if (port.route_distance && port.route_duration) {
            routeHtml = `
                <div style="
                    font-size: 13px;
                    color: #d84315; /* Naranja/rojo de alto contraste sobre blanco */
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    line-height: 1.3;
                    white-space: nowrap;
                    margin-top: 2px;
                    ">🛣️ ${port.route_distance} km | ⏳ ${port.route_duration} hrs</div>
            `;
        }

        return L.divIcon({
            className: '', // Sin clase CSS â€” todo inline
            html: `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    background: #ffffff;
                    border: 1px solid rgba(0, 0, 0, 0.15);
                    border-radius: 8px;
                    padding: 8px 12px;
                    width: max-content;
                    font-family: Arial, Helvetica, sans-serif;
                    gap: 4px;
                ">
                    <!-- Fila 1: Nombre del puerto -->
                    <div style="
                        font-size: 15px;
                        color: #b8860b; /* Ãmbar/Dorado oscuro premium */
                        font-weight: 700;
                        letter-spacing: 1px;
                        line-height: 1.3;
                        white-space: nowrap;
                    ">${portName}</div>

                    <!-- Fila 2: Barco + Calado + Max DWT -->
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="font-size:${fontSize}px; line-height:1; flex-shrink:0;">🚢</div>
                        <div style="display:flex; flex-direction:column; line-height:1.2;">
                            <span style="font-size: 12px; color:#546e7a;">Calado</span>
                            <span style="font-size: 16px; color:#101520; font-weight:700;">${port.draft}m</span>
                        </div>
                        <div style="color:rgba(0,0,0,0.15); font-size: 19px; margin:0 4px;">|</div>
                        <div style="display:flex; flex-direction:column; line-height:1.2;">
                            <span style="font-size: 12px; color:#546e7a;">Max DWT</span>
                            <span style="font-size: 16px; color:#101520; font-weight:700;">${port.max_dwt}</span>
                        </div>
                    </div>

                    <!-- Fila 3: Tipo de buque -->
                    <div style="
                        font-size: 14px;
                        color: #00838f; /* Azul/Cian oscuro de alto contraste */
                        font-weight: 700;
                        letter-spacing: 0.7px;
                        line-height: 1.3;
                        white-space: nowrap;
                    ">${shipClass}</div>

                    <!-- Fila 4: Ruta Terrestre (Distancia / Horas) -->
                    ${routeHtml}
                </div>
            `,
            iconSize:   [300, 110],
            iconAnchor: portName.toLowerCase().includes('nicol') ? [280, 55] : [260, 55]  // Offset acercado a la costa (más al oeste para San Nicolas)
        });
    };

    // ==========================================================================
    // MOD-04 & MOD-06: SOBREESCRIBIR calculateAndDrawRoutes
    //   - Trazado de rutas y llenado del panel sidebar
    //   - Filtro whitelist estricto de carreteras principales (excluye calles/avenidas)
    //   - Renderizado con Leader Lines (LÃ­neas de llamada) y Wrap Text en etiquetas
    //   - Las etiquetas de Paracas y Marcona se renderizan hacia abajo de la ruta
    // ==========================================================================
    window.calculateAndDrawRoutes = async function(startCoords, destinations) {
        const resultsContainer = document.getElementById('route-results');
        if (resultsContainer) resultsContainer.innerHTML = '';

        // Limpiar rutas previas
        if (typeof clearRoutes === 'function') {
            clearRoutes();
        } else {
            activeRoutes.forEach(layer => map.removeLayer(layer));
            activeRoutes = [];
        }

        const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving/';
        const routePromises = destinations.map(async (dest) => {
            const start = `${startCoords[1]},${startCoords[0]}`;
            const end = `${dest.coords[1]},${dest.coords[0]}`;
            const url = `${OSRM_URL}${start};${end}?overview=full&geometries=geojson&steps=true`;
            
            try {
                const response = await fetch(url);
                const data = await response.json();
                if (data.code === 'Ok' && data.routes.length > 0) {
                    return { dest, route: data.routes[0] };
                }
            } catch (e) {
                console.error('[G1-V5] Routing error:', e);
            }
            return { dest, error: true };
        });

        const routeResults = await Promise.all(routePromises);

        // Ordenar por distancia ascendente
        routeResults.sort((a, b) => {
            if (a.error) return 1;
            if (b.error) return -1;
            return a.route.distance - b.route.distance;
        });

        // Whitelist de carreteras permitidas para transporte pesado (MOD-06)
        const ALLOWED_ROAD_NAMES = [
            "Vía de los Libertadores",
            "Carretera Nasca - Abancay",
            "Carretera Panamericana Sur",
            "Carretera San Juan de Marcona",
            "Carretera Paracas - Puerto General San Martín",
            "Carretera Longitudinal de la Sierra Sur"
        ];

        routeResults.forEach(res => {
            const { dest, route, error } = res;

            if (error) {
                if (resultsContainer) {
                    resultsContainer.innerHTML += `<div style="color:${dest.color}; opacity:0.5; margin-bottom:5px;">⚠️ ${dest.name}: Ruta no disponible</div>`;
                }
                return;
            }

            const distanceKm = (route.distance / 1000).toFixed(1);
            const durationH = (route.duration / 3600).toFixed(1);

            // Guardar datos de ruta en PORT_CONFIG
            const portKey = Object.keys(PORT_CONFIG).find(key => PORT_CONFIG[key].id === dest.id);
            if (portKey) {
                PORT_CONFIG[portKey].route_distance = distanceKm;
                PORT_CONFIG[portKey].route_duration = durationH;
                console.log(`ðŸ›£ï¸ [G1-V5] OSRM Route: ${portKey} -> ${distanceKm} km | ${durationH} hrs`);
            }

            // Dibujar la lÃ­nea de ruta en el mapa
            const routeLayer = L.geoJSON(route.geometry, {
                style: {
                    color: dest.color,
                    weight: 4,
                    opacity: 0.7,
                    dashArray: '5, 10'
                }
            }).addTo(map);
            activeRoutes.push(routeLayer);

            // Dibujar etiquetas de carretera con Callouts (Leader Lines) y Wrap Text (MOD-06)
            if (route.legs && route.legs[0].steps) {
                const steps = route.legs[0].steps;
                const seenRoads = new Set();
                
                steps.forEach(step => {
                    const roadName = step.name;
                    
                    // ExclusiÃ³n de calles, avenidas e interceptores urbanos pequeÃ±os
                    if (
                        roadName && 
                        ALLOWED_ROAD_NAMES.includes(roadName) && 
                        !seenRoads.has(roadName) && 
                        step.distance > 2000
                    ) {
                        seenRoads.add(roadName);
                        let pos = [step.maneuver.location[1], step.maneuver.location[0]];
                        
                        if (roadName === "Vía de los Libertadores") {
                            pos = [-13.336175, -74.630127];
                        } else if (roadName === "Carretera Nasca - Abancay") {
                            pos = [-14.604847, -73.652344];
                        } else if (roadName === "Carretera San Juan de Marcona") {
                            pos = [-15.146369, -75.003662];
                        } else if (roadName === "Carretera Paracas - Puerto General San Martín") {
                            pos = [-13.838080, -76.247177];
                        }
                        
                        // Determinar orientaciÃ³n basada en los requisitos del usuario
                        const renderEast = (
                            roadName === "Carretera Nasca - Abancay" ||
                            roadName === "Carretera San Juan de Marcona"
                        );
                        
                        const renderParacas30 = (
                            roadName === "Carretera Paracas - Puerto General San Martín"
                        );
                        
                        const renderSouth = (
                            roadName === "Vía de los Libertadores"
                        );
                        
                        let displayRoadName = roadName;
                        if (roadName === "Carretera Paracas - Puerto General San Martín") {
                            displayRoadName = "Carretera Paracas -<br>Pto. Gral San Martín";
                        } else if (roadName === "Carretera Longitudinal de la Sierra Sur") {
                            displayRoadName = "Carretera Longitudinal<br>de la Sierra Sur";
                        } else if (roadName === "Carretera Panamericana Sur") {
                            displayRoadName = "Carretera<br>Panamericana Sur";
                        }
                        
                        let iconHtml = "";
                        let anchor = [60, 75]; // Por defecto arriba
                        let iconSizeY = 75;
                        
                        if (renderEast) {
                            anchor = [-5, 15]; // Anclaje a la izquierda, desplaza el contenido hacia la derecha (Este)
                            iconHtml = `
                                <div style="
                                    display: flex;
                                    flex-direction: row;
                                    align-items: center;
                                    height: 30px;
                                    pointer-events: none;
                                ">
                                    <!-- Micro-punto de anclaje (izquierda) -->
                                    <div style="
                                        width: 6px;
                                        height: 6px;
                                        border-radius: 50%;
                                        background-color: ${dest.color};
                                        border: 1px solid #ffffff;
                                        flex-shrink: 0;
                                    "></div>

                                    <!-- LÃ­nea conector delgada (horizontal) -->
                                    <div style="
                                        width: 28px;
                                        height: 1px;
                                        background-color: ${dest.color};
                                        flex-shrink: 0;
                                    "></div>

                                    <!-- Caja de Texto (Wrap Text) (derecha) -->
                                    <div style="
                                        background: rgba(10, 15, 30, 0.9);
                                        color: #ffffff;
                                        border: 1.5px solid ${dest.color};
                                        padding: 5px 10px;
                                        font-size: 16px;
                                        border-radius: 4px;
                                        white-space: nowrap;
                                        font-family: Arial, Helvetica, sans-serif;
                                        font-weight: bold;
                                        line-height: 1.2;
                                    ">${displayRoadName}</div>
                                </div>
                            `;
                        } else if (renderParacas30) {
                            anchor = [-5, 10]; // Desfase customizado para encajar con la rotaciÃ³n
                            iconHtml = `
                                <div style="
                                    position: relative;
                                    width: 150px;
                                    height: 60px;
                                    pointer-events: none;
                                ">
                                    <!-- Micro-punto de anclaje (origen) -->
                                    <div style="
                                        position: absolute;
                                        top: 0; left: 0;
                                        width: 6px;
                                        height: 6px;
                                        border-radius: 50%;
                                        background-color: ${dest.color};
                                        border: 1px solid #ffffff;
                                        z-index: 2;
                                    "></div>

                                    <!-- LÃ­nea conector rotada 30 grados horario -->
                                    <div style="
                                        position: absolute;
                                        top: 3px; left: 3px;
                                        width: 35px;
                                        height: 1px;
                                        background-color: ${dest.color};
                                        transform-origin: left center;
                                        transform: rotate(30deg);
                                        z-index: 1;
                                    "></div>

                                    <!-- Caja de Texto -->
                                    <div style="
                                        position: absolute;
                                        top: 10px;
                                        left: 33px;
                                        background: rgba(10, 15, 30, 0.9);
                                        color: #ffffff;
                                        border: 1.5px solid ${dest.color};
                                        padding: 5px 10px;
                                        font-size: 16px;
                                        border-radius: 4px;
                                        white-space: nowrap;
                                        font-family: Arial, Helvetica, sans-serif;
                                        font-weight: bold;
                                        line-height: 1.2;
                                        z-index: 3;
                                    ">${displayRoadName}</div>
                                </div>
                            `;
                        } else if (renderSouth) {
                            anchor = [60, 0]; // Anclaje superior para proyectarse hacia abajo (Sur)
                            iconSizeY = 100;
                            iconHtml = `
                                <div style="
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    width: max-content;
                                    height: 100px;
                                    justify-content: flex-start;
                                    pointer-events: none;
                                ">
                                    <!-- Micro-punto de anclaje en la carretera (arriba) -->
                                    <div style="
                                        width: 6px;
                                        height: 6px;
                                        border-radius: 50%;
                                        background-color: ${dest.color};
                                        border: 1px solid #ffffff;
                                    "></div>

                                    <!-- LÃ­nea conector delgada (en medio) -->
                                    <div style="
                                        width: 1px;
                                        height: 40px;
                                        background-color: ${dest.color};
                                    "></div>

                                    <!-- Caja de Texto (Wrap Text) (abajo) -->
                                    <div style="
                                        background: rgba(10, 15, 30, 0.9);
                                        color: #ffffff;
                                        border: 1.5px solid ${dest.color};
                                        padding: 5px 10px;
                                        font-size: 16px;
                                        border-radius: 4px;
                                        display: inline-block;
                                        text-align: center;
                                        font-family: Arial, Helvetica, sans-serif;
                                        font-weight: bold;
                                        white-space: nowrap;
                                        line-height: 1.2;
                                    ">${displayRoadName}</div>
                                </div>
                            `;
                        } else {
                            anchor = [60, 75]; // Anclaje inferior para proyectarse hacia arriba (Norte)
                            iconHtml = `
                                <div style="
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    width: max-content;
                                    height: 75px;
                                    justify-content: flex-end;
                                    pointer-events: none;
                                ">
                                    <!-- Caja de Texto (Wrap Text) (arriba) -->
                                    <div style="
                                        background: rgba(10, 15, 30, 0.9);
                                        color: #ffffff;
                                        border: 1.5px solid ${dest.color};
                                        padding: 5px 10px;
                                        font-size: 16px;
                                        border-radius: 4px;
                                        display: inline-block;
                                        text-align: center;
                                        font-family: Arial, Helvetica, sans-serif;
                                        font-weight: bold;
                                        white-space: nowrap;
                                        line-height: 1.2;
                                    ">${displayRoadName}</div>

                                    <!-- LÃ­nea conector delgada (en medio) -->
                                    <div style="
                                        width: 1px;
                                        height: 22px;
                                        background-color: ${dest.color};
                                    "></div>

                                    <!-- Micro-punto de anclaje en la carretera (abajo) -->
                                    <div style="
                                        width: 6px;
                                        height: 6px;
                                        border-radius: 50%;
                                        background-color: ${dest.color};
                                        border: 1px solid #ffffff;
                                    "></div>
                                </div>
                            `;
                        }
                        
                        const tagMarker = L.marker(pos, {
                            icon: L.divIcon({
                                className: '',
                                html: iconHtml,
                                iconSize: [120, iconSizeY],
                                iconAnchor: anchor
                            })
                        }).addTo(map);
                        activeRoutes.push(tagMarker);
                    }
                });
            }

            // Llenar la lista lateral (sidebar)
            if (resultsContainer) {
                const item = document.createElement('div');
                item.className = 'route-item';
                item.style.borderLeft = `3px solid ${dest.color}`;
                item.style.paddingLeft = '10px';
                item.style.marginBottom = '10px';
                item.innerHTML = `
                    <strong style="color:${dest.color}">${dest.name}</strong><br>
                    <span style="font-size:1.3em">🛣️ ${distanceKm} km</span> <span style="font-size:1.1em; opacity:0.8">⏳ (${durationH} hrs)</span>
                `;
                resultsContainer.appendChild(item);

                if (dest.id === 'sannicolas') {
                    item.style.backgroundColor = 'rgba(0, 242, 234, 0.1)';
                    item.style.borderRadius = '0 5px 5px 0';
                    item.style.padding = '5px 5px 5px 10px';
                }
            }
        });

        // 4. Refrescar marcadores de puerto con la info de ruta terrestre cargada
        if (typeof renderPorts === 'function' && typeof ports !== 'undefined') {
            ports.forEach(p => {
                if (PORT_CONFIG[p.code]) {
                    p.route_distance = PORT_CONFIG[p.code].route_distance;
                    p.route_duration = PORT_CONFIG[p.code].route_duration;
                }
            });
            renderPorts(ports);
            console.log("âš“ [G1-V5] Puertos redibujados con las distancias de ruta.");
        }
    };

    console.log("ðŸ”§ [G1-V6] Overrides listos: renderPorts, createInfoBoatIcon y calculateAndDrawRoutes.");

    // ==========================================================================
    // CALLBACK POST-INIT â€” corre DESPUÃ‰S de initApp()
    // ==========================================================================
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log("ðŸŽ¬ [G1-V6] Post-init: capas y rutas...");

            // MOD-08: Ocultar de forma inmediata y persistente los paneles flotantes izquierdos
            const ribbon = document.getElementById('port-filter-ribbon');
            if (ribbon) {
                ribbon.style.setProperty('display', 'none', 'important');
            }
            const layerPanel = document.getElementById('layer-controls-panel');
            if (layerPanel) {
                layerPanel.style.setProperty('display', 'none', 'important');
            }
            console.log("ðŸš« [G1-V6] Paneles de control flotantes (Herramientas y Capas) ocultados en el DOM.");

            // Apagar etiquetas de tierra
            const toggleLands = document.getElementById('toggle-land-labels');
            if (toggleLands) {
                toggleLands.checked = false;
                if (typeof toggleLandLabels === 'function') toggleLandLabels();
            }

            // Apagar corredor sur
            const toggleSouth = document.getElementById('toggle-south-corridor');
            if (toggleSouth) {
                toggleSouth.checked = false;
                if (typeof toggleSouthCorridor === 'function') toggleSouthCorridor();
            }

            // Encender etiquetas de puertos
            const togglePorts = document.getElementById('toggle-port-labels');
            if (togglePorts) {
                togglePorts.checked = true;
                if (typeof togglePortLabels === 'function') togglePortLabels();
            }

            // ----------------------------------------------------------------
            // MOD-01 & MOD-05: Landmark Ferrobamba con Etiqueta Unificada
            //   - Une el punto verde y el tooltip "Ferrobamba" en un divIcon
            //   - Evita la dependencia y problemas de renderizado de tooltips
            // ----------------------------------------------------------------
            const ferroCoords = [-13.806910, -73.252020];
            const ferroIcon = L.divIcon({
                className: '',
                html: `
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        pointer-events: none;
                    ">
                        <!-- CÃ­rculo Verde Landmark -->
                        <div style="
                            background-color: #4caf50;
                            width: 14px;
                            height: 14px;
                            border-radius: 50%;
                            border: 2px solid #ffffff;
                            flex-shrink: 0;
                        "></div>
                        <!-- Etiqueta de Texto -->
                        <div style="
                            font-family: Arial, Helvetica, sans-serif;
                            font-weight: 700;
                            font-size: 17px;
                            color: #4caf50;
                            white-space: nowrap;
                            background: rgba(10, 15, 30, 0.85);
                            border: 1px solid rgba(255, 255, 255, 0.15);
                            border-radius: 4px;
                            padding: 4px 10px;
                        ">Ferrobamba</div>
                    </div>
                `,
                iconSize:   [150, 24],
                iconAnchor: [7, 12]  // Centra exactamente el cÃ­rculo verde sobre las coordenadas
            });

            L.marker(ferroCoords, { icon: ferroIcon }).addTo(map);
            console.log("â›°ï¸ [G1-V6] Landmark Ferrobamba y etiqueta unificados en el mapa.");

            // ----------------------------------------------------------------
            // MOD-07: Trazar rutas automÃ¡ticas directas sin abrir el sidebar
            // ----------------------------------------------------------------
            if (typeof calculateAndDrawRoutes === 'function' && MINING_PROJECTS.length > 0) {
                console.log("ðŸ›£ï¸ [G1-V6] Trazando rutas automÃ¡ticas directas (sidebar oculto)...");
                const mine = MINING_PROJECTS[0];
                
                // Mapear los puertos activos a la estructura de destinos
                const routeColors = ['#00f2ea', '#27ae60'];
                const portsToRoute = Object.keys(PORT_CONFIG).map((key, index) => {
                    const p = PORT_CONFIG[key];
                    return {
                        name: p.name,
                        coords: p.coords,
                        color: routeColors[index] || '#ccc',
                        id: p.id
                    };
                });

                // Llamar directamente a la funciÃ³n de rutas
                calculateAndDrawRoutes(mine.coords, portsToRoute);

                // Forzar ocultamiento del sidebar
                const sidebar = document.getElementById('port-details');
                if (sidebar) {
                    sidebar.classList.add('hidden');
                }
            } else {
                console.warn("âš ï¸ calculateAndDrawRoutes no disponible.");
            }

            // ==============================================================================
            // CÃMARA HD (html-to-image) Y PANEL LATERAL
            // ==============================================================================
            const hdContainer = document.createElement('div');
            hdContainer.style.position = 'absolute';
            hdContainer.style.bottom = '20px';
            hdContainer.style.left = '20px';
            hdContainer.style.zIndex = '1000';
            hdContainer.style.display = 'flex';
            hdContainer.style.flexDirection = 'column';
            hdContainer.style.gap = '10px';

            hdContainer.innerHTML = `
                <div class="glass-panel" style="padding: 10px; width: 160px;">
                    <div style="font-size: 12px; color: #546e7a; font-weight: bold; margin-bottom: 5px;">ESTUDIO FOTOGRÃFICO G1</div>
                    <button onclick="downloadMapHD()" style="
                        width: 100%;
                        background: linear-gradient(135deg, #e91e63, #9c27b0);
                        color: white;
                        border: none;
                        padding: 8px;
                        border-radius: 4px;
                        font-family: Arial, Helvetica, sans-serif;
                        font-size: 13px;
                        font-weight: bold;
                        cursor: pointer;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                        transition: all 0.2s;
                    ">
                        ðŸ“¸ EXPORTAR HD
                    </button>
                    <div id="hd-status" style="font-size: 11px; color: #4caf50; margin-top: 5px; text-align: center; display: none;">Procesando 3x...</div>
                </div>
            `;
            document.body.appendChild(hdContainer);

            window.downloadMapHD = function() {
                const status = document.getElementById('hd-status');
                status.style.display = 'block';
                status.innerText = "Preparando G1...";
                
                setTimeout(() => {
                    if (typeof htmlToImage === 'undefined') {
                        status.innerText = "âŒ Error: htmlToImage no cargado.";
                        status.style.color = "#f44336";
                        return;
                    }

                    status.innerText = "Renderizando 3x...";
                    
                    htmlToImage.toPng(document.body, { 
                        pixelRatio: 3,
                        style: { transform: "none" } // SoluciÃ³n definitiva a Leaflet
                    })
                    .then(function (dataUrl) {
                        const link = document.createElement('a');
                        link.download = 'PETRAL_G1_Ferrobamba_HD.png';
                        link.href = dataUrl;
                        link.click();
                        status.innerText = "âœ… Exportado OK";
                        setTimeout(() => status.style.display = 'none', 3000);
                    })
                    .catch(function (error) {
                        console.error('Error html-to-image:', error);
                        status.innerText = "âŒ Error captura";
                        status.style.color = "#f44336";
                    });
                }, 500);
            };

            // ==============================================================================
            // HERRAMIENTA DE CAPTURA DE COORDENADAS
            // ==============================================================================
            if (map) {
                map.on('click', function(e) {
                    const lat = e.latlng.lat.toFixed(6);
                    const lng = e.latlng.lng.toFixed(6);
                    const text = `${lat}, ${lng}`;

                    // Intentar copiar al portapapeles
                    navigator.clipboard.writeText(text).then(() => {
                        console.log(`[G1 Coords] Copiado: ${text}`);
                    }).catch(err => {
                        console.error('Error copiando:', err);
                    });

                    L.popup()
                        .setLatLng(e.latlng)
                        .setContent(`
                            <div style="font-family: Arial, sans-serif; text-align: center;">
                                <strong style="color: #e91e63; font-size: 16px;">Coordenada G1</strong><br>
                                <span style="font-size: 15px; user-select: all;">${text}</span><br>
                                <span style="font-size: 12px; color: #757575;">Copiado al portapapeles</span>
                            </div>
                        `)
                        .openOn(map);
                });
                console.log("ðŸŽ¯ [G1-V8] Utilidad de coordenadas por clic activada.");
            }

        }, 1500);
    });

    console.log("âœ… [G1-V6] Listo. Esperando DOMContentLoaded...");
}

