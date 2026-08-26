import os

output_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador"
output_html = os.path.join(output_dir, "Informe_Sustento_Modificacion_Alcance_Petral.html")

html_content = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sustento de Modificación de Alcance & Auditoría Forense - Naviera Petral</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-canvas: #0b132b;
            --bg-card: #ffffff;
            --bg-alt: #f8fafc;
            --primary: #0a2540;
            --primary-light: #1e3a8a;
            --accent: #2563eb;
            --accent-glow: rgba(37, 99, 235, 0.15);
            --gold: #d97706;
            --gold-light: #fef3c7;
            --emerald: #059669;
            --emerald-light: #ecfdf5;
            --rose: #e11d48;
            --rose-light: #fff1f2;
            --text-dark: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
            --shadow-lg: 0 20px 35px -10px rgba(0, 0, 0, 0.15);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #f1f5f9;
            color: var(--text-dark);
            line-height: 1.5;
            padding: 24px;
        }

        .slide-container {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 40px;
        }

        .slide {
            background: var(--bg-card);
            border-radius: 16px;
            padding: 44px 52px;
            box-shadow: var(--shadow-lg);
            border: 1px solid var(--border);
            min-height: 780px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
            page-break-after: always;
        }

        .slide::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #0a2540 0%, #2563eb 50%, #d97706 100%);
        }

        /* Header Slide */
        .slide-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 16px;
            margin-bottom: 24px;
        }

        .slide-title-group h2 {
            font-family: 'Outfit', sans-serif;
            font-size: 26pt;
            font-weight: 800;
            color: var(--primary);
            letter-spacing: -0.5px;
            line-height: 1.15;
        }

        .slide-title-group p {
            font-size: 11.5pt;
            color: var(--text-muted);
            margin-top: 4px;
            font-weight: 500;
        }

        .slide-badge {
            background: #eff6ff;
            color: var(--accent);
            border: 1px solid #bfdbfe;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 9pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            white-space: nowrap;
        }

        /* Slide Content Areas */
        .slide-body {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        /* Slide Footer */
        .slide-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #f1f5f9;
            padding-top: 14px;
            margin-top: 24px;
            font-size: 9pt;
            color: var(--text-muted);
        }

        .slide-footer strong {
            color: var(--primary);
        }

        /* COVER SLIDE SPECIAL STYLES */
        .cover-slide {
            background: linear-gradient(135deg, #0a192f 0%, #0b2545 60%, #133a6b 100%);
            color: #ffffff;
            border: none;
        }

        .cover-slide::before {
            height: 8px;
            background: linear-gradient(90deg, #d97706 0%, #38bdf8 100%);
        }

        .cover-top-tag {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 9.5pt;
            font-weight: 700;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #38bdf8;
            margin-bottom: 24px;
        }

        .cover-title {
            font-family: 'Outfit', sans-serif;
            font-size: 38pt;
            font-weight: 800;
            line-height: 1.1;
            margin-bottom: 16px;
            background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .cover-subtitle {
            font-size: 15pt;
            color: #94a3b8;
            font-weight: 400;
            max-width: 900px;
            line-height: 1.4;
            margin-bottom: 36px;
        }

        .cover-kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 18px;
            margin-bottom: 36px;
        }

        .cover-kpi-box {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 12px;
            padding: 18px 20px;
            backdrop-filter: blur(8px);
        }

        .cover-kpi-box .label {
            font-size: 8.5pt;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #94a3b8;
            margin-bottom: 6px;
            font-weight: 600;
        }

        .cover-kpi-box .value {
            font-family: 'Outfit', sans-serif;
            font-size: 20pt;
            font-weight: 700;
            color: #ffffff;
        }

        .cover-kpi-box .desc {
            font-size: 8pt;
            color: #64748b;
            margin-top: 4px;
        }

        .cover-meta-table {
            background: rgba(0, 0, 0, 0.25);
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 16px 24px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            font-size: 9.5pt;
        }

        .cover-meta-table div span {
            color: #94a3b8;
            display: block;
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .cover-meta-table div strong {
            color: #f8fafc;
            font-weight: 600;
        }

        /* GRIDS & CARDS */
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
        }

        .grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }

        .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 18px;
        }

        .card {
            background: var(--bg-alt);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 24px;
            transition: all 0.2s ease;
        }

        .card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 14px;
        }

        .card-icon {
            width: 38px;
            height: 38px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14pt;
            font-weight: 700;
        }

        .card-icon.blue { background: #dbeafe; color: #1e40af; }
        .card-icon.amber { background: #fef3c7; color: #92400e; }
        .card-icon.emerald { background: #d1fae5; color: #065f46; }
        .card-icon.rose { background: #ffe4e6; color: #9f1239; }

        .card h3 {
            font-family: 'Outfit', sans-serif;
            font-size: 13pt;
            font-weight: 700;
            color: var(--primary);
        }

        .card p {
            font-size: 10pt;
            color: #334155;
            line-height: 1.45;
        }

        .card ul {
            padding-left: 18px;
            font-size: 9.5pt;
            color: #475569;
            margin-top: 8px;
        }

        .card ul li {
            margin-bottom: 6px;
        }

        /* COMPARISON PANELS (SLIDE 2) */
        .comparison-panel {
            border-radius: 14px;
            padding: 26px;
            position: relative;
        }

        .comparison-panel.legacy {
            background: #fff8f8;
            border: 1.5px solid #fecaca;
        }

        .comparison-panel.modern {
            background: #f0fdf4;
            border: 1.5px solid #bbf7d0;
        }

        .panel-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 8.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }

        .panel-badge.red { background: #fee2e2; color: #991b1b; }
        .panel-badge.green { background: #dcfce7; color: #166534; }

        .panel-title {
            font-family: 'Outfit', sans-serif;
            font-size: 15pt;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 14px;
        }

        .feature-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 12px;
            font-size: 9.8pt;
            color: #334155;
        }

        .feature-icon {
            font-size: 11pt;
            font-weight: 800;
            margin-top: -1px;
        }

        .quote-banner {
            background: #0a2540;
            color: #ffffff;
            border-radius: 10px;
            padding: 16px 24px;
            margin-top: 24px;
            display: flex;
            align-items: center;
            gap: 16px;
            border-left: 6px solid #d97706;
        }

        .quote-banner p {
            font-size: 11pt;
            font-style: italic;
            color: #f1f5f9;
        }

        /* TABLES */
        .table-custom {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--border);
            font-size: 9.5pt;
        }

        .table-custom th {
            background: var(--primary);
            color: #ffffff;
            font-family: 'Outfit', sans-serif;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            padding: 12px 16px;
            text-align: left;
        }

        .table-custom td {
            padding: 12px 16px;
            border-bottom: 1px solid var(--border);
            background: #ffffff;
            color: #1e293b;
        }

        .table-custom tr:nth-child(even) td {
            background: #f8fafc;
        }

        .table-custom tr:last-child td {
            border-bottom: none;
        }

        .table-custom .highlight-row td {
            background: #eff6ff;
            font-weight: 700;
            color: #1e3a8a;
            font-size: 10.5pt;
        }

        .badge-status {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
        }

        .badge-status.success { background: #dcfce7; color: #15803d; }
        .badge-status.warning { background: #fef3c7; color: #b45309; }
        .badge-status.info { background: #e0e7ff; color: #4338ca; }

        /* KPI METRIC CARDS */
        .kpi-card {
            background: #ffffff;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px;
            box-shadow: var(--shadow);
            border-top: 4px solid var(--accent);
        }

        .kpi-card.gold { border-top-color: var(--gold); }
        .kpi-card.emerald { border-top-color: var(--emerald); }
        .kpi-card.rose { border-top-color: var(--rose); }

        .kpi-card .kpi-num {
            font-family: 'Outfit', sans-serif;
            font-size: 26pt;
            font-weight: 800;
            color: var(--primary);
            line-height: 1;
            margin: 6px 0;
        }

        .kpi-card .kpi-title {
            font-size: 8.5pt;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: var(--text-muted);
            font-weight: 700;
        }

        .kpi-card .kpi-sub {
            font-size: 8pt;
            color: #64748b;
        }

        /* CODE SNIPPET BOX */
        .code-container {
            background: #0f172a;
            border-radius: 10px;
            padding: 16px;
            color: #f8fafc;
            font-family: 'JetBrains Mono', monospace;
            font-size: 8pt;
            line-height: 1.4;
            max-height: 260px;
            overflow-y: auto;
            border: 1px solid #334155;
        }

        /* PRINT MEDIA STYLES */
        @media print {
            body {
                padding: 0;
                background: white;
            }
            .slide-container {
                max-width: 100%;
                gap: 0;
            }
            .slide {
                border-radius: 0;
                box-shadow: none;
                border: none;
                min-height: 100vh;
                padding: 30mm 20mm;
            }
        }
    </style>
</head>
<body>

<div class="slide-container">

    <!-- ==========================================
         SLIDE 1: PORTADA & RESUMEN EJECUTIVO
         ========================================== -->
    <section class="slide cover-slide">
        <div>
            <div class="cover-top-tag">
                <span>🛡️ Naviera Petral S.A. • Dictamen & Sustento de Alcance</span>
            </div>
            <h1 class="cover-title">NAVIGATING THE FUTURE</h1>
            <h2 class="cover-subtitle">
                De una Herramienta Táctica a la Transformación Digital de Naviera Petral: Sustento de Ampliación de Alcance, Consultoría de Procesos y Auditoría Forense de Horas Devengadas.
            </h2>
        </div>

        <div class="cover-kpi-grid">
            <div class="cover-kpi-box">
                <div class="label">Contrato Base</div>
                <div class="value">100.00 hrs</div>
                <div class="desc">Estimación táctica inicial</div>
            </div>
            <div class="cover-kpi-box">
                <div class="label">Horas Reales Auditadas</div>
                <div class="value" style="color: #38bdf8;">434.77 hrs</div>
                <div class="desc">Algoritmo inalterable IDE Git</div>
            </div>
            <div class="cover-kpi-box">
                <div class="label">Sobreesfuerzo Devengado</div>
                <div class="value" style="color: #f59e0b;">+334.77 hrs</div>
                <div class="desc">+334.8% de valor incremental</div>
            </div>
            <div class="cover-kpi-box">
                <div class="label">Entregable Resultante</div>
                <div class="value" style="color: #10b981;">Enterprise</div>
                <div class="desc">Plataforma Cloud + VPS Vivo</div>
            </div>
        </div>

        <div class="cover-meta-table">
            <div>
                <span>Consultor / Proveedor</span>
                <strong>GEEKSOFT (Richard Gutiérrez)</strong>
            </div>
            <div>
                <span>Cliente / Stakeholder</span>
                <strong>Naviera Petral S.A. (Gerencia General & Comercial)</strong>
            </div>
            <div>
                <span>Fecha & Referencia</span>
                <strong>Agosto 2026 • Base: COTIZACION_MODULAR_V10</strong>
            </div>
        </div>

        <div class="slide-footer" style="border-top-color: rgba(255,255,255,0.1); color: #64748b;">
            <span>PETRAL SMART DASHBOARD & MOTOR MULTICOTIZADOR</span>
            <span>Diapositiva 01 / 08</span>
        </div>
    </section>


    <!-- ==========================================
         SLIDE 2: PREMISA INICIAL VS REALIDAD
         ========================================== -->
    <section class="slide">
        <div class="slide-header">
            <div class="slide-title-group">
                <h2>Premisa Inicial vs. Diagnóstico Operativo Real</h2>
                <p>El punto de quiebre donde la simple automatización requirió un saneamiento estructural integral.</p>
            </div>
            <div class="slide-badge">Diagnóstico Forense</div>
        </div>

        <div class="slide-body">
            <div class="grid-2">
                <div class="comparison-panel legacy">
                    <div class="panel-badge red">❌ Lo que se cotizó (Junio 2026)</div>
                    <div class="panel-title">Automatización de Hoja de Cálculo</div>
                    <div class="feature-item">
                        <div class="feature-icon" style="color: #dc2626;">▪</div>
                        <div><strong>Supuesto de Datos Limpios:</strong> Fórmulas lineales fijas y estructura de costos portuarios supuestamente estandarizada.</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon" style="color: #dc2626;">▪</div>
                        <div><strong>Alcance Reducido:</strong> Un multicotizador estático donde el usuario solo ingresa inputs básicos para obtener un flete sugerido.</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon" style="color: #dc2626;">▪</div>
                        <div><strong>Esfuerzo Estimado:</strong> 100 horas hombre de programación pura sobre supuestos estables.</div>
                    </div>
                </div>

                <div class="comparison-panel modern">
                    <div class="panel-badge green">✅ La Realidad Operativa Encontrada</div>
                    <div class="panel-title">Saneamiento y Reingeniería de Procesos</div>
                    <div class="feature-item">
                        <div class="feature-icon" style="color: #16a34a;">✔</div>
                        <div><strong>Ausencia de Flujos Formalizados:</strong> Manuales de funciones tácitos, criterios dispersos entre analistas y liquidaciones históricas divergentes.</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon" style="color: #16a34a;">✔</div>
                        <div><strong>Maestros Desalineados:</strong> Nombres duplicados de agencias, dobles nomenclaturas de combustible (MGO vs MDO) y demoras sin regla uniforme.</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon" style="color: #16a34a;">✔</div>
                        <div><strong>Fugas de Cálculo:</strong> Diferencias en liquidación de viajes históricos que requerían auditoría previa para asegurar precisión matemática.</div>
                    </div>
                </div>
            </div>

            <div class="quote-banner">
                <span style="font-size: 24pt;">💡</span>
                <p>
                    <strong>Principio de Ingeniería:</strong> "No se podía construir un rascacielos digital sobre cimientos de datos inconsistentes sin antes ejecutar un saneamiento operativo y de procesos profundo."
                </p>
            </div>
        </div>

        <div class="slide-footer">
            <span><strong>PETRAL SMART DASHBOARD</strong> • Auditoría de Alcance</span>
            <span>Diapositiva 02 / 08</span>
        </div>
    </section>


    <!-- ==========================================
         SLIDE 3: SALTO TECNOLÓGICO ("HUEVOS DE PASCUA")
         ========================================== -->
    <section class="slide">
        <div class="slide-header">
            <div class="slide-title-group">
                <h2>Evolución Arquitectónica: De Prototipo a Enterprise</h2>
                <p>Módulos de alto valor añadido desarrollados e incorporados ("Huevos de Pascua").</p>
            </div>
            <div class="slide-badge">Salto Tecnológico</div>
        </div>

        <div class="slide-body">
            <div class="grid-2" style="gap: 20px;">
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon blue">📊</div>
                        <div>
                            <h3>1. Matriz Financiera Modular Multimes</h3>
                            <span style="font-size: 8pt; color: var(--accent); font-weight: 700;">MODELAMIENTO DINÁMICO</span>
                        </div>
                    </div>
                    <p>Capacidad de modelar escenarios paralelos con desglose exhaustivo de P&L, yield flete puro, demoras dinámicas y dockage revenue en tiempo real.</p>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-icon amber">🧭</div>
                        <div>
                            <h3>2. Ruteador SPOT Multileg & Fondeo</h3>
                            <span style="font-size: 8pt; color: var(--gold); font-weight: 700;">ALGORITMO GEOGRÁFICO</span>
                        </div>
                    </div>
                    <p>Cálculo geográfico interactivo de rutas marítimas, matrices de distancias en nudos, tiempos de navegación vs. fondeo y auto-selección de tarifas de agenciamiento.</p>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-icon emerald">🖨️</div>
                        <div>
                            <h3>3. Motor Exportador PDF de Grado Pericial</h3>
                            <span style="font-size: 8pt; color: var(--emerald); font-weight: 700;">AUDITORÍA VISUAL</span>
                        </div>
                    </div>
                    <p>Generación automatizada de reportes comerciales y cotizaciones con sellos forenses ("Printed By", timestamps inalterables de emisión y firmas digitales).</p>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-icon rose">🔒</div>
                        <div>
                            <h3>4. Seguridad & Despliegue VPS Dedicado</h3>
                            <span style="font-size: 8pt; color: var(--rose); font-weight: 700;">INFRAESTRUCTURA CLOUD</span>
                        </div>
                    </div>
                    <p>Control granular de roles (Admin, Comercial, Auditor), persistencia multi-usuario en Supabase y arquitectura productiva en VPS Contabo dedicado.</p>
                </div>
            </div>
        </div>

        <div class="slide-footer">
            <span><strong>PETRAL SMART DASHBOARD</strong> • Auditoría de Alcance</span>
            <span>Diapositiva 03 / 08</span>
        </div>
    </section>


    <!-- ==========================================
         SLIDE 4: CONSULTORÍA DE PROCESOS & MOF OCULTO
         ========================================== -->
    <section class="slide">
        <div class="slide-header">
            <div class="slide-title-group">
                <h2>Consultoría de Procesos & Reingeniería (El "MOF Oculto")</h2>
                <p>Entregables no tangibles de consultoría incorporados orgánicamente al software.</p>
            </div>
            <div class="slide-badge">Reingeniería Operativa</div>
        </div>

        <div class="slide-body">
            <div class="grid-4" style="margin-bottom: 20px;">
                <div class="kpi-card">
                    <div class="kpi-title">Reglas de Negocio</div>
                    <div class="kpi-num" style="font-size: 20pt; color: #1e40af;">Demoras</div>
                    <div class="kpi-sub">Estandarización formal: Modo 0 vs. Demoras Reales y consumo en fondeo.</div>
                </div>

                <div class="kpi-card emerald">
                    <div class="kpi-title">Homologación</div>
                    <div class="kpi-num" style="font-size: 20pt; color: #065f46;">MGO = MDO</div>
                    <div class="kpi-sub">Unificación de compras y consumo bajo estándar de la industria.</div>
                </div>

                <div class="kpi-card gold">
                    <div class="kpi-title">Auditoría Cero</div>
                    <div class="kpi-num" style="font-size: 20pt; color: #92400e;">100% Cero Fugas</div>
                    <div class="kpi-sub">Corrección de discrepancias de centavos entre comercial y contabilidad.</div>
                </div>

                <div class="kpi-card rose">
                    <div class="kpi-title">Gobernanza</div>
                    <div class="kpi-num" style="font-size: 20pt; color: #9f1239;">MOF Vivo</div>
                    <div class="kpi-sub">El sistema digitaliza y salvaguarda el conocimiento institucional de Petral.</div>
                </div>
            </div>

            <div class="card" style="background: #f8fafc; border-left: 5px solid var(--accent);">
                <h3 style="color: var(--primary); margin-bottom: 6px;">El Impacto en la Gobernanza Empresarial de Naviera Petral:</h3>
                <p style="font-size: 10pt; color: #334155;">
                    El trabajo de Geeksoft no se limitó a escribir líneas de código; se tradujo en una <strong>consultoría integral de reingeniería de procesos</strong>. Antes del proyecto, el cálculo de un viaje dependía de criterios dispersos y memoria histórica. Hoy, la plataforma actúa como la autoridad central de cálculo, eliminando el riesgo operativo humano y garantizando que cualquier cotización emitida por Petral sea auditable y financieramente sólida.
                </p>
            </div>
        </div>

        <div class="slide-footer">
            <span><strong>PETRAL SMART DASHBOARD</strong> • Auditoría de Alcance</span>
            <span>Diapositiva 04 / 08</span>
        </div>
    </section>


    <!-- ==========================================
         SLIDE 5: ANTICIPACIÓN ESTRATÉGICA - LIQUIDACIONES
         ========================================== -->
    <section class="slide">
        <div class="slide-header">
            <div class="slide-title-group">
                <h2>Anticipación Estratégica: Cimiento de Liquidaciones</h2>
                <p>Valor futuro ya construido: la base para la comparación Presupuestado vs. Real.</p>
            </div>
            <div class="slide-badge">Ahorro Estratégico</div>
        </div>

        <div class="slide-body">
            <div class="grid-2">
                <div class="card" style="background: #ffffff; border: 1.5px solid #bfdbfe;">
                    <div class="card-header">
                        <div class="card-icon blue">🏗️</div>
                        <div>
                            <h3>Arquitectura Espejo Ya Implementada</h3>
                            <span style="font-size: 8.5pt; color: var(--accent); font-weight: 700;">FASE 1 ANTICIPÓ LA FASE 2</span>
                        </div>
                    </div>
                    <p style="margin-bottom: 12px;">
                        El motor no se diseñó como un callejón sin salida; se estructuró para servir de <strong>matriz receptora</strong> donde los analistas ingresarán las ejecuciones reales de viaje:
                    </p>
                    <ul>
                        <li>Costos de combustible reales facturados vs. calculados en la cotización.</li>
                        <li>Facturas de agencias y practicaje liquidadas vs. proyecciones SPOT.</li>
                        <li>Días reales de fondeo/muelle para cálculo de demurrage real devengado.</li>
                    </ul>
                </div>

                <div class="card" style="background: #ffffff; border: 1.5px solid #bbf7d0;">
                    <div class="card-header">
                        <div class="card-icon emerald">⚡</div>
                        <div>
                            <h3>Reducción Radical del Costo Futuro</h3>
                            <span style="font-size: 8.5pt; color: var(--emerald); font-weight: 700;">60% DE AHORRO EN CRONOGRAMA</span>
                        </div>
                    </div>
                    <p style="margin-bottom: 12px;">
                        Al haber estandarizado los maestros, la base de datos y la interfaz en esta fase:
                    </p>
                    <ul>
                        <li><strong>60% menos de tiempo</strong> en el desarrollo del futuro Módulo de Liquidaciones Dinámicas.</li>
                        <li>Cero costo de reestructuración de bases de datos o esquemas relacionales.</li>
                        <li>Curva de aprendizaje del personal prácticamente nula al compartir la misma interfaz.</li>
                    </ul>
                </div>
            </div>

            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px 24px; margin-top: 22px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <span style="font-size: 8.5pt; font-weight: 700; text-transform: uppercase; color: #1e40af; letter-spacing: 0.5px;">Retorno de Inversión Tecnológica</span>
                    <h4 style="font-size: 13pt; color: #1e3a8a; font-weight: 700; margin-top: 2px;">Petral ya posee el 50% del módulo de liquidaciones operativas listo.</h4>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 24pt; font-weight: 800; color: #1e40af; font-family: 'Outfit';">-60% TTM</span>
                    <div style="font-size: 8pt; color: #64748b;">(Time to Market Futuro)</div>
                </div>
            </div>
        </div>

        <div class="slide-footer">
            <span><strong>PETRAL SMART DASHBOARD</strong> • Auditoría de Alcance</span>
            <span>Diapositiva 05 / 08</span>
        </div>
    </section>


    <!-- ==========================================
         SLIDE 6: AUDITORÍA FORENSE DE HORAS
         ========================================== -->
    <section class="slide">
        <div class="slide-header">
            <div class="slide-title-group">
                <h2>Auditoría Forense de Actividad Digital</h2>
                <p>Trazabilidad matemática e inalterable basada en logs de eventos Git y clustering de sesiones IDE.</p>
            </div>
            <div class="slide-badge">Evidencia Inmutable</div>
        </div>

        <div class="slide-body">
            <div class="grid-4" style="margin-bottom: 20px;">
                <div class="kpi-card">
                    <div class="kpi-title">Jornadas Reales</div>
                    <div class="kpi-num">101</div>
                    <div class="kpi-sub">Días continuos auditados</div>
                </div>

                <div class="kpi-card gold">
                    <div class="kpi-title">Eventos & Commits</div>
                    <div class="kpi-num" style="color: var(--gold);">3,063</div>
                    <div class="kpi-sub">Trazas registradas</div>
                </div>

                <div class="kpi-card rose">
                    <div class="kpi-title">Horas Reales IDE</div>
                    <div class="kpi-num" style="color: var(--rose);">434.77 h</div>
                    <div class="kpi-sub">Auditoría Forense</div>
                </div>

                <div class="kpi-card emerald">
                    <div class="kpi-title">Sobreesfuerzo</div>
                    <div class="kpi-num" style="color: var(--emerald);">+334.8%</div>
                    <div class="kpi-sub">+334.77 hrs entregadas</div>
                </div>
            </div>

            <div class="grid-2" style="gap: 20px; align-items: stretch;">
                <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <h3 style="margin-bottom: 8px;">Comparativa de Carga Horaria</h3>
                        <p style="font-size: 9.5pt; margin-bottom: 16px;">Contraste visual entre la estimación táctica de la cotización y la ejecución efectiva requerida para el saneamiento.</p>
                        
                        <div style="margin-bottom: 14px;">
                            <div style="display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: 700; margin-bottom: 4px;">
                                <span>Horas Base Contratadas</span>
                                <span>100.00 hrs (23%)</span>
                            </div>
                            <div style="width: 100%; height: 16px; background: #e2e8f0; border-radius: 8px; overflow: hidden;">
                                <div style="width: 23%; height: 100%; background: #64748b;"></div>
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: 700; margin-bottom: 4px; color: var(--accent);">
                                <span>Horas Reales Devengadas (IDE + Git)</span>
                                <span>434.77 hrs (100%)</span>
                            </div>
                            <div style="width: 100%; height: 16px; background: #e2e8f0; border-radius: 8px; overflow: hidden;">
                                <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #2563eb, #38bdf8);"></div>
                            </div>
                        </div>
                    </div>

                    <div style="font-size: 8.5pt; color: #64748b; background: #f1f5f9; padding: 10px; border-radius: 6px; margin-top: 14px;">
                        Algoritmo: Ventana móvil de inactividad de 2.5h + warmup de 30min por sesión.
                    </div>
                </div>

                <div>
                    <h3 style="font-size: 10pt; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 8px;">Algoritmo Forense de Sesiones (Python)</h3>
                    <div class="code-container">
<span style="color: #64748b;"># Clustering forense de sesiones Git + Filesystem</span>
<span style="color: #f43f5e;">for</span> idx, day <span style="color: #f43f5e;">in</span> enumerate(sorted(day_activity.keys())):
    timestamps = sorted(day_activity[day])
    <span style="color: #38bdf8;">for</span> t <span style="color: #f43f5e;">in</span> timestamps[<span style="color: #fbbf24;">1</span>:]:
        <span style="color: #38bdf8;">if</span> (t - curr_end).total_seconds() &lt;= <span style="color: #fbbf24;">9000</span>: <span style="color: #64748b;"># 2.5h idle</span>
            curr_end = t
        <span style="color: #38bdf8;">else</span>:
            sessions.append((curr_start, curr_end))
            curr_start = t; curr_end = t
    <span style="color: #64748b;"># Calculo exacto de tiempo + warmup 30 min</span>
    total_hours_project += sum((s[1]-s[0]).total_seconds()+1800) / 3600.0
                    </div>
                </div>
            </div>
        </div>

        <div class="slide-footer">
            <span><strong>PETRAL SMART DASHBOARD</strong> • Auditoría de Alcance</span>
            <span>Diapositiva 06 / 08</span>
        </div>
    </section>


    <!-- ==========================================
         SLIDE 7: BALANCE ECONÓMICO & PROPUESTA
         ========================================== -->
    <section class="slide">
        <div class="slide-header">
            <div class="slide-title-group">
                <h2>Balance Económico & Propuesta de Regularización</h2>
                <p>Valorización formal del servicio entregado y esquema comercial de cierre.</p>
            </div>
            <div class="slide-badge">Liquidación Comercial</div>
        </div>

        <div class="slide-body">
            <table class="table-custom" style="margin-bottom: 24px;">
                <thead>
                    <tr>
                        <th>Concepto / Entregable</th>
                        <th style="text-align: center;">Horas</th>
                        <th style="text-align: center;">Tarifa Ref.</th>
                        <th style="text-align: right;">Subtotal (USD)</th>
                        <th style="text-align: center;">Estado Operativo</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>Presupuesto Inicial Aprobado (One-Timers)</strong><br>
                            <span style="font-size: 8pt; color: #64748b;">Módulos 1, 2, 3, 4 + Carga de Datos y Onboarding</span>
                        </td>
                        <td style="text-align: center;">150.00 hrs</td>
                        <td style="text-align: center;">$50 - $100</td>
                        <td style="text-align: right; font-weight: 700;">$9,100.00</td>
                        <td style="text-align: center;"><span class="badge-status info">Base Contratada</span></td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Horas Adicionales Devengadas (Sobreesfuerzo)</strong><br>
                            <span style="font-size: 8pt; color: #64748b;">Consultoría de Procesos, Algoritmos SPOT, Seguridad VPS & Reingeniería</span>
                        </td>
                        <td style="text-align: center; color: var(--rose); font-weight: 700;">334.77 hrs</td>
                        <td style="text-align: center;">$60.00</td>
                        <td style="text-align: right; color: var(--rose); font-weight: 700;">$20,086.20</td>
                        <td style="text-align: center;"><span class="badge-status warning">Valor Entregado</span></td>
                    </tr>
                    <tr class="highlight-row">
                        <td>
                            <strong>VALOR TOTAL REAL ENTREGADO A NAVIERA PETRAL</strong>
                        </td>
                        <td style="text-align: center;">484.77 hrs</td>
                        <td style="text-align: center;">—</td>
                        <td style="text-align: right; font-size: 12pt;">$29,186.20</td>
                        <td style="text-align: center;"><span class="badge-status success">En Operación</span></td>
                    </tr>
                </tbody>
            </table>

            <div class="grid-2" style="gap: 20px;">
                <div class="card" style="background: #ffffff; border: 1.5px solid #bfdbfe;">
                    <h3 style="color: var(--accent); margin-bottom: 6px;">Opción A: Paquete Cerrado de Regularización</h3>
                    <p style="font-size: 9.5pt; color: #334155;">
                        Acuerdo de monto fijo cerrado por concepto de la consultoría de procesos, auditorías forenses y funcionalidades enterprise entregadas fuera del alcance inicial.
                    </p>
                </div>

                <div class="card" style="background: #ffffff; border: 1.5px solid #bbf7d0;">
                    <h3 style="color: var(--emerald); margin-bottom: 6px;">Opción B: Integración con Fase Liquidaciones</h3>
                    <p style="font-size: 9.5pt; color: #334155;">
                        Amortización paquetizada vinculada al Kickoff del módulo de liquidaciones reales y activación del fee mensual de mantenimiento y hosting VPS ($500/mes).
                    </p>
                </div>
            </div>
        </div>

        <div class="slide-footer">
            <span><strong>PETRAL SMART DASHBOARD</strong> • Auditoría de Alcance</span>
            <span>Diapositiva 07 / 08</span>
        </div>
    </section>


    <!-- ==========================================
         SLIDE 8: ROADMAP & PASE A PRODUCCIÓN
         ========================================== -->
    <section class="slide">
        <div class="slide-header">
            <div class="slide-title-group">
                <h2>Roadmap Inmediato & Pase a Producción (VPS)</h2>
                <p>Hitos de cierre y plan de continuidad operativa para Naviera Petral.</p>
            </div>
            <div class="slide-badge">Go-Live & Continuidad</div>
        </div>

        <div class="slide-body">
            <div class="grid-4" style="margin-bottom: 24px;">
                <div class="card" style="text-align: center; border-top: 4px solid var(--emerald);">
                    <div style="font-size: 26pt; margin-bottom: 8px;">🚀</div>
                    <h3 style="font-size: 11.5pt; margin-bottom: 6px;">1. Despliegue en Vivo</h3>
                    <p style="font-size: 8.8pt; color: #475569;">
                        Plataforma 100% activa en <strong>https://forecast.geeksoft.tech</strong> en VPS Contabo de alto rendimiento.
                    </p>
                </div>

                <div class="card" style="text-align: center; border-top: 4px solid var(--accent);">
                    <div style="font-size: 26pt; margin-bottom: 8px;">👥</div>
                    <h3 style="font-size: 11.5pt; margin-bottom: 6px;">2. Onboarding</h3>
                    <p style="font-size: 8.8pt; color: #475569;">
                        Sesiones de transferencia y capacitación con J. Neyra, F. Harten, M.E. Castro e I. Zavala.
                    </p>
                </div>

                <div class="card" style="text-align: center; border-top: 4px solid var(--gold);">
                    <div style="font-size: 26pt; margin-bottom: 8px;">🛡️</div>
                    <h3 style="font-size: 11.5pt; margin-bottom: 6px;">3. Soporte Continuo</h3>
                    <p style="font-size: 8.8pt; color: #475569;">
                        Activación de fee de soporte, hosting dedicado y base de datos Supabase ($500/mes).
                    </p>
                </div>

                <div class="card" style="text-align: center; border-top: 4px solid var(--rose);">
                    <div style="font-size: 26pt; margin-bottom: 8px;">📈</div>
                    <h3 style="font-size: 11.5pt; margin-bottom: 6px;">4. Liquidaciones</h3>
                    <p style="font-size: 8.8pt; color: #475569;">
                        Kickoff de carga de viajes ejecutados para cerrar la brecha Presupuestado vs. Real.
                    </p>
                </div>
            </div>

            <div style="background: linear-gradient(135deg, #0a2540 0%, #1e3a8a 100%); color: #ffffff; border-radius: 12px; padding: 22px 30px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="font-family: 'Outfit'; font-size: 16pt; font-weight: 700; margin-bottom: 4px;">Sistema Listo para Operación Inmediata</h3>
                    <p style="font-size: 10pt; color: #cbd5e1;">Todos los módulos de inteligencia comercial se encuentran auditados, sincronizados y disponibles para el equipo de Petral.</p>
                </div>
                <div>
                    <span style="display: inline-block; background: #10b981; color: #ffffff; font-weight: 800; padding: 8px 18px; border-radius: 8px; font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.5px;">
                        ● Producción Activa
                    </span>
                </div>
            </div>
        </div>

        <div class="slide-footer">
            <span><strong>PETRAL SMART DASHBOARD</strong> • Auditoría de Alcance</span>
            <span>Diapositiva 08 / 08</span>
        </div>
    </section>

</div>

</body>
</html>
"""

with open(output_html, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"[+] HTML generado exitosamente en: {output_html}")
