const fs = require('fs');

// Simular MulticotizadorCalculationEngine
function calculateVoyage(params) {
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

        const qVal0 = Number(pCfg0.quantity || 0);
        const rVal0 = Math.max(1, Number(pCfg0.op_rate || 500));
        const rUnit0 = pCfg0.rate_unit || 'TH';
        const rateFactor0 = rUnit0 === 'TD' ? 1 : 24;
        const tcVal0 = Number(pCfg0.time_to_count !== undefined && pCfg0.time_to_count !== '' ? pCfg0.time_to_count : (pCfg0.overhead !== undefined && pCfg0.overhead !== '' ? pCfg0.overhead : 0));
        const posVal0 = Number(pCfg0.positioning || 0);

        const idleDays0 = (tcVal0 + posVal0) / 24;
        const opDays0 = (qVal0 / rVal0) / rateFactor0;
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
        const qVal = Number(pCfg.quantity || 0);
        const rVal = Math.max(1, Number(pCfg.op_rate || 500));
        const rUnit = pCfg.rate_unit || 'TH';
        const rateFactor = rUnit === 'TD' ? 1 : 24;
        const tcVal = Number(pCfg.time_to_count !== undefined && pCfg.time_to_count !== '' ? pCfg.time_to_count : (pCfg.overhead !== undefined && pCfg.overhead !== '' ? pCfg.overhead : 0));
        const posVal = Number(pCfg.positioning || 0);

        const idleDays = pCfg.action !== 'NONE' ? ((tcVal + posVal) / 24) : 0;
        const opDays = pCfg.action !== 'NONE' ? ((qVal / rVal) / rateFactor) : 0;
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
        const muellVal = Number(pCfg.muellaje_cost) || (isMejillonesDischarge ? 33333 : 0);
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
        tceDiff
    };
}

// Test con el payload real de SPCC MEJILLONES
const routePayload = {
    tramos: [
      {
        "type": "BALLAST",
        "speed": 11,
        "quantity": 0,
        "desc_tons": 0,
        "freight_rate": 0,
        "origin_port_id": "ILO",
        "route_distance": 0,
        "weather_factor": 3,
        "destination_port_id": "ILO"
      },
      {
        "type": "LADEN",
        "speed": 11,
        "quantity": 13500,
        "desc_tons": 13500,
        "freight_rate": 21.15,
        "origin_port_id": "ILO",
        "route_distance": 335,
        "weather_factor": 3,
        "destination_port_id": "MEJILLONES"
      },
      {
        "type": "BALLAST",
        "speed": 11,
        "quantity": 0,
        "desc_tons": 0,
        "freight_rate": 0,
        "origin_port_id": "MEJILLONES",
        "route_distance": 335,
        "weather_factor": 3,
        "destination_port_id": "ILO"
      }
    ],
    puertosConfig: [
      {
        "action": "NONE",
        "op_rate": "",
        "quantity": 0,
        "rate_unit": "TH",
        "positioning": 0,
        "freight_rate": 0,
        "time_to_count": 0,
        "manual_port_cost": ""
      },
      {
        "action": "CARGAR",
        "op_rate": "500",
        "overhead": "6",
        "quantity": "13500",
        "rate_unit": "TH",
        "positioning": "1",
        "freight_rate": 0,
        "muellaje_cost": 0,
        "time_to_count": "6",
        "manual_port_cost": 22000
      },
      {
        "action": "DESCARGAR",
        "op_rate": "300",
        "overhead": "6",
        "quantity": "13500",
        "rate_unit": "TH",
        "positioning": 0,
        "freight_rate": "21.15",
        "muellaje_cost": 25000,
        "time_to_count": "6",
        "manual_port_cost": 58500
      },
      {
        "action": "NONE",
        "op_rate": "",
        "quantity": 0,
        "rate_unit": "TH",
        "positioning": 0,
        "freight_rate": 0,
        "time_to_count": 0,
        "manual_port_cost": ""
      }
    ],
    vesselParams: {
      "dwt": 14298,
      "grt": 8259,
      "beam": 20,
      "dwcc": 13500,
      "length": 134,
      "draft_m": "8.8",
      "act_load": 500,
      "act_disch": 300,
      "vessel_id": "MOQUEGUA",
      "vessel_name": "MOQUEGUA",
      "tce_required": 13000,
      "vessel_speed": 11,
      "consumption_sea_ifo": 14,
      "consumption_sea_mdo": 0,
      "consumption_idle_ifo": 2.4,
      "consumption_idle_mdo": 0,
      "consumption_load_ifo": 2.4,
      "consumption_load_mdo": 0.5,
      "consumption_disch_ifo": 3.6,
      "consumption_disch_mdo": 0.5
    },
    bunkerPriceIfo: 967.26,
    bunkerPriceMdo: 1528.26
};

const result = calculateVoyage(routePayload);
console.log("RESULTADO:", JSON.stringify(result, null, 2));
