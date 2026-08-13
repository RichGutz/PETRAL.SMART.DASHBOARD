export const MOCK_VESSELS_DATA = [
    {
        vessel_id: 'MOQUEGUA',
        vessel_name: 'B/T MOQUEGUA',
        grt: 11365,
        dwt: 16533,
        dwcc: 13500,
        vessel_speed: 11.0,
        tce_required: 15000,
        length: 159,
        beam: 23,
        draft_m: '8.2',
        consumption_sea_ifo: 14.5,
        consumption_idle_ifo: 3.5,
        consumption_load_ifo: 3.5,
        consumption_disch_ifo: 5.0,
        consumption_sea_mdo: 0.1,
        consumption_idle_mdo: 0.1,
        consumption_load_mdo: 0.1,
        consumption_disch_mdo: 0.1,
        act_load: 500,
        act_disch: 350
    },
    {
        vessel_id: 'TABLONES',
        vessel_name: 'B/T TABLONES',
        grt: 11365,
        dwt: 16533,
        dwcc: 13500,
        vessel_speed: 11.0,
        tce_required: 15000,
        length: 159,
        beam: 23,
        draft_m: '8.2',
        consumption_sea_ifo: 14.5,
        consumption_idle_ifo: 3.5,
        consumption_load_ifo: 3.5,
        consumption_disch_ifo: 5.0,
        consumption_sea_mdo: 0.1,
        consumption_idle_mdo: 0.1,
        consumption_load_mdo: 0.1,
        consumption_disch_mdo: 0.1,
        act_load: 500,
        act_disch: 350
    }
];

export const MOCK_PORTS_DATA = [
    { port_id: 'MATARANI', port_name: 'Puerto Matarani', country: 'PE', max_load_rate: 500, max_disch_rate: 300, time_to_count_carga_hrs: 6, time_to_count_descarga_hrs: 6, maneuver_carga_hrs: 0, maneuver_descarga_hrs: 0 },
    { port_id: 'MEJILLONES', port_name: 'Puerto Mejillones', country: 'CL', max_load_rate: 500, max_disch_rate: 350, time_to_count_carga_hrs: 6, time_to_count_descarga_hrs: 6, maneuver_carga_hrs: 0, maneuver_descarga_hrs: 0 },
    { port_id: 'ILO', port_name: 'Puerto de Ilo', country: 'PE', max_load_rate: 400, max_disch_rate: 300, time_to_count_carga_hrs: 6, time_to_count_descarga_hrs: 6, maneuver_carga_hrs: 0, maneuver_descarga_hrs: 0 },
    { port_id: 'CALLAO', port_name: 'Puerto del Callao', country: 'PE', max_load_rate: 600, max_disch_rate: 400, time_to_count_carga_hrs: 6, time_to_count_descarga_hrs: 6, maneuver_carga_hrs: 0, maneuver_descarga_hrs: 0 }
];

export const MOCK_SIMULATION_RESULT = {
    consolidated: {
        total_distance: 334.0,
        total_sea_days: 1.303106,
        total_port_days: 1.857143,
        total_days: 3.160249,
        bunker_ifo_tonnage: 27.8058,
        bunker_mdo_tonnage: 0.316,
        total_bunker_costs: 27378.36,
        total_port_costs: 67833.0,
        total_freight_revenue: 405000.0,
        address_commission_pct: 0.0,
        broker_commission_pct: 0.0,
        total_commissions: 0.0,
        pnl_net_utility: 310121.64,
        tce_real: 98132.0,
        tce_required: 15000.0,
        pl_vs_req: 262717.91,
        refacturacion_muellaje: 33333.0,
        bunker_source: "MAESTRO_CONTRATOS"
    },
    tramos: [
        {
            type: 'LADEN',
            origin_port_id: 'MATARANI',
            destination_port_id: 'MEJILLONES',
            quantity: 13500,
            freight_rate: 30.0,
            sea_days: 1.3031,
            port_days: 1.8571,
            bunker_ifo: 27.81,
            bunker_mdo: 0.32,
            bunker_costs: 27378.36,
            port_costs: 67833.0,
            net_income: 405000.0,
            pnl_tramo: 310121.64,
            agency_costs_origin: 0.0,
            agency_costs_destination: 67833.0,
            agency_costs_destination_details: {
                total_cost: 67833.0,
                breakdown: { MAIN: 32000.0, loading_master: 2500.0, muellaje: 33333.0 }
            },
            muellaje_cost_origin: 0.0,
            muellaje_cost_dest: 33333.0,
            refacturar_muellaje: true,
            origin_action: 'CARGAR',
            destination_action: 'DESCARGAR'
        }
    ]
};
