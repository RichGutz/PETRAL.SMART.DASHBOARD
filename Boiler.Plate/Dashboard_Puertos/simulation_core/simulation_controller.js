/**
 * Simulation Controller
 * Binds the UI to the MonteCarloEngine and TankVisualizer
 */

class SimulationController {
    constructor() {
        this.engine = new MonteCarloEngine();
        this.visualizer = new TankVisualizer('tank-container');
        this.isPlaybackRunning = false;
        this.playbackDay = 0;
        this.simulationResult = null;
        
        this.init();
    }

    init() {
        // Bind Sliders
        this.bindSlider('sim-wagons', 'val-wagons', (val) => {
            this.engine.updateParams({ trainWagonsPerDay: parseInt(val) });
            this.runMonteCarlo();
        });

        this.bindSlider('sim-freq', 'val-freq', (val) => {
            this.engine.updateParams({ avgShipIntervalDays: parseInt(val) });
            this.runMonteCarlo();
        });

        this.bindSlider('sim-var', 'val-var', (val) => {
            this.engine.updateParams({ shipIntervalStdDev: parseInt(val) });
            this.runMonteCarlo();
        });

        this.bindSlider('sim-days', 'val-days', (val) => {
            this.engine.updateParams({ daysPerWeek: parseInt(val) });
            this.runMonteCarlo();
        });

        // Bind Visual Distribution Selector
        const distOptions = document.querySelectorAll('.dist-option');
        distOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                // UI: Update active class
                distOptions.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                
                // Engine: Update distribution
                const distType = opt.getAttribute('data-dist');
                this.engine.updateParams({ distributionType: distType });
                this.runMonteCarlo();
            });
        });

        // Run initial simulation
        this.runMonteCarlo();
    }

    bindSlider(id, valId, onChange) {
        const slider = document.getElementById(id);
        const display = document.getElementById(valId);
        if (slider && display) {
            slider.addEventListener('input', (e) => {
                display.innerText = e.target.value;
                onChange(e.target.value);
            });
        }
    }

    runMonteCarlo() {
        // 1. Run probabilistic simulation (1000 iterations)
        this.mcResult = this.engine.runMonteCarlo(1000);
        
        // Clear KPIs to generate "suspense"
        this.clearKPIs();

        // 2. Run one full year for visualization
        this.simulationResult = this.engine.runYearSimulation();
        
        // Reset playback to day 1
        this.stopPlayback();
        this.visualizer.updateState(this.simulationResult.dailyData[0]);
    }

    clearKPIs() {
        const riskEl = document.getElementById('kpi-risk');
        const stopEl = document.getElementById('kpi-stoppage');
        const rotBaseEl = document.getElementById('kpi-rot-base');
        const rotBufferEl = document.getElementById('kpi-rot-buffer');

        if (riskEl) { riskEl.innerText = '---'; riskEl.style.color = '#94a3b8'; }
        if (stopEl) stopEl.innerText = '---';
        if (rotBaseEl) rotBaseEl.innerText = '---';
        if (rotBufferEl) rotBufferEl.innerText = '---';
        
        const totalVolEl = document.getElementById('kpi-total-volume');
        if (totalVolEl) totalVolEl.innerText = '0';
    }

    updateKPIs(res) {
        if (!res) return;
        const riskEl = document.getElementById('kpi-risk');
        const stopEl = document.getElementById('kpi-stoppage');
        const rotBaseEl = document.getElementById('kpi-rot-base');
        const rotBufferEl = document.getElementById('kpi-rot-buffer');
        
        if (riskEl) {
            riskEl.innerText = `${res.avgRisk.toFixed(1)}%`;
            riskEl.style.color = res.avgRisk > 10 ? '#f44336' : (res.avgRisk > 5 ? '#ff9800' : '#4caf50');
        }
        if (stopEl) {
            stopEl.innerText = `${res.avgStoppageDays.toFixed(1)} días/año`;
        }
        if (rotBaseEl) {
            rotBaseEl.innerText = `${res.rotBase.toFixed(2)}x`;
        }
        if (rotBufferEl) {
            rotBufferEl.innerText = `${res.rotBuffer.toFixed(2)}x`;
        }
    }

    togglePlayback() {
        if (this.isPlaybackRunning) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }

    startPlayback() {
        if (!this.simulationResult) return;
        this.clearKPIs(); 
        this.visualizer.resetLog(); // Clear the ship arrival log
        this.isPlaybackRunning = true;
        this.playbackDay = 0;
        document.getElementById('btn-play-sim').innerText = '⏸ PAUSAR';
        
        const step = () => {
            if (!this.isPlaybackRunning) return;
            
            const dayData = this.simulationResult.dailyData[this.playbackDay];
            this.visualizer.updateState(dayData);
            document.getElementById('sim-current-day').innerText = `Día: ${dayData.day}`;
            document.getElementById('sim-current-stock').innerText = `${Math.round(dayData.inventory).toLocaleString()} MT`;

            // Update Real-time Throughput Box
            const totalVolEl = document.getElementById('kpi-total-volume');
            if (totalVolEl) {
                totalVolEl.innerText = Math.round(this.visualizer.cumulativeExported).toLocaleString();
            }

            this.playbackDay++;
            if (this.playbackDay < 365) {
                // Pause for 1 second if a ship is loading (dispatch > 0)
                const delay = dayData.dispatch > 0 ? 1000 : 150;
                setTimeout(step, delay);
            } else {
                this.stopPlayback();
            }
        };
        step();
    }

    stopPlayback() {
        this.isPlaybackRunning = false;
        document.getElementById('btn-play-sim').innerText = '▶ SIMULAR AÑO';
        
        // Reveal KPIs when playback ends
        if (this.playbackDay >= 364) {
            this.updateKPIs(this.mcResult);
        }
    }
}

// Global instance
window.simulationController = null;

function initSimulation() {
    if (!window.simulationController) {
        window.simulationController = new SimulationController();
    }
}
