# 📘 MANUAL DE USUARIO & ARQUITECTURA TÉCNICA
## PETRAL SHIPPING.SOFT V2.5
### Plataforma Integral de Inteligencia Comercial, Tarifación P×Q, Búker Polinómico & Voyage Ledger P&L

---

> **Empresa:** Naviera Petral S.A.  
> **Sistema:** PETRAL SMART DASHBOARD / SHIPPING.SOFT  
> **Versión:** 2.5 PRO (Release Julio 2026)  
> **Confidencialidad:** Documento Interno de Alta Gerencia & Operaciones  
> **Generado:** 25 de Julio de 2026  

---

## 📖 ÍNDICE DE CAPÍTULOS DE LA DOCUMENTACIÓN

1. [Capítulo 1 — Visión General & Arquitectura del Sistema](#capítulo-1--visión-general--arquitectura-del-sistema)
2. [Capítulo 2 — Maestro de Flota & Especificaciones de Buques](#capítulo-2--maestro-de-flota--especificaciones-de-buques)
3. [Capítulo 3 — Maestro de Puertos, Terminales & Gastos Portuarios](#capítulo-3--maestro-de-puertos-terminales--gastos-portuarios)
4. [Capítulo 4 — Maestro de Distancias & Rutas Comerciales](#capítulo-4--maestro-de-distancias--rutas-comerciales)
5. [Capítulo 5 — Maestro de Clientes & Contratos COA](#capítulo-5--maestro-de-clientes--contratos-coa)
6. [Capítulo 6 — Maestro de Búnker & Motor Polinómico BAF](#capítulo-6--maestro-de-búnker--motor-polinómico-baf)
7. [Capítulo 7 — Maestro de Originación (Sources & Sinks)](#capítulo-7--maestro-de-originación-sources--sinks)
8. [Capítulo 8 — Multicotizador Multirutas Spot (Engine P×Q)](#capítulo-8--multicotizador-multirutas-spot-engine-p-q)
9. [Capítulo 9 — Matriz Financiera & Voyage Ledger P&L](#capítulo-9--matriz-financiera--voyage-ledger-p-l)
10. [Capítulo 10 — Auditoría Static vs Dynamic Port Cost](#capítulo-10--auditoría-static-vs-dynamic-port-cost)

---

## Capítulo 1 — Visión General & Arquitectura del Sistema

### 1.1 Objetivo de la Plataforma
**PETRAL SHIPPING.SOFT** es una plataforma tecnológica de vanguardia diseñada específicamente para la gestión naviera de buques tanque (ej. *B/T Moquegua*, *B/T Tablones*, *Concon Trader*, *Huemul*). Permite simular, cotizar, ejecutar y auditar el margen de operación neto ($P\&L$) de cada viaje de transporte marítimo de hidrocarburos y carga líquida/a granel.

### 1.2 Estructura Modular en 5 Niveles
1. **Nivel 1: Datos Maestros Básicos** (Flota, Puertos, Distancias, Clientes, Contratos, Búnker, Originación).
2. **Nivel 2: Motor Polinómico BAF & Tarifación P×Q** (Indexación por combustibles y reglas dinámicas por rubro).
3. **Nivel 3: Cotizador Comercial Multirutas Spot** (Simulación en tiempo real de alternativas de flete).
4. **Nivel 4: Matriz Financiera & Voyage Ledger P&L** (Consolidación financiera de ingresos, bunker, port costs, comisiones y resultado neto por viaje).
5. **Nivel 5: Suite de Auditoría & Flujogramas** (Static vs Dynamic Port Cost, Auditoría Dual y Diagramas de Arquitectura).

---

## Capítulo 2 — Maestro de Flota & Especificaciones de Buques

### 2.1 Especificaciones Técnicas Registradas
El **Maestro de Flota** administra los datos constructivos, operativos y de consumo de las embarcaciones de la compañía:
- **DWT (Deadweight Tonnage):** Capacidad de carga bruta en toneladas métricas.
- **Draft / Calado (m):** Calado máximo en verano y restricciones operativas.
- **Velocidad de Navegación (Kts):** Velocidad en lastre (Ballast) y cargado (Laden).
- **Consumo de Búnker (MT/día):**
  - Consumo Navegando IFO 380 VLSFO (Laden / Ballast).
  - Consumo Navegando MDO Diesel (MGO).
  - Consumo en Puerto Operando Carga/Descarga (Auxiliares y Calderas).
  - Consumo en Puerto Inactivo (Idle).

---

## Capítulo 3 — Maestro de Puertos, Terminales & Gastos Portuarios

### 3.1 Gestión de Gastos Estáticos y Dinámicos
Administra las tarifas y costos asociados a las escalas portuarias en el litoral peruano e internacional (ej. Callao, Matarani, Ilo, San Juan de Marcona, Mejillones, Quintero, Guayaquil):
- **Costo Estático Fijo ($/operación):** Tarifa plana presupuestada por escala de agenciamiento.
- **Matriz de Gastos Dinámicos (Motor P×Q):**
  - Practicaje (Pilots)
  - Remolque (Tugboats)
  - Uso de Muelle (Port Dues / Wharfage)
  - Amarradores y Lanchas (Mooring & Launch)
  - Agenciamiento Marítimo (Agency Fee)

---

## Capítulo 4 — Maestro de Distancias & Rutas Comerciales

### 4.1 Matriz de Distancias Marítimas (Nautical Miles)
Calcula con exactitud la distancia en millas náuticas (NM) entre los puertos de origen y destino, determinando automáticamente los días de navegación:
$$\text{Días de Navegación} = \frac{\text{Distancia (NM)}}{\text{Velocidad (Kts)} \times 24}$$

---

## Capítulo 5 — Maestro de Clientes & Contratos COA

### 5.1 Gestión Contractual por Tiers
Almacena las condiciones pactadas en los Contratos de Afletamiento (COA):
- **Laytime / Tasas de Carga y Descarga (MT/día).**
- **Comisiones de Dirección y Brokerage (%).**
- **Demurrage / Despacho ($/día).**
- **Tiers de Tarifas por Tramo de Tonelaje ($/MT).**

---

## Capítulo 6 — Maestro de Búnker & Motor Polinómico BAF

### 6.1 Fórmula Polinómica Contractual (B/T Moquegua)
El ajuste de combustible (BAF) indexa el flete de acuerdo a la variación de mercado entre el periodo base $N-1$ y el periodo actual $N$:

$$fa = 1 + \frac{(\text{IFO}_N \times 38.40 + \text{MDO}_N \times 9.50) - (\text{IFO}_{N-1} \times 38.40 + \text{MDO}_{N-1} \times 9.50)}{\text{IFO}_{N-1} \times 38.40 + \text{MDO}_{N-1} \times 9.50}$$

- **Nuevo BAF ($/PMT):** $\text{BAF Inicial} \times fa$
- **Delta Net ($\Delta$ USD/PMT):** $\text{Nuevo BAF} - \text{BAF Inicial}$
- **Tarifa Final Ajustada por Tramo:** $\text{Tarifa Base Tramo} + \Delta \text{ BAF}$

---

## Capítulo 7 — Maestro de Originación (Sources & Sinks)

### 7.1 Mapeo de Flujos Logísticos
Administra los puntos de producción (Refinerías, Terminales de Almacenamiento) y puntos de consumo de hidrocarburos en el Pacífico Sur.

---

## Capítulo 8 — Multicotizador Multirutas Spot (Engine P×Q)

### 8.1 Simulación Comercial en Tiempo Real
Permite cotizar múltiples alternativas de viaje simultáneamente, evaluando:
- Flete Base y Flete Ajustado por BAF.
- Días Totales de Ciclo (Navegación + Laytime en Puertos + Maneuvers).
- Consumo Total de Búnker en USD.
- Gastos Portuarios Totales (Estáticos vs Dinámicos P×Q).
- Margen Neto por Viaje ($P\&L$).
- TCE (Time Charter Equivalent) en USD/día.

---

## Capítulo 9 — Matriz Financiera & Voyage Ledger P&L

### 9.1 Consolidación Contable y Financiera
El **Voyage Ledger** consolida el estado de pérdidas y ganancias de la flota:
$$\text{Resultado Neto del Viaje} = \text{Ingresos Flete} - (\text{Comisiones} + \text{Costo Búnker} + \text{Costos Portuarios})$$

---

## Capítulo 10 — Auditoría Static vs Dynamic Port Cost

### 10.1 Control de Calibración Presupuestal
Compara el costo estático contractual fijado con el promedio de costos dinámicos por puerto/terminal, generando semáforos de alerta:
- 🟢 **ALIGNED:** Desviación $< 5\%$
- 🟡 **MODERATE:** Desviación $5\% - 15\%$
- 🔴 **CRITICAL:** Desviación $> 15\%$
