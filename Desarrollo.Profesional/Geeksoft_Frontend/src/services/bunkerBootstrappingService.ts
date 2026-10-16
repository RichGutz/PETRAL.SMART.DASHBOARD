/**
 * ==============================================================================
 * Servicio Frontend de Búnker con Bootstrapping, Multifactura y Promedio Ponderado
 * PETRAL ONE - Enterprise Shipping Soft
 * ==============================================================================
 */

export interface ParsedInvoiceItem {
    fuel_type: 'IFO' | 'MDO';
    quantity_mt: number;
    unit_price_usd: number;
    total_amount_usd: number;
    raw_description?: string;
    gallons?: number;
    unit_price_gal?: number;
}

export interface ParsedPdfResult {
    success: boolean;
    filename: string;
    supplier: string;
    supplier_ruc: string;
    invoice_number: string;
    issue_date: string;
    vessel_id: string;
    currency: string;
    total_invoice_usd: number;
    items: ParsedInvoiceItem[];
    fuel_type: 'IFO' | 'MDO';
    quantity_mt: number;
    unit_price_usd: number;
    total_amount_usd: number;
    temp_base64?: string;
    raw_text_snippet?: string;
}

export interface InvoiceItemPayload {
    invoice_number: string;
    supplier: string;
    supplier_ruc?: string;
    issue_date: string;
    vessel_id: string;
    fuel_type: 'IFO' | 'MDO';
    quantity_mt: number;
    unit_price_usd: number;
    total_amount_usd: number;
    pdf_filename?: string;
    pdf_raw_base64?: string;
    parsed_metadata?: any;
}

export interface VesselFuelConfig {
    vessel_id: string;
    vessel_name: string;
    short_label: string;
    fuels: ('IFO' | 'MDO')[];
    supportsMdo: boolean;
}

export const VESSEL_FUEL_CONFIG: Record<string, VesselFuelConfig> = {
    'MOQUEGUA': { vessel_id: 'MOQUEGUA', vessel_name: 'BT MOQUEGUA', short_label: 'MOQUEGUA', fuels: ['IFO', 'MDO'], supportsMdo: true },
    'TABLONES': { vessel_id: 'TABLONES', vessel_name: 'BT TABLONES', short_label: 'TABLONES', fuels: ['IFO', 'MDO'], supportsMdo: true },
    'HUEMUL': { vessel_id: 'HUEMUL', vessel_name: 'BT HUEMUL', short_label: 'HUEMUL', fuels: ['IFO'], supportsMdo: false },
    'CONCON_TRADER': { vessel_id: 'CONCON_TRADER', vessel_name: 'CONCON TRADER', short_label: 'CONCON', fuels: ['IFO'], supportsMdo: false },
    'BOW_CONDOR': { vessel_id: 'BOW_CONDOR', vessel_name: 'BOW CONDOR', short_label: 'BOW CONDOR', fuels: ['IFO', 'MDO'], supportsMdo: true },
};

export const getVesselFuelConfig = (vesselId: string): VesselFuelConfig => {
    const key = (vesselId || '').toUpperCase().trim();
    return VESSEL_FUEL_CONFIG[key] || {
        vessel_id: key,
        vessel_name: key,
        short_label: key,
        fuels: ['IFO', 'MDO'],
        supportsMdo: true
    };
};

export interface BunkeringEventRecord {
    id: string;
    event_date: string;
    vessel_id: string;
    port_id: string;
    voyage_number?: string;
    is_bootstrap: boolean;
    rob_ifo_mt: number;
    price_prev_ifo_usd: number;
    purchased_ifo_mt: number;
    purchased_ifo_total_usd: number;
    weighted_avg_ifo_usd: number;
    rob_mdo_mt: number;
    price_prev_mdo_usd: number;
    purchased_mdo_mt: number;
    purchased_mdo_total_usd: number;
    weighted_avg_mdo_usd: number;
    spcc_baf_factor?: number;
    spcc_initial_fuel_value?: number;
    spcc_new_baf?: number;
    spcc_baf_variation?: number;
    notes?: string;
    created_at: string;
    created_by?: string;
    invoices?: InvoiceRecord[];
}

export interface InvoiceRecord {
    id: string;
    event_id: string;
    invoice_number: string;
    supplier: string;
    supplier_ruc?: string;
    issue_date: string;
    vessel_id: string;
    fuel_type: 'IFO' | 'MDO';
    quantity_mt: number;
    unit_price_usd: number;
    total_amount_usd: number;
    pdf_filename?: string;
    has_pdf?: boolean;
    created_at?: string;
    voyage_number?: string;
}

export interface BootstrapPayload {
    vessel_id: string;
    event_date: string;
    port_id?: string;
    voyage_number?: string;
    rob_ifo_mt: number;
    price_prev_ifo_usd: number;
    rob_mdo_mt: number;
    price_prev_mdo_usd: number;
    notes?: string;
    created_by?: string;
}

export interface BunkeringEventPayload {
    vessel_id: string;
    event_date: string;
    port_id?: string;
    voyage_number?: string;
    rob_ifo_mt: number;
    price_prev_ifo_usd: number;
    rob_mdo_mt: number;
    price_prev_mdo_usd: number;
    notes?: string;
    created_by?: string;
    invoices: InvoiceItemPayload[];
}

const getApiBase = (): string => {
    // Si VITE_API_URL está definido (ej. '/api/v1' o 'http://localhost:8000/api/v1'), lo normalizamos
    const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
    if (raw) {
        return raw;
    }
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return 'http://localhost:8000/api/v1';
        }
    }
    return '/api/v1';
};

export const BunkerBootstrappingService = {
    /**
     * Parsea un archivo PDF de factura mediante OCR / heurística en el backend
     */
    async parsePdf(file: File): Promise<ParsedPdfResult> {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${getApiBase()}/bunker-bootstrapping/parse-pdf`, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Error parseando PDF: ${res.statusText}`);
        }

        const json = await res.json();
        return json.data;
    },

    /**
     * Registra el saldo inicial o condición génesis de un buque (Bootstrapping)
     */
    async bootstrapVessel(payload: BootstrapPayload): Promise<any> {
        const res = await fetch(`${getApiBase()}/bunker-bootstrapping/bootstrap-vessel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Error en bootstrapping: ${res.statusText}`);
        }

        return await res.json();
    },

    /**
     * Registra un tanqueo completo (ROB previo + N facturas) y recalcula promedios ponderados
     */
    async recordBunkeringEvent(payload: BunkeringEventPayload): Promise<any> {
        const res = await fetch(`${getApiBase()}/bunker-bootstrapping/record-bunkering-event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Error registrando tanqueo: ${res.statusText}`);
        }

        return await res.json();
    },

    /**
     * Obtiene el listado histórico de eventos de tanqueo para un buque o 'TODOS'
     */
    async getVesselEvents(vesselId: string): Promise<BunkeringEventRecord[]> {
        const res = await fetch(`${getApiBase()}/bunker-bootstrapping/events/${encodeURIComponent(vesselId)}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Error obteniendo eventos: ${res.statusText}`);
        }
        const json = await res.json();
        return json.data || [];
    },

    /**
     * Obtiene el repositorio de facturas registradas
     */
    async getVesselInvoices(vesselId: string): Promise<InvoiceRecord[]> {
        const res = await fetch(`${getApiBase()}/bunker-bootstrapping/invoices/${encodeURIComponent(vesselId)}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Error obteniendo facturas: ${res.statusText}`);
        }
        const json = await res.json();
        return json.data || [];
    },

    /**
     * Retorna la URL directa para streaming del PDF en el visor
     */
    getInvoicePdfUrl(invoiceId: string): string {
        return `${getApiBase()}/bunker-bootstrapping/invoice/${encodeURIComponent(invoiceId)}/pdf`;
    },

    /**
     * Consulta el perfil y capacidad de combustible del buque desde el Maestro de Flota
     */
    async getVesselFuelProfile(vesselId: string): Promise<VesselFuelConfig> {
        try {
            const res = await fetch(`${getApiBase()}/bunker-bootstrapping/vessel-fuel-profile/${encodeURIComponent(vesselId)}`);
            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    return {
                        vessel_id: json.data.vessel_id,
                        vessel_name: json.data.vessel_name,
                        short_label: json.data.vessel_id,
                        fuels: json.data.fuels,
                        supportsMdo: json.data.supports_mdo
                    };
                }
            }
        } catch (e) {
            console.warn('Fallback a configuración local de flota:', e);
        }
        return getVesselFuelConfig(vesselId);
    },

    /**
     * Elimina un evento de tanqueo y lo respalda en la papelera comercial
     */
    async deleteBunkeringEvent(eventId: string, deletedBy: string = 'admin@petral.com'): Promise<any> {
        const res = await fetch(`${getApiBase()}/bunker-bootstrapping/event/${encodeURIComponent(eventId)}?deleted_by=${encodeURIComponent(deletedBy)}`, {
            method: 'DELETE',
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Error eliminando evento: ${res.statusText}`);
        }
        return await res.json();
    },

    /**
     * Edita un evento de tanqueo o asiento de apertura (campos operativos y ROBs)
     */
    async updateBunkeringEvent(eventId: string, payload: Partial<BunkeringEventRecord>): Promise<any> {
        const res = await fetch(`${getApiBase()}/bunker-bootstrapping/event/${encodeURIComponent(eventId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Error actualizando evento: ${res.statusText}`);
        }
        return await res.json();
    }
};
