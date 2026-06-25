// ==============================================================================
// SCRIPT DE PERSONALIZACIÓN LOCAL - GRÁFICO 1 (FERROBAMBA) — V5 (RESPALDO ORIGINAL)
// Ubicación: C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Graficos.25.05.26\script_local_V5.js
// ==============================================================================

console.log("🔄 [G1-V5-Backup] Cargando respaldo de la versión V5 inicial...");

if (typeof CONFIG === 'undefined' || typeof PORT_CONFIG === 'undefined' || typeof MINING_PROJECTS === 'undefined') {
    console.error("❌ Error crítico: script.js no cargado antes que script_local.js.");
} else {
    CONFIG.initialCenter = [-14.40, -75.50];
    CONFIG.initialZoom = 8;

    const portsToKeep = ['PEPIO', 'PESQN'];
    for (const portCode in PORT_CONFIG) {
        if (!portsToKeep.includes(portCode)) {
            delete PORT_CONFIG[portCode];
        }
    }

    PORT_CONFIG['PEPIO'].ship_class  = 'SUPRAMAX / PANAMAX';
    PORT_CONFIG['PESQN'].ship_class  = 'CAPESIZE';

    if (typeof processShipData === 'function' && typeof ports !== 'undefined') {
        const portsFiltered = processShipData();
        ports.splice(0, ports.length, ...portsFiltered);
    }

    MINING_PROJECTS.length = 0;
    MINING_PROJECTS.push({
        name: "Ferrobamba",
        owner: "MMG (Las Bambas)",
        type: "Cobre",
        state: "Operación",
        coords: [-13.806910, -73.252020]
    });

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
    };

    window.createInfoBoatIcon = function(port) {
        let dwt = 35000;
        if (typeof port.max_dwt === 'string') {
            dwt = parseInt(port.max_dwt.replace(/k/i, '000'), 10) || 35000;
            if (port.max_dwt.toLowerCase().includes('k') && dwt < 1000) dwt *= 1000;
        }
        const pct      = Math.max(0, Math.min(1, (dwt - 35000) / (200000 - 35000)));
        const fontSize = Math.round(24 + (pct * (48 - 24)));

        const portName = (port.name || '').toUpperCase();
        const shipClass = port.ship_class || '';

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
                color: #757575;
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
                    color: #d84315;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    line-height: 1.3;
                    white-space: nowrap;
                    margin-top: 2px;
                ">🛣️ ${port.route_distance} km | ⏳ ${port.route_duration} hrs</div>
            `;
        }

        return L.divIcon({
            className: '',
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
                    <div style="font-size: 10px; color: #b8860b; font-weight: 700; letter-spacing: 1px; line-height: 1.3; white-space: nowrap;">${portName}</div>
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
                    <div style="font-size: 9px; color: #00838f; font-weight: 700; letter-spacing: 0.7px; line-height: 1.3; white-space: nowrap;">${shipClass}</div>
                    ${routeHtml}
                </div>
            `,
            iconSize:   [230, 100],
            iconAnchor: [270, 50]
        });
    };

    window.calculateAndDrawRoutes = async function(startCoords, destinations) {
        const resultsContainer = document.getElementById('route-results');
        if (resultsContainer) resultsContainer.innerHTML = '';

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

        routeResults.sort((a, b) => {
            if (a.error) return 1;
            if (b.error) return -1;
            return a.route.distance - b.route.distance;
        });

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

            const portKey = Object.keys(PORT_CONFIG).find(key => PORT_CONFIG[key].id === dest.id);
            if (portKey) {
                PORT_CONFIG[portKey].route_distance = distanceKm;
                PORT_CONFIG[portKey].route_duration = durationH;
            }

            const routeLayer = L.geoJSON(route.geometry, {
                style: {
                    color: dest.color,
                    weight: 4,
                    opacity: 0.7,
                    dashArray: '5, 10'
                }
            }).addTo(map);
            activeRoutes.push(routeLayer);

            if (route.legs && route.legs[0].steps) {
                const steps = route.legs[0].steps;
                const seenRoads = new Set();
                
                steps.forEach(step => {
                    const roadName = step.name;
                    
                    if (
                        roadName && 
                        ALLOWED_ROAD_NAMES.includes(roadName) && 
                        !seenRoads.has(roadName) && 
                        step.distance > 2000
                    ) {
                        seenRoads.add(roadName);
                        const pos = [step.maneuver.location[1], step.maneuver.location[0]];
                        
                        const tagMarker = L.marker(pos, {
                            icon: L.divIcon({
                                className: '',
                                html: `
                                    <div style="
                                        display: flex;
                                        flex-direction: column;
                                        align-items: center;
                                        width: 120px;
                                        height: 75px;
                                        justify-content: flex-end;
                                        pointer-events: none;
                                    ">
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
                                        <div style="width: 1px; height: 22px; background-color: ${dest.color};"></div>
                                        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: ${dest.color}; border: 1px solid #ffffff; box-shadow: 0 0 4px ${dest.color};"></div>
                                    </div>
                                `,
                                iconSize: [120, 75],
                                iconAnchor: [60, 75]
                            })
                        }).addTo(map);
                        activeRoutes.push(tagMarker);
                    }
                });
            }

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

        if (typeof renderPorts === 'function' && typeof ports !== 'undefined') {
            ports.forEach(p => {
                if (PORT_CONFIG[p.code]) {
                    p.route_distance = PORT_CONFIG[p.code].route_distance;
                    p.route_duration = PORT_CONFIG[p.code].route_duration;
                }
            });
            renderPorts(ports);
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const toggleLands = document.getElementById('toggle-land-labels');
            if (toggleLands) {
                toggleLands.checked = false;
                if (typeof toggleLandLabels === 'function') toggleLandLabels();
            }
            const toggleSouth = document.getElementById('toggle-south-corridor');
            if (toggleSouth) {
                toggleSouth.checked = false;
                if (typeof toggleSouthCorridor === 'function') toggleSouthCorridor();
            }
            const togglePorts = document.getElementById('toggle-port-labels');
            if (togglePorts) {
                togglePorts.checked = true;
                if (typeof togglePortLabels === 'function') togglePortLabels();
            }

            const ferroCoords = [-13.806910, -73.252020];
            const ferroIcon = L.divIcon({
                className: '',
                html: `
                    <div style="display: flex; align-items: center; gap: 8px; pointer-events: none;">
                        <div style="background-color: #4caf50; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 0 3px rgba(76,175,80,0.4), 0 0 14px #4caf50; border: 2px solid #ffffff; flex-shrink: 0;"></div>
                        <div style="font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 12px; color: #4caf50; white-space: nowrap; background: rgba(10, 15, 30, 0.85); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 4px; padding: 2px 6px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);">Ferrobamba</div>
                    </div>
                `,
                iconSize:   [150, 24],
                iconAnchor: [7, 12]
            });

            L.marker(ferroCoords, { icon: ferroIcon }).addTo(map);

            if (typeof showMineDetails === 'function' && MINING_PROJECTS.length > 0) {
                showMineDetails(MINING_PROJECTS[0]);
            }
        }, 1500);
    });
}
