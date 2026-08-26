/**
 * Motor Puro de Cálculo Matemático Unificado (Single Source of Truth)
 * Reutilizado por: Multicotizador, PDF Export y Matriz Financiera.
 * Función pura en memoria (0ms, determinística, libre de efectos secundarios).
 */

import { PortDemurrageRatesService } from './portDemurrageRatesService';

export interface CalculateVoyageParams {
    tramos: any[];
    puertosConfig: any[];
    vesselParams?: any;
    bunkerPriceIfo?: number;
    bunkerPriceMdo?: number;
    addressCommPct?: number;
    brokerCommPct?: number;
    demurrageRate?: number;
    refacturarMuellajeMap?: Record<number, boolean>;
    charterHireCost?: number;
    demurrageMode?: 'O' | 'P' | 'M' | 'C' | string;
    selectedVessel?: string;
    validFrom?: string;
}

export interface LegCalculationDetail {
    index: number;
    type: 'BALLAST' | 'LADEN';
    origin_port_id: string;
    destination_port_id: string;
    distance: number;
    weather_factor_pct: number;
    speed: number;
    sea_days: number;
    port_days: number;
    demurrage_days: number;
    time_to_count_h: number;
    positioning_h: number;
    action: 'NONE' | 'CARGAR' | 'DESCARGAR' | 'BUNKERING';
    op_rate: number;
    rate_unit: string;
    quantity: number;
    freight_rate: number;
    port_cost: number;
    freight_revenue: number;
    bunker_cost: number;
    muellaje_cost: number;
    is_refacturado: boolean;
}

export interface DynamicPortCostItem {
    port_id: string;
    label: string;
    action: string;
    base_agency_cost: number;
    loading_master_cost: number;
    muellaje_cost: number;
    total_cost: number;
}

export interface VoyageCalculationResult {
    totalDist: number;
    totalSeaDays: number;
    totalPortDays: number;
    totalDemurrageDays: number;
    totalDays: number;
    totalIfoTons: number;
    totalMdoTons: number;
    totalFuelTons: number;
    ifoCost: number;
    mdoCost: number;
    grandBunkerTotal: number;
    
    // Búnker Tripartito
    seaIfoTons: number;
    seaMdoTons: number;
    seaBunkerCost: number;
    portIfoTons: number;
    portMdoTons: number;
    portBunkerCost: number;
    demurrageIfoTons: number;
    demurrageMdoTons: number;
    demurrageBunkerCost: number;

    totalQuantity: number;
    totalFreight: number;
    demurrageRevenue: number;
    demurrageHireCost: number;
    standardHireCost: number;
    refacturacionMuellaje: number;
    grossRevenueTotal: number;
    totalPortCosts: number;
    tceReq: number;
    hireUsd: number;
    charterHireCost: number;
    addressCommUsd: number;
    brokerCommUsd: number;
    totalCommUsd: number;
    voyageResultPnl: number;
    tceRealizado: number;
    tceDiff: number;
    portDays0: number;
    bunkerCost0: number;
    demurrageDays0: number;
    calculatedTramos: LegCalculationDetail[];
    portCostItems: DynamicPortCostItem[];
}

export class MulticotizadorCalculationEngine {

    private static CHILEAN_PORTS = ['MEJILLONES', 'ANTOFAGASTA', 'VALPARAISO', 'SAN ANTONIO', 'ARICA', 'IQUIQUE', 'COQUIMBO'];

    public static calculate(params: CalculateVoyageParams): VoyageCalculationResult {
        return this.calculateVoyage(params);
    }

    /**
     * Función pura que calcula un viaje completo con precisión al centavo.
     */
    public static calculateVoyage(params: CalculateVoyageParams): VoyageCalculationResult {
        const {
            tramos = [],
            puertosConfig = [],
            vesselParams = {},
            bunkerPriceIfo = 0,
            bunkerPriceMdo = 0,
            addressCommPct = 0,
            brokerCommPct = 0,
            demurrageRate = 0,
            refacturarMuellajeMap = {},
            charterHireCost = 0,
            demurrageMode = 'P',
            selectedVessel = '',
            validFrom
        } = params;

        let totalDist = 0;
        let totalSeaDays = 0;
        let totalPortDays = 0;
        let totalDemurrageDays = 0;
        
        let seaIfoTons = 0;
        let seaMdoTons = 0;
        let portIfoTons = 0;
        let portMdoTons = 0;
        let demurrageIfoTons = 0;
        let demurrageMdoTons = 0;

        let totalQuantity = 0;
        let totalFreight = 0;
        let totalPortCosts = 0;
        let liveRefacturacionMuellaje = 0;

        const calculatedTramos: LegCalculationDetail[] = [];
        const portCostItems: DynamicPortCostItem[] = [];

        const defaultSpeed = Number(vesselParams?.vessel_speed || 0);
        const ifoSeaRatio = Number(vesselParams?.consumption_sea_ifo || 0);
        const mdoSeaRatio = Number(vesselParams?.consumption_sea_mdo || 0);
        const ifoIdleRatio = Number(vesselParams?.consumption_idle_ifo || 0);
        const mdoIdleRatio = Number(vesselParams?.consumption_idle_mdo || 0);
        const ifoLoadRatio = Number(vesselParams?.consumption_load_ifo || ifoIdleRatio);
        const mdoLoadRatio = Number(vesselParams?.consumption_load_mdo || mdoIdleRatio);
        const ifoDischRatio = Number(vesselParams?.consumption_disch_ifo || 0);
        const mdoDischRatio = Number(vesselParams?.consumption_disch_mdo || mdoIdleRatio);

        // Puerto 0 (Origen Inicial)
        const pCfg0 = puertosConfig[0] || {};
        const originPort0 = tramos[0]?.origin_port_id || '';
        let portDays0 = 0;
        let bunkerCost0 = 0;
        let demurrageDays0 = 0;

        if (pCfg0.action && pCfg0.action !== 'NONE') {
            const isMejillones0 = (originPort0 || '').trim().toUpperCase() === 'MEJILLONES' && pCfg0.action === 'DESCARGAR';
            const mVal0 = Number(pCfg0.manual_port_cost) || 0;
            const muellVal0 = Number(pCfg0.muellaje_cost) || (isMejillones0 ? 33333 : 0);
            const totalCost0 = Math.max(mVal0, muellVal0);
            totalPortCosts += totalCost0;
            if (refacturarMuellajeMap[0] !== false && muellVal0 > 0) {
                liveRefacturacionMuellaje += muellVal0;
            }

            const qVal0 = pCfg0.action === 'BUNKERING' ? 0 : Number(pCfg0.quantity || 0);
            const rDefault0 = pCfg0.action === 'DESCARGAR' ? 450 : 500;
            const rVal0 = Math.max(1, Number(pCfg0.op_rate || rDefault0));
            const rUnit0 = pCfg0.rate_unit || 'TH';
            const rateFactor0 = rUnit0 === 'TD' ? 1 : 24;
            const tcVal0 = Number(pCfg0.time_to_count !== undefined && pCfg0.time_to_count !== '' ? pCfg0.time_to_count : (pCfg0.overhead !== undefined && pCfg0.overhead !== '' ? pCfg0.overhead : (pCfg0.action === 'BUNKERING' ? 0.0 : 6.0)));
            const posVal0 = Number(pCfg0.positioning !== undefined && pCfg0.positioning !== '' ? pCfg0.positioning : (pCfg0.action === 'BUNKERING' ? 24.0 : (pCfg0.action === 'CARGAR' ? 1.0 : 0.0)));

            const idleDays0 = (tcVal0 + posVal0) / 24;
            const opDays0 = pCfg0.action === 'BUNKERING' ? 0 : ((qVal0 / rVal0) / rateFactor0);
            portDays0 = idleDays0 + opDays0;
            totalPortDays += portDays0;

            // Demurrage en Fila 0 (Solo si CARGAR)
            if (pCfg0.action === 'CARGAR') {
                if (pCfg0.demurrage_days !== undefined && pCfg0.demurrage_days !== '' && pCfg0.demurrage_days !== null) {
                    demurrageDays0 = Number(pCfg0.demurrage_days);
                } else {
                    demurrageDays0 = PortDemurrageRatesService.resolveDemurrageDays(
                        originPort0,
                        selectedVessel || vesselParams?.vessel_id || '',
                        demurrageMode,
                        validFrom
                    );
                }
                totalDemurrageDays += demurrageDays0;
            }

            const opIfoRate0 = pCfg0.action === 'DESCARGAR' ? ifoDischRatio : pCfg0.action === 'CARGAR' ? ifoLoadRatio : ifoIdleRatio;
            const opMdoRate0 = pCfg0.action === 'DESCARGAR' ? mdoDischRatio : pCfg0.action === 'CARGAR' ? mdoLoadRatio : mdoIdleRatio;

            const ifoPort0 = (idleDays0 * ifoIdleRatio) + (opDays0 * opIfoRate0);
            const mdoPort0 = (idleDays0 * mdoIdleRatio) + (opDays0 * opMdoRate0);
            const ifoDem0 = demurrageDays0 * ifoIdleRatio;
            const mdoDem0 = demurrageDays0 * mdoIdleRatio;

            portIfoTons += ifoPort0;
            portMdoTons += mdoPort0;
            demurrageIfoTons += ifoDem0;
            demurrageMdoTons += mdoDem0;

            bunkerCost0 = ((ifoPort0 + ifoDem0) * bunkerPriceIfo) + ((mdoPort0 + mdoDem0) * bunkerPriceMdo);

            if (pCfg0.action === 'DESCARGAR') {
                const fRate0 = Number(pCfg0.freight_rate || 0);
                totalQuantity += qVal0;
                totalFreight += (qVal0 * fRate0);
            }

            if (pCfg0.action === 'BUNKERING') {
                portCostItems.push({
                    port_id: originPort0,
                    label: `Bunkering Costs (${originPort0})`,
                    action: 'BUNKERING',
                    base_agency_cost: totalCost0,
                    loading_master_cost: 0,
                    muellaje_cost: 0,
                    total_cost: totalCost0
                });
            } else {
                const isChile0 = this.CHILEAN_PORTS.includes((originPort0 || '').toUpperCase());
                const lmCost0 = (isChile0 && totalCost0 >= 2500) ? 2500 : 0;
                const baseAgencyCost0 = Math.max(0, totalCost0 - lmCost0 - muellVal0);
                portCostItems.push({
                    port_id: originPort0,
                    label: pCfg0.action === 'CARGAR' ? `POL (${originPort0})` : `POD (${originPort0})`,
                    action: pCfg0.action,
                    base_agency_cost: baseAgencyCost0,
                    loading_master_cost: lmCost0,
                    muellaje_cost: muellVal0,
                    total_cost: totalCost0
                });
            }
        }

        // Iterar tramos 1 .. N
        tramos.forEach((tr, idx) => {
            const distVal = Number(tr.route_distance || 0);
            const rawWf = Number(tr.weather_factor || 0);
            const wfPct = rawWf > 1 ? rawWf : (rawWf * 100);
            const speedVal = Math.max(1, Number(tr.speed || defaultSpeed || 11.0));
            const calcSeaDays = distVal > 0 ? (distVal * (1 + (wfPct / 100))) / (speedVal * 24) : 0;

            const pCfg = puertosConfig[idx + 1] || {};
            const destPortId = tr.destination_port_id || '';
            const qVal = pCfg.action === 'BUNKERING' ? 0 : Number(pCfg.quantity || 0);
            const rDefault = pCfg.action === 'DESCARGAR' ? 450 : 500;
            const rVal = Math.max(1, Number(pCfg.op_rate || rDefault));
            const rUnit = pCfg.rate_unit || 'TH';
            const rateFactor = rUnit === 'TD' ? 1 : 24;
            const tcVal = Number(pCfg.time_to_count !== undefined && pCfg.time_to_count !== '' ? pCfg.time_to_count : (pCfg.overhead !== undefined && pCfg.overhead !== '' ? pCfg.overhead : (pCfg.action === 'BUNKERING' ? 0.0 : 6.0)));
            const posVal = Number(pCfg.positioning !== undefined && pCfg.positioning !== '' ? pCfg.positioning : (pCfg.action === 'BUNKERING' ? 24.0 : (pCfg.action === 'CARGAR' ? 1.0 : 0.0)));

            const idleDays = pCfg.action !== 'NONE' ? ((tcVal + posVal) / 24) : 0;
            const opDays = (pCfg.action !== 'NONE' && pCfg.action !== 'BUNKERING') ? ((qVal / rVal) / rateFactor) : 0;
            const calcPortDays = idleDays + opDays;

            // Demurrage en tramos 1..N (Solo en CARGAR o DESCARGAR)
            const isCargoOp = pCfg.action === 'CARGAR' || pCfg.action === 'DESCARGAR';
            let legDemurrageDays = 0;
            if (isCargoOp) {
                if (pCfg.demurrage_days !== undefined && pCfg.demurrage_days !== '' && pCfg.demurrage_days !== null) {
                    legDemurrageDays = Number(pCfg.demurrage_days);
                } else {
                    legDemurrageDays = PortDemurrageRatesService.resolveDemurrageDays(
                        destPortId,
                        selectedVessel || vesselParams?.vessel_id || '',
                        demurrageMode,
                        validFrom
                    );
                }
            }
            totalDemurrageDays += legDemurrageDays;

            const opIfoRate = pCfg.action === 'DESCARGAR' ? ifoDischRatio : pCfg.action === 'CARGAR' ? ifoLoadRatio : ifoIdleRatio;
            const opMdoRate = pCfg.action === 'DESCARGAR' ? mdoDischRatio : pCfg.action === 'CARGAR' ? mdoLoadRatio : mdoIdleRatio;

            // Desglose de Toneladas
            const legSeaIfo = calcSeaDays * ifoSeaRatio;
            const legSeaMdo = calcSeaDays * mdoSeaRatio;
            const legPortIfo = (idleDays * ifoIdleRatio) + (opDays * opIfoRate);
            const legPortMdo = (idleDays * mdoIdleRatio) + (opDays * opMdoRate);
            const legDemIfo = legDemurrageDays * ifoIdleRatio;
            const legDemMdo = legDemurrageDays * mdoIdleRatio;

            seaIfoTons += legSeaIfo;
            seaMdoTons += legSeaMdo;
            portIfoTons += legPortIfo;
            portMdoTons += legPortMdo;
            demurrageIfoTons += legDemIfo;
            demurrageMdoTons += legDemMdo;

            const totalLegIfo = legSeaIfo + legPortIfo + legDemIfo;
            const totalLegMdo = legSeaMdo + legPortMdo + legDemMdo;
            const legBunkerCost = (totalLegIfo * bunkerPriceIfo) + (totalLegMdo * bunkerPriceMdo);

            const fRate = Number(pCfg.freight_rate || 0);
            const legFreight = pCfg.action === 'DESCARGAR' ? (qVal * fRate) : 0;
            
            const isMejillonesDischarge = (destPortId || '').trim().toUpperCase() === 'MEJILLONES' && pCfg.action === 'DESCARGAR';
            const mVal = Number(pCfg.manual_port_cost) || 0;
            const muellVal = (pCfg.action === 'BUNKERING') ? 0 : (Number(pCfg.muellaje_cost) || (isMejillonesDischarge ? 33333 : 0));
            const legPortCost = Math.max(mVal, muellVal);

            totalDist += distVal;
            totalSeaDays += calcSeaDays;
            totalPortDays += calcPortDays;
            if (pCfg.action === 'DESCARGAR') totalQuantity += qVal;
            totalPortCosts += legPortCost;
            totalFreight += legFreight;

            const isRefacturado = refacturarMuellajeMap[idx + 1] !== false;
            if (isRefacturado && muellVal > 0) {
                liveRefacturacionMuellaje += muellVal;
            }

            calculatedTramos.push({
                index: idx + 1,
                type: (tr.type as 'LADEN' | 'BALLAST') || (pCfg.action === 'DESCARGAR' || qVal > 0 ? 'LADEN' : 'BALLAST'),
                origin_port_id: tr.origin_port_id || '',
                destination_port_id: destPortId,
                distance: distVal,
                weather_factor_pct: wfPct,
                speed: speedVal,
                sea_days: calcSeaDays,
                port_days: calcPortDays,
                demurrage_days: legDemurrageDays,
                time_to_count_h: tcVal,
                positioning_h: posVal,
                action: pCfg.action || 'NONE',
                op_rate: rVal,
                rate_unit: rUnit,
                quantity: qVal,
                freight_rate: fRate,
                port_cost: legPortCost,
                freight_revenue: legFreight,
                bunker_cost: legBunkerCost,
                muellaje_cost: muellVal,
                is_refacturado: isRefacturado
            });

            if (pCfg.action !== 'NONE') {
                if (pCfg.action === 'BUNKERING') {
                    portCostItems.push({
                        port_id: destPortId,
                        label: `Bunkering Costs (${destPortId})`,
                        action: 'BUNKERING',
                        base_agency_cost: legPortCost,
                        loading_master_cost: 0,
                        muellaje_cost: 0,
                        total_cost: legPortCost
                    });
                } else {
                    const isChile = this.CHILEAN_PORTS.includes(destPortId.toUpperCase());
                    const lmCost = (isChile && legPortCost >= 2500) ? 2500 : 0;
                    const baseAgencyCost = Math.max(0, legPortCost - lmCost - muellVal);
                    portCostItems.push({
                        port_id: destPortId,
                        label: pCfg.action === 'CARGAR' ? `POL (${destPortId})` : `POD (${destPortId})`,
                        action: pCfg.action,
                        base_agency_cost: baseAgencyCost,
                        loading_master_cost: lmCost,
                        muellaje_cost: muellVal,
                        total_cost: legPortCost
                    });
                }
            }
        });

        const totalIfoTons = seaIfoTons + portIfoTons + demurrageIfoTons;
        const totalMdoTons = seaMdoTons + portMdoTons + demurrageMdoTons;

        const seaBunkerCost = (seaIfoTons * bunkerPriceIfo) + (seaMdoTons * bunkerPriceMdo);
        const portBunkerCost = (portIfoTons * bunkerPriceIfo) + (portMdoTons * bunkerPriceMdo);
        const demurrageBunkerCost = (demurrageIfoTons * bunkerPriceIfo) + (demurrageMdoTons * bunkerPriceMdo);

        const ifoCost = totalIfoTons * bunkerPriceIfo;
        const mdoCost = totalMdoTons * bunkerPriceMdo;
        const grandBunkerTotal = ifoCost + mdoCost;

        const totalDays = totalSeaDays + totalPortDays + totalDemurrageDays;
        const rawCharterHireCost = Number(charterHireCost) || 0;

        // Si la grilla está limpia o en cero (0 días de viaje y 0 flete), no deviene TCE requerido
        const isCleanState = totalDays <= 0 && totalFreight <= 0 && totalDist <= 0;
        const tceReq = isCleanState ? 0 : Number(vesselParams?.tce_required || 15000);

        // Ingresos y Costos de Demurrage
        const demurrageRevenue = totalDemurrageDays * Number(demurrageRate || 0);
        const demurrageHireCost = totalDemurrageDays * tceReq;
        const standardHireCost = isCleanState ? 0 : ((totalSeaDays + totalPortDays) * tceReq);
        const hireUsd = standardHireCost + demurrageHireCost + rawCharterHireCost;

        const grossRevenueTotal = totalFreight + liveRefacturacionMuellaje + demurrageRevenue;

        const addressCommUsd = totalFreight * (addressCommPct / 100);
        const brokerCommUsd = totalFreight * (brokerCommPct / 100);
        const totalCommUsd = addressCommUsd + brokerCommUsd;

        const voyageResultPnl = isCleanState && rawCharterHireCost === 0
            ? 0
            : (grossRevenueTotal - (hireUsd + grandBunkerTotal + totalPortCosts + totalCommUsd));
            
        const tceRealizado = totalDays > 0 
            ? ((grossRevenueTotal - (grandBunkerTotal + totalPortCosts + totalCommUsd + rawCharterHireCost)) / totalDays) 
            : 0;
            
        const tceDiff = isCleanState ? 0 : (tceRealizado - tceReq);

        return {
            totalDist,
            totalSeaDays,
            totalPortDays,
            totalDemurrageDays,
            totalDays,
            totalIfoTons,
            totalMdoTons,
            totalFuelTons: totalIfoTons + totalMdoTons,
            ifoCost,
            mdoCost,
            grandBunkerTotal,
            seaIfoTons,
            seaMdoTons,
            seaBunkerCost,
            portIfoTons,
            portMdoTons,
            portBunkerCost,
            demurrageIfoTons,
            demurrageMdoTons,
            demurrageBunkerCost,
            totalQuantity,
            totalFreight,
            demurrageRevenue,
            demurrageHireCost,
            standardHireCost,
            refacturacionMuellaje: liveRefacturacionMuellaje,
            grossRevenueTotal,
            totalPortCosts,
            tceReq,
            hireUsd,
            charterHireCost: rawCharterHireCost,
            addressCommUsd,
            brokerCommUsd,
            totalCommUsd,
            voyageResultPnl,
            tceRealizado,
            tceDiff,
            portDays0,
            bunkerCost0,
            demurrageDays0,
            calculatedTramos,
            portCostItems
        };
    }
}
