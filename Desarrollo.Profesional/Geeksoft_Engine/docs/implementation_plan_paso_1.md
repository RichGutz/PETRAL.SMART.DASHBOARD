# Motor P&L y Unit Economics - Paso 1: Inicialización de Base de Datos

Este plan documenta la estrategia para crear la base de datos relacional y las restricciones en Supabase, siguiendo el "PASO 1" descrito en la arquitectura de la bóveda de Obsidian.

## Goal

Crear el esquema relacional (`vessels`, `routes`, `agency_matrix`, `contract_tariffs`, `vessel_trips`) mediante scripts SQL de migración y poblar las tablas con los datos maestros iniciales asegurando el cumplimiento de todas las llaves foráneas (FK) y primarias compuestas (PK). Todo el desarrollo se realizará estrictamente en el worktree `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine`.

> [!IMPORTANT]
> No se tocará la bóveda de Obsidian. Todo código, script y prueba se mantendrá aislado en el nuevo directorio `Geeksoft_Engine`.

## User Review Required

> [!WARNING]
> ¿Prefieres que utilice el CLI oficial de Supabase (`npx supabase init`) para inicializar el proyecto local y generar las migraciones, o deseas que escriba los archivos SQL puros en una estructura de carpetas estándar para que tú los ejecutes manualmente en el panel web de Supabase?

## Proposed Changes

Se creará la siguiente estructura de archivos SQL (ya sea vía CLI de Supabase o manual):

### Base de Datos Supabase

#### [NEW] `001_initial_schema.sql`
Creación de la arquitectura y constraints de la base de datos PostgreSQL:
- Tabla `vessels` (Maestro Flota) con PK `vessel_id`.
- Tabla `routes` (Maestro Rutas) con PK compuesta `origin_port_id`, `destination_port_id`.
- Tabla `agency_matrix` (Matriz Aduanas) con PK compuesta `client_id`, `port_id`, `operation_type`.
- Tabla `contract_tariffs` (Matriz Comercial Fletes) con PK compuesta `client_id`, `destination_port_id`, `min_tonnage`, `max_tonnage`.
- Tabla transaccional `vessel_trips` (Viajes) con PK `trip_id` (UUID) y Foreign Keys apuntando a los maestros.

#### [NEW] `002_seed_data.sql`
Inserción estática de los datos requeridos para pasar el test unitario:
- Flota: B/T TABLONES, MOQUEGUA, M/N CONCON TRADER con sus respectivos `consumption_sea_ifo`, límites de carga/descarga y capacidades.
- Rutas: Ilo a Matarani, San Juan de Marcona, Mejillones y Callao.
- Agencia: Matriz de tarifas de SPCC (Ilo carga, Matarani descarga, etc).
- Fletes: Matriz de SPCC para los rangos de toneladas hacia Matarani, Marcona, Mejillones, Callao.

## Verification Plan

### Manual Verification
- Revisión en el SQL Editor de Supabase o ejecución local para verificar que la creación de las tablas y el volcado de datos iniciales no violan ninguna constraint (PK, FK o tipos de datos).
- Verificaremos con una query `SELECT` manual que los datos extraídos para el viaje "SPCC - Matarani - 13500 MT" corresponden exactamente a los inputs esperados en el test inamovible (ej. Flete $19.01).
