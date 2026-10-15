/**
 * Types & Interfaces for Commercial Trash Bin (Papelera de Reciclaje Comercial)
 * Architecture V2 - PETRAL ONE
 */

export const COMMERCIAL_TRASH_ENTITIES = ['CIERRE', 'COTIZACION', 'PRESUPUESTO', 'MATRIZ'] as const;

export type TrashEntityType = 'CIERRE' | 'COTIZACION' | 'PRESUPUESTO' | 'MATRIZ' | 'ALL';

export interface TrashItem {
    id: string;
    entity_type: 'CIERRE' | 'COTIZACION' | 'PRESUPUESTO' | 'MATRIZ';
    entity_id: string;
    source_table: string;
    document_name: string;
    client_name?: string | null;
    vessel_id?: string | null;
    payload: Record<string, any>;
    deleted_by: string;
    deleted_at: string;
    restored: boolean;
    restored_at?: string | null;
    restored_by?: string | null;
}

export interface TrashFiltersState {
    entity_type: TrashEntityType;
    client_name: string;
    include_restored: boolean;
    search: string;
}

export interface RestoreResponse {
    status: string;
    message: string;
    entity_id?: string;
    source_table?: string;
}
