// ==============================================================================
// SCRIPT DE PERSONALIZACIÓN LOCAL - GRÁFICO 1 (FERROBAMBA) — V6 FINAL (MOD-08)
// Ubicación: C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Graficos.25.05.26\script_local.js
//
// AISLAMIENTO TOTAL: Solo cargado por grafico1.html. Dashboard de producción intacto.
// Sobreescribe funciones window.* antes de DOMContentLoaded para que initApp() las use.
// ==============================================================================

console.log("🔄 [G1-V6] Iniciando personalización Gráfico 1 (Ferrobamba) - V6 Final (MOD-08)...");

if (typeof CONFIG === 'undefined' || typeof PORT_CONFIG === 'undefined' || typeof MINING_PROJECTS === 'undefined') {
    console.error("❌ Error crítico: script.js no cargado antes que script_local.js.");
} else {

    // ==========================================================================
    // 1. VISTA INICIAL DEL MAPA
    // ==========================================================================
    CONFIG.initialCenter = [-14.40, -75.50];
    CONFIG.initialZoom = 8;

    // ==========================================================================
    // 2. FILTRAR PORT_CONFIG → Solo Pisco (PEPIO) y San Nicolás (PESQN)
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
    console.log("⚓ [G1-V6] PORT_CONFIG filtrado. Activos: Pisco y San Nicolás.");

    // ==========================================================================
    // 3. RECALCULAR 'ports[]' en-place (const en script.js → usar splice)
    // ==========================================================================
    if (typeof processShipData === 'function' && typeof ports !== 'undefined') {
        const portsFiltered = processShipData();
        ports.splice(0, ports.length, ...portsFiltered);
        console.log(`⚓ [G1-V6] ports[] recalculado. Total: ${ports.length}`);
    }

    // ==========================================================================
    // 4. FERROBAMBA → único proyecto minero
    // ==========================================================================
    MINING_PROJECTS.length = 0;
    MINING_PROJECTS.push({
        name: "Ferrobamba",
        owner: "MMG (Las Bambas)",
        type: "Cobre",
        state: "Operación",
        coords: [-13.806910, -73.252020]
    });
    console.log("⛰️ [G1-V6] MINING_PROJECTS = solo Ferrobamba.");

    // ==========================================================================
    // MOD-02 & MOD-05: SOBREESCRIBIR renderPorts
    //   - Elimina AMBOS contadores: tanquero 🛢️ Y barcos (N)
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
        console.log("✅ [G1-V6] renderPorts: etiquetas en tierra removidas (solo burbujas flotantes).");
    };

    // ==========================================================================
    // MOD-03 & MOD-04 & MOD-05: SOBREESCRIBIR createInfoBoatIcon
    //   - Burbuja con fondo BLANCO y alto contraste
    //   - 4 filas de información detallada
    //   - Desplazada al oeste (iconAnchor horizontal a 270) para alejarla de la costa
    // ==========================================================================
    window.createInfoBoatIcon = function(port) {
        // Calcular emoji-barco según DWT (mismo algoritmo original)
        let dwt = 35000;
        if (typeof port.max_dwt === 'string') {
            dwt = parseInt(port.max_dwt.replace(/k/i, '000'), 10) || 35000;
            if (port.max_dwt.toLowerCase().includes('k') && dwt < 1000) dwt *= 1000;
        }
        const pct      = Math.max(0, Math.min(1, (dwt - 35000) / (200000 - 35000)));
        const fontSize = Math.round(24 + (pct * (48 - 24))); // 24px→48px

        // Nombre del puerto en mayúsculas
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
                font-size: 9px;
                color: #757575; /* Gris legible */
                font-weight: 500;
                letter-spacing: 0.5px;
                line-height: 1.3;
                white-space: nowrap;
                margin-top: 2px;
                animation: pulse-g1-dark 1.5s infinite;
            ">🛣️ Calculando ruta terrestre...</div>
        `;
        
        if (port.route_distance && port.route_duration) {
            routeHtml = `
                <div style="
                    font-size: 9px;
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
            className: '', // Sin clase CSS — todo inline
            html: `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    background: #ffffff;
                    border: 1px solid rgba(0, 0, 0, 0.15);
                    border-radius: 8px;
                    padding: 5px 9px 5px 7px;
                    min-width: 195px;
                    max-width: 230px;
                    box-shadow: 0 4px 18px rgba(0,0,0,0.15);
                    font-family: 'Rajdhani', sans-serif;
                    gap: 2px;
                ">
                    <!-- Fila 1: Nombre del puerto -->
                    <div style="
                        font-size: 10px;
                        color: #b8860b; /* Ámbar/Dorado oscuro premium */
                        font-weight: 700;
                        letter-spacing: 1px;
                        line-height: 1.3;
                        white-space: nowrap;
                    ">${portName}</div>

                    <!-- Fila 2: Barco + Calado + Max DWT -->
                    <div style="display:flex; align-items:center; gap:5px;">
                        <div style="font-size:${fontSize}px; line-height:1; flex-shrink:0;">🚢</div>
                        <div style="display:flex; flex-direction:column; line-height:1.2;">
                            <span style="font-size:8px; color:#546e7a;">Calado</span>
                            <span style="font-size:12px; color:#101520; font-weight:700;">${port.draft}m</span>
                        </div>
                        <div style="color:rgba(0,0,0,0.15); font-size:16px; margin:0 2px;">|</div>
                        <div style="display:flex; flex-direction:column; line-height:1.2;">
                            <span style="font-size:8px; color:#546e7a;">Max DWT</span>
                            <span style="font-size:12px; color:#101520; font-weight:700;">${port.max_dwt}</span>
                        </div>
                    </div>

                    <!-- Fila 3: Tipo de buque -->
                    <div style="
                        font-size: 9px;
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
            iconSize:   [230, 100],
            iconAnchor: [270, 50]  // Offset incrementado a 270 para desplazarla al mar (oeste)
        });
    };

    // ==========================================================================
    // MOD-04 & MOD-06: SOBREESCRIBIR calculateAndDrawRoutes
    //   - Trazado de rutas y llenado del panel sidebar
    //   - Filtro whitelist estricto de carreteras principales (excluye calles/avenidas)
    //   - Renderizado con Leader Lines (Líneas de llamada) y Wrap Text en etiquetas
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
                console.log(`🛣️ [G1-V5] OSRM Route: ${portKey} -> ${distanceKm} km | ${durationH} hrs`);
            }

            // Dibujar la línea de ruta en el mapa
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
                    
                    // Exclusión de calles, avenidas e interceptores urbanos pequeños
                    if (
                        roadName && 
                        ALLOWED_ROAD_NAMES.includes(roadName) && 
                        !seenRoads.has(roadName) && 
                        step.distance > 2000
                    ) {
                        seenRoads.add(roadName);
                        const pos = [step.maneuver.location[1], step.maneuver.location[0]];
                        
                        // Ajustar para que etiquetas conflictivas de acceso
                        // a puertos se dibujen HACIA ABAJO de la ruta.
                        const renderBelow = (
                            roadName === "Carretera Paracas - Puerto General San Martín" ||
                            roadName === "Carretera San Juan de Marcona"
                        );
                        
                        let iconHtml = "";
                        let anchor = [60, 75]; // Por defecto arriba
                        
                        if (renderBelow) {
                            anchor = [60, 0]; // Anclaje superior para proyectarse hacia abajo
                            iconHtml = `
                                <div style="
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    width: 120px;
                                    height: 75px;
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
                                        box-shadow: 0 0 4px ${dest.color};
                                    "></div>

                                    <!-- Línea conector delgada (en medio) -->
                                    <div style="
                                        width: 1px;
                                        height: 22px;
                                        background-color: ${dest.color};
                                    "></div>

                                    <!-- Caja de Texto (Wrap Text) (abajo) -->
                                    <div style="
                                        background: rgba(10, 15, 30, 0.9);
                                        color: #ffffff;
                                        border: 1.5px solid ${dest.color};
                                        padding: 3px 6px;
                                        font-size: 9px;
                                        border-radius: 4px;
                                        width: 90px;
                                        text-align: center;
                                        font-family: 'Rajdhani', sans-serif;
                                        font-weight: bold;
                                        white-space: normal;
                                        line-height: 1.2;
                                        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                                    ">${roadName}</div>
                                </div>
                            `;
                        } else {
                            anchor = [60, 75]; // Anclaje inferior para proyectarse hacia arriba
                            iconHtml = `
                                <div style="
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    width: 120px;
                                    height: 75px;
                                    justify-content: flex-end;
                                    pointer-events: none;
                                ">
                                    <!-- Caja de Texto (Wrap Text) (arriba) -->
                                    <div style="
                                        background: rgba(10, 15, 30, 0.9);
                                        color: #ffffff;
                                        border: 1.5px solid ${dest.color};
                                        padding: 3px 6px;
                                        font-size: 9px;
                                        border-radius: 4px;
                                        width: 90px;
                                        text-align: center;
                                        font-family: 'Rajdhani', sans-serif;
                                        font-weight: bold;
                                        white-space: normal;
                                        line-height: 1.2;
                                        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                                    ">${roadName}</div>

                                    <!-- Línea conector delgada (en medio) -->
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
                                        box-shadow: 0 0 4px ${dest.color};
                                    "></div>
                                </div>
                            `;
                        }
                        
                        const tagMarker = L.marker(pos, {
                            icon: L.divIcon({
                                className: '',
                                html: iconHtml,
                                iconSize: [120, 75],
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
                    <span style="font-size:1.1em">🛣️ ${distanceKm} km</span> <span style="font-size:0.9em; opacity:0.8">(${durationH} hrs)</span>
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
            console.log("⚓ [G1-V5] Puertos redibujados con las distancias de ruta.");
        }
    };

    console.log("🔧 [G1-V6] Overrides listos: renderPorts, createInfoBoatIcon y calculateAndDrawRoutes.");

    // ==========================================================================
    // CALLBACK POST-INIT — corre DESPUÉS de initApp()
    // ==========================================================================
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log("🎬 [G1-V6] Post-init: capas y rutas...");

            // MOD-08: Ocultar de forma inmediata y persistente los paneles flotantes izquierdos
            const ribbon = document.getElementById('port-filter-ribbon');
            if (ribbon) {
                ribbon.style.setProperty('display', 'none', 'important');
            }
            const layerPanel = document.getElementById('layer-controls-panel');
            if (layerPanel) {
                layerPanel.style.setProperty('display', 'none', 'important');
            }
            console.log("🚫 [G1-V6] Paneles de control flotantes (Herramientas y Capas) ocultados en el DOM.");

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
                        <!-- Círculo Verde Landmark -->
                        <div style="
                            background-color: #4caf50;
                            width: 14px;
                            height: 14px;
                            border-radius: 50%;
                            box-shadow: 0 0 0 3px rgba(76,175,80,0.4), 0 0 14px #4caf50;
                            border: 2px solid #ffffff;
                            flex-shrink: 0;
                        "></div>
                        <!-- Etiqueta de Texto -->
                        <div style="
                            font-family: 'Rajdhani', sans-serif;
                            font-weight: 700;
                            font-size: 12px;
                            color: #4caf50;
                            white-space: nowrap;
                            background: rgba(10, 15, 30, 0.85);
                            border: 1px solid rgba(255, 255, 255, 0.15);
                            border-radius: 4px;
                            padding: 2px 6px;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
                        ">Ferrobamba</div>
                    </div>
                `,
                iconSize:   [150, 24],
                iconAnchor: [7, 12]  // Centra exactamente el círculo verde sobre las coordenadas
            });

            L.marker(ferroCoords, { icon: ferroIcon }).addTo(map);
            console.log("⛰️ [G1-V6] Landmark Ferrobamba y etiqueta unificados en el mapa.");

            // ----------------------------------------------------------------
            // MOD-07: Trazar rutas automáticas directas sin abrir el sidebar
            // ----------------------------------------------------------------
            if (typeof calculateAndDrawRoutes === 'function' && MINING_PROJECTS.length > 0) {
                console.log("🛣️ [G1-V6] Trazando rutas automáticas directas (sidebar oculto)...");
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

                // Llamar directamente a la función de rutas
                calculateAndDrawRoutes(mine.coords, portsToRoute);

                // Forzar ocultamiento del sidebar
                const sidebar = document.getElementById('port-details');
                if (sidebar) {
                    sidebar.classList.add('hidden');
                }
            } else {
                console.warn("⚠️ calculateAndDrawRoutes no disponible.");
            }

        }, 1500);
    });

    console.log("✅ [G1-V6] Listo. Esperando DOMContentLoaded...");
}
