# Modelo de Cálculo de Demanda de Combustibles (Nivel Departamental)

Este modelo busca estimar la demanda potencial de Diésel y Gasolinas en la Zona de Influencia del Proyecto San Nicolás (Arequipa, Apurímac, Ica, Cusco).

## 1. La Ecuación Maestra (Enfoque Híbrido)

La demanda total ($D_{total}$) de una región se compone de tres vectores independientes:

$$ D_{total} = D_{minería} + D_{transporte} + D_{base} $$

Donde:
1.  $D_{minería}$: Consumo directo de operaciones mineras (Tajo abierto vs Subterránea).
2.  $D_{transporte}$: Consumo de la flota logística que atiende a la mina + transporte interprovincial.
3.  $D_{base}$: Consumo orgánico de la población y otras industrias (Correlacionado al PBI Regional).

---

## 2. Fase 1: Vector Base ($D_{base}$) - "El Colchón" (PRIORIDAD 1)

**Definición:** Crecimiento vegetativo de la región (Consumo orgánico de la población y parque automotor existente).

### Fórmula (Econométrica):
$$ \ln(D_{base}) = \alpha + \beta \times \ln(PBI_{regional}) $$

*   **Elasticidad Ingreso ($\beta$):** Históricamente en Perú es > 1.0 para transporte.
*   **Variables Clave:**
    *   **PBI Regional:** (Fuente: INEI).
    *   **Parque Automotor:** Cantidad de vehículos registrados (Fuente: MTC/APP).

---

## 3. Fase 2: Vector Minero ($D_{minería}$) - "El Motor" (PRIORIDAD 2)

**Definición:** Consumo directo de operaciones mineras. Componente más volátil.

### Fórmula:
$$ D_{minería} = \sum_{i=1}^{n} (TM_i \times I_i) $$

*   $TM_i$: Toneladas Métricas de movimiento de tierra (Mineral + Estéril).
*   $I_i$: **Índice de Intensidad** (Galones/TM).
    *   Tajo Abierto: 0.8 - 1.2 Gal/TM
    *   Subterránea: 0.3 - 0.5 Gal/TM

---

## 4. Fase 3: Vector Transporte ($D_{transporte}$) - "La Arteria" (PRIORIDAD 3)

**Definición:** Combustible quemado en la logística de entrada/salida.

### Fórmula:
$$ D_{transporte} = (N_{viajes} \times Distancia_{km}) \div Rendimiento_{kpg} $$

---

## 5. Plan de Ejecución (Siguientes Pasos)

1.  **Recolectar Variables:**
    *   [ ] Extraer `Producción (TM)` y `Ratio Estéril/Mineral` de los reportes PDF (2025) para las minas clave.
    *   [ ] Obtener PBI Regional (Apurímac es casi 100% minería).
2.  **Calibrar Índices:** Validar si usamos 0.8 o 1.2 Gal/TM con datos reales de Las Bambas (si existen públicos).
3.  **Simulación:** Correr el modelo para 3 escenarios (Conservador, Base, Agresivo) en el Dashboard.

---

## 6. Calibración Piloto (Datos Reales 2023-2024)

### A. Región Apurímac (Caso "Minero-Dependiente")
*   **PBI 2023:** S/ 6,613 Millones (Fuente: INEI/ProducEmpresarial).
*   **Factor Minería:** ~60% del PBI (S/ 3,967 MM).
*   **Implicancia Modelo:** El *Vector Base* es débil; el consumo de diésel depende casi exclusivamente del *Vector Minero* (Las Bambas, Strike).
    *   *Acción:* Monitorizar "Conflictos Sociales" como variable de dumping para la demanda.

### B. Región Arequipa (Caso "Híbrido")
*   **PBI 2023:** ~5.5% del PBI Nacional (2da economía del país).
*   **Parque Automotor:** Est. ~320,000 vehículos (Basado en 16k nuevos/año y crecimiento 5%).
*   **Implicancia Modelo:** El *Vector Base* es alto. Existe una demanda "piso" de gasolinas/diésel para transporte urbano y carga comercial ajena a la minería.
    *   *Oportunidad:* San Nicolás podría capturar parte de este mercado si ofrece mejor precio en planta que Mollendo.
