# Plan: Infografía HTML — "El Viaje que Calcula Solo"
## Kick-off Geeksoft · Naviera Petral · 29 Junio 2026

---

## Concepto Central

> **Una sola pantalla que sigue el recorrido físico real de un barco.**
> Cada vez que el barco llega a una etapa del viaje, aparecen las variables que
> el motor usa en ESE MOMENTO — sin mencionar código, tablas ni bases de datos.

El usuario ve el viaje. El motor se "explica solo" como consecuencia del viaje.

---

## Formato Técnico

- **Archivo:** `kickoff_petral.html` — un solo archivo, sin instalaciones
- **Ejecución:** Doble clic → abre en Chrome/Edge → fullscreen (F11)
- **Navegación:** Teclas ← → o clic en flechas laterales (como PowerPoint)
- **Estilo:** Dark marine theme (azul marino profundo, acentos ámbar/dorado)
- **Fuente:** Google Fonts (Inter) — carga offline-safe con fallback
- **Animaciones:** CSS puro — sin librerías externas, sin internet requerido

### Stack Técnico (Un Solo Archivo HTML)
- **HTML5** — 7 `<section>` apiladas, una por slide
- **SVG inline** — barco, válvulas del Slide 4, mapa costero
- **CSS Grid + Flexbox + `@keyframes`** — olas, barco en movimiento, counters animados
- **`backdrop-filter: blur`** — glassmorphism en cards informativos
- **JS puro ~20 líneas** — navegación teclado ← → y botones clic
- **Peso estimado:** ~600-800 líneas · ~50KB · carga en <100ms

---

## Los 7 Slides

---

### SLIDE 1 — Portada (2 min)

**Visual:** Barco mercante en silueta oscura sobre océano con gradiente marino. Olas animadas en CSS.

**Texto centrado:**
```
⚓ GEEKSOFT · NAVIERA PETRAL
─────────────────────────────
"El Motor que Calcula
 lo que Excel ya sabe"

Cómo funciona la matemática
detrás de cada viaje de la flota.

Junio 2026
```

---

### SLIDE 2 — El Barco (Los datos del fierro) (4 min)

**Visual:** Diagrama lateral del B/T TABLONES con flechas señalando partes físicas.

4 cards aparecen uno a uno (animación slide-in):
- 🚢 **Velocidad:** 11 nudos — dicta cuánto tarda en mar abierto
- ⬇️ **Intake:** 500 T/hr — límite físico de recepción de carga
- 💉 **Bombas:** 450 T/hr — potencia de descarga a presión
- ⛽ **Bunker:** 4 fases de consumo distintas (mar / carga / descarga / espera)

**Mensaje:** *"El barco no es un promedio. Cada fase operativa consume diferente."*

---

### SLIDE 3 — La Ruta (3 min)

**Visual:** Mapa estilizado de la costa peruana. Línea punteada animada ILO → MATARANI con el barco moviéndose.

```
ILO  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━● MATARANI
          69 millas náuticas
          Factor climático: +3%
          Tiempo real de navegación: ~6 horas ida
```

Banner de condiciones:
- Distancia base: 69 NM · Ajuste climático: ×1.03 · Distancia real: 71.07 NM
- *"El motor no asume tiempo ideal. Incorpora el mar real de la ruta."*

---

### SLIDE 4 — La Ley del Mínimo ⭐ (Slide clave — 6 min)

**Visual estrella:** Animación de 3 cañerías/válvulas. Las 3 abiertas → se van cerrando → queda la más restrictiva en rojo pulsando.

```
      EL CONTRATO         EL TERMINAL          EL BARCO
      dice 500 T/hr  →   dice 300 T/hr  →   puede 500 T/hr

                      ↓
             [  300 T/hr  ] ← EL SISTEMA ESCOGE ESTE

      Para 13,500 MT ÷ 300 T/hr = 45 horas de carga
      + 6 horas de trámites
      ═══════════════════════
      Total en Puerto: 51 horas = 2.1 días
```

**Mensaje:** *"El motor no asume el mejor caso. Calcula con el límite real."*

---

### SLIDE 5 — Bunker: Fase por Fase (5 min)

**Visual:** Línea de tiempo horizontal del viaje con 4 bloques de color y barra de combustible consumida.

```
  [██ CARGA 2.1d ██] [████ MAR 0.97d ████] [██ DESC 1.56d ██]

  ⚓ Puerto Carga:   3.5 T/día × 2.1d  =   7.4 T IFO
  🌊 Mar Ida:       14.5 T/día × 0.97d =  14.1 T IFO
  ⚓ Puerto Desc:    3.5 T/día × 1.56d =   5.5 T IFO
  🌊 Mar Vuelta:    14.5 T/día × 0.97d =  14.1 T IFO
  ──────────────────────────────────────────────────
  TOTAL IFO: 41.1 T × $440/T = $18,084 USD
```

Cada fila suma visualmente de abajo a arriba (animación de contador JS).

---

### SLIDE 6 — El Voyage Result (4 min)

**Visual:** Calculadora financiera estilizada — 3 líneas en cascada con counter animado.

```
  💰 VOYAGE RESULT — B/T TABLONES · ILO → MATARANI

  Ingreso Bruto   13,500 MT × $19.01/MT  = $256,635
  − Costos Puerto (Agencia ILO + MATARANI) = ($41,000)
  − Costo Bunker  (IFO+MDO total)          = ($14,460)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  VOYAGE RESULT                            = $201,175

  TCE Real: $201,175 ÷ 3.77 días = $53,362/día
```

---

### SLIDE 7 — El Ledger + Siguientes Pasos (5 min)

**Visual:** Screenshot del Ledger de Auditoría + timeline de hitos.

```
  AQUÍ ESTÁ LA PRUEBA VIVA
  → Motor vs. Excel · Comparación en tiempo real

  ✅ Motor validado     ← HOY
  → Pantalla SPOT       ← Semana 1
  → Forecast Comercial  ← Semana 2-3
  → ETL datos 2026      ← Semana 3-4
  → Go-Live             ← Semana 5
```

---

## Estética

| Elemento | Valor |
|---|---|
| Fondo | `#0B1929` — azul marino profundo |
| Acento primario | `#F5A623` — ámbar dorado |
| Acento datos | `#00D4FF` — cian eléctrico |
| Texto | `#E8F4FD` — blanco cálido |
| Cards | Glassmorphism `backdrop-filter: blur` |
| Tipografía | Inter (Google Fonts) + Mono para números |

---

## Pendientes de Confirmar

- [ ] ¿Demo en vivo (localhost:5173) en Slide 7 o screenshot estático?
- [ ] ¿Confirmas ILO → MATARANI como ruta del ejemplo?
- [ ] ¿Números del Slide 6 referenciales o actualizamos con ledger real?
- [ ] ¿Carpeta de salida? → propuesta: `Obsidian.2\kickoff_petral.html`
