# 🔄 LOOP DE QC & AUDITORÍA DE COSTOS PORTUARIOS — PUERTO DE MATARANI (TISUR S.A.)

> **Estado**: 100% AUDITADO & VERIFICADO  
> **Ubicación del Documento**: `Obsidian.Maestro.Costos.Portuarios/06_QC/Loop.QC.Matarani.md`  
> **Terminal Portuario**: Tisur S.A. (Matarani) 🇵🇪  
> **Operador Portuario**: Tisur | **Prácticos/Remolques**: PSA Marine | **Agente**: Trans Total  
> **Tipo de Cambio Referencia**: 3.42 S/ por USD  
> **Norma Estricta**: ⛔ ZERO FALLBACKS (Todo cálculo debe provenir 100% de pares válidos $P \times Q$ en Base de Datos).

---

## 1. 🎯 Propósito del Loop de QC — Matarani

Validar la trazabilidad del puerto de Matarani (Tisur) evaluando los 4 pasos del ciclo de auditoría:
1. **Inspección de la Imagen Fuente**: `Matarani_Tisur.png` en `PNGs/`.
2. **Verificación de Transcripción**: `01_PNGs_y_Layouts/PNG_Matarani_Layout.md`.
3. **Reglas Experta Sandra**: `02_Reglas_Experta_Sandra/Reglas.Costos.Matarani_Experta.md`.
4. **Validación de Motores & UI**: `DynamicAuditViewer.tsx` y `backend.port_engines.calculator_pe`.

---

## 2. 🛡️ Matriz de Validación de Parámetros $P \times Q$ — Matarani (Tisur)

| # | Ítem / Rubro | Campo Tarifa $P$ (`port_costs_matrix`) | Campo Cantidad $Q$ (`vessel_terminal_operations`) | Cobertura $P \times Q$ | Estado QC |
| :-: | :--- | :--- | :--- | :-: | :-: |
| **1** | **Servicio Integral PSA (Addenda)** | `psa_addenda_rate` ($3,368.00 / maniobra) | `psa_maneuver_qty` (2 maniobras = $6,736.00) | `100% DB` | `✅ PASSED` |
| **2** | **Acceso Tisur** | `access_tisur_rate` ($70.00 / maniobra) | `access_tisur_qty` (4 accesos = $280.00) | `100% DB` | `✅ PASSED` |
| **3** | **Linesmen (Amarre y Desamarre)** | `linesmen_rate` ($357.30 flat) | `linesmen_qty` (1 servicio) | `100% DB` | `✅ PASSED` |
| **4** | **Terminal Fee / Port Toll** | `terminal_fee_rate` ($75.00 / maniobra) | `terminal_fee_qty` (2 maniobras = $150.00) | `100% DB` | `✅ PASSED` |
| **5** | **Derechos de Faro (Nacional)** | `lighthouse_national_rate` ($0.03/GRT) | `vessels.grt` (8,259 TRB) | `100% DB` | `✅ PASSED` |
| **6** | **Muellaje Tisur S.A.** | `dockage_tisur_rate` ($0.65/LOA/h) | `vessels.loa` (134.16m) × `total_hours` (33h) | `100% DB` | `✅ PASSED` |
| **7** | **Lanchas Autoridades (Min 2h)** | `launch_auth_rate` ($155.00/lancha) | `launch_auth_qty` (2 lanchas = $310.00) | `100% DB` | `✅ PASSED` |
| **8** | **Inspección Sanitaria (Tisur)** | `sanitary_rate` ($670.00 flat) | `is_foreign_flag` (1 evento) | `100% DB` | `✅ PASSED` |
| **9** | **Clearance (In/Out)** | `clearance_rate` ($200.00 flat) | `clearance_qty` (1 evento) | `100% DB` | `✅ PASSED` |
| **10**| **Coordinador a Bordo** | `coordinator_rate` ($225.00/turno) | `coordinator_qty` (2 turnos = $450.00) | `100% DB` | `✅ PASSED` |
| **11**| **Honorarios Agenciamiento**| `agency_fee_rate` ($1,100.00 flat) | `stay_days_tier` (1 contrato) | `100% DB` | `✅ PASSED` |
| **12**| **Movilidad & Transporte** | `transport_rate` ($200.00 flat) | `transport_qty` (1 servicio) | `100% DB` | `✅ PASSED` |
| **13**| **Comunicaciones Agencia** | `comms_rate` ($250.00 flat) | `comms_qty` (1 servicio) | `100% DB` | `✅ PASSED` |

---

## 3. 📊 Matriz de Liquidación Auditada en PDF (Buque Moquegua — 8,259 GRT — Matarani)

```
====================================================================================================
 📄 PDF AUDITORÍA OFICIAL — PUERTO DE MATARANI (TISUR S.A.) — ESCENARIO ORDINARIO
====================================================================================================
 ÍTEM / RUBRO OFICIAL            TARIFAS (P)          CANTIDAD (Q)     ECUACIÓN EVALUADA        SUBTOTAL USD
 --------------------------------------------------------------------------------------------------
 A) SHIFTING EXPENSES
 1. Servicio Integral PSA        P_PSA:  $3,368.00    Q_MNVR: 2       $3,368.00 x 2           $6,736.00
 2. Cargo de Acceso Tisur       P_ACC:  $70.00 USD   Q_ACC:  4       $70.00 x 4                $280.00
 3. Linesmen (Amarre/Desamarre)  P_LINE: $357.30 USD  Q_SERV: 1       $357.30 Flat              $357.30
 4. Terminal Fee / Port Toll    P_TOLL: $75.00 USD   Q_MNVR: 2       $75.00 x 2                $150.00

 B) GENERAL PORT EXPENSES (TISUR)
 5. Faro y Balisas (Nacional)   P_FARO: $0.03 /GRT   Q_GRT: 8,259     $0.03 x 8,259             $247.77
 6. Muellaje Tisur S.A.         P_MUELL:$0.65/LOA/h  Q_LOA: 134.16m   $0.65 x 134.16 x 33h    $2,877.73
 7. Lancha Autoridades (Min 2h) P_LANCH:$155.00 USD  Q_LANCH: 2       $155.00 x 2               $310.00
 8. Inspección Sanitaria        P_SANID:$670.00 USD  Q_EVENT: 1       $670.00 Flat              $670.00
 9. Clearance (In/Out)          P_CLEAR:$200.00 USD  Q_EVENT: 1       $200.00 Flat              $200.00
 10. Coordinador a Bordo        P_COORD:$225.00 USD  Q_TURNO: 2       $225.00 x 2               $450.00

 C) AGENCY EXPENSES
 11. Honorarios Agenciamiento   P_AGENCY:$1100.00    Q_CONTR: 1       $1,100.00 Flat          $1,100.00
 12. Movilidad & Transporte     P_TRANS: $200.00     Q_SERV:  1       $200.00 Flat              $200.00
 13. Comunicaciones Agencia     P_COMMS: $250.00     Q_SERV:  1       $250.00 Flat              $250.00
 --------------------------------------------------------------------------------------------------
 💰 SUBTOTAL BASE TISUR ORDINARIO:                                                      $13,828.80 USD
 🌙 RECARGO OPERATIVO CASINO (25% SERVICIO INTEGRAL PSA):                                   +$842.00 USD
 📈 RECARGO PETRÓLEO BRENT (RANGO ACORDADO):                                                +$693.70 USD
 --------------------------------------------------------------------------------------------------
 💰 TOTAL LIQUIDACIÓN OFICIAL MATARANI (MOQUEGUA):                                      $15,364.50 USD
====================================================================================================
```
