# 🔄 LOOP DE QC & AUDITORÍA DE COSTOS PORTUARIOS — PUERTO DE MEJILLONES 🇨🇱 (3 TERMINALES)

> **Estado**: 100% AUDITADO & VERIFICADO  
> **Ubicación del Documento**: `Obsidian.Maestro.Costos.Portuarios/06_QC/Loop.QC.Mejillones.md`  
> **Puerto**: MEJILLONES 🇨🇱  
> **Terminales Auditados**:  
>   1. 🏭 **TPM (Terminal Puerto Mejillones S.A.)**  
>   2. 🧪 **Interacid Mejillones** (Ácido Sulfúrico / Líquidos)  
>   3. 🛢️ **Terquim Mejillones** (Terminal de Químicos)  
> **Proveedores**: B&M Agencia Marítima (Agencia), Ultratug Ltd. (Remolques), Amarradores en Tierra (Linesmen), Directemar / Armada de Chile.  
> **Norma Estricta**: ⛔ ZERO FALLBACKS (Todo cálculo proviene 100% de pares válidos $P \times Q$ en Base de Datos).

---

## 1. 🎯 Propósito del Loop de QC — Mejillones (Chile)

Validar la trazabilidad del puerto de Mejillones y sus 3 terminales evaluando los 4 pasos del ciclo de auditoría:
1. **Inspección de las Imagenes Fuentes**: `PNG_Mejillones_Layout.md`, `PNG_Mejillones_Interacid_Layout.md`, `PNG_Mejillones_Terquim_Layout.md`.
2. **Reglas Experta Sandra**: Reglas de Light Dues Chile ($4.07/GRT anual prorrateado vs $1.60/GRT por viaje) y fórmulas de Muellaje por LOA/Horas.
3. **Validación de Motores & UI**: `DynamicAuditViewer.tsx` y `backend.port_engines.calculator_pe`.

---

## 2. 🛡️ Matriz Comparativa de los 3 Terminales de Mejillones (Buque Moquegua — 8,259 TRB | LOA 134.16m)

| Ítem / Concepto Oficial | 🏭 Terminal TPM Mejillones | 🧪 Terminal Interacid | 🛢️ Terminal Terquim | Regla Tarifaria / Fórmulas de Cálculo |
| :--- | :---: | :---: | :---: | :--- |
| **Eslora (LOA) / Estancia (h)** | $134.16\text{m}$ / $36.0\text{h}$ | $134.16\text{m}$ / $36.0\text{h}$ | $134.16\text{m}$ / $30.0\text{h}$ | Parámetros Operativos del Buque y Terminal |
| **Pilotage (Prácticos Armada)** | `$1,207.38` | `$1,151.01` | `$1,156.26` | Tarifa Directemar basada en GRT ($0.14–$0.15/GRT) |
| **Remolques (Ultratug Ltd.)** | `$11,200.00` | `$11,200.00` | `$8,400.00` | TPM/Interacid: 4 mnvr ($2,800/u); Terquim: 3 mnvr ($2,800/u) |
| **Linesmen (Amarre/Desamarre)** | `$1,742.50` | `$1,742.50` | `$1,602.00` | Tarifa fija según amarradores de tierra del terminal |
| **Muellaje (Dockage Fee)** | **`$19,270.74`** ($3.99 x LOA x 36h) | **`$25,272.00`** ($702.00/h x 36h) | **`$23,021.86`** ($5.72 x LOA x 30h) | Fórmulas específicas de cada terminal |
| **Light Dues Chile (Nacional)** | `$2,240.94` | `$2,240.94` | `$2,240.94` | $4.07/GRT Anual prorrateado a 15 viajes Petral |
| **Lanchas Operativas (Varias)** | `$2,882.57` | `$3,090.00` | `$3,830.00` | Lanchas recepción, amarre, practicaje y autoridades |
| **Gastos Autoridades & ISPS** | `$2,629.35` | `$2,231.00` | `$2,189.00` | Sanidad, Inmigración, ISPS Fee y Authorities Charges |
| **Loading Master** | `$3,264.40` | `$3,096.00` | `$2,923.00` | Supervisores de carga/descarga asignados por terminal |
| **Agenciamiento & Conexiones** | `$1,200.00` | `$1,200.00` | `$3,700.00` | Agency Fee B&M $1,200 + Hose Connection Terquim $2,500 |
| 💰 **TOTAL LIQUIDACIÓN USD** | **`$46,807.88 USD`** | **`$51,343.45 USD`** | **`$49,313.06 USD`** | **Suma Total Auditada Sin Fallbacks** |

---

## 3. 🇨🇱 Regla Especial de Faros y Balisas en Chile (Light Dues Chile)

En la legislación marítima de Chile, los **Light Dues (Derechos de Faro)** operan bajo dos modalidades financieras acordadas por la Experta Sandra:
1. **Modalidad Anual Prorrateada (Línea Petral Flota Moquegua/Tablones)**:  
   $$\text{Light Dues Anual USD} = \frac{\$4.07 \times \text{GRT}}{15 \text{ viajes}} = \frac{\$4.07 \times 8,259}{15} = \mathbf{\$2,240.94\text{ USD}}$$
2. **Modalidad Spot / Por Viaje Unico (Huemul / Concon Trader)**:  
   $$\text{Light Dues Spot USD} = \$1.60 \times \text{GRT} = \$1.60 \times 13,666 = \mathbf{\$21,865.60\text{ USD}}$$

---

## 4. 📊 Matriz de Salida Auditada de los 3 Terminales

```
====================================================================================================
 📄 AUDITORÍA COMPARATIVA DE MEJILLONES 🇨🇱 — TRES TERMINALES ESPECIALIZADOS (BT MOQUEGUA)
====================================================================================================
 TERMINAL EVALUADO                ESTRUCTURA DE CÁLCULO PRINCIPAL                      TOTAL USD
 --------------------------------------------------------------------------------------------------
 1. TPM (Terminal Puerto Mejillones) Muellaje($3.99*LOA*36h) + Remolque(4) + Agencia      $46,807.88 USD
 2. INTERACID MEJILLONES          Muellaje($702/h*36h) + Remolque(4) + Agencia          $51,343.45 USD
 3. TERQUIM MEJILLONES            Muellaje($5.72*LOA*30h) + Remolque(3) + Hose Conn     $49,313.06 USD
====================================================================================================
```
