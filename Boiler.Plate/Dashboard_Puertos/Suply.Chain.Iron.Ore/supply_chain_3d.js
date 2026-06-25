// supply_chain_3d.js
// 3D Visualization of Iron Ore Supply Chain Flow

document.addEventListener('DOMContentLoaded', function () {
    if (typeof TERRAIN_MESH_DATA === 'undefined') {
        alert("Datos de terreno no encontrados.");
        return;
    }

    // ========================================================================
    // 1. COORDINATE SYSTEM SETUP (WGS84 -> Local Meters)
    // ========================================================================
    const originLon = Math.min(...TERRAIN_MESH_DATA.x);
    const originLat = Math.min(...TERRAIN_MESH_DATA.y);

    const R = 6378137;
    const D2R = Math.PI / 180;
    const latRad = originLat * D2R;
    const metersPerDegLat = 111132.954 - 559.822 * Math.cos(2 * latRad);
    const metersPerDegLon = 111412.84 * Math.cos(latRad);

    const toX = (lon) => (lon - originLon) * metersPerDegLon;
    const toY = (lat) => (lat - originLat) * metersPerDegLat;

    const x_meters = TERRAIN_MESH_DATA.x.map(toX);
    const y_meters = TERRAIN_MESH_DATA.y.map(toY);
    const z_meters = TERRAIN_MESH_DATA.z;

    // ========================================================================
    // 2. TERRAIN SURFACE
    // ========================================================================
    const terrainTrace = {
        x: x_meters,
        y: y_meters,
        z: z_meters,
        type: 'mesh3d',
        intensity: z_meters,
        colorscale: 'Earth',
        opacity: 0.7,
        flatshading: false,
        lighting: {
            ambient: 0.6,
            diffuse: 0.7,
            roughness: 0.8,
            specular: 0.2
        },
        hoverinfo: 'skip',
        name: 'Terreno',
        showscale: false
    };

    // ========================================================================
    // 3. ISLAND ZONE (Reception Area)
    // ========================================================================
    // Island center coordinates (approximate from Shougang polygon indices 15-21)
    const islandLon = -75.2585; // Approximate center
    const islandLat = -15.1705;
    const islandX = toX(islandLon);
    const islandY = toY(islandLat);
    const islandZ = 25; // Base elevation

    // 3A. TRUCK DUMPER (Box)
    const dumperSize = 40;
    const dumperHeight = 25;
    const dumperX = islandX - 80;
    const dumperY = islandY + 60;

    const truckDumper = createBox(dumperX, dumperY, islandZ, dumperSize, dumperSize, dumperHeight, '#90a4ae', 'Truck Dumper');

    // 3B. ROTARY TRAIN DUMPER (Cylinder approximation)
    const rotaryX = islandX - 80;
    const rotaryY = islandY - 60;
    const rotaryDumper = createBox(rotaryX, rotaryY, islandZ, 50, 35, 30, '#78909c', 'Rotary Dumper');

    // 3C. STOCKPILES (Pyramids)
    const stockpile1 = createPyramid(islandX + 100, islandY + 40, islandZ, 80, 40, 20, '#8d6e63', 'Stockpile 1');
    const stockpile2 = createPyramid(islandX + 100, islandY - 40, islandZ, 80, 40, 20, '#8d6e63', 'Stockpile 2');

    // 3D. RECLAIMER (Simplified as elevated marker + arm)
    const reclaimerX = islandX + 180;
    const reclaimerY = islandY;
    const reclaimer = {
        x: [reclaimerX, reclaimerX - 40],
        y: [reclaimerY, reclaimerY],
        z: [islandZ + 15, islandZ + 35],
        mode: 'lines+markers',
        type: 'scatter3d',
        line: { color: '#ffb300', width: 8 },
        marker: { size: 10, color: '#ff6f00', symbol: 'diamond' },
        name: 'Reclaimer',
        hoverinfo: 'name'
    };

    // ========================================================================
    // 4. CONVEYOR BELT (Elevated Tube)
    // ========================================================================
    // From Island to Petral South Vertex
    const petralSouthLon = -75.23798892224755;
    const petralSouthLat = -15.197477563030073;
    const petralX = toX(petralSouthLon);
    const petralY = toY(petralSouthLat);

    const conveyorHeight = 30; // Elevated 30m
    const conveyorBelt = {
        x: [islandX + 200, petralX],
        y: [islandY, petralY],
        z: [conveyorHeight, conveyorHeight],
        mode: 'lines',
        type: 'scatter3d',
        line: {
            color: '#795548',
            width: 14
        },
        name: 'Faja Transportadora (4 km)',
        hoverinfo: 'name'
    };

    // Conveyor support towers (visual detail)
    const numTowers = 8;
    const towerX = [];
    const towerY = [];
    const towerZ = [];
    for (let i = 0; i <= numTowers; i++) {
        const t = i / numTowers;
        towerX.push(islandX + 200 + t * (petralX - islandX - 200));
        towerY.push(islandY + t * (petralY - islandY));
        towerZ.push(0);
        towerX.push(towerX[towerX.length - 1]);
        towerY.push(towerY[towerY.length - 1]);
        towerZ.push(conveyorHeight);
        towerX.push(null); // Break line
        towerY.push(null);
        towerZ.push(null);
    }

    const conveyorTowers = {
        x: towerX,
        y: towerY,
        z: towerZ,
        mode: 'lines',
        type: 'scatter3d',
        line: { color: '#5d4037', width: 4 },
        hoverinfo: 'skip',
        showlegend: false
    };

    // ========================================================================
    // 5. PORT AREA (Petral South Vertex)
    // ========================================================================
    const portZ = 10;

    // 5A. FINGER PIER (Extended rectangle into sea)
    const pierLength = 300;
    const pierWidth = 30;
    const pier = createBox(petralX, petralY - pierLength / 2, portZ, pierWidth, pierLength, 5, '#455a64', 'Finger Pier');

    // 5B. SHIPLOADER (Tower + Boom)
    const shiploaderX = petralX;
    const shiploaderY = petralY - 150;
    const shiploaderTower = createBox(shiploaderX, shiploaderY, portZ, 20, 20, 50, '#ffb300', 'Shiploader Tower');

    const shiploaderBoom = {
        x: [shiploaderX, shiploaderX + 80],
        y: [shiploaderY, shiploaderY - 100],
        z: [portZ + 50, portZ + 20],
        mode: 'lines',
        type: 'scatter3d',
        line: { color: '#e65100', width: 10 },
        name: 'Shiploader Boom',
        hoverinfo: 'name'
    };

    // 5C. CAPE SIZE VESSEL (Simplified hull)
    const vesselX = petralX + 50;
    const vesselY = petralY - 200;
    const vessel = createBox(vesselX, vesselY, 0, 60, 250, 15, '#37474f', 'Cape Size Vessel');

    // ========================================================================
    // 6. LABELS & ANNOTATIONS
    // ========================================================================
    const islandLabel = {
        x: [islandX],
        y: [islandY + 150],
        z: [islandZ + 50],
        mode: 'text',
        type: 'scatter3d',
        text: ['ISLA<br>(Recepción)'],
        textfont: { size: 16, color: '#00d4ff', family: 'Arial Black' },
        textposition: 'top center',
        hoverinfo: 'skip',
        showlegend: false
    };

    const portLabel = {
        x: [petralX],
        y: [petralY + 100],
        z: [portZ + 60],
        mode: 'text',
        type: 'scatter3d',
        text: ['PUERTO<br>PETRAL'],
        textfont: { size: 16, color: '#00d4ff', family: 'Arial Black' },
        textposition: 'top center',
        hoverinfo: 'skip',
        showlegend: false
    };

    // ========================================================================
    // 7. ASSEMBLE ALL TRACES
    // ========================================================================
    const dataPlot = [
        terrainTrace,
        truckDumper,
        rotaryDumper,
        stockpile1,
        stockpile2,
        reclaimer,
        conveyorBelt,
        conveyorTowers,
        pier,
        shiploaderTower,
        shiploaderBoom,
        vessel,
        islandLabel,
        portLabel
    ];

    // ========================================================================
    // 8. LAYOUT CONFIGURATION
    // ========================================================================
    const layout = {
        title: '',
        paper_bgcolor: '#1a1a2e',
        plot_bgcolor: '#1a1a2e',
        font: { family: 'Segoe UI, sans-serif', color: '#fff' },
        scene: {
            aspectmode: 'data',
            xaxis: {
                title: 'Este (m)',
                showgrid: true,
                gridcolor: '#333',
                backgroundcolor: '#1a1a2e'
            },
            yaxis: {
                title: 'Norte (m)',
                showgrid: true,
                gridcolor: '#333',
                backgroundcolor: '#1a1a2e'
            },
            zaxis: {
                title: 'Altitud (m)',
                showgrid: true,
                gridcolor: '#333',
                backgroundcolor: '#1a1a2e'
            },
            camera: {
                eye: { x: -1.5, y: -1.5, z: 1.2 },
                up: { x: 0, y: 0, z: 1 }
            },
            dragmode: 'turntable'
        },
        margin: { t: 0, b: 0, l: 0, r: 0 },
        showlegend: false
    };

    Plotly.newPlot('plot3d', dataPlot, layout, { responsive: true, displayModeBar: true });
});

// ============================================================================
// HELPER FUNCTIONS - 3D GEOMETRY BUILDERS
// ============================================================================

function createBox(cx, cy, cz, width, length, height, color, name) {
    // Create a 3D box centered at (cx, cy, cz)
    const w = width / 2;
    const l = length / 2;
    const h = height;

    return {
        type: 'mesh3d',
        x: [cx - w, cx + w, cx + w, cx - w, cx - w, cx + w, cx + w, cx - w],
        y: [cy - l, cy - l, cy + l, cy + l, cy - l, cy - l, cy + l, cy + l],
        z: [cz, cz, cz, cz, cz + h, cz + h, cz + h, cz + h],
        i: [0, 0, 0, 0, 1, 1, 2, 2, 4, 4, 5, 6],
        j: [1, 2, 3, 4, 2, 5, 3, 6, 5, 7, 6, 7],
        k: [2, 3, 1, 5, 5, 2, 6, 3, 7, 5, 7, 2],
        color: color,
        opacity: 0.9,
        flatshading: true,
        name: name,
        hoverinfo: 'name'
    };
}

function createPyramid(cx, cy, cz, baseWidth, baseLength, height, color, name) {
    // Truncated pyramid (stockpile)
    const w = baseWidth / 2;
    const l = baseLength / 2;
    const topW = w * 0.3;
    const topL = l * 0.3;

    return {
        type: 'mesh3d',
        x: [cx - w, cx + w, cx + w, cx - w, cx - topW, cx + topW, cx + topW, cx - topW],
        y: [cy - l, cy - l, cy + l, cy + l, cy - topL, cy - topL, cy + topL, cy + topL],
        z: [cz, cz, cz, cz, cz + height, cz + height, cz + height, cz + height],
        i: [0, 0, 0, 0, 1, 1, 2, 2, 4, 4, 5, 6],
        j: [1, 2, 3, 4, 2, 5, 3, 6, 5, 7, 6, 7],
        k: [2, 3, 1, 5, 5, 2, 6, 3, 7, 5, 7, 2],
        color: color,
        opacity: 0.85,
        flatshading: true,
        name: name,
        hoverinfo: 'name'
    };
}
