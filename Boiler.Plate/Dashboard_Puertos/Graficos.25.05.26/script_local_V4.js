// ==============================================================================
// SCRIPT DE PERSONALIZACIÓN LOCAL - GRÁFICO 1 (FERROBAMBA) — V4 (RESPALDO)
// Ubicación: C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Graficos.25.05.26\script_local_V4.js
// ==============================================================================

console.log("🔄 [G1-V4-Backup] Cargando respaldo de la versión V4...");

// [El contenido original se guarda exactamente igual]
if (typeof CONFIG === 'undefined' || typeof PORT_CONFIG === 'undefined' || typeof MINING_PROJECTS === 'undefined') {
    console.error("❌ Error crítico: script.js no cargado.");
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

            const label = `${port.name}`;

            marker.bindTooltip(label, {
                permanent: true,
                direction: 'right',
                className: 'port-label-container',
                offset: [15, 0],
                opacity: 1
            });

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
                @keyframes pulse-g1 {
                    0% { opacity: 0.35; }
                    50% { opacity: 0.75; }
                    100% { opacity: 0.35; }
                }
            </style>
            <div style="
                font-size: 9px;
                color: rgba(255,255,255,0.4);
                font-weight: 500;
                letter-spacing: 0.5px;
                line-height: 1.3;
                white-space: nowrap;
                margin-top: 2px;
                animation: pulse-g1 1.5s infinite;
            ">🛣️ Calculando ruta terrestre...</div>
        `;
        
        if (port.route_distance && port.route_duration) {
            routeHtml = `
                <div style="
                    font-size: 9px;
                    color: #ffb74d;
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
                    background: rgba(10, 15, 30, 0.92);
                    border: 1px solid rgba(255,255,255,0.18);
                    border-radius: 8px;
                    padding: 5px 9px 5px 7px;
                    min-width: 195px;
                    max-width: 230px;
                    box-shadow: 0 2px 14px rgba(0,0,0,0.7);
                    font-family: 'Rajdhani', sans-serif;
                    gap: 2px;
                ">
                    <div style="font-size: 10px; color: #ffd700; font-weight: 700; letter-spacing: 1px; line-height: 1.3; white-space: nowrap;">${portName}</div>
                    <div style="display:flex; align-items:center; gap:5px;">
                        <div style="font-size:${fontSize}px; line-height:1; flex-shrink:0;">🚢</div>
                        <div style="display:flex; flex-direction:column; line-height:1.2;">
                            <span style="font-size:8px; color:#90a4ae;">Calado</span>
                            <span style="font-size:12px; color:#ffffff; font-weight:700;">${port.draft}m</span>
                        </div>
                        <div style="color:rgba(255,255,255,0.25); font-size:16px; margin:0 2px;">|</div>
                        <div style="display:flex; flex-direction:column; line-height:1.2;">
                            <span style="font-size:8px; color:#90a4ae;">Max DWT</span>
                            <span style="font-size:12px; color:#ffffff; font-weight:700;">${port.max_dwt}</span>
                        </div>
                    </div>
                    <div style="font-size: 9px; color: #00e5ff; font-weight: 700; letter-spacing: 0.7px; line-height: 1.3; white-space: nowrap;">${shipClass}</div>
                    ${routeHtml}
                </div>
            `,
            iconSize:   [230, 100],
            iconAnchor: [240, 50]
        });
    };

    const originalCalculateAndDrawRoutes = window.calculateAndDrawRoutes;
    window.calculateAndDrawRoutes = async function(startCoords, destinations) {
        if (typeof originalCalculateAndDrawRoutes === 'function') {
            await originalCalculateAndDrawRoutes(startCoords, destinations);
        }

        try {
            const resultsContainer = document.getElementById('route-results');
            if (resultsContainer) {
                destinations.forEach(dest => {
                    const items = resultsContainer.getElementsByClassName('route-item');
                    for (let item of items) {
                        const strongTag = item.querySelector('strong');
                        if (strongTag && strongTag.textContent.trim().toLowerCase() === dest.name.toLowerCase()) {
                            const textContent = item.textContent || '';
                            const kmMatch = textContent.match(/🛣️\s*([\d.]+)\s*km/);
                            const hrsMatch = textContent.match(/\(\s*([\d.]+)\s*hrs\)/);
                            if (kmMatch && hrsMatch) {
                                const distanceKm = kmMatch[1];
                                const durationH = hrsMatch[1];
                                const portKey = Object.keys(PORT_CONFIG).find(key => PORT_CONFIG[key].id === dest.id);
                                if (portKey) {
                                    PORT_CONFIG[portKey].route_distance = distanceKm;
                                    PORT_CONFIG[portKey].route_duration = durationH;
                                }
                            }
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
            }
        } catch (e) {
            console.error("❌ [G1-V4] Error en OSRM backup:", e);
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
                html: `<div style="background-color:#4caf50; width:14px; height:14px; border-radius:50%; box-shadow: 0 0 0 3px rgba(76,175,80,0.4), 0 0 14px #4caf50; border:2px solid #ffffff;"></div>`,
                iconSize:   [18, 18],
                iconAnchor: [9, 9]
            });

            L.marker(ferroCoords, { icon: ferroIcon })
                .addTo(map)
                .bindTooltip(
                    `<div style="font-family:'Rajdhani',sans-serif; font-weight:700; font-size:12px; color:#4caf50; white-space:nowrap; padding:1px 4px;">Ferrobamba</div>`,
                    { permanent:true, direction:'right', className:'mine-label-leader', offset:[10, -15], opacity:1 }
                );

            if (typeof showMineDetails === 'function' && MINING_PROJECTS.length > 0) {
                showMineDetails(MINING_PROJECTS[0]);
            }
        }, 1500);
    });
}
