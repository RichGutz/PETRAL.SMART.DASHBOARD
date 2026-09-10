import os
import json
import base64

BASE_DIR = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD"
COTIZACIONES_DIR = os.path.join(BASE_DIR, "Cotizaciones")
HTML_OUT_LOCAL = os.path.join(COTIZACIONES_DIR, "presentacion_voyage_liquidator.html")
HTML_OUT_FRONTEND = os.path.join(BASE_DIR, r"Desarrollo.Profesional\Geeksoft_Frontend\public\presentacion_voyage_liquidator.html")

def generate_interactive_deck():
    html_content = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Del Multicotizador al Multi-Liquidador — DELFOS & PETRAL</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        navy: {
                            900: '#071326',
                            800: '#0B1E3B',
                            700: '#0F2C59',
                            600: '#163E7A'
                        },
                        petral: {
                            blue: '#0F4C81',
                            teal: '#0E7490',
                            gold: '#D97706',
                            light: '#F8FAFC'
                        }
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        outfit: ['Outfit', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace']
                    }
                }
            }
        }
    </script>
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        body, html {
            margin: 0; padding: 0; width: 100%; height: 100%;
            overflow: hidden; background: #071326; color: #F8FAFC;
            font-family: 'Inter', sans-serif;
            user-select: none;
        }

        .slide {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            padding: 80px 70px 50px 70px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            opacity: 0;
            pointer-events: none;
            transform: scale(0.97) translateY(12px);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .slide.active {
            opacity: 1;
            pointer-events: auto;
            transform: scale(1) translateY(0);
        }

        .glass-panel {
            background: rgba(15, 44, 89, 0.45);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 16px;
        }

        .glass-card {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            transition: all 0.25s ease;
        }

        .glass-card:hover {
            background: rgba(255, 255, 255, 0.07);
            border-color: rgba(14, 116, 144, 0.4);
            transform: translateY(-2px);
        }

        .glow-teal {
            box-shadow: 0 0 25px rgba(14, 116, 144, 0.25);
        }

        .glow-gold {
            box-shadow: 0 0 25px rgba(217, 119, 6, 0.25);
        }

        #progressBar {
            position: fixed; top: 0; left: 0; height: 5px; z-index: 100;
            background: linear-gradient(90deg, #0E7490, #2563EB, #D97706);
            transition: width 0.3s ease;
        }

        .code-console {
            background: #050B14;
            border: 1px solid #1E293B;
            border-radius: 10px;
            font-family: 'JetBrains Mono', monospace;
            color: #94A3B8;
        }

        /* Custom Scrollbar for inner cards */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
    </style>
</head>
<body class="bg-navy-900 text-slate-100 flex flex-col justify-between h-screen relative">

    <div id="progressBar" style="width: 10%;"></div>

    <!-- Top Navigation Header -->
    <header class="fixed top-0 left-0 right-0 h-16 px-10 flex items-center justify-between z-50 pointer-events-none">
        <div class="flex items-center gap-3 pointer-events-auto">
            <div class="h-9 px-3.5 bg-navy-700/80 rounded-lg border border-white/10 flex items-center gap-2 backdrop-blur-md">
                <span class="text-xs font-outfit font-black tracking-widest text-cyan-400">DELFOS</span>
                <span class="text-slate-500 text-xs">|</span>
                <span class="text-xs font-bold text-slate-300">PETRAL COMMERCIAL SUITE</span>
            </div>
            <div class="hidden md:flex px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] font-semibold text-amber-300">
                Propuesta de Alcance & Memoria Aritmética
            </div>
        </div>

        <div class="flex items-center gap-4 pointer-events-auto">
            <span id="slideCounter" class="text-xs font-mono font-bold text-slate-400 bg-navy-800/80 px-3 py-1 rounded-md border border-white/10">
                01 / 10
            </span>
            <button onclick="toggleFullscreen()" class="p-2 text-slate-400 hover:text-white bg-navy-800/80 hover:bg-navy-700 rounded-lg border border-white/10 transition" title="Pantalla Completa (F)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
            </button>
        </div>
    </header>

    <!-- SLIDES CONTAINER -->
    <main class="relative w-full h-full">

        <!-- SLIDE 1: PORTADA -->
        <section class="slide active" data-slide="1">
            <div class="flex-1 flex flex-col justify-center max-w-5xl mx-auto text-center items-center">
                <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wider uppercase mb-6 glow-teal">
                    <span>✨ Nueva Arquitectura de Control Naviero</span>
                </div>
                <h1 class="text-4xl md:text-6xl font-outfit font-black tracking-tight text-white mb-6 leading-tight">
                    Del <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Multicotizador</span> al <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Multi-Liquidador</span>
                </h1>
                <p class="text-lg md:text-xl text-slate-300 font-light max-w-3xl leading-relaxed mb-8">
                    Cierre integral del ciclo comercial: De la <b>estimación teórica proforma antes del zarpe</b> a la <b>auditoría de ingresos y utilidades reales en caja post-viaje</b>.
                </p>

                <div class="flex flex-wrap justify-center gap-4">
                    <a href="./Plantilla_Voyage_Liquidator_Master.xlsx" download class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2 border border-emerald-400/30">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Descargar Excel Maestro (Clon UI)
                    </a>
                    <a href="./PROPUESTA_Y_ALCANCE_VOYAGE_LIQUIDATOR_DELFOS.pdf" target="_blank" class="px-6 py-3 bg-navy-700 hover:bg-navy-600 text-cyan-300 font-bold rounded-xl border border-cyan-500/30 shadow-lg transition flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Ver Propuesta PDF Formal
                    </a>
                </div>
            </div>
            <div class="text-center text-xs text-slate-500">
                Usa las teclas <b>← →</b> o los botones inferiores para navegar
            </div>
        </section>

        <!-- SLIDE 2: EL PROBLEMA & LA BRECHA -->
        <section class="slide" data-slide="2">
            <div>
                <span class="text-xs font-bold text-amber-400 uppercase tracking-widest">Diagnóstico Operativo</span>
                <h2 class="text-3xl font-outfit font-black text-white mt-1">La Brecha entre la Proforma y la Realidad</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-auto">
                <div class="glass-panel p-6 border-l-4 border-l-cyan-500">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold">01</div>
                        <h3 class="text-xl font-bold text-cyan-300">Antes del Zarpe (Teoría)</h3>
                    </div>
                    <ul class="space-y-3 text-sm text-slate-300">
                        <li class="flex items-start gap-2">
                            <span class="text-cyan-400 font-bold">✓</span>
                            <span>Carga estimada en contrato (ej. 14,250 TM).</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="text-cyan-400 font-bold">✓</span>
                            <span>Consumo de combustible proyectado por días de carta náutica.</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="text-cyan-400 font-bold">✓</span>
                            <span>Costos portuarios proforma de agencia (PDA estándar).</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="text-cyan-400 font-bold">✓</span>
                            <span><b>Resultado:</b> P&L estimado de cotización comercial.</span>
                        </li>
                    </ul>
                </div>

                <div class="glass-panel p-6 border-l-4 border-l-amber-500">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 font-bold">02</div>
                        <h3 class="text-xl font-bold text-amber-300">Durante y Post-Viaje (Realidad)</h3>
                    </div>
                    <ul class="space-y-3 text-sm text-slate-300">
                        <li class="flex items-start gap-2">
                            <span class="text-amber-400 font-bold">⚡</span>
                            <span>Carga real certificada en el <b>Bill of Lading (B/L)</b>.</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="text-amber-400 font-bold">⚡</span>
                            <span>Consumo real medido por <b>sondas físicas en tanques (ROBs)</b>.</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="text-amber-400 font-bold">⚡</span>
                            <span>Eventos de <b>Shifting</b> (desatraque a bahía por prioridad portuaria).</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="text-amber-400 font-bold">⚡</span>
                            <span><b>Resultado:</b> P&L real e ingresos auditados en cuenta bancaria.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="bg-navy-800/80 p-4 rounded-xl border border-white/10 text-xs text-slate-300 flex items-center justify-between">
                <span><b>Objetivo:</b> Integrar un módulo gemelo que admita sobreescritura de datos en caliente para auditar cada viaje.</span>
                <span class="text-cyan-400 font-bold">Delfos Commercial Engine</span>
            </div>
        </section>

        <!-- SLIDE 3: MULTICOTIZADOR TEÓRICO -->
        <section class="slide" data-slide="3">
            <div>
                <span class="text-xs font-bold text-cyan-400 uppercase tracking-widest">Herramienta Actual</span>
                <h2 class="text-3xl font-outfit font-black text-white mt-1">Cómo Funciona el Multicotizador (Voyage Calculator)</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-5 my-auto">
                <div class="glass-card p-5">
                    <div class="text-xs font-mono text-cyan-400 mb-2">BLOQUE 1</div>
                    <h4 class="font-bold text-white mb-2">Ficha Técnica & Búnker</h4>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        Carga las especificaciones del buque (GRT, DWT, DWCC, velocidad $11.5\,\text{kts}$, calado) y cotiza el precio de IFO ($680/t) y MDO ($950/t).
                    </p>
                </div>

                <div class="glass-card p-5">
                    <div class="text-xs font-mono text-cyan-400 mb-2">BLOQUE 2</div>
                    <h4 class="font-bold text-white mb-2">Grilla de Tramos & Puertos</h4>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        Calcula distancias náuticas, factor clima ($+3\%$), días de navegación en mar y días de puerto según ritmos contractuales de bombeo.
                    </p>
                </div>

                <div class="glass-card p-5">
                    <div class="text-xs font-mono text-cyan-400 mb-2">BLOQUE 3</div>
                    <h4 class="font-bold text-white mb-2">Tarjetas P&L Proforma</h4>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        Determina Gross Revenue, costos de combustible, gastos portuarios PDA, comisiones, P&L neto proyectado y margen operativo %.
                    </p>
                </div>
            </div>

            <div class="glass-panel p-4 flex items-center justify-between text-xs">
                <span class="text-slate-300"><b>Propósito:</b> Fijar tarifas comerciales competitivas que aseguren el cumplimiento del TCE Target del armador.</span>
                <span class="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 font-bold rounded">Simulación Previa al Zarpe</span>
            </div>
        </section>

        <!-- SLIDE 4: MEMORIA ARITMÉTICA -->
        <section class="slide" data-slide="4">
            <div>
                <span class="text-xs font-bold text-cyan-400 uppercase tracking-widest">Motor Matemático Interna</span>
                <h2 class="text-3xl font-outfit font-black text-white mt-1">Memoria de Cálculo Aritmético Pierna por Pierna</h2>
            </div>

            <div class="code-console p-4 overflow-x-auto text-[11px] leading-tight my-auto max-h-[340px]">
<span class="text-cyan-400 font-bold">ARITMÉTICA EXPLICATIVA Y ORIGEN DE LOS DÍAS (MAR VS PUERTO):</span>

• <span class="text-amber-400 font-bold">PIERNA #1 [BALLAST]:</span> ILO ➔ MARCONA | Distancia: 280.0 NM
  🌊 Días de Mar (1.04d): [280.0 NM × (1 + 3.0% WF)] / [11.5 kts × 24h] = 1.04 Días
     ↳ Búnker Mar: 1.04d × 12.0 t/d IFO × $680.00 = <span class="text-emerald-400 font-bold">$8,486.40 USD</span>
  ⚓ Días de Puerto: 0.00 Días (Pierna en Lastre)

• <span class="text-green-400 font-bold">PIERNA #2 [LADEN]:</span> MARCONA ➔ CALLAO | Distancia: 220.0 NM
  🌊 Días de Mar (0.82d): [220.0 NM × (1 + 3.0% WF)] / [11.5 kts × 24h] = 0.82 Días
     ↳ Búnker Mar: 0.82d × 12.0 t/d IFO × $680.00 = $6,691.20 USD
  ⚓ Días Puerto (3.08d): Carga (14,250t/500t/h = 1.19d) + Descarga (14,250t/345t/h = 1.72d) + Overheads (0.17d) = 3.08 Días
     ↳ Búnker Puerto: 4.62 t IFO + 3.70 t MDO = $6,656.60 USD
  🔥 Búnker Total Pierna: $6,691.20 + $6,656.60 = <span class="text-emerald-400 font-bold">$13,347.80 USD</span>
  💵 Ingreso Flete Leg: <span class="text-cyan-300 font-bold">$213,750.00 USD</span> (14,250 TM × $15.00/TM)

• <span class="text-purple-400 font-bold">PIERNA #3 [BUNKERING]:</span> CALLAO ➔ ILO | Distancia: 440.0 NM
  🌊 Días de Mar (1.48d): [440.0 NM × 1.03] / [11.5 kts × 24h] = 1.48 Días | Búnker: $12,076.80 USD
  ⚓ Días de Puerto (0.50d): Escala de Bunkering Callao | Búnker Puerto: $1,080.00 USD
            </div>

            <div class="flex justify-between items-center text-xs text-slate-400">
                <span>Esta misma trazabilidad matemática alimenta los cálculos del Multi-Liquidador.</span>
                <span class="text-slate-300 font-mono">Precision Engine v2.4</span>
            </div>
        </section>

        <!-- SLIDE 5: MULTILIQUIDADOR REAL -->
        <section class="slide" data-slide="5">
            <div>
                <span class="text-xs font-bold text-amber-400 uppercase tracking-widest">Nueva Funcionalidad</span>
                <h2 class="text-3xl font-outfit font-black text-white mt-1">Cómo va a Funcionar el Voyage Liquidator</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-5 my-auto">
                <div class="glass-card p-5 border-t-2 border-t-amber-500">
                    <div class="text-amber-400 font-bold text-sm mb-2">1. Captura Real Oficial</div>
                    <p class="text-xs text-slate-300 leading-relaxed mb-3">
                        Número de viaje correlativo (`DM-2026-042`), fecha oficial de emisión del <b>Bill of Lading (B/L)</b>, tonelaje certificado y duración cronometrada.
                    </p>
                    <span class="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded text-[10px] font-mono">Base Jurídica & Contable</span>
                </div>

                <div class="glass-card p-5 border-t-2 border-t-cyan-500">
                    <div class="text-cyan-400 font-bold text-sm mb-2">2. Combustible por Sondas</div>
                    <p class="text-xs text-slate-300 leading-relaxed mb-3">
                        Lectura de inventario de tanques en inicio vs. fin de viaje (**ROBs**). Cálculo de consumo real de IFO y MDO sin supuestos teóricos.
                    </p>
                    <span class="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 rounded text-[10px] font-mono">Consumo Físico Auditado</span>
                </div>

                <div class="glass-card p-5 border-t-2 border-t-emerald-500">
                    <div class="text-emerald-400 font-bold text-sm mb-2">3. P&L Real en Caja</div>
                    <p class="text-xs text-slate-300 leading-relaxed mb-3">
                        Facturación final de flete, compensaciones por **Shifting**, liquidación de **Demurrage / Despatch** y gastos reales de puerto (**FDA**).
                    </p>
                    <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded text-[10px] font-mono">Utilidad Neta Real</span>
                </div>
            </div>

            <div class="bg-navy-800/80 p-4 rounded-xl border border-white/10 text-xs text-slate-300 flex items-center justify-between">
                <span><b>Beneficio:</b> Permite al usuario sobreescribir cualquier dato en caliente y obtener la liquidación instantánea.</span>
                <span class="text-amber-400 font-bold">Liquidación Auditada</span>
            </div>
        </section>

        <!-- SLIDE 6: EL FACTOR SHIFTING -->
        <section class="slide" data-slide="6">
            <div>
                <span class="text-xs font-bold text-amber-400 uppercase tracking-widest">Realidad Portuaria</span>
                <h2 class="text-3xl font-outfit font-black text-white mt-1">El Fenómeno de Shifting (Desatraque Forzoso)</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-auto">
                <div class="glass-panel p-6">
                    <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span class="text-amber-400">⚓</span> ¿Qué ocurre en el puerto?
                    </h3>
                    <p class="text-sm text-slate-300 leading-relaxed mb-4">
                        Cuando el buque de ácido o concentrado ya está atracado en muelle, la autoridad portuaria o el terminal solicita su <b>retiro temporal hacia la bahía</b> para permitir la entrada de un buque de mayor prioridad.
                    </p>
                    <div class="p-3 bg-navy-900/60 rounded-lg border border-white/10 text-xs text-slate-400">
                        El barco queda fondeado esperando su segundo llamado de atraque, consumiendo combustible auxiliar y sumando días de estadía.
                    </div>
                </div>

                <div class="glass-panel p-6">
                    <h3 class="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2">
                        <span class="text-cyan-400">💰</span> ¿Cómo lo resuelve el Multi-Liquidador?
                    </h3>
                    <ul class="space-y-3 text-xs text-slate-300">
                        <li class="flex items-start gap-2">
                            <span class="text-emerald-400 font-bold">1.</span>
                            <span><b>Ingreso por Compensación ($):</b> Facturación extraordinaria acordada con el fletador/terminal (<code>+ shifting_revenue</code>).</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="text-amber-400 font-bold">2.</span>
                            <span><b>Días Adicionales:</b> Registro de las horas de espera en bahía que impactan la rotación de flota.</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="text-cyan-400 font-bold">3.</span>
                            <span><b>Consumo de Búnker:</b> Captura del consumo extra de MDO en maniobras de desatraque/reatraque y generadores.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="text-xs text-slate-400 text-center">
                El sistema calcula automáticamente el efecto neto: <b>Compensación Cobrada vs. Costo de Búnker & Días Extra</b>.
            </div>
        </section>

        <!-- SLIDE 7: MATRIZ DE EJECUCIÓN -->
        <section class="slide" data-slide="7">
            <div>
                <span class="text-xs font-bold text-cyan-400 uppercase tracking-widest">Línea de Tiempo Operacional</span>
                <h2 class="text-3xl font-outfit font-black text-white mt-1">Matriz de Viajes Ejecutados (Ledger Financiero)</h2>
            </div>

            <div class="glass-panel p-5 my-auto overflow-hidden">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex justify-between">
                    <span>Bitácora Cronológica de Travesías Realizadas (Año 2026)</span>
                    <span class="text-cyan-400">Vista tipo Grilla Financiera</span>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-[11px] text-left border-collapse font-mono">
                        <thead>
                            <tr class="bg-navy-800 text-slate-300 border-b border-white/10">
                                <th class="p-2.5">TRIP ID</th>
                                <th class="p-2.5">BUQUE</th>
                                <th class="p-2.5">CLIENTE</th>
                                <th class="p-2.5">RUTA REAL</th>
                                <th class="p-2.5 text-right">FECHA B/L</th>
                                <th class="p-2.5 text-right">CARGA (TM)</th>
                                <th class="p-2.5 text-right">GROSS REV</th>
                                <th class="p-2.5 text-right text-emerald-400">P&L REAL</th>
                                <th class="p-2.5 text-center">ESTADO</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5 text-slate-300">
                            <tr class="hover:bg-white/5 transition">
                                <td class="p-2 font-bold text-amber-300">DM-2026-01</td>
                                <td class="p-2">DON MOQUEGUA</td>
                                <td class="p-2 text-sky-300">SPCC</td>
                                <td class="p-2">ILO-MARCONA</td>
                                <td class="p-2 text-right">15/01/2026</td>
                                <td class="p-2 text-right">14,280.50</td>
                                <td class="p-2 text-right">$219,907.50</td>
                                <td class="p-2 text-right font-bold text-emerald-400">$171,136.50</td>
                                <td class="p-2 text-center"><span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px]">AUDITADO</span></td>
                            </tr>
                            <tr class="hover:bg-white/5 transition">
                                <td class="p-2 font-bold text-amber-300">PB-2026-01</td>
                                <td class="p-2">PARACAS BAY</td>
                                <td class="p-2 text-blue-300">NEXA</td>
                                <td class="p-2">CALLAO-MATARANI</td>
                                <td class="p-2 text-right">22/01/2026</td>
                                <td class="p-2 text-right">18,620.00</td>
                                <td class="p-2 text-right">$338,034.00</td>
                                <td class="p-2 text-right font-bold text-emerald-400">$259,954.00</td>
                                <td class="p-2 text-center"><span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px]">AUDITADO</span></td>
                            </tr>
                            <tr class="hover:bg-white/5 transition">
                                <td class="p-2 font-bold text-amber-300">DM-2026-02</td>
                                <td class="p-2">DON MOQUEGUA</td>
                                <td class="p-2 text-purple-300">SHOUGANG</td>
                                <td class="p-2">MARCONA-CALLAO</td>
                                <td class="p-2 text-right">05/02/2026</td>
                                <td class="p-2 text-right">14,100.00</td>
                                <td class="p-2 text-right">$238,650.00</td>
                                <td class="p-2 text-right font-bold text-emerald-400">$186,072.00</td>
                                <td class="p-2 text-center"><span class="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[9px]">EN FACTURACIÓN</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="text-xs text-slate-400 text-center">
                Permite auditar el cumplimiento del flete, consumos y márgenes travesía por travesía.
            </div>
        </section>

        <!-- SLIDE 8: DASHBOARD COMPARATIVO MACRO -->
        <section class="slide" data-slide="8">
            <div>
                <span class="text-xs font-bold text-gold uppercase tracking-widest text-amber-400">Control de Gestión</span>
                <h2 class="text-3xl font-outfit font-black text-white mt-1">Dashboard Comparativo (Budget vs. Actuals)</h2>
            </div>

            <div class="my-auto">
                <div class="p-4 bg-navy-800/90 rounded-xl border border-white/10 mb-4 text-xs text-slate-300">
                    <span class="text-amber-400 font-bold">💡 Regla de Negocio Clave:</span> La flota se reasigna dinámicamente en el mar. La comparación gerencial se realiza a nivel <b>macro mensual consolidado</b> sobre los <b>5 Indicadores Clave</b>:
                </div>

                <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div class="glass-card p-3.5 text-center">
                        <div class="text-[10px] font-mono text-cyan-400 uppercase">1. Venta Total</div>
                        <div class="text-lg font-black text-white mt-1">$557.9K</div>
                        <div class="text-[10px] text-emerald-400 font-bold mt-0.5">▲ +1.4% vs Fcst</div>
                    </div>
                    <div class="glass-card p-3.5 text-center">
                        <div class="text-[10px] font-mono text-cyan-400 uppercase">2. Toneladas (TM)</div>
                        <div class="text-lg font-black text-white mt-1">32,900 MT</div>
                        <div class="text-[10px] text-emerald-400 font-bold mt-0.5">▲ +0.5% vs Fcst</div>
                    </div>
                    <div class="glass-card p-3.5 text-center">
                        <div class="text-[10px] font-mono text-emerald-400 uppercase">3. P&L Neto</div>
                        <div class="text-lg font-black text-emerald-400 mt-1">$292.5K</div>
                        <div class="text-[10px] text-emerald-400 font-bold mt-0.5">▲ +2.6% en Caja</div>
                    </div>
                    <div class="glass-card p-3.5 text-center">
                        <div class="text-[10px] font-mono text-amber-400 uppercase">4. Margen %</div>
                        <div class="text-lg font-black text-amber-300 mt-1">52.4%</div>
                        <div class="text-[10px] text-emerald-400 font-bold mt-0.5">▲ +0.6 pp</div>
                    </div>
                    <div class="glass-card p-3.5 text-center">
                        <div class="text-[10px] font-mono text-purple-400 uppercase">5. Días Ocupados</div>
                        <div class="text-lg font-black text-white mt-1">26.2 d</div>
                        <div class="text-[10px] text-amber-400 font-bold mt-0.5">▲ +1.2 d rotación</div>
                    </div>
                </div>
            </div>

            <div class="glass-panel p-3.5 flex items-center justify-between text-xs">
                <span class="text-slate-300">Gráficos interactivos superpuestos de barras (Venta/TM) y líneas de tendencia (P&L/Margen %).</span>
                <span class="text-amber-400 font-mono font-bold">Auditoría Ejecutiva</span>
            </div>
        </section>

        <!-- SLIDE 9: PLAN DE TRABAJO & CRONOGRAMA -->
        <section class="slide" data-slide="9">
            <div>
                <span class="text-xs font-bold text-cyan-400 uppercase tracking-widest">Plan de Ejecución</span>
                <h2 class="text-3xl font-outfit font-black text-white mt-1">Cronograma Modular por Fases (20 Días)</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-5 gap-3.5 my-auto">
                <div class="glass-card p-4 border-t-2 border-t-cyan-500">
                    <div class="text-xs font-mono text-cyan-400 font-bold">FASE 1</div>
                    <h4 class="text-sm font-bold text-white mt-1 mb-2">Modelo Excel & BD</h4>
                    <p class="text-[11px] text-slate-300 leading-relaxed">
                        Plantilla Excel clon UI y diseño relacional de tablas de liquidaciones y ROBs.
                    </p>
                    <div class="mt-3 text-[10px] text-slate-400">Duración: <b>3 Días</b></div>
                </div>

                <div class="glass-card p-4 border-t-2 border-t-blue-500">
                    <div class="text-xs font-mono text-blue-400 font-bold">FASE 2</div>
                    <h4 class="text-sm font-bold text-white mt-1 mb-2">Motor Backend</h4>
                    <p class="text-[11px] text-slate-300 leading-relaxed">
                        Endpoints FastAPI de cálculo de ROBs, shifting, FDA y conciliación.
                    </p>
                    <div class="mt-3 text-[10px] text-slate-400">Duración: <b>5 Días</b></div>
                </div>

                <div class="glass-card p-4 border-t-2 border-t-amber-500">
                    <div class="text-xs font-mono text-amber-400 font-bold">FASE 3</div>
                    <h4 class="text-sm font-bold text-white mt-1 mb-2">Frontend React</h4>
                    <p class="text-[11px] text-slate-300 leading-relaxed">
                        Pantalla Voyage Liquidator con recálculo en caliente y Ledger anual.
                    </p>
                    <div class="mt-3 text-[10px] text-slate-400">Duración: <b>6 Días</b></div>
                </div>

                <div class="glass-card p-4 border-t-2 border-t-purple-500">
                    <div class="text-xs font-mono text-purple-400 font-bold">FASE 4</div>
                    <h4 class="text-sm font-bold text-white mt-1 mb-2">Dashboard Macro</h4>
                    <p class="text-[11px] text-slate-300 leading-relaxed">
                        Gráficos comparativos de los 5 Indicadores Clave con análisis de variación $\Delta\%$.
                    </p>
                    <div class="mt-3 text-[10px] text-slate-400">Duración: <b>4 Días</b></div>
                </div>

                <div class="glass-card p-4 border-t-2 border-t-emerald-500">
                    <div class="text-xs font-mono text-emerald-400 font-bold">FASE 5</div>
                    <h4 class="text-sm font-bold text-white mt-1 mb-2">Super Loop QC</h4>
                    <p class="text-[11px] text-slate-300 leading-relaxed">
                        Auditoría E2E, certificación de datos reales y despliegue a producción VPS.
                    </p>
                    <div class="mt-3 text-[10px] text-slate-400">Duración: <b>2 Días</b></div>
                </div>
            </div>

            <div class="glass-panel p-3.5 flex items-center justify-between text-xs">
                <span class="text-slate-300">Entrega llave en mano con despliegue automático al VPS en <code>forecast.geeksoft.tech</code>.</span>
                <span class="text-emerald-400 font-bold">Total: 20 Días Hábiles</span>
            </div>
        </section>

        <!-- SLIDE 10: ZONA DE DESCARGA & CIERRE -->
        <section class="slide" data-slide="10">
            <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto text-center items-center">
                <span class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Validación & Cierre de Alcance</span>
                <h2 class="text-3xl md:text-5xl font-outfit font-black text-white mb-4">
                    Zona de Descarga & Validación de Plantilla
                </h2>
                <p class="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed mb-8">
                    El usuario debe verificar la plantilla Excel para confirmar que cubre el 100% de las necesidades operativas de liquidación antes del inicio de desarrollo.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8 text-left">
                    <div class="glass-panel p-6 border border-emerald-500/30 flex flex-col justify-between">
                        <div>
                            <div class="flex items-center gap-3 mb-3">
                                <div class="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">📊</div>
                                <h4 class="text-lg font-bold text-white">Plantilla Excel Maestro (Clon UI)</h4>
                            </div>
                            <p class="text-xs text-slate-300 leading-relaxed mb-4">
                                Archivo con 5 pestañas formuladas: Voyage Calculator UI, Voyage Liquidator UI, Matriz Ledger, Comparativo Forecast vs Real y Glosario.
                            </p>
                        </div>
                        <a href="./Plantilla_Voyage_Liquidator_Master.xlsx" download class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-center transition flex items-center justify-center gap-2 shadow-lg">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Descargar Plantilla Excel (.xlsx)
                        </a>
                    </div>

                    <div class="glass-panel p-6 border border-cyan-500/30 flex flex-col justify-between">
                        <div>
                            <div class="flex items-center gap-3 mb-3">
                                <div class="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg">📄</div>
                                <h4 class="text-lg font-bold text-white">Propuesta Ejecutiva Formal (PDF)</h4>
                            </div>
                            <p class="text-xs text-slate-300 leading-relaxed mb-4">
                                Documento formal membretado con resumen ejecutivo, memoria de cálculo, cronograma e inversión modular ($5,800.00 USD).
                            </p>
                        </div>
                        <a href="./PROPUESTA_Y_ALCANCE_VOYAGE_LIQUIDATOR_DELFOS.pdf" target="_blank" class="w-full py-3 bg-navy-700 hover:bg-navy-600 text-cyan-300 font-bold rounded-xl text-center transition border border-cyan-500/30 flex items-center justify-center gap-2 shadow-lg">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Abrir Documento PDF (.pdf)
                        </a>
                    </div>
                </div>

                <div class="text-xs text-slate-500">
                    Propuesta desarrollada por <b>Geeksoft Tech</b> para <b>Delfos S.A. / Petral</b>.
                </div>
            </div>
        </section>

    </main>

    <!-- Bottom Navigation Bar -->
    <footer class="fixed bottom-0 left-0 right-0 h-16 px-10 flex items-center justify-between z-50 pointer-events-none">
        <div class="flex items-center gap-2 pointer-events-auto">
            <button onclick="prevSlide()" class="px-4 py-2 bg-navy-800/90 hover:bg-navy-700 text-slate-300 hover:text-white rounded-lg border border-white/10 text-xs font-bold transition flex items-center gap-1.5 shadow-md">
                <span>←</span> Anterior
            </button>
            <button onclick="nextSlide()" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg border border-cyan-400/30 text-xs font-bold transition flex items-center gap-1.5 shadow-md">
                Siguiente <span>→</span>
            </button>
        </div>

        <!-- Slide Indicators -->
        <div class="hidden md:flex items-center gap-1.5 pointer-events-auto" id="dotsContainer">
            <!-- Dynamic dots generated via JS -->
        </div>

        <div class="text-xs text-slate-500 pointer-events-auto font-mono">
            https://forecast.geeksoft.tech
        </div>
    </footer>

    <script>
        let currentSlide = 1;
        const totalSlides = 10;

        function updateSlide(index) {
            if (index < 1) index = 1;
            if (index > totalSlides) index = totalSlides;
            currentSlide = index;

            // Update Slide visibility
            document.querySelectorAll('.slide').forEach((slide, i) => {
                if (i + 1 === currentSlide) {
                    slide.classList.add('active');
                } else {
                    slide.classList.remove('active');
                }
            });

            // Update Progress Bar
            const pct = (currentSlide / totalSlides) * 100;
            document.getElementById('progressBar').style.width = pct + '%';

            // Update Counter
            document.getElementById('slideCounter').innerText = 
                (currentSlide < 10 ? '0' + currentSlide : currentSlide) + ' / ' + totalSlides;

            // Update Dots
            document.querySelectorAll('.dot-btn').forEach((dot, i) => {
                if (i + 1 === currentSlide) {
                    dot.className = 'dot-btn w-6 h-2 bg-cyan-400 rounded-full transition-all';
                } else {
                    dot.className = 'dot-btn w-2 h-2 bg-slate-700 hover:bg-slate-500 rounded-full transition-all';
                }
            });
        }

        function nextSlide() {
            if (currentSlide < totalSlides) {
                updateSlide(currentSlide + 1);
            }
        }

        function prevSlide() {
            if (currentSlide > 1) {
                updateSlide(currentSlide - 1);
            }
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        }

        // Setup dots
        const dotsContainer = document.getElementById('dotsContainer');
        for (let i = 1; i <= totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = 'dot-btn w-2 h-2 bg-slate-700 hover:bg-slate-500 rounded-full transition-all';
            dot.onclick = () => updateSlide(i);
            dotsContainer.appendChild(dot);
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
                nextSlide();
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                prevSlide();
            } else if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
            } else if (e.key === 'Home') {
                updateSlide(1);
            } else if (e.key === 'End') {
                updateSlide(totalSlides);
            }
        });

        // Initialize
        updateSlide(1);
    </script>
</body>
</html>
"""
    with open(HTML_OUT_LOCAL, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Presentación local guardada en: {HTML_OUT_LOCAL}")

    # Guardar también en la carpeta public del frontend para que se incluya en el build de producción
    os.makedirs(os.path.dirname(HTML_OUT_FRONTEND), exist_ok=True)
    with open(HTML_OUT_FRONTEND, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Presentación frontend guardada en: {HTML_OUT_FRONTEND}")

    # Copiar también los archivos Excel y PDF a la carpeta public para descarga directa
    pub_excel = os.path.join(BASE_DIR, r"Desarrollo.Profesional\Geeksoft_Frontend\public\Plantilla_Voyage_Liquidator_Master.xlsx")
    pub_pdf = os.path.join(BASE_DIR, r"Desarrollo.Profesional\Geeksoft_Frontend\public\PROPUESTA_Y_ALCANCE_VOYAGE_LIQUIDATOR_DELFOS.pdf")
    
    with open(os.path.join(COTIZACIONES_DIR, "Plantilla_Voyage_Liquidator_Master.xlsx"), "rb") as f_in, open(pub_excel, "wb") as f_out:
        f_out.write(f_in.read())
    with open(os.path.join(COTIZACIONES_DIR, "PROPUESTA_Y_ALCANCE_VOYAGE_LIQUIDATOR_DELFOS.pdf"), "rb") as f_in, open(pub_pdf, "wb") as f_out:
        f_out.write(f_in.read())
    print("Archivos Excel y PDF copiados a public/ para descarga directa.")

if __name__ == "__main__":
    generate_interactive_deck()
