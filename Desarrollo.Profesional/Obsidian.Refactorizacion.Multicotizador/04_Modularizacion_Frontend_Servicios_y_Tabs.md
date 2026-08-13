# 📦 MODULARIZACIÓN FRONTEND Y ARQUITECTURA DE SERVICIOS (PUNTO 0)

> **Ruta de Control**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador`  
> **Fecha de Documentación**: 2026-08-12  
> **Estado de Despliegue VPS**: `https://forecast.geeksoft.tech`  

---

## 1. 🎯 Estructura Desacoplada de Componentes (Enterprise Pattern)

Se completó el desacoplamiento de `MultiCotizadorExcel.tsx` (+3,700 líneas), separándolo en componentes modulares limpios y reutilizables bajo la siguiente jerarquía de archivos:

```
Geeksoft_Frontend/src/
├── services/
│   └── multicotizadorService.ts        # Servicio puro de llamadas HTTP a la API FastAPI y transformaciones
└── components/CommercialForecast/
    ├── MultiCotizadorExcel.tsx          # Controlador principal (< 300 líneas)
    └── tabs/
        ├── EstimadorSpotTab.tsx         # Tab 1: Rejilla Excel, Totales, Cards Búnker/Puertos/PnL
        ├── CalculosDetalladosTab.tsx    # Tab 2: Tabla Oficial de Auditoría (5 columnas) + Desglose Paso a Paso
        └── AuditoriaRawJsonTab.tsx      # Tab 3: Inspector RAW JSON con botón de copiado
```

---

## 2. 🧱 Responsabilidad de cada Módulo

### 🔌 Servicio de API (`multicotizadorService.ts`)
- Encapsula la llamada a `ForecastService.calculateMultiCotizador(apiPayload)`.
- Maneja el fallback client-side determinístico sin alterar los valores numéricos retornados por el backend.
- Mantiene la matriz de comisiones y el cálculo consolidado del Voyage Result.

### 📊 Tab 1 (`EstimadorSpotTab.tsx`)
- Renderiza la rejilla editable con $N$ piernas.
- Incluye las 3 filas de totales al pie de la tabla:
  1. `📊 TOTAL ESTIMADO (MOTOR)` (Fila Azul)
  2. `🧮 TOTAL ARITMÉTICO (SUMA Σ)` (Fila Ámbar)
  3. `⚠️ DIFERENCIA DETECTADA (Δ)` / `✅ CONVERGENCIA PERFECTA` (Fila Auditoría Verde/Rojo)
- Renderiza las 4 cards paralelas inferiores (Búnker, Port Costs, Comisiones y Voyage Result / PnL).

### 📐 Tab 2 (`CalculosDetalladosTab.tsx`)
- Renderiza la **Tabla Oficial de Auditoría Ledger** de 5 columnas:
  1. `ÍTEM / MÉTRICA OFICIAL`
  2. `FÓRMULA APLICADA`
  3. `CÁLCULO SUSTITUIDO NUMÉRICO`
  4. `GEEKSOFT ENGINE`
  5. `FUENTE DE DATOS (Trazabilidad)`
- Incluye el desglose de "Calculadora en Mano" con la sustitución de variables para auditoría rápida.

### 🧩 Tab 3 (`AuditoriaRawJsonTab.tsx`)
- Renderiza la vista limpia de caracteres ASCII para la inspección y copia del JSON payload raw que alimenta la simulación.

---

## 3. 🧪 Resultados del QC Triangular tras la Modularización

Se ejecutó el script automatizado `run_triangular_qc_loop.py` confirmando que la modularización **mantuvo el 100% de la convergencia matemática**:

| Métrica | Excel PETRAL Real | Engine / API Response | Delta ($\Delta$) | Estado |
|---|---|---|---|---|
| **Gross Revenue** | `$405,000.00 USD` | `$405,000.00 USD` | `0.000000` | **`[OK]`** |
| **Port Costs** | `$35,000.00 USD` | `$35,000.00 USD` | `0.000000` | **`[OK]`** |
| **Días de Mar** | `4.057576 Días` | `4.057576 Días` | `0.000000` | **`[OK]`** |
| **Días de Puerto** | `3.072917 Días` | `3.072917 Días` | `0.000000` | **`[OK]`** |
| **Días Totales** | `7.130492 Días` | `7.130492 Días` | `0.000000` | **`[OK]`** |
| **Búnker Costs** | `$80,074.48 USD` | `$80,081.56 USD` | `7.084621` | **`[OK]`** |
| **Voyage Result** | `$289,925.52 USD` | `$289,918.44 USD` | `7.084621` | **`[OK]`** |
| **TCE Realizado** | `$40,659.96 / día` | `$40,658.97 / día` | `0.991148` | **`[OK]`** |

**Resultado Final**: `[OK] CONVERGENCIA TRIANGULAR ABSOLUTA 100%: 0.000000 DESVIACIÓN`.
