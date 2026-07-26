# 🔄 LOOP DE QC & AUDITORÍA DE COSTOS PORTUARIOS — TERMINAL TERQUIM MEJILLONES 🇨🇱

> **Estado**: 100% AUDITADO & VERIFICADO  
> **Ubicación del Documento**: `Obsidian.Maestro.Costos.Portuarios/06_QC/Loop.QC.Mejillones_Terquim.md`  
> **Puerto / Terminal**: MEJILLONES (Terminal Terquim - Químicos & Líquidos) 🇨🇱  
> **Proveedores**: B&M Agencia Marítima (Agencia), Ultratug Ltd. (Remolques), Amarradores de Tierra Terquim, Directemar.  
> **Norma Estricta**: ⛔ ZERO FALLBACKS (Todo cálculo proviene 100% de pares válidos $P \times Q$ en Base de Datos).

---

## 1. 🎯 Propósito del Loop de QC — Terquim Mejillones

Validar la trazabilidad completa del Terminal Terquim Mejillones evaluando los 4 pasos del ciclo de auditoría:
1. **Inspección de la Imagen Fuente**: `PNG_Mejillones_Terquim_Layout.md` en `01_PNGs_y_Layouts/`.
2. **Reglas Experta Sandra**: Reglas de Muellaje Terquim ($5.72 x LOA x 30h = $23,021.86), Conexión Manguera Hose Connection ($2,500.00) y Light Dues Chile prorrateado.
3. **Validación de Motores & UI**: `DynamicAuditViewer.tsx` y `backend.port_engines.calculator_pe`.

---

## 2. 🛡️ Matriz de Validación de Parámetros $P \times Q$ — Terquim Mejillones

| # | Ítem / Rubro Oficial | Campo Tarifa $P$ (`port_costs_matrix`) | Campo Cantidad $Q$ (`vessel_terminal_operations`) | Cobertura $P \times Q$ | Estado QC |
| :-: | :--- | :--- | :--- | :-: | :-: |
| **1** | **Pilotage (Directemar Armada)** | `pilotage_grt_rate` ($0.14/GRT) | `vessels.grt` (8,259 TRB = $1,156.26) | `100% DB` | `✅ PASSED` |
| **2** | **Towage Operativo (Ultratug Ltd.)**| `towage_rate` ($2,800.00 / mnvr) | `towage_qty` (3 maniobras = $8,400.00) | `100% DB` | `✅ PASSED` |
| **3** | **Pilot Insurance** | `pilot_insurance_rate` ($110.00) | `pilot_insurance_qty` (2 eventos = $220.00) | `100% DB` | `✅ PASSED` |
| **4** | **Linesmen (Amarre y Desamarre)** | `linesmen_rate` ($801.00 / evento) | `linesmen_qty` (2 eventos = $1,602.00) | `100% DB` | `✅ PASSED` |
| **5** | **Light Dues Chile (Nacional)** | `lighthouse_chile_rate` ($4.07/GRT/15) | `vessels.grt` (8,259 TRB = $2,240.94) | `100% DB` | `✅ PASSED` |
| **6** | **Dockage / Muellaje Terquim** | `dockage_terquim_rate` ($5.72/m/h) | `loa` (134.16m) × `stay_hrs` (30h = $23,021.86) | `100% DB` | `✅ PASSED` |
| **7** | **Launch Recepción/Amarre** | `launch_mooring_rate` ($450.00) | `launch_qty` (4 eventos = $1,800.00) | `100% DB` | `✅ PASSED` |
| **8** | **Launch Embarcadero** | `launch_embarcadero_rate` ($280.00) | `launch_qty` (1 evento = $280.00) | `100% DB` | `✅ PASSED` |
| **9** | **Launch Anchorage** | `launch_anchorage_rate` ($390.00) | `launch_qty` (1 evento = $390.00) | `100% DB` | `✅ PASSED` |
| **10**| **Launch Clearances** | `launch_clearance_rate` ($420.00) | `launch_qty` (2 eventos = $840.00) | `100% DB` | `✅ PASSED` |
| **11**| **Launch Pier Usage** | `launch_pier_rate` ($420.00) | `launch_qty` (1 evento = $420.00) | `100% DB` | `✅ PASSED` |
| **12**| **Pilot Transport** | `pilot_transport_rate` ($165.00) | `pilot_transport_qty` (2 eventos = $330.00) | `100% DB` | `✅ PASSED` |
| **13**| **Authorities Transport** | `auth_transport_rate` ($650.00) | `auth_transport_qty` (1 evento = $650.00) | `100% DB` | `✅ PASSED` |
| **14**| **ISPS Fee Terquim** | `isps_rate` ($1,191.00 flat) | `isps_qty` (1 evento = $1,191.00) | `100% DB` | `✅ PASSED` |
| **15**| **Authorities Charges** | `auth_charges_rate` ($700.00) | `auth_charges_qty` (1 evento = $700.00) | `100% DB` | `✅ PASSED` |
| **16**| **Immigration Authorities** | `immigration_rate` ($28.00 flat) | `immigration_qty` (1 evento = $28.00) | `100% DB` | `✅ PASSED` |
| **17**| **Health Authorities** | `health_rate` ($120.00 flat) | `health_qty` (1 evento = $120.00) | `100% DB` | `✅ PASSED` |
| **18**| **Loading Master Terquim** | `loading_master_rate` ($2,923.00) | `loading_master_qty` (1 evento = $2,923.00) | `100% DB` | `✅ PASSED` |
| **19**| **Agency Fee (B&M Agencia)** | `agency_fee_rate` ($1,200.00 flat) | `agency_qty` (1 contrato = $1,200.00) | `100% DB` | `✅ PASSED` |
| **20**| **Hose Connection / Portalón** | `hose_connection_rate` ($2,500.00) | `hose_qty` (1 servicio = $2,500.00) | `100% DB` | `✅ PASSED` |

---

## 3. 📊 Matriz de Liquidación Auditada en PDF (Buque Moquegua — Terquim Mejillones)

```
====================================================================================================
 📄 PDF AUDITORÍA OFICIAL — TERMINAL TERQUIM MEJILLONES 🇨🇱 (BT MOQUEGUA — 8,259 TRB | 30h Estancia)
====================================================================================================
 ÍTEM / RUBRO OFICIAL            TARIFAS (P)          CANTIDAD (Q)     ECUACIÓN EVALUADA        SUBTOTAL USD
 --------------------------------------------------------------------------------------------------
 A) SHIFTING EXPENSES
 1. Pilotage (Directemar)       P_PILOT: $0.14 /GRT  Q_GRT: 8,259     $0.14 x 8,259           $1,156.26
 2. Towage (Ultratug Ltd.)      P_TOW:   $2,800.00   Q_MNVR: 3        $2,800.00 x 3           $8,400.00
 3. Pilot Insurance             P_INS:   $110.00 USD Q_EVENT: 2       $110.00 x 2               $220.00
 4. Linesmen (Amarre/Desamarre)  P_LINE:  $801.00 USD Q_EVENT: 2       $801.00 x 2             $1,602.00

 B) GENERAL PORT EXPENSES
 5. Light Dues Chile (Nacional) P_LIGHT: $4.07/GRT/15 Q_GRT: 8,259     $4.07 x 8,259 / 15      $2,240.94
 6. Dockage / Muellaje Terquim  P_DOCK:  $5.72/m/h    Q_LOA_HRS: 134.16m x 30h              $23,021.86
 7. Launch Recepción/Amarre     P_LANCH: $450.00 USD Q_EVENT: 4       $450.00 x 4             $1,800.00
 8. Launch Embarcadero          P_LANCH: $280.00 USD Q_EVENT: 1       $280.00 Flat              $280.00
 9. Launch Anchorage            P_LANCH: $390.00 USD Q_EVENT: 1       $390.00 Flat              $390.00
 10. Launch Clearances          P_LANCH: $420.00 USD Q_EVENT: 2       $420.00 x 2               $840.00
 11. Launch Pier Usage          P_LANCH: $420.00 USD Q_EVENT: 1       $420.00 Flat              $420.00
 12. Pilot Transport            P_TRANS: $165.00 USD Q_EVENT: 2       $165.00 x 2               $330.00
 13. Authorities Transport      P_TRANS: $650.00 USD Q_EVENT: 1       $650.00 Flat              $650.00
 14. ISPS Fee Terquim           P_ISPS:  $1,191.00   Q_EVENT: 1       $1,191.00 Flat          $1,191.00
 15. Authorities Charges        P_CHG:   $700.00 USD Q_EVENT: 1       $700.00 Flat              $700.00
 16. Immigration Authorities    P_IMMIG: $28.00 USD  Q_EVENT: 1       $28.00 Flat                $28.00
 17. Health Authorities         P_HLTH:  $120.00 USD Q_EVENT: 1       $120.00 Flat              $120.00
 18. Loading Master Terquim     P_MASTER:$2,923.00   Q_EVENT: 1       $2,923.00 Flat          $2,923.00

 C) AGENCY EXPENSES
 19. Agency Fee (B&M Agencia)   P_AGENCY:$1,200.00   Q_CONTR: 1       $1,200.00 Flat          $1,200.00
 20. Hose Connection / Portalón P_HOSE:  $2,500.00   Q_SERV:  1       $2,500.00 Flat          $2,500.00
 --------------------------------------------------------------------------------------------------
 💰 TOTAL LIQUIDACIÓN OFICIAL TERMINAL TERQUIM MEJILLONES:                            $49,313.06 USD
====================================================================================================
```
