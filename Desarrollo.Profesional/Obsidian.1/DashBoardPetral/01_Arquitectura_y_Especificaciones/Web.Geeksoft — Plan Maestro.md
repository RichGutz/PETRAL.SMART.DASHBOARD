# 🌐 Web.Geeksoft — Plan Maestro de Desarrollo UI

> **Contexto para el próximo agente de IA:**
> Este documento es el blueprint completo del sitio web de Geeksoft. Cada sección es una fuente de verdad. **No improvises. Lee todo antes de tocar código.**

---

## Stack Técnico
- **Framework**: Next.js 16 (App Router, Turbopack)
- **WebGL**: React Three Fiber (`@react-three/fiber`) + Drei
- **CSS**: Vanilla CSS en `globals.css` (sin Tailwind)
- **Rutas activas**:
  - `/` → Home (Radar + fondo negro con MilkyWay CSS)
  - `/sandbox` → Terreno 3D original experimental
  - `/sandbox-gems` → Fondo 3D nuevo (terrain + gems + fog verde)
  - `/sandbox-radar` → **HÍBRIDO ACTIVO**: Radar HTML encima del fondo 3D ← *trabajo en curso*

---

## Componentes WebGL Estables (NO TOCAR sin respaldo)

| Componente | Ruta | Descripción |
|---|---|---|
| `ContourTerrain.tsx` | `src/components/webgl/` | Terreno de curvas de nivel con shader parabólico. **Backup**: `ContourTerrain_V4_STABLE.tsx` |
| `StarField.tsx` | `src/components/webgl/` | Estrellas verdes neón (Drei PointMaterial). **Backup**: `StarField_V2_STABLE.tsx` |
| `GreenGems.tsx` | `src/components/webgl/` | Gemas icosaédricas verdes translúcidas. **Backup**: `GreenGems_V3_STABLE.tsx` |
| `GreenFogCamera.tsx` | `src/components/webgl/` | Cámara + niebla verde `#001408` con scroll 3D. **Backup**: `GreenFogCamera_V2_STABLE.tsx` |
| `GreenFogVolume.tsx` | `src/components/webgl/` | Niebla volumétrica de partículas gigantes. **Backup**: `GreenFogVolume_V2_STABLE.tsx` |
| `StaticFogCamera.tsx` | `src/components/webgl/` | Cámara fija + niebla verde (sin ScrollControls, para el híbrido) |

### ⚠️ Reglas Críticas para Shaders GLSL
- **NUNCA** combinar declaración manual de `vViewPosition` con `#include <fog_pars_vertex>` — genera doble declaración y crash silencioso de GPU.
- **NUNCA** poner `fog={true}` en un `ShaderMaterial` personalizado sin implementar TODOS los includes de niebla correctamente.
- **SIEMPRE** verificar uniforms en `useFrame` de forma defensiva: `if (mat && mat.uniforms && mat.uniforms.uTime?.value !== undefined)`.

---

## Plan de Features: `/sandbox-radar` (Trabajo en Curso)

### Feature 1: Centrar el Radar en Pantalla ✅ PENDIENTE
- El `Radar.tsx` actualmente usa posicionamiento absoluto relativo al viewport.
- Se debe verificar que el `radar-container` en `globals.css` esté centrado con `margin: auto` o `top/left: 50%; transform: translate(-50%, -50%)`.
- El título "GEEKSOFT" debe seguir apareciendo en la esquina superior izquierda.

### Feature 2: Re-agregar Red Pill & Blue Pill ✅ PENDIENTE
- Existían en la home original (`src/app/page.tsx`) como botones debajo del Radar.
- La **Red Pill** hacía scroll suave hasta la sección `#inframundo`.
- La **Blue Pill** mostraba un `alert()` (acción pendiente por definir).
- En `/sandbox-radar` deben aparecer en la misma posición pero adaptadas al nuevo fondo oscuro/verde.

### Feature 3: Interacción Click en Nodos del Radar → Panel Lateral 🎯 PRÓXIMO SPRINT

**Flujo de UX:**
1. Usuario está en la pantalla con el Radar centrado + fondo 3D.
2. Usuario hace **click en un nodo** del radar (SaaS / Dashboards / AI / Scrappers).
3. El Radar se **desplaza horizontalmente a la izquierda** con una animación CSS suave (transform + transition).
4. A la derecha aparece un **Panel de Contenido** con:
   - Título de la categoría seleccionada
   - Descripción / Cards de servicios
   - CTA (Call to Action)
5. Usuario puede hacer click en un botón de "volver" o en el centro del Radar para regresar al estado inicial.

**Implementación técnica sugerida:**
```tsx
// Estado en sandbox-radar/page.tsx
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

// CSS: radar se desplaza
.radar-wrapper {
  transition: transform 0.6s cubic-bezier(0.77, 0, 0.175, 1);
  transform: translateX(selectedCategory ? '-30vw' : '0');
}

// Panel de contenido aparece desde la derecha
.content-panel {
  transition: opacity 0.4s ease, transform 0.6s cubic-bezier(0.77, 0, 0.175, 1);
  transform: translateX(selectedCategory ? '0' : '100%');
}
```

**Contenido de los paneles (por definir con el usuario):**
- **SaaS Especializado** → descripción + ejemplos de productos
- **Dashboards** → descripción + screenshots de dashboards
- **Agentes de IA** → descripción + demos
- **Web Scrappers** → descripción + casos de uso

---

## Paleta de Colores Activa

```css
--bg-base: #030303;           /* Negro base */
--bg-3d: #001408;             /* Verde oscuro profundo (fondo 3D) */
--color-default: #E71D36;     /* Rojo Marciano Geeksoft */
--color-saas: #00e3fd;        /* Cyan */
--color-dashboards: #fa02ea;  /* Pink */
--color-ai: #b0ff00;          /* Neon Green */
--color-scrappers: #ff8c00;   /* Orange */
--neon-terrain: #00ff80;      /* Verde neón del terreno 3D */
```

---

## Reglas para el Agente de IA

1. **Backups por hitos**: Antes de cualquier cambio significativo, copia el archivo con sufijo `_VN` o `_VN_STABLE`.
2. **No refactorizar código funcional**: Solo tocar lo necesario para la tarea.
3. **Verificar con tsc**: Después de cada cambio, correr `npx tsc --noEmit` desde `C:\Users\rguti\Web.Geeksoft`.
4. **No usar browser_subagent**: Prohibido en este proyecto (ver `.agents/AGENTS.md`).
5. **Idioma**: Siempre responder en español.
6. **Servidor de desarrollo**: `npm run dev` desde `C:\Users\rguti\Web.Geeksoft`. Nunca dejar el proceso colgado.

---

## Estado al Último Checkpoint (2026-07-13)

- ✅ Fondo 3D funcional con shader limpio (sin macros de niebla en el ShaderMaterial).
- ✅ Ruta `/sandbox-radar` creada con Radar + Canvas 3D en capas.
- ⏳ Radar no está centrado en la pantalla del híbrido (heredado del posicionamiento de la home).
- ⏳ Red Pill / Blue Pill no integradas aún en el híbrido.
- ⏳ Interacción click → panel lateral no implementada.
