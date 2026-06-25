import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json'
    }
});

export const ForecastService = {
    runSimulation: async (payload: any) => {
        const response = await api.post('/forecast/run', payload);
        return response.data;
    }
};
