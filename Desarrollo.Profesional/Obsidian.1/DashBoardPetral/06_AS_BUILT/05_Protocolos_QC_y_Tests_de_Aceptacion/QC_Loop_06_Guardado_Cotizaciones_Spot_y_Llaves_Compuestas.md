# 🧮 QC Loop 06 — Guardado de Cotizaciones Spot y Llaves Compuestas

> **Propósito**: Valida que al armar un circuito multileg en el Multicotizador Spot (`/multicotizador`), se genere correctamente la llave compuestas `${CLIENTE}.${PUERTOS}.${BUQUE}` en la tabla `routes_master` de Supabase sin duplicar llaves ni perder tramos.
