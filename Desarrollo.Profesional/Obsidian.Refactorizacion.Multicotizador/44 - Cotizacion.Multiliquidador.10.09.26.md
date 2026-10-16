# 📑 COTIZACIÓN Y MULTILIQUIDADOR (VOYAGE LIQUIDATOR)

> **Ubicación de Control:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador`  
> **Fecha de Documentación:** 16 de Octubre de 2026  
> **Especificación Maestra:** [[52_Voyage_Liquidator.md]]  
> **Estado:** 100% Modular & Desplegado en Producción  
> **URL en Vivo:** [https://petral.one.geeksoft.tech/voyage-liquidator](https://petral.one.geeksoft.tech/voyage-liquidator)  

---

## 🎯 1. Resumen Ejecutivo de la Sesión

Se implementó el nuevo módulo **Voyage Liquidator** como herramienta de liquidación comercial *Ex-Post* (datos fácticos reales), integrándolo en el menú `HERRAMIENTAS` de PETRAL ONE.

### Principales Logros:
1. **Mapeo Celda por Celda (Columnas A a T):**
   - Transcripción del audio `VOYAGE_Liquodator.ogg` mediante Whisper.
   - Adaptación de la matriz matemática documentada en `52_Voyage_Liquidator.md`.
2. **Timestamps de Recalada (ATA / ATD):**
   - Inputs `datetime-local` en cada pierna para el cálculo automático y exacto de horas de puerto y días mar/puerto.
3. **Rubro de Otros Costos:**
   - Columnas directas para gastos no previstos (lanchas, P&I, demoras especiales) con glosa descriptiva.
4. **Enlace Dinámico a Búnker Bootstrapping:**
   - Consumo de combustible en TM valorizado con el precio ponderado real ($P_{pond}^{IFO}$ y $P_{pond}^{MDO}$) vigente del buque.
5. **Arquitectura 100% Modular:**
   - Descompuesto en 7 submódulos React en `src/components/VoyageLiquidator/`.
   - Cero monolitos HTML/JS.

---

## 🚀 2. Despliegue en Servidor Oficial Contabo

- **IP VPS:** `169.58.168.107`
- **Build Frontend:** `npx vite build` (éxito en 12.46s).
- **Base de Datos:** Constraint `uq_voyage_liquidations_code` añadida en PostgreSQL.
- **Ruta Oficial:** `/voyage-liquidator`
