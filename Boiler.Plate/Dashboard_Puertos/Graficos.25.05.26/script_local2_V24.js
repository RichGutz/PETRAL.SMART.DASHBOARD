// ==============================================================================
// SCRIPT DE PERSONALIZACIÓN LOCAL - GRÁFICO 2 (TRIÁNGULO PETRAL)
// Ubicación: C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Graficos.25.05.26\script_local2_V24.js
//
// AISLAMIENTO TOTAL: Solo cargado por grafico2.html. Dashboard de producción intacto.
// ==============================================================================

console.log("🔄 [G2] Iniciando personalización Gráfico 2 (Versión 24)...");

if (typeof CONFIG === 'undefined') {
    console.error("❌ Error crítico: script.js no cargado antes que script_local2.js.");
} else {

    CONFIG.initialCenter = [-15.183, -75.248];
    CONFIG.initialZoom = 13;

    for (const portCode in PORT_CONFIG) { delete PORT_CONFIG[portCode]; }
    if (typeof ports !== 'undefined') ports.length = 0;
    if (typeof MINING_PROJECTS !== 'undefined') MINING_PROJECTS.length = 0;

    window.renderPorts = function() { console.log("✅ [G2] renderPorts override: sin puertos."); };
    window.renderIC821Full = function() { console.log("🚫 [G2] IC821 interceptado."); };

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log("🎬 [G2] Post-init V24...");

            // Ocultar paneles originales
            ['port-filter-ribbon', 'layer-controls-panel', 'port-details'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.setProperty('display', 'none', 'important');
            });

            // Panel Plano/Satélite
            if (!document.getElementById('mapTypeControl')) {
                const ctrl = document.createElement('div');
                ctrl.id = 'mapTypeControl';
                ctrl.className = 'glass-panel';
                ctrl.style.cssText = 'position:absolute; bottom:25px; left:20px; z-index:1000; padding:10px; display:flex; gap:8px; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.5);';
                ctrl.innerHTML = `
                    <button class="btn-control active" id="local-btn-standard" style="padding:6px 12px; font-size:11px; font-weight:bold; cursor:pointer;"
                        onclick="if(typeof setMapType==='function') setMapType('standard'); document.getElementById('local-btn-standard').classList.add('active'); document.getElementById('local-btn-satellite').classList.remove('active');">Plano</button>
                    <button class="btn-control" id="local-btn-satellite" style="padding:6px 12px; font-size:11px; font-weight:bold; cursor:pointer;"
                        onclick="if(typeof setMapType==='function') setMapType('satellite'); document.getElementById('local-btn-satellite').classList.add('active'); document.getElementById('local-btn-standard').classList.remove('active');">Satélite</button>
                    <button class="btn-control" style="padding:6px 12px; font-size:11px; font-weight:bold; cursor:pointer; color:#00e676; border-color:#00e676;"
                        onclick="if(typeof window.downloadMapHD === 'function') window.downloadMapHD();">📸 EXPORTAR HD</button>
                `;
                document.body.appendChild(ctrl);
            }

            // Eliminar polígonos de departamentos
            if (typeof map !== 'undefined') {
                map.eachLayer(layer => {
                    if (layer.feature && layer.feature.properties && layer.feature.properties.NOMBDEP) {
                        map.removeLayer(layer);
                    }
                });
            }

            // Eliminar etiqueta antigua del perímetro
            if (typeof map !== 'undefined' && window.perimeterLabelsLayer) {
                map.removeLayer(window.perimeterLabelsLayer);
            }

            // Activar capas necesarias
            ['toggle-perimeter', 'toggle-area-acuatica', 'toggle-area-riberena', 'toggle-railway'].forEach(id => {
                const cb = document.getElementById(id);
                if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change')); }
            });

            const activeRoutesLayer = L.layerGroup().addTo(map);

            function addLeaderLabel(text, color, anchorPos, orientation, customLineLength = 25) {
                let anchor, iconSize, iconHtml;
                // display: inline-block en lugar de width: max-content para evitar recortes. 
                // Aumento agresivo de padding horizontal para compensar el bug de html-to-image
                const textStyle = `background:rgba(10,15,30,0.9); color:#ffffff; border:1.5px solid ${color}; padding:7px 24px 5px 24px; font-size:17px; text-transform:uppercase; border-radius:4px; display:inline-block; text-align:center; font-family:Arial, Helvetica, sans-serif; font-weight:bold; white-space:nowrap; line-height:1.1;`;

                if (orientation === 'bottom') {
                    iconSize = [350, 75]; anchor = [175, 0];
                    iconHtml = `<div style="display:flex; flex-direction:column; align-items:center; width:350px; height:75px; justify-content:flex-start; pointer-events:none;">
                        <div style="width:6px; height:6px; border-radius:50%; background-color:${color}; border:1px solid #fff;"></div>
                        <div style="width:1px; height:${customLineLength}px; background-color:${color};"></div>
                        <div style="${textStyle}">${text}</div></div>`;
                } else if (orientation === 'left') {
                    iconSize = [350, 40]; anchor = [350, 20];
                    iconHtml = `<div style="display:flex; flex-direction:row; align-items:center; width:350px; height:40px; justify-content:flex-end; pointer-events:none;">
                        <div style="${textStyle} margin-right:0;">${text}</div>
                        <div style="width:${customLineLength}px; height:1px; background-color:${color};"></div>
                        <div style="width:6px; height:6px; border-radius:50%; background-color:${color}; border:1px solid #fff; flex-shrink:0;"></div></div>`;
                } else if (orientation === 'left-up-30') {
                    iconSize = [350, 40]; anchor = [350, 20];
                    iconHtml = `<div style="display:flex; flex-direction:row; align-items:center; width:350px; height:40px; justify-content:flex-end; pointer-events:none; transform: rotate(30deg); transform-origin: right center;">
                        <div style="${textStyle} margin-right:0; transform: rotate(-30deg); transform-origin: right center;">${text}</div>
                        <div style="width:${customLineLength}px; height:1px; background-color:${color};"></div>
                        <div style="width:6px; height:6px; border-radius:50%; background-color:${color}; border:1px solid #fff; flex-shrink:0;"></div></div>`;
                } else if (orientation === 'right') {
                    iconSize = [350, 40]; anchor = [0, 20];
                    iconHtml = `<div style="display:flex; flex-direction:row; align-items:center; width:350px; height:40px; justify-content:flex-start; pointer-events:none;">
                        <div style="width:6px; height:6px; border-radius:50%; background-color:${color}; border:1px solid #fff; flex-shrink:0;"></div>
                        <div style="width:${customLineLength}px; height:1px; background-color:${color};"></div>
                        <div style="${textStyle} margin-left:0;">${text}</div></div>`;
                } else {
                    iconSize = [350, 75]; anchor = [175, 75];
                    iconHtml = `<div style="display:flex; flex-direction:column; align-items:center; width:350px; height:75px; justify-content:flex-end; pointer-events:none;">
                        <div style="${textStyle}">${text}</div>
                        <div style="width:1px; height:${customLineLength}px; background-color:${color};"></div>
                        <div style="width:6px; height:6px; border-radius:50%; background-color:${color}; border:1px solid #fff;"></div></div>`;
                }

                L.marker(anchorPos, {
                    icon: L.divIcon({ className: 'custom-leader-icon', html: iconHtml, iconSize, iconAnchor: anchor }),
                    interactive: false
                }).addTo(activeRoutesLayer);
            }

            // Etiquetas del mapa
            addLeaderLabel("Panamericana Sur", "#ffc107", [-15.13957, -74.98161], 'left');
            addLeaderLabel("Carretera San Juan<br>de Marcona", "#9c27b0", [-15.246758, -75.034561], 'right', 49);
            addLeaderLabel("Futuro Ferrocarril<br>Marcona-Andahuaylas", "#000000", [-15.348755, -75.151978], 'left-up-30', 60);
            addLeaderLabel("SAN JUAN DE MARCONA", "#000000", [-15.364977, -75.166740], 'left', 90);
            addLeaderLabel("TERMINAL SHOUGANG", "#000000", [-15.256695, -75.240898], 'left', 90);
            addLeaderLabel("ÁREA MARÍTIMA", "#00bcd4", [-15.19356, -75.25584], 'left');
            addLeaderLabel("IC821", "#4caf50", [-15.229368, -75.216179], 'right');
            addLeaderLabel("TERMINAL PETRAL", "#00bcd4", [-15.165498, -75.256951], 'right');

            // ==========================================================================
            // BURBUJA SAN NICOLÁS — V20
            // Posición: misma latitud que ÁREA MARÍTIMA (~-15.194) pero más al Oeste (~-75.290)
            //   → queda VISUALMENTE a la IZQUIERDA del texto de la etiqueta ÁREA MARÍTIMA
            // Estilo: fondo blanco, contenido centrado, width fit-content, sin nombre ni ruta
            // iconAnchor = [0, 40] → el punto de anclaje toca el borde DERECHO del icono
            //   → la burbuja se despliega hacia la izquierda del punto de anclaje
            // ==========================================================================
            const sanNicolasIcon = L.divIcon({
                className: '',
                html: `
                    <div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        background: #ffffff;
                        border: 1px solid rgba(0,0,0,0.15);
                        border-radius: 8px;
                        padding: 8px 16px;
                        width: 250px;
                        height: 95px;
                        box-sizing: border-box;
                        font-family: Arial, Helvetica, sans-serif;
                        gap: 2px;
                        pointer-events: none;
                        white-space: nowrap;
                    ">
                        <!-- Fila 1: Barco + Calado + Max DWT (centrado) -->
                        <div style="display:flex; align-items:center; gap:8px; justify-content:center;">
                            <div style="font-size:48px; line-height:1;">🚢</div>
                            <div style="display:flex; flex-direction:column; align-items:center; line-height:1.2;">
                                <span style="font-size:14px; color:#546e7a;">Calado</span>
                                <span style="font-size:20px; color:#101520; font-weight:700;">18m</span>
                            </div>
                            <div style="color:rgba(0,0,0,0.15); font-size:22px;">|</div>
                            <div style="display:flex; flex-direction:column; align-items:center; line-height:1.2;">
                                <span style="font-size:14px; color:#546e7a;">Max DWT</span>
                                <span style="font-size:20px; color:#101520; font-weight:700;">300k</span>
                            </div>
                        </div>
                        <!-- Fila 2: Tipo de buque (centrado) -->
                        <div style="
                            font-size: 16px;
                            color: #00838f;
                            font-weight: 700;
                            letter-spacing: 0.7px;
                            text-align: center;
                            width: 100%;
                        ">CAPESIZE</div>
                    </div>
                `,
                // iconSize dinámico: usamos tamaño approx. para que Leaflet lo posicione
                iconSize: [250, 95],
                // iconAnchor al centro exacto [ancho/2, alto/2]
                iconAnchor: [125, 47]
            });

            // Coordenada de anclaje: centrada según solicitud
            L.marker([-15.221583, -75.283127], { icon: sanNicolasIcon }).addTo(activeRoutesLayer);
            console.log("⚓ [G2-V24] Burbuja San Nicolás reposicionada y centrada sin sombra.");

            // Rutas OSRM
            const osrmUrl = 'https://router.project-osrm.org/route/v1/driving/-73.252020,-13.806910;-75.2400,-15.2600?overview=full&geometries=geojson&steps=true';
            fetch(osrmUrl)
                .then(r => r.json())
                .then(data => {
                    if (data.code === 'Ok' && data.routes.length > 0) {
                        let coords = data.routes[0].geometry.coordinates;

                        // Corte en el extremo oeste para la carretera San Juan de Marcona
                        const cutLon = -75.145261, cutLat = -15.350162;
                        let cutIdx = coords.length - 1;
                        let minCutDist = Infinity;
                        for (let i = 0; i < coords.length; i++) {
                            const d = Math.hypot(coords[i][0] - cutLon, coords[i][1] - cutLat);
                            if (d < minCutDist) { minCutDist = d; cutIdx = i; }
                        }
                        coords = coords.slice(0, cutIdx + 1);

                        let idx1S = -1, minD1S = Infinity;
                        for (let i = 0; i < coords.length; i++) {
                            const d = Math.hypot(coords[i][0] - (-74.91329), coords[i][1] - (-14.84671));
                            if (d < minD1S) { minD1S = d; idx1S = i; }
                        }
                        let idxMarcona = -1, minDMarcona = Infinity;
                        for (let i = 0; i < coords.length; i++) {
                            const d = Math.hypot(coords[i][0] - (-74.97555), coords[i][1] - (-15.13951));
                            if (d < minDMarcona) { minDMarcona = d; idxMarcona = i; }
                        }
                        const start = Math.min(idxMarcona, idx1S);
                        const end   = Math.max(idxMarcona, idx1S);
                        L.geoJSON({ type: 'LineString', coordinates: coords.slice(start, end + 1) },
                            { style: { color: '#ffc107', weight: 5, opacity: 0.9, lineCap: 'round' } }).addTo(activeRoutesLayer);
                        L.geoJSON({ type: 'LineString', coordinates: coords.slice(end) },
                            { style: { color: '#9c27b0', weight: 5, opacity: 0.9, lineCap: 'round' } }).addTo(activeRoutesLayer);
                    }
                })
                .catch(e => console.error("Error OSRM:", e));

            // IC-821 cortada en ambos extremos
            if (typeof LAYER_IC821_FULL_GEOJSON !== 'undefined') {
                let coords = LAYER_IC821_FULL_GEOJSON.features[0].geometry.coordinates;
                
                // Punto de corte NORTE (realizado en V18)
                const nLon = -75.238345, nLat = -15.196893;
                let nIdx = 0, minNDist = Infinity;
                
                // Punto de corte SUR (nuevo)
                const sLon = -75.145283, sLat = -15.350121;
                let sIdx = coords.length - 1, minSDist = Infinity;
                
                for (let i = 0; i < coords.length; i++) {
                    const dN = Math.hypot(coords[i][0] - nLon, coords[i][1] - nLat);
                    if (dN < minNDist) { minNDist = dN; nIdx = i; }
                    
                    const dS = Math.hypot(coords[i][0] - sLon, coords[i][1] - sLat);
                    if (dS < minSDist) { minSDist = dS; sIdx = i; }
                }
                
                const startIdx = Math.min(nIdx, sIdx);
                const endIdx = Math.max(nIdx, sIdx);
                
                L.geoJSON({
                    type: "FeatureCollection",
                    features: [{ type: "Feature", geometry: { type: "LineString", coordinates: coords.slice(startIdx, endIdx + 1) } }]
                }, { style: { color: '#4caf50', weight: 4, opacity: 0.9, lineCap: 'round' } }).addTo(activeRoutesLayer);
            }

            // Polígono achurado
            if (!document.getElementById('svg-hatch-pattern')) {
                document.body.insertAdjacentHTML('beforeend', `
                <svg id="svg-hatch-pattern" height="0" width="0">
                  <defs>
                    <pattern id="hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#ff9800" stroke-width="3" opacity="0.8"/>
                    </pattern>
                  </defs>
                </svg>`);
            }
            L.polygon([
                [-15.172534, -75.268254], [-15.165498, -75.256951],
                [-15.181578, -75.247416], [-15.180563, -75.253777],
                [-15.182606, -75.256034]
            ], { fillColor: 'url(#hatch)', fillOpacity: 1, color: '#ff9800', weight: 2, dashArray: '4,4' }).addTo(map);

            // ==========================================================================
            // UTILIDAD: Captura de Coordenadas al Clic
            // ==========================================================================
            if (typeof map !== 'undefined') {
                map.on('click', function(e) {
                    const lat = e.latlng.lat.toFixed(6);
                    const lng = e.latlng.lng.toFixed(6);
                    const coordStr = `${lat}, ${lng}`;
                    console.log("📍 Coordenadas:", coordStr);
                    
                    // Mostrar un popup temporal y tratar de copiar al portapapeles
                    L.popup()
                        .setLatLng(e.latlng)
                        .setContent(`<div style="text-align:center; font-family:Arial, Helvetica, sans-serif;">
                            <b style="color:#2196f3; font-size:14px;">📍 Coordenadas</b><br>
                            <span style="font-size:12px; user-select:all;">${coordStr}</span><br>
                            <span style="font-size:9px; color:#777;">(Puedes copiarlas)</span>
                        </div>`)
                        .openOn(map);
                        
                    // Copiar automáticamente al portapapeles
                    if(navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(coordStr).catch(err => console.error("Error copiando coords", err));
                    }
                });
            }

        }, 1500);
    });

    // ==========================================================================
    // UTILIDAD: Exportación HD con html2canvas
    // ==========================================================================
    window.downloadMapHD = function(event) {
        console.log("📸 [G2] Iniciando captura de pantalla HD...");
        
        if (typeof htmlToImage === 'undefined') {
            alert("Error: La librería de captura no se ha cargado todavía. Espera unos segundos e intenta de nuevo.");
            return;
        }

        const btn = event && event.target ? event.target : document.querySelector('button[onclick*="downloadMapHD"]');
        const originalText = btn ? btn.innerText : "📸 EXPORTAR HD";
        if (btn) {
            btn.innerText = "⏳ GENERANDO (Puede tardar)...";
            btn.style.opacity = "0.7";
            btn.disabled = true;
        }

        // Se usa pixelRatio: 3 para alta definición 3x
        htmlToImage.toPng(document.body, {
            pixelRatio: 3, 
            backgroundColor: "#1a1a2e"
        }).then(dataUrl => {
            console.log("✅ [G2] Captura HD generada. Descargando...");
            const link = document.createElement('a');
            link.download = 'Mapa_Petral_HD_V22.png';
            link.href = dataUrl;
            link.click();
        }).catch(err => {
            console.error("❌ Error generando la captura HD:", err);
            alert("Hubo un error al generar la imagen. Intenta alejar el zoom un poco antes de capturar.");
        }).finally(() => {
            if (btn) {
                btn.innerText = originalText;
                btn.style.opacity = "1";
                btn.disabled = false;
            }
        });
    };

    console.log("✅ [G2] Configuración V24 cargada.");
}
