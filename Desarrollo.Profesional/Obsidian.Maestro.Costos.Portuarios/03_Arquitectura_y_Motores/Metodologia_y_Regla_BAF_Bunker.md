# Metodología y Reglas de Cálculo del Ajuste BAF (Bunker Adjustment Factor)

**Buque Tanque:** B/T Moquegua  
**Módulo:** Maestro de Contratos & Tarificador Comercial PETRAL  
**Fuente Autorizada:** `Ajuste bunker - 1.07.2026.xlsx` (Hojas `Formula-Ajuste Bunker`, `NUEVAS TARIFAS`, `TCE - PL`)  
**Destinatario:** Agente Comercial / Operaciones / Facturación / Finanzas  

---

## 1. Resumen Ejecutivo y Objetivo
El presente documento detalla la metodología analítica, matemática y contractual empleada en el sistema PETRAL para determinar el **Nuevo BAF Ajustado** y la **Delta Tarifaria Net ($\Delta$)** a facturar por tonelada.

El objetivo de este mecanismo de indexación es trasladar de manera transparente y paramétrica las variaciones del mercado internacional de combustibles marinos (IFO 380 VLSFO y MDO Diesel / MGO) a la tarifa de flete, **adicionando o deduciendo de forma directa el delta de combustible sobre cada tramo de la estructura tarifaria base**.

---

## 2. Conceptos Clave y Definiciones Operativas

- **ROB (Remaining on Board):** Volumen de combustible remanente en los tanques de la nave previo a una nueva operación de bunkering.
- **PMT (Per Metric Ton):** Tonelada métrica. Unidad estándar sobre la cual se estructuran las tarifas de flete y los recargos.
- **IFO 380 Bajo Azufre (VLSFO):** Combustible residual pesado de propulsión oceánica.
- **MDO Diesel (Marine Diesel Oil / MGO):** Combustible destilado ligero. En PETRAL, **MGO = MDO**.
- **Periodo N−1:** Ciclo tarifario anterior (Línea base del contrato).
- **Periodo N:** Ciclo tarifario actual objeto de cálculo (Precios del último bunker registrado).

---

## 3. Metodología de Cálculo Paso a Paso (Fórmulas Excel Oficiales)

### Paso A: Precios Promedio Ponderados por Inventario (N)
$$\text{Precio Promedio Ponderado} = \frac{(\text{ROB}_{\text{qty}} \times \text{Precio}_{\text{ROB}}) + (\text{Compra}_{\text{qty}} \times \text{Precio}_{\text{Compra}})}{\text{ROB}_{\text{qty}} + \text{Compra}_{\text{qty}}}$$

---

### Paso B: Factor de Ajuste Polinómico ($fa$)
Basado en los coeficientes fijos de consumo contractuales del B/T Moquegua (**38.40 IFO** y **9.50 MDO**):

$$fa = 1 + \frac{(\text{IFO}_N \times 38.40 + \text{MDO}_N \times 9.50) - (\text{IFO}_{N-1} \times 38.40 + \text{MDO}_{N-1} \times 9.50)}{\text{IFO}_{N-1} \times 38.40 + \text{MDO}_{N-1} \times 9.50}$$

*Fórmula Excel Celda `D16`: `=ROUNDUP(1+(((C12*38.4+C13*9.5)-(C10*38.4+C11*9.5))/(C10*38.4+C11*9.5)),4)`*

---

### Paso C: Cálculo del Nuevo BAF y la Delta Neta ($\Delta \text{ PMT}$)

1. **Valor Combustible Inicial ($C_{\text{base}}$):** Componente base de combustible pactado en contrato (ej. **$2.86 USD/PMT**).
2. **Nuevo BAF Ajustado:**
   $$\text{Nuevo BAF} = C_{\text{base}} \times fa$$
3. **Variación Net USD/PMT ($\Delta \text{ BAF}$):**
   $$\Delta \text{ BAF} = \text{Nuevo BAF} - C_{\text{base}}$$

*Fórmula Excel Celda `C34`: `=SUM(C32-C33)`*

---

### Paso D: Aplicación a las Tarifas por Tramo (Tiers)
La variación del precio ($\Delta \text{ BAF}$) **se SUMA o RESTA DIRECTAMENTE sobre la tarifa base de cada tramo**:

$$\text{Flete Final Ajustado Tramo}_i = \text{Tarifa Base Tramo}_i + \Delta \text{ BAF}$$

---

## 4. Ejemplo Técnico de Aplicación Real (`Ajuste bunker - 1.07.2026.xlsx`)

### 1. Inputs:
- $\text{Baseline IFO} = \$655.28 / \text{MT} \quad | \quad \text{Baseline MDO} = \$1,083.84 / \text{MT}$
- $\text{Actual IFO} = \$895.14 / \text{MT} \quad | \quad \text{Actual MDO} = \$1,460.30 / \text{MT}$
- $\text{Componente BAF Inicial} = \$2.86 / \text{PMT}$

### 2. Resultados:
- $\text{Costo}_{N-1} = (655.28 \times 38.40) + (1083.84 \times 9.50) = \$35,459.23 \text{ USD}$
- $\text{Costo}_N = (895.14 \times 38.40) + (1460.30 \times 9.50) = \$48,246.24 \text{ USD}$
- $\text{Factor BAF } (fa) = \frac{48,246.24}{35,459.23} = \mathbf{1.3606116x} \quad (+36.06\%)$
- $\text{Nuevo BAF} = 2.86 \times 1.3606116 = \$3.8916 / \text{PMT}$
- $\Delta \text{ BAF Net} = 3.8916 - 2.86 = \mathbf{+\$1.0316 / PMT}$

### 3. Matriz Tarifaria Final por Tramo:
- **Cabotaje Matarani (9,000 MT):** $\$13.06 + (+\$1.03) = \mathbf{\$14.09 / MT}$ *(o $\$13.06 + (-\$0.25) = \mathbf{\$12.81 / MT}$ si el bunker baja)*.
- **Exportación Mejillones (11,500 MT):** $\$15.25 + (+\$1.03) = \mathbf{\$16.28 / MT}$.
- **Cabotaje Callao (5,000 MT):** $\$40.03 + (+\$1.03) = \mathbf{\$41.06 / MT}$.
