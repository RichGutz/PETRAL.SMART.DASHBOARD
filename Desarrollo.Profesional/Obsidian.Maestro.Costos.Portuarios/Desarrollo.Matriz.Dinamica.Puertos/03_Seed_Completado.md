# 🗂️ Seed Completado — Julio 2026

> **Fuente**: PNGs en `PORT.COSTS.PATRICIA` transcritos a MD y luego a DB.
> **Scripts**: `scratch/seed_definitivo_pt1.py`, `pt2.py`, `pt3.py`
> **Fecha**: 2026-07-17

---

## ✅ Resumen por Puerto

### 1. CALLAO / APM
- **13 conceptos** por operación (x2 = 26 filas total)
- Fila especial: Pilotage tiene doble lógica → `MAX(750, 0.055*GRT)`
- Remolcaje: `MAX(800, 0.065*GRT)` × tugboats
- Dockage: `$1.50 × LOA × HOURS` (APM)
- Lighthouse: `$0.03/GRT` (nacional) / `$0.12/GRT` (extranjero)

### 2. ILO / GENERAL
- **17 conceptos** por operación
- Doble opción de towage: PSA Marine (`$0.16×GRT`) vs Petranso (`$0.15×GRT`)
- Lanchas independientes: autoridades, coordinador, amarre, posicionamiento
- Agency Fee: `$900` (el más bajo de todos los puertos Perú)

### 3. MATARANI / GENERAL
- **15 conceptos** por operación
- Servicio integral PSA: `$5,550 × maniobra` (incluye practicaje + tugs + lancha)
- Recargo 25% o 50% sobre el servicio integral según horario
- Dockage Tisur: `$0.65 × LOA × HOURS`

### 4. MARCONA / GENERAL
- **13 conceptos** por operación
- Puerto más caro de Perú: Towage `$18,000/maniobra` + Practicaje `$4,980/maniobra`
- Linesmen con lanchas incluidas: `$4,450/maniobra`
- Remolcaje Stand By: `$16,000` (opcional, a partir de 60 hrs)

### 5. MEJILLONES / TPM (TGN)
- **17 conceptos** por operación
- Light Dues Chile: `$1.60 × GRT × año`
- Dockage: `$3.99 × LOA × HOURS` (36 hrs ref)
- ISPS Fee: `$1,140.35`
- Loading Master: `$3,264.40` (≈$62/hr × 36 hrs)

### 6. MEJILLONES / INTERACID
- **19 conceptos** por operación
- Dockage diferente: `$702 × TH` (no LOA)
- Loading Master: `$86/hr` (variable por horas)
- ISPS Fee: `$1,273.00`
- Launch embarcadero: `$280` (adicional vs TGN)

### 7. MEJILLONES / TERQUIM
- **20 conceptos** por operación (el más complejo de Mejillones)
- Dockage: `$5.72 × LOA × HOURS` (30 hrs ref)
- ISPS Fee: `$1,191.00`
- Loading Master: `$2,923.00`
- Hose Connection/Portón: `$2,500` (opcional)

### 8. BARQUITO / GENERAL
- **20 conceptos** por operación
- Puerto más caro de todos: TOTAL ref ≈ `$89,195`
- Towage: `$6,500/maniobra` (Ultratug)
- Tugboat Stand By: `$648/hora` (exigido por Autoridad Marítima)
- Light Dues: `$1.56 × GRT` (≈USD 33,614 anuales para Moquegua)
- Dockage: `$71.92/hora` (28 hrs ref)

---

## 📎 MDs de Referencia (Transcripción 1:1 de PNGs)

Los siguientes archivos son la copia exacta de los PNGs, en formato tabla Markdown:

| MD | PNG Fuente |
|---|---|
| [PNG_Callao_Layout.md](../PNG_Callao_Layout.md) | CallaoCompleto.png |
| [PNG_Ilo_Layout.md](../PNG_Ilo_Layout.md) | IloCompleto.png |
| [PNG_Matarani_Layout.md](../PNG_Matarani_Layout.md) | MataraniCompleto.png |
| [PNG_Marcona_Layout.md](../PNG_Marcona_Layout.md) | MarconaCompleto.png |
| [PNG_Mejillones_TGN_Layout.md](../PNG_Mejillones_TGN_Layout.md) | MejillonesCompleto.png |
| [PNG_Mejillones_Interacid_Layout.md](../PNG_Mejillones_Interacid_Layout.md) | InteracidCompleto.png |
| [PNG_Mejillones_Terquim_Layout.md](../PNG_Mejillones_Terquim_Layout.md) | TerquimCompleto.png |
| [PNG_Barquito_Layout.md](../PNG_Barquito_Layout.md) | BarquitoCompleto.png |
