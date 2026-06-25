/**
 * Monte Carlo Simulation Engine for Project TANK
 * Focus: Logistical Mass Balance (Inventory "Breathing")
 * No financial metrics.
 */

class MonteCarloEngine {
    constructor() {
        // Constants based on DQM Analysis
        this.TANK_CAPACITY_MT = 6256; // 3400 m3 * 1.84 density
        this.NUM_BASE_TANKS = 3;
        this.NUM_BUFFER_TANKS = 2;
        this.TOTAL_CAPACITY_MT = (this.NUM_BASE_TANKS + this.NUM_BUFFER_TANKS) * this.TANK_CAPACITY_MT;
        this.BASE_CAPACITY_MT = this.NUM_BASE_TANKS * this.TANK_CAPACITY_MT;
        this.BUFFER_CAPACITY_MT = this.NUM_BUFFER_TANKS * this.TANK_CAPACITY_MT;
        
        // Simulation Parameters (Defaults)
        this.params = {
            trainWagonsPerDay: 10,      // Default
            trainCapacityMT: 80,        // 80 TM per wagon
            daysPerWeek: 7,             // Operation 24/7
            shipBatchMT: 16000,         // Ship load size
            avgShipIntervalDays: 14,    // Average frequency
            shipIntervalStdDev: 3,      // Variability
            distributionType: 'normal'  // New: normal, uniform, exponential
        };
    }

    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
    }

    /**
     * Generates a random value based on Normal Distribution (Box-Muller transform)
     */
    randomNormal(mean, stdDev) {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return num * stdDev + mean;
    }

    /**
     * Helper to get random interval based on selected distribution
     */
    getRandomInterval() {
        const { avgShipIntervalDays, shipIntervalStdDev, distributionType } = this.params;
        
        switch (distributionType) {
            case 'uniform':
                // Rango entre media - desviacion y media + desviacion
                const min = Math.max(2, avgShipIntervalDays - shipIntervalStdDev);
                const max = avgShipIntervalDays + shipIntervalStdDev;
                return Math.random() * (max - min) + min;
            
            case 'exponential':
                // Media = 1/lambda -> interval = -ln(U) * mean
                return -Math.log(Math.random()) * avgShipIntervalDays;
            
            case 'chi':
                // Chi-squared approximation (Sum of squares of normals)
                // Using 4 degrees of freedom scaled to mean
                let sumZ2 = 0;
                for(let i=0; i<4; i++) {
                    let z = this.randomNormal(0, 1);
                    sumZ2 += z*z;
                }
                return (sumZ2 / 4) * avgShipIntervalDays;

            case 'weibull':
                // Standard Weibull: scale=mean, shape=2 (Rayleigh-like)
                const k = 2.0; 
                const lambda = avgShipIntervalDays / Math.gamma ? Math.gamma(1 + 1/k) : avgShipIntervalDays * 0.886; 
                return lambda * Math.pow(-Math.log(Math.random()), 1/k);

            case 'triangular':
                // Min = Mean - Var, Max = Mean + Var, Mode = Mean
                const a = Math.max(2, avgShipIntervalDays - shipIntervalStdDev);
                const b = avgShipIntervalDays + shipIntervalStdDev;
                const c = avgShipIntervalDays;
                const F = (c - a) / (b - a);
                const u = Math.random();
                if (u < F) return a + Math.sqrt(u * (b - a) * (c - a));
                return b - Math.sqrt((1 - u) * (b - a) * (b - c));
            
            case 'normal':
            default:
                return this.randomNormal(avgShipIntervalDays, shipIntervalStdDev);
        }
    }

    /**
     * Runs a single 365-day simulation
     * Returns an array of daily states
     */
    runYearSimulation() {
        let dailyData = [];
        let currentInventory = 0;
        let plantStoppageDays = 0;
        let baseThroughput = 0;
        let bufferThroughput = 0;
        
        // Schedule first ship
        let nextShipArrivalDay = Math.max(1, Math.round(this.getRandomInterval()));

        for (let day = 1; day <= 365; day++) {
            let supply = 0;
            let dispatch = 0;

            // 1. Dispatch (Ship) - First to create space
            if (day === nextShipArrivalDay) {
                if (currentInventory >= this.params.shipBatchMT) {
                    dispatch = this.params.shipBatchMT;
                    // Schedule next ship
                    let interval = Math.max(2, this.getRandomInterval());
                    nextShipArrivalDay = day + Math.round(interval);
                } else {
                    // Ship waits in port (No dispatch today, try again tomorrow)
                    nextShipArrivalDay = day + 1; 
                }
            }

            // 2. Supply (Train)
            let isOperationalDay = true;
            let dayOfWeek = day % 7; 
            
            if (this.params.daysPerWeek === 5) {
                if (dayOfWeek === 0 || dayOfWeek === 6) isOperationalDay = false;
            } else if (this.params.daysPerWeek === 6) {
                if (dayOfWeek === 0) isOperationalDay = false;
            }

            if (isOperationalDay) {
                supply = this.params.trainWagonsPerDay * this.params.trainCapacityMT;
            }

            // 3. Mass Balance & Group Throughput Tracking
            // Since dispatch happened first, currentInventory is lower now
            let tempInventoryForTracking = currentInventory - dispatch;
            if (tempInventoryForTracking < 0) tempInventoryForTracking = 0;

            if (supply > 0) {
                if (tempInventoryForTracking < this.BASE_CAPACITY_MT) {
                    let spaceInBase = this.BASE_CAPACITY_MT - tempInventoryForTracking;
                    let toBase = Math.min(supply, spaceInBase);
                    let toBuffer = Math.max(0, supply - toBase);
                    baseThroughput += toBase;
                    bufferThroughput += toBuffer;
                } else {
                    bufferThroughput += supply;
                }
            }

            currentInventory += supply - dispatch;

            // 4. Constraints
            if (currentInventory > this.TOTAL_CAPACITY_MT) {
                plantStoppageDays++;
                currentInventory = this.TOTAL_CAPACITY_MT; // Cap at max
            }
            if (currentInventory < 0) currentInventory = 0;

            // 5. Save state
            dailyData.push({
                day: day,
                inventory: currentInventory,
                supply: supply,
                dispatch: dispatch,
                isSaturated: currentInventory >= this.TOTAL_CAPACITY_MT
            });
        }

        return {
            dailyData,
            stats: {
                plantStoppageDays,
                saturationRisk: (plantStoppageDays / 365) * 100,
                totalThroughput: dailyData.reduce((acc, d) => acc + d.supply, 0),
                baseThroughput,
                bufferThroughput
            }
        };
    }

    /**
     * Runs Monte Carlo (N iterations) to calculate probabilities
     */
    runMonteCarlo(iterations = 1000) {
        let totalStoppageDays = 0;
        let risks = [];
        let throughputs = [];
        let baseTps = [];
        let bufferTps = [];

        for (let i = 0; i < iterations; i++) {
            let result = this.runYearSimulation();
            totalStoppageDays += result.stats.plantStoppageDays;
            risks.push(result.stats.saturationRisk);
            throughputs.push(result.stats.totalThroughput);
            baseTps.push(result.stats.baseThroughput);
            bufferTps.push(result.stats.bufferThroughput);
        }

        const avgThroughput = throughputs.reduce((a, b) => a + b, 0) / iterations;
        const avgBaseTp = baseTps.reduce((a, b) => a + b, 0) / iterations;
        const avgBufferTp = bufferTps.reduce((a, b) => a + b, 0) / iterations;

        return {
            avgStoppageDays: totalStoppageDays / iterations,
            avgRisk: risks.reduce((a, b) => a + b, 0) / iterations,
            maxRisk: Math.max(...risks),
            minRisk: Math.min(...risks),
            rotBase: (avgBaseTp / 12) / this.BASE_CAPACITY_MT,
            rotBuffer: (avgBufferTp / 12) / this.BUFFER_CAPACITY_MT
        };
    }
}

// Export for browser use
if (typeof module !== 'undefined') {
    module.exports = MonteCarloEngine;
} else {
    window.MonteCarloEngine = MonteCarloEngine;
}
