---
titulo: Manual de Estilos UI/UX
fecha_actualizacion: 2026-06-26
---

# Manual de Estilos: PETRAL Smart Dashboard

Este documento define la identidad visual para la interfaz del usuario del ecosistema PETRAL, enfocándose especialmente en la legibilidad y rápida identificación de entidades (Clientes, Rutas y Buques) dentro de las matrices operativas y financieras.

## 1. Tipografía Global
Para un sistema logístico y financiero denso, la tipografía es crítica:
- **Fuente Principal (Títulos, Textos y UI general):** `Inter` (Sans-serif moderno, excelente legibilidad en pantallas).
- **Fuente Secundaria (Números y Datos Financieros):** `Roboto Mono` o variante tabular. Los números deben estar perfectamente alineados verticalmente.

## 2. Paleta de Colores de Entidades (Los "Bricks")

Se ha diseñado una paleta de máxima diferenciación para que las entidades no se crucen visualmente en pantalla. 

> [!NOTE] Nota Arquitectónica (Maestros)
> **Requisito a Futuro:** Los colores detallados a continuación están "hardcodeados" en el Frontend (Matriz Financiera) por ahora. 
> Cuando se desarrollen los módulos de **Maestro de Rutas**, **Maestro de Buques** y **Maestro de Clientes**, se deberá agregar un campo de UI estilo "Color Picker" para darle la oportunidad al usuario (creador de la data maestra) de modificar o asignar libremente el color que crea conveniente para esa entidad.

### 2.1. Clientes (Corporativos)
- <span style="display:inline-block; width:14px; height:14px; background-color:#0369A1; border:1px solid #999; vertical-align:middle;"></span> **SPCC:** Azul Cielo Oscuro Corporativo (`#0369A1` / `bg-sky-700`)
- <span style="display:inline-block; width:14px; height:14px; background-color:#F97316; border:1px solid #999; vertical-align:middle;"></span> **SPOT:** Naranja de Alerta (`#F97316` / `bg-orange-500`)

### 2.2. Rutas (Oceánicas / Neón Suave)
*Colores brillantes y totalmente distintos entre sí, para contrastar radicalmente con los barcos.*
- <span style="display:inline-block; width:14px; height:14px; background-color:#06B6D4; border:1px solid #999; vertical-align:middle;"></span> **ILO - MATARANI:** Cyan / Celeste Brillante (`#06B6D4` / `bg-cyan-500`)
- <span style="display:inline-block; width:14px; height:14px; background-color:#A855F7; border:1px solid #999; vertical-align:middle;"></span> **ILO - MARCONA:** Púrpura Vibrante (`#A855F7` / `bg-purple-500`)
- <span style="display:inline-block; width:14px; height:14px; background-color:#D946EF; border:1px solid #999; vertical-align:middle;"></span> **ILO - MEJILLONES:** Fucsia Brillante (`#D946EF` / `bg-fuchsia-500`)

### 2.3. Buques (Industriales Sólidos)
*Colores pesados, oscuros y muy definidos que emulan pinturas industriales / cascos.*
- <span style="display:inline-block; width:14px; height:14px; background-color:#DC2626; border:1px solid #999; vertical-align:middle;"></span> **TABLONES:** Rojo Sólido (`#DC2626` / `bg-red-600`)
- <span style="display:inline-block; width:14px; height:14px; background-color:#16A34A; border:1px solid #999; vertical-align:middle;"></span> **MOQUEGUA:** Verde Sólido (`#16A34A` / `bg-green-600`)
- <span style="display:inline-block; width:14px; height:14px; background-color:#475569; border:1px solid #999; vertical-align:middle;"></span> **CONCON TRADER:** Gris Asfalto (`#475569` / `bg-slate-600`)
- <span style="display:inline-block; width:14px; height:14px; background-color:#4F46E5; border:1px solid #999; vertical-align:middle;"></span> **HUEMUL:** Azul / Índigo Profundo (`#4F46E5` / `bg-indigo-600`)
