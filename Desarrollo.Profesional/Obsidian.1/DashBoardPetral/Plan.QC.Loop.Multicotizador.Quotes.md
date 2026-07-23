# 🔄 PLAN DE QC AUTÓNOMO Y PRUEBA DE CONVERGENCIA MULTICOTIZADOR & `ROUTES_QUOTES`

> **Fecha**: 2026-07-22  
> **Módulo**: Multicotizador Spot (Estimador Excel & Cálculos Detallados)  
> **Persistencia**: Supabase (`routes_clients` para Armazón Activo, `routes_quotes` para Armazón + Carne en JSONB)  
> **Script Objetivo**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\run_qc_multicotizador_quotes.py`

---

## 🎯 1. Propósito de la Suite de QC

Validar de forma autónoma (sin navegador / terminal no interactiva) la integridad matemática del **Multicotizador Spot** y la fidelidad del almacenamiento relacional de las cotizaciones en Supabase:

1. **Precisión de "Cálculos Detallados"**: Certificar que la sustitución matemática y fórmulas explicadas en la pestaña "Cálculos Detallados" coincidan 1:1 con los valores del Estimador Excel para rutas reales de **SPCC** y **NEXA**.
2. **Persistencia de la Carne en `routes_quotes`**: Probar que las cotizaciones creadas para **Prospectos** se inyecten correctamente en la tabla `routes_quotes` en la columna `legs_data` (`jsonb`) con toda la foto viva de mercado, y que al ser recuperadas y re-simuladas entreguen exactamente los mismos resultados ($\text{Diferencia} = \$0.0000$).

---

## 📐 2. Estructura de las Pruebas

### Fase 1 — Convergencia en Rutas Reales (`routes_clients`)
Se consultarán y simularán con el motor `spot_engine.py` las rutas activas de clientes regulares con el buque **MOQUEGUA**:

* `SPCC.ILO.MATARANI.ILO` (2 piernas, 138.0 NM)
* `SPCC.ILO.MARCONA.ILO` (2 piernas, 566.0 NM)
* `SPCC.ILO.MEJILLONES.ILO` (2 piernas, 670.0 NM)
* `NEXA.ILO.CALLAO.MATARANI.ILO` (3 piernas, 1,040.0 NM)
* `NEXA.ILO.CALLAO.MARCONA.ILO` (3 piernas, 1,051.0 NM)
* `NEXA.ILO.CALLAO.MEJILLONES.ILO` (3 piernas, 1,632.0 NM)

**Criterios de Aceptación:**
- Cada sustitución numérica (Días de mar por pierna, Días de puerto con overhead/posicionamiento, Ingresos de flete, Búnker IFO/MDO, Costos de agencia y P/L) DEBE coincidir con el resultado consolidado del motor.

---

### Fase 2 — Test de Cotizaciones de Prospectos (`routes_quotes`)
Se construirán **3 cotizaciones ficticias para prospectos** aplicando estrictamente las condiciones fijadas:

* **Volumen ($Q$)**: Estrictamente **$13,500\text{ MT}$**
* **Flete Base ($F$)**: Estrictamente **$\$30.00\text{ USD/MT}$**
* **Rutas Prospecto Generadas**:
  1. `PROSPECT.ILO.ANTOFAGASTA.ILO` (2 piernas: Ilo ➔ Antofagasta ➔ Ilo)
  2. `PROSPECT.ILO.VALPARAISO.ILO` (2 piernas: Ilo ➔ Valparaíso ➔ Ilo)
  3. `PROSPECT.ILO.SAN_ANTONIO.ILO` (2 piernas: Ilo ➔ San Antonio ➔ Ilo)

**Flujo de Validación:**
1. Construir el paquete completo de la carne:
   - Buque: `MOQUEGUA` ($11.0\text{ kts}$, $\text{TCE Req} = \$13,000.00\text{/d}$)
   - Precios Búnker: IFO $\$895.14\text{/t}$, MDO $\$1,460.30\text{/t}$
   - Comisiones: Address $2.5\%$, Broker $1.25\%$
   - Ritmos, Overheads y Maniobras por puerto.
2. Inyectar el payload en `routes_quotes` (`is_prospect = True`).
3. Consultar y recuperar el registro desde `routes_quotes`.
4. Re-ejecutar `calculate_multicotizador_simulation()` sobre los datos recuperados.
5. Comparar las 9 métricas financieras principales contra la primera ejecución:
   - Días Totales, Búnker USD, Puertos USD, Ingreso Neto USD, Voyage Result USD, TCE Real USD/d y P/L USD.
   - **Umbral de Aprobación**: $\Delta = \$0.0000$ en todas las métricas (`✅ PASS`).
6. Limpiar los registros de prueba temporales al finalizar la suite.

---

## 🛠️ 3. Ejecución del Script de QC

```powershell
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine
python run_qc_multicotizador_quotes.py
```

---

## 📋 4. Registro de Resultados y Ejecución Final (2026-07-22)

La suite autónoma de QC `run_qc_multicotizador_quotes.py` fue ejecutada exitosamente obteniendo **100% de aprobación (`✅ ALL SUITES PASSED`)**:

### 📊 Resumen por Fases:

| Fase | Ámbito de Prueba | Total Pruebas | Exitosas | Fallidas | Resultado |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Fase 1** | Convergencia Matemática en Rutas Reales (`routes_clients` - SPCC / NEXA) | 6 | 6 | 0 | `✅ PASS` |
| **Fase 2** | Persistencia y Recalculabilidad de Cotizaciones Multileg en `routes_quotes` ($13,500\text{ MT} \times \$30.00\text{/MT}$) | 3 | 3 | 0 | `✅ PASS` |
| **Fase 3** | Carga por API `GET /api/v1/forecast/spot/list` (Filtrado Activos vs. Prospectos) | 2 | 2 | 0 | `✅ PASS` |

### 🔍 Detalle por Ruta Probada en Fase 2 (Prospectos Multileg):
1. **Ruta 2 Piernas (`PROSPECT_2_LEGS`)**: Ilo ➔ Antofagasta ➔ Ilo  
   - $\text{Income} = \$405,000.00$, $\text{PnL Neto} = \$233,485.49$, $\Delta = \$0.0000$ `✅ PASS`
2. **Ruta 4 Piernas (`PROSPECT_4_LEGS`)**: Ilo ➔ Antofagasta ➔ Valparaíso ➔ San Antonio ➔ Ilo  
   - $\text{Income} = \$1,215,000.00$, $\text{PnL Neto} = \$715,108.97$, $\Delta = \$0.0000$ `✅ PASS`
3. **Ruta 5 Piernas (`PROSPECT_5_LEGS`)**: Ilo ➔ Antofagasta ➔ Coquimbo ➔ Valparaíso ➔ San Antonio ➔ Ilo  
   - $\text{Income} = \$1,620,000.00$, $\text{PnL Neto} = \$930,060.71$, $\Delta = \$0.0000$ `✅ PASS`

---

## 🎨 5. Validación Visual y Formato de Impresión PDF

1. **Maquetación "Cálculos Detallados"**:
   - Cabecera corporativa alineada con logos locales oficiales `Logo.Petral.png` y `Logo.Geeksoft.png`.
   - Título oficial: `PETRAL SMART DASHBOARD • MOTOR SPOT GEEKSOFT ENGINE`.
   - Bloque de consola con **Fondo Blanco/Gris Claro y Texto Negro**, reemplazando el estilo de terminal oscuro.
2. **Paginación e Impresión PDF (`handlePrintCalculosDetalladosHtml`)**:
   - Regla CSS `page-break-inside: avoid !important; break-inside: avoid !important;` aplicada a `table.metrics-table` y `.metrics-block`.
   - Garantiza que la **Tabla Oficial de 12 Métricas** al pie se traslade como un bloque sólido e indivisible a la Página 2 en cotizaciones multileg de 4 y 5 piernas.

