import os

output_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador\Informe_Sustento_Modificacion_Alcance_Petral.html"
logo_path = r"file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Boiler.Plate/PPTS.HERMOSAS/logo_final_v3.png"

html_deck = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Navigating the Future: Sustento de Modificación de Alcance & Auditoría Forense - Naviera Petral</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

        :root {{
            --bg:          #F8FAFC;
            --bg-card:     #FFFFFF;
            --navy:        #0F2C59;
            --navy-dark:   #0A192F;
            --navy-mid:    #1E3A8A;
            --primary:     #0F2C59;
            --accent:      #0284C7;
            --accent-dim:  rgba(2, 132, 199, 0.1);
            --accent-brd:  rgba(2, 132, 199, 0.3);
            --blue:        #2563EB;
            --green:       #059669;
            --green-dim:   rgba(5, 150, 105, 0.1);
            --amber:       #D97706;
            --amber-dim:   rgba(217, 119, 6, 0.1);
            --red:         #E11D48;
            --red-dim:     rgba(225, 29, 72, 0.1);
            --purple:      #7C3AED;
            --text:        #0F172A;
            --text-dim:    rgba(15, 23, 42, 0.65);
            --border:      rgba(15, 23, 42, 0.12);
            --shadow:      0 4px 20px rgba(15, 23, 42, 0.08);
            --shadow-lg:   0 12px 40px rgba(15, 23, 42, 0.15);
        }}

        html, body {{
            width: 100%; height: 100%;
            background: var(--bg);
            color: var(--text);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            overflow: hidden;
            user-select: none;
        }}

        /* ── PROGRESS BAR ── */
        #progress {{
            position: fixed; top: 0; left: 0; height: 5px; z-index: 999;
            background: linear-gradient(90deg, var(--accent), var(--green), var(--amber));
            transition: width 0.35s ease;
        }}

        /* ── TOP HEADER BRAND ── */
        .top-brand-bar {{
            position: fixed;
            top: 14px;
            left: 36px;
            right: 36px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 900;
            pointer-events: none;
        }}
        .brand-logo {{
            height: 48px;
            object-fit: contain;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.08));
        }}
        .brand-badge {{
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid var(--border);
            padding: 5px 14px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            color: var(--navy);
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: var(--shadow);
            backdrop-filter: blur(8px);
        }}

        /* ── SLIDE DECK VIEWPORT ── */
        #deck {{
            position: relative;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
        }}

        .slide {{
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 55px 48px 75px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.36s ease, transform 0.36s ease;
        }}
        .slide.active {{
            opacity: 1;
            pointer-events: all;
            transform: translateX(0) !important;
        }}

        /* ── FLOATING NAVIGATION ── */
        nav {{
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 16px;
            z-index: 999;
            background: rgba(255, 255, 255, 0.95);
            padding: 6px 18px;
            border-radius: 50px;
            box-shadow: var(--shadow-lg);
            border: 1px solid var(--border);
            backdrop-filter: blur(10px);
        }}
        .nbtn {{
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 1px solid var(--border);
            background: var(--bg-card);
            color: var(--navy);
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: var(--shadow);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }}
        .nbtn:hover {{
            background: var(--accent-dim);
            border-color: var(--accent);
            color: var(--accent);
            transform: scale(1.1);
        }}
        .nbtn:disabled {{
            opacity: 0.25;
            cursor: default;
            transform: none;
            border-color: var(--border);
            color: var(--text-dim);
        }}
        #counter {{
            font-size: 13px;
            color: var(--navy);
            font-family: 'JetBrains Mono', monospace;
            min-width: 70px;
            text-align: center;
            font-weight: 800;
            letter-spacing: 0.5px;
        }}

        /* ── TYPOGRAPHY & SHARED WIDESCREEN CONTAINERS ── */
        .slide-content {{
            width: 100%;
            max-width: 1260px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }}

        .tag {{
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            color: var(--accent);
            margin-bottom: 4px;
            display: inline-block;
        }}
        h1 {{
            font-family: 'Outfit', sans-serif;
            font-size: clamp(2.2rem, 3.5vw, 3.2rem);
            font-weight: 900;
            line-height: 1.1;
            color: var(--navy);
            margin-bottom: 6px;
        }}
        h2 {{
            font-family: 'Outfit', sans-serif;
            font-size: clamp(1.8rem, 2.6vw, 2.4rem);
            font-weight: 800;
            line-height: 1.15;
            color: var(--navy);
            margin-bottom: 4px;
            border-bottom: 2px solid var(--navy);
            padding-bottom: 4px;
        }}
        .sub {{
            font-size: clamp(0.95rem, 1.3vw, 1.1rem);
            color: var(--text-dim);
            font-weight: 500;
            margin-bottom: 16px;
            line-height: 1.4;
        }}

        .card {{
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 14px;
            box-shadow: var(--shadow);
            padding: 20px;
            transition: all 0.2s ease;
        }}
        .card:hover {{
            box-shadow: var(--shadow-lg);
            border-color: rgba(2, 132, 199, 0.4);
        }}

        .callout {{
            padding: 16px 20px;
            border-radius: 10px;
            margin-bottom: 14px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        }}
        .callout-blue {{ background-color: #E0F2FE; border-left: 6px solid #0284C7; }}
        .callout-green {{ background-color: #ECFDF5; border-left: 6px solid #059669; }}
        .callout-purple {{ background-color: #F3E8FF; border-left: 6px solid #7C3AED; }}
        .callout-amber {{ background-color: #FEF3C7; border-left: 6px solid #D97706; }}

        /* ── KPI GRIDS ── */
        .kpi-grid-4 {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 18px;
        }}
        .kpi-box {{
            background: #FFFFFF;
            border: 1.5px solid var(--border);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            box-shadow: var(--shadow);
        }}
        .kpi-box .label {{
            font-size: 8.5pt;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            font-weight: 800;
            color: var(--text-dim);
        }}
        .kpi-box .num {{
            font-family: 'Outfit', sans-serif;
            font-size: 24pt;
            font-weight: 900;
            color: var(--navy);
            line-height: 1.1;
            margin: 4px 0;
        }}
        .kpi-box .desc {{
            font-size: 8pt;
            color: #64748B;
            font-weight: 500;
        }}

        /* ── TABLES ── */
        table.ppt-table {{
            width: 100%;
            border-collapse: collapse;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--border);
            box-shadow: var(--shadow);
            margin: 10px 0;
            font-size: 9.5pt;
        }}
        table.ppt-table th {{
            background-color: var(--navy);
            color: white;
            padding: 10px 14px;
            text-align: left;
            font-weight: 700;
            letter-spacing: 0.5px;
        }}
        table.ppt-table td {{
            padding: 9px 14px;
            border-bottom: 1px solid #E2E8F0;
            background: #FFFFFF;
            color: #1E293B;
        }}
        table.ppt-table tr:nth-child(even) td {{
            background: #F8FAFC;
        }}
        table.ppt-table tr:last-child td {{
            border-bottom: none;
        }}

        .badge-pill {{
            display: inline-block;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 7.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .badge-blue {{ background: #DBEAFE; color: #1E40AF; }}
        .badge-green {{ background: #D1FAE5; color: #065F46; }}
        .badge-amber {{ background: #FEF3C7; color: #92400E; }}
        .badge-red {{ background: #FFE4E6; color: #9F1239; }}

        .code-snippet {{
            background: #0F172A;
            border-radius: 8px;
            padding: 12px;
            color: #F8FAFC;
            font-family: 'JetBrains Mono', monospace;
            font-size: 8pt;
            line-height: 1.38;
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #334155;
        }}

        /* ── FOOTER SUBTITLES ── */
        .slide-footnote {{
            margin-top: 12px;
            font-size: 8.5pt;
            color: #64748B;
            border-top: 1px dashed var(--border);
            padding-top: 6px;
            display: flex;
            justify-content: space-between;
        }}
    </style>
</head>
<body>

<!-- BARRA DE PROGRESO SUPERIOR -->
<div id="progress"></div>

<!-- MARCA SUPERIOR FIJA -->
<div class="top-brand-bar">
    <img src="{logo_path}" alt="Geeksoft Logo" class="brand-logo">
    <div class="brand-badge">Naviera Petral S.A. • Sustento de Modificación de Alcance</div>
</div>

<!-- SLIDE DECK -->
<div id="deck">

    <!-- ==========================================
         SLIDE 1: PORTADA & RESUMEN EJECUTIVO
         ========================================== -->
    <div class="slide active">
        <div class="slide-content" style="text-align: center;">
            <div class="tag">TRANSFORMACIÓN DIGITAL &bull; INFORME PERICIAL</div>
            <h1>Navigating the Future: Inteligencia Comercial</h1>
            <div class="sub">
                Sustento de Modificación de Alcance, Consultoría de Procesos y Auditoría Forense de Horas Devengadas
            </div>

            <div class="callout callout-blue" style="max-width: 960px; margin: 0 auto 18px auto; text-align: left;">
                <strong style="color: #0284C7; font-size: 11pt; display: block; margin-bottom: 4px;">🎯 Objetivo del Dictamen Técnico</strong>
                <span style="font-size: 9.8pt; line-height: 1.45; color: #1E293B;">
                    Presentar a la Gerencia y Dirección de <strong>Naviera Petral S.A.</strong> el sustento del desborde del alcance inicial: el proyecto evolucionó de una <strong>hoja de cálculo inteligente</strong> a una <strong>Plataforma Integral de Inteligencia Comercial + Consultoría de Reingeniería de Procesos + Bases de un ERP de Gestión de Flota</strong>, respaldada por una auditoría digital forense inalterable de <strong>434.77 horas reales ejecutadas</strong> en IDE/Git.
                </span>
            </div>

            <div class="kpi-grid-4" style="max-width: 960px; margin: 0 auto 18px auto;">
                <div class="kpi-box" style="border-top: 4px solid var(--navy);">
                    <div class="label">Contrato Estimado</div>
                    <div class="num">100.00 h</div>
                    <div class="desc">Cotización Base Junio 2026</div>
                </div>
                <div class="kpi-box" style="border-top: 4px solid var(--accent);">
                    <div class="label">Horas Reales Auditadas</div>
                    <div class="num" style="color: var(--accent);">434.77 h</div>
                    <div class="desc">Algoritmo Inalterable IDE Git</div>
                </div>
                <div class="kpi-box" style="border-top: 4px solid var(--amber);">
                    <div class="label">Sobreesfuerzo Devengado</div>
                    <div class="num" style="color: var(--amber);">+334.77 h</div>
                    <div class="desc">+334.8% de Valor Incremental</div>
                </div>
                <div class="kpi-box" style="border-top: 4px solid var(--green);">
                    <div class="label">Estado de Producción</div>
                    <div class="num" style="color: var(--green); font-size: 20pt; margin-top: 6px;">100% VIVO</div>
                    <div class="desc">forecast.geeksoft.tech</div>
                </div>
            </div>

            <div class="slide-footnote" style="max-width: 960px; margin: 0 auto;">
                <span><strong>Consultor:</strong> GEEKSOFT (Richard Gutiérrez) &bull; <strong>Documento Base:</strong> COTIZACION_MODULAR_PETRAL_V10.RG.pdf</span>
                <span>Diapositiva 01 / 08</span>
            </div>
        </div>
    </div>


    <!-- ==========================================
         SLIDE 2: PREMISA INICIAL VS DIAGNÓSTICO REAL
         ========================================== -->
    <div class="slide">
        <div class="slide-content">
            <div class="tag">DIAGNÓSTICO OPERATIVO FORENSE</div>
            <h2>Slide 2: Premisa Inicial vs. Diagnóstico Operativo Real</h2>
            <div class="sub">El punto de quiebre donde la simple automatización requirió un saneamiento estructural integral.</div>

            <div class="callout callout-blue">
                <strong style="color: #0284C7; font-size: 11pt;">💡 Principio de Ingeniería de Datos:</strong>
                <span style="font-size: 9.8pt; color: #1E293B; font-style: italic;">
                    "No se podía construir un rascacielos digital moderno sobre cimientos de datos inconsistentes sin antes ejecutar un saneamiento estructural y de procesos profundo."
                </span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 6px;">
                <div class="card" style="border: 2px solid #FECACA; background: #FFF8F8;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                        <strong style="color: #991B1B; font-size: 11.5pt;">❌ Lo que se Cotizó (Junio 2026)</strong>
                        <span class="badge-pill badge-red">Premisa Teórica</span>
                    </div>
                    <ul style="font-size: 9.5pt; color: #334155; padding-left: 18px; line-height: 1.5;">
                        <li style="margin-bottom: 6px;"><strong>Automatización Lineal:</strong> Conversión de hoja Excel con fórmulas fijas a una web interactiva con un repositorio de datos centralizados.</li>
                        <li style="margin-bottom: 6px;"><strong>Supuesto de Datos Limpios:</strong> Estructuras de costos portuarios, tarifas de agenciamiento y distancias dadas por sentado.</li>
                        <li><strong>Esfuerzo Estimado:</strong> 100 horas hombre de programación directa bajo reglas supuestamente estables expresados en los exceles iniciales Voyage Calculations que presentaban datos estáticos y claros.</li>
                    </ul>
                </div>

                <div class="card" style="border: 2px solid #BBF7D0; background: #F0FDF4;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                        <strong style="color: #166534; font-size: 11.5pt;">✅ La Realidad Operativa Encontrada</strong>
                        <span class="badge-pill badge-green">Diagnóstico Real</span>
                    </div>
                    <ul style="font-size: 9.5pt; color: #334155; padding-left: 18px; line-height: 1.5;">
                        <li style="margin-bottom: 6px;"><strong>Ausencia de Flujos Formalizados:</strong> Manuales de funciones tácitos no documentados y criterios dispersos entre usuarios.</li>
                        <li style="margin-bottom: 6px;"><strong>Maestros Desalineados:</strong> Duplicidad en nombres de agencias, dobles nomenclaturas (MGO vs MDO) y demoras no unificadas.</li>
                        <li><strong>Fugas de Cálculo:</strong> Inconsistencias en liquidaciones históricas de viajes que requerían auditoría matemática previa.</li>
                    </ul>
                </div>
            </div>

            <div class="slide-footnote">
                <span>PETRAL SMART DASHBOARD &bull; Auditoría de Alcance</span>
                <span>Diapositiva 02 / 08</span>
            </div>
        </div>
    </div>


    <!-- ==========================================
         SLIDE 3: SALTO TECNOLÓGICO ("HUEVOS DE PASCUA")
         ========================================== -->
    <div class="slide">
        <div class="slide-content">
            <div class="tag">ARQUITECTURA ENTERPRISE &bull; VALOR AGREGADO</div>
            <h2>Slide 3: El Salto Tecnológico ("Huevos de Pascua")</h2>
            <div class="sub">Módulos transaccionales de alto valor desarrollados e incorporados fuera del alcance inicial.</div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="card" style="border-left: 5px solid var(--accent);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong style="color: var(--navy); font-size: 11pt;">📊 1. Matriz Financiera Modular Multimes</strong>
                        <span class="badge-pill badge-blue">Modelamiento Dinámico</span>
                    </div>
                    <p style="font-size: 9.2pt; color: #334155; line-height: 1.45;">
                        Modelamiento de escenarios paralelos con desglose exhaustivo de P&L, yield flete puro, demoras dinámicas y dockage revenue en tiempo real.
                    </p>
                </div>

                <div class="card" style="border-left: 5px solid var(--amber);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong style="color: var(--navy); font-size: 11pt;">🧭 2. Ruteador SPOT Multileg & Fondeo</strong>
                        <span class="badge-pill badge-amber">Algoritmo Geográfico</span>
                    </div>
                    <p style="font-size: 9.2pt; color: #334155; line-height: 1.45;">
                        Cálculo interactivo de rutas marítimas, matrices de distancias en nudos, tiempos de navegación vs. fondeo y auto-selección de tarifas de agenciamiento.
                    </p>
                </div>

                <div class="card" style="border-left: 5px solid var(--green);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong style="color: var(--navy); font-size: 11pt;">🖨️ 3. Motor Exportador PDF Grado Pericial</strong>
                        <span class="badge-pill badge-green">Auditoría Visual</span>
                    </div>
                    <p style="font-size: 9.2pt; color: #334155; line-height: 1.45;">
                        Generación automatizada de reportes y cotizaciones oficiales con sellos forenses ("Printed By", timestamps de emisión y firmas digitales inmutables).
                    </p>
                </div>

                <div class="card" style="border-left: 5px solid var(--purple);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong style="color: var(--navy); font-size: 11pt;">🔒 4. Seguridad Granular & Despliegue VPS</strong>
                        <span class="badge-pill badge-blue">Infraestructura Cloud</span>
                    </div>
                    <p style="font-size: 9.2pt; color: #334155; line-height: 1.45;">
                        Control de accesos y roles (Admin, Comercial, Auditor), persistencia multi-usuario en Supabase y arquitectura productiva en VPS Contabo dedicado.
                    </p>
                </div>
            </div>

            <div class="slide-footnote">
                <span>PETRAL SMART DASHBOARD &bull; Auditoría de Alcance</span>
                <span>Diapositiva 03 / 08</span>
            </div>
        </div>
    </div>


    <!-- ==========================================
         SLIDE 4: CONSULTORÍA DE PROCESOS (MOF OCULTO)
         ========================================== -->
    <div class="slide">
        <div class="slide-content">
            <div class="tag">REINGENIERÍA OPERATIVA &bull; GOBERNANZA</div>
            <h2>Slide 4: Consultoría de Procesos & Reingeniería (El "MOF Oculto")</h2>
            <div class="sub">Entregables de consultoría incorporados orgánicamente a la plataforma.</div>

            <div class="kpi-grid-4" style="margin-bottom: 14px;">
                <div class="kpi-box" style="border-top: 4px solid #1E40AF;">
                    <div class="label">Reglas de Negocio</div>
                    <div class="num" style="font-size: 17pt; color: #1E40AF; margin: 8px 0;">Demoras</div>
                    <div class="desc">Modo 0 vs Demoras Reales y fondeo.</div>
                </div>

                <div class="kpi-box" style="border-top: 4px solid #059669;">
                    <div class="label">Homologación</div>
                    <div class="num" style="font-size: 17pt; color: #059669; margin: 8px 0;">MGO = MDO</div>
                    <div class="desc">Unificación bajo estándar de la industria.</div>
                </div>

                <div class="kpi-box" style="border-top: 4px solid #D97706;">
                    <div class="label">Auditoría Cero</div>
                    <div class="num" style="font-size: 17pt; color: #D97706; margin: 8px 0;">Cero Fugas</div>
                    <div class="desc">Eliminación de discrepancias de centavos.</div>
                </div>

                <div class="kpi-box" style="border-top: 4px solid #7C3AED;">
                    <div class="label">Gobernanza</div>
                    <div class="num" style="font-size: 17pt; color: #7C3AED; margin: 8px 0;">MOF Vivo</div>
                    <div class="desc">Software como manual de funciones activo.</div>
                </div>
            </div>

            <div class="callout callout-purple">
                <strong style="color: #6B21A8; font-size: 10.5pt; display: block; margin-bottom: 4px;">Impacto Institucional en Naviera Petral:</strong>
                <p style="font-size: 9.3pt; color: #334155; line-height: 1.45;">
                    El trabajo de Geeksoft no se limitó al software; se tradujo en una <strong>consultoría integral de reingeniería de procesos</strong>. Antes, el cálculo de un viaje dependía de criterios dispersos y memoria humana. Hoy, la plataforma actúa como la autoridad central de cálculo y el Manual de Organización y Funciones (MOF) digitalizado de Petral.
                </p>
            </div>

            <div class="slide-footnote">
                <span>PETRAL SMART DASHBOARD &bull; Auditoría de Alcance</span>
                <span>Diapositiva 04 / 08</span>
            </div>
        </div>
    </div>


    <!-- ==========================================
         SLIDE 5: ANTICIPACIÓN ESTRATÉGICA - LIQUIDACIONES
         ========================================== -->
    <div class="slide">
        <div class="slide-content">
            <div class="tag">RETORNO DE INVERSIÓN &bull; FASE 2</div>
            <h2>Slide 5: Valor Ganado: Cimientos de las Liquidaciones Dinámicas</h2>
            <div class="sub">Valor futuro ya construido: la base para la comparación Presupuestado vs. Real ejecutado.</div>

            <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px;">
                <div class="card" style="border: 1.5px solid #BFDBFE; background: #FFFFFF;">
                    <strong style="color: var(--navy); font-size: 11pt; display: block; margin-bottom: 6px;">
                        🏗️ Arquitectura Espejo Ya Implementada en Fase 1
                    </strong>
                    <p style="font-size: 9.3pt; color: #334155; margin-bottom: 8px;">
                        El multicotizador se diseñó como una <strong>matriz receptora</strong> para registrar las ejecuciones reales de viaje:
                    </p>
                    <ul style="font-size: 9pt; color: #475569; padding-left: 18px; line-height: 1.45;">
                        <li>Comparación de consumo de combustible presupuestado vs. facturas reales.</li>
                        <li>Días reales de fondeo/muelle para cálculo de demurrage real devengado.</li>
                        <li>Facturas de agencias y practicaje liquidadas contra proyecciones SPOT.</li>
                    </ul>
                </div>

                <div class="card" style="border: 2px dashed var(--navy); background: #F8FAFC; text-align: center; display: flex; flex-direction: column; justify-content: center;">
                    <span style="font-size: 9pt; font-weight: 800; text-transform: uppercase; color: var(--text-dim);">Ahorro de Tiempo Futuro</span>
                    <div style="font-family: 'Outfit'; font-size: 38pt; font-weight: 900; color: var(--navy); line-height: 1; margin: 4px 0;">-60%</div>
                    <span style="font-size: 10pt; color: var(--green); font-weight: 800;">Reducción en Desarrollo de Liquidaciones</span>
                    <p style="font-size: 8.5pt; color: #64748B; margin-top: 6px;">
                        Al compartir la misma base de datos, maestros y esquemas validados.
                    </p>
                </div>
            </div>

            <div class="slide-footnote">
                <span>PETRAL SMART DASHBOARD &bull; Auditoría de Alcance</span>
                <span>Diapositiva 05 / 08</span>
            </div>
        </div>
    </div>


    <!-- ==========================================
         SLIDE 6: AUDITORÍA FORENSE DE HORAS
         ========================================== -->
    <div class="slide">
        <div class="slide-content">
            <div class="tag">TRAZABILIDAD FORENSE &bull; EVIDENCIA INALTERABLE</div>
            <h2>Slide 6: Auditoría Digital Forense de Horas (100h vs. 434.77h)</h2>
            <div class="sub">Trazabilidad matemática e inalterable basada en logs de Git y sesiones continuas de IDE.</div>

            <div class="kpi-grid-4" style="margin-bottom: 14px;">
                <div class="kpi-box">
                    <div class="label">Jornadas Auditadas</div>
                    <div class="num">101</div>
                    <div class="desc">Días continuos registrados</div>
                </div>
                <div class="kpi-box" style="border-top: 4px solid var(--amber);">
                    <div class="label">Eventos Registrados</div>
                    <div class="num" style="color: var(--amber);">3,063</div>
                    <div class="desc">Commits & File Events</div>
                </div>
                <div class="kpi-box" style="border-top: 4px solid var(--red);">
                    <div class="label">Horas Reales IDE</div>
                    <div class="num" style="color: var(--red);">434.77 h</div>
                    <div class="desc">Auditoría Inmutable</div>
                </div>
                <div class="kpi-box" style="border-top: 4px solid var(--green);">
                    <div class="label">Sobreesfuerzo</div>
                    <div class="num" style="color: var(--green);">+334.8%</div>
                    <div class="desc">+334.77 hrs devengadas</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 16px;">
                <div class="card">
                    <strong style="color: var(--navy); font-size: 10pt; display: block; margin-bottom: 8px;">📊 Comparativa de Horas</strong>
                    
                    <div style="margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: bold; margin-bottom: 3px;">
                            <span>Horas Base Contratadas:</span>
                            <span>100.00 hrs (23%)</span>
                        </div>
                        <div style="width: 100%; height: 14px; background: #E2E8F0; border-radius: 7px; overflow: hidden;">
                            <div style="width: 23%; height: 100%; background: #64748B;"></div>
                        </div>
                    </div>

                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: bold; margin-bottom: 3px; color: var(--accent);">
                            <span>Horas Reales Devengadas (IDE + Git):</span>
                            <span>434.77 hrs (100%)</span>
                        </div>
                        <div style="width: 100%; height: 14px; background: #E2E8F0; border-radius: 7px; overflow: hidden;">
                            <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #0284C7, #38BDF8);"></div>
                        </div>
                    </div>

                    <p style="font-size: 8pt; color: #64748B; margin-top: 10px; font-style: italic;">
                        *Algoritmo: Ventana móvil de inactividad de 2.5h + warmup de 30min por sesión.
                    </p>
                </div>

                <div class="code-snippet">
<span style="color: #64748B;"># summarize_real_hours.py (Algoritmo Forense)</span>
<span style="color: #F43F5E;">for</span> idx, day <span style="color: #F43F5E;">in</span> enumerate(sorted(day_activity.keys())):
    timestamps = sorted(day_activity[day])
    <span style="color: #38BDF8;">for</span> t <span style="color: #F43F5E;">in</span> timestamps[<span style="color: #FBBF24;">1</span>:]:
        <span style="color: #38BDF8;">if</span> (t - curr_end).total_seconds() &lt;= <span style="color: #FBBF24;">9000</span>: <span style="color: #64748B;"># 2.5h idle</span>
            curr_end = t
        <span style="color: #38BDF8;">else</span>:
            sessions.append((curr_start, curr_end))
            curr_start = t; curr_end = t
    total_hours += sum((s[1]-s[0]).total_seconds()+1800) / 3600.0
                </div>
            </div>

            <div class="slide-footnote">
                <span>PETRAL SMART DASHBOARD &bull; Auditoría de Alcance</span>
                <span>Diapositiva 06 / 08</span>
            </div>
        </div>
    </div>


    <!-- ==========================================
         SLIDE 7: LIQUIDACIÓN ECONÓMICA & PROPUESTA
         ========================================== -->
    <div class="slide">
        <div class="slide-content">
            <div class="tag">VALORIZACIÓN ECONÓMICA &bull; CIERRE COMERCIAL</div>
            <h2>Slide 7: Liquidación Económica & Propuesta de Regularización</h2>
            <div class="sub">Valorización formal del servicio entregado y esquema comercial de regularización.</div>

            <table class="ppt-table">
                <thead>
                    <tr>
                        <th style="width: 45%;">Concepto / Entregable</th>
                        <th style="width: 15%; text-align: center;">Horas</th>
                        <th style="width: 15%; text-align: center;">Tarifa Ref.</th>
                        <th style="width: 15%; text-align: right;">Subtotal (USD)</th>
                        <th style="width: 10%; text-align: center;">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>Presupuesto Inicial Aprobado (One-Timers)</strong><br>
                            <span style="font-size: 8pt; color: #64748B;">Módulos 1, 2, 3, 4 + Carga de Datos y Onboarding</span>
                        </td>
                        <td style="text-align: center;">150.00 hrs</td>
                        <td style="text-align: center;">$50 - $100</td>
                        <td style="text-align: right; font-weight: bold;">$9,100.00</td>
                        <td style="text-align: center;"><span class="badge-pill badge-blue">Base Contratada</span></td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Horas Adicionales Devengadas (Sobreesfuerzo)</strong><br>
                            <span style="font-size: 8pt; color: #64748B;">Consultoría de Procesos, Algoritmos SPOT, Seguridad VPS & Reingeniería</span>
                        </td>
                        <td style="text-align: center; color: var(--red); font-weight: bold;">334.77 hrs</td>
                        <td style="text-align: center;">$60.00</td>
                        <td style="text-align: right; color: var(--red); font-weight: bold;">$20,086.20</td>
                        <td style="text-align: center;"><span class="badge-pill badge-amber">Valor Entregado</span></td>
                    </tr>
                    <tr style="background-color: #EFF6FF; font-weight: bold;">
                        <td style="color: var(--navy); font-size: 10pt;">
                            VALOR TOTAL REAL ENTREGADO A NAVIERA PETRAL
                        </td>
                        <td style="text-align: center; font-size: 10pt;">484.77 hrs</td>
                        <td style="text-align: center;">—</td>
                        <td style="text-align: right; color: var(--navy); font-size: 11pt;">$29,186.20</td>
                        <td style="text-align: center;"><span class="badge-pill badge-green">En Operación</span></td>
                    </tr>
                </tbody>
            </table>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 10px;">
                <div class="card" style="border-left: 5px solid var(--accent);">
                    <strong style="color: var(--accent); font-size: 10.5pt; display: block; margin-bottom: 4px;">Opción A: Paquete Cerrado de Regularización</strong>
                    <p style="font-size: 9pt; color: #334155; line-height: 1.4;">
                        Acuerdo de monto fijo para regularizar la consultoría de procesos, auditorías de datos y módulos no previstos en la cotización inicial.
                    </p>
                </div>

                <div class="card" style="border-left: 5px solid var(--green);">
                    <strong style="color: var(--green); font-size: 10.5pt; display: block; margin-bottom: 4px;">Opción B: Integración con Fase Liquidaciones</strong>
                    <p style="font-size: 9pt; color: #334155; line-height: 1.4;">
                        Amortización vinculada al Kickoff del módulo de liquidaciones reales y tarifa mensual de mantenimiento VPS ($500/mes).
                    </p>
                </div>
            </div>

            <div class="slide-footnote">
                <span>PETRAL SMART DASHBOARD &bull; Auditoría de Alcance</span>
                <span>Diapositiva 07 / 08</span>
            </div>
        </div>
    </div>


    <!-- ==========================================
         SLIDE 8: ROADMAP & PASE A PRODUCCIÓN
         ========================================== -->
    <div class="slide">
        <div class="slide-content">
            <div class="tag">GO-LIVE & CONTINUIDAD OPERATIVA</div>
            <h2>Slide 8: Roadmap Inmediato & Pase a Producción (VPS)</h2>
            <div class="sub">Hitos de cierre, puesta en marcha y soporte continuo para Naviera Petral.</div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px;">
                <div class="card" style="text-align: center; border-top: 4px solid var(--green);">
                    <div style="font-size: 24pt; margin-bottom: 4px;">🚀</div>
                    <strong style="font-size: 10.5pt; color: var(--navy); display: block; margin-bottom: 4px;">1. Despliegue Vivo</strong>
                    <p style="font-size: 8.5pt; color: #475569;">
                        Plataforma 100% activa en <strong>https://forecast.geeksoft.tech</strong> en VPS Contabo.
                    </p>
                </div>

                <div class="card" style="text-align: center; border-top: 4px solid var(--accent);">
                    <div style="font-size: 24pt; margin-bottom: 4px;">👥</div>
                    <strong style="font-size: 10.5pt; color: var(--navy); display: block; margin-bottom: 4px;">2. Onboarding</strong>
                    <p style="font-size: 8.5pt; color: #475569;">
                        Capacitación con J. Neyra, F. Harten, M.E. Castro e I. Zavala.
                    </p>
                </div>

                <div class="card" style="text-align: center; border-top: 4px solid var(--amber);">
                    <div style="font-size: 24pt; margin-bottom: 4px;">🛡️</div>
                    <strong style="font-size: 10.5pt; color: var(--navy); display: block; margin-bottom: 4px;">3. Soporte Continuo</strong>
                    <p style="font-size: 8.5pt; color: #475569;">
                        Fee mensual de soporte, hosting VPS y base Supabase ($500/mes).
                    </p>
                </div>

                <div class="card" style="text-align: center; border-top: 4px solid var(--purple);">
                    <div style="font-size: 24pt; margin-bottom: 4px;">📈</div>
                    <strong style="font-size: 10.5pt; color: var(--navy); display: block; margin-bottom: 4px;">4. Liquidaciones</strong>
                    <p style="font-size: 8.5pt; color: #475569;">
                        Kickoff de carga de viajes reales sobre la arquitectura ya construida.
                    </p>
                </div>
            </div>

            <div class="callout callout-blue" style="text-align: center; margin-bottom: 0;">
                <strong style="color: var(--navy); font-size: 12pt; display: block; margin-bottom: 4px;">
                    🎯 Plataforma 100% Auditada y en Producción
                </strong>
                <span style="font-size: 9.8pt; color: #334155;">
                    El motor multicotizador y la inteligencia comercial se encuentran disponibles para su uso inmediato en Naviera Petral.
                </span>
            </div>

            <div class="slide-footnote">
                <span>PETRAL SMART DASHBOARD &bull; Auditoría de Alcance</span>
                <span>Diapositiva 08 / 08</span>
            </div>
        </div>
    </div>

</div>

<!-- BOTONERA DE NAVEGACIÓN FLOTANTE (SLIDER INTERACTIVO) -->
<nav>
    <button class="nbtn" id="prevBtn" onclick="changeSlide(-1)" title="Diapositiva Anterior (Flecha Izquierda)">&#8592;</button>
    <div id="counter">1 / 8</div>
    <button class="nbtn" id="nextBtn" onclick="changeSlide(1)" title="Siguiente Diapositiva (Flecha Derecha / Espacio)">&#8594;</button>
</nav>

<script>
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    const progressEl = document.getElementById('progress');
    const counterEl = document.getElementById('counter');

    function updateDeck() {{
        slides.forEach((slide, idx) => {{
            slide.classList.remove('active');
            if (idx < currentSlide) {{
                slide.style.transform = 'translateX(-80px)';
            }} else if (idx > currentSlide) {{
                slide.style.transform = 'translateX(80px)';
            }} else {{
                slide.classList.add('active');
            }}
        }});

        const pct = ((currentSlide + 1) / totalSlides) * 100;
        progressEl.style.width = pct + '%';
        counterEl.innerText = (currentSlide + 1) + ' / ' + totalSlides;

        document.getElementById('prevBtn').disabled = (currentSlide === 0);
        document.getElementById('nextBtn').disabled = (currentSlide === totalSlides - 1);
    }}

    function changeSlide(dir) {{
        currentSlide += dir;
        if (currentSlide < 0) currentSlide = 0;
        if (currentSlide >= totalSlides) currentSlide = totalSlides - 1;
        updateDeck();
    }}

    // Control por teclado (Flechas, Espacio, PageUp/Down)
    window.addEventListener('keydown', (e) => {{
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {{
            e.preventDefault();
            changeSlide(1);
        }} else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {{
            e.preventDefault();
            changeSlide(-1);
        }}
    }});

    updateDeck();
</script>

</body>
</html>
"""

with open(output_path, "w", encoding="utf-8") as f:
    f.write(html_deck)

print(f"[+] Presentacion interactiva Slide-by-Slide generada exitosamente en: {output_path}")
