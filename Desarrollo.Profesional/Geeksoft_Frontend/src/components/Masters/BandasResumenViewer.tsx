import React, { useState, useEffect, useRef } from 'react';
import { Printer } from 'lucide-react';
import logoPetral from '../../assets/Logo.Petral.png';
import logoGeeksoft from '../../assets/Logo.Geeksoft.png';
import { computePortItems } from './DynamicAuditViewer';
import { ForecastService } from '../../services/api';

const REF_VESSEL = { vessel_name: 'BT MOQUEGUA', loa: 134.16, grt: 8259, dwt: 14298 };
const REF_TONS   = 13500;
const REF_LOAD_RATE  = 500;
const REF_DISCH_RATE = 350;
const REF_TUGS   = 2;
const IS_NATIONAL = true;

const PORT_ROWS = [
    { portId: 'CALLAO',      terminal: 'APM Terminals',           op: 'CARGA',    rate: REF_LOAD_RATE    },
    { portId: 'CALLAO',      terminal: 'APM Terminals',           op: 'DESCARGA', rate: REF_DISCH_RATE   },
    { portId: 'MATARANI',    terminal: 'TISUR S.A.',               op: 'CARGA',    rate: REF_LOAD_RATE    },
    { portId: 'MATARANI',    terminal: 'TISUR S.A.',               op: 'DESCARGA', rate: REF_DISCH_RATE   },
    { portId: 'ILO',         terminal: 'SPCC / Enapu',            op: 'CARGA',    rate: REF_LOAD_RATE    },
    { portId: 'ILO',         terminal: 'SPCC / Enapu',            op: 'DESCARGA', rate: REF_DISCH_RATE   },
    { portId: 'MARCONA',     terminal: 'San Juan SPCC',           op: 'CARGA',    rate: REF_LOAD_RATE    },
    { portId: 'MEJILLONES',  terminal: 'TPM / Directemar',        op: 'CARGA',    rate: REF_LOAD_RATE    },
    { portId: 'MEJILLONES',  terminal: 'TPM / Directemar',        op: 'DESCARGA', rate: REF_DISCH_RATE   },
    { portId: 'BARQUITO',    terminal: 'Codelco / Puerto Ventanas', op: 'CARGA',  rate: REF_LOAD_RATE    },
    { portId: 'ANTOFAGASTA', terminal: 'Terminal Portuario CL',   op: 'CARGA',    rate: REF_LOAD_RATE    },
];

const calcHours = (tons: number, rate: number) => {
    const qOp  = tons / rate;
    const qFijo = 1.5 + 1.0 + 1.5;
    return Math.round((qOp + qFijo) * 10) / 10;
};

const fmt = (v: number | null) =>
    v == null
        ? 'NO HAY'
        : `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusBadge = (min: number, max: number, fijo: number | null): { label: string; color: string } => {
    if (fijo == null)           return { label: '\u2014', color: '#94a3b8' };
    if (fijo >= min && fijo <= max) return { label: '\u2705 EN BANDA',   color: '#15803d' };
    if (fijo > max)             return { label: '\u274c SOBRE MAX', color: '#dc2626' };
    return                             { label: '\ud83d\udd35 BAJO MIN',  color: '#2563eb' };
};

export const BandasResumenViewer: React.FC = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [staticCosts, setStaticCosts] = useState<any[]>([]);
    const [loadingDB, setLoadingDB] = useState(true);

    useEffect(() => {
        ForecastService.getPortCostsStatic()
            .then((data: any[]) => setStaticCosts(data || []))
            .catch(() => setStaticCosts([]))
            .finally(() => setLoadingDB(false));
    }, []);

    const getStaticCost = (portId: string, op: string): number | null => {
        const row = staticCosts.find((r: any) =>
            (r.port_id || '').toUpperCase() === portId.toUpperCase() &&
            (r.operation_type || '').toUpperCase() === op.toUpperCase() &&
            (r.sub_operation_type || '').toUpperCase() === 'MAIN' &&
            (r.vessel_id || '').toUpperCase().replace(/^B\/?T\s*/, '').replace(/[\s_-]+/g, '') === 'MOQUEGUA'
        );
        return row ? Number(row.cost) : null;
    };

    const rows = PORT_ROWS.map(row => {
        const hours = calcHours(REF_TONS, row.rate);
        const minItems = computePortItems(row.portId, REF_VESSEL, hours, IS_NATIONAL, REF_TUGS, REF_TUGS, false);
        const maxItems = computePortItems(row.portId, REF_VESSEL, hours, IS_NATIONAL, REF_TUGS, REF_TUGS, true);
        const min  = minItems.reduce((s, i) => s + i.cost, 0);
        const max  = maxItems.reduce((s, i) => s + i.cost, 0);
        const fijo = getStaticCost(row.portId, row.op);
        return { ...row, min, max, fijo, status: statusBadge(min, max, fijo) };
    });

    const today = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

    const generateHtml = () => {
        const tableRows = rows.map(r => {
            const bg = r.status.label.includes('EN BANDA') ? '#f0fdf4'
                     : r.status.label.includes('SOBRE')    ? '#fef2f2'
                     : r.status.label.includes('BAJO')     ? '#eff6ff'
                     : '#ffffff';
            const fijoStyle = r.fijo == null ? 'color:#94a3b8;font-style:italic;' : '';
            return `<tr style="background:${bg};">
                <td style="border:1px solid #000;padding:3px 6px;font-weight:bold;">${r.portId}</td>
                <td style="border:1px solid #000;padding:3px 6px;">${r.terminal}</td>
                <td style="border:1px solid #000;padding:3px 6px;text-align:center;font-weight:bold;">${r.op}</td>
                <td style="border:1px solid #000;padding:3px 6px;text-align:right;font-family:'Courier New',monospace;">${fmt(r.min)}</td>
                <td style="border:1px solid #000;padding:3px 6px;text-align:right;font-family:'Courier New',monospace;">${fmt(r.max)}</td>
                <td style="border:1px solid #000;padding:3px 6px;text-align:right;font-family:'Courier New',monospace;${fijoStyle}">${fmt(r.fijo)}</td>
                <td style="border:1px solid #000;padding:3px 6px;text-align:center;color:${r.status.color};font-weight:bold;">${r.status.label}</td>
            </tr>`;
        }).join('');

        return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Bandas Tarifarias — PETRAL</title>
<style>
  @page{size:A4 portrait;margin:0;}
  @media print{@page{size:A4 portrait;margin:0;}html,body{margin:0;padding:0;}}
  body{font-family:'Courier New',Courier,monospace;color:#000;background:#fff;font-size:7pt;line-height:1.3;margin:0;padding:10mm 10mm 8mm 10mm;box-sizing:border-box;}
  table{width:100%;border-collapse:collapse;}
  th{background:#1e3a5f;color:#fff;border:1px solid #000;padding:3px 5px;text-align:center;font-size:7pt;text-transform:uppercase;letter-spacing:.5px;}
</style></head><body>
<table style="border-bottom:2px solid #1e3a5f;margin-bottom:6px;">
  <tr>
    <td style="width:15%;"><img src="${logoPetral}" style="height:28px;" alt="Petral"></td>
    <td style="text-align:center;">
      <div style="font-weight:bold;font-size:10pt;letter-spacing:1px;">PETRAL NAVIERA S.A.</div>
      <div style="font-size:7.5pt;">MATRIZ COMPARATIVA DE BANDAS TARIFARIAS PORTUARIAS</div>
      <div style="font-size:6.5pt;color:#475569;">Buque Ref.: BT MOQUEGUA &nbsp;|&nbsp; Carga: 13,500 MT &nbsp;|&nbsp; ${today}</div>
    </td>
    <td style="width:15%;text-align:right;"><img src="${logoGeeksoft}" style="height:28px;" alt="Geeksoft"></td>
  </tr>
</table>

<div style="font-weight:bold;font-size:8pt;margin:4px 0 3px;background:#f1f5f9;padding:2px 5px;border-left:3px solid #1e3a5f;">
  📊 ENCUADRE DE BANDAS — TODOS LOS PUERTOS
</div>

<table style="margin-top:3px;">
  <thead><tr>
    <th style="width:12%;">Puerto</th>
    <th style="width:20%;">Terminal</th>
    <th style="width:10%;">Operación</th>
    <th style="width:14%;">MIN (Hábil)</th>
    <th style="width:14%;">MAX (OT)</th>
    <th style="width:14%;">FIJO DB</th>
    <th style="width:16%;">Estado</th>
  </tr></thead>
  <tbody>${tableRows}</tbody>
</table>

<div style="border:1px solid #cbd5e1;padding:4px 6px;margin-top:6px;font-size:6.5pt;background:#fafafa;">
  <strong>LEYENDA:</strong>&nbsp;
  ✅ EN BANDA = Fijo DB dentro del rango [MIN, MAX] &nbsp;|&nbsp;
  ❌ SOBRE MAX = Fijo DB mayor al escenario pesimista &nbsp;|&nbsp;
  🔵 BAJO MIN = Fijo DB menor al escenario ordinario &nbsp;|&nbsp;
  NO HAY = Sin tarifa fija en DB para esta combinación
</div>
<div style="margin-top:5px;font-size:6pt;color:#64748b;border-top:1px solid #cbd5e1;padding-top:3px;">
  MIN = Office Hours sin OT &nbsp;|&nbsp; MAX = Zarpe nocturno/dominical/feriado +25% por ítem elegible &nbsp;|&nbsp;
  FIJO = port_cost_static Supabase, sub_op=MAIN, vessel=MOQUEGUA &nbsp;|&nbsp; Motor: DynamicAuditViewer.computePortItems()
</div>
</body></html>`;
    };

    const handlePrint = () => {
        const html = generateHtml();
        const iframe = iframeRef.current;
        if (!iframe) return;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
        doc.open(); doc.write(html); doc.close();
        setTimeout(() => iframe.contentWindow?.print(), 600);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm">
                <div>
                    <h2 className="font-black text-slate-800 text-sm uppercase tracking-wide">Bandas Tarifarias — Todos los Puertos</h2>
                    <p className="text-xs text-slate-500 mt-0.5">MIN · MAX · FIJO DB — BT MOQUEGUA / 13,500 MT</p>
                </div>
                <button onClick={handlePrint} disabled={loadingDB}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50">
                    <Printer size={14} /> Imprimir / PDF
                </button>
            </div>

            {loadingDB ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Cargando datos de DB...</div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-800 text-white">
                                {['Puerto','Terminal','Op.','MIN (Hábil)','MAX (OT)','FIJO DB','Estado'].map(h => (
                                    <th key={h} className="px-3 py-2 font-bold uppercase tracking-wide text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, idx) => {
                                const bg = r.status.label.includes('EN BANDA') ? 'bg-green-50'
                                         : r.status.label.includes('SOBRE')    ? 'bg-red-50'
                                         : r.status.label.includes('BAJO')     ? 'bg-blue-50'
                                         : '';
                                return (
                                    <tr key={idx} className={`border-b border-slate-100 ${bg}`}>
                                        <td className="px-3 py-2 font-bold text-slate-800">{r.portId}</td>
                                        <td className="px-3 py-2 text-slate-600 text-xs">{r.terminal}</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.op === 'CARGA' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{r.op}</span>
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono text-slate-700">{fmt(r.min)}</td>
                                        <td className="px-3 py-2 text-right font-mono text-slate-700">{fmt(r.max)}</td>
                                        <td className={`px-3 py-2 text-right font-mono ${r.fijo == null ? 'text-slate-400 italic' : 'text-slate-700'}`}>{fmt(r.fijo)}</td>
                                        <td className="px-3 py-2 text-center font-bold" style={{ color: r.status.color }}>{r.status.label}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <iframe ref={iframeRef} style={{ display: 'none' }} title="print-bandas" />
        </div>
    );
};
