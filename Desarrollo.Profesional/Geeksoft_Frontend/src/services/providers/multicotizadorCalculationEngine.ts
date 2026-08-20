/**
 * Motor Puro de Cálculo Matemático Unificado (Single Source of Truth)
 * Reutilizado por: Multicotizador, PDF Export y Matriz Financiera.
 * Función pura en memoria (0ms, determinística, libre de efectos secundarios).
 */

export interface CalculateVoyageParams {
    tramos: any[];
    puertosConfig: any[];
    vesselParams?: any;
    bunkerPriceIfo?: number;
    bunkerPriceMdo?: number;
    addressCommPct?: number;
    brokerCommPct?: number;
    refacturarMuellajeMap?: Record<number, boolean>;
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
    totalDays: number;
    totalIfoTons: number;
    totalMdoTons: number;
    totalFuelTons: number;
    ifoCost: number;
    mdoCost: number;
    grandBunkerTotal: number;
    totalQuantity: number;
    totalFreight: number;
    refacturacionMuellaje: number;
    grossRevenueTotal: number;
    totalPortCosts: number;
    tceReq: number;
    hireUsd: number;
    addressCommUsd: number;
    brokerCommUsd: number;
    totalCommUsd: number;
    voyageResultPnl: number;
    tceRealizado: number;
    tceDiff: number;
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
            refacturarMuellajeMap = {}
        } = params;

        let totalDist = 0;
        let totalSeaDays = 0;
        let totalPortDays = 0;
        let totalIfoTons = 0;
        let totalMdoTons = 0;
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

            const opIfoRate0 = pCfg0.action === 'DESCARGAR' ? ifoDischRatio : pCfg0.action === 'CARGAR' ? ifoLoadRatio : ifoIdleRatio;
            const opMdoRate0 = pCfg0.action === 'DESCARGAR' ? mdoDischRatio : pCfg0.action === 'CARGAR' ? mdoLoadRatio : mdoIdleRatio;

            const ifoTons0 = (idleDays0 * ifoIdleRatio) + (opDays0 * opIfoRate0);
            const mdoTons0 = (idleDays0 * mdoIdleRatio) + (opDays0 * opMdoRate0);
            bunkerCost0 = (ifoTons0 * bunkerPriceIfo) + (mdoTons0 * bunkerPriceMdo);

            totalIfoTons += ifoTons0;
            totalMdoTons += mdoTons0;

            if (pCfg0.action === 'DESCARGAR') {
                const fRate0 = Number(pCfg0.freight_rate || 0);
                totalQuantity += qVal0;
                totalFreight += (qVal0 * fRate0);
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

            const opIfoRate = pCfg.action === 'DESCARGAR' ? ifoDischRatio : pCfg.action === 'CARGAR' ? ifoLoadRatio : ifoIdleRatio;
            const opMdoRate = pCfg.action === 'DESCARGAR' ? mdoDischRatio : pCfg.action === 'CARGAR' ? mdoLoadRatio : mdoIdleRatio;

            const ifoTons = (calcSeaDays * ifoSeaRatio) + (idleDays * ifoIdleRatio) + (opDays * opIfoRate);
            const mdoTons = (calcSeaDays * mdoSeaRatio) + (idleDays * mdoIdleRatio) + (opDays * opMdoRate);
            const legBunkerCost = (ifoTons * bunkerPriceIfo) + (mdoTons * bunkerPriceMdo);

            totalIfoTons += ifoTons;
            totalMdoTons += mdoTons;

            const fRate = Number(pCfg.freight_rate || 0);
            const legFreight = pCfg.action === 'DESCARGAR' ? (qVal * fRate) : 0;
            
            const destPortId = tr.destination_port_id || '';
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
                type: tr.type || 'BALLAST',
                origin_port_id: tr.origin_port_id || '',
                destination_port_id: destPortId,
                distance: distVal,
                weather_factor_pct: wfPct,
                speed: speedVal,
                sea_days: calcSeaDays,
                port_days: calcPortDays,
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

        const totalDays = totalSeaDays + totalPortDays;
        const ifoCost = totalIfoTons * bunkerPriceIfo;
        const mdoCost = totalMdoTons * bunkerPriceMdo;
        const grandBunkerTotal = ifoCost + mdoCost;

        const grossRevenueTotal = totalFreight + liveRefacturacionMuellaje;
        const tceReq = Number(vesselParams?.tce_required || 15000);
        const hireUsd = tceReq * totalDays;

        const addressCommUsd = totalFreight * (addressCommPct / 100);
        const brokerCommUsd = totalFreight * (brokerCommPct / 100);
        const totalCommUsd = addressCommUsd + brokerCommUsd;

        const voyageResultPnl = grossRevenueTotal - (hireUsd + grandBunkerTotal + totalPortCosts + totalCommUsd);
        const tceRealizado = totalDays > 0 ? ((grossRevenueTotal - (grandBunkerTotal + totalPortCosts + totalCommUsd)) / totalDays) : 0;
        const tceDiff = tceRealizado - tceReq;

        return {
            totalDist,
            totalSeaDays,
            totalPortDays,
            totalDays,
            totalIfoTons,
            totalMdoTons,
            totalFuelTons: totalIfoTons + totalMdoTons,
            ifoCost,
            mdoCost,
            grandBunkerTotal,
            totalQuantity,
            totalFreight,
            refacturacionMuellaje: liveRefacturacionMuellaje,
            grossRevenueTotal,
            totalPortCosts,
            tceReq,
            hireUsd,
            addressCommUsd,
            brokerCommUsd,
            totalCommUsd,
            voyageResultPnl,
            tceRealizado,
            tceDiff,
            portDays0,
            bunkerCost0,
            calculatedTramos,
            portCostItems
        };
    }
}
