/**
 * Tank Visualizer Component (v2.0)
 * Renders 5 tanks with groupings (3 Base + 2 Buffer)
 * Includes Train and Ship silhouettes with animation states
 */

class TankVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.tanks = [];
        this.trainIcon = null;
        this.shipIcon = null;
        this.trainLabel = null;
        this.shipLabel = null;
        this.shipLogCells = [];
        this.nextLogIndex = 0;
        this.cumulativeExported = 0;
        
        this.init();
        this.initShipLog();
    }

    init() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        this.container.style.alignItems = 'flex-end';
        this.container.style.gap = '15px';
        this.container.style.padding = '40px 20px';
        this.container.style.position = 'relative';

        // 1. Create Train Silhouette (Left)
        this.createTrainIcon();

        // 2. Create 5 Tanks
        for (let i = 1; i <= 5; i++) {
            const isBase = i <= 3;
            const tankWrapper = document.createElement('div');
            tankWrapper.style.display = 'flex';
            tankWrapper.style.flexDirection = 'column';
            tankWrapper.style.alignItems = 'center';

            const tankLabel = document.createElement('span');
            tankLabel.innerText = isBase ? `BASE ${i}` : `BUFFER ${i - 3}`;
            tankLabel.style.fontSize = '9px';
            tankLabel.style.color = isBase ? '#2196F3' : '#F44336';
            tankLabel.style.marginBottom = '5px';
            tankLabel.style.fontWeight = 'bold';

            const tankEl = document.createElement('div');
            tankEl.style.width = '45px';
            tankEl.style.height = '120px';
            tankEl.style.border = `2px solid ${isBase ? '#2196F3' : '#F44336'}`;
            tankEl.style.position = 'relative';
            tankEl.style.background = 'none';
            tankEl.style.borderRadius = '3px';
            tankEl.style.overflow = 'hidden';

            const fillEl = document.createElement('div');
            fillEl.style.width = '100%';
            fillEl.style.height = '0%';
            fillEl.style.background = 'linear-gradient(to top, #4caf50, #81c784)';
            fillEl.style.position = 'absolute';
            fillEl.style.bottom = '0';
            fillEl.style.transition = 'height 0.3s ease-out';
            fillEl.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';

            tankEl.appendChild(fillEl);
            tankWrapper.appendChild(tankLabel);
            tankWrapper.appendChild(tankEl);
            this.container.appendChild(tankWrapper);
            
            // Separador visual después del tanque 3 (Base)
            if (i === 3) {
                const spacer = document.createElement('div');
                spacer.style.width = '40px';
                spacer.style.display = 'flex';
                spacer.style.alignItems = 'center';
                spacer.style.justifyContent = 'center';
                spacer.innerHTML = '<div style="height:100px; border-right:2px dashed rgba(255,255,255,0.1);"></div>';
                this.container.appendChild(spacer);
            }
            
            this.tanks.push(fillEl);
        }

        // 3. Create Ship Silhouette (Right)
        this.createShipIcon();
    }

    createTrainIcon() {
        const wrapper = document.createElement('div');
        wrapper.style.marginRight = '30px';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';

        this.trainLabel = document.createElement('div');
        this.trainLabel.style.fontSize = '12px';
        this.trainLabel.style.color = '#4caf50';
        this.trainLabel.style.fontWeight = 'bold';
        this.trainLabel.style.height = '15px';
        this.trainLabel.innerText = '';
        wrapper.appendChild(this.trainLabel);

        const svg = `
            <svg width="210" height="40" viewBox="0 0 210 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Locomotora Diésel-Eléctrica (Perfil) -->
                <path d="M5 32H45V15H40V12H32V10H15V15H5V32Z" stroke="#546e7a" stroke-width="2"/>
                <rect x="18" y="12" width="12" height="6" stroke="#546e7a" stroke-width="1.2"/> <!-- Ventana -->
                <line x1="10" y1="20" x2="40" y2="20" stroke="#546e7a" stroke-width="1"/>
                <line x1="10" y1="23" x2="40" y2="23" stroke="#546e7a" stroke-width="1"/>
                <line x1="10" y1="26" x2="40" y2="26" stroke="#546e7a" stroke-width="1"/>
                
                <!-- Vagón Tanque 1 -->
                <rect x="55" y="15" width="60" height="15" stroke="#546e7a" stroke-width="2"/>
                <rect id="train-acid-1" x="56" y="16" width="58" height="13" fill="#4caf50" style="transition: height 0.5s; opacity: 0;"/>
                <path d="M55 15C50 15 50 30 55 30" stroke="#546e7a" stroke-width="2"/>
                <path d="M115 15C120 15 120 30 115 30" stroke="#546e7a" stroke-width="2"/>
                <line x1="45" y1="28" x2="55" y2="28" stroke="#546e7a" stroke-width="2"/>
                
                <!-- Vagón Tanque 2 -->
                <rect x="130" y="15" width="60" height="15" stroke="#546e7a" stroke-width="2"/>
                <rect id="train-acid-2" x="131" y="16" width="58" height="13" fill="#4caf50" style="transition: height 0.5s; opacity: 0;"/>
                <path d="M130 15C125 15 125 30 130 30" stroke="#546e7a" stroke-width="2"/>
                <path d="M190 15C195 15 195 30 190 30" stroke="#546e7a" stroke-width="2"/>
                <line x1="120" y1="28" x2="130" y2="28" stroke="#546e7a" stroke-width="2"/>

                <!-- Ruedas (Bogies) -->
                <circle cx="12" cy="34" r="3" fill="#546e7a"/>
                <circle cx="20" cy="34" r="3" fill="#546e7a"/>
                <circle cx="37" cy="34" r="3" fill="#546e7a"/>
                
                <!-- Ruedas Vagón 1 -->
                <circle cx="65" cy="34" r="3" fill="#546e7a"/>
                <circle cx="73" cy="34" r="3" fill="#546e7a"/>
                <circle cx="105" cy="34" r="3" fill="#546e7a"/>
                <circle cx="113" cy="34" r="3" fill="#546e7a"/>

                <!-- Ruedas Vagón 2 -->
                <circle cx="140" cy="34" r="3" fill="#546e7a"/>
                <circle cx="148" cy="34" r="3" fill="#546e7a"/>
                <circle cx="180" cy="34" r="3" fill="#546e7a"/>
                <circle cx="188" cy="34" r="3" fill="#546e7a"/>
            </svg>`;
        
        const iconDiv = document.createElement('div');
        iconDiv.style.width = '210px';
        iconDiv.innerHTML = svg;
        this.trainIcons = iconDiv.querySelectorAll('path, rect:not([id^="train-acid"]), circle, line');
        this.trainAcid = iconDiv.querySelectorAll('[id^="train-acid"]');
        wrapper.appendChild(iconDiv);

        const text = document.createElement('span');
        text.innerText = 'TREN';
        text.style.fontSize = '10px';
        text.style.color = '#94a3b8';
        wrapper.appendChild(text);

        this.container.insertBefore(wrapper, this.container.firstChild);
    }

    createShipIcon() {
        const wrapper = document.createElement('div');
        wrapper.style.marginLeft = '30px';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';

        this.shipLabel = document.createElement('div');
        this.shipLabel.style.fontSize = '12px';
        this.shipLabel.style.color = '#00bcd4';
        this.shipLabel.style.fontWeight = 'bold';
        this.shipLabel.style.height = '15px';
        this.shipLabel.innerText = '';
        wrapper.appendChild(this.shipLabel);

        const svg = `
            <svg width="150" height="40" viewBox="0 0 150 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Casco del Buque Tanquero -->
                <path id="ship-path" d="M10 25L20 35H130L145 25V20H10V25Z" stroke="#90caf9" stroke-width="2" stroke-linejoin="round"/>
                <!-- Superestructura (Puente) -->
                <rect x="105" y="10" width="20" height="10" stroke="#90caf9" stroke-width="2"/>
                <rect x="110" y="5" width="10" height="5" stroke="#90caf9" stroke-width="2"/>
                <!-- Cubierta y Tuberías -->
                <line x1="20" y1="20" x2="100" y2="20" stroke="#90caf9" stroke-width="2"/>
            </svg>`;
        
        const iconDiv = document.createElement('div');
        iconDiv.style.width = '150px';
        iconDiv.innerHTML = svg;
        // Seleccionamos todos los elementos para iluminarlos
        this.shipIcons = iconDiv.querySelectorAll('path, rect, line');
        wrapper.appendChild(iconDiv);

        const text = document.createElement('span');
        text.innerText = 'BUQUE';
        text.style.fontSize = '10px';
        text.style.color = '#94a3b8';
        wrapper.appendChild(text);

        this.container.appendChild(wrapper);
    }

    initShipLog() {
        const grid = document.getElementById('ship-log-grid');
        if (!grid) return;
        grid.innerHTML = '';
        this.shipLogCells = [];
        this.nextLogIndex = 0;
        this.cumulativeExported = 0;

        for (let i = 0; i < 48; i++) {
            const cell = document.createElement('div');
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.fontSize = '10px';
            cell.style.color = '#94a3b8';
            cell.style.fontFamily = 'Orbitron';
            cell.style.background = 'rgba(255,255,255,0.02)';
            cell.innerText = '';
            grid.appendChild(cell);
            this.shipLogCells.push(cell);
        }
    }

    resetLog() {
        this.shipLogCells.forEach(cell => {
            cell.innerText = '';
            cell.style.background = 'rgba(255,255,255,0.02)';
            cell.style.color = '#94a3b8';
        });
        this.nextLogIndex = 0;
        this.cumulativeExported = 0;
    }

    /**
     * Updates visual state for a specific day
     * @param {Object} dayData - Data including inventory, supply and dispatch
     */
    updateState(dayData) {
        const totalInventory = dayData.inventory;
        const capacityPerTank = 6256;
        
        // 1. Update Tank Levels
        for (let i = 0; i < 5; i++) {
            const tankStart = i * capacityPerTank;
            let tankLevel = 0;
            
            if (totalInventory > tankStart) {
                tankLevel = Math.min(100, ((totalInventory - tankStart) / capacityPerTank) * 100);
            }
            this.tanks[i].style.height = `${tankLevel}%`;
        }

        // 2. Update Train Icons (Suministro)
        if (dayData.supply > 0) {
            this.trainIcons.forEach(el => {
                el.style.stroke = '#4caf50';
                if (el.tagName === 'circle') el.style.fill = '#4caf50';
            });
            // Visual rápido de vagon lleno y vacío
            this.trainAcid.forEach(rect => {
                rect.style.opacity = '1';
                rect.style.height = '13px';
                setTimeout(() => { rect.style.height = '0px'; }, 200);
            });
            this.trainLabel.innerText = `+${dayData.supply}`;
        } else {
            this.trainIcons.forEach(el => {
                el.style.stroke = '#546e7a';
                if (el.tagName === 'circle') el.style.fill = '#546e7a';
            });
            this.trainAcid.forEach(rect => { rect.style.opacity = '0'; });
            this.trainLabel.innerText = '';
        }

        // 3. Update Ship Icons and Log (Despacho)
        if (dayData.dispatch > 0) {
            this.cumulativeExported += dayData.dispatch;
            
            this.shipIcons.forEach(el => {
                el.style.stroke = '#00bcd4';
                el.style.filter = 'drop-shadow(0 0 8px #00bcd4)';
            });
            this.shipLabel.innerText = `-${dayData.dispatch}`;

            // Registrar en bitácora (Par Día / Volumen)
            if (this.nextLogIndex < 24) {
                let dayCellIdx, volCellIdx;
                
                if (this.nextLogIndex < 12) {
                    // Primer bloque (Filas 1 y 2)
                    dayCellIdx = this.nextLogIndex;
                    volCellIdx = this.nextLogIndex + 12;
                } else {
                    // Segundo bloque (Filas 3 y 4)
                    dayCellIdx = this.nextLogIndex + 12; // Salta la fila 2 de volumen
                    volCellIdx = dayCellIdx + 12;
                }

                const dayCell = this.shipLogCells[dayCellIdx];
                const volCell = this.shipLogCells[volCellIdx];

                dayCell.innerText = `D${dayData.day}`;
                dayCell.style.color = '#00bcd4';
                dayCell.style.background = 'rgba(0, 188, 212, 0.1)';

                volCell.innerText = Math.round(this.cumulativeExported).toLocaleString();
                volCell.style.color = '#4caf50';
                volCell.style.fontSize = '9px'; 

                this.nextLogIndex++;
            }
        } else {
            this.shipIcons.forEach(el => {
                el.style.stroke = '#90caf9';
                el.style.filter = 'none';
            });
            this.shipLabel.innerText = '';
        }
    }
}

window.TankVisualizer = TankVisualizer;
