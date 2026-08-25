import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://forecast.geeksoft.tech/api/v1',
    headers: {
        'Content-Type': 'application/json'
    }
});

export const ForecastService = {
    runSimulation: async (payload: any, signal?: AbortSignal) => {
        const response = await api.post('/forecast/run', payload, { signal });
        return response.data;
    },
    getVesselTerminalOperations: async () => {
        const response = await api.get('/forecast/vessel_terminal_operations');
        return response.data;
    },
    saveVesselTerminalOperations: async (payload: any) => {
        const response = await api.post('/forecast/vessel_terminal_operations', payload);
        return response.data;
    },
    runSimulationUniversal: async (payload: any, signal?: AbortSignal) => {
        const response = await api.post('/forecast/run_universal', payload, { signal });
        return response.data;
    },

    saveForecast: async (payload: any) => {
        const response = await api.post('/forecast/save', payload);
        return response.data;
    },
    listForecasts: async () => {
        const response = await api.get(`/forecast/list`);
        return response.data;
    },
    loadForecast: async (id: string) => {
        const response = await api.get(`/forecast/load/${id}`);
        return response.data;
    },
    deleteForecast: async (id: string) => {
        const response = await api.delete(`/forecast/delete/${id}`);
        return response.data;
    },
    getBenchmarks: async () => {
        const response = await api.get('/forecast/benchmarks');
        return response.data;
    },
    
    getClientsMaster: async () => {
        const response = await api.get('/forecast/masters/clients');
        return response.data;
    },
    saveClientsMaster: async (payload: any) => {
        const response = await api.post('/forecast/masters/clients', payload);
        return response.data;
    },
    getClients: async () => {
        try {
            const response = await api.get('/forecast/clients');
            return response.data;
        } catch (e) {
            console.warn("Using local fallback clients for localhost dev:", e);
            return [
                { client_id: 'SPCC', client_name: 'SPCC (Southern Peru)' },
                { client_id: 'TRAFIGURA', client_name: 'TRAFIGURA PERU S.A.C.' },
                { client_id: 'GLENCORE', client_name: 'GLENCORE PERU S.A.' },
                { client_id: 'SOUTHERN', client_name: 'SOUTHERN COPPER CORPORATION' },
                { client_id: 'CERRO_VERDE', client_name: 'CERRO VERDE' }
            ];
        }
    },
    getVoyageLiquidations: async () => {
        try {
            const response = await api.get('/forecast/voyage_liquidations');
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                return response.data;
            }
        } catch {
            // Fallback a Supabase REST API directo
        }
        try {
            const supabaseUrl = "https://hjjxooxcpvlvbaxgifbn.supabase.co/rest/v1/voyage_liquidations?select=*";
            const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc";
            const resp = await axios.get(supabaseUrl, {
                headers: {
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`
                }
            });
            return resp.data || [];
        } catch (err) {
            console.error("Error al consultar Supabase REST:", err);
            return [];
        }
    },
    calculateSpot: async (payload: any) => {
        const response = await api.post('/forecast/spot/calculate', payload);
        return response.data;
    },
    calculateMultiCotizador: async (payload: any) => {
        const response = await api.post('/forecast/multicotizador/calculate', payload);
        return response.data;
    },
    lookupPortCost: async (vesselId: string, portId: string, operation: string, portCostMode: string = 'static') => {
        const response = await api.get('/forecast/port-cost/lookup', {
            params: {
                vessel_id: vesselId,
                port_id: portId,
                operation,
                port_cost_mode: portCostMode
            }
        });
        return response.data;
    },
    deletePortCostRule: async (ruleId: string) => {
        const response = await api.delete(`/forecast/port_costs_matrix/${ruleId}`);
        return response.data;
    },
    getLatestBunker: async () => {
        const response = await api.get('/forecast/bunker/latest');
        return response.data;
    },
    getBunkerPrices: async () => {
        const response = await api.get('/forecast/bunker');
        return response.data;
    },
    saveBunkerPrices: async (payload: any[]) => {
        const response = await api.post('/forecast/bunker', payload);
        return response.data;
    },
    deleteBunkerPrices: async (dateStr: string, fuelType?: string) => {
        const params = fuelType ? { fuel_type: fuelType } : {};
        const response = await api.delete(`/forecast/bunker/${dateStr}`, { params });
        return response.data;
    },
    parseBunkerPdf: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/forecast/bunker/parse-pdf', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    saveSpot: async (payload: any) => {
        const response = await api.post('/forecast/spot/save', payload);
        return response.data;
    },
    listSpots: async () => {
        const response = await api.get('/forecast/spot/list');
        return response.data;
    },
    getVessels: async () => {
        try {
            const response = await api.get('/forecast/vessels');
            return response.data;
        } catch (e) {
            console.warn("Using local fallback vessels for localhost dev:", e);
            return [
                { vessel_id: 'V01', vessel_name: 'SANTA SOFIA', dwt: 38200, grt: 24500, vessel_speed: 11.0, tce_required: 15000 },
                { vessel_id: 'V02', vessel_name: 'PETRAL EXPLORER', dwt: 45000, grt: 28000, vessel_speed: 12.0, tce_required: 18000 },
                { vessel_id: 'V03', vessel_name: 'NEOAUTO VOYAGER', dwt: 52000, grt: 31000, vessel_speed: 12.5, tce_required: 20000 }
            ];
        }
    },
    saveVessel: async (payload: any) => {
        const response = await api.post('/forecast/vessels', payload);
        return response.data;
    },
    reorderVessels: async (payload: any) => {
        const response = await api.post('/forecast/vessels/reorder', payload);
        return response.data;
    },
    getPorts: async () => {
        const response = await api.get('/forecast/ports');
        return response.data;
    },
    savePorts: async (payload: any) => {
        const response = await api.post('/forecast/ports', payload);
        return response.data;
    },
    deletePort: async (port_id: string) => {
        const response = await api.delete('/forecast/ports', { params: { port_id } });
        return response.data;
    },
    reorderPorts: async (payload: any[]) => {
        const response = await api.post('/forecast/ports/reorder', payload);
        return response.data;
    },
    getTerminals: async (port_id?: string) => {
        const params = port_id ? { port_id } : {};
        const response = await api.get('/forecast/terminals', { params });
        return response.data;
    },
    saveTerminals: async (payload: any) => {
        const response = await api.post('/forecast/terminals', payload);
        return response.data;
    },
    deleteTerminal: async (terminal_id: string, port_id: string) => {
        const response = await api.delete('/forecast/terminals', { params: { terminal_id, port_id } });
        return response.data;
    },
    getPortCostsStatic: async () => {
        const response = await api.get('/forecast/port_costs_static');
        return response.data;
    },
    savePortCostsStatic: async (payload: any[]) => {
        const response = await api.post('/forecast/port_costs_static', payload);
        return response.data;
    },
    getPortCostsMatrix: async (portId?: string) => {
        const params: Record<string, string> = {};
        if (portId) params['port_id'] = portId;
        const response = await api.get('/forecast/port_costs_matrix', { params });
        return response.data;
    },
    savePortCostsMatrix: async (payload: any[]) => {
        const response = await api.post('/forecast/port_costs_matrix', payload);
        return response.data;
    },
    getSuppliers: async () => {
        const response = await api.get('/forecast/suppliers');
        return response.data;
    },
    saveSuppliers: async (payload: any[]) => {
        const response = await api.post('/forecast/suppliers', payload);
        return response.data;
    },
    getSourcesSinks: async () => {
        const response = await api.get('/forecast/sources_sinks');
        return response.data;
    },
    saveSourcesSinks: async (payload: any[]) => {
        const response = await api.post('/forecast/sources_sinks', payload);
        return response.data;
    },
    deleteSourceSink: async (payload: { port_id: string, year: number, empresa: string, producto: string }) => {
        const response = await api.post('/forecast/sources_sinks/delete', payload);
        return response.data;
    },
    getRoutesMaster: async () => {
        const response = await api.get('/forecast/masters/routes');
        return response.data;
    },
    getRoutes: async () => {
        try {
            const response = await api.get('/forecast/routes');
            return response.data;
        } catch (e) {
            console.warn("Using local fallback routes for localhost dev:", e);
            return [
                { route_id: 'r1', origin_port_id: 'CALLAO', destination_port_id: 'VALPARAISO', route_distance: 1320 },
                { route_id: 'r2', origin_port_id: 'MATARANI', destination_port_id: 'SHANGHAI', route_distance: 9800 },
                { route_id: 'r3', origin_port_id: 'ILO', destination_port_id: 'QINGDAO', route_distance: 9500 }
            ];
        }
    },

    saveRoutes: async (payload: any[]) => {
        const response = await api.post('/forecast/routes', payload);
        return response.data;
    },

    getContractsMaster: async () => {
        const response = await api.get('/forecast/masters/contracts');
        return response.data;
    },
    saveContractsMaster: async (payload: any) => {
        const response = await api.post('/forecast/masters/contracts', payload);
        return response.data;
    },
    estimateRoutesDistances: async (payload: { routes: Array<{ origin: string, destination: string, lat_a: number, lon_a: number, lat_b: number, lon_b: number }> }) => {
        const response = await api.post('/forecast/routes/estimate-distances', payload);
        return response.data;
    },
    getSpotVoyages: async () => {
        const response = await api.get('/forecast/spot/list');
        return response.data;
    },
    deleteSpotVoyage: async (spotId: string) => {
        const response = await api.delete(`/forecast/spot/delete/${spotId}`);
        return response.data;
    },
    deleteSpot: async (spotId: string) => {
        const response = await api.delete(`/forecast/spot/delete/${spotId}`);
        return response.data;
    },
    getDemurrageRecords: async () => {
        const response = await api.get('/forecast/demurrage_records');
        return response.data;
    },
    saveDemurrageRecords: async (payload: any[]) => {
        const response = await api.post('/forecast/demurrage_records', payload);
        return response.data;
    }
};

export const AuthService = {
    login: async (payload: any) => {
        const response = await api.post('/auth/login', payload);
        return response.data;
    },
    getUsers: async () => {
        const response = await api.get('/users');
        return response.data;
    },
    createUser: async (payload: any) => {
        const response = await api.post('/users', payload);
        return response.data;
    },
    updateUser: async (id: string, payload: any) => {
        const response = await api.put(`/users/${id}`, payload);
        return response.data;
    },
    deleteUser: async (id: string) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
    changePassword: async (payload: any) => {
        const response = await api.post('/auth/change-password', payload);
        return response.data;
    }
};


