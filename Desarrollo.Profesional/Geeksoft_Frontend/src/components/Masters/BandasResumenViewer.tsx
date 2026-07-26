import React, { useState, useEffect, useRef } from 'react';
import { Printer } from 'lucide-react';
import logoPetral from '../../assets/Logo.Petral.png';
import logoGeeksoft from '../../assets/Logo.Geeksoft.png';
import { computePortItems } from './DynamicAuditViewer';
import { ForecastService } from '../../services/api';

// Puertos soportados por el motor y sus terminales / tasas de referencia
const MOTOR_PORTS: Record<string, { terminal: string; loadRate: number; dischRate: number }> = {
    'CALLAO':      { terminal: 'APM Terminals',              loadRate: 500, dischRate: 350 },
    'MATARANI':    { terminal: 'TISUR S.A.',                  loadRate: 500, dischRate: 350 },
    'ILO':         { terminal: 'SPCC / Enapu',               loadRate: 500, dischRate: 350 },
    'MARCONA':     { terminal: 'San Juan SPCC',              loadRate: 500, dischRate: 350 },
    'MEJILLONES':  { terminal: 'TPM / Directemar',           loadRate: 500, dischRate: 350 },
    'PUERTO ANGAMOS': { terminal: 'Puerto Angamos CL',       loadRate: 500, dischRate: 350 },
    'BARQUITO':    { terminal: 'Codelco / Puerto Ventanas',  loadRate: 500, dischRate: 350 },
    'ARICA':       { terminal: 'Terminal Puerto Arica',      loadRate: 500, dischRate: 350 },
    'IQUIQUE':     { terminal: 'ZOFRI / Puerto Iquique',     loadRate: 500, dischRate: 350 },
    'ANTOFAGASTA': { terminal: 'Terminal Portuario CL',      loadRate: 500, dischRate: 350 },
};

const REF_TONS = 13500;
const REF_TUGS = 2;
const IS_NATIONAL = true;

const calcHours = (tons: number, rate: number) => {
    const qOp = tons / rate;
    const qFijo = 1.5 + 1.0 + 1.5;
    return Math.round((qOp + qFijo) * 10) / 10;
};

const fmt = (v: number | null) =>
    v == null
        ? 'NO HAY'
        : `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusBadge = (min: number, max: number, fijo: number | null): { label: string; color: string } => {
    if (fijo == null)               return { label: '—',           color: '#94a3b8' };
    if (fijo >= min && fijo <= max) return { label: '✅ EN BANDA',  color: '#15803d' };
    if (fijo > max)                 return { label: '❌ SOBRE MAX', color: '#dc2626' };
    return                                 { label: '🔵 BAJO MIN',  color: '#2563eb' };
};

const normalizeVid = (s: string) =>
    (s || '').toUpperCase().replace(/^B\/?T\s*/, '').replace(/[\s_-]+/g, '');

export const BandasResumenViewer: React.FC = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [vessels,     setVessels]     = useState<any[]>([]);
    const [dbPorts,     setDbPorts]     = useState<any[]>([]);
    const [staticCosts, setStaticCosts] = useState<any[]>([]);
    const [loadingDB,   setLoadingDB]   = useState(true);

    useEffect(() => {
        Promise.all([
            ForecastService.getVessels().catch(() => []),
            ForecastService.getPorts().catch(() => []),
            ForecastService.getPortCostsStatic().catch(() => []),
        ]).then(([vs, ps, sc]) => {
            setVessels(vs || []);
            setDbPorts(ps || []);
            setStaticCosts(sc || []);
        }).finally(() => setLoadingDB(false));
    }, []);

    // Solo puertos que existen en la DB Y tienen soporte en el motor
    const activePorts = dbPorts
        .map((p: any) => (p.port_id || '').toUpperCase())
        .filter((pid: string) => MOTOR_PORTS[pid]);

    // Filas de operaciones por puerto activo
    const portRows = activePorts.flatMap((portId: string) => {
        const meta = MOTOR_PORTS[portId];
        return [
            { portId, terminal: meta.terminal, op: 'CARGA',    rate: meta.loadRate  },
            { portId, terminal: meta.terminal, op: 'DESCARGA', rate: meta.dischRate },
        ];
    });

    const getStaticCost = (portId: string, op: string, vesselId: string): number | null => {
        const vid = normalizeVid(vesselId);
        const row = staticCosts.find((r: any) =>
            (r.port_id || '').toUpperCase() === portId &&
            (r.operation_type || '').toUpperCase() === op &&
            (r.sub_operation_type || '').toUpperCase() === 'MAIN' &&
            normalizeVid(r.vessel_id || '') === vid
        );
        return row ? Number(row.cost) : null;
    };

    const calcRows = (vessel: any) =>
        portRows.map(row => {
            const v = { vessel_name: vessel.vessel_name, loa: Number(vessel.length || 0), grt: Number(vessel.grt || 0), dwt: Number(vessel.dwt || 0) };
            const hours    = calcHours(REF_TONS, row.rate);
            const minItems = computePortItems(row.portId, v, hours, IS_NATIONAL, REF_TUGS, REF_TUGS, false);
            const maxItems = computePortItems(row.portId, v, hours, IS_NATIONAL, REF_TUGS, REF_TUGS, true);
            const min  = minItems.reduce((s, i) => s + i.cost, 0);
            const max  = maxItems.reduce((s, i) => s + i.cost, 0);
            const fijo = getStaticCost(row.portId, row.op, vessel.vessel_id);
            return { ...row, min, max, fijo, status: statusBadge(min, max, fijo) };
        });

    const today = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

    // ── PDF GENERATION ─────────────────────────────────────────────────────────
    const generateHtml = () => {
        const signaturesBlock = `
        <div class="signatures">
          <!-- Fila de firmas: Petral izquierda / Sandra derecha -->
          <table style="width:100%;border:none;font-size:6.5pt;margin-bottom:4px;">
            <tr>
              <td style="width:50%;vertical-align:top;padding-right:12px;">
                <div style="font-weight:bold;margin-bottom:2px;">AUDITORÍA NAVIERA PETRAL S.A. — BANDAS TARIFARIAS:</div>
                <div style="border-bottom:1px dashed #000;height:24px;margin-bottom:2px;"></div>
                <span style="font-size:6pt;color:#475569;">Firma Responsable Auditoría Engine — Geeksoft</span>
              </td>
              <td style="width:50%;vertical-align:top;padding-left:12px;">
                <div style="font-weight:bold;margin-bottom:2px;">V°B° EXPERTA SANDRA — LIQUIDACIÓN OFICIAL:</div>
                <div style="border-bottom:1px dashed #000;height:24px;margin-bottom:2px;"></div>
                <span style="font-size:6pt;color:#475569;">Firma y Nombre — Experta Sandra</span>
              </td>
            </tr>
          </table>
        </div>`;

        const leyendaBlock = `
        <div style="border:1px solid #cbd5e1;padding:3px 6px;margin-top:4px;font-size:6pt;background:#fafafa;">
          <strong>LEYENDA:</strong>&nbsp;
          ✅ EN BANDA = Fijo DB ∈ [MIN,MAX] &nbsp;|&nbsp;
          ❌ SOBRE MAX = Fijo DB &gt; MAX &nbsp;|&nbsp;
          🔵 BAJO MIN = Fijo DB &lt; MIN &nbsp;|&nbsp;
          NO HAY = Sin dato en DB &nbsp;|&nbsp;
          MIN = Office Hours sin OT &nbsp;|&nbsp; MAX = OT +25% por ítem &nbsp;|&nbsp;
          FIJO = port_cost_static Supabase sub_op=MAIN
        </div>`;

        const pageHeader = `
        <table style="width:100%;border-bottom:2px solid #1e3a5f;margin-bottom:5px;">
          <tr>
            <td style="width:15%;"><img src="${logoPetral}" style="height:26px;" alt="Petral"></td>
            <td style="text-align:center;">
              <div style="font-weight:bold;font-size:9.5pt;letter-spacing:1px;">PETRAL NAVIERA S.A.</div>
              <div style="font-size:7pt;">ACTA — MATRIZ COMPARATIVA DE BANDAS TARIFARIAS PORTUARIAS</div>
              <div style="font-size:6pt;color:#475569;">Carga Referencia: 13,500 MT &nbsp;|&nbsp; ${today}</div>
            </td>
            <td style="width:15%;text-align:right;"><img src="${logoGeeksoft}" style="height:26px;" alt="Geeksoft"></td>
          </tr>
        </table>`;

        const renderVesselHtml = (vessel: any) => {
            const rows = calcRows(vessel);
            const tableRows = rows.map(r => {
                const bg = r.status.label.includes('EN BANDA') ? '#f0fdf4'
                         : r.status.label.includes('SOBRE')    ? '#fef2f2'
                         : r.status.label.includes('BAJO')     ? '#eff6ff'
                         : '#ffffff';
                const fijoStyle = r.fijo == null ? 'color:#94a3b8;font-style:italic;' : '';
                return `<tr style="background:${bg};">
                    <td style="border:1px solid #000;padding:2px 5px;font-weight:bold;text-align:center;">${r.portId}</td>
                    <td style="border:1px solid #000;padding:2px 5px;text-align:center;">${r.terminal}</td>
                    <td style="border:1px solid #000;padding:2px 5px;text-align:center;font-weight:bold;">${r.op}</td>
                    <td style="border:1px solid #000;padding:2px 5px;text-align:center;font-family:'Courier New',monospace;">${fmt(r.min)}</td>
                    <td style="border:1px solid #000;padding:2px 5px;text-align:center;font-family:'Courier New',monospace;">${fmt(r.max)}</td>
                    <td style="border:1px solid #000;padding:2px 5px;text-align:center;font-family:'Courier New',monospace;${fijoStyle}">${fmt(r.fijo)}</td>
                    <td style="border:1px solid #000;padding:2px 5px;text-align:center;color:${r.status.color};font-weight:bold;">${r.status.label}</td>
                </tr>`;
            }).join('');
            return `
            <div style="margin-bottom:5px;">
              <div style="font-weight:bold;font-size:7.5pt;background:#1e3a5f;color:#fff;padding:3px 6px;margin-bottom:2px;">
                🚢 ${vessel.vessel_name} &nbsp;|&nbsp; GRT: ${Number(vessel.grt).toLocaleString()} &nbsp;|&nbsp; LOA: ${Number(vessel.length).toFixed(2)}m &nbsp;|&nbsp; DWT: ${Number(vessel.dwt).toLocaleString()}
              </div>
              <table style="width:100%;border-collapse:collapse;font-size:6.8pt;">
                <thead><tr style="background:#334155;color:#fff;">
                  <th style="border:1px solid #000;padding:2px 5px;text-align:center;">Puerto</th>
                  <th style="border:1px solid #000;padding:2px 5px;text-align:center;">Terminal</th>
                  <th style="border:1px solid #000;padding:2px 5px;text-align:center;">Op.</th>
                  <th style="border:1px solid #000;padding:2px 5px;text-align:center;">MIN (Hábil)</th>
                  <th style="border:1px solid #000;padding:2px 5px;text-align:center;">MAX (OT)</th>
                  <th style="border:1px solid #000;padding:2px 5px;text-align:center;">FIJO DB</th>
                  <th style="border:1px solid #000;padding:2px 5px;text-align:center;">Estado</th>
                </tr></thead>
                <tbody>${tableRows}</tbody>
              </table>
            </div>`;
        };

        // 2 buques por página
        const pages: string[] = [];
        for (let i = 0; i < vessels.length; i += 2) {
            const pair = vessels.slice(i, i + 2);
            const isLast = i + 2 >= vessels.length;
            const content = pair.map(v => renderVesselHtml(v)).join('');
            const pageBreak = isLast ? '' : '<div style="page-break-after:always;"></div>';
            pages.push(`<div class="page-wrap">${pageHeader}${content}${leyendaBlock}${signaturesBlock}</div>${pageBreak}`);
        }

        return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Acta Bandas Tarifarias — PETRAL</title>
<style>
  @page{size:A4 portrait;margin:0;}
  @media print{@page{size:A4 portrait;margin:0;}html,body{margin:0;padding:0;}}
  body{font-family:'Courier New',Courier,monospace;color:#000;background:#fff;font-size:7pt;line-height:1.3;margin:0;padding:0;}
  .page-wrap{height:277mm;padding:8mm 16.5mm 8mm 16.5mm;box-sizing:border-box;display:flex;flex-direction:column;}
  .signatures{margin-top:6px;border-top:1.5px solid #000;padding-top:4px;display:flex;flex-direction:column;flex:1;min-height:0;}
  .obs-box{flex:1;min-height:50px;border:1.5px solid #000;background:#fafafa;width:100%;box-sizing:border-box;}
</style></head><body>
${pages.join('')}
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

    // ── UI ─────────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm">
                <div>
                    <h2 className="font-black text-slate-800 text-sm uppercase tracking-wide">Bandas Tarifarias — Toda la Flota</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        MIN · MAX · FIJO DB · {vessels.length} buques · {activePorts.length} puertos activos · 13,500 MT referencia
                    </p>
                </div>
                <button onClick={handlePrint} disabled={loadingDB}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50">
                    <Printer size={14} /> Imprimir Acta / PDF
                </button>
            </div>

            {loadingDB ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Cargando flota, puertos y DB...</div>
            ) : (
                <div className="flex flex-col gap-5">
                    {vessels.map(vessel => {
                        const rows = calcRows(vessel);
                        return (
                            <div key={vessel.vessel_id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-slate-800 text-white px-4 py-2 flex items-center gap-3">
                                    <span className="text-sm">🚢</span>
                                    <span className="font-black text-sm uppercase tracking-wide">{vessel.vessel_name}</span>
                                    <span className="text-slate-400 text-xs">GRT {Number(vessel.grt).toLocaleString()}</span>
                                    <span className="text-slate-400 text-xs">LOA {Number(vessel.length).toFixed(2)}m</span>
                                    <span className="text-slate-400 text-xs">DWT {Number(vessel.dwt).toLocaleString()}</span>
                                </div>
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-slate-200">
                                            {['Puerto','Terminal','Op.','MIN (Hábil)','MAX (OT)','FIJO DB','Estado'].map(h => (
                                                <th key={h} className="px-3 py-2 font-bold uppercase tracking-wide text-center text-slate-600">{h}</th>
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
                                                    <td className="px-3 py-1.5 text-center font-bold text-slate-800">{r.portId}</td>
                                                    <td className="px-3 py-1.5 text-center text-slate-600">{r.terminal}</td>
                                                    <td className="px-3 py-1.5 text-center">
                                                        <span className={`px-2 py-0.5 rounded font-bold ${r.op === 'CARGA' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{r.op}</span>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-center font-mono text-slate-700">{fmt(r.min)}</td>
                                                    <td className="px-3 py-1.5 text-center font-mono text-slate-700">{fmt(r.max)}</td>
                                                    <td className={`px-3 py-1.5 text-center font-mono ${r.fijo == null ? 'text-slate-400 italic' : 'text-slate-700'}`}>{fmt(r.fijo)}</td>
                                                    <td className="px-3 py-1.5 text-center font-bold" style={{ color: r.status.color }}>{r.status.label}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            )}

            <iframe ref={iframeRef} style={{ display: 'none' }} title="print-bandas" />
        </div>
    );
};
