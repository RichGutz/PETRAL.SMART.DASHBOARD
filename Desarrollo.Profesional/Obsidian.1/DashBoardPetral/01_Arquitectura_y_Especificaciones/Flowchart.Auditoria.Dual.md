# 🔍 Flowchart: Herramienta de Auditoría Dual P×Q
> **Herramienta**: Auditoría Naviera Dual P×Q — Split-View PDF Comparativo
> **Script**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts\FLOWCHART_AUDITORIA_DUAL.py`
> **SVG**: `Geeksoft_Frontend/public/FLOWCHART_AUDITORIA_DUAL.svg`
> **Visor Web**: Herramientas ➔ 🗺️ Flowchart del Sistema ➔ Tab "Auditoría Dual P×Q"

---

## 🎯 Propósito

La **Herramienta de Auditoría Dual P×Q** permite comparar sistemáticamente los costos facturados por el armador y el agente portuario contra los valores calculados teóricamente por el sistema PETRAL. El objetivo es detectar discrepancias y emitir objecciones documentadas cuando corresponda.

---

## 📐 La Lógica P×Q

El nombre **"Dual P×Q"** refleja los dos ejes de validación:

| Eje | Variable | Fuente Sistema | Fuente Factura |
|---|---|---|---|
| **P** (Precio) | Precio VLSFO/LSMGO (USD/MT) | Maestro Precios Bunker | Factura Armador |
| **Q** (Cantidad) | Consumo MT × Días | Spot Calculator | SOF del Armador |
| **G** (Gastos) | Costos Portuarios | Motor Dedicado × Puerto | Cuenta Agente |

---

## 🔄 Flujo de la Auditoría

### INPUTS: Documentos a Auditar
1. **📄 PDF Armador** — Factura/Statement of Facts (SOF) con desglose de bunkers y tiempos
2. **📄 PDF Agente Portuario** — Cuenta de Gastos por puerto (carga y/o descarga)

### Herramienta Split-View
El visor carga ambos PDFs simultáneamente en dos paneles:
- Panel Izquierdo: PDF Armador
- Panel Derecho: PDF Agente
- Funciones: zoom, scroll sincronizado, navegación por páginas

### Valores Calculados por el Sistema
En paralelo, el sistema recupera los valores teóricos:
- ⚙️ **P calculado**: Precio bunker del Maestro en la fecha del viaje
- 📐 **Q calculado**: Consumo teórico según velocidad y días de navegación
- 🏭 **Gastos portuarios calculados**: Motor dedicado del puerto correspondiente

### Comparación Δ (Delta)

```
Δ BUNKER = P_factura × Q_factura  −  P_sistema × Q_sistema
Δ PUERTOS = Gastos_factura − Gastos_sistema
Δ TOTAL  = Δ Bunker + Δ Puertos
```

Cada delta se expresa en **USD absolutos** y en **% sobre el total calculado**.

### Resolución

| Resultado | Acción |
|---|---|
| ✅ Δ dentro de tolerancia | Factura aprobada |
| ⚠️ Δ supera tolerancia | Objeción — solicitar Nota de Crédito al armador/agente |

### Salida: Acta de Auditoría PDF
Documento exportable que incluye:
- Encabezado con Buque, Ruta, Fechas
- Tabla comparativa ítem por ítem
- Δ calculado por concepto
- Conclusión (Aprobado / Objetado)
- Sección de firma

---

## ⚡ Casos de Uso Reales

1. **Bunker consumido vs. facturado**: El armador factura 450 MT pero el sistema calcula 410 MT → Δ = 40 MT × $620/MT = **$24,800 USD de sobrecargo**
2. **Practicaje fuera de tarifa**: El agente cobra $15,000 pero el motor Callao calcula $11,200 → **Objeción de $3,800 USD**
3. **Días en puerto excesivos**: SOF indica 3.5 días vs. 2.1 días calculados → impacto en cargo de demurrage

---

## 📁 Archivos Relacionados
- **Script flowchart**: [FLOWCHART_AUDITORIA_DUAL.py](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Boiler.Plate/Flow.Charts/FLOWCHART_AUDITORIA_DUAL.py)
- **Componente SW**: `src/pages/Tools/` (visor PDF)
- **Lógica de motores**: [[Logica.Serial.Universal.de.Costos]]
- **Anterior**: [[Flowchart.Matriz.Financiera]]
- **Inicio cadena**: [[Flowchart.Multicotizador]]
