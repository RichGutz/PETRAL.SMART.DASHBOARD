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
    getClients: async () => {
        const response = await api.get('/forecast/clients');
        return response.data;
    }
};
