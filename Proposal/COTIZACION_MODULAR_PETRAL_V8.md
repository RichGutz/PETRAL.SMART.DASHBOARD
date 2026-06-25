<style>
@page {
    size: A4 landscape !important;
    margin: 23mm 15mm 20mm 15mm !important;
}
.header-print {
    position: fixed;
    top: -18mm;
    right: 0;
    text-align: right;
    z-index: 100;
}
.header-print img {
    height: 80px;
}
.footer-print {
    position: fixed;
    bottom: -15mm;
    left: 0;
    right: 0;
    font-family: sans-serif;
    font-size: 10pt;
    color: #555;
    text-align: center;
    border-top: 1px solid #000;
    padding-top: 5px;
    z-index: 100;
}
h2 {
    font-family: sans-serif;
    color: #0f2c59;
}
.tabla-comparativa {
    width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 10px; font-family: sans-serif;
}
.tabla-comparativa th {
    padding: 6px 8px; border: 1px solid #0f2c59; font-size: 11pt; background-color: #0f2c59; color: white;
}
.tabla-comparativa td {
    padding: 6px 8px; border: 1px solid #cbd5e1; line-height: 1.3;
}
.col-etapa { width: 6%; text-align: left; }
.col-desc { width: 45%; text-align: left; }
.col-comentarios { width: 26%; text-align: left; }
.col-tarifa { width: 9%; text-align: center; }
.col-horas { width: 4%; text-align: center; }
.col-total { width: 10%; text-align: center; }
</style>

<div class="header-print"><img src="file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Boiler.Plate/PPTS.HERMOSAS/logo_final_v3.png"></div>
<div class="footer-print">PROPUESTA COMERCIAL | NAVIERA PETRAL | GEEKSOFT | JUNIO 2026</div>

<div style="page-break-after: always; padding-top: 2px;">
    <h2 style="margin-top: 0; font-size: 14pt; margin-bottom: 5px;">Inversión Única (One-Timers) - Parte 1</h2>
    <table class="tabla-comparativa">
        <colgroup>
            <col style="width: 6%;">
            <col style="width: 45%;">
            <col style="width: 26%;">
            <col style="width: 9%;">
            <col style="width: 4%;">
            <col style="width: 10%;">
        </colgroup>
        <thead>
            <tr>
                <th class="col-etapa">Etapa</th>
                <th class="col-desc">Descripción</th>
                <th class="col-comentarios">Comentarios</th>
                <th class="col-tarifa">Tarifa<br>USD/hr</th>
                <th class="col-horas">Hrs</th>
                <th class="col-total">Total sin IGV</th>
            </tr>
        </thead>
        <tbody>
            <tr style="background-color: rgba(15, 44, 89, 0.05);">
                <td style="font-weight: bold; color: #334155;">1: Diseño</td>
                <td style="color: #475569;"><strong>Diseño de Herramienta de Forecast:</strong> Definición de la interfaz y lógica para proyectar ventas y hacer P&L a nivel Gross Margin.<br><br><strong>Diseño de Herramienta de Cotización (Proformador SPOT):</strong> Definición de la interfaz para estructurar paquetes de viajes que maximicen la rentabilidad.</td>
                <td style="color: #475569;">Las siguientes etapas requerirán un costo adicional de diseño para MEDIR & MEJORAR.</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">100</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">10</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">1,000</td>
            </tr>
            <tr style="background-color: #ffffff;">
                <td style="font-weight: bold; color: #334155;">2: Desarrollo</td>
                <td style="color: #475569;"><strong>Stack Tecnológico:</strong> Construcción del software conectando la base de datos (Supabase) con un frontend rápido (Vite + React + Tailwind + ECharts).<br><br><strong>Lógica Matemática:</strong> Programación de algoritmos y APIs para cálculos avanzados y creación de pantallas.</td>
                <td style="color: #475569;">Si se toman la siguientes etapas se requerirán nuevos desarrollos.<br><br>Se incluye la lógica central para futuros desarrollos y 3 reportes gráficos a elección del cliente.</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">50</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">90</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">4,500</td>
            </tr>
        </tbody>
    </table>
</div>

<div style="page-break-after: always; padding-top: 2px;">
    <h2 style="margin-top: 0; font-size: 14pt; margin-bottom: 5px;">Inversión Única (One-Timers) - Parte 2</h2>
    <table class="tabla-comparativa">
        <colgroup>
            <col style="width: 6%;">
            <col style="width: 45%;">
            <col style="width: 26%;">
            <col style="width: 9%;">
            <col style="width: 4%;">
            <col style="width: 10%;">
        </colgroup>
        <thead>
            <tr>
                <th class="col-etapa">Etapa</th>
                <th class="col-desc">Descripción</th>
                <th class="col-comentarios">Comentarios</th>
                <th class="col-tarifa">Tarifa<br>USD/hr</th>
                <th class="col-horas">Hrs</th>
                <th class="col-total">Total sin IGV</th>
            </tr>
        </thead>
        <tbody>
            <tr style="background-color: rgba(15, 44, 89, 0.05);">
                <td style="font-weight: bold; color: #334155;">3: ETL (Carga)</td>
                <td style="color: #475569;"><strong>Alcance de Carga:</strong> Integración exclusiva de la data operativa y comercial del año 2026.<br><br><strong>Proceso ETL:</strong> Extracción, Transformación y Carga desde los archivos Excel actuales a Supabase.</td>
                <td style="color: #475569;">Solo se cargarán los meses transcurridos del año 2026.</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">50</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">10</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">500</td>
            </tr>
            <tr style="background-color: #ffffff;">
                <td style="font-weight: bold; color: #334155;">4: Onboarding</td>
                <td style="color: #475569;"><strong>Entrenamiento Operativo:</strong> Capacitación directa a los usuarios en el uso de la nueva plataforma web.<br><br><strong>Usuarios Clave:</strong><br>• Jorge Neyra<br>• Maria Elena Castro<br>• Fernando Harten<br>• Iosef Zavala</td>
                <td style="color: #475569;">El onboarding será en su mayoría presencial a elección del cliente.</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">50</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">10</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">500</td>
            </tr>
            <tr style="background-color: rgba(15, 44, 89, 0.05);">
                <td style="font-weight: bold; color: #334155;">5: In Situ</td>
                <td style="color: #475569;"><strong>Soporte Presencial (Go-Live):</strong> Acompañamiento directo en la oficina operando la plataforma real.<br><br><strong>Convivencia "Dos Mundos":</strong> Comparación en paralelo de los resultados del nuevo software vs. el Excel actual.</td>
                <td style="color: #475569;">Se conciliará los resultados de EXCEL sean convergentes con los del sistema y asistirá a los usuarios hasta que no hayan inconsistencias ni BUGS.</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">50</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">10</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">500</td>
            </tr>
            <tr style="background-color: #0f2c59; color: white;">
                <td colspan="5" style="border: 1px solid #0f2c59; font-weight: bold; text-align: right; font-size: 13pt;">TOTAL INVERSIÓN (Sin IGV):</td>
                <td style="border: 1px solid #0f2c59; font-weight: bold; text-align: center; font-size: 13pt;">$ 7,000</td>
            </tr>
        </tbody>
    </table>
</div>

<div style="padding-top: 2px;">
    <h2 style="margin-top: 0; font-size: 14pt; margin-bottom: 5px;">Costos Recurrentes (Operatividad)</h2>
    <table class="tabla-comparativa">
        <colgroup>
            <col style="width: 6%;">
            <col style="width: 45%;">
            <col style="width: 26%;">
            <col style="width: 9%;">
            <col style="width: 4%;">
            <col style="width: 10%;">
        </colgroup>
        <thead>
            <tr>
                <th class="col-etapa">Etapa</th>
                <th class="col-desc">Descripción</th>
                <th class="col-comentarios">Comentarios</th>
                <th class="col-tarifa">Suscripción</th>
                <th class="col-horas">Hrs</th>
                <th class="col-total">Total Mensual</th>
            </tr>
        </thead>
        <tbody>
            <tr style="background-color: #ffffff;">
                <td style="font-weight: bold; color: #334155;">6: Tarifa Mensual de Mantenimiento</td>
                <td style="color: #475569;"><strong>Suscripción Mensual:</strong> Asegura la operatividad de la plataforma 24/7.<br><br><strong>Cobertura:</strong> Pago de servidor en la nube (Contabo), base de datos (Supabase) y labores de soporte evolutivo.</td>
                <td style="color: #475569;">Geeksoft paga directamente los costos asociados a la base de datos y el servidor.<br><br>No incluye nuevos desarrollos.</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">N/A</td>
                <td style="font-weight: bold; color: #475569; text-align: center;">N/A</td>
                <td style="font-weight: bold; color: #475569; text-align: center; font-size: 12pt; color: #0f2c59;">$ 500</td>
            </tr>
        </tbody>
    </table>
    
    <br>

    **Comentarios del Consultor (Geeksoft):**
    En mi experiencia implementando este tipo de transiciones de procesos legacy (herramientas basadas íntegramente en Excel) hacia ecosistemas centralizados, adoptar un enfoque modular es la estrategia más segura y con mayor tasa de éxito. Permitir que el equipo (especialmente aquellos perfiles muy habituados a sus hojas de cálculo) valide el sistema paso a paso, y tener una etapa formal de convivencia de "dos mundos", reduce drásticamente la resistencia al cambio. Esto asegura que la herramienta no solo sea un avance tecnológico, sino que genere confianza plena en los números que arroja frente a los modelos tradicionales.
</div>
