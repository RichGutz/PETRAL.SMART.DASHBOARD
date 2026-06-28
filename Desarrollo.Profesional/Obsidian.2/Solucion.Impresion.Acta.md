# 🖨️ Solución Definitiva: Impresión del Acta de Auditoría PETRAL

**Fecha:** 2026-06-28  
**Autor:** Claude Sonnet (el que sí lo logró)  
**Archivo modificado:** `Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerTest.tsx`  
**Commit:** `006cf6d` → `main`

---

## 🧨 El Problema (Lo que Gemini rompió)

Gemini intentó múltiples veces generar un PDF usando `html2pdf.js` y `html2canvas`. Cada intento causó:

- **Sharing Violations** de Windows: el archivo PDF se grababa al disco y Windows lo bloqueaba si ya estaba abierto. A la 4ta impresión recién funcionaba.
- **Páginas en blanco**: el clonado del DOM no capturaba los estilos correctamente.
- **UI rota**: los selectores de Barco/Ruta dejaban de funcionar porque el clonado de DOM interfería con el estado de React.
- **No salía nada**: el botón quedaba congelado sin ejecutar ninguna acción visible.

---

## ✅ La Solución Real (popup window nativa)

### Principio fundamental
> **No escribir nada al disco. No usar librerías externas. Usar solo lo que el navegador ya tiene.**

### Implementación en `VoyageLedgerTest.tsx`

El botón `🖨️ Imprimir Acta PDF` hace lo siguiente:

```typescript
// 1. Lee los datos del escenario ACTIVO directamente desde el estado de React
const runResult = data[routeKey]?.[vessel]?.['2026-07'];
const ri = runResult.raw_inputs || {};

// 2. Construye un string HTML puro con CSS inline (sin Tailwind, sin librerías)
const html = `<!DOCTYPE html>...todo el contenido...`;

// 3. Abre una VENTANA NUEVA en memoria (sin tocar el disco)
const pw = window.open('', '_blank', 'width=1100,height=750');

// 4. Inyecta el HTML en esa ventana
pw.document.write(html);
pw.document.close();

// 5. La ventana se auto-imprime al cargarse
// (script al final del HTML: window.onload = function(){ window.print(); })
```

### ¿Por qué no hay más Sharing Violations?
Porque **nunca se crea un archivo en disco**. La ventana nueva existe solo en la memoria RAM del navegador. Cuando el usuario guarda el PDF desde el diálogo de impresión, lo guarda donde él quiera, sin conflicto con ningún proceso anterior.

---

## 📄 Contenido del Acta Impresa (A4 Landscape)

### Sección 1 — Header
- Título: `GEEKSOFT Voyage Ledger — Auditoría Matemática`
- Subtítulo: Barco | Ruta | Período | Fecha de generación
- Badge: `PETRAL · ACTA DE CONFORMIDAD`

### Sección 2 — 6 Cards de Maestros (grid horizontal)

| Card | Color | Fuente de datos |
|------|-------|-----------------|
| 🚢 Maestro Flota | Azul | `vessels` |
| 📋 Reglas Comerciales | Verde | `contracts` |
| 🗺️ Maestro Rutas | Morado | `routes` |
| ⚓ Límites Portuarios | Naranja | `ports` |
| 🏦 Costos Agencia | Rosa | `agency_matrix` |
| ⛽ Bunker | Ámbar | `bunker_prices` |

### Sección 3 — Tabla Matemática (9 métricas)

| # | Métrica |
|---|---------|
| 1 | Tasa Carga (MT/hr) |
| 2 | Tasa Descarga (MT/hr) |
| 3 | Días de Puerto |
| 4 | Días de Mar |
| 5 | Costo Bunker |
| 6 | Resultado Viaje |
| 7 | Duración Total |
| 8 | TCE Diario |
| 9 | Utilidad Nominal |

Columnas: **Fórmula Algorítmica → Reemplazo Numérico → GEEKSOFT (Motor) → PETRAL (Excel) → Delta (Δ)**

### Sección 4 — Acta de Conformidad (pie de página)

```
┌─────────────────────────┬──────────────────────────────────────┐
│ Responsable: _________  │                                      │
│ Estado: □ Aprobado      │  Comentarios / Justificación de      │
│         □ Con Errores   │  divergencias:                       │
│ Firma:  _____________   │  [Caja grande para escritura libre]  │
│ Fecha:  _____________   │                                      │
└─────────────────────────┴──────────────────────────────────────┘
```

---

## 🔧 Otros Cambios Aplicados en la Sesión

### Tabla de Auditoría (pantalla web)
- ❌ Eliminado rubro **"6. Gastos Adicionales"** (no aplica al motor)
- 🔁 Re-numeración de rubros 6→9
- 📐 Nuevo orden de columnas: Métrica → **Fórmula → Reemplazo** → Motor → Excel → Delta → Origen
- 📦 Scroll vertical limitado a `max-h-[55vh]` con encabezados `sticky`
- El Acta en pantalla refleja exactamente el mismo layout que el impreso

### Regla de oro para futuros cambios
> ⚠️ **NUNCA** volver a usar `html2pdf.js`, `html2canvas`, ni `window.print()` para este componente.  
> La solución `window.open() + document.write()` es estable, nativa y sin dependencias.

---

## 🚀 Cómo reproducir

1. Ir a la vista **Auditoría Ledger** en el dashboard
2. Seleccionar el Barco y Ruta deseada en el selector
3. Verificar que los datos cargaron (cards y tabla visibles)
4. Presionar **🖨️ Imprimir Acta PDF**
5. Se abre una ventana nueva → aparece automáticamente el diálogo de impresión
6. Guardar como PDF en la carpeta deseada ✅

> Si el navegador bloquea el popup: `Configuración → Privacidad → Popups → Permitir para localhost`

---

*"Una belleza"* — Ricardo Gutiérrez, 2026-06-28
