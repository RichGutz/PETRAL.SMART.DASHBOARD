# 🕵️ El Método Benoit Blanc
## Manual de Investigación Forense para Bugs Persistentes en React

> *"Un gran detective no adivina. Lee. Compara. Elimina. El culpable siempre deja huella."*

**Proyecto**: PETRAL Smart Dashboard — Geeksoft Frontend V2
**Origen**: Destilado de 33 series de auditoría forense (2026-08-16)
**Bug resuelto**: React Error #300/#310 — Pantalla blanca en navegación entre rutas
**Duración del caso**: Múltiples sesiones con Gemini + 1 sesión con Benoit Blanc

---

## 📋 Índice

1. ¿Qué es el Método Benoit Blanc?
2. Los 4 Axiomas del Detective
3. Fase 1 — Lectura del Crimen (Sin Tocar Código)
4. Fase 2 — El Monolito como Testigo
5. Fase 3 — Auditoría del Worktree Activo
6. Fase 4 — La Pista del Usuario
7. Fase 5 — Dictamen Pericial Escrito ANTES del Código
8. Fase 6 — Cirugía Mínima y Verificación
9. Fase 7 — Sellado del Caso
10. Patrones de Crímenes React Conocidos
11. Script de Auditoría Automática PowerShell
12. Checklist de Campo
13. Lecciones de Oro del Caso PETRAL

---

## 1. ¿Qué es el Método Benoit Blanc?

El Método Benoit Blanc es un protocolo de debugging forense diseñado para bugs **persistentes, esquivos y que resisten múltiples intentos de solución**. Su nombre honra al detective de la película *Glass Onion*: metódico, paciente, que nunca actúa antes de entender el cuadro completo.

### ¿Cuándo aplicarlo?

Activa este método cuando se cumplan 2 o más de estas condiciones:

- [ ] El bug ocurre de manera **intermitente o condicionada** (funciona con F5, falla sin él)
- [ ] Han existido **múltiples intentos de fix** que no resolvieron el problema
- [ ] El bug ocurre en la **pantalla de destino** pero el código sospechado está en otra parte
- [ ] El error es **genérico** sin señalar el culpable exacto
- [ ] El bug **desapareció y volvió** tras un refactor o modularización

### ¿Qué NO es este método?

- ❌ No es "intentar un fix y ver qué pasa"
- ❌ No es confiar en el stack trace del error minificado de producción
- ❌ No es asumir que el componente que falla en pantalla es el culpable
- ❌ No es refactorizar código funcional "por si acaso"

---

## 2. Los 4 Axiomas del Detective

### Axioma 1: "No supongas nada"
Antes de proponer cualquier fix, el agente debe haber **leído las líneas exactas** del archivo sospechoso. No el nombre del archivo. Las líneas.

### Axioma 2: "El monolito es el testigo clave"
Si existía una versión que funcionaba, esa versión tiene la respuesta. Siempre comparar con el baseline funcional (archivos `*_monolitico.tsx`).

### Axioma 3: "El crimen ocurre en el layout, no en la víctima"
En React con React Router, cuando **varias rutas diferentes** producen el mismo crash, el culpable vive en el **componente de layout compartido**, no en los componentes específicos de cada ruta.

### Axioma 4: "Documenta antes de operar"
**NUNCA** ejecutar `npm run build` o modificar código sin antes haber escrito el dictamen pericial en Obsidian con: archivo exacto, líneas exactas, mecanismo del crimen, y solución propuesta.

---

## 3. Fase 1 — Lectura del Crimen

### Paso 1.1 — Reproducir el bug de forma exacta

Documentar el flujo exacto que produce el bug vs. el flujo que no lo produce.

Ejemplo PETRAL:
```
FALLA: /dashboard (cargar escenario) → clic AN GRAF (sin F5) → PANTALLA BLANCA
OK:    /graphic-analysis → F5 → GRÁFICO APARECE
```

La diferencia entre los dos flujos ES la pista más valiosa.

| Condición | Funciona | Falla |
|---|---|---|
| F5 en /graphic-analysis | ✅ | — |
| Navegación desde /dashboard | — | ❌ |
| Botón "Limpiar" escenario | ✅ | — |

**Conclusión**: Los datos NO son el problema. El bug es del **ciclo de vida de los componentes durante la navegación**.

### Paso 1.2 — Leer el error exacto de consola

```
❌ MALO:  "Minified React error #300"
✅ BUENO: "Rendered fewer hooks than expected. This may be caused by
          an accidental early return statement."
```

### Paso 1.3 — Regla de las rutas múltiples

```
/dashboard → /graphic-analysis : ❌ CRASH
/dashboard → /spaghetti-map    : ❌ CRASH
→ 2+ rutas afectadas = culpable en el LAYOUT COMPARTIDO
```

---

## 4. Fase 2 — El Monolito como Testigo

### Diferencia arquitectónica clave que explica el bug

```tsx
// MONOLITO — tab = estado interno, NUNCA desmonta componentes
const [activeTab, setActiveTab] = useState<'grid' | 'chart' | 'map'>('grid');

// V2 — tab = ruta React Router, SIEMPRE desmonta y monta
<Route path="/graphic-analysis" element={<GraphicAnalysis_V2 />} />
```

**La modularización expone bugs latentes de hooks que el monolito nunca disparó.**

### Buscar componentes que NO existían en el monolito

```powershell
# Localizar archivos monolíticos de referencia
Get-ChildItem -Recurse -Filter "*monolitico*" src/ | Select-Object FullName
```

Todo componente que **existe en V2 pero no en el monolito** es candidato a haber introducido un bug nuevo.

---

## 5. Fase 3 — Auditoría del Worktree Activo

### Script de escaneo rápido

```powershell
$files = Get-ChildItem -Recurse -Filter "*.tsx" src/ |
    Where-Object { $_.Name -notlike "*monolitico*" }

foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $hasHooks = $content -match "useState|useEffect|useMemo|useRef|useCallback"
    $hasEarlyReturn = $content -match "if \(.*\) return null|if \(.*\)\s*\{\s*return null"
    if ($hasHooks -and $hasEarlyReturn) {
        Write-Host "⚠️  SOSPECHOSO: $($f.Name)"
    }
}
```

### Auditoría quirúrgica por archivo

```powershell
$lines = Get-Content $path
for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line -match "^\s+(const \[|useState|useEffect|useMemo|useRef)") {
        Write-Host "L$($i+1) [HOOK]: $($line.Trim())"
    }
    if ($line -match "^\s+if \(.*\) return|^\s+return null") {
        Write-Host "L$($i+1) [RETURN]: $($line.Trim())"
    }
}
```

### Distinguir returns SEGUROS vs. PELIGROSOS

```tsx
// ✅ SEGURO — return dentro de useMemo (no viola regla de hooks)
const options = useMemo(() => {
    if (!data) return null;
    return computeOptions(data);
}, [data]);

// ✅ SEGURO — return dentro de función auxiliar pura externa al componente
const getColor = (name: string) => {
    if (name.includes('SPCC')) return '#blue';
    return '#gray';
};

// ❌ PELIGROSO — return en el cuerpo del componente ENTRE hooks
const MyComponent = ({ hideInputs }) => {
    const [a] = useState();          // Hook #1
    if (hideInputs) return null;     // ⛔ EARLY RETURN
    const data = useMemo(() => {}, []);  // Hook #2 — SKIPPED
};
```

### Tabla de veredictos del worktree (ejemplo PETRAL)

| Componente | Rutas presentes | Early return entre hooks | Estado |
|---|---|---|---|
| `MasterTemplate_V2` | Todas | No | ✅ LIMPIO |
| `ForecastBuilder_V2` | Todas | SÍ — L338 antes de useMemo L344, L348 | 🔴 CULPABLE |
| `TelemetryConsoleModal` | Todas | SÍ — useEffect L15 después de return null L13 | 🔴 CULPABLE |
| `InteractiveChart` | Solo /graphic | Guard movida al pie (Serie 30) | ✅ LIMPIO |

---

## 6. Fase 4 — La Pista del Usuario

El usuario conoce su aplicación mejor que nadie. Sus observaciones son hipótesis forenses enmascaradas.

| Pista del usuario | Interpretación forense |
|---|---|
| "Con F5 funciona, sin F5 no" | Bug del ciclo mount/remount, NO de los datos |
| "El botón Limpiar sí funciona" | La función de limpiar estado es correcta |
| "El escenario persiste aunque haga F5" | sessionStorage correcto — datos no son el problema |
| "Telemetry no sé ni si sirve" | Componente nuevo, candidato a eliminar |
| "Ponle cloroformo" | Autorización para desactivar componente sospechoso |

### Preguntas siempre obligatorias

1. ¿Cuándo EXACTAMENTE falla? (flujo preciso)
2. ¿Cuándo EXACTAMENTE funciona? (el contraejemplo)
3. ¿Qué fue lo último que cambió antes del bug?
4. ¿Algún componente fue agregado para diagnosticar el bug? (puede ser el criminal)
5. ¿El bug ocurre en UNA ruta o en MÚLTIPLES rutas de destino?

---

## 7. Fase 5 — Dictamen Pericial ANTES del Código

### Estructura obligatoria del dictamen

```markdown
## Serie XX: [Nombre descriptivo]

### El Crimen Exacto
Archivo: `src/components/CommercialForecast/ForecastBuilder_V2.tsx`

MECANISMO:
  L337: if (hideInputs) { return null; }   ← EARLY RETURN
  L344: const selectedRouteObj = useMemo(...)  ← HOOK SKIPPED
  L348: const selectedRouteDisplay = useMemo(...)  ← HOOK SKIPPED

DISPARADOR: hideInputs = (activeTab !== 'financial-matrix')
            Cambia de false (en /dashboard) a true (en /graphic-analysis)
            en CADA navegación → CRASH GARANTIZADO

### Corrección Propuesta (líneas exactas)
Mover if(hideInputs) return null de L337 a DESPUÉS de L352.

### Garantías
- 1 archivo modificado
- Sin cambio de lógica de negocio
- Sin cambio de UI visible
```

---

## 8. Fase 6 — Cirugía Mínima y Verificación

### Principio de mínima intervención

Tocar el **mínimo de líneas posible**. Sin refactor "de paso".

### Protocolo de verificación browser (obligatorio)

```
1. Ctrl+Shift+R en /dashboard
2. Cargar escenario de prueba
3. Navegar a /graphic-analysis SIN F5 → ¿visible?
4. Navegar a /spaghetti-map SIN F5 → ¿visible?
5. Navegar de regreso a /dashboard SIN F5 → ¿datos visibles?
6. Consola → 0 errores React #300/#310

CRITERIO: Los 6 pasos sin pantalla blanca = BUG RESUELTO
```

---

## 9. Fase 7 — Sellado del Caso

```bash
# Commit con mensaje forense
git add -A
git commit -m "SERIE-33: Fix React Error #300 — ForecastBuilder_V2 early return

Causa: if(hideInputs) return null en L338 saltaba useMemo×2 en L344 y L348.
hideInputs cambiaba en cada navegación de tab.
Fix: guarda movida al pie del componente, después de todos los hooks.
Verificado en Brave 2026-08-16 sin pantalla blanca."

# Branch conmemorativo (checkpoint inmutable)
git checkout -b NOMBRE.DEL.LOGRO
git checkout main
git merge NOMBRE.DEL.LOGRO
git push origin NOMBRE.DEL.LOGRO
git push origin main
```

---

## 10. Patrones de Crímenes React Conocidos

### Tipo A — Early Return entre Hooks (el caso PETRAL)
- **Síntoma**: "Rendered fewer hooks than expected"
- **Dónde buscar**: Layout compartido, no la ruta destino
- **Disparador**: Props que cambian con navegación (`activeTab`, `hideInputs`, `isCollapsed`)
- **Fix**: Mover el `return null` condicional al pie del componente, después de todos los hooks

### Tipo B — NaN en ECharts
- **Síntoma**: Gráfico vacío después de cargar datos
- **Causa**: Métricas `undefined`/`null` sin conversión segura
- **Fix**: `const safeNum = (v: any) => { const n = Number(v); return isNaN(n) ? 0 : n; };`

### Tipo C — Doble Instanciación
- **Síntoma**: Componentes montados dos veces, estado duplicado
- **Causa**: Componente en router padre Y en layout hijo
- **Fix**: Centralizar en `<Outlet />`

### Tipo D — Race Condition en Context
- **Síntoma**: Datos desaparecen al navegar
- **Causa**: `useEffect` que se re-ejecuta en cada cambio de ruta
- **Fix**: `useRef` como guardia de carga

---

## 11. Script de Auditoría Automática PowerShell

```powershell
# audit_hooks.ps1 — Guardar en: scripts/audit_hooks.ps1
param([string]$SrcPath = ".\src")

Write-Host "`n🔍 AUDITORÍA BENOIT BLANC`n" -ForegroundColor Cyan

$files = Get-ChildItem -Recurse -Filter "*.tsx" $SrcPath |
    Where-Object { $_.Name -notlike "*monolitico*" }

$violations = @()

foreach ($f in $files) {
    $lines = Get-Content $f.FullName
    $hookLines = @()
    $returnLines = @()

    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^    (const \[|useState|useEffect|useMemo|useRef|useCallback)") {
            $hookLines += $i + 1
        }
        if ($lines[$i] -match "^    if \(.*\) (return null|return \()" -or
            $lines[$i] -match "^    return null;$") {
            $returnLines += $i + 1
        }
    }

    foreach ($ret in $returnLines) {
        $hooksAfter = $hookLines | Where-Object { $_ -gt $ret }
        if ($hooksAfter) {
            $violations += [PSCustomObject]@{
                File = $f.Name
                ReturnLine = $ret
                HooksAfter = $hooksAfter -join ", "
            }
        }
    }
}

if ($violations.Count -eq 0) {
    Write-Host "✅ ÁRBOL LIMPIO — Sin violaciones de Regla de Hooks" -ForegroundColor Green
} else {
    Write-Host "🔴 VIOLACIONES:" -ForegroundColor Red
    foreach ($v in $violations) {
        Write-Host "`n  ⚠️  $($v.File)"
        Write-Host "     Early return en: L$($v.ReturnLine)"
        Write-Host "     Hooks después:   L$($v.HooksAfter)"
    }
}
```

**Uso**: `.\scripts\audit_hooks.ps1 -SrcPath "...\Geeksoft_Frontend\src"`

---

## 12. Checklist de Campo

### Pre-Investigación
- [ ] Flujo exacto que reproduce el bug (paso a paso)
- [ ] Flujo que NO reproduce el bug (el contraejemplo)
- [ ] Mensaje de error exacto de consola
- [ ] ¿1 ruta o múltiples rutas afectadas?

### Investigación
- [ ] Listar archivos monolíticos de referencia
- [ ] Ejecutar script de auditoría automática
- [ ] Construir tabla de worktree con veredicto por componente
- [ ] Distinguir returns en funciones vs. returns del componente top-level

### Pre-Fix (OBLIGATORIO antes de cualquier código)
- [ ] Dictamen pericial escrito en Obsidian
- [ ] Aprobación explícita del usuario
- [ ] Commit del estado actual antes del cambio

### Fix y Verificación
- [ ] `tsc` → exit 0
- [ ] `npm run build` → exit 0
- [ ] Deploy al VPS → OK
- [ ] Ctrl+Shift+R + flujo completo sin F5
- [ ] Consola: 0 errores React #300/#310

### Sellado
- [ ] Serie actualizada en Autopsia: `✅ RESUELTO + timestamp`
- [ ] Commit con mensaje forense
- [ ] Branch conmemorativo creado y pusheado a origin
- [ ] `main` actualizado y pusheado

---

## 13. Lecciones de Oro del Caso PETRAL

Destiladas de 33 series de auditoría (2026-08-16):

**1. El culpable siempre está en el pasillo**
Cuando múltiples páginas crashean con el mismo error, el criminal está en el componente de layout compartido, no en ninguna de esas páginas.

**2. F5 es el mejor aliado forense**
Si F5 arregla el bug, los datos no son el problema. El bug es de ciclo de vida. Esto elimina el 80% de los sospechosos.

**3. Las herramientas de diagnóstico pueden ser el criminal**
Componentes introducidos para buscar un bug pueden introducir sus propias violaciones. Son los primeros sospechosos cuando el bug aparece después de agregarlos.

**4. La modularización expone lo que el monolito escondía**
El monolito con tabs internos nunca desmontaba componentes. Al migrar a React Router con rutas separadas, cualquier hook violado explotará en la primera navegación.

**5. Leer antes de proponer**
El stack trace minificado de producción miente. Leer el código fuente real con líneas exactas es lo único que funciona.

**6. El usuario tiene las mejores pistas**
Las observaciones del usuario son hipótesis forenses enmascaradas. Interpretarlas correctamente reduce el espacio de búsqueda a la mitad.

---

## Referencias

- `16_Autopsia_Pericial_y_Metodologia_Benoit_Blanc_Estabilidad_Monolitica.md` — 33 series completas
- `03_Protocolo_de_Control_de_Calidad_QC_Triangular_UI_Backend_Excel.md` — El loop de QC triangular
- `CommercialForecast_monolitico.tsx` — Baseline funcional de referencia
- React Rules of Hooks: https://react.dev/warnings/invalid-hook-call-warning
- React Error #300: https://react.dev/errors/300

---

## 14. Caso Forense Extra: La Odisea de los $13,000 USD de Muellaje (Dockage Revenue) y la Trampa de la Sobre-Investigación

> *"El error más grave de un investigador novato es buscar en la oscuridad lo que el testigo ya puso sobre la mesa a plena luz del día."* — Benoit Blanc

### 14.1. El Misterio: Un Número Visible en la Base de Datos que Desapareció en Pantalla

En la ruta/cotización `NEXA.ILO.CALLAO.MATARANI.ILO.2026 (IZ)`:
- En la base de datos Supabase (`routes_quotes`), dentro de `legs_data.puertosConfig`, existían grabados con total claridad:
  - **Puerto 1 (Callao - CARGAR):** `muellaje_cost = $7,000 USD`
  - **Puerto 2 (Matarani - DESCARGAR):** `muellaje_cost = $6,000 USD`
  - **Total Muellaje Refacturado:** **$13,000 USD**
- En el Multicotizador:
  - **Flete Puro:** $405,000 USD (13,500 MT × $30.00/MT)
  - **Refacturación de Muellaje:** +$13,000 USD
  - **Gross Revenue Total:** **$418,000 USD**
- En la Matriz Financiera de Producción (`https://forecast.geeksoft.tech`):
  - `Net Revenue`: $405,000 USD
  - `↳ (+) Freight Revenue`: $405,000 USD
  - `↳ (+) Dockage Revenue`: **`-` ($0)** ❌
  - `(=) VOYAGE RESULT / P&L`: **$169,961 USD** (descalzado por exactamente $13,000 USD frente a los $182,961 USD reales).

---

### 14.2. Crónica de las Decenas de Iteraciones y la "Ceguera por Sobre-Investigación"

¿Por qué se perdieron más de 20 minutos y decenas de miles de tokens en un problema cuya respuesta estaba en una sola línea?

| Iteración / Fase | Acción Errónea del Agente | Causa del Descalce | Lección Aprendida |
| :--- | :--- | :--- | :--- |
| **Iteración 1-3** | Intentó separar `gross_income` restando o asumiendo que el backend ya enviaba `refacturacion_muellaje`. | El backend `forecast_service.py` históricamente fusionaba los $418,000 completos en `gross_income`, enviando `refacturacion_muellaje = 0.0`. Al separar el flete a $405k, el muellaje se quedó huérfano. | Si separas un componente de una suma, debes garantizar de dónde se nutre la otra mitad. |
| **Iteración 4-7** | Modificó `spot_engine.py` buscando `muellaje_cost_origin` y `muellaje_cost_dest` dentro de `processed_tramos`. | Los tramos nunca tuvieron esas propiedades asignadas porque el Multicotizador moderno guarda la configuración portuaria en `puertosConfig`, no en las piernas planas. El motor devolvía 0.0 silenciosamente. | No asumas la estructura del objeto sin inspeccionar el JSON real de la tabla. |
| **Iteración 8-11** | En vez de preguntar directamente al usuario cómo quería estructurar la suma, el agente ejecutó scripts de dump en bucle, quemando tokens en segundo plano. | **Violación directa de la regla `ask_first_token_efficiency`**. El usuario conocía perfectamente que la suma de `puertosConfig` era el origen del número. | **El humano conoce el negocio.** Preguntar en 5 segundos ahorra 20 minutos de investigación a ciegas. |
| **Iteración 12-15** | En `ForecastGrid.tsx`, una condición estricta `if (mUnit !== undefined)` evaluaba `0 !== undefined` como verdadero y multiplicaba por 0, tapando el fallback de `total_refacturacion_muellaje`. | Bug sutil de JavaScript: `0` es falsy pero no es `undefined`. | Los fallbacks numéricos deben validar `Number(v) > 0`, no solo presencia de clave. |

---

### 14.3. El "Smoking Gun": La Trampa de la Función Gemela (`run_forecast_simulation_universal`)

Tras más de una docena de intentos, la prueba forense definitiva en terminal con el script `test_dockage.py` reveló por qué el backend seguía fallando a pesar de que el código parecía correcto:

```text
=== SMOKING GUN FIELDS ===
  gross_income: 405000.0
  freight_revenue: --- KEY MISSING ---
  freight_revenue_unit: --- KEY MISSING ---
  dockage_revenue: --- KEY MISSING ---
  dockage_revenue_unit: --- KEY MISSING ---
  refacturacion_muellaje: --- KEY MISSING ---
  refacturacion_muellaje_unit: --- KEY MISSING ---
  gross_revenue_total: --- KEY MISSING ---
  net_income: 418000.0
  voyage_result: 289918.44
  pl_vs_required: 182961.06
```

#### 🔍 El Hallazgo Pericial:
En `forecast_service.py` coexistían **dos funciones de simulación paralelas**:
1. `run_forecast_simulation` (Línea 849 - la que se había editado inicialmente).
2. `run_forecast_simulation_universal` (Línea 1131 - **la que realmente ejecutaba la simulación de la Matriz Financiera en vivo**).

La función universal contenía su propio loop duplicado (Línea 1347), donde:
- Se calculaba `gross_revenue = consolidated.get("total_freight_revenue", 0)` ($405k).
- **Nunca se leía `puertosConfig`**.
- El diccionario `unit_result` se construía sin `dockage_revenue` ni `freight_revenue`.
- El diccionario `monthly_result` (Línea 1064) omitía por completo estas claves, dejándolas en estado `KEY MISSING`.

---

### 14.4. La Cirugía Definitiva y Verificación

Se intervino quirúrgicamente la función `run_forecast_simulation_universal`:

1. **En `unit_result` (Líneas 1347–1385):**
   ```python
   # 1. Leer directamente los muellajes grabados en puertosConfig
   puertos_cfg_list = legs_data.get("puertosConfig", [])
   sum_muellaje = sum(float(p.get("muellaje_cost") or 0.0) for p in puertos_cfg_list) if puertos_cfg_list else 0.0

   tot_freight_rev = float(consolidated.get("total_freight_revenue", 0))
   tot_dockage = sum_muellaje if sum_muellaje > 0 else float(consolidated.get("total_refacturacion_muellaje", 0) or 0.0)
   gross_revenue = tot_freight_rev + tot_dockage  # $418,000.00 USD

   unit_result = {
       "gross_income": round(tot_freight_rev, 2),            # $405,000 USD (Flete Puro)
       "freight_revenue": round(tot_freight_rev, 2),         # $405,000 USD
       "freight_revenue_unit": round(tot_freight_rev, 2),
       "dockage_revenue": round(tot_dockage, 2),             # $13,000 USD (Muellaje)
       "dockage_revenue_unit": round(tot_dockage, 2),
       "refacturacion_muellaje": round(tot_dockage, 2),
       "refacturacion_muellaje_unit": round(tot_dockage, 2),
       "gross_revenue_total": round(gross_revenue, 2),       # $418,000 USD
       "gross_revenue_total_unit": round(gross_revenue, 2),
       "net_income": round(gross_revenue, 2),                # $418,000 USD
       ...
   }
   ```

2. **En `monthly_result` (Líneas 1064–1085):**
   Se propagaron explícitamente todas las claves desglosadas multiplicadas por la frecuencia (`freq`).

3. **Resultado Inmediato en Terminal:**
   ```text
   === SMOKING GUN FIELDS (POST-FIX) ===
     gross_income: 405000.0 ✅
     freight_revenue: 405000.0 ✅
     freight_revenue_unit: 405000.0 ✅
     dockage_revenue: 13000.0 ✅
     dockage_revenue_unit: 13000.0 ✅
     refacturacion_muellaje: 13000.0 ✅
     refacturacion_muellaje_unit: 13000.0 ✅
     gross_revenue_total: 418000.0 ✅
     net_income: 418000.0 ✅
     voyage_result: 289918.44 ✅
     pl_vs_required: 182961.06 ✅ (Cuadratura con $182,961 P&L)
   ```

---

### 14.5. Despliegue y Sellado en Producción

| Etapa | Comando Ejecutado | Resultado |
| :--- | :--- | :--- |
| **Paso 1: Git Commit & Push** | `git commit -m "fix: SMOKING GUN dockage_revenue..." ; git push origin main` | Commit `9c5b3c8` en `origin/main` ✅ |
| **Paso 2: Vite Build** | `npx vite build` | `1064 modules transformed — built in 7.27s` ✅ |
| **Paso 3: Deploy VPS** | `python deploy_forecast_kickoff.py` | SSH/SFTP + Nginx + Certbot en `91.108.125.253` ✅ |
| **URL Oficial en Vivo** | `https://forecast.geeksoft.tech` | **PUBLICADO Y VERIFICADO EN PRODUCCIÓN** ✅ |

---

### 14.6. Mandamiento Inquebrantable para Futuras Sesiones

```text
========================================================================================
🚨 LEY FORENSE #1 DE EFICIENCIA DE TOKENS:
NUNCA inventar la rueda ni hacer bucles de investigación cuando el humano está presente.
Ante cualquier lógica de negocio, campo ambiguo o requerimiento de suma:
1. DETENTE.
2. PREGUNTA al humano en una sola línea clara.
3. EJECUTA exactamente lo indicado sin inventar deducciones en segundo plano.
========================================================================================
```

---

## 15. Caso Pericial N° 05: El Misterio de las 118 vs 119 Recaladas en ILO (Desincronización de LocalStorage vs Supabase)

**Fecha**: 26 de Agosto de 2026  
**Investigador**: Detective Benoit Blanc  
**Evidencia Física**: Dos capturas de pantalla simultáneas del Multicotizador donde dos usuarios mirando **la misma ruta, con las mismas fechas y el mismo puerto (ILO)** veían datos sutilmente discordantes:
- **Usuario A**: `Promedio: 1.85 d (44.4 h) | Mediana: 0.58 d | Recaladas: 118` *(2026: 38 vjes, 2025: 55 vjes, 2024: 25 vjes)*.
- **Usuario B**: `Promedio: 1.86 d (44.6 h) | Mediana: 0.63 d | Recaladas: 119` *(2026: 38 vjes, 2025: 55 vjes, 2024: 26 vjes)*.

---

### 🕵️‍♂️ 15.1. El Foco del Crimen: El Viaje Fantasma N° 26 de 2024
Al desglosar las dos capturas, el detective descubrió un patrón revelador:
1. **En 2026**: Ambos usuarios tenían **38 viajes** exactos (Meses 01 al 07).
2. **En 2025**: Ambos usuarios tenían **55 viajes** exactos (12 meses completos).
3. **En 2024**: El Usuario A tenía **25 viajes**, mientras que el Usuario B tenía **26 viajes** (+1 viaje adicional).

$$\text{Usuario A: } 38 + 55 + 25 = \mathbf{118\text{ recaladas}} \quad \text{vs} \quad \text{Usuario B: } 38 + 55 + 26 = \mathbf{119\text{ recaladas}}$$

---

### 🔍 15.2. La Autopsia Técnica: ¿De dónde salió ese viaje extra?

El peritaje del código en `PortDemurrageRatesService.ts` reveló una doble capa de persistencia:
1. **Capa 1 (Semilla Inicial en Frontend)**:
   - El archivo empaquetado `src/data/historicalDemurrageData.json` contenía una base inicial de **161 registros**.
   - En esa base de 161 registros, la ventana móvil de 24 meses arrojaba exactamente **118 recaladas** para ILO.
2. **Capa 2 (Base de Datos Central en la Nube - Supabase)**:
   - Al consultar la tabla `demurrage_records` directamente en Supabase, el conteo real era de **174 registros**.
   - Con los 174 registros, se incluía el viaje histórico adicional de 2024, arrojando **119 recaladas** para ILO.
3. **El Crimen de la Caché Local (`localStorage`)**:
   - `PortDemurrageRatesService.getRecords()` leía primero la clave `'petral_demurrage_records_v1'` en el navegador.
   - El **Usuario A** tenía en su navegador la caché vieja de 161 viajes (118 recaladas).
   - El **Usuario B** ya había sincronizado con Supabase y tenía en su navegador los 174 viajes (119 recaladas).

---

### 🛠️ 15.3. Cirugía Forense y Resolución Definitiva:

1. **Sincronización Total del JSON Semilla**:
   - Se descargaron los 174 registros completos de Supabase y se sobreescribió `historicalDemurrageData.json`.
2. **Invalidación Universal de Caché (`v2`)**:
   - Se migró la clave a `'petral_demurrage_records_v2'` en `PortDemurrageRatesService.ts`.
   - Se programó una verificación que detecta si el navegador tiene menos registros que la semilla oficial para forzar la actualización inmediata.
3. **Resultado**: Todos los usuarios y navegadores convergen ahora de forma 100% determinística y ven **119 recaladas (1.86 d)**.

---

*Caso cerrado y sellado en bitácora por Benoit Blanc — 26.08.2026.*

---

## 16. Caso Pericial N° 06: El Misterio del Tag Huérfano y la Tarjeta Oculta de Arriendo de Naves en el PDF

**Fecha**: 27 de Agosto de 2026  
**Investigador**: Detective Benoit Blanc  
**Evidencia Física**: Captura del PDF generado por el Multicotizador donde la grilla central de tramos e itinerario desaparecía por completo y la tarjeta de *Costo Arriendo Naves* no se imprimía encima de *Comments*.

---

### 🕵️‍♂️ 16.1. La Autopsia del Crimen (Doble Sospechoso)

1. **Sospechoso 1: La Condición Restrictiva (`> 0`)**:
   - En `multicotizadorPdfPrintService.ts`, la tarjeta de Arriendo de Naves estaba envuelta en:
     ```typescript
     ${(Number(calc.charterHireCost || charterHireCost || 0) > 0) ? `...` : ''}
     ```
   - Mientras en la pantalla del Multicotizador la tarjeta **siempre es visible** encima de Comments (mostrando `$0` si no hay arriendo asignado), en el PDF se destruía si el valor era `$0`, rompiendo la simetría 1:1 con la interfaz.

2. **Sospechoso 2: El Tag Huérfano (Crimen de la Estructura DOM)**:
   - Al inyectar el código de la tarjeta en una versión previa, se eliminaron inadvertidamente las etiquetas de cierre `</div></div>` de la tarjeta superior de **Gastos de Búnker**.
   - El motor de renderizado HTML del navegador consideró que todas las secciones subsiguientes (BAF, Comisiones, P/L y Grilla de Tramos) formaban parte del cuerpo de la tabla de búnker, colapsando el DOM y empujando los elementos fuera de la página imprimible.

---

### 🛠️ 16.2. Cirugía Forense y Resolución Definitiva:

1. **Restauración del Árbol DOM**:
   - Se cerró la tarjeta de búnker con sus etiquetas `</div></div>` completas antes de iniciar la tarjeta de Arriendo de Naves.
2. **Tarjeta 100% Permanente en PDF**:
   - Se removió la condición `> 0`. Ahora la tarjeta **Costo Arriendo Naves** se imprime siempre en la Columna 1 del PDF (arriba de *Comments*), mostrando `$0` o el valor asignado con el estilo sobrio idéntico a la pantalla.
3. **Deducción en Casilla Verde (P/L)**:
   - La fila `(-) Arriendo Nave (Charter)` se deduce y concilia directamente en el bloque financiero de P/L y TCE.

---

*Caso cerrado y sellado en bitácora por Benoit Blanc — 27.08.2026.*

---

## 17. Caso Pericial N° 07: El Misterio del PDF Parado y el Descriptor `@page { size: landscape }` en Chromium

**Fecha**: 27 de Agosto de 2026  
**Investigador**: Detective Benoit Blanc  
**Evidencia Física**: El usuario reporta que al guardar el PDF mediante el navegador, Foxit Reader abre el documento en vertical ("parado"), requiriendo rotación manual.

---

### 🕵️‍♂️ 17.1. La Autopsia del Crimen

1. **La Trampa de los Milímetros en `@page`**:
   - En Chromium (Blink), declarar `@page { size: 297mm 210mm; }` NO activa la bandera booleana interna de orientación horizontal en el diálogo de impresión nativo de Windows si no está presente la palabra reservada estándar `landscape`.
   - Chromium interpretaba las dimensiones como un formato de papel personalizado, pero dejaba el radio button de orientación en **"Vertical" (Portrait)** por omisión del sistema operativo.

2. **La Ausencia de la Biblioteca de Exportación Binaria**:
   - La llamada a `html2pdf.js` fallaba silenciosamente al no estar cargado el script en el `<head>`, forzando al usuario al diálogo de impresión del navegador.

---

### 🛠️ 17.2. Cirugía Forense y Resolución Definitiva:

1. **Restauración de la Directiva Canónica `@page { size: A4 landscape; margin: 0; }`**:
   - Se restableció la regla CSS estándar en la cabecera `<style>` (post-Tailwind) y en `@media print`.
   - Con esta directiva válida y sin propiedades experimentales de dimensiones métricas, Chromium reconoce automáticamente el descriptor de página como **A4 Horizontal (Landscape)** y elimina encabezados y pies de página (`about:blank`, numeración `1/2`).

2. **UX Ejecutivo de 1 Solo Botón Oficial**:
   - Se eliminaron librerías secundarias y botones redundantes, preservando la experiencia sobria e intuitiva de PETRAL:
     - **Botón Único:** `🖨️ Imprimir / Guardar como PDF` (`window.print()`).
     - **Botón Auxiliar:** `Cerrar` (`window.close()`).
   - El layout de 1 hoja A4 Landscape queda perfectamente confinado a `290mm × 200mm` con cero desbordes.

---

*Caso cerrado y sellado en bitácora por Benoit Blanc — 27.08.2026.*
