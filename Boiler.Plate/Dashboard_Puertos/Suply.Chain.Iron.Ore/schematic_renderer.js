// schematic_renderer.js
// Renders the Supply Chain Schematic using REAL Geographic Data (WGS84 -> SVG)

document.addEventListener('DOMContentLoaded', () => {
    initRealSchematic();
});

// Update Setup Interactions
function setupInteractions() {
    console.log('🔧 Setting up interactions...');

    const zoneIsland = document.getElementById('zone-island');
    console.log('Island zone:', zoneIsland);
    if (zoneIsland) {
        zoneIsland.style.cursor = 'pointer';
        zoneIsland.addEventListener('click', () => {
            console.log('🏝️ Island clicked!');
            openDetailView('island');
        });
    }

    const zonePetral = document.getElementById('zone-petral');
    console.log('Petral zone:', zonePetral);
    if (zonePetral) {
        zonePetral.style.cursor = 'pointer';
        zonePetral.addEventListener('click', () => {
            console.log('🏗️ Petral clicked!');
            openDetailView('petral');
        });
    }

    const zonePier = document.getElementById('zone-pier');
    console.log('Pier zone:', zonePier);
    if (zonePier) {
        zonePier.style.cursor = 'pointer';
        zonePier.addEventListener('click', () => {
            console.log('⚓ Pier clicked!');
            openDetailView('petral');
        });
    }

    console.log('✅ Interactions setup complete');
}

function openDetailView(zone) {
    const modal = document.getElementById('detail-modal');
    const container = document.getElementById('modal-svg-container');

    modal.style.display = 'flex';
    container.innerHTML = ''; // Clear previous

    if (zone === 'island') {
        renderIslandDetail(container);
    } else if (zone === 'petral') {
        renderPortDetail(container);
    }
}

function closeDetailModal() {
    document.getElementById('detail-modal').style.display = 'none';
}
window.closeDetailModal = closeDetailModal; // Expose to global scope 

function renderIslandDetail(container) {
    // REAL VIDEO SCREENSHOTS - ISLAND OPERATIONS
    const htmlContent = `
    <div style="width:100%; height:100%; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 2rem; overflow-y: auto;">
        
        <!-- HEADER -->
        <div style="text-align: center; margin-bottom: 2rem;">
            <h2 style="font-family: 'Oswald', sans-serif; color: #00d4ff; font-size: 2.5rem; margin: 0; text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);">
                ISLA - RECEPCIÓN Y ACOPIO
            </h2>
            <p style="color: #aaa; margin-top: 0.5rem; font-size: 1.1rem;">Descarga, Almacenamiento y Recuperación de Mineral</p>
        </div>

        <!-- IMAGE GRID -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
            
            <!-- TRUCK DUMPER -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
                <img src="assets/images/truck_dumper.jpg" style="width: 100%; height: 250px; object-fit: cover; display: block;">
                <div style="padding: 1.5rem;">
                    <h3 style="margin: 0 0 0.5rem 0; color: #00d4ff; font-size: 1.2rem; font-family: 'Oswald', sans-serif;">
                        <i class="fas fa-truck" style="margin-right: 0.5rem;"></i>VOLCADOR DE CAMIONES
                    </h3>
                    <p style="margin: 0; color: #ccc; font-size: 0.9rem; line-height: 1.6;">
                        Descarga de camiones mineros mediante volcado. Capacidad: 2,000 ton/hora.
                    </p>
                </div>
            </div>

            <!-- TRAIN DUMPER -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
                <img src="assets/images/train_dumper.jpg" style="width: 100%; height: 250px; object-fit: cover; display: block;">
                <div style="padding: 1.5rem;">
                    <h3 style="margin: 0 0 0.5rem 0; color: #00d4ff; font-size: 1.2rem; font-family: 'Oswald', sans-serif;">
                        <i class="fas fa-train" style="margin-right: 0.5rem;"></i>VOLCADOR ROTATORIO
                    </h3>
                    <p style="margin: 0; color: #ccc; font-size: 0.9rem; line-height: 1.6;">
                        Descarga de vagones ferroviarios mediante rotación de 180°.
                    </p>
                </div>
            </div>

            <!-- UNDERGROUND CONVEYOR -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
                <img src="assets/images/underground_conveyor.jpg" style="width: 100%; height: 250px; object-fit: cover; display: block;">
                <div style="padding: 1.5rem;">
                    <h3 style="margin: 0 0 0.5rem 0; color: #00d4ff; font-size: 1.2rem; font-family: 'Oswald', sans-serif;">
                        <i class="fas fa-arrow-down" style="margin-right: 0.5rem;"></i>TOLVAS SUBTERRÁNEAS
                    </h3>
                    <p style="margin: 0; color: #ccc; font-size: 0.9rem; line-height: 1.6;">
                        Sistema de tolvas y fajas subterráneas hacia patios de acopio.
                    </p>
                </div>
            </div>

            <!-- STOCKPILE FLOW -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
                <img src="assets/images/stockpile_flow.jpg" style="width: 100%; height: 250px; object-fit: cover; display: block;">
                <div style="padding: 1.5rem;">
                    <h3 style="margin: 0 0 0.5rem 0; color: #00d4ff; font-size: 1.2rem; font-family: 'Oswald', sans-serif;">
                        <i class="fas fa-layer-group" style="margin-right: 0.5rem;"></i>STOCKPILES & RECLAIMERS
                    </h3>
                    <p style="margin: 0; color: #ccc; font-size: 0.9rem; line-height: 1.6;">
                        Almacenamiento en pilas y recuperación mediante reclaimers hacia puerto.
                    </p>
                </div>
            </div>
        </div>

        <!-- FLOW INDICATOR -->
        <div style="padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; text-align: center; color: white; box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);">
            <i class="fas fa-arrow-right" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
            <h3 style="margin: 0; font-size: 1.3rem; font-family: 'Oswald', sans-serif;">SALIDA A PUERTO</h3>
            <p style="margin: 0.5rem 0 0 0; opacity: 0.9; font-size: 1rem;">Faja Transportadora Tubular - 4 km</p>
        </div>
    </div>
    `;
    container.innerHTML = htmlContent;
}

function renderPortDetail(container) {
    // REAL VIDEO SCREENSHOTS - PORT OPERATIONS
    const htmlContent = `
    <div style="width:100%; height:100%; background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%); padding: 2rem; overflow-y: auto;">
        
        <!-- HEADER -->
        <div style="text-align: center; margin-bottom: 2rem;">
            <h2 style="font-family: 'Oswald', sans-serif; color: #00d4ff; font-size: 2.5rem; margin: 0; text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);">
                PUERTO - TERMINAL PETRAL
            </h2>
            <p style="color: #aaa; margin-top: 0.5rem; font-size: 1.1rem;">Embarque de Mineral a Buques Cape Size</p>
        </div>

        <!-- IMAGE GRID -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
            
            <!-- CONVEYOR TO PIER -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
                <img src="assets/images/conveyor_to_pier.jpg" style="width: 100%; height: 250px; object-fit: cover; display: block;">
                <div style="padding: 1.5rem;">
                    <h3 style="margin: 0 0 0.5rem 0; color: #00d4ff; font-size: 1.2rem; font-family: 'Oswald', sans-serif;">
                        <i class="fas fa-road" style="margin-right: 0.5rem;"></i>FAJA A FINGER PIER
                    </h3>
                    <p style="margin: 0; color: #ccc; font-size: 0.9rem; line-height: 1.6;">
                        Faja transportadora tubular de 4 km desde Isla hasta muelle.
                    </p>
                </div>
            </div>

            <!-- PIER & VESSEL -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
                <img src="assets/images/pier_vessel.jpg" style="width: 100%; height: 250px; object-fit: cover; display: block;">
                <div style="padding: 1.5rem;">
                    <h3 style="margin: 0 0 0.5rem 0; color: #00d4ff; font-size: 1.2rem; font-family: 'Oswald', sans-serif;">
                        <i class="fas fa-ship" style="margin-right: 0.5rem;"></i>FINGER PIER & BUQUE
                    </h3>
                    <p style="margin: 0; color: #ccc; font-size: 0.9rem; line-height: 1.6;">
                        Muelle extendido de 300m con buque Cape Size atracado.
                    </p>
                </div>
            </div>

            <!-- SHIPLOADER -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); grid-column: span 2;">
                <img src="assets/images/shiploader.jpg" style="width: 100%; height: 300px; object-fit: cover; display: block;">
                <div style="padding: 1.5rem;">
                    <h3 style="margin: 0 0 0.5rem 0; color: #00d4ff; font-size: 1.2rem; font-family: 'Oswald', sans-serif;">
                        <i class="fas fa-cogs" style="margin-right: 0.5rem;"></i>SHIPLOADER
                    </h3>
                    <p style="margin: 0; color: #ccc; font-size: 0.9rem; line-height: 1.6;">
                        Cargador de buques con brazo telescópico articulado. Capacidad: 1,500 ton/hora.
                    </p>
                </div>
            </div>
        </div>

        <!-- CAPACITY INDICATOR -->
        <div style="padding: 1.5rem; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 16px; text-align: center; color: white; box-shadow: 0 8px 32px rgba(79, 172, 254, 0.4);">
            <i class="fas fa-chart-line" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
            <h3 style="margin: 0; font-size: 1.3rem; font-family: 'Oswald', sans-serif;">CAPACIDAD OPERATIVA</h3>
            <p style="margin: 0.5rem 0 0 0; opacity: 0.9; font-size: 1rem;">1,500 ton/hora | 36,000 ton/día</p>
        </div>
    </div>
    `;
    container.innerHTML = htmlContent;
}

function initRealSchematic() {
    const svg = document.getElementById('real-layout-svg');
    if (!svg) return;

    // 1. GATHER DATA
    // -------------------------------------------------------------------------
    // A. ISLAND (Shougang Reception) - Indices 15-21 from shougang_polygon.js
    let islandCoords = [];
    if (typeof SHOUGANG_RAW_COORDS !== 'undefined') {
        const raw = SHOUGANG_RAW_COORDS.slice(15, 22);
        // raw is [Lat, Lon]. We usually want [Lon, Lat] for GeoJSON consistent usage
        islandCoords = raw.map(p => [p[1], p[0]]);
    } else {
        console.warn("Schematic: SHOUGANG_RAW_COORDS missing");
    }

    // B. PETRAL (Triangle) - From perimeter_sides.js
    let petralCoords = [];
    if (typeof PERIMETER_SIDES_GEOJSON !== 'undefined') {
        // We need 3 points. 
        // 1. North Tip (Start of Lado A): [-75.25695083552709, -15.165498334382889]
        // 2. East Tip (Start of Lado C / End Lado A): [-75.26825393885237, -15.172534472456562]
        // 3. Pier Tip (End of Lado B / End Lado C): [-75.23798892224755, -15.197477563030073]

        // Let's extract safely from features if possible
        const fA = PERIMETER_SIDES_GEOJSON.features.find(f => f.properties.side_id === 'A');
        const fB = PERIMETER_SIDES_GEOJSON.features.find(f => f.properties.side_id === 'B');

        if (fA && fB) {
            // Lado A coords: [Start, End]
            const pNorth = fA.geometry.coordinates[0];
            const pWest = fA.geometry.coordinates[1];
            const pSouth = fB.geometry.coordinates[1]; // End of B is the Pier
            petralCoords = [pNorth, pWest, pSouth]; // Triangle
        }
    } else {
        console.warn("Schematic: PERIMETER_SIDES_GEOJSON missing");
    }

    // C. COASTLINE - From coastal_route.js
    let coastCoords = [];
    if (typeof COASTAL_ROUTE_GEOJSON !== 'undefined') {
        coastCoords = COASTAL_ROUTE_GEOJSON.features[0].geometry.coordinates;
        // Optimization: Reduce point density for SVG performance if needed
        coastCoords = coastCoords.filter((_, i) => i % 5 === 0);
    }

    // 2. PROJECTION SETUP (Mercator-like for simplicity)
    // -------------------------------------------------------------------------
    const allCoords = [...islandCoords, ...petralCoords, ...coastCoords];
    const lons = allCoords.map(c => c[0]);
    const lats = allCoords.map(c => c[1]);

    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const viewBoxWidth = 1000;
    const viewBoxHeight = 500;
    const padding = 50;

    // Simple linear projection
    function project(lon, lat) {
        const x = ((lon - minLon) / (maxLon - minLon)) * (viewBoxWidth - 2 * padding) + padding;
        const y = viewBoxHeight - (((lat - minLat) / (maxLat - minLat)) * (viewBoxHeight - 2 * padding) + padding);
        return [x, y];
    }

    // 3. RENDER PATHS
    // -------------------------------------------------------------------------
    // A. COASTLINE
    if (coastCoords.length > 0) {
        const coastPath = coastCoords.map((c, i) => {
            const [x, y] = project(c[0], c[1]);
            return (i === 0 ? `M${x},${y}` : `L${x},${y}`);
        }).join(' ');
        document.getElementById('path-coast').setAttribute('d', coastPath);
    }

    // B. ISLAND
    if (islandCoords.length > 0) {
        const islandPath = islandCoords.map((c, i) => {
            const [x, y] = project(c[0], c[1]);
            return (i === 0 ? `M${x},${y}` : `L${x},${y}`);
        }).join(' ') + ' Z';
        document.getElementById('path-island').setAttribute('d', islandPath);
    }

    // C. PETRAL
    if (petralCoords.length === 3) {
        const petralPath = petralCoords.map((c, i) => {
            const [x, y] = project(c[0], c[1]);
            return (i === 0 ? `M${x},${y}` : `L${x},${y}`);
        }).join(' ') + ' Z';
        document.getElementById('path-petral').setAttribute('d', petralPath);
    }

    // D. CONVEYOR BELT (Island center to Petral South)
    if (islandCoords.length > 0 && petralCoords.length === 3) {
        // Island center
        const islandLons = islandCoords.map(c => c[0]);
        const islandLats = islandCoords.map(c => c[1]);
        const islandCenter = [
            (Math.min(...islandLons) + Math.max(...islandLons)) / 2,
            (Math.min(...islandLats) + Math.max(...islandLats)) / 2
        ];

        const petralSouth = petralCoords[2]; // Pier tip

        const [x1, y1] = project(islandCenter[0], islandCenter[1]);
        const [x2, y2] = project(petralSouth[0], petralSouth[1]);

        const conveyorPath = `M${x1},${y1} L${x2},${y2}`;
        document.getElementById('path-conveyor').setAttribute('d', conveyorPath);
        document.getElementById('anim-conveyor').setAttribute('d', conveyorPath);

        // E. FINGER PIER - Extends perpendicular from Petral South vertex
        // Calculate perpendicular direction (rotate 90 degrees)
        const dx = x2 - x1;
        const dy = y2 - y1;
        const pierLength = 150; // Length of finger pier in SVG units

        // Perpendicular vector (rotate 90° clockwise)
        const perpX = dy;
        const perpY = -dx;
        const perpMag = Math.sqrt(perpX * perpX + perpY * perpY);
        const perpUnitX = perpX / perpMag;
        const perpUnitY = perpY / perpMag;

        // Finger pier endpoint
        const pierEndX = x2 + perpUnitX * pierLength;
        const pierEndY = y2 + perpUnitY * pierLength;

        // Draw finger pier
        const pierPath = document.getElementById('path-pier');
        pierPath.setAttribute('d', `M${x2},${y2} L${pierEndX},${pierEndY}`);

        // F. SHIP - Position alongside finger pier (horizontal orientation)
        const shipGroup = document.getElementById('group-ship');

        // Position ship near pier end, but keep it horizontal (no rotation)
        const shipOffsetDist = 40; // Distance from pier endpoint
        const shipX = pierEndX + perpUnitY * shipOffsetDist;
        const shipY = pierEndY - perpUnitX * shipOffsetDist;

        shipGroup.setAttribute('transform', `translate(${shipX}, ${shipY})`);
    }

    // 4. DISTANCE CALCULATION (Haversine)
    // -------------------------------------------------------------------------
    const islandLons = islandCoords.map(c => c[0]);
    const islandLats = islandCoords.map(c => c[1]);
    const islandCenter = [
        (Math.min(...islandLons) + Math.max(...islandLons)) / 2,
        (Math.min(...islandLats) + Math.max(...islandLats)) / 2
    ];
    const petralSouth = petralCoords[2];
    const distKm = haversineDistance(islandCenter, petralSouth);
    document.getElementById('text-conveyor-dist').textContent = `Faja Tubular (${distKm.toFixed(2)} km)`;

    // Setup interactions AFTER all SVG elements are created
    setupInteractions();
}

// Helper: Haversine
function haversineDistance(coords1, coords2) {
    const R = 6371; // Earth Mean Radius in km
    const dLat = (coords2[1] - coords1[1]) * Math.PI / 180;
    const dLon = (coords2[0] - coords1[0]) * Math.PI / 180;
    const lat1 = coords1[1] * Math.PI / 180;
    const lat2 = coords2[1] * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
