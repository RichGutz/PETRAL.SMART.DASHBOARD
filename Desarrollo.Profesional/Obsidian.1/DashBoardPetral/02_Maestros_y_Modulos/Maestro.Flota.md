

# 🚢 Maestro — Flota y Capacidad (Perfil Técnico de Naves)

Este archivo maestro indexa las especificaciones de ingeniería, velocidades operativas, capacidades de bombeo/recepción y consumos diarios de bunker de cada embarcación. Estos valores alimentan de forma directa el cálculo automático de `total_bunker_costs` y la duración del viaje en el motor de P&L de **Geeksoft**.

## 📦 1. B/T TABLONES

- **vessel_id:** "TABLONES"
- **vessel_name:** "B/T TABLONES"
- **imo_number:** "9043093"
- **ownership_type:** "Propio"
- **flag:** "PERUANA"
- **built:** 2003
- **dwt:** 16533 // Deadweight Tonnage (Tonelaje de peso muerto total)
- **dwcc:** 13500 // Deadweight Cargo Capacity (Toneladas útiles reales de carga)
- **cbm:** 0 // Cubic Meters
- **loa:** 158.11 // Length Overall
- **beam:** 0 // Manga
- **draft:** 0 // Calado
    
- **vessel_speed:** 11.0 // Velocidad promedio de navegación en nudos
    

### ⚙️ Límites Físicos e Hidrodinámicos a Bordo (Variables de Control)

- **vessel_max_load_intake_limit:** 500.0 // MT/hora (Límite físico seguro de recepción en el manifold)
    
- **vessel_pump_discharge_rate:** 450.0 // MT/hora (Capacidad nominal máxima de sus bombas de carga a bordo)
    

### ⛽ Parámetros de Consumo (Bunker Principal: IFO)

- **bunker_consumption_sea_ifo:** 14.5 // Toneladas Métricas (MT) consumidas por día navegando
- **bunker_consumption_idle_ifo:** 3.5 // MT consumidas por día en espera
- **bunker_consumption_load_ifo:** 3.5 // MT consumidas por día cargando
- **bunker_consumption_disch_ifo:** 5.0 // MT consumidas por día descargando
- **bunker_consumption_sea_mdo:** 0.0 // MDO navegando
- **bunker_consumption_idle_mdo:** 0.0 // MDO
- **bunker_consumption_load_mdo:** 0.0 // MDO
- **bunker_consumption_disch_mdo:** 0.0 // MDO

> [!IMPORTANT]
> Estas variables granulares de consumo en puerto y navegación son obligatorias en la DB de Supabase para calcular la rentabilidad precisa del viaje (Voyage Result). El motor P&L ignorará variables faltantes, asumiendo 0.

### 🛡️ Capacidades de Almacenamiento (ROB Inicial Máximo)

- **bunker_capacity_ifo:** 500.0 // MT de capacidad máxima en tanques
    
- **bunker_capacity_mdo:** 0.0 // MT (Monobunker IFO para efectos de este contrato)
    

## 📦 2. B/T MOQUEGUA

- **vessel_id:** "MOQUEGUA"
- **vessel_name:** "B/T MOQUEGUA"
- **imo_number:** "9262869"
- **ownership_type:** "Propio"
- **flag:** "PERUANA"
- **dwt:** 14298 // Deadweight Tonnage
- **dwcc:** 13500 // Deadweight Cargo Capacity (Toneladas útiles reales de carga)
- **cbm:** 0
- **loa:** 134.00
- **beam:** 0
- **draft:** 0
    
- **vessel_speed:** 12.0 // Velocidad promedio de navegación en nudos (Diseño optimizado)
    

### ⚙️ Límites Físicos e Hidrodinámicos a Bordo (Variables de Control)

- **vessel_max_load_intake_limit:** 500.0 // MT/hora (Estimado estándar de recepción)
    
- **vessel_pump_discharge_rate:** 400.0 // MT/hora (Capacidad máxima estimada de bombeo del buque)
    

### ⛽ Parámetros de Consumo (Sistema Dual: Bunker IFO + MDO)

- **bunker_consumption_sea_ifo:** 15.0 // Toneladas Métricas (MT) consumidas por día navegando (Estimado)
    
- **bunker_consumption_idle_ifo:** 4.0 // MT consumidas por día en espera
- **bunker_consumption_load_ifo:** 4.0 // MT consumidas por día cargando
- **bunker_consumption_disch_ifo:** 5.5 // MT consumidas por día descargando
- **bunker_consumption_idle_mdo:** 1.0 // MT de MDO en espera
- **bunker_consumption_load_mdo:** 1.0 // MT de MDO cargando
- **bunker_consumption_disch_mdo:** 1.5 // MT de MDO descargando
    

### 🛡️ Capacidades de Almacenamiento (ROB Inicial Máximo)

- **bunker_capacity_ifo:** 400.0 // MT de capacidad máxima en tanques
    
- **bunker_capacity_mdo:** 80.0 // MT de capacidad máxima en tanques de Diésel
    

## 📦 3. M/N CONCON TRADER

- **vessel_id:** "CONCON_TRADER"
- **vessel_name:** "M/N CONCON TRADER"
- **imo_number:** "9800037"
- **ownership_type:** "Charteado"
- **flag:** "PANAMA"
- **built:** 2018
- **dwt:** 19823 // Deadweight Tonnage
- **dwcc:** 19000 // Deadweight Cargo Capacity (Toneladas útiles reales de carga)
- **cbm:** 0
- **loa:** 146.00
- **beam:** 0
- **draft:** 0
    
- **vessel_speed:** 11.0 // Velocidad promedio de navegación en nudos
    

### ⚙️ Límites Físicos e Hidrodinámicos a Bordo (Variables de Control)

- **vessel_max_load_intake_limit:** 600.0 // MT/hora (Líneas modernas de alta resistencia)
    
- **vessel_pump_discharge_rate:** 500.0 // MT/hora (Bombas centrífugas modernas de alta eficiencia)
    

### ⛽ Parámetros de Consumo (Eficiencia Energética Post-2015)

- **bunker_consumption_sea_ifo:** 14.0 // Toneladas Métricas (MT) consumidas por día navegando (0.5 MT más eficiente en mar abierto)
    
- **bunker_consumption_idle_ifo:** 3.5 // MT consumidas por día en espera
- **bunker_consumption_load_ifo:** 3.5 // MT consumidas por día cargando
- **bunker_consumption_disch_ifo:** 5.0 // MT consumidas por día descargando
- **bunker_consumption_idle_mdo:** 0.0 // MDO
- **bunker_consumption_load_mdo:** 0.0 // MDO
- **bunker_consumption_disch_mdo:** 0.0 // MDO
    

### 🛡️ Capacidades de Almacenamiento (ROB Inicial Máximo)

- **bunker_capacity_ifo:** 500.0 // MT de capacidad máxima estándar
    
- **bunker_capacity_mdo:** 0.0 // MT (Monobunker IFO para efectos de este contrato)
    

## 📦 4. B/T HUEMUL

- **vessel_id:** "HUEMUL"
- **vessel_name:** "B/T HUEMUL"
- **imo_number:** "9371775"
- **ownership_type:** "Charteado"
- **flag:** "CHILE"
- **built:** 2008
- **dwt:** 22062 // Deadweight Tonnage
- **cbm:** 0
- **loa:** 161.00
- **beam:** 0
- **draft:** 0
    
- **vessel_speed:** 12.0 // Velocidad promedio
    
### ⚙️ Límites Físicos e Hidrodinámicos a Bordo
- **vessel_max_load_intake_limit:** 600.0 // MT/hora
- **vessel_pump_discharge_rate:** 500.0 // MT/hora
    
### ⛽ Parámetros de Consumo
- **bunker_consumption_sea_ifo:** 15.0 // MT
- **bunker_consumption_idle_ifo:** 3.5 // MT
- **bunker_consumption_load_ifo:** 3.5 // MT
- **bunker_consumption_disch_ifo:** 5.0 // MT
- **bunker_consumption_idle_mdo:** 0.0 // MDO
- **bunker_consumption_load_mdo:** 0.0 // MDO
- **bunker_consumption_disch_mdo:** 0.0 // MDO

### 🛡️ Capacidades de Almacenamiento
- **bunker_capacity_ifo:** 500.0 // MT
- **bunker_capacity_mdo:** 100.0 // MT

## 🔗 Relaciones Lógicas en Obsidian

- Esta nota es un insumo crítico para el formulario transaccional de `[[Módulo UI - Ingreso Rápido de Viaje]]`.
    
- Aporta las variables de consumo, intake y bombeo requeridas en la nota del backend: `[[Cálculo P&L - Step 3 - Egresos Bunker]]`.
    

## 💡 Instrucción de Contexto para el Agente (Antigravity IDE):

> "Cuando el usuario seleccione un buque en el frontend (`vessel_name`), el sistema debe realizar un lookup en esta nota y extraer los valores correspondientes de `vessel_speed`, `vessel_max_load_intake_limit`, `vessel_pump_discharge_rate` y todos los consumos granulares de puerto y mar (`bunker_consumption_sea_ifo/mdo`, `bunker_consumption_idle_ifo/mdo`, `bunker_consumption_load_ifo/mdo`, `bunker_consumption_disch_ifo/mdo`) como argumentos para el objeto JSON que procesa el Unit Economics por viaje.
> 
> ### Lógica Global del Tablero de 6 Variables e Intersección Relacional:
> 
> El motor matemático del backend debe cruzar un tablero de 6 variables (Carga y descarga del Puerto, del Barco y del Cliente) aplicando las siguientes reglas estrictas de mínimos y fallback:
> 
> 1. **Fase de Carga (Origen):** `actual_load_rate = MIN(contract_agreed_load_rate, vessel_max_load_intake_limit, max_terminal_load_rate)`
>     
>     - _Regla de Fallback:_ Si no se coloca la tasa pactada del cliente (`contract_agreed_load_rate` es nulo o vacío), el sistema ignorará esa capa comercial y calculará el flujo usando automáticamente **la menor tasa física entre el barco y el puerto**.
>         
> 2. **Fase de Descarga (Destino):** `actual_discharge_rate = MIN(contract_agreed_discharge_rate, vessel_pump_discharge_rate, port_max_discharge_limit)`
>     
>     - _Regla de Fallback:_ Si no se coloca la tasa pactada de descarga del cliente, el sistema ejecutará el fallback automático usando **el menor valor físico entre la bomba de carga del barco y la tubería de recepción de tierra**."
>