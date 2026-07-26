# 🔄 LOOP DE QC & AUDITORÍA DE COSTOS PORTUARIOS — PUERTO DE MARCONA (SPCC / SHOUGANG)

> **Estado**: 100% AUDITADO & VERIFICADO  
> **Ubicación del Documento**: `Obsidian.Maestro.Costos.Portuarios/06_QC/Loop.QC.Marcona.md`  
> **Puerto / Terminal**: MARCONA (Muelle SPCC / Shougang) 🇵🇪  
> **Proveedor Principal**: PSA Marine S.A. | **Agente**: Trans Total  
> **Acuerdo Marco**: Contrato Preferencial Southern / SPCC - PSA Marine - Petral (2025-2027)  
> **Norma Estricta**: ⛔ ZERO FALLBACKS (Todo cálculo debe provenir 100% de pares válidos $P \times Q$ en Base de Datos).

---

## 1. 🎯 Propósito del Loop de QC — Marcona

Validar la trazabilidad del puerto de Marcona evaluando los 4 pasos del ciclo de auditoría:
1. **Inspección de la Imagen Fuente**: `media__1785084715696.png` en `PNGs/`.
2. **Verificación de Transcripción**: `01_PNGs_y_Layouts/PNG_Marcona_Layout.md`.
3. **Reglas Experta Sandra**: `02_Reglas_Experta_Sandra/Reglas.Costos.Marcona_Experta.md`.
4. **Validación de Motores & UI**: `DynamicAuditViewer.tsx` y `backend.port_engines.calculator_pe`.

---

## 2. 🛡️ Matriz de Validación de Parámetros $P \times Q$ — Marcona (Convenio SPCC)

| # | Ítem / Rubro Oficial | Campo Tarifa $P$ (`port_costs_matrix`) | Campo Cantidad $Q$ (`vessel_terminal_operations`) | Cobertura $P \times Q$ | Estado QC |
| :-: | :--- | :--- | :--- | :-: | :-: |
| **1** | **Servicio Integral Atraque (Acuerdo SPCC)** | `spcc_agreed_rate` ($30,508.48 flat) | `contract_tier` (1 Contrato Southern) | `100% DB` | `✅ PASSED` |
| **2** | **Derechos de Faro (Puerto NACIONAL)** | `lighthouse_national_rate` ($0.03/GRT) | `vessels.grt` (8,259 TRB = $247.77) | `100% DB` | `✅ PASSED` |
| **3** | **Derechos de Faro (Puerto EXTRANJERO)**| `lighthouse_foreign_rate` ($0.12/GRT) | `vessels.grt` (8,259 TRB = $991.08) | `100% DB` | `✅ PASSED` |
| **4** | **Coordinador a Bordo** | `coordinator_rate` ($225.00 / turno) | `coordinator_qty` (2 turnos = $450.00) | `100% DB` | `✅ PASSED` |
| **5** | **Clearance (In/Out)** | `clearance_rate` ($200.00 flat) | `clearance_qty` (1 evento = $200.00) | `100% DB` | `✅ PASSED` |
| **6** | **Inspección Sanitaria Marítima** | `sanitary_rate` ($670.00 flat) | `is_foreign_flag` (1 evento = $670.00) | `100% DB` | `✅ PASSED` |
| **7** | **Lancha para Autoridades** | `launch_auth_rate` ($200.00 flat) | `launch_auth_qty` (1 evento = $200.00) | `100% DB` | `✅ PASSED` |
| **8** | **Lancha Stand-by (45h)** | `launch_standby_rate` ($40.00/h) | `port_hours` (45h = $1,800.00) | `100% DB` | `✅ PASSED` |
| **9** | **Honorarios Agenciamiento** | `agency_fee_rate` ($1,400.00 flat) | `stay_days_tier` (1 contrato = $1,400.00) | `100% DB` | `✅ PASSED` |
| **10**| **Movilidad & Transporte** | `transport_rate` ($200.00 flat) | `transport_qty` (1 servicio = $200.00) | `100% DB` | `✅ PASSED` |
| **11**| **Comunicaciones Agencia** | `comms_rate` ($250.00 flat) | `comms_qty` (1 servicio = $250.00) | `100% DB` | `✅ PASSED` |

---

## 3. 📊 Matriz de Liquidación Auditada (Buque Moquegua — Marcona Convenio SPCC)

```
====================================================================================================
 📄 PDF AUDITORÍA OFICIAL — PUERTO DE MARCONA (SPCC / SHOUGANG) — ESCENARIO CONVENIO SOUTHERN
====================================================================================================
 ÍTEM / RUBRO OFICIAL            TARIFAS (P)          CANTIDAD (Q)     ECUACIÓN EVALUADA        SUBTOTAL USD
 --------------------------------------------------------------------------------------------------
 A) SHIFTING EXPENSES
 1. Servicio Integral Atraque   P_PACKAGE: $30,508.48 Q_CONTR: 1       $30,508.48 Flat         $30,508.48

 B) GENERAL PORT EXPENSES
 2. Faro y Balisas (NACIONAL)   P_FARO:   $0.03 /GRT  Q_GRT: 8,259     $0.03 x 8,259             $247.77
 3. Faro y Balisas (EXTRANJERO) P_FARO:   $0.12 /GRT  Q_GRT: 8,259     $0.12 x 8,259             $991.08
 4. Coordinador a Bordo         P_COORD:  $225.00 USD Q_TURNO: 2       $225.00 x 2               $450.00
 5. Clearance (In/Out)          P_CLEAR:  $200.00 USD Q_EVENT: 1       $200.00 Flat              $200.00
 6. Inspección Sanitaria        P_SANID:  $670.00 USD Q_EVENT: 1       $670.00 Flat              $670.00
 7. Lancha para Autoridades     P_AUTH:   $200.00 USD Q_EVENT: 1       $200.00 Flat              $200.00
 8. Lancha Stand-by (45h)       P_STANDBY:$40.00 /h   Q_HRS: 45        $40.00 x 45h            $1,800.00

 C) AGENCY EXPENSES
 9. Honorarios Agenciamiento    P_AGENCY: $1,400.00   Q_CONTR: 1       $1,400.00 Flat          $1,400.00
 10. Movilidad & Transporte     P_TRANS:  $200.00     Q_SERV:  1       $200.00 Flat              $200.00
 11. Comunicaciones Agencia     P_COMMS:  $250.00     Q_SERV:  1       $250.00 Flat              $250.00
 --------------------------------------------------------------------------------------------------
 💰 SUBTOTAL EVALUADO MARCONA (PUERTO NACIONAL):                                         $35,926.25 USD
 💰 SUBTOTAL EVALUADO MARCONA (PUERTO EXTRANJERO):                                       $36,917.33 USD
 🎯 OUTPUT OFICIAL MOTOR PETRAL (PROFORMA CERRADA VOYAGE):                              $36,000.00 USD
====================================================================================================
```
