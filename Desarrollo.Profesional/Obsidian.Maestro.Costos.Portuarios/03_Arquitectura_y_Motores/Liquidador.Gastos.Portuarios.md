# 🔍 Liquidador de Gastos Portuarios (Auditoría Dual P×Q)

> **Ubicación en Bóveda**: `Obsidian.Maestro.Costos.Portuarios/03_Arquitectura_y_Motores/Liquidador.Gastos.Portuarios.md`  
> **Componente Frontend**: `Geeksoft_Frontend/src/pages/Tools/PortCostsLiquidador.tsx`  
> **Propósito**: Herramienta especializada en la conciliación, liquidación y auditoría de facturas reales expedidas por armadores y agentes portuarios contra la proforma P×Q calculada por el sistema PETRAL.

---

## 🎯 1. Concepto y Posición en la Suite

El **Liquidador de Gastos Portuarios** preserva e integra la matriz compleja de liquidación previa en una interfaz dedicada de tipo **Split-View**:

```
┌──────────────────────────────────────────────┬──────────────────────────────────────────────┐
│ 📄 PANEL IZQUIERDO: PDF FACTURA REAL         │ 📊 PANEL DERECHO: MATRIZ P×Q RECALCULADA     │
│   • Factura Armador / SOF del Viaje          │   • Tarifas base calculadas por el sistema   │
│   • Cuenta de Gastos del Agente Portuario    │   • Indicador de Nivel ([BAJO] vs [ALTO])    │
└──────────────────────────────────────────────┴──────────────────────────────────────────────┘
```

---

## 📐 2. Lógica de Cotejo Dual (Divergencias Δ)

La herramienta calcula en tiempo real tres indicadores de desviación ($\Delta$):

$$\Delta \text{Bunker} = (P_{\text{factura}} \times Q_{\text{factura}}) - (P_{\text{sistema}} \times Q_{\text{sistema}})$$

$$\Delta \text{Puertos} = \text{Gastos}_{\text{factura}} - \text{Gastos}_{\text{sistema}}$$

$$\Delta \text{Total P&L} = \Delta \text{Bunker} + \Delta \text{Puertos}$$

---

## 📄 3. Titulación de Actas de Auditoría en PDF

Cada acta exportada por la herramienta incluye la denominación formal del nivel simulado:

- `ACTA AUDITORÍA PUERTO DE CARGA — CALLAO APM [NIVEL BAJO - HORARIO ORDINARIO] — $14,938.34 USD`
- `ACTA AUDITORÍA PUERTO DE CARGA — CALLAO APM [NIVEL ALTO - HORARIO RECARGO] — $19,420.50 USD`

---

## ⚖️ 4. Veredicto de Auditoría
- **✅ Aprobado**: Si la diferencia ($\Delta$) se encuentra dentro de la tolerancia contractual permitida.
- **⚠️ Objeción**: Si la diferencia ($\Delta$) supera el umbral de tolerancia, generando una nota de objeción con desglose para solicitar Nota de Crédito.
