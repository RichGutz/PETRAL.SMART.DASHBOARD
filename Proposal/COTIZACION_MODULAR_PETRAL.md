<style>
@page {
    size: A4 landscape !important;
    margin: 15mm 20mm !important;
}
</style>

# Propuesta Comercial Modular - Naviera Petral

**Objetivo:** Modernización integral de la gestión de Forecast Comercial (Proyectar y Cotizar)

A continuación, se detalla el esquema lógico de pricing de manera modular (paso a paso), de acuerdo a lo conversado y autorizado:

<div style="display: block; margin-top: 20px; width: 100%; font-family: sans-serif;">
    <table class="tabla-comparativa" style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 10px;">
        <thead>
            <tr style="background-color: #0f2c59; color: white;">
                <th style="padding: 10px 12px; border: 1px solid #0f2c59; font-size: 11pt; width: 20%; text-align: left;">Etapa / Paso</th>
                <th style="padding: 10px 12px; border: 1px solid #0f2c59; font-size: 11pt; width: 60%; background-color: #f1f5f9; color: #334155; text-align: left;">Descripción Detallada</th>
                <th style="padding: 10px 12px; border: 1px solid #0f2c59; font-size: 11pt; width: 20%; background-color: #e0f2fe; color: #0369a1; text-align: center;">Tarifa / Costo</th>
            </tr>
        </thead>
        <tbody>
            <tr style="background-color: #f8fafc;">
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #334155;">Paso 1: Diseño</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;"><strong>Diseño de Herramienta de Forecast:</strong> Definición de la interfaz y lógica para proyectar ventas y hacer P&L a nivel Gross Margin.<br><br><strong>Diseño de Herramienta de Cotización (Proformador SPOT):</strong> Definición de la interfaz para estructurar paquetes de viajes que maximicen la rentabilidad.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">[Ingresar Tarifa]</td>
            </tr>
            <tr style="background-color: #ffffff;">
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #334155;">Paso 2: Desarrollo</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">Construcción del software conectando la base de datos y autenticación (Supabase) con un frontend moderno y rápido (Vite + React + Tailwind CSS + Apache ECharts). Programación de la lógica matemática (incluyendo microservicios Fast API si se requieren cálculos muy avanzados) y creación de las interfaces aprobadas en el Paso 1.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">[Ingresar Tarifa]</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #334155;">Paso 3: ETL (Carga de Datos)</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;"><strong>Alcance:</strong> Carga exclusiva de la data operativa y comercial correspondiente al año <strong>2026</strong>. Proceso de Extracción, Transformación y Carga (ETL) desde los archivos Excel actuales a la nueva base de datos.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">[Ingresar Tarifa]</td>
            </tr>
            <tr style="background-color: #ffffff;">
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #334155;">Paso 4: Onboarding</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">Capacitación operativa directa a los cuatro usuarios clave definidos:<br>• Jorge Neira<br>• Marilena Castro<br>• Fernando Jarten<br>• Josef Savala</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">[Ingresar Tarifa]</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #334155;">Paso 5: Acompañamiento In Situ</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">Soporte presencial (Go-Live). Convivencia en <strong>"dos mundos"</strong> comparando los resultados del nuevo software vs. el mundo Excel para garantizar la precisión y confianza en el sistema.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">[Ingresar Tarifa]</td>
            </tr>
            <tr style="background-color: #ffffff;">
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #334155;">Paso 6: Tarifa Recurrente (Mantenimiento)</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">Suscripción mensual para asegurar la operatividad de la plataforma. Incluye:<br>• Pago de servidor en la nube (Contabo VPS)<br>• Pago de base de datos (Supabase)<br>• Labores de mantenimiento de base de datos y resolución de incidentes.</td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: center;">[Ingresar Tarifa] / mes</td>
            </tr>
        </tbody>
    </table>
</div>

<br>

**Comentarios del Consultor (Geeksoft):**
En mi experiencia implementando este tipo de transiciones de procesos legacy (herramientas basadas íntegramente en Excel) hacia ecosistemas centralizados, adoptar un enfoque modular es la estrategia más segura y con mayor tasa de éxito. Permitir que el equipo (especialmente aquellos perfiles muy habituados a sus hojas de cálculo) valide el sistema paso a paso, y tener una etapa formal de convivencia de "dos mundos" (Paso 5), reduce drásticamente la resistencia al cambio. Esto asegura que la herramienta no solo sea un avance tecnológico, sino que genere confianza plena en los números que arroja frente a los modelos tradicionales.
