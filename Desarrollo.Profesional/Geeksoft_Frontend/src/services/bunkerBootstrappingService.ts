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
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return 'http://localhost:8000';
        }
        // En producción VPS Contabo (petral.one.geeksoft.tech), Nginx redirige /api/ directamente al backend
        return '';
    }
    return '';
};

export const BunkerBootstrappingService = {
    /**
     * Parsea un archivo PDF de factura mediante OCR / heurística en el backend
     */
    async parsePdf(file: File): Promise<ParsedPdfResult> {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${getApiBase()}/api/v1/bunker-bootstrapping/parse-pdf`, {
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
        const res = await fetch(`${getApiBase()}/api/v1/bunker-bootstrapping/bootstrap-vessel`, {
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
        const res = await fetch(`${getApiBase()}/api/v1/bunker-bootstrapping/record-bunkering-event`, {
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
        const res = await fetch(`${getApiBase()}/api/v1/bunker-bootstrapping/events/${encodeURIComponent(vesselId)}`);
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
        const res = await fetch(`${getApiBase()}/api/v1/bunker-bootstrapping/invoices/${encodeURIComponent(vesselId)}`);
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
        return `${getApiBase()}/api/v1/bunker-bootstrapping/invoice/${encodeURIComponent(invoiceId)}/pdf`;
    },

    /**
     * Elimina un evento de tanqueo y lo respalda en la papelera comercial
     */
    async deleteBunkeringEvent(eventId: string, deletedBy: string = 'admin@petral.com'): Promise<any> {
        const res = await fetch(`${getApiBase()}/api/v1/bunker-bootstrapping/event/${encodeURIComponent(eventId)}?deleted_by=${encodeURIComponent(deletedBy)}`, {
            method: 'DELETE',
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Error eliminando evento: ${res.statusText}`);
        }
        return await res.json();
    }
};
