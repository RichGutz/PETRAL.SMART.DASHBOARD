/**
 * Módulo de Trazabilidad y Auditoría de Acciones de Usuario en Frontend
 * Sistema: DELFOS SHIPPING SOFTWARE
 */

import { api } from './api';

export interface AuditEventPayload {
    action: 'EXPORT_EXCEL' | 'EXPORT_PDF' | 'LOGIN_ATTEMPT' | 'SCENARIO_MUTATION' | 'CIERRE_MES' | 'BUTTON_CLICK';
    entityName: string;
    entityId?: string;
    oldData?: Record<string, any>;
    newData?: Record<string, any>;
    metadata?: Record<string, any>;
}

export const AuditTracker = {
    /**
     * Registra un evento de auditoría asíncrono sin bloquear la UI del usuario.
     */
    track: async (payload: AuditEventPayload): Promise<void> => {
        try {
            const userJson = localStorage.getItem('petral_user');
            const currentUser = userJson ? JSON.parse(userJson) : null;
            const userEmail = currentUser?.email || 'anonymous@petral.com.pe';

            const fullPayload = {
                user_email: userEmail,
                action: payload.action,
                entity_name: payload.entityName,
                entity_id: payload.entityId || 'N/A',
                old_data: payload.oldData || null,
                new_data: payload.newData || null,
                metadata: {
                    ...payload.metadata,
                    url: window.location.pathname,
                    viewport: `${window.innerWidth}x${window.innerHeight}`,
                    timestamp_client: new Date().toISOString()
                }
            };

            // Envío fire-and-forget al backend
            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(fullPayload)], { type: 'application/json' });
                navigator.sendBeacon('/api/audit/track', blob);
            } else {
                await api.post('/audit/track', fullPayload);
            }
        } catch (e) {
            // Silencioso para no interrumpir el flujo operacional
            console.debug('[AuditTracker] Telemetría registrada localmente:', payload);
        }
    }
};
