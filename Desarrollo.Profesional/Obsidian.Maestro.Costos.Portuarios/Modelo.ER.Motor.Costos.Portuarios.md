# 📊 Modelo Entidad - Relación (E-R): Motor Dinámico de Costos Portuarios

> **Ubicación en Bóveda**: `Obsidian.Maestro.Costos.Portuarios/Modelo.ER.Motor.Costos.Portuarios.md`
> **Propósito**: Especificar la arquitectura de base de datos relacional y la estructura dinámica `JSONB` que soportan el **Motor de Gastos Portuarios** (Etapa 1: Proyecciones Realistas | Etapa 2: Auditoría y Liquidación de Cuentas de Agencia).
> **Principio de Diseño**: Modelo normalizado relacional híbrido. Las entidades fijas (puertos, terminales, proveedores, rubros) forman la estructura SQL, mientras que las reglas complejas (horarios, procedencias, indexaciones Brent, volumen) se almacenan en la columna dinámico-estructurada **`tariffs (JSONB)`**.

---

## 📐 1. Diagrama Entidad - Relación (Mermaid ERD)

```mermaid
erDiagram
    PORTS ||--o{ TERMINALS : "posee"
    PORTS ||--o{ PORT_COSTS_MATRIX : "registra reglas"
    TERMINALS ||--o{ PORT_COSTS_MATRIX : "aplica tarifas"
    SUPPLIERS ||--o{ PORT_COSTS_MATRIX : "presta servicio"
    COST_CONCEPTS ||--o{ PORT_COSTS_MATRIX : "clasifica concepto"
    
    PORTS ||--o{ VESSEL_TERMINAL_OPERATIONS : "registra ritmo"
    TERMINALS ||--o{ VESSEL_TERMINAL_OPERATIONS : "limita ritmo"
    VESSELS ||--o{ VESSEL_TERMINAL_OPERATIONS : "opera con ritmo"

    PORTS {
        varchar port_id PK "Ej: CALLAO, MARCONA, MATARANI, ILO"
        varchar port_name "Nombre comercial del puerto"
        varchar country "Código ISO: PE, CL, EC"
        numeric lat "Latitud geográfica"
        numeric lon "Longitud geográfica"
    }

    TERMINALS {
        varchar terminal_id PK "Ej: APM, TISUR, ENAPU, TPM"
        varchar port_id FK "Puerto al que pertenece"
        varchar terminal_name "Nombre completo del muelle"
        numeric max_load_rate "Ritmo máx carga (MT/h)"
        numeric max_disch_rate "Ritmo máx descarga (MT/h)"
        numeric max_draft "Calado máximo (m)"
        numeric max_loa "Eslora máxima (m)"
        numeric time_to_count_carga_hrs "Time to count carga (hrs)"
        numeric time_to_count_descarga_hrs "Time to count descarga (hrs)"
        numeric maneuver_carga_hrs "Maniobra extra carga (hrs)"
        numeric maneuver_descarga_hrs "Maniobra extra descarga (hrs)"
        boolean is_active "Flag de estado operativo"
    }

    SUPPLIERS {
        uuid supplier_id PK "DEFAULT gen_random_uuid()"
        varchar supplier_name "Ej: Trans Total, Petranso, APM Terminals, MGP, Sanidad"
        boolean is_active "Flag de proveedor activo"
    }

    COST_CONCEPTS {
        varchar concept_id PK "Ej: Pilotage_IN, Towage_OUT, Dockage_APM"
        varchar concept_name "Nombre comercial del rubro"
        varchar category "CHECK (category IN ('shifting', 'general_port', 'agency'))"
        varchar default_calculation_type "FIXED, VARIABLE_TIME, VARIABLE_TONS"
    }

    PORT_COSTS_MATRIX {
        uuid rule_id PK "DEFAULT gen_random_uuid()"
        varchar port_id FK "Puerto de la regla"
        varchar terminal FK "Terminal específico o GENERAL"
        varchar operation_type "CHECK (operation_type IN ('CARGA', 'DESCARGA'))"
        varchar vessel_id FK "DEFAULT o ID del buque específico"
        varchar concept_id FK "Concepto maestro del costo"
        varchar sub_item_name "Sub-ítem descriptivo (Ej: Practicaje Ingreso Pilotage IN)"
        uuid supplier_id FK "Proveedor / Agencia vinculada"
        varchar multiplier_source "CHECK (multiplier_source IN ('FIXED', 'PER_QTY', 'LOA', 'TRB', 'DWT', 'PORT_HOURS', 'CARGO_TONS'))"
        numeric rate_usd "Tarifa base unitaria en USD"
        numeric cost "Costo consolidado de referencia"
        text calculation_formula_template "Plantilla explicativa matemática (Al lado de la tarifa)"
        boolean allow_pass_through "Toggle: Cobrado al cliente (PT)"
        boolean is_optional "Toggle: Solo si requiere (OPC)"
        jsonb tariffs "Columna JSONB con reglas F1, F2, Brent y Volumen"
    }

    VESSELS {
        varchar vessel_id PK "Ej: MOQUEGUA, TABLONES, HUEMUL, CONCON"
        varchar vessel_name "Nombre comercial de la nave"
        numeric loa "Eslora total (m)"
        numeric beam "Manga (m)"
        numeric draft "Calado operativo (m)"
        numeric grt "Gross Register Tonnage"
        numeric dwt "Deadweight Tonnage"
        numeric dwcc "Deadweight Cargo Capacity"
    }

    VESSEL_TERMINAL_OPERATIONS {
        varchar port_id PK, FK "Puerto de la operación"
        varchar terminal_id PK, FK "Terminal de la operación"
        varchar vessel_id PK, FK "Buque asignado"
        numeric ritmo_carga "Ritmo operativo de carga (MT/h)"
        numeric ritmo_descarga "Ritmo operativo de descarga (MT/h)"
        numeric amarre_hrs "Horas de posicionamiento/amarre"
        numeric desamarre_hrs "Horas de desamarre"
        numeric time_to_count_carga_hrs "Time to count carga por buque (hrs)"
        numeric time_to_count_descarga_hrs "Time to count descarga por buque (hrs)"
        numeric maneuver_carga_hrs "Horas de maniobra extra carga por buque"
        numeric maneuver_descarga_hrs "Horas de maniobra extra descarga por buque"
        int tugboats_in "Remolcadores Ingreso / Atraque (IN)"
        int tugboats_out "Remolcadores Salida / Desatraque (OUT)"
    }
```

---

## 🏛️ 2. Especificación Detallada de Tablas y Atributos

### 2.1. Tabla: `ports` (Maestro de Puertos)
* `port_id` *(VARCHAR, PK)* → Identificador único (`'CALLAO'`, `'MARCONA'`, `'MATARANI'`, `'ILO'`).
* `port_name` *(VARCHAR, NOT NULL)* → Nombre comercial (ej: "Puerto del Callao").
* `country` *(VARCHAR(2), NOT NULL, DEFAULT 'PE')* → Código ISO (`'PE'`, `'CL'`, `'EC'`).
* `lat` *(NUMERIC)* → Latitud.
* `lon` *(NUMERIC)* → Longitud.

---

### 2.2. Tabla: `terminals` (Maestro de Terminales Físicos)
* `terminal_id` *(VARCHAR, PK)* → Identificador único (`'APM'`, `'TISUR'`, `'ENAPU'`, `'TPM'`).
* `port_id` *(VARCHAR, PK, FK → ports.port_id)*
* `terminal_name` *(VARCHAR, NOT NULL)* → Nombre descriptivo.
* `max_load_rate` *(NUMERIC, DEFAULT 9999)* → Ritmo máx carga (MT/h).
* `max_disch_rate` *(NUMERIC, DEFAULT 9999)* → Ritmo máx descarga (MT/h).
* `max_draft` *(NUMERIC, DEFAULT 9999)* → Calado máximo (m).
* `max_loa` *(NUMERIC, DEFAULT 9999)* → Eslora máxima (m).
* `time_to_count_carga_hrs` *(NUMERIC, DEFAULT 6.0)*
* `time_to_count_descarga_hrs` *(NUMERIC, DEFAULT 6.0)*
* `maneuver_carga_hrs` *(NUMERIC, DEFAULT 2.0)*
* `maneuver_descarga_hrs` *(NUMERIC, DEFAULT 2.0)*
* `is_active` *(BOOLEAN, DEFAULT TRUE)*

---

### 2.3. Tabla: `suppliers` (Maestro de Proveedores / Agencias Marítimas)
* `supplier_id` *(UUID, PK, DEFAULT gen_random_uuid())*
* `supplier_name` *(VARCHAR, NOT NULL)* → Nombre comercial (`"Trans Total"`, `"Petranso"`, `"APM Terminals"`, `"Hidrografía / MGP"`, `"Sanidad Marítima"`).
* `is_active` *(BOOLEAN, DEFAULT TRUE)*

---

### 2.4. Tabla: `port_costs_matrix` (`PORT_COST_RULES` — Motor Dinámico de Reglas)
* `rule_id` *(UUID, PK, DEFAULT gen_random_uuid())*
* `port_id` *(VARCHAR, NOT NULL, FK → ports.port_id)*
* `terminal` *(VARCHAR, NOT NULL, DEFAULT 'GENERAL')*
* `operation_type` *(VARCHAR, NOT NULL, CHECK (operation_type IN ('CARGA', 'DESCARGA')))*
* `vessel_id` *(VARCHAR, NOT NULL, DEFAULT 'DEFAULT')*
* `concept_id` *(VARCHAR, NOT NULL, FK → cost_concepts.concept_id)*
* `sub_item_name` *(VARCHAR)* → Nombre oficial del ítem.
* `supplier_id` *(UUID, FK → suppliers.supplier_id)* → Proveedor / Agencia vinculada.
* `multiplier_source` *(VARCHAR)* → Multiplicador base (`FIXED`, `LOA`, `TRB`, etc.).
* `rate_usd` *(NUMERIC, DEFAULT 0)* → Tarifa unitaria base.
* `calculation_formula_template` *(TEXT)* → Plantilla explicativa matemática mostrada al lado.
* `allow_pass_through` *(BOOLEAN, DEFAULT FALSE)* → Toggle *Pass Through* (PT).
* `is_optional` *(BOOLEAN, DEFAULT FALSE)* → Toggle *Opcional* (OPC).
* **`tariffs` *(JSONB, NOT NULL, DEFAULT '{}')*** → **Columna dinámico-estructurada JSONB.**
