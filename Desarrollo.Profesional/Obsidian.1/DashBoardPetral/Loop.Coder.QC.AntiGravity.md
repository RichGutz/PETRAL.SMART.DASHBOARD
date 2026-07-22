# 🔄 LOOP AUTÓNOMO DE QC & GENERACIÓN DE ACTA PDF (ANTIGRAVITY ENGINE)

> **Estado**: 100% OPERATIVO & AUTOMATIZADO  
> **Ubicación del Script**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\run_qc_loop_pdf.py`  
> **Ejecución**: Terminal no interactiva Python (Sin navegador / `browser_subagent`)  

---

## 1. ⚙️ Propósito del QC Loop Autónomo

El script `run_qc_loop_pdf.py` actúa como un bucle autónomo de Control de Calidad (QC) y auditoría continua. Su objetivo es:

1. Consultar de forma automática todas las rutas comerciales registradas en Supabase (`routes_clients`).
2. Ejecutar la simulación matemática en `backend.spot_engine` para el buque `MOQUEGUA`.
3. Validar de forma estricta los 4 criterios de aceptación financiera y operativa.
4. Generar el documento PDF oficial `ACTA_AUDITORIA_FINAL_RUTAS_SPCC_NEXA.pdf` con maquetación de consola en Blanco y Negro horizontal (`A4 Landscape`), con 1 ruta por página, logos corporativos PETRAL/GEEKSOFT y la tabla de 12 métricas.

---

## 2. 🛡️ Los 4 Criterios Estrictos de Validación QC

Cada ruta simulará de forma autónoma y será aprobada (`✅ QC PASSED`) solo si cumple el 100% de las siguientes reglas de negocio:

| # | Regla de Validación | Descripción / Umbral | Estado |
| :-: | :--- | :--- | :-: |
| **1** | **Costo Mínimo de Búnker** | Si la distancia total es $> 500\text{ NM}$, el costo total de búnker DEBE ser $> \$20,000\text{ USD}$. | `PASS` |
| **2** | **Aislamiento de Lastre** | En piernas en lastre (`BALLAST`), los costos portuarios de agencia DEBEN ser exactamente $\$0.00\text{ USD}$. | `PASS` |
| **3** | **Tarifa Puerto Mejillones** | En rutas que descargan en Mejillones (Chile), el costo de agencia DEBE ser $\ge \$45,000\text{ USD}$ (Tarifa Real: $\$50,000.00\text{ USD}$). | `PASS` |
| **4** | **Flete en Piernas Cargadas** | En piernas cargadas (`LADEN`), el ingreso por flete DEBE ser $> \$0.00\text{ USD}$ (calculado con tarifa real de contrato). | `PASS` |

---

## 3. 📊 Matriz de Resultados del QC Loop (100% Aprobado)

| Cliente | Nombre de Ruta | Piernas | Distancia (NM) | Búnker (USD) | Puertos (USD) | Ingreso Flete (USD) | PnL Neto (USD) | TCE Real (USD/d) | Resultado QC |
| :--- | :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **NEXA** | `NEXA.ILO.CALLAO.MEJILLONES.ILO` | 3 | 1,632.0 | $92,192.11 | $81,327.99 | $375,000.00 | $201,479.90 | $17,045.75 | `✅ PASSED` |
| **NEXA** | `NEXA.ILO.CALLAO.MATARANI.ILO` | 3 | 1,061.0 | $62,795.53 | $48,327.99 | $405,000.00 | $293,876.48 | $39,268.49 | `✅ PASSED` |
| **NEXA** | `NEXA.ILO.CALLAO.MARCONA.ILO` | 3 | 1,051.0 | $62,233.73 | $71,327.99 | $344,250.00 | $210,688.28 | $28,480.65 | `✅ PASSED` |
| **SPCC** | `SPCC.ILO.MATARANI` | 1 | 93.0 | $5,224.72 | $48,327.99 | $344,250.00 | $290,697.29 | $99,742.66 | `✅ PASSED` |
| **SPCC** | `SPCC.ILO.MARCONA` | 1 | 283.0 | $13,836.90 | $71,327.99 | $344,250.00 | $259,085.11 | $65,584.81 | `✅ PASSED` |
| **SPCC** | `SPCC.ILO.MEJILLONES` | 1 | 288.0 | $14,117.70 | $65,000.00 | $344,250.00 | $265,132.30 | $66,664.12 | `✅ PASSED` |

---

## 4. 🖥️ Algoritmo del Script `run_qc_loop_pdf.py`

```python
# Comandos de ejecución autónoma en terminal (no interactiva)
python run_qc_loop_pdf.py
```

El script realiza los siguientes pasos:
1. Conecta con Supabase y consulta `routes_clients` y `vessels`.
2. Asigna las tarifas contractuales reales ($F$) y tarifas portuarias reales ($PORT\_COSTS\_MASTER$).
3. Simula la matemática completa usando `spot_engine.calculate_multicotizador_simulation`.
4. Construye la ficha monoespaciada en Blanco y Negro con las 4 secciones:
   - Cabecera con logos PETRAL (izquierda) y GEEKSOFT (derecha) en tabla HTML 100% ancho.
   - Cards 1 a 4 con variables de origen.
   - Caja Fishbowl consolidada y sustitución visual pierna por pierna.
   - Tabla de las 12 Métricas de Auditoría Ledger al pie (anchos +20%).
5. Compila el PDF usando `weasyprint.HTML(string=html).write_pdf(output_filename)` en orientación `A4 landscape`.
6. Deposita el PDF en `Obsidian Vault` y en la `Raíz del Proyecto`.

---

## 5. 📂 Protocolo de Guardado y Entregables Locales

El script genera de forma invariable los siguientes artefactos:

- **PDF en Obsidian Vault**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.1\DashBoardPetral\ACTA_AUDITORIA_FINAL_RUTAS_SPCC_NEXA.pdf`
- **PDF en Raíz de Proyecto**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\ACTA_AUDITORIA_FINAL_RUTAS_SPCC_NEXA.pdf`
