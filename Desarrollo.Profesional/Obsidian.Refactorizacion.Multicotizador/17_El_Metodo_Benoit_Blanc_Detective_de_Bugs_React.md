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

*Método creado durante el debugging del proyecto PETRAL Smart Dashboard.*
*Verificado en producción: https://forecast.geeksoft.tech*
*Branch de referencia: `BENOIT.LOGRO.MONOLITO.MODULAR`*
