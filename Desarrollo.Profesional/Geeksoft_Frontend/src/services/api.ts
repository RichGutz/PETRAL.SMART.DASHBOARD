import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json'
    }
});

export const ForecastService = {
    runSimulation: async (payload: any) => {
        const response = await api.post('/forecast/run', payload);
        return response.data;
    },
    runSimulationUniversal: async (payload: any) => {
        const response = await api.post('/forecast/run_universal', payload);
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
        const response = await api.get('/forecast/clients');
        return response.data;
    },
    calculateSpot: async (payload: any) => {
        const response = await api.post('/forecast/spot/calculate', payload);
        return response.data;
    },
    calculateMultiCotizador: async (payload: any) => {
        const response = await api.post('/forecast/multicotizador/calculate', payload);
        return response.data;
    },
    getLatestBunker: async () => {
        const response = await api.get('/forecast/bunker/latest');
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
        const response = await api.get('/forecast/vessels');
        return response.data;
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
    getRoutes: async () => {
        const response = await api.get('/forecast/routes');
        return response.data;
    },

    saveRoutes: async (payload: any[]) => {
        const response = await api.post('/forecast/routes', payload);
        return response.data;
    },
};
