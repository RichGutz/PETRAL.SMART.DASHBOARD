import os

output_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador\Informe_Sustento_Modificacion_Alcance_Petral.html"
logo_path = r"file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Boiler.Plate/PPTS.HERMOSAS/logo_final_v3.png"

html_template = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Navigating the Future: Sustento de Modificación de Alcance & Auditoría Forense</title>
    
<style>
    @media print {{
        @page {{ 
            margin: 5mm 15mm 12mm 15mm; 
            size: A4 landscape;
        }}
        body {{ 
            font-family: 'Arial', sans-serif; 
            font-size: 10.5pt; 
            line-height: 1.35; 
            color: #000; 
            background: #fff;
            margin: 0;
            padding: 0;
        }}
        .header-print {{
            position: fixed;
            top: 2mm;
            right: 5mm;
            left: 0;
            text-align: right;
            padding-bottom: 4px;
            z-index: 100;
        }}
        .header-print img {{
            height: 70px !important;
        }}
        .footer-print {{
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 9pt;
            color: #555;
            text-align: center;
            border-top: 1.5px solid #0f2c59;
            padding-top: 4px;
            background: white;
            z-index: 100;
        }}
        .header-space {{ height: 20mm; }}
        .footer-space {{ height: 10mm; }}

        .cover-page {{ 
            page-break-after: always; 
            padding-top: 15mm !important;
            text-align: center;
            position: relative;
        }}
        h2 {{ 
            font-size: 20pt !important; 
            font-weight: bold; 
            color: #0f2c59;
            margin-top: 0pt !important; 
            margin-bottom: 8pt !important; 
            page-break-before: always;
            border-bottom: 2px solid #0f2c59;
            padding-bottom: 4px;
        }}
        table.page-wrapper {{
            width: 100%;
            border-collapse: collapse;
            border: none !important;
            margin: 0;
        }}
        table.page-wrapper > tbody > tr > td,
        table.page-wrapper > thead > tr > td {{
            padding: 0;
            vertical-align: top;
            border: none !important;
            background: none;
        }}
        .slide-block {{
            page-break-inside: avoid;
        }}
    }}

    /* Estilos Generales Pantalla / Web */
    body {{
        font-family: 'Segoe UI', Arial, sans-serif;
        background-color: #f1f5f9;
        margin: 0;
        padding: 20px;
        color: #1e293b;
    }}
    .document-container {{
        max-width: 1320px;
        margin: 0 auto;
        background: #ffffff;
        padding: 30px 45px 50px 45px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.12);
        border-radius: 8px;
    }}
    .header-print {{
        text-align: right;
        margin-bottom: 10px;
    }}
    .header-print img {{
        height: 75px;
    }}
    .footer-print {{
        margin-top: 30px;
        font-size: 9pt;
        color: #64748b;
        text-align: center;
        border-top: 1.5px solid #0f2c59;
        padding-top: 8px;
        font-weight: 500;
    }}
    h1 {{
        color: #0f2c59;
        font-size: 26pt;
        margin-bottom: 8px;
        border-bottom: 2.5px solid #0f2c59;
        padding-bottom: 6px;
    }}
    h2 {{
        color: #0f2c59;
        font-size: 19pt;
        margin-top: 35px;
        margin-bottom: 10px;
        border-bottom: 2px solid #0f2c59;
        padding-bottom: 4px;
    }}
    h3 {{
        color: #0f2c59;
        font-size: 12.5pt;
        margin-top: 10px;
        margin-bottom: 4px;
    }}
    p {{
        margin-bottom: 8px;
        line-height: 1.45;
        font-size: 10.5pt;
        text-align: justify;
    }}
    table {{
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
        font-size: 10pt;
    }}
    th {{
        background-color: #0f2c59;
        color: white;
        padding: 8px 10px;
        text-align: left;
        border: 1px solid #0f2c59;
        font-size: 9.5pt;
        font-weight: bold;
    }}
    td {{
        padding: 7px 10px;
        border: 1px solid #cbd5e1;
        font-size: 9.5pt;
    }}

    /* Componentes Visuales del PPT Boilerplate */
    .cover-page {{
        text-align: center;
        position: relative;
        padding: 20px 10px 30px 10px;
        margin-bottom: 25px;
    }}
    .callout-box {{
        padding: 20px 24px;
        border-radius: 8px;
        margin-bottom: 15px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.06);
    }}
    .callout-blue {{
        background-color: #e3f2fd;
        border-left: 8px solid #1565c0;
    }}
    .callout-amber {{
        background-color: #fffde7;
        border-left: 8px solid #f9a825;
    }}
    .callout-green {{
        background-color: #e8f5e9;
        border-left: 8px solid #1e8449;
    }}
    .callout-purple {{
        background-color: #f3e5f5;
        border-left: 8px solid #6a1b9a;
    }}

    .kpi-row {{
        display: flex;
        justify-content: space-between;
        gap: 15px;
        margin: 15px 0;
    }}
    .kpi-card {{
        flex: 1;
        background: #f8fafc;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        padding: 12px 16px;
        text-align: center;
    }}
    .kpi-card .num {{
        font-size: 22pt;
        font-weight: bold;
        color: #0f2c59;
        line-height: 1.1;
        margin-top: 4px;
    }}
    .kpi-card .label {{
        font-size: 8pt;
        text-transform: uppercase;
        font-weight: bold;
        color: #64748b;
    }}

    .badge-status {{
        display: inline-block;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 8pt;
        font-weight: bold;
        text-transform: uppercase;
    }}
    .badge-blue {{ background: #dbeafe; color: #1e40af; }}
    .badge-green {{ background: #dcfce7; color: #15803d; }}
    .badge-amber {{ background: #fef3c7; color: #b45309; }}
    .badge-red {{ background: #fee2e2; color: #b91c1c; }}

    .code-box {{
        background-color: #0f172a;
        color: #f8fafc;
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 8.5pt;
        padding: 14px;
        border-radius: 6px;
        line-height: 1.35;
        overflow-x: auto;
    }}
</style>
</head>
<body>

<div class="document-container">

    <!-- CABECERA FIJA CON LOGO GEEKSOFT -->
    <div class="header-print">
        <img src="{logo_path}" alt="Geeksoft Logo">
    </div>

    <table class="page-wrapper">
        <thead><tr><td><div class="header-space"></div></td></tr></thead>
        <tbody><tr><td>

<!-- =========================================================
     SLIDE 1: PORTADA & RESUMEN EJECUTIVO (FORMATO PPT OFICIAL)
     ========================================================= -->
<div class="cover-page">
    <img src="{logo_path}" alt="Geeksoft Logo" style="max-height: 180px; margin-bottom: 12px;"/>
    <h1 style="color: #0f2c59; font-size: 26pt; margin-bottom: 5px; page-break-before: avoid; border-bottom: none !important; padding-bottom: 0px;">
        Navigating the Future: Inteligencia Comercial
    </h1>
    <div style="font-size: 14pt; color: #555; margin-bottom: 16px;">
        <em>Sustento de Modificación de Alcance, Consultoría de Procesos y Auditoría Forense de Horas Devengadas</em>
    </div>
    
    <div class="callout-box callout-blue" style="max-width: 950px; margin: 0 auto 20px auto; text-align: left;">
        <strong style="color: #0d47a1; font-size: 13pt; display: block; margin-bottom: 6px;">🎯 Resumen Ejecutivo de Dirección</strong>
        <span style="font-size: 10pt; line-height: 1.4; color: #333;">
            Presentación pericial a la Gerencia y Dirección de Naviera Petral S.A. que evidencia la evolución del proyecto: de una simple hoja de cálculo a una <strong>Plataforma Integral de Inteligencia Comercial + Consultoría de Reingeniería de Procesos</strong>, respaldada por un registro forense inalterable de <strong>434.77 horas reales ejecutadas</strong> (frente a 100h cotizadas).
        </span>
    </div>

    <div class="kpi-row" style="max-width: 950px; margin: 0 auto 20px auto;">
        <div class="kpi-card" style="border-top: 4px solid #0f2c59;">
            <div class="label">Contratadas Iniciales</div>
            <div class="num">100.00 h</div>
            <span style="font-size: 8pt; color: #64748b;">Cotización Base Junio 2026</span>
        </div>
        <div class="kpi-card" style="border-top: 4px solid #1565c0;">
            <div class="label">Horas Reales Auditadas</div>
            <div class="num" style="color: #1565c0;">434.77 h</div>
            <span style="font-size: 8pt; color: #1565c0; font-weight: bold;">Trazabilidad Forense IDE Git</span>
        </div>
        <div class="kpi-card" style="border-top: 4px solid #f9a825;">
            <div class="label">Sobreesfuerzo Devengado</div>
            <div class="num" style="color: #b45309;">+334.77 h</div>
            <span style="font-size: 8pt; color: #b45309; font-weight: bold;">+334.8% de Valor Adicional</span>
        </div>
        <div class="kpi-card" style="border-top: 4px solid #1e8449;">
            <div class="label">Estado de Producción</div>
            <div class="num" style="color: #1e8449; font-size: 18pt; margin-top: 8px;">100% VIVO</div>
            <span style="font-size: 8pt; color: #1e8449;">https://forecast.geeksoft.tech</span>
        </div>
    </div>

    <div style="font-size: 9.5pt; color: #64748b; margin-top: 10px;">
        <strong>Proyecto:</strong> PETRAL SMART DASHBOARD & MOTOR MULTICOTIZADOR &bull; <strong>Cliente:</strong> NAVIERA PETRAL S.A. &bull; <strong>Consultor:</strong> GEEKSOFT (Richard Gutiérrez)
    </div>
</div>


<!-- =========================================================
     SLIDE 2: PREMISA INICIAL VS DIAGNÓSTICO REAL
     ========================================================= -->
<h2>Slide 2: Premisa Inicial vs. Diagnóstico Operativo Real</h2>

<div class="callout-box callout-blue">
    <strong style="color: #0d47a1; font-size: 13pt; display: block; margin-bottom: 4px;">Principio de Ingeniería & Saneamiento de Datos</strong>
    <span style="font-size: 10pt; color: #333;">
        <em>"No se podía construir un edificio moderno sobre cimientos de datos inconsistentes sin antes ejecutar un saneamiento estructural y de procesos profundo."</em>
    </span>
</div>

<div style="display: flex; gap: 20px; margin-top: 10px;">
    <div style="flex: 1; border: 2px solid #ef5350; border-radius: 8px; overflow: hidden; background: #fff;">
        <div style="background-color: #c62828; color: white; padding: 10px 14px; font-weight: bold; font-size: 11pt;">
            ❌ Lo que se Cotizó (Premisa Inicial - Junio 2026)
        </div>
        <div style="padding: 14px; font-size: 9.5pt; color: #333; line-height: 1.45;">
            <p><strong>1. Automatización Lineal:</strong> Conversión de una hoja Excel con fórmulas fijas a una interfaz visual básica.</p>
            <p><strong>2. Supuesto de Data Limpia:</strong> Se asumió que los costos portuarios, tarifas de agenciamiento y distancias entre puertos estaban estandarizados y validados.</p>
            <p><strong>3. Esfuerzo Estimado:</strong> 100 horas de programación estándar sobre reglas de negocio estables y predefinidas.</p>
        </div>
    </div>

    <div style="flex: 1; border: 2px solid #2e7d32; border-radius: 8px; overflow: hidden; background: #fff;">
        <div style="background-color: #2e7d32; color: white; padding: 10px 14px; font-weight: bold; font-size: 11pt;">
            ✅ La Realidad Operativa Encontrada (Diagnóstico Forense)
        </div>
        <div style="padding: 14px; font-size: 9.5pt; color: #333; line-height: 1.45;">
            <p><strong>1. Ausencia de Flujos Formalizados:</strong> Manuales de funciones tácitos no documentados; divergencias de criterio entre áreas operativas y comerciales.</p>
            <p><strong>2. Maestros Desalineados:</strong> Duplicidad en nombres de agencias, dobles nomenclaturas para combustibles (MGO vs. MDO) y demoras sin regla uniforme.</p>
            <p><strong>3. Fugas de Cálculo:</strong> Inconsistencias históricas en liquidaciones de viajes que requerían una auditoría matemática previa para asegurar solidez.</p>
        </div>
    </div>
</div>


<!-- =========================================================
     SLIDE 3: EL SALTO TECNOLÓGICO ("HUEVOS DE PASCUA")
     ========================================================= -->
<h2>Slide 3: El Salto Tecnológico (Módulos Fuera de Alcance Original)</h2>

<p>Para dotar a Naviera Petral de una ventaja competitiva real, se incorporaron cuatro componentes transaccionales de alto valor tecnológico ("Huevos de Pascua"):</p>

<table style="margin-top: 10px;">
    <thead>
        <tr>
            <th style="width: 28%;">Módulo Enterprise Incorporado</th>
            <th style="width: 52%;">Descripción & Aporte Operativo a Petral</th>
            <th style="width: 20%; text-align: center;">Categoría</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                <strong style="color: #0f2c59; font-size: 10pt;">1. Matriz Financiera Modular Multimes</strong>
            </td>
            <td>
                Capacidad de modelar escenarios paralelos con desglose exhaustivo de P&L, yield flete puro, demoras dinámicas y dockage revenue en tiempo real.
            </td>
            <td style="text-align: center;"><span class="badge-status badge-blue">Modelamiento Financiero</span></td>
        </tr>
        <tr>
            <td>
                <strong style="color: #0f2c59; font-size: 10pt;">2. Ruteador SPOT Multileg & Algoritmos de Fondeo</strong>
            </td>
            <td>
                Cálculo geográfico interactivo de rutas marítimas, matrices de distancias en nudos, tiempos de navegación vs. fondeo y auto-selección de tarifas de agenciamiento.
            </td>
            <td style="text-align: center;"><span class="badge-status badge-amber">Algoritmo Geográfico</span></td>
        </tr>
        <tr>
            <td>
                <strong style="color: #0f2c59; font-size: 10pt;">3. Motor Exportador PDF de Grado Pericial</strong>
            </td>
            <td>
                Generación automatizada de reportes comerciales y cotizaciones con sellos forenses ("Printed By", timestamps inalterables de emisión y firmas digitales).
            </td>
            <td style="text-align: center;"><span class="badge-status badge-green">Auditoría Visual</span></td>
        </tr>
        <tr>
            <td>
                <strong style="color: #0f2c59; font-size: 10pt;">4. Seguridad Granular & Despliegue VPS Dedicado</strong>
            </td>
            <td>
                Control granular de roles (Admin, Comercial, Auditor), persistencia multi-usuario en Supabase y arquitectura productiva en VPS Contabo dedicado.
            </td>
            <td style="text-align: center;"><span class="badge-status badge-blue">Infraestructura Cloud</span></td>
        </tr>
    </tbody>
</table>


<!-- =========================================================
     SLIDE 4: CONSULTORÍA DE PROCESOS (EL "MOF OCULTO")
     ========================================================= -->
<h2>Slide 4: Consultoría de Procesos & Reingeniería (El "MOF Oculto")</h2>

<div class="callout-box callout-purple">
    <strong style="color: #4a148c; font-size: 12pt; display: block; margin-bottom: 4px;">Mucho más que Software: Consultoría y Gobernanza de Negocio</strong>
    <span style="font-size: 10pt; color: #333;">
        El software hoy actúa como el <strong>Manual de Organización y Funciones (MOF) digitalizado y vivo</strong> de Petral, blindando a la compañía contra errores operativos y salvaguardando el conocimiento institucional.
    </span>
</div>

<div style="display: flex; gap: 15px; margin-top: 10px;">
    <div style="flex: 1; background: #faf5ff; border: 1.5px solid #d8b4fe; border-radius: 8px; padding: 14px;">
        <strong style="color: #6b21a8; font-size: 10pt; display: block; margin-bottom: 6px;">📐 Estandarización de Criterios</strong>
        <span style="font-size: 9pt; color: #475569; line-height: 1.4; display: block;">
            Reglas formales para demoras (Modo 0 vs. Demoras Reales), combustible en puerto vs. mar y tarifas de agenciamiento por zona portuaria.
        </span>
    </div>

    <div style="flex: 1; background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 8px; padding: 14px;">
        <strong style="color: #047857; font-size: 10pt; display: block; margin-bottom: 6px;">⛽ Homologación Internacional</strong>
        <span style="font-size: 9pt; color: #475569; line-height: 1.4; display: block;">
            Unificación internacional del estándar MGO = MDO en todas las bases del negocio, eliminando duplicidades en inventarios y facturación.
        </span>
    </div>

    <div style="flex: 1; background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px; padding: 14px;">
        <strong style="color: #1d4ed8; font-size: 10pt; display: block; margin-bottom: 6px;">🔍 Eliminación de Fugas</strong>
        <span style="font-size: 9pt; color: #475569; line-height: 1.4; display: block;">
            Auditorías de convergencia que detectaron y erradicaron discrepancias de cálculo y diferencias de centavos entre Comercial y Contabilidad.
        </span>
    </div>

    <div style="flex: 1; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; padding: 14px;">
        <strong style="color: #b45309; font-size: 10pt; display: block; margin-bottom: 6px;">🛡️ Gobernanza Continua</strong>
        <span style="font-size: 9pt; color: #475569; line-height: 1.4; display: block;">
            Transición de un modelo dependiente de la memoria de las personas a una plataforma con reglas matemáticas auditables.
        </span>
    </div>
</div>


<!-- =========================================================
     SLIDE 5: ANTICIPACIÓN ESTRATÉGICA - LIQUIDACIONES DINÁMICAS
     ========================================================= -->
<h2>Slide 5: Valor Ganado: Cimientos de las Liquidaciones Dinámicas</h2>

<p>El desarrollo actual no se limitó a cotizar: <strong>dejó construido el esqueleto y la arquitectura</strong> para el futuro módulo de <em>Liquidaciones Dinámicas de Costos Portuarios</em>.</p>

<div style="display: flex; gap: 20px; margin-top: 10px;">
    <div style="flex: 1.2;" class="callout-box callout-green">
        <strong style="color: #1e8449; font-size: 12pt; display: block; margin-bottom: 6px;">Matriz Espejo: Presupuestado vs. Real Ejecutado</strong>
        <p style="font-size: 9.5pt; color: #333; margin-bottom: 8px;">
            El multicotizador servirá directamente como la matriz receptora donde los analistas registrarán las ejecuciones de cada viaje:
        </p>
        <ul style="font-size: 9pt; color: #333; padding-left: 18px; line-height: 1.4;">
            <li>Comparación de combustible estimado vs. facturado por Petroperú/Repsol.</li>
            <li>Días reales de muelle y fondeo para liquidación de demoras exactas.</li>
            <li>Costos de agenciamiento y practicaje liquidados contra proyecciones SPOT.</li>
        </ul>
    </div>

    <div style="flex: 0.8; background: #f8fafc; border: 2px dashed #0f2c59; border-radius: 8px; padding: 20px; text-align: center; display: flex; flex-direction: column; justify-content: center;">
        <span style="font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #64748b;">Ahorro de Tiempo Futuro</span>
        <div style="font-size: 34pt; font-weight: bold; color: #0f2c59; line-height: 1.1; margin: 6px 0;">-60%</div>
        <span style="font-size: 9.5pt; color: #1e8449; font-weight: bold;">Reducción de Cronograma en Fase 2</span>
        <p style="font-size: 8.5pt; color: #64748b; margin-top: 6px;">
            Al compartir la misma base de datos, maestros y layout, la siguiente fase de liquidaciones se reduce a la mitad de tiempo.
        </p>
    </div>
</div>


<!-- =========================================================
     SLIDE 6: AUDITORÍA FORENSE DE HORAS (100H VS 434.77H)
     ========================================================= -->
<h2>Slide 6: Auditoría Digital Forense de Horas (100h vs. 434.77h)</h2>

<div class="kpi-row">
    <div class="kpi-card">
        <div class="label">Jornadas Auditadas</div>
        <div class="num">101</div>
        <span style="font-size: 8pt; color: #64748b;">Días de trabajo continuo</span>
    </div>
    <div class="kpi-card">
        <div class="label">Eventos Registrados</div>
        <div class="num" style="color: #f9a825;">3,063</div>
        <span style="font-size: 8pt; color: #64748b;">Commits & File Events</span>
    </div>
    <div class="kpi-card">
        <div class="label">Horas Reales Ejecutadas</div>
        <div class="num" style="color: #e11d48;">434.77 h</div>
        <span style="font-size: 8pt; color: #e11d48; font-weight: bold;">Auditoría Inmutable IDE</span>
    </div>
    <div class="kpi-card">
        <div class="label">Sobreesfuerzo</div>
        <div class="num" style="color: #1e8449;">+334.8%</div>
        <span style="font-size: 8pt; color: #1e8449; font-weight: bold;">+334.77 hrs devengadas</span>
    </div>
</div>

<div style="display: flex; gap: 20px; margin-top: 10px;">
    <div style="flex: 1.1; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px;">
        <strong style="color: #0f2c59; font-size: 10.5pt; display: block; margin-bottom: 8px;">📊 Resumen de Densidad Horaria</strong>
        
        <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: bold; margin-bottom: 3px;">
                <span>Horas Base Contratadas:</span>
                <span>100.00 hrs (23%)</span>
            </div>
            <div style="width: 100%; height: 14px; background: #e2e8f0; border-radius: 7px; overflow: hidden;">
                <div style="width: 23%; height: 100%; background: #64748b;"></div>
            </div>
        </div>

        <div>
            <div style="display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: bold; margin-bottom: 3px; color: #1565c0;">
                <span>Horas Reales Auditadas (Git + IDE Sessions):</span>
                <span>434.77 hrs (100%)</span>
            </div>
            <div style="width: 100%; height: 14px; background: #e2e8f0; border-radius: 7px; overflow: hidden;">
                <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #1565c0, #0284c7);"></div>
            </div>
        </div>

        <p style="font-size: 8pt; color: #64748b; margin-top: 12px; font-style: italic;">
            *Algoritmo matemático: Clustering de sesiones continuas con ventana de inactividad de 2.5 horas y buffer de 30 min de warmup.
        </p>
    </div>

    <div style="flex: 0.9;">
        <strong style="color: #0f2c59; font-size: 9.5pt; display: block; margin-bottom: 4px;">Algoritmo Forense de Sesiones (`summarize_real_hours.py`)</strong>
        <div class="code-box">
for idx, day in enumerate(sorted(day_activity.keys())):
    timestamps = sorted(day_activity[day])
    for t in timestamps[1:]:
        if (t - curr_end).total_seconds() <= 9000: # 2.5h idle
            curr_end = t
        else:
            sessions.append((curr_start, curr_end))
            curr_start = t; curr_end = t
    # Calculo exacto de tiempo + warmup 30 min
    total_hours += sum((s[1]-s[0]).total_seconds()+1800) / 3600.0
        </div>
    </div>
</div>


<!-- =========================================================
     SLIDE 7: LIQUIDACIÓN ECONÓMICA & PROPUESTA
     ========================================================= -->
<h2>Slide 7: Liquidación Económica & Propuesta de Regularización</h2>

<table style="margin-top: 10px;">
    <thead>
        <tr>
            <th style="width: 45%;">Concepto / Entregable</th>
            <th style="width: 15%; text-align: center;">Horas</th>
            <th style="width: 15%; text-align: center;">Tarifa Unitaria</th>
            <th style="width: 15%; text-align: right;">Subtotal (USD)</th>
            <th style="width: 10%; text-align: center;">Estado</th>
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
            <td style="text-align: right; font-weight: bold;">$9,100.00</td>
            <td style="text-align: center;"><span class="badge-status badge-blue">Base Contratada</span></td>
        </tr>
        <tr>
            <td>
                <strong>Horas Adicionales Devengadas (Sobreesfuerzo)</strong><br>
                <span style="font-size: 8pt; color: #64748b;">Consultoría de Procesos, Algoritmos SPOT, Seguridad VPS & Reingeniería</span>
            </td>
            <td style="text-align: center; color: #b91c1c; font-weight: bold;">334.77 hrs</td>
            <td style="text-align: center;">$60.00</td>
            <td style="text-align: right; color: #b91c1c; font-weight: bold;">$20,086.20</td>
            <td style="text-align: center;"><span class="badge-status badge-amber">Valor Entregado</span></td>
        </tr>
        <tr style="background-color: #f0f4f8; font-weight: bold; border-top: 2px solid #0f2c59;">
            <td style="color: #0f2c59; font-size: 10.5pt;">
                VALOR TOTAL REAL ENTREGADO A NAVIERA PETRAL
            </td>
            <td style="text-align: center; font-size: 10.5pt;">484.77 hrs</td>
            <td style="text-align: center;">—</td>
            <td style="text-align: right; color: #0f2c59; font-size: 11pt;">$29,186.20</td>
            <td style="text-align: center;"><span class="badge-status badge-green">En Operación</span></td>
        </tr>
    </tbody>
</table>

<div style="display: flex; gap: 15px; margin-top: 15px;">
    <div style="flex: 1;" class="callout-box callout-blue">
        <strong style="color: #0d47a1; font-size: 10.5pt; display: block; margin-bottom: 4px;">Opción A: Paquete Cerrado de Regularización</strong>
        <span style="font-size: 9pt; color: #333;">
            Acuerdo de monto fijo cerrado para liquidar la consultoría de procesos, auditorías forenses y funcionalidades enterprise entregadas fuera del alcance inicial.
        </span>
    </div>

    <div style="flex: 1;" class="callout-box callout-green">
        <strong style="color: #1e8449; font-size: 10.5pt; display: block; margin-bottom: 4px;">Opción B: Integración con Fase Liquidaciones</strong>
        <span style="font-size: 9pt; color: #333;">
            Amortización paquetizada vinculada al Kickoff del módulo de liquidaciones reales y activación del fee mensual de mantenimiento y hosting VPS ($500/mes).
        </span>
    </div>
</div>


<!-- =========================================================
     SLIDE 8: ROADMAP INMEDIATO & PASE A PRODUCCIÓN (VPS)
     ========================================================= -->
<h2>Slide 8: Roadmap Inmediato & Pase a Producción (VPS)</h2>

<div style="display: flex; justify-content: space-between; gap: 10px; margin-top: 10px;">
    <div style="flex: 1; border: 1.5px solid #1e8449; border-radius: 8px; overflow: hidden; background: #fff;">
        <div style="background-color: #1e8449; color: white; padding: 8px 10px; font-weight: bold; font-size: 10pt; text-align: center;">
            1. Despliegue en Vivo
        </div>
        <div style="padding: 10px; font-size: 8.5pt; color: #333; text-align: center;">
            <strong>https://forecast.geeksoft.tech</strong><br>
            Plataforma 100% operativa en VPS Contabo de alto rendimiento.
        </div>
    </div>

    <div style="flex: 1; border: 1.5px solid #1565c0; border-radius: 8px; overflow: hidden; background: #fff;">
        <div style="background-color: #1565c0; color: white; padding: 8px 10px; font-weight: bold; font-size: 10pt; text-align: center;">
            2. Onboarding
        </div>
        <div style="padding: 10px; font-size: 8.5pt; color: #333; text-align: center;">
            <strong>Capacitación Operativa</strong><br>
            Sesiones con J. Neyra, F. Harten, M.E. Castro e I. Zavala.
        </div>
    </div>

    <div style="flex: 1; border: 1.5px solid #f9a825; border-radius: 8px; overflow: hidden; background: #fff;">
        <div style="background-color: #f9a825; color: white; padding: 8px 10px; font-weight: bold; font-size: 10pt; text-align: center;">
            3. Soporte Continuo
        </div>
        <div style="padding: 10px; font-size: 8.5pt; color: #333; text-align: center;">
            <strong>Fee Mensual ($500/mes)</strong><br>
            Hosting VPS Contabo, base Supabase y mantenimiento activo.
        </div>
    </div>

    <div style="flex: 1; border: 1.5px solid #6a1b9a; border-radius: 8px; overflow: hidden; background: #fff;">
        <div style="background-color: #6a1b9a; color: white; padding: 8px 10px; font-weight: bold; font-size: 10pt; text-align: center;">
            4. Liquidaciones
        </div>
        <div style="padding: 10px; font-size: 8.5pt; color: #333; text-align: center;">
            <strong>Kickoff Módulo Real</strong><br>
            Carga de viajes reales sobre la arquitectura ya construida.
        </div>
    </div>
</div>

<div class="callout-box callout-blue" style="margin-top: 20px; text-align: center;">
    <strong style="color: #0f2c59; font-size: 13pt; display: block; margin-bottom: 4px;">🚀 Sistema 100% Listo para Operación Ininterrumpida</strong>
    <span style="font-size: 10pt; color: #333;">
        El motor multicotizador y la plataforma de inteligencia comercial se encuentran auditados, sincronizados y disponibles para su uso en Naviera Petral.
    </span>
</div>

        </td></tr></tbody>
    </table>

    <!-- PIE DE PÁGINA FIJO -->
    <div class="footer-print">
        SUSTENTO DE MODIFICACIÓN DE ALCANCE &bull; NAVIERA PETRAL S.A. &bull; GEEKSOFT &bull; AGOSTO 2026
    </div>

</div>

</body>
</html>
"""

with open(output_path, "w", encoding="utf-8") as f:
    f.write(html_template)

print(f"[+] Archivo HTML actualizado exitosamente con el formato oficial de la propuesta en: {output_path}")
