/**
 * Commercial Trash Bin API Service
 * Architecture V2 - PETRAL ONE
 */

import axios from 'axios';
import type { TrashItem, TrashFiltersState, RestoreResponse } from '../types/commercialTrash';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://forecast.geeksoft.tech/api/v1',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para inyectar token de autorización si existe
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('petral_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const CommercialTrashService = {
    /**
     * Consulta los elementos almacenados en la papelera con filtros opcionales.
     */
    getTrashItems: async (filters?: Partial<TrashFiltersState>): Promise<TrashItem[]> => {
        const params: Record<string, any> = {};
        if (filters?.entity_type && filters.entity_type !== 'ALL') {
            params.entity_type = filters.entity_type;
        }
        if (filters?.client_name && filters.client_name.trim() && filters.client_name !== 'ALL') {
            params.client_name = filters.client_name.trim();
        }
        if (filters?.include_restored !== undefined) {
            params.include_restored = filters.include_restored;
        }
        if (filters?.search && filters.search.trim()) {
            params.search = filters.search.trim();
        }

        const response = await api.get<TrashItem[]>('/trash', { params });
        return response.data;
    },

    /**
     * Retorna la cantidad de elementos activos (no restaurados) en la papelera.
     */
    getTrashCount: async (): Promise<number> => {
        try {
            const response = await api.get<{ count: number }>('/trash/count');
            return response.data.count || 0;
        } catch (error) {
            console.warn('Error al obtener conteo de papelera:', error);
            return 0;
        }
    },

    /**
     * Restaura un documento a su maestro y tabla de origen original.
     */
    restoreTrashItem: async (trashId: string, restoredBy?: string): Promise<RestoreResponse> => {
        const response = await api.post<RestoreResponse>(`/trash/${trashId}/restore`, {
            restored_by: restoredBy || 'Usuario Comercial'
        });
        return response.data;
    },

    /**
     * Elimina físicamente un elemento de la papelera (Purga definitiva).
     */
    purgeTrashItem: async (trashId: string): Promise<{ status: string; message: string }> => {
        const response = await api.delete<{ status: string; message: string }>(`/trash/${trashId}/purge`);
        return response.data;
    }
};
