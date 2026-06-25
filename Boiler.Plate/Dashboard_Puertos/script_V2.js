// --- Configuration ---
const CONFIG = {
    initialCenter: [-9.5, -75],
    initialZoom: 6,
    tiles: {
        standard: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
        satellite: 'http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
    },
    attribution: '&copy; OpenStreetMap contributors'
};

// --- Port Mapping & Config ---
// Data Source: APN / Operator Websites (Approximate Max Operational Limits)
// DWT = Deadweight Tonnage
const PORT_CONFIG = {
    'PETAL': { id: 'talara', name: "Talara", type: 'north', coords: [-4.5772, -81.2719], draft: 10.5, max_dwt: "52k" },
    'PEPAI': { id: 'paita', name: "Paita", type: 'north', coords: [-5.0830, -81.1144], draft: 13.0, max_dwt: "50k" },
    'PESAL': { id: 'salaverry', name: "Salaverry", type: 'north', coords: [-8.2289, -78.9796], draft: 10.5, max_dwt: "65k" },
    'PECHM': { id: 'chimbote', name: "Chimbote", type: 'center', coords: [-9.0765, -78.5916], draft: 11.0, max_dwt: "40k" },
    'PECHY': { id: 'chancay', name: "Chancay (Cosco)", type: 'center', coords: [-11.5930, -77.2770], draft: 17.8, max_dwt: "160k" },
    'PECLL': { id: 'callao', name: "Callao", type: 'center', coords: [-12.0508, -77.1373], draft: 16.0, max_dwt: "150k" },
    'PECON': { id: 'conchan', name: "Conchán (Petroperú)", type: 'center', coords: [-12.2628, -76.9304], draft: 18.3, max_dwt: "70k" },
    'PEPIO': { id: 'pisco', name: "Pisco", type: 'south', coords: [-13.8055, -76.2922], draft: 14.0, max_dwt: "60k" },
    'PEMAT': { id: 'matarani', name: "Matarani", type: 'south', coords: [-17.0016, -72.1065], draft: 18.0, max_dwt: "60k" },
    'PEILO': { id: 'ilo', name: "Ilo", type: 'south', coords: [-17.6450, -71.3468], draft: 11.0, max_dwt: "35k" },
    'PESQN': { id: 'sannicolas', name: "San Nicolás", type: 'south', coords: [-15.2600, -75.2400], draft: 18.0, max_dwt: "300k" },
    // Virtual Terminals (Linked to Callao Data with Filtering)
    'VALER': { id: 'valero', name: "Terminal Valero (Callao)", type: 'terminal', coords: [-11.9684, -77.1483], draft: 12.0, max_dwt: "50k", filterTerminal: "VALERO" },
    'TRALS': { id: 'tralsa', name: "Terminal TRALSA (Callao)", type: 'terminal', coords: [-11.9734, -77.1462], draft: 11.0, max_dwt: "40k", filterTerminal: "TRALSA" }
};

// Helper: Process Real Data
function processShipData() {
    const portStats = {};

    // Initialize stats
    Object.keys(PORT_CONFIG).forEach(code => {
        portStats[code] = {
            count: 0,
            tankers: 0,
            ships: []
        };
    });

    if (typeof REAL_TIME_SHIPS !== 'undefined') {
        REAL_TIME_SHIPS.forEach(ship => {
            const code = ship.port_id;
            const shipTerminal = (ship.terminal || "").toUpperCase();

            // 1. Regular Port Mapping
            if (portStats[code]) {
                portStats[code].count++;
                portStats[code].ships.push(ship);
                const type = (ship.type || "").toUpperCase();
                if (type.includes("TANQUE") || type.includes("GASERO")) {
                    portStats[code].tankers++;
                }
            }

            // 2. Terminal Specific Mapping (Filter by Keyword)
            Object.keys(PORT_CONFIG).forEach(pCode => {
                const conf = PORT_CONFIG[pCode];
                if (conf.filterTerminal && ship.port_id === 'PECLL') {
                    if (shipTerminal.includes(conf.filterTerminal)) {
                        portStats[pCode].count++;
                        portStats[pCode].ships.push(ship);
                        const type = (ship.type || "").toUpperCase();
                        if (type.includes("TANQUE") || type.includes("GASERO")) {
                            portStats[pCode].tankers++;
                        }
                    }
                }
            });
        });
    }

    // Merge with Config
    return Object.keys(PORT_CONFIG).map(code => {
        const stats = portStats[code];
        const conf = PORT_CONFIG[code];
        return {
            ...conf,
            code: code,
            ships: stats.count,
            tankers: stats.tankers,
            shipList: stats.ships
        };
    });
}

// --- App State ---
let map;
let layers = {
    base: null,
    dept: null
};
let currentMapType = 'standard';
let markers = [];
let currentFilter = 'all';
const ports = processShipData(); // Initial load

// --- GPS TRACKING ---
let userMarker = null;
let userAccuracyCircle = null;
let followUser = false;
let watchId = null;

// Supabase Config
const SUPABASE_URL = "https://mancsrsbtzgctgorpogs.supabase.co";
const SUPABASE_KEY = "sb_publishable_CT41HFF7NMtQunrSSGsksg_uwxmfteK";
let isRecording = false;
let syncInterval = null;
let lastLatLng = null;

// --- OFFLINE QUEUE ---
const OFFLINE_QUEUE_KEY = 'gps_offline_queue';

function saveToOfflineQueue(payload) {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    queue.push(payload);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    console.log(`📦 Sin señal — guardado offline (${queue.length} pendientes)`);
}

async function flushOfflineQueue() {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    if (queue.length === 0) return;
    console.log(`📤 Enviando ${queue.length} puntos guardados offline...`);
    const sent = [];
    for (const payload of queue) {
        try {
            const resp = await fetch(`${SUPABASE_URL}/rest/v1/field_tracking`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(payload)
            });
            if (resp.ok) sent.push(payload);
        } catch (e) { break; } // Sin señal aún, parar
    }
    const remaining = queue.filter(p => !sent.includes(p));
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    if (sent.length > 0) console.log(`✅ ${sent.length} puntos enviados desde cola offline`);
}

// Escuchar cuando regresa la señal
window.addEventListener('online', flushOfflineQueue);

async function syncLocationToSupabase(latlng, accuracy) {
    if (!isRecording || !latlng) return;

    const payload = {
        trip_id: "Marcona_Field_Visit_" + new Date().toISOString().split('T')[0],
        latitude: latlng[0],
        longitude: latlng[1],
        accuracy: accuracy,
        user_name: (document.getElementById('user-id') && document.getElementById('user-id').value) || "Marcona_Group"
    };

    if (!navigator.onLine) {
        saveToOfflineQueue(payload);
        return;
    }

    try {
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/field_tracking`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(payload)
        });
        if (resp.ok) {
            console.log("📍 Ubicación sincronizada con Supabase");
            flushOfflineQueue(); // Aprovechar y enviar pendientes
        } else {
            saveToOfflineQueue(payload); // Fallo HTTP → guardar offline
        }
    } catch (err) {
        saveToOfflineQueue(payload); // Sin señal → guardar offline
    }
}


let wakeLock = null;

async function toggleRecording() {
    isRecording = !isRecording;
    const btn = document.getElementById('btn-record');

    if (isRecording) {
        btn.classList.add('active');
        btn.innerHTML = "🔴 REC ON";
        // Mantener pantalla encendida
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch (e) { console.warn('Wake Lock no disponible:', e); }
        // Sync every 60 seconds
        syncInterval = setInterval(() => {
            if (lastLatLng) syncLocationToSupabase(lastLatLng.coords, lastLatLng.accuracy);
        }, 60000);
        // Initial sync
        if (lastLatLng) syncLocationToSupabase(lastLatLng.coords, lastLatLng.accuracy);
    } else {
        btn.classList.remove('active');
        btn.innerHTML = "⏺ GRABAR";
        if (syncInterval) clearInterval(syncInterval);
        syncInterval = null;
        // Liberar Wake Lock
        if (wakeLock) { wakeLock.release(); wakeLock = null; }
    }
}

function toggleGPS() {
    const btn = document.getElementById('btn-gps');
    if (!navigator.geolocation) {
        alert("GPS no soportado en este navegador.");
        return;
    }

    if (watchId !== null) {
        // Stop GPS
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        if (userMarker) map.removeLayer(userMarker);
        if (userAccuracyCircle) map.removeLayer(userAccuracyCircle);
        userMarker = null;
        userAccuracyCircle = null;
        lastLatLng = null;
        btn.classList.remove('active');
        btn.innerHTML = "GPS OFF";
        if (isRecording) toggleRecording(); // Stop recording if GPS is off
        return;
    }

    // Start GPS
    btn.classList.add('active');
    btn.innerHTML = "GPS ON";

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            const latlng = [latitude, longitude];
            lastLatLng = { coords: latlng, accuracy: accuracy };

            if (!userMarker) {
                userMarker = L.marker(latlng, {
                    icon: L.divIcon({
                        className: 'gps-marker-container',
                        html: '<div class="gps-marker"></div>',
                        iconSize: [20, 20]
                    })
                }).addTo(map);
                userAccuracyCircle = L.circle(latlng, { radius: accuracy, color: '#2196f3', fillOpacity: 0.15 }).addTo(map);
            } else {
                userMarker.setLatLng(latlng);
                userAccuracyCircle.setLatLng(latlng).setRadius(accuracy);
            }

            if (followUser) {
                map.setView(latlng, map.getZoom());
            }
        },
        (error) => {
            console.error("GPS Error:", error);
            alert("Error al obtener ubicación.");
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );
}

function toggleFollowMe() {
    followUser = !followUser;
    const btn = document.getElementById('btn-follow-me');
    if (followUser) {
        btn.classList.add('active');
        if (userMarker) map.setView(userMarker.getLatLng(), map.getZoom());
    } else {
        btn.classList.remove('active');
    }
}

// --- PERIMETER SIDES ---
function renderPerimeterSides() {
    if (typeof PERIMETER_SIDES_GEOJSON === 'undefined') return;

    // Create perimeter lines layer (without labels)
    window.perimeterLayer = L.geoJSON(PERIMETER_SIDES_GEOJSON, {
        style: function (feature) {
            return {
                color: feature.properties.stroke || '#3388ff',
                weight: 3,
                opacity: 0.8,
                dashArray: '5, 5'
            };
        },
        onEachFeature: function (feature, layer) {
            // Only popup, no permanent tooltip
            layer.bindPopup(`<b>${feature.properties.name}</b><br>${feature.properties.description}`);
        }
    }); // Removed .addTo(map)

    // Create separate labels layer
    window.perimeterLabelsLayer = L.geoJSON(PERIMETER_SIDES_GEOJSON, {
        style: function () {
            return {
                opacity: 0,  // Invisible lines, only labels
                weight: 0
            };
        },
        onEachFeature: function (feature, layer) {
            if (feature.properties.name) {
                layer.bindTooltip(feature.properties.name, {
                    permanent: true,
                    direction: 'center',
                    className: 'perimeter-label'
                }).openTooltip();
            }
        }
    }); // Removed .addTo(map)
}

function togglePerimeter() {
    const show = document.getElementById('toggle-perimeter').checked;
    if (show && window.perimeterLayer) {
        map.addLayer(window.perimeterLayer);
    } else if (window.perimeterLayer) {
        map.removeLayer(window.perimeterLayer);
    }
}


function togglePerimeterLabels() {
    const show = document.getElementById('toggle-perimeter-labels').checked;
    if (show && window.perimeterLabelsLayer) {
        map.addLayer(window.perimeterLabelsLayer);
    } else if (window.perimeterLabelsLayer) {
        map.removeLayer(window.perimeterLabelsLayer);
    }
}

function toggleRailway() {
    const show = document.getElementById('toggle-railway').checked;
    if (show && window.railwayLayer) {
        map.addLayer(window.railwayLayer);
    } else if (window.railwayLayer) {
        map.removeLayer(window.railwayLayer);
    }
}


// --- Initialization ---
function initApp() {
    initMap();
    renderPerimeterSides();

    renderRailway();
    renderFerrocarrilExt();
    renderFerrocarrilExtLabels();
    renderServidumbreLabels();
    renderServidumbreLabels();

    // 2. Initial render of ports and mines
    renderPorts(ports);
    if (typeof MINING_PROJECTS !== 'undefined') {
        renderMines(MINING_PROJECTS);
    }
    renderTerrain();
    renderInfraRoads();
    renderExtraRoads();
    renderSanFernando();
    renderAmortiguamiento();
    renderSunarp1();
    renderSunarp2();
    renderSunarp3();

    // 3. Synchronize initial state with checkboxes
    togglePortLabels();
    toggleLandLabels();
    togglePerimeter();
    togglePerimeterLabels();
    toggleRailway();
    toggleFerrocarrilExt();
    toggleFerrocarrilExtLabels();
    toggleServidumbreLabels();
    toggleShougang();
    toggleMarcobre();
    toggleGeneracion();
    toggleSouthCorridor();
    toggleAlternativeRoute();
    toggleInfraRoads();
    toggleExtraRoads();
    toggleSanFernando();
    toggleAmortiguamiento();
    toggleAreaAcuatica();
    toggleAreaRiberena();
    toggleServidumbre();
    toggleSunarp1();
    toggleSunarp2();
    toggleSunarp3();
    toggleTracking();
    toggleTrackingLabels();
    toggleCalculators();
}

function toggleCalculators() {
    const show = document.getElementById('toggle-calculators').checked;
    const p1 = document.getElementById('logistics-panel');
    const p2 = document.getElementById('fuel-logistics-panel');
    if (p1) p1.style.display = show ? 'block' : 'none';
    if (p2) p2.style.display = show ? 'block' : 'none';
}

function renderRailway() {
    if (typeof RAILWAY_MARCONA_ANDAHUAYLAS !== 'undefined') {
        window.railwayLayer = L.layerGroup(); // Removed .addTo(map)

        // 1. Thick Yellow Background Line
        L.geoJSON(RAILWAY_MARCONA_ANDAHUAYLAS, {
            style: {
                color: '#ffeb3b', // Yellow
                weight: 6,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round'
            }
        }).addTo(window.railwayLayer);

        // 2. Dotted Inner Line (Black/Dark)
        L.geoJSON(RAILWAY_MARCONA_ANDAHUAYLAS, {
            style: {
                color: '#000000', // Black
                weight: 2,
                opacity: 0.8,
                dashArray: '2, 8', // Dots
                lineCap: 'round',
                lineJoin: 'round'
            }
        }).addTo(window.railwayLayer).eachLayer(function (layer) {
            layer.bindTooltip("Ferrocarril Marcona - Andahuaylas", {
                permanent: false,
                direction: "center",
                className: "road-label-container"
            });
        });
    }
}

function renderFerrocarrilExt() {
    if (typeof FERROCARRIL_EXT_GEOJSON !== 'undefined') {
        window.ferrocarrilExtLayer = L.layerGroup();

        // 1. Thick Purple Background Line
        L.geoJSON(FERROCARRIL_EXT_GEOJSON, {
            style: {
                color: '#9c27b0', // Purple
                weight: 6,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round'
            }
        }).addTo(window.ferrocarrilExtLayer);

        // 2. Dotted Inner Line (Black/Dark)
        L.geoJSON(FERROCARRIL_EXT_GEOJSON, {
            style: {
                color: '#000000', // Black
                weight: 2,
                opacity: 0.8,
                dashArray: '2, 8', // Dots
                lineCap: 'round',
                lineJoin: 'round'
            }
        }).addTo(window.ferrocarrilExtLayer).eachLayer(function (layer) {
            layer.bindTooltip("Ferrocarril Extensión", {
                permanent: false,
                direction: "center",
                className: "road-label-container"
            });
        });
    }
}

function toggleFerrocarrilExt() {
    const show = document.getElementById('toggle-ferrocarril-ext').checked;
    if (show && window.ferrocarrilExtLayer) {
        map.addLayer(window.ferrocarrilExtLayer);
    } else if (window.ferrocarrilExtLayer) {
        map.removeLayer(window.ferrocarrilExtLayer);
    }
}

function renderFerrocarrilExtLabels() {
    if (typeof FERROCARRIL_EXT_LABELS_GEOJSON !== 'undefined') {
        window.ferrocarrilExtLabelsLayer = L.geoJSON(FERROCARRIL_EXT_LABELS_GEOJSON, {
            pointToLayer: function (feature, latlng) {
                if (feature.properties && feature.properties.label) {
                    const elevation = feature.properties.elevation ? Math.round(feature.properties.elevation) : 0;
                    const kmLabel = feature.properties.label.replace(' km', ''); // "0.5"
                    // Match Coastal Route Style exactly
                    const marker = L.circleMarker(latlng, {
                        radius: 5,
                        color: '#9c27b0', // Purple
                        fillColor: '#fff',
                        fillOpacity: 1,
                        weight: 2
                    });

                    marker.bindTooltip(`KM ${kmLabel}<br>Alt: ${elevation}m`, {
                        permanent: true,
                        direction: 'top',
                        className: 'elev-label-container',
                        offset: [0, -10]
                    });

                    return marker;
                }
                return null;
            }
        });
        // Note: Not adding to map by default, controlled by checkbox
    }
}

function toggleFerrocarrilExtLabels() {
    const show = document.getElementById('toggle-ferrocarril-ext-labels').checked;
    if (show && window.ferrocarrilExtLabelsLayer) {
        map.addLayer(window.ferrocarrilExtLabelsLayer);
    } else if (window.ferrocarrilExtLabelsLayer) {
        map.removeLayer(window.ferrocarrilExtLabelsLayer);
    }
}


function renderShougangVertices() {
    if (window.SHOUGANG_RAW_COORDS) {
        window.SHOUGANG_RAW_COORDS.forEach((coord, index) => {
            // Numbers 1-26
            L.circleMarker(coord, {
                radius: 4,
                color: "#ffeb3b",
                fillColor: "#000",
                fillOpacity: 1,
                weight: 1
            }).bindTooltip(`${index + 1}`, { // Removed .addTo(map)
                permanent: true,
                direction: 'center',
                className: 'vertex-label'
            });
        });
    }
}

let sanFernandoLayer = null;

function renderSanFernando() {
    if (typeof SAN_FERNANDO_GEOJSON !== 'undefined' && !sanFernandoLayer) {
        sanFernandoLayer = L.geoJSON(SAN_FERNANDO_GEOJSON, {
            style: {
                color: '#4caf50', // Green
                weight: 2,
                opacity: 0.9,
                fillColor: '#4caf50',
                fillOpacity: 0.2,
                dashArray: '5, 5'
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.anp_nomb) {
                    layer.bindTooltip(`Reserva Nacional ${feature.properties.anp_nomb}`, {
                        permanent: true,
                        direction: "center",
                        className: "road-label-container"
                    });
                }
            }
        });
    }
}

function toggleSanFernando() {
    const el = document.getElementById('toggle-san-fernando');
    if (!el) return;
    const show = el.checked;

    if (!sanFernandoLayer) renderSanFernando();

    if (show) {
        if (sanFernandoLayer) map.addLayer(sanFernandoLayer);
    } else {
        if (sanFernandoLayer) map.removeLayer(sanFernandoLayer);
    }
}

let amortiguamientoLayer = null;

function renderAmortiguamiento() {
    if (typeof AMORTIGUAMIENTO_GEOJSON !== 'undefined' && !amortiguamientoLayer) {
        amortiguamientoLayer = L.geoJSON(AMORTIGUAMIENTO_GEOJSON, {
            style: {
                color: '#2e7d32', // Dark Green
                weight: 2,
                opacity: 0.8,
                fillColor: '#2e7d32',
                fillOpacity: 0.1,
                dashArray: '5, 10'
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.name) {
                    layer.bindTooltip(feature.properties.name, {
                        permanent: false,
                        direction: "center",
                        className: "road-label-container"
                    });
                }
            }
        });
    }
}

function toggleAmortiguamiento() {
    const el = document.getElementById('toggle-amortiguamiento');
    if (!el) return;
    const show = el.checked;

    if (!amortiguamientoLayer) renderAmortiguamiento();

    if (show) {
        if (amortiguamientoLayer) map.addLayer(amortiguamientoLayer);
    } else {
        if (amortiguamientoLayer) map.removeLayer(amortiguamientoLayer);
    }
}

// --- DICAPI Layers ---

let areaAcuaticaLayer = null;
let areaRiberenaLayer = null;

// Helper to add vertex labels
function addVertexLabels(layer, layerName, map) {
    if (!layer || !layer.getLayers || layer.getLayers().length === 0) return;

    // Get the first feature (polygon)
    const poly = layer.getLayers()[0];
    if (!poly || !poly.feature) return;

    const coords = poly.feature.geometry.coordinates[0];
    // Definitions based on convert_dicapi.py
    let labels = [];
    if (layerName === 'acuatica') {
        // A, B, C, D, K, E, F, G, H, I, J
        labels = ['A', 'B', 'C', 'D', 'K', 'E', 'F', 'G', 'H', 'I', 'J'];
    } else if (layerName === 'riberena') {
        // J, I, H, G, F, E, K, L, M, N, O, P
        labels = ['J', 'I', 'H', 'G', 'F', 'E', 'K', 'L', 'M', 'N', 'O', 'P'];
    }

    coords.forEach((coord, index) => {
        if (index >= labels.length) return; // Skip closing vertex or extras
        const lat = coord[1];
        const lon = coord[0];
        const label = labels[index];

        const icon = L.divIcon({
            className: 'vertex-label-icon',
            html: `<div style="background:white; border:1px solid black; padding:0px 3px; font-size:10px; font-weight:bold; border-radius:3px;">${label}</div>`
        });

        // Store marker in a custom property on the layer object to remove it later
        if (!layer.vertexMarkers) layer.vertexMarkers = [];
        const marker = L.marker([lat, lon], { icon: icon }).addTo(map);
        layer.vertexMarkers.push(marker);
    });
}

function removeVertexLabels(layer, map) {
    if (layer && layer.vertexMarkers) {
        layer.vertexMarkers.forEach(m => map.removeLayer(m));
        layer.vertexMarkers = [];
    }
}

function renderAreaAcuatica() {
    if (typeof AREA_ACUATICA_GEOJSON !== 'undefined' && !areaAcuaticaLayer) {
        areaAcuaticaLayer = L.geoJSON(AREA_ACUATICA_GEOJSON, {
            style: {
                color: '#00bfff', // Deep Sky Blue
                weight: 2,
                opacity: 0.8,
                fillColor: '#00bfff',
                fillOpacity: 0.3, // Transparent Blue
                dashArray: '5, 5'
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.name) {
                    layer.bindTooltip(feature.properties.name, {
                        permanent: true,
                        direction: "center",
                        className: "road-label-container"
                    });
                }
            }
        });
    }
}

function toggleAreaAcuatica() {
    const el = document.getElementById('toggle-area-acuatica');
    if (!el) return;
    const show = el.checked;

    if (!areaAcuaticaLayer) renderAreaAcuatica();

    if (show) {
        if (areaAcuaticaLayer) {
            map.addLayer(areaAcuaticaLayer);
            // addVertexLabels(areaAcuaticaLayer, 'acuatica', map);
        }
    } else {
        if (areaAcuaticaLayer) {
            map.removeLayer(areaAcuaticaLayer);
            // removeVertexLabels(areaAcuaticaLayer, map);
        }
    }
}

function renderAreaRiberena() {
    if (typeof AREA_RIBERENA_GEOJSON !== 'undefined' && !areaRiberenaLayer) {
        areaRiberenaLayer = L.geoJSON(AREA_RIBERENA_GEOJSON, {
            style: {
                color: '#ff4500', // Orange Red
                weight: 2,
                opacity: 0.8,
                fillColor: '#ff4500',
                fillOpacity: 0.3, // Transparent Red/Orange
                dashArray: '5, 5'
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.name) {
                    layer.bindTooltip(feature.properties.name, {
                        permanent: true,
                        direction: "center",
                        className: "road-label-container"
                    });
                }
            }
        });
    }
}

function toggleAreaRiberena() {
    const el = document.getElementById('toggle-area-riberena');
    if (!el) return;
    const show = el.checked;

    if (!areaRiberenaLayer) renderAreaRiberena();

    if (show) {
        if (areaRiberenaLayer) {
            map.addLayer(areaRiberenaLayer);
            // addVertexLabels(areaRiberenaLayer, 'riberena', map);
        }
    } else {
        if (areaRiberenaLayer) {
            map.removeLayer(areaRiberenaLayer);
            // removeVertexLabels(areaRiberenaLayer, map);
        }
    }
}

// function renderOptimizedRoute() { ... } removed

function renderShougangPolygon() {
    if (typeof SHOUGANG_POLYGON_FEATURE !== 'undefined') {
        L.geoJSON(SHOUGANG_POLYGON_FEATURE, {
            style: {
                color: '#ffd700', // Gold/Yellow
                weight: 3,
                opacity: 0.8,
                fillColor: '#ffd700',
                fillOpacity: 0.15,
                dashArray: '5, 5'
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.name) {
                    layer.bindTooltip(feature.properties.name, {
                        permanent: true,
                        direction: "center",
                        className: "road-label-container"
                    });
                }
            }
        }); // Removed .addTo(map)
    }
}

let jzLayer = null;

function renderJZ() {
    if (typeof JZ_GEOJSON !== 'undefined' && !jzLayer) {
        jzLayer = L.geoJSON(JZ_GEOJSON, {
            style: {
                color: '#9c27b0', // Purple
                weight: 2,
                opacity: 0.9,
                fillColor: '#9c27b0',
                fillOpacity: 0.2,
                dashArray: '5, 5'
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.name) {
                    layer.bindTooltip(feature.properties.name, {
                        permanent: true,
                        direction: "center",
                        className: "road-label-container"
                    });
                }
            }
        });
    }
}

function toggleJZ() {
    const el = document.getElementById('toggle-jz');
    if (!el) return;
    const show = el.checked;

    if (!jzLayer) renderJZ();

    if (show) {
        if (jzLayer) map.addLayer(jzLayer);
    } else {
        if (jzLayer) map.removeLayer(jzLayer);
    }
}

let servidumbreLayer = null;

function renderServidumbre() {
    if (typeof SERVIDUMBRE_GEOJSON !== 'undefined' && !servidumbreLayer) {
        servidumbreLayer = L.layerGroup();

        // 1. Polygon Layer
        const polyLayer = L.geoJSON(SERVIDUMBRE_GEOJSON, {
            style: {
                color: '#ff0000', // Rojo
                weight: 3,
                opacity: 0.9,
                fillColor: '#ff0000',
                fillOpacity: 0.2,
                dashArray: '5, 5'
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.name) {
                    layer.bindTooltip("Área de Servidumbre", {
                        permanent: false,
                        direction: "center",
                        className: "road-label-container"
                    });
                }
            }
        });
        polyLayer.addTo(servidumbreLayer);

        // 2. Vertex Labels (Removed as requested by user)
        /* 
        SERVIDUMBRE_GEOJSON.features.forEach((feature) => {
            if (feature.properties && feature.properties.type === "vertex") {
                const label = feature.properties.vertice;
                const coord = feature.geometry.coordinates;
                
                const marker = L.marker([coord[1], coord[0]], {
                    icon: L.divIcon({
                        className: 'vertex-label-icon',
                        html: `<div style="background:#ff0000; color:white; border:1px solid white; padding:1px 4px; font-size:10px; font-weight:bold; border-radius:50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${label}</div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                });
                marker.bindTooltip(`Vértice ${label}`, { direction: 'top' });
                marker.addTo(servidumbreLayer);
            }
        });
        */
    }
}

function toggleServidumbre() {
    const el = document.getElementById('toggle-servidumbre');
    if (!el) return;
    const show = el.checked;

    if (!servidumbreLayer) renderServidumbre();

    if (show) {
        if (servidumbreLayer) map.addLayer(servidumbreLayer);
    } else {
        if (servidumbreLayer) map.removeLayer(servidumbreLayer);
    }
}

let extraRoadsLayer = null;

function renderExtraRoads() {
    if (!extraRoadsLayer) {
        extraRoadsLayer = L.layerGroup();
    }

    // PE-30B
    if (typeof ROAD_PE30B !== 'undefined') {
        const feature = ROAD_PE30B;
        const layer = L.geoJSON(feature, {
            style: {
                color: '#e91e63',
                weight: 5,
                opacity: 0.9,
                dashArray: '10, 5'
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties) {
                    const kms = feature.properties.distance_km.toFixed(1);
                    layer.bindTooltip(`<div class="road-tag" style="background:#fff; border-color:#e91e63;">${feature.properties.id}</div>`, {
                        permanent: true,
                        direction: 'center',
                        className: 'road-label-container'
                    });

                    layer.bindPopup(`
                        <b>${feature.properties.name}</b><br>
                        ID: ${feature.properties.id}<br>
                        Longitud: ${kms} km
                    `, { className: 'custom-popup-dark' });
                }
            }
        });
        extraRoadsLayer.addLayer(layer);
    }

    // PE-30A
    if (typeof ROAD_PE30A !== 'undefined') {
        const feature = ROAD_PE30A;
        const layer = L.geoJSON(feature, {
            style: { color: '#e91e63', weight: 5, opacity: 0.9, dashArray: '10, 5' },
            onEachFeature: function (feature, layer) {
                if (feature.properties) {
                    const kms = feature.properties.distance_km.toFixed(1);
                    layer.bindTooltip(`<div class="road-tag" style="background:#fff; border-color:#e91e63;">${feature.properties.id}</div>`, {
                        permanent: true, direction: 'center', className: 'road-label-container'
                    });
                    layer.bindPopup(`<b>${feature.properties.name}</b><br>ID: ${feature.properties.id}<br>Longitud: ${kms} km`, { className: 'custom-popup-dark' });
                }
            }
        });
        extraRoadsLayer.addLayer(layer);
    }
}

function toggleExtraRoads() {
    const el = document.getElementById('toggle-extra-roads');
    if (!el) return;
    const show = el.checked;

    if (!extraRoadsLayer) renderExtraRoads();

    if (show) {
        if (extraRoadsLayer) map.addLayer(extraRoadsLayer);
    } else {
        if (extraRoadsLayer) map.removeLayer(extraRoadsLayer);
    }
}

// --- Mineral Logistics Calculator Logic ---
function initCalculator() {
    const inputs = ['input-hierro', 'input-chancas', 'input-trapiche', 'input-capacity'];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', calculateLogistics);

            // Format handling for text inputs (Hierro, Chancas, Trapiche)
            if (id !== 'input-capacity') {
                el.addEventListener('focus', () => {
                    let val = el.value.replace(/,/g, '');
                    el.value = val;
                });
                el.addEventListener('blur', () => {
                    let val = parseFloat(el.value.replace(/,/g, ''));
                    if (!isNaN(val)) {
                        el.value = val.toLocaleString('en-US');
                    }
                });
            }
        }
    });
}

function calculateLogistics() {
    // 1. Get Volumes (Million MT/Year) - Sanitized for commas
    const v1 = parseFloat(document.getElementById('input-hierro').value.replace(/,/g, '')) || 0;
    const v2 = parseFloat(document.getElementById('input-chancas').value.replace(/,/g, '')) || 0;
    const v3 = parseFloat(document.getElementById('input-trapiche').value.replace(/,/g, '')) || 0;

    const totalVolMM = v1 + v2 + v3;

    // 2. Constants
    const TRUCK_CAPACITY = 30; // Tonnes
    const DAYS = 365;
    const BASELINE_TRAFFIC_HEAVY = 750; // Current Heavy Traffic (Bidirectional)

    // Dynamic Max Capacity User Input
    const valCap = parseFloat(document.getElementById('input-capacity').value);
    const MAX_HEAVY_CAPACITY = isNaN(valCap) ? 750 : valCap;

    // 3. Calculate Trucks (Loaded Downbound)
    // Input is in Tonnes (TM/Year) as user types full numbers (e.g. 3000000)
    const totalTonnes = totalVolMM;
    const trucksPerYear = totalTonnes / TRUCK_CAPACITY;
    const trucksPerDay = Math.round(trucksPerYear / DAYS); // One way (Loaded)

    // 4. Calculate Total Events (Round Trip: Loaded Down + Empty Up)
    const dailyEvents = trucksPerDay * 2;

    // 5. Saturation Analysis
    // Total Flow = Baseline (Bidirectional) + New (Bidirectional)
    const totalTraffic = BASELINE_TRAFFIC_HEAVY + dailyEvents;

    const basePct = (BASELINE_TRAFFIC_HEAVY / MAX_HEAVY_CAPACITY) * 100;
    const newPct = (dailyEvents / MAX_HEAVY_CAPACITY) * 100;
    const totalPct = basePct + newPct;

    // 6. Update UI
    document.getElementById('res-trucks').innerText = `${trucksPerDay.toLocaleString()} 🚛/día`;
    document.getElementById('res-events').innerText = `+${dailyEvents.toLocaleString()} viajes/día`;

    // Update Meter (Stacked)
    const barBase = document.getElementById('bar-base');
    const barNew = document.getElementById('bar-new');
    const labelPct = document.getElementById('res-saturation');

    // Widths
    barBase.style.width = `${Math.min(basePct, 100)}%`;
    // New bar takes up remaining space or overflows
    // To visualize overflow, we might cap the width sum at 100% for the container, 
    // but here let's just let it fill.
    if (totalPct <= 100) {
        barNew.style.width = `${newPct}%`;
    } else {
        // If total > 100, Base takes its share, New takes the rest up to 100 visually
        barNew.style.width = `${100 - Math.min(basePct, 100)}%`;
    }

    // Colors & Status
    let status = 'Fluido';
    let newColor = '#4caf50'; // Green for new traffic impact
    let roadColor = '#e91e63'; // Default Pink

    // Logic: If Project itself > 50% of capacity, it's getting heavy.
    // If Project + Base > 100%... well Base is already 100% often.
    // Let's color based on TOTAL impact as before for warning, but Text is Project specific.

    if (totalPct > 60) {
        status = 'Moderado';
        newColor = '#ffeb3b';
        roadColor = '#ff9800'; // Orange
    }
    if (totalPct > 85) {
        status = 'Denso';
        newColor = '#ff9800';
        roadColor = '#ff5722'; // Deep Orange
    }
    if (totalPct > 100) {
        status = 'COLAPSO (Saturación Total)';
        newColor = '#f44336';
        roadColor = '#f44336'; // Red
    }

    barNew.style.backgroundColor = newColor;

    // User Request: "Volume of trucks is % of the saturation of 750"
    // So we display newPct.
    labelPct.innerText = `${Math.round(newPct)}% de la Capacidad`;

    // 7. Update Map (Route 30A)
    if (window.layerPE30A) {
        window.layerPE30A.setStyle({
            color: roadColor,
            weight: totalPct > 100 ? 8 : 5,
            dashArray: totalPct > 100 ? null : '10, 5',
            opacity: totalPct > 100 ? 1 : 0.8
        });

        // Dynamic Popup update
        window.layerPE30A.eachLayer(layer => {
            layer.setPopupContent(`
                <div style="font-family:'Rajdhani',sans-serif;">
                    <strong style="color:${roadColor}; font-size:1.1em;">Ruta 30A (Corredor Minero)</strong><br>
                    <span style="font-size:0.9em">Capacidad Pesada Est: ~${MAX_HEAVY_CAPACITY} veh/día</span>
                    <hr style="margin:4px 0; border-color:#555;">
                    Tráfico Base: <b>${BASELINE_TRAFFIC_HEAVY}</b> (Bidireccional)<br>
                    + Proyecto: <b style="color:${newColor}">+${dailyEvents}</b> (I/V)<br>
                    <hr style="margin:4px 0; border-color:#555;">
                    Total: <b style="font-size:1.2em">${totalTraffic.toLocaleString()}</b> veh/día
                </div>
             `);
        });
    }
}

// Initialize Calculator on Load
document.addEventListener('DOMContentLoaded', initCalculator);

let infraRoadsLayer = null;

function renderInfraRoads() {
    if (typeof INFRA_ROADS !== 'undefined' && !infraRoadsLayer) {
        infraRoadsLayer = L.geoJSON(INFRA_ROADS, {
            style: function (feature) {
                return {
                    color: feature.properties.color,
                    weight: 6, // Thicker for main roads
                    opacity: 0.9,
                    lineCap: 'butt'
                };
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties) {
                    const kms = feature.properties.distance_km.toFixed(1);
                    // Use Name or ID for the tag
                    const labelText = feature.properties.name || feature.properties.id;

                    layer.bindTooltip(`<div class="road-tag" style="background:rgba(255,255,255,0.9); border-color:#555;">${labelText}</div>`, {
                        permanent: true,
                        direction: 'center',
                        className: 'road-label-container'
                    });

                    // Detailed Popup
                    layer.bindPopup(`
                        <b>${feature.properties.name}</b><br>
                        ID: ${feature.properties.id}<br>
                        Longitud: ${kms} km
                    `, { className: 'custom-popup-dark' });
                }
            }
        });
    }
}

function toggleInfraRoads() {
    const el = document.getElementById('toggle-infra-roads');
    if (!el) return;
    const show = el.checked;

    if (!infraRoadsLayer) renderInfraRoads();

    if (show) {
        if (infraRoadsLayer) map.addLayer(infraRoadsLayer);
    } else {
        if (infraRoadsLayer) map.removeLayer(infraRoadsLayer);
    }
}

let southCorridorLayer = null;

function renderSouthCorridor() {
    if (typeof SOUTH_CORRIDOR !== 'undefined' && !southCorridorLayer) {
        southCorridorLayer = L.geoJSON(SOUTH_CORRIDOR, {
            style: {
                color: '#ff9800', // Orange/Gold for Corridor
                weight: 4,
                opacity: 0.6
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties) {
                    const kms = feature.properties.distance_km.toFixed(1);
                    const hrs = feature.properties.duration_h.toFixed(1);
                    const type = feature.properties.road_type || 'Vía Estandar';
                    const cap = feature.properties.capacity || 'Desconocida';

                    layer.bindTooltip(`<div class="road-tag">${type}</div>`, {
                        permanent: true,
                        direction: 'center',
                        className: 'road-label-container'
                    });

                    let styleColor = '#ff9800';
                    if (cap === 'Alta') styleColor = '#00e676';
                    if (cap === 'Media') styleColor = '#ffea00';

                    layer.bindPopup(`
                        <div style="text-align:left;">
                            <strong style="font-size:1.1em; color:#00f2ea;">${feature.properties.mine}</strong><br>
                            <span style="opacity:0.8;">Distancia:</span> ${kms} km<br>
                            <span style="opacity:0.8;">Tiempo:</span> ${hrs} hrs<br>
                            <hr style="margin:4px 0; border-color:rgba(255,255,255,0.2);">
                            <span style="color:${styleColor};">🛣️ ${type}</span><br>
                            <span style="font-size:0.9em;">Capacidad: <b>${cap}</b></span>
                        </div>
                    `, { className: 'custom-popup-dark' });
                }
            }
        });
    }
}

function toggleSouthCorridor() {
    const show = document.getElementById('toggle-south-corridor').checked;

    if (!southCorridorLayer) {
        renderSouthCorridor();
    }

    if (show && southCorridorLayer) {
        map.addLayer(southCorridorLayer);
    } else if (southCorridorLayer) {
        map.removeLayer(southCorridorLayer);
    }
}

function renderTerrain() {
    if (typeof TERRAIN_ROADS !== 'undefined') {
        L.geoJSON(TERRAIN_ROADS, {
            filter: function (feature) {
                // Exclude 'perimetro' as it is handled separately
                return feature.properties.layer !== 'perimetro';
            },
            style: {
                color: '#00d2ff', // Cyan/Blue for visibility
                weight: 3,
                opacity: 0.8,
                dashArray: '5, 5' // Dashed to distinguish from main roads
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.layer) {
                    // Permanent Tag for Terrain/CAD Roads
                    layer.bindTooltip(`<div class="road-tag" style="background:rgba(255,255,255,0.7); font-size:10px;">${feature.properties.layer}</div>`, {
                        permanent: true,
                        direction: 'center',
                        className: 'road-label-container'
                    });
                }
            }
        }); // Removed .addTo(map)
    }
}


// --- Map Logic ---
function initMap() {
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
    }).setView(CONFIG.initialCenter, CONFIG.initialZoom);

    L.control.attribution({ prefix: false }).addAttribution('APN Data Scraper').addTo(map);

    // Initial Base Layer (Standard)
    setMapType('standard');

    // Load GeoJSON for Peru Departments
    if (typeof PERU_GEOJSON !== 'undefined') {
        const getColor = (d) => {
            // Simple hash for distinct colors
            let hash = 0;
            for (let i = 0; i < d.length; i++) {
                hash = d.charCodeAt(i) + ((hash << 5) - hash);
            }
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            return '#' + '00000'.substring(0, 6 - c.length) + c;
        };

        layers.dept = L.geoJSON(PERU_GEOJSON, {
            style: function (feature) {
                return {
                    color: '#ffffff',     // White borders
                    weight: 1,
                    opacity: 0.3,
                    fillColor: getColor(feature.properties.NOMBDEP),
                    fillOpacity: 0.15     // High transparency
                };
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.NOMBDEP) {
                    layer.bindTooltip(feature.properties.NOMBDEP, {
                        className: 'dept-label-permanent',
                        direction: 'center',
                        permanent: true,   // Always visible
                        opacity: 0.7
                    });
                }
                layer.on({
                    mouseover: (e) => {
                        e.target.setStyle({ weight: 2, fillOpacity: 0.35 });
                    },
                    mouseout: (e) => {
                        e.target.setStyle({ weight: 1, fillOpacity: 0.15 });
                    }
                });
            }
        }).addTo(map);
    }
}

function setMapType(type) {
    currentMapType = type;

    // Remove existing base layer if any
    if (layers.base) {
        map.removeLayer(layers.base);
    }

    let tileUrl = CONFIG.tiles.standard;
    let options = { opacity: 1, subdomains: 'abcd' };

    if (type === 'satellite') {
        tileUrl = CONFIG.tiles.satellite;
        options = {
            opacity: 1,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            maxZoom: 20
        };
    }

    layers.base = L.tileLayer(tileUrl, options).addTo(map);
    layers.base.bringToBack(); // Ensure it stays behind vectors

    // Update Buttons
    if (document.getElementById('btn-map-standard')) { // Check if exists
        document.getElementById('btn-map-standard').classList.remove('active');
        document.getElementById('btn-map-satellite').classList.remove('active');
        document.getElementById(`btn-map-${type}`).classList.add('active');
    }
}

// --- Markers ---
function createCustomIcon(port) {
    // Different style if it has Tankers?
    const isTankerHub = port.tankers > 0;
    const markerClass = isTankerHub ? 'marker-pin tanker-mode' : 'marker-pin';

    return L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker-ring"></div><div class="${markerClass}"></div>`,
        iconSize: [24, 24], // Reduced from [30, 30]
        iconAnchor: [12, 12]
    });
}

// New: Info Boat Icon
// New: Info Boat Icon
// New: Info Boat Icon
function createInfoBoatIcon(port) {
    // 1. Parse DWT
    let dwt = 35000; // default
    if (typeof port.max_dwt === 'string') {
        dwt = parseInt(port.max_dwt.replace(/k/i, '000'), 10) || 35000;
        if (port.max_dwt.toLowerCase().includes('k') && dwt < 1000) dwt *= 1000;
    }

    // 2. Scale Size
    // Range: 35k (Talara) -> 200k (San Nicolas)
    // Size: 24px -> 60px
    const minDwt = 35000;
    const maxDwt = 200000;
    const minSize = 24;
    const maxSize = 60; // Slightly reduced max size for compact look

    const pct = Math.max(0, Math.min(1, (dwt - minDwt) / (maxDwt - minDwt)));
    const fontSize = Math.round(minSize + (pct * (maxSize - minSize)));

    // 3. Estimate Width
    // Boat width = fontSize
    // Draft section "Calado 15m" approx 50px
    // DWT section "Max 200k" approx 60px
    // Padding/Gaps approx 30px
    const boatWidth = fontSize;
    const contentWidth = 140;
    const totalWidth = boatWidth + contentWidth;
    const anchorX = totalWidth + 10;

    return L.divIcon({
        className: 'boat-info-wrapper',
        html: `
            <div class="boat-visual-container compact-row">
                <div class="boat-shape" style="font-size: ${fontSize}px;">🚢</div>
                <div class="info-group">
                    <span class="lbl-compact">Calado</span>
                    <span class="val-compact">${port.draft}m</span>
                </div>
                <div class="divider">|</div>
                <div class="info-group">
                    <span class="lbl-compact">Max</span>
                    <span class="val-compact">${port.max_dwt}</span>
                </div>
            </div>
        `,
        iconSize: [totalWidth, 40],
        iconAnchor: [anchorX, 20]
    });
}

function renderPorts(portsData) {
    if (!window.portsLayer) window.portsLayer = L.layerGroup().addTo(map);
    window.portsLayer.clearLayers();
    markers = [];

    portsData.forEach(port => {
        // 1. Info Boat Marker (Define first to use in click handler)
        const boatMarker = L.marker(port.coords, {
            icon: createInfoBoatIcon(port),
            zIndexOffset: 100, // Float above
            portCode: port.code
        }).addTo(window.portsLayer);

        // 2. Main Port Marker
        const marker = L.marker(port.coords, {
            icon: createCustomIcon(port),
            portCode: port.code
        }).addTo(window.portsLayer);

        // Tooltip content
        let label = `${port.name}`;
        if (port.tankers > 0) label += ` <span style="color:#ff4444">(${port.tankers} 🛢️)</span>`;
        else if (port.ships > 0) label += ` (${port.ships})`;

        marker.bindTooltip(label, {
            permanent: true,
            direction: 'right', // Changed from left to right to make room for boat
            className: 'port-label-container',
            offset: [15, 0],
            opacity: 1
        });

        const clickHandler = () => {
            // Toggle Boat Card Visibility
            if (map.hasLayer(boatMarker)) {
                map.removeLayer(boatMarker);
            } else {
                map.addLayer(boatMarker);
            }

            // Normal Selection
            selectPort(port);
            map.flyTo(port.coords, 10, { duration: 1.5 });
        };

        marker.on('click', clickHandler);
        boatMarker.on('click', clickHandler);

        markers.push(marker);
        markers.push(boatMarker);
    });
}

// --- Mines Logic ---
function createMineIcon(mine) {
    const isOperating = mine.state === "Operación";
    const color = isOperating ? '#4caf50' : '#ff9800'; // Green for Op, Orange for Project

    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px ${color}; border: 2px solid white;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

function renderMines(mines) {
    if (!window.minesLayer) window.minesLayer = L.layerGroup().addTo(map);
    window.minesLayer.clearLayers();
    mines.forEach(mine => {
        const marker = L.marker(mine.coords, {
            icon: createMineIcon(mine)
        }).addTo(window.minesLayer);

        // Mine Label with Leader Line Effect
        marker.bindTooltip(`<div class="mine-label-content">${mine.name}</div>`, {
            permanent: true,
            direction: 'right', // Default right
            className: 'mine-label-leader',
            offset: [10, -15], // Up and right
            opacity: 1
        });

        marker.on('click', () => {
            showMineDetails(mine);
        });
    });
}

// Haversine Distance
function getDistance(coord1, coord2) {
    const R = 6371; // km
    const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
    const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
}

function showMineDetails(mine) {
    const sidebar = document.getElementById('port-details');
    const title = document.getElementById('detail-title');
    const shipList = document.getElementById('ship-list');

    // Show Sidebar
    sidebar.classList.remove('hidden');
    title.textContent = `${mine.name} (${mine.owner})`;

    // Hide stats cards for mines (or repurpose them)
    document.querySelector('.stats-grid').style.display = 'none';

    // Clear Valid Routes
    clearRoutes();

    // Render Initial State (Loading)
    shipList.innerHTML = `
        <h3 style="margin-bottom:5px;">Rutas Logísticas</h3>
        <p style="font-size:0.9em; color:#ccc; margin-bottom:15px;">Calculando rutas viales...</p>
        <div id="route-results"></div>
        <hr>
        <p style="font-size: 0.9em; opacity: 0.7; margin-top: 10px;">
            Estado: ${mine.state}<br>
            Mineral: ${mine.type}<br>
            Empresa: ${mine.owner}
        </p>
    `;

    // Calculate Distances to ALL ports and sort
    const allPortsDist = Object.keys(PORT_CONFIG).map(key => {
        const p = PORT_CONFIG[key];
        const dist = parseFloat(getDistance(mine.coords, p.coords));
        return { ...p, dist: dist };
    });

    // Sort by distance ascending
    allPortsDist.sort((a, b) => a.dist - b.dist);

    // Pick top 3
    const top3Ports = allPortsDist.slice(0, 3);

    // Map to route format
    // Colors: Closest (Cyan), 2nd (Green), 3rd (Orange)
    const routeColors = ['#00f2ea', '#27ae60', '#ff9800'];

    const portsToRoute = top3Ports.map((p, index) => ({
        name: p.name,
        coords: p.coords,
        color: routeColors[index] || '#ccc',
        id: p.id
    }));

    calculateAndDrawRoutes(mine.coords, portsToRoute);

    // Fly to mine
    map.flyTo(mine.coords, 9, { duration: 1.5 });
}

// --- Routing Logic (OSRM) ---
let activeRoutes = [];

function clearRoutes() {
    activeRoutes.forEach(layer => map.removeLayer(layer));
    activeRoutes = [];
}

async function calculateAndDrawRoutes(startCoords, destinations) {
    const resultsContainer = document.getElementById('route-results');
    resultsContainer.innerHTML = '';

    // OSRM Public Demo Server (Note: Rate limits apply, use with caution in prod)
    const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving/';

    for (const dest of destinations) {
        // OSRM expects Lon,Lat
        const start = `${startCoords[1]},${startCoords[0]}`;
        const end = `${dest.coords[1]},${dest.coords[0]}`;
        const url = `${OSRM_URL}${start};${end}?overview=full&geometries=geojson`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes.length > 0) {
                const route = data.routes[0];
                const distanceKm = (route.distance / 1000).toFixed(1);
                const durationH = (route.duration / 3600).toFixed(1); // Hours

                // Draw Polyline
                const routeLayer = L.geoJSON(route.geometry, {
                    style: {
                        color: dest.color,
                        weight: 4,
                        opacity: 0.7,
                        dashArray: '5, 10' // Dashed to look like a proposed route
                    }
                }).addTo(map);

                activeRoutes.push(routeLayer);

                // Add to List
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

                // If San Nicolas, highlight it
                if (dest.id === 'sannicolas') {
                    item.style.backgroundColor = 'rgba(0, 242, 234, 0.1)';
                    item.style.borderRadius = '0 5px 5px 0';
                    item.style.padding = '5px 5px 5px 10px';
                }

            } else {
                throw new Error('No route');
            }
        } catch (e) {
            console.error('Routing error:', e);
            resultsContainer.innerHTML += `<div style="color:${dest.color}; opacity:0.5; margin-bottom:5px;">⚠️ ${dest.name}: Ruta no disponible</div>`;
        }

        // Small delay to be nice to the demo API
        await new Promise(r => setTimeout(r, 200));
    }
}

// Reset sidebar view when closing
const originalCloseSidebar = window.closeSidebar || function () { };
window.closeSidebar = function () {
    document.querySelector('.stats-grid').style.display = 'grid'; // Restore stats
    const sidebar = document.getElementById('port-details');
    sidebar.classList.add('hidden');
    clearRoutes(); // Remove routes from map
    map.flyTo(CONFIG.initialCenter, CONFIG.initialZoom, { duration: 1.5 });
}
function selectPort(port) {
    document.querySelector('.stats-grid').style.display = 'grid'; // Ensure stats are visible
    const sidebar = document.getElementById('port-details');
    const title = document.getElementById('detail-title');
    const statShips = document.getElementById('stat-ships');
    const statArrivals = document.getElementById('stat-arrivals'); // We can use this for Tanker count
    const shipList = document.getElementById('ship-list');

    // Show Sidebar
    sidebar.classList.remove('hidden');

    // Update Label for 2nd Box to "Tankers"
    // Ideally we should update the HTML label too, but let's just hack the value for now
    // Or better, assume "Próx. Arribos" = "Tankers" for this view
    document.querySelector('#port-details .stat-card:nth-child(2) .label').textContent = "Tankers";

    title.textContent = port.name;
    statShips.textContent = port.ships;
    statArrivals.textContent = port.tankers;
    statArrivals.style.color = port.tankers > 0 ? '#ff4444' : '#fff';

    // Render List
    if (port.shipList.length === 0) {
        shipList.innerHTML = '<li>Sin naves programadas</li>';
    } else {
        // Group by Date
        const grouped = {};

        // Sort by Date first
        const sortedShips = [...port.shipList].sort((a, b) => {
            return new Date(a.eta) - new Date(b.eta);
        });

        sortedShips.forEach(ship => {
            const dateStr = ship.eta.split(' ')[0] || "Fecha Desc.";
            if (!grouped[dateStr]) grouped[dateStr] = [];
            grouped[dateStr].push(ship);
        });

        // Render Groups
        Object.keys(grouped).forEach(date => {
            // Date Header
            const header = document.createElement('div');
            header.className = 'date-header';
            header.style.color = '#008f8a';
            header.style.fontSize = '0.85rem';
            header.style.fontWeight = 'bold';
            header.style.marginTop = '10px';
            header.style.marginBottom = '5px';
            header.style.borderBottom = '1px solid rgba(0,143,138,0.2)';
            header.textContent = `📅 ${date}`;
            shipList.appendChild(header);

            // Ships for this date
            grouped[date].forEach(ship => {
                const isTanker = (ship.type || "").toUpperCase().includes("TANQUE");
                const icon = isTanker ? "🛢️" : "🚢";
                const li = document.createElement('li');

                // Removed the <span class="time"> element
                li.innerHTML = `
                    <div class="ship-item ${isTanker ? 'tanker-glow' : ''}">
                        <strong class="ship-name" style="margin-left:0;">${icon} ${ship.name}</strong>
                        <div class="ship-details">
                            ${ship.agency} | ${ship.type} <br>
                            L: ${ship.length}m | B: ${ship.beam}m
                        </div>
                    </div>
                `;
                shipList.appendChild(li);
            });
        });
    }
}


function closeSidebar() {
    const sidebar = document.getElementById('port-details');
    sidebar.classList.add('hidden');

    // Zoom back out
    map.flyTo(CONFIG.initialCenter, CONFIG.initialZoom, { duration: 1.5 });
}

function selectPortByCode(code) {
    const port = ports.find(p => p.code === code);
    if (!port) return;

    // 1. Reset filter to show all ports so the target is visible
    currentFilter = 'all';

    // 2. Ensure "Encender" (Show) landmarks
    const checkbox = document.getElementById('toggle-port-labels');
    if (checkbox && !checkbox.checked) {
        checkbox.checked = true;
        togglePortLabels();
    }

    renderPorts(ports);

    // Update Ribbon UI
    const ribbon = document.getElementById('port-filter-ribbon');
    if (ribbon) {
        const buttons = ribbon.querySelectorAll('.btn-control');
        buttons.forEach(btn => btn.classList.remove('active'));
        // Find "Todos" and set it active (since we reset to 'all')
        const allBtn = Array.from(buttons).find(b => b.innerText.toLowerCase().includes('todos'));
        if (allBtn) allBtn.classList.add('active');
    }

    // 3. Find and trigger marker click
    const marker = markers.find(m => m.options.portCode === code);
    if (marker) {
        marker.fire('click');
        map.flyTo(port.coords, 13, { duration: 1.5 });
    }
}
window.selectPortByCode = selectPortByCode;

function setMapFilter(filter) {
    const ribbon = document.getElementById('port-filter-ribbon');
    if (!ribbon) return;

    // 1. Specific Selector: Only buttons in THIS ribbon
    const buttons = ribbon.querySelectorAll('.btn-control');

    // 2. Toggle Logic (Apagar/Encender)
    const checkbox = document.getElementById('toggle-port-labels');

    if (currentFilter === filter) {
        // Toggle overall visibility if clicking same button
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            togglePortLabels();
            // Update active visual state
            if (checkbox.checked) {
                // Keep the active class
            } else {
                buttons.forEach(btn => btn.classList.remove('active'));
                currentFilter = null; // Unset
                return;
            }
        }
    }

    currentFilter = filter;
    buttons.forEach(btn => btn.classList.remove('active'));

    // Highlight the clicked button
    const targetBtn = Array.from(buttons).find(b => b.innerText.toLowerCase().includes(filter === 'all' ? 'todos' : (filter === 'north' ? 'norte' : (filter === 'center' ? 'centro' : 'sur'))));
    if (targetBtn) targetBtn.classList.add('active');

    // Explicitly target by event if possible for better accuracy
    if (typeof event !== 'undefined' && event.target && event.target.classList.contains('btn-control')) {
        event.target.classList.add('active');
    }

    // 3. Ensure "Encender" (Show) landmarks when filtering
    if (checkbox && !checkbox.checked) {
        checkbox.checked = true;
        togglePortLabels();
    }

    // 4. Actual Filtering
    if (filter === 'all') {
        renderPorts(ports);
    } else {
        const filtered = ports.filter(p => p.type === filter || (filter === 'center' && p.type === 'terminal'));
        renderPorts(filtered);
    }
}

// Overwrite window function to be safe
window.setMapFilter = setMapFilter;

// Force redraw on resize
window.addEventListener('resize', () => {
    if (map) map.invalidateSize();
});

// Start
document.addEventListener('DOMContentLoaded', initApp);
// --- Fuel Logistics Calculator Logic ---
function initFuelCalculator() {
    // Note: Inline oninput is already used in HTML.
    // We only need special handling for the Volume input (Type Text)

    // Special handling for the Volume input (Type Text to support commas)
    const volInput = document.getElementById('input-fuel-vol');
    if (volInput) {
        // On Focus: Remove commas for editing
        volInput.addEventListener('focus', () => {
            let val = volInput.value.replace(/,/g, '');
            volInput.value = val;
        });

        // On Blur: Format with commas
        volInput.addEventListener('blur', () => {
            let val = parseFloat(volInput.value.replace(/,/g, ''));
            if (!isNaN(val)) {
                volInput.value = val.toLocaleString('en-US');
            }
        });
    }

    // Initial Calc
    calculateFuelLogistics();
}

function calculateFuelLogistics() {
    // 1. Get Inputs
    // Sanitize commas for the volume input since it's now Text
    const rawVol = document.getElementById('input-fuel-vol').value;
    const volM3 = parseFloat(rawVol.replace(/,/g, '')) || 0;

    // Use 0 as default to avoid jumping values when clearing input
    const pct = parseFloat(document.getElementById('input-fuel-pct').value) || 0;
    const convFactor = parseFloat(document.getElementById('input-fuel-conv').value) || 0;
    const tankerVol = parseFloat(document.getElementById('input-fuel-tanker').value) || 0;

    // 2. Calculate Total Volume in Gallons
    // Formula: Vol(m3) * (%/100) * Conversion
    const totalGal = volM3 * (pct / 100) * convFactor;

    // 3. Calculate Daily Tankers
    const days = 365;
    let tankersPerYear = 0;
    if (tankerVol > 0) {
        tankersPerYear = totalGal / tankerVol;
    }
    const tankersPerDay = tankersPerYear / days;

    // 4. Calculate Total Events (Round Trip)
    const dailyEvents = tankersPerDay * 2;

    // 5. Update UI
    // 5. Update UI
    const elTotal = document.getElementById('res-fuel-total');
    if (elTotal) elTotal.innerText = `${Math.round(totalGal).toLocaleString()} gal`;

    const elTrucks = document.getElementById('res-fuel-trucks');
    if (elTrucks) elTrucks.innerText = `${tankersPerDay.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 🚛 /día`;

    const elEvents = document.getElementById('res-fuel-events');
    if (elEvents) elEvents.innerText = `${dailyEvents.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} viajes/día`;
}

// Ensure init is called
document.addEventListener('DOMContentLoaded', initFuelCalculator);

// --- Layer Toggle Logic ---
function togglePortLabels() {
    const el = document.getElementById('toggle-port-labels');
    if (!el) return;
    const show = el.checked;
    const mapContainer = document.getElementById('map');

    if (show) {
        mapContainer.classList.remove('map-hide-port-labels');
        if (window.portsLayer) map.addLayer(window.portsLayer);
    } else {
        mapContainer.classList.add('map-hide-port-labels');
        if (window.portsLayer) map.removeLayer(window.portsLayer);
    }
}

function toggleLandLabels() {
    const el = document.getElementById('toggle-land-labels');
    if (!el) return;
    const show = el.checked;
    const mapContainer = document.getElementById('map');
    if (show) {
        mapContainer.classList.remove('map-hide-land-labels');
        if (window.minesLayer) map.addLayer(window.minesLayer);
    } else {
        mapContainer.classList.add('map-hide-land-labels');
        if (window.minesLayer) map.removeLayer(window.minesLayer);
    }
}

// --- Elevation Points Logic ---

function renderElevationPoints() {
    if (typeof ELEVATION_POINTS !== 'undefined') {
        window.elevationPointsLayer = L.layerGroup();
        ELEVATION_POINTS.forEach(point => {
            // Marker
            const marker = L.circleMarker(point.coords, {
                radius: 3,
                color: '#00e676',
                fillColor: '#000',
                fillOpacity: 1,
                weight: 1,
                zIndexOffset: 500
            }); // Removed .addTo(map)
            if (window.elevationPointsLayer) window.elevationPointsLayer.addLayer(marker);

            // Add custom class to marker element? No, Leaflet markers are SVG/Canvas.
            // We use the Tooltip for the label.

            let slopeText = "";
            let slopVal = point.slope;
            if (slopVal !== null && slopVal !== undefined) {
                let color = "#ffeb3b"; // Yellow
                if (slopVal < -5) color = "#ff9800"; // Steep Down
                if (slopVal < -10) color = "#ff5722"; // Very Steep Down
                if (slopVal > 5) color = "#f44336"; // Steep Up

                slopeText = `<br><span class="elev-slope-val" style="color:${color}">${slopVal.toFixed(1)}%</span>`;
            }

            marker.bindTooltip(`KM ${point.km}<br>${Math.round(point.alt)} m${slopeText}`, {
                permanent: true,
                direction: 'top',
                className: 'elev-label-container',
                offset: [0, -5]
            });

            // Add a reference class to the tooltip (Leaflet 1.x adds className to the definition)
            // But we need to be able to hide the MARKER (Circle) too?
            // The request said "removable labels". Usually implies the tags.
            // If we want to hide the dots too, we need a LayerGroup.
        });

        // Let's assume we just hide labels as requested ("aparecer o desaparecer... etiquetas").
        // But better UX is to hide the whole layer?
        // Let's stick to hiding labels via CSS as derived from previous logic.
        // If dots remain, it's fine, less clutter than text.
    }

    // Checkbox State init
    toggleElevLabels();
}

function toggleElevLabels() {
    const el = document.getElementById('toggle-elev-labels');
    if (!el) return;
    const show = el.checked;
    const mapContainer = document.getElementById('map');

    if (show) {
        mapContainer.classList.remove('map-hide-elev-labels');
        if (window.elevationPointsLayer) map.addLayer(window.elevationPointsLayer);
    } else {
        mapContainer.classList.add('map-hide-elev-labels');
        if (window.elevationPointsLayer) map.removeLayer(window.elevationPointsLayer);
    }
}

// init
document.addEventListener('DOMContentLoaded', () => {
    // Delay slightly to ensure map is ready or just call it
    // script.js initApp calls render functions. We can append this call or add it to DOMContentLoaded if independent.
    // Since we are appending this code to the end, initApp is already defined. 
    // We should ideally call renderElevationPoints inside initApp, BUT we can't easily edit initApp middle.
    // So we'll run it separately after map init.
    // Given script.js structure, 'map' is global.

    setTimeout(renderElevationPoints, 1000); // 1s wait to ensure map is loaded
});

// --- Alternative Route Logic (Blue Line) ---

function renderAlternativeRoute() {
    if (typeof ALTERNATIVE_ROUTE_GEOJSON !== 'undefined') {
        const layer = L.geoJSON(ALTERNATIVE_ROUTE_GEOJSON, {
            style: {
                color: '#00bcd4', // Cyan/Blue
                weight: 6,
                opacity: 0.9,
                lineCap: 'round',
                dashArray: '10, 5'
            }
        }); // Removed .addTo(map)
        window.alternativeRouteLayer = L.layerGroup();
        layer.addTo(window.alternativeRouteLayer);

        // Add Popup
        layer.bindPopup(`
            <div style="font-family:'Rajdhani',sans-serif;">
                <strong style="color:#00bcd4; font-size:1.1em;">Ruta Alterna (Baja Pendiente)</strong><br>
                <span style="font-size:0.9em; color:#ccc;">San Nicolás &rarr; Triángulo &rarr; Norte</span>
                <hr style="margin:4px 0; border-color:#555;">
                <span style="font-size:0.9em;">Evita la subida directa de la Línea Verde.</span>
            </div>
        `, { className: 'custom-popup-dark' });
    }

    // Optional: Render Points for verification if debug needed
    // But user asked for visualization of the ROUTE primarily.
    // We can reuse the toggleElevLabels logic if we add these points to the ELEVATION_POINTS array?
    // User response: "tus etiquetas con pendienes me hacen ver que seria bien caro ir por alli" -> Implies they want to see slopes on the new route too.

    if (typeof ALTERNATIVE_ROUTE_POINTS !== 'undefined') {
        // Let's create markers for these too, but maybe with a different color/class to distinguish?
        // Or just add them to the map.

        ALTERNATIVE_ROUTE_POINTS.forEach(point => {
            const marker = L.circleMarker(point.coords, {
                radius: 3,
                color: '#00bcd4',
                fillColor: '#000',
                fillOpacity: 1,
                weight: 1,
                zIndexOffset: 600
            }); // Removed .addTo(map)
            if (window.alternativeRouteLayer) window.alternativeRouteLayer.addLayer(marker);

            let slopeText = "";
            let slopVal = point.slope;
            if (slopVal !== null && slopVal !== undefined) {
                let color = "#ffeb3b";
                if (slopVal > 8) color = "#f44336"; // Warn if steep even here

                slopeText = `<br><span class="elev-slope-val" style="color:${color}">${slopVal.toFixed(1)}%</span>`;
            }

            marker.bindTooltip(`Alt: ${Math.round(point.alt)}m${slopeText}`, {
                permanent: true,
                direction: 'top',
                className: 'elev-label-container', // Reuse class for styling
                offset: [0, -5]
            });

            // Add to a global list if we want to toggle them with the same checkbox?
            // Currently toggle logic uses CSS class on map container.
            // If we use the same CSS class 'elev-label-container', the existing checkbox will hide these too!
            // Perfect.
        });
    }
}

function toggleAlternativeRoute() {
    const el = document.getElementById('toggle-alternative-route');
    if (!el) return;
    const show = el.checked;

    if (!window.alternativeRouteLayer) renderAlternativeRoute();

    if (show && window.alternativeRouteLayer) {
        map.addLayer(window.alternativeRouteLayer);
    } else if (window.alternativeRouteLayer) {
        map.removeLayer(window.alternativeRouteLayer);
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        renderAlternativeRoute();
        toggleAlternativeRoute();
    }, 1200);
});

// ========================================
// CONCESSION LAYERS MANAGEMENT
// ========================================

// Global layer references
let shougangLayer = null;
let marcobreLayer = null;
let generacionLayer = null;

// Render Shougang Concession
function renderShougang() {
    if (typeof SHOUGANG_POLYGON_FEATURE !== 'undefined' && !shougangLayer) {
        shougangLayer = L.geoJSON(SHOUGANG_POLYGON_FEATURE, {
            style: {
                color: '#4a90e2',      // Blue
                weight: 2,
                opacity: 0.8,
                fillColor: '#4a90e2',
                fillOpacity: 0.2
            }
        }); // Removed .addTo(map)

        shougangLayer.bindPopup(`
            <div style="font-family:'Rajdhani',sans-serif;">
                <strong style="color:#4a90e2; font-size:1.1em;">Concesión Shougang</strong><br>
                <span style="font-size:0.9em; color:#ccc;">Concesión Minera</span>
            </div>
        `, { className: 'custom-popup-dark' });
    }
}

// Render Marcobre Concession
function renderMarcobre() {
    if (typeof MARCOBRE_GEOJSON !== 'undefined' && !marcobreLayer) {
        marcobreLayer = L.layerGroup();

        const poly = L.geoJSON(MARCOBRE_GEOJSON, {
            style: {
                color: '#ff6b35',      // Orange/Red
                weight: 2,
                opacity: 0.8,
                fillColor: '#ff6b35',
                fillOpacity: 0.2
            }
        });

        poly.bindPopup(`
            <div style="font-family:'Rajdhani',sans-serif;">
                <strong style="color:#ff6b35; font-size:1.1em;">Concesión Marcobre</strong><br>
                <span style="font-size:0.9em; color:#ccc;">Concesión Minera</span>
            </div>
        `, { className: 'custom-popup-dark' });

        poly.addTo(marcobreLayer);

        // Add numbered vertex markers
        if (typeof MARCOBRE_VERTICES !== 'undefined') {
            MARCOBRE_VERTICES.forEach(vertex => {
                const marker = L.circleMarker(vertex.coords, {
                    radius: 4,
                    color: '#ff6b35',
                    fillColor: '#fff',
                    fillOpacity: 1,
                    weight: 2
                }).addTo(marcobreLayer); // Changed from .addTo(map)

                marker.bindTooltip(`${vertex.id}`, {
                    permanent: true,
                    direction: 'center',
                    className: 'vertex-label',
                    offset: [0, 0]
                });
            });
        }
    }
}

// Render Generacion Electrica Concession
function renderGeneracionElectrica() {
    if (typeof GENERACION_ELECTRICA_GEOJSON !== 'undefined' && !generacionLayer) {
        generacionLayer = L.geoJSON(GENERACION_ELECTRICA_GEOJSON, {
            style: {
                color: '#ffd700',      // Gold
                weight: 2,
                opacity: 0.8,
                fillColor: '#ffd700',
                fillOpacity: 0.2
            }
        });

        generacionLayer.bindPopup(`
            <div style="font-family:'Rajdhani',sans-serif;">
                <strong style="color:#ffd700; font-size:1.1em;">Empresa de Generación Eléctrica Marcona</strong><br>
                <span style="font-size:0.9em; color:#ccc;">Concesión Eléctrica</span>
            </div>
        `, { className: 'custom-popup-dark' });
    }
}

// Toggle Functions
function toggleShougang() {
    const show = document.getElementById('toggle-shougang').checked;

    if (!shougangLayer) {
        renderShougang();
    }

    if (show && shougangLayer) {
        map.addLayer(shougangLayer);
    } else if (shougangLayer) {
        map.removeLayer(shougangLayer);
    }
}

function toggleMarcobre() {
    const show = document.getElementById('toggle-marcobre').checked;

    if (!marcobreLayer) {
        renderMarcobre();
    }

    if (show && marcobreLayer) {
        map.addLayer(marcobreLayer);
    } else if (marcobreLayer) {
        map.removeLayer(marcobreLayer);
    }
}

function toggleGeneracion() {
    const show = document.getElementById('toggle-generacion').checked;

    if (!generacionLayer) {
        renderGeneracionElectrica();
    }

    if (show && generacionLayer) {
        map.addLayer(generacionLayer);
    } else if (generacionLayer) {
        map.removeLayer(generacionLayer);
    }
}

// Initialize all concession layers on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Render all layers
        renderShougang();
        renderMarcobre();
        renderGeneracionElectrica();

        // Apply initial toggle states
        toggleShougang();
        toggleMarcobre();
        toggleGeneracion();
    }, 1000);
});


// ========================================
// SAN FERNANDO ROAD LAYER
// ========================================

let sfRoadLayer = null;

function renderSFRoad() {
    if (typeof SAN_FERNANDO_ROAD_GEOJSON !== 'undefined' && !sfRoadLayer) {
        sfRoadLayer = L.geoJSON(SAN_FERNANDO_ROAD_GEOJSON, {
            style: {
                color: '#00ff00',
                weight: 4,
                opacity: 0.9,
                lineCap: 'round',
                dashArray: '8, 4'
            }
        });

        sfRoadLayer.bindPopup(`
            <div style="font-family:'Rajdhani',sans-serif;">
                <strong style="color:#00ff00; font-size:1.1em;">Camino Reserva San Fernando</strong><br>
                <span style="font-size:0.9em; color:#ccc;">Ruta de acceso a la reserva</span>
            </div>
        `, { className: 'custom-popup-dark' });
    }
}

function toggleSFRoad() {
    const show = document.getElementById('toggle-sf-road').checked;

    if (!sfRoadLayer) {
        renderSFRoad();
    }

    if (show && sfRoadLayer) {
        map.addLayer(sfRoadLayer);
    } else if (sfRoadLayer) {
        map.removeLayer(sfRoadLayer);
    }
}

// ========================================
// LANDMARK: SHOUGANG-SF INTERSECTION
// ========================================

let landmarkMarker = null;

// function renderIntersectionLandmark() { ... } removed

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // renderSFRoad(); // Moved to unified init block
        // renderIntersectionLandmark();
    }, 1500);
});


// ========================================
// NEW GREEN ROUTE LAYER
// ========================================

let greenRouteLayer = null;
let greenRoutePointsLayer = null;

function renderGreenRoute() {
    if (typeof NEW_GREEN_ROUTE_GEOJSON !== 'undefined' && !greenRouteLayer) {
        // Render route line
        greenRouteLayer = L.geoJSON(NEW_GREEN_ROUTE_GEOJSON, {
            style: {
                color: '#00ff00',
                weight: 5,
                opacity: 0.9,
                lineCap: 'round'
            }
        }); // Removed .addTo(map)

        greenRouteLayer.bindPopup(`
            <div style="font-family:'Rajdhani',sans-serif;">
                <strong style="color:#00ff00; font-size:1.1em;">Ruta Verde</strong><br>
                <span style="font-size:0.9em; color:#ccc;">Shougang NW → Camino San Fernando</span>
            </div>
        `, { className: 'custom-popup-dark' });
    }

    // Render labeled points
    if (typeof NEW_GREEN_ROUTE_POINTS !== 'undefined' && !greenRoutePointsLayer) {
        greenRoutePointsLayer = L.layerGroup();

        let lastPlottedKm = -0.6;

        for (let i = 0; i < NEW_GREEN_ROUTE_POINTS.length; i++) {
            const point = NEW_GREEN_ROUTE_POINTS[i];

            // Helper to add marker
            const addMarker = (coords, km, alt) => {
                const marker = L.circleMarker(coords, {
                    radius: 5,
                    color: '#00ff00',
                    fillColor: '#fff',
                    fillOpacity: 1,
                    weight: 2
                });
                marker.bindTooltip(`KM ${km.toFixed(1)}<br>Alt: ${Math.round(alt)}m`, {
                    permanent: true,
                    direction: 'top',
                    className: 'elev-label-container',
                    offset: [0, -10]
                });
                greenRoutePointsLayer.addLayer(marker);
            };

            const dist = point.km - lastPlottedKm;

            if (dist >= 0.45) {
                // Check if we need to interpolate (Gap > 0.9)
                if (dist >= 0.9) {
                    if (i > 0) {
                        const prev = NEW_GREEN_ROUTE_POINTS[i - 1];
                        const midCoords = [
                            (prev.coords[0] + point.coords[0]) / 2,
                            (prev.coords[1] + point.coords[1]) / 2
                        ];
                        const midAlt = (prev.alt + point.alt) / 2;
                        const midKm = (prev.km + point.km) / 2;

                        if (midKm - lastPlottedKm >= 0.45) {
                            addMarker(midCoords, midKm, midAlt);
                            lastPlottedKm = midKm;
                        }
                    }
                }

                if (point.km - lastPlottedKm >= 0.45) {
                    addMarker(point.coords, point.km, point.alt);
                    lastPlottedKm = point.km;
                }
            }
        }
    }
}

function toggleGreenRoute() {
    const show = document.getElementById('toggle-green-route').checked;
    if (!greenRouteLayer) renderGreenRoute();

    if (show) {
        if (greenRouteLayer) map.addLayer(greenRouteLayer);
    } else {
        if (greenRouteLayer) map.removeLayer(greenRouteLayer);
    }
}

function toggleGreenRouteLabels() {
    const show = document.getElementById('toggle-green-route-labels').checked;
    if (!greenRoutePointsLayer) renderGreenRoute();

    if (show) {
        if (greenRoutePointsLayer) map.addLayer(greenRoutePointsLayer);
    } else {
        if (greenRoutePointsLayer) map.removeLayer(greenRoutePointsLayer);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        renderGreenRoute();
        toggleGreenRoute();
        toggleGreenRouteLabels();
    }, 1600);
});



// ========================================
// RED ROUTE LAYER (PE1S - Marcona)
// ========================================

let redRouteLayer = null;

function renderRedRoute() {
    if (typeof LAYER_RED_ROUTE !== 'undefined' && !redRouteLayer) {
        redRouteLayer = L.geoJSON(LAYER_RED_ROUTE, {
            style: {
                color: '#f44336', // RED
                weight: 5,
                opacity: 0.9,
                lineCap: 'round'
            }
        });

        redRouteLayer.bindPopup(`
            <div style="font-family:'Rajdhani',sans-serif;">
                <strong style="color:#f44336; font-size:1.1em;">Ruta Roja</strong><br>
                <span style="font-size:0.9em; color:#ccc;">PE1S &rarr; Marcona</span>
            </div>
        `, { className: 'custom-popup-dark' });
    }
}

function toggleRedRoute() {
    const show = document.getElementById('toggle-red-route').checked;

    if (!redRouteLayer) {
        renderRedRoute();
    }

    if (show && redRouteLayer) {
        map.addLayer(redRouteLayer);
    } else if (redRouteLayer) {
        map.removeLayer(redRouteLayer);
    }
}

// ========================================
// PURPLE ROUTE LAYER (Marcona - San Nicolas)
// ========================================

let purpleRouteLayer = null;

function renderPurpleRoute() {
    if (typeof LAYER_PURPLE_ROUTE !== 'undefined' && !purpleRouteLayer) {
        purpleRouteLayer = L.geoJSON(LAYER_PURPLE_ROUTE, {
            style: {
                color: '#9c27b0', // PURPLE
                weight: 5,
                opacity: 0.9,
                lineCap: 'round'
            }
        });

        purpleRouteLayer.bindPopup(`
            <div style="font-family:'Rajdhani',sans-serif;">
                <strong style="color:#9c27b0; font-size:1.1em;">Ruta Morada</strong><br>
                <span style="font-size:0.9em; color:#ccc;">Marcona &rarr; San Nicolás</span>
            </div>
        `, { className: 'custom-popup-dark' });
    }
}

function togglePurpleRoute() {
    const show = document.getElementById('toggle-purple-route').checked;

    if (!purpleRouteLayer) {
        renderPurpleRoute();
    }

    if (show && purpleRouteLayer) {
        map.addLayer(purpleRouteLayer);
    } else if (purpleRouteLayer) {
        map.removeLayer(purpleRouteLayer);
    }
}

// Initialize New Routes
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Red Route
        renderRedRoute();
        toggleRedRoute();

        // Purple Route
        renderPurpleRoute();
        togglePurpleRoute();

        // Ensure SF Road is handled (checked state in HTML determines visibility)
        renderSFRoad();
        toggleSFRoad();
    }, 1700);
});

// ========================================
// COASTAL ROUTE LAYER
// ========================================

let coastalRouteLayer = null;
let coastalRoutePointsLayer = null;

function renderCoastalRoute() {
    if (typeof COASTAL_ROUTE_GEOJSON !== 'undefined' && !coastalRouteLayer) {
        // Render route line
        coastalRouteLayer = L.geoJSON(COASTAL_ROUTE_GEOJSON, {
            style: {
                color: '#00bfff',  // Deep Sky Blue
                weight: 5,
                opacity: 0.9,
                lineCap: 'round'
            }
        });

        coastalRouteLayer.bindPopup(`
            <div style="font-family:'Rajdhani',sans-serif;">
                <strong style="color:#00bfff; font-size:1.1em;">Ruta Costera MARK</strong><br>
                <span style="font-size:0.9em; color:#ccc;">Ruta alternativa por la costa</span>
            </div>
        `, { className: 'custom-popup-dark' });
    }

    // Render labeled points
    if (typeof COASTAL_ROUTE_POINTS !== 'undefined' && !coastalRoutePointsLayer) {
        coastalRoutePointsLayer = L.layerGroup();

        let lastPlottedKm = -0.6;

        for (let i = 0; i < COASTAL_ROUTE_POINTS.length; i++) {
            const point = COASTAL_ROUTE_POINTS[i];

            // Helper to add marker
            const addMarker = (coords, km, alt) => {
                const marker = L.circleMarker(coords, {
                    radius: 5,
                    color: '#00bfff',
                    fillColor: '#fff',
                    fillOpacity: 1,
                    weight: 2
                });
                marker.bindTooltip(`KM ${km.toFixed(1)}<br>Alt: ${Math.round(alt)}m`, {
                    permanent: true,
                    direction: 'top',
                    className: 'elev-label-container',
                    offset: [0, -10]
                });
                coastalRoutePointsLayer.addLayer(marker);
            };

            const dist = point.km - lastPlottedKm;

            if (dist >= 0.45) {
                if (dist >= 0.9) {
                    if (i > 0) {
                        const prev = COASTAL_ROUTE_POINTS[i - 1];
                        const midCoords = [
                            (prev.coords[0] + point.coords[0]) / 2,
                            (prev.coords[1] + point.coords[1]) / 2
                        ];
                        const midAlt = (prev.alt + point.alt) / 2;
                        const midKm = (prev.km + point.km) / 2;

                        if (midKm - lastPlottedKm >= 0.45) {
                            addMarker(midCoords, midKm, midAlt);
                            lastPlottedKm = midKm;
                        }
                    }
                }

                if (point.km - lastPlottedKm >= 0.45) {
                    addMarker(point.coords, point.km, point.alt);
                    lastPlottedKm = point.km;
                }
            }
        }
    }
}

function toggleCoastalRoute() {
    const show = document.getElementById('toggle-coastal-route').checked;
    if (!coastalRouteLayer) renderCoastalRoute();

    if (show) {
        if (coastalRouteLayer) map.addLayer(coastalRouteLayer);
    } else {
        if (coastalRouteLayer) map.removeLayer(coastalRouteLayer);
    }
}

function toggleCoastalRouteLabels() {
    const show = document.getElementById('toggle-coastal-route-labels').checked;
    if (!coastalRoutePointsLayer) renderCoastalRoute();

    if (show) {
        if (coastalRoutePointsLayer) map.addLayer(coastalRoutePointsLayer);
    } else {
        if (coastalRoutePointsLayer) map.removeLayer(coastalRoutePointsLayer);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Coastal Route
        renderCoastalRoute();
        toggleCoastalRoute();
        toggleCoastalRouteLabels();
    }, 1700);
});

// --- Calculators Toggles ---
function toggleMiningLogistics() {
    const show = document.getElementById('toggle-mining-logistics').checked;
    const panel = document.getElementById('logistics-panel');
    if (panel) {
        panel.style.display = show ? 'block' : 'none';
    }
}

function toggleFuelLogistics() {
    const show = document.getElementById('toggle-fuel-logistics').checked;
    const panel = document.getElementById('fuel-logistics-panel');
    if (panel) {
        panel.style.display = show ? 'block' : 'none';
    }
}

// ========================================
// SERVIDUMBRE LABELS LAYER (EAST LINE)
// ========================================

let servidumbreLabelsLayer = null;

function renderServidumbreLabels() {
    if (typeof SERVIDUMBRE_LABELS_GEOJSON !== 'undefined') {
        window.servidumbreLabelsLayer = L.geoJSON(SERVIDUMBRE_LABELS_GEOJSON, {
            pointToLayer: function (feature, latlng) {
                if (feature.properties && feature.properties.label) {
                    const elevation = feature.properties.elevation ? Math.round(feature.properties.elevation) : 0;
                    const kmLabel = feature.properties.label.replace(' km', ''); // "0.5"

                    // Style matching Coastal Route / Ferrocarril Ext
                    const marker = L.circleMarker(latlng, {
                        radius: 5,
                        color: '#ff0000', // Red for Servidumbre
                        fillColor: '#fff',
                        fillOpacity: 1,
                        weight: 2
                    });

                    marker.bindTooltip(`KM ${kmLabel}<br>Alt: ${elevation}m`, {
                        permanent: true,
                        direction: 'top',
                        className: 'elev-label-container', // reusing existing CSS class
                        offset: [0, -10]
                    });

                    return marker;
                }
                return null;
            }
        });
    }
}

function toggleServidumbreLabels() {
    const el = document.getElementById('toggle-servidumbre-labels');
    if (!el) return;
    const show = el.checked;

    if (!window.servidumbreLabelsLayer) {
        renderServidumbreLabels();
    }

    if (show && window.servidumbreLabelsLayer) {
        map.addLayer(window.servidumbreLabelsLayer);
    } else if (window.servidumbreLabelsLayer) {
        map.removeLayer(window.servidumbreLabelsLayer);
    }
}

// --- SUNARP Layers ---
let sunarp1Layer = null;
let sunarp2Layer = null;
let sunarp3Layer = null;

function renderSunarp1() {
    if (typeof SUNARP_1_GEOJSON !== 'undefined' && !sunarp1Layer) {
        sunarp1Layer = L.geoJSON(SUNARP_1_GEOJSON, {
            style: function (f) { return { color: f.properties.color, weight: 3, opacity: 0.8, fillColor: f.properties.color, fillOpacity: 0.2 }; },
            onEachFeature: function (f, l) { l.bindPopup(`<b>${f.properties.name}</b>`); }
        });
    }
}

function renderSunarp2() {
    if (typeof SUNARP_2_GEOJSON !== 'undefined' && !sunarp2Layer) {
        sunarp2Layer = L.geoJSON(SUNARP_2_GEOJSON, {
            style: function (f) { return { color: f.properties.color, weight: 3, opacity: 0.8, fillColor: f.properties.color, fillOpacity: 0.2 }; },
            onEachFeature: function (f, l) { l.bindPopup(`<b>${f.properties.name}</b>`); }
        });
    }
}

function renderSunarp3() {
    if (typeof SUNARP_3_GEOJSON !== 'undefined' && !sunarp3Layer) {
        sunarp3Layer = L.geoJSON(SUNARP_3_GEOJSON, {
            style: function (f) { return { color: f.properties.color, weight: 3, opacity: 0.8, fillColor: f.properties.color, fillOpacity: 0.2 }; },
            onEachFeature: function (f, l) { l.bindPopup(`<b>${f.properties.name}</b>`); }
        });
    }
}

function toggleSunarp1() {
    const el = document.getElementById('toggle-sunarp-1');
    if (!el) return;
    const show = el.checked;
    if (show) {
        if (!sunarp1Layer) renderSunarp1();
        if (sunarp1Layer) map.addLayer(sunarp1Layer);
    } else {
        if (sunarp1Layer) map.removeLayer(sunarp1Layer);
    }
}

function toggleSunarp2() {
    const el = document.getElementById('toggle-sunarp-2');
    if (!el) return;
    const show = el.checked;
    if (show) {
        if (!sunarp2Layer) renderSunarp2();
        if (sunarp2Layer) map.addLayer(sunarp2Layer);
    } else {
        if (sunarp2Layer) map.removeLayer(sunarp2Layer);
    }
}

function toggleSunarp3() {
    const el = document.getElementById('toggle-sunarp-3');
    if (!el) return;
    const show = el.checked;
    if (show) {
        if (!sunarp3Layer) renderSunarp3();
        if (sunarp3Layer) map.addLayer(sunarp3Layer);
    } else {
        if (sunarp3Layer) map.removeLayer(sunarp3Layer);
    }
}



// ========================================
// 1S.GARITA LAYER (Tramo 1 Consolidado)
// ========================================

let garita1SLayer = null;
let garita1SPointsLayer = null;

function renderGarita1S() {
    if (typeof LAYER_1S_GARITA_GEOJSON !== 'undefined' && !garita1SLayer) {
        garita1SLayer = L.geoJSON(LAYER_1S_GARITA_GEOJSON, {
            style: {
                color: '#ff9800', // ORANGE
                weight: 5,
                opacity: 0.9,
                lineCap: 'round'
            }
        });

        garita1SLayer.bindPopup(`
            <div style="font-family:'Rajdhani',sans-serif;">
                <strong style="color:#ff9800; font-size:1.1em;">Ruta 1S - Garita</strong><br>
                <span style="font-size:0.9em; color:#ccc;">Tramo 1 Consolidado (App)</span>
            </div>
        `, { className: 'custom-popup-dark' });
    }

    if (typeof LAYER_1S_GARITA_POINTS !== 'undefined' && !garita1SPointsLayer) {
        garita1SPointsLayer = L.layerGroup();
        LAYER_1S_GARITA_POINTS.forEach(point => {
            const marker = L.circleMarker(point.coords, {
                radius: 5,
                color: '#ff9800',
                fillColor: '#fff',
                fillOpacity: 1,
                weight: 2
            });

            marker.bindTooltip(`${point.name}<br>Alt: ${point.alt}m<br>Pend: ${point.slope}%`, {
                permanent: true,
                direction: 'top',
                className: 'elev-label-container',
                offset: [0, -10]
            });

            garita1SPointsLayer.addLayer(marker);
        });
    }
}

function toggleGarita1S() {
    const el = document.getElementById('toggle-garita-1s');
    if (!el) return;
    const show = el.checked;

    if (!garita1SLayer) renderGarita1S();

    if (show && garita1SLayer) {
        map.addLayer(garita1SLayer);
    } else if (garita1SLayer) {
        map.removeLayer(garita1SLayer);
    }
}

function toggleGarita1SLabels() {
    const el = document.getElementById('toggle-garita-1s-labels');
    if (!el) return;
    const show = el.checked;

    if (!garita1SPointsLayer) renderGarita1S();

    if (show && garita1SPointsLayer) {
        map.addLayer(garita1SPointsLayer);
    } else if (garita1SPointsLayer) {
        map.removeLayer(garita1SPointsLayer);
    }
}

// --- UI UTILS ---

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    
    panel.classList.toggle('panel-minimized');
    
    // Update button text (+ or -)
    const btn = panel.querySelector('.btn-minimize');
    if (btn) {
        btn.textContent = panel.classList.contains('panel-minimized') ? '+' : '−';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Minimize panels after a short delay for cool effect or immediately?
    // User wants clean screen, so let's minimize them by default after a intro
    setTimeout(() => {
        toggleGarita1S();
        toggleGarita1SLabels();
        
        // Auto-minimize after 3 seconds to show they exist then clean up
        setTimeout(() => {
            togglePanel('port-filter-ribbon');
            togglePanel('layer-controls-panel');
        }, 3000);
    }, 2000);
});
