import React, { useState, useEffect } from 'react';
import { LiquidationsExecutivePdfAudit } from '../../components/CommercialForecast/LiquidationsExecutivePdfAudit';
import { FileCheck2, Loader2, Database } from 'lucide-react';

export const LiquidationsAuditPdf_V2: React.FC = () => {
    const [liquidations, setLiquidations] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchLiquidationsDirect = async () => {
            try {
                setLoading(true);
                const supabaseUrl = "https://hjjxooxcpvlvbaxgifbn.supabase.co/rest/v1/voyage_liquidations?select=*&order=voyage_code.asc";
                const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc";
                
                const res = await fetch(supabaseUrl, {
                    headers: {
                        'apikey': serviceKey,
                        'Authorization': `Bearer ${serviceKey}`
                    }
                });

                if (!res.ok) {
                    throw new Error(`HTTP Error ${res.status}`);
                }

                const data = await res.json();
                
                if (isMounted) {
                    if (Array.isArray(data) && data.length > 0) {
                        setLiquidations(data);
                    } else {
                        setError("No se encontraron registros de liquidaciones en la base de datos.");
                    }
                }
            } catch (err: any) {
                console.error("Error directo al cargar liquidaciones desde Supabase REST:", err);
                if (isMounted) {
                    setError("No se pudieron cargar los datos de liquidaciones reales desde Supabase.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchLiquidationsDirect();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <section className="flex flex-col flex-1 gap-4 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-full">
            
            {/* Cabecera de la Herramienta */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                        <FileCheck2 size={22} />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">AUDITORÍA PDF DE LIQUIDACIONES REALES</h2>
                        <p className="text-[11px] text-slate-500 font-medium">Generación de Acta Oficial PDF A4 Landscape comparando los 31 viajes reales vs simulación Spot Matrix Mode</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                    <Database size={15} className="text-emerald-600" />
                    <span>{liquidations.length} Viajes Auditados en Supabase</span>
                </div>
            </div>

            {/* Estado de Carga o Error */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-80 bg-white rounded-xl border border-slate-200 space-y-3">
                    <Loader2 size={32} className="animate-spin text-blue-600" />
                    <p className="text-xs font-bold text-slate-600">Cargando 31 viajes de ejecuciones reales para el reporte PDF...</p>
                </div>
            ) : error ? (
                <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold">
                    {error}
                </div>
            ) : (
                <LiquidationsExecutivePdfAudit liquidations={liquidations} />
            )}

        </section>
    );
};
