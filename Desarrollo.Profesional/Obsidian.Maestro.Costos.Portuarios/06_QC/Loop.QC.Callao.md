# 🔄 PROTOCOLO DE QC & AUDITORÍA DE COSTOS PORTUARIOS — PUERTO DE CALLAO (APM TERMINALS)

> **Estado**: 100% AUDITADO & VERIFICADO  
> **Ubicación del Documento**: `Obsidian.Maestro.Costos.Portuarios/06_QC/Loop.QC.Callao.md`  
> **Script Generador de PDF Oficial**: [generate_pdf_callao_qc.py](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/generate_pdf_callao_qc.py)  
> **Plantilla HTML/PDF de la UI**: [Callao_Proforma_Auditoria_Official.html](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Maestro.Costos.Portuarios/06_QC/Callao_Proforma_Auditoria_Official.html)  
> **Terminal Portuario**: APM Terminals Callao 🇵🇪  
> **Agente Marítimo**: Trans Total  

---

## 1. ⚙️ Criterios Operativos del PDF Oficial — Callao (APM Terminals)

### 1️⃣ Nomenclatura Oficial Exclusiva de Callao
- El PDF respeta exactamente los términos del terminal y agencia en Callao (*Muellaje APM Terminals*, *Remolcaje Petranso*, *Acceso APM/Trans Total*, *Sanidad Marítima*, *Derechos de Faro DHN/APN*).

### 2️⃣ Desglose IN vs. OUT
- **Practicaje**, **Remolcaje** y **Acceso** se dividen explícitamente en maniobras de **Atraque (IN)** y **Zarpe (OUT)**.
- Esto aísla el impacto de tarifas ordinarias en la entrada vs. recargos por horas extraordinarias (Overtime +25% Petranso) en la salida.

### 3️⃣ Resaltado en Fondo Amarillo (PassThrough)
- **Muellaje APM Terminals ($6,640.92 USD)** posee flag **`allow_pass_through = TRUE`** y figura **resaltado en amarillo** con nota explicativa al pie:  
  `* REFACTURABLE A CLIENTE SOUTHERN PERÚ SEGUNDO CONTRATO — IMPACTO NETO PnL $0.00 USD`.

---

## 2. 🛡️ Matriz de Validación de Parámetros $P \times Q$ — Callao (BT Moquegua — 8,259 TRB | 33h Estancia)

| # | Ítem / Rubro | Campo Tarifa $P$ (`port_costs_matrix`) | Campo Cantidad $Q$ (`vessel_terminal_operations`) | Cobertura $P \times Q$ | Estado QC |
| :-: | :--- | :--- | :--- | :-: | :-: |
| **1** | **Practicaje IN (Atraque)** | `pilotage_in_rate` ($750.00) | `pilotage_in_qty` (1 maniobra) | `100% DB` | `✅ PASSED` |
| **2** | **Practicaje OUT (Zarpe)** | `pilotage_out_rate` ($750.00) | `pilotage_out_qty` (1 maniobra) | `100% DB` | `✅ PASSED` |
| **3** | **Remolcaje IN (Petranso)** | `towage_in_rate` ($800.00 / remolcador) | `towage_in_qty` (2 remolques) | `100% DB` | `✅ PASSED` |
| **4** | **Remolcaje OUT (Petranso)** | `towage_out_rate` ($800.00 / remolcador) | `towage_out_qty` (2 remolques) | `100% DB` | `✅ PASSED` |
| **5** | **Acceso Atraque IN** | `access_in_rate` ($70.00 / acceso) | `access_in_qty` (2 accesos) | `100% DB` | `✅ PASSED` |
| **6** | **Acceso Zarpe OUT** | `access_out_rate` ($70.00 / acceso) | `access_out_qty` (2 accesos) | `100% DB` | `✅ PASSED` |
| **7** | **Derechos de Faro (Nacional)** | `lighthouse_national_rate` ($0.03/GRT) | `vessels.grt` (8,259 TRB = $247.77) | `100% DB` | `✅ PASSED` |
| **8** | **Muellaje APM (PassThrough 🟨)**| `dockage_apm_rate` ($1.50/LOA/h) | `loa` (134.16m) × `stay_hrs` (33h = $6,640.92) | `100% DB` | `✅ PASSED` |
| **9** | **Lanchas Operativas IN/OUT** | `launch_rate` ($85.00/h) | `launch_qty` (4 hrs = $340.00) | `100% DB` | `✅ PASSED` |
| **10**| **Coordinador a Bordo** | `coordinator_rate` ($225.00/evento) | `coordinator_qty` (2 eventos = $450.00) | `100% DB` | `✅ PASSED` |
| **11**| **Clearance (In/Out)** | `clearance_rate` ($200.00 flat) | `clearance_qty` (1 evento = $200.00) | `100% DB` | `✅ PASSED` |
| **12**| **Inspección Sanitaria Marítima**| `sanitary_rate` ($520.00 flat) | `sanitary_qty` (1 evento = $520.00) | `100% DB` | `✅ PASSED` |
| **13**| **Honorarios Agenciamiento** | `agency_fee_rate` ($1,000.00 flat) | `agency_qty` (1 contrato = $1,000.00) | `100% DB` | `✅ PASSED` |
| **14**| **Movilidad & Transporte** | `transport_rate` ($200.00 flat) | `transport_qty` (1 evento = $200.00) | `100% DB` | `✅ PASSED` |
| **15**| **Comunicaciones Agencia** | `comms_rate` ($200.00 flat) | `comms_qty` (1 evento = $200.00) | `100% DB` | `✅ PASSED` |

---

## 3. 📊 Matriz de Liquidación Auditada en PDF (Buque Moquegua — Callao)

```
====================================================================================================
 📄 PDF AUDITORÍA OFICIAL — PUERTO DE CALLAO (APM TERMINALS) — BT MOQUEGUA (33.0h Estancia)
====================================================================================================
 ÍTEM / RUBRO OFICIAL            TARIFAS (P)          CANTIDAD (Q)     ECUACIÓN EVALUADA        SUBTOTAL USD
 --------------------------------------------------------------------------------------------------
 A) SHIFTING EXPENSES
 1. Practicaje IN (Atraque)     P_IN:  $750.00 USD   Q_IN:  1 mnvr    $750.00 x 1               $750.00
 2. Practicaje OUT (Zarpe)      P_OUT: $750.00 USD   Q_OUT: 1 mnvr    $750.00 x 1               $750.00
 3. Remolcaje IN (Petranso)     P_IN:  $800.00 USD   Q_IN:  2 rem     $800.00 x 2             $1,600.00
 4. Remolcaje OUT (Petranso)    P_OUT: $800.00 USD   Q_OUT: 2 rem     $800.00 x 2             $1,600.00
 5. Cargo Acceso Atraque IN     P_IN:   $70.00 USD   Q_IN:  2 acc     $70.00 x 2                $140.00
 6. Cargo Acceso Zarpe OUT      P_OUT:  $70.00 USD   Q_OUT: 2 acc     $70.00 x 2                $140.00

 B) GENERAL PORT EXPENSES
 7. Derechos de Faro (Nacional) P_FARO: $0.03 /GRT   Q_GRT: 8,259     $0.03 x 8,259             $247.77
 8. [PASSTHROUGH 🟨] Muellaje  P_MUELL:$1.50/LOA/h  Q_LOA_HRS: 134.16m x 33h              $6,640.92
 9. Lanchas Operativas IN/OUT   P_LANCH:$85.00 USD   Q_HRS: 4h        $85.00 x 4h               $340.00
 10. Coordinador a Bordo        P_COORD:$225.00 USD  Q_EVENT: 2       $225.00 x 2               $450.00
 11. Clearance (In/Out)         P_CLEAR:$200.00 USD  Q_EVENT: 1       $200.00 Flat              $200.00
 12. Inspección Sanitaria       P_SANID:$520.00 USD  Q_EVENT: 1       $520.00 Flat              $520.00

 C) AGENCY EXPENSES
 13. Honorarios Agenciamiento   P_AGENCY:$1,000.00   Q_CONTR: 1       $1,000.00 Flat          $1,000.00
 14. Movilidad & Transporte     P_TRANS: $200.00     Q_SERV:  1       $200.00 Flat              $200.00
 15. Comunicaciones Agencia     P_COMMS: $200.00     Q_SERV:  1       $200.00 Flat              $200.00
 --------------------------------------------------------------------------------------------------
 💰 TOTAL AUDITADO LIQUIDACIÓN ORDINARIA CALLAO:                                      $14,778.69 USD
====================================================================================================
```

---

## 4. 📈 Encuadre de Escenarios Mínimo vs. Máximo (Banda Tarifaria Callao)

- **Escenario Optimista (Mínimo / Horario Hábil)**: **`$14,778.69 USD`**
- **Cifra Experta Sandra (Referencia Auditada)**: **`$14,778.69 USD`** *(Alojada con 100% de precisión en el extremo optimista)*.
- **Escenario Pesimista (Máximo / Overtime Zarpe +25% Petranso + Lanchas)**: **`$15,348.69 USD`**

---

### 📄 Acceso a la Plantilla HTML/PDF de la UI:
Se puede abrir y visualizar directamente la plantilla compilada en:  
[Callao_Proforma_Auditoria_Official.html](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Maestro.Costos.Portuarios/06_QC/Callao_Proforma_Auditoria_Official.html)
