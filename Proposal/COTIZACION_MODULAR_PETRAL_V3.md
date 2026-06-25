<style>
@page {
    size: A4 landscape !important;
    margin: 25mm 20mm 20mm 20mm !important;
}
.header-print {
    position: fixed;
    top: -15mm;
    right: 0;
    text-align: right;
    z-index: 100;
}
.header-print img {
    height: 80px;
}
.footer-print {
    position: fixed;
    bottom: -10mm;
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
</style>

<div class="header-print"><img src="file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Boiler.Plate/PPTS.HERMOSAS/logo_final_v3.png"></div>
<div class="footer-print">PROPUESTA COMERCIAL | NAVIERA PETRAL | GEEKSOFT | JUNIO 2026</div>

# Propuesta Comercial Modular - Naviera Petral (Versión 3)

**Objetivo:** Modernización integral de la gestión de Forecast Comercial (Proyectar y Cotizar)

A continuación, se detalla el esquema lógico de pricing de manera modular, de acuerdo a lo conversado y autorizado:

<div style="display: block; margin-top: 20px; width: 100%; font-family: sans-serif;">
    <table class="tabla-comparativa" style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 10px;">
        <thead>
            <tr style="background-color: #0f2c59; color: white;">
                <th style="padding: 10px 12px; border: 1px solid #0f2c59; font-size: 11pt; width: 8%; text-align: left;">Etapa</th>
                <th style="padding: 10px 12px; border: 1px solid #0f2c59; font-size: 11pt; width: 37%; text-align: left;">Descripción</th>
                <th style="padding: 10px 12px; border: 1px solid #0f2c59; font-size: 11pt; width: 15%; text-align: left;">Comentarios</th>
                <th style="padding: 10px 12px; border: 1px solid #0f2c59; font-size: 11pt; width: 15%; text-align: center;">Tarifa (USD/hr)</th>
                <th style="padding: 10px 12px; border: 1px solid #0f2c59; font-size: 11pt; width: 10%; text-align: center;">Horas</th>
                <th style="padding: 10px 12px; border: 1px solid #0f2c59; font-size: 11pt; width: 15%; text-align: center;">Total sin IGV</th>
            </tr>
        </thead>
        <tbody>
            <tr style="background-color: rgba(15, 44, 89, 0.05);">
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #334155;">1: Diseño</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;"><strong>Diseño de Herramienta de Forecast:</strong> Definición de la interfaz y lógica para proyectar ventas y hacer P&L a nivel Gross Margin.<br><br><strong>Diseño de Herramienta de Cotización (Proformador SPOT):</strong> Definición de la interfaz para estructurar paquetes de viajes que maximicen la rentabilidad.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">Las siguientes etapas requerirán un costo adicional de diseño para MEDIR & MEJORAR.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">125</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">10</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">1,250</td>
            </tr>
            <tr style="background-color: #ffffff;">
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #334155;">2: Desarrollo</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;"><strong>Stack Tecnológico:</strong> Construcción del software conectando la base de datos (Supabase) con un frontend rápido (Vite + React + Tailwind + ECharts).<br><br><strong>Lógica Matemática:</strong> Programación de algoritmos y APIs para cálculos avanzados y creación de pantallas.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">Si se toman la siguientes etapas se requerirán nuevos desarrollos.<br><br>Se incluye la lógica central para futuros desarrollos y 3 reportes gráficos a elección del cliente.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">50</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">80</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">4,000</td>
            </tr>
            <tr style="background-color: rgba(15, 44, 89, 0.05);">
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #334155;">3: ETL (Carga)</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;"><strong>Alcance de Carga:</strong> Integración exclusiva de la data operativa y comercial del año 2026.<br><br><strong>Proceso ETL:</strong> Extracción, Transformación y Carga desde los archivos Excel actuales a Supabase.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">Solo se cargarán los meses transcurridos del año 2026.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">50</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">10</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">500</td>
            </tr>
            <tr style="background-color: #ffffff;">
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #334155;">4: Onboarding</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;"><strong>Entrenamiento Operativo:</strong> Capacitación directa a los usuarios en el uso de la nueva plataforma web.<br><br><strong>Usuarios Clave:</strong><br>• Jorge Neyra<br>• Maria Elena Castro<br>• Fernando Harten<br>• Iosef Zavala</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">El onboarding será en su mayoría presencial a elección del cliente.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">50</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">10</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">500</td>
            </tr>
            <tr style="background-color: rgba(15, 44, 89, 0.05);">
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #334155;">5: In Situ</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;"><strong>Soporte Presencial (Go-Live):</strong> Acompañamiento directo en la oficina operando la plataforma real.<br><br><strong>Convivencia "Dos Mundos":</strong> Comparación en paralelo de los resultados del nuevo software vs. el Excel actual.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">Se conciliará los resultados de EXCEL sean convergentes con los del sistema y asistirá a los usuarios hasta que no hayan inconsistencias ni BUGS.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">50</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">10</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">500</td>
            </tr>
            <tr style="background-color: #ffffff;">
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #334155;">6: Tarifa Mensual de Mantenimiento de la Herramienta</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;"><strong>Suscripción Mensual:</strong> Asegura la operatividad de la plataforma 24/7.<br><br><strong>Cobertura:</strong> Pago de servidor en la nube (Contabo), base de datos (Supabase) y labores de soporte evolutivo.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">Geeksoft paga directamente los costos asociados a la base de datos y el servidor.<br><br>No incluye nuevos desarrollos.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">N/A</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">N/A</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">500</td>
            </tr>
            <tr style="background-color: #0f2c59; color: white;">
                <td colspan="5" style="padding: 12px; border: 1px solid #0f2c59; font-weight: bold; text-align: right;">TOTAL ESTIMADO (Sin IGV):</td>
                <td style="padding: 12px; border: 1px solid #0f2c59; font-weight: bold; text-align: center;">$ 7,250</td>
            </tr>
        </tbody>
    </table>
</div>

<br>

**Comentarios del Consultor (Geeksoft):**
En mi experiencia implementando este tipo de transiciones de procesos legacy (herramientas basadas íntegramente en Excel) hacia ecosistemas centralizados, adoptar un enfoque modular es la estrategia más segura y con mayor tasa de éxito. Permitir que el equipo (especialmente aquellos perfiles muy habituados a sus hojas de cálculo) valide el sistema paso a paso, y tener una etapa formal de convivencia de "dos mundos", reduce drásticamente la resistencia al cambio. Esto asegura que la herramienta no solo sea un avance tecnológico, sino que genere confianza plena en los números que arroja frente a los modelos tradicionales.
