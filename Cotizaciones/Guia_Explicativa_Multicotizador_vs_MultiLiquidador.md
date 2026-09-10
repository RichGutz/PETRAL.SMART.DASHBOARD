# Guía Ejecutiva: Multicotizador vs. Multi-Liquidador
### *Manual Didáctico para el Usuario Final y Dirección Comercial — Delfos / Petral*

---

## 1. El Concepto Fundamental en una Frase

> **El Multicotizador planifica y simula la ganancia esperada antes de zarpar.**  
> **El Multi-Liquidador audita y certifica la ganancia real que ingresó a caja al culminar el viaje.**

---

## 2. Tabla Comparativa de Funcionamiento

```
┌───────────────────────────┬───────────────────────────────────┬────────────────────────────────────┐
│ CARACTERÍSTICA            │ MULTICOTIZADOR (Antes del Zarpe)  │ MULTILIQUIDADOR (Post-Viaje)       │
├───────────────────────────┼───────────────────────────────────┼────────────────────────────────────┤
│ 1. Objetivo Principal     │ Fijar tarifa y cotizar rentabilidad│ Auditar ingresos y gastos reales   │
│ 2. Carga / Tonelaje       │ Teórico / Nominal (ej. 14,250 TM) │ Oficial en Bill of Lading (B/L)    │
│ 3. Duración del Viaje     │ Días teóricos calculados por carta│ Días reales cronometrados          │
│ 4. Consumo de Búnker      │ Días × Consumo Diario Estimado    │ Sonda Inicial − Sonda Final (ROBs) │
│ 5. Evento de Shifting     │ No contemplado                    │ Registra cobro extra y demoras     │
│ 6. Costos Portuarios      │ Proforma estándar de agencia (PDA)│ Facturación final de agencia (FDA) │
│ 7. Resultado Financiero   │ P&L Teórico / Margen Proforma     │ P&L Real en Caja / Margen Auditado │
└───────────────────────────┴───────────────────────────────────┴────────────────────────────────────┘
```

---

## 3. ¿Cómo funciona el Multicotizador (Paso a Paso)?

1. **Selección de Buque y Ruta:**  
   Se eligen las características del barco (velocidad, consumo diario) y los puertos de origen y destino (distancia en millas náuticas).
2. **Cálculo de Tiempos Teóricos:**  
   $$\text{Días Mar} = \frac{\text{Millas Náuticas} \times 1.03}{\text{Velocidad (kts)} \times 24\,\text{h}}$$  
   $$\text{Días Puerto} = \frac{\text{Carga}}{\text{Ritmo Carga}\times 24} + \frac{\text{Carga}}{\text{Ritmo Descarga}\times 24} + \text{Esperas}$$
3. **Consumo de Combustible:**  
   Se multiplican los días de mar por el consumo del motor principal ($12\,\text{t/d IFO}$) y los días de puerto por generadores auxiliares ($1.5\,\text{t/d MDO}$).
4. **Cotización Proforma:**  
   El sistema arroja el **P&L Teórico**, el **Margen %** y la tarifa mínima requerida para cumplir el *TCE Target* del armador.

---

## 4. ¿Cómo va a funcionar el Multi-Liquidador (Paso a Paso)?

1. **Identificación Oficial:**  
   Se ingresa el número correlativo del viaje (ej: `DM-2026-042`), el buque (`DON MOQUEGUA`), el cliente y la fecha oficial del **B/L**.
2. **Registro de Combustible Real por Sondas (ROBs):**  
   En lugar de fórmulas estimadas, el usuario ingresa cuánto combustible había en los tanques al zarpar y cuánto quedó al atracar:
   $$\text{Consumo IFO} = \text{Sonda Inicial (ROB)} - \text{Sonda Final (ROB)}$$
   $$\text{Consumo MDO} = \text{Sonda Inicial (ROB)} - \text{Sonda Final (ROB)}$$
3. **Gestión de Eventos de Shifting:**  
   Si la autoridad portuaria mandó el barco a la bahía para que entre otro barco más importante:
   - Se anota la **Compensación Cobrada** ($\text{Shifting Revenue} = +\$4,500.00$).
   - Se suman las **Horas de Demora** ($+14.5\,\text{h}$).
   - Se computa el **Búnker extra** consumido durante la maniobra.
4. **Liquidación Final Auditada:**  
   $$\text{Gross Revenue Real} = (\text{Toneladas B/L} \times \text{Tarifa}) + \text{Shifting} \pm \text{Demurrage}$$
   $$\text{P\&L Real Auditado} = \text{Gross Revenue} - \text{Búnker Real} - \text{Puerto FDA} - (\text{Días Reales} \times \text{OPEX})$$

---

## 5. El Dashboard Comparativo Macro (Forecast vs. Real)

Todos los viajes liquidados se acumulan en la **Matriz de Ejecución**. El sistema los compara mes a mes contra el **Forecast Comercial** sobre **5 Indicadores Clave**:

1. **Venta Total ($):** ¿Se facturó más o menos de lo presupuestado? ($\Delta\%$).
2. **Toneladas (TM):** ¿Los clientes cargaron el volumen prometido? ($\Delta\%$).
3. **P&L Neto ($):** ¿La utilidad real superó la proforma? ($\Delta\%$).
4. **Margen Operativo (%):** ¿Qué tan rentable fue la operación real? ($\Delta\text{pp}$).
5. **Días Ocupados (d):** ¿La flota estuvo más tiempo navegando o demorada? ($\Delta\text{d}$).
